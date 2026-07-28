// Smoke-test trang chủ /dashboard (thống kê từ VIEW v_htkt_* — mig 035).
//   node scripts/smoke-trang-chu.mjs
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

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role
     FROM users u JOIN roles r ON r.id = u."roleId"
     WHERE r.name = 'admin' ORDER BY u."createdAt" LIMIT 1`,
  )
  await client.end()
  if (!rows.length) throw new Error('Không tìm thấy user admin')
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({
    userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role,
    allowedModules: ['office', 'htkt', 'cong-viec'],
  })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secret)

  const res = await fetch(`${BASE}/dashboard`, { headers: { Cookie: `session=${token}` }, redirect: 'manual' })
  const body = await res.text()
  console.log(`GET /dashboard → ${res.status}`)
  const err = body.match(/ChunkLoadError|Cannot find module|PrismaClient|Application error/)
  if (err) { console.log(`❌ Lỗi trong trang: ${err[0]}`); process.exitCode = 1; return }
  // Các cụm phải xuất hiện khi thống kê mới render đúng
  let thieu = false
  for (const marker of ['Đường giao thông', 'Điện chiếu sáng', 'Hạ tầng theo lĩnh vực', 'Top địa bàn theo km đường']) {
    const co = body.includes(marker)
    if (!co) thieu = true
    console.log(co ? `✓ có "${marker}"` : `❌ THIẾU "${marker}"`)
  }
  process.exitCode = res.status === 200 && !thieu ? 0 : 1
}

main().catch((e) => { console.error('LỖI:', e.message); process.exitCode = 1 })
