import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight, Building2, Upload } from 'lucide-react'
import { AssetImportPanel } from '@/components/tai-san/asset-import-panel'
import { ASSET_TYPE_SPECS } from '@/lib/tech-specs/config'

export default async function TaiSanImportPage() {
  await requireAuth()

  const assetTypes = await db.assetType.findMany({
    where: { isActive: true },
    orderBy: [{ domain: 'asc' }, { name: 'asc' }],
  })

  // Lịch sử import gần nhất
  const recentBatches = await db.assetImportBatch.findMany({
    orderBy: { importedAt: 'desc' },
    take: 10,
    include: { assetType: { select: { name: true } }, importedBy: { select: { name: true } } },
  })

  // Đánh dấu loại nào đã có spec/template
  const typesWithSpec = assetTypes.map((t) => ({
    ...t,
    hasSpec: !!ASSET_TYPE_SPECS[t.code],
  }))

  return (
    <div className="max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />Tài sản hạ tầng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" />Import Excel
        </span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Import tài sản từ Excel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Mỗi loại tài sản có mẫu Excel riêng — tải mẫu, điền dữ liệu, rồi upload lại.
        </p>
      </div>

      <AssetImportPanel assetTypes={typesWithSpec} recentBatches={recentBatches} />
    </div>
  )
}
