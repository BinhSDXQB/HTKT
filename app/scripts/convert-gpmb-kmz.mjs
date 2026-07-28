/**
 * Chuyển KML ranh GPMB đường sắt cao tốc → GeoJSON
 * và merge vào file tuyến đường chính.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const kmlPath = join(import.meta.dirname, '..', 'tmp-ranh-gpmb.kml')
const mainPath = join(import.meta.dirname, '..', 'public', 'data', 'tuyen-duong-quang-tri.geojson')

const kml = readFileSync(kmlPath, 'utf8')

// Parse từng Placemark → MultiLineString
const placemarks = []
const folderRegex = /<Folder>\s*<name>(Polyline \[[^\]]+\])<\/name>[\s\S]*?<Placemark>([\s\S]*?)<\/Placemark>\s*<\/Folder>/g
let match
while ((match = folderRegex.exec(kml)) !== null) {
  const name = match[1]
  const body = match[2]

  // Lấy tất cả LineString coordinates
  const coordBlocks = []
  const coordRegex = /<coordinates>\s*([\s\S]*?)\s*<\/coordinates>/g
  let cm
  while ((cm = coordRegex.exec(body)) !== null) {
    const pts = cm[1].trim().split(/\s+/).map(p => {
      const [lon, lat] = p.split(',').map(Number)
      return [lon, lat]
    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]))
    if (pts.length >= 2) coordBlocks.push(pts)
  }

  if (coordBlocks.length > 0) {
    placemarks.push({ name, segments: coordBlocks })
  }
}

console.log(`📂 Đọc ${placemarks.length} polyline từ KML`)
for (const p of placemarks) {
  const totalPts = p.segments.reduce((s, seg) => s + seg.length, 0)
  console.log(`   ${p.name}: ${p.segments.length} đoạn, ${totalPts} điểm`)
}

// Nối các segment liền nhau thành polyline dài
function mergeSegments(segments) {
  if (segments.length === 0) return []
  const merged = [[...segments[0]]]
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1]
    const lastPt = last[last.length - 1]
    const firstPt = segments[i][0]
    const dist = Math.sqrt((lastPt[0]-firstPt[0])**2 + (lastPt[1]-firstPt[1])**2)
    if (dist < 0.0001) {
      // Liên tiếp → nối
      last.push(...segments[i].slice(1))
    } else {
      // Gãy → polyline mới
      merged.push([...segments[i]])
    }
  }
  return merged
}

// Tạo features cho GPMB
const gpmbFeatures = []
for (const p of placemarks) {
  const merged = mergeSegments(p.segments)
  for (const line of merged) {
    gpmbFeatures.push({
      type: 'Feature',
      properties: {
        layer: 'gpmb_dstdc',
        name: 'Ranh GPMB ĐSTĐC',
        polyline: p.name,
        description: 'Ranh giới giải phóng mặt bằng đường sắt tốc độ cao Bắc–Nam',
        color: '#dc2626',
      },
      geometry: { type: 'LineString', coordinates: line },
    })
  }
}

console.log(`\n🚄 Tạo ${gpmbFeatures.length} feature GPMB`)

// Tính centerline (trung bình 2 ranh ngoài cùng) ước lượng
const allLats = gpmbFeatures.flatMap(f => f.geometry.coordinates.map(c => c[1]))
const allLons = gpmbFeatures.flatMap(f => f.geometry.coordinates.map(c => c[0]))
console.log(`   Phạm vi: ${Math.min(...allLats).toFixed(4)}→${Math.max(...allLats).toFixed(4)} N`)
console.log(`   Phạm vi: ${Math.min(...allLons).toFixed(4)}→${Math.max(...allLons).toFixed(4)} E`)

// Merge vào file chính
const main = JSON.parse(readFileSync(mainPath, 'utf8'))
// Xóa GPMB cũ nếu có
main.features = main.features.filter(f => f.properties.layer !== 'gpmb_dstdc')
main.features.push(...gpmbFeatures)
main.metadata.totalFeatures = main.features.length
main.metadata.fetchedAt = new Date().toISOString()

writeFileSync(mainPath, JSON.stringify(main))
const sizeMB = (Buffer.byteLength(JSON.stringify(main)) / 1024 / 1024).toFixed(2)
console.log(`\n💾 Cập nhật: ${main.features.length} đối tượng · ${sizeMB} MB`)
