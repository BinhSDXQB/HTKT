// Sinh file SQL nhập danh sách lãnh đạo/trưởng phòng xã,phường từ Excel.
//   node prisma/gen-lanh-dao-xa.mjs
// Đọc: ../Danh sách Lãnh đạo và Trưởng phòng các xã phường đặc khu tỉnh Quảng Trị.xlsx
// Cần: prisma/wardmap.txt  (code|id|name  của administrative_units type=PHUONG_XA)
// Xuất: prisma/lanh-dao-xa.data.sql
import XLSX from 'xlsx'
import fs from 'fs'
import crypto from 'crypto'

const XLSX_FILE = '../Danh sách Lãnh đạo và Trưởng phòng các xã phường đặc khu tỉnh Quảng Trị.xlsx'
const WARDMAP = 'wardmap.txt'
const OUT = 'prisma/lanh-dao-xa.data.sql'

const norm = s => (s || '').toString().toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim()

// Ánh xạ tên Excel (lệch chính tả) → mã ĐVHC trong DB
const OVERRIDE = {
  'xã trung thuần': '19030',  // DB: Xã Trung Thuận
  'xã đồng lê': '18949',      // DB: Xã Đồng Lê
  'xã bắc gianh': '19066',    // DB: Phường Bắc Gianh
  'nam cửa việt': '19639',    // DB: Xã Nam Cửa Việt
}

// Phân nhóm phòng ban từ chức vụ (ưu tiên HĐND → UBND → Phòng → Đảng)
function phanNhom(chucVu) {
  const s = norm(chucVu)
  if (s.includes('hđnd') || s.includes('hội đồng')) return 'Thường trực HĐND'
  if (s.includes('ubnd') || s.includes('ủy ban') || s.includes('uỷ ban')) return 'Lãnh đạo UBND'
  if (s.includes('phòng')) return 'Phòng Kinh tế - Hạ tầng - Đô thị'
  if (s.includes('bí thư') || s.includes('đảng ủy') || s.includes('đảng uỷ')) return 'Thường trực Đảng ủy'
  return 'Khác'
}

// Chuẩn hoá SĐT: giữ chữ số, khôi phục số 0 đầu nếu bị mất (9 chữ số)
function chuanSdt(raw) {
  let d = (raw || '').toString().replace(/[^\d]/g, '')
  if (!d) return null
  if (d.length === 9) d = '0' + d
  return d
}

const wb = XLSX.readFile(XLSX_FILE)
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, defval: '' })

// code -> {id, name}; norm(name) -> code
const wm = fs.readFileSync(WARDMAP, 'utf8').trim().split(/\r?\n/).map(l => {
  const [code, id, name] = l.split('|')
  return { code, id, name: (name || '').trim() }
})
const byCode = new Map(wm.map(w => [w.code, w]))
const byName = new Map(wm.map(w => [norm(w.name), w]))

function resolveWard(name) {
  const n = norm(name)
  if (OVERRIDE[n]) return byCode.get(OVERRIDE[n])
  return byName.get(n)
}

// Parse: dòng có TT = xã mới; dòng TT rỗng = thành viên của xã hiện tại
let wards = [], cur = null
for (let i = 3; i < rows.length; i++) {
  const [tt, c1, c2, c3] = rows[i]
  const name = (c1 || '').toString().trim()
  if (!name) continue
  if ((tt || '').toString().trim() !== '') { cur = { name, members: [] }; wards.push(cur) }
  else if (cur) cur.members.push({ hoTen: name, chucVu: (c2 || '').toString().trim(), sdt: chuanSdt(c3) })
}

const esc = s => (s == null ? 'NULL' : `'${s.toString().replace(/'/g, "''")}'`)

let values = []
let unresolved = []
let count = 0
for (const w of wards) {
  const ward = resolveWard(w.name)
  if (!ward) { unresolved.push(w.name); continue }
  let thuTu = 0
  for (const m of w.members) {
    thuTu++
    count++
    values.push(`  (${esc(crypto.randomUUID())}, ${esc(ward.id)}, ${esc(m.hoTen)}, ${esc(m.chucVu)}, ${esc(m.sdt)}, ${esc(phanNhom(m.chucVu))}, ${thuTu})`)
  }
}

if (unresolved.length) {
  console.error('⚠ Không khớp được xã:', unresolved)
  process.exit(1)
}

const sql =
  '-- TỰ SINH bởi prisma/gen-lanh-dao-xa.mjs — KHÔNG sửa tay.\n' +
  `-- ${wards.length} xã/phường · ${count} lãnh đạo. Idempotent: xoá sạch rồi nạp lại.\n` +
  'BEGIN;\n' +
  'TRUNCATE TABLE lanh_dao_xa;\n' +
  'INSERT INTO lanh_dao_xa (id, "wardId", "hoTen", "chucVu", "soDienThoai", "phongBan", "thuTu") VALUES\n' +
  values.join(',\n') + ';\n' +
  'COMMIT;\n'

fs.writeFileSync(OUT, sql, 'utf8')
console.log(`✓ Đã sinh ${OUT}: ${wards.length} xã, ${count} lãnh đạo.`)
