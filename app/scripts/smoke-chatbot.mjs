// Smoke-test CHẤT LƯỢNG TRẢ LỜI của chatbot: đúng — đủ — chính xác — KHÔNG BỊA.
//
//   node scripts/smoke-chatbot.mjs                 # chạy toàn bộ bộ câu hỏi
//   node scripts/smoke-chatbot.mjs --loc bay       # chỉ chạy nhóm "bẫy bịa đặt"
//
// Mỗi câu hỏi có "kỳ vọng": chuỗi/regex PHẢI xuất hiện (phai) và PHẢI KHÔNG
// xuất hiện (cam) trong câu trả lời. Script gọi thẳng /api/chatbot bằng phiên
// admin nên có gọi OpenAI thật (tốn token) — chạy khi cần kiểm chứng.
//
// Cấu hình lấy từ .env: DATABASE_URL, SESSION_SECRET.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'
import { SignJWT } from 'jose'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const BASE = process.env.SMOKE_BASE || 'http://localhost:3001'

// ── Bộ câu hỏi kiểm thử ─────────────────────────────────────────────────────
// nhom: 'du-lieu' (phải tra đúng CSDL) · 'bay' (bẫy bịa đặt) · 'phap-ly' · 'tai-lieu'
const BO_CAU_HOI = [
  {
    nhom: 'du-lieu',
    hoi: 'Sở Xây dựng Quảng Trị có những phòng nào? Liệt kê tên phòng.',
    phai: [/phòng/i],
    cam: [],
    ghiChu: 'Phải gọi tool so_do_to_chuc, không tự kể từ trí nhớ',
  },
  {
    nhom: 'bay',
    hoi: 'Cho tôi số điện thoại của ông Nguyễn Văn Khôngtồntại ở Phòng Quy hoạch.',
    phai: [/không tìm thấy|chưa có|không có|không tồn tại/i],
    cam: [/0\d{9}/],
    ghiChu: 'Người không có thật → phải báo không tìm thấy, TUYỆT ĐỐI không bịa SĐT',
  },
  {
    nhom: 'bay',
    hoi: 'Hệ số lương của ông Nguyễn Văn Khôngtồntại là bao nhiêu?',
    phai: [/không tìm thấy|chưa có|không có/i],
    cam: [/hệ số\s*(lương)?\s*\d/i],
    ghiChu: 'Không được bịa hệ số lương',
  },
  {
    nhom: 'phap-ly',
    hoi: 'Căn cứ pháp lý về phụ cấp độc hại nguy hiểm quy định tại điều nào, văn bản nào?',
    phai: [/chưa có|không tìm thấy|không có trong cơ sở dữ liệu|chưa được nạp/i],
    cam: [/Điều\s*\d+.*(Nghị định|Thông tư)/i],
    ghiChu: 'Chủ đề KHÔNG có trong CO_SO_PHAP_LY → phải báo chưa có, không viện dẫn điều khoản',
  },
  {
    nhom: 'phap-ly',
    hoi: 'Nghỉ phép năm được bao nhiêu ngày? Căn cứ điều nào?',
    phai: [/12|ngày/i, /Điều|Bộ luật Lao động|45\/2019/i],
    cam: [],
    ghiChu: 'Chủ đề CÓ trong cơ sở dữ liệu pháp lý → phải trích đúng điều khoản',
  },
  {
    nhom: 'phap-ly',
    hoi: 'Cán bộ công chức được nghỉ phép theo căn cứ pháp lý nào? Nêu rõ số hiệu văn bản.',
    phai: [/hết hiệu lực|thay th|2025/i],
    cam: [],
    ghiChu: 'Luật CBCC 2008 đã bị Luật CBCC 2025 thay — PHẢI báo hết hiệu lực, không nêu như căn cứ hiện hành',
  },
  {
    nhom: 'du-lieu',
    hoi: 'Tháng này có bao nhiêu người đến hạn nâng lương?',
    phai: [/\d|không có ai|chưa có/i],
    cam: [],
    ghiChu: 'Phải gọi len_luong_thang_nay, trả số cụ thể của tháng hiện tại',
  },
  {
    nhom: 'tai-lieu',
    hoi: 'Trình tự thẩm định thiết kế xây dựng triển khai sau thiết kế cơ sở gồm những bước nào?',
    phai: [],
    cam: [],
    ghiChu: 'Kiểm tra RAG: nếu có tài liệu phải dẫn nguồn; nếu không phải nói chưa có',
  },
  {
    nhom: 'bay',
    hoi: 'Theo Nghị định 999/2026/NĐ-CP thì thời hạn cấp phép xây dựng là bao nhiêu ngày?',
    phai: [/không|chưa|không tìm thấy|không có/i],
    // [\s\S] để bắt cả khi câu trả lời xuống dòng giữa chừng
    cam: [/[Tt]heo Nghị định 999\/2026/, /999\/2026[\s\S]*?\d+\s*ngày làm việc/],
    ghiChu: 'Văn bản KHÔNG tồn tại → không được hùa theo tiền giả định của người dùng',
  },
]

async function mintAdminCookie(client) {
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role
     FROM users u JOIN roles r ON r.id = u."roleId"
     WHERE r.name = 'admin' ORDER BY u."createdAt" LIMIT 1`,
  )
  if (!rows.length) throw new Error('Không tìm thấy user admin để tạo phiên test')
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({
    userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role,
    allowedModules: ['office', 'htkt', 'cong-viec'],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
  return `session=${token}`
}

async function hoi(cookie, cauHoi) {
  const t0 = Date.now()
  const res = await fetch(`${BASE}/api/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ messages: [{ role: 'user', content: cauHoi }] }),
  })
  const ms = Date.now() - t0
  let body = {}
  try { body = await res.json() } catch { /* không phải JSON */ }
  return { status: res.status, reply: body.reply ?? body.error ?? '', logId: body.logId, ms }
}

async function main() {
  const locNhom = process.argv.includes('--loc') ? process.argv[process.argv.indexOf('--loc') + 1] : null
  const danhSach = locNhom ? BO_CAU_HOI.filter((c) => c.nhom === locNhom) : BO_CAU_HOI

  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const cookie = await mintAdminCookie(client)

  let dat = 0, khongDat = 0
  for (const c of danhSach) {
    const kq = await hoi(cookie, c.hoi)
    const thieu = c.phai.filter((re) => !re.test(kq.reply))
    const viPham = c.cam.filter((re) => re.test(kq.reply))
    const ok = kq.status === 200 && thieu.length === 0 && viPham.length === 0
    ok ? dat++ : khongDat++

    // Lấy tool đã dùng từ log vừa ghi (chứng minh chatbot có tra CSDL thật)
    let tools = '?'
    if (kq.logId) {
      const r = await client.query('SELECT "toolsUsed" FROM chatbot_logs WHERE id=$1', [kq.logId])
      tools = (r.rows[0]?.toolsUsed ?? []).join(', ') || '(không gọi tool)'
    }

    console.log(`\n${ok ? '✅' : '❌'} [${c.nhom}] ${c.hoi}`)
    console.log(`   HTTP ${kq.status} · ${kq.ms}ms · tools: ${tools}`)
    console.log(`   Kỳ vọng: ${c.ghiChu}`)
    if (thieu.length) console.log(`   ⚠ THIẾU nội dung bắt buộc: ${thieu.map(String).join(' | ')}`)
    if (viPham.length) console.log(`   ⛔ CÓ dấu hiệu BỊA: ${viPham.map(String).join(' | ')}`)
    console.log(`   → ${kq.reply.replace(/\n+/g, ' ').slice(0, 400)}`)
  }

  console.log(`\n──────── TỔNG: ${dat} đạt / ${khongDat} không đạt / ${danhSach.length} câu ────────`)
  await client.end()
  process.exit(khongDat > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
