import Link from 'next/link'
import { ChevronRight, ClipboardCheck, FolderSearch } from 'lucide-react'
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

      <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-900">Kiểm kê hồ sơ &amp; soạn thảo tờ trình</p>
          <p className="text-xs text-cyan-800 mt-0.5">
            Đọc tờ trình, thuyết minh, bản vẽ, dự toán trong thư mục, đối chiếu thành phần hồ sơ — rồi chuyển thẳng
            sang bước soạn thảo tờ trình thẩm định.
          </p>
        </div>
        <Link
          href="/dashboard/phong-htkt/soan-thao"
          className="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium inline-flex items-center gap-2 shrink-0"
        >
          <FolderSearch className="w-4 h-4" />Mở công cụ
        </Link>
      </div>

      <ThamDinhTabs />

      <p className="text-xs text-slate-400 mt-6">
        Thời hạn theo Đ37 NĐ 217/2026 (BCNCKT) và Đ27 NĐ 207/2026 (kiểm tra nghiệm thu), tính theo ngày làm việc kể từ
        khi nhận đủ hồ sơ hợp lệ. Từ 01/7/2026 thiết kế triển khai sau khi dự án được phê duyệt do chủ đầu tư thẩm định
        (Đ41 NĐ 217). Căn cứ PCCC theo NĐ 105/2025 sửa bởi NĐ 347/2026 (hiệu lực 15/9/2026). Rà soát 13/10/2026.
      </p>
    </div>
  )
}
