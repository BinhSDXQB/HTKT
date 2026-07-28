import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { NewIncidentForm } from '@/components/su-co/new-incident-form'

export default async function SuCoMoiPage() {
  const user = await requireAuth()
  const [assets, wards] = await Promise.all([
    db.asset.findMany({ where: { status: 'DANG_SU_DUNG' }, orderBy: { name: 'asc' }, select: { id: true, name: true, assetCode: true, domain: true } }),
    db.administrativeUnit.findMany({ where: { type: 'PHUONG_XA', isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/su-co" className="hover:text-orange-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Sự cố</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Ghi nhận mới</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Ghi nhận sự cố</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tiếp nhận và phân loại sự cố hạ tầng kỹ thuật</p>
      </div>
      <NewIncidentForm assets={assets} wards={wards} reportedById={user.id} />
    </div>
  )
}
