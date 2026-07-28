import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react'

export default async function ProfilePage() {
  const user = await requireAuth()
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { mustChangePassword: true } })
  const mustChange = dbUser?.mustChangePassword ?? false

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-slate-600" />Đổi mật khẩu
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Tài khoản: {user.name} ({user.email})</p>
      </div>

      {/* Banner bắt buộc đổi mật khẩu */}
      {mustChange ? (
        <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            Bắt buộc đổi mật khẩu trước khi sử dụng hệ thống
          </div>
          <p className="text-sm text-red-600">
            Tài khoản của bạn đang dùng mật khẩu mặc định. Vì lý do an toàn bảo mật,
            bạn phải đổi mật khẩu mới trước khi tiếp tục sử dụng hệ thống.
          </p>
          <PasswordRules />
        </div>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Tài khoản đang được bảo mật tốt
          </div>
          <p className="text-xs text-green-600 mt-1">
            Bạn vẫn có thể đổi mật khẩu bất cứ lúc nào để tăng cường bảo mật.
          </p>
          <PasswordRules />
        </div>
      )}

      <ChangePasswordForm />
    </div>
  )
}

function PasswordRules() {
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs font-semibold text-slate-700">Yêu cầu mật khẩu mới:</p>
      <ul className="space-y-1 text-xs text-slate-600">
        {[
          ['Ít nhất 8 ký tự', '8+'],
          ['Có ít nhất 1 chữ HOA (A–Z)', 'A'],
          ['Có ít nhất 1 chữ thường (a–z)', 'a'],
          ['Có ít nhất 1 chữ số (0–9)', '9'],
          ['Có ít nhất 1 ký tự đặc biệt: ! @ # $ % ^ & * ...', '!'],
        ].map(([rule, icon]) => (
          <li key={rule} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
              {icon}
            </span>
            {rule}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-2">
        Ví dụ hợp lệ: <span className="font-mono font-semibold">MyPass@2025</span>
      </p>
    </div>
  )
}
