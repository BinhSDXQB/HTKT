// Nạp hàng loạt văn bản pháp luật (PDF/DOCX) vào kho RAG (bảng tai_lieu + tai_lieu_chunk).
// Tái hiện đúng pipeline lib/rag (extract.ts + chunk.ts + embeddings.ts + ingest.ts) ở dạng .mjs
// để chạy bằng node trực tiếp (lib gốc là server-only TS có path alias, không import thẳng được).
//
// Chạy:  node prisma/import-vbpl.mjs               (thư mục mặc định bên dưới)
//        node prisma/import-vbpl.mjs "G:\\duong\\dan\\khac"
//
// Idempotent: bỏ qua file đã nạp (so theo "nguon" = tên file) đang ở trạng thái san_sang.
import { readFileSync, readdirSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import OpenAI from 'openai'

const FOLDER = process.argv[2] || 'G:\\My Drive\\Tailieu_VBPL'
const LOAI = 'VB_PHAP_LUAT'
const PHAM_VI = 'CONG_KHAI'
const EMBED_MODEL = 'text-embedding-3-small'

// ── Nạp .env tối giản ────────────────────────────────────────────────
const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
const client = new pg.Client({ connectionString: env.DATABASE_URL })

// ── Trích xuất văn bản (khớp lib/rag/extract.ts) ─────────────────────
async function extractText(buf, filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return extractPdf(buf)
  if (ext === 'docx') return extractDocx(buf)
  throw new Error(`Định dạng .${ext} không hỗ trợ`)
}
async function extractPdf(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useSystemFonts: true }).promise
  const parts = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items.map((it) => (typeof it.str === 'string' ? it.str : '')).join(' ')
    parts.push(`\n\n[Trang ${i}]\n${line}`)
    page.cleanup()
  }
  await doc.cleanup()
  const text = parts.join('').trim()
  if (!text) throw new Error('PDF không có lớp văn bản (bản scan ảnh) — cần OCR trước.')
  return text
}
async function extractDocx(buf) {
  const mammoth = await import('mammoth')
  const res = await mammoth.extractRawText({ buffer: buf })
  const text = (res.value || '').trim()
  if (!text) throw new Error('Word rỗng hoặc không đọc được.')
  return text
}

// ── Cắt đoạn (khớp lib/rag/chunk.ts) ─────────────────────────────────
const uocLuongToken = (t) => Math.ceil(t.length / 3.5)
function splitLongParagraph(p, maxChars) {
  const sentences = p.split(/(?<=[.!?。;:])\s+/)
  const out = []
  let buf = ''
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (buf) { out.push(buf); buf = '' }
      for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars))
      continue
    }
    if (buf && (buf.length + 1 + s.length) > maxChars) { out.push(buf); buf = s }
    else buf = buf ? `${buf} ${s}` : s
  }
  if (buf) out.push(buf)
  return out
}
function chunkText(raw, { maxChars = 1100, overlap = 150 } = {}) {
  const text = raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return []
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const pieces = []
  let buf = ''
  for (const p of paras) {
    if (p.length > maxChars) {
      if (buf) { pieces.push(buf); buf = '' }
      pieces.push(...splitLongParagraph(p, maxChars))
      continue
    }
    if (buf && (buf.length + 1 + p.length) > maxChars) { pieces.push(buf); buf = p }
    else buf = buf ? `${buf}\n\n${p}` : p
  }
  if (buf) pieces.push(buf)
  const chunks = []
  for (let i = 0; i < pieces.length; i++) {
    let content = pieces[i]
    if (i > 0 && overlap > 0) content = `…${pieces[i - 1].slice(-overlap)}\n\n${content}`
    chunks.push({ index: i, content, soToken: uocLuongToken(content) })
  }
  return chunks
}
function viTriTuNoiDung(content) {
  const m = [...content.matchAll(/\[Trang (\d+)\]/g)]
  return m.length ? `Trang ${m[m.length - 1][1]}` : null
}

// ── Nhúng vector theo lô ─────────────────────────────────────────────
async function embedTexts(texts) {
  const out = []
  const BATCH = 96
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.replace(/\n/g, ' ').slice(0, 8000))
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch })
    for (const d of res.data) out.push(d.embedding)
  }
  return out
}
const vlit = (v) => `[${v.join(',')}]`

// Tiêu đề gọn từ tên file: bỏ đuôi, bỏ số thứ tự đầu "12." , gọn khoảng trắng.
function tieuDeTuTenFile(name) {
  return basename(name, extname(name))
    .replace(/^\d+\s*[.\-]\s*/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Chạy ─────────────────────────────────────────────────────────────
await client.connect()
const all = readdirSync(FOLDER)
const targets = all.filter((f) => ['.pdf', '.docx'].includes(extname(f).toLowerCase()))
const skipped = all.filter((f) => ['.doc', '.gdoc'].includes(extname(f).toLowerCase()))

console.log(`📁 ${FOLDER}`)
console.log(`   ${targets.length} file PDF/DOCX sẽ xử lý · ${skipped.length} file .doc/.gdoc bỏ qua\n`)

let ok = 0, skip = 0, err = 0
for (const f of targets) {
  const nguon = f
  // Idempotent: đã nạp thành công rồi thì bỏ qua.
  const ex = await client.query(
    `SELECT id FROM tai_lieu WHERE nguon=$1 AND "trangThai"='san_sang' AND "deletedAt" IS NULL LIMIT 1`, [nguon])
  if (ex.rows.length) { console.log(`⏭️  Bỏ qua (đã có): ${f}`); skip++; continue }

  const tieuDe = tieuDeTuTenFile(f)
  let docId = null
  try {
    const buf = readFileSync(join(FOLDER, f))
    const text = await extractText(buf, f)
    const chunks = chunkText(text)
    if (!chunks.length) throw new Error('Không tách được đoạn nào.')

    docId = randomUUID()
    await client.query(
      `INSERT INTO tai_lieu (id,"tieuDe",loai,"phamVi",nguon,"trangThai","soChunk","soKyTu","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,'dang_xu_ly',0,$6,now(),now())`,
      [docId, tieuDe, LOAI, PHAM_VI, nguon, text.length])

    const vecs = await embedTexts(chunks.map((c) => c.content))
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      await client.query(
        `INSERT INTO tai_lieu_chunk (id,"taiLieuId","chunkIndex","noiDung",embedding,"soToken","viTri","createdAt")
         VALUES ($1,$2,$3,$4,$5::vector,$6,$7,now())`,
        [randomUUID(), docId, c.index, c.content, vlit(vecs[i]), c.soToken, viTriTuNoiDung(c.content)])
    }
    await client.query(`UPDATE tai_lieu SET "trangThai"='san_sang', "soChunk"=$2 WHERE id=$1`, [docId, chunks.length])
    console.log(`✅ ${f}  → ${chunks.length} đoạn`)
    ok++
  } catch (e) {
    err++
    const msg = e instanceof Error ? e.message : String(e)
    if (docId) await client.query(`UPDATE tai_lieu SET "trangThai"='loi', "ghiChuLoi"=$2 WHERE id=$1`, [docId, msg.slice(0, 500)])
    console.log(`❌ ${f}  → ${msg}`)
  }
}

console.log(`\n──────── KẾT QUẢ ────────`)
console.log(`✅ Nạp mới: ${ok}   ⏭️ Đã có: ${skip}   ❌ Lỗi: ${err}`)
if (skipped.length) {
  console.log(`\n⚠️ Không xử lý (định dạng .doc cũ / .gdoc shortcut — lưu lại thành .docx hoặc PDF rồi chạy lại):`)
  for (const s of skipped) console.log(`   - ${s}`)
}
await client.end()
