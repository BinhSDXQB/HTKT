// Chúc mừng sinh nhật cán bộ qua Telegram (@Nhansusxd_bot).
//
// Cách dùng:
//   node scripts/sinh-nhat.mjs            → gửi lời chúc cho người sinh nhật HÔM NAY (dùng cho Task Scheduler 8:00)
//   node scripts/sinh-nhat.mjs --dry      → in ra tin sẽ gửi, KHÔNG gửi thật (để thử)
//   node scripts/sinh-nhat.mjs --date=06-20  → giả lập ngày MM-DD (thử dữ liệu)
//   node scripts/sinh-nhat.mjs --list     → in TOÀN BỘ danh sách sinh nhật trong năm (theo tháng/ngày)
//
// Cấu hình lấy từ .env: DATABASE_URL/DIRECT_DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_ALERT_CHAT_ID.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

// Trả kiểu DATE (oid 1082) nguyên chuỗi 'YYYY-MM-DD' để tránh lệch ngày do múi giờ
// (mặc định node-postgres dựng Date nửa đêm giờ địa phương → đọc UTC bị lùi 1 ngày).
pg.types.setTypeParser(1082, (v) => v)

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8')
    .match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]
    .trim()
    .replace(/^["']|["']$/g, '') ?? '')

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const LIST = args.includes('--list')
const dateArg = args.find((a) => a.startsWith('--date='))?.split('=')[1] // 'MM-DD'

const MON = ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

function tgEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendTelegram(text) {
  const token = env('TELEGRAM_BOT_TOKEN')
  const chatId = env('TELEGRAM_ALERT_CHAT_ID')
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN chưa cấu hình')
  if (!chatId) throw new Error('TELEGRAM_ALERT_CHAT_ID chưa cấu hình')
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram lỗi: ${data.description ?? res.status}`)
}

// Lấy toàn bộ cán bộ trong phạm vi Sở, đang công tác, có ngày sinh.
async function loadCanBo() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(`
    WITH RECURSIVE tree AS (
      SELECT id FROM to_chuc WHERE ma = 'SO_XD_QT'
      UNION ALL SELECT t.id FROM to_chuc t JOIN tree ON t."parentId" = tree.id
    )
    SELECT cb."hoTen", cb."ngaySinh", cb."gioiTinh", tc.ten AS phong
    FROM can_bo cb
    LEFT JOIN to_chuc tc ON tc.id = cb."toChucId"
    WHERE cb."toChucId" IN (SELECT id FROM tree)
      AND cb."trangThai" IN ('DANG_CONG_TAC','HOP_DONG')
      AND cb."ngaySinh" IS NOT NULL
    ORDER BY cb."hoTen"
  `)
  await client.end()
  return rows.map((r) => {
    // r.ngaySinh là chuỗi 'YYYY-MM-DD'
    const [yyyy, mm, dd] = String(r.ngaySinh).slice(0, 10).split('-').map((x) => parseInt(x, 10))
    return { ...r, mm, dd, yyyy }
  })
}

function xungHo(gioiTinh) {
  const g = (gioiTinh ?? '').trim().toLowerCase()
  if (g.startsWith('nam')) return 'anh'
  if (g.startsWith('nữ') || g.startsWith('nu')) return 'chị'
  return 'đồng chí'
}

// Bộ lời chúc thân tình — luân phiên theo người để mỗi sinh nhật một vẻ, không rập khuôn.
// {xh} = xưng hô (anh/chị), {ten} = họ tên.
const LOI_CHUC = [
  'Thân mến chúc {xh} <b>{ten}</b> một tuổi mới thật nhiều sức khỏe, an vui và may mắn. Cảm ơn {xh} đã luôn đồng hành, sẻ chia cùng anh em đồng nghiệp trong công việc và cuộc sống. Mong {xh} mãi giữ nụ cười ấm áp, gặt hái thật nhiều thành công và hạnh phúc trọn vẹn bên gia đình. 🥳🎁',
  'Mừng sinh nhật {xh} <b>{ten}</b>! Chúc {xh} một năm mới của tuổi mình tràn đầy năng lượng, bình an trong tâm và rạng rỡ trong từng ngày. Anh chị em trong cơ quan luôn trân quý sự tận tâm và tình cảm chân thành của {xh}. Chúc {xh} vạn sự như ý! 🌟🎂',
  'Nhân ngày sinh nhật, tập thể thân ái chúc {xh} <b>{ten}</b> dồi dào sức khỏe, công tác hanh thông, gia đình ấm êm hạnh phúc. Cảm ơn {xh} vì đã là một người đồng nghiệp gắn bó, nhiệt thành và đáng mến. Tuổi mới rực rỡ nhé! 🎈🌸',
  'Chúc mừng sinh nhật {xh} <b>{ten}</b>! Mong tuổi mới mang đến cho {xh} thật nhiều niềm vui, sức khỏe và những điều tốt lành. Cảm ơn {xh} đã luôn kề vai sát cánh, cùng anh em vượt qua mọi khó khăn. Chúc {xh} và gia đình luôn an khang, hạnh phúc! 💐🎉',
  'Một tuổi mới lại về — kính chúc {xh} <b>{ten}</b> luôn mạnh khỏe, vững vàng và thành công trên mọi nẻo đường. Tình cảm và sự sẻ chia của {xh} là điều anh em đồng nghiệp luôn trân trọng. Mong {xh} mãi giữ ngọn lửa nhiệt huyết và nụ cười hiền hậu ấy! 🌻🥂',
]

function loiChucCho(p) {
  // Chọn ổn định theo tên + ngày sinh để mỗi người một câu, không đổi mỗi lần chạy.
  const seed = (p.hoTen + p.dd + p.mm).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const tpl = LOI_CHUC[seed % LOI_CHUC.length]
  return tpl.replaceAll('{xh}', xungHo(p.gioiTinh)).replaceAll('{ten}', tgEscape(p.hoTen))
}

function fmtDanhSachNam(list) {
  // Nhóm theo tháng rồi ngày
  const byMonth = new Map()
  for (const p of list) {
    const arr = byMonth.get(p.mm) ?? []
    arr.push(p)
    byMonth.set(p.mm, arr)
  }
  const out = []
  for (let m = 1; m <= 12; m++) {
    const arr = (byMonth.get(m) ?? []).sort((a, b) => a.dd - b.dd || a.hoTen.localeCompare(b.hoTen, 'vi'))
    if (arr.length === 0) continue
    out.push(`\n📅 Tháng ${m} (${arr.length} người):`)
    for (const p of arr) {
      out.push(`  ${String(p.dd).padStart(2, '0')}/${MON[m]} — ${p.hoTen} (${p.yyyy})${p.phong ? ` · ${p.phong}` : ''}`)
    }
  }
  return out.join('\n')
}

async function main() {
  const all = await loadCanBo()

  if (LIST) {
    console.log(`TOÀN BỘ DANH SÁCH SINH NHẬT — ${all.length} cán bộ (phạm vi Sở, đang công tác)`)
    console.log(fmtDanhSachNam(all))
    return
  }

  // Xác định ngày mục tiêu (mặc định: hôm nay theo giờ máy chủ)
  let tMM, tDD
  if (dateArg) {
    const [m, d] = dateArg.split('-').map((x) => parseInt(x, 10))
    tMM = m
    tDD = d
  } else {
    const now = new Date()
    tMM = now.getMonth() + 1
    tDD = now.getDate()
  }

  const celebrants = all.filter((p) => p.mm === tMM && p.dd === tDD)
  const thisYear = new Date().getFullYear()

  if (celebrants.length === 0) {
    console.log(`Hôm nay ${String(tDD).padStart(2, '0')}/${MON[tMM]} không có ai sinh nhật. Không gửi.`)
    return
  }

  const lines = []
  lines.push('🎂✨🎈🎉🎁🎈✨🎂')
  lines.push('<b>🌟 CHÚC MỪNG SINH NHẬT 🌟</b>')
  lines.push('🎂✨🎈🎉🎁🎈✨🎂')
  lines.push('')
  const dmy = `${String(tDD).padStart(2, '0')}/${MON[tMM]}`
  lines.push(
    celebrants.length > 1
      ? `🌷 Hôm nay <b>${dmy}</b> là một ngày thật đặc biệt! Tập thể Sở Xây dựng tỉnh Quảng Trị thân ái gửi lời chúc mừng sinh nhật đến những người đồng nghiệp thân thương:`
      : `🌷 Hôm nay <b>${dmy}</b> là một ngày thật đặc biệt! Tập thể Sở Xây dựng tỉnh Quảng Trị thân ái gửi lời chúc mừng sinh nhật đến người đồng nghiệp thân thương:`,
  )
  lines.push('')

  celebrants.forEach((p, idx) => {
    const tuoi = thisYear - p.yyyy
    const xh = xungHo(p.gioiTinh)
    lines.push(`🎉🎂 <b>${xh.toUpperCase()} ${tgEscape(p.hoTen.toUpperCase())}</b> 🎂🎉`)
    if (p.phong) lines.push(`💼 <i>${tgEscape(p.phong)}</i>`)
    lines.push(`🎈 Mừng tuổi mới — <b>${tuoi}</b> tuổi`)
    lines.push('')
    lines.push(`<blockquote>${loiChucCho(p)}</blockquote>`)
    if (idx < celebrants.length - 1) {
      lines.push('')
      lines.push('• • • ✿ • • •')
      lines.push('')
    }
  })

  lines.push('')
  lines.push('🌸🌷🌻🌹💐🌼🌺')
  lines.push('<i>Thân ái — Tập thể anh chị em đồng nghiệp</i>')
  lines.push('<i>Sở Xây dựng tỉnh Quảng Trị</i> 💙')

  const text = lines.join('\n')

  if (DRY) {
    console.log('[--dry] Tin sẽ gửi:\n')
    console.log(text)
    return
  }

  await sendTelegram(text)
  console.log(`Đã gửi lời chúc sinh nhật cho ${celebrants.length} cán bộ: ${celebrants.map((p) => p.hoTen).join(', ')}`)
}

main().catch((e) => {
  console.error('LỖI:', e.message)
  process.exit(1)
})
