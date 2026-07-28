import { requireDeptAccess } from '@/lib/auth'

// Chặn truy cập module Phòng Kinh tế và Vật liệu xây dựng ở lớp server (DB-backed):
// admin / cán bộ thuộc phòng (to_chuc.ma = PHONG_KT_VL).
export default async function PhongKtVlLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccess('PHONG_KT_VL')
  return <>{children}</>
}
