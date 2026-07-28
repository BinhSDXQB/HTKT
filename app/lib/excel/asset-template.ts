import * as XLSX from 'xlsx'
import { getAssetTypeSpec, HEADER_LABELS } from '@/lib/tech-specs/config'

// Tạo file Excel mẫu cho từng loại tài sản
export function generateAssetTemplate(assetTypeCode: string, assetTypeName: string): Buffer {
  const spec = getAssetTypeSpec(assetTypeCode)

  // Nếu không có spec riêng, dùng template chung
  const headers = spec?.excelHeaders ?? [
    'assetCode', 'name', 'address', 'latitude', 'longitude', 'elevation',
    'installDate', 'manufacturer', 'model', 'serialNumber', 'condition', 'status', 'notes',
  ]

  // Dòng 1: Label tiếng Việt
  const headerRow = headers.map((h) => {
    if (HEADER_LABELS[h]) return HEADER_LABELS[h]
    const field = spec?.fields.find((f) => f.key === h)
    if (field) return `${field.label}${field.unit ? ` (${field.unit})` : ''}${field.required ? ' (*)' : ''}`
    return h
  })

  // Dòng 2: Key tên cột (để hệ thống đọc khi import)
  const keyRow = headers.map((h) => `[${h}]`)

  // Dòng 3: Hướng dẫn nhập
  const guideRow = headers.map((h) => {
    if (h === 'assetCode') return 'Bắt buộc. VD: GT-D001'
    if (h === 'name') return 'Bắt buộc. Tên mô tả tài sản'
    if (h === 'latitude') return 'Vĩ độ (decimal). VD: 16.047079'
    if (h === 'longitude') return 'Kinh độ (decimal). VD: 108.206230'
    if (h === 'elevation') return 'Dương=trên mặt đất, Âm=ngầm. VD: -1.5'
    if (h === 'installDate') return 'Định dạng: dd/mm/yyyy'
    if (h === 'condition') return 'TOT | KHA | TRUNG_BINH | XAU | HONG'
    if (h === 'status') return 'DANG_SU_DUNG | DUNG_TAM | DANG_SUA_CHUA | NGUNG_SU_DUNG'

    const field = spec?.fields.find((f) => f.key === h)
    if (field?.options) return field.options.map((o) => `${o.value}=${o.label}`).join(' | ')
    if (field?.type === 'boolean') return 'TRUE | FALSE'
    if (field?.type === 'number') return `Số. VD: ${field.unit ? '0 ' + field.unit : '0'}`
    return ''
  })

  // Dòng 4+: 3 dòng dữ liệu mẫu trống
  const sampleRows: string[][] = [[], [], []]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headerRow, keyRow, guideRow, ...sampleRows])

  // Định dạng header
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const hCell = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[hCell]) continue
    ws[hCell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E40AF' } },
      alignment: { wrapText: true, vertical: 'center' },
    }
    const kCell = XLSX.utils.encode_cell({ r: 1, c: C })
    if (ws[kCell]) ws[kCell].s = { font: { color: { rgb: '94A3B8' }, italic: true }, fill: { fgColor: { rgb: 'F1F5F9' } } }
    const gCell = XLSX.utils.encode_cell({ r: 2, c: C })
    if (ws[gCell]) ws[gCell].s = { font: { color: { rgb: '64748B' } }, fill: { fgColor: { rgb: 'F8FAFC' } } }
  }

  // Chiều rộng cột
  ws['!cols'] = headers.map((h) => {
    if (['name', 'address', 'notes'].includes(h)) return { wch: 30 }
    if (['species', 'scientific_name', 'operator'].includes(h)) return { wch: 22 }
    return { wch: 18 }
  })

  // Sheet hướng dẫn
  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN NHẬP DỮ LIỆU'],
    [''],
    ['Loại tài sản:', assetTypeName],
    ['Mã loại:', assetTypeCode],
    [''],
    ['QUY TẮC NHẬP:'],
    ['1. Không xoá dòng 1 (tiêu đề) và dòng 2 (key).'],
    ['2. Dòng 3 là hướng dẫn — có thể xoá trước khi import.'],
    ['3. Nhập dữ liệu từ dòng 4 trở đi.'],
    ['4. Các cột có (*) là bắt buộc.'],
    ['5. Cột latitude/longitude: dùng hệ WGS84 (Google Maps).'],
    ['6. Cột elevation: dương = trên mặt đất, âm = ngầm dưới đất (m).'],
    [''],
    ['ĐỊNH DẠNG:'],
    ['- Ngày tháng: dd/mm/yyyy (VD: 25/12/2024)'],
    ['- Số thực: dùng dấu chấm (VD: 1.5, không phải 1,5)'],
    ['- Boolean: TRUE hoặc FALSE'],
    ['- Select: dùng đúng giá trị VALUE (cột 3 liệt kê các lựa chọn)'],
    [''],
    ['MÃ TÌNH TRẠNG:', 'TOT=Tốt | KHA=Khá | TRUNG_BINH=Trung bình | XAU=Xấu | HONG=Hỏng'],
    ['MÃ TRẠNG THÁI:', 'DANG_SU_DUNG | DUNG_TAM | DANG_SUA_CHUA | NGUNG_SU_DUNG'],
  ])
  guideSheet['!cols'] = [{ wch: 25 }, { wch: 60 }]

  XLSX.utils.book_append_sheet(wb, ws, assetTypeName.substring(0, 31))
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Hướng dẫn')

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

// Parse Excel import, trả về { data, errors }
export function parseAssetImportFile(buffer: Buffer, _assetTypeCode: string) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })

  if (rows.length < 2) return { data: [], errors: [{ row: 0, field: 'file', message: 'File không có dữ liệu hoặc thiếu dòng key' }] }

  // Đọc key row (dòng 2, index 1)
  const keyRow = (rows[1] as string[]).map((k) => String(k).replace(/^\[|\]$/g, ''))

  // Dữ liệu từ dòng 4 (index 3 trở đi), bỏ dòng guide (index 2)
  const dataRows = rows.slice(3).filter((r) => (r as string[]).some((c) => c !== ''))

  const data: Record<string, string>[] = []
  const errors: { row: number; field: string; message: string }[] = []

  dataRows.forEach((row, i) => {
    const rowNum = i + 4
    const obj: Record<string, string> = {}
    keyRow.forEach((key, ci) => {
      if (!key) return
      const val = (row as string[])[ci]
      obj[key] = val != null ? String(val).trim() : ''
    })

    // Validate bắt buộc
    if (!obj.assetCode) errors.push({ row: rowNum, field: 'assetCode', message: `Dòng ${rowNum}: Mã tài sản không được để trống` })
    if (!obj.name) errors.push({ row: rowNum, field: 'name', message: `Dòng ${rowNum}: Tên tài sản không được để trống` })

    data.push(obj)
  })

  return { data, errors }
}
