import Link from 'next/link'
import { ChevronRight, ClipboardCheck, FolderSearch } from 'lucide-react'
import { requireHtktAccess } from '@/lib/auth'
import { KiemKeHoSo } from '@/components/phong-htkt/kiem-ke-ho-so'

export const dynamic = 'force-dynamic'

export default async function KiemKeHoSoPage() {
  // Chỉ cán bộ Phòng Hạ tầng kỹ thuật (và lãnh đạo Sở / người được phân quyền HTKT)
  await requireHtktAccess()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/phong-htkt/tham-dinh" className="hover:text-cyan-700">Quy trình thẩm định</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Kiểm kê hồ sơ từ thư mục</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <FolderSearch className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kiểm kê hồ sơ thẩm định từ thư mục</h1>
          <p className="text-sm text-slate-600">
            Trỏ tới thư mục hồ sơ dự án trên máy chủ — hệ thống đọc tờ trình, thuyết minh, bản vẽ, dự toán
            và đối chiếu với thành phần hồ sơ theo quy trình.
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-5 flex items-start gap-1.5">
        <ClipboardCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Công cụ hỗ trợ rà soát cho cán bộ Phòng Hạ tầng kỹ thuật. Kết quả là <strong>gợi ý cần xác nhận</strong>,
        không thay thế việc mở hồ sơ kiểm tra và không phải kết luận thẩm định.
      </p>

      <KiemKeHoSo />
    </div>
  )
}
