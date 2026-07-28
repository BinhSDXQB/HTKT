'use client'

import { useTransition } from 'react'
import { Loader2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { cancelLeaveAction } from '@/app/actions/office-leave'

export function CancelLeaveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function onCancel() {
    if (!window.confirm('Huỷ đơn nghỉ phép này?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const res = await cancelLeaveAction(null, fd)
      if (res?.error) toast.error(res.error)
      else toast.success('Đã huỷ đơn')
    })
  }

  return (
    <button onClick={onCancel} disabled={isPending} title="Huỷ đơn"
      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-600">
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}Huỷ
    </button>
  )
}
