import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { computeDoiSoatDuong, tomTat } from '@/lib/htkt/doi-soat'

// Đối soát 3 nguồn chiều dài đường — tính LIVE từ DB mỗi lần gọi.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = Number(new URL(req.url).searchParams.get('year') || 2025)
  const rows = await computeDoiSoatDuong(year)
  return NextResponse.json({
    year,
    tomTat: tomTat(rows),
    rows,
    capNhat: new Date().toISOString(),
  })
}
