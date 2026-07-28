'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Eye, EyeOff, Loader2, Mail, Phone, MessageCircle, KeyRound } from 'lucide-react'
import { loginAction, type LoginState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const initialState: LoginState = null

export type AdminContact = { email: string; phone: string; tenCoQuan: string }

function onlyDigits(s: string): string {
  return (s || '').replace(/\D/g, '')
}

export function LoginForm({ contact }: { contact: AdminContact }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  const phoneDigits = onlyDigits(contact.phone)
  const mailSubject = encodeURIComponent('[QLHTKT] Hỗ trợ đăng nhập / cấp lại mật khẩu')
  const mailBody = encodeURIComponent(
    `Kính gửi Quản trị hệ thống ${contact.tenCoQuan},\n\n` +
    'Tôi không đăng nhập được vào hệ thống QLHTKT. Đề nghị hỗ trợ kiểm tra / cấp lại mật khẩu.\n\n' +
    'Họ tên: ..................................................\n' +
    'Đơn vị / Phòng: .....................................\n' +
    'Tên đăng nhập (mã đơn vị hoặc CCCD): ......................\n' +
    'Số điện thoại liên hệ: ............................\n\n' +
    'Trân trọng cảm ơn.'
  )
  const mailtoHref = `mailto:${contact.email}?subject=${mailSubject}&body=${mailBody}`

  return (
    <Card className="rounded-2xl border border-slate-200/70 shadow-[0_22px_55px_-25px_rgba(12,40,90,0.5)]">
      <CardContent className="px-6 py-6">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-3">
                <p className="text-sm text-red-700 font-medium">{state.error}</p>

                {/* Đăng nhập sai → kênh liên hệ Admin */}
                <div className="border-t border-red-200 pt-2.5">
                  <p className="text-xs font-semibold text-red-800 mb-1.5">Cần hỗ trợ? Liên hệ Quản trị hệ thống:</p>
                  <div className="flex flex-col gap-1.5">
                    <a href={mailtoHref}
                      className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-blue-700">
                      <Mail className="w-3.5 h-3.5 shrink-0" />Gửi email: {contact.email}
                    </a>
                    {phoneDigits && (
                      <>
                        <a href={`https://zalo.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-blue-700">
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />Zalo: {contact.phone}
                        </a>
                        <a href={`tel:${phoneDigits}`}
                          className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-blue-700">
                          <Phone className="w-3.5 h-3.5 shrink-0" />Hotline: {contact.phone}
                        </a>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 italic">
                    Lưu ý: lần đầu đăng nhập, sau khi vào hệ thống hãy đổi mật khẩu ngay để bảo mật.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Tên đăng nhập</Label>
              <Input
                id="email" name="email" type="text"
                placeholder="Mã đơn vị hoặc email" autoComplete="username" autoFocus
                disabled={isPending} aria-invalid={!!state?.fieldErrors?.email} className="h-10"
              />
              {state?.fieldErrors?.email && <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  disabled={isPending} aria-invalid={!!state?.fieldErrors?.password} className="h-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state?.fieldErrors?.password && <p className="text-xs text-red-600">{state.fieldErrors.password[0]}</p>}
              <div className="flex justify-end">
                <Link href="/quen-mat-khau" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline">
                  <KeyRound className="w-3.5 h-3.5" />Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full bg-gradient-to-b from-blue-600 to-blue-700 text-[15px] font-semibold text-white shadow-md shadow-blue-700/25 hover:from-blue-700 hover:to-blue-800" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đăng nhập...</> : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
    </Card>
  )
}
