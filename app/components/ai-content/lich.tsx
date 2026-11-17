'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, List, TriangleAlert } from 'lucide-react'
import { goi, gioVn, NhanLich, NUT_PHU, TEN_KENH, THE } from './dung-chung'

type Muc = { id: string; content_id: string; channel: string; adapter: string; status: string; scheduled_at_utc: string; title: string }

const VN = 'Asia/Ho_Chi_Minh'
const ngayVn = new Intl.DateTimeFormat('en-CA', { timeZone: VN })               // YYYY-MM-DD theo giờ VN
const gioPhut = new Intl.DateTimeFormat('vi-VN', { timeZone: VN, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Nửa đêm giờ Việt Nam (UTC+7, không đổi giờ mùa) của ngày y-m-d, dưới dạng Date UTC. */
const nuaDemVn = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - 7 * 3600e3)

export function AiLich() {
  const homNay = ngayVn.format(new Date())
  const [nam, setNam] = useState(() => Number(homNay.slice(0, 4)))
  const [thang, setThang] = useState(() => Number(homNay.slice(5, 7)) - 1)
  const [kieu, setKieu] = useState<'thang' | 'ds'>('thang')
  const [muc, setMuc] = useState<Muc[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  const luot = useRef(0)
  const tai = useCallback(async () => {
    // Chuyển tháng nhanh: phản hồi của tháng cũ về muộn KHÔNG được ghi đè tháng đang xem.
    const cuaToi = ++luot.current
    setMuc(null); setLoi(null)
    try {
      const tu = nuaDemVn(nam, thang, 1).toISOString()
      const den = nuaDemVn(nam, thang + 1, 1).toISOString()
      const kq = await goi<{ items: Muc[] }>(`/api/ai/v1/lich?tu=${encodeURIComponent(tu)}&den=${encodeURIComponent(den)}`)
      if (cuaToi === luot.current) setMuc(kq.items)
    } catch (e) { if (cuaToi === luot.current) setLoi((e as Error).message) }
  }, [nam, thang])
  useEffect(() => {
    const t = setTimeout(() => { void tai() }, 0)
    return () => clearTimeout(t)
  }, [tai])

  const doi = (d: number) => {
    const t = new Date(Date.UTC(nam, thang + d, 1))
    setNam(t.getUTCFullYear()); setThang(t.getUTCMonth())
  }

  const theoNgay = useMemo(() => {
    const m = new Map<string, Muc[]>()
    for (const x of muc ?? []) {
      const k = ngayVn.format(new Date(x.scheduled_at_utc))
      m.set(k, [...(m.get(k) ?? []), x])
    }
    return m
  }, [muc])

  const o = useMemo(() => {
    const soNgay = new Date(Date.UTC(nam, thang + 1, 0)).getUTCDate()
    const lech = (new Date(Date.UTC(nam, thang, 1)).getUTCDay() + 6) % 7       // tuần bắt đầu thứ Hai
    const ds: (string | null)[] = Array.from({ length: lech }, () => null)
    for (let d = 1; d <= soNgay; d++) ds.push(`${nam}-${String(thang + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    while (ds.length % 7) ds.push(null)
    return ds
  }, [nam, thang])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/ai-workspace" className={NUT_PHU}><ArrowLeft className="h-4 w-4" />Danh sách</Link>
        <h1 className="mr-auto text-lg font-bold text-slate-900 dark:text-slate-100">Lịch xuất bản</h1>
        <button onClick={() => doi(-1)} className={NUT_PHU} aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button>
        <span className="w-32 text-center text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200" aria-live="polite">Tháng {thang + 1}/{nam}</span>
        <button onClick={() => doi(1)} className={NUT_PHU} aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button>
        <div className="flex rounded-md border border-slate-300 dark:border-slate-700" role="group" aria-label="Kiểu xem">
          <button onClick={() => setKieu('thang')} aria-pressed={kieu === 'thang'} className={`flex items-center gap-1 rounded-l-md px-3 py-2 text-sm ${kieu === 'thang' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}><LayoutGrid className="h-4 w-4" />Tháng</button>
          <button onClick={() => setKieu('ds')} aria-pressed={kieu === 'ds'} className={`flex items-center gap-1 rounded-r-md px-3 py-2 text-sm ${kieu === 'ds' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}><List className="h-4 w-4" />Danh sách</button>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Giờ hiển thị theo giờ Việt Nam. Muốn đổi lịch: mở bài, huỷ lịch cũ rồi đặt lại.</p>

      {loi && <div role="alert" className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200"><TriangleAlert className="h-4 w-4" />Không tải được lịch: {loi}</div>}
      {!loi && muc === null && <div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}

      {!loi && muc && kieu === 'thang' && (
        <div className={`${THE} overflow-x-auto p-2`}>
          <div className="grid min-w-[700px] grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
            {THU.map((t) => <div key={t} className="bg-slate-50 py-1.5 text-center text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">{t}</div>)}
            {o.map((ngay, i) => (
              <div key={i} className={`min-h-24 p-1.5 ${ngay ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}`}>
                {ngay && (
                  <>
                    <p className={`mb-1 text-xs tabular-nums ${ngay === homNay ? 'inline-block rounded-full bg-indigo-600 px-1.5 font-semibold text-white' : 'text-slate-500 dark:text-slate-400'}`}>{Number(ngay.slice(8))}</p>
                    <ul className="space-y-1">
                      {(theoNgay.get(ngay) ?? []).map((x) => (
                        <li key={x.id}>
                          <Link href={`/dashboard/ai-workspace/${x.content_id}`} title={`${x.title} — ${TEN_KENH[x.channel]}`}
                            className="block rounded border border-slate-200 px-1.5 py-1 text-xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800">
                            <span className="tabular-nums text-slate-500 dark:text-slate-400">{gioPhut.format(new Date(x.scheduled_at_utc))}</span>{' '}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{TEN_KENH[x.channel]}</span>
                            <span className="block truncate text-slate-600 dark:text-slate-300">{x.title}</span>
                            <NhanLich tt={x.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loi && muc && kieu === 'ds' && (
        <div className={THE}>
          {muc.length === 0 ? <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Tháng này chưa có lịch đăng nào.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {muc.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="w-36 shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{gioVn(x.scheduled_at_utc)}</span>
                  <span className="w-20 shrink-0 font-medium text-slate-800 dark:text-slate-200">{TEN_KENH[x.channel]}</span>
                  <Link href={`/dashboard/ai-workspace/${x.content_id}`} className="min-w-0 flex-1 truncate text-indigo-700 hover:underline dark:text-indigo-300">{x.title}</Link>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{x.adapter === 'dry_run' ? 'chạy thử' : 'đăng tay'}</span>
                  <NhanLich tt={x.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!loi && muc && kieu === 'thang' && muc.length === 0 && <p className="text-center text-sm text-slate-500 dark:text-slate-400">Tháng này chưa có lịch đăng nào.</p>}
    </div>
  )
}
