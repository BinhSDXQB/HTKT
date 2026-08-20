import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GeoJSON FeatureCollection cho bản đồ MapLibre — phân hệ QĐ72.
// Geometry lưu GeoJSON (EPSG:4326) trong cột jsonb `geometry` của bảng nguồn (mig 038).
// Gọi: /api/qd72/gis?layer=<key>&ward=<id>&caseId=<id>

type Src = { table: string; label: string; extra?: string[]; loai?: string[] }

// Bản đồ lớp → bảng + trường (chỉ các lớp có cột geometry). Lớp phái sinh (điểm <4.5m…) tính riêng.
const SRC: Record<string, Src> = {
  ranh_gioi_do_thi:    { table: 'qd72_urban_areas', label: 'ten' },
  tuyen_duong_cc:      { table: 'qd72_road_segments', label: 'ten', extra: ['rong_thong_thuy_min_m', 'cao_thong_thuy_min_m'] },
  diem_tranh_quay_xe:  { table: 'qd72_passing_bays', label: 'ma' },
  bai_do_xe_cc:        { table: 'qd72_fire_parking_areas', label: 'ten' },
  vat_can:             { table: 'qd72_road_obstacles', label: 'mo_ta' },
  day_dien:            { table: 'qd72_overhead_utility_lines', label: 'ten_tuyen', extra: ['loai_doi_tuong', 'cao_diem_thap_nhat_m', 'trang_thai_chu_so_huu'], loai: ['Đường dây điện trung thế', 'Đường dây điện hạ thế', 'Dây điện sau công tơ'] },
  cap_vien_thong:      { table: 'qd72_overhead_utility_lines', label: 'ten_tuyen', extra: ['loai_doi_tuong', 'cao_diem_thap_nhat_m', 'trang_thai_chu_so_huu'], loai: ['Cáp viễn thông', 'Cáp internet', 'Cáp truyền hình', 'Cáp thông tin khác'] },
  day_chieu_sang:      { table: 'qd72_overhead_utility_lines', label: 'ten_tuyen', extra: ['loai_doi_tuong', 'cao_diem_thap_nhat_m'], loai: ['Dây điện chiếu sáng', 'Cần đèn / đèn trang trí'] },
  cot:                 { table: 'qd72_utility_poles', label: 'so_hieu', extra: ['tinh_trang'] },
  diem_giao_cat:       { table: 'qd72_utility_crossings', label: 'ma', extra: ['cao_thong_thuy_m'] },
  ha_tang_dung_chung:  { table: 'qd72_shared_technical_infrastructure', label: 'ma', extra: ['loai', 'chieu_dai_m'] },
  tru_nuoc_cc:         { table: 'qd72_fire_hydrants', label: 'ma', extra: ['cach_mep_duong_m', 'cach_tuong_m'] },
  nguon_nuoc:          { table: 'qd72_water_sources', label: 'ten', extra: ['loai_nguon', 'tinh_trang'] },
  ben_ho_thu_nuoc:     { table: 'qd72_water_intake_points', label: 'ma', extra: ['loai'] },
  de_xuat_chinh_trang: { table: 'qd72_renovation_plans', label: 'van_de_ton_tai', extra: ['muc_uu_tien', 'tien_do'] },
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const layer = req.nextUrl.searchParams.get('layer') || ''
  const ward = req.nextUrl.searchParams.get('ward')
  const caseId = req.nextUrl.searchParams.get('caseId')
  const src = SRC[layer]
  if (!src) {
    return NextResponse.json({ type: 'FeatureCollection', features: [], warning: `Lớp "${layer}" không có nguồn geometry.` })
  }

  const where: Record<string, unknown> = { geometry: { not: null } }
  if (src.loai) where.loai_doi_tuong = { in: src.loai }
  if (caseId) where.survey_case_id = caseId
  if (ward) where.don_vi_hanh_chinh_id = ward

  const select: Record<string, boolean> = { id: true, geometry: true, tam_lat: true, tam_lng: true, [src.label]: true }
  for (const f of src.extra ?? []) select[f] = true

  const delegate = (db as unknown as Record<string, { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }>)[src.table]
  const rows = await delegate.findMany({ where, select, take: 5000 })

  const features = rows.map((r) => {
    const props: Record<string, unknown> = { id: r.id, layer, label: r[src.label] ?? null }
    for (const f of src.extra ?? []) props[f] = typeof r[f] === 'object' && r[f] !== null ? num(r[f]) : r[f]
    return {
      type: 'Feature',
      geometry: r.geometry ?? (r.tam_lat != null && r.tam_lng != null ? { type: 'Point', coordinates: [num(r.tam_lng), num(r.tam_lat)] } : null),
      properties: props,
    }
  }).filter((f) => f.geometry != null)

  return NextResponse.json(
    { type: 'FeatureCollection', layer, features },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
