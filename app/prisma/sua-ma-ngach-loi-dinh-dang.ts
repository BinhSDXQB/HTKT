// Vá 2 lỗi định dạng nhỏ phát hiện khi đối soát 27 QĐ nâng lương (G:\My Drive\Nâng lương) với CSDL
// 24/9/26 — KHÔNG phải sai số liệu lương, chỉ là lỗi định dạng khiến công cụ tra cứu (bảng
// MA_NGACH_NHOM ở lib/bang-luong.ts) không nhận diện được ngạch:
//
// 1. Phạm Xuân Thảo (CCCD 044076011387): maNgach lưu "01 003" (khoảng trắng) thay vì "01.003"
//    (dấu chấm, đúng chuẩn NĐ 204/2004) — hệ số 4,98 và vượt khung 6% đã đúng, chỉ mã ngạch sai ký tự.
// 2. Phan Thị Lệ Nhung (CCCD 044174010444): ngachHienHuong để trống, trong khi maNgach=01.003
//    (Chuyên viên) đã có — bổ sung tên ngạch cho nhất quán với hồ sơ khác.
//
// Chạy thử trước: node_modules\.bin\jiti.cmd prisma\sua-ma-ngach-loi-dinh-dang.ts --dry-run
// Chạy thật:      node_modules\.bin\jiti.cmd prisma\sua-ma-ngach-loi-dinh-dang.ts

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const DRY_RUN = process.argv.includes('--dry-run')

const SUA = [
  { id: null as string | null, cccd: '044076011387', hoTen: 'Phạm Xuân Thảo', field: 'maNgach' as const, oldValue: '01 003', newValue: '01.003' },
  { id: null as string | null, cccd: '044174010444', hoTen: 'Phan Thị Lệ Nhung', field: 'ngachHienHuong' as const, oldValue: null, newValue: 'Chuyên viên' },
]

async function main() {
  let soDaSua = 0
  for (const s of SUA) {
    const cb = await db.canBo.findFirst({
      where: { cccd: s.cccd, hoTen: s.hoTen },
      select: { id: true, hoTen: true, cccd: true, maNgach: true, ngachHienHuong: true },
    })
    if (!cb) { console.log(`⚠ ${s.hoTen}: không tìm thấy — BỎ QUA`); continue }
    const current = s.field === 'maNgach' ? cb.maNgach : cb.ngachHienHuong
    if (current !== s.oldValue) {
      console.log(`⚠ ${s.hoTen}: ${s.field} hiện tại = "${current}", khác giá trị đã xác nhận sai ("${s.oldValue}") — có thể đã sửa rồi, BỎ QUA`)
      continue
    }

    console.log(`Sẽ sửa: ${s.hoTen} — ${s.field}: "${s.oldValue}" → "${s.newValue}"`)
    if (DRY_RUN) continue

    const kq = await db.canBo.updateMany({
      where: { id: cb.id, cccd: s.cccd, hoTen: s.hoTen, [s.field]: s.oldValue },
      data: { [s.field]: s.newValue },
    })
    if (kq.count === 1) soDaSua++
    else console.log(`⚠ ${s.hoTen}: giá trị đã đổi từ lúc kiểm tra — BỎ QUA, không ghi đè.`)
  }

  if (DRY_RUN) {
    console.log('\n(--dry-run: CHƯA ghi gì vào CSDL. Bỏ cờ này để sửa thật.)')
    return
  }
  console.log(`\n✔ Đã sửa ${soDaSua}/${SUA.length} hồ sơ.`)

  const kiemLai = await db.canBo.findMany({
    where: { cccd: { in: SUA.map((s) => s.cccd) } },
    select: { hoTen: true, maNgach: true, ngachHienHuong: true },
  })
  console.log('\nĐối chiếu lại sau khi sửa:')
  for (const cb of kiemLai) console.log(`  - ${cb.hoTen}: maNgach="${cb.maNgach}", ngachHienHuong="${cb.ngachHienHuong}"`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
