// ĐỒNG BỘ 2 CHIỀU thư mục văn bản pháp luật  ⇄  kho RAG (tai_lieu + tai_lieu_chunk).
//
//   node prisma/sync-vbpl.mjs                 → đồng bộ thư mục mặc định + xuất báo cáo
//   node prisma/sync-vbpl.mjs --report        → CHỈ xuất báo cáo, không thay đổi dữ liệu
//   node prisma/sync-vbpl.mjs "G:\\thu\\muc"  → đồng bộ thư mục khác
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
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import pg from 'pg'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'

const ARGS = process.argv.slice(2)
const REPORT_ONLY = ARGS.includes('--report')
const FOLDER = ARGS.find((a) => !a.startsWith('--')) || 'G:\\My Drive\\Tailieu_VBPL'
const LOAI = 'VB_PHAP_LUAT'
const PHAM_VI = 'CONG_KHAI'
const EMBED_MODEL = 'text-embedding-3-small'

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
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

async function embedTexts(texts) {
  const out = []; const BATCH = 96
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.replace(/\n/g, ' ').slice(0, 8000))
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch })
    for (const d of res.data) out.push(d.embedding)
  }
  return out
}
const vlit = (v) => `[${v.join(',')}]`
const tieuDeTuTenFile = (name) => basename(name, extname(name)).replace(/^\d+\s*[.\-]\s*/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim()

async function ingest(f, text, fileHash) {
  const tieuDe = tieuDeTuTenFile(f)
  const chunks = chunkText(text)
  if (!chunks.length) throw new Error('Không tách được đoạn nào.')
  const meta = JSON.stringify({ fileHash, noiDungHash: noiDungHashCua(text), thuMuc: FOLDER })
  const docId = randomUUID()
  await client.query(
    `INSERT INTO tai_lieu (id,"tieuDe",loai,"phamVi",nguon,metadata,"trangThai","soChunk","soKyTu","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,'dang_xu_ly',0,$7,now(),now())`,
    [docId, tieuDe, LOAI, PHAM_VI, f, meta, text.length])
  const vecs = await embedTexts(chunks.map((c) => c.content))
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]
    await client.query(
      `INSERT INTO tai_lieu_chunk (id,"taiLieuId","chunkIndex","noiDung",embedding,"soToken","viTri","createdAt")
       VALUES ($1,$2,$3,$4,$5::vector,$6,$7,now())`,
      [randomUUID(), docId, c.index, c.content, vlit(vecs[i]), c.soToken, viTriTuNoiDung(c.content)])
  }
  await client.query(`UPDATE tai_lieu SET "trangThai"='san_sang', "soChunk"=$2 WHERE id=$1`, [docId, chunks.length])
  return chunks.length
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
  } catch (e) { console.log('⚠️ Không ghi được Excel:', e.message) }
}

// ── Chạy ─────────────────────────────────────────────────────────────
await client.connect()

if (!REPORT_ONLY) {
  const all = readdirSync(FOLDER)
  const targets = all.filter((f) => ['.pdf', '.docx'].includes(extname(f).toLowerCase()))
  const boQua = all.filter((f) => ['.doc', '.gdoc'].includes(extname(f).toLowerCase()))
  console.log(`📁 ${FOLDER}\n   ${targets.length} file PDF/DOCX · ${boQua.length} file .doc/.gdoc bỏ qua\n`)

  let them = 0, daCo = 0, trungFile = 0, trungND = 0, loi = 0
  const canOcr = []
  for (const f of targets) {
    try {
      const buf = readFileSync(join(FOLDER, f))
      const fileHash = sha256(buf)

      // (a) đã có đúng file này (theo mã băm bytes)?
      const byHash = await client.query(`SELECT nguon FROM tai_lieu WHERE metadata->>'fileHash'=$1 AND "deletedAt" IS NULL LIMIT 1`, [fileHash])
      if (byHash.rows.length) {
        if (byHash.rows[0].nguon === f) { daCo++ }
        else { console.log(`🟰 TRÙNG FILE: "${f}" giống hệt "${byHash.rows[0].nguon}" → bỏ qua`); trungFile++ }
        continue
      }

      // (b) bản ghi cũ cùng tên nhưng chưa có mã băm (nạp từ script import trước) → backfill, coi như đã có.
      const byName = await client.query(`SELECT id, metadata FROM tai_lieu WHERE nguon=$1 AND "deletedAt" IS NULL LIMIT 1`, [f])
      if (byName.rows.length) {
        const text0 = await extractText(buf, f)
        const meta = JSON.stringify({ ...(byName.rows[0].metadata || {}), fileHash, noiDungHash: noiDungHashCua(text0), thuMuc: FOLDER })
        await client.query(`UPDATE tai_lieu SET metadata=$2::jsonb WHERE id=$1`, [byName.rows[0].id, meta])
        daCo++
        continue
      }

      // (c) file mới → trích xuất, kiểm tra TRÙNG NỘI DUNG.
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
      const byContent = await client.query(`SELECT nguon FROM tai_lieu WHERE metadata->>'noiDungHash'=$1 AND "deletedAt" IS NULL LIMIT 1`, [ndHash])
      if (byContent.rows.length) {
        console.log(`📑 TRÙNG NỘI DUNG: "${f}" trùng nội dung với "${byContent.rows[0].nguon}" → bỏ qua`)
        trungND++
        continue
      }

      const n = await ingest(f, text, fileHash)
      console.log(`✅ THÊM MỚI: ${f} → ${n} đoạn`)
      them++
    } catch (e) {
      loi++
      console.log(`❌ ${f} → ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // (d) XOÁ ĐỒNG BỘ: tài liệu thuộc thư mục này nhưng file đã biến mất.
  const trongThuMuc = new Set(all)
  const managed = await client.query(`SELECT id, nguon FROM tai_lieu WHERE metadata->>'thuMuc'=$1 AND "deletedAt" IS NULL`, [FOLDER])
  let xoa = 0
  for (const m of managed.rows) {
    if (!trongThuMuc.has(m.nguon)) {
      await client.query(`UPDATE tai_lieu SET "deletedAt"=now() WHERE id=$1`, [m.id])
      console.log(`🗑️  ĐÃ GỠ khỏi kho (file không còn trong thư mục): ${m.nguon}`)
      xoa++
    }
  }

  console.log(`\n──────── ĐỒNG BỘ ────────`)
  console.log(`✅ Thêm mới: ${them}  ·  ⏭️ Đã có: ${daCo}  ·  🟰 Trùng file: ${trungFile}  ·  📑 Trùng nội dung: ${trungND}  ·  🗑️ Đã gỡ: ${xoa}  ·  ❌ Lỗi: ${loi}`)
  if (canOcr.length) {
    console.log(`
🔍 ${canOcr.length} tệp CẦN OCR trước khi nạp (bản scan, không có lớp văn bản):`)
    canOcr.forEach((x) => console.log(`   - ${x}`))
    console.log('   → Dùng Adobe Acrobat / công cụ OCR để tạo lớp văn bản, hoặc tải bản .docx từ Công báo, rồi chạy lại.')
  }
  if (boQua.length) console.log(`⚠️ Không xử lý (.doc cũ/.gdoc shortcut): ${boQua.length} file — lưu lại thành .docx/PDF rồi chạy lại.`)
}

await xuatBaoCao()
await client.end()
