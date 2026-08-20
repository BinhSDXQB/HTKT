import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Settings, Users } from 'lucide-react'
import { EditUserForm } from '@/components/cai-dat/edit-user-form'
import { notFound, redirect } from 'next/navigation'

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth()
  const isAdmin = user.role?.name === 'admin'
  if (!isAdmin) redirect('/forbidden')

  const userData = await db.user.findUnique({
    where: { id },
    include: { role: { select: { id: true, name: true, displayName: true } } },
  })

  if (!userData) notFound()

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
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Sửa</span>
      </nav>
      <div><h1 className="text-xl font-bold text-slate-800">Sửa người dùng</h1></div>
      <EditUserForm user={userData} roles={roles} toChucs={toChucs} isAdmin={isAdmin} />
    </div>
  )
}
