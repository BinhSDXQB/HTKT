import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { MapWrapper } from '@/components/gis/map-wrapper'

type SP = { domain?: string; assetTypeId?: string }

// Tọa độ trung tâm tỉnh Quảng Trị (sau sáp nhập — bao gồm cả vùng Quảng Bình cũ)
const PROVINCE = { lat: 17.10, lng: 106.85, zoom: 8 }

// Tọa độ xấp xỉ các phường đô thị (khi chưa có tài sản nào)
const PHUONG_COORDS: Record<string, { lat: number; lng: number }> = {
  '18859': { lat: 17.4655, lng: 106.5986 }, // Phường Đồng Thuận
  '18871': { lat: 17.4700, lng: 106.6050 }, // Phường Đồng Sơn
  '18880': { lat: 17.4722, lng: 106.6014 }, // Phường Đồng Hới
  '19009': { lat: 17.7500, lng: 106.4167 }, // Phường Ba Đồn
  '19066': { lat: 17.6500, lng: 106.4800 }, // Phường Bắc Gianh
  '19333': { lat: 16.8139, lng: 107.0961 }, // Phường Đông Hà
  '19351': { lat: 16.7950, lng: 107.1000 }, // Phường Nam Đông Hà
  '19360': { lat: 16.7500, lng: 107.1833 }, // Phường Quảng Trị
}

async function resolveMapCenter(userEmail: string) {
  // Phường/xã: email = mã đơn vị (5 chữ số)
  const isWardUser = /^\d{5}$/.test(userEmail)
  if (!isWardUser) return PROVINCE

  const ward = await db.administrativeUnit.findUnique({
    where: { code: userEmail },
    select: { id: true, code: true, name: true },
  })
  if (!ward) return PROVINCE

  // Ưu tiên 1: tính centroid từ tài sản có toạ độ trong phường
  const assets = await db.asset.findMany({
    where: { wardId: ward.id, latitude: { not: null }, longitude: { not: null } },
    select: { latitude: true, longitude: true },
    take: 200,
  })

  if (assets.length > 0) {
    const lat = assets.reduce((s, a) => s + a.latitude!, 0) / assets.length
    const lng = assets.reduce((s, a) => s + a.longitude!, 0) / assets.length
    return { lat, lng, zoom: 15 }
  }

  // Ưu tiên 2: tọa độ xấp xỉ phường đô thị đã khai báo
  const fixed = PHUONG_COORDS[ward.code]
  if (fixed) return { ...fixed, zoom: 14 }

  // Mặc định: toàn tỉnh
  return PROVINCE
}

export default async function BanDoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireAuth()
  const sp = await searchParams

  const [config, assetTypes, mapCenter, totalWithCoords, totalAssets] = await Promise.all([
    db.facilityConfig.findFirst(),
    db.assetType.findMany({
      where: { isActive: true },
      orderBy: [{ domain: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, code: true, domain: true },
    }),
    resolveMapCenter(user.email),
    db.asset.count({ where: { latitude: { not: null }, longitude: { not: null } } }),
    db.asset.count(),
  ])

  const isWardUser = /^\d{5}$/.test(user.email)

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-1.5rem)] sm:h-[calc(100dvh-3.5rem-3rem)] -m-3 sm:-m-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-800">Bản đồ GIS Hạ tầng kỹ thuật</h1>
          <p className="text-xs text-slate-500">
            {totalWithCoords.toLocaleString('vi')}/{totalAssets.toLocaleString('vi')} tài sản có toạ độ
            {config?.tenCoQuan ? ` · ${config.tenCoQuan}` : ''}
            {isWardUser ? ' · Đang xem địa bàn của bạn' : ' · Toàn tỉnh'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Dữ liệu OSM</span>
          <span>|</span>
          <span>MapLibre GL</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0">
        <MapWrapper
          domain={sp.domain}
          assetTypeId={sp.assetTypeId}
          assetTypes={assetTypes}
          centerLat={mapCenter.lat}
          centerLng={mapCenter.lng}
          zoom={mapCenter.zoom}
        />
      </div>
    </div>
  )
}
