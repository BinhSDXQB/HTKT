import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getWardReportPerms } from '@/lib/ward-report-perms'

const CATEGORY_LABEL: Record<string, string> = {
  DUONG: 'Đường giao thông',
  DIEN_CHIEU_SANG: 'Điện chiếu sáng',
  CAY_XANH: 'Cây xanh',
  CONG_VIEN: 'Công viên',
  DIEN_TONG_HOP: 'Điện tổng hợp',
  THOAT_NUOC_BC: 'Thoát nước',
  CAP_NUOC_BC: 'Cấp nước',
  KHAC: 'Bãi đỗ xe',
}

function fmt(d: Date | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const report = await db.wardReport.findUnique({
    where: { id },
    include: {
      ward: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  })
  if (!report) {
    return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 })
  }

  // Kiểm tra quyền xem
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  const canView = perms.viewAll || perms.limitWardId === report.wardId
  if (!canView) {
    return NextResponse.json({ error: 'Không có quyền xem báo cáo này' }, { status: 403 })
  }

  const columns = (report.columns as string[]) ?? []
  const rows    = (report.rows as (string | number | null)[][]) ?? []

  const config = await db.facilityConfig.findFirst()
  const tenCoQuan = config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'

  // ── Tạo sheet ────────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  const headerInfo: (string | number | null)[][] = [
    [tenCoQuan],
    ['DỮ LIỆU HẠ TẦNG PHƯỜNG/XÃ'],
    ['Phường/Xã:', report.ward?.name ?? 'Chưa xác định'],
    ['Danh mục:', CATEGORY_LABEL[report.category] || report.category],
    ['Kỳ báo cáo:', `Năm ${report.year}${report.month ? ` · Tháng ${report.month}` : ''}`],
    ['Trạng thái:', report.status === 'CHINH_THUC' ? 'Chính thức' : 'Bản nháp'],
    ['Người tạo:', report.createdBy.name],
    ['Ngày xuất:', fmt(new Date())],
    [],
  ]

  // Bảng dữ liệu: STT + các cột gốc
  const tableHeader = ['STT', ...columns]
  const tableRows = rows.map((row, i) => [i + 1, ...columns.map((_, ci) => row[ci] ?? '')])

  const aoa = [...headerInfo, tableHeader, ...tableRows]
  if (report.notes) {
    aoa.push([])
    aoa.push(['Ghi chú:', report.notes])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 6 }, ...columns.map(() => ({ wch: 22 }))]
  // Gộp ô tiêu đề ngang qua các cột
  const lastCol = columns.length // STT + columns -> index cuối
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ]

  const sheetName = (CATEGORY_LABEL[report.category] || 'Du lieu').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // ── Xuất file ─────────────────────────────────────────────────────────────────
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const safeWard = (report.ward?.name ?? 'phuong-xa').replace(/[^\p{L}\p{N}]+/gu, '_')
  const filename = `DuLieu_${safeWard}_${report.category}_${report.year}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
