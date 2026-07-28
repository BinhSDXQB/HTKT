import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canViewOvertimeFor } from '@/lib/overtime/access'
import { KY_TAY } from '@/lib/overtime/roles'

// Tải BẢN ĐÃ KÝ TAY (scan/ảnh/PDF) đã lưu của bảng chấm công.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const ts = await db.overtimeTimesheet.findUnique({
    where: { id },
    select: {
      toChucId: true,
      signatures: { where: { capCode: KY_TAY }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!ts || ts.signatures.length === 0) return NextResponse.json({ error: 'Chưa có bản đã ký' }, { status: 404 })
  if (!(await canViewOvertimeFor(user, ts.toChucId))) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  const sig = ts.signatures[0]
  const mime = inferMime(sig.fileName, sig.ghiChu)
  return new NextResponse(new Uint8Array(Buffer.from(sig.fileData)), {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(sig.fileName)}`,
    },
  })
}

function inferMime(name: string, stored?: string | null): string {
  if (stored && /^(application\/pdf|image\/)/.test(stored)) return stored
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'tif' || ext === 'tiff') return 'image/tiff'
  if (ext === 'heic') return 'image/heic'
  return 'image/jpeg'
}
