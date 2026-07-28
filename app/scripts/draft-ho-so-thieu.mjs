// Dự thảo nội dung cảnh báo hồ sơ thiếu — port TRUNG THÀNH logic lib/ho-so-completeness.ts
// (chỉ các mục BẮT BUỘC) để in ra duyệt. Không gửi. Dùng: node scripts/draft-ho-so-thieu.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
function env(key) {
  if (process.env[key]) return process.env[key]
  const m = readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && (v.trim() === '' || v.trim() === '-'))
const cccdMissing = (c) => isBlank(c) || (typeof c === 'string' && c.startsWith('TAM-'))
function laBienChe(cb) {
  if (cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') return true
  if (cb.doiTuong === 'NGUOI_LAO_DONG') return false
  const lh = (cb.loaiHinh ?? '').trim().toUpperCase()
  return lh === '' ? true : lh.startsWith('BC')
}

// Chỉ các mục BẮT BUỘC, đúng thứ tự & nhãn của FIELDS
const REQUIRED = [
  { label: 'Số CCCD (cột BA)',              empty: (c) => cccdMissing(c.cccd) },
  { label: 'Giới tính (cột F)',             empty: (c) => isBlank(c.gioiTinh) },
  { label: 'Ngày sinh (cột E)',             empty: (c) => isBlank(c.ngaySinh) },
  { label: 'Quê quán trước hợp nhất (cột G)', empty: (c) => isBlank(c.queQuanTruoc) },
  { label: 'Nơi ở hiện nay (cột J)',        empty: (c) => isBlank(c.noiOHienNay) },
  { label: 'Đơn vị công tác (cột D)',       empty: (c) => isBlank(c.toChucId) && isBlank(c.phongBan) },
  { label: 'Chức vụ / chức danh (cột C)',   empty: (c) => isBlank(c.chucDanhId) && isBlank(c.chucVu) },
  { label: 'Loại hình BC, HĐ (cột N)',      empty: (c) => isBlank(c.loaiHinh) },
  { label: 'Ngày vào BC, HĐ (cột O)',       empty: (c) => isBlank(c.ngayVaoBienChe) },
  { label: 'Mã ngạch (cột T)',              empty: (c) => isBlank(c.maNgach),        when: laBienChe },
  { label: 'Bậc lương (cột U)',             empty: (c) => c.bacLuong == null,        when: laBienChe },
  { label: 'Hệ số lương (cột V)',           empty: (c) => c.heSoLuong == null },
  { label: 'Ngạch hiện hưởng (cột AB)',     empty: (c) => isBlank(c.ngachHienHuong), when: laBienChe },
  { label: 'Ngày hưởng bậc hiện tại (cột Y)', empty: (c) => isBlank(c.ngayNangLuong), when: laBienChe },
  { label: 'Ngày nâng lương lần sau (cột AA)', empty: (c) => isBlank(c.ngayNangLuongKeTiep), when: laBienChe },
  { label: 'Trình độ chuyên môn (cột AE)',  empty: (c) => isBlank(c.trinhDoChuyenMon) },
  // Vị trí việc làm (VTVL) ĐÃ LOẠI khỏi tin nhắc cá nhân — do quản lý gán, theo dõi riêng.
]

const missingOf = (cb) => REQUIRED.filter((f) => (!f.when || f.when(cb)) && f.empty(cb)).map((f) => f.label)

const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
await client.connect()

// getSoToChucIds: cây tổ chức từ gốc SO_XD_QT
const { rows: tc } = await client.query('SELECT id, "parentId", ma FROM to_chuc')
const rootTc = tc.find((t) => t.ma === 'SO_XD_QT')
let soIds
if (!rootTc) soIds = tc.map((t) => t.id)
else {
  const ch = new Map()
  for (const t of tc) if (t.parentId) ch.set(t.parentId, [...(ch.get(t.parentId) ?? []), t.id])
  soIds = []; const st = [rootTc.id]
  while (st.length) { const id = st.pop(); soIds.push(id); for (const c of ch.get(id) ?? []) st.push(c) }
}

const { rows } = await client.query(
  `SELECT cb.*, t.ten AS "phongTen", t."thuTu" AS "phongThuTu"
   FROM can_bo cb LEFT JOIN to_chuc t ON t.id = cb."toChucId"
   WHERE cb."toChucId" = ANY($1) AND cb."trangThai" IN ('DANG_CONG_TAC','HOP_DONG')
   ORDER BY t."thuTu" ASC NULLS LAST, cb."hoTen" ASC`,
  [soIds],
)
await client.end()

const thieu = rows.map((cb) => ({ cb, missing: missingOf(cb) })).filter((x) => x.missing.length > 0)

const today = new Date().toLocaleDateString('vi-VN')
const out = []
out.push('🔔 CẢNH BÁO HỒ SƠ CÁN BỘ CHƯA ĐẦY ĐỦ')
out.push(`Văn phòng Sở Xây dựng Quảng Trị · ${today}`)
out.push('')
out.push(`Hiện có ${thieu.length} đồng chí còn thiếu thành phần hồ sơ bắt buộc (biểu QLNS 53 cột).`)
out.push('Đề nghị từng đồng chí dưới đây bổ sung các mục còn thiếu:')
out.push('')
thieu.forEach(({ cb, missing }, i) => {
  out.push(`${i + 1}. ${cb.hoTen} — ${cb.phongTen ?? '—'} (thiếu ${missing.length} mục):`)
  for (const m of missing) out.push(`   • ${m}`)
  out.push('')
})
out.push('➡️ Đề nghị các đồng chí có tên liên hệ để bổ sung hồ sơ:')
out.push('• Đ/c Trần Thị Thu Liễu — Chánh Văn phòng')
out.push('• Đ/c Lê Thị Xuân Quý — Phó Chánh Văn phòng')
out.push('• Đ/c Lê Cẩm Nhung — Văn phòng Sở')

const text = out.join('\n')
console.log(text)
console.error(`\n[Tổng: ${thieu.length}/${rows.length} cán bộ thiếu giấy tờ cá nhân (đã loại VTVL)]`)

// node scripts/draft-ho-so-thieu.mjs --send  → gửi thử tới TELEGRAM_ALERT_CHAT_ID
if (process.argv.includes('--send')) {
  const token = env('TELEGRAM_BOT_TOKEN'); const chatId = env('TELEGRAM_ALERT_CHAT_ID')
  if (!token || !chatId) { console.error('✗ Thiếu TELEGRAM_BOT_TOKEN / TELEGRAM_ALERT_CHAT_ID'); process.exit(1) }
  // chia <4000 ký tự theo dòng
  const parts = []; let buf = ''
  for (const line of text.split('\n')) {
    if (buf.length + line.length + 1 > 4000) { if (buf) parts.push(buf); buf = line } else buf = buf ? `${buf}\n${line}` : line
  }
  if (buf) parts.push(buf)
  for (const p of parts) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: p, disable_web_page_preview: true }),
    })
    const d = await res.json()
    if (!d.ok) { console.error('✗ Gửi lỗi:', d.description); process.exit(1) }
  }
  console.error(`✓ Đã gửi ${parts.length} tin tới chat ${chatId}`)
}
