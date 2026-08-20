import { requireAuth } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { CATEGORY_ORDER, CATEGORY_SHEET, SHEET_BIEU_MAU } from '@/lib/ward-report-schema'
import Link from 'next/link'

const COLORS: Record<string, { bg: string; icon: string }> = {
  'DUONG': { bg: 'bg-emerald-50 border-emerald-200', icon: '🛣️' },
  'DIEN_CHIEU_SANG': { bg: 'bg-amber-50 border-amber-200', icon: '💡' },
  'THOAT_NUOC_BC': { bg: 'bg-blue-50 border-blue-200', icon: '💧' },
  'CAY_XANH': { bg: 'bg-green-50 border-green-200', icon: '🌿' },
  'CONG_VIEN': { bg: 'bg-pink-50 border-pink-200', icon: '🎪' },
  'CAP_NUOC_BC': { bg: 'bg-cyan-50 border-cyan-200', icon: '🚰' },
  'BAI_DO_XE': { bg: 'bg-violet-50 border-violet-200', icon: '🅿️' },
  'KHAC': { bg: 'bg-slate-50 border-slate-200', icon: '📦' },
}

export default async function NhapLieuPage() {
  const user = await requireAuth()
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

  if (!perms.canWrite) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  const categories = CATEGORY_ORDER.map((category) => {
    const sheetName = CATEGORY_SHEET[category]
    return {
      category,
      label: SHEET_BIEU_MAU[sheetName] || sheetName,
      color: COLORS[category] || COLORS['KHAC'],
    }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nhập liệu biểu mẫu HTKT</h1>
        <p className="text-slate-600 mt-2">Chọn biểu mẫu để nhập dữ liệu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(({ category, label, color }) => (
          <Link
            key={category}
            href={`/dashboard/bao-cao/nhap-lieu/${category}`}
            className={`p-6 rounded-xl border ${color.bg} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-2xl">{color.icon}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{label}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Click để nhập dữ liệu biểu mẫu này →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
