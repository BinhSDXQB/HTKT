import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GeoJSON FeatureCollection endpoint cho bản đồ MapLibre
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain')
  const assetTypeId = searchParams.get('assetTypeId')
  const wardId = searchParams.get('wardId')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: { not: 'THOAI_HOA' },
    latitude: { not: null },
    longitude: { not: null },
  }
  if (domain) where.domain = domain
  if (assetTypeId) where.assetTypeId = assetTypeId
  // CÔ LẬP DỮ LIỆU: tài khoản phường/xã chỉ được xem tài sản của phường mình,
  // dù truyền wardId khác trên URL. Tài khoản Sở xem toàn tỉnh như cũ.
  if (user.wardId) where.wardId = user.wardId
  else if (wardId) where.wardId = wardId

  const assets = await db.asset.findMany({
    where,
    select: {
      id: true,
      assetCode: true,
      name: true,
      domain: true,
      geometryType: true,
      latitude: true,
      longitude: true,
      elevation: true,
      geojson: true,
      condition: true,
      status: true,
      address: true,
      techSpecs: true,
      assetType: { select: { name: true, code: true } },
      ward: { select: { name: true } },
      street: { select: { name: true } },
    },
    take: 5000, // Giới hạn để tránh timeout
  })

  // Chuyển sang GeoJSON FeatureCollection
  const features = assets
    .map((asset) => {
      // LINE / POLYGON geometry từ geojson field
      if ((asset.geometryType === 'LINE' || asset.geometryType === 'POLYGON') && asset.geojson) {
        const gj = asset.geojson as { type: string; coordinates: unknown[] }
        return {
          type: 'Feature',
          geometry: gj,
          properties: buildProperties(asset),
        }
      }

      // POINT geometry từ lat/lng
      if (asset.latitude != null && asset.longitude != null) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              asset.longitude,
              asset.latitude,
              asset.elevation ?? 0,
            ],
          },
          properties: buildProperties(asset),
        }
      }
      return null
    })
    .filter(Boolean)

  return NextResponse.json({
    type: 'FeatureCollection',
    features,
  })
}

function buildProperties(asset: {
  id: string; assetCode: string; name: string; domain: string
  condition: string; status: string; address?: string | null
  assetType: { name: string; code: string }
  ward?: { name: string } | null
  street?: { name: string } | null
  techSpecs?: unknown
}) {
  return {
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    domain: asset.domain,
    condition: asset.condition,
    status: asset.status,
    address: asset.address ?? '',
    assetTypeName: asset.assetType.name,
    assetTypeCode: asset.assetType.code,
    wardName: asset.ward?.name ?? '',
    streetName: asset.street?.name ?? '',
    techSpecs: asset.techSpecs ?? {},
  }
}
