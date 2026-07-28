// Xem mẫu tài khoản staff đã tạo đợt trước + danh sách role (chỉ đọc)
import 'dotenv/config'
import pg from 'pg'

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()

const roles = await c.query(`SELECT r.id, r.name, count(u.id)::int AS so_tk FROM roles r LEFT JOIN users u ON u."roleId" = r.id GROUP BY r.id, r.name ORDER BY r.name`)
console.log('— Roles:'); for (const r of roles.rows) console.log(`  ${r.name} | id=${r.id} | ${r.so_tk} TK`)

const mau = await c.query(`
  SELECT u.email, u.name, r.name AS role, u."isActive", u."mustChangePassword",
         (u."toChucId" IS NOT NULL) AS co_to_chuc, u."toChucId" = cb."toChucId" AS khop_don_vi
  FROM users u
  JOIN can_bo cb ON cb."userId" = u.id
  JOIN roles r ON r.id = u."roleId"
  ORDER BY u."createdAt" DESC LIMIT 8`)
console.log('— 8 TK gắn cán bộ mới nhất:')
for (const r of mau.rows) console.log(`  ${r.email} | ${r.name} | ${r.role} | mustChange=${r.mustChangePassword} | khớp đơn vị=${r.khop_don_vi}`)

await c.end()
