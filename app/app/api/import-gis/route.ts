/**
 * API Import GIS đa định dạng — Preview only
 * Parse DXF, KML, KMZ, GeoJSON → trả features để user xem trước
 * Việc map → bảng cụ thể cần UI bước 2
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { parseAnyFormat } from '@/lib/import-parsers'

export async function POST(req: NextRequest) {
  try { await requireAuth() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await parseAnyFormat(buffer, file.name)

  return NextResponse.json({
    format: result.format,
    totalFeatures: result.features.length,
    errors: result.errors,
    warnings: result.warnings,
    crs: result.crs,
    layers: result.layers ?? [],
    // Preview 100 features đầu
    preview: result.features.slice(0, 100).map(f => ({
      geometry: f.geometry,
      label: f.label ?? (f.properties.name as string) ?? (f.properties.label as string) ?? null,
      layer: f.sourceLayer ?? null,
      assetType: f.properties.assetType ?? null,
      properties: Object.fromEntries(
        Object.entries(f.properties).slice(0, 10) // Giới hạn fields hiển thị
      ),
    })),
  })
}
