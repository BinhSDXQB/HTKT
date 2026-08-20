import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { streamDocx } from '@/lib/office-doc-store'
import { buildVanBanDocx, TEN_FILE_MAU } from '@/lib/htkt/van-ban-docx'
import { isMauBieuPhongKey } from '@/lib/phong/mau-bieu'

// Tải mẫu .docx HÀNH CHÍNH DÙNG CHUNG (thể thức NĐ 30/2020) cho MỌI phòng/đơn vị.
// Khác /api/htkt/mau-bieu/[key] (chỉ Phòng HTKT): endpoint này chỉ yêu cầu đăng nhập,
// và chỉ phục vụ bộ mẫu chung — không lộ mẫu chuyên môn riêng của HTKT.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  if (!isMauBieuPhongKey(key)) {
    return NextResponse.json({ error: 'Không tìm thấy mẫu' }, { status: 404 })
  }

  const buf = await buildVanBanDocx(key, {})
  const fileName = `${TEN_FILE_MAU[key] ?? 'Mau_van_ban'}.docx`
  return streamDocx(buf, fileName)
}
