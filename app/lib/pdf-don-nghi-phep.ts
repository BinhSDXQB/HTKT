import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

/**
 * Sinh PDF "Giấy đề nghị nghỉ phép" để các cấp ký số chồng dần (PAdES, cách USB Token + VGCA).
 *
 * Quan trọng: file PDF gốc được sinh MỘT LẦN; mỗi cấp ký lên chính file (đã ký của cấp trước),
 * nên KHÔNG bake ý kiến/chữ ký dạng text sau khi đã ký — ý kiến lưu trong CSDL, còn việc phê duyệt
 * chính là chữ ký số. Khu chữ ký để TRỐNG cho phần mềm ký đặt hình chữ ký số lên.
 */

const FONT_DIR = process.env.LEAVE_FONT_DIR || 'C:\\Windows\\Fonts'

function loadFont(file: string): Buffer {
  return fs.readFileSync(path.join(FONT_DIR, file))
}

export type LeavePdfData = {
  hoTen: string
  chucVu: string
  donVi: string
  loaiNghiLabel: string
  tuNgay: Date
  denNgay: Date
  soNgay: number
  lyDo?: string | null
  dinhMucPhep?: number | null
  conLai?: number | null
  nguoiBanGiao?: string | null
  noiNghi?: string | null
  dienThoaiLienHe?: string | null
  deNghiUngLuong: boolean
  diaDanh?: string
  ngayLamDon?: Date
}

function fmtDmy(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export async function generateLeaveRequestPdf(data: LeavePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const reg = await doc.embedFont(loadFont('times.ttf'), { subset: true })
  const bold = await doc.embedFont(loadFont('timesbd.ttf'), { subset: true })

  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const left = 64
  const right = width - 64
  const contentW = right - left
  let y = height - 56

  const black = rgb(0, 0, 0)

  function text(s: string, x: number, font: PDFFont, size: number) {
    page.drawText(s, { x, y, size, font, color: black })
  }
  function centerText(s: string, font: PDFFont, size: number) {
    const w = font.widthOfTextAtSize(s, size)
    page.drawText(s, { x: left + (contentW - w) / 2, y, size, font, color: black })
  }
  // Bọc dòng theo bề rộng, trả về y mới
  function wrap(s: string, font: PDFFont, size: number, x: number, maxW: number, lineGap = 4): void {
    const words = s.split(/\s+/)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        page.drawText(line, { x, y, size, font, color: black })
        y -= size + lineGap
        line = w
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, { x, y, size, font, color: black })
      y -= size + lineGap
    }
  }

  // Quốc hiệu — tiêu ngữ
  centerText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold, 13); y -= 16
  centerText('Độc lập - Tự do - Hạnh phúc', bold, 13); y -= 10
  const lineW = 180
  page.drawLine({ start: { x: left + (contentW - lineW) / 2, y: y + 4 }, end: { x: left + (contentW + lineW) / 2, y: y + 4 }, thickness: 0.8, color: black })
  y -= 28

  centerText('GIẤY ĐỀ NGHỊ NGHỈ PHÉP', bold, 16); y -= 30

  text('Kính gửi:', left, reg, 13)
  text('- Giám đốc Sở Xây dựng tỉnh Quảng Trị;', left + 64, reg, 13); y -= 18
  text(`- Trưởng ${data.donVi || 'đơn vị'};`, left + 64, reg, 13); y -= 18
  text('- Văn phòng Sở; Phòng Kế hoạch - Tài chính.', left + 64, reg, 13); y -= 24

  wrap(`Tên tôi là: ${data.hoTen}`, reg, 13, left, contentW)
  wrap(`Chức vụ: ${data.chucVu || '…'}    -    Đơn vị: ${data.donVi || '…'}`, reg, 13, left, contentW)
  y -= 6

  wrap(`Nay tôi làm giấy này đề nghị Lãnh đạo Sở cho tôi được nghỉ ${data.loaiNghiLabel.toLowerCase()} ` +
    `từ ngày ${fmtDmy(data.tuNgay)} đến hết ngày ${fmtDmy(data.denNgay)} (tổng cộng ${data.soNgay} ngày).`,
    reg, 13, left, contentW)
  if (data.dinhMucPhep != null) {
    wrap(`Định mức phép năm: ${data.dinhMucPhep} ngày; số ngày phép còn lại: ${data.conLai ?? '…'} ngày.`, reg, 13, left, contentW)
  }
  if (data.lyDo) wrap(`Lý do: ${data.lyDo}`, reg, 13, left, contentW)
  if (data.nguoiBanGiao) wrap(`Người nhận bàn giao công việc: ${data.nguoiBanGiao}.`, reg, 13, left, contentW)
  if (data.noiNghi) wrap(`Nơi nghỉ / địa chỉ liên hệ: ${data.noiNghi}${data.dienThoaiLienHe ? ` - ĐT: ${data.dienThoaiLienHe}` : ''}.`, reg, 13, left, contentW)
  if (data.deNghiUngLuong) wrap('Đề nghị: cho tạm ứng lương trong thời gian nghỉ (Phòng Kế hoạch - Tài chính giải quyết).', bold, 13, left, contentW)
  y -= 6
  wrap('Tôi xin cam đoan đã bàn giao công việc và chấp hành đúng quy định. Kính đề nghị Lãnh đạo xem xét, giải quyết.', reg, 13, left, contentW)
  y -= 6

  const diaDanh = data.diaDanh || 'Quảng Trị'
  const ngay = data.ngayLamDon || new Date()
  const dateStr = `${diaDanh}, ngày ${ngay.getDate()} tháng ${ngay.getMonth() + 1} năm ${ngay.getFullYear()}`
  const dw = reg.widthOfTextAtSize(dateStr, 12)
  page.drawText(dateStr, { x: right - dw, y, size: 12, font: reg, color: black }); y -= 20

  // Khối chữ ký: trái = người làm đơn; phải = NGƯỜI làm đơn ký. Các ô duyệt cấp dưới.
  const colNguoiLamDonX = right - 200
  page.drawText('NGƯỜI LÀM ĐƠN', { x: colNguoiLamDonX, y, size: 12, font: bold, color: black }); y -= 12
  page.drawText('(Ký, ghi rõ họ tên)', { x: colNguoiLamDonX, y, size: 10.5, font: reg, color: black }); y -= 60
  page.drawText(data.hoTen, { x: colNguoiLamDonX, y, size: 12, font: bold, color: black }); y -= 24

  // Khu duyệt/ký số 3 cấp — để TRỐNG cho chữ ký số đặt lên
  drawApprovalBoxes(page, left, contentW, y, reg, bold, black)

  return doc.save()
}

function drawApprovalBoxes(
  page: PDFPage, left: number, contentW: number, top: number,
  reg: PDFFont, bold: PDFFont, color: ReturnType<typeof rgb>,
) {
  const boxes = ['TRƯỞNG PHÒNG\n(quản lý trực tiếp)', 'VĂN PHÒNG SỞ', 'GIÁM ĐỐC SỞ']
  const w = contentW / 3
  let y = top
  for (let i = 0; i < boxes.length; i++) {
    const x = left + i * w
    const lines = boxes[i].split('\n')
    let yy = y
    for (const ln of lines) {
      const isFirst = ln === lines[0]
      const font = isFirst ? bold : reg
      const size = isFirst ? 12 : 10.5
      const tw = font.widthOfTextAtSize(ln, size)
      page.drawText(ln, { x: x + (w - tw) / 2, y: yy, size, font, color })
      yy -= 13
    }
  }
}
