'use client'

import { useActionState, useState } from 'react'
import { Loader2, ListPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateRegularReviewListAction, type OfficeFormState } from '@/app/actions/office'

export function GenerateReviewListForm({ defaultNam }: { defaultNam: number }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<OfficeFormState, FormData>(generateRegularReviewListAction, null)

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
        <ListPlus className="w-4 h-4" /> Sinh danh sách đến hạn
      </Button>
    )
  }

  return (
    <form action={formAction} className="rounded-xl border bg-slate-50/60 p-4 space-y-3 w-full">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Sinh danh sách dự kiến nâng lương thường xuyên</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      {state?.ok && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">Đã sinh/ cập nhật danh sách. Cuộn xuống để xem.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Năm rà soát *</Label>
          <Input name="namRaSoat" type="number" min="1990" max="2100" defaultValue={defaultNam} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Trong vòng (ngày)</Label>
          <Input name="withinDays" type="number" min="1" defaultValue={90} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Tên đợt</Label>
          <Input name="dotRaSoat" className="h-9" placeholder="VD: Quý II/2025" />
        </div>
      </div>
      <p className="text-xs text-slate-500">Quét cán bộ Văn phòng Sở có mốc nâng lương kế tiếp trong khoảng (gồm quá hạn). Hồ sơ đã tồn tại trong năm sẽ được giữ nguyên.</p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Đóng</Button>
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[110px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang sinh</> : 'Sinh danh sách'}
        </Button>
      </div>
    </form>
  )
}
