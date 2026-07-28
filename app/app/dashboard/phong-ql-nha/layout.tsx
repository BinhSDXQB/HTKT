import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quản lý nhà và thị trường bất động sản ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_QL_NHA).
export default async function PhongQlNhaLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_QL_NHA')
  return <>{children}</>
}
