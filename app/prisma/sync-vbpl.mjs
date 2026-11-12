// ĐỒNG BỘ 2 CHIỀU thư mục văn bản pháp luật  ⇄  kho RAG (tai_lieu + tai_lieu_chunk).
//
//   node prisma/sync-vbpl.mjs                 → đồng bộ thư mục mặc định + xuất báo cáo
//   node prisma/sync-vbpl.mjs --report        → CHỈ xuất báo cáo, không thay đổi dữ liệu
//   node prisma/sync-vbpl.mjs "G:\\thu\\muc"  → đồng bộ thư mục khác
//   node prisma/sync-vbpl.mjs --allow-mass-delete → cho phép gỡ vượt ngưỡng an toàn (chạy tay, có chủ đích)
//   Cờ khác → từ chối, thoát 2. Bị khoá (tiến trình khác đang chạy) → thoát 0. Lỗi/hết hạn mức/chặn xoá → 1.
//
// Tệp CÙNG TÊN nhưng byte khác: chữ y hệt → chỉ cập nhật mã băm; nội dung ĐÃ SỬA → nạp bản mới rồi thay
// bản cũ (giữ tiêu đề, phạm vi, tình trạng hiệu lực). Chỉ xét bản ghi thuộc kho (xem thuocKho trong core).
//
// Việc script làm:
//   1. THÊM MỚI  : file .pdf/.docx chưa có trong kho → trích xuất + nhúng vector.
//   2. CHỐNG TRÙNG: bỏ qua file trùng (mã băm bytes giống) & nội dung trùng (mã băm text giống),
//                   ghi rõ trùng với văn bản nào.
//   3. XOÁ ĐỒNG BỘ: file đã biến mất khỏi thư mục → xoá mềm (deletedAt) → chatbot không còn thấy.
//   4. BÁO CÁO   : in bảng thống kê + tình trạng hiệu lực (đọc prisma/hieu-luc-vbpl.json),
//                   và ghi file Excel "_BaoCao_KhoTaiLieu.xlsx" vào thư mục.
//
// Mỗi tài liệu nạp qua đây được gắn metadata = { fileHash, noiDungHash, thuMuc } để
// nhận diện trùng & giới hạn phạm vi xoá-đồng-bộ đúng thư mục này (không đụng tài liệu nhập tay).
import { readFileSync, writeFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import pg from 'pg'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'
import {
  layKhoaChayDon, maThoat, docThamSo, lietKeTep, thuocKho, chonBanGhiCuaKho, quyetDinhTheoTen, keHoachXoa,
  cungDanhSachDoan, LOAI_VBPL,
} from './sync-vbpl-core.mjs'

// Cờ lạ (--dry, --plan…) trước đây bị bỏ qua và script CHẠY ĐỒNG BỘ THẬT → nay từ chối.
const THAM_SO = docThamSo(process.argv.slice(2))
if (THAM_SO.deQuy) THAM_SO.loi.push('--recursive chưa được hỗ trợ trong script này')
if (THAM_SO.loi.length) {
  console.error(THAM_SO.loi.map((x) => `⛔ ${x}`).join('\n'))
  console.error('Dùng: node prisma/sync-vbpl.mjs [--report] [--allow-mass-delete] ["thư mục"]')
  process.exit(2)
}
const REPORT_ONLY = THAM_SO.reportOnly
const FOLDER = THAM_SO.folder
const LOAI = LOAI_VBPL
const PHAM_VI = 'CONG_KHAI'

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}
// Cùng cấu hình NHÚNG với lib/ai/cau-hinh.ts (AI_EMBED_*): véc-tơ nạp kho và véc-tơ câu hỏi
// của chatbot PHẢI cùng một model, nếu không phép so khoảng cách ra kết quả rác mà không báo lỗi.
const EMBED_MODEL = env.AI_EMBED_MODEL || env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'
const EMBED_DIM = 1536
const openai = new OpenAI({
  apiKey: env.AI_EMBED_API_KEY || env.OPENAI_API_KEY,
  baseURL: env.AI_EMBED_BASE_URL || 'https://api.openai.com/v1',
})
const client = new pg.Client({ connectionString: env.DATABASE_URL })

// Bảng đăng ký hiệu lực (tuỳ chọn — không có cũng chạy được).
let HIEU_LUC = { vanBan: {} }
try { HIEU_LUC = JSON.parse(readFileSync(new URL('./hieu-luc-vbpl.json', import.meta.url), 'utf-8')) } catch {}
const TT_LABEL = { con_hieu_luc: 'Còn hiệu lực', het_hieu_luc: 'HẾT hiệu lực', du_thao: 'Dự thảo', can_kiem_chung: 'Cần kiểm chứng', chua_phan_loai: 'Chưa phân loại' }

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const chuanHoaText = (t) => t.replace(/\[Trang \d+\]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
const noiDungHashCua = (t) => sha256(chuanHoaText(t))
// Dưới ngưỡng này coi như KHÔNG bóc được chữ (PDF scan) — xem giải thích ở phần nạp.
const NGUONG_CHU_TOI_THIEU = 500

// ── Trích xuất ───────────────────────────────────────────────────────
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
    parts.push(`\n\n[Trang ${i}]\n${content.items.map((it) => (typeof it.str === 'string' ? it.str : '')).join(' ')}`)
    page.cleanup()
  }
  await doc.cleanup()
  const text = parts.join('').trim()
  if (!text) throw new Error('PDF không có lớp văn bản (bản scan) — cần OCR trước.')
  return text
}
async function extractDocx(buf) {
  const mammoth = await import('mammoth')
  const text = ((await mammoth.extractRawText({ buffer: buf })).value || '').trim()
  if (!text) throw new Error('Word rỗng hoặc không đọc được.')
  return text
}

// ── Cắt đoạn (khớp lib/rag/chunk.ts) ─────────────────────────────────
const uocLuongToken = (t) => Math.ceil(t.length / 3.5)
function splitLongParagraph(p, maxChars) {
  const out = []; let buf = ''
  for (const s of p.split(/(?<=[.!?。;:])\s+/)) {
    if (s.length > maxChars) { if (buf) { out.push(buf); buf = '' } for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars)); continue }
    if (buf && (buf.length + 1 + s.length) > maxChars) { out.push(buf); buf = s } else buf = buf ? `${buf} ${s}` : s
  }
  if (buf) out.push(buf); return out
}
function chunkText(raw, { maxChars = 1100, overlap = 150 } = {}) {
  const text = raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return []
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const pieces = []; let buf = ''
  for (const p of paras) {
    if (p.length > maxChars) { if (buf) { pieces.push(buf); buf = '' } pieces.push(...splitLongParagraph(p, maxChars)); continue }
    if (buf && (buf.length + 1 + p.length) > maxChars) { pieces.push(buf); buf = p } else buf = buf ? `${buf}\n\n${p}` : p
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
const viTriTuNoiDung = (c) => { const m = [...c.matchAll(/\[Trang (\d+)\]/g)]; return m.length ? `Trang ${m[m.length - 1][1]}` : null }

/** Lỗi do TÀI KHOẢN OpenAI hết tiền / hết hạn mức — khác hẳn lỗi quá tải tạm thời. */
function heTinDung(e) {
  const code = e?.code || e?.error?.code || ''
  if (code === 'credit_balance_exhausted' || code === 'insufficient_quota') return true
  return /no credits remaining|insufficient_quota|exceeded your current quota/i.test(e?.message || '')
}

// Nhúng vector có THỬ LẠI. Lỗi 429 (quá tải) / 5xx của OpenAI từng làm đứt
// giữa chừng và để lại "bản ghi ma" trong kho — xem ghi chú ở ingest().
async function embedTexts(texts) {
  const out = []; const BATCH = 96
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.replace(/\n/g, ' ').slice(0, 8000))
    let lastErr
    for (let lan = 1; lan <= 5; lan++) {
      try {
        const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch, ...(env.AI_EMBED_SEND_DIM === '1' ? { dimensions: EMBED_DIM } : {}) })
        for (const d of res.data) out.push(d.embedding)
        lastErr = null
        break
      } catch (e) {
        lastErr = e
        const code = e?.status ?? e?.response?.status
        // HẾT TIỀN TRONG TÀI KHOẢN cũng trả 429 như vượt tốc độ, nhưng thử lại là vô ích:
        // mỗi tệp mất hơn 1 phút chờ suông, chạy 130 tệp thì tác vụ 15 phút chồng lên nhau.
        if (heTinDung(e)) throw e
        if (code && code !== 429 && code < 500) throw e   // lỗi do mình (401, 400) → dừng ngay
        const cho = Math.min(60_000, 2000 * 2 ** (lan - 1))
        console.log(`   ⏳ nhúng vector lỗi (${code || e.message}) — thử lại lần ${lan}/5 sau ${cho / 1000}s`)
        await new Promise((r) => setTimeout(r, cho))
      }
    }
    if (lastErr) throw lastErr
  }
  return out
}
const vlit = (v) => `[${v.join(',')}]`
const tieuDeTuTenFile = (name) => basename(name, extname(name)).replace(/^\d+\s*[.\-]\s*/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim()

// CHẶN "BẢN GHI MA" — lỗi đã xảy ra thật (phát hiện 24/8/2026):
// ingest() tạo bản ghi tai_lieu TRƯỚC rồi mới gọi OpenAI nhúng vector. Khi OpenAI
// trả 429 (hết hạn mức), bản ghi ở lại kho với trangThai='dang_xu_ly', soChunk=0
// NHƯNG metadata đã có fileHash. Lần đồng bộ sau, bước chống trùng (a) khớp fileHash
// → đếm "đã có" → bỏ qua VĨNH VIỄN. Kết quả: 9 văn bản (NĐ 258/2025 cây xanh,
// NĐ 269/2025 đô thị thông minh, Luật CBCC 80/2025, NĐ 233, 238, 259, 300/2026,
// NĐ 335, 365/2025) nằm trong kho mà chatbot KHÔNG đọc được đoạn nào.
// Nay: lỗi giữa chừng → xoá sạch bản ghi dở + đánh dấu lỗi, và bước (a) coi bản ghi
// 0 đoạn là chưa nạp để nạp lại.
// trangThaiCuoi='dang_xu_ly' ("chờ thay"): bản thay thế nạp xong vẫn VÔ HÌNH với RAG (search chỉ đọc 'san_sang'),
// chỉ được công bố trong giao dịch thayBanCu. KHÔNG dùng giá trị riêng 'cho_thay': CSDL có CHECK
// tai_lieu_trangthai_check (migration 034) chỉ cho dang_xu_ly/san_sang/loi — ghi 'cho_thay' là lỗi ngay sau khi
// đã nhúng xong (phát hiện 12/11/2026, nhánh này khi đó chưa từng chạy tới). phamVi: lấy của bản cũ để bản nội bộ không lúc nào thành công khai.
async function ingest(f, text, fileHash, { phamVi = PHAM_VI, trangThaiCuoi = 'san_sang' } = {}) {
  const tieuDe = tieuDeTuTenFile(f)
  const chunks = chunkText(text)
  if (!chunks.length) throw new Error('Không tách được đoạn nào.')
  const meta = JSON.stringify({ fileHash, noiDungHash: noiDungHashCua(text), thuMuc: FOLDER })
  const docId = randomUUID()
  await client.query(
    `INSERT INTO tai_lieu (id,"tieuDe",loai,"phamVi",nguon,metadata,"trangThai","soChunk","soKyTu","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,'dang_xu_ly',0,$7,now(),now())`,
    [docId, tieuDe, LOAI, phamVi, f, meta, text.length])
  try {
    const vecs = await embedTexts(chunks.map((c) => c.content))
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      await client.query(
        `INSERT INTO tai_lieu_chunk (id,"taiLieuId","chunkIndex","noiDung",embedding,"soToken","viTri","createdAt")
         VALUES ($1,$2,$3,$4,$5::vector,$6,$7,now())`,
        [randomUUID(), docId, c.index, c.content, vlit(vecs[i]), c.soToken, viTriTuNoiDung(c.content)])
    }
    await client.query(`UPDATE tai_lieu SET "trangThai"=$3, "soChunk"=$2 WHERE id=$1`, [docId, chunks.length, trangThaiCuoi])
    return { id: docId, soDoan: chunks.length }
  } catch (e) {
    // Dọn sạch để lần chạy sau nạp lại được, không để lại bản ghi rỗng chặn đường.
    await client.query(`DELETE FROM tai_lieu_chunk WHERE "taiLieuId"=$1`, [docId])
    await client.query(`DELETE FROM tai_lieu WHERE id=$1`, [docId])
    throw e
  }
}

/** Bản ghi coi như CHƯA nạp xong: chưa sẵn sàng hoặc không có đoạn nào. */
const chuaNapXong = (r) => r.trangThai !== 'san_sang' || !r.soChunk

async function xoaHanBanGhi(id) {
  await client.query(`DELETE FROM tai_lieu_chunk WHERE "taiLieuId"=$1`, [id])
  await client.query(`DELETE FROM tai_lieu WHERE id=$1`, [id])
}

// Bản mới (đang chờ thay — 'dang_xu_ly', RAG chưa thấy) → mang sang những gì người dùng/script hiệu lực đã đặt cho
// bản cũ (tiêu đề sửa tay, mô tả, phạm vi, tình trạng hiệu lực), công bố 'san_sang' và xoá bản cũ trong
// MỘT giao dịch: RAG không lúc nào thấy hai bản hay mất văn bản. Chết trước COMMIT → bản chờ thay
// là bản dở của kho, lượt sau bước (a) dọn rồi thay lại.
async function thayBanCu(cu, moiId) {
  await client.query('BEGIN')
  try {
    await client.query(
      `UPDATE tai_lieu SET "tieuDe"=$2, "moTa"=$3, "phamVi"=$4, "tinhTrangHieuLuc"=$5, "thayTheBoi"=$6, "ghiChuHieuLuc"=$7,
              "trangThai"='san_sang', "updatedAt"=now() WHERE id=$1`,
      [moiId, cu.tieuDe, cu.moTa, cu.phamVi, cu.tinhTrangHieuLuc, cu.thayTheBoi, cu.ghiChuHieuLuc])
    await xoaHanBanGhi(cu.id)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  }
}

// ── Báo cáo ──────────────────────────────────────────────────────────
async function xuatBaoCao() {
  const { rows } = await client.query(
    `SELECT "tieuDe", nguon, loai, "phamVi", "soChunk", "soKyTu", "createdAt"
       FROM tai_lieu WHERE "deletedAt" IS NULL ORDER BY "createdAt"`)
  const reg = HIEU_LUC.vanBan || {}
  const data = rows.map((r, i) => {
    const h = reg[r.nguon] || { tinhTrang: 'chua_phan_loai', thayTheBoi: '', ghiChu: '' }
    return {
      STT: i + 1, 'Tên văn bản': r.tieuDe, 'Tên file': r.nguon, 'Loại': r.loai, 'Phạm vi': r.phamVi,
      'Số đoạn': r.soChunk, 'Số ký tự': r.soKyTu, 'Ngày nạp': new Date(r.createdAt).toLocaleDateString('vi-VN'),
      'Hiệu lực': TT_LABEL[h.tinhTrang] || h.tinhTrang, 'Thay thế bởi': h.thayTheBoi || '', 'Ghi chú': h.ghiChu || '',
    }
  })

  // Bảng gọn ra console
  console.log(`\n📊 KHO TÀI LIỆU — ${data.length} văn bản đang hoạt động`)
  console.log('─'.repeat(110))
  console.log('STT  ' + 'Tên văn bản'.padEnd(54) + 'Đoạn  ' + 'Hiệu lực'.padEnd(16) + 'Phạm vi')
  console.log('─'.repeat(110))
  for (const d of data) {
    const ten = d['Tên văn bản'].length > 52 ? d['Tên văn bản'].slice(0, 51) + '…' : d['Tên văn bản']
    console.log(String(d.STT).padEnd(5) + ten.padEnd(54) + String(d['Số đoạn']).padEnd(6) + d['Hiệu lực'].padEnd(16) + (d['Phạm vi'] === 'CONG_KHAI' ? 'Công khai' : 'Nội bộ Sở'))
  }
  console.log('─'.repeat(110))
  const dem = {}
  for (const d of data) dem[d['Hiệu lực']] = (dem[d['Hiệu lực']] || 0) + 1
  console.log('Theo hiệu lực: ' + Object.entries(dem).map(([k, v]) => `${k}: ${v}`).join(' · '))

  // Ghi Excel vào thư mục
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 5 }, { wch: 50 }, { wch: 40 }, { wch: 14 }, { wch: 10 }, { wch: 7 }, { wch: 9 }, { wch: 11 }, { wch: 16 }, { wch: 20 }, { wch: 45 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Kho tài liệu')
    const out = join(FOLDER, '_BaoCao_KhoTaiLieu.xlsx')
    XLSX.writeFile(wb, out)
    console.log(`📄 Đã ghi báo cáo Excel: ${out}`)
    return true
  } catch (e) { console.log('⚠️ Không ghi được Excel:', e.message); return false }
}

// ── Chạy ─────────────────────────────────────────────────────────────
await client.connect()

// Dùng CHUNG khoá với prisma/import-vbpl.mjs. Chạy chồng (chạy tay trùng lượt định kỳ, hoặc trùng importer)
// thì bước (a)/(b) coi bản ghi 'dang_xu_ly' của tiến trình kia là "bản rỗng" rồi XOÁ HẲN trong khi nó đang nhúng.
// Task Scheduler (IgnoreNew) chỉ chặn chồng giữa các lượt định kỳ. --report chỉ đọc nên không cần khoá.
// Bị khoá là tình huống bình thường, không phải lỗi → thoát 0 để tác vụ lịch không báo hỏng.
if (!REPORT_ONLY && !(await layKhoaChayDon(client))) {
  console.log('⏸️  Đang có tiến trình đồng bộ/nạp VBPL khác chạy → bỏ qua lượt này.')
  await client.end()
  process.exit(0)
}

const ketQua = { loi: 0, hetHanMuc: false, xoaBiChan: false }
if (!REPORT_ONLY) {
  // Thư mục không tồn tại / chưa mount → ném lỗi, dừng trước mọi bước ghi/xoá.
  const all = lietKeTep(FOLDER)
  const targets = all.filter((f) => ['.pdf', '.docx'].includes(extname(f).toLowerCase()))
  const boQua = all.filter((f) => ['.doc', '.gdoc'].includes(extname(f).toLowerCase()))
  console.log(`📁 ${FOLDER}\n   ${targets.length} file PDF/DOCX · ${boQua.length} file .doc/.gdoc bỏ qua\n`)

  let them = 0, daCo = 0, trungFile = 0, trungND = 0, loi = 0, napLai = 0, napLaiND = 0, capNhatMa = 0, trungTen = 0
  let hetHanMuc = false, xoaBiChan = false
  const canOcr = []
  for (const f of targets) {
    try {
      const buf = readFileSync(join(FOLDER, f))
      const fileHash = sha256(buf)

      // (a) đã có đúng file này (theo mã băm bytes)?
      const byHash = await client.query(`SELECT id, nguon, loai, metadata, "createdById", "trangThai", "soChunk" FROM tai_lieu WHERE metadata->>'fileHash'=$1 AND "deletedAt" IS NULL LIMIT 1`, [fileHash])
      const h = byHash.rows[0]
      let banTrungTepKhac = false
      if (h && !chuaNapXong(h)) {
        if (h.nguon === f) { daCo++; continue }
        banTrungTepKhac = true   // byte trùng một tệp KHÁC: nếu kho đã có bản cùng tên thì vẫn phải cập nhật ở (b)
      }
      if (h && !banTrungTepKhac) {
        // Chỉ dọn bản ghi dở của CHÍNH kho này. Bản ghi ngoài kho (tải lên qua giao diện, không lấy khoá)
        // có thể đang nhúng → để lượt sau.
        if (!thuocKho(h, FOLDER)) { console.log(`⏳ BỎ QUA LƯỢT NÀY: "${f}" trùng byte với "${h.nguon}" đang xử lý ngoài kho`); continue }
        console.log(`♻️  NẠP LẠI: "${h.nguon}" có trong kho nhưng ${h.soChunk} đoạn (trạng thái ${h.trangThai}) → xoá bản ghi rỗng và nạp lại`)
        await xoaHanBanGhi(h.id)
        napLai++
      }

      // (b) bản ghi CÙNG TÊN của kho này. Tài liệu cùng tên tải lên qua giao diện (có người tạo) không bị đụng.
      const byName = await client.query(
        `SELECT id, "tieuDe", "moTa", loai, "phamVi", metadata, "createdById", "trangThai", "soChunk",
                "tinhTrangHieuLuc", "thayTheBoi", "ghiChuHieuLuc"
           FROM tai_lieu WHERE nguon=$1 AND "deletedAt" IS NULL ORDER BY "createdAt"`, [f])
      let cu = chonBanGhiCuaKho(byName.rows, FOLDER)
      if (cu && chuaNapXong(cu)) {
        console.log(`♻️  NẠP LẠI: "${f}" có bản ghi ${cu.soChunk} đoạn (trạng thái ${cu.trangThai}) → xoá bản ghi rỗng và nạp lại`)
        await xoaHanBanGhi(cu.id)
        napLai++
        cu = null
      }
      if (banTrungTepKhac && !cu) { console.log(`🟰 TRÙNG FILE: "${f}" giống hệt "${h.nguon}" → bỏ qua`); trungFile++; continue }
      if (!cu && byName.rows.length) {
        // Cùng tên với tài liệu NGOÀI kho (tải lên qua giao diện): trước đây bị "nhận" làm bản của kho;
        // nạp thêm thì chatbot có hai bản. Không tự xử lý → báo để người quản trị quyết.
        console.log(`⚠️  TRÙNG TÊN NGOÀI KHO: "${f}" trùng tên tài liệu tải lên qua giao diện → bỏ qua, cần xử lý tay`)
        trungTen++
        continue
      }

      const text = await extractText(buf, f)

      // CHẶN "HỐ ĐEN" PDF SCAN — lỗi đã xảy ra thật (phát hiện 20/8/2026):
      // PDF scan không có lớp văn bản thì bóc ra gần như rỗng. Mã băm nội dung của
      // các bản rỗng GIỐNG HỆT NHAU, nên tệp scan đầu tiên lọt vào kho biến thành
      // "bản gốc" và MỌI tệp scan nạp sau đều bị coi là trùng rồi âm thầm bỏ qua.
      // Thực tế: 36_2026_TT-BXD_PL6.pdf chỉ có 57 ký tự ("[Trang 1]…[Trang 5]") đã
      // nuốt mất 7 nghị định 2026 (NĐ 210, 193, 205, 136, 238, 269, 35).
      // Nay chặn ngay từ đầu và báo rõ là CẦN OCR, không tạo bản ghi trong kho.
      const soChuThuc = chuanHoaText(text).replace(/\[trang \d+\]/g, '').replace(/\s/g, '').length
      if (soChuThuc < NGUONG_CHU_TOI_THIEU) {
        console.log(`🔍 CẦN OCR: "${f}" chỉ bóc được ${soChuThuc} ký tự — nhiều khả năng là bản SCAN không có lớp văn bản. CHƯA NẠP (nạp vào sẽ làm hỏng cơ chế chống trùng).`)
        canOcr.push(f)
        continue
      }

      const ndHash = noiDungHashCua(text)

      if (cu) {
        // Tệp cùng tên, byte đã khác (bước (a) không khớp).
        const qd = quyetDinhTheoTen(cu, { fileHash, noiDungHash: ndHash })
        if (qd === 'da_co') { daCo++; continue }
        const ghiMaBam = () => client.query(`UPDATE tai_lieu SET metadata=$2::jsonb WHERE id=$1`,
          [cu.id, JSON.stringify({ ...(cu.metadata || {}), fileHash, noiDungHash: ndHash, thuMuc: FOLDER })])
        if (qd === 'cap_nhat_meta') {   // lưu lại / ký số lại, chữ y hệt → không nhúng lại
          await ghiMaBam(); capNhatMa++; continue
        }
        // Bản import cũ chưa có mã băm: đoạn đang lưu giống hệt đoạn tách mới → chỉ ghi mã băm, không tốn phí nhúng.
        if (!cu.metadata?.fileHash) {
          const { rows: doan } = await client.query(`SELECT "noiDung" FROM tai_lieu_chunk WHERE "taiLieuId"=$1 ORDER BY "chunkIndex"`, [cu.id])
          if (cungDanhSachDoan(doan.map((d) => d.noiDung), chunkText(text).map((c) => c.content))) { await ghiMaBam(); capNhatMa++; continue }
        }
        // NỘI DUNG ĐÃ SỬA: giữ đoạn cũ thì chatbot trả lời theo bản cũ. Nạp bản mới TRƯỚC (lỗi/hết hạn mức thì
        // bản cũ còn nguyên, lượt sau thử lại), rồi mới thay bản cũ.
        const moi = await ingest(f, text, fileHash, { phamVi: cu.phamVi, trangThaiCuoi: 'dang_xu_ly' })
        try {
          await thayBanCu(cu, moi.id)
        } catch (e) {
          await xoaHanBanGhi(moi.id).catch(() => {})   // thay lỗi → bỏ bản mới, giữ bản cũ; lượt sau thử lại
          throw e
        }
        console.log(`🔄 NẠP LẠI NỘI DUNG ĐÃ SỬA: ${f} → ${moi.soDoan} đoạn (thay bản cũ ${cu.soChunk} đoạn)`)
        napLaiND++
        continue
      }

      // (c) file mới → kiểm tra TRÙNG NỘI DUNG.
      const byContent = await client.query(`SELECT nguon FROM tai_lieu WHERE metadata->>'noiDungHash'=$1 AND "deletedAt" IS NULL LIMIT 1`, [ndHash])
      if (byContent.rows.length) {
        console.log(`📑 TRÙNG NỘI DUNG: "${f}" trùng nội dung với "${byContent.rows[0].nguon}" → bỏ qua`)
        trungND++
        continue
      }

      const { soDoan: n } = await ingest(f, text, fileHash)
      console.log(`✅ THÊM MỚI: ${f} → ${n} đoạn`)
      them++
    } catch (e) {
      loi++
      console.log(`❌ ${f} → ${e instanceof Error ? e.message : String(e)}`)
      // Hết hạn mức thì mọi tệp còn lại cũng sẽ hỏng y hệt → DỪNG NGAY cả vòng lặp,
      // không để tác vụ định kỳ chạy hàng chục phút vô ích rồi chồng lên lần chạy sau.
      if (heTinDung(e)) {
        console.log('\n⛔ DỪNG ĐỒNG BỘ: tài khoản OpenAI đã hết hạn mức — không nhúng được véc-tơ.')
        console.log('   Nạp thêm hạn mức rồi chạy lại lệnh này; các tệp chưa nạp sẽ tự vào kho.')
        hetHanMuc = true
        break
      }
    }
  }

  // (d) XOÁ ĐỒNG BỘ: tài liệu thuộc kho này nhưng file đã biến mất.
  // Bỏ qua khi phải dừng giữa chừng vì hết hạn mức — lúc đó vòng quét chưa đi hết
  // thư mục, xoá đồng bộ dễ gỡ nhầm tài liệu vẫn còn tệp.
  // NGƯỠNG AN TOÀN: Drive đang đồng bộ/lỗi cache có thể trả thư mục rỗng hoặc thiếu → trước đây sẽ gỡ
  // hàng loạt. Vượt ngưỡng thì chặn, trừ khi chạy tay với --allow-mass-delete.
  const { rows: ungVien } = await client.query(
    `SELECT id, nguon, loai, metadata, "createdById" FROM tai_lieu
      WHERE "deletedAt" IS NULL AND (metadata->>'thuMuc' IS NOT NULL OR ("createdById" IS NULL AND loai=$1))`, [LOAI])
  // Đếm tệp PDF/DOCX, không đếm .doc/.gdoc/Excel báo cáo: Drive lỗi chỉ trả _BaoCao_KhoTaiLieu.xlsx
  // thì vẫn phải coi là thư mục rỗng.
  const keHoach = keHoachXoa(ungVien.filter((r) => thuocKho(r, FOLDER)), new Set(all),
    { soTepQuetDuoc: targets.length, choPhepXoaNhieu: THAM_SO.choPhepXoaNhieu })
  let xoa = 0
  if (!hetHanMuc && keHoach.chan) {
    console.log(`\n⛔ CHẶN XOÁ ĐỒNG BỘ: ${keHoach.chan}. Kiểm tra ổ G:/Google Drive. Nếu đúng là đã bỏ nhiều tệp, chạy tay: node prisma/sync-vbpl.mjs --allow-mass-delete`)
    keHoach.duKien.slice(0, 10).forEach((m) => console.log(`   - ${m.nguon}`))
    xoaBiChan = true
  }
  for (const m of keHoach.xoa) {
    if (hetHanMuc) break
    await client.query(`UPDATE tai_lieu SET "deletedAt"=now() WHERE id=$1`, [m.id])
    console.log(`🗑️  ĐÃ GỠ khỏi kho (file không còn trong thư mục): ${m.nguon}`)
    xoa++
  }

  console.log(`\n──────── ĐỒNG BỘ ────────`)
  console.log(`✅ Thêm mới: ${them}  ·  🔄 Nạp lại nội dung đã sửa: ${napLaiND}  ·  🔖 Cập nhật mã băm: ${capNhatMa}  ·  ♻️ Nạp lại bản rỗng: ${napLai}  ·  ⏭️ Đã có: ${daCo}  ·  🟰 Trùng file: ${trungFile}  ·  📑 Trùng nội dung: ${trungND}  ·  ⚠️ Trùng tên ngoài kho: ${trungTen}  ·  🗑️ Đã gỡ: ${xoa}${xoaBiChan ? ' (CHẶN ' + keHoach.duKien.length + ')' : ''}  ·  ❌ Lỗi: ${loi}`)
  if (canOcr.length) {
    console.log(`
🔍 ${canOcr.length} tệp CẦN OCR trước khi nạp (bản scan, không có lớp văn bản):`)
    canOcr.forEach((x) => console.log(`   - ${x}`))
    console.log('   → Dùng Adobe Acrobat / công cụ OCR để tạo lớp văn bản, hoặc tải bản .docx từ Công báo, rồi chạy lại.')
  }
  if (boQua.length) console.log(`⚠️ Không xử lý (.doc cũ/.gdoc shortcut): ${boQua.length} file — lưu lại thành .docx/PDF rồi chạy lại.`)
  Object.assign(ketQua, { loi, hetHanMuc, xoaBiChan })
}

if (!(await xuatBaoCao())) ketQua.loi++   // báo cáo là việc chính của --report: lỗi thì không báo thành công
await client.end()
// Trước đây luôn thoát 0 kể cả khi nạp lỗi/hết hạn mức → Task Scheduler báo "thành công", không ai biết.
process.exitCode = maThoat(ketQua)
