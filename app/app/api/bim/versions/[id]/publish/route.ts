import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

// Chuyển trạng thái CDE: SHARED → PUBLISHED (gắn quyết định/GPXD, khóa chỉnh sửa).
// Các phiên bản PUBLISHED cũ của cùng mô hình tự chuyển ARCHIVED (ISO 19650).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (user.role.name !== 'admin' && user.role.name !== 'manager') {
    return NextResponse.json({ error: 'Chỉ quản trị/lãnh đạo được công bố mô hình' }, { status: 403 })
  }

  const version = await db.bimModelVersion.findFirst({
    where: { id, deletedAt: null },
    include: { model: { select: { id: true } }, files: { where: { deletedAt: null }, select: { id: true, kind: true } } },
  })
  if (!version) return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404 })
  if (version.cdeStatus !== 'SHARED') {
    return NextResponse.json({ error: `Phiên bản đang ở trạng thái ${version.cdeStatus}` }, { status: 409 })
  }

  // NĐ 217/2026/NĐ-CP Điều 8 (thay NĐ 175/2024 từ 01/7/2026): hồ sơ phải có IFC
  if (!version.files.some((f) => f.kind === 'IFC')) {
    return NextResponse.json({ error: 'Chưa có tệp IFC — không thể công bố (NĐ 217/2026/NĐ-CP yêu cầu IFC 4.0)' }, { status: 400 })
  }
  // Chặn publish nếu còn check FAIL
  const failCount = await db.bimValidationCheck.count({
    where: { file: { versionId: id, deletedAt: null }, ketQua: 'FAIL' },
  })
  if (failCount > 0) {
    return NextResponse.json({ error: `Còn ${failCount} kiểm tra FAIL — yêu cầu bổ sung trước khi công bố` }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const ghiChu: string | undefined = body?.ghiChu

  await db.$transaction([
    // Archive các bản PUBLISHED cũ
    db.bimModelVersion.updateMany({
      where: { modelId: version.model.id, cdeStatus: 'PUBLISHED', id: { not: id } },
      data: { cdeStatus: 'ARCHIVED', archivedAt: new Date(), archiveReason: `Thay thế bởi phiên bản ${version.versionNo}` },
    }),
    db.bimModelVersion.update({
      where: { id },
      data: {
        cdeStatus: 'PUBLISHED',
        publishedById: user.id,
        publishedAt: new Date(),
        ...(ghiChu ? { metadata: { publishGhiChu: ghiChu } } : {}),
      },
    }),
  ])

  await logAction({
    userId: user.id,
    action: 'UPDATE',
    module: 'bim',
    targetId: id,
    targetType: 'BimModelVersion',
    detail: `Công bố (PUBLISHED) phiên bản ${version.maContainer}${ghiChu ? ` — ${ghiChu}` : ''}`,
  })

  return NextResponse.json({ ok: true })
}
