// Smoke-test: tự "view" toàn bộ trang chi tiết công việc của mọi phòng/đơn vị
// bằng phiên admin, báo cáo trang nào không trả 200 (phát hiện sớm ChunkLoadError/500).
//
//   node scripts/smoke-cong-viec.mjs
//
// Cấu hình lấy từ .env: DATABASE_URL/DIRECT_DATABASE_URL, SESSION_SECRET.

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
const CONCURRENCY = 6

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

async function fetchStatus(url, cookie) {
  try {
    const res = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' })
    let snippet = ''
    if (res.status >= 400) {
      const body = await res.text()
      const m = body.match(/ChunkLoadError|Cannot find module|TypeError|PrismaClient|Error:[^<]{0,120}/)
      snippet = m ? m[0].replace(/\s+/g, ' ').slice(0, 120) : ''
    }
    return { status: res.status, snippet }
  } catch (e) {
    return { status: 0, snippet: e.message }
  }
}

async function runPool(items, worker) {
  const results = []
  let i = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const idx = i++
        results[idx] = await worker(items[idx])
      }
    }),
  )
  return results
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const cookie = await mintAdminCookie(client)

  const { rows: tasks } = await client.query(`
    SELECT cv.id, cv."maCongViec", COALESCE(tc.ten,'(không rõ)') AS phong
    FROM cong_viec cv LEFT JOIN to_chuc tc ON tc.id = cv."toChucId"
    WHERE cv."deletedAt" IS NULL
    ORDER BY tc.ten, cv."maCongViec"
  `)
  // Trang danh sách module + danh sách theo phòng (lọc) cũng kiểm tra luôn.
  const { rows: depts } = await client.query(`
    SELECT DISTINCT cv."toChucId" AS id FROM cong_viec cv WHERE cv."deletedAt" IS NULL AND cv."toChucId" IS NOT NULL
  `)
  await client.end()

  const urls = [
    { label: '[danh sách] /dashboard/cong-viec', url: `${BASE}/dashboard/cong-viec` },
    ...depts.map((d) => ({ label: `[danh sách phòng] toChucId=${d.id}`, url: `${BASE}/dashboard/cong-viec?phong=${d.id}` })),
    ...tasks.map((t) => ({ label: `${t.phong} · ${t.maCongViec}`, url: `${BASE}/dashboard/cong-viec/${t.id}` })),
  ]

  console.log(`Đang kiểm tra ${urls.length} trang (1 danh sách + ${depts.length} lọc phòng + ${tasks.length} chi tiết)…\n`)

  const results = await runPool(urls, async (it) => ({ ...it, ...(await fetchStatus(it.url, cookie)) }))

  const ok = results.filter((r) => r.status === 200)
  const redirect = results.filter((r) => r.status >= 300 && r.status < 400)
  const fail = results.filter((r) => r.status === 0 || r.status >= 400)

  for (const r of fail) console.log(`❌ ${r.status} | ${r.label}\n   ${r.url}${r.snippet ? `\n   → ${r.snippet}` : ''}`)
  if (redirect.length) {
    console.log(`\n↪️  ${redirect.length} trang redirect (3xx) — thường do quyền/đăng nhập:`)
    for (const r of redirect.slice(0, 10)) console.log(`   ${r.status} ${r.label}`)
  }

  console.log(`\n===== KẾT QUẢ =====`)
  console.log(`✅ 200 OK     : ${ok.length}`)
  console.log(`↪️  Redirect   : ${redirect.length}`)
  console.log(`❌ Lỗi (≥400) : ${fail.length}`)
  if (fail.length === 0) console.log('\n🎉 Toàn bộ trang chi tiết công việc đều tải tốt, không có lỗi.')
  process.exit(fail.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('LỖI:', e.message)
  process.exit(1)
})
