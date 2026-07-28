import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quản lý vận tải ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_QL_VT).
export default async function PhongQlVtLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_QL_VT')
  return <>{children}</>
}
