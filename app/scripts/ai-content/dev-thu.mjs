// Chạy máy chủ DEV RIÊNG để thử module Nội dung AI — không đụng production:
//  - cổng 3098 (production: 3001)
//  - thư mục build riêng .next-ai-dev (production: .next)
//  - CSDL thử *_ai_test (không phải CSDL thật)
//  - SESSION_SECRET ngẫu nhiên mỗi lần chạy → phiên đăng nhập thử KHÔNG dùng được trên production
//  - bật cờ AI_CONTENT_ENABLED=1 chỉ cho tiến trình này
//
//   node scripts/ai-content/dev-thu.mjs
//   node scripts/ai-content/dev-thu.mjs --phien <userId>   # in cookie phiên thử (cần máy chủ dev đang chạy)
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { APP, chuoiKetNoiThu, moPoolThu } from './_csdl-thu.mjs'

const TEP_BI_MAT = join(tmpdir(), 'ai-dev-thu.secret')
const CONG = '3098'

const i = process.argv.indexOf('--phien')
if (i > 0) {
  // Tạo phiên cho người dùng THỬ trong CSDL thử, ký bằng bí mật của máy chủ dev (không phải của production).
  if (!existsSync(TEP_BI_MAT)) throw new Error('Máy chủ dev thử chưa chạy')
  const { SignJWT } = await import('jose')
  const pool = await moPoolThu()
  const { rows } = await pool.query(
    `select u.id, u.email, u.name, u."roleId", r.name as "roleName" from users u join roles r on r.id = u."roleId" where u.id = $1`, [process.argv[i + 1]])
  await pool.end()
  if (!rows[0] || !rows[0].id.startsWith('test-')) throw new Error('Chỉ tạo phiên cho người dùng thử (id bắt đầu bằng test-)')
  const u = rows[0]
  const token = await new SignJWT({ userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.roleName })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h')
    .sign(new TextEncoder().encode(readFileSync(TEP_BI_MAT, 'utf8')))
  process.stdout.write(token)
} else {
  const biMat = randomBytes(48).toString('hex')
  writeFileSync(TEP_BI_MAT, biMat, { mode: 0o600 })
  const url = chuoiKetNoiThu()
  const con = spawn(process.execPath, [join(APP, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '--webpack', '-p', CONG], {
    cwd: APP,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: url, DIRECT_DATABASE_URL: url,
      SESSION_SECRET: biMat,
      AI_CONTENT_ENABLED: '1',
      NEXT_DIST_DIR: '.next-ai-dev',
      COOKIE_SECURE: 'false',
      NODE_OPTIONS: '--max-old-space-size=1536',
    },
  })
  con.on('exit', (ma) => process.exit(ma ?? 0))
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => con.kill())
}
