import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireOfficeAccess, canManageCanBo } from '@/lib/auth'
import { BhxhImportForm } from '@/components/van-phong-so/bhxh-import-form'
import { Briefcase, ChevronRight, IdCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ImportBhxhPage() {
  const user = await requireOfficeAccess()
  if (!canManageCanBo(user)) redirect('/forbidden')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/van-phong-so/ho-so" className="hover:text-indigo-700">Hồ sơ cán bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Import BHXH / MST</span>
      </nav>

      <div className="flex items-center gap-2">
        <IdCard className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Import dữ liệu BHXH / Mã số thuế</h1>
      </div>

      <p className="text-xs text-slate-500 bg-slate-50 border rounded-lg px-3 py-2">
        Dữ liệu BHXH lấy từ tài khoản giao dịch điện tử của đơn vị (xuất Excel) — không tra cứu tự động được theo CCCD.
        Theo TT 86/2024/TT-BTC, mã số thuế cá nhân dùng số định danh cá nhân (CCCD).
      </p>

      <BhxhImportForm />
    </div>
  )
}
