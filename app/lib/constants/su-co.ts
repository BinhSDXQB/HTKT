export const INCIDENT_SOURCE_LABEL: Record<string, string> = {
  BAO_CAO_NV:   'Báo cáo nội bộ',
  PHAN_ANH_CD:  'Phản ánh công dân',
  KET_QUA_KIEM: 'Qua kiểm tra',
  HE_THONG:     'Cảnh báo hệ thống',
}

export const INCIDENT_PRIORITY_LABEL: Record<string, string> = {
  THAP:     'Thấp',
  TRUNG:    'Trung bình',
  CAO:      'Cao',
  KHAN_CAP: 'Khẩn cấp',
}

export const INCIDENT_PRIORITY_COLOR: Record<string, string> = {
  THAP:     'bg-slate-100 text-slate-600',
  TRUNG:    'bg-blue-100 text-blue-700',
  CAO:      'bg-orange-100 text-orange-700',
  KHAN_CAP: 'bg-red-100 text-red-700',
}

export const INCIDENT_STATUS_LABEL: Record<string, string> = {
  MOI:           'Mới tiếp nhận',
  DA_TIEP_NHAN:  'Đã tiếp nhận',
  DANG_XU_LY:    'Đang xử lý',
  TAM_DUNG:      'Tạm dừng',
  DA_GIAI_QUYET: 'Đã giải quyết',
  DONG:          'Đóng',
}

export const INCIDENT_STATUS_COLOR: Record<string, string> = {
  MOI:           'bg-red-100 text-red-700',
  DA_TIEP_NHAN:  'bg-orange-100 text-orange-700',
  DANG_XU_LY:    'bg-yellow-100 text-yellow-700',
  TAM_DUNG:      'bg-slate-100 text-slate-600',
  DA_GIAI_QUYET: 'bg-blue-100 text-blue-700',
  DONG:          'bg-green-100 text-green-700',
}

export const INCIDENT_PRIORITY_OPTIONS = Object.entries(INCIDENT_PRIORITY_LABEL).map(([value, label]) => ({ value, label }))
export const INCIDENT_STATUS_OPTIONS = Object.entries(INCIDENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))
export const INCIDENT_SOURCE_OPTIONS = Object.entries(INCIDENT_SOURCE_LABEL).map(([value, label]) => ({ value, label }))
