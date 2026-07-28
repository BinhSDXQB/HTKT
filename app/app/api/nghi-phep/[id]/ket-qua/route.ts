import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { canActOnStage, STAGE } from '@/lib/office-leave-roles'

/** Tải bản PDF đã ký số mới nhất (kết quả) của đơn nghỉ phép. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user
  try { user = await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: {
      canBo: { select: { userId: true, toChucId: true } },
      signatures: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!req) return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })

  const allowed =
    user.role.name === 'admin' ||
    req.canBo.userId === user.id ||
    (req.trangThai in STAGE && canActOnStage(user, req.trangThai, req.canBo.toChucId)) ||
    hasPermission(user.permissions, MODULES.OFFICE, 'leave_view')
  if (!allowed) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

  if (req.signatures.length === 0) return NextResponse.json({ error: 'Đơn chưa có bản ký số' }, { status: 404 })
  const sig = req.signatures[0]
  return new NextResponse(new Uint8Array(Buffer.from(sig.fileData)), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(sig.fileName)}`,
    },
  })
}
