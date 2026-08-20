import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { DOMAIN_LABEL, CONDITION_LABEL, STATUS_LABEL } from '@/lib/constants/tai-san'
import { INCIDENT_STATUS_LABEL, INCIDENT_PRIORITY_LABEL } from '@/lib/constants/su-co'
import { WO_STATUS_LABEL, WO_TYPE_LABEL } from '@/lib/constants/phieu-cv'

const PROJECT_STATUS: Record<string, string> = {
  CHUAN_BI: 'Chuẩn bị', DA_DUYET: 'Đã phê duyệt', DANG_THUC_HIEN: 'Đang thi công',
  NGHIEM_THU: 'Đã nghiệm thu', HAN_THANH: 'Hoàn thành', TAM_DUNG: 'Tạm dừng', HUY: 'Huỷ',
}
const PROJECT_TYPE: Record<string, string> = {
  XAY_MOI: 'Xây mới', CAI_TAO: 'Cải tạo', BAO_TRI_LON: 'Bảo trì lớn', KHAC: 'Khác',
}

function fmt(d: Date | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}
function cur(n: number | null | undefined) {
  if (n == null) return ''
  return n.toLocaleString('vi-VN')
}

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // CÔ LẬP DỮ LIỆU: tài khoản phường/xã chỉ xuất được dữ liệu phường mình.
  // Trước đây route xuất TOÀN BỘ tài sản/sự cố/dự án của cả tỉnh cho mọi tài khoản.
  const locWard = user.wardId ? { wardId: user.wardId } : {}

  const { searchParams } = req.nextUrl
  const tuNgay  = searchParams.get('tuNgay')  ? new Date(searchParams.get('tuNgay')!)  : new Date(new Date().getFullYear(), 0, 1)
  const denNgay = searchParams.get('denNgay') ? new Date(searchParams.get('denNgay')!) : new Date()
  denNgay.setHours(23, 59, 59)

  const config = await db.facilityConfig.findFirst()
  const tenCoQuan = config?.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ'
  const kyBaoCao  = `Từ ${fmt(tuNgay)} đến ${fmt(denNgay)}`

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const [assets, incidents, workOrders, projects] = await Promise.all([
    db.asset.findMany({
      where: locWard,
      include: { assetType: true, ward: true, street: true },
      orderBy: [{ domain: 'asc' }, { assetCode: 'asc' }],
    }),
    db.incident.findMany({
      where: { reportedAt: { gte: tuNgay, lte: denNgay }, ...locWard },
      // Chỉ lấy tên phường — trước đây include reportedBy: true kéo NGUYÊN bản ghi
      // User (gồm hash mật khẩu và email = số CCCD) dù báo cáo không dùng tới.
      include: { ward: { select: { name: true } } },
      orderBy: { reportedAt: 'desc' },
    }),
    db.workOrder.findMany({
      // WorkOrder không có cột wardId → cô lập gián tiếp qua tài sản / sự cố.
      // Không lọc thì tài khoản phường vẫn xuất được phiếu công việc của phường khác.
      where: {
        createdAt: { gte: tuNgay, lte: denNgay },
        ...(user.wardId
          ? {
              OR: [
                { asset: { wardId: user.wardId } },
                { incident: { wardId: user.wardId } },
                { incident: { asset: { wardId: user.wardId } } },
              ],
            }
          : {}),
      },
      include: {
        executingUnit: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.project.findMany({
      where: locWard,
      include: { ward: { select: { name: true } }, executingUnit: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const wb = XLSX.utils.book_new()

  // ── Sheet 1: TỔNG QUAN ──────────────────────────────────────────────────────
  const tongQuanData = [
    ['BÁO CÁO TÌNH HÌNH HẠ TẦNG KỸ THUẬT'],
    ['Đơn vị báo cáo:', tenCoQuan],
    ['Kỳ báo cáo:', kyBaoCao],
    ['Ngày xuất:', fmt(new Date())],
    ['Theo Quyết định:', '2597/QĐ-TTg ngày 27/11/2025'],
    [],
    ['CHỈ TIÊU', 'SỐ LIỆU'],
    ['Tổng tài sản hạ tầng', assets.length],
    ['Tài sản đang sử dụng', assets.filter(a => a.status === 'DANG_SU_DUNG').length],
    ['Tài sản tình trạng Xấu/Hỏng', assets.filter(a => ['XAU','HONG'].includes(a.condition)).length],
    ['Sự cố phát sinh trong kỳ', incidents.length],
    ['Sự cố đã giải quyết trong kỳ', incidents.filter(i => i.status === 'DONG').length],
    ['Phiếu công việc trong kỳ', workOrders.length],
    ['Phiếu CV hoàn thành/nghiệm thu', workOrders.filter(w => ['HOAN_THANH','NGHIEM_THU'].includes(w.status)).length],
    ['Tổng dự án', projects.length],
    ['Dự án đang thi công', projects.filter(p => p.status === 'DANG_THUC_HIEN').length],
    ['Tổng ngân sách dự án (đồng)', projects.reduce((s, p) => s + (p.totalBudget ?? 0), 0)],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(tongQuanData)
  ws1['!cols'] = [{ wch: 40 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'TỔNG QUAN')

  // ── Sheet 2: TÀI SẢN ────────────────────────────────────────────────────────
  const assetHeader = [
    'STT', 'Mã ĐD Quốc gia (QĐ2597)', 'Mã tài sản nội bộ', 'Tên tài sản',
    'Lĩnh vực', 'Loại tài sản', 'Địa chỉ', 'Phường/Xã', 'Tuyến đường',
    'Vĩ độ', 'Kinh độ', 'Tình trạng', 'Trạng thái',
    'Ngày lắp đặt', 'Hạn bảo hành', 'Nhà SX', 'Model', 'Số seri', 'Ghi chú',
  ]
  const assetRows = assets.map((a, i) => [
    i + 1,
    a.nationalCode || '',
    a.assetCode,
    a.name,
    DOMAIN_LABEL[a.domain] || a.domain,
    a.assetType?.name || '',
    a.address || '',
    a.ward?.name || '',
    a.street?.name || '',
    a.latitude ?? '',
    a.longitude ?? '',
    CONDITION_LABEL[a.condition] || a.condition,
    STATUS_LABEL[a.status] || a.status,
    fmt(a.installDate),
    fmt(a.warrantyExpiry),
    a.manufacturer || '',
    a.model || '',
    a.serialNumber || '',
    a.notes || '',
  ])
  const ws2 = XLSX.utils.aoa_to_sheet([assetHeader, ...assetRows])
  ws2['!cols'] = [8, 25, 20, 35, 18, 22, 35, 22, 22, 14, 14, 16, 18, 16, 16, 20, 16, 18, 25].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws2, 'TÀI SẢN')

  // ── Sheet 3: SỰ CỐ ──────────────────────────────────────────────────────────
  const incidentHeader = [
    'STT', 'Mã sự cố', 'Tiêu đề', 'Lĩnh vực', 'Địa chỉ', 'Phường/Xã',
    'Nguồn', 'Mức ưu tiên', 'Trạng thái', 'Ngày tiếp nhận', 'Ngày giải quyết', 'Ghi chú',
  ]
  const sourceLabel: Record<string, string> = {
    BAO_CAO_NV: 'Nhân viên báo cáo', PHAN_ANH_CD: 'Công dân phản ánh',
    KET_QUA_KIEM: 'Qua kiểm tra', HE_THONG: 'Cảnh báo hệ thống',
  }
  const incidentRows = incidents.map((inc, i) => [
    i + 1, inc.incidentCode, inc.title,
    DOMAIN_LABEL[inc.domain] || inc.domain,
    inc.address || '', inc.ward?.name || '',
    sourceLabel[inc.source] || inc.source,
    INCIDENT_PRIORITY_LABEL[inc.priority] || inc.priority,
    INCIDENT_STATUS_LABEL[inc.status] || inc.status,
    fmt(inc.reportedAt), fmt(inc.resolvedAt), inc.notes || '',
  ])
  const ws3 = XLSX.utils.aoa_to_sheet([incidentHeader, ...incidentRows])
  ws3['!cols'] = [6, 18, 40, 18, 30, 22, 22, 16, 18, 18, 18, 30].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws3, 'SỰ CỐ')

  // ── Sheet 4: PHIẾU CÔNG VIỆC ─────────────────────────────────────────────────
  const woHeader = [
    'STT', 'Mã phiếu CV', 'Tiêu đề', 'Loại', 'Lĩnh vực', 'Mức ưu tiên',
    'Trạng thái', 'Đơn vị thực hiện', 'Người phụ trách',
    'Ngày bắt đầu KH', 'Ngày kết thúc KH', 'Chi phí dự kiến (đ)', 'Chi phí thực tế (đ)',
  ]
  const woRows = workOrders.map((wo, i) => [
    i + 1, wo.workOrderCode, wo.title,
    WO_TYPE_LABEL[wo.type] || wo.type,
    DOMAIN_LABEL[wo.domain] || wo.domain,
    wo.priority,
    WO_STATUS_LABEL[wo.status] || wo.status,
    wo.executingUnit?.name || '',
    wo.assignedTo?.name || '',
    fmt(wo.plannedStart), fmt(wo.plannedEnd),
    cur(wo.estimatedCost), cur(wo.actualCost),
  ])
  const ws4 = XLSX.utils.aoa_to_sheet([woHeader, ...woRows])
  ws4['!cols'] = [6, 18, 40, 20, 18, 14, 20, 28, 22, 18, 18, 22, 22].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws4, 'PHIẾU CÔNG VIỆC')

  // ── Sheet 5: DỰ ÁN ──────────────────────────────────────────────────────────
  const projectHeader = [
    'STT', 'Mã ĐD Quốc gia (QĐ2597)', 'Mã dự án', 'Tên dự án', 'Lĩnh vực', 'Loại',
    'Trạng thái', 'Địa điểm', 'Phường/Xã', 'Chủ đầu tư', 'Đơn vị thi công',
    'Số QĐ phê duyệt', 'Nguồn vốn', 'Tổng mức đầu tư (đ)',
    'Ngày phê duyệt', 'Ngày khởi công', 'Ngày hoàn thành KH',
  ]
  const projectRows = projects.map((p, i) => [
    i + 1,
    p.nationalCode || '',
    p.projectCode, p.name,
    DOMAIN_LABEL[p.domain] || p.domain,
    PROJECT_TYPE[p.type] || p.type,
    PROJECT_STATUS[p.status] || p.status,
    p.location || '', p.ward?.name || '',
    p.investor || '', p.executingUnit?.name || '',
    p.decisionNumber || '', p.fundingSource || '',
    cur(p.totalBudget),
    fmt(p.approvalDate), fmt(p.startDate), fmt(p.endDate),
  ])
  const ws5 = XLSX.utils.aoa_to_sheet([projectHeader, ...projectRows])
  ws5['!cols'] = [6, 25, 18, 45, 18, 16, 20, 30, 22, 30, 30, 22, 22, 26, 18, 18, 18].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws5, 'DỰ ÁN')

  // ── Export ───────────────────────────────────────────────────────────────────
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `BaoCao_HTKT_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
