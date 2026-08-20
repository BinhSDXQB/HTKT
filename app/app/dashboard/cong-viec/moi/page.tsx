import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { CongViecCreateForm } from '@/components/cong-viec/create-form'

export const dynamic = 'force-dynamic'

export default async function CongViecCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ tieuDe?: string; moTa?: string }>
}) {
  const user = await requireAuth()
  const sp = await searchParams

  const loais = await db.congViecLoai.findMany({
    where: { isActive: true, OR: [{ toChucId: null }, ...(user.toChucId ? [{ toChucId: user.toChucId }] : [])] },
    select: { id: true, ten: true },
    orderBy: { thuTu: 'asc' },
  })
  const members = user.toChucId
    ? await db.user.findMany({ where: { toChucId: user.toChucId, isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
    : []
  // Admin/Lãnh đạo Sở (không gắn phòng) chọn phòng cho việc
  const phongs = !user.toChucId
    ? await db.toChuc.findMany({ where: { isActive: true, loai: { in: ['PHONG', 'VAN_PHONG', 'BAN'] } }, select: { id: true, ten: true }, orderBy: [{ thuTu: 'asc' }, { ten: 'asc' }] })
    : []

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/cong-viec" className="hover:text-blue-700">Quản lý công việc</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Tạo công việc</span>
      </nav>
      <h1 className="text-lg font-bold text-slate-900 mb-4">Tạo công việc mới</h1>
      <CongViecCreateForm
        loais={loais}
        members={members}
        phongs={phongs}
        hasPhong={!!user.toChucId}
        initialTieuDe={sp.tieuDe ?? ''}
        initialMoTa={sp.moTa ?? ''}
      />
    </div>
  )
}
