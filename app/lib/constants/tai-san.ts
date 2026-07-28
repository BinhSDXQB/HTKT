export const DOMAIN_LABEL: Record<string, string> = {
  GIAO_THONG:  'Giao thông',
  CAP_NUOC:    'Cấp nước',
  THOAT_NUOC:  'Thoát nước',
  CHIEU_SANG:  'Chiếu sáng',
  CAY_XANH:    'Cây xanh',
  MOI_TRUONG:  'Môi trường',
  CHINH_TRANG: 'Chỉnh trang',
}

export const DOMAIN_COLOR: Record<string, string> = {
  GIAO_THONG:  'bg-blue-100 text-blue-700',
  CAP_NUOC:    'bg-cyan-100 text-cyan-700',
  THOAT_NUOC:  'bg-indigo-100 text-indigo-700',
  CHIEU_SANG:  'bg-yellow-100 text-yellow-700',
  CAY_XANH:    'bg-green-100 text-green-700',
  MOI_TRUONG:  'bg-teal-100 text-teal-700',
  CHINH_TRANG: 'bg-purple-100 text-purple-700',
}

export const CONDITION_LABEL: Record<string, string> = {
  TOT:         'Tốt',
  KHA:         'Khá',
  TRUNG_BINH:  'Trung bình',
  XAU:         'Xấu',
  HONG:        'Hỏng',
}

export const CONDITION_COLOR: Record<string, string> = {
  TOT:         'bg-green-100 text-green-700',
  KHA:         'bg-blue-100 text-blue-700',
  TRUNG_BINH:  'bg-yellow-100 text-yellow-700',
  XAU:         'bg-orange-100 text-orange-700',
  HONG:        'bg-red-100 text-red-700',
}

export const STATUS_LABEL: Record<string, string> = {
  DANG_SU_DUNG:   'Đang sử dụng',
  DUNG_TAM:       'Dừng tạm thời',
  DANG_SUA_CHUA:  'Đang sửa chữa',
  NGUNG_SU_DUNG:  'Ngưng sử dụng',
  THOAI_HOA:      'Thải bỏ',
}

export const STATUS_COLOR: Record<string, string> = {
  DANG_SU_DUNG:   'bg-emerald-100 text-emerald-700',
  DUNG_TAM:       'bg-yellow-100 text-yellow-700',
  DANG_SUA_CHUA:  'bg-orange-100 text-orange-700',
  NGUNG_SU_DUNG:  'bg-slate-100 text-slate-600',
  THOAI_HOA:      'bg-red-100 text-red-700',
}

export const DOMAIN_OPTIONS = Object.entries(DOMAIN_LABEL).map(([value, label]) => ({ value, label }))
export const CONDITION_OPTIONS = Object.entries(CONDITION_LABEL).map(([value, label]) => ({ value, label }))
export const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))
