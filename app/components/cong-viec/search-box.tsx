'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ClipboardList } from 'lucide-react'
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN } from '@/lib/cong-viec-labels'

type Suggest = {
  id: string
  maCongViec: string
  tieuDe: string
  trangThai: string
  uuTien: string
  phong: string
}

type Props = {
  /** Giá trị tìm kiếm hiện tại (từ URL ?q=) */
  defaultValue?: string
  /** Các bộ lọc đang áp dụng — giữ lại khi bấm Enter để tìm */
  hidden?: Record<string, string | undefined>
}

/** Ô tìm kiếm công việc có gợi ý thông minh (autocomplete kiểu Google). */
export function SearchBox({ defaultValue = '', hidden = {} }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)
  const [items, setItems] = useState<Suggest[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Gọi API gợi ý có debounce 200ms
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setItems([]); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      try {
        const res = await fetch(`/api/cong-viec/suggest?q=${encodeURIComponent(term)}`, { signal: ac.signal })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setItems(data.items ?? [])
        setActive(-1)
      } catch {
        if (!ac.signal.aborted) setItems([])
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function buildSearchUrl(term: string): string {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(hidden)) if (v) params.set(k, v)
    const t = term.trim()
    if (t) params.set('q', t); else params.delete('q')
    const qs = params.toString()
    return qs ? `/dashboard/cong-viec?${qs}` : '/dashboard/cong-viec'
  }

  function submitSearch(term: string) {
    setOpen(false)
    router.push(buildSearchUrl(term))
  }

  function gotoTask(id: string) {
    setOpen(false)
    router.push(`/dashboard/cong-viec/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && items[active]) gotoTask(items[active].id)
      else submitSearch(q)
    } else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={boxRef} className="relative flex-1 max-w-sm">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
      {loading && <Loader2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => { if (items.length || q.trim().length >= 2) setOpen(true) }}
        onKeyDown={onKeyDown}
        placeholder="Tìm tiêu đề, mô tả, mã việc…"
        autoComplete="off"
        className="w-full h-9 pl-9 pr-9 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && q.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg overflow-hidden">
          {items.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-400">
              {loading ? 'Đang tìm…' : 'Không có gợi ý. Nhấn Enter để tìm.'}
            </div>
          ) : (
            <>
              <ul className="max-h-80 overflow-auto py-1">
                {items.map((it, i) => {
                  const tt = CONG_VIEC_TRANG_THAI[it.trangThai] ?? { label: it.trangThai, cls: 'bg-slate-100 text-slate-700' }
                  const uu = CONG_VIEC_UU_TIEN[it.uuTien]
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => gotoTask(it.id)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 ${i === active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <ClipboardList className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-slate-800 truncate">{it.tieuDe}</span>
                          <span className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-400">{it.maCongViec}</span>
                            {it.phong && <span className="text-[11px] text-slate-400">· {it.phong}</span>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tt.cls}`}>{tt.label}</span>
                            {uu && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${uu.cls}`}>{uu.label}</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                onClick={() => submitSearch(q)}
                className="w-full text-left px-3 py-2 border-t text-xs text-blue-600 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Xem tất cả kết quả cho “{q.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
