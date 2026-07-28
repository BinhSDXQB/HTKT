// Cắt dữ liệu tuyen-duong-quang-tri.geojson theo ranh giới hành chính tỉnh Quảng Trị:
// - Bỏ đối tượng nằm hoàn toàn ngoài tỉnh (dữ liệu gốc tải theo bbox chữ nhật nên lẹm sang Huế/Hà Tĩnh/Lào)
// - Tuyến cắt ngang ranh: giữ phần trong tỉnh, tìm điểm giao với ranh bằng chia đôi (~sai số cm)
// - Polygon (sân bay/cảng): giữ nguyên nếu có ít nhất 1 đỉnh trong tỉnh, bỏ nếu hoàn toàn ngoài
// Idempotent. Bản gốc đầy đủ đã có ở ..\..\geojson-backup\ (script toi-uu-geojson.mjs tạo).
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data')
const FILE = path.join(DATA_DIR, 'tuyen-duong-quang-tri.geojson')
const roads = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const prov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'quang-tri-province-boundary.geojson'), 'utf8'))

const polygons = []
for (const f of prov.features ?? [prov]) {
  const g = f.geometry ?? f
  if (g.type === 'Polygon') polygons.push(g.coordinates)
  else if (g.type === 'MultiPolygon') polygons.push(...g.coordinates)
}

function inRing(pt, ring) {
  let inside = false
  const [x, y] = pt
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi) inside = !inside
  }
  return inside
}
function inProvince(pt) {
  for (const poly of polygons) {
    if (inRing(pt, poly[0]) && !poly.slice(1).some(h => inRing(pt, h))) return true
  }
  return false
}

const round6 = (n) => Math.round(n * 1e6) / 1e6

// Tìm điểm trên đoạn [a→b] nằm sát ranh giới (a trong, b ngoài hoặc ngược lại) — chia đôi 30 lần
function boundaryPoint(inside, outside) {
  let lo = inside, hi = outside
  for (let i = 0; i < 30; i++) {
    const mid = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]
    if (inProvince(mid)) lo = mid
    else hi = mid
  }
  return [round6(lo[0]), round6(lo[1])]
}

// Cắt 1 LineString → mảng các LineString nằm trong tỉnh
function clipLine(coords) {
  const flags = coords.map(inProvince)
  if (flags.every(Boolean)) return [coords]
  if (!flags.some(Boolean)) return []
  const parts = []
  let cur = []
  for (let i = 0; i < coords.length; i++) {
    if (flags[i]) {
      if (cur.length === 0 && i > 0) cur.push(boundaryPoint(coords[i], coords[i - 1])) // đi từ ngoài vào
      cur.push(coords[i])
    } else if (cur.length > 0) {
      cur.push(boundaryPoint(coords[i - 1], coords[i])) // đi từ trong ra
      if (cur.length >= 2) parts.push(cur)
      cur = []
    }
  }
  if (cur.length >= 2) parts.push(cur)
  return parts
}

const before = fs.statSync(FILE).size
const kept = []
let dropped = 0, clipped = 0

for (const f of roads.features) {
  const g = f.geometry
  if (!g) continue
  if (g.type === 'Point') {
    if (inProvince(g.coordinates)) kept.push(f)
    else dropped++
  } else if (g.type === 'LineString') {
    const parts = clipLine(g.coordinates)
    if (parts.length === 0) { dropped++; continue }
    if (parts.length === 1 && parts[0].length === g.coordinates.length) { kept.push(f); continue }
    clipped++
    // Tách thành từng LineString riêng — popup client tính chiều dài/điểm đầu-cuối theo LineString
    for (const p of parts) kept.push({ ...f, geometry: { type: 'LineString', coordinates: p } })
  } else if (g.type === 'MultiLineString') {
    const parts = g.coordinates.flatMap(clipLine)
    if (parts.length === 0) { dropped++; continue }
    if (parts.flat().length !== g.coordinates.flat().length) clipped++
    for (const p of parts) kept.push({ ...f, geometry: { type: 'LineString', coordinates: p } })
  } else if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
    // Không cắt polygon (phức tạp) — giữ nếu có đỉnh trong tỉnh
    const vertices = g.type === 'Polygon' ? g.coordinates.flat() : g.coordinates.flat(2)
    if (vertices.some(inProvince)) kept.push(f)
    else dropped++
  } else {
    kept.push(f)
  }
}

roads.features = kept
if (roads.metadata) {
  roads.metadata.totalFeatures = kept.length
  roads.metadata.clippedToProvince = true
  roads.metadata.clippedAt = new Date().toISOString()
}
fs.writeFileSync(FILE, JSON.stringify(roads))

const after = fs.statSync(FILE).size
console.log(`Đã bỏ ${dropped} đối tượng ngoài tỉnh · cắt tại ranh ${clipped} tuyến · còn ${kept.length} đối tượng`)
console.log(`Dung lượng: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB (−${(((before - after) / before) * 100).toFixed(1)}%)`)
