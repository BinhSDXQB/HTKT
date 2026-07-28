import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { NghiepVuSection } from '@/components/nghiep-vu/nghiep-vu-section'

// Khung trang con của module Phòng Hạ tầng kỹ thuật.
// Hiển thị tiêu đề, mô tả chức năng, danh sách nhiệm vụ (trích QĐ 331/QĐ-SXD) và
// ghi chú "đang phát triển". Nội dung nghiệp vụ sẽ bổ sung dần ở các bước sau.
export function HtktSection({
  title,
  icon: Icon,
  moTa,
  nhiemVu = [],
}: {
  title: string
  icon: React.ElementType
  moTa: string
  nhiemVu?: string[]
}) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{title}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{moTa}</p>
        </div>
      </div>

      {nhiemVu.length > 0 && (
        <div className="rounded-xl border bg-white p-5 mb-6">
          <p className="text-sm font-semibold text-slate-800 mb-3">Nhiệm vụ chính (theo QĐ 331/QĐ-SXD)</p>
          <ul className="space-y-2">
            {nhiemVu.map((nv, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                <span>{nv}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <NghiepVuSection />
    </div>
  )
}
