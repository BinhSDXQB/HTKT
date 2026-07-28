// Nhãn & màu hiển thị cho module Quản lý công việc (dùng chung client + server).

export const CONG_VIEC_TRANG_THAI: Record<string, { label: string; cls: string }> = {
  MOI:        { label: 'Mới',          cls: 'bg-slate-100 text-slate-700' },
  DANG_LAM:   { label: 'Đang làm',     cls: 'bg-blue-100 text-blue-700' },
  TAM_DUNG:   { label: 'Tạm dừng',     cls: 'bg-amber-100 text-amber-700' },
  CHO_DUYET:  { label: 'Chờ duyệt',    cls: 'bg-violet-100 text-violet-700' },
  HOAN_THANH: { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  HUY:        { label: 'Huỷ',          cls: 'bg-red-100 text-red-600' },
}
export const TRANG_THAI_OPTIONS = Object.entries(CONG_VIEC_TRANG_THAI).map(([value, v]) => ({ value, label: v.label }))

export const CONG_VIEC_UU_TIEN: Record<string, { label: string; cls: string }> = {
  THAP:        { label: 'Thấp',       cls: 'bg-slate-100 text-slate-600' },
  TRUNG_BINH:  { label: 'Trung bình', cls: 'bg-sky-100 text-sky-700' },
  CAO:         { label: 'Cao',        cls: 'bg-orange-100 text-orange-700' },
  KHAN_CAP:    { label: 'Khẩn cấp',   cls: 'bg-red-100 text-red-700' },
}
export const UU_TIEN_OPTIONS = Object.entries(CONG_VIEC_UU_TIEN).map(([value, v]) => ({ value, label: v.label }))

export const VAI_TRO_LABEL: Record<string, string> = {
  CHU_TRI: 'Chủ trì', PHOI_HOP: 'Phối hợp', THEO_DOI: 'Theo dõi',
}
export const VAI_TRO_OPTIONS = Object.entries(VAI_TRO_LABEL).map(([value, label]) => ({ value, label }))

export const NHAT_KY_LABEL: Record<string, string> = {
  TAO: 'Tạo việc', DOI_TRANG_THAI: 'Đổi trạng thái', CAP_NHAT_TIEN_DO: 'Cập nhật tiến độ',
  BINH_LUAN: 'Bình luận', GIAO_VIEC: 'Giao việc', DINH_KEM: 'Đính kèm', KHAC: 'Khác',
}
