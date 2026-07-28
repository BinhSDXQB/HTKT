import { requireDeptAccessAny } from '@/lib/auth'

// Chặn truy cập module Trung tâm QLBT GT & HTKT ở lớp server (DB-backed):
// admin / lãnh đạo Sở / cán bộ Trung tâm (BAN_BAO_TRI_GT) / cán bộ Phòng HTKT (PHONG_HTKT).
export default async function TrungTamBaoTriLayout({ children }: { children: React.ReactNode }) {
  await requireDeptAccessAny('BAN_BAO_TRI_GT', 'PHONG_HTKT')
  return <>{children}</>
}
