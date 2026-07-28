'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { forgotPasswordAction, type ForgotState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AuthShell } from '@/components/auth/auth-shell'

const initialState: ForgotState = null

export default function QuenMatKhauPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState)

  return (
    <AuthShell heading="Quên mật khẩu" sub="Lấy lại quyền truy cập tài khoản của bạn">
        <Card className="rounded-2xl border border-slate-200/70 shadow-[0_22px_55px_-25px_rgba(12,40,90,0.5)]">
          <CardHeader className="pb-2 pt-6 px-6">
            <p className="text-sm text-slate-600 text-center">
              Nhập đúng <b>SỐ CCCD (12 số)</b> đối với cán bộ, hoặc <b>MÃ PHƯỜNG/XÃ (5 số)</b> đối với đơn vị.
              Nhập sai định dạng hoặc tài khoản không tồn tại sẽ bị từ chối. Hệ thống gửi liên kết đặt lại mật khẩu
              tới email đăng ký (hoặc quản trị viên nếu tài khoản chưa có email).
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-4">
            {state?.success ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />{state.success}
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                {state?.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                    {state.error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Tên đăng nhập</Label>
                  <Input id="email" name="email" type="text" placeholder="Mã đơn vị hoặc CCCD" autoComplete="username" autoFocus disabled={isPending} className="h-10" />
                </div>
                <Button type="submit" className="h-11 w-full bg-gradient-to-b from-blue-600 to-blue-700 font-semibold text-white shadow-md shadow-blue-700/25 hover:from-blue-700 hover:to-blue-800" disabled={isPending}>
                  {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</> : 'Gửi liên kết đặt lại mật khẩu'}
                </Button>
              </form>
            )}

            <Link href="/login" className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700">
              <ArrowLeft className="w-4 h-4" />Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
    </AuthShell>
  )
}
