// Gán TẠM toạ độ/hình tuyến cho 929 tuyến đường trong bảng `streets` để hiển thị lên Bản đồ GIS,
// trong khi chờ số liệu khảo sát thật (mẫu biểu gửi xã/phường không có cột toạ độ).
//
// Cách khớp:
//   1. Chuẩn hoá tên (bỏ tiền tố "Đường/Phố/Tuyến", thường hoá) rồi khớp với tên đường
//      trong lớp OSM public/data/tuyen-duong-quang-tri.geojson, GIỚI HẠN trong ranh xã/phường của tuyến
//   2. Khớp được → tạo tài sản GIAO_THONG geometryType=LINE, geojson=MultiLineString,
//      lat/lng = trung điểm đoạn dài nhất
//   3. Không khớp → tài sản POINT đặt quanh tâm xã (toả vòng tròn ~300m để không chồng điểm)
//
// Mọi bản ghi đều đánh dấu techSpecs._toaDoTam=true + notes — khi có toạ độ thật thì thay.
//
// Cách dùng:
//   node scripts/gan-toa-do-tam.mjs --dry    → thống kê khớp, KHÔNG ghi CSDL
//   node scripts/gan-toa-do-tam.mjs          → ghi CSDL (chỉ tạo mới / cập nhật bản ghi _toaDoTam cũ)
//   node scripts/gan-toa-do-tam.mjs --undo   → xoá toàn bộ tài sản gán tạm (_toaDoTam=true)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import crypto from 'node:crypto'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8')
    .match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]
    .trim()
    .replace(/^["']|["']$/g, '') ?? '')

const DRY = process.argv.includes('--dry')
const UNDO = process.argv.includes('--undo')

const client = new pg.Client({ connectionString: env('DATABASE_URL') })
await client.connect()

if (UNDO) {
  const r = await client.query(`DELETE FROM assets WHERE "techSpecs"->>'_toaDoTam' = 'true'`)
  console.log(`Đã xoá ${r.rowCount} tài sản gán tạm.`)
  await client.end()
  process.exit(0)
}

// ── Dữ liệu bản đồ ────────────────────────────────────────────────────────
const DATA_DIR = join(root, 'public', 'data')
const roadsGj = JSON.parse(readFileSync(join(DATA_DIR, 'tuyen-duong-quang-tri.geojson'), 'utf8'))
const adminGj = JSON.parse(readFileSync(join(DATA_DIR, 'admin-boundaries.geojson'), 'utf8'))

function inRing(pt, ring) {
  let inside = false
  const [x, y] = pt
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi) inside = !inside
  }
  return inside
}

// Ward code → { rings (vành ngoài), bbox, centroid }
const wards = new Map()
for (const f of adminGj.features) {
  const code = String(f.properties.code)
  const rings = f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map(p => p[0])
  let bbox = f.properties.bbox
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    bbox = [Infinity, Infinity, -Infinity, -Infinity]
    for (const r of rings) for (const [x, y] of r) {
      if (x < bbox[0]) bbox[0] = x; if (y < bbox[1]) bbox[1] = y
      if (x > bbox[2]) bbox[2] = x; if (y > bbox[3]) bbox[3] = y
    }
  }
  // Tâm xã: trung bình đỉnh vành lớn nhất (đủ tốt cho điểm tạm)
  const big = rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0])
  const centroid = [big.reduce((s, c) => s + c[0], 0) / big.length, big.reduce((s, c) => s + c[1], 0) / big.length]
  wards.set(code, { rings, bbox, centroid })
}
const wardContains = (w, [x, y]) =>
  x >= w.bbox[0] && x <= w.bbox[2] && y >= w.bbox[1] && y <= w.bbox[3] && w.rings.some(r => inRing([x, y], r))

// ── Chỉ mục tên đường OSM ─────────────────────────────────────────────────
const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFC')
    .replace(/^(đường|duong|phố|pho|tuyến|tuyen)\s+/i, '')
    .replace(/\s+/g, ' ').trim()

const roadsByName = new Map() // tên chuẩn hoá → [{coords}]
for (const f of roadsGj.features) {
  if (f.properties?.layer !== 'road' || f.geometry?.type !== 'LineString') continue
  const key = normalize(f.properties.name)
  if (!key) continue
  if (!roadsByName.has(key)) roadsByName.set(key, [])
  roadsByName.get(key).push(f.geometry.coordinates)
}

function haversine(a, b) {
  const R = 6371000, dLat = (b[1] - a[1]) * Math.PI / 180, dLon = (b[0] - a[0]) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
const lineLength = (cs) => cs.reduce((s, c, i) => (i ? s + haversine(cs[i - 1], c) : 0), 0)

// ── Tuyến đường trong CSDL ────────────────────────────────────────────────
const streets = (await client.query(`
  SELECT s.id, s.code, s.name, s.length, s."wardId", w.code AS ward_code, w.name AS ward_name
  FROM streets s LEFT JOIN administrative_units w ON w.id = s."wardId"
  WHERE s."isActive" = true ORDER BY w.code, s.name`)).rows

// Loại tài sản GIAO_THONG để gắn
const types = (await client.query(`SELECT id, code, name FROM asset_types WHERE domain = 'GIAO_THONG' AND "isActive" = true ORDER BY code`)).rows
const assetType = types.find(t => /DUONG/i.test(t.code)) ?? types[0]
if (!assetType) { console.error('Không có loại tài sản GIAO_THONG nào trong asset_types — dừng.'); process.exit(1) }
console.log(`Loại tài sản dùng: ${assetType.code} (${assetType.name}) · ${streets.length} tuyến trong CSDL\n`)

// ── Khớp ──────────────────────────────────────────────────────────────────
let matched = 0, fallback = 0, noWard = 0
const wardFallbackIdx = new Map() // đếm điểm toả quanh tâm mỗi xã
const rows = []
const unmatchedSamples = []

for (const st of streets) {
  const ward = wards.get(String(st.ward_code))
  const key = normalize(st.name)
  let geom = null, lat = null, lng = null, doKhop = ''

  if (ward && key && roadsByName.has(key)) {
    // Ưu tiên tuyến nằm trong đúng xã; nếu không có (xã sáp nhập/tách nên lệch ranh) →
    // chấp nhận tuyến cùng tên trong bán kính 10km quanh tâm xã (tránh nhầm tên trùng giữa 2 đô thị xa)
    let parts = roadsByName.get(key).filter(cs => cs.some(c => wardContains(ward, c)))
    let capKhop = 'khop-ten-osm'
    if (parts.length === 0) {
      parts = roadsByName.get(key).filter(cs => cs.some(c => haversine(c, ward.centroid) < 10000))
      capKhop = 'khop-ten-gan-xa'
    }
    if (parts.length > 0) {
      const longest = parts.reduce((a, b) => (lineLength(b) > lineLength(a) ? b : a), parts[0])
      const mid = longest[Math.floor(longest.length / 2)]
      geom = parts.length === 1
        ? { type: 'LineString', coordinates: parts[0] }
        : { type: 'MultiLineString', coordinates: parts }
      lng = mid[0]; lat = mid[1]
      doKhop = capKhop
      matched++
    }
  }

  if (!geom) {
    if (!ward) { noWard++; unmatchedSamples.length < 8 && unmatchedSamples.push(`${st.name} (không rõ xã)`); continue }
    // Toả điểm quanh tâm xã theo vòng tròn bán kính 300m — không chồng lên nhau
    const idx = wardFallbackIdx.get(st.ward_code) ?? 0
    wardFallbackIdx.set(st.ward_code, idx + 1)
    const angle = idx * 2.399963 // góc vàng — phân bố đều
    const rMet = 150 + 40 * Math.sqrt(idx)
    lng = ward.centroid[0] + (rMet * Math.cos(angle)) / (111320 * Math.cos(ward.centroid[1] * Math.PI / 180))
    lat = ward.centroid[1] + (rMet * Math.sin(angle)) / 110540
    doKhop = 'tam-xa'
    fallback++
    if (unmatchedSamples.length < 8) unmatchedSamples.push(`${st.name} — ${st.ward_name}`)
  }

  rows.push({ st, geom, lat, lng, doKhop })
}

console.log(`Khớp tên với tuyến OSM trong xã : ${matched}`)
console.log(`Không khớp → điểm quanh tâm xã : ${fallback}`)
console.log(`Không rõ xã (bỏ qua)           : ${noWard}`)
console.log(`\nVí dụ chưa khớp tên:`)
unmatchedSamples.forEach(s => console.log(`  · ${s}`))

if (DRY) { console.log('\n(--dry: chưa ghi gì vào CSDL)'); await client.end(); process.exit(0) }

// ── Ghi CSDL (idempotent: chỉ tạo mới hoặc cập nhật bản ghi _toaDoTam) ────
let created = 0, updated = 0, skipped = 0
for (const { st, geom, lat, lng, doKhop } of rows) {
  const assetCode = `GT-${st.code}`
  const notes = 'Toạ độ/hình tuyến GÁN TẠM từ bản đồ OSM theo tên đường (chưa khảo sát thực địa). Nguồn: gan-toa-do-tam.mjs'
  const techSpecs = JSON.stringify({ _toaDoTam: true, _doKhop: doKhop })
  const existing = (await client.query(`SELECT id, "techSpecs"->>'_toaDoTam' AS tam FROM assets WHERE "assetCode" = $1`, [assetCode])).rows[0]
  if (existing && existing.tam !== 'true') { skipped++; continue } // đã có dữ liệu thật — không đụng
  if (existing) {
    await client.query(
      `UPDATE assets SET name=$2, latitude=$3, longitude=$4, geojson=$5, "geometryType"=$6, "techSpecs"=$7, notes=$8, "updatedAt"=now() WHERE id=$1`,
      [existing.id, st.name, lat, lng, geom ? JSON.stringify(geom) : null, geom ? 'LINE' : 'POINT', techSpecs, notes]
    )
    updated++
  } else {
    await client.query(
      `INSERT INTO assets (id, "assetCode", name, "assetTypeId", domain, "wardId", "streetId", latitude, longitude, "geometryType", geojson, condition, status, "techSpecs", notes, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'GIAO_THONG', $5, $6, $7, $8, $9, $10, 'TOT', 'DANG_SU_DUNG', $11, $12, now(), now())`,
      [crypto.randomUUID().replace(/-/g, '').slice(0, 25), assetCode, st.name, assetType.id, st.wardId, st.id, lat, lng, geom ? 'LINE' : 'POINT', geom ? JSON.stringify(geom) : null, techSpecs, notes]
    )
    created++
  }
}
console.log(`\n✅ Tạo mới ${created} · cập nhật ${updated} · bỏ qua (đã có dữ liệu thật) ${skipped}`)
await client.end()
