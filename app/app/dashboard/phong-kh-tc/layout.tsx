import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Kế hoạch - Tài chính ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_KH_TC).
export default async function PhongKhTcLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_KH_TC')
  return <>{children}</>
}
