import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageSalary } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'

// Tải lại văn bản đã sinh (bản lưu vết bất biến). /api/office/* đã được middleware chặn.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const canManage = canManageSalary(user)
  if (!canManage) {
    return NextResponse.json({ error: 'Không có quyền tải văn bản này' }, { status: 403 })
  }

  const { id } = await params
  const doc = await db.officeGeneratedDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy văn bản' }, { status: 404 })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: doc.id, targetType: 'OfficeGeneratedDocument',
    detail: `Tải văn bản đã sinh: ${doc.tieuDe}`,
  })

  return new NextResponse(new Uint8Array(Buffer.from(doc.noiDung)), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
    },
  })
}
