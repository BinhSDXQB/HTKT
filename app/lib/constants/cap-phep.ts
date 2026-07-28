// Module 9 — Cấp phép, chấp thuận kết cấu hạ tầng đường bộ

export const ROAD_PERMIT_STATUS_LABEL: Record<string, string> = {
  TAO_MOI:        'Tạo mới',
  DA_TIEP_NHAN:   'Đã tiếp nhận',
  CHO_BO_SUNG:    'Chờ bổ sung',
  KIEM_TRA_HO_SO: 'Kiểm tra hồ sơ',
  KIEM_TRA_GIS:   'Kiểm tra GIS/hiện trường',
  DANG_THAM_DINH: 'Đang thẩm định',
  DE_NGHI_CAP:    'Đề nghị cấp phép',
  DA_CAP_PHEP:    'Đã cấp phép',
  TU_CHOI:        'Từ chối',
  DANG_THI_CONG:  'Đang thi công',
  HOAN_THANH:     'Hoàn thành',
  HET_HAN:        'Hết hạn',
  THU_HOI:        'Thu hồi/Huỷ',
}

export const ROAD_PERMIT_STATUS_COLOR: Record<string, string> = {
  TAO_MOI:        'bg-slate-100 text-slate-600',
  DA_TIEP_NHAN:   'bg-blue-100 text-blue-700',
  CHO_BO_SUNG:    'bg-amber-100 text-amber-700',
  KIEM_TRA_HO_SO: 'bg-indigo-100 text-indigo-700',
  KIEM_TRA_GIS:   'bg-cyan-100 text-cyan-700',
  DANG_THAM_DINH: 'bg-yellow-100 text-yellow-700',
  DE_NGHI_CAP:    'bg-purple-100 text-purple-700',
  DA_CAP_PHEP:    'bg-green-100 text-green-700',
  TU_CHOI:        'bg-red-100 text-red-700',
  DANG_THI_CONG:  'bg-orange-100 text-orange-700',
  HOAN_THANH:     'bg-emerald-100 text-emerald-700',
  HET_HAN:        'bg-slate-200 text-slate-600',
  THU_HOI:        'bg-rose-100 text-rose-700',
}

export const OVERSIZED_PERMIT_TYPE_LABEL: Record<string, string> = {
  QUA_KHO:     'Quá khổ giới hạn',
  QUA_TAI:     'Quá tải trọng',
  BANH_XICH:   'Xe bánh xích',
  SIEU_TRUONG: 'Hàng siêu trường',
  SIEU_TRONG:  'Hàng siêu trọng',
}

export const CONNECTION_TYPE_LABEL: Record<string, string> = {
  CHINH_THUC: 'Đấu nối chính thức',
  TAM_THOI:   'Đấu nối tạm thời',
}

export const CONNECTION_TYPE_COLOR: Record<string, string> = {
  CHINH_THUC: 'bg-blue-100 text-blue-700',
  TAM_THOI:   'bg-amber-100 text-amber-700',
}

export const CONNECTION_STAGE_LABEL: Record<string, string> = {
  CHAP_THUAN_VI_TRI:   'Chấp thuận vị trí',
  CHAP_THUAN_THIET_KE: 'Chấp thuận thiết kế',
  CAP_PHEP_THI_CONG:   'Cấp phép thi công',
}

export const APPLICANT_TYPE_LABEL: Record<string, string> = {
  TO_CHUC: 'Tổ chức',
  CA_NHAN: 'Cá nhân',
}

export const ROAD_CLASS_LABEL: Record<string, string> = {
  QUOC_LO:           'Quốc lộ',
  DUONG_TINH:        'Đường tỉnh',
  DUONG_HUYEN:       'Đường huyện',
  DUONG_DO_THI:      'Đường đô thị',
  DUONG_XA:          'Đường xã',
  DUONG_CHUYEN_DUNG: 'Đường chuyên dùng',
}

// Cảnh báo chồng lấn vị trí đấu nối
export const OVERLAP_WARNING_LABEL: Record<string, string> = {
  HANH_LANG:    'Hành lang ATĐB',
  VIA_HE:       'Vỉa hè',
  LONG_DUONG:   'Lòng đường',
  THOAT_NUOC:   'Thoát nước',
  CAY_XANH:     'Cây xanh',
  CHIEU_SANG:   'Chiếu sáng',
  BIEN_BAO:     'Biển báo',
  HA_TANG_NGAM: 'Hạ tầng ngầm',
}

export const ROAD_PERMIT_STATUS_OPTIONS = Object.entries(ROAD_PERMIT_STATUS_LABEL).map(([value, label]) => ({ value, label }))
export const OVERSIZED_PERMIT_TYPE_OPTIONS = Object.entries(OVERSIZED_PERMIT_TYPE_LABEL).map(([value, label]) => ({ value, label }))
export const CONNECTION_TYPE_OPTIONS = Object.entries(CONNECTION_TYPE_LABEL).map(([value, label]) => ({ value, label }))
export const CONNECTION_STAGE_OPTIONS = Object.entries(CONNECTION_STAGE_LABEL).map(([value, label]) => ({ value, label }))
export const APPLICANT_TYPE_OPTIONS = Object.entries(APPLICANT_TYPE_LABEL).map(([value, label]) => ({ value, label }))
export const ROAD_CLASS_OPTIONS = Object.entries(ROAD_CLASS_LABEL).map(([value, label]) => ({ value, label }))
export const OVERLAP_WARNING_OPTIONS = Object.entries(OVERLAP_WARNING_LABEL).map(([value, label]) => ({ value, label }))
