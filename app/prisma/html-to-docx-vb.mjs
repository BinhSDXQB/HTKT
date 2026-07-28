// Chuyển trang toàn văn văn bản (HTML) thành .docx để nạp kho RAG.
// node html-to-docx-vb.mjs <url> <đường-dẫn-file-docx-ra> [selector-hint]
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { Document, Packer, Paragraph, TextRun } from 'docx'

const [url, outFile] = process.argv.slice(2)
if (!url || !outFile) { console.error('Usage: node html-to-docx-vb.mjs <url> <out.docx>'); process.exit(1) }

const html = execFileSync('curl.exe', ['-k', '-s', '-L', url, '--max-time', '90'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf-8')

// Lấy khối nội dung chính: ưu tiên div bài viết của các cổng chinhphu.vn / cổng tỉnh
const patterns = [
  /<div[^>]*class="[^"]*(?:detail-content|maincontent|main-content|noidung|content-detail|entry-content|article-body|contentbody)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<footer|<script)/i,
  /<article[^>]*>([\s\S]*?)<\/article>/i,
  /<body[^>]*>([\s\S]*?)<\/body>/i,
]
let block = ''
for (const p of patterns) { const m = html.match(p); if (m && m[1].length > 3000) { block = m[1]; break } }
if (!block) { console.error('KHONG TIM THAY NOI DUNG'); process.exit(2) }

// Bỏ script/style, đổi thẻ block thành xuống dòng, strip tag, giải mã entity
let text = block
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/table)[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))

const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
// Cắt phần đuôi trang (chia sẻ, liên quan...)
const cutIdx = lines.findIndex((l) => /^(Chia sẻ|Bài viết liên quan|Tin liên quan|TAG:|Từ khóa:)/i.test(l))
const body = cutIdx > 50 ? lines.slice(0, cutIdx) : lines
if (body.join(' ').length < 3000) { console.error('NOI DUNG QUA NGAN: ' + body.join(' ').length); process.exit(3) }

const doc = new Document({
  sections: [{ children: body.map((l) => new Paragraph({ children: [new TextRun(l)] })) }],
})
const buf = await Packer.toBuffer(doc)
writeFileSync(outFile, buf)
console.log(`OK ${outFile} (${buf.length} bytes, ${body.length} dòng, ${body.join(' ').length} ký tự)`)
