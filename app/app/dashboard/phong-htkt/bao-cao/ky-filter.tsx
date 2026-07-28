'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KyType } from '@/lib/htkt/bao-cao'

// Các tháng thuộc từng quý — dùng để liên kết ô Quý ↔ Tháng.
const QUY_THANG: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
}
const quyCuaThang = (m: number) => Math.ceil(m / 3)

export function KyFilter({
  kyType, y, q, m, years,
}: { kyType: KyType; y: number; q: number; m: number; years: number[] }) {
  const router = useRouter()
  const [ky, setKy] = useState<KyType>(kyType)
  const [year, setYear] = useState(y)
  // Quý hiển thị luôn đồng bộ với tháng đang chọn ở chế độ Tháng
  const [quy, setQuy] = useState(kyType === 'THANG' ? quyCuaThang(m) : q)
  const [thang, setThang] = useState(m)

  const thangTrongQuy = QUY_THANG[quy] ?? [1, 2, 3]

  function onKyChange(value: KyType) {
    setKy(value)
    if (value === 'THANG' && !thangTrongQuy.includes(thang)) {
      setThang(thangTrongQuy[0])
    }
  }

  function onQuyChange(nq: number) {
    setQuy(nq)
    // Chọn Quý mới → đưa Tháng về tháng đầu của quý nếu tháng cũ không thuộc quý
    if (!QUY_THANG[nq].includes(thang)) setThang(QUY_THANG[nq][0])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    p.set('ky', ky)
    p.set('y', String(year))
    if (ky === 'THANG') {
      p.set('q', String(quy))
      p.set('m', String(thang))
    } else if (ky === 'QUY') {
      p.set('q', String(quy))
    }
    router.push(`?${p.toString()}`)
  }

  const selCls = 'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm'

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 mb-6 rounded-xl border bg-white p-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Kỳ báo cáo</label>
        <select value={ky} onChange={(e) => onKyChange(e.target.value as KyType)} className={selCls}>
          <option value="THANG">Tháng (giao ban)</option>
          <option value="QUY">Quý</option>
          <option value="NAM">Năm</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Năm</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selCls}>
          {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
        </select>
      </div>

      {/* Quý: hiện ở chế độ Tháng & Quý (ẩn khi xem cả Năm) */}
      {ky !== 'NAM' && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Quý</label>
          <select value={quy} onChange={(e) => onQuyChange(Number(e.target.value))} className={selCls}>
            {[1, 2, 3, 4].map((qq) => <option key={qq} value={qq}>Quý {qq}</option>)}
          </select>
        </div>
      )}

      {/* Tháng: chỉ hiện ở chế độ Tháng, và CHỈ liệt kê các tháng trong Quý đã chọn */}
      {ky === 'THANG' && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tháng</label>
          <select value={thang} onChange={(e) => setThang(Number(e.target.value))} className={selCls}>
            {thangTrongQuy.map((mm) => <option key={mm} value={mm}>Tháng {mm}</option>)}
          </select>
        </div>
      )}

      <button type="submit" className="text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg">Xem</button>
    </form>
  )
}
