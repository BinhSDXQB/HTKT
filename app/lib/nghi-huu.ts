// Tính ngày nghỉ hưu theo Bộ luật Lao động 2019 + Nghị định 135/2020/NĐ-CP.
// Lộ trình: NAM 60 tuổi 3 tháng (2021) tăng 3 tháng/năm → đủ 62 tuổi từ 2028;
//           NỮ  55 tuổi 4 tháng (2021) tăng 4 tháng/năm → đủ 60 tuổi từ 2035.
//
// BA MỐC KHÁC NHAU — đối chiếu bản Công báo số 1117+1118 ngày 03/12/2020 (đã nạp vào kho
// tài liệu 23/8/2026), Điều 3 Nghị định 135/2020/NĐ-CP:
//   • Tháng đủ tuổi          : tháng sinh + tuổi nghỉ hưu (Phụ lục I).
//   • THỜI ĐIỂM NGHỈ HƯU     : "kết thúc ngày cuối cùng của THÁNG đủ tuổi nghỉ hưu" (khoản 1)
//                              — người tiếp tục làm việc sau tuổi hưu thì là lúc chấm dứt HĐLĐ.
//   • THỜI ĐIỂM HƯỞNG HƯU TRÍ: "bắt đầu ngày đầu tiên của tháng LIỀN KỀ sau thời điểm nghỉ hưu"
//                              (khoản 2) — cũng chính là cột cuối Phụ lục I và là ngày ghi trong
//                              Quyết định nghỉ hưu Mẫu số 3 ("nghỉ hưu để hưởng chế độ BHXH từ ngày…").
// Cột can_bo."ngayVeHuu" của hệ thống lưu MỐC THỨ BA (ngày 01 tháng liền kề) — giữ nguyên để
// khớp Phụ lục I và biểu mẫu; hai mốc còn lại tính tại chỗ bằng các hàm dưới đây khi cần hiển thị.
//
// Căn cứ theo đối tượng — tuổi nghỉ hưu dùng chung Phụ lục I, nhưng THỜI ĐIỂM nghỉ hưu KHÁC NHAU:
//   • Cán bộ, công chức, người lao động: Luật CBCC 80/2025 Điều 17 k2 / Điều 32 k2 → pháp luật lao động
//     → NĐ 135/2020 Điều 3 k1: thời điểm nghỉ hưu = KẾT THÚC NGÀY CUỐI CÙNG của tháng đủ tuổi.
//   • VIÊN CHỨC: Luật Viên chức 129/2025 Điều 32 k2 + NĐ 259/2026 Điều 54 k1 (nguyên văn):
//     "Thời điểm nghỉ hưu là ngày 01 của tháng liền kề sau tháng viên chức đủ tuổi nghỉ hưu theo quy định."
//     → với viên chức, giá trị của tinhNgayNghiHuu() CHÍNH LÀ thời điểm nghỉ hưu, không phải mốc hưởng.

export type GioiTinhInput = 'NAM' | 'NU' | null | undefined

/** Số tháng tuổi nghỉ hưu theo tháng/năm sinh và giới tính (Phụ lục I, II NĐ 135/2020). */
export function tuoiNghiHuuThang(ngaySinh: Date, gioiTinh: 'NAM' | 'NU'): number {
  const y = ngaySinh.getUTCFullYear()
  const m = ngaySinh.getUTCMonth() // 0-11
  if (gioiTinh === 'NAM') {
    // Mốc: sinh 01/1961 nghỉ ở 60t3m; mỗi cụm 9 tháng sinh kế tiếp +3 tháng; trần 62 tuổi (sinh từ 04/1966)
    const offset = (y - 1961) * 12 + m // tháng sinh tính từ 01/1961
    if (offset < 0) return 60 * 12
    const bac = Math.min(Math.floor(offset / 9), 7)
    return 60 * 12 + 3 + bac * 3
  }
  // NỮ — mốc: sinh 01/1966 nghỉ ở 55t4m; mỗi cụm 8 tháng sinh kế tiếp +4 tháng; trần 60 tuổi (sinh từ 05/1975)
  const offset = (y - 1966) * 12 + m
  if (offset < 0) return 55 * 12
  const bac = Math.min(Math.floor(offset / 8), 14)
  return 55 * 12 + 4 + bac * 4
}

/**
 * THỜI ĐIỂM HƯỞNG CHẾ ĐỘ HƯU TRÍ = ngày 01 của tháng liền kề sau tháng đủ tuổi
 * (NĐ 135/2020 Điều 3 khoản 2 + cột cuối Phụ lục I). Đây là giá trị lưu ở can_bo."ngayVeHuu"
 * và là ngày ghi trong Quyết định nghỉ hưu (Mẫu số 3).
 * Trả về null nếu thiếu ngày sinh hoặc giới tính.
 */
export function tinhNgayNghiHuu(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): Date | null {
  if (!ngaySinh || !gioiTinh) return null
  const thang = tuoiNghiHuuThang(ngaySinh, gioiTinh)
  // Tháng đủ tuổi = tháng sinh + thang → hưởng chế độ hưu trí từ ngày 01 tháng kế tiếp
  return new Date(Date.UTC(ngaySinh.getUTCFullYear(), ngaySinh.getUTCMonth() + thang + 1, 1))
}

/**
 * THỜI ĐIỂM NGHỈ HƯU theo NĐ 135/2020 Điều 3 khoản 1 = kết thúc ngày cuối cùng của tháng đủ tuổi.
 * Khác mốc hưởng lương hưu đúng 1 ngày, nhưng là mốc để đếm ngược "trước 06 tháng ra thông báo,
 * trước 03 tháng ra quyết định" (NĐ 170/2025 Điều 62, 63) và là ngày công chức thôi làm việc.
 */
export function ngayKetThucLamViec(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): Date | null {
  const huong = tinhNgayNghiHuu(ngaySinh, gioiTinh)
  if (!huong) return null
  // Lùi 1 ngày bằng Date.UTC (không trừ 24h theo mili-giây) để không dính lệch múi giờ/DST.
  return new Date(Date.UTC(huong.getUTCFullYear(), huong.getUTCMonth(), huong.getUTCDate() - 1))
}

/** Tháng đủ tuổi nghỉ hưu (Phụ lục I NĐ 135/2020), dạng { thang: 1-12, nam }. */
export function thangDuTuoi(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): { thang: number; nam: number } | null {
  if (!ngaySinh || !gioiTinh) return null
  const t = tuoiNghiHuuThang(ngaySinh, gioiTinh)
  const d = new Date(Date.UTC(ngaySinh.getUTCFullYear(), ngaySinh.getUTCMonth() + t, 1))
  return { thang: d.getUTCMonth() + 1, nam: d.getUTCFullYear() }
}

// ───────────── Lùi thời điểm nghỉ hưu — NĐ 170/2025/NĐ-CP, Điều 61 khoản 3–5 ─────────────
// Nguyên văn khoản 3 (bản gốc trong kho tài liệu của Sở):
//   a) Không quá 01 tháng: trùng ngày nghỉ Tết Nguyên đán; vợ/chồng, bố, mẹ (vợ/chồng),
//      con từ trần hoặc bị Toà án tuyên bố mất tích; bản thân và gia đình bị thiệt hại
//      do thiên tai, địch hoạ, hoả hoạn.
//   b) Không quá 03 tháng: bị bệnh nặng hoặc bị tai nạn có giấy xác nhận của bệnh viện.
//   c) Không quá 06 tháng: đang điều trị bệnh thuộc danh mục bệnh cần chữa trị dài ngày
//      do Bộ Y tế ban hành, có giấy xác nhận của bệnh viện.
// Khoản 4: thuộc nhiều trường hợp thì chỉ áp dụng MỘT trường hợp có thời gian lùi nhiều nhất.
// Khoản 5: người có thẩm quyền cho nghỉ hưu QUYẾT ĐỊNH việc lùi.
export const TRUONG_HOP_LUI = {
  A: { tranThang: 1, moTa: 'Trùng nghỉ Tết Nguyên đán; thân nhân từ trần/mất tích; thiệt hại do thiên tai, địch hoạ, hoả hoạn' },
  B: { tranThang: 3, moTa: 'Bị bệnh nặng hoặc bị tai nạn, có giấy xác nhận của bệnh viện' },
  C: { tranThang: 6, moTa: 'Điều trị bệnh thuộc danh mục cần chữa trị dài ngày, có giấy xác nhận của bệnh viện' },
} as const

export type MaTruongHopLui = keyof typeof TRUONG_HOP_LUI

/** Ngày muộn nhất được phép lùi tới, theo trần của từng trường hợp. */
export function hanLuiToiDa(ngayDuKien: Date | null | undefined, truongHop: string | null | undefined): Date | null {
  if (!ngayDuKien) return null
  const th = TRUONG_HOP_LUI[truongHop as MaTruongHopLui]
  if (!th) return null
  return new Date(Date.UTC(ngayDuKien.getUTCFullYear(), ngayDuKien.getUTCMonth() + th.tranThang, ngayDuKien.getUTCDate()))
}

type HoSoNghiHuu = {
  ngaySinh?: Date | null
  gioiTinh?: string | null
  ngayVeHuu?: Date | null
  ngayNghiHuuLui?: Date | null
  truongHopLui?: string | null
  vanBanLuiNghiHuu?: string | null
}

/**
 * Thời điểm nghỉ hưu dùng để HIỂN THỊ và SINH VĂN BẢN.
 *
 * Phân biệt rõ hai nguồn, vì đây là chỗ dễ ghi sai vào Thông báo/Quyết định nghỉ hưu:
 *   - DU_KIEN: ngày do máy tính theo NĐ 135/2020, CHƯA phải quyết định của ai.
 *   - DA_LUI:  thời điểm người có thẩm quyền đã quyết định lùi (NĐ 170/2025 Điều 61).
 */
export function thoiDiemNghiHuu(cb: HoSoNghiHuu): {
  ngay: Date | null
  laDuKien: boolean
  nguon: 'DU_KIEN' | 'DA_LUI'
  ngayDuKien: Date | null
  truongHop: MaTruongHopLui | null
} {
  const gioiTinh = (cb.gioiTinh === 'NAM' || cb.gioiTinh === 'NU' ? cb.gioiTinh : null) as GioiTinhInput
  // Cột ngayVeHuu trong CSDL cũng là giá trị máy tính; nếu trống thì tính lại tại chỗ.
  const ngayDuKien = cb.ngayVeHuu ?? tinhNgayNghiHuu(cb.ngaySinh, gioiTinh)
  if (cb.ngayNghiHuuLui) {
    return {
      ngay: cb.ngayNghiHuuLui,
      laDuKien: false,
      nguon: 'DA_LUI',
      ngayDuKien,
      truongHop: (cb.truongHopLui as MaTruongHopLui) ?? null,
    }
  }
  return { ngay: ngayDuKien, laDuKien: true, nguon: 'DU_KIEN', ngayDuKien, truongHop: null }
}

/** Nhãn tuổi nghỉ hưu dạng "62 tuổi" / "60 tuổi 9 tháng" để hiển thị. */
export function tuoiNghiHuuLabel(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): string | null {
  if (!ngaySinh || !gioiTinh) return null
  const thang = tuoiNghiHuuThang(ngaySinh, gioiTinh)
  const nam = Math.floor(thang / 12), du = thang % 12
  return du === 0 ? `${nam} tuổi` : `${nam} tuổi ${du} tháng`
}
