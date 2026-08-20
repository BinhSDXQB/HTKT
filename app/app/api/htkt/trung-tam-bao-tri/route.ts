import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { layDuLieuTrungTam } from '@/lib/htkt/trung-tam-bao-tri'

// Dữ liệu Trung tâm Quản lý, bảo trì GT & HTKT: tuyến quản lý (khớp tên geojson) + trạm XLNT.
// Bản đồ dùng để enrich "đơn vị quản lý" cho tuyến + vẽ điểm trạm XLNT.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await layDuLieuTrungTam()
  return NextResponse.json(data)
}
