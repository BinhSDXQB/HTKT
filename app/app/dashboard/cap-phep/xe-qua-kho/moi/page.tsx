import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChevronRight } from 'lucide-react'
import { NewOversizedForm } from '@/components/cap-phep/new-oversized-form'

export default async function XeQuaKhoMoiPage() {
  await requireAuth()
  const vehicles = await db.permitVehicle.findMany({
    orderBy: { plateNumber: 'asc' },
    select: { id: true, plateNumber: true, ownerName: true },
  })

  return (
    <div className="max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/cap-phep/xe-qua-kho" className="hover:text-teal-600">Xe quá khổ, quá tải</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Tạo hồ sơ</span>
      </nav>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tạo hồ sơ cấp phép xe quá khổ, quá tải</h1>
        <p className="text-sm text-slate-500 mt-0.5">Khai báo thông tin đề nghị cấp giấy phép lưu hành</p>
      </div>
      <NewOversizedForm vehicles={vehicles} />
    </div>
  )
}
