// Tối ưu dung lượng các file GeoJSON tĩnh phục vụ Bản đồ GIS (/dashboard/ban-do)
// - Làm tròn toạ độ: đường bộ 6 số lẻ (~0,11 m), ranh giới 5 số lẻ (~1,1 m)
// - Xoá thuộc tính không dùng (osmId, highway, rank) và thuộc tính rỗng ""
//   (giữ lại name/ref kể cả rỗng vì filter MapLibre tham chiếu trực tiếp)
// Idempotent — chạy lại không làm hỏng dữ liệu. Bản gốc được backup 1 lần.
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data')
const BACKUP_DIR = path.resolve(import.meta.dirname, '..', '..', 'geojson-backup')

const DROP_KEYS = new Set(['osmId', 'highway', 'rank'])
const KEEP_EMPTY = new Set(['name', 'ref'])

function roundCoords(coords, dp) {
  const f = 10 ** dp
  if (typeof coords[0] === 'number') {
    // Bỏ chiều cao (phần tử thứ 3) nếu có — bản đồ 2D không dùng
    return [Math.round(coords[0] * f) / f, Math.round(coords[1] * f) / f]
  }
  return coords.map((c) => roundCoords(c, dp))
}

function roundGeometry(geom, dp) {
  if (!geom) return geom
  if (geom.type === 'GeometryCollection') {
    return { ...geom, geometries: geom.geometries.map((g) => roundGeometry(g, dp)) }
  }
  return { ...geom, coordinates: roundCoords(geom.coordinates, dp) }
}

function cleanProperties(props, stripUnused) {
  if (!props || !stripUnused) return props
  const out = {}
  for (const [k, v] of Object.entries(props)) {
    if (DROP_KEYS.has(k)) continue
    if (v === '' && !KEEP_EMPTY.has(k)) continue
    out[k] = v
  }
  return out
}

function optimizeFile(fileName, { dp, stripUnused = false }) {
  const filePath = path.join(DATA_DIR, fileName)
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Bỏ qua ${fileName} (không tồn tại)`)
    return
  }
  const before = fs.statSync(filePath).size

  const backupPath = path.join(BACKUP_DIR, fileName)
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    fs.copyFileSync(filePath, backupPath)
    console.log(`💾 Backup gốc → ${backupPath}`)
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  for (const feature of geojson.features ?? []) {
    feature.geometry = roundGeometry(feature.geometry, dp)
    feature.properties = cleanProperties(feature.properties, stripUnused)
    // bbox thuộc tính (dùng cho flyTo khi bấm xã/phường) — làm tròn theo cùng độ chính xác
    if (Array.isArray(feature.properties?.bbox)) {
      const f = 10 ** dp
      feature.properties.bbox = feature.properties.bbox.map((n) => Math.round(n * f) / f)
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(geojson))

  const after = fs.statSync(filePath).size
  const pct = (((before - after) / before) * 100).toFixed(1)
  console.log(`✅ ${fileName}: ${(before / 1048576).toFixed(2)} MB → ${(after / 1048576).toFixed(2)} MB (−${pct}%)`)
}

optimizeFile('tuyen-duong-quang-tri.geojson', { dp: 6, stripUnused: true })
optimizeFile('admin-boundaries.geojson', { dp: 5 })
optimizeFile('quang-tri-province-boundary.geojson', { dp: 5 })
