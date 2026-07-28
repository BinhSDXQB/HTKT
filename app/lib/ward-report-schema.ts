// Chuẩn hoá cấu trúc file PHỤ LỤC 1 — dựa trên file mẫu chính thức

export const FILE_PREFIX    = 'PHỤ LỤC 1_'
export const FILE_UNIT_TYPES = ['Phường', 'Xã', 'Thị trấn', 'Đặc khu']

/** Tên sheet chuẩn → category */
export const SHEET_STANDARD: Record<string, string> = {
  'DUONG GT (T)':             'DUONG',
  'ĐIện chiếu sáng':          'DIEN_CHIEU_SANG',
  'Thoát nước mưa và thải':   'THOAT_NUOC_BC',
  'cây xanh':                 'CAY_XANH',
  'Công viên':                'CONG_VIEN',
  'Cấp nước':                 'CAP_NUOC_BC',
  'Bãi đổ xe':                'KHAC',
}

/** Sheet bỏ qua (cảnh báo nhưng không import) */
export const SKIP_SHEETS = ['kangatang', 'sheet1', 'sheet2', 'bia', 'huong dan', 'cover']

/** Mã biểu mẫu */
export const SHEET_BIEU_MAU: Record<string, string> = {
  'DUONG GT (T)':             'BIỂU MẪU 01 — Đường giao thông',
  'ĐIện chiếu sáng':          'BIỂU MẪU 02 — Điện chiếu sáng',
  'Thoát nước mưa và thải':   'BIỂU MẪU 03 — Thoát nước',
  'cây xanh':                 'BIỂU MẪU 04 — Cây xanh',
  'Công viên':                'BIỂU MẪU 05 — Công viên',
  'Cấp nước':                 'BIỂU MẪU 06 — Cấp nước',
  'Bãi đổ xe':                'BIỂU MẪU 07 — Bãi đỗ xe',
}

/** Định nghĩa đầy đủ từng cột theo từng sheet — đúng vị trí (A=0,B=1,...) */
export type ColumnDef = {
  index: number     // Vị trí cột (0-based)
  name: string      // Tên cột trong file
  unit?: string     // Đơn vị tính
  required: boolean // Bắt buộc
  type: 'text' | 'number' | 'year' // Kiểu dữ liệu
}

export const SHEET_COLUMNS: Record<string, ColumnDef[]> = {
  'DUONG GT (T)': [
    { index: 0,  name: 'STT',                      required: true,  type: 'text'   },
    { index: 1,  name: 'Tên đường',                 required: true,  type: 'text'   },
    { index: 2,  name: 'Điểm đầu (Lý trình)',       required: false, type: 'text'   },
    { index: 3,  name: 'Điểm cuối (Lý trình)',      required: false, type: 'text'   },
    { index: 4,  name: 'Chiều dài tuyến',           unit: 'km',      required: false, type: 'number' },
    { index: 5,  name: 'Nền đường',                 unit: 'm',       required: false, type: 'number' },
    { index: 6,  name: 'Mặt đường',                 unit: 'm',       required: false, type: 'number' },
    { index: 7,  name: 'Hè trái',                   unit: 'm',       required: false, type: 'number' },
    { index: 8,  name: 'Hè phải',                   unit: 'm',       required: false, type: 'number' },
    { index: 9,  name: 'Giải phân cách',            unit: 'm',       required: false, type: 'number' },
    { index: 10, name: 'Kết cấu mặt đường',         required: false, type: 'text'   },
    { index: 11, name: 'Ghi chú',                   required: false, type: 'text'   },
  ],

  'ĐIện chiếu sáng': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Tuyến đường',                required: true,  type: 'text'   },
    { index: 2, name: 'Chiều dài chiếu sáng',       unit: 'km',      required: false, type: 'number' },
    { index: 3, name: 'Số cột đèn toàn tuyến',      unit: 'cột',     required: false, type: 'number' },
    { index: 4, name: 'Loại đèn',                   required: true,  type: 'text'   },
    { index: 5, name: 'Công suất',                  unit: 'W',       required: false, type: 'number' },
    { index: 6, name: 'Chiếu sáng 1 bên/2 bên',    required: false, type: 'text'   },
    { index: 7, name: 'Năm đầu tư',                 required: false, type: 'year'   },
    { index: 8, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Thoát nước mưa và thải': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Tuyến',                      required: true,  type: 'text'   },
    { index: 2, name: 'Điểm đầu',                   required: false, type: 'text'   },
    { index: 3, name: 'Điểm cuối',                  required: false, type: 'text'   },
    { index: 4, name: 'Loại nước (mưa/thải)',       required: false, type: 'text'   },
    { index: 5, name: 'Tổng chiều dài tuyến',       unit: 'm',       required: false, type: 'number' },
    { index: 6, name: '1 phía/2 phía',              required: false, type: 'text'   },
    { index: 7, name: 'Cống (kích thước)',           required: false, type: 'text'   },
    { index: 8, name: 'Năm đưa vào sử dụng',        required: false, type: 'year'   },
    { index: 9, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'cây xanh': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Tuyến',                      required: true,  type: 'text'   },
    { index: 2, name: 'Điểm đầu',                   required: false, type: 'text'   },
    { index: 3, name: 'Điểm cuối',                  required: false, type: 'text'   },
    { index: 4, name: 'Số lượng cây',               unit: 'cây',     required: false, type: 'number' },
    { index: 5, name: '1 phía/2 phía',              required: false, type: 'text'   },
    { index: 6, name: 'Chủng loại cây',             required: false, type: 'text'   },
    { index: 7, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Công viên': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Tên công viên/quảng trường', required: true,  type: 'text'   },
    { index: 2, name: 'Vị trí',                     required: false, type: 'text'   },
    { index: 3, name: 'Diện tích',                  unit: 'm²',      required: false, type: 'number' },
    { index: 4, name: 'Diện tích thảm cỏ',          unit: 'm²',      required: false, type: 'number' },
    { index: 5, name: 'Số lượng cây',               unit: 'cây',     required: false, type: 'number' },
    { index: 6, name: 'Chủng loại cây',             required: false, type: 'text'   },
    { index: 7, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Cấp nước': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Tuyến đường',                required: true,  type: 'text'   },
    { index: 2, name: 'Địa chỉ',                    required: false, type: 'text'   },
    { index: 3, name: 'Số hộ gia đình',             unit: 'hộ',      required: false, type: 'number' },
    { index: 4, name: 'Hiện trạng sử dụng nước',    required: false, type: 'text'   },
    { index: 5, name: 'Dự kiến nguồn nước',         required: false, type: 'text'   },
    { index: 6, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Bãi đổ xe': [
    { index: 0, name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, name: 'Bãi đỗ xe',                  required: true,  type: 'text'   },
    { index: 2, name: 'Địa điểm',                   required: false, type: 'text'   },
    { index: 3, name: 'Diện tích',                  unit: 'm²',      required: false, type: 'number' },
    { index: 4, name: 'Số vị trí đỗ',              unit: 'chỗ',     required: false, type: 'number' },
    { index: 5, name: 'Trạm sạc xe điện',           required: false, type: 'text'   },
    { index: 6, name: 'Ghi chú',                    required: false, type: 'text'   },
  ],
}

/** Cột bắt buộc để validate */
export const REQUIRED_COLUMNS: Record<string, string[]> = Object.fromEntries(
  Object.entries(SHEET_COLUMNS).map(([sheet, cols]) => [
    sheet,
    cols.filter(c => c.required).map(c => c.name),
  ])
)

export const MIN_DATA_ROWS = 1

export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Validate tên file */
export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const name = fileName.replace(/\.(xlsx|xls)$/i, '')

  if (!name.startsWith(FILE_PREFIX)) {
    errors.push(
      `Tên file không đúng chuẩn. Phải bắt đầu bằng "${FILE_PREFIX}".` +
      ` Ví dụ: "PHỤ LỤC 1_Phường Ba Đồn.xlsx"`
    )
    return { valid: false, errors, warnings }
  }

  const unitPart = name.slice(FILE_PREFIX.length).trim()
  const hasValidType = FILE_UNIT_TYPES.some(t => unitPart.startsWith(t))
  if (!hasValidType) {
    warnings.push(
      `Tên đơn vị "${unitPart}" không xác định được loại (Phường/Xã/Thị trấn/Đặc khu). ` +
      `Ví dụ: "PHỤ LỤC 1_Xã Cam Lộ.xlsx"`
    )
  }

  return { valid: true, errors, warnings }
}

/** Validate một sheet */
export function validateSheet(
  sheetName: string,
  columns: string[],
  dataRows: unknown[][],
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const norm = sheetName.toLowerCase().trim()

  const standardName = Object.keys(SHEET_STANDARD).find(s => s.toLowerCase() === norm)
  if (!standardName) {
    const suggestion = suggestSheetName(sheetName)
    errors.push(
      `Sheet "${sheetName}" không đúng tên chuẩn.` +
      (suggestion ? ` Bạn có muốn dùng "${suggestion}" không?` : '') +
      ` Tên hợp lệ: ${Object.keys(SHEET_STANDARD).join(' | ')}`
    )
    return { valid: false, errors, warnings }
  }

  // Kiểm tra cột bắt buộc
  const required = REQUIRED_COLUMNS[standardName] ?? []
  const colsLower = columns.map(c => c.toLowerCase())
  const missingCols = required.filter(req => {
    const reqLower = req.toLowerCase()
    return !colsLower.some(c => c.includes(reqLower) || reqLower.includes(c.split(' ')[0]))
  })
  if (missingCols.length > 0) {
    errors.push(
      `Sheet "${sheetName}" thiếu cột bắt buộc: ${missingCols.join(', ')}. ` +
      `Kiểm tra theo ${SHEET_BIEU_MAU[standardName]}.`
    )
    return { valid: false, errors, warnings }
  }

  // Dữ liệu rỗng → chỉ cảnh báo
  if (dataRows.length < MIN_DATA_ROWS) {
    warnings.push(
      `Sheet "${sheetName}" chưa có dữ liệu (bảng rỗng). ` +
      `Đã lưu với 0 hàng — có thể bổ sung sau theo ${SHEET_BIEU_MAU[standardName]}.`
    )
  }

  return { valid: true, errors, warnings }
}

function suggestSheetName(input: string): string | null {
  const inp = normalize(input)
  for (const s of Object.keys(SHEET_STANDARD)) {
    const n = normalize(s)
    if (inp.includes('duong') && n.includes('duong')) return s
    if (inp.includes('dien') && n.includes('dien')) return s
    if (inp.includes('thoat') && n.includes('thoat')) return s
    if ((inp.includes('cay') || inp.includes('xanh')) && n.includes('cay')) return s
    if (inp.includes('cong vien') && n.includes('cong vien')) return s
    if (inp.includes('cap nuoc') && n.includes('cap')) return s
    if ((inp.includes('bai') || inp.includes('xe')) && n.includes('bai')) return s
  }
  return null
}

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim()
}

export function shouldSkipSheet(name: string): boolean {
  return SKIP_SHEETS.includes(name.toLowerCase().trim())
}

/** Lấy tên cột chuẩn với đơn vị để lưu vào DB */
export function buildStandardColumns(sheetName: string): string[] {
  const defs = SHEET_COLUMNS[sheetName]
  if (!defs) return []
  return defs.map(d => d.unit ? `${d.name} (${d.unit})` : d.name)
}
