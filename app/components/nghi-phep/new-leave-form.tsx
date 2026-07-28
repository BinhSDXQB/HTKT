'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createLeaveAction } from '@/app/actions/office-leave'
import { LOAI_NGHI_PHEP_OPTIONS } from '@/lib/office-labels'
import { workingDays, calendarDays, endDateForLeave, formatYmd } from '@/lib/working-days'
import { LY_DO_SUGGESTIONS } from '@/lib/leave-reasons'
import { CheDoNghiNote } from '@/components/nghi-phep/che-do-note'

const inputCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500'

type Colleague = { hoTen: string; chucVu: string }

type Props = {
  canBo: { hoTen: string; chucVu: string; donVi: string }
  conLai: number
  dinhMuc: number
  soThang?: number
  daNghi?: number
  dongNghiep?: Colleague[]
  soDienThoai?: string
  noiNghiGoiY?: string[]
}

export function NewLeaveForm({ canBo, conLai, dinhMuc, soThang = 0, daNghi = 0, dongNghiep = [], soDienThoai = '', noiNghiGoiY = [] }: Props) {
  const [state, formAction, isPending] = useActionState(createLeaveAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  const [loaiNghi, setLoaiNghi] = useState('PHEP_NAM')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  const [soNgay, setSoNgay] = useState('')

  // Phép năm: chỉ tính NGÀY LÀM VIỆC (trừ T7/CN/lễ). Loại khác: ngày dương lịch.
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

  // Suy "đến ngày" từ "từ ngày" + "số ngày" (tiện cho người nhập theo số ngày).
  function autoDenNgay(loai: string, tu: string, so: string): string {
    const n = Number(so)
    if (!tu || !so || !(n > 0)) return ''
    const end = endDateForLeave(loai, new Date(tu), n)
    return end ? formatYmd(end) : ''
  }
  function onTuNgay(v: string) {
    setTuNgay(v)
    if (soNgay) setDenNgay(autoDenNgay(loaiNghi, v, soNgay)) // giữ số ngày, dời đến ngày
  }
  function onSoNgay(v: string) {
    setSoNgay(v)
    if (tuNgay && v) setDenNgay(autoDenNgay(loaiNghi, tuNgay, v)) // nhập số ngày → tự tính đến ngày
  }
  function onDenNgay(v: string) {
    setDenNgay(v)
    setSoNgay('') // chuyển sang chế độ tính theo khoảng ngày
  }
  function onLoaiNghi(v: string) {
    setLoaiNghi(v)
    if (tuNgay && soNgay) setDenNgay(autoDenNgay(v, tuNgay, soNgay)) // đổi loại → tính lại đến ngày
  }

  useEffect(() => {
    if (state?.ok) {
      if (state.warning) toast.warning(state.warning, { duration: 7000 })
      else toast.success('Đã gửi đơn nghỉ phép')
      formRef.current?.reset()
      setLoaiNghi('PHEP_NAM'); setTuNgay(''); setDenNgay(''); setSoNgay('')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800">Tạo đơn nghỉ phép</h3>
        <p className="text-xs text-slate-500">
          {canBo.hoTen}{canBo.chucVu ? ` — ${canBo.chucVu}` : ''}{canBo.donVi ? ` · ${canBo.donVi}` : ''}
        </p>
      </div>

      {/* Thông tin số năm công tác & tính toán ngày phép */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-blue-700 font-medium">Thâm niên</p>
            <p className="font-semibold text-blue-900">{Math.floor(soThang / 12)} năm {soThang % 12} tháng</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 font-medium">Định mức năm nay</p>
            <p className="font-semibold text-blue-900">{dinhMuc} ngày</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 font-medium">Còn lại</p>
            <p className="font-semibold text-blue-900">{conLai} ngày</p>
          </div>
        </div>
        <p className="text-xs text-blue-700">
          <span className="text-blue-600 font-medium">Đã sử dụng:</span> {daNghi} ngày
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Loại nghỉ</Label>
          <select name="loaiNghi" value={loaiNghi} onChange={(e) => onLoaiNghi(e.target.value)} className={inputCls}>
            {LOAI_NGHI_PHEP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700 h-9">
            <input type="checkbox" name="deNghiUngLuong" className="w-4 h-4" />
            Đề nghị ứng lương (chuyển Phòng KH-TC)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Diễn giải cách tính ngày */}
      {soDuongLich > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 space-y-0.5">
          <p>
            Khoảng nghỉ: <b className="text-slate-800">{soDuongLich}</b> ngày dương lịch
            {soNghiTrongKy > 0 && <> · trong đó <b className="text-slate-800">{soNghiTrongKy}</b> ngày T7/CN/lễ</>}
            {' · '}<b className="text-emerald-700">{soLamViec}</b> ngày làm việc.
          </p>
          {loaiNghi === 'PHEP_NAM'
            ? <p className="text-slate-500">Phép năm chỉ trừ <b>ngày làm việc</b> (Điều 113 BLLĐ 2019) → trừ <b>{soNgay ? Number(soNgay) : soLamViec}</b> ngày phép.</p>
            : <p className="text-slate-500">Loại nghỉ này tính theo ngày dương lịch → <b>{soNgay ? Number(soNgay) : soDuongLich}</b> ngày.</p>}
        </div>
      )}

      {vuotDinhMuc && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Số ngày phép ({soNgayHieuLuc}) <b>vượt</b> số phép năm còn lại ({conLai} ngày). Vẫn gửi được nhưng cấp trên sẽ cân nhắc.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Người nhận bàn giao công việc</Label>
          <Input name="nguoiBanGiao" className="h-9" list="dong-nghiep-list"
            placeholder={dongNghiep.length ? 'Chọn/nhập người cùng phòng' : 'Họ tên người bàn giao'} />
          {dongNghiep.length > 0 && (
            <datalist id="dong-nghiep-list">
              {dongNghiep.map((c) => (
                <option key={c.hoTen} value={c.hoTen}>{c.chucVu}</option>
              ))}
            </datalist>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Điện thoại liên hệ</Label>
          <Input name="dienThoaiLienHe" className="h-9" defaultValue={soDienThoai} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Nơi nghỉ / địa chỉ liên hệ</Label>
        <Input name="noiNghi" className="h-9" list="noi-nghi-list"
          placeholder={noiNghiGoiY.length ? 'Chọn nơi ở / quê quán, hoặc nhập địa chỉ khác' : 'Nhập nơi nghỉ / địa chỉ'} />
        {noiNghiGoiY.length > 0 && (
          <datalist id="noi-nghi-list">
            {noiNghiGoiY.map((v, i) => <option key={i} value={v}>{i === 0 ? 'Nơi ở hiện nay' : 'Quê quán'}</option>)}
          </datalist>
        )}
        <p className="text-[11px] text-slate-400">Gợi ý: nơi ở hiện nay, quê quán — hoặc nhập địa chỉ khác (nêu rõ).</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Lý do</Label>
        <input name="lyDo" list="ly-do-list" autoComplete="off"
          placeholder="Chọn gợi ý hoặc nhập lý do cụ thể"
          className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        <datalist id="ly-do-list">
          {LY_DO_SUGGESTIONS.map((v) => <option key={v} value={v} />)}
        </datalist>
        <CheDoNghiNote />
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</> : 'Gửi đơn'}
        </Button>
      </div>
    </form>
  )
}
