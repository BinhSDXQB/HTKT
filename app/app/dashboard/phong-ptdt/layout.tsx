import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Phát triển đô thị ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_PTDT).
export default async function PhongPtdtLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_PTDT')
  return <>{children}</>
}
