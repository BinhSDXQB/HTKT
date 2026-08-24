// ĐỌC BẢN GỐC văn bản pháp luật trong thư mục của Sở — KHÔNG cần OpenAI, KHÔNG cần kho RAG.
//
// Vì sao cần: nhúng véc-tơ phụ thuộc hạn mức OpenAI. Khi hạn mức hết (sự cố 24/8/2026),
// văn bản không vào được kho và chatbot/tra cứu không thấy — nhưng vẫn phải soạn nội dung
// nghiệp vụ có dẫn nguồn. Công cụ này đọc thẳng tệp .docx/.pdf để đối chiếu bản gốc.
//
// Cách dùng:
//   node scripts/doc-van-ban-goc.mjs ds                        → liệt kê tệp trong thư mục
//   node scripts/doc-van-ban-goc.mjs muc-luc "<tệp>"           → in mục lục Chương/Mục/Điều
//   node scripts/doc-van-ban-goc.mjs tim "<tệp>" "<từ khoá>"   → in các đoạn quanh từ khoá
//   node scripts/doc-van-ban-goc.mjs bang "<tệp>" "<từ khoá>"  → in BẢNG giữ đúng cột (.docx)
//   node scripts/doc-van-ban-goc.mjs xuat "<tệp>"              → ghi toàn văn ra tệp .txt tạm
//
// Thư mục mặc định lấy từ biến môi trường THU_MUC_VBPL, nếu không có thì dùng kho của Sở.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const FOLDER = process.env.THU_MUC_VBPL || 'G:/My Drive/Tailieu_VBPL'
const [lenh, tep, tuKhoa] = process.argv.slice(2)

async function bocText(file) {
  const buf = readFileSync(join(FOLDER, file))
  const ext = extname(file).toLowerCase()
  if (ext === '.docx') {
    const mammoth = await import('mammoth')
    return ((await mammoth.extractRawText({ buffer: buf })).value || '').trim()
  }
  if (ext === '.pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useSystemFonts: true }).promise
    const phan = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const c = await page.getTextContent()
      phan.push(`\n\n[Trang ${i}]\n${c.items.map((it) => (typeof it.str === 'string' ? it.str : '')).join(' ')}`)
      page.cleanup()
    }
    await doc.cleanup()
    return phan.join('').trim()
  }
  throw new Error(`Không hỗ trợ định dạng ${ext}`)
}

function timTep(gan) {
  const ds = readdirSync(FOLDER)
  if (ds.includes(gan)) return gan
  const k = (gan || '').toLowerCase()
  const khop = ds.filter((f) => f.toLowerCase().includes(k))
  if (khop.length === 1) return khop[0]
  if (khop.length > 1) {
    console.log(`Có ${khop.length} tệp khớp "${gan}", nêu rõ hơn:`)
    khop.slice(0, 15).forEach((f) => console.log('  -', f))
    process.exit(1)
  }
  console.log(`Không thấy tệp nào khớp "${gan}" trong ${FOLDER}`)
  process.exit(1)
}

if (!lenh || lenh === 'ds') {
  const ds = readdirSync(FOLDER).filter((f) => ['.pdf', '.docx'].includes(extname(f).toLowerCase()))
  console.log(`${FOLDER} — ${ds.length} tệp:`)
  ds.forEach((f) => console.log('  ', f))
  process.exit(0)
}

const file = timTep(tep)
const text = await bocText(file)

if (lenh === 'muc-luc') {
  console.log(`### ${file} — ${text.length} ký tự\n`)
  const daCo = new Set()
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (/^(Chương|Mục|Phần|Phụ lục)\s/i.test(line) || /^Điều\s+\d+[a-z]?\./i.test(line)) {
      if (daCo.has(line)) continue
      daCo.add(line)
      console.log(line.slice(0, 180))
    }
  }
} else if (lenh === 'tim') {
  if (!tuKhoa) { console.log('Thiếu từ khoá.'); process.exit(1) }
  const low = text.toLowerCase()
  const k = tuKhoa.toLowerCase()
  let i = 0
  let n = 0
  while ((i = low.indexOf(k, i)) !== -1 && n < 8) {
    console.log(`\n=== ${file} [vị trí ${i}] ===\n` + text.slice(Math.max(0, i - 200), i + 2500))
    i += 2500
    n++
  }
  if (!n) console.log(`Không thấy "${tuKhoa}" trong ${file}`)
} else if (lenh === 'bang') {
  if (extname(file).toLowerCase() !== '.docx') { console.log('Lệnh "bang" chỉ dùng cho .docx'); process.exit(1) }
  const mammoth = await import('mammoth')
  const html = (await mammoth.convertToHtml({ buffer: readFileSync(join(FOLDER, file)) })).value
  const bang = html.split('<table>').slice(1).map((t) => t.split('</table>')[0])
  console.log(`${file} — ${bang.length} bảng`)
  let n = 0
  for (const t of bang) {
    if (tuKhoa && !t.replace(/<[^>]+>/g, ' ').toLowerCase().includes(tuKhoa.toLowerCase())) continue
    n++
    console.log(`\n===== BẢNG ${n} =====`)
    for (const row of t.split('<tr>').slice(1)) {
      const o = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) =>
        m[1].replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
      )
      if (o.length) console.log(o.join(' | '))
    }
    if (n >= 2) break
  }
  if (!n) console.log(`Không có bảng nào chứa "${tuKhoa}"`)
} else if (lenh === 'xuat') {
  const out = join(process.env.TEMP || '.', file.replace(/[^\w.]/g, '_') + '.txt')
  writeFileSync(out, text, 'utf-8')
  console.log(`${text.length} ký tự → ${out}`)
} else {
  console.log('Lệnh không hợp lệ. Xem hướng dẫn ở đầu tệp.')
  process.exit(1)
}
