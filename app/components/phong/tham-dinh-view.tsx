'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ClipboardCheck, FileText, Clock, CheckCircle2, BookMarked, AlertTriangle } from 'lucide-react'
import { getThamDinhPhong } from '@/lib/phong/tham-dinh-phong'
import { QUY_TRINH_NHAN_DIEN } from '@/lib/htkt/tham-dinh'
import type { QuyTrinh } from '@/lib/htkt/tham-dinh'

const MAU: Record<string, { bg: string; link: string; btn: string; border: string }> = {
  indigo: { bg: 'bg-indigo-600', link: 'hover:text-indigo-700', btn: 'bg-indigo-600 text-white border-indigo-600', border: 'hover:border-indigo-300' },
  emerald: { bg: 'bg-emerald-600', link: 'hover:text-emerald-700', btn: 'bg-emerald-600 text-white border-emerald-600', border: 'hover:border-emerald-300' },
}

function QuyTrinhDetail({ qt, color }: { qt: QuyTrinh; color: string }) {
  const c = MAU[color] ?? MAU.indigo
  return (
    <div>
      <div className="rounded-xl border bg-white p-5 mb-4">
        <h2 className="text-base font-bold text-slate-900">{qt.ten}</h2>
        <p className="text-sm text-slate-600 mt-1">{qt.moTa}</p>
        <p className="text-xs text-slate-500 mt-2"><span className="font-semibold">Phạm vi áp dụng: </span>{qt.apDung}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" /> Thành phần hồ sơ
          </p>
          <ul className="space-y-1.5">
            {qt.hoSo.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.bg} shrink-0`} />{h}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" /> Thời gian giải quyết
            </p>
            <ul className="space-y-1.5">
              {qt.thoiGian.map((t, i) => (
                <li key={i} className="text-sm text-slate-600">{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kết quả
            </p>
            <p className="text-sm text-slate-600">{qt.ketQua}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 mb-4">
        <p className="text-sm font-semibold text-slate-800 mb-4">Các bước thực hiện</p>
        <ol className="space-y-3">
          {qt.buoc.map((b) => (
            <li key={b.buoc} className="flex gap-3">
              <span className={`shrink-0 w-7 h-7 rounded-full ${c.bg} text-white text-sm font-semibold flex items-center justify-center`}>
                {b.buoc}
              </span>
              <div className="flex-1 pb-1 border-b last:border-0">
                <p className="text-sm font-semibold text-slate-800">{b.ten}</p>
                <p className="text-sm text-slate-600">{b.noiDung}</p>
                {b.trachNhiem && <p className="text-xs text-slate-400 mt-0.5">Trách nhiệm: {b.trachNhiem}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {qt.ghiChu && qt.ghiChu.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-4">
          <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Lưu ý cho người thẩm định
          </p>
          <ul className="space-y-2">
            {qt.ghiChu.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{g}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <BookMarked className="w-4 h-4 text-slate-500" /> Căn cứ pháp lý
        </p>
        <div className="flex flex-wrap gap-1.5">
          {qt.canCu.map((c, i) => (
            <span key={i} className="text-xs bg-white border px-2 py-1 rounded text-slate-600">{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ThamDinhView({ phongKey, tenPhong, baseHref, color = 'indigo' }: {
  phongKey: string; tenPhong: string; baseHref: string; color?: 'indigo' | 'emerald'
}) {
  const danhSach = [QUY_TRINH_NHAN_DIEN, ...getThamDinhPhong(phongKey)]
  const [active, setActive] = useState(danhSach[0]?.key ?? '')
  const qt = danhSach.find((q) => q.key === active) ?? danhSach[0]
  const c = MAU[color] ?? MAU.indigo

  if (!danhSach.length) {
    return <div className="p-6 text-sm text-slate-500">Chưa có quy trình thẩm định cho phòng này.</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href={baseHref} className={c.link}>{tenPhong}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Quy trình thẩm định</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center shrink-0`}>
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quy trình thẩm định — {tenPhong}</h1>
          <p className="text-sm text-slate-500">Theo QĐ 331/QĐ-SXD & pháp luật chuyên ngành hiện hành</p>
        </div>
      </div>

      {danhSach.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {danhSach.map((q) => (
            <button
              key={q.key}
              onClick={() => setActive(q.key)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                active === q.key ? c.btn : `bg-white text-slate-600 border-slate-200 ${c.border}`
              }`}
            >
              {q.ten}
            </button>
          ))}
        </div>
      )}

      {qt && <QuyTrinhDetail qt={qt} color={color} />}

      <p className="text-xs text-slate-400 mt-6">
        Mốc thời gian là quy định khung — xác định theo nhóm/cấp và văn bản hiện hành tại thời điểm tiếp nhận.
      </p>
    </div>
  )
}
