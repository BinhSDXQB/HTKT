import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, canAccessOffice } from '@/lib/auth'
import { extractText } from '@/lib/rag/extract'
import { ingestDocument } from '@/lib/rag/ingest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOAI_HOP_LE = ['VB_PHAP_LUAT', 'QUY_TRINH', 'HUONG_DAN', 'BAO_CAO', 'BIEU_MAU', 'KHAC']
const PHAM_VI_HOP_LE = ['CONG_KHAI', 'NOI_BO_SO']
const MAX_BYTES = 20 * 1024 * 1024 // 20MB

/** GET: danh sách tài liệu trong kho (chỉ người quản lý kho — VP Sở/admin). */
export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canAccessOffice(user)) {
    return NextResponse.json({ error: 'Không có quyền quản lý kho tài liệu.' }, { status: 403 })
  }

  const items = await db.taiLieu.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, tieuDe: true, loai: true, nguon: true, moTa: true, phamVi: true,
      soChunk: true, soKyTu: true, trangThai: true, ghiChuLoi: true, createdAt: true,
    },
  })
  return NextResponse.json({ items })
}

/** POST: nạp tài liệu mới (file PDF/DOCX hoặc dán text). */
export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canAccessOffice(user)) {
    return NextResponse.json({ error: 'Không có quyền nạp tài liệu.' }, { status: 403 })
  }

  const form = await req.formData()
  const tieuDe = String(form.get('tieuDe') || '').trim()
  const loai = String(form.get('loai') || 'KHAC')
  const phamVi = String(form.get('phamVi') || 'NOI_BO_SO')
  const moTa = String(form.get('moTa') || '').trim() || undefined
  const text = String(form.get('text') || '')
  const file = form.get('file') as File | null

  if (!tieuDe) return NextResponse.json({ error: 'Thiếu tiêu đề tài liệu.' }, { status: 400 })
  if (!LOAI_HOP_LE.includes(loai)) return NextResponse.json({ error: 'Loại tài liệu không hợp lệ.' }, { status: 400 })
  if (!PHAM_VI_HOP_LE.includes(phamVi)) return NextResponse.json({ error: 'Phạm vi không hợp lệ.' }, { status: 400 })

  let noiDung = ''
  let nguon: string | undefined
  try {
    if (file && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Tệp vượt quá 20MB.' }, { status: 400 })
      }
      const buf = Buffer.from(await file.arrayBuffer())
      const res = await extractText(buf, file.name, file.type)
      noiDung = res.text
      nguon = file.name
    } else if (text.trim()) {
      noiDung = text
      nguon = 'Dán văn bản'
    } else {
      return NextResponse.json({ error: 'Chưa có nội dung: chọn tệp hoặc dán văn bản.' }, { status: 400 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Không đọc được nội dung: ${msg}` }, { status: 400 })
  }

  try {
    const r = await ingestDocument({
      tieuDe, loai,
      phamVi: phamVi as 'CONG_KHAI' | 'NOI_BO_SO',
      nguon, moTa, text: noiDung,
      createdById: user.id,
    })
    return NextResponse.json({ ok: true, id: r.id, soChunk: r.soChunk })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Nạp tài liệu thất bại: ${msg}` }, { status: 500 })
  }
}
