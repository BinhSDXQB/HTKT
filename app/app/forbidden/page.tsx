import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-800">403</h1>
          <h2 className="text-xl font-semibold text-slate-700">Không có quyền truy cập</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Bạn không có quyền thực hiện thao tác này. Liên hệ quản trị viên nếu cần được cấp quyền.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className={cn(buttonVariants())}>
            Quay lại Dashboard
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }))}>
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  )
}
