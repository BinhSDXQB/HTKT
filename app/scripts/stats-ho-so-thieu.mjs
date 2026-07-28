import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) => process.env[k] || (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')
const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && (v.trim() === '' || v.trim() === '-'))
const cccdMissing = (c) => isBlank(c) || (typeof c === 'string' && c.startsWith('TAM-'))
function laBienChe(cb) { if (cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') return true; if (cb.doiTuong === 'NGUOI_LAO_DONG') return false; const lh = (cb.loaiHinh ?? '').trim().toUpperCase(); return lh === '' ? true : lh.startsWith('BC') }
const REQ = [
  ['Số CCCD', (c) => cccdMissing(c.cccd)], ['Giới tính', (c) => isBlank(c.gioiTinh)], ['Ngày sinh', (c) => isBlank(c.ngaySinh)],
  ['Quê quán trước', (c) => isBlank(c.queQuanTruoc)], ['Nơi ở hiện nay', (c) => isBlank(c.noiOHienNay)],
  ['Loại hình BC/HĐ', (c) => isBlank(c.loaiHinh)], ['Ngày vào BC/HĐ', (c) => isBlank(c.ngayVaoBienChe)],
  ['Mã ngạch', (c) => laBienChe(c) && isBlank(c.maNgach)], ['Bậc lương', (c) => laBienChe(c) && c.bacLuong == null],
  ['Hệ số lương', (c) => c.heSoLuong == null], ['Ngạch hiện hưởng', (c) => laBienChe(c) && isBlank(c.ngachHienHuong)],
  ['Ngày hưởng bậc HT', (c) => laBienChe(c) && isBlank(c.ngayNangLuong)], ['Ngày NL lần sau', (c) => laBienChe(c) && isBlank(c.ngayNangLuongKeTiep)],
  ['Trình độ CM', (c) => isBlank(c.trinhDoChuyenMon)], ['Vị trí việc làm', (c) => laBienChe(c) && isBlank(c.viTriViecLam)],
]
const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
await client.connect()
const { rows: tc } = await client.query('SELECT id, "parentId", ma FROM to_chuc')
const r = tc.find((t) => t.ma === 'SO_XD_QT'); let soIds
if (!r) soIds = tc.map((t) => t.id); else { const ch = new Map(); for (const t of tc) if (t.parentId) ch.set(t.parentId, [...(ch.get(t.parentId) ?? []), t.id]); soIds = []; const st = [r.id]; while (st.length) { const id = st.pop(); soIds.push(id); for (const c of ch.get(id) ?? []) st.push(c) } }
const { rows } = await client.query(`SELECT * FROM can_bo WHERE "toChucId" = ANY($1) AND "trangThai" IN ('DANG_CONG_TAC','HOP_DONG')`, [soIds])
await client.end()
const miss = (cb) => REQ.filter(([, f]) => f(cb)).map(([n]) => n)
const thieu = rows.map((cb) => miss(cb)).filter((m) => m.length > 0)
const byField = {}; for (const m of thieu) for (const f of m) byField[f] = (byField[f] ?? 0) + 1
const vtvlOnly = thieu.filter((m) => m.length === 1 && m[0] === 'Vị trí việc làm').length
console.log(`Tổng cán bộ trong scope Sở: ${rows.length}`)
console.log(`Thiếu ≥1 mục bắt buộc: ${thieu.length}`)
console.log(`CHỈ thiếu mỗi "Vị trí việc làm": ${vtvlOnly}`)
console.log(`Nếu bỏ VTVL khỏi cảnh báo → còn: ${rows.map(miss).map((m)=>m.filter(x=>x!=='Vị trí việc làm')).filter((m)=>m.length>0).length} người`)
console.log('\nThống kê theo mục thiếu:')
for (const [f, n] of Object.entries(byField).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(3)} — ${f}`)
