import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'
import { WO_STATUS_LABEL, WO_STATUS_COLOR, WO_TYPE_LABEL, WO_PRIORITY_LABEL, WO_PRIORITY_COLOR } from '@/lib/constants/phieu-cv'
import { UpdateWOStatusForm } from '@/components/phieu-cv/update-status-form'

export default async function PhieuCVChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const wo = await db.workOrder.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, name: true, assetCode: true } },
      incident: { select: { id: true, incidentCode: true, title: true } },
      executingUnit: { select: { name: true } },
      assignedTo: { select: { name: true } },
      createdBy: { select: { name: true } },
      materials: { include: { material: { select: { name: true, unit: true } } } },
    },
  })
  if (!wo) notFound()

  const totalMaterialCost = wo.materials.reduce((s, m) => s + (m.totalPrice ?? 0), 0)

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/phieu-cong-viec" className="hover:text-yellow-700 flex items-center gap-1"><Wrench className="w-3.5 h-3.5" />Phiếu công việc</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">{wo.workOrderCode}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{wo.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{wo.workOrderCode}</span>
            <Badge className={`text-xs ${DOMAIN_COLOR[wo.domain]}`}>{DOMAIN_LABEL[wo.domain]}</Badge>
            <Badge className={`text-xs ${WO_PRIORITY_COLOR[wo.priority]}`}>{WO_PRIORITY_LABEL[wo.priority]}</Badge>
            <Badge className={`text-xs ${WO_STATUS_COLOR[wo.status]}`}>{WO_STATUS_LABEL[wo.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4">Chi tiết phiếu</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Loại công việc</dt><dd className="mt-0.5 text-slate-700">{WO_TYPE_LABEL[wo.type]}</dd></div>
              <div><dt className="text-xs text-slate-400">Tài sản</dt><dd className="mt-0.5">{wo.asset ? <Link href={`/dashboard/tai-san/${wo.asset.id}`} className="text-blue-600 hover:underline">{wo.asset.name}</Link> : '—'}</dd></div>
              {wo.incident && <div><dt className="text-xs text-slate-400">Sự cố liên quan</dt><dd className="mt-0.5"><Link href={`/dashboard/su-co/${wo.incident.id}`} className="text-blue-600 hover:underline">{wo.incident.incidentCode}</Link></dd></div>}
              <div><dt className="text-xs text-slate-400">Đơn vị thực hiện</dt><dd className="mt-0.5 text-slate-700">{wo.executingUnit?.name ?? wo.assignedTo?.name ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Người tạo</dt><dd className="mt-0.5 text-slate-700">{wo.createdBy.name}</dd></div>
              <div><dt className="text-xs text-slate-400">Ngày kế hoạch</dt><dd className="mt-0.5 text-slate-700">{wo.plannedStart ? format(wo.plannedStart, 'dd/MM/yyyy', { locale: vi }) : '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Hạn hoàn thành</dt><dd className="mt-0.5 text-slate-700">{wo.plannedEnd ? format(wo.plannedEnd, 'dd/MM/yyyy', { locale: vi }) : '—'}</dd></div>
              {wo.actualStart && <div><dt className="text-xs text-slate-400">Bắt đầu thực tế</dt><dd className="mt-0.5 text-slate-700">{format(wo.actualStart, 'dd/MM/yyyy', { locale: vi })}</dd></div>}
              {wo.actualEnd && <div><dt className="text-xs text-slate-400">Kết thúc thực tế</dt><dd className="mt-0.5 text-slate-700">{format(wo.actualEnd, 'dd/MM/yyyy', { locale: vi })}</dd></div>}
              <div><dt className="text-xs text-slate-400">Chi phí ước tính</dt><dd className="mt-0.5 text-slate-700">{wo.estimatedCost?.toLocaleString('vi') ?? '—'} đ</dd></div>
              <div><dt className="text-xs text-slate-400">Chi phí thực tế</dt><dd className="mt-0.5 font-semibold text-slate-800">{wo.actualCost?.toLocaleString('vi') ?? '—'} đ</dd></div>
            </dl>
            {wo.description && <div className="mt-4 pt-4 border-t"><p className="text-xs text-slate-400 mb-1">Nội dung công việc</p><p className="text-sm text-slate-700 whitespace-pre-line">{wo.description}</p></div>}
            {wo.resolution && <div className="mt-3"><p className="text-xs text-slate-400 mb-1">Kết quả xử lý</p><p className="text-sm text-slate-700 whitespace-pre-line">{wo.resolution}</p></div>}
          </div>

          {wo.materials.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-3">Vật tư sử dụng</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-slate-500 border-b"><th className="pb-2 text-left">Tên vật tư</th><th className="pb-2 text-right">SL</th><th className="pb-2 text-right">Đơn vị</th><th className="pb-2 text-right">Thành tiền</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {wo.materials.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2">{m.name}</td>
                      <td className="py-2 text-right">{m.quantity}</td>
                      <td className="py-2 text-right text-slate-500">{m.unit}</td>
                      <td className="py-2 text-right">{m.totalPrice?.toLocaleString('vi') ?? '—'} đ</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t font-semibold"><td colSpan={3} className="pt-2">Tổng</td><td className="pt-2 text-right">{totalMaterialCost.toLocaleString('vi')} đ</td></tr></tfoot>
              </table>
            </div>
          )}
        </div>
        <div><UpdateWOStatusForm workOrderId={id} currentStatus={wo.status} /></div>
      </div>
    </div>
  )
}
