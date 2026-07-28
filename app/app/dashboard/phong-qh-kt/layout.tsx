import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Quy hoạch - Kiến trúc ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_QH_KT).
export default async function PhongQhKtLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_QH_KT')
  return <>{children}</>
}
