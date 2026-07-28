import 'server-only'

// Gửi tin nhắn qua Telegram Bot API. Cấu hình bằng biến môi trường (.env):
//   TELEGRAM_BOT_TOKEN   — token của bot lấy từ @BotFather (vd 123456:ABC-DEF...)
//   TELEGRAM_ALERT_CHAT_ID — chat_id nơi nhận (nhóm VP Sở). Nhóm có id ÂM (vd -1001234567890).
//
// Lưu ý: Bot KHÔNG thể tự nhắn cho người chưa /start bot. Với nhóm: thêm bot vào
// nhóm rồi gửi 1 tin bất kỳ, sau đó lấy chat_id qua `node scripts/telegram-chatid.mjs`.

const API = 'https://api.telegram.org'
const MAX_LEN = 4000 // giới hạn Telegram 4096; chừa lề an toàn

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ALERT_CHAT_ID)
}

/** Escape ký tự đặc biệt cho parse_mode HTML của Telegram. */
export function tgEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Chia văn bản dài thành nhiều phần ≤ MAX_LEN, cắt theo dòng để không vỡ thẻ HTML. */
function splitMessage(text: string): string[] {
  if (text.length <= MAX_LEN) return [text]
  const parts: string[] = []
  let buf = ''
  for (const line of text.split('\n')) {
    if (buf.length + line.length + 1 > MAX_LEN) {
      if (buf) parts.push(buf)
      // dòng đơn quá dài (hiếm) → cắt cứng
      buf = line.length > MAX_LEN ? line.slice(0, MAX_LEN) : line
    } else {
      buf = buf ? `${buf}\n${line}` : line
    }
  }
  if (buf) parts.push(buf)
  return parts
}

async function callApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN chưa được cấu hình')
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok: boolean; description?: string; result?: unknown }
  if (!data.ok) {
    throw new Error(`Telegram API lỗi (${method}): ${data.description ?? res.status}`)
  }
  return data.result
}

/**
 * Gửi tin nhắn (HTML) tới chat_id cấu hình (hoặc chỉ định). Tin dài tự chia nhiều phần.
 * @returns số phần đã gửi thành công.
 */
export async function sendTelegramMessage(
  text: string,
  opts: { chatId?: string } = {},
): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN chưa được cấu hình')
  const chatId = opts.chatId ?? process.env.TELEGRAM_ALERT_CHAT_ID
  if (!chatId) throw new Error('TELEGRAM_ALERT_CHAT_ID chưa được cấu hình')

  const parts = splitMessage(text)
  for (const part of parts) {
    await callApi('sendMessage', {
      chat_id: chatId,
      text: part,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
  }
  return parts.length
}
