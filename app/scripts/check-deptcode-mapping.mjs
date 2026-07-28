// Đối chiếu users.departmentCode (cột cũ) với to_chuc.ma (nguồn sự thật) trước khi refactor
import 'dotenv/config'
import pg from 'pg'

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const r = await c.query(`
  SELECT u."departmentCode", tc.ma AS to_chuc_ma, count(*)::int AS n
  FROM users u LEFT JOIN to_chuc tc ON tc.id = u."toChucId"
  GROUP BY 1, 2 ORDER BY 1 NULLS LAST, 2`)
for (const row of r.rows) console.log(`dept=${row.departmentCode ?? 'NULL'} | to_chuc.ma=${row.to_chuc_ma ?? 'NULL'} | ${row.n} TK`)
await c.end()
