import { NextRequest, NextResponse } from 'next/server'
import { requireHtktAccess } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { taoPhien, ghiManh, xoaPhien, GIOI_HAN_PHIEN } from '@/lib/tham-dinh/phien-tai-len'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Tải thư mục hồ sơ dự án TỪ MÁY CÁN BỘ lên phiên tạm (xem lib/tham-dinh/phien-tai-len.ts).
 *
 * POST   { tenThuMuc }                                   → { phienId, gioiHan }
 * PUT    ?phienId&duongDan&offset&tong  (body = bytes)   → ghi 1 mảnh ≤ 8MB
 * DELETE ?phienId                                        → xoá phiên
 */

async function nguoiDung() {
  try { return await requireHtktAccess() } catch { return null }
}

export async function POST(req: NextRequest) {
  const user = await nguoiDung()
  if (!user) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  const body = await req.json().catch(() => null)
  const tenThuMuc = String(body?.tenThuMuc ?? '')
  const tao = await taoPhien(user.id, tenThuMuc)
  if (!tao.ok) return NextResponse.json({ error: tao.loi }, { status: 507 })
  const { phienId } = tao
  await logAction({
    userId: user.id, action: 'CREATE', module: 'htkt', targetId: phienId, targetType: 'ThamDinhHoSoPhien',
    detail: `Tải thư mục hồ sơ dự án lên để kiểm kê: ${tenThuMuc.slice(0, 150)}`,
  }).catch(() => {})
  return NextResponse.json({ phienId, gioiHan: GIOI_HAN_PHIEN })
}

export async function PUT(req: NextRequest) {
  const user = await nguoiDung()
  if (!user) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  const sp = req.nextUrl.searchParams
  const phienId = sp.get('phienId') ?? ''
  const duongDan = sp.get('duongDan') ?? ''
  const offset = Number(sp.get('offset'))
  const tong = Number(sp.get('tong'))

  // Chặn sớm theo Content-Length trước khi đọc body vào RAM.
  const khai = Number(req.headers.get('content-length') ?? '0')
  if (khai > GIOI_HAN_PHIEN.kichThuocManhToiDa) return NextResponse.json({ error: 'Mảnh dữ liệu quá lớn' }, { status: 413 })

  const manh = Buffer.from(await req.arrayBuffer())
  const kq = await ghiManh(phienId, user.id, duongDan, offset, tong, manh)
  if (!kq.ok) return NextResponse.json({ error: kq.loi }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await nguoiDung()
  if (!user) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  await xoaPhien(req.nextUrl.searchParams.get('phienId') ?? '', user.id)
  return NextResponse.json({ ok: true })
}
