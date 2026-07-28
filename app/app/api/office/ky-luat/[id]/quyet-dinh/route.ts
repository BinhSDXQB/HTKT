import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { buildDisciplineDecisionDocx } from '@/lib/office-docx'
import { streamDocx, getOrCreateIssuedDoc } from '@/lib/office-doc-store'
import { HINH_THUC_KY_LUAT_LABEL } from '@/lib/office-labels'

// Sinh Quyết định kỷ luật (.docx) từ 1 hồ sơ kỷ luật. /api/office/* đã được middleware chặn.
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
  const canManage = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'discipline_manage')
  if (!canManage) {
    return NextResponse.json({ error: 'Không có quyền sinh văn bản kỷ luật' }, { status: 403 })
  }

  const { id } = await params
  const k = await db.officeDisciplineRecord.findUnique({
    where: { id },
    include: { canBo: { include: { chucDanh: true, toChuc: true } } },
  })
  if (!k) return NextResponse.json({ error: 'Không tìm thấy hồ sơ kỷ luật' }, { status: 404 })

  const config = await db.facilityConfig.findFirst()
  const safeName = k.canBo.hoTen.replace(/[^\p{L}\p{N}]+/gu, '_')
  const nam = k.tuNgay.getFullYear()
  const fileName = `QD_Ky_luat_${safeName}_${nam}.docx`

  const buf = await getOrCreateIssuedDoc({
    loaiVanBan: 'QD_KY_LUAT',
    canBoId: k.canBoId,
    soVanBan: k.soQuyetDinh,
    tieuDe: `Quyết định kỷ luật — ${k.canBo.hoTen}`,
    fileName,
    createdById: user.id,
    generate: () => buildDisciplineDecisionDocx({
      soQuyetDinh:   k.soQuyetDinh || '...../QĐ-SXD',
      ngayQuyetDinh: k.ngayQuyetDinh,
      hoTen:         k.canBo.hoTen,
      chucDanh:      k.canBo.chucDanh?.ten ?? k.canBo.chucVu ?? 'công chức',
      donVi:         k.canBo.toChuc?.ten ?? k.canBo.phongBan ?? '',
      hinhThucLabel: HINH_THUC_KY_LUAT_LABEL[k.hinhThuc] ?? k.hinhThuc,
      lyDo:          k.lyDo,
      tuNgay:        k.tuNgay,
      denNgay:       k.denNgay,
      soThangKeoDaiNangLuong: k.soThangKeoDaiNangLuong,
      coQuanCapTren: config?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ',
      tenCoQuan:     config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ',
    }),
  })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: k.id, targetType: 'OfficeDisciplineRecord',
    detail: `Sinh Quyết định kỷ luật ${k.canBo.hoTen} (QĐ ${k.soQuyetDinh ?? 'dự thảo'})`,
  })

  return streamDocx(buf, fileName)
}
