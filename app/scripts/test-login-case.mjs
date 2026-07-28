// Kiểm tra đăng nhập KHÔNG phân biệt hoa/thường: gọi server action loginAction
// bằng đúng mã hoá React flight (encodeReply) — dùng sai mật khẩu, chỉ xem thông báo trả về.
//   node scripts/test-login-case.mjs <ACTION_ID> <email> [password]
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { encodeReply } = require('next/dist/compiled/react-server-dom-webpack/client.node.js')

const [actionId, email, password = 'SaiMatKhau#999'] = process.argv.slice(2)
if (!actionId || !email) {
  console.error('Cách dùng: node scripts/test-login-case.mjs <ACTION_ID> <email> [password]')
  process.exit(2)
}

const fd = new FormData()
fd.append('email', email)
fd.append('password', password)

const body = await encodeReply([null, fd])

const res = await fetch('http://localhost:3001/login', {
  method: 'POST',
  headers: { 'Next-Action': actionId, Accept: 'text/x-component' },
  body,
})
const text = await res.text()
console.log(`HTTP ${res.status}`)
// Dòng "1:{...}" là kết quả action (LoginState)
const m = text.match(/^1:(\{.*\})\s*$/m)
if (m) {
  const state = JSON.parse(m[1])
  console.log('Kết quả action:', JSON.stringify(state, null, 2))
} else {
  console.log(text.slice(0, 500))
}
