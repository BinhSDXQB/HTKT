import 'server-only'
import { db } from '@/lib/db'
import { loadCriteria } from './danh-gia-db'

// Báo cáo THỐNG KÊ tổng hợp QĐ72 (Mục 11). Ngưỡng (4,5m / 3,5m…) lấy TỪ BẢNG cấu hình.
// Scope: toàn tỉnh (Sở/Quản trị) hoặc theo địa bàn wardId (xã/phường) cho các bảng có cột đơn vị HC.

const d = db as unknown as Record<string, {
  count: (a?: unknown) => Promise<number>
  aggregate: (a: unknown) => Promise<{ _sum: Record<string, unknown> }>
  groupBy: (a: unknown) => Promise<Record<string, unknown>[]>
}>

function num(v: unknown): number { const n = v == null ? 0 : Number(v); return Number.isFinite(n) ? n : 0 }

export type Qd72BaoCao = {
  soHoSo: number
  hoSoTheoTrangThai: Record<string, number>
  hoSoTheoNhomDanhGia: Record<string, number>
  soDoanDuong: number
  soDuongKhongDatRong: number         // rộng < ngưỡng
  tongDaiKhongDatRongM: number
  soDiemDuoiChieuCao: number          // đường + dây có chiều cao < ngưỡng
  soTuyenDayCap: number
  soCapKhongRoChuSoHuu: number
  soCapNgungSuDung: number
  soCot: number
  soNguonNuoc: number
  soTruNuoc: number
  soKeHoachChinhTrang: number
  nguongRongM: number
  nguongCaoM: number
}

export async function baoCaoTongHop(wardId: string | null): Promise<Qd72BaoCao> {
  const crit = await loadCriteria()
  const nguongRong = crit['ROAD_MIN_WIDTH']?.giaTri ?? 3.5
  const nguongCao = crit['CLEARANCE_MIN_HEIGHT']?.giaTri ?? 4.5
  const w = wardId ? { don_vi_hanh_chinh_id: wardId } : {}

  // Hồ sơ theo trạng thái + nhóm đánh giá
  const casesTT = await d.qd72_survey_cases.groupBy({ by: ['trang_thai'], where: w, _count: { _all: true } })
  const casesNhom = await d.qd72_survey_cases.groupBy({ by: ['nhom_danh_gia'], where: w, _count: { _all: true } })
  const hoSoTheoTrangThai: Record<string, number> = {}
  let soHoSo = 0
  for (const r of casesTT as Record<string, unknown>[]) { const c = num((r._count as Record<string, unknown>)._all); hoSoTheoTrangThai[r.trang_thai as string] = c; soHoSo += c }
  const hoSoTheoNhomDanhGia: Record<string, number> = {}
  for (const r of casesNhom as Record<string, unknown>[]) { if (r.nhom_danh_gia) hoSoTheoNhomDanhGia[r.nhom_danh_gia as string] = num((r._count as Record<string, unknown>)._all) }

  // Đường
  const soDoanDuong = await d.qd72_road_segments.count({ where: w })
  const soDuongKhongDatRong = await d.qd72_road_segments.count({ where: { ...w, rong_thong_thuy_min_m: { lt: nguongRong } } })
  const sumDai = await d.qd72_road_segments.aggregate({ where: { ...w, rong_thong_thuy_min_m: { lt: nguongRong } }, _sum: { chieu_dai_m: true } })
  const soDuongThapCao = await d.qd72_road_segments.count({ where: { ...w, cao_thong_thuy_min_m: { lt: nguongCao } } })

  // Dây/cáp
  const soTuyenDayCap = await d.qd72_overhead_utility_lines.count({ where: w })
  const soDayThapCao = await d.qd72_overhead_utility_lines.count({ where: { ...w, cao_diem_thap_nhat_m: { lt: nguongCao } } })
  const soCapKhongRoChuSoHuu = await d.qd72_overhead_utility_lines.count({ where: { ...w, trang_thai_chu_so_huu: 'CHUA_XAC_DINH' } })
  const soCapNgungSuDung = await d.qd72_overhead_utility_lines.count({ where: { ...w, tinh_trang_su_dung: 'Ngừng sử dụng' } })

  // Không có cột đơn vị HC ở poles → đếm toàn bộ (hoặc theo case sau)
  const soCot = await d.qd72_utility_poles.count()
  const soNguonNuoc = await d.qd72_water_sources.count({ where: w })
  const soTruNuoc = await d.qd72_fire_hydrants.count()
  const soKeHoachChinhTrang = await d.qd72_renovation_plans.count({ where: w })

  return {
    soHoSo, hoSoTheoTrangThai, hoSoTheoNhomDanhGia,
    soDoanDuong, soDuongKhongDatRong, tongDaiKhongDatRongM: num(sumDai._sum.chieu_dai_m),
    soDiemDuoiChieuCao: soDuongThapCao + soDayThapCao,
    soTuyenDayCap, soCapKhongRoChuSoHuu, soCapNgungSuDung,
    soCot, soNguonNuoc, soTruNuoc, soKeHoachChinhTrang,
    nguongRongM: nguongRong, nguongCaoM: nguongCao,
  }
}
