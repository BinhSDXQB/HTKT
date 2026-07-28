import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus, Car, Search, ChevronRight } from 'lucide-react'

type SP = { q?: string }

export default async function PhuongTienPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (sp.q) where.OR = [
    { plateNumber: { contains: sp.q, mode: 'insensitive' } },
    { ownerName: { contains: sp.q, mode: 'insensitive' } },
  ]

  const rows = await db.permitVehicle.findMany({
    where, orderBy: { plateNumber: 'asc' },
    include: { _count: { select: { permits: true } } },
  })

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/cap-phep" className="hover:text-teal-600">Cấp phép đường bộ</Link>
        <ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-700 font-medium">Quản lý phương tiện</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Car className="w-6 h-6 text-indigo-600" />Quản lý phương tiện</h1>
          <p className="text-sm text-slate-500 mt-0.5">Hồ sơ phương tiện dùng cho cấp phép xe quá khổ, quá tải</p>
        </div>
        <Link href="/dashboard/cap-phep/phuong-tien/moi">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Plus className="w-4 h-4" />Thêm phương tiện</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <form method="GET" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm biển số, chủ xe..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
          {sp.q && <Link href="/dashboard/cap-phep/phuong-tien"><Button variant="ghost" size="sm" className="text-slate-500">Xoá lọc</Button></Link>}
        </form>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 text-sm font-medium text-slate-700">{rows.length.toLocaleString('vi')} phương tiện</div>
        {rows.length === 0 ? (
          <div className="py-20 text-center"><Car className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 text-sm">Chưa có phương tiện nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b">
                <th className="px-4 py-3 font-medium">Biển số</th>
                <th className="px-4 py-3 font-medium">Chủ xe</th>
                <th className="px-4 py-3 font-medium">Nhãn / loại</th>
                <th className="px-4 py-3 font-medium">Số trục</th>
                <th className="px-4 py-3 font-medium">Tải trọng ĐK (tấn)</th>
                <th className="px-4 py-3 font-medium">Lần cấp phép</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{v.plateNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{v.ownerName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{[v.brand, v.vehicleType].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{v.axleCount ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{v.registeredLoadTon ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{v._count.permits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
