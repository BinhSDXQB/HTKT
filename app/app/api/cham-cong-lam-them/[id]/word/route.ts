import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canViewOvertimeFor } from '@/lib/overtime/access'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { streamDocx } from '@/lib/office-doc-store'
import { buildOvertimeAgreementDocx } from '@/lib/overtime/docx'
import { type GioNgay } from '@/lib/overtime/policy'

// Sinh "VĂN BẢN THỎA THUẬN LÀM THÊM GIỜ" (.docx, Mẫu số 01/PLIV).
// Tổng giờ làm thêm/người được tổng hợp từ bảng chấm công.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const ts = await db.overtimeTimesheet.findUnique({
    where: { id },
    include: { entries: { orderBy: { thuTu: 'asc' } } },
  })
  if (!ts) return NextResponse.json({ error: 'Không tìm thấy bảng chấm công' }, { status: 404 })
  if (!(await canViewOvertimeFor(user, ts.toChucId))) {
    return NextResponse.json({ error: 'Không có quyền truy cập bảng của phòng khác' }, { status: 403 })
  }

  const config = await db.facilityConfig.findFirst()

  const buf = await buildOvertimeAgreementDocx({
    tenCoQuan: config?.tenCoQuan || 'SỞ XÂY DỰNG TỈNH QUẢNG TRỊ',
    tenPhong: ts.tenPhong,
    nam: ts.nam,
    tuNgay: ts.tuNgay,
    denNgay: ts.denNgay,
    ngayKy: ts.ngayKy,
    diaDiem: ts.diaDiem,
    lyDo: ts.lyDo,
    truongPhong: ts.truongPhong,
    lanhDaoSo: ts.lanhDaoSo,
    chucDanhLanhDao: ts.chucDanhLanhDao,
    entries: ts.entries.map((e) => ({
      hoTen: e.hoTen,
      chucVu: e.chucVu,
      gioNgay: (e.gioNgay ?? {}) as GioNgay,
    })),
  })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: ts.id, targetType: 'OvertimeTimesheet',
    detail: `Sinh Văn bản thỏa thuận làm thêm giờ — ${ts.tenPhong} tháng ${ts.thang}/${ts.nam}`,
  })

  const mm = String(ts.thang).padStart(2, '0')
  const fileName = `Thoa_thuan_lam_them_gio_Thang_${mm}_${ts.nam}_${slug(ts.tenPhong)}.docx`
  return streamDocx(buf, fileName)
}

function slug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
