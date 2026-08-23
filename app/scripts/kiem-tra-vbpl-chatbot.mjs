// KIỂM TRA ĐỘ PHỦ VĂN BẢN PHÁP LÝ CỦA CHATBOT — chạy sau mỗi đợt nạp văn bản mới.
//
//   node scripts/kiem-tra-vbpl-chatbot.mjs
//
// Chatbot có 3 nguồn pháp lý; script đối chiếu chúng với kho RAG để biết chỗ nào "hứa mà
// không có". Ngày 23/8/2026 chính kiểu hở này làm mô hình dẫn NĐ 175/2024 từ trí nhớ.
//
//   A. SYSTEM_PROMPT (đoạn pháp luật xây dựng 2026) nêu số hiệu nào chưa có toàn văn trong kho.
//      Số hiệu CŨ nêu kèm chữ "thay" là CỐ Ý (để chatbot biết đã bị thay) — không tính là thiếu.
//   B. lib/data/co-so-phap-ly-nhan-su.ts — văn bản nhân sự nào chưa có toàn văn trong kho
//      (chỉ có bản tóm tắt mã hoá tay → không trích nguyên văn được).
//   C. lib/data/phap-ly-chuyen-nganh.ts (danh mục 11 phòng) — thống kê độ phủ toàn văn.

import { readFileSync } from 'node:fs'
import pg from 'pg'

const env = (k) =>
  process.env[k] ||
  (readFileSync('.env', 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const route = readFileSync('app/api/chatbot/route.ts', 'utf8')
const bullet = route.split('\n').find((l) => l.includes('PHÁP LUẬT XÂY DỰNG MỚI TỪ 01/7/2026')) ?? ''

// "01/7/2026" là NGÀY chứ không phải số hiệu — chỉ nhận số hiệu đứng sau NĐ/TT/Luật/NQ/QĐ.
const RE_SO_HIEU = /(NĐ|TT|Luật|NQ|QĐ|Nghị định|Thông tư|Nghị quyết|Quyết định)\s+(\d{1,3})\/(20\d\d)/g
const soHieuPrompt = [...new Set([...bullet.matchAll(RE_SO_HIEU)].map((m) => `${m[2]}/${m[3]}`))]
// Số hiệu nằm ngay sau chữ "thay" = văn bản CŨ nêu cố ý.
const coY = new Set([...bullet.matchAll(/thay[^)]*?(\d{1,3})\/(20\d\d)/g)].map((m) => `${m[1]}/${m[2]}`))

const phapLy = readFileSync('lib/data/co-so-phap-ly-nhan-su.ts', 'utf8')
const soHieuNhanSu = [...new Set([...phapLy.matchAll(/soHieu: '([^']+)'/g)].map((m) => m[1]))]

const chuyenNganh = readFileSync('lib/phong/phap-ly-phong.ts', 'utf8') + readFileSync('lib/htkt/phap-ly.ts', 'utf8')
const soHieuChuyenNganh = [...new Set([...chuyenNganh.matchAll(/soHieu: '([^']+)'/g)].map((m) => m[1]))]

const c = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
await c.connect()
const { rows } = await c.query('SELECT nguon, "tieuDe" FROM tai_lieu WHERE "deletedAt" IS NULL')
// Chuẩn hoá để "217_2026", "217/2026", "217 2026" khớp nhau
const kho = rows.map((r) => ` ${`${r.nguon} ${r.tieuDe}`.replace(/[^0-9A-Za-zÀ-ỹ]+/g, ' ')} `)
const coTrongKho = (so, nam) => {
  const n = String(Number(so))
  return kho.some((k) => new RegExp(` 0*${n} ${nam} `).test(k))
}
const tach = (sh) => sh.match(/(\d{1,4})\/(20\d\d|19\d\d)/)

console.log('── A. Số hiệu chatbot NÊU trong SYSTEM_PROMPT ──')
const thieuA = soHieuPrompt.filter((n) => { const [so, nam] = n.split('/'); return !coTrongKho(so, nam) && !coY.has(n) })
console.log(`   ${soHieuPrompt.length} số hiệu · ${coY.size} nêu cố ý là văn bản cũ · THIẾU TOÀN VĂN: ${thieuA.length}`)
if (thieuA.length) console.log(`   ⚠ ${thieuA.join(', ')} — chatbot nhắc tên nhưng KHÔNG trích được nội dung`)

console.log('\n── B. Văn bản trong CO_SO_PHAP_LY nhân sự ──')
let coB = 0
for (const sh of soHieuNhanSu) {
  const m = tach(sh)
  const ok = m && coTrongKho(m[1], m[2])
  if (ok) coB++
  console.log(`   ${ok ? '✔ có toàn văn' : '– chỉ có tóm tắt'}  ${sh}`)
}
console.log(`   → ${coB}/${soHieuNhanSu.length} văn bản nhân sự có toàn văn trong kho`)

console.log('\n── C. Danh mục pháp lý chuyên ngành 11 phòng ──')
const coC = soHieuChuyenNganh.filter((sh) => { const m = tach(sh); return m && coTrongKho(m[1], m[2]) })
console.log(`   ${soHieuChuyenNganh.length} văn bản trong danh mục · ${coC.length} có toàn văn trong kho`)
console.log('   (Danh mục vẫn trả lời được ở mức số hiệu + tên; muốn trích điều khoản thì phải nạp toàn văn.)')

await c.end()
