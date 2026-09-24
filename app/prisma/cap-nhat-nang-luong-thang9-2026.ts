// Cập nhật nâng bậc lương / phụ cấp thâm niên vượt khung theo 10 Quyết định đã KÝ
// (số hiệu đọc bằng thị giác trực tiếp trên PDF gốc trong G:\My Drive\Nâng lương —
// các số/ngày này nằm trong lớp chữ ký số/con dấu, KHÔNG có trong text layer thường
// nên công cụ trích xuất text (markitdown/pdfminer) đọc ra rỗng).
// Mỗi người: cập nhật can_bo (bậc/hệ số hoặc % vượt khung, ngày hưởng, ngày nâng kế
// tiếp) + ghi office_salary_history (bỏ qua nếu số QĐ đã có). Idempotent — chạy lại an toàn.
// Chạy: node_modules\.bin\jiti.cmd prisma\cap-nhat-nang-luong-thang9-2026.ts
//
// 2 người KHÔNG có trong bảng này dù có QĐ đã ký (Trần Duy Khánh - QĐ 1023/QĐ-SXD
// 09/9/2026; Trần Lương Tuấn - QĐ 234/QĐ-TCN 30/3/2026): đơn vị công tác đã có trong
// to_chuc nhưng cá nhân CHƯA có hồ sơ can_bo, và QĐ lương không ghi số CCCD nên
// không thể tạo hồ sơ mới (cccd là khoá duy nhất bắt buộc, dùng để đăng nhập).
// Cần bổ sung CCCD rồi tạo hồ sơ theo quy trình thường trước khi nhập 2 QĐ này.
//
// 24/9/26: 3 dòng vuotKhungMoi từng ghi PHÂN SỐ (0.05/0.06) thay vì SỐ NGUYÊN % (5/6) — đã sửa ở
// đây (script này đã chạy trước đó nên dữ liệu CŨ trong CSDL được sửa riêng bằng
// prisma/sua-vuot-khung-sai-don-vi.ts; sửa cả ở đây để không lặp lại nếu có ai chạy lại). Xem
// lib/luong.ts hàm chuanHoaPhanTramVuotKhung để biết quy ước đúng (số nguyên % — vd 5 = 5%).

import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

const CAP_NHAT = [
  {
    id: 'cmq7urydy000o3kumzkvq3byu', hoTen: 'Đoàn Việt Bắc', soQD: '3908/QĐ-UBND', ngayQD: utc(2026, 9, 17),
    loai: 'THUONG_XUYEN' as const, bacMoi: 4, heSoMoi: 5.42, vuotKhungMoi: null,
    ngayHuong: utc(2026, 9, 1), ngayNangTiep: utc(2029, 9, 1),
    ghiChu: 'Nâng bậc lương thường xuyên: bậc 3 (5,08) → bậc 4 (5,42).',
  },
  {
    id: 'cmprqtota001qcgume1tr6up5', hoTen: 'Lê Anh Tuấn (cccd 044073000751)', soQD: '621/QĐ-SXD', ngayQD: utc(2026, 6, 30),
    loai: 'VUOT_KHUNG' as const, bacMoi: null, heSoMoi: null, vuotKhungMoi: 5,
    ngayHuong: utc(2026, 7, 1), ngayNangTiep: utc(2027, 7, 1),
    ghiChu: 'Hưởng phụ cấp thâm niên vượt khung lần đầu: 5%.',
  },
  {
    id: 'cmq7urycp000i3kumroalnt96', hoTen: 'Phạm Xuân Thảo', soQD: '757/QĐ-SXD', ngayQD: utc(2026, 7, 28),
    loai: 'VUOT_KHUNG' as const, bacMoi: null, heSoMoi: null, vuotKhungMoi: 6,
    ngayHuong: utc(2026, 8, 1), ngayNangTiep: utc(2027, 8, 1),
    ghiChu: 'Nâng phụ cấp thâm niên vượt khung: 5% → 6%.',
  },
  {
    id: 'cmq7uryce000g3kumbuusph3k', hoTen: 'Phan Thị Lệ Nhung', soQD: '214/QĐ-SXD', ngayQD: utc(2026, 4, 3),
    loai: 'VUOT_KHUNG' as const, bacMoi: null, heSoMoi: null, vuotKhungMoi: 5,
    ngayHuong: utc(2026, 4, 1), ngayNangTiep: utc(2027, 4, 1),
    ghiChu: 'Hưởng phụ cấp thâm niên vượt khung lần đầu: 5%.',
  },
  {
    id: 'cmprqtosc001gcgum59twv6k3', hoTen: 'Võ Hoàng Hà Nhi', soQD: '676/QĐ-SXD', ngayQD: utc(2026, 7, 9),
    loai: 'TRUOC_HAN' as const, bacMoi: 5, heSoMoi: 3.66, vuotKhungMoi: null,
    ngayHuong: utc(2026, 6, 2), ngayNangTiep: utc(2029, 6, 2),
    ghiChu: 'Nâng bậc lương trước thời hạn: bậc 4 (3,33) → bậc 5 (3,66). (CSDL đã đúng từ trước — chỉ bổ sung số QĐ vào lịch sử.)',
  },
  {
    id: 'cmprqtosg001hcgumdpm28k51', hoTen: 'Lê Quang Phi', soQD: '773/QĐ-SXD', ngayQD: utc(2026, 7, 30),
    loai: 'TRUOC_HAN' as const, bacMoi: 8, heSoMoi: 4.65, vuotKhungMoi: null,
    ngayHuong: utc(2026, 8, 3), ngayNangTiep: utc(2029, 8, 3),
    ghiChu: 'Nâng bậc lương trước thời hạn: bậc 7 (4,32) → bậc 8 (4,65).',
  },
  {
    id: 'cmprqtovy0021cgum6zdjzwr8', hoTen: 'Lê Thị Xuân Quý', soQD: '8973/QĐ-SNV', ngayQD: utc(2026, 7, 24),
    loai: 'TRUOC_HAN' as const, bacMoi: 4, heSoMoi: 5.42, vuotKhungMoi: null,
    ngayHuong: utc(2026, 1, 1), ngayNangTiep: utc(2029, 1, 1),
    ghiChu: 'Nâng bậc lương trước thời hạn 12 tháng do thành tích xuất sắc: bậc 3 (5,08) → bậc 4 (5,42). QĐ Sở Nội vụ.',
  },
  {
    id: 'cmprqtosj001icgum8wqobx5m', hoTen: 'Nguyễn Anh Tuấn', soQD: '8974/QĐ-SNV', ngayQD: utc(2026, 7, 24),
    loai: 'TRUOC_HAN' as const, bacMoi: 4, heSoMoi: 5.42, vuotKhungMoi: null,
    ngayHuong: utc(2026, 4, 1), ngayNangTiep: utc(2029, 4, 1),
    ghiChu: 'Nâng bậc lương trước thời hạn 12 tháng do thành tích xuất sắc: bậc 3 (5,08) → bậc 4 (5,42). QĐ Sở Nội vụ.',
  },
  {
    id: 'cmprqtoz7002fcgumq25x6umn', hoTen: 'Nguyễn Sỹ Đông', soQD: '8975/QĐ-SNV', ngayQD: utc(2026, 7, 24),
    loai: 'TRUOC_HAN' as const, bacMoi: 4, heSoMoi: 5.42, vuotKhungMoi: null,
    ngayHuong: utc(2026, 4, 1), ngayNangTiep: utc(2029, 4, 1),
    ghiChu: 'Nâng bậc lương trước thời hạn 12 tháng do thành tích xuất sắc: bậc 3 (5,08) → bậc 4 (5,42). QĐ Sở Nội vụ.',
  },
  {
    id: 'cmprqtot7001pcgum03nn6crz', hoTen: 'Nguyễn Thế Thái Tùng', soQD: '465/QĐ-SXD', ngayQD: utc(2026, 6, 1),
    loai: 'THUONG_XUYEN' as const, bacMoi: 8, heSoMoi: 4.65, vuotKhungMoi: null,
    ngayHuong: utc(2026, 6, 1), ngayNangTiep: utc(2029, 6, 1),
    ghiChu: 'Nâng bậc lương thường xuyên: bậc 7 (4,32) → bậc 8 (4,65). (CSDL + lịch sử đã có từ trước — script này chỉ xác nhận.)',
  },
]

async function main() {
  for (const q of CAP_NHAT) {
    const cb = await db.canBo.findUnique({ where: { id: q.id } })
    if (!cb) {
      console.log(`✖ ${q.hoTen}: không tìm thấy id ${q.id} — BỎ QUA`)
      continue
    }

    await db.canBo.update({
      where: { id: cb.id },
      data: {
        ...(q.bacMoi !== null ? { bacLuong: q.bacMoi } : {}),
        ...(q.heSoMoi !== null ? { heSoLuong: q.heSoMoi } : {}),
        ...(q.vuotKhungMoi !== null ? { vuotKhung: q.vuotKhungMoi } : {}),
        ngayNangLuong: q.ngayHuong,
        ngayNangLuongKeTiep: q.ngayNangTiep,
      },
    })

    const daCo = await db.officeSalaryHistory.findFirst({
      where: { canBoId: cb.id, soQuyetDinh: q.soQD },
    })
    if (!daCo) {
      await db.officeSalaryHistory.create({
        data: {
          canBoId: cb.id,
          loai: q.loai,
          bacLuong: q.bacMoi ?? cb.bacLuong,
          heSoLuong: q.heSoMoi ?? cb.heSoLuong ?? 0,
          phuCapChucVu: cb.phuCap,
          vuotKhung: q.vuotKhungMoi ?? cb.vuotKhung,
          ngayHuong: q.ngayHuong,
          ngayNangTiep: q.ngayNangTiep,
          soQuyetDinh: q.soQD,
          ngayQuyetDinh: q.ngayQD,
          ghiChu: q.ghiChu,
        },
      })
    }
    console.log(`✔ ${q.hoTen}: hưởng từ ${q.ngayHuong.toISOString().slice(0, 10)}, nâng tiếp ${q.ngayNangTiep.toISOString().slice(0, 10)} (QĐ ${q.soQD} ngày ${q.ngayQD.toISOString().slice(0, 10)})${daCo ? ' [lịch sử đã có]' : ' [+lịch sử lương]'}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
