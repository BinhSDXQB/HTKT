// DỌN "BẢN GHI MA" trong kho tài liệu: bản ghi tai_lieu có 0 đoạn (chưa nhúng được véc-tơ).
//
// Vì sao cần: bản ghi 0 đoạn thì chatbot không đọc được chữ nào, mà cơ chế chống trùng của
// prisma/sync-vbpl.mjs lại coi là "đã có" nên không bao giờ nạp lại (sự cố 24/8/2026).
// prisma/sync-vbpl.mjs nay tự dọn khi lỗi giữa chừng, NHƯNG nếu tiến trình bị kill (hết giờ
// tác vụ, tắt máy) thì hàm dọn không kịp chạy — dùng script này để quét lại.
//
// Chạy:
//   node scripts/don-ban-ghi-tai-lieu-rong.mjs          → CHỈ LIỆT KÊ, không xoá
//   node scripts/don-ban-ghi-tai-lieu-rong.mjs --xoa    → xoá hẳn các bản ghi 0 đoạn
//
// Xoá ở đây AN TOÀN vì bản ghi không chứa nội dung nào; tệp gốc vẫn nằm trong thư mục văn bản
// và sẽ được nạp lại ở lần đồng bộ kế tiếp.
import 'dotenv/config'
import pg from 'pg'
import { layKhoaChayDon } from '../prisma/sync-vbpl-core.mjs'

const XOA = process.argv.includes('--xoa')
// Bản ghi 'dang_xu_ly' mới tạo có thể là tài liệu ĐANG nhúng (đồng bộ, import, hoặc tải lên qua giao diện —
// đường tải lên không lấy khoá). Chỉ xoá bản ghi đã tồn tại quá ngưỡng này.
const PHUT_TOI_THIEU = 60
const c = new pg.Client({ connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL })
await c.connect()

// --xoa dùng CHUNG khoá với sync-vbpl/import-vbpl, lấy TRƯỚC khi đọc danh sách và giữ tới khi xoá xong:
// chạy chồng thì sẽ xoá bản ghi tiến trình kia đang nhúng dở (hoặc vừa nạp xong sau lúc SELECT).
if (XOA && !(await layKhoaChayDon(c))) {
  console.log('⏸️  Đang có tiến trình đồng bộ/nạp VBPL chạy → chưa xoá. Chạy lại sau.')
  await c.end()
  process.exit(1)
}

const { rows: tatCa } = await c.query(
  `SELECT id, "tieuDe", nguon, "trangThai", "soChunk", "soKyTu", "createdAt"
     FROM tai_lieu
    WHERE "deletedAt" IS NULL AND ("soChunk" = 0 OR "trangThai" <> 'san_sang')
    ORDER BY "createdAt"`
)
const moi = tatCa.filter((r) => Date.now() - new Date(r.createdAt).getTime() < PHUT_TOI_THIEU * 60_000)
const rows = XOA ? tatCa.filter((r) => !moi.includes(r)) : tatCa
if (XOA && moi.length) console.log(`⏭️  Bỏ qua ${moi.length} bản ghi tạo chưa đủ ${PHUT_TOI_THIEU} phút (có thể đang nhúng).`)

if (!rows.length) {
  console.log('✅ Kho tài liệu không có bản ghi 0 đoạn.')
  await c.end()
  process.exit(0)
}

console.log(`⚠️  ${rows.length} bản ghi có 0 đoạn (chatbot KHÔNG đọc được):\n`)
for (const r of rows) {
  console.log(`  - ${r.tieuDe}`)
  console.log(`    tệp: ${r.nguon} · trạng thái: ${r.trangThai} · ${r.soKyTu} ký tự đã bóc · tạo ${new Date(r.createdAt).toLocaleString('vi-VN')}`)
}

if (!XOA) {
  console.log('\nChạy lại với --xoa để xoá các bản ghi này (tệp gốc không bị đụng tới).')
  await c.end()
  process.exit(1)
}

let n = 0
for (const r of rows) {
  await c.query(`DELETE FROM tai_lieu_chunk WHERE "taiLieuId" = $1`, [r.id])
  const kq = await c.query(`DELETE FROM tai_lieu WHERE id = $1`, [r.id])
  n += kq.rowCount
}
console.log(`\n🗑️  Đã xoá ${n} bản ghi rỗng. Chạy 'node prisma/sync-vbpl.mjs' để nạp lại khi tài khoản AI còn hạn mức.`)
await c.end()
