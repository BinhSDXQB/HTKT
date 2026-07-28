import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, GitMerge } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ROAD_PERMIT_STATUS_LABEL, ROAD_PERMIT_STATUS_COLOR,
  CONNECTION_TYPE_LABEL, CONNECTION_TYPE_COLOR, CONNECTION_STAGE_LABEL,
  APPLICANT_TYPE_LABEL, ROAD_CLASS_LABEL, OVERLAP_WARNING_LABEL,
} from '@/lib/constants/cap-phep'
import { UpdateStatusForm } from '@/components/cap-phep/update-status-form'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 text-right">{value ?? '—'}</span>
    </div>
  )
}

export default async function DauNoiChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const a = await db.roadConnectionApplication.findUnique({
    where: { id },
    include: {
      locations: { orderBy: { createdAt: 'asc' } },
      inspections: { orderBy: { inspectedAt: 'desc' } },
      permits: { orderBy: { createdAt: 'desc' } },
      statusLogs: { orderBy: { changedAt: 'desc' } },
    },
  })
  if (!a) notFound()

  return (
    <div className="max-w-5xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cap-phep/dau-noi" className="hover:text-teal-600">Đấu nối, nút giao</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium font-mono">{a.fileCode}</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><GitMerge className="w-5 h-5 text-blue-600" />{a.applicantName}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{a.fileCode}</span>
          <Badge className={`text-xs ${CONNECTION_TYPE_COLOR[a.connectionType]}`}>{CONNECTION_TYPE_LABEL[a.connectionType]}</Badge>
          <Badge className="text-xs bg-slate-100 text-slate-600">{CONNECTION_STAGE_LABEL[a.stage]}</Badge>
          <Badge className={`text-xs ${ROAD_PERMIT_STATUS_COLOR[a.status]}`}>{ROAD_PERMIT_STATUS_LABEL[a.status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Thông tin hồ sơ</h3>
            <Row label="Đối tượng" value={APPLICANT_TYPE_LABEL[a.applicantType]} />
            <Row label="Điện thoại" value={a.applicantPhone} />
            <Row label="Dự án / công trình" value={a.projectName} />
            <Row label="Tuyến đường" value={a.roadName} />
            <Row label="Cấp đường" value={a.roadClass ? ROAD_CLASS_LABEL[a.roadClass] : null} />
            <Row label="Lý trình" value={a.km != null ? `Km ${a.km}` : null} />
            <Row label="Toạ độ" value={a.latitude != null && a.longitude != null ? `${a.latitude}, ${a.longitude}` : null} />
            <Row label="Mục đích" value={a.purpose} />
            <Row label="Thiết kế" value={a.designNote} />
            <Row label="PA tổ chức GT" value={a.trafficPlan} />
          </div>

          {a.locations.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Vị trí GIS đấu nối</h3>
              <div className="space-y-3">
                {a.locations.map((loc) => (
                  <div key={loc.id} className="text-sm border rounded-lg p-3">
                    <p className="font-medium text-slate-700">{loc.label || 'Vị trí'}{loc.km != null ? ` — Km ${loc.km}` : ''}</p>
                    {loc.latitude != null && loc.longitude != null && <p className="text-xs text-slate-400">{loc.latitude}, {loc.longitude}</p>}
                    {loc.overlapWarnings.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {loc.overlapWarnings.map((w) => <Badge key={w} className="text-[10px] bg-amber-100 text-amber-700">⚠ {OVERLAP_WARNING_LABEL[w] ?? w}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.inspections.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Phiếu thẩm định / kiểm tra</h3>
              <div className="space-y-2">
                {a.inspections.map((ins) => (
                  <div key={ins.id} className="text-sm border-l-2 border-blue-200 pl-3">
                    <p className="font-medium text-slate-700">{ins.inspectionType}</p>
                    {ins.result && <p className="text-slate-500 text-xs">{ins.result}</p>}
                    <p className="text-xs text-slate-400">{format(ins.inspectedAt, 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.permits.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Văn bản chấp thuận / giấy phép</h3>
              <div className="space-y-2">
                {a.permits.map((pm) => (
                  <div key={pm.id} className="text-sm flex justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-slate-700">{CONNECTION_STAGE_LABEL[pm.stage]}</p>
                      {pm.permitNumber && <p className="text-xs text-slate-500">Số: {pm.permitNumber}</p>}
                    </div>
                    {pm.issuedAt && <span className="text-xs text-slate-400">{format(pm.issuedAt, 'dd/MM/yyyy', { locale: vi })}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <UpdateStatusForm kind="connection" id={a.id} currentStatus={a.status} />

          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử xử lý</h3>
            {a.statusLogs.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có lịch sử.</p>
            ) : (
              <ol className="space-y-3">
                {a.statusLogs.map((log) => (
                  <li key={log.id} className="text-xs border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {log.fromStatus && <span className="text-slate-400">{ROAD_PERMIT_STATUS_LABEL[log.fromStatus]} →</span>}
                      <Badge className={`text-[10px] ${ROAD_PERMIT_STATUS_COLOR[log.toStatus]}`}>{ROAD_PERMIT_STATUS_LABEL[log.toStatus]}</Badge>
                    </div>
                    {log.note && <p className="text-slate-500 mt-1">{log.note}</p>}
                    <p className="text-slate-400 mt-0.5">{format(log.changedAt, 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
