import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quản lý hoạt động xây dựng ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_QLHD_XD).
export default async function PhongQlhdXdLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_QLHD_XD')
  return <>{children}</>
}
