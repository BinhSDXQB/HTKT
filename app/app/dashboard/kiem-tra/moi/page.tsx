import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { NewInspectionForm } from '@/components/kiem-tra/new-inspection-form'

export default async function KiemTraMoiPage() {
  const user = await requireAuth()
  const [assets, templates] = await Promise.all([
    db.asset.findMany({ where: { status: 'DANG_SU_DUNG' }, orderBy: { name: 'asc' }, select: { id: true, name: true, assetCode: true, domain: true } }),
    db.inspectionTemplate.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, domain: true } }),
  ])

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/kiem-tra" className="hover:text-indigo-600 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />Kiểm tra</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Lập phiếu mới</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Lập phiếu kiểm tra</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tạo phiếu kiểm tra hiện trạng tài sản hạ tầng</p>
      </div>
      <NewInspectionForm assets={assets} templates={templates} defaultInspectorId={user.id} />
    </div>
  )
}
