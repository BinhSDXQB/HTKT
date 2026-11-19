// Bộ tiêu chí & cách tính điểm năm 2026 — theo biểu mẫu của Sở Nội vụ (CV 6862/SNV-CBCCVC)
// và Mẫu số 04 (bảng KPI). Hàm thuần.
// Nhãn: tiêu chí chung 30 điểm VERIFIED từ Mẫu 2A/2B/2C; công thức KPI VERIFIED từ tệp MAU SO 04 CHUAN.xlsx
// (ví dụ trong tệp cho 96,175 điểm). Ngưỡng xếp loại lấy từ dự thảo công văn của Sở (chưa số):
// INFERRED cho tới khi có bản ký.

export type TieuChiChung = { ma: string; ten: string; toiDa: number }

export const TIEU_CHI_CHUNG: readonly TieuChiChung[] = [
  { ma: 'I.1', ten: 'Phẩm chất chính trị, phẩm chất đạo đức, văn hóa thực thi công vụ, nhiệm vụ', toiDa: 5 },
  { ma: 'I.2', ten: 'Ý thức kỷ luật, kỷ cương trong thực thi công vụ, nhiệm vụ', toiDa: 5 },
  { ma: 'II.1', ten: 'Năng lực chuyên môn, nghiệp vụ theo yêu cầu của vị trí việc làm', toiDa: 2.5 },
  { ma: 'II.2', ten: 'Khả năng đáp ứng yêu cầu thực thi nhiệm vụ được giao thường xuyên, đột xuất', toiDa: 2.5 },
  { ma: 'II.3', ten: 'Tinh thần trách nhiệm trong thực thi công vụ, nhiệm vụ', toiDa: 2.5 },
  { ma: 'II.4', ten: 'Thái độ phục vụ người dân, doanh nghiệp và khả năng phối hợp với đồng nghiệp', toiDa: 2.5 },
  { ma: 'III.1', ten: 'Có sản phẩm, giải pháp đột phá, sáng tạo đem lại giá trị, hiệu quả thiết thực, tác động tích cực đến kết quả thực hiện nhiệm vụ của cơ quan, tổ chức', toiDa: 2.5 },
  { ma: 'III.2', ten: 'Sẵn sàng tham gia thực hiện nhiệm vụ chính trị đặc biệt quan trọng, nhiệm vụ có tính chất đột xuất, phức tạp hoặc trong điều kiện khó khăn', toiDa: 2.5 },
  { ma: 'III.3', ten: 'Có tinh thần chịu trách nhiệm trước kết quả công việc; chủ động nhận trách nhiệm khi có sai sót và có biện pháp khắc phục rõ ràng, cụ thể', toiDa: 2.5 },
  { ma: 'III.4', ten: 'Chủ động đưa ra quyết định trong phạm vi thẩm quyền, không né tránh; có tinh thần tiên phong trong thực hiện những nhiệm vụ mới', toiDa: 2.5 },
]

export const TONG_TIEU_CHI_CHUNG = 30
export const TRONG_SO_NHIEM_VU = 70
/** Điểm tối đa theo nhóm trong Mẫu 04: A trọng tâm 10, B thường xuyên 90. */
export const DIEM_NHOM_A = 10
export const DIEM_NHOM_B = 90

const lam = (n: number) => Math.round(n * 1e6) / 1e6

export function tongDiemChungToiDa(): number {
  return lam(TIEU_CHI_CHUNG.reduce((t, c) => t + c.toiDa, 0))
}

/** Điểm chung hợp lệ: từng tiêu chí 0..tối đa. Trả về lỗi theo mã tiêu chí. */
export function kiemTraDiemChung(diem: Record<string, number | null | undefined>): { tong: number; loi: string[] } {
  const loi: string[] = []
  let tong = 0
  for (const c of TIEU_CHI_CHUNG) {
    const v = diem[c.ma]
    if (v === null || v === undefined) continue
    if (!Number.isFinite(v) || v < 0) { loi.push(`${c.ma}: điểm không hợp lệ`); continue }
    if (v > c.toiDa) loi.push(`${c.ma}: ${v} vượt tối đa ${c.toiDa}`)
    tong += v
  }
  for (const k of Object.keys(diem)) {
    if (!TIEU_CHI_CHUNG.some((c) => c.ma === k)) loi.push(`${k}: không có trong bộ tiêu chí`)
  }
  return { tong: lam(tong), loi }
}

// ── Mẫu 04: một dòng sản phẩm ───────────────────────────────────────────────
export type DongKpi = {
  /** cột 7: điểm theo danh mục (theo phân nhóm độ khó) */
  diemDanhMuc: number
  /** cột 8: số lượng sản phẩm */
  soLuong: number
  /** cột 10: số lượng hoàn thành thực tế */
  hoanThanhThucTe: number
  /** cột 12: số lần phải chỉnh sửa (không do yếu tố khách quan) */
  soLanChinhSua: number
  /** số ngày chậm so với tiến độ (0 nếu đúng hạn hoặc trước hạn) */
  soNgayCham: number
}

export type KetQuaDongKpi = { tongDiemQuyDoi: number; soLuong: number; chatLuong: number; tienDo: number }

/** Cột 9=8*7; 11=10*7; 13=100%-12*25% (tối thiểu 0); 14=13*9; 16=1-chậm*0,05 (0..1); 17=16*9. */
export function tinhDongKpi(d: DongKpi): KetQuaDongKpi {
  const tong = d.soLuong * d.diemDanhMuc
  const soLuong = d.hoanThanhThucTe * d.diemDanhMuc
  const hsChatLuong = Math.max(0, 1 - d.soLanChinhSua * 0.25)
  const hsTienDo = Math.min(1, Math.max(0, 1 - d.soNgayCham * 0.05))
  return { tongDiemQuyDoi: lam(tong), soLuong: lam(soLuong), chatLuong: lam(hsChatLuong * tong), tienDo: lam(hsTienDo * tong) }
}

export type KetQuaNhomKpi = { tongDiem: number; binhQuan: number; kpi: number; diemDat: number }

/** Điểm KPI nhóm = trung bình 3 chỉ số quy đổi / tổng điểm; điểm đạt = KPI × điểm nhóm (10 hoặc 90). */
export function tinhNhomKpi(dong: DongKpi[], diemNhom: number): KetQuaNhomKpi {
  let tong = 0, sl = 0, cl = 0, td = 0
  for (const d of dong) {
    const r = tinhDongKpi(d)
    tong += r.tongDiemQuyDoi; sl += r.soLuong; cl += r.chatLuong; td += r.tienDo
  }
  if (tong <= 0) return { tongDiem: 0, binhQuan: 0, kpi: 0, diemDat: 0 }
  const binhQuan = (sl + cl + td) / 3
  const kpi = binhQuan / tong
  return { tongDiem: lam(tong), binhQuan: lam(binhQuan), kpi: lam(kpi), diemDat: lam(kpi * diemNhom) }
}

/** Mẫu 2B/2C: điểm năm phần nhiệm vụ = tổng điểm KPI (≤100) × 70/100. */
export function diemNhiemVuNam(diemKpiTong: number): number {
  return lam((diemKpiTong * TRONG_SO_NHIEM_VU) / 100)
}

export function tongDiemNam(diemChung: number, diemKpiTong: number): number {
  return lam(diemChung + diemNhiemVuNam(diemKpiTong))
}

// ── Xếp loại ────────────────────────────────────────────────────────────────
export type MucXepLoaiMa =
  | 'HOAN_THANH_XUAT_SAC_NHIEM_VU'
  | 'HOAN_THANH_TOT_NHIEM_VU'
  | 'HOAN_THANH_NHIEM_VU'
  | 'KHONG_HOAN_THANH_NHIEM_VU'

export const THU_TU_MUC: readonly MucXepLoaiMa[] = [
  'KHONG_HOAN_THANH_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_XUAT_SAC_NHIEM_VU',
]

export type DieuKienXepLoai = {
  /** thuộc nhóm 20% cao nhất theo nhóm đối tượng tương đồng (người có thẩm quyền xác nhận) */
  trongTop20?: boolean
  /** số quý được xếp hoàn thành xuất sắc */
  soQuyXuatSac?: number
  /** số quý không hoàn thành nhiệm vụ */
  soQuyKhongHoanThanh?: number
}

/**
 * Mức TỐI ĐA có thể đề xuất theo điểm + điều kiện. Chỉ là gợi ý để kiểm tra; không phải quyết định xếp loại.
 * Căn cứ: dự thảo công văn Sở XD (chưa số): ≥90 + top 20% + ≥2 quý xuất sắc → HTXSNV;
 * 70–<90 HTTNV; 50–<70 HTNV; <50 hoặc >2 quý KHTNV → KHTNV.
 */
export function mucToiDaTheoDiem(diem: number, dk: DieuKienXepLoai = {}): { muc: MucXepLoaiMa; ghiChu: string[] } {
  const ghiChu: string[] = []
  if ((dk.soQuyKhongHoanThanh ?? 0) > 2) return { muc: 'KHONG_HOAN_THANH_NHIEM_VU', ghiChu: ['Hơn 2 quý không hoàn thành nhiệm vụ.'] }
  if (diem < 50) return { muc: 'KHONG_HOAN_THANH_NHIEM_VU', ghiChu }
  if (diem < 70) return { muc: 'HOAN_THANH_NHIEM_VU', ghiChu }
  if (diem < 90) return { muc: 'HOAN_THANH_TOT_NHIEM_VU', ghiChu }
  if (dk.trongTop20 && (dk.soQuyXuatSac ?? 0) >= 2) return { muc: 'HOAN_THANH_XUAT_SAC_NHIEM_VU', ghiChu }
  if (!dk.trongTop20) ghiChu.push('Đạt từ 90 điểm nhưng chưa xác nhận thuộc nhóm 20% cao nhất.')
  if ((dk.soQuyXuatSac ?? 0) < 2) ghiChu.push('Chưa đủ 2 quý xếp loại xuất sắc.')
  return { muc: 'HOAN_THANH_TOT_NHIEM_VU', ghiChu }
}

export function mucCao(a: MucXepLoaiMa, b: MucXepLoaiMa): boolean {
  return THU_TU_MUC.indexOf(a) > THU_TU_MUC.indexOf(b)
}
