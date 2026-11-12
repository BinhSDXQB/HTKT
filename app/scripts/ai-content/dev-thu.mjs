// Chạy máy chủ DEV RIÊNG để thử module Nội dung AI — không đụng production:
//  - cổng 3098 (production: 3001)
//  - thư mục build riêng .next-ai-dev (production: .next)
//  - CSDL thử *_ai_test (không phải CSDL thật)
//  - SESSION_SECRET ngẫu nhiên mỗi lần chạy → phiên đăng nhập thử KHÔNG dùng được trên production
//  - bật cờ AI_CONTENT_ENABLED=1 chỉ cho tiến trình này
//
//   node scripts/ai-content/dev-thu.mjs
//   node scripts/ai-content/dev-thu.mjs --phien <userId>   # in cookie phiên thử (cần máy chủ dev đang chạy)
//
// Dữ liệu mẫu (tự gieo, chỉ trong CSDL thử, tiền tố thu- để bộ test tích hợp không dọn mất):
//   thu-admin1, thu-admin2 (quản trị — hai người để thử nguyên tắc bốn mắt), thu-thuong (không có quyền)
//   thu-ck (tài liệu công khai còn hiệu lực), thu-nb (nội bộ), thu-het (hết hiệu lực)
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
  if (!rows[0] || !rows[0].id.startsWith('thu-')) throw new Error('Chỉ tạo phiên cho người dùng mẫu (id bắt đầu bằng thu-)')
  const u = rows[0]
  const token = await new SignJWT({ userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.roleName })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h')
    .sign(new TextEncoder().encode(readFileSync(TEP_BI_MAT, 'utf8')))
  process.stdout.write(token)
} else {
  // Gieo dữ liệu mẫu (idempotent) — moPoolThu từ chối mọi CSDL không phải *_ai_test.
  const pool = await moPoolThu()
  await pool.query(`insert into roles (id, name, "displayName") values ('thu-role-admin', 'admin', 'Quản trị (mẫu)'), ('thu-role-thuong', 'thu-thuong', 'Người dùng (mẫu)') on conflict do nothing`)
  // Tên vai trò là duy nhất: nếu CSDL thử đã có vai trò 'admin' thì dùng lại mã của nó.
  const ma = async (ten) => (await pool.query('select id from roles where name = $1', [ten])).rows[0].id
  const [rAdmin, rThuong] = [await ma('admin'), await ma('thu-thuong')]
  for (const [id, ten, role] of [['thu-admin1', 'Nguyễn Văn Soạn (mẫu)', rAdmin], ['thu-admin2', 'Trần Thị Duyệt (mẫu)', rAdmin], ['thu-thuong', 'Lê Văn Thường (mẫu)', rThuong]]) {
    await pool.query(`insert into users (id, email, name, password, "roleId", "updatedAt") values ($1, $2, $3, 'x', $4, now()) on conflict (id) do nothing`, [id, `${id}@test.invalid`, ten, role])
  }
  for (const [id, ten, pv, hl] of [['thu-ck', 'Quy định mẫu công khai còn hiệu lực', 'CONG_KHAI', 'con_hieu_luc'], ['thu-nb', 'Tài liệu mẫu nội bộ', 'NOI_BO_SO', 'con_hieu_luc'], ['thu-het', 'Văn bản mẫu đã hết hiệu lực', 'CONG_KHAI', 'het_hieu_luc']]) {
    await pool.query(`insert into tai_lieu (id, "tieuDe", "phamVi", "tinhTrangHieuLuc", "trangThai", "updatedAt") values ($1, $2, $3, $4, 'san_sang', now()) on conflict (id) do nothing`, [id, ten, pv, hl])
  }
  await pool.end()

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
