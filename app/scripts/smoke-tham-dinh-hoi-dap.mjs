// Smoke-test đầu-cuối tính năng Kiểm kê hồ sơ thẩm định: tải thư mục lên phiên → kiểm kê → hỏi đáp.
//   node scripts/smoke-tham-dinh-hoi-dap.mjs [thư-mục-hồ-sơ] [--base=https://qlhtkt.htkt.com.vn]
// Mặc định dùng bộ hồ sơ demo C:\HoSo_ThamDinh\DA_Demo_Cai_tao_via_he_2026 và http://localhost:3001.
// Đo thời điểm nhận sự kiện đầu tiên của luồng hỏi đáp để biết proxy có đệm (buffer) không.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import pg from 'pg'
import { SignJWT } from 'jose'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const args = process.argv.slice(2)
const BASE = args.find((a) => a.startsWith('--base='))?.slice(7) || process.env.SMOKE_BASE || 'http://localhost:3001'
const SRC = args.find((a) => !a.startsWith('--')) || 'C:\\HoSo_ThamDinh\\DA_Demo_Cai_tao_via_he_2026'
const MANH = 8 * 1024 * 1024

function liet(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...liet(p)); else out.push(p)
  }
  return out
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role FROM users u JOIN roles r ON r.id = u."roleId"
     WHERE r.name = 'admin' ORDER BY u."createdAt" LIMIT 1`)
  await client.end()
  const u = rows[0]
  const token = await new SignJWT({ userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role, allowedModules: ['office', 'htkt', 'cong-viec'] })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(env('SESSION_SECRET')))
  const H = { Cookie: `session=${token}` }
  const API = `${BASE}/api/htkt/tham-dinh-ho-so`
  let loi = 0
  const ok = (dk, msg) => { console.log(`${dk ? '✓' : '✗'} ${msg}`); if (!dk) loi++ }

  const trang = await fetch(`${BASE}/dashboard/phong-htkt/soan-thao`, { headers: H, redirect: 'manual' })
  const html = await trang.text()
  ok(trang.status === 200 && html.includes('Từ máy tính của tôi'), `Trang soạn thảo ${trang.status}, có mục chọn nguồn "Từ máy tính của tôi"`)

  const cfg = await (await fetch(`${API}?hanhDong=goc`, { headers: H })).json()
  console.log('  kho máy chủ:', (cfg.goc ?? []).map((g) => `${g.nhan}=${g.truyCapDuoc ? 'truy cập được' : 'KHÔNG truy cập được'}`).join(' · ') || '(chưa cấu hình)')

  const tao = await fetch(`${API}/tai-len`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenThuMuc: 'SMOKE ' + SRC.split('\\').pop() }) })
  const { phienId } = await tao.json()
  ok(tao.ok && phienId, `Tạo phiên ${phienId}`)

  const tep = liet(SRC)
  const t0 = Date.now()
  for (const p of tep) {
    const buf = readFileSync(p)
    const rel = relative(SRC, p).replace(/\\/g, '/')
    for (let off = 0; off < buf.length; off += MANH) {
      const q = new URLSearchParams({ phienId, duongDan: rel, offset: String(off), tong: String(buf.length) })
      const r = await fetch(`${API}/tai-len?${q}`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/octet-stream' }, body: buf.subarray(off, off + MANH) })
      if (!r.ok) { ok(false, `Tải ${rel}@${off}: ${(await r.json()).error}`); break }
    }
  }
  ok(true, `Tải ${tep.length} tệp (${(tep.reduce((s, p) => s + statSync(p).size, 0) / 1048576).toFixed(1)} MB) trong ${Date.now() - t0}ms`)

  const kk = await fetch(API, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ phienId, quyTrinh: (cfg.quyTrinh ?? [])[0]?.key }) })
  const kq = await kk.json()
  ok(kk.ok && kq.tongFile === tep.length, `Kiểm kê phiên: ${kk.status}, ${kq.tongFile} tệp, nhóm ${JSON.stringify(kq.theoNhom)}`)

  // Người khác / phiên giả không dùng được
  const gia = await fetch(API, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ phienId: 'a'.repeat(24), quyTrinh: 'x' }) })
  ok(gia.status === 400, `Phiên giả bị từ chối (${gia.status})`)
  const khongDn = await fetch(`${API}/tai-len`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  ok(khongDn.status !== 200, `Chưa đăng nhập bị chặn (${khongDn.status})`)

  const t1 = Date.now()
  const hd = await fetch(`${API}/hoi-dap`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phienId, messages: [{ role: 'user', content: 'Hồ sơ gồm những tệp nào và bản vẽ thể hiện hạng mục gì?' }] }),
  })
  ok(hd.ok, `Hỏi đáp HTTP ${hd.status}`)
  const reader = hd.body.getReader(); const dec = new TextDecoder()
  let du = '', traLoi = '', nguon = [], tDau = 0, tChu = 0, loiHd = ''
  for (;;) {
    const { value, done } = await reader.read(); if (done) break
    if (!tDau) tDau = Date.now() - t1
    du += dec.decode(value, { stream: true })
    const dong = du.split('\n'); du = dong.pop()
    for (const l of dong) {
      if (!l.trim()) continue
      const ev = JSON.parse(l)
      if (ev.loai === 'nguon') nguon = ev.nguon
      if (ev.loai === 'chu') { if (!tChu) tChu = Date.now() - t1; traLoi += ev.text }
      if (ev.loai === 'loi') loiHd = ev.text
    }
  }
  const tong = Date.now() - t1
  ok(!loiHd && traLoi.length > 50, `Câu trả lời ${traLoi.length} ký tự, ${nguon.length} nguồn${loiHd ? ' — LỖI: ' + loiHd : ''}`)
  ok(/\[\d+\]/.test(traLoi), 'Câu trả lời có trích nguồn [n]')
  console.log(`  thời gian: byte đầu ${tDau}ms · chữ đầu ${tChu}ms · xong ${tong}ms → ${tDau < tong * 0.6 ? 'STREAM hoạt động' : 'CÓ THỂ BỊ ĐỆM (byte đầu đến gần lúc xong)'}`)
  console.log('  --- trả lời ---\n' + traLoi.split('\n').map((l) => '  ' + l).join('\n'))

  await fetch(`${API}/tai-len?phienId=${phienId}`, { method: 'DELETE', headers: H })
  console.log(loi ? `\n❌ ${loi} lỗi` : '\n✅ Tất cả đạt')
  process.exitCode = loi ? 1 : 0
}
main().catch((e) => { console.error(e); process.exitCode = 1 })
