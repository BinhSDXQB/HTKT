import Link from 'next/link'
import { ChevronRight, Lightbulb, FileSignature, CalendarClock } from 'lucide-react'
import { THAM_MUU } from '@/lib/htkt/tham-muu'
import { LINH_VUC_HTKT } from '@/lib/htkt/phap-ly'
import { CONG_VIEC_THUONG_XUYEN } from '@/lib/htkt/cong-viec-thuong-xuyen'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Công tác tham mưu</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Công tác tham mưu theo lĩnh vực</h1>
          <p className="text-sm text-slate-500">Nội dung tham mưu quản lý nhà nước & sản phẩm đầu ra (QĐ 331/QĐ-SXD)</p>
        </div>
      </div>

      {LINH_VUC_HTKT.map((lv) => {
        const tm = THAM_MUU[lv.key]
        if (!tm) return null
        return (
          <div key={lv.key} className="rounded-xl border bg-white p-5 mb-4">
            <p className="text-sm font-semibold text-cyan-800 mb-3">{lv.ten}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nội dung tham mưu</p>
                <ul className="space-y-1.5">
                  {tm.noiDung.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />{n}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <FileSignature className="w-3.5 h-3.5" /> Sản phẩm / văn bản
                </p>
                <ul className="space-y-1.5">
                  {tm.sanPham.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border bg-white p-5 mb-4">
        <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-cyan-600" /> Công việc thường xuyên của phòng
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {CONG_VIEC_THUONG_XUYEN.map((g) => (
            <div key={g.nhom} className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">{g.nhom}</p>
                <span className="text-[10px] font-semibold uppercase text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">{g.tanSuat}</span>
              </div>
              <ul className="space-y-1">
                {g.viec.map((v, i) => (
                  <li key={i} className="text-sm text-slate-600">• {v}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
