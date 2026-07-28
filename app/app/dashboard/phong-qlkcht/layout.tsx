import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quản lý kết cấu hạ tầng giao thông ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_QLKCHT).
export default async function PhongQlkchtLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_QLKCHT')
  return <>{children}</>
}
