import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Settings, Users } from 'lucide-react'
import { NewUserForm } from '@/components/cai-dat/new-user-form'

export default async function UserMoiPage() {
  await requireAuth()
  const roles = await db.role.findMany({ orderBy: { name: 'asc' } })
  // Chi lay don vi cap 2 dang hoat dong: Lanh dao So / Van phong / Phong chuyen mon /
  // Don vi truc thuoc (trung tam, ban, vien, truong).
  const toChucs = await db.toChuc.findMany({
    where: { isActive: true, cap: 2 },
    select: { id: true, ten: true, tenVietTat: true, loai: true },
    orderBy: [{ loai: 'asc' }, { thuTu: 'asc' }],
  })
  return (
    <div className="max-w-lg space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cai-dat" className="hover:text-blue-700 flex items-center gap-1"><Settings className="w-3.5 h-3.5" />Quản trị</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cai-dat/users" className="hover:text-blue-700 flex items-center gap-1"><Users className="w-3.5 h-3.5" />Người dùng</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Thêm mới</span>
      </nav>
      <div><h1 className="text-xl font-bold text-slate-800">Thêm người dùng</h1></div>
      <NewUserForm roles={roles} toChucs={toChucs} />
    </div>
  )
}
