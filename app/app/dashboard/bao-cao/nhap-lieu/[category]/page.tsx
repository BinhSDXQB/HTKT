import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { db } from '@/lib/db'
import { SHEET_STANDARD, SHEET_BIEU_MAU } from '@/lib/ward-report-schema'
import WardEntryForm from '@/components/bao-cao/ward-entry-form'
import { Download } from 'lucide-react'

type Props = {
  params: Promise<{ category: string }>
}

export default async function NhapLieuCategoryPage({ params }: Props) {
  const { category } = await params
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  if (!perms.canWrite) {
    redirect('/dashboard/bao-cao/nhap-lieu')
  }

  if (perms.limitWardId && !perms.limitWardId) {
    redirect('/dashboard/bao-cao/nhap-lieu')
  }

  const sheetName = Object.keys(SHEET_STANDARD).find(k => SHEET_STANDARD[k] === category)
  if (!sheetName) {
    redirect('/dashboard/bao-cao/nhap-lieu')
  }

  const label = SHEET_BIEU_MAU[sheetName] || sheetName

  let entries: any[] = []

  if (perms.viewAll) {
    // Admin/SO_HTKT: không có ward limit, nhập liệu cho phường khác
    // Tìm danh sách phường/xã
    redirect('/dashboard/bao-cao/nhap-lieu')
  } else if (perms.limitWardId) {
    // Người dùng cấp phường
    const categoryMap: Record<string, string> = {
      'DUONG': 'ReportDuong',
      'DIEN_CHIEU_SANG': 'ReportDienCS',
      'THOAT_NUOC_BC': 'ReportThoatNuoc',
      'CAY_XANH': 'ReportCayXanh',
      'CONG_VIEN': 'ReportCongVien',
    }

    const model = categoryMap[category]
    if (model) {
      const currentYear = new Date().getFullYear()
      entries = await (db[model as never] as any).findMany({
        where: { wardId: perms.limitWardId, year: currentYear },
        orderBy: { createdAt: 'asc' },
      })
    }

    const ward = await db.administrativeUnit.findUnique({
      where: { id: perms.limitWardId },
      select: { name: true },
    })

    return (
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
            <p className="text-slate-600 mt-2">{ward?.name || 'Phường/Xã'} — Năm {new Date().getFullYear()}</p>
          </div>
          <a
            href={`/api/export/ward-report-category?wardId=${perms.limitWardId}&category=${category}&year=${new Date().getFullYear()}`}
            download
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </a>
        </div>

        <WardEntryForm
          category={category}
          wardId={perms.limitWardId}
          year={new Date().getFullYear()}
          entries={entries}
          canEdit={true}
        />
      </div>
    )
  }

  redirect('/dashboard/bao-cao/nhap-lieu')
}
