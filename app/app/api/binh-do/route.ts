import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const streetId = req.nextUrl.searchParams.get('streetId')
  if (!streetId) return NextResponse.json({ error: 'Thiếu streetId' }, { status: 400 })

  const [street, assets] = await Promise.all([
    db.street.findUnique({
      where: { id: streetId },
      include: { ward: { select: { name: true } } },
    }),
    db.asset.findMany({
      where: { streetId, lyTrinh: { not: null } },
      orderBy: { lyTrinh: 'asc' },
      select: {
        id: true, assetCode: true, name: true, condition: true, status: true,
        domain: true, lyTrinh: true, viTriDuong: true,
        latitude: true, longitude: true, address: true,
        assetType: { select: { name: true, code: true } },
      },
    }),
  ])

  if (!street) return NextResponse.json({ error: 'Không tìm thấy tuyến đường' }, { status: 404 })

  return NextResponse.json({ street, assets })
}
