import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ChevronRight } from 'lucide-react'
import { NewConnectionForm } from '@/components/cap-phep/new-connection-form'

export default async function DauNoiMoiPage() {
  await requireAuth()
  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cap-phep/dau-noi" className="hover:text-teal-600">Đấu nối, nút giao</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Tạo hồ sơ</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tạo hồ sơ đấu nối / nút giao</h1>
        <p className="text-sm text-slate-500 mt-0.5">Khai báo thông tin đề nghị chấp thuận vị trí, thiết kế hoặc cấp phép thi công</p>
      </div>
      <NewConnectionForm />
    </div>
  )
}
