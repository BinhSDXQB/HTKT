'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addWorkHistoryAction, type OfficeFormState } from '@/app/actions/office'
import { Plus, X } from 'lucide-react'

export function WorkForm({ canBoId }: { canBoId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(addWorkHistoryAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setOpen(false) }
  }, [state])

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800">
        <Plus className="w-4 h-4" /> Thêm quá trình công tác
      </button>
    )
  }

  return (
    <form ref={formRef} action={action} className="rounded-xl border bg-slate-50 p-4 space-y-3">
      <input type="hidden" name="canBoId" value={canBoId} />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Thêm quá trình công tác</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-600 space-y-1">
          <span>Từ ngày *</span>
          <input name="tuNgay" type="date" required className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Đến ngày</span>
          <input name="denNgay" type="date" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1 col-span-2">
          <span>Đơn vị công tác *</span>
          <input name="donVi" required className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1 col-span-2">
          <span>Chức vụ</span>
          <input name="chucVu" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1 col-span-2">
          <span>Nội dung / nhiệm vụ</span>
          <input name="noiDung" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Số quyết định</span>
          <input name="soQuyetDinh" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Ghi chú</span>
          <input name="ghiChu" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
      </div>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button disabled={pending} className="rounded-lg bg-indigo-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {pending ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-1.5 text-sm">Hủy</button>
      </div>
    </form>
  )
}
