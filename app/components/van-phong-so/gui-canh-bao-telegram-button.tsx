'use client'

import { useActionState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendHoSoThieuTelegramAction, type TelegramAlertState } from '@/app/actions/office-telegram'

export function GuiCanhBaoTelegramButton({ count }: { count: number }) {
  const [state, formAction, isPending] = useActionState<TelegramAlertState, FormData>(
    sendHoSoThieuTelegramAction,
    null,
  )

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || count === 0}
          className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending ? 'Đang gửi…' : `Gửi cảnh báo Telegram (${count})`}
        </Button>
      </form>
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </div>
      )}
    </div>
  )
}
