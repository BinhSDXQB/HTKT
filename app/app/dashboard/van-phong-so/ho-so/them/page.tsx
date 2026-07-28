import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoDonViOptions } from '@/lib/office-scope'
import { CanBoProfileForm } from '@/components/van-phong-so/can-bo-profile-form'
import { Briefcase, ChevronRight, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ThemCanBoPage() {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) redirect('/dashboard/van-phong-so/ho-so')

  const [toChucOptions, chucDanhs] = await Promise.all([
    getSoDonViOptions(),
    db.chucDanh.findMany({ orderBy: { capQuanLy: 'asc' }, select: { id: true, ten: true } }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/van-phong-so/ho-so" className="hover:text-indigo-700">Hồ sơ cán bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Thêm cán bộ</span>
      </nav>

      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Thêm hồ sơ cán bộ</h1>
      </div>

      <CanBoProfileForm defaults={{}} toChucOptions={toChucOptions} chucDanhOptions={chucDanhs} />
    </div>
  )
}
