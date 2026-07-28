import Link from 'next/link'
import { ChevronRight, Scale, ClipboardCheck, Lightbulb, FileText } from 'lucide-react'
import { NghiepVuSection } from '@/components/nghiep-vu/nghiep-vu-section'

// Khung trang con dùng chung cho module nghiệp vụ các phòng (KT-VLXD, PTĐT, ...).
// Hiển thị breadcrumb về trang tổng quan phòng, tiêu đề, mô tả, danh sách nhiệm vụ
// (trích QĐ 331/QĐ-SXD) và ghi chú "đang phát triển". Tham số hóa màu + breadcrumb.
export function DeptSection({
  title,
  icon: Icon,
  moTa,
  nhiemVu = [],
  baseHref,
  baseLabel,
  color = 'indigo',
}: {
  title: string
  icon: React.ElementType
  moTa: string
  nhiemVu?: string[]
  baseHref: string
  baseLabel: string
  color?: 'indigo' | 'emerald'
}) {
  const c =
    color === 'emerald'
      ? { bg: 'bg-emerald-600', link: 'hover:text-emerald-700', dot: 'bg-emerald-500' }
      : { bg: 'bg-indigo-600', link: 'hover:text-indigo-700', dot: 'bg-indigo-500' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href={baseHref} className={c.link}>{baseLabel}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{title}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center shrink-0`}>
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
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
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

// Trang tổng quan phòng: lưới thẻ điều hướng tới các mục nghiệp vụ.
export function DeptOverview({
  title,
  subtitle,
  icon: Icon,
  subMenus,
  note,
  color = 'indigo',
  phapLyHref,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  subMenus: { label: string; desc: string; icon: React.ElementType; href: string }[]
  note: string
  color?: 'indigo' | 'emerald'
  phapLyHref?: string
}) {
  const c =
    color === 'emerald'
      ? { bg: 'bg-emerald-600', icon: 'text-emerald-600', hover: 'hover:border-emerald-300', nvBg: 'bg-emerald-50/40' }
      : { bg: 'bg-indigo-600', icon: 'text-indigo-600', hover: 'hover:border-indigo-300', nvBg: 'bg-indigo-50/40' }

  const baseHref = phapLyHref?.replace(/\/phap-ly$/, '') ?? ''
  const nghiepVu = phapLyHref
    ? [
        { label: 'Cơ sở pháp lý', desc: 'Luật, Nghị định, Thông tư, QCVN mới nhất', icon: Scale, href: phapLyHref },
        { label: 'Quy trình thẩm định', desc: 'Trình tự thẩm định, hồ sơ, thời hạn', icon: ClipboardCheck, href: `${baseHref}/tham-dinh` },
        { label: 'Công tác tham mưu', desc: 'Nội dung tham mưu & công việc thường xuyên', icon: Lightbulb, href: `${baseHref}/tham-muu` },
        { label: 'Mẫu biểu & văn bản', desc: 'Tờ trình, công văn, QĐ... theo NĐ 30/2020', icon: FileText, href: `${baseHref}/mau-bieu` },
      ]
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {nghiepVu.length > 0 && (
        <>
          <p className="text-sm font-semibold text-slate-700 mb-3">Nghiệp vụ chuyên môn</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {nghiepVu.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className={`rounded-xl border ${c.nvBg} p-4 flex items-start gap-3 ${c.hover} hover:shadow-sm transition`}
              >
                <m.icon className={`w-5 h-5 ${c.icon} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="text-sm font-semibold text-slate-700 mb-3">Lĩnh vực quản lý (nhập liệu hồ sơ)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subMenus.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className={`rounded-xl border bg-white p-4 flex items-start gap-3 ${c.hover} hover:shadow-sm transition`}
          >
            <m.icon className={`w-5 h-5 ${c.icon} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{m.label}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Nhập liệu
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-8">{note}</p>
    </div>
  )
}
