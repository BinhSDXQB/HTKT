import 'server-only'

export type ExtractResult = { text: string; soTrang?: number }

/**
 * Trích xuất văn bản thuần từ buffer theo định dạng. Hỗ trợ PDF, DOCX, TXT.
 * Trả về text đã ghép; lỗi định dạng sẽ ném Error để caller ghi trạng thái 'loi'.
 */
export async function extractText(
  buf: Buffer,
  filename: string,
  mimetype?: string
): Promise<ExtractResult> {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  const mt = (mimetype || '').toLowerCase()

  if (ext === 'pdf' || mt.includes('pdf')) return extractPdf(buf)
  if (ext === 'docx' || mt.includes('officedocument.wordprocessingml')) return extractDocx(buf)
  if (ext === 'doc' || mt === 'application/msword') {
    throw new Error('Định dạng .doc (Word cũ) chưa hỗ trợ — vui lòng lưu lại thành .docx hoặc PDF.')
  }
  // Mặc định coi là văn bản thuần (txt/md/dán text đã ghi ra file tạm).
  return { text: buf.toString('utf-8') }
}

async function extractPdf(buf: Buffer): Promise<ExtractResult> {
  // pdfjs-dist v6 là ESM; bản legacy chạy trong Node không cần worker thật.
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(buf)
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items.map((it: any) => (typeof it.str === 'string' ? it.str : '')).join(' ')
    parts.push(`\n\n[Trang ${i}]\n${line}`)
    page.cleanup()
  }
  await doc.cleanup()
  const text = parts.join('').trim()
  if (!text) {
    throw new Error('PDF không có lớp văn bản (có thể là bản scan ảnh). Cần OCR trước khi nạp.')
  }
  return { text, soTrang: doc.numPages }
}

async function extractDocx(buf: Buffer): Promise<ExtractResult> {
  const mammoth: any = await import('mammoth')
  const res = await mammoth.extractRawText({ buffer: buf })
  const text = (res.value || '').trim()
  if (!text) throw new Error('Tệp Word rỗng hoặc không đọc được nội dung.')
  return { text }
}
