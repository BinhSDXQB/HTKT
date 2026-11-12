// KIỂM THỬ ĐƯỜNG PRISMA trên CSDL thử: chạy đúng lớp nghiệp vụ (kho.ts) qua $queryRawUnsafe + $transaction của Prisma
// với adapter pg — tức đúng trình điều khiển mà route production dùng (test tích hợp chính chạy bằng pg thuần).
// Lý do tồn tại: lỗi lệch 7 giờ khi đọc timestamptz chỉ lộ trên đường này (bài học 38).
//
//   node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-prisma.mjs
import assert from 'node:assert/strict'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../lib/generated/prisma/index.ts'
import { chuoiKetNoiThu, moPoolThu } from './_csdl-thu.mjs'
import * as kho from '../../lib/ai-content/kho.ts'

const pool = await moPoolThu()                      // xác nhận đúng CSDL *_ai_test trước khi cho Prisma nối
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: chuoiKetNoiThu() }) })
const [{ ten }] = await prisma.$queryRawUnsafe('select current_database() as ten')
if (!ten.endsWith('_ai_test')) throw new Error('Từ chối: Prisma không nối vào CSDL thử')

// Cùng cách bọc với lib/ai-content/may-chu.ts (dbAi)
const boc = (c) => ({ q: (sql, p = []) => c.$queryRawUnsafe(sql, ...p), tx: async () => { throw new Error('không lồng giao dịch') } })
const db = { q: (sql, p = []) => prisma.$queryRawUnsafe(sql, ...p), tx: (fn) => prisma.$transaction((t) => fn(boc(t)), { timeout: 15_000 }) }

for (const [id, ten] of [['test-p1', 'Người P1'], ['test-p2', 'Người P2']]) {
  await pool.query(`insert into roles (id, name, "displayName") values ('test-role', 'test-role', 'Thử') on conflict do nothing`)
  await pool.query(`insert into users (id, email, name, password, "roleId", "updatedAt") values ($1, $2, $3, 'x', 'test-role', now()) on conflict (id) do nothing`, [id, id + '@test.invalid', ten])
}
await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ('test-pck', 'Nguồn công khai (Prisma)', 'CONG_KHAI', 'con_hieu_luc', 'san_sang', now()) on conflict do nothing`)
const A = { id: 'test-p1', laAdmin: false, laVanPhong: true, laLanhDao: false }
const B = { id: 'test-p2', laAdmin: false, laVanPhong: false, laLanhDao: true }

let dat = 0
const ca = async (ten, fn) => { try { await fn(); dat++; console.log('  ✔', ten) } catch (e) { console.log('  ✖', ten, '\n     ', e.message); process.exitCode = 1 } }
const ngay = new Date(Date.now() + 36 * 3600e3).toISOString().slice(0, 10)
let id, lichId

await ca('tạo bài, gắn nguồn (mảng text[]), tạo 3 biến thể', async () => {
  id = (await kho.taoBai(db, A, { tieuDe: 'Bài qua Prisma', noiDung: 'Nội dung **thử**', phanLoai: 'PUBLIC', nguonIds: ['test-pck'] })).id
  await kho.taoBienTheTheoQuyTac(db, A, id, ['facebook', 'threads', 'linkedin'])
  const ct = await kho.chiTietBai(db, id)
  assert.equal(ct.bienThe.length, 3)
  assert.deepEqual(ct.bai.meta_editors, ['test-p1'])
  assert.deepEqual(ct.bienThe[0].editors, ['test-p1'])
  assert.equal(ct.nguon[0].daXoa, false)
})
await ca('người thứ hai sửa biến thể: danh sách người sửa cộng dồn (array_agg distinct)', async () => {
  await kho.luuBienThe(db, B, id, 'linkedin', 'Bản LinkedIn do B viết lại')
  await kho.luuBienThe(db, A, id, 'linkedin', 'Bản LinkedIn do A sửa tiếp')
  const bt = (await kho.chiTietBai(db, id)).bienThe.find((x) => x.channel === 'linkedin')
  assert.deepEqual([...bt.editors].sort(), ['test-p1', 'test-p2'])
})
await ca('duyệt: băm lệch → 409; người từng sửa → 403; gói duyệt lưu dạng jsonb', async () => {
  await kho.guiDuyet(db, A, id)
  await assert.rejects(kho.quyetDinhDuyet(db, B, id, 'APPROVED', 'a'.repeat(64)), (e) => e.ma === 409)
  const { bamHienTai } = await kho.chiTietBai(db, id)
  await assert.rejects(kho.quyetDinhDuyet(db, B, id, 'APPROVED', bamHienTai), (e) => e.ma === 403)
  // A viết lại bản LinkedIn thành phiên bản mới để B không còn là tác giả
  await kho.suaBai(db, A, id, { tieuDe: 'Bài qua Prisma', noiDung: 'Nội dung **thử** bản hai', phanLoai: 'PUBLIC', nguonIds: ['test-pck'] })
  await kho.taoBienTheTheoQuyTac(db, A, id, ['facebook'])
  await kho.guiDuyet(db, A, id)
  const ct = await kho.chiTietBai(db, id)
  await kho.quyetDinhDuyet(db, B, id, 'APPROVED', ct.bamHienTai, 'Đồng ý')
  const [p] = await pool.query(`select approved_payload from ai_approvals where content_id = $1::uuid`, [id]).then((r) => r.rows)
  assert.equal(p.approved_payload.c, 'PUBLIC')
})
await ca('đặt lịch 08:30 giờ VN: lưu và ĐỌC LẠI đúng 01:30 UTC (không lệch múi giờ)', async () => {
  const r = await kho.datLich(db, A, id, { kenh: 'facebook', ngay, gio: '08:30', adapter: 'dry_run' })
  lichId = r.id
  const ct = await kho.chiTietBai(db, id)
  assert.equal(ct.lich[0].scheduled_at_utc, `${ngay}T01:30:00.000Z`)
  assert.ok(Math.abs(new Date(ct.bai.updated_at) - Date.now()) < 120_000, 'updated_at lệch: ' + ct.bai.updated_at)
  assert.ok(Math.abs(new Date(ct.pheDuyet[0].created_at) - Date.now()) < 120_000)
  const tu = new Date(Date.now()).toISOString(), den = new Date(Date.now() + 5 * 86400e3).toISOString()
  assert.ok((await kho.lichTrongKhoang(db, tu, den)).some((x) => x.id === lichId))
})
await ca('hàng đợi qua Prisma: dọn dẹp, nhận việc (uuid[] rỗng), ghi kết quả', async () => {
  await pool.query(`update ai_publication_schedules set scheduled_at_utc = now() - interval '1 minute' where id = $1::uuid`, [lichId])
  await kho.donDepHangDoi(db)
  let v
  for (let i = 0; i < 30 && (v = await kho.nhanViec(db, 'w-prisma')) && v.lichId !== lichId; i++) await kho.ghiKetQua(db, v.maNhan, v.lichId, { ok: true, externalPostId: 'don' })
  assert.equal(v?.lichId, lichId)
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: false, httpStatus: 429 }, () => 0)).trangThai, 'RETRY_PENDING')
  await pool.query(`update ai_publication_schedules set next_attempt_at = now() - interval '1 second' where id = $1::uuid`, [lichId])
  v = await kho.nhanViec(db, 'w-prisma')
  assert.equal((await kho.ghiKetQua(db, v.maNhan, lichId, { ok: true, externalPostId: 'dryrun-p' })).trangThai, 'PUBLISHED')
})
await ca('danh sách, thống kê, nhật ký, thu hồi, đăng tay, đối soát', async () => {
  assert.ok((await kho.danhSachBai(db, { tu: 'Prisma' })).some((x) => x.id === id))
  assert.equal(typeof (await kho.thongKe(db)).tong_bai, 'number')
  assert.ok((await kho.nhatKy(db, 5)).length === 5)
  const l2 = await kho.datLich(db, A, id, { kenh: 'facebook', ngay, gio: '09:00' })
  await kho.xacNhanDangTay(db, A, l2.id, 'https://www.facebook.com/prisma')
  assert.equal((await kho.thuHoiDuyet(db, B, id, 'thử')).lichBiHuy, 0)
  await assert.rejects(kho.datLich(db, A, id, { kenh: 'facebook', ngay, gio: '10:00', adapter: 'dry_run' }), (e) => e.ma === 409)
})
await ca('lỗi trong giao dịch → hoàn tác toàn bộ (không để lại bài mồ côi)', async () => {
  const truoc = (await pool.query(`select count(*)::int c from ai_content_items`)).rows[0].c
  await assert.rejects(kho.taoBai(db, A, { tieuDe: 'Sẽ hoàn tác', noiDung: 'x', nguonIds: ['khong-ton-tai'] }), (e) => e.ma === 400)
  assert.equal((await pool.query(`select count(*)::int c from ai_content_items`)).rows[0].c, truoc)
})

console.log(`\nĐường Prisma: đạt ${dat} ca${process.exitCode ? ' — CÓ CA LỖI' : ''}`)
await prisma.$disconnect()
await pool.end()
