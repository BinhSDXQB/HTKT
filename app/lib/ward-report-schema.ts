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

/** Định nghĩa đầy đủ từng cột theo từng sheet — đúng vị trí (A=0,B=1,...).
 *  `field` = tên trường camelCase trong model Prisma (Report*), là cầu nối
 *  giữa tên hiển thị (name) và cột DB. Form nhập liệu + import đều dùng `field`
 *  làm khoá để tránh lệch tên-hiển-thị ↔ tên-cột-DB. */
export type ColumnDef = {
  index: number     // Vị trí cột (0-based)
  field: string     // Tên trường camelCase trong model Prisma
  name: string      // Tên cột trong file / nhãn hiển thị
  unit?: string     // Đơn vị tính
  required: boolean // Bắt buộc
  type: 'text' | 'number' | 'integer' | 'year' | 'boolean' // Kiểu dữ liệu
  // 'integer' = cột đếm (Prisma Int) → ép số nguyên, tránh đẩy Float vào Int gây lỗi.
}

export const SHEET_COLUMNS: Record<string, ColumnDef[]> = {
  'DUONG GT (T)': [
    { index: 0,  field: 'stt',           name: 'STT',                      required: true,  type: 'text'   },
    { index: 1,  field: 'tenDuong',      name: 'Tên đường',                 required: true,  type: 'text'   },
    { index: 2,  field: 'diemDau',       name: 'Điểm đầu (Lý trình)',       required: false, type: 'text'   },
    { index: 3,  field: 'diemCuoi',      name: 'Điểm cuối (Lý trình)',      required: false, type: 'text'   },
    { index: 4,  field: 'chieuDaiKm',    name: 'Chiều dài tuyến',           unit: 'km',      required: false, type: 'number' },
    { index: 5,  field: 'nenM',          name: 'Nền đường',                 unit: 'm',       required: false, type: 'number' },
    { index: 6,  field: 'matM',          name: 'Mặt đường',                 unit: 'm',       required: false, type: 'number' },
    { index: 7,  field: 'heTraiM',       name: 'Hè trái',                   unit: 'm',       required: false, type: 'number' },
    { index: 8,  field: 'hePhaiM',       name: 'Hè phải',                   unit: 'm',       required: false, type: 'number' },
    { index: 9,  field: 'giaiPhanCachM', name: 'Giải phân cách',            unit: 'm',       required: false, type: 'number' },
    { index: 10, field: 'ketCauMat',     name: 'Kết cấu mặt đường',         required: false, type: 'text'   },
    { index: 11, field: 'ghiChu',        name: 'Ghi chú',                   required: false, type: 'text'   },
  ],

  'ĐIện chiếu sáng': [
    { index: 0, field: 'stt',           name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, field: 'tuyenDuong',    name: 'Tuyến đường',                required: true,  type: 'text'   },
    { index: 2, field: 'chieuDaiCSKm',  name: 'Chiều dài chiếu sáng',       unit: 'km',      required: false, type: 'number' },
    { index: 3, field: 'soColDen',      name: 'Số cột đèn toàn tuyến',      unit: 'cột',     required: false, type: 'integer' },
    { index: 4, field: 'loaiDen',       name: 'Loại đèn',                   required: true,  type: 'text'   },
    { index: 5, field: 'congSuatW',     name: 'Công suất',                  unit: 'W',       required: false, type: 'number' },
    { index: 6, field: 'chieuSangPhia', name: 'Chiếu sáng 1 bên/2 bên',    required: false, type: 'text'   },
    { index: 7, field: 'namDauTu',      name: 'Năm đầu tư',                 required: false, type: 'year'   },
    { index: 8, field: 'ghiChu',        name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Thoát nước mưa và thải': [
    { index: 0, field: 'stt',           name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, field: 'tuyen',         name: 'Tuyến',                      required: true,  type: 'text'   },
    { index: 2, field: 'diemDau',       name: 'Điểm đầu',                   required: false, type: 'text'   },
    { index: 3, field: 'diemCuoi',      name: 'Điểm cuối',                  required: false, type: 'text'   },
    { index: 4, field: 'loaiNuoc',      name: 'Loại nước (mưa/thải)',       required: false, type: 'text'   },
    { index: 5, field: 'chieuDaiM',     name: 'Tổng chiều dài tuyến',       unit: 'm',       required: false, type: 'number' },
    { index: 6, field: 'chieuSangPhia', name: '1 phía/2 phía',              required: false, type: 'text'   },
    { index: 7, field: 'kichThuocCong', name: 'Cống (kích thước)',           required: false, type: 'text'   },
    { index: 8, field: 'namSuDung',     name: 'Năm đưa vào sử dụng',        required: false, type: 'year'   },
    { index: 9, field: 'ghiChu',        name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'cây xanh': [
    { index: 0, field: 'stt',           name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, field: 'tuyen',         name: 'Tuyến',                      required: true,  type: 'text'   },
    { index: 2, field: 'diemDau',       name: 'Điểm đầu',                   required: false, type: 'text'   },
    { index: 3, field: 'diemCuoi',      name: 'Điểm cuối',                  required: false, type: 'text'   },
    { index: 4, field: 'soLuongCay',    name: 'Số lượng cây',               unit: 'cây',     required: false, type: 'integer' },
    { index: 5, field: 'chieuSangPhia', name: '1 phía/2 phía',              required: false, type: 'text'   },
    { index: 6, field: 'chungLoaiCay',  name: 'Chủng loại cây',             required: false, type: 'text'   },
    { index: 7, field: 'ghiChu',        name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Công viên': [
    { index: 0, field: 'stt',              name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, field: 'tenCongVien',      name: 'Tên công viên/quảng trường', required: true,  type: 'text'   },
    { index: 2, field: 'viTri',            name: 'Vị trí',                     required: false, type: 'text'   },
    { index: 3, field: 'dienTichM2',       name: 'Diện tích',                  unit: 'm²',      required: false, type: 'number' },
    { index: 4, field: 'dienTichThamCoM2', name: 'Diện tích thảm cỏ',          unit: 'm²',      required: false, type: 'number' },
    { index: 5, field: 'soLuongCay',       name: 'Số lượng cây',               unit: 'cây',     required: false, type: 'integer' },
    { index: 6, field: 'chungLoaiCay',     name: 'Chủng loại cây',             required: false, type: 'text'   },
    { index: 7, field: 'ghiChu',           name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Cấp nước': [
    { index: 0, field: 'stt',          name: 'STT',                        required: true,  type: 'text'   },
    { index: 1, field: 'tuyenDuong',   name: 'Tuyến đường',                required: true,  type: 'text'   },
    { index: 2, field: 'diaChi',       name: 'Địa chỉ',                    required: false, type: 'text'   },
    { index: 3, field: 'soHoGiaDinh',  name: 'Số hộ gia đình',             unit: 'hộ',      required: false, type: 'integer' },
    { index: 4, field: 'hienTrang',    name: 'Hiện trạng sử dụng nước',    required: false, type: 'text'   },
    { index: 5, field: 'duKienNguon',  name: 'Dự kiến nguồn nước',         required: false, type: 'text'   },
    { index: 6, field: 'ghiChu',       name: 'Ghi chú',                    required: false, type: 'text'   },
  ],

  'Bãi đổ xe': [
    { index: 0, field: 'stt',           name: 'STT',                        required: true,  type: 'text'    },
    { index: 1, field: 'tenBai',        name: 'Bãi đỗ xe',                  required: true,  type: 'text'    },
    { index: 2, field: 'diaDiem',       name: 'Địa điểm',                   required: false, type: 'text'    },
    { index: 3, field: 'dienTichM2',    name: 'Diện tích',                  unit: 'm²',      required: false, type: 'number'  },
    { index: 4, field: 'soViTriDo',     name: 'Số vị trí đỗ',              unit: 'chỗ',     required: false, type: 'integer' },
    { index: 5, field: 'coTramSacDien', name: 'Trạm sạc xe điện',           required: false, type: 'boolean' },
    { index: 6, field: 'ghiChu',        name: 'Ghi chú',                    required: false, type: 'text'    },
  ],
}

// ─── ĐỊNH TUYẾN NHẬP LIỆU TRỰC TUYẾN (7 biểu mẫu) ────────────────────────────
// Token route (dùng trong URL /dashboard/bao-cao/nhap-lieu/<token>) → model Prisma
// + tên sheet. TÁCH khỏi enum WardReportCategory (legacy) để không cần migration:
// enum legacy không có BAI_DO_XE nên parking vẫn lưu 'KHAC' ở bảng ward_reports,
// còn CRUD trực tuyến định tuyến qua các map dưới đây (đủ cả 7 biểu mẫu).

/** Token route → tên model Prisma (client dùng db[model]) */
export const CATEGORY_MODEL: Record<string, string> = {
  DUONG:           'reportDuong',
  DIEN_CHIEU_SANG: 'reportDienCS',
  THOAT_NUOC_BC:   'reportThoatNuoc',
  CAY_XANH:        'reportCayXanh',
  CONG_VIEN:       'reportCongVien',
  CAP_NUOC_BC:     'reportCapNuoc',
  BAI_DO_XE:       'reportBaiDoXe',
}

/** Token route → tên sheet chuẩn (để tra SHEET_COLUMNS / SHEET_BIEU_MAU) */
export const CATEGORY_SHEET: Record<string, string> = {
  DUONG:           'DUONG GT (T)',
  DIEN_CHIEU_SANG: 'ĐIện chiếu sáng',
  THOAT_NUOC_BC:   'Thoát nước mưa và thải',
  CAY_XANH:        'cây xanh',
  CONG_VIEN:       'Công viên',
  CAP_NUOC_BC:     'Cấp nước',
  BAI_DO_XE:       'Bãi đổ xe',
}

/** Thứ tự hiển thị các biểu mẫu trong trang chọn nhập liệu */
export const CATEGORY_ORDER = [
  'DUONG', 'DIEN_CHIEU_SANG', 'THOAT_NUOC_BC', 'CAY_XANH', 'CONG_VIEN', 'CAP_NUOC_BC', 'BAI_DO_XE',
] as const

/** Các trường toạ độ theo token (điểm đầu–cuối, hoặc 1 điểm trung tâm). */
export const CATEGORY_COORDS: Record<string, 'startEnd' | 'center' | 'none'> = {
  DUONG:           'startEnd',
  THOAT_NUOC_BC:   'startEnd',
  CAY_XANH:        'startEnd',
  DIEN_CHIEU_SANG: 'center',
  CONG_VIEN:       'center',
  CAP_NUOC_BC:     'none',
  BAI_DO_XE:       'none',
}

/** Lấy danh sách cột (ColumnDef) cho một token route. */
export function columnsForCategory(category: string): ColumnDef[] {
  const sheet = CATEGORY_SHEET[category]
  return sheet ? (SHEET_COLUMNS[sheet] ?? []) : []
}

/** Cột nhập/hiển thị trực tuyến: bỏ STT vì đã tự đánh số theo thứ tự bản ghi. */
export function editableColumns(category: string): ColumnDef[] {
  return columnsForCategory(category).filter((c) => c.field !== 'stt')
}

/** Chuyển giá trị 1 ô theo kiểu cột về giá trị lưu DB (number|boolean|string|null). */
export function coerceCellValue(type: ColumnDef['type'], raw: unknown): unknown {
  if (raw === '' || raw === undefined) return null
  if (raw === null) return null
  if (type === 'number' || type === 'integer' || type === 'year') {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''))
    if (isNaN(n)) return null
    // integer/year → cột Prisma Int: làm tròn để không đẩy Float vào Int.
    return type === 'number' ? n : Math.round(n)
  }
  if (type === 'boolean') {
    if (typeof raw === 'boolean') return raw
    return /^(có|true|1|x)$/i.test(String(raw).trim())
  }
  return String(raw)
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
