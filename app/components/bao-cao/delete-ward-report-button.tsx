'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteWardReportAction } from '@/app/actions/ward-reports'

export function DeleteWardReportButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Xóa bộ dữ liệu này? Hành động không thể hoàn tác.')) return
    startTransition(async () => {
      await deleteWardReportAction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      Xóa
    </button>
  )
}
