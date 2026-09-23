// Tính lương thực lĩnh (tạm tính) theo hệ số × MỨC LƯƠNG CƠ SỞ.
// Mức lương cơ sở hiện hành: 2.530.000 đồng/tháng — Nghị định 161/2026/NĐ-CP (từ 01/7/2026),
// thay thế NĐ 73/2024/NĐ-CP (2.340.000đ, hết hiệu lực 30/6/2026).
// Khi Chính phủ điều chỉnh mức cơ sở, chỉ cần sửa hằng số dưới đây (hoặc chuyển vào bảng cấu hình).
//
// LƯU Ý: chỉ áp dụng cho CÔNG CHỨC/VIÊN CHỨC hưởng lương theo ngạch/bậc. Người lao động (NLĐ)
// hưởng lương khoán/thoả thuận theo hợp đồng → không quy đổi theo hệ số.
// Đây là số TẠM TÍNH (lương ngạch bậc + phụ cấp chức vụ + thâm niên vượt khung); chưa gồm
// thâm niên nghề, phụ cấp ưu đãi/khu vực/trách nhiệm và các khoản khác.

export const LUONG_CO_SO = 2_530_000
export const LUONG_CO_SO_CAN_CU = 'NĐ 161/2026/NĐ-CP (2.530.000đ, từ 01/7/2026, thay NĐ 73/2024)'

export type LuongInput = {
  heSoLuong?: number | null
  phuCap?: number | null       // phụ cấp chức vụ (hệ số)
  vuotKhung?: number | null     // % thâm niên vượt khung
  doiTuong?: string | null      // CONG_CHUC | VIEN_CHUC | NGUOI_LAO_DONG
  loaiHinh?: string | null
}

export type LuongResult = {
  apDung: boolean          // có quy đổi theo hệ số được không
  luongCoSo: number
  luongNgachBac: number    // hệ số × lương cơ sở
  phuCapChucVu: number     // hệ số phụ cấp × lương cơ sở
  vuotKhungTien: number    // % vượt khung × lương ngạch bậc
  tongCong: number
  ghiChu: string
}

/** Hưởng lương theo ngạch/bậc (CC/VC). NLĐ → không. Thiếu đối tượng thì suy từ loaiHinh (BC*). */
export function huongLuongNgachBac(cb: { doiTuong?: string | null; loaiHinh?: string | null }): boolean {
  if (cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') return true
  if (cb.doiTuong === 'NGUOI_LAO_DONG') return false
  return (cb.loaiHinh ?? '').trim().toUpperCase().startsWith('BC')
}

export function tinhLuongThucLinh(cb: LuongInput, luongCoSo: number = LUONG_CO_SO): LuongResult {
  const base: LuongResult = {
    apDung: false, luongCoSo, luongNgachBac: 0, phuCapChucVu: 0, vuotKhungTien: 0, tongCong: 0, ghiChu: '',
  }
  if (!huongLuongNgachBac(cb)) {
    return { ...base, ghiChu: 'Người lao động — lương khoán/thoả thuận theo hợp đồng, không quy đổi theo hệ số.' }
  }
  if (cb.heSoLuong == null) {
    return { ...base, ghiChu: 'Chưa có hệ số lương để tính.' }
  }
  const luongNgachBac = cb.heSoLuong * luongCoSo
  const phuCapChucVu = (cb.phuCap ?? 0) * luongCoSo
  const vuotKhungTien = luongNgachBac * ((cb.vuotKhung ?? 0) / 100)
  const tongCong = luongNgachBac + phuCapChucVu + vuotKhungTien
  return {
    apDung: true, luongCoSo, luongNgachBac, phuCapChucVu, vuotKhungTien, tongCong,
    ghiChu: 'Tạm tính: lương ngạch bậc + phụ cấp chức vụ + thâm niên vượt khung. Chưa gồm thâm niên nghề và phụ cấp khác.',
  }
}

/** Định dạng tiền VND, vd 8.190.000đ. */
export function fmtVND(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + 'đ'
}
