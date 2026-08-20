import { requireAuth } from '@/lib/auth'
import { Qd72Map } from '@/components/qd72/qd72-map'
import Link from 'next/link'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'

export default async function Qd72BanDoPage({ searchParams }: { searchParams: Promise<{ caseId?: string; ward?: string }> }) {
  await requireAuth()
  const { caseId, ward } = await searchParams

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg md:text-xl font-bold text-slate-900">Bản đồ GIS — Khảo sát chỉnh trang PCCC (QĐ 72)</h1>
        </div>
        <Link href="/dashboard/qd72" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Danh sách hồ sơ
        </Link>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Bật/tắt 20 lớp: ranh giới, giao thông, dây–cáp–chiếu sáng, nguồn nước, chỉnh trang. Bấm đối tượng để xem thuộc tính
        (đánh giá sơ bộ — cần đơn vị chuyên môn xác minh).
      </p>
      <Qd72Map caseId={caseId} ward={ward} />
    </div>
  )
}
