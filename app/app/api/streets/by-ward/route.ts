import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Lấy tất cả phường/xã có tọa độ trung tâm + đường
  const wards = await db.administrativeUnit.findMany({
    where: {
      type: 'PHUONG_XA',
      isActive: true,
      centerLat: { not: null },
      centerLon: { not: null },
    },
    select: {
      id: true,
      name: true,
      code: true,
      centerLat: true,
      centerLon: true,
      streets: {
        where: { isActive: true },
        select: { id: true, name: true, length: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Chỉ trả về ward có đường
  const result = wards
    .filter(w => w.streets.length > 0)
    .map(w => ({
      id: w.id,
      name: w.name,
      code: w.code,
      lat: w.centerLat,
      lon: w.centerLon,
      streetCount: w.streets.length,
      streets: w.streets.map(s => ({
        id: s.id,
        name: s.name,
        lengthKm: s.length ? +(s.length / 1000).toFixed(2) : null,
      })),
    }))

  return NextResponse.json(result)
}
