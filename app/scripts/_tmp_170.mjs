import { readFileSync } from 'node:fs'
import pg from 'pg'
const env = (k) =>
  (readFileSync('.env', 'utf8').match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1].trim().replace(/^["']|["']$/g, '')
const c = new pg.Client({ connectionString: env('DATABASE_URL') })
await c.connect()
await c.query("SET client_encoding TO 'UTF8'")

const r = await c.query(`SELECT c."chunkIndex", c."noiDung" FROM tai_lieu_chunk c
  JOIN tai_lieu t ON t.id = c."taiLieuId"
  WHERE t.nguon = '170_2025_ND-CP_663212.docx'
    AND (c."noiDung" ILIKE '%hết hiệu lực%' OR c."noiDung" ILIKE '%bãi bỏ%' OR c."noiDung" ILIKE '%46/2010%')
  ORDER BY c."chunkIndex"`)

console.log('So doan co dieu khoan bai bo/het hieu luc:', r.rowCount, '\n')
for (const x of r.rows) {
  const t = x.noiDung.replace(/\[Trang \d+\]/g, ' ').replace(/\s+/g, ' ')
  // Trich quanh cac tu khoa
  for (const tu of ['hết hiệu lực', 'Bãi bỏ', '46/2010']) {
    let i = -1
    while ((i = t.indexOf(tu, i + 1)) >= 0) {
      console.log(`--- đoạn ${x.chunkIndex} · "${tu}" ---`)
      console.log(t.slice(Math.max(0, i - 320), i + 420).trim())
      console.log()
    }
  }
}
await c.end()
