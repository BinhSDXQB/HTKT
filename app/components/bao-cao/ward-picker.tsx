'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'

type Ward = { id: string; name: string; fullName: string | null }

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
}

export default function WardPicker({
  wards,
  category,
  year,
}: {
  wards: Ward[]
  category: string
  year: number
}) {
  const [q, setQ] = useState('')

  const view = useMemo(() => {
    const kw = normalize(q.trim())
    if (!kw) return wards
    return wards.filter((w) => normalize(`${w.name} ${w.fullName ?? ''}`).includes(kw))
  }, [wards, q])

  return (
    <div className="rounded-xl border bg-white">
      <div className="p-3 border-b bg-slate-50/60">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm phường/xã…"
            className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {view.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">Không tìm thấy phường/xã khớp.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
          {view.map((w) => (
            <Link
              key={w.id}
              href={`/dashboard/bao-cao/nhap-lieu/${category}?ward=${w.id}&year=${year}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition group"
            >
              <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              <span className="text-sm font-medium text-slate-700 truncate">{w.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="px-3 py-2 border-t text-xs text-slate-400">
        {view.length}/{wards.length} phường/xã
      </div>
    </div>
  )
}
