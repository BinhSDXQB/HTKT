import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { db } from '@/lib/db'
import { CATEGORY_MODEL, CATEGORY_SHEET, SHEET_BIEU_MAU } from '@/lib/ward-report-schema'
import WardEntryForm from '@/components/bao-cao/ward-entry-form'
import WardPicker from '@/components/bao-cao/ward-picker'
import { Download } from 'lucide-react'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ ward?: string; year?: string }>
}

const dbAny = db as unknown as Record<string, { findMany: (a: unknown) => Promise<unknown[]> }>

export default async function NhapLieuCategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const { ward: wardParam, year: yearParam } = await searchParams
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  if (!perms.canWrite) {
    redirect('/dashboard/bao-cao/nhap-lieu')
  }

  const sheetName = CATEGORY_SHEET[category]
  const model = CATEGORY_MODEL[category]
  if (!sheetName || !model) {
    redirect('/dashboard/bao-cao/nhap-lieu')
  }

  const label = SHEET_BIEU_MAU[sheetName] || sheetName
  const currentYear = new Date().getFullYear()
  const year = Number(yearParam) || currentYear
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Xác định phường/xã đang thao tác:
  // - Cấp phường: khoá theo tài khoản.
  // - Sở/Admin (viewAll): chọn phường qua ?ward=; chưa chọn → hiện bộ chọn.
  const targetWardId = perms.limitWardId ?? (wardParam || null)

  if (!targetWardId) {
    // viewAll nhưng chưa chọn phường → hiện bộ chọn phường/xã.
    const wards = await db.administrativeUnit.findMany({
      where: { type: 'PHUONG_XA', isActive: true },
      select: { id: true, name: true, fullName: true },
      orderBy: { name: 'asc' },
    })
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          <p className="text-slate-600 mt-1.5">Chọn phường/xã để nhập liệu — Năm {year}</p>
        </div>
        <WardPicker wards={wards} category={category} year={year} />
      </div>
    )
  }

  const ward = await db.administrativeUnit.findUnique({
    where: { id: targetWardId },
    select: { name: true },
  })

  const entries = await dbAny[model].findMany({
    where: { wardId: targetWardId, year },
    orderBy: { createdAt: 'asc' },
  })

  const baseQuery = perms.limitWardId ? '' : `ward=${targetWardId}&`

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          <p className="text-slate-600 mt-1.5">{ward?.name || 'Phường/Xã'} — Năm {year}</p>
        </div>
        <div className="flex items-center gap-2">
          {!perms.limitWardId && (
            <Link
              href={`/dashboard/bao-cao/nhap-lieu/${category}`}
              className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ← Đổi phường
            </Link>
          )}
          <a
            href={`/api/export/ward-report-category?wardId=${targetWardId}&category=${category}&year=${year}`}
            download
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </a>
        </div>
      </div>

      {/* Chọn năm */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 mr-1">Năm:</span>
        {yearOptions.map((y) => (
          <Link
            key={y}
            href={`/dashboard/bao-cao/nhap-lieu/${category}?${baseQuery}year=${y}`}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
              y === year
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      <WardEntryForm
        category={category}
        wardId={targetWardId}
        year={year}
        entries={entries as never[]}
        canEdit={true}
      />
    </div>
  )
}
