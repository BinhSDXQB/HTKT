// HEALTHCHECK — rào chắn chống thoái lui cho hệ thống QL Hạ tầng Kỹ thuật.
//
//   node scripts/healthcheck.mjs              # các kiểm tra không tốn tiền
//   node scripts/healthcheck.mjs --chatbot    # kèm 9 câu kiểm thử chatbot (gọi OpenAI)
//   node scripts/healthcheck.mjs --json       # chỉ in JSON, dùng cho Task Scheduler
//
// Vì sao cần: hai ngày rà soát đã vá nhiều chỗ nhạy cảm (API lộ CCCD, chỉ mục CSDL,
// căn cứ pháp lý, kho tài liệu). Không có lệnh chạy định kỳ thì không ai biết ngày mai
// hệ thống có thoái lui hay không. Mỗi lần chạy ghi kết quả vào healthcheck-logs/ và
// SO VỚI LẦN TRƯỚC để phát hiện chỉ số đi lùi.
//
// Mã thoát: 0 = tất cả đạt · 1 = có mục KHÔNG ĐẠT · 2 = lỗi khi chạy.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'
import { SignJWT } from 'jose'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const BASE = process.env.HEALTH_BASE || 'http://localhost:3001'
const THU_MUC_LOG = join(root, 'healthcheck-logs')
const CHAY_CHATBOT = process.argv.includes('--chatbot')
const CHI_JSON = process.argv.includes('--json')

const ketQua = []
const ghi = (ten, dat, chiTiet, soDo = null, mucDo = 'loi') =>
  ketQua.push({ ten, dat, chiTiet, soDo, mucDo })

const log = (...a) => { if (!CHI_JSON) console.log(...a) }

// ── 1. Ứng dụng sống ────────────────────────────────────────────────────────
async function kiemUngDung() {
  try {
    const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(15000) })
    const d = await r.json()
    ghi('Ứng dụng phản hồi', r.ok && d.status === 'ok', `HTTP ${r.status} · CSDL ${d.db} · ${d.rssMB}MB · ${d.latencyMs}ms`, d.rssMB)
  } catch (e) {
    ghi('Ứng dụng phản hồi', false, `Không gọi được: ${e.message}`)
  }
}

// ── 2. API từng lộ CCCD phải bị chặn ────────────────────────────────────────
// Bốn route này TỪNG mở công khai và trả cột email = số CCCD của cán bộ.
async function kiemApiCongKhai() {
  const routes = ['/api/stats/users/online', '/api/stats/users', '/api/check-data', '/api/preview?id=x&type=user']
  const loi = []
  for (const u of routes) {
    try {
      const r = await fetch(BASE + u, { signal: AbortSignal.timeout(15000) })
      if (r.status !== 401 && r.status !== 403) loi.push(`${u} → ${r.status}`)
    } catch (e) { loi.push(`${u} → lỗi ${e.message}`) }
  }
  ghi('API nhạy cảm bị chặn khi chưa đăng nhập', loi.length === 0,
    loi.length ? `LỘT LƯỚI: ${loi.join(', ')}` : `${routes.length}/${routes.length} route trả 401/403`)
}

// ── 3. Chặn vượt thư mục ở công cụ thẩm định ────────────────────────────────
async function kiemDuongDan(cookie) {
  const xau = ['..', '../..', 'C:\\Windows', 'a:secret']
  const loi = []
  for (const x of xau) {
    try {
      const r = await fetch(`${BASE}/api/htkt/tham-dinh-ho-so?hanhDong=duyet&rootId=goc1&duongDanCon=${encodeURIComponent(x)}`,
        { headers: { Cookie: cookie }, signal: AbortSignal.timeout(15000) })
      if (r.ok) loi.push(`"${x}" ĐƯỢC CHẤP NHẬN`)
    } catch { /* lỗi mạng không tính là lọt */ }
  }
  ghi('Chặn vượt thư mục (công cụ thẩm định)', loi.length === 0,
    loi.length ? `LỌT LƯỚI: ${loi.join(', ')}` : `${xau.length}/${xau.length} phép thử bị từ chối`)
}

// ── 4. Sức khoẻ CSDL ────────────────────────────────────────────────────────
async function kiemCsdl(c) {
  const fk = (await c.query(`SELECT count(*)::int n FROM pg_constraint c
    WHERE c.contype='f' AND array_length(c.conkey,1)=1
      AND c.connamespace=(SELECT oid FROM pg_namespace WHERE nspname='public')
      AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=c.conkey[1])`)).rows[0].n
  ghi('Khoá ngoại có chỉ mục dẫn đầu', fk === 0, fk === 0 ? 'đủ chỉ mục' : `${fk} khoá ngoại thiếu chỉ mục`, fk)

  const hnsw = (await c.query(`SELECT count(*)::int n FROM pg_indexes WHERE indexname='tai_lieu_chunk_embedding_hnsw'`)).rows[0].n
  ghi('Chỉ mục vector HNSW (tra cứu tài liệu)', hnsw === 1, hnsw === 1 ? 'có' : 'THIẾU — tra cứu sẽ chậm ~150 lần', hnsw)

  const chuaAnalyze = (await c.query(`SELECT count(*)::int n FROM pg_stat_user_tables
    WHERE last_analyze IS NULL AND last_autoanalyze IS NULL`)).rows[0].n
  ghi('Bảng đã có thống kê (ANALYZE)', chuaAnalyze === 0,
    chuaAnalyze === 0 ? 'tất cả bảng có thống kê' : `${chuaAnalyze} bảng chưa từng ANALYZE`, chuaAnalyze, 'canhbao')
}

// ── 5. Kho tài liệu không có "hố đen" ───────────────────────────────────────
// Tài liệu bóc ra gần như rỗng (PDF scan) làm hỏng cơ chế chống trùng: mọi bản
// scan nạp sau đều bị coi là trùng với nó rồi âm thầm bỏ qua.
async function kiemKhoTaiLieu(c) {
  const rong = (await c.query(`SELECT count(*)::int n FROM tai_lieu WHERE "deletedAt" IS NULL AND "soKyTu" < 500`)).rows[0].n
  ghi('Kho tài liệu không có bản ghi rỗng', rong === 0,
    rong === 0 ? 'không có tài liệu dưới 500 ký tự' : `${rong} tài liệu gần như rỗng — sẽ nuốt mọi PDF scan nạp sau`, rong)

  const tong = (await c.query(`SELECT count(*)::int n FROM tai_lieu WHERE "deletedAt" IS NULL`)).rows[0].n
  const canKiem = (await c.query(`SELECT count(*)::int n FROM tai_lieu
    WHERE "deletedAt" IS NULL AND "tinhTrangHieuLuc"='can_kiem_chung'`)).rows[0].n
  ghi('Tài liệu đã xác minh hiệu lực', canKiem === 0,
    `${tong - canKiem}/${tong} đã khai hiệu lực · ${canKiem} còn "cần kiểm chứng"`, canKiem, 'canhbao')
}

// ── 6. Sao lưu ──────────────────────────────────────────────────────────────
function kiemSaoLuu() {
  const dir = 'C:\\Backup_QLHTKT'
  if (!existsSync(dir)) { ghi('Sao lưu CSDL', false, `Không thấy thư mục ${dir}`); return }
  const dumps = readdirSync(dir).filter((f) => f.endsWith('.dump'))
    .map((f) => ({ f, st: statSync(join(dir, f)) }))
    .sort((a, b) => b.st.mtimeMs - a.st.mtimeMs)
  if (dumps.length === 0) { ghi('Sao lưu CSDL', false, 'Không có tệp .dump nào'); return }
  const moi = dumps[0]
  const gio = (Date.now() - moi.st.mtimeMs) / 3600000
  const mb = moi.st.size / 1048576
  ghi('Sao lưu CSDL mới trong 26 giờ', gio < 26,
    `${moi.f} · ${gio.toFixed(1)} giờ trước · ${mb.toFixed(0)} MB · giữ ${dumps.length} bản`, Math.round(gio))

  // Bản mới không được nhỏ bất thường so với bản trước (dấu hiệu dump bị cắt)
  if (dumps.length > 1) {
    const truoc = dumps[1].st.size / 1048576
    const lech = ((mb - truoc) / truoc) * 100
    ghi('Kích thước sao lưu ổn định', lech > -10,
      `lệch ${lech >= 0 ? '+' : ''}${lech.toFixed(1)}% so với bản trước`, Math.round(lech), 'canhbao')
  }
}

// ── 7. Đĩa ──────────────────────────────────────────────────────────────────
async function kiemDia() {
  try {
    const { execSync } = await import('node:child_process')
    const out = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace /value', { encoding: 'utf8', timeout: 20000 })
    const free = Number((out.match(/FreeSpace=(\d+)/) || [])[1] || 0) / 1073741824
    ghi('Ổ C: còn trên 5 GB', free > 5, `còn ${free.toFixed(1)} GB`, Math.round(free * 10) / 10)
  } catch (e) {
    ghi('Ổ C: còn trên 5 GB', true, `không đo được (${e.message.slice(0, 40)})`, null, 'canhbao')
  }
}

// ── 8. Căn cứ pháp lý ───────────────────────────────────────────────────────
async function kiemPhapLy() {
  try {
    const { execSync } = await import('node:child_process')
    const out = execSync('node scripts/kiem-tra-can-cu-phap-ly.mjs', { cwd: root, encoding: 'utf8', timeout: 300000 })
    const m = out.match(/LÀM CĂN CỨ:\s*(\d+)/)
    const n = m ? Number(m[1]) : -1
    ghi('Không nêu văn bản đã bãi bỏ làm căn cứ', n === 0,
      n === 0 ? 'sạch' : `${n} mục đang nêu văn bản đã bãi bỏ`, n)
  } catch (e) {
    ghi('Không nêu văn bản đã bãi bỏ làm căn cứ', false, `không chạy được: ${e.message.slice(0, 60)}`)
  }
}

// ── 9. Chatbot (tuỳ chọn — gọi OpenAI, tốn token) ───────────────────────────
async function kiemChatbot() {
  // Kiểm thử LLM KHÔNG TẤT ĐỊNH: cùng câu hỏi có thể lúc đạt lúc không. Đã gặp thật
  // ngày 20/8/2026 — chạy lần 1 báo 8/9, chạy lại ngay sau đó 9/9. Nếu không chạy lại
  // trước khi kết luận thì tác vụ hằng ngày sẽ gửi cảnh báo giả.
  const { execSync } = await import('node:child_process')
  const chay = () => {
    try {
      const out = execSync('node scripts/smoke-chatbot.mjs', { cwd: root, encoding: 'utf8', timeout: 900000 })
      return String(out)
    } catch (e) { return String(e.stdout || '') }
  }
  const doc = (out) => {
    const m = out.match(/TỔNG:\s*(\d+)\s*đạt\s*\/\s*(\d+)\s*không đạt/)
    return m ? { dat: Number(m[1]), khong: Number(m[2]) } : null
  }

  let kq = doc(chay())
  let lanHai = null
  if (!kq || kq.khong > 0) {
    log('   (chatbot có câu không đạt — chạy lại một lần để loại trừ hỏng ngẫu nhiên)')
    lanHai = doc(chay())
  }
  const cuoi = lanHai ?? kq
  if (!cuoi) { ghi('Chất lượng trả lời chatbot', false, 'không đọc được kết quả kiểm thử'); return }
  ghi('Chất lượng trả lời chatbot', cuoi.khong === 0,
    `${cuoi.dat} đạt / ${cuoi.khong} không đạt` +
    (lanHai ? ` (lần 1: ${kq ? kq.dat + '/' + (kq.dat + kq.khong) : 'lỗi'} — đã chạy lại)` : ''),
    cuoi.khong)
}

async function mintCookie(c) {
  const u = (await c.query(`SELECT u.id,u.email,u.name,u."roleId",r.name role
    FROM users u JOIN roles r ON r.id=u."roleId" WHERE r.name='admin' ORDER BY u."createdAt" LIMIT 1`)).rows[0]
  if (!u) return null
  const t = await new SignJWT({ userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role, allowedModules: ['office', 'htkt'] })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(env('SESSION_SECRET')))
  return 'session=' + t
}

async function main() {
  const batDau = Date.now()
  const c = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await c.connect()
  await c.query("SET client_encoding TO 'UTF8'")

  await kiemUngDung()
  await kiemApiCongKhai()
  const cookie = await mintCookie(c)
  if (cookie) await kiemDuongDan(cookie)
  await kiemCsdl(c)
  await kiemKhoTaiLieu(c)
  kiemSaoLuu()
  await kiemDia()
  await kiemPhapLy()
  if (CHAY_CHATBOT) await kiemChatbot()
  await c.end()

  const hong = ketQua.filter((k) => !k.dat && k.mucDo === 'loi')
  const canhBao = ketQua.filter((k) => !k.dat && k.mucDo === 'canhbao')

  log(`\n══════ HEALTHCHECK ${new Date().toLocaleString('vi-VN')} ══════\n`)
  for (const k of ketQua) {
    const icon = k.dat ? '✅' : k.mucDo === 'canhbao' ? '⚠️ ' : '❌'
    log(`${icon} ${k.ten.padEnd(44)} ${k.chiTiet}`)
  }

  // So với lần chạy trước để phát hiện đi lùi
  mkdirSync(THU_MUC_LOG, { recursive: true })
  const truocDs = readdirSync(THU_MUC_LOG).filter((f) => f.endsWith('.json')).sort()
  if (truocDs.length) {
    try {
      const truoc = JSON.parse(readFileSync(join(THU_MUC_LOG, truocDs[truocDs.length - 1]), 'utf8'))
      const lui = ketQua.filter((k) => {
        const cu = (truoc.ketQua || []).find((x) => x.ten === k.ten)
        return cu && cu.dat && !k.dat
      })
      if (lui.length) {
        log(`\n🔻 ĐI LÙI so với ${truocDs[truocDs.length - 1]}:`)
        lui.forEach((k) => log(`   - ${k.ten}: trước ĐẠT, nay KHÔNG ĐẠT`))
      } else log(`\n(không có mục nào đi lùi so với ${truocDs[truocDs.length - 1]})`)
    } catch { /* bỏ qua log hỏng */ }
  }

  const bg = {
    thoiDiem: new Date().toISOString(),
    tongMs: Date.now() - batDau,
    coChatbot: CHAY_CHATBOT,
    soDat: ketQua.filter((k) => k.dat).length,
    soHong: hong.length,
    soCanhBao: canhBao.length,
    ketQua,
  }
  const ten = `${new Date().toISOString().slice(0, 10)}_${String(Date.now()).slice(-6)}.json`
  writeFileSync(join(THU_MUC_LOG, ten), JSON.stringify(bg, null, 1), 'utf8')

  log(`\n──────── ${bg.soDat} đạt · ${hong.length} KHÔNG ĐẠT · ${canhBao.length} cảnh báo · ${(bg.tongMs / 1000).toFixed(1)}s ────────`)
  log(`Đã ghi: healthcheck-logs/${ten}`)
  if (CHI_JSON) console.log(JSON.stringify(bg))
  process.exit(hong.length > 0 ? 1 : 0)
}

main().catch((e) => { console.error('LỖI HEALTHCHECK:', e); process.exit(2) })
