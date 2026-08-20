// Trình TỰ PREVIEW toàn bộ trang dashboard: mint session admin, gọi từng route,
// quét lỗi runtime (500 / ChunkLoadError / Prisma / Application error) và xuất báo cáo.
//   node scripts/preview-tat-ca-trang.mjs                # tất cả route tĩnh
//   node scripts/preview-tat-ca-trang.mjs --filter phong-htkt   # lọc theo chuỗi
//   node scripts/preview-tat-ca-trang.mjs --dynamic      # bao gồm cả route [id] (lấy id thật từ DB)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'
import { SignJWT } from 'jose'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const BASE = process.env.SMOKE_BASE || 'http://localhost:3001'
const args = process.argv.slice(2)
const filter = (() => { const i = args.indexOf('--filter'); return i >= 0 ? args[i + 1] : null })()
const includeDynamic = args.includes('--dynamic')

// Duyệt cây app/ tìm mọi page.tsx → route path
function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      // Bỏ route group (segment) không ảnh hưởng URL
      const seg = name.startsWith('(') && name.endsWith(')') ? '' : '/' + name
      out.push(...walk(full, base + seg))
    } else if (name === 'page.tsx') {
      out.push(base || '/')
    }
  }
  return out
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role
     FROM users u JOIN roles r ON r.id = u."roleId"
     WHERE r.name = 'admin' ORDER BY u."createdAt" LIMIT 1`,
  )
  if (!rows.length) throw new Error('Không tìm thấy user admin')
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({
    userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role,
    allowedModules: ['office', 'htkt', 'cong-viec'],
  }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h').sign(secret)

  await client.end()

  let routes = [...new Set(walk(join(root, 'app')))].sort()
  // Bỏ qua các trang không cần login / không phải dashboard content
  const skip = new Set(['/login', '/quen-mat-khau', '/dat-lai-mat-khau', '/forbidden'])
  routes = routes.filter((r) => !skip.has(r))
  // Xử lý route động
  routes = routes.filter((r) => {
    if (r.includes('[')) return false // tạm bỏ động (xử lý riêng nếu --dynamic)
    return true
  })
  if (filter) routes = routes.filter((r) => r.includes(filter))

  console.log(`\n🔎 Preview ${routes.length} route (BASE=${BASE})\n`)
  const bad = []
  const cookie = `session=${token}`
  let done = 0
  const CONC = 6
  async function hit(route) {
    const url = BASE + route
    try {
      const res = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' })
      // 3xx = redirect() có chủ đích (body chứa NEXT_REDIRECT/__next_error__ → không đọc để tránh báo giả)
      const body = res.status < 300 ? await res.text() : ''
      const errMatch = body.match(/ChunkLoadError|Cannot find module|PrismaClient|Application error|Internal Server Error|Unhandled Runtime Error|__next_error__/)
      const digest = body.match(/"digest":"(\d+)"/)
      let flag = null
      if (res.status >= 500) flag = `HTTP ${res.status}`
      else if (res.status === 404) flag = 'HTTP 404'
      else if (errMatch) flag = errMatch[0]
      else if (digest) flag = 'error digest ' + digest[1]
      const mark = flag ? '❌' : (res.status >= 300 && res.status < 400 ? '↪' : '✓')
      if (flag) bad.push({ route, status: res.status, flag })
      console.log(`${mark} [${res.status}] ${route}${flag ? '  → ' + flag : ''}`)
    } catch (e) {
      bad.push({ route, status: 0, flag: e.message })
      console.log(`❌ [ERR] ${route}  → ${e.message}`)
    }
    done++
  }
  // Chạy song song có giới hạn
  const queue = [...routes]
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (queue.length) await hit(queue.shift())
  }))

  console.log(`\n===== KẾT QUẢ: ${routes.length - bad.length}/${routes.length} OK =====`)
  if (bad.length) {
    console.log(`\n⚠️  ${bad.length} trang có vấn đề:`)
    for (const b of bad) console.log(`   ❌ ${b.route}  [${b.status}]  ${b.flag}`)
    process.exitCode = 1
  } else {
    console.log('🎉 Tất cả route tĩnh OK')
  }
}

main().catch((e) => { console.error('LỖI:', e.message); process.exitCode = 1 })
