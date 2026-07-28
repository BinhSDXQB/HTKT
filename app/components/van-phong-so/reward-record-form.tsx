'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addRewardRecordAction, type OfficeFormState } from '@/app/actions/office'

type Option = { id: string; label: string }

export function RewardRecordForm({
  canBoId,
  titles,
  movements,
}: {
  canBoId: string
  titles: Option[]
  movements: Option[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<OfficeFormState, FormData>(addRewardRecordAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setOpen(false) }
  }, [state?.ok])

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="w-4 h-4" /> Thêm khen thưởng
      </Button>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border bg-slate-50/60 p-4 space-y-3">
      <input type="hidden" name="canBoId" value={canBoId} />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Thêm khen thưởng / danh hiệu</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Danh hiệu / hình thức (danh mục)</Label>
          <select name="rewardTitleId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">-- Chọn từ danh mục (hoặc nhập tay bên dưới) --</option>
            {titles.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Đợt / phong trào thi đua</Label>
          <select name="movementId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">-- Không gắn đợt --</option>
            {movements.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Năm *</Label>
          <Input name="nam" type="number" min="1990" max="2100" className="h-9" placeholder="VD: 2025" />
          {state?.fieldErrors?.nam && <p className="text-xs text-red-600">{state.fieldErrors.nam[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Danh hiệu (nhập tay nếu không có trong danh mục)</Label>
          <Input name="danhHieu" className="h-9" placeholder="VD: Lao động tiên tiến" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Cấp khen</Label>
          <Input name="capKhen" className="h-9" placeholder="Cơ sở / Tỉnh / Bộ / Nhà nước" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Cơ quan quyết định</Label>
          <Input name="coQuanQuyetDinh" className="h-9" placeholder="Cơ quan ban hành QĐ" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Số quyết định</Label>
          <Input name="soQuyetDinh" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày quyết định</Label>
          <Input name="ngayQuyetDinh" type="date" className="h-9" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium text-slate-600">Tóm tắt thành tích</Label>
          <Textarea name="thanhTich" rows={2} placeholder="Tóm tắt thành tích / minh chứng" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium text-slate-600">Ghi chú</Label>
          <Input name="ghiChu" className="h-9" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Huỷ</Button>
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : 'Lưu'}
        </Button>
      </div>
    </form>
  )
}
