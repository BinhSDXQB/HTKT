import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, canManageSalary } from '@/lib/auth'
import { MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { buildSalaryDecisionDocx } from '@/lib/office-docx'
import { streamDocx } from '@/lib/office-doc-store'
import { LOAI_NANG_LUONG_LABEL } from '@/lib/office-labels'

// Sinh Quyết định nâng lương (.docx) từ hồ sơ rà soát đã duyệt.
// Đường dẫn /api/office/* đã được middleware chặn theo quyền Văn phòng Sở.
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
    return NextResponse.json({ error: 'Không có quyền sinh văn bản nâng lương' }, { status: 403 })
  }

  const { id } = await params
  const c = await db.officeSalaryReviewCase.findUnique({
    where: { id },
    include: { canBo: { include: { chucDanh: true, toChuc: true } } },
  })
  if (!c) return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 })
  if (c.trangThai !== 'DA_DUYET' && c.trangThai !== 'DA_BAN_HANH') {
    return NextResponse.json({ error: 'Chỉ sinh QĐ cho hồ sơ đã duyệt hoặc đã ban hành' }, { status: 409 })
  }

  const safeName = c.canBo.hoTen.replace(/[^\p{L}\p{N}]+/gu, '_')
  const fileName = `QD_Nang_luong_${safeName}_${c.namRaSoat}.docx`

  // Văn bản đã ban hành → lưu/đọc bản bất biến đã lưu vết (tải lại đúng bản gốc).
  if (c.trangThai === 'DA_BAN_HANH') {
    const stored = await db.officeGeneratedDocument.findFirst({
      where: { reviewCaseId: c.id, loaiVanBan: 'QD_NANG_LUONG' },
    })
    if (stored) {
      await logAction({
        userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
        targetId: c.id, targetType: 'OfficeSalaryReviewCase',
        detail: `Tải lại QĐ nâng lương ${c.canBo.hoTen} (QĐ ${c.soQuyetDinh ?? ''})`,
      })
      return streamDocx(Buffer.from(stored.noiDung), stored.fileName)
    }
  }

  const config = await db.facilityConfig.findFirst()
  const loaiLabel = (LOAI_NANG_LUONG_LABEL[c.loai] ?? 'thường xuyên')
    .replace(/^nâng (bậc )?lương\s*/i, '')
    .toLowerCase()

  const buf = await buildSalaryDecisionDocx({
    soQuyetDinh:   c.soQuyetDinh || '...../QĐ-SXD',
    ngayQuyetDinh: c.ngayQuyetDinh,
    loaiLabel,
    hoTen:         c.canBo.hoTen,
    chucDanh:      c.canBo.chucDanh?.ten ?? c.canBo.chucVu ?? 'công chức',
    donVi:         c.canBo.toChuc?.ten ?? c.canBo.phongBan ?? '',
    heSoMoi:       c.heSoDeXuat,
    bacMoi:        c.bacDeXuat,
    ngayHuong:     c.ngayHuongMoi,
    canCuPhapLy:   c.canCuPhapLy,
    coQuanCapTren: config?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ',
    tenCoQuan:     config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ',
  })

  // Lưu vết bản chính thức (1 bản / hồ sơ); bản dự thảo (DA_DUYET) không lưu.
  if (c.trangThai === 'DA_BAN_HANH') {
    await db.officeGeneratedDocument.create({
      data: {
        loaiVanBan:   'QD_NANG_LUONG',
        canBoId:      c.canBoId,
        reviewCaseId: c.id,
        soVanBan:     c.soQuyetDinh,
        tieuDe:       `Quyết định nâng bậc lương ${loaiLabel} — ${c.canBo.hoTen}`,
        fileName,
        noiDung:      new Uint8Array(buf),
        createdById:  user.id,
      },
    })
  }

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: c.id, targetType: 'OfficeSalaryReviewCase',
    detail: `Sinh Quyết định nâng lương ${c.canBo.hoTen} (QĐ ${c.soQuyetDinh ?? 'dự thảo'})`,
  })

  return streamDocx(buf, fileName)
}
