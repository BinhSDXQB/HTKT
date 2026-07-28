import type { ParsedFeature, ParseResult } from './types'

export async function parseGeoJSON(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let json: Record<string, unknown>

  try {
    json = JSON.parse(buffer.toString('utf-8'))
  } catch (e) {
    return { format: 'GEOJSON', features: [], errors: [`GeoJSON không hợp lệ: ${e}`], warnings }
  }

  const type = json.type as string
  if (!['FeatureCollection','Feature','GeometryCollection'].includes(type)) {
    return { format: 'GEOJSON', features: [], errors: ['Không phải định dạng GeoJSON chuẩn (cần FeatureCollection/Feature)'], warnings }
  }

  const rawFeatures: unknown[] = type === 'FeatureCollection'
    ? (json.features as unknown[]) ?? []
    : [json]

  const features: ParsedFeature[] = []
  for (const f of rawFeatures) {
    const feat = f as { type: string; geometry: { type: string; coordinates: unknown }; properties: Record<string,unknown> }
    if (!feat.geometry) continue
    features.push({
      geometry: feat.geometry as ParsedFeature['geometry'],
      properties: Object.fromEntries(
        Object.entries(feat.properties ?? {}).map(([k,v]) => [k, v === null ? null : (typeof v === 'object' ? JSON.stringify(v) : v as string|number|boolean)])
      ),
    })
  }

  if (features.length === 0) warnings.push('GeoJSON không có feature nào.')

  return { format: 'GEOJSON', features, errors, warnings, crs: 'WGS84' }
}
