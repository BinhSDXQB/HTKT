// KIỂM THỬ TÍCH HỢP module Nội dung AI trên CSDL THỬ (*_ai_test) — không bao giờ chạm CSDL thật.
//
//   node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-tich-hop.mjs
//
// Kiểm: migration 050 áp/hoàn nguyên/áp lại; luồng soạn → duyệt → đặt lịch → đăng; các cổng chặn;
// hai worker tranh một việc; timeout không đăng lại; ràng buộc bất biến ở CSDL.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { APP, moPoolThu, dbTuPool } from './_csdl-thu.mjs'
import * as kho from '../../lib/ai-content/kho.ts'
import { tongHopXuatBan } from '../../lib/ai-content/trang-thai.ts'

const pool = await moPoolThu()
const db = dbTuPool(pool)
const sql = async (s, p = []) => (await pool.query(s, p)).rows
const tep = (n) => readFileSync(join(APP, 'prisma', 'migrations_manual', n), 'utf8')
const demBang = async () => Number((await sql(`select count(*) c from information_schema.tables where table_schema='public' and table_name like 'ai\\_%'`))[0].c)
const tongBang = async () => Number((await sql(`select count(*) c from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`))[0].c)

let dat = 0
const ca = async (ten, fn) => {
  try { await fn(); dat++; console.log('  ✔', ten) } catch (e) { console.log('  ✖', ten, '\n     ', e.message); process.exitCode = 1 }
}
const tuChoi = async (fn, ma, moTa) => {
  try { await fn() } catch (e) {
    if (ma && e.ma !== ma) throw new Error(`${moTa ?? ''} mong mã ${ma}, nhận ${e.ma}: ${e.message}`)
    return e
  }
  throw new Error(`${moTa ?? 'thao tác'} lẽ ra phải bị từ chối`)
}

// ── 1. Migration ──────────────────────────────────────────────────────────────
console.log('Migration 050')
await pool.query(tep('050_ai_content_rollback.sql'))            // dọn lần chạy trước
const truoc = await tongBang()
await ca('áp migration: thêm đúng 7 bảng ai_*, không đổi bảng khác', async () => {
  await pool.query(tep('050_ai_content.sql'))
  assert.equal(await demBang(), 7)
  assert.equal(await tongBang(), truoc + 7)
})
await ca('áp lại lần hai không lỗi (idempotent)', async () => { await pool.query(tep('050_ai_content.sql')); assert.equal(await demBang(), 7) })
await ca('hoàn nguyên: sạch bảng ai_*, số bảng trở về như cũ (AT-16)', async () => {
  await pool.query(tep('050_ai_content_rollback.sql'))
  assert.equal(await demBang(), 0)
  assert.equal(await tongBang(), truoc)
  await pool.query(tep('050_ai_content.sql'))
})

// ── Dữ liệu giả (không phải dữ liệu thật) ─────────────────────────────────────
await pool.query(`delete from tai_lieu where id like 'test-%'`)
await pool.query(`delete from users where id like 'test-%'`)
await pool.query(`delete from roles where id = 'test-role'`)
await pool.query(`insert into roles (id, name, "displayName") values ('test-role', 'test-role', 'Thử')`)
for (const u of ['soan', 'soan2', 'duyet', 'thuong']) {
  await pool.query(`insert into users (id, email, name, password, "roleId", "updatedAt") values ($1, $2, $3, 'x', 'test-role', now())`,
    [`test-${u}`, `${u}@test.invalid`, `Người ${u}`])
}
for (const [id, pv, hl] of [['test-ck', 'CONG_KHAI', 'con_hieu_luc'], ['test-nb', 'NOI_BO_SO', 'con_hieu_luc'], ['test-het', 'CONG_KHAI', 'het_hieu_luc']]) {
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "updatedAt") values ($1, $2, $3, $4, now())`, [id, `Tài liệu ${id}`, pv, hl])
}
const SOAN = { id: 'test-soan', laAdmin: false, laVanPhong: true, laLanhDao: false }
const SOAN2 = { id: 'test-soan2', laAdmin: false, laVanPhong: true, laLanhDao: false }
const DUYET = { id: 'test-duyet', laAdmin: false, laVanPhong: false, laLanhDao: true }
const THUONG = { id: 'test-thuong', laAdmin: false, laVanPhong: false, laLanhDao: false }
const NGAY_MAI = new Date(Date.now() + 36 * 3600e3).toISOString().slice(0, 10)

async function baiDaDuyet({ phanLoai = 'PUBLIC', nguonIds = ['test-ck'], kenh = ['facebook'], ai = false } = {}) {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Thông báo thử ' + Math.random(), noiDung: 'Nội dung **thử** của bài viết.', phanLoai, nguonIds, doAiTao: ai, coTheGayNhamLan: ai })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, kenh)
  await kho.guiDuyet(db, SOAN, id)
  await kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED')
  return id
}
const lichCua = async (id) => sql(`select id::text, status, channel, error_code, scheduled_at_utc, retry_count, next_attempt_at from ai_publication_schedules where content_id = $1::uuid order by created_at`, [id])
const denHan = (lichId, gioTruoc = 0.01) => pool.query(`update ai_publication_schedules set scheduled_at_utc = now() - make_interval(secs => $2) where id = $1::uuid`, [lichId, gioTruoc * 3600])
/** Rút cạn hàng đợi để các ca sau không nhận nhầm việc của ca trước. */
const rutCan = async () => { for (;;) { const v = await kho.nhanViec(db, 'don'); if (!v) break; await kho.ghiKetQua(db, v.maNhan, v.lichId, { ok: true, externalPostId: 'don' }) } }

// ── 2. Quyền & duyệt ──────────────────────────────────────────────────────────
console.log('Quyền và phê duyệt')
await ca('người không có quyền không soạn được', async () => { await tuChoi(() => kho.taoBai(db, THUONG, { tieuDe: 'a', noiDung: 'b' }), 403) })
await ca('gửi duyệt cần ít nhất một biến thể', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài', noiDung: 'x' })
  await tuChoi(() => kho.guiDuyet(db, SOAN, id), 400)
})
await ca('bốn mắt: người soạn (dù là lãnh đạo) không tự duyệt; người thường không duyệt', async () => {
  const { id } = await kho.taoBai(db, DUYET, { tieuDe: 'Bài lãnh đạo soạn', noiDung: 'x', phanLoai: 'PUBLIC' })
  await kho.taoBienTheTheoQuyTac(db, DUYET, id, ['facebook'])
  await kho.guiDuyet(db, DUYET, id)
  await tuChoi(() => kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED'), 403, 'tự duyệt')
  await tuChoi(() => kho.quyetDinhDuyet(db, SOAN, id, 'APPROVED'), 403, 'văn phòng duyệt')
})
await ca('bốn mắt tính cả người soạn biến thể', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài 4 mắt', noiDung: 'x', phanLoai: 'PUBLIC' })
  await kho.luuBienThe(db, DUYET, id, 'facebook', 'Biến thể do chính người duyệt viết')
  await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED'), 403)
})
await ca('không duyệt được bài chưa gửi duyệt', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Nháp', noiDung: 'x' })
  await tuChoi(() => kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED'), 409)
})

// ── 3. Đặt lịch & cổng ────────────────────────────────────────────────────────
console.log('Đặt lịch và cổng xuất bản')
await ca('không đặt lịch khi chưa duyệt (AT-06)', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Chưa duyệt', noiDung: 'x', phanLoai: 'PUBLIC' })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook'])
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
  await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
})
await ca('đặt lịch 08:30 giờ Việt Nam lưu đúng 01:30 UTC (AT-07); đặt trùng kênh bị chặn', async () => {
  const id = await baiDaDuyet()
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  const [l] = await lichCua(id)
  assert.equal(new Date(l.scheduled_at_utc).toISOString(), `${NGAY_MAI}T01:30:00.000Z`)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00' }), 409)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'threads', ngay: NGAY_MAI, gio: '09:00' }), 409, 'kênh chưa có biến thể')
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: '2020-01-01', gio: '08:30' }), 400, 'quá khứ')
})
await ca('nội dung nội bộ / nguồn nội bộ / nguồn hết hiệu lực không đặt lịch được (AT-14)', async () => {
  for (const o of [{ phanLoai: 'INTERNAL' }, { nguonIds: ['test-nb'] }, { nguonIds: ['test-ck', 'test-het'] }]) {
    const id = await baiDaDuyet(o)
    const e = await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
    assert.ok(e.chiTiet?.length > 0)
  }
})
await ca('bài AI có thể gây nhầm lẫn: biến thể tự sinh có thông báo → đặt được; xoá thông báo → bị chặn', async () => {
  const id = await baiDaDuyet({ ai: true, kenh: ['facebook', 'threads'] })
  await kho.datLich(db, SOAN, id, { kenh: 'threads', ngay: NGAY_MAI, gio: '08:30' })
  const id2 = await kho.taoBai(db, SOAN, { tieuDe: 'AI', noiDung: 'x', phanLoai: 'PUBLIC', doAiTao: true, coTheGayNhamLan: true }).then((r) => r.id)
  await kho.luuBienThe(db, SOAN, id2, 'facebook', 'Bài nói về AI nhưng không có thông báo')
  await kho.guiDuyet(db, SOAN, id2)
  await kho.quyetDinhDuyet(db, DUYET, id2, 'APPROVED')
  await tuChoi(() => kho.datLich(db, SOAN, id2, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
})
await ca('sửa bài sau duyệt: phiên bản mới, về DRAFT, lịch bị huỷ, phải duyệt lại', async () => {
  const id = await baiDaDuyet()
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  const r = await kho.suaBai(db, SOAN2, id, { tieuDe: 'Đã sửa', noiDung: 'Nội dung khác', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  assert.equal(r.phienBan, 2)
  const ct = await kho.chiTietBai(db, id)
  assert.equal(ct.bai.status, 'DRAFT')
  assert.equal(ct.bienThe.length, 0)
  assert.deepEqual((await lichCua(id)).map((l) => [l.status, l.error_code]), [['CANCELLED', 'NOI_DUNG_DA_SUA']])
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
})
await ca('sửa biến thể / đổi phân loại / đổi nguồn sau duyệt đều làm mất hiệu lực phê duyệt', async () => {
  const a = await baiDaDuyet()
  await kho.luuBienThe(db, SOAN, a, 'facebook', 'Biến thể bị sửa sau duyệt')
  assert.equal((await kho.chiTietBai(db, a)).bai.status, 'DRAFT')
  const b = await baiDaDuyet()
  const ct = await kho.chiTietBai(db, b)
  await kho.suaBai(db, SOAN, b, { tieuDe: ct.phienBan.title, noiDung: ct.phienBan.body_md, phanLoai: 'PUBLIC', nguonIds: [] })
  const sau = await kho.chiTietBai(db, b)
  assert.equal(sau.bai.status, 'DRAFT')
  assert.equal(sau.phienBan.version_no, 1, 'nội dung không đổi thì không sinh phiên bản mới')
  assert.notEqual(sau.bamHienTai, sau.pheDuyet[0].approved_hash)
})
await ca('thu hồi phê duyệt: lịch bị huỷ, không đặt lại được (AT-12)', async () => {
  const id = await baiDaDuyet()
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await tuChoi(() => kho.thuHoiDuyet(db, SOAN, id), 403)
  const r = await kho.thuHoiDuyet(db, DUYET, id, 'Rút lại')
  assert.equal(r.lichBiHuy, 1)
  assert.deepEqual((await lichCua(id)).map((l) => l.status), ['CANCELLED'])
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' }), 409)
})

// ── 4. Hàng đợi ───────────────────────────────────────────────────────────────
console.log('Hàng đợi và worker')
const lichTuDong = async (o = {}) => {
  const id = await baiDaDuyet(o)
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30', adapter: 'dry_run' })
  return { id, lichId }
}
await ca('lịch chưa đến hạn và lịch đăng tay không bị worker nhận', async () => {
  const id = await baiDaDuyet()
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await lichTuDong()
  assert.equal(await kho.nhanViec(db, 'w'), null)
  await denHan(lichId)
  assert.equal(await kho.nhanViec(db, 'w'), null, 'lịch đăng tay đến hạn vẫn không được nhận')
})
await ca('hai worker cùng lúc: chỉ một nhận được việc; đăng xong chạy lại không đăng trùng (AT-09)', async () => {
  await rutCan()
  const { lichId } = await lichTuDong()
  await denHan(lichId)
  const kq = await Promise.all(Array.from({ length: 6 }, (_, i) => kho.nhanViec(db, `w${i}`)))
  const nhan = kq.filter(Boolean)
  assert.equal(nhan.length, 1)
  assert.equal(nhan[0].lichId, lichId)
  await tuChoi(() => kho.ghiKetQua(db, 'w-gia:mao', lichId, { ok: true, externalPostId: 'x' }), 409, 'mã nhận sai')
  assert.equal((await kho.ghiKetQua(db, nhan[0].maNhan, lichId, { ok: true, externalPostId: 'dryrun-1' })).trangThai, 'PUBLISHED')
  await tuChoi(() => kho.ghiKetQua(db, nhan[0].maNhan, lichId, { ok: true, externalPostId: 'dryrun-2' }), 409, 'ghi lần hai')
  assert.equal(await kho.nhanViec(db, 'w'), null)
})
await ca('timeout sau khi đã gửi → cần đối soát, KHÔNG tự đăng lại; đối soát xong mới chốt (AT-10)', async () => {
  const { id, lichId } = await lichTuDong()
  await denHan(lichId)
  const v = await kho.nhanViec(db, 'w')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, ma: 'TIMEOUT', daGui: true })).trangThai, 'UNKNOWN_OUTCOME')
  assert.equal(await kho.nhanViec(db, 'w'), null)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '10:00' }), 409, 'đặt lịch mới khi chưa đối soát')
  await tuChoi(() => kho.doiSoat(db, SOAN, lichId, 'PUBLISHED', 'http://khong-https'), 400)
  await kho.doiSoat(db, SOAN, lichId, 'PUBLISHED', 'https://example.invalid/bai/1')
  assert.deepEqual((await lichCua(id)).map((l) => l.status), ['PUBLISHED'])
})
await ca('lỗi tạm thời → chờ thử lại có backoff; quá số lần → FAILED; lỗi vĩnh viễn → FAILED ngay', async () => {
  const { id, lichId } = await lichTuDong()
  await denHan(lichId)
  let v = await kho.nhanViec(db, 'w')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, httpStatus: 429 }, () => 0)).trangThai, 'RETRY_PENDING')
  let [l] = await lichCua(id)
  assert.ok(new Date(l.next_attempt_at) > new Date(Date.now() + 50_000), 'lần thử kế ≥ ~1 phút nữa')
  assert.equal(await kho.nhanViec(db, 'w'), null, 'chưa tới giờ thử lại')
  for (let i = 0; i < 5; i++) {
    await pool.query(`update ai_publication_schedules set next_attempt_at = now() - interval '1 second' where id = $1::uuid`, [lichId])
    v = await kho.nhanViec(db, 'w')
    if (!v) break
    await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, ma: 'ECONNREFUSED', daGui: false })
  }
  ;[l] = await lichCua(id)
  assert.equal(l.status, 'FAILED')
  assert.equal(l.retry_count, 4)
  const b = await lichTuDong(); await denHan(b.lichId)
  v = await kho.nhanViec(db, 'w')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, b.lichId, { ok: false, httpStatus: 403 })).trangThai, 'FAILED')
})
await ca('cổng kiểm lại lúc nhận việc: dữ liệu bị sửa thẳng trong CSDL sau khi đặt lịch → huỷ, không đăng', async () => {
  const a = await lichTuDong(); await denHan(a.lichId)
  await pool.query(`update ai_channel_variants set body = 'Nội dung bị chèn' where content_id = $1::uuid`, [a.id])
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.deepEqual((await lichCua(a.id)).map((l) => [l.status, l.error_code]), [['CANCELLED', 'CONG_XUAT_BAN_CHAN']])
  const b = await lichTuDong(); await denHan(b.lichId)
  await pool.query(`update ai_content_items set classification = 'INTERNAL' where id = $1::uuid`, [b.id])
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.equal((await lichCua(b.id))[0].status, 'CANCELLED')
})
await ca('tài liệu nguồn bị xoá cứng khỏi kho: xoá vẫn thành công (không FK), bài viện dẫn bị chặn', async () => {
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "updatedAt") values ('test-xoa', 'Sẽ bị xoá', 'CONG_KHAI', 'con_hieu_luc', now())`)
  const a = await lichTuDong({ nguonIds: ['test-xoa'] }); await denHan(a.lichId)
  assert.equal((await pool.query(`delete from tai_lieu where id = 'test-xoa'`)).rowCount, 1)
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.equal((await lichCua(a.id))[0].error_code, 'CONG_XUAT_BAN_CHAN')
  assert.equal((await kho.chiTietBai(db, a.id)).nguon[0].daXoa, true)
})
await ca('worker chết giữa chừng: lịch treo → cần đối soát (không trả về hàng đợi); mã nhận cũ không ghi đè được', async () => {
  const a = await lichTuDong(); await denHan(a.lichId)
  const v = await kho.nhanViec(db, 'w-chet')
  await pool.query(`update ai_publication_schedules set locked_at = now() - interval '20 minutes' where id = $1::uuid`, [a.lichId])
  assert.equal((await kho.donDepHangDoi(db)).treo, 1)
  assert.equal((await lichCua(a.id))[0].status, 'UNKNOWN_OUTCOME')
  await tuChoi(() => kho.ghiKetQua(db, v.maNhan, a.lichId, { ok: true, externalPostId: 'muon' }), 409)
  assert.equal(await kho.nhanViec(db, 'w'), null)
})
await ca('lịch quá hạn 24 giờ: không đăng bù, chuyển EXPIRED', async () => {
  const a = await lichTuDong(); await denHan(a.lichId, 30)
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.equal((await kho.donDepHangDoi(db)).quaHan, 1)
  assert.equal((await lichCua(a.id))[0].status, 'EXPIRED')
})
await ca('thu hồi chen giữa lúc worker nhận việc: không bao giờ vừa REVOKED vừa nhận được việc', async () => {
  for (let i = 0; i < 8; i++) {
    const a = await lichTuDong(); await denHan(a.lichId)
    const [th, v] = await Promise.allSettled([kho.thuHoiDuyet(db, DUYET, a.id), kho.nhanViec(db, 'w')])
    const [l] = await lichCua(a.id)
    if (v.status === 'fulfilled' && v.value) {
      // worker thắng: thu hồi phải báo rõ có lịch đang đăng không dừng được
      assert.equal(l.status, 'PUBLISHING')
      if (th.status === 'fulfilled') assert.equal(th.value.dangDangKhongDungDuoc, 1)
      await kho.ghiKetQua(db, v.value.maNhan, a.lichId, { ok: false, httpStatus: 403 })
    } else {
      assert.equal(l.status, 'CANCELLED')
    }
  }
})

// ── 5. Đăng tay, nhiều kênh ───────────────────────────────────────────────────
console.log('Đăng tay và nhiều kênh')
await ca('đăng tay: xác nhận kèm URL https; sau khi thu hồi thì không xác nhận được', async () => {
  const id = await baiDaDuyet()
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, lichId, 'khong-phai-url'), 400)
  await kho.xacNhanDangTay(db, SOAN, lichId, 'https://example.invalid/p/1')
  const id2 = await baiDaDuyet()
  const l2 = await kho.datLich(db, SOAN, id2, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await kho.thuHoiDuyet(db, DUYET, id2)
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, l2.id, 'https://example.invalid/p/2'), 409)
})
await ca('ba kênh ghi kết quả độc lập, trạng thái tổng hợp suy ra động (AT-03, AT-11)', async () => {
  await rutCan()
  const id = await baiDaDuyet({ kenh: ['facebook', 'linkedin', 'threads'] })
  const ids = {}
  for (const k of ['facebook', 'linkedin', 'threads']) ids[k] = (await kho.datLich(db, SOAN, id, { kenh: k, ngay: NGAY_MAI, gio: '08:30', adapter: 'dry_run' })).id
  for (const k of Object.keys(ids)) await denHan(ids[k])
  for (let i = 0; i < 3; i++) {
    const v = await kho.nhanViec(db, 'w')
    await kho.ghiKetQua(db, v.maNhan, v.lichId, v.kenh === 'linkedin' ? { ok: false, httpStatus: 403 } : { ok: true, externalPostId: 'dryrun-' + v.kenh })
  }
  const l = await lichCua(id)
  assert.deepEqual(Object.fromEntries(l.map((x) => [x.channel, x.status])), { facebook: 'PUBLISHED', linkedin: 'FAILED', threads: 'PUBLISHED' })
  assert.equal(tongHopXuatBan(l.map((x) => x.status)), 'DANG_MOT_PHAN')
})

// ── 6. Ràng buộc ở CSDL ───────────────────────────────────────────────────────
console.log('Ràng buộc bất biến ở CSDL')
await ca('sổ phê duyệt, nhật ký, phiên bản: không sửa/xoá được', async () => {
  await assert.rejects(pool.query(`update ai_approvals set decision = 'APPROVED'`))
  await assert.rejects(pool.query(`delete from ai_approvals`))
  await assert.rejects(pool.query(`delete from ai_audit_events`))
  await assert.rejects(pool.query(`update ai_content_versions set body_md = 'x'`))
})
await ca('khoá ghép: không gắn được phê duyệt của phiên bản khác vào lịch; không hai lịch sống cùng phiên bản+kênh', async () => {
  const a = await baiDaDuyet(); const b = await baiDaDuyet()
  const [la] = await sql(`select current_version_id::text v, (select id::text from ai_channel_variants where content_id = i.id) bt from ai_content_items i where id = $1::uuid`, [a])
  const [pb] = await sql(`select id::text from ai_approvals where content_id = $1::uuid`, [b])
  const chen = (approval, khoa) => pool.query(
    `insert into ai_publication_schedules (content_id, version_id, variant_id, channel, scheduled_at_utc, approval_id, idempotency_key, created_by)
     values ($1::uuid, $2::uuid, $3::uuid, 'facebook', now(), $4::uuid, $5, 'test-soan')`, [a, la.v, la.bt, approval, khoa])
  await assert.rejects(chen(pb.id, 'k1'), /foreign key/)
  const [pa] = await sql(`select id::text from ai_approvals where content_id = $1::uuid`, [a])
  await chen(pa.id, 'k2')
  await assert.rejects(chen(pa.id, 'k3'), /ux_ai_pub_song/)
})
await ca('mọi thao tác ghi đều có nhật ký; nhật ký không chứa nội dung bài', async () => {
  const [{ c }] = await sql(`select count(*)::int c from ai_audit_events`)
  assert.ok(c > 100)
  const [{ n }] = await sql(`select count(*)::int n from ai_audit_events where detail::text ilike '%Nội dung **thử**%'`)
  assert.equal(n, 0)
})

console.log(`\nĐạt ${dat} ca${process.exitCode ? ' — CÓ CA LỖI' : ''}`)
await pool.end()
