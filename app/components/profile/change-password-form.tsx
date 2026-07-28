'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/auth/password-strength'
import { changePasswordAction } from '@/app/actions/auth'

type FieldName = 'currentPassword' | 'newPassword' | 'confirmPassword'
const FIELDS: [FieldName, string][] = [
  ['currentPassword', 'Mật khẩu hiện tại'],
  ['newPassword', 'Mật khẩu mới (tối thiểu 8 ký tự)'],
  ['confirmPassword', 'Xác nhận mật khẩu mới'],
]

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null)
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [newPw, setNewPw] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const toggle = (name: string) => setShown((s) => ({ ...s, [name]: !s[name] }))

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      formRef.current?.reset()
      setNewPw('')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      {state?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{state.success}</div>}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        {FIELDS.map(([name, label]) => (
          <div key={name} className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">{label}</Label>
            <div className="relative">
              <Input
                name={name}
                type={shown[name] ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                className="h-9 pr-10"
                {...(name === 'newPassword' ? { value: newPw, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value) } : {})}
              />
              <button
                type="button"
                onClick={() => toggle(name)}
                tabIndex={-1}
                aria-label={shown[name] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={shown[name] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {shown[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {name === 'newPassword' && <PasswordStrength value={newPw} />}
            {state?.fieldErrors?.[name] && (
              <p className="text-xs text-red-600">{state.fieldErrors[name]![0]}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md shadow-blue-700/25 min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Đổi mật khẩu'}
        </Button>
      </div>
    </form>
  )
}
