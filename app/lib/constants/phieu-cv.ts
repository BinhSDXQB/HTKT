export const WO_TYPE_LABEL: Record<string, string> = {
  BAO_TRI_DINH_KY: 'Bảo trì định kỳ',
  SUA_CHUA:        'Sửa chữa đột xuất',
  KIEM_TRA:        'Kiểm tra, quan trắc',
  NAO_VET:         'Nạo vét',
  THAY_THE:        'Thay thế thiết bị',
  CAI_TAO:         'Cải tạo, nâng cấp',
}

export const WO_STATUS_LABEL: Record<string, string> = {
  MOI:             'Mới tạo',
  DA_GIAO:         'Đã giao',
  DANG_THUC_HIEN:  'Đang thực hiện',
  TAM_DUNG:        'Tạm dừng',
  HOAN_THANH:      'Hoàn thành',
  NGHIEM_THU:      'Đã nghiệm thu',
  HUY:             'Huỷ',
}

export const WO_STATUS_COLOR: Record<string, string> = {
  MOI:             'bg-slate-100 text-slate-700',
  DA_GIAO:         'bg-blue-100 text-blue-700',
  DANG_THUC_HIEN:  'bg-yellow-100 text-yellow-700',
  TAM_DUNG:        'bg-orange-100 text-orange-700',
  HOAN_THANH:      'bg-green-100 text-green-700',
  NGHIEM_THU:      'bg-emerald-100 text-emerald-700',
  HUY:             'bg-red-100 text-red-700',
}

export const WO_PRIORITY_LABEL: Record<string, string> = {
  THAP:     'Thấp',
  TRUNG:    'Trung bình',
  CAO:      'Cao',
  KHAN_CAP: 'Khẩn cấp',
}

export const WO_PRIORITY_COLOR: Record<string, string> = {
  THAP:     'bg-slate-100 text-slate-600',
  TRUNG:    'bg-blue-100 text-blue-700',
  CAO:      'bg-orange-100 text-orange-700',
  KHAN_CAP: 'bg-red-100 text-red-700',
}

export const WO_TYPE_OPTIONS = Object.entries(WO_TYPE_LABEL).map(([value, label]) => ({ value, label }))
export const WO_STATUS_OPTIONS = Object.entries(WO_STATUS_LABEL).map(([value, label]) => ({ value, label }))
export const WO_PRIORITY_OPTIONS = Object.entries(WO_PRIORITY_LABEL).map(([value, label]) => ({ value, label }))
