'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, MapPin, ChevronDown, Map } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Ward = { id: string; name: string }
type Street = { id: string; name: string; wardId: string | null; wardName: string | null; assetCount: number }

type Props = {
  streets: Street[]
  wards: Ward[]
  selectedStreetId?: string
}

export function StreetSearchWidget({ streets, wards, selectedStreetId }: Props) {
  const router = useRouter()
  const [wardFilter, setWardFilter] = useState<string>('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Tên tuyến đang chọn
  const selectedStreet = streets.find(s => s.id === selectedStreetId)

  // Lọc theo phường + tìm kiếm
  const filtered = useMemo(() => {
    let list = streets
    if (wardFilter) list = list.filter(s => s.wardId === wardFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    return list.slice(0, 50) // Giới hạn 50 kết quả hiển thị
  }, [streets, wardFilter, query])

  // Đưa highlight về đầu khi đổi từ khóa/phường (set-state khi render — React khuyến nghị)
  const [prevKey, setPrevKey] = useState(`${query}|${wardFilter}`)
  const filterKey = `${query}|${wardFilter}`
  if (filterKey !== prevKey) {
    setPrevKey(filterKey)
    setHighlighted(0)
  }

  function selectStreet(id: string) {
    setOpen(false)
    setQuery('')
    router.push(`/dashboard/tai-san/binh-do?streetId=${id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) selectStreet(filtered[highlighted].id) }
    else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // Scroll highlighted vào view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${highlighted}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const totalFiltered = useMemo(() => {
    let list = streets
    if (wardFilter) list = list.filter(s => s.wardId === wardFilter)
    if (query.trim()) list = list.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    return list.length
  }, [streets, wardFilter, query])

  return (
    <div className="space-y-3">
      {/* Dòng 1: Lọc phường/xã */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />Phường / Xã
          </label>
          <select
            value={wardFilter}
            onChange={e => { setWardFilter(e.target.value); setQuery(''); setOpen(false) }}
            className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">— Tất cả phường/xã ({streets.length} tuyến) —</option>
            {wards.map(w => {
              const cnt = streets.filter(s => s.wardId === w.id).length
              return (
                <option key={w.id} value={w.id}>
                  {w.name} ({cnt} tuyến)
                </option>
              )
            })}
          </select>
        </div>

        {/* Dòng 2: Tìm kiếm tên đường — combobox */}
        <div className="space-y-1 relative">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-amber-500" />Tìm tên đường
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedStreet ? selectedStreet.name : 'Nhập tên đường để tìm...'}
              className="w-full h-9 pl-9 pr-8 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown kết quả */}
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery('') }} />
              <div ref={listRef}
                className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    Không tìm thấy tuyến đường nào
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 border-b bg-slate-50 rounded-t-xl">
                      {totalFiltered > 50 ? `Hiển thị 50/${totalFiltered} kết quả — nhập thêm để lọc` : `${totalFiltered} tuyến đường`}
                    </div>
                    {filtered.map((s, idx) => (
                      <button
                        key={s.id}
                        data-idx={idx}
                        onClick={() => selectStreet(s.id)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 transition-colors border-b last:border-0
                          ${idx === highlighted ? 'bg-amber-50' : 'hover:bg-slate-50'}
                          ${s.id === selectedStreetId ? 'bg-amber-50 font-semibold' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 truncate">{s.name}</p>
                          {s.wardName && (
                            <p className="text-xs text-slate-400">{s.wardName}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {s.assetCount > 0 ? (
                            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                              {s.assetCount} tài sản
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">Chưa có TS</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tuyến đang chọn */}
      {selectedStreet && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Map className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Đang xem: <strong className="text-amber-800">{selectedStreet.name}</strong></span>
          {selectedStreet.wardName && <span className="text-slate-400">— {selectedStreet.wardName}</span>}
          <button
            onClick={() => router.push('/dashboard/tai-san/binh-do')}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline">
            Đổi tuyến
          </button>
        </div>
      )}
    </div>
  )
}

