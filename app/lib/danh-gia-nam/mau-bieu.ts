// Danh mục biểu mẫu kiểm điểm, đánh giá 2026 — mỗi mẫu gắn đối tượng, năm, phiên bản, thẩm quyền, bản gốc.
// Chỉ liệt kê mẫu CÓ bản gốc đọc được; mẫu chưa có bản gốc ghi trạng thái UNKNOWN, KHÔNG dựng nội dung.

export type BoMau = 'SNV_CV6862' | 'HD43_BTCTW'

export type MauBieu = {
  ma: string
  ten: string
  bo: BoMau
  nam: number
  trangThai: 'CO_BAN_GOC' | 'UNKNOWN'
  /** đối tượng áp dụng ở cấp Sở/phòng; rỗng = không áp dụng cho cơ quan Sở */
  doiTuong: string
  thamQuyen: string
  banGoc: string
  ghiChu?: string
}

const SNV = 'CV 6862/SNV-CBCCVC ngày 12/11/2026 (Sở Nội vụ) — bộ biểu mẫu kèm theo'
const HD43 = 'Hướng dẫn 43-HD/BTCTW ngày 31/10/2025 — phụ lục mẫu 01–06 (đảng viên)'

export const DANH_MUC_MAU: readonly MauBieu[] = [
  { ma: '01', ten: 'Báo cáo kiểm điểm, tự đánh giá, xếp loại chất lượng của tập thể', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Tập thể phòng, đơn vị, Sở', thamQuyen: 'Người đứng đầu cơ quan, đơn vị', banGoc: `${SNV}; tệp MAU SO 01.docx` },
  { ma: '2A', ten: 'Bản kiểm điểm, tự đánh giá, xếp loại của cá nhân — người đứng đầu', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Người đứng đầu cơ quan, đơn vị', thamQuyen: 'Cấp có thẩm quyền xếp loại', banGoc: `${SNV}; tệp MAU SO 2A. 2B. 03.doc` },
  { ma: '2B', ten: 'Bản kiểm điểm, tự đánh giá, xếp loại của cá nhân — lãnh đạo, quản lý từ cấp phó trở xuống', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Phó Trưởng phòng và chức danh lãnh đạo, quản lý từ cấp phó người đứng đầu trở xuống', thamQuyen: 'Trưởng phòng đánh giá, Giám đốc Sở xếp loại', banGoc: `${SNV}; tệp MAU SO 2A. 2B. 03.doc` },
  { ma: '2C', ten: 'Bản kiểm điểm, tự đánh giá, xếp loại của cá nhân — không giữ chức vụ lãnh đạo, quản lý', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Công chức, viên chức, người lao động không giữ chức vụ lãnh đạo, quản lý', thamQuyen: 'Trưởng phòng đánh giá, Giám đốc Sở xếp loại', banGoc: `${SNV}; tệp MAU SO 2A. 2B. 03.doc` },
  { ma: '03', ten: 'Phiếu xếp loại chất lượng cán bộ, công chức, viên chức', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Mọi cán bộ, công chức, viên chức', thamQuyen: 'Cấp có thẩm quyền xếp loại', banGoc: `${SNV}; tệp MAU SO 2A. 2B. 03.doc` },
  { ma: '04', ten: 'Bảng theo dõi, đánh giá và chấm điểm kết quả thực hiện nhiệm vụ (KPI)', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Mọi cán bộ, công chức, viên chức (theo quý)', thamQuyen: 'Người quản lý trực tiếp xác nhận', banGoc: `${SNV}; tệp MAU SO 04 CHUAN.xlsx` },
  { ma: '05', ten: 'Báo cáo tổng hợp kết quả đánh giá, xếp loại chất lượng cán bộ, công chức', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Cơ quan hành chính (Sở, phòng)', thamQuyen: 'Người đứng đầu cơ quan', banGoc: `${SNV}; tệp MAU SO 05.06.07.doc` },
  { ma: '06', ten: 'Báo cáo tổng hợp kết quả đánh giá, xếp loại chất lượng viên chức', bo: 'SNV_CV6862', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Đơn vị sự nghiệp công lập', thamQuyen: 'Người đứng đầu đơn vị', banGoc: `${SNV}; tệp MAU SO 05.06.07.doc` },
  { ma: '07', ten: 'Mẫu số 07 (tiêu đề chưa đọc được)', bo: 'SNV_CV6862', nam: 2026, trangThai: 'UNKNOWN',
    doiTuong: '', thamQuyen: '', banGoc: `${SNV}; tệp MAU SO 05.06.07.doc`, ghiChu: 'Công cụ đọc .doc không tách được bảng; cần bản .docx hoặc PDF.' },
  // Hướng dẫn 43 (đảng viên) — chỉ để tham chiếu, cùng số nhưng KHÁC nội dung bộ Sở Nội vụ.
  { ma: 'ĐV-01', ten: 'Mẫu 01-HD KĐ.ĐG 2025: báo cáo kiểm điểm tập thể (đảng)', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Tập thể tổ chức đảng', thamQuyen: 'Cấp ủy', banGoc: HD43 },
  { ma: 'ĐV-2A', ten: 'Mẫu 02A-HD KĐ.ĐG 2025: kiểm điểm cá nhân giữ chức vụ lãnh đạo, quản lý (đảng viên)', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Đảng viên giữ chức vụ lãnh đạo, quản lý', thamQuyen: 'Chi ủy, đảng ủy', banGoc: HD43 },
  { ma: 'ĐV-2B', ten: 'Mẫu 02B-HD KĐ.ĐG 2025: kiểm điểm cá nhân không giữ chức vụ (đảng viên)', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Đảng viên không giữ chức vụ lãnh đạo, quản lý', thamQuyen: 'Chi ủy, đảng ủy', banGoc: HD43 },
  { ma: 'ĐV-2C', ten: 'Mẫu 02C-HD KĐ.ĐG 2025: đảng viên không làm việc trong hệ thống chính trị', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: 'Đảng viên ngoài hệ thống chính trị (hưu trí, học sinh, sinh viên, doanh nghiệp tư nhân…) — KHÔNG áp dụng cho cán bộ của Sở', thamQuyen: 'Chi ủy', banGoc: HD43 },
  { ma: 'ĐV-03', ten: 'Mẫu 03-HD KĐ.ĐG 2025: quyết định xếp loại lại tổ chức đảng, đảng viên', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: '', thamQuyen: 'Ban Thường vụ cấp ủy cấp trên — không thuộc cấp Sở', banGoc: HD43 },
  { ma: 'ĐV-04', ten: 'Mẫu 04-HD KĐ.ĐG 2025: danh mục hồ sơ gửi Ban Tổ chức Trung ương', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: '', thamQuyen: 'Cấp ủy trực thuộc Trung ương — không thuộc cấp Sở', banGoc: HD43 },
  { ma: 'ĐV-05', ten: 'Mẫu 05-HD KĐ.ĐG 2025: tự đánh giá của cán bộ diện Bộ Chính trị, Ban Bí thư quản lý', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: '', thamQuyen: 'Không thuộc cấp Sở', banGoc: HD43 },
  { ma: 'ĐV-06', ten: 'Mẫu 06-HD KĐ.ĐG 2025: tổng hợp đề xuất xếp loại cán bộ diện Bộ Chính trị, Ban Bí thư quản lý', bo: 'HD43_BTCTW', nam: 2026, trangThai: 'CO_BAN_GOC',
    doiTuong: '', thamQuyen: 'Không thuộc cấp Sở', banGoc: HD43 },
  // Chưa có bản gốc: điểm mở rộng, không dựng.
  ...(['4B', '6C', '6F1', '6F2', '6F3', '6F4', 'BB-HOP'] as const).map((ma): MauBieu => ({
    ma, ten: ma === 'BB-HOP' ? 'Biên bản họp đánh giá' : `Mẫu ${ma} (chưa có văn bản gốc)`, bo: 'HD43_BTCTW', nam: 2026, trangThai: 'UNKNOWN',
    doiTuong: '', thamQuyen: '', banGoc: 'KHÔNG CÓ trong kho VBPL',
    ghiChu: 'Chờ Công văn 2772-CV/BTCTW hoặc văn bản hướng dẫn; không dựng theo trí nhớ.',
  })),
]

export function timMau(ma: string, bo?: BoMau): MauBieu | undefined {
  return DANH_MUC_MAU.find((m) => m.ma === ma && (!bo || m.bo === bo))
}

export type DoiTuongChonMau = {
  /** Người đứng đầu cơ quan, đơn vị (Giám đốc Sở; Trưởng phòng khi đơn vị = phòng) */
  laNguoiDungDau: boolean
  /** Có chức vụ lãnh đạo, quản lý (kể cả cấp phó) */
  laLanhDaoQuanLy: boolean
}

/**
 * Chọn Mẫu cá nhân theo bộ Sở Nội vụ:
 * 2A = người đứng đầu cơ quan, đơn vị; 2B = lãnh đạo, quản lý từ cấp phó trở xuống; 2C = không giữ chức vụ.
 * Lưu ý: Trưởng phòng là người đứng đầu PHÒNG nhưng cấp phó của Sở → mặc định 2B; chỉ 2A khi đơn vị đánh giá chính là phòng đó
 * và Văn phòng xác nhận. Người gọi phải truyền `laNguoiDungDau` đúng theo đơn vị đánh giá.
 */
export function chonMauCaNhan(d: DoiTuongChonMau): '2A' | '2B' | '2C' {
  if (d.laNguoiDungDau) return '2A'
  if (d.laLanhDaoQuanLy) return '2B'
  return '2C'
}

/** Mẫu đúng/sai đối tượng: trả về lý do nếu sai. */
export function kiemTraMauDungDoiTuong(ma: string, d: DoiTuongChonMau): string | null {
  if (!['2A', '2B', '2C'].includes(ma)) return null
  const dung = chonMauCaNhan(d)
  return ma === dung ? null : `Mẫu ${ma} không đúng đối tượng; hồ sơ này áp dụng Mẫu ${dung}.`
}
