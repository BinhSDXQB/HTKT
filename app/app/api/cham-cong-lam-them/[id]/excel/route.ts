import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { canViewOvertimeFor } from '@/lib/overtime/access'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { buildOvertimeWorkbook } from '@/lib/overtime/excel'
import { annualUsageByCanBo } from '@/lib/overtime/usage'
import { sumDayHours, rangeDays, monthDays, plainDate, type GioNgay } from '@/lib/overtime/policy'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Xuất "BẢNG CHẤM CÔNG LÀM THÊM GIỜ" (.xlsx). Phân quyền theo phòng của bảng.
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
  const usage = await annualUsageByCanBo(ts.nam)
  const rd = rangeDays(plainDate(ts.tuNgay), plainDate(ts.denNgay))
  const days = rd.length ? rd : monthDays(ts.nam, ts.thang)

  const buf = await buildOvertimeWorkbook({
    tenCoQuan: config?.tenCoQuan || 'SỞ XÂY DỰNG TỈNH QUẢNG TRỊ',
    tenPhong: ts.tenPhong,
    thang: ts.thang,
    nam: ts.nam,
    tuNgay: ts.tuNgay,
    denNgay: ts.denNgay,
    ngayKy: ts.ngayKy,
    days,
    nguoiChamCong: ts.nguoiChamCong,
    truongPhong: ts.truongPhong,
    lanhDaoSo: ts.lanhDaoSo,
    chucDanhLanhDao: ts.chucDanhLanhDao,
    entries: ts.entries.map((e) => {
      const gioNgay = (e.gioNgay ?? {}) as GioNgay
      const tong = sumDayHours(gioNgay)
      return {
        hoTen: e.hoTen,
        chucVu: e.chucVu,
        gioNgay,
        ghiChu: e.ghiChu,
        luyKeNam: e.canBoId ? (usage.get(e.canBoId)?.hours ?? tong) : tong,
      }
    }),
  })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetId: ts.id, targetType: 'OvertimeTimesheet',
    detail: `Xuất Excel chấm công làm thêm — ${ts.tenPhong} tháng ${ts.thang}/${ts.nam}`,
  })

  const mm = String(ts.thang).padStart(2, '0')
  const fileName = `Bang_cham_cong_lam_them_gio_Thang_${mm}_${ts.nam}_${slug(ts.tenPhong)}.xlsx`
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}

function slug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
