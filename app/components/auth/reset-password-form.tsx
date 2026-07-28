'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'
import { resetPasswordAction, type ResetState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/auth/password-strength'

const initialState: ResetState = null

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState)
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState('')

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{state.success}
        </div>
        <Link href="/login" className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium">
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">{state.error}</div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">Mật khẩu mới</Label>
        <div className="relative">
          <Input id="newPassword" name="newPassword" type={show ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" disabled={isPending} className="h-10 pr-10" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {state?.fieldErrors?.newPassword && <p className="text-xs text-red-600">{state.fieldErrors.newPassword[0]}</p>}
        <PasswordStrength value={pw} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</Label>
        <Input id="confirmPassword" name="confirmPassword" type={show ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" disabled={isPending} className="h-10" />
        {state?.fieldErrors?.confirmPassword && <p className="text-xs text-red-600">{state.fieldErrors.confirmPassword[0]}</p>}
      </div>

      <Button type="submit" className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white font-medium" disabled={isPending}>
        {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Đặt mật khẩu mới'}
      </Button>

      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />Quay lại đăng nhập
      </Link>
    </form>
  )
}
