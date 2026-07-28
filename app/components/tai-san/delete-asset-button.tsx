'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteAssetAction } from '@/app/actions/tai-san'
import { toast } from 'sonner'

export function DeleteAssetButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Xác nhận xoá tài sản "${name}"?\n\nThao tác này không thể hoàn tác.`)) return

    startTransition(async () => {
      const result = await deleteAssetAction(id)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      Xoá
    </Button>
  )
}
