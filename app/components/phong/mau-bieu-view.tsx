import Link from 'next/link'
import { ChevronRight, FileText, Download } from 'lucide-react'
import { MAU_BIEU, NHOM_MAU } from '@/lib/htkt/mau-bieu'

const MAU: Record<string, { bg: string; link: string }> = {
  indigo: { bg: 'bg-indigo-600', link: 'hover:text-indigo-700' },
  emerald: { bg: 'bg-emerald-600', link: 'hover:text-emerald-700' },
}

export function MauBieuView({ tenPhong, baseHref, color = 'indigo' }: {
  tenPhong: string; baseHref: string; color?: 'indigo' | 'emerald'
}) {
  const c = MAU[color] ?? MAU.indigo

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href={baseHref} className={c.link}>{tenPhong}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Mẫu biểu & văn bản</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center shrink-0`}>
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mẫu biểu & văn bản hành chính</h1>
          <p className="text-sm text-slate-500">Thể thức theo Nghị định 30/2020/NĐ-CP · header Sở Xây dựng — tỉnh Quảng Trị</p>
        </div>
      </div>

      {NHOM_MAU.map((nhom) => {
        const ds = MAU_BIEU.filter((m) => m.nhom === nhom)
        if (!ds.length) return null
        return (
          <div key={nhom} className="mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">{nhom}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ds.map((m) => (
                <div key={m.key} className="rounded-xl border bg-white p-4 flex flex-col">
                  <p className="font-semibold text-slate-900">{m.ten}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex-1">{m.moTa}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`/api/htkt/mau-bieu/${m.key}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải mẫu .docx
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-slate-400 mt-4">
        &quot;Tải mẫu .docx&quot; tải biểu rỗng để điền tay. Bản sinh là dự thảo — rà soát số/ngày, căn cứ
        và thể thức trước khi trình ký.
      </p>
    </div>
  )
}
