'use client'

import { useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteLeaveAction } from '@/app/actions/office-leave'

export function DeleteLeaveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function onDelete() {
    if (!window.confirm('Xoá hẳn đơn nghỉ phép này khỏi hệ thống? Thao tác không thể hoàn tác.')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const res = await deleteLeaveAction(null, fd)
      if (res?.error) toast.error(res.error)
      else toast.success('Đã xoá đơn')
    })
  }

  return (
    <button onClick={onDelete} disabled={isPending} title="Xoá đơn"
      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-600">
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Xoá
    </button>
  )
}
