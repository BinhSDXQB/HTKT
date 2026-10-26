// Áp MỘT tệp migration SQL (prisma/migrations_manual/NNN_*.sql) vào CSDL — gọi từ vps-auto-deploy.ps1.
// Tệp migration tự bọc BEGIN/COMMIT nên chạy nguyên khối; lỗi thì PostgreSQL tự rollback phần đã chạy.
// Cách dùng: node scripts/deploy/apply-migration.mjs <đường-dẫn-tệp.sql>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const pg = createRequire(path.join(appDir, 'package.json'))('pg')

const file = process.argv[2]
if (!file || !fs.existsSync(file)) { console.error('Thieu hoac khong thay tep migration:', file); process.exit(2) }
const env = fs.readFileSync(path.join(appDir, '.env'), 'utf8')
const doc = (k) => env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm'))?.[1]
const url = doc('DIRECT_DATABASE_URL') || doc('DATABASE_URL')   // giống lib/db.ts
if (!url) { console.error('Khong doc duoc DIRECT_DATABASE_URL/DATABASE_URL trong app/.env'); process.exit(2) }

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()
  await client.query(fs.readFileSync(file, 'utf8'))
  console.log('OK', path.basename(file))
} catch (e) {
  console.error('LOI', path.basename(file), '-', e.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
