// Rà blocker cutover org_v2: tài khoản lệch đơn vị giữa users.toChucId và can_bo.toChucId
import 'dotenv/config'
import pg from 'pg'

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

const lech = await c.query(`
  SELECT u.email, u.name,
         tc1.ma AS user_don_vi, tc2.ma AS can_bo_don_vi
  FROM users u
  JOIN can_bo cb ON cb."userId" = u.id
  LEFT JOIN to_chuc tc1 ON tc1.id = u."toChucId"
  LEFT JOIN to_chuc tc2 ON tc2.id = cb."toChucId"
  WHERE u."toChucId" IS DISTINCT FROM cb."toChucId"
  ORDER BY u.email`)
console.log('— Tài khoản lệch đơn vị (users.toChucId ≠ can_bo.toChucId):', lech.rowCount)
for (const r of lech.rows) console.log(`  ${r.email} | ${r.name} | user→${r.user_don_vi ?? 'NULL'} | can_bo→${r.can_bo_don_vi ?? 'NULL'}`)

const thieuPC = await c.query(`
  SELECT count(*)::int AS n FROM can_bo cb
  WHERE cb."toChucId" IS NOT NULL AND cb."chucDanhId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM phan_cong pc WHERE pc."canBoId" = cb.id AND pc."laChinh" = true AND pc."denNgay" IS NULL)`)
console.log('— Cán bộ có đơn vị+chức danh nhưng CHƯA có phân công chính:', thieuPC.rows[0].n)

const thieuCD = await c.query(`
  SELECT count(*)::int AS n FROM can_bo WHERE "trangThai" = 'DANG_CONG_TAC' AND "chucDanhId" IS NULL`)
console.log('— Cán bộ đang công tác thiếu chức danh:', thieuCD.rows[0].n)

const stg = await c.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'org_v2'`)
console.log('— Schema org_v2 staging: ', stg.rows[0].n, 'bảng')

console.log('— Đối chiếu public ↔ org_v2:')
for (const t of ['users', 'can_bo', 'to_chuc', 'chuc_danh', 'phan_cong']) {
  const a = await c.query(`SELECT count(*)::int AS n FROM public.${t}`)
  const b = await c.query(`SELECT count(*)::int AS n FROM org_v2.${t}`)
  const ok = t === 'phan_cong' ? b.rows[0].n >= a.rows[0].n : a.rows[0].n === b.rows[0].n
  console.log(`  ${t}: public=${a.rows[0].n} org_v2=${b.rows[0].n} ${ok ? '✓' : '✗ LỆCH'}`)
}
const pcV2 = await c.query(`
  SELECT count(*)::int AS n FROM org_v2.can_bo cb
  WHERE cb."toChucId" IS NOT NULL AND cb."chucDanhId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM org_v2.phan_cong p WHERE p."canBoId" = cb.id AND p."laChinh" = true AND p."denNgay" IS NULL)`)
console.log('— org_v2: cán bộ chưa có phân công chính (sau backfill):', pcV2.rows[0].n)

await c.end()
