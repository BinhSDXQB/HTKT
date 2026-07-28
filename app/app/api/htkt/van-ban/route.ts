import { NextRequest, NextResponse } from 'next/server'
import { requireHtktAccess } from '@/lib/auth'
import { streamDocx } from '@/lib/office-doc-store'
import { buildVanBanDocx, TEN_FILE_MAU, type VanBanInput } from '@/lib/htkt/van-ban-docx'
import { getMauBieu } from '@/lib/htkt/mau-bieu'

// Sinh văn bản .docx hoàn chỉnh từ dữ liệu form "Soạn nhanh".
// Body JSON: { loai, soVanBan?, ngay?, trichYeu?, kinhGui?, canCu?: string|string[], noiDung?, ... }
export async function POST(req: NextRequest) {
  try {
    await requireHtktAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 })
  }

  const loai = String(body.loai || '')
  const mau = getMauBieu(loai)
  if (!mau) return NextResponse.json({ error: 'Loại văn bản không hỗ trợ' }, { status: 400 })

  const str = (v: unknown): string | undefined =>
    v == null || v === '' ? undefined : String(v)
  const toLines = (v: unknown): string[] | undefined => {
    if (v == null) return undefined
    if (Array.isArray(v)) return v.map(String).filter(Boolean)
    return String(v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  }

  const ngayStr = str(body.ngay)
  const ngay = ngayStr ? new Date(ngayStr) : null

  const input: VanBanInput = {
    soVanBan: str(body.soVanBan),
    ngay: ngay && !isNaN(ngay.getTime()) ? ngay : null,
    trichYeu: str(body.trichYeu),
    kinhGui: str(body.kinhGui),
    canCu: toLines(body.canCu),
    noiDung: str(body.noiDung),
    kienNghi: str(body.kienNghi),
    nguoiKyChucDanh: str(body.nguoiKyChucDanh),
    nguoiKyHoTen: str(body.nguoiKyHoTen),
    noiNhan: toLines(body.noiNhan),
    thoiGian: str(body.thoiGian),
    diaDiem: str(body.diaDiem),
  }

  const buf = await buildVanBanDocx(loai, input)
  const fileName = `${TEN_FILE_MAU[loai] ?? 'Van_ban'}.docx`
  return streamDocx(buf, fileName)
}
