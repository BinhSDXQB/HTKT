// Rà soát cán bộ ĐANG CÔNG TÁC chưa có tài khoản (đăng nhập = CCCD)
// + CCCD bất thường (tạm/9 số). Chỉ đọc, không ghi.
import 'dotenv/config'
import pg from 'pg'

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

const thieu = await c.query(`
  SELECT cb."hoTen", cb.cccd, tc.ma AS don_vi_ma, tc.ten AS don_vi_ten, tc.loai AS "loaiToChuc"
  FROM can_bo cb
  LEFT JOIN to_chuc tc ON tc.id = cb."toChucId"
  WHERE cb."trangThai" = 'DANG_CONG_TAC' AND cb."userId" IS NULL
  ORDER BY tc.ma, cb."hoTen"`)
console.log(`— Cán bộ đang công tác CHƯA có tài khoản: ${thieu.rowCount}`)
const byDonVi = {}
for (const r of thieu.rows) {
  const k = `${r.don_vi_ma ?? 'KHONG_DON_VI'} (${r.loaiToChuc ?? '?'})`
  ;(byDonVi[k] ??= []).push(r)
}
for (const [dv, rows] of Object.entries(byDonVi)) {
  console.log(`  ${dv}: ${rows.length}`)
  for (const r of rows) console.log(`    ${r.hoTen} | CCCD=${r.cccd ?? 'NULL'}`)
}

const bad = await c.query(`
  SELECT cb."hoTen", cb.cccd, cb."trangThai", tc.ten AS don_vi, (cb."userId" IS NOT NULL) AS co_tk
  FROM can_bo cb LEFT JOIN to_chuc tc ON tc.id = cb."toChucId"
  WHERE cb.cccd IS NULL OR cb.cccd !~ '^[0-9]{12}$'
  ORDER BY cb."hoTen"`)
console.log(`\n— CCCD bất thường (không phải 12 số): ${bad.rowCount}`)
for (const r of bad.rows) console.log(`  ${r.hoTen} | CCCD=${r.cccd ?? 'NULL'} | ${r.trangThai} | ${r.don_vi ?? '—'} | TK=${r.co_tk ? 'có' : 'chưa'}`)

await c.end()
