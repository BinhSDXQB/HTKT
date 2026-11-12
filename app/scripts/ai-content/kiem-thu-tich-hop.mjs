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
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ($1, $2, $3, $4, 'san_sang', now())`, [id, `Tài liệu ${id}`, pv, hl])
}
const SOAN = { id: 'test-soan', laAdmin: false, laVanPhong: true, laLanhDao: false }
const SOAN2 = { id: 'test-soan2', laAdmin: false, laVanPhong: true, laLanhDao: false }
const DUYET = { id: 'test-duyet', laAdmin: false, laVanPhong: false, laLanhDao: true }
const THUONG = { id: 'test-thuong', laAdmin: false, laVanPhong: false, laLanhDao: false }
const NGAY_MAI = new Date(Date.now() + 36 * 3600e3).toISOString().slice(0, 10)

/** Duyệt như trên giao diện: gửi kèm mã băm của bản người duyệt đang xem. */
async function duyet(nguoi, id, quyetDinh = 'APPROVED') {
  const { bamHienTai } = await kho.chiTietBai(db, id)
  return kho.quyetDinhDuyet(db, nguoi, id, quyetDinh, bamHienTai)
}

async function baiDaDuyet({ phanLoai = 'PUBLIC', nguonIds = ['test-ck'], kenh = ['facebook'], ai = false } = {}) {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Thông báo thử ' + Math.random(), noiDung: 'Nội dung **thử** của bài viết.', phanLoai, nguonIds, doAiTao: ai, coTheGayNhamLan: ai })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, kenh)
  await kho.guiDuyet(db, SOAN, id)
  await duyet(DUYET, id, 'APPROVED')
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
  await tuChoi(() => duyet(DUYET, id, 'APPROVED'), 403, 'tự duyệt')
  await tuChoi(() => duyet(SOAN, id, 'APPROVED'), 403, 'văn phòng duyệt')
})
await ca('bốn mắt tính cả người soạn biến thể', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài 4 mắt', noiDung: 'x', phanLoai: 'PUBLIC' })
  await kho.luuBienThe(db, DUYET, id, 'facebook', 'Biến thể do chính người duyệt viết')
  await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => duyet(DUYET, id, 'APPROVED'), 403)
})
await ca('không duyệt được bài chưa gửi duyệt', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Nháp', noiDung: 'x' })
  await tuChoi(() => duyet(DUYET, id, 'APPROVED'), 409)
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
  await duyet(DUYET, id2, 'APPROVED')
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
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '10:00', adapter: 'dry_run' }), 409, 'đặt lịch mới khi chưa đối soát')
  await tuChoi(() => kho.doiSoat(db, SOAN, lichId, 'PUBLISHED', 'http://www.facebook.com/khong-https'), 400)
  await kho.doiSoat(db, SOAN, lichId, 'PUBLISHED', 'https://www.facebook.com/bai/1')
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
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ('test-xoa', 'Sẽ bị xoá', 'CONG_KHAI', 'con_hieu_luc', 'san_sang', now())`)
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
    assert.equal(th.status, 'fulfilled', 'thu hồi phải LUÔN thành công (không deadlock, không lỗi giao dịch): ' + th.reason?.message)
    assert.equal(v.status, 'fulfilled', 'nhận việc không được ném lỗi: ' + v.reason?.message)
    assert.equal((await kho.chiTietBai(db, a.id)).bai.status, 'DRAFT')
    if (v.value) {
      // worker thắng: thu hồi phải báo rõ có lịch đang đăng không dừng được
      assert.equal(l.status, 'PUBLISHING')
      assert.equal(th.value.dangDangKhongDungDuoc, 1)
      assert.equal(th.value.lichBiHuy, 0)
      await kho.ghiKetQua(db, v.value.maNhan, a.lichId, { ok: false, httpStatus: 403 })
    } else {
      assert.equal(l.status, 'CANCELLED')
    }
  }
})

// ── 4b. Các lỗ hổng Codex vòng 2 nêu ─────────────────────────────────────────
console.log('Phản biện Codex vòng 2')
await ca('duyệt bản mình chưa xem: bài bị sửa và gửi duyệt lại sau khi người duyệt mở → 409', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bản 1', noiDung: 'Nội dung 1', phanLoai: 'PUBLIC' })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook']); await kho.guiDuyet(db, SOAN, id)
  const { bamHienTai: bamNguoiDuyetThay } = await kho.chiTietBai(db, id)
  await kho.suaBai(db, SOAN, id, { tieuDe: 'Bản 2', noiDung: 'Nội dung 2 khác hẳn', phanLoai: 'PUBLIC' })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook']); await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED', bamNguoiDuyetThay), 409)
  await tuChoi(() => kho.quyetDinhDuyet(db, DUYET, id, 'APPROVED', ''), 400)
  assert.equal((await kho.chiTietBai(db, id)).bai.status, 'PENDING_REVIEW')
  await duyet(DUYET, id)
})
await ca('bốn mắt: người đổi phân loại/nguồn/cờ AI (không đổi nội dung) không tự duyệt được thay đổi đó', async () => {
  for (const doi of [{ phanLoai: 'PUBLIC' }, { phanLoai: 'INTERNAL', nguonIds: ['test-ck'] }, { phanLoai: 'INTERNAL', doAiTao: true }]) {
    const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài nội bộ', noiDung: 'Nội dung giữ nguyên', phanLoai: 'INTERNAL' })
    await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook'])
    const r = await kho.suaBai(db, DUYET, id, { tieuDe: 'Bài nội bộ', noiDung: 'Nội dung giữ nguyên', ...doi })
    assert.equal(r.phienBan, 1, 'không sinh phiên bản mới')
    await kho.guiDuyet(db, SOAN, id)
    await tuChoi(() => duyet(DUYET, id), 403, JSON.stringify(doi))
  }
})
await ca('bốn mắt: lưu lại nguyên văn biến thể không xoá dấu người viết; mọi người từng sửa đều bị tính', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài', noiDung: 'x', phanLoai: 'PUBLIC' })
  await kho.luuBienThe(db, DUYET, id, 'facebook', 'Do người duyệt viết')
  const r = await kho.luuBienThe(db, SOAN, id, 'facebook', 'Do người duyệt viết')       // lưu lại y nguyên
  assert.equal(r.khongDoi, true)
  await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => duyet(DUYET, id), 403, 'lưu lại nguyên văn')
  await kho.luuBienThe(db, SOAN, id, 'facebook', 'Người soạn sửa thêm một chữ')            // SOAN sửa đè lên bản của DUYET
  await kho.guiDuyet(db, SOAN, id)
  await tuChoi(() => duyet(DUYET, id), 403, 'đã từng sửa biến thể')
})
await ca('lưu bài không đổi gì: không kéo bài đã duyệt về nháp, không huỷ lịch', async () => {
  const id = await baiDaDuyet()
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  const ct = await kho.chiTietBai(db, id)
  const r = await kho.suaBai(db, SOAN2, id, { tieuDe: ct.phienBan.title, noiDung: ct.phienBan.body_md, phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  assert.equal(r.khongDoi, true)
  assert.equal((await kho.chiTietBai(db, id)).bai.status, 'APPROVED')
  assert.deepEqual((await lichCua(id)).map((l) => l.status), ['SCHEDULED'])
})
await ca('lưu vết: gói đã duyệt và văn bản đã đặt lịch còn nguyên sau khi biến thể bị sửa', async () => {
  const id = await baiDaDuyet()
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  const goc = (await kho.chiTietBai(db, id)).bienThe[0].body
  await kho.xacNhanDangTay(db, SOAN, lichId, 'https://www.facebook.com/p/goc')
  await kho.luuBienThe(db, SOAN, id, 'facebook', 'Nội dung biến thể đã bị sửa sau khi đăng')
  const [l] = await sql(`select body_snapshot, status from ai_publication_schedules where id = $1::uuid`, [lichId])
  assert.equal(l.body_snapshot, goc)
  assert.equal(l.status, 'PUBLISHED')
  const [p] = await sql(`select approved_payload from ai_approvals where content_id = $1::uuid and decision = 'APPROVED'`, [id])
  assert.deepEqual(p.approved_payload.bt, [['facebook', goc]])
  assert.equal(p.approved_payload.c, 'PUBLIC')
})
await ca('tạo biến thể tự động chạy đua với sửa bài: không bao giờ gắn thân bài cũ vào phiên bản mới', async () => {
  for (let i = 0; i < 6; i++) {
    const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Chạy đua', noiDung: 'THAN-BAI-CU', phanLoai: 'PUBLIC' })
    await Promise.allSettled([
      kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook', 'linkedin', 'website']),
      kho.suaBai(db, SOAN2, id, { tieuDe: 'Chạy đua', noiDung: 'THAN-BAI-MOI', phanLoai: 'PUBLIC' }),
    ])
    const ct = await kho.chiTietBai(db, id)
    assert.equal(ct.phienBan.body_md, 'THAN-BAI-MOI')
    for (const b of ct.bienThe) assert.ok(!b.body.includes('THAN-BAI-CU'), `biến thể ${b.channel} của phiên bản mới chứa thân bài cũ`)
  }
})
await ca('chạy thử xong vẫn đặt được lịch đăng thật cho cùng bản; hai lịch cùng loại thì vẫn chặn', async () => {
  await rutCan()
  const { id, lichId } = await lichTuDong(); await denHan(lichId)
  const v = await kho.nhanViec(db, 'w'); await kho.ghiKetQua(db, v.maNhan, lichId, { ok: true, externalPostId: 'dryrun-x' })
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00', adapter: 'manual' })
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '10:00', adapter: 'manual' }), 409)
  // chạy thử đã xong không chiếm chỗ: chạy thử lại được; hai lịch chạy thử cùng chờ thì chặn
  await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '10:00', adapter: 'dry_run' })
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '11:00', adapter: 'dry_run' }), 409)
  await pool.query(`update ai_publication_schedules set status = 'CANCELLED' where content_id = $1::uuid and adapter = 'dry_run' and status = 'SCHEDULED'`, [id])
  const ds = await kho.danhSachBai(db, {})
  assert.deepEqual(ds.find((x) => x.id === id).lich, ['SCHEDULED'], 'danh sách không tính kết quả chạy thử là đã đăng')
})
await ca('một lịch bị cổng chặn không làm dừng hàng đợi: việc hợp lệ phía sau vẫn được nhận ngay', async () => {
  await rutCan()
  const hong = await lichTuDong(); await denHan(hong.lichId, 0.5)
  await pool.query(`update ai_content_items set classification = 'INTERNAL' where id = $1::uuid`, [hong.id])
  const tot = await lichTuDong(); await denHan(tot.lichId, 0.1)
  const v = await kho.nhanViec(db, 'w')
  assert.equal(v?.lichId, tot.lichId)
  assert.equal((await lichCua(hong.id))[0].status, 'CANCELLED')
  await kho.ghiKetQua(db, v.maNhan, v.lichId, { ok: true, externalPostId: 'dryrun-y' })
})
await ca('lịch chờ thử lại quá hạn 24 giờ cũng chuyển EXPIRED, không treo vĩnh viễn', async () => {
  await rutCan()
  const a = await lichTuDong(); await denHan(a.lichId)
  const v = await kho.nhanViec(db, 'w')
  await kho.ghiKetQua(db, v.maNhan, a.lichId, { ok: false, httpStatus: 429 })
  await pool.query(`update ai_publication_schedules set scheduled_at_utc = now() - interval '30 hours', next_attempt_at = now() - interval '1 hour' where id = $1::uuid`, [a.lichId])
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.equal((await kho.donDepHangDoi(db)).quaHan, 1)
  assert.equal((await lichCua(a.id))[0].status, 'EXPIRED')
  await kho.datLich(db, SOAN, a.id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '11:00', adapter: 'dry_run' })   // không còn chiếm chỗ
})
await ca('danh sách: phiên bản cũ đã đăng không làm phiên bản mới trông như đã đăng', async () => {
  const id = await baiDaDuyet()
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await kho.xacNhanDangTay(db, SOAN, lichId, 'https://www.facebook.com/p/cu')
  await kho.suaBai(db, SOAN, id, { tieuDe: 'Phiên bản hai', noiDung: 'Mới', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  const ds = await kho.danhSachBai(db, {})
  assert.deepEqual(ds.find((x) => x.id === id).lich, [])
})
await ca('khoá nguồn: xoá tài liệu nguồn phải chờ giao dịch xác nhận đăng xong (không chen giữa kiểm cổng và ghi kết quả)', async () => {
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ('test-khoa', 'Nguồn bị khoá', 'CONG_KHAI', 'con_hieu_luc', 'san_sang', now()) on conflict do nothing`)
  const id = await baiDaDuyet({ nguonIds: ['test-khoa'] })
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    // mô phỏng giao dịch xác nhận đang giữ khoá chia sẻ trên nguồn (đúng câu lệnh của cổng)
    await c.query(`select t.id from tai_lieu t where t.id in (select tai_lieu_id from ai_content_sources where content_id = $1::uuid) for share`, [id])
    await assert.rejects(pool.query(`set lock_timeout = '300ms'; delete from tai_lieu where id = 'test-khoa'`), /lock timeout|canceling statement/)
    await c.query('COMMIT')
  } finally { c.release() }
  await pool.query(`delete from tai_lieu where id = 'test-khoa'`)
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, lichId, 'https://www.facebook.com/p/3'), 409, 'nguồn đã xoá')
})

// ── 5. Đăng tay, nhiều kênh ───────────────────────────────────────────────────
console.log('Đăng tay và nhiều kênh')
await ca('đăng tay: xác nhận kèm URL https; sau khi thu hồi thì không xác nhận được', async () => {
  const id = await baiDaDuyet()
  const { id: lichId } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, lichId, 'khong-phai-url'), 400)
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, lichId, 'https://evil.example.com/x'), 400, 'URL ngoài miền kênh Facebook')
  await kho.xacNhanDangTay(db, SOAN, lichId, 'https://www.facebook.com/p/1')
  const id2 = await baiDaDuyet()
  const l2 = await kho.datLich(db, SOAN, id2, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await kho.thuHoiDuyet(db, DUYET, id2)
  await tuChoi(() => kho.xacNhanDangTay(db, SOAN, l2.id, 'https://www.facebook.com/p/2'), 409)
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
    `insert into ai_publication_schedules (content_id, version_id, variant_id, channel, scheduled_at_utc, approval_id, idempotency_key, created_by, body_snapshot)
     values ($1::uuid, $2::uuid, $3::uuid, 'facebook', now(), $4::uuid, $5, 'test-soan', 'x')`, [a, la.v, la.bt, approval, khoa])
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
await ca('lưu đè từ màn hình cũ: bản nền lệch → 409 (bài và biến thể), đúng nền thì lưu được', async () => {
  const id = await baiDaDuyet()
  const cu = await kho.chiTietBai(db, id)                       // "màn hình cũ" của người A
  await kho.suaBai(db, SOAN2, id, { tieuDe: 'B đã sửa', noiDung: 'Nội dung của B', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] }, cu.bamHienTai)
  await tuChoi(() => kho.suaBai(db, SOAN, id, { tieuDe: 'A ghi đè', noiDung: 'Nội dung của A', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] }, cu.bamHienTai), 409, 'nền cũ')
  await tuChoi(() => kho.luuBienThe(db, SOAN, id, 'facebook', 'Bản Facebook soạn từ phiên bản cũ', cu.phienBan.id), 409, 'biến thể từ phiên bản cũ')
  const moi = await kho.chiTietBai(db, id)
  assert.equal(moi.phienBan.title, 'B đã sửa')                  // không bị A ghi đè
  await kho.luuBienThe(db, SOAN, id, 'facebook', 'Bản Facebook đúng nền', moi.phienBan.id)
})
await ca('lịch thuộc phiên bản cũ không lấy nội dung phiên bản mới (retry sau khi bài đã sửa và duyệt lại)', async () => {
  const { id, lichId } = await lichTuDong(); await denHan(lichId)
  const v = await kho.nhanViec(db, 'w')                         // lịch PUBLISHING (V1)
  assert.equal(v.lichId, lichId)
  await kho.suaBai(db, SOAN2, id, { tieuDe: 'Phiên bản hai', noiDung: 'Nội dung hai', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  await kho.taoBienTheTheoQuyTac(db, SOAN2, id, ['facebook'])
  await kho.guiDuyet(db, SOAN2, id)
  await duyet(DUYET, id, 'APPROVED')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, httpStatus: 429 })).trangThai, 'RETRY_PENDING')
  await pool.query(`update ai_publication_schedules set next_attempt_at = now() - interval '1 second' where id = $1::uuid`, [lichId])
  assert.equal(await kho.nhanViec(db, 'w'), null)               // KHÔNG đăng bản V2 bằng lịch của V1
  assert.deepEqual((await lichCua(id)).map((l) => [l.status, l.error_code]), [['CANCELLED', 'CONG_XUAT_BAN_CHAN']])
})

await ca('chống lưu đè mức biến thể (cùng phiên bản) và tạo biến thể tự động từ nền cũ → 409', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài nền biến thể', noiDung: 'Nội dung gốc', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook'])
  const cu = await kho.chiTietBai(db, id)                       // màn hình cũ của A
  const bodyCu = cu.bienThe.find((x) => x.channel === 'facebook').body
  await kho.luuBienThe(db, SOAN2, id, 'facebook', 'B sửa tay bản Facebook', cu.phienBan.id, bodyCu)
  await tuChoi(() => kho.luuBienThe(db, SOAN, id, 'facebook', 'A ghi đè bản B', cu.phienBan.id, bodyCu), 409, 'biến thể cùng phiên bản bị người khác đổi')
  await tuChoi(() => kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook'], cu.bamHienTai), 409, 'tạo tự động từ nền cũ')
  assert.equal((await kho.chiTietBai(db, id)).bienThe.find((x) => x.channel === 'facebook').body, 'B sửa tay bản Facebook')
  // biến thể chưa tồn tại lúc mở (nền rỗng) mà người khác đã tạo → 409
  await tuChoi(() => kho.luuBienThe(db, SOAN, id, 'threads', 'Bản Threads', cu.phienBan.id, 'x'), 409, 'nền biến thể không khớp')
})
await ca('gửi duyệt từ màn hình cũ (bài đã sang phiên bản khác) → 409, không gửi nhầm phiên bản mới', async () => {
  const { id } = await kho.taoBai(db, SOAN, { tieuDe: 'Bài gửi duyệt cũ', noiDung: 'V1', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  await kho.taoBienTheTheoQuyTac(db, SOAN, id, ['facebook'])
  const cu = await kho.chiTietBai(db, id)
  await kho.suaBai(db, SOAN2, id, { tieuDe: 'Bài gửi duyệt cũ', noiDung: 'V2', phanLoai: 'PUBLIC', nguonIds: ['test-ck'] })
  await kho.taoBienTheTheoQuyTac(db, SOAN2, id, ['facebook'])
  await tuChoi(() => kho.guiDuyet(db, SOAN, id, cu.bamHienTai), 409, 'gửi duyệt từ nền cũ')
  assert.equal((await kho.chiTietBai(db, id)).bai.status, 'DRAFT')
  await kho.guiDuyet(db, SOAN, id, (await kho.chiTietBai(db, id)).bamHienTai)   // đúng nền thì được
})
await ca('cùng phiên bản nhưng biến thể bị sửa khi lịch đang đăng: lần thử lại không gửi văn bản mới', async () => {
  const { id, lichId } = await lichTuDong(); await denHan(lichId)
  const v = await kho.nhanViec(db, 'w')
  assert.equal(v.lichId, lichId)
  await kho.luuBienThe(db, SOAN2, id, 'facebook', 'Văn bản sửa sau khi đặt lịch')       // vẫn phiên bản 1
  await kho.guiDuyet(db, SOAN2, id)
  await duyet(DUYET, id, 'APPROVED')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, httpStatus: 429 })).trangThai, 'RETRY_PENDING')
  await pool.query(`update ai_publication_schedules set next_attempt_at = now() - interval '1 second' where id = $1::uuid`, [lichId])
  assert.equal(await kho.nhanViec(db, 'w'), null)
  assert.deepEqual((await lichCua(id)).map((l) => [l.status, l.error_code]), [['CANCELLED', 'CONG_XUAT_BAN_CHAN']])
})
await ca('thống kê không tính lịch chạy thử (dry_run) nhưng tính lịch đăng tay', async () => {
  const truoc = await kho.thongKe(db)
  const a = await lichTuDong(); await denHan(a.lichId)
  const v = await kho.nhanViec(db, 'w')
  await kho.ghiKetQua(db, v.maNhan, a.lichId, { ok: true, externalPostId: 'dr' })
  const giua = await kho.thongKe(db)
  assert.equal(giua.da_dang, truoc.da_dang)                    // dry_run đã đăng: không tính
  assert.equal(giua.lich_cho, truoc.lich_cho)
  const id = await baiDaDuyet()
  const { id: lichTay } = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  assert.equal((await kho.thongKe(db)).lich_cho, truoc.lich_cho + 1)
  await kho.xacNhanDangTay(db, SOAN, lichTay, 'https://www.facebook.com/p/thong-ke')
  assert.equal((await kho.thongKe(db)).da_dang, truoc.da_dang + 1)
})


// ── Đăng lại bản đã đăng · khoá với tiến trình đồng bộ kho văn bản ────────────
console.log('Đăng lại và khoá đồng thời')
await ca('đăng lại bản đã đăng: mặc định bị chặn; có cờ + lý do thì được, nhật ký ghi lý do; lịch đang chờ vẫn chặn trùng', async () => {
  const id = await baiDaDuyet()
  const l1 = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await kho.xacNhanDangTay(db, SOAN, l1.id, 'https://www.facebook.com/p/lan-1')
  const e = await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00' }), 409, 'đã đăng, không nói là đăng lại')
  assert.match(e.message, /Đăng lại/)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00', dangLai: true, lyDoDangLai: 'ngắn' }), 400, 'lý do quá ngắn')
  const l2 = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00', dangLai: true, lyDoDangLai: 'Bài trước bị gỡ nhầm trên Trang' })
  const [nk] = await sql(`select detail from ai_audit_events where target_id = $1 and action = 'DAT_LICH'`, [l2.id])
  assert.equal(nk.detail.dangLai, true); assert.equal(nk.detail.lichTruoc, l1.id); assert.equal(nk.detail.lanDangThu, 2)
  assert.equal(nk.detail.lyDo, 'Bài trước bị gỡ nhầm trên Trang')
  // Codex vòng 5 #6, #7: một kênh đã đăng + lịch đăng lại đang chờ → danh sách vẫn là một kênh "đã đăng"; chi tiết báo kênh đã đăng
  assert.deepEqual((await kho.danhSachBai(db, {})).find((x) => x.id === id).lich, ['PUBLISHED'])
  assert.deepEqual((await kho.chiTietBai(db, id)).kenhDaDang, [{ channel: 'facebook', chay_thu: false }])
  // lịch đăng lại đang chờ: không đặt chồng thêm, kể cả có cờ
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '10:00', dangLai: true, lyDoDangLai: 'Đặt chồng lên lịch đang chờ' }), 409)
  await kho.xacNhanDangTay(db, SOAN, l2.id, 'https://www.facebook.com/p/lan-2')
  assert.deepEqual((await lichCua(id)).map((x) => x.status), ['PUBLISHED', 'PUBLISHED'])
})
await ca('đăng lại vẫn qua cổng: bài đã thu hồi duyệt thì không đăng lại được dù có lý do', async () => {
  const id = await baiDaDuyet()
  const l1 = await kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
  await kho.xacNhanDangTay(db, SOAN, l1.id, 'https://www.facebook.com/p/thu-hoi')
  await kho.thuHoiDuyet(db, DUYET, id)
  await tuChoi(() => kho.datLich(db, SOAN, id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '09:00', dangLai: true, lyDoDangLai: 'Thử đăng lại sau khi thu hồi' }), 409)
})
await ca('chạy thử đã xong: chạy thử lại không cần lý do', async () => {
  const a = await lichTuDong(); await denHan(a.lichId)
  const v = await kho.nhanViec(db, 'w'); await kho.ghiKetQua(db, v.maNhan, a.lichId, { ok: true, externalPostId: 'thu-1' })
  await kho.datLich(db, SOAN, a.id, { kenh: 'facebook', ngay: NGAY_MAI, gio: '11:00', adapter: 'dry_run' })
})
await ca('nguồn chưa nạp xong (chưa san_sang) không gắn được vào bài', async () => {
  await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ('test-cho-thay', 'Bản chờ thay', 'CONG_KHAI', 'con_hieu_luc', 'dang_xu_ly', now()) on conflict do nothing`)
  await tuChoi(() => kho.taoBai(db, SOAN, { tieuDe: 'Bài', noiDung: 'Nội dung', phanLoai: 'PUBLIC', nguonIds: ['test-cho-thay'] }), 400)
  await pool.query(`delete from tai_lieu where id = 'test-cho-thay'`)
})
// GIỚI HẠN của ca này: nó chứng minh chuỗi khoá THẬT của thayBanCu không deadlock với module khi bài chỉ viện dẫn bản cũ.
// Nó KHÔNG tự bắt được việc gỡ bộ lọc san_sang ở ganNguon — việc đó do ca "nguồn chưa nạp xong" ngay trên bắt.
await ca('đồng thời với sync-vbpl (thayBanCu: khoá bản mới rồi xoá bản cũ): không deadlock ở cả hai phía, kết quả nhất quán', async () => {
  // Đúng chuỗi lệnh của prisma/sync-vbpl.mjs thayBanCu, chạy đua với xác nhận đăng tay và worker nhận việc của bài viện dẫn bản cũ.
  const thay = async (cu, moi) => {
    const c = await pool.connect()
    try {
      await c.query('BEGIN')
      await c.query(`update tai_lieu set "trangThai" = 'san_sang', "updatedAt" = now() where id = $1`, [moi])
      await c.query(`delete from tai_lieu_chunk where "taiLieuId" = $1`, [cu])
      await c.query(`delete from tai_lieu where id = $1`, [cu])
      await c.query('COMMIT')
    } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e } finally { c.release() }
  }
  let xacNhanDuoc = 0, biChan = 0
  for (let i = 0; i < 10; i++) {
    // id bản mới xếp TRƯỚC bản cũ ở vòng chẵn, SAU ở vòng lẻ: thử cả hai thứ tự khoá
    const cu = `test-dl-${i}-m`, moi = i % 2 ? `test-dl-${i}-z` : `test-dl-${i}-a`, khac = `test-dl-${i}-k`
    // bản mới chưa công bố: CSDL thử chỉ cho 'dang_xu_ly' (ràng buộc CHECK không có 'cho_thay'); với module hai trạng thái này như nhau (chưa san_sang)
    for (const [id, tt] of [[cu, 'san_sang'], [khac, 'san_sang'], [moi, 'dang_xu_ly']]) {
      await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ($1, $1, 'CONG_KHAI', 'con_hieu_luc', $2, now())`, [id, tt])
    }
    const tay = await baiDaDuyet({ nguonIds: [cu, khac] })
    const lt = await kho.datLich(db, SOAN, tay, { kenh: 'facebook', ngay: NGAY_MAI, gio: '08:30' })
    const may = await lichTuDong({ nguonIds: [khac, cu] }); await denHan(may.lichId)
    const [s, x, w] = await Promise.allSettled([
      thay(cu, moi),
      kho.xacNhanDangTay(db, SOAN, lt.id, `https://www.facebook.com/p/dl-${i}`),
      kho.nhanViec(db, 'w-dl'),
    ])
    for (const [ten, r] of [['sync', s], ['xác nhận', x], ['worker', w]]) {
      assert.ok(!/deadlock|40P01/i.test(String(r.reason?.code) + String(r.reason?.message)), `${ten} bị deadlock ở vòng ${i}: ${r.reason?.message}`)
    }
    assert.equal(s.status, 'fulfilled', 'sync phải luôn xong: ' + s.reason?.message)
    assert.equal(w.status, 'fulfilled', 'worker không được ném lỗi: ' + w.reason?.message)
    // worker: hoặc nhận ĐÚNG lịch của vòng này (thắng sync) rồi ghi kết quả được, hoặc không nhận gì và lịch bị cổng huỷ
    if (w.value) {
      assert.equal(w.value.lichId, may.lichId, 'worker nhận nhầm lịch')
      await kho.ghiKetQua(db, w.value.maNhan, may.lichId, { ok: true, externalPostId: `dl-${i}` })
      assert.equal((await lichCua(may.id))[0].status, 'PUBLISHED')
    } else {
      assert.equal((await lichCua(may.id))[0].error_code, 'CONG_XUAT_BAN_CHAN')
    }
    if (x.status === 'fulfilled') xacNhanDuoc++
    else { assert.equal(x.reason.ma, 409, x.reason.message); biChan++ }
    const [l] = await lichCua(tay)
    assert.equal(l.status, x.status === 'fulfilled' ? 'PUBLISHED' : 'SCHEDULED')
    // sau khi bản cũ bị thay: mọi thao tác tiếp theo trên bài viện dẫn nó đều bị cổng chặn
    assert.equal((await kho.chiTietBai(db, tay)).nguon.some((n) => n.daXoa), true)
  }
  console.log(`     (10 vòng: xác nhận trước khi thay ${xacNhanDuoc}, bị cổng chặn sau khi thay ${biChan})`)
  await pool.query(`delete from tai_lieu where id like 'test-dl-%'`)
})


console.log(`\nĐạt ${dat} ca${process.exitCode ? ' — CÓ CA LỖI' : ''}`)
await pool.end()
