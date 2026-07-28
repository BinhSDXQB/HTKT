'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addSalaryHistoryAction, type OfficeFormState } from '@/app/actions/office'

const LOAI_OPTIONS = [
  { value: 'THUONG_XUYEN', label: 'Nâng lương thường xuyên' },
  { value: 'TRUOC_HAN', label: 'Nâng lương trước thời hạn' },
  { value: 'DOT_XUAT', label: 'Nâng lương đột xuất' },
  { value: 'VUOT_KHUNG', label: 'Phụ cấp thâm niên vượt khung' },
  { value: 'KHAC', label: 'Khác' },
]

export function SalaryHistoryForm({ canBoId }: { canBoId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<OfficeFormState, FormData>(addSalaryHistoryAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      setOpen(false)
    }
  }, [state?.ok])

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="w-4 h-4" /> Thêm mốc lương
      </Button>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border bg-slate-50/60 p-4 space-y-3">
      <input type="hidden" name="canBoId" value={canBoId} />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Thêm mốc lương</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Loại</Label>
          <select name="loai" defaultValue="THUONG_XUYEN" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            {LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Bậc lương</Label>
          <Input name="bacLuong" type="number" min="1" className="h-9" placeholder="VD: 3" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Hệ số lương *</Label>
          <Input name="heSoLuong" className="h-9" placeholder="VD: 3.00" />
          {state?.fieldErrors?.heSoLuong && <p className="text-xs text-red-600">{state.fieldErrors.heSoLuong[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Phụ cấp chức vụ</Label>
          <Input name="phuCapChucVu" className="h-9" placeholder="VD: 0.30" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">% Vượt khung</Label>
          <Input name="vuotKhung" className="h-9" placeholder="VD: 5" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày hưởng *</Label>
          <Input name="ngayHuong" type="date" className="h-9" />
          {state?.fieldErrors?.ngayHuong && <p className="text-xs text-red-600">{state.fieldErrors.ngayHuong[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Nâng lương kế tiếp (dự kiến)</Label>
          <Input name="ngayNangTiep" type="date" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Số quyết định</Label>
          <Input name="soQuyetDinh" className="h-9" placeholder="Số QĐ lương" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày quyết định</Label>
          <Input name="ngayQuyetDinh" type="date" className="h-9" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium text-slate-600">Ghi chú</Label>
          <Input name="ghiChu" className="h-9" placeholder="Ghi chú (nếu có)" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Huỷ</Button>
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : 'Lưu mốc lương'}
        </Button>
      </div>
    </form>
  )
}
