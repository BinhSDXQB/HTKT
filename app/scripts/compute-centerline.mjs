/**
 * Tính đường tim tuyến ĐSTĐC từ 2 ranh GPMB [7012] + [7011]
 * → Cập nhật duong-sat-cao-toc.geojson với tọa độ chính xác.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const mainPath = join(import.meta.dirname, '..', 'public', 'data', 'tuyen-duong-quang-tri.geojson')
const railPath = join(import.meta.dirname, '..', 'public', 'data', 'duong-sat-cao-toc.geojson')

const data = JSON.parse(readFileSync(mainPath, 'utf8'))
const gpmb = data.features.filter(f => f.properties.layer === 'gpmb_dstdc')

// Gom tọa độ theo polyline, nối liền các feature
function collectCoords(polylineName) {
  const features = gpmb.filter(f => f.properties.polyline === polylineName)
  const allCoords = []
  for (const f of features) {
    allCoords.push(...f.geometry.coordinates)
  }
  return allCoords
}

const left = collectCoords('Polyline [7012]')
const right = collectCoords('Polyline [7011]')

console.log(`Ranh trái [7012]: ${left.length} điểm`)
console.log(`Ranh phải [7011]: ${right.length} điểm`)

// Sắp xếp cả 2 theo latitude (Bắc → Nam)
left.sort((a, b) => b[1] - a[1])
right.sort((a, b) => b[1] - a[1])

console.log(`Left: lat ${left[0][1].toFixed(4)}→${left[left.length-1][1].toFixed(4)}`)
console.log(`Right: lat ${right[0][1].toFixed(4)}→${right[right.length-1][1].toFixed(4)}`)

// Tính centerline: chia thành N khoảng theo latitude, tìm trung bình lon ở mỗi khoảng
const minLat = Math.max(left[left.length-1][1], right[right.length-1][1])
const maxLat = Math.min(left[0][1], right[0][1])
const STEP = 0.002 // ~220m per step

function avgLonAtLat(coords, targetLat, tolerance) {
  const nearby = coords.filter(([, lat]) => Math.abs(lat - targetLat) < tolerance)
  if (nearby.length === 0) return null
  const avgLon = nearby.reduce((s, [lon]) => s + lon, 0) / nearby.length
  const avgLat = nearby.reduce((s, [, lat]) => s + lat, 0) / nearby.length
  return [avgLon, avgLat]
}

const centerline = []
for (let lat = maxLat; lat >= minLat; lat -= STEP) {
  const lp = avgLonAtLat(left, lat, STEP * 1.5)
  const rp = avgLonAtLat(right, lat, STEP * 1.5)
  if (lp && rp) {
    centerline.push([(lp[0] + rp[0]) / 2, (lp[1] + rp[1]) / 2])
  } else if (lp) {
    centerline.push(lp)
  } else if (rp) {
    centerline.push(rp)
  }
}

// Loại bỏ điểm trùng/quá gần
const filtered = [centerline[0]]
for (let i = 1; i < centerline.length; i++) {
  const prev = filtered[filtered.length - 1]
  const curr = centerline[i]
  const dist = Math.sqrt((curr[0]-prev[0])**2 + (curr[1]-prev[1])**2)
  if (dist > 0.0005) filtered.push(curr)
}

console.log(`\nCenterline: ${filtered.length} điểm`)
console.log(`  Bắc: ${filtered[0][1].toFixed(5)}, ${filtered[0][0].toFixed(5)}`)
console.log(`  Nam: ${filtered[filtered.length-1][1].toFixed(5)}, ${filtered[filtered.length-1][0].toFixed(5)}`)

// Tính chiều dài
let totalLen = 0
for (let i = 1; i < filtered.length; i++) {
  const [lon1,lat1] = filtered[i-1]
  const [lon2,lat2] = filtered[i]
  const R = 6371000
  const dLat = (lat2-lat1)*Math.PI/180
  const dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  totalLen += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
console.log(`  Tổng chiều dài: ${(totalLen/1000).toFixed(1)} km`)

// Tìm vị trí các mốc quan trọng trên centerline
// Ga Đông Hà: khu vực lat ~16.80-16.82
const dongHaPts = filtered.filter(([,lat]) => lat >= 16.80 && lat <= 16.83)
const dongHa = dongHaPts.length > 0
  ? [dongHaPts.reduce((s,[lon])=>s+lon,0)/dongHaPts.length, dongHaPts.reduce((s,[,lat])=>s+lat,0)/dongHaPts.length]
  : null
console.log(`\n  Ga Đông Hà ước tính: ${dongHa ? formatCoord(dongHa) : 'N/A'}`)

// Vượt sông Thạch Hãn: lat ~16.76-16.79
const thachHanPts = filtered.filter(([,lat]) => lat >= 16.76 && lat <= 16.79)
const thachHan = thachHanPts.length > 0
  ? [thachHanPts.reduce((s,[lon])=>s+lon,0)/thachHanPts.length, thachHanPts.reduce((s,[,lat])=>s+lat,0)/thachHanPts.length]
  : null
console.log(`  Thạch Hãn ước tính: ${thachHan ? formatCoord(thachHan) : 'N/A'}`)

// La Vang: lat ~16.65-16.70
const laVangPts = filtered.filter(([,lat]) => lat >= 16.65 && lat <= 16.70)
const laVang = laVangPts.length > 0
  ? [laVangPts.reduce((s,[lon])=>s+lon,0)/laVangPts.length, laVangPts.reduce((s,[,lat])=>s+lat,0)/laVangPts.length]
  : null
console.log(`  La Vang ước tính: ${laVang ? formatCoord(laVang) : 'N/A'}`)

// Ga Đồng Hới: lat ~17.43-17.47
const dongHoiPts = filtered.filter(([,lat]) => lat >= 17.43 && lat <= 17.47)
const dongHoi = dongHoiPts.length > 0
  ? [dongHoiPts.reduce((s,[lon])=>s+lon,0)/dongHoiPts.length, dongHoiPts.reduce((s,[,lat])=>s+lat,0)/dongHoiPts.length]
  : null
console.log(`  Ga Đồng Hới ước tính: ${dongHoi ? formatCoord(dongHoi) : 'N/A'}`)

function formatCoord(c) { return `[${c[0].toFixed(5)}, ${c[1].toFixed(5)}]` }

// Cập nhật file duong-sat-cao-toc.geojson
const rail = JSON.parse(readFileSync(railPath, 'utf8'))
rail.metadata.note = 'Đường tim tuyến tính từ ranh GPMB thực tế (KMZ Ranh GPMB QuangBinh New.kmz)'
rail.metadata.computedAt = new Date().toISOString()

// Cập nhật tuyến chính
const routeFeature = rail.features.find(f => f.properties.layerType === 'route')
if (routeFeature) {
  routeFeature.geometry.coordinates = filtered.map(([lon, lat]) => [+lon.toFixed(6), +lat.toFixed(6)])
  console.log(`\n✅ Cập nhật tuyến: ${filtered.length} điểm`)
}

// Cập nhật vị trí ga/mốc
for (const f of rail.features) {
  if (f.properties.name === 'Ga Đông Hà' && dongHa) {
    f.geometry.coordinates = [+dongHa[0].toFixed(6), +dongHa[1].toFixed(6)]
    console.log(`✅ Ga Đông Hà → ${formatCoord(dongHa)}`)
  }
  if (f.properties.name === 'Vượt sông Thạch Hãn' && thachHan) {
    f.geometry.coordinates = [+thachHan[0].toFixed(6), +thachHan[1].toFixed(6)]
    console.log(`✅ Thạch Hãn → ${formatCoord(thachHan)}`)
  }
  if (f.properties.name?.includes('La Vang') && laVang) {
    f.geometry.coordinates = [+laVang[0].toFixed(6), +laVang[1].toFixed(6)]
    console.log(`✅ La Vang → ${formatCoord(laVang)}`)
  }
  if (f.properties.name === 'Ga Đồng Hới' && dongHoi) {
    f.geometry.coordinates = [+dongHoi[0].toFixed(6), +dongHoi[1].toFixed(6)]
    console.log(`✅ Ga Đồng Hới → ${formatCoord(dongHoi)}`)
  }
}

writeFileSync(railPath, JSON.stringify(rail, null, 2))
console.log(`\n💾 Đã lưu: ${railPath}`)
