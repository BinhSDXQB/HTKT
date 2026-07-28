import { NextRequest, NextResponse } from 'next/server'
import { requireHtktAccess } from '@/lib/auth'
import { streamDocx } from '@/lib/office-doc-store'
import { buildVanBanDocx, TEN_FILE_MAU } from '@/lib/htkt/van-ban-docx'
import { getMauBieu } from '@/lib/htkt/mau-bieu'

// Tải mẫu .docx skeleton (rỗng, thể thức NĐ 30/2020) theo loại văn bản.
// Middleware /api/htkt/* đã chặn theo quyền Phòng HTKT.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await requireHtktAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  const mau = getMauBieu(key)
  if (!mau) return NextResponse.json({ error: 'Không tìm thấy mẫu' }, { status: 404 })

  const buf = await buildVanBanDocx(key, {})
  const fileName = `${TEN_FILE_MAU[key] ?? 'Mau_van_ban'}.docx`
  return streamDocx(buf, fileName)
}
