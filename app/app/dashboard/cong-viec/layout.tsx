import { redirect } from 'next/navigation'
import { requireAuth, canAccessCongViec } from '@/lib/auth'

// Module Quản lý công việc: admin + thành viên thuộc một phòng (có toChucId).
export default async function CongViecLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  if (!canAccessCongViec(user)) redirect('/forbidden')
  return <>{children}</>
}
