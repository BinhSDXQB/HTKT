import { NextRequest, NextResponse } from 'next/server'
import { requireOfficeAccess, canViewOfficeSensitive } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { buildQlnsWorkbook } from '@/lib/office-export-qlns'

// Xuất danh sách quản lý nhân sự (.xlsx) theo đúng biểu mẫu QLNS — 53 cột + công thức.
// Chứa CCCD + lương → chỉ người có quyền xem dữ liệu nhạy cảm mới được xuất.
export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireOfficeAccess()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canViewOfficeSensitive(user)) {
    return NextResponse.json({ error: 'Không có quyền xuất danh sách nhân sự đầy đủ' }, { status: 403 })
  }

  const donVi = req.nextUrl.searchParams.get('donVi') ?? undefined
  const wb = await buildQlnsWorkbook(donVi)
  const buf = await wb.xlsx.writeBuffer()

  await logAction({
    userId: user.id, action: 'EXPORT', module: MODULES.OFFICE,
    targetType: 'CanBo', detail: `Xuất danh sách QLNS toàn Sở${donVi ? ` (đơn vị ${donVi})` : ''}`,
  })

  const ngay = new Date().toISOString().slice(0, 10)
  const filename = `QLNS_SXD_QuangTri_${ngay}.xlsx`
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
