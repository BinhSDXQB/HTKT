import pg from 'pg'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const m = env.match(/^DIRECT_DATABASE_URL="?([^"\n]+)"?/m) || env.match(/^DATABASE_URL="?([^"\n]+)"?/m)
const connectionString = m[1]

const OLD = 'admin@htkt.vn'
const NEW = 'admin@htkt.com.vn'

const client = new pg.Client({ connectionString })
await client.connect()

const taken = await client.query('SELECT id FROM users WHERE email = $1', [NEW])
if (taken.rowCount > 0) {
  console.log(`DỪNG: email ${NEW} đã tồn tại (id=${taken.rows[0].id}). Không đổi để tránh trùng.`)
} else {
  const res = await client.query(
    `UPDATE users SET email = $1 WHERE email = $2 RETURNING id, email, "roleId"`,
    [NEW, OLD]
  )
  if (res.rowCount === 0) {
    console.log(`KHÔNG tìm thấy tài khoản ${OLD} (có thể đã đổi trước đó).`)
  } else {
    console.log('ĐÃ ĐỔI XONG')
    console.log('  Tên đăng nhập cũ:', OLD)
    console.log('  Tên đăng nhập mới:', res.rows[0].email)
    console.log('  User id:', res.rows[0].id)
  }
}

await client.end()
