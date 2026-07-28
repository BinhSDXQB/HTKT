import Link from 'next/link'
import { ChevronRight, Lightbulb, FileSignature, CalendarClock } from 'lucide-react'
import { getThamMuuPhong } from '@/lib/phong/tham-muu-phong'
import { getCongViecPhong } from '@/lib/phong/cong-viec-phong'

const MAU: Record<string, { bg: string; link: string; dot: string; tag: string }> = {
  indigo: { bg: 'bg-indigo-600', link: 'hover:text-indigo-700', dot: 'bg-indigo-500', tag: 'text-indigo-700 bg-indigo-50' },
  emerald: { bg: 'bg-emerald-600', link: 'hover:text-emerald-700', dot: 'bg-emerald-500', tag: 'text-emerald-700 bg-emerald-50' },
}

export function ThamMuuView({ phongKey, tenPhong, baseHref, color = 'indigo' }: {
  phongKey: string; tenPhong: string; baseHref: string; color?: 'indigo' | 'emerald'
}) {
  const thamMuu = getThamMuuPhong(phongKey)
  const congViec = getCongViecPhong(phongKey)
  const c = MAU[color] ?? MAU.indigo

  if (!thamMuu && !congViec) {
    return <div className="p-6 text-sm text-slate-500">Chưa có nội dung tham mưu cho phòng này.</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href={baseHref} className={c.link}>{tenPhong}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Công tác tham mưu</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center shrink-0`}>
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Công tác tham mưu — {tenPhong}</h1>
          <p className="text-sm text-slate-500">Nội dung tham mưu QLNN & sản phẩm đầu ra (QĐ 331/QĐ-SXD)</p>
        </div>
      </div>

      {thamMuu?.linhVuc.map((lv) => (
        <div key={lv.key} className="rounded-xl border bg-white p-5 mb-4">
          <p className={`text-sm font-semibold mb-3 ${color === 'emerald' ? 'text-emerald-800' : 'text-indigo-800'}`}>
            {lv.ten}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nội dung tham mưu</p>
              <ul className="space-y-1.5">
                {lv.thamMuu.noiDung.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />{n}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <FileSignature className="w-3.5 h-3.5" /> Sản phẩm / văn bản
              </p>
              <ul className="space-y-1.5">
                {lv.thamMuu.sanPham.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {congViec && (
        <div className="rounded-xl border bg-white p-5 mb-4">
          <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Công việc thường xuyên của phòng
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {congViec.congViec.map((g) => (
              <div key={g.nhom} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">{g.nhom}</p>
                  <span className={`text-[10px] font-semibold uppercase ${c.tag} px-2 py-0.5 rounded`}>{g.tanSuat}</span>
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
      )}
    </div>
  )
}
