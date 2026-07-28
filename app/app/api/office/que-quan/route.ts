import { NextRequest, NextResponse } from 'next/server'
import { requireOfficeAccess } from '@/lib/auth'
import { convertQueQuan } from '@/lib/que-quan'

// Gợi ý chuyển đổi địa danh trước → sau hợp nhất (NQ 1680/NQ-UBTVQH15)
export async function GET(req: NextRequest) {
  try {
    await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const truoc = req.nextUrl.searchParams.get('truoc') ?? ''
  return NextResponse.json({ sau: convertQueQuan(truoc) })
}
