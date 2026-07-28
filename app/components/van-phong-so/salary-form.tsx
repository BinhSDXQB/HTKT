'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addSalaryHistoryAction, type OfficeFormState } from '@/app/actions/office'
import { Plus, X } from 'lucide-react'

const LOAI = [
  ['THUONG_XUYEN', 'Thường xuyên'],
  ['TRUOC_HAN', 'Trước thời hạn'],
  ['DOT_XUAT', 'Đột xuất'],
  ['VUOT_KHUNG', 'Phụ cấp vượt khung'],
  ['KHAC', 'Khác'],
]

export function SalaryForm({ canBoId }: { canBoId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<OfficeFormState, FormData>(addSalaryHistoryAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) { formRef.current?.reset(); setOpen(false) }
  }, [state])

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800">
        <Plus className="w-4 h-4" /> Thêm mốc lương
      </button>
    )
  }

  return (
    <form ref={formRef} action={action} className="rounded-xl border bg-slate-50 p-4 space-y-3">
      <input type="hidden" name="canBoId" value={canBoId} />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">Thêm mốc lương mới</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="text-xs text-slate-600 space-y-1">
          <span>Loại</span>
          <select name="loai" className="w-full rounded-lg border px-2 py-1.5 text-sm bg-white">
            {LOAI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Bậc</span>
          <input name="bacLuong" type="number" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Hệ số lương *</span>
          <input name="heSoLuong" required className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Phụ cấp chức vụ</span>
          <input name="phuCapChucVu" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>% vượt khung</span>
          <input name="vuotKhung" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Ngày hưởng *</span>
          <input name="ngayHuong" type="date" required className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Ngày nâng kế tiếp</span>
          <input name="ngayNangTiep" type="date" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Số quyết định</span>
          <input name="soQuyetDinh" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>Ngày quyết định</span>
          <input name="ngayQuyetDinh" type="date" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
        </label>
      </div>
      <label className="text-xs text-slate-600 space-y-1 block">
        <span>Ghi chú</span>
        <input name="ghiChu" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
      </label>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button disabled={pending} className="rounded-lg bg-indigo-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {pending ? 'Đang lưu…' : 'Lưu mốc lương'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-1.5 text-sm">Hủy</button>
      </div>
    </form>
  )
}
