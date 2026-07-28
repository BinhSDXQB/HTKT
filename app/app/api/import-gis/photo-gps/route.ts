import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import ExifReader from 'exifreader'

type PhotoGPS = {
  fileName: string
  latitude: number
  longitude: number
  altitude: number | null
  timestamp: string | null
  direction: number | null
  accuracy: string | null
}

function dmsToDecimal(
  dms: { value: [number, number, number] } | undefined,
  ref: { value: string[] } | undefined,
): number | null {
  if (!dms?.value || !ref?.value) return null
  const [d, m, s] = dms.value
  const decimal = d + m / 60 + s / 3600
  const dir = ref.value[0]
  return (dir === 'S' || dir === 'W') ? -decimal : decimal
}

export async function POST(req: NextRequest) {
  try { await requireAuth() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (files.length === 0) {
    return NextResponse.json({ error: 'Chưa chọn ảnh' }, { status: 400 })
  }

  const results: PhotoGPS[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const tags = ExifReader.load(buffer, { expanded: true })

      const gps = tags.gps
      if (!gps?.Latitude || !gps?.Longitude) {
        errors.push(`${file.name}: Không có thông tin GPS trong ảnh`)
        continue
      }

      let timestamp: string | null = null
      if (tags.exif?.DateTimeOriginal?.description) {
        timestamp = tags.exif.DateTimeOriginal.description
      } else if (tags.exif?.DateTime?.description) {
        timestamp = tags.exif.DateTime.description
      }

      results.push({
        fileName: file.name,
        latitude: gps.Latitude,
        longitude: gps.Longitude,
        altitude: gps.Altitude ?? null,
        timestamp,
        direction: (gps as Record<string, number | undefined>).GPSImgDirection ?? null,
        accuracy: (gps as Record<string, string | undefined>).GPSHPositioningError ?? null,
      })
    } catch {
      errors.push(`${file.name}: Không đọc được EXIF`)
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join('; '), photos: [], errors }, { status: 400 })
  }

  const geojson = {
    type: 'FeatureCollection' as const,
    features: results.map((p, i) => ({
      type: 'Feature' as const,
      properties: {
        _idx: i,
        _label: p.fileName,
        fileName: p.fileName,
        altitude: p.altitude,
        timestamp: p.timestamp,
        direction: p.direction,
        accuracy: p.accuracy,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude, ...(p.altitude != null ? [p.altitude] : [])],
      },
    })),
  }

  return NextResponse.json({
    photos: results,
    errors,
    totalPhotos: files.length,
    gpsFound: results.length,
    geojson,
  })
}
