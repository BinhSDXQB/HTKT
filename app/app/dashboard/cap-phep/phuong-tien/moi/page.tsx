import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ChevronRight } from 'lucide-react'
import { NewVehicleForm } from '@/components/cap-phep/new-vehicle-form'

export default async function PhuongTienMoiPage() {
  await requireAuth()
  return (
    <div className="max-w-2xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cap-phep/phuong-tien" className="hover:text-teal-600">Quản lý phương tiện</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Thêm mới</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Thêm phương tiện</h1>
        <p className="text-sm text-slate-500 mt-0.5">Khai báo hồ sơ phương tiện để sử dụng khi cấp phép</p>
      </div>
      <NewVehicleForm />
    </div>
  )
}
