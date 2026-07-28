import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quản lý chất lượng công trình giao thông ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_CLCT).
export default async function PhongClctLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_CLCT')
  return <>{children}</>
}
