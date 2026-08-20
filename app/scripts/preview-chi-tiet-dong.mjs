// Preview các trang CHI TIẾT động [id]/[category]: lấy link thật từ trang danh sách cha,
// rồi mở trang chi tiết để phát hiện lỗi runtime trên dữ liệu thật.
//   node scripts/preview-chi-tiet-dong.mjs
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

// tìm mọi route động
function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const seg = name.startsWith('(') && name.endsWith(')') ? '' : '/' + name
      out.push(...walk(full, base + seg))
    } else if (name === 'page.tsx') out.push(base || '/')
  }
  return out
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(
    `SELECT u.id,u.email,u.name,u."roleId",r.name role FROM users u JOIN roles r ON r.id=u."roleId" WHERE r.name='admin' ORDER BY u."createdAt" LIMIT 1`)
  await client.end()
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({ userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role, allowedModules: ['office', 'htkt', 'cong-viec'] })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h').sign(secret)
  const cookie = `session=${token}`

  const dynRoutes = [...new Set(walk(join(root, 'app')))].filter((r) => r.includes('[') && r.includes('/dashboard/'))
  // route cha = phần trước segment động đầu tiên
  const parentOf = (r) => r.replace(/\/\[[^\]]+\].*$/, '')

  const scan = async (route) => {
    const parent = parentOf(route)
    // segment cố định ngay trước [id] để lọc href đúng loại
    const prefix = route.slice(0, route.indexOf('[')) // vd /dashboard/du-an/
    const res = await fetch(BASE + parent, { headers: { Cookie: cookie }, redirect: 'manual' })
    if (res.status >= 400) return { route, note: `list ${parent} → HTTP ${res.status}`, ok: false }
    const html = await res.text()
    // CHỈ lấy trong href="..." để tránh trùng tên file chunk /_next/.../page-<hash>.js
    const re = new RegExp(`href="${prefix.replace(/[/-]/g, (m) => '\\' + m)}([A-Za-z0-9_-]+)"`, 'g')
    const cands = [...new Set([...html.matchAll(re)].map((m) => m[1]))]
      .filter((s) => !['moi', 'import', 'them', 'sua'].includes(s) && !s.startsWith('page-') && s !== 'page')
    if (!cands.length) return { route, note: `không tìm thấy bản ghi mẫu ở ${parent} (danh sách rỗng?)`, ok: null }
    const id = cands[0]
    const url = BASE + prefix + id
    const r2 = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' })
    const body = r2.status < 400 ? await r2.text() : ''
    const err = body.match(/ChunkLoadError|Cannot find module|PrismaClient|Application error|Internal Server Error|"digest":"\d+"/)
    const ok = r2.status < 400 && !err
    return { route: prefix + id, note: ok ? `OK [${r2.status}]` : `❌ [${r2.status}] ${err ? err[0] : ''}`, ok }
  }

  console.log(`\n🔎 Preview ${dynRoutes.length} route CHI TIẾT động\n`)
  let bad = 0, empty = 0
  for (const route of dynRoutes.sort()) {
    try {
      const r = await scan(route)
      const mark = r.ok === true ? '✓' : r.ok === null ? '∅' : '❌'
      if (r.ok === false) bad++
      if (r.ok === null) empty++
      console.log(`${mark} ${route}  → ${r.note}`)
    } catch (e) {
      bad++; console.log(`❌ ${route}  → ${e.message}`)
    }
  }
  console.log(`\n===== ${dynRoutes.length} route động: ${dynRoutes.length - bad - empty} OK · ${empty} danh-sách-rỗng · ${bad} LỖI =====`)
  process.exitCode = bad ? 1 : 0
}
main().catch((e) => { console.error('LỖI:', e.message); process.exitCode = 1 })
