import 'server-only'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign, TableLayoutType,
} from 'docx'
import { sumDayHours, fmtNgay, type GioNgay } from './policy'

export type OvertimeDocxEntry = {
  hoTen: string
  chucVu: string | null
  gioNgay: GioNgay
}

export type OvertimeDocxData = {
  tenCoQuan: string // SỞ XÂY DỰNG TỈNH QUẢNG TRỊ
  tenPhong: string
  nam: number
  tuNgay: Date
  denNgay: Date
  ngayKy: Date | null
  diaDiem: string | null
  lyDo: string | null
  truongPhong: string | null
  lanhDaoSo: string | null
  chucDanhLanhDao: string | null
  entries: OvertimeDocxEntry[]
}

const FONT = 'Times New Roman'
const SIZE = 28 // 14pt
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }
const LINE = { style: BorderStyle.SINGLE, size: 6, color: '000000' }
const CELL_BORDERS = { top: LINE, bottom: LINE, left: LINE, right: LINE }

function run(text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, size: o.size ?? SIZE, bold: o.bold, italics: o.italics })
}
function para(children: TextRun[], o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number } = {}) {
  return new Paragraph({ alignment: o.align, spacing: { after: o.after ?? 0, line: 312 }, children })
}
function noBorderCell(children: Paragraph[], width: number) {
  return new TableCell({ children, borders: NO_BORDERS, width: { size: width, type: WidthType.PERCENTAGE } })
}
function cell(children: Paragraph[], width: number, valign = VerticalAlign.CENTER) {
  return new TableCell({ children, borders: CELL_BORDERS, width: { size: width, type: WidthType.PERCENTAGE }, verticalAlign: valign })
}

function dateLine(d: Date | null, nam: number): string {
  if (!d) return `Quảng Trị, ngày … tháng … năm ${nam}`
  const dt = new Date(d)
  return `Quảng Trị, ngày ${dt.getDate()} tháng ${dt.getMonth() + 1} năm ${dt.getFullYear()}`
}

// Đường kẻ ngang (border dưới) căn giữa; độ rộng kiểm soát bằng lề thụt 2 bên (twip).
function hLine(indentEachSide: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    indent: { left: indentEachSide, right: indentEachSide },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
    children: [new TextRun({ text: '', font: FONT, size: 2 })],
  })
}

export async function buildOvertimeAgreementDocx(data: OvertimeDocxData): Promise<Buffer> {
  const tenPhong = `PHÒNG ${data.tenPhong.toUpperCase().replace(/^PHÒNG\s+/i, '')}`

  // ── Mẫu số (góc phải) ──
  const mauSo = para([run('Mẫu số 01/PLIV', { italics: true, size: 24 })], { align: AlignmentType.RIGHT, after: 60 })

  // ── Khối tiêu đề 2 cột (không viền) ──
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          noBorderCell([
            para([run(data.tenCoQuan.toUpperCase(), { size: 26 })], { align: AlignmentType.CENTER }),
            para([run(tenPhong, { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
            hLine(1525), // đường kẻ dưới tên Phòng ≈ 1/3 chiều rộng
          ], 42),
          noBorderCell([
            para([run('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
            para([run('Độc lập - Tự do - Hạnh phúc', { bold: true, size: 28 })], { align: AlignmentType.CENTER }),
            hLine(1160), // đường kẻ dưới "Độc lập - Tự do - Hạnh phúc" = hết chiều dài chữ
            para([run(dateLine(data.ngayKy, data.nam), { italics: true, size: 26 })], { align: AlignmentType.CENTER, after: 40 }),
          ], 58),
        ],
      }),
    ],
  })

  // ── Tiêu đề văn bản ──
  const title = para([run('VĂN BẢN THỎA THUẬN LÀM THÊM GIỜ', { bold: true, size: 30 })], { align: AlignmentType.CENTER, after: 200 })

  // ── Thân: thời gian / địa điểm / lý do ──
  const body: Paragraph[] = [
    para([run(`- Thời gian làm thêm: Kể từ ngày ${fmtNgay(data.tuNgay)} đến ngày ${fmtNgay(data.denNgay)}`)], { after: 60 }),
    para([run(`- Địa điểm làm thêm: ${data.diaDiem || 'Sở Xây dựng tỉnh Quảng Trị'}`)], { after: 60 }),
  ]
  const lyDoLines = (data.lyDo || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (lyDoLines.length > 0) {
    body.push(para([run(`- Lý do làm thêm: ${lyDoLines[0]}${lyDoLines.length > 1 ? ' Cụ thể:' : ''}`)], { after: 40 }))
    for (let i = 1; i < lyDoLines.length; i++) {
      const line = lyDoLines[i].replace(/^[+\-•]\s*/, '')
      body.push(new Paragraph({
        spacing: { after: 30, line: 312 },
        indent: { left: 360 },
        children: [run(`+ ${line}`)],
      }))
    }
  } else {
    body.push(para([run('- Lý do làm thêm: Thực hiện các nhiệm vụ thuộc chức năng, nhiệm vụ của Phòng.')], { after: 60 }))
  }

  // ── Bảng thành viên ──
  const headCell = (t: string, w: number) =>
    cell([para([run(t, { bold: true, size: 26 })], { align: AlignmentType.CENTER })], w)
  const tableHead = new TableRow({
    tableHeader: true,
    children: [
      headCell('STT', 7),
      headCell('Họ tên', 30),
      headCell('Chức vụ', 25),
      headCell('Số giờ làm thêm', 18),
      headCell('Chữ ký của người lao động', 20),
    ],
  })
  const tableRows = data.entries.map((e, i) =>
    new TableRow({
      children: [
        cell([para([run(String(i + 1), { size: 26 })], { align: AlignmentType.CENTER })], 7),
        cell([para([run(e.hoTen, { size: 26 })])], 30),
        cell([para([run(e.chucVu ?? '', { size: 26 })], { align: AlignmentType.CENTER })], 25),
        cell([para([run(fmtGio(sumDayHours(e.gioNgay)), { size: 26 })], { align: AlignmentType.CENTER })], 18),
        cell([para([run('')], { align: AlignmentType.CENTER })], 20),
      ],
    })
  )
  // Layout cố định + bề rộng cột (twip) để cột không tự co giãn / nhảy ô.
  // Bề rộng nội dung A4 = 11906 − 1418 − 1134 = 9354 twip.
  const memberTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [655, 2806, 2339, 1684, 1870],
    rows: [tableHead, ...tableRows],
  })

  // ── Khối ký 2 cột ──
  const footer = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          noBorderCell([
            para([run('PHÊ DUYỆT CỦA LÃNH ĐẠO SỞ PHỤ TRÁCH', { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
            para([run('(Ký tên, đóng dấu)', { italics: true, size: 24 })], { align: AlignmentType.CENTER, after: 600 }),
            para([run(data.lanhDaoSo ?? '', { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
          ], 52),
          noBorderCell([
            para([run(dateLine(data.ngayKy, data.nam), { italics: true, size: 26 })], { align: AlignmentType.CENTER }),
            para([run('TRƯỞNG PHÒNG', { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
            para([run('(Ký tên)', { italics: true, size: 24 })], { align: AlignmentType.CENTER, after: 600 }),
            para([run(data.truongPhong ?? '', { bold: true, size: 26 })], { align: AlignmentType.CENTER }),
          ], 48),
        ],
      }),
    ],
  })

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 } } },
      children: [
        mauSo,
        headerTable,
        new Paragraph({ spacing: { after: 120 }, children: [] }),
        title,
        ...body,
        new Paragraph({ spacing: { after: 120 }, children: [] }),
        memberTable,
        new Paragraph({ spacing: { after: 240 }, children: [] }),
        footer,
      ],
    }],
  })

  return Packer.toBuffer(doc)
}

function fmtGio(n: number): string {
  if (!n) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
