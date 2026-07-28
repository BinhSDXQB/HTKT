import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ROAD_PERMIT_STATUS_LABEL, ROAD_PERMIT_STATUS_COLOR,
  OVERSIZED_PERMIT_TYPE_LABEL, APPLICANT_TYPE_LABEL,
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

export default async function XeQuaKhoChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const p = await db.oversizedVehiclePermit.findUnique({
    where: { id },
    include: {
      vehicle: true,
      routes: { orderBy: { sequence: 'asc' } },
      statusLogs: { orderBy: { changedAt: 'desc' } },
    },
  })
  if (!p) notFound()

  return (
    <div className="max-w-5xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cap-phep/xe-qua-kho" className="hover:text-teal-600">Xe quá khổ, quá tải</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium font-mono">{p.fileCode}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Truck className="w-5 h-5 text-teal-600" />{p.applicantName}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.fileCode}</span>
            <Badge className="text-xs bg-teal-50 text-teal-700">{OVERSIZED_PERMIT_TYPE_LABEL[p.permitType]}</Badge>
            <Badge className={`text-xs ${ROAD_PERMIT_STATUS_COLOR[p.status]}`}>{ROAD_PERMIT_STATUS_LABEL[p.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Thông tin đề nghị</h3>
            <Row label="Đối tượng" value={APPLICANT_TYPE_LABEL[p.applicantType]} />
            <Row label="Điện thoại" value={p.applicantPhone} />
            <Row label="Địa chỉ" value={p.applicantAddress} />
            <Row label="Loại hàng" value={p.cargoType} />
            <Row label="Tổng trọng lượng" value={p.totalWeightTon != null ? `${p.totalWeightTon} tấn` : null} />
            <Row label="Tải trọng trục" value={p.axleLoadTon != null ? `${p.axleLoadTon} tấn` : null} />
            <Row label="Kích thước bao (D×R×C)" value={[p.overallLengthM, p.overallWidthM, p.overallHeightM].every((v) => v == null) ? null : `${p.overallLengthM ?? '?'} × ${p.overallWidthM ?? '?'} × ${p.overallHeightM ?? '?'} m`} />
            <Row label="Tuyến lưu hành" value={p.travelFrom || p.travelTo ? `${p.travelFrom ?? '?'} → ${p.travelTo ?? '?'}` : null} />
            <Row label="Thời gian lưu hành" value={p.validFrom || p.validTo ? `${p.validFrom ? format(p.validFrom, 'dd/MM/yyyy', { locale: vi }) : '?'} → ${p.validTo ? format(p.validTo, 'dd/MM/yyyy', { locale: vi }) : '?'}` : null} />
            <Row label="Xe dẫn đường/hộ tống" value={p.needEscort ? 'Có' : 'Không'} />
          </div>

          {p.vehicle && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Phương tiện</h3>
              <Row label="Biển số" value={p.vehicle.plateNumber} />
              <Row label="Chủ xe" value={p.vehicle.ownerName} />
              <Row label="Nhãn hiệu / loại" value={[p.vehicle.brand, p.vehicle.vehicleType].filter(Boolean).join(' / ') || null} />
              <Row label="Số trục" value={p.vehicle.axleCount} />
              <Row label="Tải trọng thiết kế / đăng kiểm" value={p.vehicle.designLoadTon || p.vehicle.registeredLoadTon ? `${p.vehicle.designLoadTon ?? '?'} / ${p.vehicle.registeredLoadTon ?? '?'} tấn` : null} />
            </div>
          )}

          {p.appraisalNote && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Ý kiến thẩm định</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.appraisalNote}</p>
            </div>
          )}

          {(p.permitNumber || p.issuedAt) && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Giấy phép</h3>
              <Row label="Số giấy phép" value={p.permitNumber} />
              <Row label="Ngày cấp" value={p.issuedAt ? format(p.issuedAt, 'dd/MM/yyyy', { locale: vi }) : null} />
              <Row label="Thời hạn đến" value={p.permitValidTo ? format(p.permitValidTo, 'dd/MM/yyyy', { locale: vi }) : null} />
              <Row label="Điều kiện" value={p.conditions} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <UpdateStatusForm kind="oversized" id={p.id} currentStatus={p.status} />

          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử xử lý</h3>
            {p.statusLogs.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có lịch sử.</p>
            ) : (
              <ol className="space-y-3">
                {p.statusLogs.map((log) => (
                  <li key={log.id} className="text-xs border-l-2 border-teal-200 pl-3">
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
