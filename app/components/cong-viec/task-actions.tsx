'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { updateCongViecAction, deleteCongViecAction, type CongViecFormState } from '@/app/actions/cong-viec'
import { UU_TIEN_OPTIONS } from '@/lib/cong-viec-labels'

type TaskInit = {
  id: string
  tieuDe: string
  moTa: string | null
  loaiId: string | null
  uuTien: string
  nguoiPhuTrachId: string | null
  ngayBatDau: string | null   // yyyy-mm-dd
  ngayHetHan: string | null   // yyyy-mm-dd
  ghiChu: string | null
}

export function TaskActions({ task, loais, members }: {
  task: TaskInit
  loais: { id: string; ten: string }[]
  members: { id: string; name: string }[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Sửa
      </Button>
      <Button variant="outline" size="sm" onClick={() => setDelOpen(true)}
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
        <Trash2 className="w-3.5 h-3.5" /> Xoá
      </Button>

      <EditDialog open={editOpen} onOpenChange={setEditOpen} task={task} loais={loais} members={members} />
      <DeleteDialog open={delOpen} onOpenChange={setDelOpen} id={task.id} tieuDe={task.tieuDe} />
    </div>
  )
}

const selCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500'

function EditDialog({ open, onOpenChange, task, loais, members }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  task: TaskInit
  loais: { id: string; ten: string }[]
  members: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CongViecFormState, FormData>(updateCongViecAction, null)

  useEffect(() => {
    if (state?.ok) { onOpenChange(false); router.refresh() }
  }, [state, onOpenChange, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa công việc</DialogTitle>
          <DialogDescription>Cập nhật, bổ sung thông tin công việc.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-3.5">
          <input type="hidden" name="id" value={task.id} />
          {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Tiêu đề công việc *</Label>
            <Input name="tieuDe" className="h-9" defaultValue={task.tieuDe} />
            {state?.fieldErrors?.tieuDe && <p className="text-xs text-red-600">{state.fieldErrors.tieuDe[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Mô tả</Label>
            <Textarea name="moTa" rows={3} defaultValue={task.moTa || ''} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Loại công việc</Label>
              <select name="loaiId" defaultValue={task.loaiId || ''} className={selCls}>
                <option value="">— Không phân loại —</option>
                {loais.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Ưu tiên</Label>
              <select name="uuTien" defaultValue={task.uuTien} className={selCls}>
                {UU_TIEN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">Người phụ trách</Label>
              <select name="nguoiPhuTrachId" defaultValue={task.nguoiPhuTrachId || ''} className={selCls}>
                <option value="">— Chưa giao —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Bắt đầu</Label>
                <Input name="ngayBatDau" type="date" className="h-9" defaultValue={task.ngayBatDau || ''} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Hạn hoàn thành</Label>
                <Input name="ngayHetHan" type="date" className="h-9" defaultValue={task.ngayHetHan || ''} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">Ghi chú</Label>
            <Input name="ghiChu" className="h-9" defaultValue={task.ghiChu || ''} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ open, onOpenChange, id, tieuDe }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  id: string
  tieuDe: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CongViecFormState, FormData>(deleteCongViecAction, null)

  useEffect(() => {
    if (state?.ok) router.push('/dashboard/cong-viec')
  }, [state, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Xoá công việc
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xoá công việc <span className="font-medium text-slate-700">“{tieuDe}”</span>? Công việc sẽ bị ẩn khỏi danh sách.
          </DialogDescription>
        </DialogHeader>

        {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>}

        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white min-w-[90px]" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang xoá</> : 'Xoá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
