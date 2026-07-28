import 'server-only'

export type Chunk = { index: number; content: string; soToken: number }

// Ước lượng token: tiếng Việt qua text-embedding-3-small ~ 1 token / 3.5 ký tự.
// Chỉ dùng để lưu thống kê, không cần chính xác tuyệt đối.
export function uocLuongToken(text: string): number {
  return Math.ceil(text.length / 3.5)
}

/**
 * Cắt văn bản thành các đoạn ~maxChars ký tự, gối nhau overlap ký tự, cố gắng
 * cắt ở ranh giới đoạn/câu để giữ ngữ nghĩa. Phù hợp tài liệu hành chính VN.
 */
export function chunkText(
  raw: string,
  { maxChars = 1100, overlap = 150 }: { maxChars?: number; overlap?: number } = {}
): Chunk[] {
  // Chuẩn hoá khoảng trắng, gộp nhiều dòng trống thành 1 ranh giới đoạn.
  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!text) return []

  // Tách theo đoạn trước, rồi gom các đoạn lại tới ngưỡng maxChars.
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const pieces: string[] = []
  let buf = ''
  for (const p of paras) {
    if (p.length > maxChars) {
      // Đoạn quá dài: đẩy buf hiện tại, rồi cắt đoạn dài theo câu.
      if (buf) { pieces.push(buf); buf = '' }
      pieces.push(...splitLongParagraph(p, maxChars))
      continue
    }
    if (buf && (buf.length + 1 + p.length) > maxChars) {
      pieces.push(buf)
      buf = p
    } else {
      buf = buf ? `${buf}\n\n${p}` : p
    }
  }
  if (buf) pieces.push(buf)

  // Thêm phần gối (overlap) ở đầu mỗi đoạn (trừ đoạn đầu) để không mất ngữ cảnh.
  const chunks: Chunk[] = []
  for (let i = 0; i < pieces.length; i++) {
    let content = pieces[i]
    if (i > 0 && overlap > 0) {
      const tail = pieces[i - 1].slice(-overlap)
      content = `…${tail}\n\n${content}`
    }
    chunks.push({ index: i, content, soToken: uocLuongToken(content) })
  }
  return chunks
}

function splitLongParagraph(p: string, maxChars: number): string[] {
  const sentences = p.split(/(?<=[.!?。;:])\s+/)
  const out: string[] = []
  let buf = ''
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (buf) { out.push(buf); buf = '' }
      // Câu siêu dài (bảng/danh sách không dấu câu): cắt cứng theo ký tự.
      for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars))
      continue
    }
    if (buf && (buf.length + 1 + s.length) > maxChars) {
      out.push(buf)
      buf = s
    } else {
      buf = buf ? `${buf} ${s}` : s
    }
  }
  if (buf) out.push(buf)
  return out
}
