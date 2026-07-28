'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addEvaluationAction, type OfficeFormState } from '@/app/actions/office'
import { MUC_XEP_LOAI_OPTIONS } from '@/lib/office-labels'

export function EvaluationForm({ canBoId, defaultNam }: { canBoId: string; defaultNam?: number }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<OfficeFormState, FormData>(addEvaluationAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setOpen(false) }
  }, [state?.ok])

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="w-4 h-4" /> Đánh giá năm
      </Button>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border bg-slate-50/60 p-4 space-y-3">
      <input type="hidden" name="canBoId" value={canBoId} />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Đánh giá, xếp loại hằng năm</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <p className="text-xs text-slate-500">Mỗi cán bộ chỉ một đánh giá/năm — nhập lại cùng năm sẽ ghi đè.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Năm *</Label>
          <Input name="nam" type="number" min="1990" max="2100" defaultValue={defaultNam} className="h-9" placeholder="VD: 2025" />
          {state?.fieldErrors?.nam && <p className="text-xs text-red-600">{state.fieldErrors.nam[0]}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Mức xếp loại *</Label>
          <select name="mucXepLoai" defaultValue="HOAN_THANH_TOT_NHIEM_VU" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            {MUC_XEP_LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Số quyết định</Label>
          <Input name="soQuyetDinh" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ngày quyết định</Label>
          <Input name="ngayQuyetDinh" type="date" className="h-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" name="laChienSiThiDua" className="w-4 h-4 rounded border-slate-300" />
          Đạt Chiến sĩ thi đua cơ sở năm này
        </label>
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
