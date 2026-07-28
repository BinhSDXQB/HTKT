// Smoke-test trang nghiệp vụ Phòng HTKT (pháp lý, thẩm định, tham mưu, mẫu biểu)
// + endpoint sinh .docx. Dùng phiên admin (allowedModules có 'htkt').
//   node scripts/smoke-htkt-nghiep-vu.mjs
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

async function mintAdminCookie(client) {
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role
     FROM users u JOIN roles r ON r.id = u."roleId" WHERE r.name='admin' ORDER BY u."createdAt" LIMIT 1`)
  if (!rows.length) throw new Error('Không tìm thấy admin')
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({
    userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role,
    allowedModules: ['office', 'htkt', 'cong-viec'],
  }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret)
  return `session=${token}`
}

function isDocx(buf) {
  // .docx là file zip → bắt đầu bằng "PK\x03\x04"
  return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04
}

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const cookie = await mintAdminCookie(client)
  await client.end()

  let fail = 0
  const pages = ['phap-ly', 'tham-dinh', 'tham-muu', 'mau-bieu']
  for (const p of pages) {
    const res = await fetch(`${BASE}/dashboard/phong-htkt/${p}`, { headers: { Cookie: cookie }, redirect: 'manual' })
    const ok = res.status === 200
    if (!ok) fail++
    console.log(`${ok ? '✅' : '❌'} ${res.status} | trang /${p}`)
  }

  // Tải mẫu skeleton
  for (const key of ['to-trinh', 'cong-van', 'giay-moi', 'quyet-dinh', 'phieu-gop-y', 'ke-hoach', 'bao-cao', 'van-ban-chi-dao']) {
    const res = await fetch(`${BASE}/api/htkt/mau-bieu/${key}`, { headers: { Cookie: cookie } })
    const buf = Buffer.from(await res.arrayBuffer())
    const ok = res.status === 200 && isDocx(buf)
    if (!ok) fail++
    console.log(`${ok ? '✅' : '❌'} ${res.status} | mẫu .docx /${key} (${buf.length}B${isDocx(buf) ? ', docx' : ''})`)
  }

  // Soạn nhanh Tờ trình thẩm định
  const res = await fetch(`${BASE}/api/htkt/van-ban`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loai: 'to-trinh', soVanBan: '12/TTr-SXD', trichYeu: 'Về việc thẩm định Báo cáo NCKT công trình cấp nước',
      kinhGui: 'Giám đốc Sở Xây dựng', canCu: 'Luật Xây dựng số 135/2025/QH15;\nNghị định số 175/2024/NĐ-CP;',
      noiDung: 'Phòng Hạ tầng kỹ thuật đã hoàn thành thẩm định.\nKết quả thẩm định đạt yêu cầu.',
      nguoiKyChucDanh: 'TRƯỞNG PHÒNG', nguoiKyHoTen: 'Nguyễn Văn A',
    }),
  })
  const buf = Buffer.from(await res.arrayBuffer())
  const ok = res.status === 200 && isDocx(buf)
  if (!ok) fail++
  console.log(`${ok ? '✅' : '❌'} ${res.status} | POST soạn Tờ trình (${buf.length}B${isDocx(buf) ? ', docx' : ''})`)

  console.log(`\n===== ${fail === 0 ? '🎉 TẤT CẢ OK' : `❌ ${fail} lỗi`} =====`)
  process.exit(fail > 0 ? 1 : 0)
}
main().catch((e) => { console.error('LỖI:', e.message); process.exit(1) })
