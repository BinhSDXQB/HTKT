import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireOfficeAccess } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { getOfficeSummary } from '@/lib/office-report'
import {
  TRANG_THAI_RA_SOAT_LABEL, MUC_XEP_LOAI_LABEL, HINH_THUC_KY_LUAT_LABEL,
} from '@/lib/office-labels'

// Xuất báo cáo tổng hợp Văn phòng Sở (.xlsx). /api/office/* đã được middleware chặn theo quyền.
export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().getFullYear()
  const nam = parseInt(req.nextUrl.searchParams.get('nam') ?? '', 10) || now
  const s = await getOfficeSummary(nam)
  const config = await db.facilityConfig.findFirst()
  const tenCoQuan = config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'

  const aoa: (string | number)[][] = [
    [tenCoQuan],
    [`BÁO CÁO TỔNG HỢP VĂN PHÒNG SỞ — NĂM ${nam}`],
    [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
    [],
    ['I. NHÂN SỰ'],
    ['Tổng số cán bộ Văn phòng Sở', s.tongCanBo],
    [],
    ['Phân theo chức danh', 'Số lượng'],
    ...s.theoChucDanh.map((r) => [r.ten, r.soLuong]),
    [],
    ['II. CẢNH BÁO NÂNG LƯƠNG'],
    ['Quá hạn', s.canhBaoLuong.overdue],
    ['Trong 30 ngày', s.canhBaoLuong.d30],
    ['Trong 60 ngày', s.canhBaoLuong.d60],
    ['Trong 90 ngày', s.canhBaoLuong.d90],
    [],
    [`III. QUY TRÌNH NÂNG LƯƠNG (NĂM ${nam})`],
    ['Trạng thái', 'Số hồ sơ'],
    ...Object.entries(s.quyTrinhNangLuong).map(([k, v]) => [TRANG_THAI_RA_SOAT_LABEL[k] ?? k, v]),
    [],
    [`IV. THI ĐUA – KHEN THƯỞNG (NĂM ${nam})`],
    ['Số lượt khen thưởng', s.khenThuongCount],
    ['Chiến sĩ thi đua cơ sở', s.chienSiThiDua],
    [],
    [`V. XẾP LOẠI HẰNG NĂM (NĂM ${nam})`],
    ['Mức xếp loại', 'Số lượng'],
    ...Object.entries(s.xepLoai).map(([k, v]) => [MUC_XEP_LOAI_LABEL[k] ?? k, v]),
    [],
    [`VI. KỶ LUẬT (NĂM ${nam})`],
    ['Hình thức', 'Số lượng'],
    ...Object.entries(s.kyLuat).map(([k, v]) => [HINH_THUC_KY_LUAT_LABEL[k] ?? k, v]),
    [],
    ['VII. VĂN BẢN'],
    ['Tổng văn bản đã sinh', s.vanBanTongCong],
    [`Văn bản sinh trong năm ${nam}`, s.vanBanTrongNam],
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 40 }, { wch: 14 }]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Bao cao ${nam}`)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetType: 'OfficeSummary', detail: `Xuất báo cáo tổng hợp Văn phòng Sở năm ${nam}`,
  })

  const filename = `BaoCao_VanPhongSo_${nam}.xlsx`
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
