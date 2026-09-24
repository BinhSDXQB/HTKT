// Vá bacLuong sót lại từ ngạch cũ của Hoàng Hải Thành (CCCD 044083000152).
//
// Căn cứ: QĐ số 2922/QĐ-SNV ngày 11/6/2025 của Sở Nội vụ Quảng Bình (người dùng cung cấp bản
// chụp gốc 24/9/26) — bổ nhiệm ngạch và xếp lương do có thành tích: từ ngạch Chuyên viên (mã
// 01.003, bậc 6, hệ số 3,99) VÀO ngạch Chuyên viên chính (mã 01.002, BẬC 1, hệ số 4,40), lương
// mới và thời điểm tính nâng bậc lương lần sau kể từ 11/6/2025.
//
// CSDL hiện có ngachHienHuong=CVC, maNgach=01.002, heSoLuong=4.4 (ĐÚNG, khớp bậc 1 ngạch CVC
// theo NĐ 204/2004 Bảng 2 nhóm A2.1) nhưng bacLuong vẫn ghi 6 — là bậc CŨ của ngạch Chuyên viên
// trước khi nâng ngạch, chưa được cập nhật cùng lúc với heSoLuong/ngạch. Đây là lỗi sót dữ liệu
// khi ghi nhận quyết định, không phải quy tắc chung — chỉ sửa đúng 1 hồ sơ đã xác nhận bằng văn
// bản gốc.
//
// Chạy thử trước: node_modules\.bin\jiti.cmd prisma\sua-bac-hoang-hai-thanh.ts --dry-run
// Chạy thật:      node_modules\.bin\jiti.cmd prisma\sua-bac-hoang-hai-thanh.ts

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const DRY_RUN = process.argv.includes('--dry-run')

const ID = 'cmprqtol2000tcgum6pb79me4'
const CCCD = '044083000152'
const HO_TEN = 'Hoàng Hải Thành'
const BAC_CU = 6
const BAC_MOI = 1

async function main() {
  const cb = await db.canBo.findUnique({
    where: { id: ID },
    select: { hoTen: true, cccd: true, maNgach: true, ngachHienHuong: true, heSoLuong: true, bacLuong: true },
  })
  if (!cb) { console.log('⚠ Không tìm thấy hồ sơ — dừng.'); return }
  if (cb.cccd !== CCCD || cb.hoTen !== HO_TEN) {
    console.log(`⚠ Hồ sơ id ${ID} nay là "${cb.hoTen}" (CCCD ${cb.cccd}) — LỆCH, dừng để an toàn.`)
    return
  }
  if (cb.maNgach !== '01.002' || cb.heSoLuong !== 4.4 || cb.bacLuong !== BAC_CU) {
    console.log(`⚠ Dữ liệu hiện tại (maNgach=${cb.maNgach}, heSoLuong=${cb.heSoLuong}, bacLuong=${cb.bacLuong}) khác lúc xác nhận — có thể đã được sửa, dừng.`)
    return
  }

  console.log(`Sẽ sửa: ${HO_TEN} — bacLuong ${BAC_CU} → ${BAC_MOI} (ngạch CVC mã 01.002, hệ số 4,40 giữ nguyên, đúng theo QĐ 2922/QĐ-SNV 11/6/2025)`)

  if (DRY_RUN) {
    console.log('\n(--dry-run: CHƯA ghi gì vào CSDL. Bỏ cờ này để sửa thật.)')
    return
  }

  const kq = await db.canBo.updateMany({
    where: { id: ID, cccd: CCCD, hoTen: HO_TEN, maNgach: '01.002', heSoLuong: 4.4, bacLuong: BAC_CU },
    data: { bacLuong: BAC_MOI },
  })
  console.log(kq.count === 1 ? '✔ Đã sửa 1/1 hồ sơ.' : '⚠ Giá trị đã đổi từ lúc kiểm tra — BỎ QUA, không ghi đè.')

  const sau = await db.canBo.findUnique({ where: { id: ID }, select: { hoTen: true, bacLuong: true, heSoLuong: true, maNgach: true } })
  console.log('\nĐối chiếu lại sau khi sửa:', JSON.stringify(sau))
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
