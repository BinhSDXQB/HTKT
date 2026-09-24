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

/**
 * Chuẩn hoá % thâm niên vượt khung về đúng quy ước hệ thống: SỐ NGUYÊN chỉ % (vd 9 = 9%), không
 * phải phân số (0.09). Theo TT 04/2005/TT-BNV hướng dẫn NĐ 204/2004/NĐ-CP Điều 6: sau khi xếp bậc
 * lương cuối cùng trong ngạch đủ thời gian quy định thì hưởng 5%, mỗi năm đủ điều kiện tiếp theo
 * cộng thêm 1% — nên giá trị hợp lệ LUÔN LÀ SỐ NGUYÊN ≥ 5, KHÔNG BAO GIỜ nằm trong khoảng (0, 1).
 *
 * Nguồn lỗi thật đã gặp (24/9/26, phát hiện qua ảnh chụp màn hình "% Vượt khung: 0.09"): các
 * đường nhập liệu từ file Excel công bố (app/api/import/luong/route.ts, prisma/import-qlns-2026.ts)
 * đọc thẳng giá trị số của ô Excel định dạng "Phần trăm" — Excel LƯU ô "9%" dưới dạng số 0.09, chỉ
 * ĐỊNH DẠNG hiển thị mới ra "9%" — nên đọc trực tiếp cell.v mà không nhân 100 sẽ ghi nhầm 0.09 vào
 * CSDL trong khi công thức tính lương (tinhLuongThucLinh dưới đây) lại chia 100 lần nữa, khiến tiền
 * vượt khung tính ra sai lệch ~100 lần. Dùng hàm này ở MỌI nơi ghi vuotKhung vào CSDL (form thủ
 * công lẫn import Excel) để tự sửa nếu lỡ nhận giá trị dạng phân số, không chỉ sửa hiển thị.
 *
 * GIỚI HẠN ĐÃ BIẾT (Codex rà chốt 24/9/26): hàm này chỉ sửa ĐƠN VỊ (phân số ↔ số nguyên), KHÔNG
 * validate đủ theo luật ("phải nguyên, ≥ 5, không âm"). Đã làm tròn số thập phân lẻ (vd nhập nhầm
 * "5.5" từ làm tròn dấu phẩy) vì đó chắc chắn luôn sai — nhưng CỐ TÌNH không chặn/xoá giá trị < 5
 * hay số âm: hàm này chạy ở cả đường "sửa hồ sơ" (ghi đè toàn bộ), nếu tự ý trả về null cho một số
 * âm do gõ nhầm dấu trừ thì sẽ ÂM THẦM XÁÐ MẤT % vượt khung đang có của người đó khi lưu — rủi ro
 * mất dữ liệu nặng hơn việc hiển thị tạm một số vô lý dễ nhận ra bằng mắt. Ngưỡng "≥ 5" còn phụ
 * thuộc loại cán bộ (A/B/C, xem TT 04/2005/TT-BNV) nên không đủ căn cứ để tự chặn cứng ở đây; cán
 * bộ nghiệp vụ vẫn phải tự đối chiếu khi thấy số bất thường (0, số âm, < 5) trên màn hình.
 */
export function chuanHoaPhanTramVuotKhung(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw)) return null
  if (raw === 0) return null            // 0% = không hưởng — coi như chưa có, khớp quy ước "vuotKhung > 0" ở nơi khác
  if (raw > 0 && raw < 1) return Math.round(raw * 100)   // dạng phân số kiểu Excel (0.09) → 9
  return Math.round(raw)   // % vượt khung theo TT 04/2005/TT-BNV luôn là số nguyên — làm tròn phần lẻ
}

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

/**
 * Định dạng số thập phân kiểu Việt Nam (dấu PHẨY ngăn thập phân) cho hệ số lương/phụ cấp — vd
 * 4.98 (JS number) → "4,98". Dùng ở MỌI nơi hiển thị heSoLuong/phuCap cho người dùng thay vì
 * `.toString()`/`.toFixed()` (luôn ra dấu chấm kiểu Mỹ, sai định dạng số Việt Nam). null/undefined
 * → "—". Không dùng cho tiền (xem fmtVND) hay % nguyên (vuotKhung hiển thị thẳng, không có phần
 * thập phân theo quy ước — xem chuanHoaPhanTramVuotKhung).
 */
export function fmtSo(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return n.toLocaleString('vi-VN')
}
