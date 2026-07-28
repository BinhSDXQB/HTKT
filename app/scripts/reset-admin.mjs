import pg from 'pg'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'

// Đọc DATABASE_URL từ .env
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const m = env.match(/^DIRECT_DATABASE_URL="?([^"\n]+)"?/m) || env.match(/^DATABASE_URL="?([^"\n]+)"?/m)
const connectionString = m[1]

const EMAIL = 'admin@htkt.com.vn'
const NEW_PASSWORD = 'Admin@123456'

const client = new pg.Client({ connectionString })
await client.connect()

const hashed = await bcrypt.hash(NEW_PASSWORD, 12)
const res = await client.query(
  `UPDATE users
     SET password = $1, "mustChangePassword" = false, "failedLoginCount" = 0, "isActive" = true
   WHERE email = $2
   RETURNING email, "isActive", "roleId"`,
  [hashed, EMAIL]
)

if (res.rowCount === 0) {
  console.log(`KHÔNG tìm thấy tài khoản ${EMAIL}`)
} else {
  console.log('ĐÃ ĐẶT LẠI XONG')
  console.log('  Tên truy cập :', EMAIL)
  console.log('  Mật khẩu     :', NEW_PASSWORD)
}

await client.end()
