import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Building2 } from 'lucide-react'
import { AssetForm } from '@/components/tai-san/asset-form'
import { updateAssetAction } from '@/app/actions/tai-san'
import { format } from 'date-fns'

export default async function SuaTaiSanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [asset, assetTypes, wards, streets] = await Promise.all([
    db.asset.findUnique({ where: { id } }),
    db.assetType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.administrativeUnit.findMany({ where: { type: 'PHUONG_XA', isActive: true }, orderBy: { name: 'asc' } }),
    db.street.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  if (!asset) notFound()

  const boundAction = updateAssetAction.bind(null, id)

  const defaultValues = {
    assetCode:     asset.assetCode,
    name:          asset.name,
    assetTypeId:   asset.assetTypeId,
    domain:        asset.domain,
    address:       asset.address ?? '',
    wardId:        asset.wardId ?? '',
    streetId:      asset.streetId ?? '',
    latitude:      asset.latitude?.toString() ?? '',
    longitude:     asset.longitude?.toString() ?? '',
    installDate:   asset.installDate ? format(asset.installDate, 'yyyy-MM-dd') : '',
    warrantyExpiry:asset.warrantyExpiry ? format(asset.warrantyExpiry, 'yyyy-MM-dd') : '',
    manufacturer:  asset.manufacturer ?? '',
    model:         asset.model ?? '',
    serialNumber:  asset.serialNumber ?? '',
    condition:     asset.condition,
    status:        asset.status,
    notes:         asset.notes ?? '',
  }

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          Tài sản hạ tầng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/tai-san/${id}`} className="hover:text-blue-700 truncate max-w-[180px]">
          {asset.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Sửa</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Sửa tài sản</h1>
        <p className="text-sm text-slate-500 mt-0.5">{asset.assetCode} — {asset.name}</p>
      </div>

      <AssetForm
        action={boundAction}
        assetTypes={assetTypes}
        wards={wards}
        streets={streets}
        defaultValues={defaultValues}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}
