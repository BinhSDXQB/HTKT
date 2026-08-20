// Cấu hình LIÊN THÔNG Cơ sở dữ liệu quốc gia về hoạt động xây dựng.
// Căn cứ: Nghị định 212/2026/NĐ-CP + Thông tư 39/2026/TT-BXD. Bảng DB: httt_* (migration 040).
// Nguyên tắc (NĐ212 Đ8): mỗi đối tượng gắn 1 mã định danh DUY NHẤT, dùng suốt vòng đời để
// quản lý–liên kết–kế thừa–cập nhật. Dữ liệu chủ = dữ liệu chung + mã định danh.

export type HttLoaiDoiTuong =
  | 'QUY_HOACH' | 'DU_AN' | 'CONG_TRINH' | 'NANG_LUC_CA_NHAN' | 'NANG_LUC_TO_CHUC' | 'DINH_MUC_GIA'

export type HttLoaiMa = 'SO_DINH_DANH_CN' | 'HO_CHIEU' | 'MA_SO_DN' | 'CHUOI_KY_TU'

export type HttTrangThaiDongBo = 'CHUA_KHOI_TAO' | 'DA_KHOI_TAO' | 'DA_DONG_BO' | 'LOI' | 'CHO_DUYET'

export const HTT_LOAI_DOI_TUONG: { value: HttLoaiDoiTuong; ten: string; canCu: string }[] = [
  { value: 'QUY_HOACH',        ten: 'Quy hoạch đô thị và nông thôn', canCu: 'NĐ212 Đ9-12' },
  { value: 'DU_AN',            ten: 'Dự án đầu tư xây dựng',          canCu: 'NĐ212 Đ13-15' },
  { value: 'CONG_TRINH',       ten: 'Công trình xây dựng',            canCu: 'NĐ212 Đ13-15' },
  { value: 'DINH_MUC_GIA',     ten: 'Định mức, giá, chỉ số giá XD',   canCu: 'NĐ212 Đ16-17' },
  { value: 'NANG_LUC_CA_NHAN', ten: 'Năng lực HĐXD của cá nhân',      canCu: 'NĐ212 Đ18-21' },
  { value: 'NANG_LUC_TO_CHUC', ten: 'Năng lực HĐXD của tổ chức',      canCu: 'NĐ212 Đ18-21' },
]

// Lĩnh vực CẤP CHỨNG CHỈ HÀNH NGHỀ cá nhân (NĐ212 Đ28, Đ34-37) — CHỈ 4 lĩnh vực.
export const LINH_VUC_HANH_NGHE = [
  'Khảo sát xây dựng',              // Đ34
  'Lập quy hoạch đô thị và nông thôn', // Đ35
  'Thiết kế xây dựng',              // Đ36
  'Giám sát thi công xây dựng',     // Đ37
]

// Chức danh có điều kiện kinh nghiệm (Đ38) — KHÔNG thuộc lĩnh vực cấp CCHN, quản lý riêng.
export const CHUC_DANH_HANH_NGHE = [
  'Giám đốc quản lý dự án đầu tư xây dựng',
  'Chỉ huy trưởng công trường',
]

export const HANG_CHUNG_CHI = ['I', 'II', 'III'] as const
// Loại thủ tục cấp CCHN (Đ29) — điều chỉnh/gia hạn là tiểu tình huống, ghi ở ly_do_cap.
export const LOAI_CAP_CCHN = ['CAP_MOI', 'CAP_LAI', 'CHUYEN_DOI'] as const

/**
 * Suy LOẠI mã định danh năng lực theo NĐ212 Đ19:
 *  - cá nhân là công dân Việt Nam → số định danh cá nhân (CCCD, từ CSDL quốc gia về dân cư);
 *  - cá nhân khác → số hộ chiếu;
 *  - tổ chức → mã số doanh nghiệp.
 */
export function loaiMaNangLuc(doiTuong: 'CA_NHAN' | 'TO_CHUC', laCongDanVN: boolean): HttLoaiMa {
  if (doiTuong === 'TO_CHUC') return 'MA_SO_DN'
  return laCongDanVN ? 'SO_DINH_DANH_CN' : 'HO_CHIEU'
}

/** Dữ liệu CHỦ (master data) — dữ liệu chung công bố/đồng bộ. NĐ212 Đ18 + Đ20. */
export const TRUONG_DU_LIEU_CHU = {
  NANG_LUC_CA_NHAN: ['maDinhDanh', 'linhVucHanhNghe', 'hangChungChi', 'thoiHanChungChi'], // Đ18.2.a + Đ19
  NANG_LUC_TO_CHUC: ['maDinhDanh', 'tenNhaThau'],                                          // Đ18.3.a + Đ19
}

export const HTT_TRANG_THAI_DONG_BO: { value: HttTrangThaiDongBo; ten: string; mau: string }[] = [
  { value: 'CHUA_KHOI_TAO', ten: 'Chưa khởi tạo mã định danh', mau: 'bg-slate-100 text-slate-700' },
  { value: 'DA_KHOI_TAO',   ten: 'Đã khởi tạo mã định danh',   mau: 'bg-amber-100 text-amber-700' },
  { value: 'DA_DONG_BO',    ten: 'Đã đồng bộ HTTT quốc gia',   mau: 'bg-emerald-100 text-emerald-700' },
  { value: 'CHO_DUYET',     ten: 'Chờ duyệt đồng bộ',          mau: 'bg-indigo-100 text-indigo-700' },
  { value: 'LOI',           ten: 'Lỗi đồng bộ',                mau: 'bg-rose-100 text-rose-700' },
]

// Văn bản căn cứ (đối chiếu khi đấu nối HTTT quốc gia). Trường chi tiết: Phụ lục I + Bảng 1/2 Phụ lục II TT39.
export const HTT_CAN_CU = [
  { soHieu: '212/2026/NĐ-CP', ten: 'Điều kiện năng lực HĐXD; Hệ thống thông tin, CSDL quốc gia về hoạt động xây dựng', ngayBanHanh: '2026-06-17', ngayHieuLuc: '2026-07-01' },
  { soHieu: '39/2026/TT-BXD', ten: 'Hướng dẫn NĐ212: trường dữ liệu, biểu mẫu, quy trình cập nhật HTTT hoạt động xây dựng', ngayBanHanh: '2026-06-26', ngayHieuLuc: '2026-07-01' },
]
