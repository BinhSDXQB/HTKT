import { redirect } from 'next/navigation'

// Quản lý nghỉ phép đã chuyển sang khu vực dùng chung cho mọi cán bộ (tự tạo đơn + ký số đa cấp).
export default function NghiPhepRedirect() {
  redirect('/dashboard/nghi-phep')
}
