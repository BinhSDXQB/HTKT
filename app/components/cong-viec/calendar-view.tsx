'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2, MapPin, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveLichAction, deleteLichAction, type LichFormState } from '@/app/actions/lich'
import { LICH_LOAI, LICH_LOAI_OPTIONS, lichColor, HAN_CONG_VIEC_HEX } from '@/lib/lich-labels'

export type LichItem = {
  id: string; tieuDe: string; loai: string; mauSac: string | null
  batDau: string; ketThuc: string | null; diaDiem: string | null; moTa: string | null
  congKhai: boolean; userId: string; ownerName: string
}
export type TaskDeadline = { id: string; tieuDe: string; ngayHetHan: string; trangThai: string }

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function ymd(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function pad(n: number) { return String(n).padStart(2, '0') }
function toInput(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
function fmtTime(iso: string) { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

export function CalendarView({ ym, events, tasks, meId, canShare }: {
  ym: string
  events: LichItem[]
  tasks: TaskDeadline[]
  meId: string
  canShare: boolean
}) {
  const router = useRouter()
  const [year, month] = ym.split('-').map(Number) // month: 1..12
  const [modal, setModal] = useState<{ event?: LichItem; date?: string } | null>(null)

  // Lưới 6 tuần bắt đầu từ Thứ 2.
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const offset = (first.getDay() + 6) % 7
    const start = new Date(year, month - 1, 1 - offset)
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [year, month])

  const eventsByDay = useMemo(() => {
    const m = new Map<string, LichItem[]>()
    for (const e of events) { const k = ymd(new Date(e.batDau)); (m.get(k) ?? m.set(k, []).get(k)!).push(e) }
    return m
  }, [events])
  const tasksByDay = useMemo(() => {
    const m = new Map<string, TaskDeadline[]>()
    for (const t of tasks) { const k = ymd(new Date(t.ngayHetHan)); (m.get(k) ?? m.set(k, []).get(k)!).push(t) }
    return m
  }, [tasks])

  const goMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    router.push(`/dashboard/cong-viec?view=calendar&ym=${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }
  const goToday = () => { const d = new Date(); router.push(`/dashboard/cong-viec?view=calendar&ym=${d.getFullYear()}-${pad(d.getMonth() + 1)}`) }

  const todayKey = ymd(new Date())

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Thanh điều hướng tháng */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-1.5">
          <button onClick={() => goMonth(-1)} className="w-8 h-8 rounded-lg border hover:bg-slate-50 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => goMonth(1)} className="w-8 h-8 rounded-lg border hover:bg-slate-50 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          <h2 className="text-sm font-bold text-slate-900 ml-1">Tháng {month}/{year}</h2>
          <button onClick={goToday} className="text-xs text-slate-500 border rounded-lg px-2 py-1 hover:bg-slate-50 ml-1">Hôm nay</button>
        </div>
        <Button size="sm" onClick={() => setModal({ date: toInput(new Date(year, month - 1, new Date().getMonth() === month - 1 ? new Date().getDate() : 1, 8, 0)) })}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Thêm lịch
        </Button>
      </div>

      {/* Chú giải */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b bg-slate-50 text-xs">
        {LICH_LOAI_OPTIONS.map((o) => (
          <span key={o.value} className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: o.hex }} /> {o.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: HAN_CONG_VIEC_HEX }} /> Hạn công việc
        </span>
      </div>

      {/* Bọc cuộn ngang cho điện thoại hẹp — giữ ô ngày đủ rộng để đọc */}
      <div className="overflow-x-auto">
      <div className="min-w-[560px]">
      {/* Tiêu đề thứ */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 border-b">
        {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
      </div>

      {/* Lưới ngày */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = ymd(d)
          const inMonth = d.getMonth() === month - 1
          const dayEvents = eventsByDay.get(key) ?? []
          const dayTasks = tasksByDay.get(key) ?? []
          return (
            <div key={i} className={`min-h-[96px] border-b border-r p-1 ${inMonth ? 'bg-white' : 'bg-slate-50/60'} ${i % 7 === 6 ? 'border-r-0' : ''}`}>
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-medium ${key === todayKey ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : inMonth ? 'text-slate-700' : 'text-slate-300'}`}>{d.getDate()}</span>
                <button onClick={() => setModal({ date: toInput(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0)) })}
                  className="text-slate-300 hover:text-blue-600" title="Thêm lịch ngày này">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {dayEvents.map((e) => (
                  <button key={e.id} onClick={() => setModal({ event: e })}
                    className="w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded truncate text-white"
                    style={{ background: lichColor(e.loai, e.mauSac) }} title={`${e.tieuDe}${e.diaDiem ? ' · ' + e.diaDiem : ''}`}>
                    {fmtTime(e.batDau)} {e.tieuDe}
                  </button>
                ))}
                {dayTasks.map((t) => (
                  <button key={t.id} onClick={() => router.push(`/dashboard/cong-viec/${t.id}`)}
                    className="w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded truncate border"
                    style={{ borderColor: HAN_CONG_VIEC_HEX, color: HAN_CONG_VIEC_HEX }} title={`Hạn: ${t.tieuDe}`}>
                    ⏰ {t.tieuDe}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      </div>
      </div>

      {modal && (
        <LichModal
          event={modal.event}
          defaultDate={modal.date}
          meId={meId}
          canShare={canShare}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function LichModal({ event, defaultDate, meId, canShare, onClose }: {
  event?: LichItem; defaultDate?: string; meId: string; canShare: boolean; onClose: () => void
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<LichFormState, FormData>(saveLichAction, null)
  const [delState, delAction, delPending] = useActionState<LichFormState, FormData>(deleteLichAction, null)

  useEffect(() => { if (state?.ok || delState?.ok) { onClose(); router.refresh() } }, [state, delState, onClose, router])

  const readOnly = !!event && event.userId !== meId  // mục công khai của người khác
  const selCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-bold text-slate-900">{readOnly ? 'Mục lịch' : event ? 'Sửa mục lịch' : 'Thêm mục lịch'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        {readOnly ? (
          <div className="p-5 space-y-3 text-sm">
            <p className="font-semibold text-slate-900">{event.tieuDe}</p>
            <p className="text-slate-500">{new Date(event.batDau).toLocaleString('vi-VN')}{event.ketThuc ? ` → ${new Date(event.ketThuc).toLocaleString('vi-VN')}` : ''}</p>
            <p className="inline-flex items-center gap-1.5"><span className={`text-xs px-2 py-0.5 rounded-full ${LICH_LOAI[event.loai]?.cls}`}>{LICH_LOAI[event.loai]?.label}</span></p>
            {event.diaDiem && <p className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{event.diaDiem}</p>}
            {event.moTa && <p className="text-slate-600 whitespace-pre-wrap">{event.moTa}</p>}
            <p className="text-xs text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Của: {event.ownerName} · chia sẻ cho phòng</p>
          </div>
        ) : (
          <form action={formAction} className="p-5 space-y-3">
            {event && <input type="hidden" name="id" value={event.id} />}
            {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700">{state.error}</div>}

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Tiêu đề *</Label>
              <Input name="tieuDe" defaultValue={event?.tieuDe || ''} className="h-9" placeholder="VD: Họp giao ban phòng" />
              {state?.fieldErrors?.tieuDe && <p className="text-xs text-red-600">{state.fieldErrors.tieuDe[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Loại</Label>
                <select name="loai" defaultValue={event?.loai || 'HOP'} className={selCls}>
                  {LICH_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Màu (tuỳ chọn)</Label>
                <input type="color" name="mauSac" defaultValue={event?.mauSac || '#2563eb'} className="w-full h-9 border rounded-lg px-1 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Bắt đầu *</Label>
                <Input name="batDau" type="datetime-local" defaultValue={event ? toInput(new Date(event.batDau)) : (defaultDate || '')} className="h-9" />
                {state?.fieldErrors?.batDau && <p className="text-xs text-red-600">{state.fieldErrors.batDau[0]}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Kết thúc</Label>
                <Input name="ketThuc" type="datetime-local" defaultValue={event?.ketThuc ? toInput(new Date(event.ketThuc)) : ''} className="h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Địa điểm</Label>
              <Input name="diaDiem" defaultValue={event?.diaDiem || ''} className="h-9" placeholder="Phòng họp tầng 3…" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Ghi chú</Label>
              <Textarea name="moTa" rows={2} defaultValue={event?.moTa || ''} />
            </div>

            {canShare && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="congKhai" defaultChecked={event?.congKhai || false} className="w-4 h-4 rounded border-slate-300" />
                Công khai cho cả phòng cùng xem
              </label>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              {event ? (
                <button type="button" onClick={() => { const fd = new FormData(); fd.set('id', event.id); delAction(fd) }}
                  disabled={delPending} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50">
                  {delPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Xoá
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Huỷ</Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[90px]" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
