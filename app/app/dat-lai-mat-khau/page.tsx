import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AuthShell } from '@/components/auth/auth-shell'

export const dynamic = 'force-dynamic'

export default async function DatLaiMatKhauPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  return (
    <AuthShell heading="Đặt lại mật khẩu" sub="Tạo mật khẩu mới cho tài khoản của bạn">
        <Card className="rounded-2xl border border-slate-200/70 shadow-[0_22px_55px_-25px_rgba(12,40,90,0.5)]">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-base font-semibold text-slate-700 text-center">Tạo mật khẩu mới cho tài khoản</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {!token ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  Liên kết không hợp lệ (thiếu mã token). Vui lòng yêu cầu đặt lại mật khẩu lại từ đầu.
                </div>
                <Link href="/quen-mat-khau" className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium">
                  Yêu cầu lại
                </Link>
              </div>
            ) : (
              <ResetPasswordForm token={token} />
            )}
          </CardContent>
        </Card>
    </AuthShell>
  )
}
