import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { computeDoiSoatDuong } from '@/lib/htkt/doi-soat'
import fs from 'fs'
import path from 'path'

// GeoJSON cảnh báo số hóa — tô màu ranh đơn vị theo mức độ đối soát, tính ĐỘNG từ DB.
// Thay thế file tĩnh /data/canh-bao-so-hoa.geojson: sửa report_duong là bản đồ tự đổi màu.

let ADMIN_CACHE: { mtimeMs: number; byCode: Map<string, { geometry: unknown; bbox: unknown }> } | null = null

function loadAdmin() {
  const p = path.join(process.cwd(), 'public', 'data', 'admin-boundaries.geojson')
  const stat = fs.statSync(p)
  if (ADMIN_CACHE && ADMIN_CACHE.mtimeMs === stat.mtimeMs) return ADMIN_CACHE.byCode
  const gj = JSON.parse(fs.readFileSync(p, 'utf8'))
  const byCode = new Map<string, { geometry: unknown; bbox: unknown }>()
  for (const f of gj.features ?? []) {
    byCode.set(String(f.properties?.code), { geometry: f.geometry, bbox: f.properties?.bbox ?? null })
  }
  ADMIN_CACHE = { mtimeMs: stat.mtimeMs, byCode }
  return byCode
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = Number(new URL(req.url).searchParams.get('year') || 2025)
  const rows = await computeDoiSoatDuong(year)
  const byCode = loadAdmin()

  const features = []
  for (const r of rows) {
    const geo = byCode.get(r.code)
    if (!geo) continue
    features.push({
      type: 'Feature',
      geometry: geo.geometry,
      properties: {
        donVi: r.donVi, mucDo: r.mucDo, mau: r.mau,
        chiTiet: r.chiTiet, khaiBao: r.khaiBao,
        gisDiaPhuong: r.gisDiaPhuong, gisTong: r.gisTong,
        thieuSoVoiBanDo: r.thieuSoVoiBanDo,
        nhanDinh: r.nhanDinh, deNghi: r.deNghi,
        code: r.code, bbox: geo.bbox,
      },
    })
  }
  return NextResponse.json({
    type: 'FeatureCollection',
    meta: { nguon: 'DB live (report_duong + ward_gis_length + ward_khai_bao)', year, soDonVi: features.length },
    features,
  })
}
