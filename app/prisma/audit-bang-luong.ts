// Audit (chỉ ĐỌC): bảng lương tháng tạm tính của từng cán bộ đang công tác theo tinhBangLuongThang
// (lib/luong.ts) — thu nhập, BH, giảm trừ gia cảnh (số con là người phụ thuộc), thuế TNCN, thực lĩnh.
// Chạy: node_modules\.bin\jiti.cmd prisma\audit-bang-luong.ts [--chi-tiet]

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { tinhBangLuongThang, fmtVND } from '../lib/luong'
import { demNguoiPhuThuoc } from '../lib/con-can-bo'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL }) } as never)

async function main() {
  const ds = await db.canBo.findMany({
    where: { trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } },
    select: { hoTen: true, doiTuong: true, loaiHinh: true, heSoLuong: true, phuCap: true, vuotKhung: true, toChuc: { select: { loai: true, ten: true } }, conCai: true },
    orderBy: { hoTen: 'asc' },
  })
  const dem: Record<string, number> = {}
  let coThue = 0
  for (const cb of ds) {
    const kq = tinhBangLuongThang({
      heSoLuong: cb.heSoLuong == null ? null : Number(cb.heSoLuong), phuCap: cb.phuCap == null ? null : Number(cb.phuCap),
      vuotKhung: cb.vuotKhung, doiTuong: cb.doiTuong, loaiHinh: cb.loaiHinh, loaiToChuc: cb.toChuc?.loai,
      soNguoiPhuThuoc: demNguoiPhuThuoc(cb.conCai),
    })
    const k = kq.apDung ? kq.doiTuongNhan : 'Không tính được'
    dem[k] = (dem[k] ?? 0) + 1
    if (kq.thueTNCN > 0) coThue++
    if (process.argv.includes('--chi-tiet') && kq.apDung) {
      const g = (m: string) => kq.thuNhap.find((d) => d.ma === m)?.soTien ?? kq.khauTru.find((d) => d.ma === m)?.soTien ?? 0
      console.log(`${cb.hoTen.padEnd(24)} ${kq.doiTuongNhan.padEnd(26)} ${(cb.toChuc?.ten ?? '').slice(0, 22).padEnd(22)} | TN ${fmtVND(kq.tongThuNhap).padStart(12)} (CV ${fmtVND(g('pcCongVu'))}) | BH ${fmtVND(kq.tongBaoHiem).padStart(10)} | NPT ${kq.soNguoiPhuThuoc} | thuế ${fmtVND(kq.thueTNCN).padStart(9)} | lĩnh ${fmtVND(kq.thucLinh).padStart(12)}`)
    }
  }
  console.log(`\n${ds.length} người:`, dem, `· ${coThue} người phát sinh thuế TNCN`)
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => db.$disconnect())
