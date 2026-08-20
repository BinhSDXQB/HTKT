// Đồng bộ TÌNH TRẠNG HIỆU LỰC từ bảng đăng ký prisma/hieu-luc-vbpl.json vào kho
// tài liệu RAG (bảng tai_lieu). Khớp theo tai_lieu.nguon = key trong JSON (tên file).
//
//   node scripts/sync-hieu-luc-tai-lieu.mjs          # đồng bộ
//   node scripts/sync-hieu-luc-tai-lieu.mjs --dry    # chỉ xem, không ghi
//
// Vì sao cần: trước đây hieu-luc-vbpl.json chỉ dùng để IN BÁO CÁO, không nối vào
// dữ liệu → chatbot trích cả văn bản đã hết hiệu lực (VD NĐ 175/2024 đã bị NĐ
// 217/2026 thay thế từ 01/7/2026) như quy định hiện hành.
//
// Tài liệu KHÔNG có trong bảng đăng ký giữ nguyên 'can_kiem_chung' — chatbot sẽ
// nhắc người dùng tự đối chiếu thay vì khẳng định chắc chắn.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const DRY = process.argv.includes('--dry')
const HOP_LE = new Set(['con_hieu_luc', 'het_hieu_luc', 'du_thao', 'can_kiem_chung'])

async function main() {
  const dangKy = JSON.parse(readFileSync(join(root, 'prisma', 'hieu-luc-vbpl.json'), 'utf8')).vanBan ?? {}
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()

  const { rows } = await client.query(
    `SELECT id, nguon, "tieuDe", "tinhTrangHieuLuc" FROM tai_lieu WHERE "deletedAt" IS NULL AND nguon IS NOT NULL`,
  )

  let capNhat = 0, giuNguyen = 0, khongCoTrongDangKy = 0, saGiaTri = 0
  for (const tl of rows) {
    const muc = dangKy[tl.nguon]
    if (!muc) { khongCoTrongDangKy++; continue }
    const tinhTrang = muc.tinhTrang
    if (!HOP_LE.has(tinhTrang)) {
      console.warn(`  ! Giá trị tinhTrang không hợp lệ "${tinhTrang}" — bỏ qua: ${tl.nguon}`)
      saGiaTri++
      continue
    }
    if (tl.tinhTrangHieuLuc === tinhTrang) { giuNguyen++; continue }
    if (!DRY) {
      await client.query(
        `UPDATE tai_lieu SET "tinhTrangHieuLuc"=$1, "thayTheBoi"=NULLIF($2,''), "ghiChuHieuLuc"=NULLIF($3,'') WHERE id=$4`,
        [tinhTrang, muc.thayTheBoi ?? '', muc.ghiChu ?? '', tl.id],
      )
    }
    capNhat++
  }

  const { rows: thongKe } = await client.query(
    `SELECT "tinhTrangHieuLuc" tt, count(*)::int n FROM tai_lieu WHERE "deletedAt" IS NULL GROUP BY 1 ORDER BY 2 DESC`,
  )

  console.log(`\n${DRY ? '[CHẠY THỬ] ' : ''}Đồng bộ hiệu lực: ${capNhat} cập nhật · ${giuNguyen} giữ nguyên · ` +
    `${khongCoTrongDangKy} chưa có trong bảng đăng ký · ${saGiaTri} sai giá trị`)
  console.log('Tình trạng kho tài liệu hiện tại:')
  for (const r of thongKe) console.log(`  ${r.tt.padEnd(16)} ${r.n}`)
  if (khongCoTrongDangKy > 0) {
    console.log(`\n⚠ ${khongCoTrongDangKy} tài liệu chưa khai trong prisma/hieu-luc-vbpl.json → vẫn là "can_kiem_chung".`)
    console.log('  Bổ sung key = đúng TÊN FILE vào hieu-luc-vbpl.json rồi chạy lại script này.')
  }

  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
