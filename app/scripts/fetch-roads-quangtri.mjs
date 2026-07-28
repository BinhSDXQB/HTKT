/**
 * Tải dữ liệu hạ tầng giao thông tỉnh Quảng Trị (sau sáp nhập, gồm cả QB cũ)
 * từ OpenStreetMap (Overpass API) → GeoJSON cho bản đồ GIS.
 *
 * Bao gồm: đường bộ, đường sắt, sân bay, cảng biển
 *
 * Usage: node scripts/fetch-roads-quangtri.mjs
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Bounding box tỉnh Quảng Trị MỚI sau sáp nhập (gồm cả QB cũ)
// Lat: 16.20 → 18.10, Lon: 105.55 → 107.50
const BBOX = '16.20,105.55,18.10,107.50'

// ═══════════════════════════════════════════════════════════════
// 1) ĐƯỜNG BỘ (roads) — lấy tất cả đường có tên
// ═══════════════════════════════════════════════════════════════
const ROADS_QUERY = `
[out:json][timeout:180];
(
  way["highway"]["name"](${BBOX});
);
out body;
>;
out skel qt;
`

// ═══════════════════════════════════════════════════════════════
// 2) ĐƯỜNG SẮT (railways) — tuyến + ga
// ═══════════════════════════════════════════════════════════════
const RAILWAY_QUERY = `
[out:json][timeout:120];
(
  way["railway"~"rail|narrow_gauge|light_rail"](${BBOX});
  node["railway"="station"](${BBOX});
  node["railway"="halt"](${BBOX});
);
out body;
>;
out skel qt;
`

// ═══════════════════════════════════════════════════════════════
// 3) SÂN BAY (airports/aerodromes)
// ═══════════════════════════════════════════════════════════════
const AIRPORT_QUERY = `
[out:json][timeout:60];
(
  way["aeroway"~"aerodrome|runway|terminal"](${BBOX});
  node["aeroway"~"aerodrome|terminal"](${BBOX});
  relation["aeroway"="aerodrome"](${BBOX});
);
out body;
>;
out skel qt;
`

// ═══════════════════════════════════════════════════════════════
// 4) CẢNG BIỂN (ports/harbours)
// ═══════════════════════════════════════════════════════════════
const PORT_QUERY = `
[out:json][timeout:60];
(
  way["harbour"="yes"](${BBOX});
  way["landuse"="port"](${BBOX});
  way["industrial"="port"](${BBOX});
  node["harbour"="yes"](${BBOX});
  node["amenity"="ferry_terminal"](${BBOX});
  node["man_made"~"pier|quay"](${BBOX});
  way["man_made"~"pier|quay"](${BBOX});
  way["seamark:type"~"harbour|port"](${BBOX});
  node["seamark:type"~"harbour|port"](${BBOX});
);
out body;
>;
out skel qt;
`

const HIGHWAY_TYPES = {
  motorway:       { rank: 1, label: 'Cao tốc',          color: '#dc2626' },
  motorway_link:  { rank: 1, label: 'Nhánh cao tốc',    color: '#dc2626' },
  trunk:          { rank: 2, label: 'Quốc lộ',          color: '#ea580c' },
  trunk_link:     { rank: 2, label: 'Nhánh quốc lộ',    color: '#ea580c' },
  primary:        { rank: 3, label: 'Tỉnh lộ',          color: '#d97706' },
  primary_link:   { rank: 3, label: 'Nhánh tỉnh lộ',    color: '#d97706' },
  secondary:      { rank: 4, label: 'Đường huyện',      color: '#ca8a04' },
  tertiary:       { rank: 5, label: 'Đường liên xã',    color: '#65a30d' },
  residential:    { rank: 6, label: 'Đường dân cư',     color: '#3b82f6' },
  living_street:  { rank: 6, label: 'Đường dân cư',     color: '#3b82f6' },
  unclassified:   { rank: 7, label: 'Đường khác',       color: '#6366f1' },
  service:        { rank: 8, label: 'Đường nội bộ',     color: '#8b5cf6' },
  pedestrian:     { rank: 9, label: 'Đường đi bộ',      color: '#06b6d4' },
  track:          { rank: 10, label: 'Đường mòn',       color: '#78716c' },
}

async function fetchOverpass(label, query) {
  console.log(`\n📡 [${label}] Đang tải...`)
  const body = new URLSearchParams({ data: query.trim() }).toString()
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'HTKT-GIS/1.0',
    },
    body,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error(`   ❌ HTTP ${res.status}: ${txt.slice(0, 200)}`)
    return null
  }
  const data = await res.json()
  console.log(`   ✅ ${data.elements.length} phần tử`)
  return data
}

function parseNodes(elements) {
  const nodes = new Map()
  for (const el of elements) {
    if (el.type === 'node') nodes.set(el.id, { lon: el.lon, lat: el.lat, tags: el.tags || {} })
  }
  return nodes
}

function wayToLineString(way, nodes) {
  const coords = way.nodes.map(nid => {
    const n = nodes.get(nid)
    return n ? [n.lon, n.lat] : null
  }).filter(Boolean)
  return coords.length >= 2 ? coords : null
}

// ─── ĐƯỜNG BỘ ─────────────────────────────────────────────
function processRoads(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  for (const el of data.elements) {
    if (el.type !== 'way') continue
    const coords = wayToLineString(el, nodes)
    if (!coords) continue
    const tags = el.tags || {}
    const hwType = tags.highway || 'unclassified'
    const info = HIGHWAY_TYPES[hwType] || HIGHWAY_TYPES.unclassified
    features.push({
      type: 'Feature',
      properties: {
        layer: 'road', osmId: el.id,
        name: tags.name || '', ref: tags.ref || '',
        highway: hwType, rank: info.rank, label: info.label, color: info.color,
        surface: tags.surface || '', lanes: tags.lanes || '',
        width: tags.width || '', maxspeed: tags.maxspeed || '',
        oneway: tags.oneway || '', lit: tags.lit || '',
        bridge: tags.bridge || '', tunnel: tags.tunnel || '',
      },
      geometry: { type: 'LineString', coordinates: coords },
    })
  }
  features.sort((a, b) => a.properties.rank - b.properties.rank)
  return features
}

// ─── ĐƯỜNG SẮT ────────────────────────────────────────────
function processRailways(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  // Ways (tuyến ray)
  for (const el of data.elements) {
    if (el.type !== 'way') continue
    const coords = wayToLineString(el, nodes)
    if (!coords) continue
    const tags = el.tags || {}
    features.push({
      type: 'Feature',
      properties: {
        layer: 'railway', osmId: el.id,
        name: tags.name || 'Đường sắt', ref: tags.ref || '',
        railway: tags.railway || 'rail',
        usage: tags.usage || '', service: tags.service || '',
        electrified: tags.electrified || '',
        gauge: tags.gauge || '',
        color: '#991b1b',
      },
      geometry: { type: 'LineString', coordinates: coords },
    })
  }
  // Stations (ga)
  for (const el of data.elements) {
    if (el.type !== 'node' || !el.tags) continue
    const tags = el.tags
    if (tags.railway !== 'station' && tags.railway !== 'halt') continue
    features.push({
      type: 'Feature',
      properties: {
        layer: 'railway_station', osmId: el.id,
        name: tags.name || tags['name:vi'] || 'Ga',
        railway: tags.railway,
        operator: tags.operator || '',
        color: '#dc2626',
      },
      geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
    })
  }
  return features
}

// ─── SÂN BAY ──────────────────────────────────────────────
function processAirports(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  // Nodes (điểm sân bay)
  for (const el of data.elements) {
    if (el.type === 'node' && el.tags?.aeroway) {
      features.push({
        type: 'Feature',
        properties: {
          layer: 'airport', osmId: el.id,
          name: el.tags.name || el.tags['name:vi'] || 'Sân bay',
          aeroway: el.tags.aeroway, iata: el.tags.iata || '', icao: el.tags.icao || '',
          color: '#7c3aed',
        },
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
      })
    }
  }
  // Ways (runway, terminal polygons)
  for (const el of data.elements) {
    if (el.type !== 'way') continue
    const tags = el.tags || {}
    if (!tags.aeroway) continue
    const coords = wayToLineString(el, nodes)
    if (!coords) continue
    const isPolygon = el.nodes[0] === el.nodes[el.nodes.length - 1] && coords.length >= 4
    features.push({
      type: 'Feature',
      properties: {
        layer: 'airport', osmId: el.id,
        name: tags.name || tags['name:vi'] || (tags.aeroway === 'runway' ? 'Đường băng' : tags.aeroway),
        aeroway: tags.aeroway, iata: tags.iata || '', icao: tags.icao || '',
        length: tags.length || '', surface: tags.surface || '',
        color: '#7c3aed',
      },
      geometry: isPolygon
        ? { type: 'Polygon', coordinates: [coords] }
        : { type: 'LineString', coordinates: coords },
    })
  }
  return features
}

// ─── CẢNG BIỂN ────────────────────────────────────────────
function processPorts(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  for (const el of data.elements) {
    if (el.type === 'node' && el.tags) {
      const tags = el.tags
      if (tags.harbour || tags['seamark:type'] || tags.amenity === 'ferry_terminal' || tags.man_made === 'pier') {
        features.push({
          type: 'Feature',
          properties: {
            layer: 'port', osmId: el.id,
            name: tags.name || tags['name:vi'] || 'Cảng',
            type: tags.harbour ? 'harbour' : tags['seamark:type'] || tags.amenity || tags.man_made || '',
            color: '#0369a1',
          },
          geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        })
      }
    }
    if (el.type === 'way') {
      const tags = el.tags || {}
      if (!tags.harbour && !tags.landuse?.includes('port') && !tags.industrial?.includes('port') && !tags['seamark:type'] && tags.man_made !== 'pier' && tags.man_made !== 'quay') continue
      const coords = wayToLineString(el, nodes)
      if (!coords) continue
      const isPolygon = el.nodes[0] === el.nodes[el.nodes.length - 1] && coords.length >= 4
      features.push({
        type: 'Feature',
        properties: {
          layer: 'port', osmId: el.id,
          name: tags.name || tags['name:vi'] || 'Cảng',
          type: tags.harbour ? 'harbour' : tags.landuse || tags.industrial || tags['seamark:type'] || tags.man_made || '',
          color: '#0369a1',
        },
        geometry: isPolygon
          ? { type: 'Polygon', coordinates: [coords] }
          : { type: 'LineString', coordinates: coords },
      })
    }
  }
  return features
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' HẠ TẦNG GIAO THÔNG – QUẢNG TRỊ SAU SÁP NHẬP')
  console.log(` Bbox: ${BBOX}`)
  console.log('═══════════════════════════════════════════════════════')

  // Tải tuần tự để không quá tải Overpass
  const roadsData = await fetchOverpass('ĐƯỜNG BỘ', ROADS_QUERY)
  await sleep(2000)
  const railData = await fetchOverpass('ĐƯỜNG SẮT', RAILWAY_QUERY)
  await sleep(2000)
  const airData = await fetchOverpass('SÂN BAY', AIRPORT_QUERY)
  await sleep(2000)
  const portData = await fetchOverpass('CẢNG BIỂN', PORT_QUERY)

  const allFeatures = []

  if (roadsData) {
    const roads = processRoads(roadsData)
    allFeatures.push(...roads)
    console.log(`\n🛣️  Đường bộ: ${roads.length} tuyến`)
    const stats = {}
    for (const f of roads) { stats[f.properties.label] = (stats[f.properties.label] || 0) + 1 }
    for (const [l, c] of Object.entries(stats).sort((a, b) => b[1] - a[1])) console.log(`   ${l}: ${c}`)
  }
  if (railData) {
    const rails = processRailways(railData)
    allFeatures.push(...rails)
    const lines = rails.filter(f => f.properties.layer === 'railway').length
    const stations = rails.filter(f => f.properties.layer === 'railway_station').length
    console.log(`\n🚂 Đường sắt: ${lines} tuyến, ${stations} ga`)
  }
  if (airData) {
    const airports = processAirports(airData)
    allFeatures.push(...airports)
    console.log(`\n✈️  Sân bay: ${airports.length} đối tượng`)
    airports.filter(f => f.properties.aeroway === 'aerodrome').forEach(a =>
      console.log(`   ${a.properties.name} ${a.properties.iata ? `(${a.properties.iata})` : ''}`)
    )
  }
  if (portData) {
    const ports = processPorts(portData)
    allFeatures.push(...ports)
    console.log(`\n⚓ Cảng biển: ${ports.length} đối tượng`)
    ports.filter(f => f.geometry.type === 'Point').forEach(p =>
      console.log(`   ${p.properties.name}`)
    )
  }

  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap via Overpass API',
      area: 'Tỉnh Quảng Trị (sau sáp nhập, gồm cả QB cũ)',
      bbox: BBOX,
      fetchedAt: new Date().toISOString(),
      totalFeatures: allFeatures.length,
    },
    features: allFeatures,
  }

  const fs = await import('fs')
  const path = await import('path')
  const outPath = path.join(import.meta.dirname, '..', 'public', 'data', 'tuyen-duong-quang-tri.geojson')
  fs.writeFileSync(outPath, JSON.stringify(geojson))
  const sizeMB = (Buffer.byteLength(JSON.stringify(geojson)) / 1024 / 1024).toFixed(2)
  console.log(`\n═══════════════════════════════════════════════════════`)
  console.log(`💾 Đã lưu: ${outPath}`)
  console.log(`   ${allFeatures.length} đối tượng · ${sizeMB} MB`)
  console.log('═══════════════════════════════════════════════════════')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

main().catch(err => {
  console.error('❌ Lỗi:', err.message)
  process.exit(1)
})
