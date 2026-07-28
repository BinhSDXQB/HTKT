// Dựng ảnh PNG preview lớp tuyến đường + ranh tỉnh để kiểm tra bằng mắt (không cần trình duyệt)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data')
const OUT_DIR = path.resolve(import.meta.dirname, '..', '..', 'preview-gis')
fs.mkdirSync(OUT_DIR, { recursive: true })

const roads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tuyen-duong-quang-tri.geojson'), 'utf8'))
const prov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'quang-tri-province-boundary.geojson'), 'utf8'))

const provRings = []
for (const f of prov.features ?? [prov]) {
  const g = f.geometry ?? f
  if (g.type === 'Polygon') provRings.push(g.coordinates[0])
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) provRings.push(p[0])
}

// Độ rộng nét theo loại đường (px ở mức toàn tỉnh; nhân scale khi zoom)
const WIDTH_BY_LABEL = {
  'Cao tốc': 2.2, 'Nhánh cao tốc': 1.6, 'Quốc lộ': 1.8, 'Nhánh quốc lộ': 1.2,
  'Tỉnh lộ': 1.3, 'Đường huyện': 1.0, 'Đường liên xã': 0.8,
  'Đường dân cư': 0.6, 'Đường khác': 0.5, 'Đường nội bộ': 0.5, 'Đường mòn': 0.4,
}

function render(view) {
  const { name, bbox, W, strokeScale = 1, includeLayers } = view
  const [minLng, minLat, maxLng, maxLat] = bbox
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180)
  const H = Math.round(W * ((maxLat - minLat) / ((maxLng - minLng) * kx)))
  const X = (lng) => ((lng - minLng) / (maxLng - minLng)) * W
  const Y = (lat) => H - ((lat - minLat) / (maxLat - minLat)) * H

  const toPath = (coords) => 'M' + coords.map(([lng, lat]) => `${X(lng).toFixed(1)} ${Y(lat).toFixed(1)}`).join('L')

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#f8fafc"/>`
  // Nền tỉnh + ranh giới
  for (const ring of provRings) {
    svg += `<path d="${toPath(ring)}Z" fill="#eef6ee" stroke="#1e3a8a" stroke-width="${2 * strokeScale}" stroke-dasharray="${8 * strokeScale} ${4 * strokeScale}"/>`
  }
  // Tuyến đường (vẽ đường nhỏ trước, đường lớn đè lên)
  const feats = roads.features
    .filter(f => (f.properties?.layer === 'road') && (!includeLayers || includeLayers.includes(f.properties?.label)))
    .filter(f => f.geometry?.type === 'LineString')
    .filter(f => f.geometry.coordinates.some(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat))
    .sort((a, b) => (WIDTH_BY_LABEL[a.properties.label] ?? 0.5) - (WIDTH_BY_LABEL[b.properties.label] ?? 0.5))
  for (const f of feats) {
    const w = (WIDTH_BY_LABEL[f.properties.label] ?? 0.5) * strokeScale
    svg += `<path d="${toPath(f.geometry.coordinates)}" fill="none" stroke="${f.properties.color || '#64748b'}" stroke-width="${w}" stroke-linecap="round"/>`
  }
  svg += `<text x="12" y="${H - 12}" font-family="sans-serif" font-size="${16 * Math.max(1, strokeScale / 2)}" fill="#334155">${name} · ${feats.length} tuyến</text></svg>`

  const out = path.join(OUT_DIR, `${name.replace(/[^a-z0-9-]/gi, '-')}.png`)
  return sharp(Buffer.from(svg)).png().toFile(out).then(() => console.log(`✅ ${out} (${feats.length} tuyến, ${W}x${H})`))
}

await render({ name: 'toan-tinh', bbox: [105.55, 16.25, 107.55, 18.15], W: 1400 })
await render({ name: 'zoom-dong-ha', bbox: [107.03, 16.77, 107.14, 16.85], W: 1400, strokeScale: 3 })
await render({ name: 'zoom-dong-hoi', bbox: [106.56, 17.42, 106.67, 17.50], W: 1400, strokeScale: 3 })
await render({ name: 'zoom-ngo-hem-dong-ha', bbox: [107.075, 16.800, 107.105, 16.825], W: 1400, strokeScale: 6 })
