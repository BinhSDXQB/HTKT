// Con của cán bộ: tuổi/lớp TỰ TĂNG theo năm học (nhập một lần, các năm sau không rà soát lại) và
// điều kiện NGƯỜI PHỤ THUỘC để giảm trừ gia cảnh thuế TNCN. Xem migration 046.
//
// Điều kiện con là người phụ thuộc (TT 111/2013/TT-BTC Điều 9 khoản 1 điểm đ — hướng dẫn hiện hành,
// cần đối chiếu khi có thông tư hướng dẫn Luật Thuế TNCN 109/2025/QH15):
//   - con dưới 18 tuổi; hoặc
//   - con từ 18 tuổi trở lên đang học THPT/đại học/cao đẳng/trung cấp/học nghề, không có thu nhập
//     hoặc thu nhập bình quân tháng ≤ 1 triệu đồng.
// Mỗi người phụ thuộc chỉ được tính giảm trừ cho MỘT người nộp thuế.

export type ConCoBan = {
  namSinh: number
  ngaySinh?: Date | string | null
  lopGoc?: number | null
  mamNonGoc?: boolean
  namHocGoc: number
  dangKyNPT: boolean
  phuHuynhDaXacNhan: boolean
}

/** Năm học hiện tại, ký hiệu bằng năm bắt đầu (2025 = năm học 2025-2026). Năm học mới tính từ 01/9. */
export function namHocHienTai(ngay: Date = new Date()): number {
  return ngay.getMonth() >= 8 ? ngay.getFullYear() : ngay.getFullYear() - 1
}

export function nhanNamHoc(namHoc: number): string {
  return `${namHoc}-${namHoc + 1}`
}

/** Tuổi trong năm dương lịch `nam` (danh sách gốc chỉ có tuổi → tính theo năm sinh). */
export function tuoiCon(con: Pick<ConCoBan, 'namSinh' | 'ngaySinh'>, ngay: Date = new Date()): number {
  if (con.ngaySinh) {
    const ns = new Date(con.ngaySinh)
    let t = ngay.getFullYear() - ns.getFullYear()
    if (ngay.getMonth() < ns.getMonth() || (ngay.getMonth() === ns.getMonth() && ngay.getDate() < ns.getDate())) t--
    return t
  }
  return ngay.getFullYear() - con.namSinh
}

/** Lớp ở năm học hiện tại: lớp gốc + số năm học đã qua. null = chưa vào lớp 1 (mầm non/nhỏ). > 12 = đã hết phổ thông. */
export function lopHienTai(con: Pick<ConCoBan, 'lopGoc' | 'mamNonGoc' | 'namHocGoc' | 'namSinh'>, namHoc: number = namHocHienTai()): number | null {
  const soNam = namHoc - con.namHocGoc
  if (con.lopGoc != null) return con.lopGoc + soNam
  // Chưa có lớp gốc: vào lớp 1 năm tròn 6 tuổi (Luật Giáo dục 2019 Điều 28).
  const lop = namHoc - (con.namSinh + 6) + 1
  return lop >= 1 ? lop : null
}

export function nhanCapHoc(lop: number | null, tuoi: number): string {
  if (lop == null) return tuoi >= 3 ? 'Mầm non' : 'Nhà trẻ / chưa đi học'
  if (lop <= 5) return `Lớp ${lop} (Tiểu học)`
  if (lop <= 9) return `Lớp ${lop} (THCS)`
  if (lop <= 12) return `Lớp ${lop} (THPT)`
  return 'Đã hết phổ thông'
}

export type KetQuaNPT = { duocTinh: boolean; lyDo: string }

/** Con có được tính giảm trừ gia cảnh trong tháng/năm đang xét không. */
export function xetNguoiPhuThuoc(con: ConCoBan, ngay: Date = new Date()): KetQuaNPT {
  if (!con.dangKyNPT) return { duocTinh: false, lyDo: 'Không đăng ký người phụ thuộc cho cán bộ này' }
  if (!con.phuHuynhDaXacNhan) return { duocTinh: false, lyDo: 'Chờ xác nhận đúng phụ huynh (trùng họ tên) — chưa tính giảm trừ' }
  const tuoi = tuoiCon(con, ngay)
  if (tuoi < 18) return { duocTinh: true, lyDo: `Con dưới 18 tuổi (${tuoi} tuổi)` }
  const lop = lopHienTai(con, namHocHienTai(ngay))
  if (lop != null && lop <= 12) return { duocTinh: true, lyDo: `Con ${tuoi} tuổi đang học lớp ${lop} (THPT)` }
  return { duocTinh: false, lyDo: `Con ${tuoi} tuổi, đã hết THPT — chỉ tính nếu đang học ĐH/CĐ/TC và thu nhập ≤ 1 triệu/tháng (cần cập nhật)` }
}

export function demNguoiPhuThuoc(ds: ConCoBan[], ngay: Date = new Date()): number {
  return ds.filter((c) => xetNguoiPhuThuoc(c, ngay).duocTinh).length
}

// ── Phân tích nội dung thành tích (nguyên văn) → cấp độ, môn, xếp giải ────────────────────────────

export const CAP_DO_LABEL: Record<string, string> = {
  TRUONG: 'Cấp trường', XA: 'Cấp xã/phường', TINH: 'Cấp tỉnh', KHU_VUC: 'Khu vực', QUOC_GIA: 'Quốc gia', QUOC_TE: 'Quốc tế',
}

function boDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
}

const MON: [RegExp, string][] = [
  [/\bioe\b|tieng anh|fiso|hippo|asmo tieng anh|trang nguyen tieng anh/, 'Tiếng Anh'],
  [/trang nguyen tieng viet|trang nguyen tv\b|tieng viet|\btntv\b/, 'Tiếng Việt'],
  [/violympic|vioedu|viedu|\btoan\b/, 'Toán'],
  [/vat ly/, 'Vật lý'],
  [/hoa\b|hoa hoc/, 'Hóa học'],
  [/tin hoc/, 'Tin học'],
  [/khtn|khoa hoc tu nhien/, 'Khoa học tự nhiên'],
  [/ve tranh/, 'Vẽ tranh'],
  [/chu viet|viet chu/, 'Viết chữ đẹp'],
  [/bong ban/, 'Bóng bàn'],
]

export function doanMon(s: string): string | null {
  const t = boDau(s)
  const ds = MON.filter(([re]) => re.test(t)).map(([, m]) => m)
  return ds.length ? [...new Set(ds)].join(', ') : null
}

export function doanXepGiai(s: string): string | null {
  const t = boDau(s)
  if (/huy chuong vang|hc vang/.test(t)) return 'HC Vàng'
  if (/huy chuong bac|hc bac|giai bac/.test(t)) return 'HC Bạc'
  if (/huy chuong dong|hc dong/.test(t)) return 'HC Đồng'
  if (/giai nhat|\bnhat\b/.test(t)) return 'Nhất'
  if (/giai nhi|\bnhi\b/.test(t)) return 'Nhì'
  if (/giai ba|giai 3|\bba\b/.test(t)) return 'Ba'
  if (/khuyen khich|\bkk\b/.test(t)) return 'Khuyến khích'
  return null
}

/** Đoán cấp độ từ nội dung; nếu không có dấu hiệu thì dùng cấp mặc định của cột nguồn. */
export function doanCapDo(s: string, macDinh: string | null): string | null {
  const t = boDau(s)
  // "vòng loại Quốc gia Olympic … Quốc tế" là vòng cấp QUỐC GIA → xét quốc gia trước quốc tế.
  if (/quoc gia/.test(t)) return 'QUOC_GIA'
  if (/quoc te/.test(t)) return 'QUOC_TE'
  if (/khu vuc|duyen hai|30\/4/.test(t)) return 'KHU_VUC'
  if (/cap tinh|\btinh\b/.test(t)) return 'TINH'
  if (/cap (xa|phuong)|xa\/phuong|thanh pho|cum truong/.test(t)) return 'XA'
  if (/cap truong/.test(t)) return 'TRUONG'
  return macDinh
}
