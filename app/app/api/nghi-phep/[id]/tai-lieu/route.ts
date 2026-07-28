import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { canActOnStage, STAGE } from '@/lib/office-leave-roles'
import { generateLeaveRequestPdf } from '@/lib/pdf-don-nghi-phep'
import { LOAI_NGHI_PHEP_LABEL } from '@/lib/office-labels'

/**
 * Tải "tài liệu để ký" của đơn nghỉ phép:
 *  - Nếu đã có chữ ký của cấp trước → trả bản PDF đã ký gần nhất (để ký chồng lên).
 *  - Nếu chưa có → sinh PDF đơn gốc từ dữ liệu.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user
  try { user = await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params

  const req = await db.officeLeaveRequest.findUnique({
    where: { id },
    include: {
      canBo: { select: { hoTen: true, userId: true, toChucId: true, chucDanh: { select: { ten: true } }, toChuc: { select: { ten: true } } } },
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

  // Đã có chữ ký → trả bản mới nhất
  if (req.signatures.length > 0) {
    const sig = req.signatures[0]
    return new NextResponse(new Uint8Array(Buffer.from(sig.fileData)), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(sig.fileName)}`,
      },
    })
  }

  // Chưa ký → sinh PDF đơn gốc
  const pdf = await generateLeaveRequestPdf({
    hoTen: req.canBo.hoTen,
    chucVu: req.canBo.chucDanh?.ten ?? '',
    donVi: req.canBo.toChuc?.ten ?? '',
    loaiNghiLabel: LOAI_NGHI_PHEP_LABEL[req.loaiNghi] ?? 'nghỉ phép',
    tuNgay: req.tuNgay,
    denNgay: req.denNgay,
    soNgay: req.soNgay,
    lyDo: req.lyDo,
    dinhMucPhep: req.dinhMucPhep,
    conLai: req.dinhMucPhep != null ? Math.max(0, (req.dinhMucPhep ?? 0) - (req.daNghiTruoc ?? 0)) : null,
    nguoiBanGiao: req.nguoiBanGiao,
    noiNghi: req.noiNghi,
    dienThoaiLienHe: req.dienThoaiLienHe,
    deNghiUngLuong: req.deNghiUngLuong,
    ngayLamDon: req.createdAt,
  })
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(`don-nghi-phep-${id}.pdf`)}`,
    },
  })
}
