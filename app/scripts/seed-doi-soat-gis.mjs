#!/usr/bin/env node
// Seed ward_gis_length + ward_khai_bao tu 2 file JSON do tools/ sinh ra.
//   - GIS_CHIEU_DAI_THEO_DON_VI.json  -> ward_gis_length (chieu dai hinh hoc theo don vi)
//   - KHAI_BAO.json                   -> ward_khai_bao   (so don vi tu khai, doi soat 3 nguon)
// Khop don vi theo TEN BO DAU (dong bo voi _key_ten ben Python).
// Chay:  node scripts/seed-doi-soat-gis.mjs [--year=2025]
import { Client } from 'pg'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

const YEAR = Number((process.argv.find(a => a.startsWith('--year=')) || '').split('=')[1] || 2025)
const OUT_DIR = 'G:\\My Drive\\HTKT\\Tong hop HTKT'
const GIS_JSON = path.join(OUT_DIR, 'GIS_CHIEU_DAI_THEO_DON_VI.json')
const KB_JSON = path.join(OUT_DIR, 'KHAI_BAO.json')

function keyTen(s) {
  s = (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  s = s.replace(/đ/g, 'd').replace(/Đ/g, 'D')
  return s.toLowerCase().split(/\s+/).filter(Boolean).join(' ')
}
// Bo tien to loai de khop du phong: 'phuong dong hoi' -> 'dong hoi'
function keyTenNamonly(s) {
  return keyTen(s).replace(/^(phuong|xa|thi tran|dac khu|thi xa|thanh pho)\s+/, '')
}

const url = (fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8').match(/DATABASE_URL="([^"]+)"/) || [])[1]
const c = new Client({ connectionString: url })

async function main() {
  await c.connect()
  const wards = (await c.query(
    `select id, name, "fullName", type from administrative_units where type='PHUONG_XA'`
  )).rows
  const byKey = new Map()
  for (const w of wards) {
    const full = w.fullName || w.name
    byKey.set(keyTen(full), w.id)
    if (!byKey.has(keyTenNamonly(full))) byKey.set(keyTenNamonly(full), w.id)
  }
  const resolve = (k) => byKey.get(k) || byKey.get(keyTenNamonly(k)) || null

  // ---- ward_gis_length ----
  const gis = JSON.parse(fs.readFileSync(GIS_JSON, 'utf8'))
  let gOk = 0, gMiss = []
  for (const [k, v] of Object.entries(gis)) {
    const wardId = resolve(k)
    if (!wardId) { gMiss.push(v.ten || k); continue }
    await c.query(
      `insert into ward_gis_length
         (id,"wardId","duongDiaPhuongKm","duongHuyenKm","duongTinhKm","quocLoKm","caoTocKm","tongKm",nguon,"updatedAt")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
       on conflict ("wardId") do update set
         "duongDiaPhuongKm"=excluded."duongDiaPhuongKm","duongHuyenKm"=excluded."duongHuyenKm",
         "duongTinhKm"=excluded."duongTinhKm","quocLoKm"=excluded."quocLoKm",
         "caoTocKm"=excluded."caoTocKm","tongKm"=excluded."tongKm",nguon=excluded.nguon,"updatedAt"=now()`,
      [randomUUID(), wardId,
        v['Đường địa phương/đô thị'] || 0, v['Đường huyện'] || 0, v['Đường tỉnh'] || 0,
        v['Quốc lộ'] || 0, v['Cao tốc'] || 0, v['_tong'] || 0, 'gis_do_chieu_dai.py']
    )
    gOk++
  }

  // ---- ward_khai_bao ----
  const kb = JSON.parse(fs.readFileSync(KB_JSON, 'utf8'))
  let kOk = 0, kMiss = []
  for (const [k, v] of Object.entries(kb)) {
    const wardId = resolve(k)
    if (!wardId) { kMiss.push(v.ten || k); continue }
    for (const it of v.items) {
      await c.query(
        `insert into ward_khai_bao (id,"wardId",year,"linhVuc","chiTieu","giaTri","donVi","updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,now())
         on conflict ("wardId",year,"linhVuc","chiTieu") do update set
           "giaTri"=excluded."giaTri","donVi"=excluded."donVi","updatedAt"=now()`,
        [randomUUID(), wardId, YEAR, it.linhVuc, it.chiTieu, it.giaTri, it.donVi]
      )
      kOk++
    }
  }

  console.log(`ward_gis_length: ${gOk} don vi` + (gMiss.length ? ` | KHONG KHOP: ${gMiss.join(', ')}` : ' | khop het'))
  console.log(`ward_khai_bao : ${kOk} chi tieu` + (kMiss.length ? ` | KHONG KHOP: ${kMiss.join(', ')}` : ' | khop het'))
  await c.end()
}
main().catch(e => { console.error(e); process.exit(1) })
