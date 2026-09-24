// Bảng lương chuyên môn, nghiệp vụ đối với cán bộ, công chức (Bảng 2 — Nghị định
// 204/2004/NĐ-CP). Dùng để ĐỐI CHIẾU bậc lương ↔ hệ số lương đã nhập, phát hiện sai khác.
//
// LƯU Ý NGHIỆP VỤ:
//  - heSoLuong (cột V) là hệ số của BẬC, KHÔNG gồm phụ cấp chức vụ (W) hay % vượt khung (X).
//  - Người đang hưởng phụ cấp thâm niên vượt khung (vuotKhung > 0) thì đang ở BẬC CUỐI của
//    ngạch, hệ số = hệ số bậc cuối; % vượt khung cộng thêm ngoài hệ số.
//  - Đây là công cụ rà soát; quyết định cuối cùng do Văn phòng Sở đối chiếu hồ sơ gốc.

import { fmtSo } from './luong'

export type BangLuongNhom = {
  ma: string          // mã nhóm bảng lương, vd 'A1', 'A2.1'
  ten: string         // tên loại công chức
  heSo: number[]      // hệ số theo bậc 1..n
}

// Hệ số chuẩn NĐ 204/2004 (Bảng 2 — công chức loại A3, A2, A1, A0, B, C).
export const BANG_LUONG: Record<string, BangLuongNhom> = {
  'A3.1': { ma: 'A3.1', ten: 'Công chức loại A3, nhóm 1 (chuyên viên cao cấp)', heSo: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00] },
  'A3.2': { ma: 'A3.2', ten: 'Công chức loại A3, nhóm 2',                       heSo: [5.75, 6.11, 6.47, 6.83, 7.19, 7.55] },
  'A2.1': { ma: 'A2.1', ten: 'Công chức loại A2, nhóm 1 (chuyên viên chính)',   heSo: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78] },
  'A2.2': { ma: 'A2.2', ten: 'Công chức loại A2, nhóm 2',                       heSo: [4.00, 4.34, 4.68, 5.02, 5.36, 5.70, 6.04, 6.38] },
  'A1':   { ma: 'A1',   ten: 'Công chức loại A1 (chuyên viên)',                 heSo: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98] },
  'A0':   { ma: 'A0',   ten: 'Công chức loại A0 (cao đẳng)',                    heSo: [2.10, 2.41, 2.72, 3.03, 3.34, 3.65, 3.96, 4.27, 4.58, 4.89] },
  'B':    { ma: 'B',    ten: 'Công chức loại B (cán sự, trung cấp)',            heSo: [1.86, 2.06, 2.26, 2.46, 2.66, 2.86, 3.06, 3.26, 3.46, 3.66, 3.86, 4.06] },
  'C1':   { ma: 'C1',   ten: 'Công chức loại C, nhóm 1',                        heSo: [1.65, 1.83, 2.01, 2.19, 2.37, 2.55, 2.73, 2.91, 3.09, 3.27, 3.45, 3.63] },
}

// Ánh xạ mã ngạch phổ biến (hành chính + chuyên ngành Xây dựng/Kế toán/Văn thư) → nhóm bảng lương.
// Nguồn: NĐ 204/2004 + các thông tư bổ nhiệm ngạch. Mã không có ở đây sẽ thử dò theo tên ngạch.
const MA_NGACH_NHOM: Record<string, string> = {
  // Hành chính
  '01.001': 'A3.1', // Chuyên viên cao cấp
  '01.002': 'A2.1', // Chuyên viên chính
  '01.003': 'A1',   // Chuyên viên
  '01.004': 'B',    // Cán sự (trung cấp → B) — xác nhận qua 2 QĐ nâng lương độc lập 2026 (Dương Thị Kim Huệ bậc 8=3,26; Trần Thị Liên bậc 12=4,06, đều khớp nhóm B, không khớp A0)
  '01.005': 'B',    // Nhân viên
  '01.007': 'B',    // Văn thư trung cấp (cũ)
  '01.008': 'A1',   // Văn thư viên
  '01.009': 'C1',   // Nhân viên phục vụ
  // Kế toán (06.xxx)
  '06.029': 'A3.1', // Kế toán viên cao cấp
  '06.030': 'A2.1', // Kế toán viên chính
  '06.031': 'A1',   // Kế toán viên
  '06.032': 'B',    // Kế toán viên trung cấp
  // Văn thư (02.xxx mới)
  '02.006': 'A2.1', // Văn thư chính
  '02.007': 'A1',   // Văn thư viên
  '02.008': 'B',    // Văn thư viên trung cấp
}

// Dò nhóm theo TÊN ngạch hiện hưởng khi không có/không khớp mã ngạch.
function nhomTheoTenNgach(ten?: string | null): string | null {
  if (!ten) return null
  const t = ten.toLowerCase()
  if (t.includes('cao cấp') || t === 'cvcc') return 'A3.1'
  if (t.includes('chính')   || t === 'cvc')  return 'A2.1'
  if (t.includes('cao đẳng')) return 'A0'
  if (t.includes('trung cấp') || t.includes('cán sự') || t === 'cs') return 'B'
  if (t.includes('nhân viên') || t === 'nv') return 'C1'
  if (t.includes('chuyên viên') || t === 'cv') return 'A1' // đặt sau "chính"/"cao cấp"
  return null
}

export function timNhomBangLuong(maNgach?: string | null, ngachHienHuong?: string | null): BangLuongNhom | null {
  const ma = (maNgach ?? '').trim()
  if (ma && MA_NGACH_NHOM[ma]) return BANG_LUONG[MA_NGACH_NHOM[ma]]
  const nhom = nhomTheoTenNgach(ngachHienHuong)
  return nhom ? BANG_LUONG[nhom] : null
}

export type SalaryConsistency =
  | { status: 'OK'; nhom: BangLuongNhom; heSoChuan: number }
  | { status: 'MISMATCH'; nhom: BangLuongNhom; heSoChuan: number; message: string }
  | { status: 'BAC_OUT_OF_RANGE'; nhom: BangLuongNhom; message: string }
  | { status: 'UNKNOWN'; message: string }   // không xác định được bảng/đủ dữ liệu → không kết luận

export type SalaryCheckInput = {
  maNgach?: string | null
  ngachHienHuong?: string | null
  bacLuong?: number | null
  heSoLuong?: number | null
  vuotKhung?: number | null
}

const EPS = 0.005

/** Đối chiếu (bậc, hệ số) với bảng lương chuẩn của ngạch. */
export function checkSalaryConsistency(cb: SalaryCheckInput): SalaryConsistency {
  if (cb.bacLuong == null || cb.heSoLuong == null) {
    return { status: 'UNKNOWN', message: 'Thiếu bậc lương hoặc hệ số lương để đối chiếu.' }
  }
  const nhom = timNhomBangLuong(cb.maNgach, cb.ngachHienHuong)
  if (!nhom) {
    return { status: 'UNKNOWN', message: 'Chưa xác định được bảng lương của ngạch (thiếu/không nhận diện mã ngạch).' }
  }

  const bac = cb.bacLuong
  if (bac < 1 || bac > nhom.heSo.length) {
    return {
      status: 'BAC_OUT_OF_RANGE',
      nhom,
      message: `Bậc ${bac} vượt số bậc của ngạch ${nhom.ma} (ngạch chỉ có ${nhom.heSo.length} bậc).`,
    }
  }

  const heSoChuan = nhom.heSo[bac - 1]
  const lechHeSo = Math.abs((cb.heSoLuong ?? 0) - heSoChuan) > EPS

  // Có vượt khung mà chưa ở bậc cuối → cũng là bất thường.
  const coVuotKhung = cb.vuotKhung != null && cb.vuotKhung > 0
  if (coVuotKhung && bac !== nhom.heSo.length) {
    return {
      status: 'MISMATCH',
      nhom, heSoChuan,
      message: `Đang hưởng % vượt khung nhưng bậc ${bac} chưa phải bậc cuối (bậc ${nhom.heSo.length}) của ngạch ${nhom.ma}.`,
    }
  }

  if (lechHeSo) {
    return {
      status: 'MISMATCH',
      nhom, heSoChuan,
      message: `Bậc ${bac} ngạch ${nhom.ma} có hệ số chuẩn ${fmtSo(heSoChuan)} nhưng hồ sơ ghi ${fmtSo(cb.heSoLuong)}.`,
    }
  }
  return { status: 'OK', nhom, heSoChuan }
}

/** Có sai khác cần chú ý (lệch hệ số hoặc bậc vượt khung). */
export function coSaiKhacLuong(cb: SalaryCheckInput): boolean {
  const r = checkSalaryConsistency(cb)
  return r.status === 'MISMATCH' || r.status === 'BAC_OUT_OF_RANGE'
}
