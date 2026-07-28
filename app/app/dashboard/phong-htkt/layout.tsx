import { requireHtktAccess } from '@/lib/auth'

// Chặn truy cập toàn bộ module Phòng Hạ tầng kỹ thuật ở lớp server (DB-backed):
// admin / cán bộ phòng HTKT / có quyền htkt:menu_access. Middleware đã chặn thêm ở edge.
export default async function PhongHtktLayout({ children }: { children: React.ReactNode }) {
  await requireHtktAccess()
  return <>{children}</>
}
