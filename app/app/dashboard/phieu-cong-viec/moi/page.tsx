import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Wrench } from 'lucide-react'
import { NewWorkOrderForm } from '@/components/phieu-cv/new-work-order-form'

export default async function PhieuCVMoiPage({ searchParams }: { searchParams: Promise<{ incidentId?: string; assetId?: string }> }) {
  const user = await requireAuth()
  const sp = await searchParams

  const [assets, executingUnits, incidents] = await Promise.all([
    db.asset.findMany({ where: { status: 'DANG_SU_DUNG' }, orderBy: { name: 'asc' }, select: { id: true, name: true, assetCode: true, domain: true } }),
    db.executingUnit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.incident.findMany({ where: { status: { in: ['MOI', 'DA_TIEP_NHAN', 'DANG_XU_LY'] } }, orderBy: { reportedAt: 'desc' }, take: 50, select: { id: true, incidentCode: true, title: true } }),
  ])

  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/phieu-cong-viec" className="hover:text-yellow-700 flex items-center gap-1"><Wrench className="w-3.5 h-3.5" />Phiếu công việc</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Tạo mới</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tạo phiếu công việc</h1>
        <p className="text-sm text-slate-500 mt-0.5">Lập lệnh bảo trì, sửa chữa hoặc kiểm tra</p>
      </div>
      <NewWorkOrderForm
        assets={assets}
        executingUnits={executingUnits}
        incidents={incidents}
        createdById={user.id}
        defaultAssetId={sp.assetId}
        defaultIncidentId={sp.incidentId}
      />
    </div>
  )
}
