'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addBinhLuanAction, type CongViecFormState } from '@/app/actions/cong-viec'

export function CommentForm({ id }: { id: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<CongViecFormState, FormData>(addBinhLuanAction, null)

  useEffect(() => { if (state?.ok) { formRef.current?.reset(); router.refresh() } }, [state, router])

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {state?.error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700">{state.error}</div>}
      <Textarea name="noiDung" rows={2} placeholder="Thêm bình luận / cập nhật tình hình..." />
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi
        </Button>
      </div>
    </form>
  )
}
