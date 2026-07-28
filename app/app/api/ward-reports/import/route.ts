import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import {
  SHEET_STANDARD, shouldSkipSheet, validateFileName, validateSheet,
  buildStandardColumns, SHEET_COLUMNS,
} from '@/lib/ward-report-schema'

function normDenImport(raw: string|null): string|null {
  if (!raw) return null
  const s = raw.trim().toLowerCase()
  if (s.includes('led')) return 'LED'
  if (s===  'son'||s.includes('sodium')||s.includes('sondium')||s==='sudium') return 'Sodium'
  if (s.includes('halogen')) return 'Halogen'
  if (s.includes('thuỷ ngân')||s.includes('thủy ngân')) return 'Thủy ngân'
  if (s.includes('sợi đốt')||s.includes('bóng pha')) return 'Sợi đốt'
  if (s.includes('năng lượng')||s.includes('nlmt')) return 'Năng lượng MT'
  return raw.trim()
}

export async function POST(req: NextRequest) {
  let user
  try { user = await requireAuth() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const wardId   = formData.get('wardId') as string | null
  const yearRaw  = formData.get('year') as string | null
  const monthRaw = formData.get('month') as string | null

  if (!file) return NextResponse.json({ error: 'Thiếu file Excel' }, { status: 400 })
  if (!yearRaw) return NextResponse.json({ error: 'Thiếu năm báo cáo' }, { status: 400 })

  const year  = parseInt(yearRaw, 10)
  const month = monthRaw ? parseInt(monthRaw, 10) : null
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Năm không hợp lệ' }, { status: 400 })
  }

  // ── 1. Validate tên file ─────────────────────────────────────────────────
  const fileValidation = validateFileName(file.name)
  const fileWarnings = fileValidation.warnings

  // Nếu tên file sai hoàn toàn → từ chối
  if (!fileValidation.valid) {
    return NextResponse.json({
      success: false,
      rejected: true,
      reason: fileValidation.errors[0],
      hint: `Tên file chuẩn: "PHỤ LỤC 1_<Loại đơn vị> <Tên đơn vị>.xlsx"\nVí dụ: "PHỤ LỤC 1_Phường Ba Đồn.xlsx"`,
      results: [],
      errors: [],
      warnings: fileValidation.warnings,
      total: 0,
    })
  }

  // ── 2. Đọc file Excel ────────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer())
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  } catch {
    return NextResponse.json({ error: 'File Excel không hợp lệ hoặc bị hỏng' }, { status: 400 })
  }

  // ── 3. Kiểm tra các sheet bắt buộc ──────────────────────────────────────
  const standardSheets = Object.keys(SHEET_STANDARD)
  const foundSheets = wb.SheetNames.filter(n => !shouldSkipSheet(n))
  const missingRequired = standardSheets.filter(std =>
    !foundSheets.some(f => f.toLowerCase().trim() === std.toLowerCase())
  )

  const globalWarnings: string[] = [...fileWarnings]
  if (missingRequired.length > 0) {
    globalWarnings.push(
      `File thiếu ${missingRequired.length} sheet: ${missingRequired.join(', ')}. ` +
      `Chỉ import các sheet có trong file.`
    )
  }

  // ── 4. Xử lý từng sheet ─────────────────────────────────────────────────
  const results: { sheet: string; category: string; rows: number; id: string; bieuMau: string }[] = []
  const sheetErrors: { sheet: string; type: 'REJECTED' | 'WARNING'; message: string }[] = []

  for (const sheetName of wb.SheetNames) {
    // Sheet metadata (Kangatang...) → cảnh báo rồi bỏ qua
    if (shouldSkipSheet(sheetName)) {
      sheetErrors.push({
        sheet: sheetName,
        type: 'WARNING',
        message: `Sheet "${sheetName}" là sheet metadata/hệ thống, bỏ qua khi import dữ liệu.`,
      })
      continue
    }

    // Sheet không chuẩn tên
    const norm = sheetName.toLowerCase().trim()
    const standardName = Object.keys(SHEET_STANDARD).find(s => s.toLowerCase() === norm)

    if (!standardName) {
      // Gợi ý tên chuẩn
      sheetErrors.push({
        sheet: sheetName,
        type: 'REJECTED',
        message: `Sheet "${sheetName}" không đúng tên chuẩn. Các tên hợp lệ: ${standardSheets.join(' | ')}`,
      })
      continue
    }

    // Đọc dữ liệu sheet
    const ws = wb.Sheets[sheetName]
    const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1, defval: null, raw: false,
    })

    // Tìm hàng header thực (có >= 3 ô không rỗng, tối đa hàng 5)
    const nonEmpty = raw.filter(r => r.some(c => c !== null && c !== ''))
    let headerIdx = -1
    for (let i = 0; i < Math.min(5, nonEmpty.length); i++) {
      const nonNullCnt = nonEmpty[i].filter(c => c !== null && c !== '').length
      if (nonNullCnt >= 3) { headerIdx = i; break }
    }

    if (headerIdx < 0) {
      sheetErrors.push({ sheet: sheetName, type: 'REJECTED', message: `Sheet "${sheetName}" không tìm thấy hàng tiêu đề hợp lệ (cần >= 3 cột có nội dung).` })
      continue
    }

    // Build columns (làm sạch tên cột)
    const rawCols = nonEmpty[headerIdx].map(c =>
      c !== null && c !== undefined ? String(c).replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() : ''
    )
    let lastNonEmpty = rawCols.length - 1
    while (lastNonEmpty > 0 && rawCols[lastNonEmpty] === '') lastNonEmpty--
    const columns = rawCols.slice(0, lastNonEmpty + 1)

    // Build data rows (bỏ header + hàng rỗng + hàng chỉ có STT số)
    const dataRows = nonEmpty.slice(headerIdx + 1).map(r =>
      columns.map((_, ci) => {
        const v = r[ci]
        if (v === null || v === undefined || v === '') return null
        const s = String(v).trim()
        if (s === '') return null
        const n = parseFloat(s.replace(/,/g, ''))
        return isNaN(n) ? s : n
      })
    ).filter(r => {
      const nonNullCells = r.filter(c => c !== null)
      if (nonNullCells.length === 0) return false
      // Bỏ hàng chỉ có 1 ô (có thể là hàng nhóm/tiêu đề phụ)
      if (nonNullCells.length === 1 && typeof nonNullCells[0] === 'number') return false
      return true
    })

    // Validate sheet (tên cột + dữ liệu)
    const sheetVal = validateSheet(standardName, columns, dataRows)
    if (!sheetVal.valid) {
      // Lỗi thực sự (thiếu cột bắt buộc...) → từ chối
      sheetErrors.push({ sheet: sheetName, type: 'REJECTED', message: sheetVal.errors[0] })
      continue
    }
    // Cảnh báo (bảng rỗng...) → ghi nhận nhưng vẫn lưu
    sheetVal.warnings.forEach(w =>
      sheetErrors.push({ sheet: sheetName, type: 'WARNING', message: w })
    )

    // Lưu vào 7 bảng chuẩn hoá (+ WardReport legacy để tương thích)
    try {
      const category = SHEET_STANDARD[standardName] as never
      const stdDefs  = SHEET_COLUMNS[standardName] ?? []
      const stdCols  = buildStandardColumns(standardName)
      const stdRows  = dataRows.map(row =>
        stdDefs.map(def => {
          const val = (row as unknown[])[def.index]
          if (val === null || val === undefined || val === '') return null
          if (def.type === 'number') { const n = parseFloat(String(val).replace(/,/g,'')); return isNaN(n) ? String(val) : n }
          return String(val)
        })
      ).filter(r => r.some(c => c !== null))

      // Helper lấy giá trị theo index
      const g = (row: unknown[], idx: number) => { const v = row[idx]; if (v===null||v===undefined||String(v).trim()===''||String(v)==='-'||String(v)==='…') return null; return v }
      const gStr = (row: unknown[], idx: number): string|null => { const v=g(row,idx); return v===null ? null : String(v).trim()||null }
      const gFloat = (row: unknown[], idx: number): number|null => { const v=g(row,idx); if(v===null)return null; const n=parseFloat(String(v).replace(/,/g,'')); return isNaN(n)?null:n }
      const gInt = (row: unknown[], idx: number): number|null => { const n=gFloat(row,idx); return n===null?null:Math.round(n) }

      // ── Lưu vào bảng chuẩn theo category ──────────────────────────────
      // Chỉ lưu vào bảng chuẩn khi có wardId xác định
      if (!wardId) { results.push({ sheet: standardName, category: String(category), rows: 0, id: 'no-ward', bieuMau: '' }); continue }
      const baseData = { wardId, year, sourceFile: file.name, status: 'DA_DUYET' as never, createdById: user.id }
      let savedCount = 0

      for (const row of stdRows) {
        try {
          switch (standardName) {
            case 'DUONG GT (T)':
              if (gStr(row,1)) { await db.reportDuong.create({ data: { ...baseData, stt:gStr(row,0), tenDuong:gStr(row,1)!, diemDau:gStr(row,2), diemCuoi:gStr(row,3), chieuDaiKm:gFloat(row,4), nenM:gFloat(row,5), matM:gFloat(row,6), heTraiM:gFloat(row,7), hePhaiM:gFloat(row,8), giaiPhanCachM:gFloat(row,9), ketCauMat:gStr(row,10), ghiChu:gStr(row,11) } }); savedCount++ }
              break
            case 'ĐIện chiếu sáng':
              if (gStr(row,1)) { const lr=gStr(row,4); await db.reportDienCS.create({ data: { ...baseData, stt:gStr(row,0), tuyenDuong:gStr(row,1)!, chieuDaiCSKm:gFloat(row,2), soColDen:gInt(row,3), loaiDen:lr, loaiDenChuan:normDenImport(lr), congSuatW:gFloat(row,5), chieuSangPhia:gStr(row,6), namDauTu:gInt(row,7), ghiChu:gStr(row,8) } }); savedCount++ }
              break
            case 'Thoát nước mưa và thải':
              if (gStr(row,1)) { await db.reportThoatNuoc.create({ data: { ...baseData, stt:gStr(row,0), tuyen:gStr(row,1)!, diemDau:gStr(row,2), diemCuoi:gStr(row,3), loaiNuoc:gStr(row,4), chieuDaiM:gFloat(row,5), chieuSangPhia:gStr(row,6), kichThuocCong:gStr(row,7), namSuDung:gInt(row,8), ghiChu:gStr(row,9) } }); savedCount++ }
              break
            case 'cây xanh':
              if (gStr(row,1)) { await db.reportCayXanh.create({ data: { ...baseData, stt:gStr(row,0), tuyen:gStr(row,1)!, diemDau:gStr(row,2), diemCuoi:gStr(row,3), soLuongCay:gInt(row,4), chieuSangPhia:gStr(row,5), chungLoaiCay:gStr(row,6), ghiChu:gStr(row,7) } }); savedCount++ }
              break
            case 'Công viên':
              if (gStr(row,1)) { await db.reportCongVien.create({ data: { ...baseData, stt:gStr(row,0), tenCongVien:gStr(row,1)!, viTri:gStr(row,2), dienTichM2:gFloat(row,3), dienTichThamCoM2:gFloat(row,4), soLuongCay:gInt(row,5), chungLoaiCay:gStr(row,6), ghiChu:gStr(row,7) } }); savedCount++ }
              break
            case 'Cấp nước':
              if (gStr(row,1)) { await db.reportCapNuoc.create({ data: { ...baseData, stt:gStr(row,0), tuyenDuong:gStr(row,1)!, diaChi:gStr(row,2), soHoGiaDinh:gInt(row,3), hienTrang:gStr(row,4), duKienNguon:gStr(row,5), ghiChu:gStr(row,6) } }); savedCount++ }
              break
            case 'Bãi đổ xe':
              if (gStr(row,1)) { const ts=gStr(row,5); await db.reportBaiDoXe.create({ data: { ...baseData, stt:gStr(row,0), tenBai:gStr(row,1)!, diaDiem:gStr(row,2), dienTichM2:gFloat(row,3), soViTriDo:gInt(row,4), coTramSacDien:ts?/^có$/i.test(ts):null, ghiChu:gStr(row,6) } }); savedCount++ }
              break
          }
        } catch { /* bỏ qua hàng lỗi */ }
      }

      // Cũng lưu WardReport legacy để trang du-lieu-phuong-xa vẫn hoạt động
      const report = await db.wardReport.create({
        data: { wardId: wardId||null, year, month: month??null, category, sheetName: standardName, columns: stdCols, rows: stdRows, sourceFile: file.name, status: 'CHINH_THUC', createdById: user.id },
      })

      results.push({ sheet: standardName, category: String(category), rows: savedCount, id: report.id, bieuMau: `BIỂU MẪU ${String(Object.keys(SHEET_STANDARD).indexOf(standardName)+1).padStart(2,'0')}` })
    } catch (e) {
      sheetErrors.push({ sheet: sheetName, type: 'REJECTED', message: `Lỗi lưu dữ liệu: ${String(e)}` })
    }
  }

  // ── 5. Log ───────────────────────────────────────────────────────────────
  await logAction({
    userId: user.id, action: 'IMPORT', module: 'bao_cao',
    detail: `Import "${file.name}": ${results.length} sheet OK, ${sheetErrors.filter(e => e.type === 'REJECTED').length} từ chối`,
  })

  return NextResponse.json({
    success: true,
    results,
    errors: sheetErrors,
    warnings: globalWarnings,
    total: results.length,
    totalRejected: sheetErrors.filter(e => e.type === 'REJECTED').length,
  })
}
