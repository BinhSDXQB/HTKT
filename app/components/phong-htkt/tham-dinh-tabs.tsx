'use client'
import { useState } from 'react'
import { FileText, Clock, CheckCircle2, BookMarked, AlertTriangle } from 'lucide-react'
import { QUY_TRINH_THAM_DINH } from '@/lib/htkt/tham-dinh'

export function ThamDinhTabs() {
  const [active, setActive] = useState(QUY_TRINH_THAM_DINH[0].key)
  const qt = QUY_TRINH_THAM_DINH.find((q) => q.key === active) ?? QUY_TRINH_THAM_DINH[0]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {QUY_TRINH_THAM_DINH.map((q) => (
          <button
            key={q.key}
            onClick={() => setActive(q.key)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              active === q.key
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
            }`}
          >
            {q.ten}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5 mb-4">
        <h2 className="text-base font-bold text-slate-900">{qt.ten}</h2>
        <p className="text-sm text-slate-600 mt-1">{qt.moTa}</p>
        <p className="text-xs text-slate-500 mt-2"><span className="font-semibold">Phạm vi áp dụng: </span>{qt.apDung}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-600" /> Thành phần hồ sơ
          </p>
          <ul className="space-y-1.5">
            {qt.hoSo.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />{h}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-600" /> Thời gian giải quyết
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
              <span className="shrink-0 w-7 h-7 rounded-full bg-cyan-600 text-white text-sm font-semibold flex items-center justify-center">
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
