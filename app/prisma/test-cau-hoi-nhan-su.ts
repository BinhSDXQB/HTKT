// Sinh bộ câu hỏi kiểm thử chatbot về quản lý nhân sự kèm đáp án từ CSDL hiện có.
// Chạy: node_modules\.bin\jiti.cmd prisma\test-cau-hoi-nhan-su.ts
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:Postgres%402025@localhost:5432/ql_htkt'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const d = (x: Date | null) => (x ? new Date(x).toLocaleDateString('vi-VN') : '—')
const nv = (c: { hoTen: string; chucVu: string | null; phongBan: string | null }) =>
  `${c.hoTen} (${c.chucVu ?? '—'} | ${c.phongBan ?? '—'})`

async function main() {
  const dangCongTac = { trangThai: 'DANG_CONG_TAC' as const }
  const select = { hoTen: true, chucVu: true, phongBan: true, heSoLuong: true, vuotKhung: true, phuCap: true, ngaySinh: true, ngayVeHuu: true, ngayNangLuongKeTiep: true, ngayKetNapDang: true }

  const all = await db.canBo.findMany({ where: dangCongTac, select })
  console.log(`Tổng số cán bộ ĐANG CÔNG TÁC: ${all.length}\n`)

  // 1. Hệ số lương cao nhất / thấp nhất
  const coLuong = all.filter(c => c.heSoLuong != null)
  const sorted = [...coLuong].sort((a, b) => b.heSoLuong! - a.heSoLuong!)
  console.log('— Hệ số lương CAO nhất (top 3):')
  sorted.slice(0, 3).forEach(c => console.log(`  ${nv(c)} — hệ số ${c.heSoLuong}${c.vuotKhung ? ` + VK ${c.vuotKhung.toFixed(0)}%` : ''}${c.phuCap ? ` + PC ${c.phuCap}` : ''}`))
  console.log('— Hệ số lương THẤP nhất (top 3):')
  sorted.slice(-3).reverse().forEach(c => console.log(`  ${nv(c)} — hệ số ${c.heSoLuong}`))
  console.log(`  (${all.length - coLuong.length} người chưa có dữ liệu hệ số)\n`)

  // 2. Vượt khung
  const vk = all.filter(c => (c.vuotKhung ?? 0) > 0).sort((a, b) => b.vuotKhung! - a.vuotKhung!)
  console.log(`— Hưởng phụ cấp VƯỢT KHUNG: ${vk.length} người. Cao nhất:`)
  vk.slice(0, 3).forEach(c => console.log(`  ${nv(c)} — VK ${c.vuotKhung!.toFixed(0)}% (hệ số ${c.heSoLuong})`))
  console.log()

  // 3. Về hưu sớm nhất / trong năm 2026-2027
  const huu = all.filter(c => c.ngayVeHuu).sort((a, b) => +new Date(a.ngayVeHuu!) - +new Date(b.ngayVeHuu!))
  console.log('— Về hưu SỚM nhất (top 5):')
  huu.slice(0, 5).forEach(c => console.log(`  ${nv(c)} — nghỉ hưu ${d(c.ngayVeHuu)} (sinh ${d(c.ngaySinh)})`))
  const huu2627 = huu.filter(c => { const y = new Date(c.ngayVeHuu!).getFullYear(); return y === 2026 || y === 2027 })
  console.log(`  Nghỉ hưu trong 2026–2027: ${huu2627.length} người\n`)

  // 4. Lớn tuổi nhất / trẻ nhất
  const tuoi = all.filter(c => c.ngaySinh).sort((a, b) => +new Date(a.ngaySinh!) - +new Date(b.ngaySinh!))
  console.log(`— LỚN TUỔI nhất: ${nv(tuoi[0])} — sinh ${d(tuoi[0].ngaySinh)}`)
  const tre = tuoi.at(-1)!
  console.log(`— TRẺ nhất: ${nv(tre)} — sinh ${d(tre.ngaySinh)}\n`)

  // 5. Nâng lương tháng 6 và 7/2026, quý 3/2026
  for (const [t1, t2, label] of [[new Date(2026, 5, 1), new Date(2026, 6, 1), 'tháng 6/2026'], [new Date(2026, 6, 1), new Date(2026, 7, 1), 'tháng 7/2026'], [new Date(2026, 6, 1), new Date(2026, 9, 1), 'quý 3/2026']] as const) {
    const rows = all.filter(c => c.ngayNangLuongKeTiep && new Date(c.ngayNangLuongKeTiep) >= t1 && new Date(c.ngayNangLuongKeTiep) < t2)
    console.log(`— Đến hạn nâng lương ${label}: ${rows.length} người`)
    rows.forEach(c => console.log(`  ${nv(c)} — lên lương ${d(c.ngayNangLuongKeTiep)} (hệ số hiện tại ${c.heSoLuong ?? '—'})`))
  }
  console.log()

  // 6. Thống kê nâng lương 2026 theo tháng
  const thang = new Array(12).fill(0)
  all.forEach(c => { if (c.ngayNangLuongKeTiep) { const x = new Date(c.ngayNangLuongKeTiep); if (x.getFullYear() === 2026) thang[x.getMonth()]++ } })
  console.log(`— Nâng lương cả năm 2026: ${thang.reduce((a, b) => a + b, 0)} người — theo tháng: ${thang.map((n, i) => `T${i + 1}:${n}`).join(' ')}\n`)

  // 7. Đơn vị đông người nhất
  const byPb = new Map<string, number>()
  all.forEach(c => byPb.set(c.phongBan ?? 'Chưa rõ', (byPb.get(c.phongBan ?? 'Chưa rõ') ?? 0) + 1))
  const pbSorted = [...byPb.entries()].sort((a, b) => b[1] - a[1])
  console.log('— Đơn vị ĐÔNG người nhất (top 5):')
  pbSorted.slice(0, 5).forEach(([pb, n]) => console.log(`  ${pb}: ${n} người`))
  console.log(`  Tổng số đơn vị: ${byPb.size}\n`)

  // 8. Tuổi Đảng cao nhất
  const dang = all.filter(c => c.ngayKetNapDang).sort((a, b) => +new Date(a.ngayKetNapDang!) - +new Date(b.ngayKetNapDang!))
  console.log(`— Đảng viên: ${dang.length} người. Tuổi Đảng CAO nhất: ${nv(dang[0])} — kết nạp ${d(dang[0].ngayKetNapDang)}\n`)

  // 9. Sinh nhật tháng 6
  const sn6 = all.filter(c => c.ngaySinh && new Date(c.ngaySinh).getMonth() === 5)
  console.log(`— Sinh nhật tháng 6: ${sn6.length} người`)
  sn6.slice(0, 10).forEach(c => console.log(`  ${nv(c)} — ${d(c.ngaySinh)}`))

  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
