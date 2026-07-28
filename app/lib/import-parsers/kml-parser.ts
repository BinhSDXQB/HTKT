/**
 * Parser KML/KMZ (Google Earth)
 * KMZ = ZIP chứa doc.kml
 */
import type { ParsedFeature, ParseResult } from './types'

/** Parse KML text → features */
export function parseKMLText(kmlText: string): ParsedFeature[] {
  const features: ParsedFeature[] = []

  // Regex-based parser cho KML (tránh phụ thuộc DOM parser)
  const placemarkRegex = /<Placemark[\s\S]*?<\/Placemark>/gi
  const nameRegex = /<name>([\s\S]*?)<\/name>/i
  const descRegex = /<description>([\s\S]*?)<\/description>/i
  const extDataRegex = /<SimpleData\s+name="([^"]+)">([\s\S]*?)<\/SimpleData>/gi

  let pm: RegExpExecArray | null
  while ((pm = placemarkRegex.exec(kmlText)) !== null) {
    const block = pm[0]
    const name = nameRegex.exec(block)?.[1]?.trim() ?? ''
    const desc = descRegex.exec(block)?.[1]?.trim() ?? ''

    const props: Record<string, string | number | null> = { name, description: desc }

    // ExtendedData
    let ed: RegExpExecArray | null
    const edRx = new RegExp(extDataRegex.source, 'gi')
    while ((ed = edRx.exec(block)) !== null) {
      props[ed[1]] = isNaN(Number(ed[2])) ? ed[2] : Number(ed[2])
    }

    // Point
    const coordPoint = /<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i.exec(block)
    if (coordPoint) {
      const parts = coordPoint[1].trim().split(',')
      const lon = parseFloat(parts[0]), lat = parseFloat(parts[1]), alt = parseFloat(parts[2] ?? '0')
      if (!isNaN(lon) && !isNaN(lat)) {
        features.push({
          geometry: { type: 'Point', coordinates: [lon, lat, isNaN(alt) ? undefined : alt] },
          properties: props,
          label: name,
        })
      }
    }

    // LineString
    const coordLine = /<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i.exec(block)
    if (coordLine) {
      const coords = coordLine[1].trim().split(/\s+/).map(c => {
        const p = c.split(',')
        return [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2] ?? '0')] as [number,number,number?]
      }).filter(c => !isNaN(c[0]) && !isNaN(c[1]))
      if (coords.length >= 2) {
        features.push({ geometry: { type: 'LineString', coordinates: coords }, properties: props, label: name })
      }
    }

    // Polygon
    const coordPoly = /<outerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i.exec(block)
    if (coordPoly) {
      const ring = coordPoly[1].trim().split(/\s+/).map(c => {
        const p = c.split(',')
        return [parseFloat(p[0]), parseFloat(p[1])] as [number,number]
      }).filter(c => !isNaN(c[0]) && !isNaN(c[1]))
      if (ring.length >= 3) {
        features.push({ geometry: { type: 'Polygon', coordinates: [ring] }, properties: props, label: name })
      }
    }
  }

  return features
}

export async function parseKML(buffer: Buffer): Promise<ParseResult> {
  const kmlText = buffer.toString('utf-8')
  if (!kmlText.includes('<kml') && !kmlText.includes('<KML')) {
    return { format: 'KML', features: [], errors: ['File không phải định dạng KML hợp lệ'], warnings: [] }
  }

  const features = parseKMLText(kmlText)
  const warnings: string[] = []
  if (features.length === 0) warnings.push('KML không có Placemark nào với geometry hợp lệ.')

  return { format: 'KML', features, errors: [], warnings, crs: 'WGS84' }
}

export async function parseKMZ(buffer: Buffer): Promise<ParseResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(buffer)
    const kmlEntry = zip.getEntries().find((e: { entryName: string }) => e.entryName.endsWith('.kml'))
    if (!kmlEntry) return { format: 'KMZ', features: [], errors: ['Không tìm thấy file .kml trong KMZ'], warnings: [] }
    const kmlText = (kmlEntry.getData() as Buffer).toString('utf-8')
    const features = parseKMLText(kmlText)
    return { format: 'KMZ', features, errors: [], warnings: [], crs: 'WGS84' }
  } catch {
    return { format: 'KMZ', features: [], errors: ['Lỗi đọc KMZ. Thử chuyển sang KML.'], warnings: [] }
  }
}
