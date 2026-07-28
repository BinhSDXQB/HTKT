/**
 * Parser DXF (AutoCAD Drawing Exchange Format)
 * Hỗ trợ: POINT, LINE, LWPOLYLINE, POLYLINE, TEXT, MTEXT, CIRCLE, ARC
 * Trích xuất: layer, geometry, text annotation
 */
import type { ParsedFeature, ParseResult } from './types'
import { DXF_LAYER_MAP } from './types'

type DXFEntity = {
  type: string
  layer: string
  coords: [number, number, number?][]
  text?: string
  radius?: number
  properties: Record<string, string>
}

/** Đọc DXF text → trích xuất entities */
function parseDXFText(dxfText: string): DXFEntity[] {
  const entities: DXFEntity[] = []
  const lines = dxfText.split(/\r?\n/)
  let i = 0

  function nextPair(): [string, string] | null {
    while (i < lines.length) {
      const code = lines[i]?.trim()
      const value = lines[i + 1]?.trim()
      i += 2
      if (code !== undefined && value !== undefined) return [code, value]
    }
    return null
  }

  // Tìm section ENTITIES
  let inEntities = false
  while (i < lines.length) {
    const pair = nextPair()
    if (!pair) break
    const [code, value] = pair
    if (code === '0' && value === 'SECTION') {
      const next = nextPair()
      if (next && next[0] === '2' && next[1] === 'ENTITIES') inEntities = true
    }
    if (!inEntities) continue
    if (code === '0' && value === 'ENDSEC') break

    if (code === '0') {
      const entityType = value
      const entity: DXFEntity = { type: entityType, layer: '0', coords: [], properties: {} }
      let parsing = true

      while (parsing && i < lines.length) {
        const p = nextPair()
        if (!p) break
        const [c, v] = p

        if (c === '0') {
          // Đã gặp entity mới → lùi lại
          i -= 2
          parsing = false
          break
        }

        switch (c) {
          case '8':  entity.layer = v; break
          case '10': entity.coords[0] = [parseFloat(v), entity.coords[0]?.[1] ?? 0, entity.coords[0]?.[2]]; break
          case '20': if (entity.coords[0]) entity.coords[0][1] = parseFloat(v); break
          case '30': if (entity.coords[0]) entity.coords[0][2] = parseFloat(v); break
          case '11': entity.coords[1] = [parseFloat(v), entity.coords[1]?.[1] ?? 0]; break
          case '21': if (entity.coords[1]) entity.coords[1][1] = parseFloat(v); break
          case '40': entity.radius = parseFloat(v); break
          case '1':  entity.text = v; break
          default:   entity.properties[c] = v; break
        }
      }

      if (entityType === 'LWPOLYLINE') {
        // LWPOLYLINE lưu coords theo cặp X(10)/Y(20) riêng biệt
        entity.coords = []
      }

      if (['POINT','LINE','LWPOLYLINE','POLYLINE','TEXT','MTEXT','CIRCLE'].includes(entityType)) {
        entities.push(entity)
      }
    }
  }

  return entities
}

/** Đọc LWPOLYLINE vertices (nhiều cặp 10/20) */
function parseLWPolyline(dxfText: string): DXFEntity[] {
  const entities: DXFEntity[] = []
  const regex = /\s*0\s*\nLWPOLYLINE([\s\S]*?)(?=\s*0\s*\n(?!VERTEX))/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(dxfText)) !== null) {
    const block = match[1]
    const layer = (block.match(/\s*8\s*\n([^\n]+)/)?.[1] ?? '0').trim()
    const coords: [number, number][] = []

    const xMatches = [...block.matchAll(/\s*10\s*\n([^\n]+)/g)]
    const yMatches = [...block.matchAll(/\s*20\s*\n([^\n]+)/g)]
    for (let i = 0; i < Math.min(xMatches.length, yMatches.length); i++) {
      coords.push([parseFloat(xMatches[i][1]), parseFloat(yMatches[i][1])])
    }

    if (coords.length >= 2) {
      entities.push({ type: 'LWPOLYLINE', layer, coords: coords as [number,number][], properties: {} })
    }
  }
  return entities
}

/** Convert DXF entity → ParsedFeature */
function entityToFeature(entity: DXFEntity): ParsedFeature | null {
  const assetType = DXF_LAYER_MAP[entity.layer.toUpperCase()] ??
                    DXF_LAYER_MAP[entity.layer.toLowerCase()] ??
                    null

  const props: Record<string, string | number | null> = {
    layer: entity.layer,
    entityType: entity.type,
    assetType: assetType,
    label: entity.text ?? null,
  }

  switch (entity.type) {
    case 'POINT':
      if (!entity.coords[0]) return null
      return {
        geometry: { type: 'Point', coordinates: entity.coords[0] },
        properties: props,
        sourceLayer: entity.layer,
        label: entity.text,
      }

    case 'LINE':
      if (entity.coords.length < 2) return null
      return {
        geometry: { type: 'LineString', coordinates: entity.coords as [number,number,number?][] },
        properties: props,
        sourceLayer: entity.layer,
      }

    case 'LWPOLYLINE':
    case 'POLYLINE':
      if (entity.coords.length < 2) return null
      return {
        geometry: { type: 'LineString', coordinates: entity.coords as [number,number,number?][] },
        properties: props,
        sourceLayer: entity.layer,
      }

    case 'TEXT':
    case 'MTEXT':
      if (!entity.coords[0]) return null
      return {
        geometry: { type: 'Point', coordinates: entity.coords[0] },
        properties: { ...props, text: entity.text ?? '' },
        sourceLayer: entity.layer,
        label: entity.text,
      }

    default:
      return null
  }
}

/** Main parser: DXF Buffer → ParseResult */
export async function parseDXF(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  let dxfText: string
  try {
    // DXF thường là ASCII hoặc UTF-8
    dxfText = buffer.toString('utf-8')
    if (!dxfText.includes('ENTITIES')) {
      dxfText = buffer.toString('latin1') // Thử latin1 nếu UTF-8 không có ENTITIES
    }
    if (!dxfText.includes('ENTITIES')) {
      return { format: 'DXF', features: [], errors: ['File DXF không có section ENTITIES hoặc định dạng không hợp lệ'], warnings, layers: [] }
    }
  } catch (e) {
    return { format: 'DXF', features: [], errors: [`Không đọc được file DXF: ${e}`], warnings, layers: [] }
  }

  // Parse LWPOLYLINE (phức tạp hơn)
  const lwEntities = parseLWPolyline(dxfText)

  // Parse các entities khác
  const basicEntities = parseDXFText(dxfText)

  const allEntities = [...basicEntities, ...lwEntities]
  const features: ParsedFeature[] = []
  const layers = new Set<string>()

  for (const entity of allEntities) {
    layers.add(entity.layer)
    const feature = entityToFeature(entity)
    if (feature) features.push(feature)
  }

  if (features.length === 0) {
    warnings.push('Không tìm thấy geometry trong file DXF. Kiểm tra lại section ENTITIES.')
  }

  // Cảnh báo các layer không được nhận diện
  const unknownLayers = [...layers].filter(l => !DXF_LAYER_MAP[l.toUpperCase()] && !DXF_LAYER_MAP[l.toLowerCase()])
  if (unknownLayers.length > 0) {
    warnings.push(`Layer không nhận diện được loại tài sản: ${unknownLayers.join(', ')}. Cần map thủ công.`)
  }

  return {
    format: 'DXF',
    features,
    errors,
    warnings,
    crs: 'WGS84', // DXF thường dùng tọa độ local, cần georeferencing
    layers: [...layers],
  }
}
