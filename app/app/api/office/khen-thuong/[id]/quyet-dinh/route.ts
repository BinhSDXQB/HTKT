import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { logAction } from '@/lib/audit'
import { buildRewardDecisionDocx } from '@/lib/office-docx'
import { streamDocx, getOrCreateIssuedDoc } from '@/lib/office-doc-store'

// Sinh Quyết định khen thưởng (.docx) từ 1 hồ sơ khen thưởng. /api/office/* đã được middleware chặn.
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
  const canManage = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'reward_manage')
  if (!canManage) {
    return NextResponse.json({ error: 'Không có quyền sinh văn bản khen thưởng' }, { status: 403 })
  }

  const { id } = await params
  const r = await db.officeRewardRecord.findUnique({
    where: { id },
    include: { canBo: { include: { chucDanh: true, toChuc: true } }, rewardTitle: true },
  })
  if (!r) return NextResponse.json({ error: 'Không tìm thấy hồ sơ khen thưởng' }, { status: 404 })

  const config = await db.facilityConfig.findFirst()
  const danhHieu = r.rewardTitle?.ten ?? r.danhHieu ?? 'danh hiệu thi đua'
  const safeName = r.canBo.hoTen.replace(/[^\p{L}\p{N}]+/gu, '_')
  const fileName = `QD_Khen_thuong_${safeName}_${r.nam}.docx`

  const buf = await getOrCreateIssuedDoc({
    loaiVanBan: 'QD_KHEN_THUONG',
    canBoId: r.canBoId,
    soVanBan: r.soQuyetDinh,
    tieuDe: `Quyết định khen thưởng — ${r.canBo.hoTen} (${danhHieu})`,
    fileName,
    createdById: user.id,
    generate: () => buildRewardDecisionDocx({
      soQuyetDinh:   r.soQuyetDinh || '...../QĐ-SXD',
      ngayQuyetDinh: r.ngayQuyetDinh,
      hoTen:         r.canBo.hoTen,
      chucDanh:      r.canBo.chucDanh?.ten ?? r.canBo.chucVu ?? 'công chức',
      donVi:         r.canBo.toChuc?.ten ?? r.canBo.phongBan ?? '',
      danhHieu,
      capKhen:       r.capKhen ?? r.rewardTitle?.capKhen,
      thanhTich:     r.thanhTich,
      coQuanCapTren: config?.coQuanCapTren || 'UBND TỈNH QUẢNG TRỊ',
      tenCoQuan:     config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ',
    }),
  })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: r.id, targetType: 'OfficeRewardRecord',
    detail: `Sinh Quyết định khen thưởng ${r.canBo.hoTen} (QĐ ${r.soQuyetDinh ?? 'dự thảo'})`,
  })

  return streamDocx(buf, fileName)
}
