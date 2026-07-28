// Phân tích: bao nhiêu đối tượng trong tuyen-duong-quang-tri.geojson nằm NGOÀI ranh giới tỉnh
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data')
const roads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tuyen-duong-quang-tri.geojson'), 'utf8'))
const prov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'quang-tri-province-boundary.geojson'), 'utf8'))

// Gom tất cả polygon của tỉnh (Polygon/MultiPolygon)
const polygons = []
for (const f of prov.features ?? [prov]) {
  const g = f.geometry ?? f
  if (g.type === 'Polygon') polygons.push(g.coordinates)
  else if (g.type === 'MultiPolygon') polygons.push(...g.coordinates)
}
console.log(`Ranh tỉnh: ${polygons.length} polygon, vành ngoài ${polygons.map(p => p[0].length).join('+')} đỉnh`)

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

function coordsOf(geom) {
  if (geom.type === 'LineString') return geom.coordinates
  if (geom.type === 'MultiLineString') return geom.coordinates.flat()
  if (geom.type === 'Point') return [geom.coordinates]
  if (geom.type === 'Polygon') return geom.coordinates.flat()
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat(2)
  return []
}

const stats = {}
for (const f of roads.features) {
  const layer = f.properties?.layer ?? '?'
  const label = layer === 'road' ? (f.properties?.label ?? '?') : layer
  const key = `${layer}|${label}`
  stats[key] ??= { total: 0, inside: 0, outside: 0, cross: 0, vTotal: 0, vOutside: 0 }
  const s = stats[key]
  s.total++
  const cs = coordsOf(f.geometry)
  s.vTotal += cs.length
  let nIn = 0
  for (const c of cs) if (inProvince(c)) nIn++
  s.vOutside += cs.length - nIn
  if (nIn === cs.length) s.inside++
  else if (nIn === 0) s.outside++
  else s.cross++
}

console.log('\nLayer|Loại'.padEnd(38), 'Tổng'.padStart(6), 'Trong'.padStart(6), 'NGOÀI'.padStart(6), 'Cắt ranh'.padStart(9), 'Đỉnh ngoài/tổng'.padStart(18))
let tOut = 0, tCross = 0, vOut = 0, vTot = 0
for (const [k, s] of Object.entries(stats).sort((a, b) => b[1].total - a[1].total)) {
  console.log(k.padEnd(38), String(s.total).padStart(6), String(s.inside).padStart(6), String(s.outside).padStart(6), String(s.cross).padStart(9), `${s.vOutside}/${s.vTotal}`.padStart(18))
  tOut += s.outside; tCross += s.cross; vOut += s.vOutside; vTot += s.vTotal
}
console.log(`\nTổng features hoàn toàn NGOÀI tỉnh: ${tOut}/${roads.features.length} · cắt ranh: ${tCross}`)
console.log(`Tổng đỉnh toạ độ ngoài tỉnh: ${vOut}/${vTot} (${(vOut / vTot * 100).toFixed(1)}%)`)
