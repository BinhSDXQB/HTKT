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

// Ánh xạ mã ngạch / mã chức danh nghề nghiệp → nhóm bảng lương. Mã không có ở đây sẽ thử dò theo tên ngạch.
// Giá trị là 1 nhóm, hoặc mảng [nhóm hiện hành, ...nhóm chuyển tiếp]: nhóm đầu là nhóm theo văn bản
// hiện hành; các nhóm sau chỉ để NHẬN DIỆN người đang hưởng lương theo quy định chuyển tiếp/bảo lưu
// (khớp nhóm sau → vẫn OK nhưng kèm ghi chú để Văn phòng Sở rà lại).
// Rà soát 25/9/2026, có đối chiếu chéo với Codex. KHÔNG map các mã cũ 01.006–01.011 (đã chuyển
// sang 01.005 theo TT 11/2014/TT-BNV); trước đây bảng ghi 01.007 là "Văn thư trung cấp" và 01.008 là
// "Văn thư viên A1" — sai, đó là mã cũ Nhân viên kỹ thuật/Nhân viên văn thư.
const MA_NGACH_NHOM: Record<string, string | string[]> = {
  // Hành chính — TT 02/2021/TT-BNV Điều 14 khoản 1
  '01.001': 'A3.1', // Chuyên viên cao cấp
  '01.002': 'A2.1', // Chuyên viên chính
  '01.003': 'A1',   // Chuyên viên
  // Cán sự: A0 theo TT 02/2021/TT-BNV Điều 14 k1 điểm d; người chưa đủ chuẩn được giữ lương ngạch
  // cũ (loại B) trong 05 năm theo quy định chuyển tiếp — thời hạn tính từ 01/8/2021, cần rà lại.
  '01.004': ['A0', 'B'],
  '01.005': 'B',    // Nhân viên — TT 02/2021/TT-BNV Điều 14 k1 điểm đ
  // Kế toán — TT 29/2022/TT-BTC Điều 24 khoản 1
  '06.029': 'A3.2', // Kế toán viên cao cấp
  '06.030': 'A2.2', // Kế toán viên chính
  '06.031': 'A1',   // Kế toán viên
  '06.032': ['A0', 'B'], // Kế toán viên trung cấp (A0; B là nhóm theo quy định cũ)
  // Văn thư — TT 02/2021/TT-BNV Điều 14 khoản 2
  '02.006': 'A2.1', // Văn thư viên chính
  '02.007': 'A1',   // Văn thư viên
  '02.008': 'B',    // Văn thư viên trung cấp
  // Khoa học và công nghệ — mã theo TT 11/2024/TT-BKHCN Điều 4; lương theo TTLT 01/2016/TTLT-BKHCN-BNV Điều 4
  '13.095': 'A1',     // Kỹ sư (mã ngạch cũ, tương ứng V.05.02.07)
  'V.05.02.07': 'A1', // Kỹ sư hạng III
  'V.05.02.08': 'B',  // Kỹ thuật viên hạng IV
  // Xây dựng — mã theo TT 11/2024/TT-BXD. TT này KHÔNG có điều xếp lương riêng (Điều 16 dẫn NĐ 85/2023);
  // A1 cho hạng III là theo TTLT 11/2016/TTLT-BXD-BNV (đã bãi bỏ) — cần đối chiếu nếu có văn bản mới.
  'V.04.01.03': 'A1', // Kiến trúc sư hạng III
  'V.04.02.06': 'A1', // Thẩm kế viên hạng III
  // Đăng kiểm — TT 45/2022/TT-BGTVT Điều 9
  'V.12.31.03': 'A1', // Đăng kiểm viên hạng III
  // Giáo viên GDNN — TT 07/2023/TT-BLĐTBXH Điều 14 (sửa bởi TT 10/2024/TT-BLĐTBXH). Lưu ý: từ 10/8/2026
  // TT 64/2026/TT-BGDĐT đặt mã mới cho giáo viên trung học nghề (V.09.02.12/13/14) — hồ sơ còn mã cũ cần rà lại.
  'V.09.02.07': 'A1', // Giáo viên GDNN lý thuyết hạng III
  'V.09.02.08': 'A0', // Giáo viên GDNN thực hành hạng III
  'V.09.02.09': 'B',  // Giáo viên GDNN hạng IV
}

// Chuẩn hoá cách ghi mã hay gặp trong CSDL, chỉ theo mẫu chặt (không "đoán" mã lỗi):
//   "V04.01.03" → "V.04.01.03" · "v.04.01.03" → "V.04.01.03" · "01 003" → "01.003"
export function chuanHoaMaNgach(ma?: string | null): string {
  const s = (ma ?? '').trim()
  const v = s.match(/^[vV]\.?(\d{2})\.(\d{2})\.(\d{2})$/)
  if (v) return `V.${v[1]}.${v[2]}.${v[3]}`
  const hc = s.match(/^(\d{2}) +(\d{3})$/)
  if (hc) return `${hc[1]}.${hc[2]}`
  return s
}

function nhomTheoMa(maNgach?: string | null): string[] {
  const n = MA_NGACH_NHOM[chuanHoaMaNgach(maNgach)]
  return n == null ? [] : Array.isArray(n) ? n : [n]
}

// Dò nhóm theo TÊN ngạch hiện hưởng khi không có/không khớp mã ngạch. Cùng quy ước với MA_NGACH_NHOM:
// phần tử đầu là nhóm hiện hành, các phần tử sau là nhóm chuyển tiếp.
function nhomTheoTenNgach(ten?: string | null): string[] {
  if (!ten) return []
  const t = ten.toLowerCase()
  if (t.includes('cao cấp') || t === 'cvcc') return ['A3.1']
  if (t.includes('chính')   || t === 'cvc')  return ['A2.1']
  if (t.includes('cao đẳng')) return ['A0']
  // Cán sự / Kế toán viên trung cấp: A0 hiện hành, B chuyển tiếp (xem 01.004, 06.032 ở trên).
  if (t.includes('cán sự') || t === 'cs' || (t.includes('kế toán') && t.includes('trung cấp'))) return ['A0', 'B']
  if (t.includes('trung cấp')) return ['B']
  if (t.includes('nhân viên') || t === 'nv') return ['C1']
  if (t.includes('chuyên viên') || t === 'cv') return ['A1'] // đặt sau "chính"/"cao cấp"
  return []
}

/** Danh sách nhóm của ngạch: [hiện hành, ...chuyển tiếp] — theo mã, không có thì dò theo tên ngạch. */
function danhSachNhom(maNgach?: string | null, ngachHienHuong?: string | null): string[] {
  const theoMa = nhomTheoMa(maNgach)
  return theoMa.length ? theoMa : nhomTheoTenNgach(ngachHienHuong)
}

/** Nhóm bảng lương HIỆN HÀNH của ngạch (theo mã, không có thì dò theo tên ngạch). */
export function timNhomBangLuong(maNgach?: string | null, ngachHienHuong?: string | null): BangLuongNhom | null {
  const ds = danhSachNhom(maNgach, ngachHienHuong)
  return ds.length ? BANG_LUONG[ds[0]] : null
}

export type SalaryConsistency =
  | { status: 'OK'; nhom: BangLuongNhom; heSoChuan: number }
  | { status: 'MISMATCH'; nhom: BangLuongNhom; heSoChuan: number; message: string }
  // Không khớp nhóm hiện hành nhưng khớp nhóm chuyển tiếp/cũ → không kết luận sai, nhưng phải rà căn cứ.
  | { status: 'CAN_RA_SOAT'; nhom: BangLuongNhom; heSoChuan: number; message: string }
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
  const vao = { ...cb, bacLuong: cb.bacLuong, heSoLuong: cb.heSoLuong }
  const kq = doiChieuNhom(vao, nhom)
  if (kq.status === 'OK') return kq

  // Không khớp nhóm hiện hành → thử các nhóm chuyển tiếp (nếu mã ngạch có khai báo).
  const nhomCu = danhSachNhom(cb.maNgach, cb.ngachHienHuong).slice(1)
  const loiCu: string[] = []
  for (const ma of nhomCu) {
    const kqCu = doiChieuNhom(vao, BANG_LUONG[ma])
    if (kqCu.status === 'OK') {
      return {
        status: 'CAN_RA_SOAT', nhom: kqCu.nhom, heSoChuan: kqCu.heSoChuan,
        message: `Khớp bảng ${ma} (nhóm theo quy định chuyển tiếp/cũ) nhưng nhóm hiện hành là ${nhom.ma} — cần rà lại căn cứ xếp lương (thời hạn chuyển tiếp, quyết định chuyển xếp).`,
      }
    }
    if ('message' in kqCu) loiCu.push(`nếu theo bảng ${ma}: ${kqCu.message}`)
  }
  if (loiCu.length && 'message' in kq) return { ...kq, message: `${kq.message} (Đã thử nhóm chuyển tiếp — ${loiCu.join('; ')})` }
  return kq
}

function doiChieuNhom(cb: SalaryCheckInput & { bacLuong: number; heSoLuong: number }, nhom: BangLuongNhom): SalaryConsistency {
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
  return r.status === 'MISMATCH' || r.status === 'BAC_OUT_OF_RANGE' || r.status === 'CAN_RA_SOAT'
}
