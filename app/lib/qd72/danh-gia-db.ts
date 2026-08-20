import 'server-only'
import { db } from '@/lib/db'
import { danhGiaTieuChi, type TieuChi, type KetQua } from './danh-gia'

// Đánh giá SƠ BỘ dựa trên tiêu chí lấy TỪ BẢNG CẤU HÌNH qd72_technical_rules (không hard-code).
// Engine thuần ở danh-gia.ts; ở đây chỉ nạp ngưỡng ACTIVE + chạy trên số liệu đối tượng.

const db_ = db as unknown as {
  qd72_technical_rules: { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }
  qd72_road_segments: { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }
  qd72_overhead_utility_lines: { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }
  qd72_water_sources: { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Nạp tiêu chí ACTIVE từ bảng cấu hình → map ma_tieu_chi → TieuChi (cho engine). */
export async function loadCriteria(): Promise<Record<string, TieuChi>> {
  const rows = await db_.qd72_technical_rules.findMany({
    where: { trang_thai: 'ACTIVE' },
    select: { ma_tieu_chi: true, ten: true, gia_tri: true, toan_tu: true, don_vi: true, trang_thai: true },
  })
  const out: Record<string, TieuChi> = {}
  for (const r of rows) {
    out[r.ma_tieu_chi as string] = {
      maTieuChi: r.ma_tieu_chi as string,
      ten: r.ten as string,
      giaTri: num(r.gia_tri),
      toanTu: (r.toan_tu as TieuChi['toanTu']) ?? '>=',
      donVi: (r.don_vi as string) ?? null,
      trangThai: r.trang_thai as string,
    }
  }
  return out
}

export type DanhGiaItem = {
  doiTuong: string        // mô tả đối tượng (tên đường / tuyến dây / nguồn nước)
  maTieuChi: string
  tenTieuChi: string
  giaTriDo: number | null
  ketQua: KetQua
  thongDiep: string
}

function danhGia1(crit: Record<string, TieuChi>, ma: string, giaTriDo: number | null, doiTuong: string): DanhGiaItem | null {
  const tc = crit[ma]
  if (!tc) return null
  const kq = danhGiaTieuChi(tc, giaTriDo)
  return { doiTuong, maTieuChi: ma, tenTieuChi: tc.ten, giaTriDo, ketQua: kq.ketQua, thongDiep: kq.thongDiep }
}

/** Đánh giá sơ bộ toàn hồ sơ: chạy tiêu chí trên đường/dây-cáp/nguồn nước của case. */
export async function danhGiaSoBoCase(caseId: string): Promise<{ items: DanhGiaItem[]; nhomDeXuat: string; tomTat: Record<KetQua, number> }> {
  const crit = await loadCriteria()
  const items: DanhGiaItem[] = []

  const roads = await db_.qd72_road_segments.findMany({
    where: { survey_case_id: caseId },
    select: { ten: true, rong_thong_thuy_min_m: true, cao_thong_thuy_min_m: true, la_duong_cut: true, chieu_dai_cut_m: true, co_diem_quay_xe: true },
  })
  for (const r of roads) {
    const ten = (r.ten as string) ?? 'Đoạn đường'
    items.push(danhGia1(crit, 'ROAD_MIN_WIDTH', num(r.rong_thong_thuy_min_m), ten)!)
    items.push(danhGia1(crit, 'CLEARANCE_MIN_HEIGHT', num(r.cao_thong_thuy_min_m), ten)!)
    // Đường cụt: tiêu chí KÍCH HOẠT (không phải pass/fail đơn) — cụt vượt ngưỡng mà THIẾU khu quay xe → không đạt.
    if (r.la_duong_cut) {
      const tc = crit['DEADEND_TURN_LENGTH']
      const len = num(r.chieu_dai_cut_m)
      if (tc) {
        const nguong = tc.giaTri ?? 46
        let ketQua: KetQua; let thongDiep: string
        if (len == null) { ketQua = 'CHUA_DU_DU_LIEU'; thongDiep = `Chưa có chiều dài đường cụt "${ten}" để đánh giá khu quay xe.` }
        else if (len > nguong && !r.co_diem_quay_xe) { ketQua = 'KHONG_DAT'; thongDiep = `Đường cụt ${len} m > ${nguong} m nhưng CHƯA có khu quay xe (đánh giá sơ bộ).` }
        else if (len > nguong) { ketQua = 'DAT'; thongDiep = `Đường cụt ${len} m > ${nguong} m và đã có khu quay xe (sơ bộ).` }
        else { ketQua = 'KHONG_AP_DUNG'; thongDiep = `Đường cụt ${len} m ≤ ${nguong} m — không bắt buộc khu quay xe.` }
        items.push({ doiTuong: ten, maTieuChi: 'DEADEND_TURN_LENGTH', tenTieuChi: tc.ten, giaTriDo: len, ketQua, thongDiep })
      }
    }
  }

  const lines = await db_.qd72_overhead_utility_lines.findMany({
    where: { survey_case_id: caseId },
    select: { ten_tuyen: true, loai_doi_tuong: true, cao_diem_thap_nhat_m: true },
  })
  for (const l of lines) {
    const ten = (l.ten_tuyen as string) ?? (l.loai_doi_tuong as string) ?? 'Tuyến dây/cáp'
    items.push(danhGia1(crit, 'CLEARANCE_MIN_HEIGHT', num(l.cao_diem_thap_nhat_m), ten)!)
  }

  const waters = await db_.qd72_water_sources.findMany({
    where: { survey_case_id: caseId },
    select: { ten: true, chieu_dai_cut_m: true, chi_tiet: true },
  })
  for (const w of waters) {
    const ten = (w.ten as string) ?? 'Nguồn nước'
    const ct = (w.chi_tiet as Record<string, unknown>) ?? {}
    items.push(danhGia1(crit, 'WATER_SERVICE_RADIUS', num(ct['khoang_cach_khu_bao_ve_m']), ten)!)
    items.push(danhGia1(crit, 'DEADEND_PIPE_MAX_LENGTH', num(w.chieu_dai_cut_m), ten)!)
  }

  const clean = items.filter(Boolean)
  const tomTat = { DAT: 0, KHONG_DAT: 0, CHUA_DU_DU_LIEU: 0, KHONG_AP_DUNG: 0 } as Record<KetQua, number>
  for (const it of clean) tomTat[it.ketQua]++

  // Nhóm đánh giá ĐỀ XUẤT (sơ bộ): không tự kết luận "không đạt" khi thiếu dữ liệu.
  let nhomDeXuat: string
  if (clean.length === 0) nhomDeXuat = 'CHUA_DU_DU_LIEU'
  else if (tomTat.KHONG_DAT > 0) nhomDeXuat = 'KHONG_DAT_CO_THE_CAI_TAO'
  else if (tomTat.CHUA_DU_DU_LIEU > 0) nhomDeXuat = 'CHUA_DU_DU_LIEU'
  else nhomDeXuat = 'DAT'

  return { items: clean, nhomDeXuat, tomTat }
}
