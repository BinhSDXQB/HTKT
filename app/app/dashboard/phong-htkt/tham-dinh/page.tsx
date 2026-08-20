import Link from 'next/link'
import { ChevronRight, ClipboardCheck } from 'lucide-react'
import { ThamDinhTabs } from '@/components/phong-htkt/tham-dinh-tabs'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Quy trình thẩm định</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quy trình thẩm định công trình HTKT</h1>
          <p className="text-sm text-slate-500">
            Theo Luật Xây dựng 135/2025/QH15 & Nghị định 217/2026/NĐ-CP (hiệu lực 01/7/2026, thay NĐ 175/2024)
          </p>
        </div>
      </div>

      <ThamDinhTabs />

      <p className="text-xs text-slate-400 mt-6">
        Mốc thời gian là quy định khung; xác định chính xác theo nhóm/cấp công trình và văn bản hiện hành tại thời điểm
        tiếp nhận. Nghị định mới chi tiết Luật Xây dựng 2025 về quản lý hoạt động xây dựng đang được soạn thảo —
        cập nhật khi ban hành.
      </p>
    </div>
  )
}
