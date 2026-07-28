// Kiểm thử trích xuất văn bản: tạo DOCX (lib docx) + PDF (pdf-lib), rồi đọc lại
// bằng đúng đường dẫn extract.ts dùng (mammoth + pdfjs legacy). Chạy: node prisma/test-extract.mjs
import { Document, Packer, Paragraph } from 'docx'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const MARK_DOCX = 'Quy trình cấp phép xây dựng trong khu đô thị Quảng Trị.'
const MARK_PDF = 'Huong dan quan ly cay xanh do thi.'

// 1) DOCX → mammoth
const doc = new Document({ sections: [{ children: [new Paragraph(MARK_DOCX)] }] })
const docxBuf = await Packer.toBuffer(doc)
const mammoth = await import('mammoth')
const r1 = await mammoth.extractRawText({ buffer: docxBuf })
const okDocx = r1.value.includes('cấp phép xây dựng')
console.log('DOCX  →', JSON.stringify(r1.value.trim().slice(0, 60)), okDocx ? '✅' : '❌')

// 2) PDF → pdfjs legacy
const pdf = await PDFDocument.create()
const font = await pdf.embedFont(StandardFonts.Helvetica)
const page = pdf.addPage([400, 200])
page.drawText(MARK_PDF, { x: 30, y: 150, size: 14, font })
const pdfBytes = await pdf.save()

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
const pdoc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes), isEvalSupported: false, useSystemFonts: true }).promise
let text = ''
for (let i = 1; i <= pdoc.numPages; i++) {
  const p = await pdoc.getPage(i)
  const c = await p.getTextContent()
  text += c.items.map((it) => it.str || '').join(' ')
}
const okPdf = text.includes('cay xanh')
console.log('PDF   →', JSON.stringify(text.trim().slice(0, 60)), okPdf ? '✅' : '❌')

console.log('\nKẾT QUẢ:', okDocx && okPdf ? '✅ Cả DOCX & PDF trích xuất OK' : '❌ Có định dạng lỗi')
process.exit(okDocx && okPdf ? 0 : 1)
