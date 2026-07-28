'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN } from '@/lib/cong-viec-labels'

// Biểu đồ Gantt cho Quản lý công việc — dựng thuần CSS/SVG, không thư viện ngoài.
// Dữ liệu lấy ĐỘNG từ CSDL (phòng/loại/việc cha/customFields qua FK & jsonb);
// người dùng tự chọn cách GOM NHÓM linh hoạt, không cố định cứng.

export type GanttTask = {
  id: string; maCongViec: string; tieuDe: string
  trangThai: string; uuTien: string; tienDo: number
  start: string | null; end: string | null   // YYYY-MM-DD
  phong: string; loai: string | null; cha: string | null
  phuTrach: string | null
  custom: Record<string, unknown> | null
}

const DAY = 86_400_000
const LEFT_W = 288

const BAR_COLOR: Record<string, string> = {
  MOI: 'bg-slate-400', DANG_LAM: 'bg-blue-500', TAM_DUNG: 'bg-amber-500',
  CHO_DUYET: 'bg-violet-500', HOAN_THANH: 'bg-emerald-500', HUY: 'bg-rose-400',
}
const UU_DOT: Record<string, string> = {
  THAP: 'bg-slate-300', TRUNG_BINH: 'bg-sky-400', CAO: 'bg-orange-400', KHAN_CAP: 'bg-rose-500',
}

const pad = (n: number) => String(n).padStart(2, '0')
const dayIdx = (iso: string) => Math.round(Date.parse(iso + 'T00:00:00Z') / DAY)
const idxToUTC = (idx: number) => new Date(idx * DAY)
function todayIso() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function fmtVN(iso: string | null) { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

export function GanttView({ tasks }: { tasks: GanttTask[] }) {
  const dated = useMemo(() => tasks.filter((t) => t.start || t.end), [tasks])
  const undated = useMemo(() => tasks.filter((t) => !t.start && !t.end), [tasks])

  // ── Khoảng thời gian (snap về đầu/cuối tháng) + đường "hôm nay" ──
  const range = useMemo(() => {
    const tI = dayIdx(todayIso())
    let minI = tI, maxI = tI
    for (const t of dated) {
      const s = dayIdx(t.start ?? t.end!); const e = dayIdx(t.end ?? t.start!)
      minI = Math.min(minI, s, e); maxI = Math.max(maxI, s, e)
    }
    const sd = idxToUTC(minI)
    const startIdx = Math.round(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), 1) / DAY)
    const ed = idxToUTC(maxI)
    const endIdx = Math.round(Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth() + 1, 1) / DAY) - 1
    return { startIdx, endIdx, totalDays: endIdx - startIdx + 1, todayIdx: tI }
  }, [dated])

  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>(
    () => (range.totalDays <= 45 ? 'day' : range.totalDays <= 200 ? 'week' : 'month'),
  )
  const pxPerDay = zoom === 'day' ? 28 : zoom === 'week' ? 12 : 4
  const chartW = range.totalDays * pxPerDay
  const todayLeft = (range.todayIdx - range.startIdx) * pxPerDay

  // ── Lựa chọn gom nhóm động (gồm cả khóa trong customFields) ──
  const groupDefs = useMemo(() => {
    const base = [
      { key: 'phong', label: 'Phòng' },
      { key: 'loai', label: 'Loại việc' },
      { key: 'cha', label: 'Việc cha' },
      { key: 'trangThai', label: 'Trạng thái' },
      { key: 'uuTien', label: 'Ưu tiên' },
    ]
    const ckeys = new Set<string>()
    for (const t of tasks) if (t.custom) for (const k of Object.keys(t.custom)) ckeys.add(k)
    for (const k of [...ckeys].sort((a, b) => a.localeCompare(b, 'vi'))) base.push({ key: 'custom:' + k, label: 'Trường: ' + k })
    base.push({ key: '', label: 'Không nhóm' })
    return base
  }, [tasks])
  const [groupKey, setGroupKey] = useState('phong')

  function groupVal(t: GanttTask, key: string): string {
    if (key === '') return ''
    if (key === 'phong') return t.phong || '— Chưa rõ phòng —'
    if (key === 'loai') return t.loai || '— Không phân loại —'
    if (key === 'cha') return t.cha || '— Việc độc lập —'
    if (key === 'trangThai') return CONG_VIEC_TRANG_THAI[t.trangThai]?.label || t.trangThai
    if (key === 'uuTien') return CONG_VIEC_UU_TIEN[t.uuTien]?.label || t.uuTien
    if (key.startsWith('custom:')) {
      const k = key.slice(7); const v = t.custom?.[k]
      return v == null || v === '' ? `— ${k}: trống —` : String(v)
    }
    return ''
  }

  const sortTasks = (ts: GanttTask[]) =>
    [...ts].sort((a, b) => (a.start ?? a.end ?? '9999').localeCompare(b.start ?? b.end ?? '9999') || a.maCongViec.localeCompare(b.maCongViec))

  const groups = useMemo(() => {
    if (groupKey === '') return [{ label: '', tasks: sortTasks(dated) }]
    const m = new Map<string, GanttTask[]>()
    for (const t of dated) { const g = groupVal(t, groupKey); if (!m.has(g)) m.set(g, []); m.get(g)!.push(t) }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi')).map(([label, ts]) => ({ label, tasks: sortTasks(ts) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dated, groupKey])

  // ── Dải tháng + mốc ngày + cuối tuần cho header/nền ──
  const months = useMemo(() => {
    const out: { label: string; left: number; width: number }[] = []
    let cur = idxToUTC(range.startIdx)
    for (let guard = 0; guard < 400; guard++) {
      const mStartIdx = Math.round(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 1) / DAY)
      if (mStartIdx > range.endIdx) break
      const days = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0)).getUTCDate()
      out.push({ label: `Th${cur.getUTCMonth() + 1}/${cur.getUTCFullYear()}`, left: (mStartIdx - range.startIdx) * pxPerDay, width: days * pxPerDay })
      cur = idxToUTC(Math.round(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1) / DAY))
    }
    return out
  }, [range, pxPerDay])

  const showDays = pxPerDay >= 22 && range.totalDays <= 200
  const showWeekend = pxPerDay >= 8 && range.totalDays <= 400
  const days = useMemo(() => {
    if (!showWeekend && !showDays) return []
    const out: { left: number; date: number; weekend: boolean }[] = []
    for (let i = range.startIdx; i <= range.endIdx; i++) {
      const d = idxToUTC(i); const dow = d.getUTCDay()
      out.push({ left: (i - range.startIdx) * pxPerDay, date: d.getUTCDate(), weekend: dow === 0 || dow === 6 })
    }
    return out
  }, [range, pxPerDay, showWeekend, showDays])

  const ROW_H = 38

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Thanh công cụ: gom nhóm + thu/phóng + chú giải */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 border-b">
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <Layers className="w-3.5 h-3.5 text-slate-400" /> Nhóm theo:
          <select value={groupKey} onChange={(e) => setGroupKey(e.target.value)}
            className="h-8 px-2 text-xs border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            {groupDefs.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </label>

        <div className="inline-flex items-center gap-1 text-xs text-slate-600">
          <span className="text-slate-400">Phóng:</span>
          {(['month', 'week', 'day'] as const).map((z) => (
            <button key={z} onClick={() => setZoom(z)}
              className={`px-2 h-7 rounded-md border text-xs ${zoom === z ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}>
              {z === 'month' ? 'Tháng' : z === 'week' ? 'Tuần' : 'Ngày'}
            </button>
          ))}
          <ZoomOut className="w-3.5 h-3.5 text-slate-300 ml-0.5" /><ZoomIn className="w-3.5 h-3.5 text-slate-300" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 lg:ml-auto">
          {Object.entries(CONG_VIEC_TRANG_THAI).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-sm ${BAR_COLOR[k] || 'bg-slate-300'}`} />{v.label}
            </span>
          ))}
        </div>
      </div>

      {dated.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">Chưa có công việc nào có mốc thời gian (ngày bắt đầu/hạn) để vẽ Gantt.</div>
      ) : (
        <div className="overflow-auto max-h-[72vh] relative">
          <div style={{ width: LEFT_W + chartW }} className="relative">
            {/* HEADER */}
            <div className="flex sticky top-0 z-20 bg-white border-b">
              <div className="sticky left-0 z-10 bg-white border-r flex items-center px-3 h-10 text-xs font-medium text-slate-500" style={{ width: LEFT_W }}>
                Công việc · {dated.length}
              </div>
              <div className="relative h-10" style={{ width: chartW }}>
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 h-5 border-r border-slate-200 flex items-center justify-center text-[11px] font-medium text-slate-600"
                    style={{ left: m.left, width: m.width }}>{m.width >= 38 ? m.label : ''}</div>
                ))}
                {showDays && days.map((d, i) => (
                  <div key={i} className={`absolute top-5 h-5 border-r text-[9px] flex items-center justify-center ${d.weekend ? 'text-rose-400 bg-rose-50/50' : 'text-slate-400 border-slate-100'}`}
                    style={{ left: d.left, width: pxPerDay }}>{d.date}</div>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div className="relative">
              {/* Nền: cuối tuần + lưới tháng + đường hôm nay */}
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: LEFT_W, width: chartW }}>
                {!showDays && showWeekend && days.filter((d) => d.weekend).map((d, i) => (
                  <div key={i} className="absolute top-0 bottom-0 bg-slate-50" style={{ left: d.left, width: pxPerDay }} />
                ))}
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: m.left }} />
                ))}
                <div className="absolute top-0 bottom-0 w-px bg-rose-400" style={{ left: todayLeft }}>
                  <span className="absolute -top-0 left-1 text-[9px] text-rose-500 bg-white/80 px-0.5 rounded">Hôm nay</span>
                </div>
              </div>

              {groups.map((g) => (
                <Fragment key={g.label || '__all'}>
                  {g.label !== '' && (
                    <div className="flex">
                      <div className="sticky left-0 z-10 bg-slate-100 border-r border-b px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5" style={{ width: LEFT_W }}>
                        {g.label}<span className="text-slate-400 font-normal">({g.tasks.length})</span>
                      </div>
                      <div className="bg-slate-100/70 border-b" style={{ width: chartW }} />
                    </div>
                  )}
                  {g.tasks.map((t) => {
                    const s = dayIdx(t.start ?? t.end!); let e = dayIdx(t.end ?? t.start!); if (e < s) e = s
                    const left = (s - range.startIdx) * pxPerDay
                    const width = Math.max((e - s + 1) * pxPerDay, 6)
                    const overdue = t.end != null && dayIdx(t.end) < range.todayIdx && t.trangThai !== 'HOAN_THANH' && t.trangThai !== 'HUY'
                    const color = BAR_COLOR[t.trangThai] || 'bg-slate-400'
                    const tip = `${t.maCongViec} • ${t.tieuDe}\nPhòng: ${t.phong || '—'}\nPhụ trách: ${t.phuTrach || '—'}\nBắt đầu: ${fmtVN(t.start)} • Hạn: ${fmtVN(t.end)}\nTiến độ: ${t.tienDo}% • ${CONG_VIEC_TRANG_THAI[t.trangThai]?.label || t.trangThai}${overdue ? ' • QUÁ HẠN' : ''}`
                    return (
                      <div key={t.id} className="flex group" style={{ height: ROW_H }}>
                        <Link href={`/dashboard/cong-viec/${t.id}`}
                          className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-b flex items-center gap-2 px-3 overflow-hidden" style={{ width: LEFT_W }}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${UU_DOT[t.uuTien] || 'bg-slate-300'}`} title={`Ưu tiên: ${CONG_VIEC_UU_TIEN[t.uuTien]?.label || t.uuTien}`} />
                          <span className="text-xs text-slate-700 truncate group-hover:text-blue-700">{t.tieuDe}</span>
                        </Link>
                        <div className="relative border-b" style={{ width: chartW }}>
                          <Link href={`/dashboard/cong-viec/${t.id}`} title={tip}
                            className={`absolute top-1.5 h-6 rounded-md ${color} ${overdue ? 'ring-2 ring-rose-500' : ''} shadow-sm overflow-hidden flex items-center hover:brightness-110`}
                            style={{ left, width }}>
                            <div className="absolute inset-y-0 left-0 bg-black/25" style={{ width: `${t.tienDo}%` }} />
                            {width >= 34 && <span className="relative text-[10px] text-white font-medium px-1.5 drop-shadow">{t.tienDo}%</span>}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div className="p-3 border-t bg-slate-50/60">
          <p className="text-xs font-medium text-slate-500 mb-1.5">{undated.length} việc chưa có mốc thời gian (không vẽ lên Gantt):</p>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((t) => (
              <Link key={t.id} href={`/dashboard/cong-viec/${t.id}`}
                className="text-[11px] bg-white border rounded-full px-2 py-0.5 text-slate-600 hover:border-blue-300 hover:text-blue-700 truncate max-w-[240px]">
                {t.tieuDe}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
