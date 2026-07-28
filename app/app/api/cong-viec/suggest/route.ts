import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { congViecScopeWhere } from '@/app/actions/cong-viec'
import { buildCongViecSearchAND } from '@/lib/cong-viec-search'

export const dynamic = 'force-dynamic'

// Gợi ý "thông minh" khi gõ ô tìm kiếm công việc (autocomplete kiểu Google).
// Tách từ khoá + chỉ trả việc trong phạm vi quyền của người dùng.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ items: [] })

  const searchAND = buildCongViecSearchAND(q)
  if (!searchAND) return NextResponse.json({ items: [] })

  const scope = await congViecScopeWhere()
  const rows = await db.congViec.findMany({
    where: { ...scope, AND: searchAND } as never,
    select: {
      id: true, maCongViec: true, tieuDe: true, trangThai: true, uuTien: true,
      toChuc: { select: { tenVietTat: true, ten: true } },
    },
    orderBy: [{ trangThai: 'asc' }, { ngayHetHan: 'asc' }, { createdAt: 'desc' }],
    take: 8,
  })

  const items = rows.map((r) => ({
    id: r.id,
    maCongViec: r.maCongViec,
    tieuDe: r.tieuDe,
    trangThai: r.trangThai,
    uuTien: r.uuTien,
    phong: r.toChuc?.tenVietTat || r.toChuc?.ten || '',
  }))
  return NextResponse.json({ items })
}
