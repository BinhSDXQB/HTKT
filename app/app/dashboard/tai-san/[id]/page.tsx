import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2, ChevronRight, Pencil, MapPin, Wrench,
  AlertTriangle, ClipboardList, Info,
} from 'lucide-react'
import { DOMAIN_LABEL, CONDITION_LABEL, STATUS_LABEL, DOMAIN_COLOR, CONDITION_COLOR, STATUS_COLOR } from '@/lib/constants/tai-san'
import { DeleteAssetButton } from '@/components/tai-san/delete-asset-button'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function TaiSanChiTietPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const asset = await db.asset.findUnique({
    where: { id },
    include: {
      assetType: true,
      ward: { select: { name: true } },
      street: { select: { name: true } },
    },
  })

  if (!asset) notFound()

  const [recentWorkOrders, recentIncidents, recentInspections] = await Promise.all([
    db.workOrder.findMany({
      where: { assetId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, workOrderCode: true, title: true, status: true, plannedStart: true },
    }),
    db.incident.findMany({
      where: { assetId: id },
      orderBy: { reportedAt: 'desc' },
      take: 5,
      select: { id: true, incidentCode: true, title: true, status: true, priority: true, reportedAt: true },
    }),
    db.inspection.findMany({
      where: { assetId: id },
      orderBy: { scheduledDate: 'desc' },
      take: 5,
      select: { id: true, inspectionCode: true, scheduledDate: true, status: true, conditionAfter: true },
    }),
  ])

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          Tài sản hạ tầng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium truncate">{asset.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{asset.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{asset.assetCode}</span>
            <Badge className={`text-xs ${DOMAIN_COLOR[asset.domain]}`}>{DOMAIN_LABEL[asset.domain]}</Badge>
            <Badge className={`text-xs ${CONDITION_COLOR[asset.condition]}`}>{CONDITION_LABEL[asset.condition]}</Badge>
            <Badge className={`text-xs ${STATUS_COLOR[asset.status]}`}>{STATUS_LABEL[asset.status]}</Badge>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/tai-san/${id}/sua`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Sửa
            </Button>
          </Link>
          <DeleteAssetButton id={id} name={asset.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Thông tin chính */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Thông tin cơ bản
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <InfoRow label="Loại tài sản" value={asset.assetType.name} />
              <InfoRow label="Lĩnh vực" value={DOMAIN_LABEL[asset.domain]} />
              <InfoRow label="Nhà sản xuất" value={asset.manufacturer} />
              <InfoRow label="Model" value={asset.model} />
              <InfoRow label="Số series" value={asset.serialNumber} />
              <InfoRow
                label="Ngày lắp đặt"
                value={asset.installDate ? format(asset.installDate, 'dd/MM/yyyy', { locale: vi }) : null}
              />
              <InfoRow
                label="Hạn bảo hành"
                value={asset.warrantyExpiry ? format(asset.warrantyExpiry, 'dd/MM/yyyy', { locale: vi }) : null}
              />
            </dl>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 mb-1">Ghi chú</p>
                <p className="text-sm text-slate-700">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Vị trí */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Vị trí
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <InfoRow label="Địa chỉ" value={asset.address} className="col-span-2" />
              <InfoRow label="Phường / Xã" value={asset.ward?.name} />
              <InfoRow label="Tuyến đường" value={asset.street?.name} />
              <InfoRow label="Vĩ độ" value={asset.latitude?.toString()} />
              <InfoRow label="Kinh độ" value={asset.longitude?.toString()} />
            </dl>
          </div>
        </div>

        {/* Sidebar: lịch sử */}
        <div className="space-y-4">
          {/* Phiếu công việc */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                Phiếu công việc
              </h3>
              <Link href={`/dashboard/phieu-cong-viec?assetId=${id}`} className="text-xs text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            {recentWorkOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có phiếu công việc</p>
            ) : (
              <ul className="space-y-2">
                {recentWorkOrders.map((wo) => (
                  <li key={wo.id} className="text-xs">
                    <Link href={`/dashboard/phieu-cong-viec/${wo.id}`} className="text-blue-600 hover:underline font-medium">
                      {wo.workOrderCode}
                    </Link>
                    <p className="text-slate-600 truncate">{wo.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sự cố */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                Sự cố
              </h3>
              <Link href={`/dashboard/su-co?assetId=${id}`} className="text-xs text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            {recentIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có sự cố</p>
            ) : (
              <ul className="space-y-2">
                {recentIncidents.map((inc) => (
                  <li key={inc.id} className="text-xs">
                    <Link href={`/dashboard/su-co/${inc.id}`} className="text-blue-600 hover:underline font-medium">
                      {inc.incidentCode}
                    </Link>
                    <p className="text-slate-600 truncate">{inc.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Kiểm tra */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                Kiểm tra
              </h3>
              <Link href={`/dashboard/kiem-tra?assetId=${id}`} className="text-xs text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            {recentInspections.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có đợt kiểm tra</p>
            ) : (
              <ul className="space-y-2">
                {recentInspections.map((ins) => (
                  <li key={ins.id} className="text-xs">
                    <Link href={`/dashboard/kiem-tra/${ins.id}`} className="text-blue-600 hover:underline font-medium">
                      {ins.inspectionCode}
                    </Link>
                    <p className="text-slate-500">{format(ins.scheduledDate, 'dd/MM/yyyy', { locale: vi })}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700 mt-0.5">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  )
}
