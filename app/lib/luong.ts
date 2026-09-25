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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// BẢNG LƯƠNG THÁNG ĐẦY ĐỦ theo đối tượng (công chức / viên chức / người lao động) — rà soát 25/9/2026.
//
// Trước đây ô "Lương thực lĩnh (tạm tính)" trên hồ sơ thực chất là TỔNG THU NHẬP trước khấu trừ và
// THIẾU phụ cấp công vụ 25% của công chức. Nay tính đủ theo chế độ hiện hành:
//
//  1. Phụ cấp công vụ 25% × (lương ngạch bậc + PC chức vụ + PC thâm niên vượt khung) — NĐ 34/2012/NĐ-CP
//     Điều 2, 3. Áp dụng: CÔNG CHỨC; người làm HĐLĐ trong CƠ QUAN HÀNH CHÍNH (NĐ 68/2000 → 161/2018 →
//     111/2022). KHÔNG áp dụng: viên chức, HĐLĐ tại đơn vị sự nghiệp công lập (Bộ Nội vụ trả lời
//     baochinhphu.vn 18/8/2023). Viên chức biệt phái về cơ quan Sở: NĐ 34/2012 không liệt kê → không tính,
//     ghi chú để Phòng KH-TC xác nhận.
//  2. Bảo hiểm người lao động đóng, trên tiền lương tháng đóng BH = lương ngạch bậc + PC chức vụ +
//     vượt khung (KHÔNG gồm PC công vụ), trần 20 × lương cơ sở:
//       BHXH 8% (Luật BHXH 41/2024/QH15) · BHYT 1,5% (Luật BHYT: 4,5%, người lao động 1/3)
//       BHTN 1% — viên chức (HĐ làm việc) và người lao động (HĐLĐ ≥ 01 tháng); CÔNG CHỨC KHÔNG ĐÓNG
//       (Luật Việc làm 74/2025/QH15 Điều 31, hiệu lực 01/01/2026).
//  3. Thuế TNCN (khấu trừ hằng tháng): thu nhập tính thuế = tổng thu nhập − BH bắt buộc − giảm trừ bản
//     thân 15.500.000đ − 6.200.000đ × số người phụ thuộc (NQ 110/2025/UBTVQH15; Luật Thuế TNCN
//     109/2025/QH15, áp dụng từ kỳ tính thuế 2026); biểu lũy tiến 5 bậc 5/10/20/30/35%.
//
// CHƯA GỒM (không có dữ liệu trong hồ sơ): PC trách nhiệm/kiêm nhiệm/độc hại, thâm niên nghề, truy lĩnh,
// thu nhập tăng thêm, đoàn phí công đoàn. Số liệu là TẠM TÍNH để đối chiếu, bảng lương chính thức do
// Phòng Kế hoạch - Tài chính lập.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

export const CHINH_SACH_LUONG = {
  pcCongVu: 0.25,
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
  tranDongBHTheoLuongCoSo: 20,
  giamTruBanThan: 15_500_000,
  giamTruNguoiPhuThuoc: 6_200_000,
  // [trần thu nhập tính thuế của bậc (đồng/tháng), thuế suất] — Luật Thuế TNCN 109/2025/QH15
  bieuThue: [
    [10_000_000, 0.05],
    [30_000_000, 0.10],
    [60_000_000, 0.20],
    [100_000_000, 0.30],
    [Number.POSITIVE_INFINITY, 0.35],
  ] as [number, number][],
  canCu: {
    pcCongVu: 'NĐ 34/2012/NĐ-CP (Điều 2, 3)',
    baoHiem: 'Luật BHXH 41/2024/QH15; Luật BHYT; Luật Việc làm 74/2025/QH15 Điều 31 (công chức không đóng BHTN)',
    thue: 'Luật Thuế TNCN 109/2025/QH15 (biểu 5 bậc, kỳ tính thuế 2026); NQ 110/2025/UBTVQH15 (giảm trừ 15,5tr / 6,2tr)',
  },
} as const

/** Thuế TNCN lũy tiến từng phần trên thu nhập tính thuế tháng. */
export function tinhThueTNCNThang(thuNhapTinhThue: number): number {
  if (!(thuNhapTinhThue > 0)) return 0
  let thue = 0, duoi = 0
  for (const [tren, ts] of CHINH_SACH_LUONG.bieuThue) {
    if (thuNhapTinhThue <= duoi) break
    thue += (Math.min(thuNhapTinhThue, tren) - duoi) * ts
    duoi = tren
  }
  return Math.round(thue)
}

/** to_chuc.loai thuộc cơ quan hành chính Sở (khác đơn vị sự nghiệp trực thuộc). */
export function laCoQuanHanhChinh(loaiToChuc?: string | null): boolean {
  return loaiToChuc === 'LANH_DAO_SO' || loaiToChuc === 'VAN_PHONG' || loaiToChuc === 'PHONG' || loaiToChuc === 'CO_QUAN'
}

/** Quy ước lưu trữ: NLĐ lương khoán ghi heSoLuong = SỐ TIỀN (đồng); hệ số thật luôn < 100. */
export function laLuongKhoan(heSoLuong?: number | null): boolean {
  return heSoLuong != null && heSoLuong >= 100_000
}

export type BangLuongInput = LuongInput & {
  loaiToChuc?: string | null      // to_chuc.loai của đơn vị công tác
  soNguoiPhuThuoc?: number        // con/người phụ thuộc đã đăng ký & xác nhận
}

export type DongBangLuong = { ma: string; nhan: string; soTien: number; ghiChu?: string }

export type BangLuongThang = {
  apDung: boolean
  doiTuongNhan: string
  thuNhap: DongBangLuong[]
  tongThuNhap: number
  luongDongBH: number
  khauTru: DongBangLuong[]
  tongBaoHiem: number
  soNguoiPhuThuoc: number
  giamTruGiaCanh: number
  thuNhapTinhThue: number
  thueTNCN: number
  tongKhauTru: number
  thucLinh: number
  luuY: string[]
}

export function tinhBangLuongThang(cb: BangLuongInput, luongCoSo: number = LUONG_CO_SO): BangLuongThang {
  const P = CHINH_SACH_LUONG
  const luuY: string[] = []
  const soNPT = Math.max(0, cb.soNguoiPhuThuoc ?? 0)
  const rong: BangLuongThang = {
    apDung: false, doiTuongNhan: '', thuNhap: [], tongThuNhap: 0, luongDongBH: 0, khauTru: [], tongBaoHiem: 0,
    soNguoiPhuThuoc: soNPT, giamTruGiaCanh: 0, thuNhapTinhThue: 0, thueTNCN: 0, tongKhauTru: 0, thucLinh: 0, luuY,
  }
  if (cb.heSoLuong == null || !(cb.heSoLuong > 0)) {
    return { ...rong, luuY: ['Chưa có hệ số lương / mức lương hợp đồng để tính.'] }
  }

  const ngachBac = huongLuongNgachBac(cb)
  // Thiếu đối tượng thì suy từ loại hình biên chế: BCHC = hành chính (công chức), BCSN = sự nghiệp (viên chức).
  const lh = (cb.loaiHinh ?? '').trim().toUpperCase()
  const laCC = cb.doiTuong === 'CONG_CHUC' || (!cb.doiTuong && lh.startsWith('BCHC'))
  const laVC = cb.doiTuong === 'VIEN_CHUC' || (!cb.doiTuong && lh.startsWith('BCSN'))
  const hanhChinh = laCoQuanHanhChinh(cb.loaiToChuc)
  const khoan = !ngachBac && laLuongKhoan(cb.heSoLuong)
  const bietPhai = /biệt phái/i.test(cb.loaiHinh ?? '')

  const thuNhap: DongBangLuong[] = []
  let luongChinh: number, pccv = 0, vk = 0
  if (khoan) {
    luongChinh = cb.heSoLuong
    thuNhap.push({ ma: 'luongHD', nhan: 'Lương theo hợp đồng (khoán)', soTien: luongChinh })
  } else {
    luongChinh = cb.heSoLuong * luongCoSo
    pccv = (cb.phuCap ?? 0) * luongCoSo
    vk = ngachBac ? luongChinh * ((cb.vuotKhung ?? 0) / 100) : 0
    thuNhap.push({ ma: 'luongNgachBac', nhan: ngachBac ? 'Lương ngạch bậc' : 'Lương theo hệ số hợp đồng', soTien: luongChinh, ghiChu: `hệ số ${fmtSo(cb.heSoLuong)} × ${fmtVND(luongCoSo)}` })
    if (pccv > 0) thuNhap.push({ ma: 'pcChucVu', nhan: 'Phụ cấp chức vụ', soTien: pccv, ghiChu: `hệ số ${fmtSo(cb.phuCap)}` })
    if (vk > 0) thuNhap.push({ ma: 'vuotKhung', nhan: 'Phụ cấp thâm niên vượt khung', soTien: vk, ghiChu: `${cb.vuotKhung}%` })
  }

  // Phụ cấp công vụ (NĐ 34/2012)
  const coPCCV = laCC || (!ngachBac && !laVC && hanhChinh && !khoan)
  if (coPCCV) {
    const pc = (luongChinh + pccv + vk) * P.pcCongVu
    thuNhap.push({ ma: 'pcCongVu', nhan: 'Phụ cấp công vụ 25%', soTien: pc, ghiChu: '25% × (lương + PC chức vụ + vượt khung) — NĐ 34/2012' })
  } else if (laVC && bietPhai && hanhChinh) {
    luuY.push('Viên chức biệt phái về cơ quan Sở: NĐ 34/2012 không liệt kê viên chức → chưa tính phụ cấp công vụ; Phòng KH-TC xác nhận nếu có văn bản cho hưởng.')
  } else if (khoan && hanhChinh) {
    luuY.push('Lương khoán theo hợp đồng: chưa cộng phụ cấp công vụ; nếu hợp đồng quy định được hưởng thì Phòng KH-TC bổ sung.')
  }

  const tongThuNhap = thuNhap.reduce((s, d) => s + d.soTien, 0)
  const luongDongBH = Math.min(luongChinh + pccv + vk, P.tranDongBHTheoLuongCoSo * luongCoSo)
  const khauTru: DongBangLuong[] = [
    { ma: 'bhxh', nhan: 'BHXH 8%', soTien: Math.round(luongDongBH * P.bhxh) },
    { ma: 'bhyt', nhan: 'BHYT 1,5%', soTien: Math.round(luongDongBH * P.bhyt) },
  ]
  if (laCC) {
    luuY.push('Công chức không thuộc diện đóng BHTN (Luật Việc làm 74/2025/QH15 Điều 31).')
  } else {
    khauTru.push({ ma: 'bhtn', nhan: 'BHTN 1%', soTien: Math.round(luongDongBH * P.bhtn) })
  }
  const tongBaoHiem = khauTru.reduce((s, d) => s + d.soTien, 0)

  const giamTruGiaCanh = P.giamTruBanThan + soNPT * P.giamTruNguoiPhuThuoc
  const thuNhapTinhThue = Math.max(0, tongThuNhap - tongBaoHiem - giamTruGiaCanh)
  const thueTNCN = tinhThueTNCNThang(thuNhapTinhThue)
  if (thueTNCN > 0) khauTru.push({ ma: 'thue', nhan: 'Thuế TNCN (tạm khấu trừ)', soTien: thueTNCN, ghiChu: `thu nhập tính thuế ${fmtVND(thuNhapTinhThue)}` })

  const tongKhauTru = tongBaoHiem + thueTNCN
  return {
    apDung: true,
    doiTuongNhan: laCC ? 'Công chức' : laVC ? (bietPhai ? 'Viên chức biệt phái' : 'Viên chức') : khoan ? 'Người lao động (lương khoán)' : 'Người lao động',
    thuNhap, tongThuNhap, luongDongBH, khauTru, tongBaoHiem,
    soNguoiPhuThuoc: soNPT, giamTruGiaCanh, thuNhapTinhThue, thueTNCN, tongKhauTru,
    thucLinh: tongThuNhap - tongKhauTru, luuY,
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
