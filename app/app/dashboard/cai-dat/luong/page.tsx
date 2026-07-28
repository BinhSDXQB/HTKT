import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { canImportSalary } from '@/lib/salary-perms'
import { ChevronRight, Settings, Wallet } from 'lucide-react'
import { SalaryImportPanel } from '@/components/cai-dat/salary-import-panel'

export default async function ImportLuongPage() {
  const user = await requireAuth()
  if (!canImportSalary(user)) redirect('/forbidden')

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cai-dat" className="hover:text-blue-700 flex items-center gap-1">
          <Settings className="w-3.5 h-3.5" />Cài đặt
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Import dữ liệu lương</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-700" />
          Import “Theo dõi lên lương” vào hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tải file Excel theo dõi lên lương lên đây để cập nhật hệ số, vượt khung và ngày nâng lương kế tiếp cho cán bộ.
          Chatbot sẽ dùng dữ liệu này để trả lời.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800 space-y-1.5">
        <p>• Hệ thống đọc sheet <strong>Theodoi</strong>, ghép theo <strong>CCCD</strong> (cột ID) — không tạo trùng.</p>
        <p>• Lấy: <strong>Hệ số lương</strong>, <strong>% vượt khung</strong>, <strong>Ngày nâng lương kế tiếp</strong>.</p>
        <p>• Người chưa điền <strong>“Ngày hưởng”</strong> trong file sẽ không có ngày nâng kế tiếp (cần bổ sung để chatbot trả lời đầy đủ).</p>
        <p>• Có thể import lại nhiều lần — dữ liệu cũ sẽ được ghi đè theo file mới nhất.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <SalaryImportPanel />
      </div>
    </div>
  )
}
