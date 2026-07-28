'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertTriangle, Pencil } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateLeaveAction } from '@/app/actions/office-leave'
import { LOAI_NGHI_PHEP_OPTIONS } from '@/lib/office-labels'
import { workingDays, calendarDays, endDateForLeave, formatYmd } from '@/lib/working-days'
import { LY_DO_SUGGESTIONS } from '@/lib/leave-reasons'
import { CheDoNghiNote } from '@/components/nghi-phep/che-do-note'

const inputCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500'

function toDateInput(v: string | Date): string {
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type EditableLeave = {
  id: string
  loaiNghi: string
  tuNgay: string | Date
  denNgay: string | Date
  soNgay: number
  lyDo: string | null
  nguoiBanGiao: string | null
  noiNghi: string | null
  dienThoaiLienHe: string | null
  deNghiUngLuong: boolean
  daKy: boolean
}

type Colleague = { hoTen: string; chucVu: string }

export function EditLeaveDialog({ leave, conLai, dongNghiep = [], noiNghiGoiY = [] }: { leave: EditableLeave; conLai: number; dongNghiep?: Colleague[]; noiNghiGoiY?: string[] }) {
  const listId = `dong-nghiep-${leave.id}`
  const noiNghiListId = `noi-nghi-${leave.id}`
  const lyDoListId = `ly-do-${leave.id}`
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(updateLeaveAction, null)

  const [loaiNghi, setLoaiNghi] = useState(leave.loaiNghi)
  const [tuNgay, setTuNgay] = useState(toDateInput(leave.tuNgay))
  const [denNgay, setDenNgay] = useState(toDateInput(leave.denNgay))
  const [soNgay, setSoNgay] = useState(String(leave.soNgay ?? ''))

  const { soDuongLich, soLamViec, soNghiTrongKy } = useMemo(() => {
    if (!tuNgay || !denNgay) return { soDuongLich: 0, soLamViec: 0, soNghiTrongKy: 0 }
    const a = new Date(tuNgay); const b = new Date(denNgay)
    const dl = calendarDays(a, b)
    const lv = workingDays(a, b)
    return { soDuongLich: dl, soLamViec: lv, soNghiTrongKy: dl - lv }
  }, [tuNgay, denNgay])

  const soNgayTuTinh = loaiNghi === 'PHEP_NAM' ? soLamViec : soDuongLich
  const soNgayHieuLuc = soNgay ? Number(soNgay) : soNgayTuTinh
  const vuotDinhMuc = loaiNghi === 'PHEP_NAM' && soNgayHieuLuc > conLai

  function autoDenNgay(loai: string, tu: string, so: string): string {
    const n = Number(so)
    if (!tu || !so || !(n > 0)) return ''
    const end = endDateForLeave(loai, new Date(tu), n)
    return end ? formatYmd(end) : ''
  }
  function onTuNgay(v: string) {
    setTuNgay(v)
    if (soNgay) setDenNgay(autoDenNgay(loaiNghi, v, soNgay))
  }
  function onSoNgay(v: string) {
    setSoNgay(v)
    if (tuNgay && v) setDenNgay(autoDenNgay(loaiNghi, tuNgay, v))
  }
  function onDenNgay(v: string) {
    setDenNgay(v)
    setSoNgay('')
  }
  function onLoaiNghi(v: string) {
    setLoaiNghi(v)
    if (tuNgay && soNgay) setDenNgay(autoDenNgay(v, tuNgay, soNgay))
  }

  useEffect(() => {
    if (state?.ok) {
      if (state.warning) toast.warning(state.warning, { duration: 8000 })
      else toast.success('Đã cập nhật đơn nghỉ phép')
      setOpen(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button title="Sửa đơn"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600" />
        }
      >
        <Pencil className="w-3.5 h-3.5" />Sửa
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa đơn nghỉ phép</DialogTitle>
        </DialogHeader>

        {leave.daKy && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Đơn đã có chữ ký số. Sửa nội dung sẽ làm bản PDF đã ký <b>không còn khớp</b>, cần ký lại.</span>
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={leave.id} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Loại nghỉ</Label>
              <select name="loaiNghi" value={loaiNghi} onChange={(e) => onLoaiNghi(e.target.value)} className={inputCls}>
                {LOAI_NGHI_PHEP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700 h-9">
                <input type="checkbox" name="deNghiUngLuong" defaultChecked={leave.deNghiUngLuong} className="w-4 h-4" />
                Đề nghị ứng lương
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Từ ngày *</Label>
              <Input name="tuNgay" type="date" className="h-9" value={tuNgay} onChange={(e) => onTuNgay(e.target.value)} />
              {state?.fieldErrors?.tuNgay && <p className="text-xs text-red-600">{state.fieldErrors.tuNgay[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Đến ngày *</Label>
              <Input name="denNgay" type="date" className="h-9" value={denNgay} onChange={(e) => onDenNgay(e.target.value)} />
              {state?.fieldErrors?.denNgay && <p className="text-xs text-red-600">{state.fieldErrors.denNgay[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Số ngày (tự tính đến ngày)</Label>
              <Input name="soNgay" type="number" step="0.5" placeholder={soNgayTuTinh ? String(soNgayTuTinh) : 'vd: 3'}
                className="h-9" value={soNgay} onChange={(e) => onSoNgay(e.target.value)} />
            </div>
          </div>

          {soDuongLich > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              Khoảng nghỉ: <b className="text-slate-800">{soDuongLich}</b> ngày dương lịch
              {soNghiTrongKy > 0 && <> · <b className="text-slate-800">{soNghiTrongKy}</b> ngày T7/CN/lễ</>}
              {' · '}<b className="text-emerald-700">{soLamViec}</b> ngày làm việc
              {loaiNghi === 'PHEP_NAM' && <> → trừ <b>{soNgayHieuLuc}</b> ngày phép</>}
            </div>
          )}

          {vuotDinhMuc && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Số ngày phép ({soNgayHieuLuc}) <b>vượt</b> số phép năm còn lại ({conLai} ngày).</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Người nhận bàn giao</Label>
              <Input name="nguoiBanGiao" className="h-9" defaultValue={leave.nguoiBanGiao ?? ''} list={listId}
                placeholder={dongNghiep.length ? 'Chọn/nhập người cùng phòng' : undefined} />
              {dongNghiep.length > 0 && (
                <datalist id={listId}>
                  {dongNghiep.map((c) => (
                    <option key={c.hoTen} value={c.hoTen}>{c.chucVu}</option>
                  ))}
                </datalist>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Điện thoại liên hệ</Label>
              <Input name="dienThoaiLienHe" className="h-9" defaultValue={leave.dienThoaiLienHe ?? ''} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nơi nghỉ / địa chỉ liên hệ</Label>
            <Input name="noiNghi" className="h-9" defaultValue={leave.noiNghi ?? ''} list={noiNghiListId}
              placeholder={noiNghiGoiY.length ? 'Chọn nơi ở / quê quán, hoặc nhập địa chỉ khác' : undefined} />
            {noiNghiGoiY.length > 0 && (
              <datalist id={noiNghiListId}>
                {noiNghiGoiY.map((v, i) => <option key={i} value={v}>{i === 0 ? 'Nơi ở hiện nay' : 'Quê quán'}</option>)}
              </datalist>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lý do</Label>
            <input name="lyDo" list={lyDoListId} autoComplete="off" defaultValue={leave.lyDo ?? ''}
              placeholder="Chọn gợi ý hoặc nhập lý do cụ thể"
              className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <datalist id={lyDoListId}>
              {LY_DO_SUGGESTIONS.map((v) => <option key={v} value={v} />)}
            </datalist>
            <CheDoNghiNote />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose render={<Button type="button" variant="outline" />}>Huỷ</DialogClose>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[110px]" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
