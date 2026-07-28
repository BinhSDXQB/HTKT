'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTrangThaiAction, type CongViecFormState } from '@/app/actions/cong-viec'
import { TRANG_THAI_OPTIONS } from '@/lib/cong-viec-labels'

export function StatusForm({ id, trangThai, tienDo }: { id: string; trangThai: string; tienDo: number }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CongViecFormState, FormData>(updateTrangThaiAction, null)
  const [tt, setTt] = useState(trangThai)
  const [td, setTd] = useState<number>(tienDo)

  useEffect(() => { if (state?.ok) router.refresh() }, [state, router])

  // Liên kết 2 chiều trạng thái ⇄ tiến độ (xem trước; server vẫn chốt lại khi lưu).
  function onTrangThaiChange(v: string) {
    setTt(v)
    if (v === 'HOAN_THANH') setTd(100)
    else if (td === 100) setTd(90)   // rời "Hoàn thành" → hạ khỏi 100% cho hợp lý
  }
  function onTienDoChange(raw: string) {
    const n = Math.max(0, Math.min(100, parseInt(raw, 10) || 0))
    setTd(n)
    if (n === 100 && (tt === 'MOI' || tt === 'DANG_LAM')) setTt('HOAN_THANH')
    else if (n < 100 && tt === 'HOAN_THANH') setTt('DANG_LAM')
  }

  return (
    <form action={formAction} className="rounded-xl border bg-white p-4 space-y-3">
      <p className="font-semibold text-slate-800 text-sm">Cập nhật tiến độ</p>
      <input type="hidden" name="id" value={id} />
      {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700">{state.error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Trạng thái</Label>
          <select name="trangThai" value={tt} onChange={(e) => onTrangThaiChange(e.target.value)} className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            {TRANG_THAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Tiến độ (%)</Label>
          <Input name="tienDo" type="number" min="0" max="100" value={td} onChange={(e) => onTienDoChange(e.target.value)} className="h-9" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : 'Cập nhật'}
        </Button>
      </div>
    </form>
  )
}
