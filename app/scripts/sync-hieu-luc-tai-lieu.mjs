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
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const DRY = process.argv.includes('--dry')
const HOP_LE = new Set(['con_hieu_luc', 'het_hieu_luc', 'du_thao', 'can_kiem_chung'])

/**
 * So bảng đăng ký với kho → danh sách cần ghi. So CẢ BA trường (trước đây chỉ so trạng thái nên
 * sửa ghiChu/thayTheBoi không bao giờ vào kho). Tài liệu không còn key → đặt lại can_kiem_chung.
 */
export function keHoachHieuLuc(rows, dangKy) {
  if (!dangKy || !Object.keys(dangKy).length) throw new Error('Bảng đăng ký hiệu lực rỗng — dừng để không đặt lại toàn bộ kho.')
  const capNhat = []
  let giuNguyen = 0, khongCoTrongDangKy = 0, saGiaTri = 0
  for (const tl of rows) {
    const muc = dangKy[tl.nguon]
    let muon
    if (!muc) {
      khongCoTrongDangKy++
      muon = { tinhTrang: 'can_kiem_chung', thayTheBoi: null, ghiChu: null }
    } else {
      if (!HOP_LE.has(muc.tinhTrang)) {
        console.warn(`  ! Giá trị tinhTrang không hợp lệ "${muc.tinhTrang}" — bỏ qua: ${tl.nguon}`)
        saGiaTri++
        continue
      }
      muon = { tinhTrang: muc.tinhTrang, thayTheBoi: muc.thayTheBoi || null, ghiChu: muc.ghiChu || null }
    }
    if (tl.tinhTrangHieuLuc === muon.tinhTrang && (tl.thayTheBoi || null) === muon.thayTheBoi && (tl.ghiChuHieuLuc || null) === muon.ghiChu) {
      if (muc) giuNguyen++
      continue
    }
    capNhat.push({ id: tl.id, nguon: tl.nguon, ...muon, datLai: !muc })
  }
  return { capNhat, giuNguyen, khongCoTrongDangKy, saGiaTri }
}

async function main() {
  const dangKy = JSON.parse(readFileSync(join(root, 'prisma', 'hieu-luc-vbpl.json'), 'utf8')).vanBan ?? {}
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()

  const { rows } = await client.query(
    `SELECT id, nguon, "tieuDe", "tinhTrangHieuLuc", "thayTheBoi", "ghiChuHieuLuc" FROM tai_lieu WHERE "deletedAt" IS NULL AND nguon IS NOT NULL`,
  )

  const kh = keHoachHieuLuc(rows, dangKy)
  const { giuNguyen, khongCoTrongDangKy, saGiaTri } = kh
  const capNhat = kh.capNhat.length
  for (const u of kh.capNhat) {
    if (u.datLai) console.log(`  ↺ đặt lại can_kiem_chung (không còn trong bảng đăng ký): ${u.nguon}`)
    if (!DRY) {
      await client.query(
        `UPDATE tai_lieu SET "tinhTrangHieuLuc"=$1, "thayTheBoi"=$2, "ghiChuHieuLuc"=$3 WHERE id=$4`,
        [u.tinhTrang, u.thayTheBoi, u.ghiChu, u.id],
      )
    }
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

// Chỉ chạy khi gọi trực tiếp bằng node — test import hàm thuần không được chạm CSDL.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
