// SINH SQL tạo dữ liệu staging từ bản khôi phục (danh sách trắng + dữ liệu giả) — lib/an-danh/an-danh.ts.
// KHÔNG chạy tệp SQL bằng tay: dùng scripts/an-danh-hoa.ps1 (diễn tập khôi phục + chỉ xuất dump khi mọi kiểm tra đạt).
//
//   node --experimental-strip-types scripts/an-danh-hoa.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { docSchema, kiemTraQuyTac, sinhSql, BANG_GIU } from '../lib/an-danh/an-danh.ts'

const goc = join(dirname(fileURLToPath(import.meta.url)), '..')
const bangs = docSchema(readFileSync(join(goc, 'prisma', 'schema.prisma'), 'utf8'))
const loi = kiemTraQuyTac(bangs)
if (loi.length) {
  console.error('Quy tắc chưa hợp lệ so với schema — sửa lib/an-danh/an-danh.ts trước:')
  for (const l of loi) console.error(`  ${l.loai}: ${l.chiTiet}`)
  process.exit(1)
}
const thuMuc = join(goc, 'an-danh-output')
mkdirSync(thuMuc, { recursive: true })
const tep = join(thuMuc, 'an-danh-hoa.sql')
writeFileSync(tep, sinhSql(bangs), 'utf8')
const soGiu = Object.keys(BANG_GIU).length
console.log(`Đã sinh: ${tep}
  ${soGiu} bảng giữ (danh sách trắng cột), ${bangs.length - soGiu} bảng xoá toàn bộ, + tài khoản/cán bộ giả.
  Chạy: powershell -ExecutionPolicy Bypass -File scripts\\an-danh-hoa.ps1 -BanSaoLuu <tệp .dump>`)
