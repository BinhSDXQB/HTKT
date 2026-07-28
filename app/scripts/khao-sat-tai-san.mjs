// Khảo sát nhanh dữ liệu tài sản phục vụ gán tạm toạ độ
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8')
    .match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]
    .trim()
    .replace(/^["']|["']$/g, '') ?? '')

const client = new pg.Client({ connectionString: env('DATABASE_URL') })
await client.connect()

const q = async (sql) => (await client.query(sql)).rows

console.log('— Tổng quan —')
console.table(await q(`
  SELECT count(*)::int AS tong,
         count(latitude)::int AS co_toado,
         count(*) FILTER (WHERE latitude IS NULL AND "streetId" IS NOT NULL)::int AS thieu_va_co_street,
         count(*) FILTER (WHERE latitude IS NULL AND "wardId" IS NOT NULL)::int AS thieu_va_co_ward,
         count(*) FILTER (WHERE latitude IS NULL AND coalesce(address,'') <> '')::int AS thieu_va_co_diachi
  FROM assets`))

console.log('— Theo lĩnh vực (thiếu toạ độ) —')
console.table(await q(`
  SELECT domain, count(*)::int AS thieu FROM assets WHERE latitude IS NULL GROUP BY domain ORDER BY thieu DESC`))

console.log('— Mẫu 12 tài sản thiếu toạ độ —')
console.table(await q(`
  SELECT a.name, s.name AS street, w.name AS ward, w.code AS ward_code, left(coalesce(a.address,''), 40) AS address
  FROM assets a
  LEFT JOIN streets s ON s.id = a."streetId"
  LEFT JOIN administrative_units w ON w.id = a."wardId"
  WHERE a.latitude IS NULL LIMIT 12`))

console.log('— Số street distinct của tài sản thiếu toạ độ —')
console.table(await q(`
  SELECT count(DISTINCT a."streetId")::int AS so_tuyen, count(DISTINCT a."wardId")::int AS so_xa
  FROM assets a WHERE a.latitude IS NULL`))

await client.end()
