import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getWardReportPerms } from '@/lib/ward-report-perms'
import { CATEGORY_MODEL, CATEGORY_SHEET, CATEGORY_COORDS, editableColumns, SHEET_BIEU_MAU } from '@/lib/ward-report-schema'

const dbAny = db as unknown as Record<string, { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }>

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)

    if (!perms.canWrite && !perms.viewAll) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wardId = req.nextUrl.searchParams.get('wardId')
    const category = req.nextUrl.searchParams.get('category') || ''
    const year = parseInt(req.nextUrl.searchParams.get('year') || '') || new Date().getFullYear()

    if (!wardId) {
      return NextResponse.json({ error: 'wardId required' }, { status: 400 })
    }

    if (perms.limitWardId && perms.limitWardId !== wardId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const sheetName = CATEGORY_SHEET[category]
    const model = CATEGORY_MODEL[category]
    if (!sheetName || !model) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const ward = await db.administrativeUnit.findUnique({
      where: { id: wardId },
      select: { name: true },
    })
    if (!ward) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    const entries = await dbAny[model].findMany({
      where: { wardId, year },
      orderBy: { createdAt: 'asc' },
    })

    const columns = editableColumns(category)
    const colHeaders = columns.map(c => c.unit ? `${c.name} (${c.unit})` : c.name)
    const coordKind = CATEGORY_COORDS[category] ?? 'none'

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Sở Xây dựng Quảng Trị'
    wb.created = new Date()
    const ws = wb.addWorksheet('Dữ liệu')

    // Header
    ws.mergeCells('A1:M1')
    const t1 = ws.getCell('A1')
    t1.value = SHEET_BIEU_MAU[sheetName] || sheetName
    t1.font = { bold: true, size: 14 }
    t1.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 24

    ws.mergeCells('A2:M2')
    const t2 = ws.getCell('A2')
    t2.value = `${ward.name} — Năm ${year}`
    t2.font = { italic: true, size: 10, color: { argb: 'FF475569' } }
    t2.alignment = { horizontal: 'center' }

    ws.addRow([])

    // Columns header
    const allCols = ['STT', ...colHeaders]
    if (coordKind === 'startEnd') {
      allCols.push('Tọa độ đầu (Lat)', 'Tọa độ đầu (Lng)', 'Tọa độ cuối (Lat)', 'Tọa độ cuối (Lng)')
    } else if (coordKind === 'center') {
      allCols.push('Tọa độ (Lat)', 'Tọa độ (Lng)')
    }

    const hRow = ws.addRow(allCols)
    hRow.height = 30
    hRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    })

    // Data rows
    let stt = 1
    for (const entry of entries) {
      const rowData: unknown[] = [stt++]
      for (const col of columns) {
        const v = entry[col.field]
        rowData.push(col.type === 'boolean' ? (v === true ? 'Có' : v === false ? 'Không' : '') : (v ?? ''))
      }

      if (coordKind === 'startEnd') {
        rowData.push(
          entry.toaDoDauLat ?? '',
          entry.toaDoDauLng ?? '',
          entry.toaDoCuoiLat ?? '',
          entry.toaDoCuoiLng ?? ''
        )
      } else if (coordKind === 'center') {
        rowData.push(entry.toaDoLat ?? '', entry.toaDoLng ?? '')
      }

      const row = ws.addRow(rowData)
      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        cell.alignment = { vertical: 'middle', wrapText: true }
      })
    }

    // Signature
    ws.addRow([])
    const sig = ws.addRow(['', '', '', '', '', '', '', '', '', '', '', '', `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`])
    sig.getCell(13).font = { italic: true, color: { argb: 'FF64748B' } }

    const buffer = await wb.xlsx.writeBuffer()
    const fileName = `${sheetName.replace(/\s+/g, '-')}_${ward.name.replace(/\s+/g, '-')}_${year}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[export/ward-report-category]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
