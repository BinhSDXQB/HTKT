// Tìm xem dữ liệu hạ tầng các xã/phường nộp đang nằm ở bảng nào, có toạ độ chưa
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

// Mọi bảng public có cột latitude/longitude hoặc geojson
const tables = (await client.query(`
  SELECT table_name,
         bool_or(column_name IN ('latitude','lat')) AS has_lat,
         bool_or(column_name IN ('geojson','geometry','geom')) AS has_geom
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name
  HAVING bool_or(column_name IN ('latitude','lat','geojson','geometry','geom'))
  ORDER BY table_name`)).rows

for (const t of tables) {
  const cols = (await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 AND column_name IN ('latitude','geojson')`, [t.table_name])).rows.map(r => r.column_name)
  const latSel = cols.includes('latitude') ? 'count(latitude)::int' : '0'
  const geoSel = cols.includes('geojson') ? 'count(geojson)::int' : '0'
  const r = (await client.query(`SELECT count(*)::int AS tong, ${latSel} AS co_lat, ${geoSel} AS co_geojson FROM "${t.table_name}"`)).rows[0]
  if (r.tong > 0) console.log(`${t.table_name.padEnd(28)} tổng=${String(r.tong).padStart(6)}  có_lat=${String(r.co_lat).padStart(6)}  có_geojson=${String(r.co_geojson).padStart(6)}`)
}

// Bảng streets + hồ sơ nghiệp vụ động
const extra = (await client.query(`
  SELECT (SELECT count(*)::int FROM streets) AS streets,
         (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_name='nghiep_vu_ban_ghi') AS co_bang_nv`)).rows[0]
console.log(`\nstreets: ${extra.streets} tuyến`)
if (extra.co_bang_nv) {
  const nv = (await client.query(`SELECT "linhVuc", count(*)::int AS n FROM nghiep_vu_ban_ghi GROUP BY 1 ORDER BY n DESC LIMIT 20`)).rows
  console.table(nv)
  // Cấu trúc 1 bản ghi mẫu để xem trường động có gì (địa chỉ/tuyến đường/toạ độ?)
  const sample = (await client.query(`SELECT "linhVuc", "duLieu" FROM nghiep_vu_ban_ghi LIMIT 3`)).rows
  for (const s of sample) console.log(s.linhVuc, '→', JSON.stringify(s.duLieu).slice(0, 400))
}

await client.end()
