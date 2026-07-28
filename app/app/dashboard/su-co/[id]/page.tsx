import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, AlertTriangle, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'
import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_COLOR, INCIDENT_PRIORITY_LABEL, INCIDENT_PRIORITY_COLOR, INCIDENT_SOURCE_LABEL } from '@/lib/constants/su-co'
import { WO_STATUS_LABEL, WO_STATUS_COLOR } from '@/lib/constants/phieu-cv'
import { UpdateIncidentStatusForm } from '@/components/su-co/update-status-form'

export default async function SuCoChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const inc = await db.incident.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, name: true, assetCode: true } },
      ward: { select: { name: true } },
      reportedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
      workOrders: { orderBy: { createdAt: 'desc' }, select: { id: true, workOrderCode: true, title: true, status: true } },
    },
  })
  if (!inc) notFound()

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/su-co" className="hover:text-orange-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Sự cố</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium truncate">{inc.title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{inc.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{inc.incidentCode}</span>
            <Badge className={`text-xs ${DOMAIN_COLOR[inc.domain]}`}>{DOMAIN_LABEL[inc.domain]}</Badge>
            <Badge className={`text-xs ${INCIDENT_PRIORITY_COLOR[inc.priority]}`}>{INCIDENT_PRIORITY_LABEL[inc.priority]}</Badge>
            <Badge className={`text-xs ${INCIDENT_STATUS_COLOR[inc.status]}`}>{INCIDENT_STATUS_LABEL[inc.status]}</Badge>
          </div>
        </div>
        <Link href={`/dashboard/phieu-cong-viec/moi?incidentId=${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-blue-600 hover:text-blue-700">
            <Wrench className="w-3.5 h-3.5" />Tạo phiếu CV
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4">Chi tiết sự cố</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Nguồn</dt><dd className="mt-0.5 text-slate-700">{INCIDENT_SOURCE_LABEL[inc.source]}</dd></div>
              <div><dt className="text-xs text-slate-400">Tài sản</dt><dd className="mt-0.5">{inc.asset ? <Link href={`/dashboard/tai-san/${inc.asset.id}`} className="text-blue-600 hover:underline">{inc.asset.name}</Link> : '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Địa chỉ</dt><dd className="mt-0.5 text-slate-700">{inc.address || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Phường / Xã</dt><dd className="mt-0.5 text-slate-700">{inc.ward?.name || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Người báo cáo</dt><dd className="mt-0.5 text-slate-700">{inc.reportedBy?.name || inc.reporterName || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">SĐT người báo</dt><dd className="mt-0.5 text-slate-700">{inc.reporterPhone || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Ngày báo cáo</dt><dd className="mt-0.5 text-slate-700">{format(inc.reportedAt, 'dd/MM/yyyy HH:mm', { locale: vi })}</dd></div>
              {inc.deadlineAt && <div><dt className="text-xs text-slate-400">Hạn xử lý</dt><dd className="mt-0.5 text-slate-700">{format(inc.deadlineAt, 'dd/MM/yyyy', { locale: vi })}</dd></div>}
              {inc.resolvedAt && <div><dt className="text-xs text-slate-400">Ngày giải quyết</dt><dd className="mt-0.5 text-slate-700">{format(inc.resolvedAt, 'dd/MM/yyyy', { locale: vi })}</dd></div>}
            </dl>
            {inc.description && <div className="mt-4 pt-4 border-t"><p className="text-xs text-slate-400 mb-1">Mô tả</p><p className="text-sm text-slate-700 whitespace-pre-line">{inc.description}</p></div>}
            {inc.notes && <div className="mt-3"><p className="text-xs text-slate-400 mb-1">Ghi chú</p><p className="text-sm text-slate-700">{inc.notes}</p></div>}
          </div>

          {/* Phiếu công việc */}
          {inc.workOrders.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-slate-400" />Phiếu công việc liên quan</h3>
              <div className="space-y-2">
                {inc.workOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <Link href={`/dashboard/phieu-cong-viec/${wo.id}`} className="text-sm text-blue-600 hover:underline font-medium">{wo.workOrderCode}</Link>
                      <p className="text-xs text-slate-500">{wo.title}</p>
                    </div>
                    <Badge className={`text-xs ${WO_STATUS_COLOR[wo.status]}`}>{WO_STATUS_LABEL[wo.status]}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cập nhật trạng thái */}
        <div>
          <UpdateIncidentStatusForm incidentId={id} currentStatus={inc.status} />
        </div>
      </div>
    </div>
  )
}
