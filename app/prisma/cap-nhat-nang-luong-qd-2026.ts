// Cập nhật nâng bậc lương thường xuyên theo 5 Quyết định trong C:\Nâng lương (tháng 4-6/2026).
// Mỗi người: cập nhật can_bo (bậc, hệ số, ngày hưởng, ngày nâng kế tiếp = +3 năm)
// + ghi office_salary_history (bỏ qua nếu số QĐ đã có). Idempotent — chạy lại an toàn.
// Chạy: node_modules\.bin\jiti.cmd prisma\cap-nhat-nang-luong-qd-2026.ts

import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:Postgres%402025@localhost:5432/ql_htkt'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

const QUYET_DINH = [
  {
    hoTen: 'Lê Văn Thủy', soQD: '466/QĐ-SXD', ngayQD: utc(2026, 6, 1),
    bacCu: 3, heSoCu: 5.08, bacMoi: 4, heSoMoi: 5.42,
    ngayHuong: utc(2026, 6, 1), ngayNangTiep: utc(2029, 6, 1),
  },
  {
    hoTen: 'Nguyễn Thế Thái Tùng', soQD: '465/QĐ-SXD', ngayQD: utc(2026, 6, 1),
    bacCu: 7, heSoCu: 4.32, bacMoi: 8, heSoMoi: 4.65,
    ngayHuong: utc(2026, 6, 1), ngayNangTiep: utc(2029, 6, 1),
  },
  {
    hoTen: 'Lê Địch Trung', soQD: '260/QĐ-SXD', ngayQD: utc(2026, 4, 29),
    bacCu: 6, heSoCu: 3.99, bacMoi: 7, heSoMoi: 4.32,
    ngayHuong: utc(2026, 5, 1), ngayNangTiep: utc(2029, 5, 1),
  },
  {
    hoTen: 'Trần Hữu Sửu', soQD: '259/QĐ-SXD', ngayQD: utc(2026, 4, 29),
    bacCu: 3, heSoCu: 5.08, bacMoi: 4, heSoMoi: 5.42,
    ngayHuong: utc(2026, 5, 1), ngayNangTiep: utc(2029, 5, 1),
  },
  {
    hoTen: 'Trần Nguyễn', soQD: '258/QĐ-SXD', ngayQD: utc(2026, 4, 29),
    bacCu: 7, heSoCu: 4.32, bacMoi: 8, heSoMoi: 4.65,
    ngayHuong: utc(2026, 5, 1), ngayNangTiep: utc(2029, 5, 1),
  },
]

async function main() {
  for (const qd of QUYET_DINH) {
    const matches = await db.canBo.findMany({ where: { hoTen: qd.hoTen } })
    if (matches.length !== 1) {
      console.log(`✖ ${qd.hoTen}: tìm thấy ${matches.length} bản ghi — BỎ QUA, cần kiểm tra tay`)
      continue
    }
    const cb = matches[0]
    const khopCu = cb.bacLuong === qd.bacCu && Math.abs((cb.heSoLuong ?? 0) - qd.heSoCu) < 0.005
    const daApDung = cb.bacLuong === qd.bacMoi && Math.abs((cb.heSoLuong ?? 0) - qd.heSoMoi) < 0.005
    if (!khopCu && !daApDung) {
      console.log(`⚠ ${qd.hoTen}: CSDL đang bậc ${cb.bacLuong}/hệ số ${cb.heSoLuong} — không khớp QĐ (từ bậc ${qd.bacCu}/${qd.heSoCu}); vẫn cập nhật theo QĐ ${qd.soQD}`)
    }

    await db.canBo.update({
      where: { id: cb.id },
      data: {
        bacLuong: qd.bacMoi,
        heSoLuong: qd.heSoMoi,
        ngayNangLuong: qd.ngayHuong,
        ngayNangLuongKeTiep: qd.ngayNangTiep,
      },
    })

    const daCo = await db.officeSalaryHistory.findFirst({
      where: { canBoId: cb.id, soQuyetDinh: qd.soQD },
    })
    if (!daCo) {
      await db.officeSalaryHistory.create({
        data: {
          canBoId: cb.id,
          loai: 'THUONG_XUYEN',
          bacLuong: qd.bacMoi,
          heSoLuong: qd.heSoMoi,
          phuCapChucVu: cb.phuCap,
          ngayHuong: qd.ngayHuong,
          ngayNangTiep: qd.ngayNangTiep,
          soQuyetDinh: qd.soQD,
          ngayQuyetDinh: qd.ngayQD,
          ghiChu: `Nâng bậc lương thường xuyên: bậc ${qd.bacCu} (${qd.heSoCu}) → bậc ${qd.bacMoi} (${qd.heSoMoi}). Nhập từ file PDF C:\\Nâng lương.`,
        },
      })
    }
    console.log(`✔ ${qd.hoTen}: bậc ${qd.bacCu}→${qd.bacMoi}, hệ số ${qd.heSoCu}→${qd.heSoMoi}, hưởng từ ${qd.ngayHuong.toISOString().slice(0, 10)}, nâng kế tiếp ${qd.ngayNangTiep.toISOString().slice(0, 10)} (QĐ ${qd.soQD})${daCo ? ' [lịch sử đã có]' : ' [+lịch sử lương]'}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
