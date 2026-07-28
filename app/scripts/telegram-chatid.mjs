// Lấy chat_id của nhóm/người đã nhắn cho bot.
//
// Cách dùng:
//   1) Điền TELEGRAM_BOT_TOKEN vào .env
//   2) Thêm bot vào nhóm VP Sở (hoặc /start với bot), GỬI 1 TIN bất kỳ
//   3) node scripts/telegram-chatid.mjs
//
// Bot chỉ thấy tin GỬI SAU KHI được thêm vào nhóm. Nhóm có chat_id ÂM
// (vd -1001234567890); cá nhân có id DƯƠNG.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function readEnvToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN
  try {
    const env = readFileSync(join(root, '.env'), 'utf8')
    const m = env.match(/^TELEGRAM_BOT_TOKEN=(.*)$/m)
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
}

const token = readEnvToken()
if (!token) {
  console.error('✗ Chưa có TELEGRAM_BOT_TOKEN trong .env')
  process.exit(1)
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
const data = await res.json()
if (!data.ok) {
  console.error('✗ Lỗi gọi Telegram:', data.description)
  process.exit(1)
}

const seen = new Map()
for (const u of data.result) {
  const chat = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat
  if (chat) seen.set(chat.id, chat)
}

if (seen.size === 0) {
  console.log('Chưa thấy tin nào. Hãy thêm bot vào nhóm và GỬI 1 tin trong nhóm, rồi chạy lại.')
  process.exit(0)
}

console.log('Các chat đã nhắn cho bot:')
for (const chat of seen.values()) {
  const ten = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || ''
  console.log(`  chat_id = ${chat.id}   [${chat.type}] ${ten}`)
}
console.log('\n→ Dán chat_id của NHÓM (số ÂM) vào TELEGRAM_ALERT_CHAT_ID trong .env, rồi build + pm2 restart.')
