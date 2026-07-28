import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Search, Upload, Map, Download, FileSpreadsheet } from 'lucide-react'
import { DOMAIN_LABEL, CONDITION_LABEL, STATUS_LABEL, DOMAIN_COLOR, CONDITION_COLOR, STATUS_COLOR } from '@/lib/constants/tai-san'
import { ASSET_TYPE_SPECS } from '@/lib/tech-specs/config'

type SearchParams = { domain?: string; condition?: string; status?: string; q?: string; page?: string }

async function getAssets(params: SearchParams) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (params.domain) where.domain = params.domain
  if (params.condition) where.condition = params.condition
  if (params.status) where.status = params.status
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { assetCode: { contains: params.q, mode: 'insensitive' } },
      { address: { contains: params.q, mode: 'insensitive' } },
    ]
  }

  const [assets, total] = await Promise.all([
    db.asset.findMany({
      where,
      include: {
        assetType: true,
        ward: { select: { name: true } },
        street: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.asset.count({ where }),
  ])

  return { assets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export default async function TaiSanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAuth()
  const sp = await searchParams
  const { assets, total, page, totalPages } = await getAssets(sp)

  // Lấy loại tài sản theo lĩnh vực đang lọc (để hiện file mẫu)
  const assetTypes = sp.domain
    ? await db.assetType.findMany({
        where: { domain: sp.domain as never, isActive: true },
        select: { code: true, name: true },
        orderBy: { name: 'asc' },
      })
    : []

  const domains    = Object.entries(DOMAIN_LABEL)
  const conditions = Object.entries(CONDITION_LABEL)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-700" />
            Tài sản hạ tầng
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý danh mục tài sản kỹ thuật đô thị
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ban-do">
            <Button variant="outline" size="sm" className="gap-1.5 text-slate-600"><Map className="w-4 h-4" />Bản đồ</Button>
          </Link>
          <Link href="/dashboard/tai-san/import">
            <Button variant="outline" size="sm" className="gap-1.5 text-slate-600"><Upload className="w-4 h-4" />Import Excel</Button>
          </Link>
          <Link href="/dashboard/tai-san/moi">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
              <Plus className="w-4 h-4" />Thêm tài sản
            </Button>
          </Link>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        {/* Tìm kiếm */}
        <form method="GET" className="flex gap-2 flex-1 min-w-[220px]">
          {sp.domain && <input type="hidden" name="domain" value={sp.domain} />}
          {sp.condition && <input type="hidden" name="condition" value={sp.condition} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Tìm mã, tên, địa chỉ..."
              className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {(sp.q || sp.domain || sp.condition || sp.status) && (
            <Link href="/dashboard/tai-san">
              <Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button>
            </Link>
          )}
        </form>

        {/* Lĩnh vực */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-xs text-slate-500">Lĩnh vực:</span>
          <Link href={buildFilterUrl(sp, 'domain', undefined)}>
            <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${!sp.domain ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              Tất cả
            </span>
          </Link>
          {domains.map(([key, label]) => (
            <Link key={key} href={buildFilterUrl(sp, 'domain', sp.domain === key ? undefined : key)}>
              <span className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border transition-colors ${sp.domain === key ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Panel File mẫu Excel — hiện khi chọn lĩnh vực */}
      {sp.domain && assetTypes.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            <span className="text-sm font-semibold text-green-800">
              File mẫu Excel — {DOMAIN_LABEL[sp.domain]}
            </span>
            <span className="text-xs text-green-600 ml-auto">
              Tải mẫu → điền dữ liệu → Import lại
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {assetTypes.map(t => (
              <a
                key={t.code}
                href={`/api/templates/assets/${t.code}`}
                download
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                  ${ASSET_TYPE_SPECS[t.code]
                    ? 'bg-white border-green-300 text-green-700 hover:bg-green-50'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Download className="w-3.5 h-3.5" />
                {t.name}
                {!ASSET_TYPE_SPECS[t.code] && <span className="text-[10px] text-slate-400">(cơ bản)</span>}
              </a>
            ))}
            <Link
              href="/dashboard/tai-san/import"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import hàng loạt
            </Link>
          </div>
        </div>
      )}

      {/* Bảng */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
          <span className="text-sm font-medium text-slate-700">
            {total.toLocaleString('vi')} tài sản
          </span>
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-slate-500">Tình trạng:</span>
            {conditions.map(([key, label]) => (
              <Link key={key} href={buildFilterUrl(sp, 'condition', sp.condition === key ? undefined : key)}>
                <span className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${sp.condition === key ? CONDITION_COLOR[key] + ' ring-1 ring-offset-1' : 'text-slate-500 hover:text-slate-700'}`}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {assets.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có tài sản nào</p>
            <Link href="/dashboard/tai-san/moi" className="mt-3 inline-block">
              <Button variant="outline" size="sm">Thêm tài sản đầu tiên</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="px-4 py-3 font-medium">Mã / Tên tài sản</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Lĩnh vực</th>
                  <th className="px-4 py-3 font-medium">Vị trí</th>
                  <th className="px-4 py-3 font-medium">Tình trạng</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/tai-san/${asset.id}`} className="hover:text-blue-700">
                        <p className="font-medium text-slate-800">{asset.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{asset.assetCode}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{asset.assetType.name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs font-normal ${DOMAIN_COLOR[asset.domain]}`}>
                        {DOMAIN_LABEL[asset.domain]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                      <p className="truncate">{asset.address || '—'}</p>
                      {asset.ward && <p className="text-xs text-slate-400">{asset.ward.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs font-normal ${CONDITION_COLOR[asset.condition]}`}>
                        {CONDITION_LABEL[asset.condition]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs font-normal ${STATUS_COLOR[asset.status]}`}>
                        {STATUS_LABEL[asset.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/tai-san/${asset.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                          Chi tiết
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            {page > 1 && (
              <Link href={buildFilterUrl(sp, 'page', String(page - 1))}>
                <Button variant="outline" size="sm">← Trước</Button>
              </Link>
            )}
            <span className="text-sm text-slate-500">
              Trang {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildFilterUrl(sp, 'page', String(page + 1))}>
                <Button variant="outline" size="sm">Sau →</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function buildFilterUrl(sp: SearchParams, key: string, value: string | undefined): string {
  const params = new URLSearchParams()
  const current: Record<string, string | undefined> = { ...sp, [key]: value }
  if (key !== 'page') delete current.page
  for (const [k, v] of Object.entries(current)) {
    if (v) params.set(k, v)
  }
  const qs = params.toString()
  return `/dashboard/tai-san${qs ? '?' + qs : ''}`
}
