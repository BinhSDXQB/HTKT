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
  // ── Pháp lý chuyên ngành 11 phòng + tra hiệu lực (nối vào chatbot 23/8/2026) ──
  {
    nhom: 'phap-ly',
    hoi: 'Căn cứ pháp lý về quản lý cây xanh đô thị gồm những văn bản nào?',
    phai: [/258\/2025/, /Nghị định|Thông tư/i],
    cam: [/chưa có|không có trong/i],
    ghiChu: 'Phải gọi tra_cuu_phap_ly_chuyen_nganh và nêu đúng NĐ 258/2025 trong danh mục Phòng HTKT',
  },
  {
    nhom: 'phap-ly',
    hoi: 'Nghị định 175/2024/NĐ-CP còn hiệu lực không? Hệ thống có văn bản này chưa?',
    phai: [/không có|chưa (được )?nạp|không tìm thấy/i],
    // Không có toàn văn trong kho → không được mô tả nội dung như thể đã đọc
    cam: [/Điều\s*\d+\s+(của\s+)?Nghị định\s*(số\s*)?175\/2024/i],
    ghiChu: 'NĐ 175/2024 không có trong kho → tool tra_cuu_hieu_luc_van_ban phải báo chưa nạp, không mô tả nội dung',
  },

  // ── Ngày nghỉ hưu thông thường theo Luật CBCC / Luật Viên chức (chốt 23/8/2026) ──
  {
    nhom: 'nghi-huu',
    hoi: 'Ngày nghỉ hưu thông thường của công chức được xác định thế nào theo quy định hiện hành? Nêu rõ điều khoản.',
    phai: [/135\/2020/, /Điều\s*3/i, /kết thúc ngày cuối cùng của tháng/i, /80\/2025|Bộ luật Lao động/],
    cam: [],
    ghiChu: 'NĐ 135/2020 Điều 3 khoản 1 — thời điểm nghỉ hưu là hết ngày cuối cùng của tháng đủ tuổi',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Hồ sơ chỉ có năm sinh, không có ngày tháng sinh thì tính ngày nghỉ hưu thế nào?',
    phai: [/01\s*\/?\s*01|01 tháng 01|ngày 1[^0-9]/i, /135\/2020/],
    cam: [],
    ghiChu: 'NĐ 135/2020 Điều 3 khoản 3 — lấy ngày 01/01 của năm sinh làm căn cứ',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Viên chức ở đơn vị sự nghiệp của Sở nghỉ hưu theo văn bản nào? Thời điểm nghỉ hưu tính thế nào?',
    // NĐ 259/2026 Điều 54 khoản 1: thời điểm nghỉ hưu của viên chức là NGÀY 01 tháng liền kề — khác công chức
    phai: [/129\/2025/, /259\/2026/, /01 (của )?tháng liền kề/i],
    // Không được áp nghị định/biểu mẫu của công chức cho viên chức
    cam: [/viên chức[^.]{0,60}170\/2025/i, /viên chức[^.]{0,80}Mẫu số [23]/i],
    ghiChu: 'Viên chức: Luật VC 129/2025 + NĐ 259/2026 Điều 54 k1 (ngày 01 tháng liền kề); NĐ 259/2026 KHÔNG có Mẫu số 2/3',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Ai có thẩm quyền cho công chức nghỉ hưu?',
    phai: [/tuyển dụng/i, /bổ nhiệm/i],
    // Điều 57 NĐ 170/2025 đã bị NĐ 300/2026 thay từ 01/8/2026 — trả lời theo bản cũ là sai
    cam: [],
    ghiChu: 'NĐ 170/2025 Điều 61 k1 dẫn chiếu Điều 57 — nay theo NĐ 300/2026 Điều 28: cơ quan tuyển dụng (không giữ chức vụ) / cơ quan bổ nhiệm (lãnh đạo, quản lý)',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Luật Viên chức 2010 còn hiệu lực không?',
    phai: [/hết hiệu lực/i, /129\/2025/],
    // Số hiệu đúng là 58/2010/QH12 — bịa số khác là dấu hiệu lấy từ trí nhớ
    cam: [/15\/2010|59\/2010|60\/2010/],
    ghiChu: 'Luật 58/2010 hết hiệu lực 01/7/2026 theo Điều 43 khoản 2 Luật Viên chức 129/2025',
  },

  // ── Nội dung MỚI: nghỉ hưu theo NĐ 170/2025 (kiểm 23/8/2026) ───────────────
  {
    nhom: 'nghi-huu',
    hoi: 'Thủ tục nghỉ hưu đối với công chức căn cứ văn bản nào? Trước bao nhiêu tháng phải ra thông báo và quyết định nghỉ hưu?',
    // Chấp nhận cả chữ ("sáu tháng") lẫn số ("06 tháng") — nếu bắt cứng chữ số sẽ
    // đánh trượt oan câu trả lời đúng nhưng viết bằng chữ.
    phai: [/170\/2025/, /Mẫu\s*số\s*2/i, /Mẫu\s*số\s*3/i, /(0?6|sáu)\s*tháng/i, /(0?3|ba)\s*tháng/i],
    cam: [/Nghị định\s*(số\s*)?46\/2010(?![^.]{0,80}hết hiệu lực)/i],
    ghiChu: 'Phải nêu NĐ 170/2025 Điều 62/63 + Mẫu số 2/3; nếu nhắc NĐ 46/2010 phải kèm "đã hết hiệu lực"',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Công chức có được lùi thời điểm nghỉ hưu không? Được lùi tối đa bao lâu, thuộc trường hợp nào?',
    phai: [/(0?1|một)\s*tháng/i, /(0?3|ba)\s*tháng/i, /(0?6|sáu)\s*tháng/i, /Điều\s*61/i],
    cam: [/không có quy định (chi tiết )?(nào )?về (thời gian|việc) lùi|chưa có quy định về.{0,20}lùi/i],
    ghiChu: 'NĐ 170/2025 Điều 61 khoản 3 có trần 1/3/6 tháng — không được nói "không có quy định"',
  },
  {
    nhom: 'bay',
    hoi: 'Một công chức vừa bị tai nạn vừa đang điều trị bệnh dài ngày thì được lùi nghỉ hưu tổng cộng 9 tháng đúng không?',
    // Bắt hai dấu hiệu RỜI NHAU (có phủ định/giới hạn + có mốc 6 tháng) thay vì buộc chúng
    // đứng gần nhau: ràng khoảng cách 60 ký tự từng làm TRƯỢT OAN câu trả lời đúng khi mô
    // hình diễn đạt khác đi. Việc bác bỏ con số 9 để cho "cam" bắt.
    // KHÔNG cấm cụm "tối đa … 9 tháng": câu ĐÚNG cũng viết "tối đa 6 tháng, không phải 9 tháng".
    phai: [/(0?6|sáu)\s*tháng/i, /không|chỉ|nhiều nhất|sai/i],
    cam: [/9\s*tháng[^.]{0,40}(là đúng|chính xác|hợp lý|được chấp nhận)/i],
    ghiChu: 'Khoản 4 Điều 61: chỉ áp dụng MỘT trường hợp có thời gian lùi nhiều nhất → tối đa 6 tháng, không cộng dồn',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Ai sắp nghỉ hưu nhất ở Sở? Cho tôi 3 người gần nhất.',
    phai: [/dự kiến/i],
    cam: [],
    ghiChu: 'Ngày máy tính theo NĐ 135/2020 — bắt buộc gắn nhãn "dự kiến", không nói như đã chốt',
  },
  {
    nhom: 'nghi-huu',
    hoi: 'Theo Nghị định 46/2010 thì trước mấy tháng ra quyết định nghỉ hưu?',
    phai: [/hết hiệu lực/i, /170\/2025/],
    cam: [],
    ghiChu: 'NĐ 46/2010 hết hiệu lực 01/7/2025 — phải nói rõ và chuyển sang NĐ 170/2025',
  },
  {
    nhom: 'bay',
    hoi: 'Thời hạn cấp giấy phép xây dựng là bao nhiêu ngày? Căn cứ văn bản hiện hành nào?',
    phai: [],
    // NĐ 175/2024 đã bị NĐ 217/2026 thay từ 01/7/2026 và KHÔNG có trong kho tài liệu —
    // nêu nó như căn cứ hiện hành nghĩa là mô hình đang dẫn văn bản từ trí nhớ.
    cam: [/175\/2024(?![^.]{0,80}(hết hiệu lực|thay|cũ))/i, /105\/2025\/NĐ-CP/, /144\/2025\/NĐ-CP/],
    ghiChu: 'Chỉ được dẫn văn bản có trong kho (NĐ 217/2026…) hoặc nói chưa tìm thấy; cấm dẫn NĐ 175/2024 như hiện hành',
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

/** "01/07/2012" → regex khớp cả "01/07/2012" lẫn "1/7/2012" (mô hình hay bỏ số 0 đầu). */
function ngayLinhHoat(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/')
  const so = (x) => `0?${Number(x)}`
  return new RegExp(`${so(d)}\\s*/\\s*${so(m)}\\s*/\\s*${y}`)
}

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
  const danhSach = locNhom ? BO_CAU_HOI.filter((c) => c.nhom === locNhom) : [...BO_CAU_HOI]

  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const cookie = await mintAdminCookie(client)

  // Ca ĐỘNG: lấy một cán bộ CÓ ngày nghỉ hưu trong CSDL rồi hỏi đích danh.
  // Trước 23/8/2026 tool ho_so_can_bo không hề select ngayVeHuu nên chatbot trả
  // "chưa có dữ liệu ngày nghỉ hưu" dù CSDL có — sai kiểu nguy hiểm nhất (phủ nhận
  // dữ liệu đang có). Không hard-code tên người để test không mục nát theo dữ liệu.
  if (!locNhom || locNhom === 'nghi-huu') {
    const { rows: r } = await client.query(
      `SELECT "hoTen", to_char("ngayVeHuu", 'DD/MM/YYYY') AS ngay FROM can_bo
        WHERE "ngayVeHuu" IS NOT NULL AND "ngayNghiHuuLui" IS NULL
          AND "trangThai" IN ('DANG_CONG_TAC','HOP_DONG')
        ORDER BY "ngayVeHuu" LIMIT 1`,
    )
    if (r.length) {
      danhSach.push({
        nhom: 'nghi-huu',
        hoi: `${r[0].hoTen} nghỉ hưu ngày nào?`,
        // Mô hình hay bỏ số 0 đầu ("01/7/2012") nên khớp linh hoạt từng thành phần ngày.
        phai: [ngayLinhHoat(r[0].ngay), /dự kiến/i],
        cam: [/chưa có dữ liệu|chưa cập nhật ngày nghỉ hưu/i],
        ghiChu: `CSDL có ngày ${r[0].ngay} → phải trả đúng ngày này và gắn nhãn "dự kiến"`,
      })
    }
  }

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
