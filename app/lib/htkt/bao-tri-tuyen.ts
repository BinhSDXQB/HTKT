import 'server-only'
import { db } from '@/lib/db'

const LINH_VUC = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon'

export type TuyenDuong = {
  id: string
  tieuDe: string
  diaBan: string | null
  trangThai: string
  ghiChu: string | null
  chieuDai: number | null
  matCat: number | null
  matCatQH: number | null
  diemDau: string | null
  diemCuoi: string | null
  ketCau: string | null
  tinhTrang: string | null
  namBaoTri: number | null
  toaDoDauLat: number | null
  toaDoDauLng: number | null
  toaDoCuoiLat: number | null
  toaDoCuoiLng: number | null
  namDuyTu: number | null
  kinhPhiDuyTu: number | null
  noiDungDuyTu: string | null
  donViThucHien: string | null
}

export type ThongKePhuong = {
  diaBan: string
  soTuyen: number
  tongKm: number
  tot: number
  trungBinh: number
  xuongCap: number
  chuaXet: number
  tuyen: TuyenDuong[]
}

function safeNum(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

export async function getBaoTriTuyen(filterDiaBan?: string): Promise<{
  theoPhung: ThongKePhuong[]
  tongTuyen: number
  tongKm: number
}> {
  const records = await db.nghiepVuBanGhi.findMany({
    where: {
      linhVuc: LINH_VUC,
      deletedAt: null,
      ...(filterDiaBan ? { diaBan: filterDiaBan } : {}),
    },
    select: { id: true, tieuDe: true, diaBan: true, trangThai: true, ghiChu: true, customFields: true },
    orderBy: [{ diaBan: 'asc' }, { tieuDe: 'asc' }],
  })

  const map = new Map<string, TuyenDuong[]>()
  for (const r of records) {
    const dia = r.diaBan ?? '(Chưa gán địa bàn)'
    const cf = r.customFields as Record<string, unknown>
    const t: TuyenDuong = {
      id: r.id,
      tieuDe: r.tieuDe,
      diaBan: r.diaBan,
      trangThai: r.trangThai,
      ghiChu: r.ghiChu,
      chieuDai: safeNum(cf.chieuDai),
      matCat: safeNum(cf.matCat),
      matCatQH: safeNum(cf.matCatQH),
      diemDau: (cf.diemDau as string) || null,
      diemCuoi: (cf.diemCuoi as string) || null,
      ketCau: (cf.ketCau as string) || null,
      tinhTrang: (cf.tinhTrang as string) || null,
      namBaoTri: safeNum(cf.namBaoTri),
      toaDoDauLat: safeNum(cf.toaDoDauLat),
      toaDoDauLng: safeNum(cf.toaDoDauLng),
      toaDoCuoiLat: safeNum(cf.toaDoCuoiLat),
      toaDoCuoiLng: safeNum(cf.toaDoCuoiLng),
      namDuyTu: safeNum(cf.namDuyTu),
      kinhPhiDuyTu: safeNum(cf.kinhPhiDuyTu),
      noiDungDuyTu: (cf.noiDungDuyTu as string) || null,
      donViThucHien: (cf.donViThucHien as string) || null,
    }
    if (!map.has(dia)) map.set(dia, [])
    map.get(dia)!.push(t)
  }

  const theoPhung: ThongKePhuong[] = []
  let tongTuyen = 0
  let tongKm = 0
  for (const [diaBan, tuyen] of map) {
    const km = tuyen.reduce((s, t) => s + (t.chieuDai ?? 0), 0)
    theoPhung.push({
      diaBan,
      soTuyen: tuyen.length,
      tongKm: Math.round(km * 100) / 100,
      tot: tuyen.filter(t => t.tinhTrang === 'Tốt').length,
      trungBinh: tuyen.filter(t => t.tinhTrang === 'Trung bình').length,
      xuongCap: tuyen.filter(t => t.tinhTrang === 'Xuống cấp').length,
      chuaXet: tuyen.filter(t => !t.tinhTrang).length,
      tuyen,
    })
    tongTuyen += tuyen.length
    tongKm += km
  }

  return { theoPhung, tongTuyen, tongKm: Math.round(tongKm * 100) / 100 }
}

export async function getDsDiaBan(): Promise<string[]> {
  const rows = await db.nghiepVuBanGhi.findMany({
    where: { linhVuc: LINH_VUC, deletedAt: null },
    select: { diaBan: true },
    distinct: ['diaBan'],
    orderBy: { diaBan: 'asc' },
  })
  return rows.map(r => r.diaBan ?? '').filter(Boolean)
}
