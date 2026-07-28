// Tạo tài khoản cho cán bộ ĐANG CÔNG TÁC chưa có TK, CCCD hợp lệ 12 số (đợt ĐVSN 3/7/2026).
// Giống hệt đợt 8 TK trước: email = CCCD, role = staff, MK mặc định Abc@12345,
// mustChangePassword = true, toChucId = can_bo.toChucId, gắn can_bo.userId.
// Idempotent: bỏ qua người đã có TK / email trùng. Chạy: node scripts/tao-tai-khoan-dvsn.mjs [--apply]
import 'dotenv/config'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const APPLY = process.argv.includes('--apply')
const DEFAULT_PASSWORD = 'Abc@12345'

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

const { rows } = await c.query(`
  SELECT cb.id AS can_bo_id, cb."hoTen", cb.cccd, cb."toChucId", tc.ma AS don_vi
  FROM can_bo cb
  LEFT JOIN to_chuc tc ON tc.id = cb."toChucId"
  WHERE cb."trangThai" = 'DANG_CONG_TAC' AND cb."userId" IS NULL
    AND cb.cccd ~ '^[0-9]{12}$'
  ORDER BY tc.ma, cb."hoTen"`)
console.log(`— Sẽ tạo ${rows.length} tài khoản (staff, MK mặc định, buộc đổi MK):`)
for (const r of rows) console.log(`  ${r.cccd} | ${r.hoTen} | ${r.don_vi}`)

if (!APPLY) { console.log('>>> Dry-run. Thêm --apply để tạo.'); await c.end(); process.exit(0) }

const role = await c.query(`SELECT id FROM roles WHERE name = 'staff'`)
const roleId = role.rows[0].id
const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

let created = 0, skipped = 0
for (const r of rows) {
  const dup = await c.query(`SELECT id FROM users WHERE email = $1`, [r.cccd])
  if (dup.rowCount > 0) {
    // Email (CCCD) đã có TK nhưng can_bo chưa gắn → chỉ gắn lại liên kết
    await c.query(`UPDATE can_bo SET "userId" = $1 WHERE id = $2 AND "userId" IS NULL`, [dup.rows[0].id, r.can_bo_id])
    console.log(`  ~ ${r.cccd} đã có TK — gắn lại liên kết can_bo`); skipped++; continue
  }
  const uid = 'usr_' + crypto.randomBytes(12).toString('hex')
  await c.query('BEGIN')
  try {
    await c.query(
      `INSERT INTO users (id, email, name, password, "roleId", "toChucId", "isActive", "mustChangePassword", "failedLoginCount", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, true, 0, now(), now())`,
      [uid, r.cccd, r.hoTen, hash, roleId, r.toChucId])
    await c.query(`UPDATE can_bo SET "userId" = $1 WHERE id = $2`, [uid, r.can_bo_id])
    await c.query('COMMIT')
    created++
  } catch (e) {
    await c.query('ROLLBACK')
    console.error(`  ✗ ${r.cccd} ${r.hoTen}: ${e.message}`)
  }
}
console.log(`✓ Tạo mới ${created} TK, gắn lại ${skipped}. MK mặc định: ${DEFAULT_PASSWORD} (buộc đổi khi đăng nhập lần đầu).`)
await c.end()
