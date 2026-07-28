// Cutover org_v2 GIAI ĐOẠN 1 (đã chạy --apply 3/7/2026) — xoá cột hết tham chiếu trong code:
//   - users.departmentCode  (auth suy động từ to_chuc.ma từ 3/7)
//   - office_collective_reward_records.conTonTai (trang thi đua suy động từ toChucId)
// KHÔNG đụng can_bo.chucVu / can_bo.phongBan — còn ~20 file dùng làm fallback + chatbot ghi (GIAI ĐOẠN 2).
// Chạy: node scripts/cutover-org-v2-phase1.mjs   (thêm --apply để thực thi)
import 'dotenv/config'
import pg from 'pg'

const APPLY = process.argv.includes('--apply')
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

// ── Đánh giá dữ liệu cho GIAI ĐOẠN 2 (chucVu/phongBan) — chỉ báo cáo ──
const r1 = await c.query(`SELECT count(*)::int AS n FROM can_bo WHERE "chucVu" IS NOT NULL AND "chucDanhId" IS NULL`)
const r2 = await c.query(`SELECT count(*)::int AS n FROM can_bo WHERE "phongBan" IS NOT NULL AND "toChucId" IS NULL`)
console.log(`— [GĐ2] can_bo còn chucVu text mà THIẾU chucDanhId: ${r1.rows[0].n}`)
console.log(`— [GĐ2] can_bo còn phongBan text mà THIẾU toChucId: ${r2.rows[0].n}`)

// ── Giai đoạn 1 ──
const cols = await c.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE (table_name='users' AND column_name='departmentCode')
     OR (table_name='office_collective_reward_records' AND column_name='conTonTai')`)
console.log(`— Cột chờ xoá còn tồn tại: ${cols.rows.map(r => `${r.table_name}.${r.column_name}`).join(', ') || '(đã xoá hết)'}`)

if (!APPLY) { console.log('>>> Chạy thử (dry-run). Thêm --apply để xoá cột.'); await c.end(); process.exit(0) }

await c.query('BEGIN')
try {
  await c.query(`ALTER TABLE users DROP COLUMN IF EXISTS "departmentCode"`)
  await c.query(`ALTER TABLE office_collective_reward_records DROP COLUMN IF EXISTS "conTonTai"`)
  await c.query('COMMIT')
  console.log('✓ ĐÃ XOÁ users.departmentCode + office_collective_reward_records.conTonTai')
} catch (e) {
  await c.query('ROLLBACK')
  console.error('✗ ROLLBACK:', e.message)
  process.exit(1)
}
await c.end()
