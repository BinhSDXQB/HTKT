// Tính ngày nghỉ hưu theo Bộ luật Lao động 2019 + Nghị định 135/2020/NĐ-CP.
// Lộ trình: NAM 60 tuổi 3 tháng (2021) tăng 3 tháng/năm → đủ 62 tuổi từ 2028;
//           NỮ  55 tuổi 4 tháng (2021) tăng 4 tháng/năm → đủ 60 tuổi từ 2035.
// "Ngày về hưu" = ngày đầu tháng liền kề sau tháng đủ tuổi (Điều 3 NĐ 135/2020).

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
 * Ngày nghỉ hưu (hưởng lương hưu) = ngày 01 của tháng liền kề sau tháng đủ tuổi.
 * Trả về null nếu thiếu ngày sinh hoặc giới tính.
 */
export function tinhNgayNghiHuu(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): Date | null {
  if (!ngaySinh || !gioiTinh) return null
  const thang = tuoiNghiHuuThang(ngaySinh, gioiTinh)
  // Tháng đủ tuổi = tháng sinh + thang → nghỉ hưu từ ngày 01 tháng kế tiếp
  return new Date(Date.UTC(ngaySinh.getUTCFullYear(), ngaySinh.getUTCMonth() + thang + 1, 1))
}

/** Nhãn tuổi nghỉ hưu dạng "62 tuổi" / "60 tuổi 9 tháng" để hiển thị. */
export function tuoiNghiHuuLabel(ngaySinh: Date | null | undefined, gioiTinh: GioiTinhInput): string | null {
  if (!ngaySinh || !gioiTinh) return null
  const thang = tuoiNghiHuuThang(ngaySinh, gioiTinh)
  const nam = Math.floor(thang / 12), du = thang % 12
  return du === 0 ? `${nam} tuổi` : `${nam} tuổi ${du} tháng`
}
