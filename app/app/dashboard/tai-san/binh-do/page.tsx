import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Building2, ChevronRight, Map } from 'lucide-react'
import { BinhDoWrapper } from '@/components/tai-san/binh-do/binh-do-wrapper'
import { StreetSearchWidget } from '@/components/tai-san/binh-do/street-search-widget'

type SP = { streetId?: string }

export default async function BinhDoPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams

  const [streets, wards] = await Promise.all([
    db.street.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, wardId: true, ward: { select: { id: true, name: true } } },
    }),
    db.administrativeUnit.findMany({
      where: { type: 'PHUONG_XA', isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  // Thống kê tài sản có lý trình theo tuyến
  const streetStats = await db.asset.groupBy({
    by: ['streetId'],
    where: { streetId: { not: null }, lyTrinh: { not: null } },
    _count: true,
  })
  const statsMap = Object.fromEntries(streetStats.map(s => [s.streetId, s._count]))

  // Chuẩn bị data cho widget
  const streetData = streets.map(s => ({
    id:         s.id,
    name:       s.name,
    wardId:     s.wardId,
    wardName:   s.ward?.name ?? null,
    assetCount: statsMap[s.id] ?? 0,
  }))

  // Lọc wards chỉ có tuyến đường
  const wardIdsWithStreets = new Set(streets.map(s => s.wardId).filter(Boolean))
  const filteredWards = wards.filter(w => wardIdsWithStreets.has(w.id))

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />Tài sản hạ tầng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Bình đồ duỗi thẳng</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Map className="w-5 h-5 text-amber-600" />
          Bình đồ duỗi thẳng — Tài sản theo tuyến đường
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Hiển thị vị trí tài sản trên tuyến theo lý trình (Km) và bố trí trái/phải/giữa
        </p>
      </div>

      {/* Tìm kiếm tuyến đường */}
      <div className="bg-white rounded-xl border p-4">
        <StreetSearchWidget
          streets={streetData}
          wards={filteredWards}
          selectedStreetId={sp.streetId}
        />
      </div>

      {/* Hướng dẫn khi chưa chọn */}
      {!sp.streetId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-2">
          <Map className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="font-semibold text-amber-800">Chọn một tuyến đường để xem bình đồ</p>
          <p className="text-sm text-amber-600">
            Bình đồ duỗi thẳng hiển thị toàn bộ tài sản trên tuyến theo lý trình (Km+m) và bố trí Trái/Phải/Giữa.
          </p>
          <div className="text-xs text-amber-500 mt-2 space-y-1">
            <p>
              {filteredWards.length} phường/xã · {streets.length} tuyến đường ·{' '}
              Tuyến có tài sản: {Object.keys(statsMap).length}
            </p>
            <p>Để tài sản hiển thị: khi nhập tài sản → chọn tuyến đường → nhập lý trình + vị trí</p>
          </div>
        </div>
      )}

      {/* Bình đồ SVG */}
      {sp.streetId && (
        <div className="bg-white rounded-xl border p-4">
          <BinhDoWrapper streetId={sp.streetId} />
        </div>
      )}
    </div>
  )
}
