'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DOMAIN_LABEL } from '@/lib/constants/tai-san'
import { ASSET_TYPE_SPECS } from '@/lib/tech-specs/config'

const DOMAIN_COLORS: Record<string, string> = {
  GIAO_THONG:  '#3b82f6',
  CAP_NUOC:    '#06b6d4',
  THOAT_NUOC:  '#6366f1',
  CHIEU_SANG:  '#eab308',
  CAY_XANH:    '#22c55e',
  MOI_TRUONG:  '#14b8a6',
  CHINH_TRANG: '#a855f7',
}

const SURFACE_VI: Record<string, string> = {
  asphalt: 'Bê tông nhựa (asphalt)',
  concrete: 'Bê tông xi măng',
  'concrete:plates': 'Tấm bê tông lắp ghép',
  paved: 'Đường trải nhựa',
  gravel: 'Đường đá dăm/sỏi',
  dirt: 'Đường đất',
  unpaved: 'Đường chưa trải nhựa',
  ground: 'Đường đất tự nhiên',
  wood: 'Đường lát gỗ',
  sand: 'Đường cát',
  compacted: 'Đường đất đầm nén',
  metal: 'Tấm thép',
  paving_stones: 'Gạch block/đá lát',
}

function haversineLength(coords: [number, number][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return total
}

function formatCoord(lon: number, lat: number): string {
  const latDir = lat >= 0 ? 'B' : 'N'
  const lonDir = lon >= 0 ? 'Đ' : 'T'
  return `${Math.abs(lat).toFixed(5)}°${latDir}  ${Math.abs(lon).toFixed(5)}°${lonDir}`
}

function formatLength(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}

const CONDITION_COLORS: Record<string, string> = {
  TOT:        '#22c55e',
  KHA:        '#3b82f6',
  TRUNG_BINH: '#eab308',
  XAU:        '#f97316',
  HONG:       '#ef4444',
}

type WardStreet = { id: string; name: string; lengthKm: number | null }
type WardData = { id: string; name: string; code: string; lat: number; lon: number; streetCount: number; streets: WardStreet[] }

type MapProps = {
  domain?: string
  assetTypeId?: string
  centerLat?: number
  centerLng?: number
  zoom?: number
}

function renderTechSpecs(typeCode: string, specs: Record<string, unknown>): string {
  const config = ASSET_TYPE_SPECS[typeCode]
  if (!config || !specs || Object.keys(specs).length === 0) return ''
  const rows = config.fields
    .filter((f) => specs[f.key] != null && specs[f.key] !== '')
    .map((f) => {
      let val = String(specs[f.key])
      if (f.type === 'boolean') val = specs[f.key] ? 'Có' : 'Không'
      if (f.type === 'select' && f.options) {
        val = f.options.find((o) => o.value === specs[f.key])?.label ?? val
      }
      return `<tr><td style="color:#64748b;padding:1px 8px 1px 0;font-size:11px;">${f.label}${f.unit ? ` (${f.unit})` : ''}</td><td style="font-weight:600;font-size:11px;">${val}</td></tr>`
    })
    .join('')
  if (!rows) return ''
  return `<table style="border-collapse:collapse;margin-top:6px;">${rows}</table>`
}

// ── CRS & SPATIAL HELPERS FOR GIS IMPORT & RAIL IMPACT ANALYSIS ──
function toDegrees(radians: number) { return (radians * 180) / Math.PI }

function inverseWebMercator(x: number, y: number): [number, number] {
  const radius = 6378137
  const lon = toDegrees(x / radius)
  const lat = toDegrees(2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2)
  return [lon, lat]
}

function inverseTransverseMercator(x: number, y: number, options: { lon0: number; k0: number; x0: number; y0: number }): [number, number] {
  const a = 6378137
  const f = 1 / 298.257223563
  const e2 = 2 * f - f * f
  const ePrime2 = e2 / (1 - e2)
  const x0 = options.x0 ?? 500000
  const y0 = options.y0 ?? 0
  const k0 = options.k0 ?? 0.9999
  const lon0 = (options.lon0 * Math.PI) / 180
  const m = (y - y0) / k0
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256))
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const fp =
    mu +
    (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)

  const sinFp = Math.sin(fp)
  const cosFp = Math.cos(fp)
  const tanFp = Math.tan(fp)
  const c1 = ePrime2 * cosFp ** 2
  const t1 = tanFp ** 2
  const n1 = a / Math.sqrt(1 - e2 * sinFp ** 2)
  const r1 = (a * (1 - e2)) / (1 - e2 * sinFp ** 2) ** 1.5
  const d = (x - x0) / (n1 * k0)

  const lat =
    fp -
    (n1 * tanFp) /
      r1 *
      (d ** 2 / 2 -
        (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ePrime2) * d ** 4 / 24 +
        (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ePrime2 - 3 * c1 ** 2) *
          d ** 6 /
          720)
  const lon =
    lon0 +
    (d -
      (1 + 2 * t1 + c1) * d ** 3 / 6 +
      (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ePrime2 + 24 * t1 ** 2) *
        d ** 5 /
        120) /
      cosFp

  return [toDegrees(lon), toDegrees(lat)]
}

function convertPairToWgs84(coordinate: [number, number], sourceCrs: string): [number, number] {
  const x = Number(coordinate[0])
  const y = Number(coordinate[1])
  if (sourceCrs === 'EPSG:4326') return [x, y]
  if (sourceCrs === 'EPSG:3857') return inverseWebMercator(x, y)
  if (sourceCrs === 'VN2000_QUANGTRI_TM3') {
    return inverseTransverseMercator(x, y, {
      lon0: 106.25,
      k0: 0.9999,
      x0: 500000,
      y0: 0,
    })
  }
  return [x, y]
}

function getFirstCoordinate(geometry: any): [number, number] | null {
  if (!geometry) return null
  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries || []) {
      const coord = getFirstCoordinate(child)
      if (coord) return coord
    }
    return null
  }
  let coordinates = geometry.coordinates
  while (Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
    coordinates = coordinates[0]
  }
  return Array.isArray(coordinates) && coordinates.length >= 2 ? [coordinates[0], coordinates[1]] : null
}

function detectCrs(geojson: any): string {
  if (geojson.crs?.properties?.name || geojson.crs?.name) {
    const declared = String(geojson.crs?.properties?.name || geojson.crs?.name).toUpperCase()
    if (declared.includes('4326') || declared.includes('WGS84') || declared.includes('WGS 84')) {
      return 'EPSG:4326'
    }
    if (declared.includes('3857') || declared.includes('WEB MERCATOR')) {
      return 'EPSG:3857'
    }
  }
  let coordinate: [number, number] | null = null
  if (geojson.type === 'FeatureCollection') {
    for (const f of geojson.features || []) {
      coordinate = getFirstCoordinate(f.geometry)
      if (coordinate) break
    }
  } else if (geojson.type === 'Feature') {
    coordinate = getFirstCoordinate(geojson.geometry)
  } else {
    coordinate = getFirstCoordinate(geojson)
  }

  if (!coordinate) return 'EPSG:4326'
  const [x, y] = coordinate.map(Number)
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return 'EPSG:4326'
  }
  if (Math.abs(x) <= 20037508 && Math.abs(y) <= 20037508 && Math.abs(x) > 1000000) {
    return 'EPSG:3857'
  }
  return 'VN2000_QUANGTRI_TM3'
}

function transformCoordinates(coordinates: any, sourceCrs: string): any {
  if (!Array.isArray(coordinates)) return coordinates
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    return convertPairToWgs84([coordinates[0], coordinates[1]], sourceCrs)
  }
  return coordinates.map((item) => transformCoordinates(item, sourceCrs))
}

function transformGeometryToWgs84(geometry: any, sourceCrs: string): any {
  if (!geometry) return geometry
  if (geometry.type === 'GeometryCollection') {
    return {
      ...geometry,
      geometries: geometry.geometries.map((child: any) =>
        transformGeometryToWgs84(child, sourceCrs)
      )
    }
  }
  return {
    ...geometry,
    coordinates: transformCoordinates(geometry.coordinates, sourceCrs)
  }
}

function toFeatureCollection(geojson: any): any {
  if (!geojson) return { type: 'FeatureCollection', features: [] }
  if (geojson.type === 'FeatureCollection') return geojson
  if (geojson.type === 'Feature') return { type: 'FeatureCollection', features: [geojson] }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: geojson }] }
}

function pointInRing(point: [number, number], ring: [number, number][]): boolean {
  let inside = false
  const [lng, lat] = point
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i++) {
    const [lngI, latI] = ring[i]
    const [lngJ, latJ] = ring[j]
    const intersects =
      (latI > lat) !== (latJ > lat) &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI || Number.EPSILON) + lngI
    if (intersects) inside = !inside
  }
  return inside
}

function pointInPolygon(point: [number, number], polygon: [number, number][][]): boolean {
  if (!polygon?.length || !pointInRing(point, polygon[0])) return false
  return !polygon.slice(1).some((hole) => pointInRing(point, hole))
}

function geometryContainsLatLng(geometry: any, latlng: { lat: number; lng: number }): boolean {
  if (!geometry) return false
  const point: [number, number] = [latlng.lng, latlng.lat]
  if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates)
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon: any) => pointInPolygon(point, polygon))
  }
  return false
}

function extractLineStrings(geometry: any): [number, number][][] {
  if (!geometry) return []
  if (geometry.type === 'LineString') return [geometry.coordinates]
  if (geometry.type === 'MultiLineString') return geometry.coordinates
  if (geometry.type === 'Polygon') return geometry.coordinates.slice(0, 1)
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((polygon: any) => polygon[0]).filter(Boolean)
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(extractLineStrings)
  return []
}

function extractPolygonRings(geometry: any): [number, number][][] {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return geometry.coordinates.slice(0, 1)
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((polygon: any) => polygon[0]).filter(Boolean)
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(extractPolygonRings)
  return []
}

function ringAreaSquareMeters(ring: [number, number][]): number {
  if (!ring?.length) return 0
  const radius = 6371008.8
  const meanLat = (ring.reduce((sum, coord) => sum + coord[1], 0) / ring.length) * Math.PI / 180
  const projected = ring.map(([lng, lat]) => [
    radius * (lng * Math.PI / 180) * Math.cos(meanLat),
    radius * (lat * Math.PI / 180),
  ])
  let area = 0
  for (let i = 0, j = projected.length - 1; i < projected.length; j = i, i += 1) {
    area += projected[j][0] * projected[i][1] - projected[i][0] * projected[j][1]
  }
  return Math.abs(area / 2)
}

export function MapClient({ domain, assetTypeId, centerLat = 17.10, centerLng = 106.85, zoom = 8 }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)
  const wardMarkers = useRef<maplibregl.Marker[]>([])

  // Các state cho tính năng nâng cấp GIS từ Bando_QT
  const [showBoundaries, setShowBoundaries] = useState(false)
  const [hoveredCommune, setHoveredCommune] = useState<any>(null)
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null)
  // Toạ độ con trỏ ghi thẳng vào DOM (ref) — tránh re-render toàn component 60 lần/giây khi di chuột
  const cursorCoordRef = useRef<HTMLSpanElement>(null)
  const hoverCodeRef = useRef<string>('')
  const [importCrs, setImportCrs] = useState<string>('auto')
  const [customProj4, setCustomProj4] = useState<string>('')
  const [detectedCrsInfo, setDetectedCrsInfo] = useState<string>('')
  const [showRailImpact, setShowRailImpact] = useState(false)
  const [railCorridorWidth, setRailCorridorWidth] = useState<number>(60)
  const [railImpactRows, setRailImpactRows] = useState<any[] | null>(null)
  const [railImpactSummary, setRailImpactSummary] = useState<string>('')
  const [customRailFile, setCustomRailFile] = useState<any>(null)
  const [customResettlementFile, setCustomResettlementFile] = useState<any>(null)
  const [resettlementStatusText, setResettlementStatusText] = useState<string>('Chưa nạp')
  const [railFileLoading, setRailFileLoading] = useState(false)
  const [resetFileLoading, setResetFileLoading] = useState(false)
  const [boundariesLoaded, setBoundariesLoaded] = useState(false)
  const adminBoundariesData = useRef<any>(null)
  const boundariesPromise = useRef<Promise<void> | null>(null)
  const infraGeojsonRef = useRef<any>(null)
  const railRunIdRef = useRef(0)

  // true khi style bản đồ đã sẵn sàng (sự kiện 'load' đã bắn) — KHÔNG dùng m.loaded():
  // hàm đó trả false suốt lúc đang tải tile nền nên nuốt mất cú bấm toggle đầu tiên
  const [mapReady, setMapReady] = useState(false)
  const [showRailway, setShowRailway] = useState(true)
  const [showRoads, setShowRoads] = useState(false)
  // Lớp con đường bộ (chỉ hiển thị khi showRoads=true)
  const [roadSub, setRoadSub] = useState<Record<string, boolean>>({
    caotoc: true, quoclo: true, hcm: true, tinhlodthuyen: true, lienxa: true, dancu: false, khac: false,
  })
  const [showRail, setShowRail] = useState(false)
  const [showAirport, setShowAirport] = useState(false)
  const [showPort, setShowPort] = useState(false)
  const [showGpmb, setShowGpmb] = useState(false)
  const [roadCount, setRoadCount] = useState(0)
  const [infraLoaded, setInfraLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assetCount, setAssetCount] = useState(0)
  const [selectedDomain, setSelectedDomain] = useState(domain ?? '')

  const [isZoomedOut, setIsZoomedOut] = useState(zoom < 10)
  const selectedDomainRef = useRef(domain ?? '')
  const hasFetchedAssetsRef = useRef(false)

  useEffect(() => {
    selectedDomainRef.current = selectedDomain
  }, [selectedDomain])

  const [showStreets, setShowStreets] = useState(false)
  const [wardsData, setWardsData] = useState<WardData[]>([])
  const [streetSearch, setStreetSearch] = useState('')
  const [expandedWard, setExpandedWard] = useState<string | null>(null)
  const [loadingStreets, setLoadingStreets] = useState(false)

  // Tìm kiếm tuyến đường trên bản đồ
  const [roadSearch, setRoadSearch] = useState('')
  const [roadResults, setRoadResults] = useState<{ name: string; ref: string; coords: [number, number][]; label: string; color: string }[]>([])
  const [showRoadSearch, setShowRoadSearch] = useState(false)

  // Import file GIS/DXF/KML
  const [showImport, setShowImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importInfo, setImportInfo] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)
  const importLayerIds = useRef<string[]>([])

  // Import ảnh GPS
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoInfo, setPhotoInfo] = useState('')
  const [photoError, setPhotoError] = useState('')
  const photoFileRef = useRef<HTMLInputElement>(null)
  const photoLayerIds = useRef<string[]>([])

  const loadHighSpeedRail = useCallback(async (m: maplibregl.Map) => {
    try {
      const res = await fetch('/data/duong-sat-cao-toc.geojson')
      const geojson = await res.json()

      if (m.getSource('high-speed-rail')) return

      m.addSource('high-speed-rail', { type: 'geojson', data: geojson })

      // Tim tuyến đã xoá — chỉ dùng ranh GPMB thực tế (lớp gpmb_dstdc trong infra-qt)
      // Ga chính (Đông Hà)
      m.addLayer({
        id: 'rail-stations', type: 'circle', source: 'high-speed-rail',
        filter: ['all', ['==', ['get', 'layerType'], 'station'], ['==', ['get', 'icon'], 'station']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 7, 14, 14],
          'circle-color': '#dc2626',
          'circle-stroke-width': 3, 'circle-stroke-color': '#fff',
        },
      })

      m.addLayer({
        id: 'rail-station-labels', type: 'symbol', source: 'high-speed-rail',
        filter: ['all', ['==', ['get', 'layerType'], 'station'], ['==', ['get', 'icon'], 'station']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#991b1b', 'text-halo-color': '#fff', 'text-halo-width': 2 },
      })

      // Ga tỉnh lân cận (nhỏ hơn)
      m.addLayer({
        id: 'rail-stations-neighbor', type: 'circle', source: 'high-speed-rail',
        filter: ['all', ['==', ['get', 'layerType'], 'station'], ['==', ['get', 'icon'], 'station-neighbor']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8],
          'circle-color': '#f87171',
          'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
        },
      })

      m.addLayer({
        id: 'rail-neighbor-labels', type: 'symbol', source: 'high-speed-rail',
        filter: ['all', ['==', ['get', 'layerType'], 'station'], ['==', ['get', 'icon'], 'station-neighbor']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#b91c1c', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
      })

      // Landmark (cầu sông, La Vang)
      m.addLayer({
        id: 'rail-landmarks', type: 'circle', source: 'high-speed-rail',
        filter: ['==', ['get', 'layerType'], 'landmark'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 7],
          'circle-color': '#fbbf24',
          'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
        },
      })

      m.addLayer({
        id: 'rail-landmark-labels', type: 'symbol', source: 'high-speed-rail',
        filter: ['==', ['get', 'layerType'], 'landmark'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#92400e', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
        minzoom: 10,
      })

      // Popup click cho ga + landmark
      const railClickLayers = ['rail-stations', 'rail-stations-neighbor', 'rail-landmarks']
      railClickLayers.forEach(layerId => {
        m.on('click', layerId, (e) => {
          const f = e.features?.[0]
          if (!f) return
          const p = f.properties as Record<string, string>
          const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
          const rows = Object.entries(p)
            .filter(([k]) => !['layerType', 'icon'].includes(k) && k !== 'name')
            .map(([k, v]) => {
              const labels: Record<string, string> = { loai: 'Loại', viTri: 'Vị trí', tinh: 'Tỉnh', trangThai: 'Trạng thái', description: 'Mô tả', tocDoThietKe: 'Tốc độ', khoRay: 'Khổ ray', duKienKhoiCong: 'Dự kiến khởi công' }
              return `<tr><td style="color:#64748b;padding:1px 8px 1px 0;font-size:11px">${labels[k] ?? k}</td><td style="font-weight:600;font-size:11px">${v}</td></tr>`
            }).join('')
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '320px' })
            .setLngLat(coords as [number, number])
            .setHTML(`
              <div style="font-family:system-ui,sans-serif;padding:4px 0">
                <div style="font-weight:700;font-size:14px;color:#991b1b;margin-bottom:4px">🚄 ${p.name}</div>
                <table style="border-collapse:collapse">${rows}</table>
              </div>
            `)
            .addTo(m)
        })
        m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = '' })
      })
    } catch { /* GeoJSON not found — skip */ }
  }, [])

  // Load toàn bộ hạ tầng giao thông (1 file GeoJSON, nhiều layer)
  const loadInfra = useCallback(async (m: maplibregl.Map) => {
    try {
      if (m.getSource('infra-qt')) return
      const res = await fetch('/data/tuyen-duong-quang-tri.geojson')
      const geojson = await res.json()
      infraGeojsonRef.current = geojson
      setRoadCount(geojson.features?.filter((f: { properties: { layer: string } }) => f.properties.layer === 'road').length ?? 0)
      setInfraLoaded(true)

      m.addSource('infra-qt', { type: 'geojson', data: geojson })

      // ── ĐƯỜNG BỘ (tách lớp) ────────────────────────────
      // Định nghĩa lớp con: key → filter trên field 'label' + 'ref'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type F = any // MapLibre filter — runtime-only, bypass strict generics
      const ROAD_SUB_DEFS: { key: string; filter: F; color: string; width: [number, number, number] }[] = [
        { key: 'caotoc',  filter: ['any', ['==', ['get', 'label'], 'Cao tốc'], ['==', ['get', 'label'], 'Nhánh cao tốc']], color: '#dc2626', width: [3, 5, 8] },
        { key: 'quoclo',  filter: ['all', ['any', ['==', ['get', 'label'], 'Quốc lộ'], ['==', ['get', 'label'], 'Nhánh quốc lộ']], ['!', ['in', 'HCM', ['get', 'ref']]]], color: '#ea580c', width: [2, 4, 7] },
        { key: 'hcm',     filter: ['all', ['==', ['get', 'layer'], 'road'], ['in', 'HCM', ['get', 'ref']]], color: '#16a34a', width: [2.5, 4.5, 7] },
        { key: 'tinhlodthuyen', filter: ['any', ['==', ['get', 'label'], 'Tỉnh lộ'], ['==', ['get', 'label'], 'Nhánh tỉnh lộ'], ['==', ['get', 'label'], 'Đường huyện']], color: '#d97706', width: [1.2, 3, 5] },
        { key: 'lienxa',  filter: ['==', ['get', 'label'], 'Đường liên xã'], color: '#65a30d', width: [0.8, 2, 3.5] },
        { key: 'dancu',   filter: ['==', ['get', 'label'], 'Đường dân cư'], color: '#3b82f6', width: [0.5, 1.5, 3] },
        { key: 'khac',    filter: ['any', ['==', ['get', 'label'], 'Đường khác'], ['==', ['get', 'label'], 'Đường nội bộ'], ['==', ['get', 'label'], 'Đường mòn']], color: '#6366f1', width: [0.4, 1, 2] },
      ]

      for (const sub of ROAD_SUB_DEFS) {
        const baseFilter: F = ['all', ['==', ['get', 'layer'], 'road'], sub.filter]
        const refFilter: F = ['all', ['==', ['get', 'layer'], 'road'], sub.filter, ['has', 'ref'], ['!=', ['get', 'ref'], '']]
        const nameFilter: F = ['all', ['==', ['get', 'layer'], 'road'], sub.filter, ['!=', ['get', 'name'], '']]

        m.addLayer({
          id: `road-${sub.key}-casing`, type: 'line', source: 'infra-qt',
          filter: baseFilter,
          paint: { 'line-color': '#fff', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, sub.width[0]+1, 12, sub.width[1]+2, 16, sub.width[2]+2], 'line-opacity': 0.7 },
          layout: { visibility: 'none' },
        })
        m.addLayer({
          id: `road-${sub.key}-line`, type: 'line', source: 'infra-qt',
          filter: baseFilter,
          paint: {
            'line-color': sub.color,
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, sub.width[0], 12, sub.width[1], 16, sub.width[2]],
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.7, 14, 0.9],
          },
          layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
        })
        m.addLayer({
          id: `road-${sub.key}-ref`, type: 'symbol', source: 'infra-qt',
          filter: refFilter,
          layout: { visibility: 'none', 'symbol-placement': 'line', 'text-field': ['get', 'ref'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9, 14, 12], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-offset': [0, -0.8], 'text-max-angle': 25, 'symbol-spacing': 300 },
          paint: { 'text-color': '#1e293b', 'text-halo-color': '#fff', 'text-halo-width': 2 },
          minzoom: 9,
        })
        m.addLayer({
          id: `road-${sub.key}-name`, type: 'symbol', source: 'infra-qt',
          filter: nameFilter,
          layout: { visibility: 'none', 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 16, 13], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-offset': [0, 0.8], 'text-max-angle': 20, 'symbol-spacing': 250 },
          paint: { 'text-color': '#334155', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
          minzoom: 11,
        })
      }

      // ── ĐƯỜNG SẮT ─────────────────────────────────────
      m.addLayer({
        id: 'rail-line-qt', type: 'line', source: 'infra-qt',
        filter: ['==', ['get', 'layer'], 'railway'],
        paint: { 'line-color': '#991b1b', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 4], 'line-dasharray': [4, 2] },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'rail-station-qt', type: 'circle', source: 'infra-qt',
        filter: ['==', ['get', 'layer'], 'railway_station'],
        paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 14, 10], 'circle-color': '#dc2626', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'rail-station-label-qt', type: 'symbol', source: 'infra-qt',
        filter: ['==', ['get', 'layer'], 'railway_station'],
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-offset': [0, 1.5], 'text-anchor': 'top' },
        paint: { 'text-color': '#991b1b', 'text-halo-color': '#fff', 'text-halo-width': 2 },
        minzoom: 9,
      })

      // ── SÂN BAY ───────────────────────────────────────
      m.addLayer({
        id: 'airport-area', type: 'fill', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'airport'], ['==', ['geometry-type'], 'Polygon']],
        paint: { 'fill-color': '#7c3aed', 'fill-opacity': 0.15 },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'airport-runway', type: 'line', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'airport'], ['==', ['geometry-type'], 'LineString']],
        paint: { 'line-color': '#7c3aed', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 14, 6] },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'airport-point', type: 'circle', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'airport'], ['==', ['geometry-type'], 'Point']],
        paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 6, 14, 12], 'circle-color': '#7c3aed', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'airport-label', type: 'symbol', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'airport'], ['==', ['geometry-type'], 'Point']],
        layout: { visibility: 'none', 'text-field': ['concat', ['get', 'name'], ['case', ['!=', ['get', 'iata'], ''], ['concat', ' (', ['get', 'iata'], ')'], '']], 'text-size': 12, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-offset': [0, 1.8], 'text-anchor': 'top' },
        paint: { 'text-color': '#5b21b6', 'text-halo-color': '#fff', 'text-halo-width': 2 },
        minzoom: 8,
      })

      // ── CẢNG BIỂN ─────────────────────────────────────
      m.addLayer({
        id: 'port-area', type: 'fill', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'port'], ['==', ['geometry-type'], 'Polygon']],
        paint: { 'fill-color': '#0369a1', 'fill-opacity': 0.15 },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'port-line', type: 'line', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'port'], ['==', ['geometry-type'], 'LineString']],
        paint: { 'line-color': '#0369a1', 'line-width': 2 },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'port-point', type: 'circle', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'port'], ['==', ['geometry-type'], 'Point']],
        paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 14, 9], 'circle-color': '#0369a1', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'port-label', type: 'symbol', source: 'infra-qt',
        filter: ['all', ['==', ['get', 'layer'], 'port'], ['==', ['geometry-type'], 'Point']],
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-offset': [0, 1.4], 'text-anchor': 'top' },
        paint: { 'text-color': '#0c4a6e', 'text-halo-color': '#fff', 'text-halo-width': 2 },
        minzoom: 10,
      })

      // ── GPMB ĐSTĐC ────────────────────────────────────
      m.addLayer({
        id: 'gpmb-line', type: 'line', source: 'infra-qt',
        filter: ['==', ['get', 'layer'], 'gpmb_dstdc'],
        paint: { 'line-color': '#dc2626', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 12, 2, 16, 4], 'line-opacity': 0.7 },
        layout: { visibility: 'none' },
      })

      // ── POPUP CLICK cho tất cả layer ──────────────────
      const ROW = (lbl: string, val: string) => `<tr><td style="color:#64748b;padding:2px 10px 2px 0;font-size:11px;white-space:nowrap">${lbl}</td><td style="font-weight:600;font-size:11px">${val}</td></tr>`

      function buildRoadPopup(f: maplibregl.MapGeoJSONFeature): string {
        const p = f.properties as Record<string, string>
        const coords = (f.geometry as { type: string; coordinates: [number, number][] }).coordinates ?? []
        const start = coords[0]
        const end = coords[coords.length - 1]
        const len = haversineLength(coords)

        let html = `<div style="font-family:system-ui,sans-serif;padding:4px 0">`
        html += `<div style="font-weight:700;font-size:15px;color:#1e40af;margin-bottom:2px">🛣️ ${p.name || 'Đường không tên'}</div>`
        if (p.ref) html += `<div style="font-size:12px;color:#475569;font-weight:600;margin-bottom:4px">${p.ref}</div>`
        html += `<div style="display:inline-block;background:${p.color}22;color:${p.color};padding:1px 8px;border-radius:999px;font-size:10px;font-weight:700;margin-bottom:8px">${p.label}</div>`

        html += `<table style="border-collapse:collapse;width:100%">`
        // Điểm đầu – cuối
        if (start) html += ROW('Điểm đầu', `<span style="font-family:monospace;font-size:10px">${formatCoord(start[0], start[1])}</span>`)
        if (end) html += ROW('Điểm cuối', `<span style="font-family:monospace;font-size:10px">${formatCoord(end[0], end[1])}</span>`)
        // Chiều dài
        if (len > 0) html += ROW('Chiều dài đoạn', formatLength(len))

        // Mặt cắt ngang
        const mcn: string[] = []
        if (p.lanes && p.lanes !== '') mcn.push(`${p.lanes} làn xe`)
        if (p.width && p.width !== '') mcn.push(`rộng ${p.width}m`)
        if (p.oneway === 'yes') mcn.push('một chiều')
        if (mcn.length > 0) html += ROW('Mặt cắt ngang', mcn.join(' · '))

        // Kết cấu mặt đường
        if (p.surface && p.surface !== '') {
          const surfaceVi = SURFACE_VI[p.surface] || p.surface
          html += ROW('Kết cấu mặt đường', surfaceVi)
        }

        // Tốc độ
        if (p.maxspeed && p.maxspeed !== '') html += ROW('Tốc độ tối đa', `${p.maxspeed} km/h`)

        // Chiếu sáng
        if (p.lit === 'yes') html += ROW('Chiếu sáng', 'Có')
        else if (p.lit === 'no') html += ROW('Chiếu sáng', 'Không')

        // Cầu / hầm
        if (p.bridge && p.bridge !== '' && p.bridge !== 'no') html += ROW('Công trình', 'Cầu')
        if (p.tunnel && p.tunnel !== '' && p.tunnel !== 'no') html += ROW('Công trình', 'Hầm')

        html += `</table></div>`
        return html
      }

      // Road click — tất cả sub-layers
      const roadClickLayers = ROAD_SUB_DEFS.map(s => `road-${s.key}-line`)
      roadClickLayers.forEach(layerId => {
        m.on('click', layerId, (e) => {
          const f = e.features?.[0]; if (!f) return
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '380px' }).setLngLat(e.lngLat).setHTML(buildRoadPopup(f)).addTo(m)
        })
      })

      // Railway click
      const railClickLayers = ['rail-line-qt', 'rail-station-qt']
      railClickLayers.forEach(layerId => {
        m.on('click', layerId, (e) => {
          const f = e.features?.[0]; if (!f) return
          const p = f.properties as Record<string, string>
          const coords = (f.geometry as { type: string; coordinates: [number, number][] | [number, number] }).coordinates
          let rows = ''
          if (Array.isArray(coords[0])) {
            const line = coords as [number, number][]
            const start = line[0]; const end = line[line.length - 1]
            const len = haversineLength(line)
            rows += ROW('Điểm đầu', `<span style="font-family:monospace;font-size:10px">${formatCoord(start[0], start[1])}</span>`)
            rows += ROW('Điểm cuối', `<span style="font-family:monospace;font-size:10px">${formatCoord(end[0], end[1])}</span>`)
            if (len > 0) rows += ROW('Chiều dài đoạn', formatLength(len))
          }
          if (p.gauge) rows += ROW('Khổ ray', `${p.gauge} mm`)
          if (p.operator) rows += ROW('Đơn vị', p.operator)
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '340px' }).setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:14px;color:#991b1b;margin-bottom:4px">🚂 ${p.name || 'Đường sắt'}</div><table style="border-collapse:collapse">${rows}</table></div>`)
            .addTo(m)
        })
      })

      // Airport click
      const airClickLayers = ['airport-point', 'airport-runway']
      airClickLayers.forEach(layerId => {
        m.on('click', layerId, (e) => {
          const f = e.features?.[0]; if (!f) return
          const p = f.properties as Record<string, string>
          let rows = ''
          if (p.iata) rows += ROW('IATA', p.iata)
          if (p.icao) rows += ROW('ICAO', p.icao)
          if (p.aeroway) rows += ROW('Loại', p.aeroway === 'aerodrome' ? 'Sân bay' : p.aeroway === 'runway' ? 'Đường băng' : p.aeroway)
          if (p.length) rows += ROW('Đường băng', `${p.length} m`)
          if (p.surface) rows += ROW('Mặt đường băng', SURFACE_VI[p.surface] || p.surface)
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '320px' }).setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:14px;color:#5b21b6;margin-bottom:4px">✈️ ${p.name || 'Sân bay'}</div><table style="border-collapse:collapse">${rows}</table></div>`)
            .addTo(m)
        })
      })

      // Port click
      m.on('click', 'port-point', (e) => {
        const f = e.features?.[0]; if (!f) return
        const p = f.properties as Record<string, string>
        let rows = ''
        if (p.type) rows += ROW('Loại', p.type === 'harbour' ? 'Bến cảng' : p.type === 'ferry_terminal' ? 'Bến phà' : p.type === 'pier' ? 'Cầu cảng' : p.type === 'industrial' ? 'Cảng công nghiệp' : p.type)
        popup.current?.remove()
        popup.current = new maplibregl.Popup({ maxWidth: '320px' }).setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:14px;color:#0c4a6e;margin-bottom:4px">⚓ ${p.name || 'Cảng'}</div><table style="border-collapse:collapse">${rows}</table></div>`)
          .addTo(m)
      })

      // GPMB click
      m.on('click', 'gpmb-line', (e) => {
        const f = e.features?.[0]; if (!f) return
        const p = f.properties as Record<string, string>
        popup.current?.remove()
        popup.current = new maplibregl.Popup({ maxWidth: '320px' }).setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:14px;color:#991b1b;margin-bottom:4px">🚄 Ranh GPMB ĐS cao tốc</div><div style="font-size:11px;color:#64748b">${p.description || ''}</div><div style="font-size:10px;color:#94a3b8;margin-top:4px">${p.polyline || ''}</div></div>`)
          .addTo(m)
      })

      // Cursor cho tất cả clickable layers
      const allClickable = [...ROAD_SUB_DEFS.map(s => `road-${s.key}-line`), 'rail-line-qt', 'rail-station-qt', 'airport-point', 'airport-runway', 'port-point', 'gpmb-line']
      allClickable.forEach(id => {
        m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', id, () => { m.getCanvas().style.cursor = '' })
      })
    } catch { /* GeoJSON not found */ }
  }, [])

  // Toggle helpers
  const ROAD_SUB_KEYS = ['caotoc', 'quoclo', 'hcm', 'tinhlodthuyen', 'lienxa', 'dancu', 'khac']
  const ROAD_LAYERS = ROAD_SUB_KEYS.flatMap(k => [`road-${k}-casing`, `road-${k}-line`, `road-${k}-ref`, `road-${k}-name`])
  const RAIL_LAYERS = ['rail-line-qt', 'rail-station-qt', 'rail-station-label-qt']
  const AIRPORT_LAYERS = ['airport-area', 'airport-runway', 'airport-point', 'airport-label']
  const PORT_LAYERS = ['port-area', 'port-line', 'port-point', 'port-label']
  const GPMB_LAYERS = ['gpmb-line']

  function toggleLayers(m: maplibregl.Map, layers: string[], visible: boolean) {
    layers.forEach(id => { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none') })
  }

  // Nạp hạ tầng đúng 1 lần, gọi callback sau khi layer đã tạo xong
  // (trước đây chờ 'sourcedata' — sự kiện này có thể đến từ nguồn khác nên toggle đầu tiên hay trượt)
  const infraPromise = useRef<Promise<void> | null>(null)
  const ensureInfra = useCallback((m: maplibregl.Map, then: () => void) => {
    if (m.getSource('infra-qt')) { then(); return }
    if (!infraPromise.current) {
      // Nếu style chưa sẵn sàng (user bấm ngay khi vừa vào trang) → đợi sự kiện 'load' rồi mới nạp
      infraPromise.current = m.isStyleLoaded()
        ? loadInfra(m)
        : new Promise<void>((resolve) => { m.once('load', () => { loadInfra(m).then(resolve) }) })
    }
    infraPromise.current.then(then)
  }, [loadInfra])


  function applyRoadSubVisibility(m: maplibregl.Map, globalOn: boolean, sub: Record<string, boolean>) {
    for (const k of ROAD_SUB_KEYS) {
      const vis = globalOn && (sub[k] ?? false)
      const ids = [`road-${k}-casing`, `road-${k}-line`, `road-${k}-ref`, `road-${k}-name`]
      ids.forEach(id => { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none') })
    }
  }

  const toggleRoads = useCallback(() => {
    setShowRoads((prev) => !prev)
  }, [])

  function toggleRoadSub(key: string) {
    setRoadSub((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleRail = useCallback(() => {
    setShowRail((prev) => !prev)
  }, [])

  const toggleAirport = useCallback(() => {
    setShowAirport((prev) => !prev)
  }, [])

  const togglePort = useCallback(() => {
    setShowPort((prev) => !prev)
  }, [])

  const toggleGpmb = useCallback(() => {
    setShowGpmb((prev) => !prev)
  }, [])

  const toggleRailway = useCallback(() => {
    setShowRailway((prev) => !prev)
  }, [])

  const loadAssets = useCallback(async (m: maplibregl.Map, domainFilter: string, force = false, fitAfterLoad = false) => {
    const currentMapZoom = m.getZoom()
    if (currentMapZoom < 10 && !fitAfterLoad) {
      const source = m.getSource('assets') as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData({ type: 'FeatureCollection', features: [] })
      }
      setAssetCount(0)
      setLoading(false)
      hasFetchedAssetsRef.current = false
      return
    }

    if (hasFetchedAssetsRef.current && !force && !fitAfterLoad) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (domainFilter) params.set('domain', domainFilter)
      if (assetTypeId) params.set('assetTypeId', assetTypeId)

      const res = await fetch(`/api/gis/assets?${params}`)
      const geojson = await res.json()
      setAssetCount(geojson.features?.length ?? 0)

      const source = m.getSource('assets') as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData(geojson)
      } else {
        m.addSource('assets', { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 15, clusterRadius: 40 })

        // Lớp ngoài tạo hiệu ứng halo mờ ảo, sang trọng và thu hút
        m.addLayer({
          id: 'clusters-glow', type: 'circle', source: 'assets',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#60a5fa', 50, '#3b82f6', 150, '#1d4ed8'],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['step', ['get', 'point_count'], 10, 50, 14, 150, 18],
              14, ['step', ['get', 'point_count'], 14, 50, 18, 150, 22]
            ],
            'circle-opacity': 0.22,
          },
        })

        // Lớp tròn chính ở giữa (kích thước nhỏ gọn hơn nhiều để tránh che khuất bản đồ)
        m.addLayer({
          id: 'clusters', type: 'circle', source: 'assets',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 50, '#2563eb', 150, '#1d4ed8'],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['step', ['get', 'point_count'], 7, 50, 9, 150, 11],
              14, ['step', ['get', 'point_count'], 10, 50, 13, 150, 16]
            ],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        m.addLayer({
          id: 'cluster-count', type: 'symbol', source: 'assets',
          filter: ['has', 'point_count'],
          layout: { 
            'text-field': '{point_count_abbreviated}', 
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['step', ['get', 'point_count'], 7, 50, 8, 150, 9],
              14, ['step', ['get', 'point_count'], 9, 50, 10, 150, 11]
            ], 
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] 
          },
          paint: { 'text-color': '#ffffff' },
        })

        m.addLayer({
          id: 'asset-points', type: 'circle', source: 'assets',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['match', ['get', 'condition'], 'TOT', CONDITION_COLORS.TOT, 'KHA', CONDITION_COLORS.KHA, 'TRUNG_BINH', CONDITION_COLORS.TRUNG_BINH, 'XAU', CONDITION_COLORS.XAU, 'HONG', CONDITION_COLORS.HONG, '#94a3b8'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 5, 18, 8],
            'circle-stroke-width': 1.2, 'circle-stroke-color': '#fff',
          },
        })

        m.addLayer({
          id: 'asset-lines', type: 'line', source: 'assets',
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': ['match', ['get', 'domain'], 'GIAO_THONG', DOMAIN_COLORS.GIAO_THONG, 'CAP_NUOC', DOMAIN_COLORS.CAP_NUOC, 'THOAT_NUOC', DOMAIN_COLORS.THOAT_NUOC, 'CHIEU_SANG', DOMAIN_COLORS.CHIEU_SANG, '#94a3b8'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 15, 2.5],
          },
        })

        m.on('click', 'clusters', async (e) => {
          const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          const clusterId = features[0].properties.cluster_id
          try {
            const z = await (m.getSource('assets') as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId)
            m.easeTo({ center: (features[0].geometry as { type: 'Point'; coordinates: [number, number] }).coordinates, zoom: z ?? 14 })
          } catch { /* ignore */ }
        })

        const buildAssetPopup = (f: maplibregl.MapGeoJSONFeature): string => {
          const p = f.properties as Record<string, string>
          const techSpecs = (() => { try { return JSON.parse(p.techSpecs || '{}') } catch { return {} } })()
          const specsHtml = renderTechSpecs(p.assetTypeCode, techSpecs)
          const tmpNote = techSpecs._toaDoTam
            ? `<div style="background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;margin-bottom:6px;">⚠️ Vị trí gán tạm theo tên đường/tâm xã — chưa khảo sát thực địa</div>`
            : ''
          return `
              <div style="font-family:system-ui,sans-serif;padding:4px 0;">
                <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1e293b;">${p.name}</div>
                <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${p.assetCode} · ${p.assetTypeName}</div>
                ${tmpNote}
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;">
                  <span style="background:${(DOMAIN_COLORS[p.domain] ?? '#94a3b8')}22;color:${DOMAIN_COLORS[p.domain] ?? '#94a3b8'};padding:1px 6px;border-radius:999px;font-size:10px;font-weight:600;">${DOMAIN_LABEL[p.domain] ?? p.domain}</span>
                  <span style="background:${(CONDITION_COLORS[p.condition] ?? '#94a3b8')}22;color:${CONDITION_COLORS[p.condition] ?? '#94a3b8'};padding:1px 6px;border-radius:999px;font-size:10px;font-weight:600;">${({ TOT:'Tốt',KHA:'Khá',TRUNG_BINH:'Trung bình',XAU:'Xấu',HONG:'Hỏng' } as Record<string,string>)[p.condition] ?? p.condition}</span>
                </div>
                ${p.address ? `<div style="font-size:11px;color:#475569;margin-bottom:4px;">📍 ${p.address}${p.wardName ? ` — ${p.wardName}` : ''}</div>` : ''}
                ${!p.address && p.wardName ? `<div style="font-size:11px;color:#475569;margin-bottom:4px;">📍 ${p.wardName}</div>` : ''}
                ${specsHtml}
                <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0;">
                  <a href="/dashboard/tai-san/${p.id}" style="font-size:11px;color:#3b82f6;text-decoration:none;font-weight:600;">Xem chi tiết →</a>
                </div>
              </div>
            `
        }

        m.on('click', 'asset-points', (e) => {
          const f = e.features?.[0]
          if (!f) return
          const coords = (f.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '340px' })
            .setLngLat(coords as [number, number])
            .setHTML(buildAssetPopup(f))
            .addTo(m)
        })

        // Tài sản dạng tuyến (LINE) — bấm tại vị trí con trỏ
        m.on('click', 'asset-lines', (e) => {
          const f = e.features?.[0]
          if (!f) return
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '340px' })
            .setLngLat(e.lngLat)
            .setHTML(buildAssetPopup(f))
            .addTo(m)
        })

        ;['asset-points', 'asset-lines'].forEach(id => {
          m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer' })
          m.on('mouseleave', id, () => { m.getCanvas().style.cursor = '' })
        })
        m.on('mouseenter', 'clusters', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'clusters', () => { m.getCanvas().style.cursor = '' })
      }

      hasFetchedAssetsRef.current = true

      // Tự động zoom và căn chỉnh tỷ lệ bản đồ ôm vừa các điểm vòng tròn xanh (tài sản)
      if (fitAfterLoad && geojson.features && geojson.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        let hasBounds = false
        geojson.features.forEach((f: any) => {
          const addCoord = (c: [number, number]) => {
            if (c && c.length >= 2 && c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90) {
              bounds.extend(c)
              hasBounds = true
            }
          }
          if (f.geometry) {
            if (f.geometry.type === 'Point') {
              addCoord(f.geometry.coordinates)
            } else if (f.geometry.type === 'LineString') {
              f.geometry.coordinates.forEach(addCoord)
            } else if (f.geometry.type === 'Polygon') {
              (f.geometry.coordinates[0] || []).forEach(addCoord)
            } else if (f.geometry.type === 'MultiPolygon') {
              f.geometry.coordinates.forEach((poly: any) => {
                (poly[0] || []).forEach(addCoord)
              })
            } else if (f.geometry.type === 'MultiLineString') {
              f.geometry.coordinates.forEach((line: any) => {
                line.forEach(addCoord)
              })
            }
          }
        })
        if (hasBounds) {
          m.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 280, right: 340 },
            maxZoom: 13,
            duration: 1200
          })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [assetTypeId])

  const loadAssetsRef = useRef(loadAssets)
  useEffect(() => {
    loadAssetsRef.current = loadAssets
  }, [loadAssets])

  // Thêm/xóa ward markers khi toggle
  const addWardMarkers = useCallback((wards: WardData[], m: maplibregl.Map) => {
    wardMarkers.current.forEach(mk => mk.remove())
    wardMarkers.current = []

    wards.forEach(ward => {
      const el = document.createElement('div')
      el.style.cssText = `
        background: #1e40af; color: #fff; border-radius: 8px;
        padding: 3px 8px; font-size: 11px; font-weight: 700;
        cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid #93c5fd; white-space: nowrap;
        display: flex; align-items: center; gap: 4px;
      `
      el.innerHTML = `
        <span style="background:#fff;color:#1e40af;border-radius:4px;padding:0 4px;font-size:10px;">${ward.streetCount}</span>
        ${ward.name}
      `

      const mk = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([ward.lon, ward.lat])
        .addTo(m)

      // Click → popup danh sách đường
      el.addEventListener('click', () => {
        if (popup.current) popup.current.remove()
        const streetList = ward.streets
          .slice(0, 20)
          .map(s => `<li style="padding:2px 0;font-size:11px;color:#334155;">${s.name}${s.lengthKm ? `<span style="color:#94a3b8;font-size:10px;"> ${s.lengthKm}km</span>` : ''}</li>`)
          .join('')
        const more = ward.streets.length > 20 ? `<li style="color:#64748b;font-style:italic;font-size:10px;">...và ${ward.streets.length - 20} tuyến nữa</li>` : ''

        popup.current = new maplibregl.Popup({ maxWidth: '300px', closeButton: true })
          .setLngLat([ward.lon, ward.lat])
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;">
              <div style="font-weight:700;color:#1e40af;margin-bottom:6px;font-size:13px;">🗺️ ${ward.name}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${ward.streetCount} tuyến đường (quy hoạch)</div>
              <ul style="margin:0;padding-left:14px;max-height:200px;overflow-y:auto;">
                ${streetList}${more}
              </ul>
            </div>
          `)
          .addTo(m)
      })

      wardMarkers.current.push(mk)
    })
  }, [])

  const removeWardMarkers = useCallback(() => {
    wardMarkers.current.forEach(mk => mk.remove())
    wardMarkers.current = []
  }, [])

  // Load streets data
  async function loadStreets() {
    setLoadingStreets(true)
    try {
      const res = await fetch('/api/streets/by-ward')
      const data: WardData[] = await res.json()
      setWardsData(data)
      if (map.current) addWardMarkers(data, map.current) // marker DOM không cần chờ style load
    } finally {
      setLoadingStreets(false)
    }
  }

  const toggleStreets = useCallback(() => {
    setShowStreets((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [centerLng, centerLat], zoom, maxZoom: 20,
    })
    m.addControl(new maplibregl.NavigationControl(), 'top-right')
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    m.addControl(new maplibregl.FullscreenControl(), 'top-right')
    m.on('load', () => {
      setMapReady(true)
      // Khởi tạo ban đầu với fitAfterLoad = false
      loadAssetsRef.current(m, domain ?? '', true, false)
      loadHighSpeedRail(m)

      // Tự động căn chỉnh tỷ lệ hiển thị toàn bộ tỉnh để ôm vừa màn hình, tránh bị che khuất bởi các panel bên
      if (centerLat === 17.10 && centerLng === 106.85 && zoom === 8) {
        m.fitBounds(
          [[105.606055, 16.300464], [107.385952, 18.090919]],
          {
            padding: { top: 50, bottom: 50, left: 280, right: 340 },
            duration: 1000
          }
        )
      }
    })
    m.on('click', () => { setShowRoadSearch(false) })
    m.on('mousemove', (e) => {
      if (cursorCoordRef.current) {
        cursorCoordRef.current.textContent = `${e.lngLat.lat.toFixed(5)}°B, ${e.lngLat.lng.toFixed(5)}°Đ`
      }
    })
    m.on('click', (e) => {
      setClickedCoord({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })
    m.on('zoom', () => {
      setIsZoomedOut(m.getZoom() < 10)
    })
    m.on('zoomend', () => {
      const currentMapZoom = m.getZoom()
      const isMet = currentMapZoom >= 10
      if (isMet && !hasFetchedAssetsRef.current) {
        loadAssetsRef.current(m, selectedDomainRef.current, false, false)
      } else if (!isMet && hasFetchedAssetsRef.current) {
        loadAssetsRef.current(m, selectedDomainRef.current, false, false)
      }
    })
    map.current = m
    return () => {
      m.remove()
      map.current = null
      infraPromise.current = null
      boundariesPromise.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Syncing showStreets state and ward markers
  useEffect(() => {
    const m = map.current
    if (!m || !mapReady) return
    if (showStreets) {
      if (wardsData.length === 0) {
        loadStreets()
      } else {
        addWardMarkers(wardsData, m)
      }
    } else {
      removeWardMarkers()
    }
  }, [showStreets, mapReady, wardsData, addWardMarkers, removeWardMarkers])

  // Syncing map layers visibility with React state
  useEffect(() => {
    const m = map.current
    if (!m || !mapReady) return

    // Đường bộ
    ensureInfra(m, () => applyRoadSubVisibility(m, showRoads, roadSub))

    // Đường sắt
    ensureInfra(m, () => toggleLayers(m, RAIL_LAYERS, showRail))

    // GPMB ĐS cao tốc
    ensureInfra(m, () => toggleLayers(m, GPMB_LAYERS, showGpmb))

    // Sân bay
    ensureInfra(m, () => toggleLayers(m, AIRPORT_LAYERS, showAirport))

    // Cảng biển
    ensureInfra(m, () => toggleLayers(m, PORT_LAYERS, showPort))

    // Ga ĐS cao tốc
    const railwayLayers = ['rail-stations', 'rail-station-labels', 'rail-stations-neighbor', 'rail-neighbor-labels', 'rail-landmarks', 'rail-landmark-labels']
    railwayLayers.forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', showRailway ? 'visible' : 'none')
    })
  }, [mapReady, showRoads, roadSub, showRail, showGpmb, showAirport, showPort, showRailway, ensureInfra])

  // Syncing incoming filter props (domain, assetTypeId)
  useEffect(() => {
    setSelectedDomain(domain ?? '')
    const m = map.current
    if (m && mapReady) {
      loadAssets(m, domain ?? '', true, true)
    }
  }, [domain, assetTypeId, mapReady, loadAssets])

  const loadAdminBoundaries = useCallback(async (m: maplibregl.Map) => {
    if (m.getSource('admin-boundaries')) return
    try {
      const [wardRes, provRes] = await Promise.all([
        fetch('/data/admin-boundaries.geojson'),
        fetch('/data/quang-tri-province-boundary.geojson'),
      ])
      const geojson = await wardRes.json()
      const provGeojson = await provRes.json()
      adminBoundariesData.current = geojson

      // ── RANH GIỚI TỈNH ────────────────────────────────
      m.addSource('province-boundary', { type: 'geojson', data: provGeojson })
      m.addLayer({
        id: 'province-boundary-fill',
        type: 'fill',
        source: 'province-boundary',
        paint: { 'fill-color': '#1e40af', 'fill-opacity': 0.03 },
        layout: { visibility: 'none' },
      })
      m.addLayer({
        id: 'province-boundary-line',
        type: 'line',
        source: 'province-boundary',
        paint: {
          'line-color': '#1e3a8a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2, 12, 3.5],
          'line-opacity': 0.9,
          'line-dasharray': [6, 3],
        },
        layout: { visibility: 'none' },
      })

      // ── RANH GIỚI XÃ/PHƯỜNG ───────────────────────────
      // maxzoom 14: quá mức này dùng lại tile z14 (sai số ~vài px) — đỡ phải cắt lại polygon nặng khi phóng sâu
      m.addSource('admin-boundaries', { type: 'geojson', data: geojson, maxzoom: 14 })

      // Choropleth theo mật độ dân số
      m.addLayer({
        id: 'admin-boundaries-fill',
        type: 'fill',
        source: 'admin-boundaries',
        paint: {
          'fill-color': [
            'step', ['get', 'densityPerKm2'],
            '#d1fae5',   // < 100 người/km²
            100,  '#6ee7b7',
            300,  '#34d399',
            800,  '#fbbf24',
            1500, '#f97316',
            3000, '#ef4444',
          ],
          'fill-opacity': 0.25,
        },
        layout: { visibility: 'none' },
      })

      m.addLayer({
        id: 'admin-boundaries-line',
        type: 'line',
        source: 'admin-boundaries',
        paint: {
          'line-color': '#0f766e',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 1.8],
          'line-opacity': 0.7,
        },
        layout: { visibility: 'none' },
      })

      m.addLayer({
        id: 'admin-boundaries-hover',
        type: 'line',
        source: 'admin-boundaries',
        filter: ['==', ['get', 'code'], ''],
        paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 1 },
        layout: { visibility: 'none' },
      })

      m.addLayer({
        id: 'admin-boundaries-label',
        type: 'symbol',
        source: 'admin-boundaries',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 9, 13, 12],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'visibility': 'none',
        },
        paint: { 'text-color': '#1e293b', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
        minzoom: 9,
      })

      m.on('mousemove', 'admin-boundaries-fill', (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const props = feat.properties
        // Chỉ cập nhật state/filter khi con trỏ chuyển sang xã khác — tránh re-render mỗi pixel
        if (props.code === hoverCodeRef.current) return
        hoverCodeRef.current = props.code
        setHoveredCommune(props)
        m.setFilter('admin-boundaries-hover', ['==', ['get', 'code'], props.code])
        m.getCanvas().style.cursor = 'pointer'
      })

      m.on('mouseleave', 'admin-boundaries-fill', () => {
        hoverCodeRef.current = ''
        setHoveredCommune(null)
        m.setFilter('admin-boundaries-hover', ['==', ['get', 'code'], ''])
        m.getCanvas().style.cursor = ''
      })

      m.on('click', 'admin-boundaries-fill', (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const p = feat.properties as Record<string, string | number>

        // FlyTo bbox của xã/phường
        try {
          const bboxArr = typeof p.bbox === 'string' ? JSON.parse(p.bbox) : p.bbox
          if (Array.isArray(bboxArr) && bboxArr.length === 4) {
            m.fitBounds([[bboxArr[0], bboxArr[1]], [bboxArr[2], bboxArr[3]]], { padding: 60, maxZoom: 14, duration: 800 })
          }
        } catch { /* ignore */ }

        // Popup
        const mergedArr: string[] = (() => {
          try { const v = p.mergedFrom; return typeof v === 'string' ? JSON.parse(v) : [] } catch { return [] }
        })()
        const mergedRow = mergedArr.length > 0
          ? `<tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px;vertical-align:top">Sáp nhập từ</td><td style="font-weight:600;font-size:11px">${mergedArr.join('<br>')}</td></tr>`
          : ''

        popup.current?.remove()
        popup.current = new maplibregl.Popup({ maxWidth: '360px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:4px 0">
              <div style="font-weight:700;font-size:14px;color:#0f766e;margin-bottom:2px">🗺️ ${p.fullName || p.name}</div>
              <div style="font-size:10px;color:#94a3b8;margin-bottom:6px">Mã: ${p.code}</div>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Loại</td><td style="font-weight:600;font-size:11px">${p.type}</td></tr>
                <tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Diện tích</td><td style="font-weight:600;font-size:11px">${p.areaKm2} km²</td></tr>
                <tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Dân số</td><td style="font-weight:600;font-size:11px">${Number(p.population || 0).toLocaleString('vi-VN')} người</td></tr>
                <tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Mật độ</td><td style="font-weight:600;font-size:11px">${Number(p.densityPerKm2 || 0).toLocaleString('vi-VN')} người/km²</td></tr>
                ${mergedRow}
              </table>
              <div style="margin-top:6px;font-size:9px;color:#94a3b8;font-style:italic">Bấm để phóng đến khu vực này</div>
            </div>
          `)
          .addTo(m)
      })

      setBoundariesLoaded(true)
    } catch (err) {
      console.error('Failed to load administrative boundaries', err)
    }
  }, [])

  const ensureBoundaries = useCallback((m: maplibregl.Map, then: () => void) => {
    if (m.getSource('admin-boundaries')) { then(); return }
    if (!boundariesPromise.current) {
      boundariesPromise.current = loadAdminBoundaries(m)
    }
    boundariesPromise.current.then(then)
  }, [loadAdminBoundaries])

  useEffect(() => {
    const m = map.current
    if (!m || !mapReady) return
    const BOUNDARY_LAYERS = ['province-boundary-fill', 'province-boundary-line', 'admin-boundaries-fill', 'admin-boundaries-line', 'admin-boundaries-hover', 'admin-boundaries-label']
    if (showBoundaries) {
      ensureBoundaries(m, () => {
        setBoundariesLoaded(true)
        BOUNDARY_LAYERS.forEach(id => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'visible')
        })
      })
    } else {
      if (boundariesLoaded) {
        BOUNDARY_LAYERS.forEach(id => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none')
        })
      }
    }
  }, [showBoundaries, boundariesLoaded, ensureBoundaries, mapReady])

  const runRailImpactAnalysis = useCallback(async () => {
    // Đánh số lần chạy — lần mới hơn (đổi bề rộng, đổi file) tự huỷ lần cũ tại các điểm nhả luồng
    const runId = ++railRunIdRef.current
    setRailImpactSummary('Đang phân tích...')
    let boundariesGeojson = adminBoundariesData.current
    if (!boundariesGeojson) {
      try {
        const res = await fetch('/data/admin-boundaries.geojson')
        boundariesGeojson = await res.json()
        adminBoundariesData.current = boundariesGeojson
      } catch (err) {
        console.error('Failed to fetch admin boundaries for analysis', err)
        setRailImpactSummary('Không thể tải ranh giới địa giới.')
        return
      }
    }

    let lineFeatures: any[] = []
    if (customRailFile) {
      lineFeatures = toFeatureCollection(customRailFile).features || []
    } else {
      let infra = infraGeojsonRef.current
      if (!infra) {
        try {
          const res = await fetch('/data/tuyen-duong-quang-tri.geojson')
          infra = await res.json()
          infraGeojsonRef.current = infra
        } catch (err) {
          console.error('Failed to fetch default rail line', err)
          setRailImpactSummary('Không thể tải tuyến đường sắt mặc định.')
          return
        }
      }
      lineFeatures = (infra.features || []).filter((f: any) => f.properties?.layer === 'gpmb_dstdc')
    }

    if (lineFeatures.length === 0) {
      setRailImpactRows([])
      setRailImpactSummary('Không tìm thấy tuyến đường sắt để phân tích.')
      return
    }

    const corridorWidth = Math.max(1, railCorridorWidth)
    const rowsByBoundary = new Map<string, any>()
    let totalLength = 0
    let outsideLength = 0
    const sampleStepMeters = 50

    // Chỉ mục ranh giới: lọc thô bằng bbox trước khi point-in-polygon (loại ~77/78 xã tức thì),
    // và nhớ xã vừa khớp — điểm mẫu kế tiếp cách 50m nên gần như luôn cùng xã.
    // Trước đây mỗi điểm mẫu quét point-in-polygon cả 78 MultiPolygon → treo trang "Page Unresponsive".
    type BoundaryEntry = { feature: any; bbox: [number, number, number, number] }
    const boundaryIndex: BoundaryEntry[] = (boundariesGeojson.features || []).map((feature: any) => {
      let bbox = feature.properties?.bbox
      if (typeof bbox === 'string') { try { bbox = JSON.parse(bbox) } catch { bbox = null } }
      if (!Array.isArray(bbox) || bbox.length !== 4) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const ring of extractPolygonRings(feature.geometry)) {
          for (const [x, y] of ring) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
        bbox = [minX, minY, maxX, maxY]
      }
      return { feature, bbox }
    })

    let lastEntry: BoundaryEntry | null = null
    const entryContains = (e: BoundaryEntry, lng: number, lat: number) =>
      lng >= e.bbox[0] && lng <= e.bbox[2] && lat >= e.bbox[1] && lat <= e.bbox[3] &&
      geometryContainsLatLng(e.feature.geometry, { lat, lng })

    const findBoundaryForCoordinate = (lngLat: [number, number]) => {
      const [lng, lat] = lngLat
      if (lastEntry && entryContains(lastEntry, lng, lat)) return lastEntry.feature
      for (const e of boundaryIndex) {
        if (e === lastEntry) continue
        if (entryContains(e, lng, lat)) { lastEntry = e; return e.feature }
      }
      return undefined
    }

    let sampleOps = 0
    for (const feature of lineFeatures) {
      for (const line of extractLineStrings(feature.geometry)) {
        for (let i = 1; i < line.length; i += 1) {
          const from = line[i - 1]
          const to = line[i]
          const segmentLength = haversineLength([from, to])
          if (!Number.isFinite(segmentLength) || segmentLength <= 0) continue

          const sampleCount = Math.max(1, Math.ceil(segmentLength / sampleStepMeters))
          const partLength = segmentLength / sampleCount
          totalLength += segmentLength

          for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
            // Nhả luồng chính định kỳ để trang không bị báo "Page Unresponsive"; huỷ nếu có lần chạy mới
            if (++sampleOps % 4000 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0))
              if (railRunIdRef.current !== runId) return
            }
            const ratio = (sampleIndex + 0.5) / sampleCount
            const mid: [number, number] = [
              from[0] + (to[0] - from[0]) * ratio,
              from[1] + (to[1] - from[1]) * ratio
            ]
            const boundary = findBoundaryForCoordinate(mid)
            if (!boundary) {
              outsideLength += partLength
              continue
            }

            const props = boundary.properties || {}
            const key = props.code || props.fullName || props.name
            const row = rowsByBoundary.get(key) || {
              key,
              name: props.fullName || props.name || 'Đơn vị hành chính',
              type: props.type || '',
              lengthM: 0,
            }
            row.lengthM += partLength
            rowsByBoundary.set(key, row)
          }
        }
      }
    }

    const resettlementSummary = new Map<string, { count: number; areaM2: number }>()
    if (customResettlementFile) {
      const resetFeatures = toFeatureCollection(customResettlementFile).features || []
      for (const feature of resetFeatures) {
        const first = getFirstCoordinate(feature.geometry)
        if (!first) continue
        const boundary = findBoundaryForCoordinate(first)
        if (!boundary) continue
        const key = boundary.properties.code || boundary.properties.fullName || boundary.properties.name
        const rings = extractPolygonRings(feature.geometry)
        const areaM2 = rings.reduce((sum, ring) => sum + ringAreaSquareMeters(ring), 0)
        const current = resettlementSummary.get(key) || { count: 0, areaM2: 0 }
        current.count += 1
        current.areaM2 += areaM2
        resettlementSummary.set(key, current)
      }
    }

    const rows = Array.from(rowsByBoundary.values())
      .map((row) => {
        const resStats = resettlementSummary.get(row.key) || { count: 0, areaM2: 0 }
        return {
          ...row,
          areaM2: row.lengthM * corridorWidth,
          resettlement: resStats,
        }
      })
      .sort((a, b) => b.lengthM - a.lengthM)

    if (railRunIdRef.current !== runId) return // lần chạy mới hơn đã bắt đầu — bỏ kết quả cũ
    setRailImpactRows(rows)

    const totalAreaHa = rows.reduce((sum, row) => sum + row.areaM2 / 10000, 0)
    let summaryText = `Đi qua ${rows.length} xã/phường, tổng ${formatLength(totalLength)}, GPMB ước tính ${totalAreaHa.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ha với bề rộng hành lang ${corridorWidth}m.`
    if (outsideLength > 0) {
      summaryText += ` Có ${formatLength(outsideLength)} nằm ngoài ranh giới Quảng Trị.`
    }
    setRailImpactSummary(summaryText)
  }, [customRailFile, customResettlementFile, railCorridorWidth])

  useEffect(() => {
    if (showRailImpact) {
      runRailImpactAnalysis()
    }
  }, [showRailImpact, runRailImpactAnalysis])

  const railFileInputRef = useRef<HTMLInputElement>(null)
  const resettlementFileInputRef = useRef<HTMLInputElement>(null)

  async function handleRailFileUpload(file: File) {
    setRailFileLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import-gis', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Lỗi parse file'); return }
      setCustomRailFile(data)
    } catch (err) {
      console.error(err)
    } finally {
      setRailFileLoading(false)
    }
  }

  async function handleResettlementFileUpload(file: File) {
    setResetFileLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import-gis', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Lỗi parse file'); return }
      setCustomResettlementFile(data)
      setResettlementStatusText(`Đã nạp ${data.totalFeatures} đối tượng khu TĐC`)
    } catch (err) {
      console.error(err)
    } finally {
      setResetFileLoading(false)
    }
  }

  function handleDomainFilter(d: string) {
    setSelectedDomain(d)
    if (map.current && mapReady) loadAssets(map.current, d, true, true)
  }

  // Filter wards/streets by search
  const filteredWards = streetSearch.trim()
    ? wardsData.map(w => ({
        ...w,
        streets: w.streets.filter(s => s.name.toLowerCase().includes(streetSearch.toLowerCase())),
      })).filter(w => w.streets.length > 0 || w.name.toLowerCase().includes(streetSearch.toLowerCase()))
    : wardsData

  const totalStreets = wardsData.reduce((s, w) => s + w.streetCount, 0)

  // ── Tìm kiếm tuyến đường trên bản đồ ──────────────────────────────────
  function searchRoads(query: string) {
    setRoadSearch(query)
    if (!query.trim() || !map.current) { setRoadResults([]); return }
    const q = query.toLowerCase().normalize('NFC')
    const results: typeof roadResults = []

    // Tìm trên dữ liệu GeoJSON đã nạp trong bộ nhớ — phủ toàn tỉnh, không bị cắt theo tile/viewport
    const infraFeatures = infraGeojsonRef.current?.features as { properties: Record<string, string>; geometry: { coordinates: [number, number][] } }[] | undefined
    if (infraFeatures) {
      const seen = new Set<string>()
      for (const f of infraFeatures) {
        if (results.length >= 20) break
        const p = f.properties
        if (p.layer !== 'road') continue
        const name = p.name || ''
        const ref = p.ref || ''
        const key = `${name}|${ref}`
        if (seen.has(key)) continue
        if (name.toLowerCase().normalize('NFC').includes(q) || ref.toLowerCase().includes(q)) {
          seen.add(key)
          const coords = f.geometry?.coordinates || []
          results.push({ name: name || ref, ref, coords, label: p.label || '', color: p.color || '#3b82f6' })
        }
      }
    }

    // Tìm thêm trong danh sách tuyến đường (streets sidebar)
    if (results.length < 20 && wardsData.length > 0) {
      for (const w of wardsData) {
        if (results.length >= 20) break
        for (const s of w.streets) {
          if (results.length >= 20) break
          if (s.name.toLowerCase().normalize('NFC').includes(q)) {
            const already = results.find(r => r.name === s.name)
            if (!already) {
              results.push({ name: s.name, ref: '', coords: [[w.lon, w.lat]], label: w.name, color: '#1e40af' })
            }
          }
        }
      }
    }
    setRoadResults(results)
  }

  function flyToRoad(r: typeof roadResults[0]) {
    const m = map.current
    if (!m) return
    setShowRoadSearch(false)
    setRoadSearch(r.name)
    setRoadResults([])

    if (r.coords.length > 1) {
      const bounds = new maplibregl.LngLatBounds()
      r.coords.forEach(c => bounds.extend(c))
      m.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 })

      // Highlight
      if (m.getLayer('search-highlight')) m.removeLayer('search-highlight')
      if (m.getSource('search-highlight')) m.removeSource('search-highlight')
      m.addSource('search-highlight', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coords } }
      })
      m.addLayer({
        id: 'search-highlight', type: 'line', source: 'search-highlight',
        paint: { 'line-color': '#f59e0b', 'line-width': 6, 'line-opacity': 0.8 }
      })
      setTimeout(() => {
        if (m.getLayer('search-highlight')) m.removeLayer('search-highlight')
        if (m.getSource('search-highlight')) m.removeSource('search-highlight')
      }, 8000)
    } else if (r.coords.length === 1) {
      m.flyTo({ center: r.coords[0], zoom: 15, duration: 1000 })
    }
  }

  // ── Import file GIS/DXF/KML lên bản đồ ────────────────────────────────
  function clearImportLayers() {
    const m = map.current
    if (!m) return
    importLayerIds.current.forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id)
    })
    importLayerIds.current.forEach(id => {
      if (m.getSource(id)) m.removeSource(id)
    })
    importLayerIds.current = []
    setImportInfo('')
  }

  async function handleImportFile(file: File) {
    const m = map.current
    if (!m) return
    setImportLoading(true)
    setImportError('')
    setImportInfo('')
    clearImportLayers()

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/import-gis', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setImportError(data.error ?? 'Lỗi parse file'); return }
      if (data.totalFeatures === 0) { setImportError('File không chứa đối tượng GIS nào'); return }

      // Chuyển đổi hệ tọa độ bản vẽ gốc
      const detected = detectCrs(data)
      setDetectedCrsInfo(`Nhận dạng: ${detected === 'EPSG:4326' ? 'WGS84' : detected === 'EPSG:3857' ? 'Web Mercator' : 'VN-2000 Quảng Trị'}`)
      const selectedCrs = importCrs === 'auto' ? detected : importCrs

      const convertedFeatures = data.preview.map((f: any, i: number) => {
        const wgs84Geom = transformGeometryToWgs84(f.geometry, selectedCrs)
        return {
          type: 'Feature' as const,
          properties: { _idx: i, _label: f.label || `#${i + 1}`, _layer: f.layer || '', ...f.properties },
          geometry: wgs84Geom
        }
      })

      const geojson = { type: 'FeatureCollection' as const, features: convertedFeatures }
      const srcId = `import-${Date.now()}`

      m.addSource(srcId, { type: 'geojson', data: geojson })

      // Polygon fill
      const fillId = `${srcId}-fill`
      m.addLayer({
        id: fillId, type: 'fill', source: srcId,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#8b5cf6', 'fill-opacity': 0.2 }
      })
      importLayerIds.current.push(fillId)

      // Polygon outline
      const outlineId = `${srcId}-outline`
      m.addLayer({
        id: outlineId, type: 'line', source: srcId,
        filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']],
        paint: { 'line-color': '#7c3aed', 'line-width': 3, 'line-opacity': 0.8 }
      })
      importLayerIds.current.push(outlineId)

      // Points
      const ptId = `${srcId}-points`
      m.addLayer({
        id: ptId, type: 'circle', source: srcId,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: { 'circle-radius': 6, 'circle-color': '#7c3aed', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
      })
      importLayerIds.current.push(ptId)

      // Labels
      const lblId = `${srcId}-labels`
      m.addLayer({
        id: lblId, type: 'symbol', source: srcId,
        layout: {
          'text-field': ['get', '_label'],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#5b21b6', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
        minzoom: 12,
      })
      importLayerIds.current.push(lblId)

      importLayerIds.current.push(srcId) // source cuối cùng

      // Popup click
      ;[ptId, outlineId, fillId].forEach(layerId => {
        m.on('click', layerId, (e) => {
          const feat = e.features?.[0]
          if (!feat) return
          const p = feat.properties as Record<string, string>
          const rows = Object.entries(p)
            .filter(([k]) => !k.startsWith('_'))
            .slice(0, 10)
            .map(([k, v]) => `<tr><td style="color:#64748b;padding:1px 8px 1px 0;font-size:11px">${k}</td><td style="font-weight:600;font-size:11px">${v}</td></tr>`)
            .join('')
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '320px' }).setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:13px;color:#5b21b6;margin-bottom:4px">${p._label || 'Đối tượng'}</div>${p._layer ? `<div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Layer: ${p._layer}</div>` : ''}<table style="border-collapse:collapse">${rows}</table></div>`)
            .addTo(m)
        })
        m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = '' })
      })

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds()
      let hasBounds = false
      convertedFeatures.forEach((f: { geometry: { type: string; coordinates: unknown } }) => {
        const addCoord = (c: [number, number]) => {
          if (c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90) { bounds.extend(c); hasBounds = true }
        }
        if (f.geometry.type === 'Point') addCoord(f.geometry.coordinates as [number, number])
        else if (f.geometry.type === 'LineString') (f.geometry.coordinates as [number, number][]).forEach(addCoord)
        else if (f.geometry.type === 'Polygon') ((f.geometry.coordinates as [number, number][][])[0] || []).forEach(addCoord)
      })
      if (hasBounds) m.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1000 })

      setImportInfo(`${data.format} · ${data.totalFeatures} đối tượng${data.layers?.length ? ` · ${data.layers.length} layer` : ''}`)
      if (data.warnings?.length) setImportError(data.warnings[0])
    } catch (e) {
      setImportError(String(e))
    } finally {
      setImportLoading(false)
    }
  }

  // ── Import ảnh có GPS ─────────────────────────────────────────────────
  function clearPhotoLayers() {
    const m = map.current
    if (!m) return
    photoLayerIds.current.forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id)
    })
    photoLayerIds.current.forEach(id => {
      if (m.getSource(id)) m.removeSource(id)
    })
    photoLayerIds.current = []
    setPhotoInfo('')
    setPhotoError('')
  }

  async function handlePhotoFiles(fileList: FileList) {
    const m = map.current
    if (!m) return
    setPhotoLoading(true)
    setPhotoError('')
    setPhotoInfo('')
    clearPhotoLayers()

    const fd = new FormData()
    for (let i = 0; i < fileList.length; i++) {
      fd.append('files', fileList[i])
    }

    try {
      const res = await fetch('/api/import-gis/photo-gps', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setPhotoError(data.error ?? 'Lỗi đọc ảnh'); return }

      if (data.gpsFound === 0) {
        setPhotoError(`Không ảnh nào có GPS (${data.totalPhotos} ảnh)`)
        return
      }

      const srcId = `photo-gps-${Date.now()}`
      m.addSource(srcId, { type: 'geojson', data: data.geojson })

      const ptId = `${srcId}-points`
      m.addLayer({
        id: ptId, type: 'circle', source: srcId,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 16, 14],
          'circle-color': '#e11d48',
          'circle-stroke-width': 3, 'circle-stroke-color': '#fff',
        },
      })
      photoLayerIds.current.push(ptId)

      const lblId = `${srcId}-labels`
      m.addLayer({
        id: lblId, type: 'symbol', source: srcId,
        layout: {
          'text-field': ['get', 'fileName'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'text-max-width': 12,
        },
        paint: { 'text-color': '#9f1239', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
        minzoom: 11,
      })
      photoLayerIds.current.push(lblId)
      photoLayerIds.current.push(srcId)

      m.on('click', ptId, (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const p = feat.properties as Record<string, string>
        const coords = (feat.geometry as { type: 'Point'; coordinates: [number, number] }).coordinates
        let rows = ''
        rows += `<tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Tọa độ</td><td style="font-weight:600;font-size:11px;font-family:monospace">${formatCoord(coords[0], coords[1])}</td></tr>`
        if (p.altitude && p.altitude !== 'null') rows += `<tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Cao độ</td><td style="font-weight:600;font-size:11px">${parseFloat(p.altitude).toFixed(1)} m</td></tr>`
        if (p.timestamp && p.timestamp !== 'null') rows += `<tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Thời gian chụp</td><td style="font-weight:600;font-size:11px">${p.timestamp}</td></tr>`
        if (p.direction && p.direction !== 'null') rows += `<tr><td style="color:#64748b;padding:2px 8px 2px 0;font-size:11px">Hướng chụp</td><td style="font-weight:600;font-size:11px">${parseFloat(p.direction).toFixed(0)}°</td></tr>`
        popup.current?.remove()
        popup.current = new maplibregl.Popup({ maxWidth: '320px' })
          .setLngLat(coords)
          .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px 0"><div style="font-weight:700;font-size:13px;color:#e11d48;margin-bottom:4px">📷 ${p.fileName}</div><table style="border-collapse:collapse">${rows}</table></div>`)
          .addTo(m)
      })
      m.on('mouseenter', ptId, () => { m.getCanvas().style.cursor = 'pointer' })
      m.on('mouseleave', ptId, () => { m.getCanvas().style.cursor = '' })

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds()
      data.photos.forEach((p: { longitude: number; latitude: number }) => bounds.extend([p.longitude, p.latitude]))
      m.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1000 })

      setPhotoInfo(`${data.gpsFound}/${data.totalPhotos} ảnh có GPS`)
      if (data.errors?.length > 0) setPhotoError(data.errors.slice(0, 2).join('; '))
    } catch (e) {
      setPhotoError(String(e))
    } finally {
      setPhotoLoading(false)
    }
  }

  return (
    <div className="relative w-full h-full flex">
      {/* Street directory panel */}
      {showStreets && (
        <div className="w-72 bg-white border-r flex flex-col shrink-0 z-10 shadow-lg" style={{ maxHeight: '100%' }}>
          <div className="px-3 py-2.5 border-b bg-blue-800 text-white">
            <p className="font-bold text-sm">Tuyến đường theo phường/xã</p>
            <p className="text-xs text-blue-200 mt-0.5">{wardsData.length} đơn vị · {totalStreets} tuyến đường</p>
          </div>
          <div className="px-2 py-2 border-b">
            <input
              type="text"
              value={streetSearch}
              onChange={e => setStreetSearch(e.target.value)}
              placeholder="Tìm tên đường..."
              className="w-full h-8 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {loadingStreets ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 animate-pulse">Đang tải...</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredWards.map(ward => (
                <div key={ward.id} className="border-b">
                  <button
                    onClick={() => {
                      setExpandedWard(expandedWard === ward.id ? null : ward.id)
                      if (map.current) map.current.flyTo({ center: [ward.lon, ward.lat], zoom: 13, duration: 800 })
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-slate-800">{ward.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-bold shrink-0 ml-1">
                      {ward.streetCount}
                    </span>
                  </button>
                  {expandedWard === ward.id && (
                    <ul className="pb-2 px-3 space-y-0.5">
                      {(streetSearch ? ward.streets : ward.streets).map(s => (
                        <li key={s.id} className="flex items-center justify-between">
                          <span className="text-xs text-slate-700">• {s.name}</span>
                          {s.lengthKm && <span className="text-[10px] text-slate-400 shrink-0 ml-1">{s.lengthKm}km</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {filteredWards.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">Không tìm thấy tuyến đường</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map area */}
      <div className="relative flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {/* Tuyến đường toggle */}
          <button
            onClick={toggleStreets}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-colors ${showStreets ? 'bg-blue-800 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'}`}
          >
            🛣️ Tuyến đường
            {showStreets && totalStreets > 0 && <span className="bg-white/20 rounded-full px-1.5">{totalStreets}</span>}
          </button>

          {/* Ranh giới xã/phường toggle */}
          <button
            onClick={() => setShowBoundaries(!showBoundaries)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-colors ${showBoundaries ? 'bg-teal-800 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'}`}
          >
            🗺️ Ranh giới xã/phường
          </button>

          {/* Phân tích GPMB ĐSTĐC toggle */}
          <button
            onClick={() => setShowRailImpact(!showRailImpact)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-colors ${showRailImpact ? 'bg-red-800 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50'}`}
          >
            🚄 Phân tích GPMB ĐSTĐC
          </button>

          {/* Hạ tầng giao thông toggles */}
          <div className="bg-white rounded-xl shadow-lg border px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-2">Hạ tầng giao thông</p>
            <div className="flex flex-col gap-1">
              <button onClick={toggleRoads}
                className={`text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center gap-1.5 ${showRoads ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                🛣️ Đường bộ {showRoads && roadCount > 0 && <span className="text-[10px] opacity-75">({roadCount})</span>}
              </button>

              {/* Lớp con đường bộ */}
              {showRoads && (
                <div className="ml-3 pl-2 border-l-2 border-blue-200 flex flex-col gap-0.5">
                  {([
                    ['caotoc', '🔴', 'Cao tốc', '#dc2626'],
                    ['quoclo', '🟠', 'Quốc lộ', '#ea580c'],
                    ['hcm',    '🟢', 'Đường HCM', '#16a34a'],
                    ['tinhlodthuyen', '🟡', 'Tỉnh lộ · Đ.huyện', '#d97706'],
                    ['lienxa', '🟩', 'Đường liên xã', '#65a30d'],
                    ['dancu',  '🔵', 'Đường dân cư', '#3b82f6'],
                    ['khac',   '🟣', 'Đường khác', '#6366f1'],
                  ] as [string, string, string, string][]).map(([key, icon, label, color]) => (
                    <button key={key} onClick={() => toggleRoadSub(key)}
                      className={`text-[11px] px-2 py-1 rounded text-left transition-colors flex items-center gap-1.5 ${roadSub[key] ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>
                      <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: roadSub[key] ? color : '#cbd5e1' }} />
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={toggleRail}
                className={`text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center gap-1.5 ${showRail ? 'bg-red-700 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                🚂 Đường sắt
              </button>
              <button onClick={toggleGpmb}
                className={`text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center gap-1.5 ${showGpmb ? 'bg-red-500 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                🚄 GPMB ĐS cao tốc
              </button>
              <button onClick={toggleAirport}
                className={`text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center gap-1.5 ${showAirport ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                ✈️ Sân bay
              </button>
              <button onClick={togglePort}
                className={`text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center gap-1.5 ${showPort ? 'bg-sky-700 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                ⚓ Cảng biển
              </button>
            </div>
          </div>

          {/* Đường sắt cao tốc (ước lượng cũ) toggle */}
          <button
            onClick={toggleRailway}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-colors ${showRailway ? 'bg-red-700 text-white border-red-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50'}`}
          >
            🚄 Ga ĐS cao tốc
          </button>

          {/* Import GIS/DXF/KML */}
          <button
            onClick={() => setShowImport(!showImport)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-semibold transition-colors ${showImport ? 'bg-violet-700 text-white border-violet-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-violet-50'}`}
          >
            📥 Import GIS
          </button>

          {showImport && (
            <div className="bg-white rounded-xl shadow-lg border px-3 py-3 w-60">
              <p className="text-xs font-semibold text-slate-700 mb-2">Import file lên bản đồ</p>
              <p className="text-[10px] text-slate-400 mb-2">GeoJSON · DXF · KML · KMZ · SHP</p>
              <input
                ref={importFileRef}
                type="file"
                accept=".dxf,.kml,.kmz,.geojson,.json,.zip,.shp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }}
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => importFileRef.current?.click()}
                  disabled={importLoading}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {importLoading ? (
                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>
                  ) : '📂 Chọn file GIS'}
                </button>
                {/* CRS Selection */}
                <div className="flex flex-col gap-1 text-[10px] text-slate-600 mt-1">
                  <span>Hệ tọa độ bản vẽ gốc:</span>
                  <select
                    value={importCrs}
                    onChange={e => setImportCrs(e.target.value)}
                    className="border rounded px-2 py-1 outline-none text-[11px] bg-slate-50"
                  >
                    <option value="auto">Tự nhận dạng</option>
                    <option value="EPSG:4326">WGS84 / EPSG:4326</option>
                    <option value="EPSG:3857">Web Mercator / EPSG:3857</option>
                    <option value="VN2000_QUANGTRI_TM3">VN-2000 TM-3 Quảng Trị</option>
                  </select>
                </div>
                {detectedCrsInfo && (
                  <div className="text-[9px] text-slate-500 italic mt-0.5">
                    {detectedCrsInfo}
                  </div>
                )}
                {importInfo && (
                  <div className="text-[10px] text-violet-700 bg-violet-50 rounded px-2 py-1.5 mt-1">
                    ✅ {importInfo}
                  </div>
                )}
                {importError && (
                  <div className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1 mt-1">
                    ⚠️ {importError}
                  </div>
                )}
                {importLayerIds.current.length > 0 && (
                  <button
                    onClick={clearImportLayers}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    🗑️ Xoá lớp import
                  </button>
                )}
              </div>

              {/* Phân cách */}
              <div className="border-t my-2.5" />

              {/* Import ảnh GPS */}
              <p className="text-xs font-semibold text-slate-700 mb-1">📷 Ảnh chụp có GPS</p>
              <p className="text-[10px] text-slate-400 mb-2">Chọn ảnh JPG/HEIC — trích tọa độ từ EXIF</p>
              <input
                ref={photoFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/heic,image/heif,image/png,image/tiff,.jpg,.jpeg,.heic,.heif,.png,.tiff"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files && e.target.files.length > 0) handlePhotoFiles(e.target.files) }}
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => photoFileRef.current?.click()}
                  disabled={photoLoading}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {photoLoading ? (
                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang đọc GPS...</>
                  ) : '📷 Chọn ảnh'}
                </button>
                {photoInfo && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 rounded px-2 py-1.5">
                    ✅ {photoInfo}
                  </div>
                )}
                {photoError && (
                  <div className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
                    ⚠️ {photoError}
                  </div>
                )}
                {photoLayerIds.current.length > 0 && (
                  <button
                    onClick={clearPhotoLayers}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    🗑️ Xoá điểm ảnh GPS
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Domain filter */}
          <div className="bg-white rounded-xl shadow-lg border px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-2">Lọc lĩnh vực</p>
            <div className="flex flex-col gap-1">
              <button onClick={() => handleDomainFilter('')}
                className={`text-xs px-2.5 py-1 rounded-full text-left transition-colors ${!selectedDomain ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                Tất cả {!selectedDomain && `(${assetCount})`}
              </button>
              {Object.entries(DOMAIN_LABEL).map(([key, label]) => (
                <button key={key} onClick={() => handleDomainFilter(key)}
                  className={`text-xs px-2.5 py-1 rounded-full text-left transition-colors flex items-center gap-1.5 ${selectedDomain === key ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DOMAIN_COLORS[key] }} />
                  {label} {selectedDomain === key && `(${assetCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Legend condition */}
          <div className="bg-white rounded-xl shadow-lg border px-3 py-2">
            <p className="text-xs font-semibold text-slate-700 mb-2">Tình trạng</p>
            {[['TOT','Tốt'],['KHA','Khá'],['TRUNG_BINH','Trung bình'],['XAU','Xấu'],['HONG','Hỏng']].map(([k,l]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CONDITION_COLORS[k] }} />
                {l}
              </div>
            ))}
          </div>

          {/* Chú giải mật độ dân số */}
          {showBoundaries && (
            <div className="bg-white rounded-xl shadow-lg border px-3 py-2">
              <p className="text-xs font-semibold text-slate-700 mb-2">Mật độ dân số</p>
              {[
                ['#d1fae5', '< 100 người/km²'],
                ['#6ee7b7', '100–300'],
                ['#34d399', '300–800'],
                ['#fbbf24', '800–1.500'],
                ['#f97316', '1.500–3.000'],
                ['#ef4444', '> 3.000'],
              ].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                  <span className="w-3 h-3 rounded-sm shrink-0 border border-slate-200" style={{ background: c }} />
                  {l}
                </div>
              ))}
            </div>
          )}

          {/* Chú giải hạ tầng */}
          {(showRoads || showRail || showAirport || showPort || showGpmb) && (
            <div className="bg-white rounded-xl shadow-lg border px-3 py-2">
              <p className="text-xs font-semibold text-slate-700 mb-2">Chú giải</p>
              {showRoads && <>
                {[['#dc2626','Cao tốc','caotoc'],['#ea580c','Quốc lộ','quoclo'],['#16a34a','Đ. HCM','hcm'],['#d97706','Tỉnh lộ/Huyện','tinhlodthuyen'],['#65a30d','Đ. liên xã','lienxa'],['#3b82f6','Đ. dân cư','dancu'],['#6366f1','Đ. khác','khac']].filter(([,,k]) => roadSub[k]).map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                    <span className="w-4 h-0.5 rounded-full shrink-0" style={{ background: c }} />{l}
                  </div>
                ))}
              </>}
              {showRail && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                  <span className="w-4 h-0.5 shrink-0 border-t-2 border-dashed" style={{ borderColor: '#991b1b' }} />Đường sắt
                </div>
              )}
              {showGpmb && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                  <span className="w-4 h-0.5 shrink-0" style={{ background: '#dc2626' }} />GPMB ĐS cao tốc
                </div>
              )}
              {showAirport && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#7c3aed' }} />Sân bay
                </div>
              )}
              {showPort && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#0369a1' }} />Cảng biển
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tìm kiếm tuyến đường */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[calc(100%-200px)]">
          <div className="relative">
            <input
              type="text"
              value={roadSearch}
              onChange={e => searchRoads(e.target.value)}
              onFocus={() => { setShowRoadSearch(true); if (!showRoads && map.current) { setShowRoads(true); ensureInfra(map.current, () => toggleLayers(map.current!, ROAD_LAYERS, true)) } }}
              placeholder="🔍 Tìm tuyến đường (tên, mã)..."
              className="w-full h-9 px-4 pr-8 text-sm bg-white border rounded-xl shadow-lg outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            {roadSearch && (
              <button onClick={() => { setRoadSearch(''); setRoadResults([]); setShowRoadSearch(false) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            )}
          </div>
          {showRoadSearch && roadResults.length > 0 && (
            <div className="mt-1 bg-white rounded-xl shadow-xl border max-h-72 overflow-y-auto">
              {roadResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => flyToRoad(r)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b last:border-b-0 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="flex-1 text-sm text-slate-800 truncate">{r.name}</span>
                  {r.ref && <span className="text-[10px] text-slate-400 shrink-0 font-mono">{r.ref}</span>}
                  {r.label && <span className="text-[10px] text-blue-500 shrink-0">{r.label}</span>}
                </button>
              ))}
            </div>
          )}
          {showRoadSearch && roadSearch.trim() && roadResults.length === 0 && (
            <div className="mt-1 bg-white rounded-xl shadow-xl border px-3 py-2 text-xs text-slate-400 text-center">
              Không tìm thấy · Bật lớp Đường bộ trước
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute top-3 right-16 z-10 bg-white rounded-lg shadow border px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Đang tải tài sản...
          </div>
        )}

        {!loading && isZoomedOut && (
          <div className="absolute top-3 right-16 z-10 bg-amber-50/95 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 px-3.5 py-2 text-xs text-amber-800 flex items-center gap-2 font-medium">
            <span className="text-sm">🔍</span>
            <span>Phóng to bản đồ (Zoom ≥ 10) để xem chi tiết tài sản hạ tầng</span>
          </div>
        )}

        {/* Coordinates and Boundary Info Panel */}
        <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border p-3 w-80 text-xs flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b pb-1">
            <strong className="text-slate-800 flex items-center gap-1">📍 Công cụ tọa độ & địa giới</strong>
            {clickedCoord && (
              <button
                onClick={() => {
                  if (clickedCoord) {
                    navigator.clipboard.writeText(`${clickedCoord.lat.toFixed(6)}, ${clickedCoord.lng.toFixed(6)}`)
                    alert('Đã sao chép tọa độ: ' + clickedCoord.lat.toFixed(6) + ', ' + clickedCoord.lng.toFixed(6))
                  }
                }}
                className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold transition-colors"
              >
                📋 Sao chép
              </button>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Tọa độ con trỏ:</span>
              <span ref={cursorCoordRef} className="font-mono text-slate-700">Di chuột trên bản đồ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Xã/phường hiện tại:</span>
              <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">{hoveredCommune ? hoveredCommune.fullName : 'Di chuột để xem'}</span>
            </div>
            {hoveredCommune && (
              <div className="bg-slate-50 border rounded p-1.5 mt-1 text-[11px] text-slate-600 space-y-0.5">
                <div className="flex justify-between"><span>Loại:</span><span className="font-medium text-slate-800">{hoveredCommune.type}</span></div>
                <div className="flex justify-between"><span>Diện tích:</span><span className="font-medium text-slate-800">{hoveredCommune.areaKm2} km²</span></div>
                <div className="flex justify-between"><span>Dân số:</span><span className="font-medium text-slate-800">{Number(hoveredCommune.population || 0).toLocaleString('vi-VN')} người</span></div>
                <div className="flex justify-between"><span>Mật độ:</span><span className="font-medium text-slate-800">{Number(hoveredCommune.densityPerKm2 || 0).toLocaleString('vi-VN')} người/km²</span></div>
                {(() => {
                  try {
                    const arr: string[] = typeof hoveredCommune.mergedFrom === 'string' ? JSON.parse(hoveredCommune.mergedFrom) : []
                    if (!arr.length) return null
                    return (
                      <div className="pt-0.5 border-t mt-0.5">
                        <span className="text-slate-400">Sáp nhập từ: </span>
                        <span className="font-medium text-slate-700">{arr.join(', ')}</span>
                      </div>
                    )
                  } catch { return null }
                })()}
                <div className="text-[9px] text-slate-400 italic pt-0.5">Bấm để phóng đến khu vực</div>
              </div>
            )}
            <div className="border-t my-1 pt-1 flex justify-between">
              <span className="text-slate-500">Tọa độ đã chọn:</span>
              <span className="font-mono text-slate-800 font-semibold">{clickedCoord ? `${clickedCoord.lat.toFixed(6)}, ${clickedCoord.lng.toFixed(6)}` : 'Bấm bản đồ để lấy'}</span>
            </div>
          </div>
        </div>

        {/* High-speed rail buffer analysis panel */}
        {showRailImpact && (
          <div className="absolute top-3 left-80 z-20 w-[420px] max-h-[calc(100vh-60px)] overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border p-4 flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">🚄 Phân tích GPMB ĐS Cao Tốc</h3>
              <button
                onClick={() => setShowRailImpact(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Tuyến đường sắt:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => railFileInputRef.current?.click()}
                    disabled={railFileLoading}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border rounded text-slate-700 font-medium truncate disabled:opacity-50"
                  >
                    {railFileLoading ? 'Đang nạp...' : customRailFile ? `📂 Tuyến: ${customRailFile.fileName || 'Đã nạp'}` : '📂 Chọn file tuyến (.kml, .kmz, .geojson)'}
                  </button>
                  {customRailFile && (
                    <button
                      onClick={() => setCustomRailFile(null)}
                      className="px-2 border rounded hover:bg-slate-50 text-red-500 font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <input
                  ref={railFileInputRef}
                  type="file"
                  accept=".kml,.kmz,.geojson,.json"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleRailFileUpload(f) }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 my-1">
                <span className="font-semibold text-slate-700">Bề rộng GPMB (mét):</span>
                <input
                  type="number"
                  min="1"
                  value={railCorridorWidth}
                  onChange={e => setRailCorridorWidth(Math.max(1, Number(e.target.value)))}
                  className="w-20 border rounded px-2 py-1 text-center font-bold text-blue-600"
                />
              </div>

              <div className="flex flex-col gap-1 border-t pt-2">
                <span className="font-semibold text-slate-700">Khu tái định cư:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => resettlementFileInputRef.current?.click()}
                    disabled={resetFileLoading}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border rounded text-slate-700 font-medium truncate disabled:opacity-50"
                  >
                    {resetFileLoading ? 'Đang nạp...' : customResettlementFile ? `📂 TĐC: ${customResettlementFile.fileName || 'Đã nạp'}` : '📂 Chọn file TĐC (.kml, .kmz, .geojson)'}
                  </button>
                  {customResettlementFile && (
                    <button
                      onClick={() => { setCustomResettlementFile(null); setResettlementStatusText('Chưa nạp') }}
                      className="px-2 border rounded hover:bg-slate-50 text-red-500 font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <input
                  ref={resettlementFileInputRef}
                  type="file"
                  accept=".kml,.kmz,.geojson,.json"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleResettlementFileUpload(f) }}
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Trạng thái: {resettlementStatusText}</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mt-1">
                <p className="font-semibold text-blue-800 text-[11px]">Kết quả phân tích:</p>
                <p className="text-[11px] text-blue-900 mt-1 leading-relaxed">{railImpactSummary || 'Đang tính toán...'}</p>
              </div>

              {railImpactRows && railImpactRows.length > 0 ? (
                <div className="border rounded-lg overflow-hidden mt-1 max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b text-slate-700 font-semibold">
                        <th className="p-2">Xã/Phường</th>
                        <th className="p-2">Chiều dài</th>
                        <th className="p-2">Diện tích GPMB</th>
                        <th className="p-2">Khu TĐC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {railImpactRows.map((row, idx) => (
                        <tr key={row.key} className="border-b last:border-0 hover:bg-slate-50 text-slate-700">
                          <td className="p-2 font-medium">{row.name}</td>
                          <td className="p-2">{row.lengthM >= 1000 ? `${(row.lengthM / 1000).toFixed(2)} km` : `${Math.round(row.lengthM)} m`}</td>
                          <td className="p-2">{(row.areaM2 / 10000).toFixed(2)} ha</td>
                          <td className="p-2 text-teal-700 font-semibold">{row.resettlement.count > 0 ? `${row.resettlement.count} khu / ${(row.resettlement.areaM2 / 10000).toFixed(1)}ha` : '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4 italic">Không có đoạn tuyến nào đi qua địa phận xã/phường có sẵn</p>
              )}
            </div>
          </div>
        )}

        <div ref={mapContainer} className="flex-1 w-full" style={{ minHeight: 0 }} />
      </div>
    </div>
  )
}
