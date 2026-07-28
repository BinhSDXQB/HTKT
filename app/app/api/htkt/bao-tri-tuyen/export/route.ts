import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

const LINH_VUC = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon'

function safeNum(v: unknown): number | string {
  if (v === undefined || v === null || v === '') return ''
  const n = Number(v)
  return isNaN(n) ? '' : n
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const phuong = req.nextUrl.searchParams.get('phuong') || undefined

  const records = await db.nghiepVuBanGhi.findMany({
    where: { linhVuc: LINH_VUC, deletedAt: null, ...(phuong ? { diaBan: phuong } : {}) },
    orderBy: [{ diaBan: 'asc' }, { tieuDe: 'asc' }],
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sở Xây dựng Quảng Trị'
  wb.created = new Date()
  const ws = wb.addWorksheet('Đường bảo trì')

  ws.mergeCells('A1:R1')
  const t1 = ws.getCell('A1')
  t1.value = `DANH SÁCH TUYẾN ĐƯỜNG BẢO TRÌ${phuong ? ` — ${phuong.toUpperCase()}` : ' TOÀN THỊ XÃ'}`
  t1.font = { bold: true, size: 14 }
  t1.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  ws.mergeCells('A2:R2')
  const t2 = ws.getCell('A2')
  t2.value = 'Trung tâm Quản lý, bảo trì giao thông và HTKT — Sở Xây dựng Quảng Trị'
  t2.font = { italic: true, size: 10, color: { argb: 'FF475569' } }
  t2.alignment = { horizontal: 'center' }

  ws.addRow([])

  const HDR = ['STT', 'Phường/Xã', 'Tên tuyến đường', 'Điểm đầu', 'Điểm cuối',
    'Dài (km)', 'Rộng HT (m)', 'Rộng QH (m)', 'Kết cấu mặt đường', 'Tình trạng', 'Năm BT gần nhất',
    'Tọa độ đầu (Lat)', 'Tọa độ đầu (Lng)', 'Tọa độ cuối (Lat)', 'Tọa độ cuối (Lng)',
    'Năm duy tu', 'Kinh phí (tr.đ)', 'Ghi chú']
  const hRow = ws.addRow(HDR)
  hRow.height = 30
  hRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
  })

  ws.columns = [
    { width: 5 }, { width: 16 }, { width: 30 }, { width: 18 }, { width: 18 },
    { width: 10 }, { width: 12 }, { width: 12 }, { width: 20 }, { width: 13 },
    { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 28 },
  ]

  let stt = 1
  for (const r of records) {
    const cf = r.customFields as Record<string, unknown>
    const tinhTrang = (cf.tinhTrang as string) ?? ''
    const row = ws.addRow([
      stt++, r.diaBan ?? '', r.tieuDe,
      (cf.diemDau as string) ?? '', (cf.diemCuoi as string) ?? '',
      safeNum(cf.chieuDai), safeNum(cf.matCat), safeNum(cf.matCatQH),
      (cf.ketCau as string) ?? '', tinhTrang,
      safeNum(cf.namBaoTri),
      safeNum(cf.toaDoDauLat), safeNum(cf.toaDoDauLng),
      safeNum(cf.toaDoCuoiLat), safeNum(cf.toaDoCuoiLng),
      safeNum(cf.namDuyTu), safeNum(cf.kinhPhiDuyTu),
      r.ghiChu ?? '',
    ])
    row.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { vertical: 'middle', wrapText: true }
    })
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' }
    if (tinhTrang === 'Xuống cấp') {
      row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
      row.getCell(10).font = { color: { argb: 'FFBE123C' }, bold: true }
    } else if (tinhTrang === 'Tốt') {
      row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
      row.getCell(10).font = { color: { argb: 'FF065F46' } }
    }
  }

  ws.addRow([])
  const sig = ws.addRow([
    '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '',
    '', `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, '',
  ])
  sig.getCell(16).font = { italic: true, color: { argb: 'FF64748B' } }

  const buffer = await wb.xlsx.writeBuffer()
  const fileName = phuong
    ? `Duong-bao-tri-${phuong.replace(/\s+/g, '-')}.xlsx`
    : 'Duong-bao-tri-toan-thi.xlsx'

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-store',
    },
  })
}
