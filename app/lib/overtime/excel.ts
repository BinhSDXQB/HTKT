import 'server-only'
import ExcelJS from 'exceljs'
import { sumDayHours, fmtNgay, OT_LIMIT_NAM, type GioNgay, type MonthDay } from './policy'

export type OvertimeExcelEntry = {
  hoTen: string
  chucVu: string | null
  gioNgay: GioNgay
  ghiChu: string | null
  luyKeNam: number // tổng giờ đã làm thêm trong năm (gồm cả bảng này)
}

export type OvertimeExcelData = {
  tenCoQuan: string
  tenPhong: string
  thang: number
  nam: number
  tuNgay: Date
  denNgay: Date
  ngayKy: Date | null
  days: MonthDay[] // các ngày của kỳ (từ ngày → đến ngày)
  nguoiChamCong: string | null
  truongPhong: string | null
  lanhDaoSo: string | null
  chucDanhLanhDao: string | null
  entries: OvertimeExcelEntry[]
}

const FONT = 'Times New Roman'
const THIN = { style: 'thin' as const, color: { argb: 'FF000000' } }
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN }
const HEAD_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF7' } }
const WEEKEND_HEAD: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCDE6C7' } }
const WEEKEND_CELL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F9EF' } }
const TONG_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4D6' } }
const WARN_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE2E2' } }

export async function buildOvertimeWorkbook(data: OvertimeExcelData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'QL Hạ tầng kỹ thuật — Sở Xây dựng Quảng Trị'
  const ws = wb.addWorksheet(`T${data.thang}`, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 3, ySplit: 7 }],
  })

  const days = data.days
  // Cột: 1 STT | 2 Họ và tên | 3 Chức vụ | 4..(3+N) ngày | (4+N) Tổng giờ | (5+N) Ghi chú
  const N = days.length
  const COL_TONG = 3 + N + 1
  const COL_GHI = COL_TONG + 1
  const TOTAL_COLS = COL_GHI

  // Độ rộng cột
  ws.getColumn(1).width = 4.5
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 16
  for (let i = 0; i < N; i++) ws.getColumn(4 + i).width = 3.6
  ws.getColumn(COL_TONG).width = 7
  ws.getColumn(COL_GHI).width = 24

  const setCell = (r: number, c: number, v: ExcelJS.CellValue, opts: Partial<{ bold: boolean; size: number; italic: boolean; align: ExcelJS.Alignment['horizontal']; fill: ExcelJS.Fill; border: boolean; wrap: boolean; color: string }> = {}) => {
    const cell = ws.getCell(r, c)
    cell.value = v
    cell.font = { name: FONT, size: opts.size ?? 11, bold: opts.bold, italic: opts.italic, color: opts.color ? { argb: opts.color } : undefined }
    cell.alignment = { horizontal: opts.align ?? 'center', vertical: 'middle', wrapText: opts.wrap }
    if (opts.fill) cell.fill = opts.fill
    if (opts.border) cell.border = BORDER
    return cell
  }

  // ── Tiêu đề ──
  setCell(1, 1, data.tenCoQuan.toUpperCase(), { bold: true, size: 12, align: 'left' })
  setCell(2, 1, `PHÒNG ${data.tenPhong.toUpperCase().replace(/^PHÒNG\s+/i, '')}`, { bold: true, size: 12, align: 'left' })
  ws.mergeCells(3, 1, 3, TOTAL_COLS)
  setCell(3, 1, 'BẢNG CHẤM CÔNG LÀM THÊM GIỜ', { bold: true, size: 15 })
  ws.mergeCells(4, 1, 4, TOTAL_COLS)
  setCell(4, 1, `Tháng ${data.thang} năm ${data.nam}  (từ ngày ${fmtNgay(data.tuNgay)} đến ngày ${fmtNgay(data.denNgay)})`, { italic: true, size: 11 })

  // ── Tiêu đề bảng (2 dòng: 6 = số ngày, 7 = thứ) ──
  const H1 = 6, H2 = 7
  const mergeHead = (col: number, text: string) => {
    ws.mergeCells(H1, col, H2, col)
    setCell(H1, col, text, { bold: true, size: 11, border: true, fill: HEAD_FILL, wrap: true })
    ws.getCell(H2, col).border = BORDER
  }
  mergeHead(1, 'STT')
  mergeHead(2, 'Họ và tên')
  mergeHead(3, 'Chức vụ')
  days.forEach((d, i) => {
    const col = 4 + i
    setCell(H1, col, d.day, { bold: true, size: 10, border: true, fill: d.weekend ? WEEKEND_HEAD : HEAD_FILL })
    setCell(H2, col, d.thu, { bold: true, size: 9, border: true, fill: d.weekend ? WEEKEND_HEAD : HEAD_FILL, color: d.weekend ? 'FFB00000' : undefined })
  })
  mergeHead(COL_TONG, 'Tổng giờ')
  mergeHead(COL_GHI, 'Ghi chú')
  ws.getRow(H1).height = 16
  ws.getRow(H2).height = 16

  // ── Dữ liệu ──
  let r = H2 + 1
  data.entries.forEach((e, idx) => {
    setCell(r, 1, idx + 1, { border: true })
    setCell(r, 2, e.hoTen, { border: true, align: 'left' })
    setCell(r, 3, e.chucVu ?? '', { border: true, align: 'center', wrap: true })
    days.forEach((d, i) => {
      const col = 4 + i
      const v = Number(e.gioNgay?.[String(d.day)] ?? 0)
      setCell(r, col, v ? v : '', { border: true, size: 10, fill: d.weekend ? WEEKEND_CELL : undefined })
    })
    const tong = sumDayHours(e.gioNgay)
    setCell(r, COL_TONG, tong || 0, { border: true, bold: true, fill: TONG_FILL })
    // Ghi chú + cảnh báo vượt trần năm
    let ghi = e.ghiChu ?? ''
    if ((e.luyKeNam || 0) > OT_LIMIT_NAM) {
      const note = `Lũy kế năm ${e.luyKeNam} giờ — vượt trần ${OT_LIMIT_NAM} giờ/năm`
      ghi = ghi ? `${ghi}; ${note}` : note
      setCell(r, COL_GHI, ghi, { border: true, align: 'left', wrap: true, fill: WARN_FILL, color: 'FFB00000' })
    } else {
      setCell(r, COL_GHI, ghi, { border: true, align: 'left', wrap: true })
    }
    r++
  })

  // ── Dòng Cộng ──
  ws.mergeCells(r, 1, r, 3)
  setCell(r, 1, 'Cộng', { bold: true, border: true, fill: HEAD_FILL })
  days.forEach((d, i) => {
    const col = 4 + i
    let s = 0
    for (const e of data.entries) s += Number(e.gioNgay?.[String(d.day)] ?? 0)
    setCell(r, col, s ? Math.round(s * 100) / 100 : '', { bold: true, size: 10, border: true, fill: HEAD_FILL })
  })
  const tongAll = data.entries.reduce((a, e) => a + sumDayHours(e.gioNgay), 0)
  setCell(r, COL_TONG, Math.round(tongAll * 100) / 100, { bold: true, border: true, fill: TONG_FILL })
  setCell(r, COL_GHI, '', { border: true })
  r += 2

  // ── Ngày ký (phía trên khối Người chấm công, canh phải) ──
  const ngayKyText = data.ngayKy
    ? `Ngày ${new Date(data.ngayKy).getDate()} tháng ${pad2(new Date(data.ngayKy).getMonth() + 1)} năm ${new Date(data.ngayKy).getFullYear()}`
    : `Ngày … tháng … năm ${data.nam}`
  // Chia 3 khối ký đều theo tổng số cột
  const third = Math.floor(TOTAL_COLS / 3) || 1
  const b1 = [1, third] as const
  const b2 = [third + 1, 2 * third] as const
  const b3 = [2 * third + 1, TOTAL_COLS] as const

  ws.mergeCells(r, b3[0], r, b3[1])
  setCell(r, b3[0], ngayKyText, { italic: true, size: 11 })
  r++

  const sign = (cols: readonly [number, number], title: string, name: string | null) => {
    ws.mergeCells(r, cols[0], r, cols[1])
    setCell(r, cols[0], title, { bold: true, size: 11, wrap: true })
    ws.mergeCells(r + 4, cols[0], r + 4, cols[1])
    setCell(r + 4, cols[0], name ?? '', { bold: true, size: 11 })
  }
  sign(b1, 'Phê duyệt của Giám đốc/Phó Giám đốc Sở Phụ trách', data.lanhDaoSo)
  sign(b2, 'Chánh Văn phòng/Trưởng Phòng', data.truongPhong)
  sign(b3, 'Người chấm công', data.nguoiChamCong)

  return wb.xlsx.writeBuffer()
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
