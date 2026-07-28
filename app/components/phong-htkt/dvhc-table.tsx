'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react'

export type DvhcRow = {
  code: string
  name: string
  loai: 'Phường' | 'Xã' | 'Đặc khu'
  dienTichKm2: number
  danSo: number
  trungTamHc: string | null
  truocSapNhap: string | null
}

type SortKey = 'name' | 'dienTichKm2' | 'danSo' | 'matDo'
type SortDir = 'asc' | 'desc'

const nf = new Intl.NumberFormat('vi-VN')
const fmtDt = (n: number) => n.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function matDo(r: DvhcRow) {
  return r.dienTichKm2 > 0 ? r.danSo / r.dienTichKm2 : 0
}

const LOAI_BADGE: Record<DvhcRow['loai'], string> = {
  Phường: 'bg-indigo-50 text-indigo-700',
  Xã: 'bg-emerald-50 text-emerald-700',
  'Đặc khu': 'bg-amber-50 text-amber-700',
}

export function DvhcTable({ rows }: { rows: DvhcRow[] }) {
  const [q, setQ] = useState('')
  const [loai, setLoai] = useState<'all' | DvhcRow['loai']>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let r = rows.filter((x) => {
      const okLoai = loai === 'all' || x.loai === loai
      const okKw =
        !kw ||
        x.name.toLowerCase().includes(kw) ||
        (x.truocSapNhap ?? '').toLowerCase().includes(kw) ||
        x.code.includes(kw)
      return okLoai && okKw
    })
    r = [...r].sort((a, b) => {
      let va: number | string
      let vb: number | string
      switch (sortKey) {
        case 'name': va = a.name; vb = b.name; break
        case 'dienTichKm2': va = a.dienTichKm2; vb = b.dienTichKm2; break
        case 'danSo': va = a.danSo; vb = b.danSo; break
        case 'matDo': va = matDo(a); vb = matDo(b); break
      }
      let cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'vi') : (va as number) - (vb as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return r
  }, [rows, q, loai, sortKey, sortDir])

  const tongDt = filtered.reduce((s, r) => s + r.dienTichKm2, 0)
  const tongDs = filtered.reduce((s, r) => s + r.danSo, 0)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 inline" />
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-600 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-600 inline" />
    )
  }

  function exportCsv() {
    const head = ['STT', 'Tên đơn vị', 'Loại', 'Diện tích (km2)', 'Dân số', 'Mật độ (người/km2)', 'Trung tâm hành chính', 'Sáp nhập từ', 'Mã ĐVHC']
    const lines = filtered.map((r, i) =>
      [i + 1, r.name, r.loai, r.dienTichKm2, r.danSo, Math.round(matDo(r)), r.trungTamHc ?? '', r.truocSapNhap ?? '', r.code]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob(['﻿' + head.join(',') + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'don-vi-hanh-chinh-quang-tri.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên đơn vị, đơn vị cũ, mã…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
        </div>
        <select
          value={loai}
          onChange={(e) => setLoai(e.target.value as 'all' | DvhcRow['loai'])}
          className="px-3 py-2 rounded-lg border text-sm bg-white"
        >
          <option value="all">Tất cả loại</option>
          <option value="Phường">Phường</option>
          <option value="Xã">Xã</option>
          <option value="Đặc khu">Đặc khu</option>
        </select>
        <button
          onClick={exportCsv}
          className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-slate-50 flex items-center gap-1.5 text-slate-700"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-2">
        Hiển thị <b>{filtered.length}</b> đơn vị · Tổng diện tích <b>{fmtDt(tongDt)}</b> km² · Tổng dân số{' '}
        <b>{nf.format(tongDs)}</b> người
      </p>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-left">
              <th className="px-3 py-2.5 font-semibold w-10">#</th>
              <th className="px-3 py-2.5 font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Đơn vị <SortIcon k="name" />
              </th>
              <th className="px-3 py-2.5 font-semibold text-right cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('dienTichKm2')}>
                Diện tích (km²) <SortIcon k="dienTichKm2" />
              </th>
              <th className="px-3 py-2.5 font-semibold text-right cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('danSo')}>
                Dân số <SortIcon k="danSo" />
              </th>
              <th className="px-3 py-2.5 font-semibold text-right cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('matDo')}>
                Mật độ <SortIcon k="matDo" />
              </th>
              <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Trung tâm hành chính / Hợp thành từ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.code} className="border-t hover:bg-cyan-50/30 align-top">
                <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-slate-800">{r.name}</div>
                  <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${LOAI_BADGE[r.loai]}`}>
                    {r.loai}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{fmtDt(r.dienTichKm2)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{nf.format(r.danSo)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap">{nf.format(Math.round(matDo(r)))}</td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-slate-500 max-w-md">
                  {r.trungTamHc && r.trungTamHc !== 'đang cập nhật' && (
                    <div className="text-slate-600">📍 {r.trungTamHc}</div>
                  )}
                  {r.truocSapNhap && r.truocSapNhap !== 'giữ nguyên' ? (
                    <div className="mt-0.5">Hợp thành từ: {r.truocSapNhap}</div>
                  ) : r.truocSapNhap === 'giữ nguyên' ? (
                    <div className="mt-0.5 text-emerald-600">Giữ nguyên, không sáp nhập</div>
                  ) : null}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  Không tìm thấy đơn vị phù hợp.
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-slate-50 font-semibold text-slate-700">
                <td className="px-3 py-2.5" colSpan={2}>Tổng cộng ({filtered.length} đơn vị)</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmtDt(tongDt)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{nf.format(tongDs)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{nf.format(Math.round(tongDt > 0 ? tongDs / tongDt : 0))}</td>
                <td className="hidden lg:table-cell" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
