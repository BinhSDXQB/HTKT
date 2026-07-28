/**
 * Tải bổ sung sân bay + cảng biển cho Quảng Trị (sau sáp nhập)
 * và merge vào file GeoJSON chính.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const BBOX = '16.20,105.55,18.10,107.50'

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

async function fetchOverpass(label, query) {
  console.log(`📡 [${label}] Đang tải...`)
  const body = new URLSearchParams({ data: query.trim() }).toString()
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'HTKT-GIS/1.0' },
    body,
  })
  if (!res.ok) {
    console.error(`   ❌ HTTP ${res.status}`)
    return null
  }
  const data = await res.json()
  console.log(`   ✅ ${data.elements.length} phần tử`)
  return data
}

function parseNodes(elements) {
  const m = new Map()
  for (const el of elements) if (el.type === 'node') m.set(el.id, { lon: el.lon, lat: el.lat, tags: el.tags || {} })
  return m
}

function wayCoords(way, nodes) {
  const c = way.nodes.map(n => { const nd = nodes.get(n); return nd ? [nd.lon, nd.lat] : null }).filter(Boolean)
  return c.length >= 2 ? c : null
}

function processAirports(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  for (const el of data.elements) {
    if (el.type === 'node' && el.tags?.aeroway) {
      features.push({
        type: 'Feature',
        properties: { layer: 'airport', osmId: el.id, name: el.tags.name || 'Sân bay', aeroway: el.tags.aeroway, iata: el.tags.iata || '', icao: el.tags.icao || '', color: '#7c3aed' },
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
      })
    }
    if (el.type === 'way') {
      const tags = el.tags || {}
      if (!tags.aeroway) continue
      const coords = wayCoords(el, nodes)
      if (!coords) continue
      const poly = el.nodes[0] === el.nodes[el.nodes.length - 1] && coords.length >= 4
      features.push({
        type: 'Feature',
        properties: { layer: 'airport', osmId: el.id, name: tags.name || (tags.aeroway === 'runway' ? 'Đường băng' : tags.aeroway), aeroway: tags.aeroway, iata: tags.iata || '', icao: tags.icao || '', length: tags.length || '', surface: tags.surface || '', color: '#7c3aed' },
        geometry: poly ? { type: 'Polygon', coordinates: [coords] } : { type: 'LineString', coordinates: coords },
      })
    }
  }
  return features
}

function processPorts(data) {
  const nodes = parseNodes(data.elements)
  const features = []
  for (const el of data.elements) {
    if (el.type === 'node' && el.tags) {
      const t = el.tags
      if (t.harbour || t['seamark:type'] || t.amenity === 'ferry_terminal' || t.man_made === 'pier') {
        features.push({
          type: 'Feature',
          properties: { layer: 'port', osmId: el.id, name: t.name || 'Cảng', type: t.harbour ? 'harbour' : t['seamark:type'] || t.amenity || t.man_made || '', color: '#0369a1' },
          geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        })
      }
    }
    if (el.type === 'way') {
      const t = el.tags || {}
      if (!t.harbour && !t.landuse?.includes('port') && !t.industrial?.includes('port') && !t['seamark:type'] && t.man_made !== 'pier' && t.man_made !== 'quay') continue
      const coords = wayCoords(el, nodes)
      if (!coords) continue
      const poly = el.nodes[0] === el.nodes[el.nodes.length - 1] && coords.length >= 4
      features.push({
        type: 'Feature',
        properties: { layer: 'port', osmId: el.id, name: t.name || 'Cảng', type: t.harbour ? 'harbour' : t.landuse || t.industrial || t['seamark:type'] || t.man_made || '', color: '#0369a1' },
        geometry: poly ? { type: 'Polygon', coordinates: [coords] } : { type: 'LineString', coordinates: coords },
      })
    }
  }
  return features
}

async function main() {
  const fs = await import('fs')
  const path = await import('path')
  const mainPath = path.join(import.meta.dirname, '..', 'public', 'data', 'tuyen-duong-quang-tri.geojson')

  const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'))
  console.log(`📂 File hiện có: ${main.features.length} đối tượng`)

  const airData = await fetchOverpass('SÂN BAY', AIRPORT_QUERY)
  console.log('   Chờ 5s...')
  await new Promise(r => setTimeout(r, 5000))
  const portData = await fetchOverpass('CẢNG BIỂN', PORT_QUERY)

  if (airData) {
    const airports = processAirports(airData)
    main.features.push(...airports)
    console.log(`✈️  Sân bay: ${airports.length} đối tượng`)
    airports.filter(f => f.properties.aeroway === 'aerodrome').forEach(a => console.log(`   ${a.properties.name} ${a.properties.iata ? `(${a.properties.iata})` : ''}`))
  }
  if (portData) {
    const ports = processPorts(portData)
    main.features.push(...ports)
    console.log(`⚓ Cảng biển: ${ports.length} đối tượng`)
    ports.forEach(p => console.log(`   ${p.properties.name} [${p.properties.type}]`))
  }

  main.metadata.totalFeatures = main.features.length
  main.metadata.fetchedAt = new Date().toISOString()
  fs.writeFileSync(mainPath, JSON.stringify(main))
  const sizeMB = (Buffer.byteLength(JSON.stringify(main)) / 1024 / 1024).toFixed(2)
  console.log(`\n💾 Cập nhật: ${main.features.length} đối tượng · ${sizeMB} MB`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
