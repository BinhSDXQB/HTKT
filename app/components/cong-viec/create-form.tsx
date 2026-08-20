'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCongViecAction, type CongViecFormState } from '@/app/actions/cong-viec'
import { UU_TIEN_OPTIONS } from '@/lib/cong-viec-labels'

export function CongViecCreateForm({ loais, members, phongs, hasPhong, initialTieuDe = '', initialMoTa = '' }: {
  loais: { id: string; ten: string }[]
  members: { id: string; name: string }[]
  phongs: { id: string; ten: string }[]
  hasPhong: boolean
  initialTieuDe?: string
  initialMoTa?: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CongViecFormState, FormData>(createCongViecAction, null)

  useEffect(() => {
    if (state?.ok && state.id) router.push(`/dashboard/cong-viec/${state.id}`)
  }, [state, router])

  const selCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form action={formAction} className="rounded-xl border bg-white p-5 space-y-4">
      {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}

      {!hasPhong && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Phòng phụ trách *</Label>
          <select name="toChucId" required defaultValue="" className={selCls}>
            <option value="" disabled>— Chọn phòng —</option>
            {phongs.map((p) => <option key={p.id} value={p.id}>{p.ten}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">Tiêu đề công việc *</Label>
        <Input name="tieuDe" defaultValue={initialTieuDe} className="h-9" placeholder="VD: Tham mưu kế hoạch chiếu sáng đô thị 2026" />
        {state?.fieldErrors?.tieuDe && <p className="text-xs text-red-600">{state.fieldErrors.tieuDe[0]}</p>}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">Mô tả</Label>
        <Textarea name="moTa" defaultValue={initialMoTa} rows={3} placeholder="Nội dung, yêu cầu công việc" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Loại công việc</Label>
          <select name="loaiId" defaultValue="" className={selCls}>
            <option value="">— Không phân loại —</option>
            {loais.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Ưu tiên</Label>
          <select name="uuTien" defaultValue="TRUNG_BINH" className={selCls}>
            {UU_TIEN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">Người phụ trách</Label>
          <select name="nguoiPhuTrachId" defaultValue="" className={selCls}>
            <option value="">— Chưa giao —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Bắt đầu</Label>
            <Input name="ngayBatDau" type="date" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Hạn hoàn thành</Label>
            <Input name="ngayHetHan" type="date" className="h-9" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">Ghi chú</Label>
        <Input name="ghiChu" className="h-9" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push('/dashboard/cong-viec')}>Huỷ</Button>
        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang tạo</> : 'Tạo công việc'}
        </Button>
      </div>
    </form>
  )
}
