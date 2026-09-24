// Tạo 18 hồ sơ cán bộ MỚI cho những người xuất hiện trong QĐ nâng lương/vượt khung
// (G:\My Drive\Nâng lương) nhưng CHƯA có hồ sơ trong CSDL — phát hiện khi đối soát 27 QĐ với
// CSDL ngày 24/9/26. Dữ liệu ngạch/bậc/hệ số/đơn vị lấy TRỰC TIẾP từ nội dung QĐ (đã đọc và xác
// minh từng file, không suy đoán).
//
// CCCD: các QĐ không ghi CCCD → dùng mã tạm "TAM-<HỌ TÊN KHÔNG DẤU>" (theo đúng mẫu đã dùng cho
// Lê Quang Đạo/Lê Đinh Hậu trước đây) — CẦN THAY BẰNG CCCD THẬT khi có hồ sơ gốc/hợp đồng.
// ngayNangLuongKeTiep: KHÔNG tự tính (thời gian giữ bậc khác nhau theo nhóm ngạch: 3 năm với
// A0-A3, 2 năm với B/C theo TT08/2013) — để trống, Văn phòng Sở/đơn vị bổ sung khi rà hồ sơ.
//
// Nguyễn Xuân Hoàng: trùng tên với 1 người đã có hồ sơ ở đơn vị khác (Phó Giám đốc, CVC 01.002)
// — đây là NGƯỜI KHÁC (Phó Trưởng phòng HC-TH, TT Quy hoạch & Kiểm định XD phía Nam, mã 13.095),
// dùng CCCD tạm riêng để không trùng.
//
// Chạy thử trước: node_modules\.bin\jiti.cmd prisma\tao-ho-so-thieu-tu-qd-nang-luong.ts --dry-run
// Chạy thật:      node_modules\.bin\jiti.cmd prisma\tao-ho-so-thieu-tu-qd-nang-luong.ts

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const DRY_RUN = process.argv.includes('--dry-run')

type HoSo = {
  cccd: string
  hoTen: string
  chucVu: string
  phongBan?: string
  toChucId: string
  doiTuong: 'VIEN_CHUC' | 'NGUOI_LAO_DONG'
  loaiHinh: string
  ngachHienHuong?: string
  maNgach?: string
  bacLuong?: number
  heSoLuong?: number
  vuotKhung?: number
  ngayNangLuong: string // ISO date — "thời điểm hưởng bậc lương mới" trong QĐ
}

const DS: HoSo[] = [
  // --- Trung tâm Đăng kiểm xe cơ giới phía Nam (tc_tt_dang_kiem_nam) ---
  { cccd: 'TAM-HO-DUY-MANH', hoTen: 'Hồ Duy Mạnh', chucVu: 'Đăng kiểm viên hạng III', phongBan: 'Phòng Đăng kiểm', toChucId: 'tc_tt_dang_kiem_nam', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Đăng kiểm viên hạng III', maNgach: 'V.12.31.03', bacLuong: 6, heSoLuong: 3.99, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-NGUYEN-AN', hoTen: 'Nguyễn Ân', chucVu: 'Chuyên viên', phongBan: 'Phòng Kế toán - Nghiệp vụ', toChucId: 'tc_tt_dang_kiem_nam', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Chuyên viên', maNgach: '01.003', bacLuong: 9, heSoLuong: 4.98, ngayNangLuong: '2026-07-01' },
  { cccd: 'TAM-TRAN-ANH-TUAN', hoTen: 'Trần Anh Tuấn', chucVu: 'Trưởng phòng Tổ chức - Hành chính', phongBan: 'Phòng Tổ chức - Hành chính', toChucId: 'tc_tt_dang_kiem_nam', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Chuyên viên', maNgach: '01.003', bacLuong: 7, heSoLuong: 4.32, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-TRAN-DUC-MINH', hoTen: 'Trần Đức Minh', chucVu: 'Nhân viên bảo vệ', phongBan: 'Phòng Tổ chức - Hành chính', toChucId: 'tc_tt_dang_kiem_nam', doiTuong: 'NGUOI_LAO_DONG', loaiHinh: 'HĐLĐ', ngachHienHuong: 'NV thừa hành, phục vụ (Bảng 4)', bacLuong: 9, heSoLuong: 2.94, ngayNangLuong: '2026-07-01' },

  // --- Trung tâm Dịch vụ và Quản lý bến xe khách phía Nam (tc_tt_ben_xe_nam) ---
  { cccd: 'TAM-DUONG-THI-KIM-HUE', hoTen: 'Dương Thị Kim Huệ', chucVu: 'Cán sự', phongBan: 'Bến xe Đông Hà', toChucId: 'tc_tt_ben_xe_nam', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Cán sự', maNgach: '01.004', bacLuong: 8, heSoLuong: 3.26, ngayNangLuong: '2026-09-01' },

  // --- Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật (tc_ban_bao_tri_gt) ---
  { cccd: 'TAM-TRAN-THI-LIEN', hoTen: 'Trần Thị Liên', chucVu: 'Cán sự', phongBan: 'Văn phòng', toChucId: 'tc_ban_bao_tri_gt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Cán sự', maNgach: '01.004', bacLuong: 12, heSoLuong: 4.06, vuotKhung: 12, ngayNangLuong: '2026-09-01' },
  { cccd: 'TAM-NGUYEN-THI-HANG-NGA', hoTen: 'Nguyễn Thị Hằng Nga', chucVu: 'Kế toán viên', phongBan: 'Phòng Tài chính - Kế toán', toChucId: 'tc_ban_bao_tri_gt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Kế toán viên', maNgach: '06.031', bacLuong: 9, heSoLuong: 4.98, vuotKhung: 7, ngayNangLuong: '2026-09-01' },
  { cccd: 'TAM-HOANG-GIANG-NAM', hoTen: 'Hoàng Giang Nam', chucVu: 'Nhân viên (HĐLĐ)', phongBan: 'Phòng Tuần kiểm - Giám sát', toChucId: 'tc_ban_bao_tri_gt', doiTuong: 'NGUOI_LAO_DONG', loaiHinh: 'HĐLĐ', ngachHienHuong: 'Quản lý, bảo trì công trình GT hạng IV', maNgach: 'V.12.61.04', bacLuong: 2, heSoLuong: 2.41, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-NGUYEN-THI-LE-NA', hoTen: 'Nguyễn Thị Lê Na', chucVu: 'Chuyên viên', phongBan: 'Văn phòng', toChucId: 'tc_ban_bao_tri_gt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Chuyên viên', maNgach: '01.003', bacLuong: 4, heSoLuong: 3.33, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-TRAN-DUY-KHANH', hoTen: 'Trần Duy Khánh', chucVu: 'Phó Giám đốc', toChucId: 'tc_ban_bao_tri_gt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Thẩm kế viên hạng III', maNgach: 'V04.02.06', bacLuong: 6, heSoLuong: 3.99, ngayNangLuong: '2026-09-01' },

  // --- Viện Quy hoạch xây dựng Quảng Trị (tc_vien_qhxd) ---
  { cccd: 'TAM-DINH-THI-HA', hoTen: 'Đinh Thị Hà', chucVu: 'Kỹ thuật viên hạng IV', phongBan: 'Phòng Quy hoạch xây dựng 2', toChucId: 'tc_vien_qhxd', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Kỹ thuật viên hạng IV', maNgach: 'V.05.02.08', bacLuong: 12, heSoLuong: 4.06, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-NGUYEN-VIET-HOANG', hoTen: 'Nguyễn Việt Hoàng', chucVu: 'Phó Trưởng phòng Quy hoạch xây dựng 1', phongBan: 'Phòng Quy hoạch xây dựng 1', toChucId: 'tc_vien_qhxd', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Kiến trúc sư hạng III', maNgach: 'V04.01.03', bacLuong: 4, heSoLuong: 3.33, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-NGUYEN-ANH-DUC', hoTen: 'Nguyễn Anh Đức', chucVu: 'Hợp đồng lao động', phongBan: 'Phòng Quy hoạch xây dựng 2', toChucId: 'tc_vien_qhxd', doiTuong: 'NGUOI_LAO_DONG', loaiHinh: 'HĐLĐ', bacLuong: 3, heSoLuong: 3.00, ngayNangLuong: '2026-08-01' },
  { cccd: 'TAM-NGUYEN-BAO-TRUNG', hoTen: 'Nguyễn Bảo Trung', chucVu: 'Phó Trưởng phòng Thiết kế xây dựng', phongBan: 'Phòng Thiết kế xây dựng', toChucId: 'tc_vien_qhxd', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Kiến trúc sư hạng III', maNgach: 'V04.01.03', bacLuong: 4, heSoLuong: 3.33, ngayNangLuong: '2026-08-01' },

  // --- Trường Trung cấp nghề Giao thông vận tải Quảng Trị (tc_truong_tc_nghe_gtvt) ---
  { cccd: 'TAM-TRAN-LUONG-TUAN', hoTen: 'Trần Lương Tuấn', chucVu: 'Giáo viên', phongBan: 'Ban Thực hành', toChucId: 'tc_truong_tc_nghe_gtvt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Giáo viên GDNN hạng IV', maNgach: 'V.09.02.09', bacLuong: 12, heSoLuong: 4.06, vuotKhung: 6, ngayNangLuong: '2026-04-01' },
  { cccd: 'TAM-NGUYEN-THI-TO-NGA', hoTen: 'Nguyễn Thị Tố Nga', chucVu: 'Giáo viên', phongBan: 'Khoa Xây dựng - Giao thông', toChucId: 'tc_truong_tc_nghe_gtvt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Giáo viên GDNN lý thuyết hạng III', maNgach: 'V.09.02.07', bacLuong: 5, heSoLuong: 3.66, ngayNangLuong: '2026-09-01' },
  { cccd: 'TAM-DO-HAI-NAM', hoTen: 'Đỗ Hải Nam', chucVu: 'Giáo viên', phongBan: 'Ban thực hành', toChucId: 'tc_truong_tc_nghe_gtvt', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Giáo viên GDNN thực hành hạng III', maNgach: 'V.09.02.08', bacLuong: 3, heSoLuong: 3.00, ngayNangLuong: '2026-09-01' },

  // --- Trung tâm Quy hoạch và Kiểm định xây dựng phía Nam (tc_tt_qh_kd_nam) ---
  // Trùng tên với 1 người đã có hồ sơ (Phó Giám đốc, CVC 01.002, đơn vị khác) — là NGƯỜI KHÁC.
  { cccd: 'TAM-NGUYEN-XUAN-HOANG-TTQHKD', hoTen: 'Nguyễn Xuân Hoàng', chucVu: 'Phó Trưởng phòng phụ trách Hành chính - Tổng hợp', phongBan: 'Phòng Hành chính - Tổng hợp', toChucId: 'tc_tt_qh_kd_nam', doiTuong: 'VIEN_CHUC', loaiHinh: 'BCSN', ngachHienHuong: 'Viên chức', maNgach: '13.095', bacLuong: 5, heSoLuong: 3.66, ngayNangLuong: '2026-04-01' },
]

async function main() {
  console.log(`Sẽ tạo ${DS.length} hồ sơ:`)
  for (const h of DS) console.log(`  - ${h.hoTen} (${h.cccd}) — ${h.chucVu} — bậc ${h.bacLuong ?? '—'} hệ số ${h.heSoLuong ?? '—'}${h.vuotKhung != null ? ` vượt khung ${h.vuotKhung}%` : ''}`)

  if (DRY_RUN) {
    console.log('\n(--dry-run: CHƯA ghi gì vào CSDL. Bỏ cờ này để tạo thật.)')
    return
  }

  let soDaTao = 0
  for (const h of DS) {
    try {
      const existed = await db.canBo.findUnique({ where: { cccd: h.cccd } })
      if (existed) { console.log(`  ⚠ ${h.hoTen}: CCCD "${h.cccd}" đã tồn tại — BỎ QUA`); continue }
      await db.canBo.create({
        data: {
          cccd: h.cccd,
          hoTen: h.hoTen,
          chucVu: h.chucVu,
          phongBan: h.phongBan,
          toChucId: h.toChucId,
          doiTuong: h.doiTuong,
          loaiHinh: h.loaiHinh,
          ngachHienHuong: h.ngachHienHuong,
          maNgach: h.maNgach,
          bacLuong: h.bacLuong,
          heSoLuong: h.heSoLuong,
          vuotKhung: h.vuotKhung,
          ngayNangLuong: new Date(h.ngayNangLuong),
          trangThai: 'DANG_CONG_TAC',
        },
      })
      soDaTao++
    } catch (e) {
      // Bản ghi khác đã tạo cùng cccd giữa lúc kiểm tra và lúc ghi (race) — bỏ qua, không vỡ cả lô.
      console.log(`  ⚠ ${h.hoTen}: lỗi khi tạo (có thể trùng CCCD do race) — BỎ QUA: ${(e as Error).message}`)
    }
  }
  console.log(`\n✔ Đã tạo ${soDaTao}/${DS.length} hồ sơ.`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
