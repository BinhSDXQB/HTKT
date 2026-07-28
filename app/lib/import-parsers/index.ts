export { parseDXF } from './dxf-parser'
export { parseKML, parseKMZ } from './kml-parser'
export { parseGeoJSON } from './geojson-parser'
export type { ParseResult, ParsedFeature, ParsedGeometry } from './types'
export { DXF_LAYER_MAP, CRS_OPTIONS } from './types'

import type { ParseResult } from './types'
import { parseDXF } from './dxf-parser'
import { parseKML, parseKMZ } from './kml-parser'
import { parseGeoJSON } from './geojson-parser'

/** Auto-detect format từ filename + buffer và parse */
export async function parseAnyFormat(
  buffer: Buffer,
  fileName: string,
): Promise<ParseResult> {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''

  switch (ext) {
    case 'dxf': return parseDXF(buffer)
    case 'kml': return parseKML(buffer)
    case 'kmz': return parseKMZ(buffer)
    case 'geojson':
    case 'json': return parseGeoJSON(buffer)
    default:
      // Thử detect từ nội dung
      const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 500))
      if (text.includes('<kml') || text.includes('<KML')) return parseKML(buffer)
      if (text.startsWith('{') || text.startsWith('[')) return parseGeoJSON(buffer)
      if (text.includes('SECTION') && text.includes('ENTITIES')) return parseDXF(buffer)

      return {
        format: 'GEOJSON',
        features: [],
        errors: [`Định dạng file "${ext}" chưa được hỗ trợ. Hỗ trợ: DXF, KML, KMZ, GeoJSON`],
        warnings: [],
      }
  }
}
