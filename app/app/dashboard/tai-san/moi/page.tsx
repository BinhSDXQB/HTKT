import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Building2 } from 'lucide-react'
import { AssetForm } from '@/components/tai-san/asset-form'
import { createAssetAction } from '@/app/actions/tai-san'

export default async function TaiSanMoiPage() {
  await requireAuth()

  const [assetTypes, wards, streets] = await Promise.all([
    db.assetType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.administrativeUnit.findMany({ where: { type: 'PHUONG_XA', isActive: true }, orderBy: { name: 'asc' } }),
    db.street.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          Tài sản hạ tầng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Thêm mới</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Thêm tài sản hạ tầng</h1>
        <p className="text-sm text-slate-500 mt-0.5">Điền đầy đủ thông tin để đăng ký tài sản mới</p>
      </div>

      <AssetForm
        action={createAssetAction}
        assetTypes={assetTypes}
        wards={wards}
        streets={streets}
        submitLabel="Thêm tài sản"
      />
    </div>
  )
}
