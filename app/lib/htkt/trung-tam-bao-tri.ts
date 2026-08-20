import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật — đơn vị trực thuộc Sở.
export const TRUNG_TAM = {
  toChucId: 'tc_ban_bao_tri_gt',
  linhVuc: 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon',
  ten: 'Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật',
}

// Chuẩn hoá tên đường để khớp với thuộc tính name của geojson tuyến.
export const chuanTenDuong = (s?: string | null) =>
  (s || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()

export type TuyenTrungTam = {
  ten: string
  khoa: string
  diaBan: string | null
  ketCau: string | null
  matCat: number | null
  matCatQH: number | null
  diemDau: string | null
  diemCuoi: string | null
  chieuDai: number | null
}

export type TramXLNT = {
  id: string; ten: string; lat: number; lng: number
  donViQuanLy: string | null; congSuat: number | null; diaChi: string | null
}

const soHoac = (v: unknown): number | null =>
  typeof v === 'number' ? v : (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null)

// Tập tên tuyến (chuẩn hoá) có trong geojson bản đồ — cache theo mtime file.
let TEN_GEOJSON: { mtimeMs: number; set: Set<string> } | null = null
export function tapTenTuyenGeojson(): Set<string> {
  const p = path.join(process.cwd(), 'public', 'data', 'tuyen-duong-quang-tri.geojson')
  try {
    const stat = fs.statSync(p)
    if (TEN_GEOJSON && TEN_GEOJSON.mtimeMs === stat.mtimeMs) return TEN_GEOJSON.set
    const gj = JSON.parse(fs.readFileSync(p, 'utf8'))
    const set = new Set<string>()
    for (const f of gj.features ?? []) {
      if (f.properties?.layer === 'road' && f.properties?.name) set.add(chuanTenDuong(f.properties.name))
    }
    TEN_GEOJSON = { mtimeMs: stat.mtimeMs, set }
    return set
  } catch {
    return new Set()
  }
}

export async function layDuLieuTrungTam() {
  const [rows, tramRaw] = await Promise.all([
    db.nghiepVuBanGhi.findMany({
      where: { toChucId: TRUNG_TAM.toChucId, linhVuc: TRUNG_TAM.linhVuc, deletedAt: null },
      select: { tieuDe: true, diaBan: true, customFields: true },
    }),
    db.nhaMayXuLyNuocThai.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true, ten: true, latitude: true, longitude: true,
        donViQuanLy: true, congSuatThietKeM3Ngay: true, diaChi: true,
      },
    }),
  ])

  const roads: TuyenTrungTam[] = rows.map((r) => {
    const cf = (r.customFields ?? {}) as Record<string, unknown>
    return {
      ten: r.tieuDe,
      khoa: chuanTenDuong(r.tieuDe),
      diaBan: r.diaBan ?? null,
      ketCau: (cf.ketCau as string) ?? null,
      matCat: soHoac(cf.matCat),
      matCatQH: soHoac(cf.matCatQH),
      diemDau: (cf.diemDau as string) ?? null,
      diemCuoi: (cf.diemCuoi as string) ?? null,
      chieuDai: soHoac(cf.chieuDai),
    }
  })

  const tram: TramXLNT[] = tramRaw.map((t) => ({
    id: t.id, ten: t.ten,
    lat: t.latitude as number, lng: t.longitude as number,
    donViQuanLy: t.donViQuanLy ?? null,
    congSuat: t.congSuatThietKeM3Ngay ?? null,
    diaChi: t.diaChi ?? null,
  }))

  const tenGeo = tapTenTuyenGeojson()
  let soKhop = 0
  for (const r of roads) if (tenGeo.has(r.khoa)) soKhop++

  return {
    donViQuanLy: TRUNG_TAM.ten,
    toChucId: TRUNG_TAM.toChucId,
    roads,
    tram,
    tongTuyen: roads.length,
    tongChieuDaiKm: Math.round(roads.reduce((s, r) => s + (r.chieuDai ?? 0), 0) * 100) / 100,
    soKhopBanDo: soKhop,
    soChuaDinhVi: roads.length - soKhop,
  }
}
