// DỰ KIẾN NGHỈ HƯU — danh sách cán bộ theo thời điểm nghỉ hưu, kèm hạn ra Thông báo
// (trước 06 tháng, NĐ 170/2025 Điều 62) và hạn ra Quyết định (trước 03 tháng, Điều 63).
//
//   npx tsx scripts/du-kien-nghi-huu.ts            # 5 năm tới
//   npx tsx scripts/du-kien-nghi-huu.ts --nam 10   # 10 năm tới
//
// Cột "Nguồn": DỰ KIẾN = máy tính theo NĐ 135/2020; ĐÃ LÙI = có quyết định lùi.
// Người lao động hợp đồng KHÔNG nghỉ hưu theo chế độ nên loại khỏi danh sách.

import 'dotenv/config'                    // nạp .env TRƯỚC khi lib/db đọc DATABASE_URL
import { db } from '../lib/db'
import { thoiDiemNghiHuu, tuoiNghiHuuLabel } from '../lib/nghi-huu'

const soNam = Number(process.argv[process.argv.indexOf('--nam') + 1]) || 5
const homNay = new Date()
const den = new Date(homNay.getFullYear() + soNam, homNay.getMonth(), homNay.getDate())

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString('vi-VN') : '—'
}
function truNgay(d: Date, thang: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - thang, d.getUTCDate()))
}

async function main() {
  const list = await db.canBo.findMany({
    where: {
      trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] },
      // KHÔNG dùng { doiTuong: { not: 'NGUOI_LAO_DONG' } }: trong Prisma, "not" loại
      // luôn bản ghi có doiTuong = NULL, làm người CHƯA PHÂN LOẠI biến mất khỏi kế
      // hoạch nghỉ hưu. Phải nêu NULL tường minh.
      OR: [{ doiTuong: null }, { doiTuong: { not: 'NGUOI_LAO_DONG' } }],
    },
    include: { toChuc: { select: { ten: true } }, chucDanh: { select: { ten: true } } },
  })

  const tinhDuoc = list.map((cb) => ({ cb, td: thoiDiemNghiHuu(cb) }))
  // Thiếu ngày sinh hoặc giới tính thì KHÔNG tính được — phải nêu ra, không im lặng bỏ.
  const khongTinhDuoc = tinhDuoc.filter((x) => !x.td.ngay)
  const rows = tinhDuoc
    .filter((x) => x.td.ngay && x.td.ngay <= den)
    .sort((a, b) => a.td.ngay!.getTime() - b.td.ngay!.getTime())

  console.log(`\nDỰ KIẾN NGHỈ HƯU — ${soNam} năm tới (đến ${fmt(den)})`)
  console.log(`Tổng: ${rows.length} người / ${list.length} đang công tác\n`)

  let nam = 0
  for (const { cb, td } of rows) {
    const y = td.ngay!.getFullYear()
    if (y !== nam) {
      nam = y
      console.log(`\n──────── ${y} ────────`)
    }
    const quaHanTB = truNgay(td.ngay!, 6) < homNay ? ' ⚠ QUÁ HẠN' : ''
    console.log(
      `${fmt(td.ngay)}  ${cb.hoTen.padEnd(24)} ${(cb.chucDanh?.ten ?? cb.chucVu ?? '').slice(0, 20).padEnd(20)} ` +
      `${(cb.toChuc?.ten ?? '').slice(0, 34).padEnd(34)} ` +
      `${td.laDuKien ? 'DỰ KIẾN' : `ĐÃ LÙI (${td.truongHop})`}  ` +
      `tuổi ${tuoiNghiHuuLabel(cb.ngaySinh, cb.gioiTinh) ?? '—'}  ` +
      `TB trước ${fmt(truNgay(td.ngay!, 6))}${quaHanTB}  QĐ trước ${fmt(truNgay(td.ngay!, 3))}`,
    )
  }

  const daLui = rows.filter((x) => !x.td.laDuKien).length
  console.log(`\n${rows.length - daLui} người theo ngày DỰ KIẾN · ${daLui} người đã có quyết định lùi`)

  if (khongTinhDuoc.length > 0) {
    console.log(`\n⚠ ${khongTinhDuoc.length} người KHÔNG tính được ngày nghỉ hưu (thiếu ngày sinh hoặc giới tính):`)
    for (const { cb } of khongTinhDuoc) {
      const thieu = [!cb.ngaySinh && 'ngày sinh', !cb.gioiTinh && 'giới tính'].filter(Boolean).join(' + ')
      console.log(`   ${cb.hoTen.padEnd(24)} ${(cb.toChuc?.ten ?? '').slice(0, 40).padEnd(40)} thiếu ${thieu}`)
    }
  }
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
