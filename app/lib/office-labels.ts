// Nhãn hiển thị tiếng Việt cho các enum module Văn phòng Sở.
// Tách riêng để dùng chung cho cả server component và client form.

export const DOI_TUONG_NHAN_SU_OPTIONS = [
  { value: 'CONG_CHUC', label: 'Công chức' },
  { value: 'VIEN_CHUC', label: 'Viên chức' },
  { value: 'NGUOI_LAO_DONG', label: 'Người lao động (hợp đồng)' },
] as const

export const DOI_TUONG_NHAN_SU_LABEL: Record<string, string> = Object.fromEntries(
  DOI_TUONG_NHAN_SU_OPTIONS.map((o) => [o.value, o.label])
)

export function doiTuongBadgeClass(dt?: string | null): string {
  switch (dt) {
    case 'CONG_CHUC':      return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'VIEN_CHUC':      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'NGUOI_LAO_DONG': return 'bg-teal-100 text-teal-700 border-teal-200'
    default:               return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

export const LOAI_NANG_LUONG_LABEL: Record<string, string> = {
  THUONG_XUYEN: 'Thường xuyên',
  TRUOC_HAN: 'Trước thời hạn',
  DOT_XUAT: 'Đột xuất',
  VUOT_KHUNG: 'Vượt khung',
  KHAC: 'Khác',
}

export const LOAI_KHEN_THUONG_LABEL: Record<string, string> = {
  DANH_HIEU: 'Danh hiệu thi đua',
  HINH_THUC: 'Hình thức khen thưởng',
}

export const MUC_XEP_LOAI_OPTIONS = [
  { value: 'HOAN_THANH_XUAT_SAC_NHIEM_VU', label: 'Hoàn thành xuất sắc nhiệm vụ' },
  { value: 'HOAN_THANH_TOT_NHIEM_VU', label: 'Hoàn thành tốt nhiệm vụ' },
  { value: 'HOAN_THANH_NHIEM_VU', label: 'Hoàn thành nhiệm vụ' },
  { value: 'KHONG_HOAN_THANH_NHIEM_VU', label: 'Không hoàn thành nhiệm vụ' },
] as const

export const MUC_XEP_LOAI_LABEL: Record<string, string> = Object.fromEntries(
  MUC_XEP_LOAI_OPTIONS.map((o) => [o.value, o.label])
)

/** Lớp màu badge theo mức xếp loại. */
export function mucXepLoaiBadgeClass(muc: string): string {
  switch (muc) {
    case 'HOAN_THANH_XUAT_SAC_NHIEM_VU': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'HOAN_THANH_TOT_NHIEM_VU':      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'HOAN_THANH_NHIEM_VU':          return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'KHONG_HOAN_THANH_NHIEM_VU':    return 'bg-red-100 text-red-700 border-red-200'
    default:                             return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

export const HINH_THUC_KY_LUAT_OPTIONS = [
  { value: 'KHIEN_TRACH', label: 'Khiển trách' },
  { value: 'CANH_CAO', label: 'Cảnh cáo' },
  { value: 'HA_BAC_LUONG', label: 'Hạ bậc lương' },
  { value: 'GIANG_CHUC', label: 'Giáng chức' },
  { value: 'CACH_CHUC', label: 'Cách chức' },
  { value: 'BUOC_THOI_VIEC', label: 'Buộc thôi việc' },
  { value: 'KHAC', label: 'Khác' },
] as const

export const HINH_THUC_KY_LUAT_LABEL: Record<string, string> = Object.fromEntries(
  HINH_THUC_KY_LUAT_OPTIONS.map((o) => [o.value, o.label])
)

// ----- Quy trình rà soát nâng lương (Commit 4) -----
export const TRANG_THAI_RA_SOAT_LABEL: Record<string, string> = {
  DU_KIEN: 'Dự kiến',
  DANG_RA_SOAT: 'Đang rà soát',
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  DA_BAN_HANH: 'Đã ban hành',
  TU_CHOI: 'Không duyệt',
}

export function trangThaiRaSoatBadgeClass(tt: string): string {
  switch (tt) {
    case 'DU_KIEN':      return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'DANG_RA_SOAT': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'CHO_DUYET':    return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'DA_DUYET':     return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'DA_BAN_HANH':  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'TU_CHOI':      return 'bg-red-100 text-red-700 border-red-200'
    default:             return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

export const KET_LUAN_RA_SOAT_OPTIONS = [
  { value: 'DU_DIEU_KIEN', label: 'Đủ điều kiện' },
  { value: 'CHUA_DU_DIEU_KIEN', label: 'Chưa đủ điều kiện' },
  { value: 'CAN_KIEM_TRA', label: 'Cần kiểm tra thêm' },
] as const

export const KET_LUAN_RA_SOAT_LABEL: Record<string, string> = Object.fromEntries(
  KET_LUAN_RA_SOAT_OPTIONS.map((o) => [o.value, o.label])
)

export const LOAI_VAN_BAN_VPS_LABEL: Record<string, string> = {
  QD_NANG_LUONG:  'QĐ nâng lương',
  QD_KHEN_THUONG: 'QĐ khen thưởng',
  QD_KY_LUAT:     'QĐ kỷ luật',
  THONG_BAO:      'Thông báo',
  TB_NGHI_HUU:    'Thông báo nghỉ hưu',
  QD_NGHI_HUU:    'QĐ nghỉ hưu',
  KHAC:           'Khác',
}

// ─── Nghỉ phép ───────────────────────────────────────────────────────────────

export const LOAI_NGHI_PHEP_LABEL: Record<string, string> = {
  PHEP_NAM:    'Nghỉ phép năm',
  OM:          'Nghỉ ốm',
  THAI_SAN:    'Nghỉ thai sản',
  KHONG_LUONG: 'Nghỉ không lương',
  VIEC_RIENG:  'Nghỉ việc riêng',
  BU:          'Nghỉ bù',
  KHAC:        'Khác',
}

export const LOAI_NGHI_PHEP_OPTIONS = Object.entries(LOAI_NGHI_PHEP_LABEL).map(([value, label]) => ({ value, label }))

export const TRANG_THAI_NGHI_PHEP_LABEL: Record<string, string> = {
  CHO_TRUONG_PHONG: 'Chờ Trưởng phòng xem xét',
  CHO_VAN_PHONG:    'Chờ Văn phòng Sở trình',
  CHO_LANH_DAO_SO:  'Chờ Giám đốc Sở ký duyệt',
  CHO_TAI_CHINH:    'Chờ KH-TC ứng lương',
  HOAN_TAT:         'Hoàn tất',
  TU_CHOI:          'Từ chối',
  DA_HUY:           'Đã huỷ',
  // legacy
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET:  'Đã duyệt',
}

/** Nhãn ngắn cho cấp từ chối (tuChoiCap). */
export const CAP_DUYET_NGHI_PHEP_LABEL: Record<string, string> = {
  TRUONG_PHONG: 'Trưởng phòng',
  VAN_PHONG:    'Văn phòng Sở',
  LANH_DAO_SO:  'Giám đốc Sở',
  TAI_CHINH:    'Phòng KH-TC',
}

export function trangThaiNghiPhepBadgeClass(tt: string): string {
  switch (tt) {
    case 'CHO_TRUONG_PHONG': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'CHO_VAN_PHONG':    return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'CHO_LANH_DAO_SO':  return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'CHO_TAI_CHINH':    return 'bg-violet-100 text-violet-700 border-violet-200'
    case 'HOAN_TAT':         return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'DA_DUYET':         return 'bg-green-100 text-green-700 border-green-200'
    case 'CHO_DUYET':        return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'TU_CHOI':          return 'bg-red-100 text-red-700 border-red-200'
    case 'DA_HUY':           return 'bg-slate-100 text-slate-500 border-slate-200'
    default:                 return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}
