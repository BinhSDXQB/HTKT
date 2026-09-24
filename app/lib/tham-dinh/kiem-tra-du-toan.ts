import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { boDau, type FileHoSo, GIOI_HAN } from './quet-ho-so'
import { napDuLieuDuToanAI, traTyLe, type DuLieuDuToanAI } from './du-lieu-dutoanai'

/**
 * KIỂM TRA DỰ TOÁN TRÌNH THẨM ĐỊNH — từ khối lượng chi tiết → tổng hợp → tổng hợp
 * kinh phí (THKP) → dự toán/tổng mức đầu tư, đối chiếu tỷ lệ với bảng của TT 36/2026.
 *
 * Căn cứ nội dung thẩm định của cơ quan chuyên môn về xây dựng:
 *   - NĐ 206/2026/NĐ-CP Điều 7 khoản 5 (TMĐT), Điều 16 khoản 4 (dự toán XDCT);
 *   - TT 36/2026/TT-BXD: Phụ lục I (TMĐT, Bảng 1.2, k_ps ≤ 10%), Phụ lục II (dự toán
 *     XDCT, công thức 2.1, Bảng 2.1, k_ps ≤ 5%), Phụ lục III (chi phí xây dựng, Bảng 3.3,
 *     3.5, 3.6, 3.7 và Bảng 3.8: T = VL+NC+M; GT = C + TT; TL = (T+GT)×tỷ lệ;
 *     G_XDTT = T+GT+TL; GTGT = G_XDTT×thuế; nhà tạm LT = G_XDTT × tỷ lệ (giá trị TRƯỚC thuế,
 *     KHOẢN RIÊNG ngoài GT — khi tính vào TỔNG chi phí xây dựng thì LT cũng chịu GTGT riêng,
 *     nhưng bản thân số LT ở Bảng 3.8 KHÔNG nhân thêm thuế suất).
 *
 * NGUYÊN TẮC (giống toàn bộ lib/tham-dinh): công cụ CHỈ PHÁT HIỆN và chỉ rõ ô nguồn.
 * Không kết luận thay cán bộ; mọi mức "LỖI" đều là "sai số học so với chính số liệu trong
 * tệp", không phải kết luận pháp lý. Tỷ lệ chi phí lấy từ gói dữ liệu DuToanAI (không chép
 * lại), khi không có gói thì bỏ qua bước đối chiếu tỷ lệ và nói rõ.
 */

// ── Kiểu dữ liệu ─────────────────────────────────────────────────────────────

export type LoaiCongTrinhChiPhi = 'dan-dung' | 'cong-nghiep' | 'giao-thong' | 'nong-nghiep-moi-truong' | 'ha-tang-ky-thuat'

export const NHAN_LOAI_CONG_TRINH: Record<LoaiCongTrinhChiPhi, string> = {
  'dan-dung': 'Công trình dân dụng',
  'cong-nghiep': 'Công trình công nghiệp',
  'giao-thong': 'Công trình giao thông',
  'nong-nghiep-moi-truong': 'Công trình nông nghiệp và môi trường',
  'ha-tang-ky-thuat': 'Công trình hạ tầng kỹ thuật',
}

export type TuyChonKiemTra = {
  /** null = cán bộ CHƯA chọn loại công trình — không đối chiếu tỷ lệ với bảng TT 36/2026, tránh
   *  âm thầm dùng "hạ tầng kỹ thuật" mặc định rồi báo lệch tỷ lệ sai cho công trình dân dụng/khác. */
  loaiCongTrinh: LoaiCongTrinhChiPhi | null
  /** Công trình xây dựng theo tuyến (Bảng 3.7 TT 36/2026) — quyết định tỷ lệ nhà tạm. */
  theoTuyen: boolean
  /** Thuế suất GTGT áp dụng cho xây dựng, dạng phân số (0.1 = 10%). */
  thueSuat: number
  /** Chi phí xây dựng trước thuế của công trình trong TMĐT được duyệt (tỷ đồng) — bậc tra Bảng 3.3/3.7. Null = lấy từ chính dự toán. */
  quyMoTyDong: number | null
}

export const TUY_CHON_MAC_DINH: TuyChonKiemTra = {
  loaiCongTrinh: null, theoTuyen: false, thueSuat: 0.1, quyMoTyDong: null,
}

export type MucDo = 'LOI' | 'CANH_BAO' | 'THONG_TIN'

export type PhatHien = {
  ma: string
  mucDo: MucDo
  tep: string
  sheet: string
  o: string
  /** Giá trị đang ghi trong tệp (chuỗi đã định dạng). */
  hienTai: string
  noiDung: string
  /** Chênh lệch tiền/khối lượng do lỗi này (nếu tính được). */
  giaTriAnhHuong: number | null
  kienNghi: string
  canCu: string
}

export type DongHangMuc = {
  tep: string; sheet: string; dong: number
  ma: string; ten: string; donVi: string
  khoiLuong: number | null
  donGia: { vl: number | null; nc: number | null; m: number | null; chung: number | null }
  thanhTien: { vl: number | null; nc: number | null; m: number | null; tong: number | null }
}

export type KhoiLuongTongHop = {
  khoa: string; ma: string; ten: string; donVi: string
  klChiTiet: number | null; soDongChiTiet: number
  klDuToan: number | null; soDongDuToan: number
  chenhLech: number | null; tyLe: number | null
  trangThai: 'KHOP' | 'LECH' | 'CHI_CO_CHI_TIET' | 'CHI_CO_DU_TOAN'
}

export type DongThkp = { kyHieu: string; ten: string; o: string; giaTri: number | null; tyLe: number | null; cachTinh: string }

export type KetQuaThkp = {
  tep: string; sheet: string
  dong: DongThkp[]
  cauTruc: 'TT36_2026' | 'TT11_2021_CU' | 'KHONG_RO'
  tinhLai: { kyHieu: string; ten: string; trongTep: number | null; tinhLai: number | null; lech: number | null }[]
}

export type KhoanMucChiPhi = {
  ma: 'BT_TDC' | 'XD' | 'TB' | 'QLDA' | 'TV' | 'K' | 'DP' | 'TONG'
  ten: string
  tep: string; sheet: string; dong: number
  truocThue: number | null; gtgt: number | null; sauThue: number | null
  cachTinh: string
}

export type KetQuaTongHopKinhPhi = {
  tep: string; sheet: string
  loai: 'TMDT' | 'DU_TOAN_XDCT'
  khoanMuc: KhoanMucChiPhi[]
}

export type TepDaKiemTra = {
  tep: string
  sheets: { ten: string; vaiTro: string[]; an: boolean; soCongThuc: number; soOLoi: number; dongAn: number; cotAn: number }[]
  ghiChu: string[]
}

export type KetQuaKiemTraDuToan = {
  tuyChon: TuyChonKiemTra
  duLieuDuToanAI: { coDuLieu: boolean; ghiChu: string; phienBan?: string; ngay?: string; vanBan?: string }
  tep: TepDaKiemTra[]
  phatHien: PhatHien[]
  tomTat: { loi: number; canhBao: number; thongTin: number; daCat: boolean }
  khoiLuong: KhoiLuongTongHop[]
  thkp: KetQuaThkp[]
  tongHopKinhPhi: KetQuaTongHopKinhPhi[]
  /** Chi phí trực tiếp VL/NC/M cộng từ các sheet hạng mục (để đối chiếu THKP). */
  trucTiepTuHangMuc: { tep: string; sheet: string; vl: number; nc: number; m: number; tong: number }[]
  canhBao: string[]
}

const TRAN_PHAT_HIEN = 400

// ── Tiện ích số học ──────────────────────────────────────────────────────────

/** Sai số tiền cho phép: làm tròn đồng từng dòng cộng dồn → 2đ/dòng, tối thiểu 0,05%. */
function tolTien(kyVong: number, soDong = 1): number {
  return Math.max(2 * soDong, Math.abs(kyVong) * 0.0005)
}
function tolKl(kyVong: number): number {
  return Math.max(0.0015, Math.abs(kyVong) * 0.002)
}
function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('vi-VN') : String(Math.round(n * 10000) / 10000)
}
function laSo(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v) }

/** Đọc số từ ô: số → số; chuỗi "1.234.567" / "5,5%" → số; khác → null. */
function soTuO(c: XLSX.CellObject | undefined): number | null {
  if (!c) return null
  if (c.t === 'n' && laSo(c.v)) return c.v
  if (c.t === 's' && typeof c.v === 'string') return soTuChuoi(c.v)
  return null
}
// "12.000" (một nhóm nghìn kiểu Việt) hoặc "1.234.567" (nhiều nhóm) — dấu chấm là phân tách nghìn.
// Số đầu KHÔNG được là 0: "0.055" phải hiểu là thập phân (hệ số tỷ lệ), không phải "0055".
const RE_NGHIN_CHAM = /^-?[1-9]\d{0,2}(\.\d{3})+$/
const RE_NGHIN_PHAY = /^-?[1-9]\d{0,2}(,\d{3})+$/

function soTuChuoi(s: string): number | null {
  const t = s.trim().replace(/\s+/g, '')
  if (!t || /[a-zA-Z]/.test(t)) return null
  const m = t.match(/^-?[\d.,]+%?$/)
  if (!m) return null
  const phanTram = t.endsWith('%')
  let so = t.replace('%', '')
  if (!so) return null
  // "1.234.567,89" (VN) hoặc "1,234,567.89" (EN): dấu cuối cùng trong chuỗi là thập phân.
  if (so.includes(',') && so.includes('.')) {
    if (so.lastIndexOf(',') > so.lastIndexOf('.')) so = so.replace(/\./g, '').replace(',', '.')
    else so = so.replace(/,/g, '')
  } else if (RE_NGHIN_CHAM.test(so)) {
    // "12.000" — QUAN TRỌNG: dù chỉ MỘT nhóm 3 số sau dấu chấm vẫn là phân tách nghìn, KHÔNG phải
    // thập phân (12.000 nghĩa là 12000, không phải 12). Kiểm regex trước khi coi "." là thập phân.
    so = so.replace(/\./g, '')
  } else if (RE_NGHIN_PHAY.test(so)) {
    // "12,000" kiểu Anh — cùng một dạng nhóm nghìn nhưng dùng dấu phẩy.
    so = so.replace(/,/g, '')
  } else if (so.includes(',')) {
    // Còn lại: một dấu phẩy không khớp nhóm nghìn 3 số → thập phân kiểu Việt "5,5".
    so = so.replace(',', '.')
  } else if ((so.match(/\./g) || []).length > 1) {
    // Nhiều dấu chấm nhưng không khớp đúng nhóm 3 số (vd lỗi gõ) — vẫn coi là phân tách nghìn,
    // an toàn hơn là để Number() thất bại.
    so = so.replace(/\./g, '')
  }
  const n = Number(so)
  if (!Number.isFinite(n)) return null
  return phanTram ? n / 100 : n
}
/** Tỷ lệ (phân số) ghi trong ô hệ số/cách tính: "T x 5,5%" → 0.055; 0.055 → 0.055; 5.5 → 0.055. */
function tyLeTuO(c: XLSX.CellObject | undefined): number | null {
  if (!c) return null
  if (c.t === 'n' && laSo(c.v)) return c.v > 1 ? c.v / 100 : c.v
  if (c.t === 's' && typeof c.v === 'string') {
    const m = c.v.match(/(\d+(?:[.,]\d+)?)\s*%/)
    if (m) return Number(m[1].replace(',', '.')) / 100
    const n = soTuChuoi(c.v)
    if (n !== null) return n > 1 ? n / 100 : n
  }
  return null
}
function chuoiO(c: XLSX.CellObject | undefined): string {
  if (!c) return ''
  if (typeof c.v === 'string') return c.v.replace(/\s+/g, ' ').trim()
  if (laSo(c.v)) return String(c.v)
  return ''
}
function refO(r: number, c: number): string { return XLSX.utils.encode_cell({ r, c }) }

// ── Biểu thức diễn giải khối lượng ───────────────────────────────────────────

/**
 * Tính biểu thức "210*0,5*0,8/100", "25+8", "2 x 3,5" — chỉ số, + - * / x × ( ) và dấu
 * thập phân kiểu Việt. KHÔNG dùng eval. Trả null nếu không phải biểu thức thuần.
 */
export function tinhBieuThuc(dienGiai: string): number | null {
  let s = dienGiai.trim()
  if (!s) return null
  // Bỏ phần "= kết quả" phía sau (nếu có), giữ vế trái
  const vt = s.split('=')
  s = vt[0].trim()
  if (!s) return null
  s = s.replace(/[x×X]/g, '*').replace(/\s+/g, '')
  if (!/^[\d.,+\-*/()]+$/.test(s)) return null
  if (!/[\d]/.test(s)) return null
  // Diễn giải khối lượng thật luôn ngắn (vd "210*0,5*0,8/100"). Chặn chuỗi/độ sâu ngoặc bất
  // thường trước khi đệ quy — tránh stack overflow / tốn CPU từ ô lỗi dán nhầm chuỗi rất dài.
  if (s.length > 120) return null
  let doSau = 0, doSauMax = 0
  for (const ch of s) {
    if (ch === '(') { doSau++; doSauMax = Math.max(doSauMax, doSau); if (doSauMax > 20) return null }
    else if (ch === ')') doSau--
  }
  if (doSau !== 0) return null
  // Dấu thập phân: nếu có cả , và . → . là ngàn; chỉ , → thập phân
  const chuanHoaSo = (tok: string): number | null => soTuChuoi(tok)
  // Tokenize
  const tokens: (number | string)[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (/[\d.,]/.test(ch)) {
      let j = i
      while (j < s.length && /[\d.,]/.test(s[j])) j++
      const n = chuanHoaSo(s.slice(i, j))
      if (n === null) return null
      tokens.push(n); i = j
    } else { tokens.push(ch); i++ }
  }
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]
  const phanTu = (): number | null => {
    const t = next()
    if (typeof t === 'number') return t
    if (t === '(') { const v = bieuThuc(); if (next() !== ')') return null; return v }
    if (t === '-') { const v = phanTu(); return v === null ? null : -v }
    if (t === '+') return phanTu()
    return null
  }
  const nhanChia = (): number | null => {
    let v = phanTu()
    while (v !== null && (peek() === '*' || peek() === '/')) {
      const op = next(); const r = phanTu()
      if (r === null) return null
      v = op === '*' ? v * r : (r === 0 ? null : v / r)
    }
    return v
  }
  const bieuThuc = (): number | null => {
    let v = nhanChia()
    while (v !== null && (peek() === '+' || peek() === '-')) {
      const op = next(); const r = nhanChia()
      if (r === null) return null
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const kq = bieuThuc()
  if (pos !== tokens.length) return null
  return kq !== null && Number.isFinite(kq) ? kq : null
}

// ── Nhận diện sheet & cột ────────────────────────────────────────────────────

type LuoiO = { ws: XLSX.WorkSheet; r0: number; r1: number; c0: number; c1: number }

function luoi(ws: XLSX.WorkSheet): LuoiO | null {
  if (!ws['!ref']) return null
  const v = XLSX.utils.decode_range(ws['!ref'])
  return { ws, r0: v.s.r, r1: v.e.r, c0: v.s.c, c1: v.e.c }
}
function o(l: LuoiO, r: number, c: number): XLSX.CellObject | undefined { return l.ws[refO(r, c)] as XLSX.CellObject | undefined }

type CotHangMuc = {
  dongTieuDe: number
  ma: number | null; ten: number; donVi: number | null; kl: number
  dgVl: number | null; dgNc: number | null; dgM: number | null; dgChung: number | null
  ttVl: number | null; ttNc: number | null; ttM: number | null; ttTong: number | null
}

/** Tìm dòng tiêu đề bảng hạng mục và ánh xạ cột. Trả null nếu không giống bảng dự toán. */
function timCotHangMuc(l: LuoiO): CotHangMuc | null {
  const maxR = Math.min(l.r1, l.r0 + 30)
  for (let r = l.r0; r <= maxR; r++) {
    const nhan: { c: number; t: string }[] = []
    for (let c = l.c0; c <= l.c1; c++) {
      const t = boDau(chuoiO(o(l, r, c)))
      if (t) nhan.push({ c, t })
    }
    const tim = (...tu: string[]) => nhan.find((n) => tu.some((k) => n.t.includes(k)))
    const cKl = tim('khoi luong')
    const cTen = tim('ten cong tac', 'danh muc cong tac', 'noi dung cong viec', 'mo ta cong viec', 'ten cong viec', 'hang muc cong viec')
    const cDg = tim('don gia')
    const cTt = tim('thanh tien')
    if (!cKl || !cTen || (!cDg && !cTt)) continue

    // Dòng phụ đề (VL/NC/M) nằm ngay dưới
    const phu: { c: number; t: string }[] = []
    for (let c = l.c0; c <= l.c1; c++) {
      const t = boDau(chuoiO(o(l, r + 1, c)))
      if (t) phu.push({ c, t })
    }
    const nhomCon = (batDau: number, ketThuc: number) => {
      const trong = phu.filter((p) => p.c >= batDau && p.c < ketThuc)
      const vl = trong.find((p) => p.t.startsWith('vat lieu') || p.t === 'vl')?.c ?? null
      const nc = trong.find((p) => p.t.startsWith('nhan cong') || p.t === 'nc')?.c ?? null
      const m = trong.find((p) => p.t.startsWith('may') || p.t === 'm')?.c ?? null
      return { vl, nc, m }
    }
    const cMa = tim('ma hieu', 'ma so', 'ma dm', 'ma cong tac')
    const cDv = tim('don vi')
    const cTong = nhan.find((n) => n.t.startsWith('tong cong') || n.t === 'cong')

    let dg = { vl: null as number | null, nc: null as number | null, m: null as number | null }
    let tt = { vl: null as number | null, nc: null as number | null, m: null as number | null }
    let dgChung: number | null = null
    let ttTong: number | null = null
    if (cDg && cTt) {
      dg = nhomCon(cDg.c, cTt.c)
      const sau = nhan.filter((n) => n.c > cTt.c).map((n) => n.c)
      tt = nhomCon(cTt.c, sau.length ? Math.min(...sau) : l.c1 + 1)
      if (dg.vl === null && dg.nc === null && dg.m === null) dgChung = cDg.c
      if (tt.vl === null && tt.nc === null && tt.m === null) ttTong = cTt.c
      else ttTong = cTong?.c ?? null
    } else if (cTt) {
      ttTong = cTt.c
    } else if (cDg) {
      dgChung = cDg.c
    }
    if (ttTong === null && cTong && cTong.c > (cTt?.c ?? -1)) ttTong = cTong.c
    return {
      dongTieuDe: r, ma: cMa?.c ?? null, ten: cTen.c, donVi: cDv?.c ?? null, kl: cKl.c,
      dgVl: dg.vl, dgNc: dg.nc, dgM: dg.m, dgChung, ttVl: tt.vl, ttNc: tt.nc, ttM: tt.m, ttTong,
    }
  }
  return null
}

type CotChiTietKl = { dongTieuDe: number; ma: number | null; ten: number; donVi: number | null; soBoPhan: number | null; dienGiai: number; klMot: number | null; klToanBo: number }

function timCotChiTietKl(l: LuoiO): CotChiTietKl | null {
  const maxR = Math.min(l.r1, l.r0 + 30)
  for (let r = l.r0; r <= maxR; r++) {
    const nhan: { c: number; t: string }[] = []
    for (let c = l.c0; c <= l.c1; c++) { const t = boDau(chuoiO(o(l, r, c))); if (t) nhan.push({ c, t }) }
    const tim = (...tu: string[]) => nhan.find((n) => tu.some((k) => n.t.includes(k)))
    const dg = tim('dien giai')
    const ten = tim('danh muc cong tac', 'ten cong tac', 'noi dung cong viec', 'ten cong viec')
    const kls = nhan.filter((n) => n.t.includes('khoi luong'))
    if (!dg || !ten || kls.length === 0) continue
    const klToanBo = kls.find((n) => n.t.includes('toan bo') || n.t.includes('tong'))?.c ?? kls[kls.length - 1].c
    const klMot = kls.find((n) => n.t.includes('mot bo phan') || n.t.includes('1 bo phan'))?.c ?? (kls.length > 1 ? kls[0].c : null)
    return {
      dongTieuDe: r, ma: tim('ma hieu', 'ma so')?.c ?? null, ten: ten.c, donVi: tim('don vi')?.c ?? null,
      soBoPhan: tim('so bo phan', 'giong nhau', 'so luong ck', 'so ck')?.c ?? null, dienGiai: dg.c, klMot, klToanBo,
    }
  }
  return null
}

const KY_HIEU_THKP = new Set(['VL', 'NC', 'M', 'T', 'C', 'TT', 'LT', 'GT', 'TL', 'G', 'GXDTT', 'GTGT', 'GXD', 'VAT'])
// Chỉ coi là ứng viên ký hiệu nếu CHÍNH VĂN BẢN GỐC (chưa xử lý) đã thuần chữ cái ASCII, dài ≤ 6.
// KHÔNG được tự ý bóc bỏ dấu câu/số/dấu tiếng Việt rồi mới so khớp — làm vậy biến "Đạt" (còn dữ
// liệu khảo sát dân tộc thiểu số, thấy khi rà chéo với Codex trên hồ sơ không liên quan) thành "T",
// biến mã hiệu "M101.0104"/"A33.0570" thành "M"/"A" — gây nhận nhầm sheet không phải THKP.
const RE_UNG_VIEN_KY_HIEU = /^[A-Za-z]{1,6}$/

/**
 * Sheet THKP thật liệt kê MỖI ký hiệu ĐÚNG MỘT LẦN (VL, NC, M, T, C, TT, GT, TL, GXDTT/G, GTGT,
 * GXD, có thể thêm LT) — khác hẳn sheet "chiết tính" tính lặp lại T/C/TT/GT cho từng công tác
 * (hàng trăm dòng, cùng ký hiệu lặp hàng chục lần). Vì vậy đòi hỏi CẢ HAI: đủ số ký hiệu KHÁC NHAU
 * (≥5/14) VÀ tỷ lệ lặp thấp (tổng số dòng khớp / số ký hiệu khác nhau ≤ 2) mới nhận là cột ký hiệu
 * THKP. Đã kiểm chứng bằng cách đọc trực tiếp cả hồ sơ mẫu thật lẫn hồ sơ không liên quan.
 */
function timCotKyHieuThkp(l: LuoiO): number | null {
  let tot: { c: number; n: number; distinct: number } | null = null
  for (let c = l.c0; c <= Math.min(l.c1, l.c0 + 12); c++) {
    let n = 0
    const distinct = new Set<string>()
    for (let r = l.r0; r <= Math.min(l.r1, l.r0 + 300); r++) {
      const goc = chuoiO(o(l, r, c))
      if (!RE_UNG_VIEN_KY_HIEU.test(goc)) continue
      const t = goc.toUpperCase()
      if (KY_HIEU_THKP.has(t)) { n++; distinct.add(t) }
    }
    if (distinct.size >= 5 && n / distinct.size <= 2 && (!tot || distinct.size > tot.distinct)) {
      tot = { c, n, distinct: distinct.size }
    }
  }
  return tot?.c ?? null
}

const NHAN_KHOAN_MUC: { ma: KhoanMucChiPhi['ma']; ten: string; tu: string[]; loaiTru?: string[] }[] = [
  { ma: 'BT_TDC', ten: 'Chi phí bồi thường, hỗ trợ và tái định cư', tu: ['boi thuong'] },
  { ma: 'XD', ten: 'Chi phí xây dựng', tu: ['chi phi xay dung'], loaiTru: ['nha tam', 'truoc thue', 'sau thue', 'cong trinh chinh', 'phu tro', 'tam', 'pha do'] },
  { ma: 'TB', ten: 'Chi phí thiết bị', tu: ['chi phi thiet bi'], loaiTru: ['mua sam', 'lap dat', 'phan bo', 'cong trinh', 'cong nghe'] },
  { ma: 'QLDA', ten: 'Chi phí quản lý dự án', tu: ['chi phi quan ly du an'], loaiTru: ['hoat dong'] },
  { ma: 'TV', ten: 'Chi phí tư vấn đầu tư xây dựng', tu: ['chi phi tu van'], loaiTru: ['khac', 'giam sat', 'thiet ke', 'lap', 'tham tra', 'khao sat'] },
  { ma: 'K', ten: 'Chi phí khác', tu: ['chi phi khac'] },
  { ma: 'DP', ten: 'Chi phí dự phòng', tu: ['chi phi du phong'], loaiTru: ['khoi luong', 'truot gia', 'phat sinh', 'yeu to'] },
  { ma: 'TONG', ten: 'Tổng cộng', tu: ['tong cong', 'tong muc dau tu', 'tong du toan', 'gia tri du toan'], loaiTru: ['sau kiem toan', 'lam tron'] },
]

// ── Bộ kiểm tra ──────────────────────────────────────────────────────────────

type BoiCanh = {
  tuyChon: TuyChonKiemTra
  dl: DuLieuDuToanAI
  phatHien: PhatHien[]
  daCat: boolean
}

function ghi(bc: BoiCanh, p: Omit<PhatHien, 'giaTriAnhHuong' | 'canCu'> & { giaTriAnhHuong?: number | null; canCu?: string }): void {
  if (bc.phatHien.length >= TRAN_PHAT_HIEN) { bc.daCat = true; return }
  bc.phatHien.push({ giaTriAnhHuong: null, canCu: '', ...p })
}

/** Sức khoẻ tệp: công thức chưa có giá trị, ô lỗi, dòng/cột/sheet ẩn. */
function kiemTraSucKhoe(bc: BoiCanh, tep: string, wb: XLSX.WorkBook): TepDaKiemTra {
  const anMap = new Map<string, boolean>()
  for (const s of wb.Workbook?.Sheets ?? []) if (s.name) anMap.set(s.name, !!s.Hidden)
  const ra: TepDaKiemTra = { tep, sheets: [], ghiChu: [] }
  let tongSheetAn = 0
  for (const ten of wb.SheetNames) {
    const ws = wb.Sheets[ten]
    const an = anMap.get(ten) ?? false
    if (an) tongSheetAn++
    let soCongThuc = 0, soOLoi = 0, soChuaGiaTri = 0
    let oLoiDau = ''
    let oChuaGtDau = ''
    if (ws) {
      for (const k of Object.keys(ws)) {
        if (k[0] === '!') continue
        const c = ws[k] as XLSX.CellObject
        if (typeof c.f === 'string') {
          soCongThuc++
          if (c.v === undefined || c.v === null) { soChuaGiaTri++; if (!oChuaGtDau) oChuaGtDau = k }
        }
        if (c.t === 'e') { soOLoi++; if (!oLoiDau) oLoiDau = k }
      }
    }
    const dongAn = ((ws?.['!rows'] ?? []) as { hidden?: boolean }[]).filter((r) => r && r.hidden).length
    const cotAn = ((ws?.['!cols'] ?? []) as { hidden?: boolean }[]).filter((c) => c && c.hidden).length
    ra.sheets.push({ ten, vaiTro: [], an, soCongThuc, soOLoi, dongAn, cotAn })
    if (soOLoi > 0) {
      ghi(bc, {
        ma: 'O_LOI_EXCEL', mucDo: 'LOI', tep, sheet: ten, o: oLoiDau, hienTai: `${soOLoi} ô lỗi`,
        noiDung: `Sheet có ${soOLoi} ô báo lỗi (#REF!, #VALUE!, #DIV/0!, #N/A...). Mọi số cộng qua các ô này đều không tin được.`,
        kienNghi: 'Yêu cầu đơn vị lập dự toán sửa lỗi công thức và nộp lại tệp.', canCu: 'Prompt thẩm định mục 15.3',
      })
    }
    if (soChuaGiaTri > 0) {
      ghi(bc, {
        ma: 'CONG_THUC_CHUA_TINH', mucDo: 'CANH_BAO', tep, sheet: ten, o: oChuaGtDau, hienTai: `${soChuaGiaTri}/${soCongThuc} công thức`,
        noiDung: `${soChuaGiaTri} ô là công thức nhưng tệp chưa lưu giá trị đã tính — hệ thống KHÔNG tự tính lại, các kiểm tra ở sheet này có thể bỏ sót.`,
        kienNghi: 'Mở tệp bằng Excel, tính lại (F9) và lưu; hoặc yêu cầu nộp bản đã tính đầy đủ.',
      })
    }
    if (dongAn > 0 || cotAn > 0) {
      ghi(bc, {
        ma: 'DONG_COT_AN', mucDo: 'THONG_TIN', tep, sheet: ten, o: '', hienTai: `${dongAn} dòng, ${cotAn} cột ẩn`,
        noiDung: 'Sheet có dòng/cột ẩn — có thể chứa số liệu tham gia tổng nhưng không hiện khi in.',
        kienNghi: 'Bỏ ẩn và rà lại các dòng/cột này trước khi kết luận.', canCu: 'Prompt thẩm định mục 15.15',
      })
    }
  }
  if (tongSheetAn > 0) {
    ra.ghiChu.push(`${tongSheetAn}/${wb.SheetNames.length} sheet đang ẩn — hệ thống vẫn đọc cả sheet ẩn.`)
    ghi(bc, {
      ma: 'SHEET_AN', mucDo: 'THONG_TIN', tep, sheet: '', o: '', hienTai: `${tongSheetAn} sheet ẩn`,
      noiDung: `Tệp có ${tongSheetAn} sheet ẩn (${ra.sheets.filter((s) => s.an).map((s) => s.ten).slice(0, 8).join(', ')}${tongSheetAn > 8 ? '…' : ''}). Phần mềm dự toán thường ẩn sheet phụ; vẫn phải rà nếu sheet ẩn chứa hệ số, đơn giá gốc.`,
      kienNghi: 'Xem các sheet ẩn có hệ số/đơn giá khác với sheet in ra hay không.', canCu: 'Prompt thẩm định mục 15.15',
    })
  }
  return ra
}

/** Đọc bảng hạng mục (dự toán chi tiết / giá tổng hợp): dòng công tác + kiểm tra số học. */
function docHangMuc(bc: BoiCanh, tep: string, sheet: string, l: LuoiO, cot: CotHangMuc): { dong: DongHangMuc[]; trucTiep: { vl: number; nc: number; m: number; tong: number } } {
  const dong: DongHangMuc[] = []
  let sumVl = 0, sumNc = 0, sumM = 0, sumTong = 0
  // Cộng dồn để đối chiếu dòng "Tổng"
  let nhomVl = 0, nhomNc = 0, nhomM = 0, nhomTong = 0, nhomSo = 0
  let tatCaVl = 0, tatCaNc = 0, tatCaM = 0, tatCaTong = 0, tatCaSo = 0
  const so = (c: number | null, r: number) => (c === null ? null : soTuO(o(l, r, c)))

  for (let r = cot.dongTieuDe + 1; r <= l.r1; r++) {
    const ten = chuoiO(o(l, r, cot.ten))
    const tenKd = boDau(ten)
    const ma = cot.ma !== null ? chuoiO(o(l, r, cot.ma)) : ''
    const kl = so(cot.kl, r)
    const ttTong = so(cot.ttTong, r)
    const ttVl = so(cot.ttVl, r), ttNc = so(cot.ttNc, r), ttM = so(cot.ttM, r)

    const laTong = /^(tong|cong)\b/.test(tenKd) || /^(tong|cong)\b/.test(boDau(ma))
    if (laTong && (ttTong !== null || ttVl !== null || ttNc !== null || ttM !== null)) {
      const laTongChung = /^tong cong\s*$/.test(tenKd) || tenKd.startsWith('tong cong toan') || tenKd.startsWith('tong cong:') === false && tenKd === 'tong cong'
      const kiem = (nhan: string, trongTep: number | null, nhom: number, tatCa: number, c: number | null) => {
        if (trongTep === null || c === null) return
        const khopNhom = Math.abs(trongTep - nhom) <= tolTien(nhom, nhomSo)
        const khopTatCa = Math.abs(trongTep - tatCa) <= tolTien(tatCa, tatCaSo)
        if (!khopNhom && !khopTatCa) {
          const kyVong = laTongChung ? tatCa : nhom
          ghi(bc, {
            ma: 'TONG_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, c), hienTai: fmt(trongTep),
            noiDung: `Dòng "${ten.slice(0, 60)}" (${nhan}) ghi ${fmt(trongTep)} nhưng cộng các dòng phía trên được ${fmt(nhom)} (nhóm) / ${fmt(tatCa)} (toàn bảng).`,
            giaTriAnhHuong: trongTep - kyVong,
            kienNghi: 'Kiểm tra dòng bị bỏ sót/cộng trùng trong vùng SUM hoặc dòng ẩn.', canCu: 'Prompt thẩm định mục 15.2',
          })
        }
      }
      kiem('tổng', ttTong, nhomTong, tatCaTong, cot.ttTong)
      kiem('VL', ttVl, nhomVl, tatCaVl, cot.ttVl)
      kiem('NC', ttNc, nhomNc, tatCaNc, cot.ttNc)
      kiem('máy', ttM, nhomM, tatCaM, cot.ttM)
      nhomVl = nhomNc = nhomM = nhomTong = 0; nhomSo = 0
      continue
    }
    if (kl === null) continue                       // dòng diễn giải / tiêu đề nhóm
    if (!ten && !ma) continue

    const dgVl = so(cot.dgVl, r), dgNc = so(cot.dgNc, r), dgM = so(cot.dgM, r), dgChung = so(cot.dgChung, r)
    const d: DongHangMuc = {
      tep, sheet, dong: r + 1, ma, ten, donVi: cot.donVi !== null ? chuoiO(o(l, r, cot.donVi)) : '', khoiLuong: kl,
      donGia: { vl: dgVl, nc: dgNc, m: dgM, chung: dgChung },
      thanhTien: { vl: ttVl, nc: ttNc, m: ttM, tong: ttTong },
    }
    dong.push(d)

    if (kl < 0) {
      ghi(bc, { ma: 'KHOI_LUONG_AM', mucDo: 'CANH_BAO', tep, sheet, o: refO(r, cot.kl), hienTai: fmt(kl), noiDung: `Khối lượng âm ở công tác "${ten.slice(0, 60)}".`, kienNghi: 'Khối lượng giảm trừ phải có thuyết minh; nếu là dự toán điều chỉnh thì thể hiện ở bảng so sánh trước/sau.', canCu: 'Prompt thẩm định mục 15.6' })
    } else if (kl === 0) {
      ghi(bc, { ma: 'KHOI_LUONG_KHONG', mucDo: 'THONG_TIN', tep, sheet, o: refO(r, cot.kl), hienTai: '0', noiDung: `Công tác "${ten.slice(0, 60)}" có khối lượng 0.`, kienNghi: 'Xoá dòng thừa hoặc bổ sung khối lượng.', canCu: 'Prompt thẩm định mục 15.6' })
    }
    const coDonGia = [dgVl, dgNc, dgM, dgChung].some((x) => x !== null && x !== 0)
    const coThanhTien = [ttVl, ttNc, ttM, ttTong].some((x) => x !== null && x !== 0)
    if (kl > 0 && !coDonGia && !coThanhTien) {
      ghi(bc, { ma: 'CHUA_CO_DON_GIA', mucDo: 'CANH_BAO', tep, sheet, o: refO(r, cot.kl), hienTai: fmt(kl), noiDung: `Công tác "${ten.slice(0, 60)}" có khối lượng nhưng không có đơn giá/thành tiền.`, kienNghi: 'Bổ sung đơn giá (định mức + giá công bố) hoặc báo giá; nếu tạm tính phải ghi rõ cơ sở.', canCu: 'Prompt thẩm định mục 15.9; NĐ 206/2026 Đ12 k2a' })
    }
    const maKd = boDau(ma)
    if (ten && kl > 0 && (maKd === 'tt' || maKd === 'tam tinh' || (!ma && cot.ma !== null))) {
      ghi(bc, { ma: 'TAM_TINH', mucDo: 'THONG_TIN', tep, sheet, o: refO(r, cot.ten), hienTai: ma || '(trống)', noiDung: `Công tác "${ten.slice(0, 60)}" không có mã hiệu định mức (tạm tính).`, kienNghi: 'Yêu cầu thuyết minh cơ sở giá: báo giá, định mức vận dụng hoặc dự toán chi tiết.', canCu: 'Prompt thẩm định mục 18.5–18.6; TT 36/2026 PL III điểm 2.3' })
    }
    // Thành tiền = KL × đơn giá cho từng thành phần
    const kiemNhan = (nhan: string, dg: number | null, tt: number | null, cTt: number | null) => {
      if (dg === null || tt === null || cTt === null) return
      const kyVong = kl * dg
      if (Math.abs(tt - kyVong) > tolTien(kyVong)) {
        ghi(bc, {
          ma: 'THANH_TIEN_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, cTt), hienTai: fmt(tt),
          noiDung: `Thành tiền ${nhan} của "${ten.slice(0, 50)}" = ${fmt(tt)} ≠ KL ${fmt(kl)} × ĐG ${fmt(dg)} = ${fmt(kyVong)}.`,
          giaTriAnhHuong: tt - kyVong, kienNghi: 'Sửa công thức thành tiền hoặc giải trình hệ số điều chỉnh (nếu có) ngay trên dòng.', canCu: 'Prompt thẩm định mục 15.1',
        })
      }
    }
    kiemNhan('vật liệu', dgVl, ttVl, cot.ttVl)
    kiemNhan('nhân công', dgNc, ttNc, cot.ttNc)
    kiemNhan('máy', dgM, ttM, cot.ttM)
    if (dgChung !== null && ttTong !== null && cot.ttTong !== null && cot.dgChung !== null) kiemNhan('', dgChung, ttTong, cot.ttTong)
    // Tổng cộng dòng = VL + NC + M
    if (ttTong !== null && cot.ttTong !== null && (ttVl !== null || ttNc !== null || ttM !== null)) {
      const kyVong = (ttVl ?? 0) + (ttNc ?? 0) + (ttM ?? 0)
      if (Math.abs(ttTong - kyVong) > tolTien(kyVong, 3)) {
        ghi(bc, { ma: 'TONG_DONG_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, cot.ttTong), hienTai: fmt(ttTong), noiDung: `Tổng dòng "${ten.slice(0, 50)}" = ${fmt(ttTong)} ≠ VL+NC+M = ${fmt(kyVong)}.`, giaTriAnhHuong: ttTong - kyVong, kienNghi: 'Sửa công thức cộng ngang.', canCu: 'Prompt thẩm định mục 15.2' })
      }
    }
    const vl = ttVl ?? 0, nc = ttNc ?? 0, m = ttM ?? 0
    const tong = ttTong ?? (vl + nc + m)
    sumVl += vl; sumNc += nc; sumM += m; sumTong += tong
    nhomVl += vl; nhomNc += nc; nhomM += m; nhomTong += tong; nhomSo++
    tatCaVl += vl; tatCaNc += nc; tatCaM += m; tatCaTong += tong; tatCaSo++
  }

  // Trùng mã hiệu + tên + đơn vị
  const nhom = new Map<string, DongHangMuc[]>()
  for (const d of dong) {
    const k = `${boDau(d.ma)}|${boDau(d.ten)}|${boDau(d.donVi)}`
    nhom.set(k, [...(nhom.get(k) ?? []), d])
  }
  for (const ds of nhom.values()) {
    if (ds.length < 2) continue
    ghi(bc, {
      ma: 'TRUNG_CONG_TAC', mucDo: 'THONG_TIN', tep, sheet, o: `dòng ${ds.map((d) => d.dong).join(', ')}`, hienTai: `${ds.length} dòng`,
      noiDung: `Công tác "${ds[0].ma} ${ds[0].ten.slice(0, 50)}" xuất hiện ${ds.length} lần (tổng KL ${fmt(ds.reduce((s, d) => s + (d.khoiLuong ?? 0), 0))} ${ds[0].donVi}).`,
      kienNghi: 'Hợp lệ nếu tách theo vị trí/đoạn tuyến; kiểm tra không cộng trùng khối lượng với bản vẽ.', canCu: 'Prompt thẩm định mục 15.4–15.5',
    })
  }
  return { dong, trucTiep: { vl: sumVl, nc: sumNc, m: sumM, tong: sumTong } }
}

type DongChiTiet = { ma: string; ten: string; donVi: string; klToanBo: number }

/** Đọc bảng chi tiết khối lượng: kiểm tra diễn giải, nhân số bộ phận. */
function docChiTietKl(bc: BoiCanh, tep: string, sheet: string, l: LuoiO, cot: CotChiTietKl): DongChiTiet[] {
  const ra: DongChiTiet[] = []
  let hienTai: { ma: string; ten: string; donVi: string } | null = null
  for (let r = cot.dongTieuDe + 1; r <= l.r1; r++) {
    const ten = chuoiO(o(l, r, cot.ten))
    const ma = cot.ma !== null ? chuoiO(o(l, r, cot.ma)) : ''
    const donVi = cot.donVi !== null ? chuoiO(o(l, r, cot.donVi)) : ''
    const dienGiai = chuoiO(o(l, r, cot.dienGiai))
    const klMot = cot.klMot !== null ? soTuO(o(l, r, cot.klMot)) : null
    const klToanBo = soTuO(o(l, r, cot.klToanBo))
    const soBp = cot.soBoPhan !== null ? soTuO(o(l, r, cot.soBoPhan)) : null
    if (ten) hienTai = { ma, ten, donVi }
    if (klToanBo === null || !hienTai) continue
    if (/^(tong|cong)\b/.test(boDau(ten))) continue

    if (ten) ra.push({ ...hienTai, klToanBo })
    else if (ra.length) ra[ra.length - 1].klToanBo += klToanBo   // dòng diễn giải phụ cộng vào công tác đang mở

    // Diễn giải → khối lượng
    const tinh = dienGiai ? tinhBieuThuc(dienGiai) : null
    if (tinh !== null) {
      const dich = klMot ?? klToanBo
      if (Math.abs(tinh - dich) > tolKl(dich)) {
        ghi(bc, {
          ma: 'DIEN_GIAI_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, cot.klMot ?? cot.klToanBo), hienTai: fmt(dich),
          noiDung: `Diễn giải "${dienGiai.slice(0, 50)}" tính ra ${fmt(tinh)} nhưng ô khối lượng ghi ${fmt(dich)} (${hienTai.ten.slice(0, 40)}).`,
          giaTriAnhHuong: dich - tinh, kienNghi: 'Sửa khối lượng theo diễn giải hoặc sửa diễn giải theo bản vẽ.', canCu: 'Prompt thẩm định mục 17',
        })
      }
    }
    if (soBp !== null && soBp > 0 && klMot !== null) {
      const kyVong = klMot * soBp
      if (Math.abs(klToanBo - kyVong) > tolKl(kyVong)) {
        ghi(bc, { ma: 'NHAN_BO_PHAN_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, cot.klToanBo), hienTai: fmt(klToanBo), noiDung: `KL toàn bộ ${fmt(klToanBo)} ≠ KL một bộ phận ${fmt(klMot)} × ${fmt(soBp)} bộ phận = ${fmt(kyVong)}.`, giaTriAnhHuong: klToanBo - kyVong, kienNghi: 'Sửa công thức nhân số bộ phận giống nhau.', canCu: 'Prompt thẩm định mục 17' })
      }
    }
  }
  return ra
}

/** Gộp chi tiết ↔ dự toán theo (mã, tên, đơn vị). */
function doiChieuKhoiLuong(bc: BoiCanh, tep: string, chiTiet: DongChiTiet[], duToan: DongHangMuc[]): KhoiLuongTongHop[] {
  // So khớp theo khoá tuyệt đối (mã, tên, đơn vị) — chấp nhận rủi ro false positive/negative đã
  // biết (tên/đơn vị viết khác chút là mất match): đây là công cụ HỖ TRỢ rà soát, không phải kết
  // luận. Chuẩn hoá đơn vị bỏ khoảng trắng nội bộ ("100 m3" == "100m3") để giảm bớt trường hợp lệch
  // vô nghĩa; các trường hợp còn lại (viết tắt khác, thêm quy cách) hiện ra ở CHI_CO_CHI_TIET/
  // CHI_CO_DU_TOAN để cán bộ tự đối chiếu, không báo LỖI cứng.
  const khoa = (ma: string, ten: string, donVi: string) => `${boDau(ma)}|${boDau(ten)}|${boDau(donVi).replace(/\s+/g, '')}`
  const gop = new Map<string, KhoiLuongTongHop>()
  for (const d of chiTiet) {
    const k = khoa(d.ma, d.ten, d.donVi)
    const g = gop.get(k) ?? { khoa: k, ma: d.ma, ten: d.ten, donVi: d.donVi, klChiTiet: 0, soDongChiTiet: 0, klDuToan: null, soDongDuToan: 0, chenhLech: null, tyLe: null, trangThai: 'CHI_CO_CHI_TIET' as const }
    g.klChiTiet = (g.klChiTiet ?? 0) + d.klToanBo; g.soDongChiTiet++
    gop.set(k, g)
  }
  for (const d of duToan) {
    if (d.khoiLuong === null) continue
    const k = khoa(d.ma, d.ten, d.donVi)
    const g = gop.get(k) ?? { khoa: k, ma: d.ma, ten: d.ten, donVi: d.donVi, klChiTiet: null, soDongChiTiet: 0, klDuToan: 0, soDongDuToan: 0, chenhLech: null, tyLe: null, trangThai: 'CHI_CO_DU_TOAN' as const }
    g.klDuToan = (g.klDuToan ?? 0) + d.khoiLuong; g.soDongDuToan++
    gop.set(k, g)
  }
  const ra: KhoiLuongTongHop[] = []
  for (const g of gop.values()) {
    if (g.klChiTiet !== null && g.klDuToan !== null) {
      g.chenhLech = g.klDuToan - g.klChiTiet
      g.tyLe = g.klChiTiet !== 0 ? (g.chenhLech / g.klChiTiet) * 100 : null
      g.trangThai = Math.abs(g.chenhLech) <= tolKl(g.klChiTiet) ? 'KHOP' : 'LECH'
      if (g.trangThai === 'LECH') {
        ghi(bc, {
          ma: 'KL_CHI_TIET_KHAC_TONG_HOP', mucDo: 'LOI', tep, sheet: '(chi tiết ↔ dự toán)', o: '', hienTai: fmt(g.klDuToan),
          noiDung: `"${g.ma} ${g.ten.slice(0, 50)}" (${g.donVi}): bảng chi tiết cộng được ${fmt(g.klChiTiet)} nhưng dự toán dùng ${fmt(g.klDuToan)}.`,
          giaTriAnhHuong: g.chenhLech, kienNghi: 'Đối chiếu lại với bản vẽ; khối lượng đưa vào dự toán phải bằng tổng bảng chi tiết.', canCu: 'Prompt thẩm định mục 17; NĐ 206/2026 Đ16 k3b',
        })
      }
    } else if (g.klChiTiet !== null) {
      g.trangThai = 'CHI_CO_CHI_TIET'
    } else {
      g.trangThai = 'CHI_CO_DU_TOAN'
    }
    ra.push(g)
  }
  ra.sort((a, b) => (a.trangThai === 'LECH' ? 0 : 1) - (b.trangThai === 'LECH' ? 0 : 1) || a.ma.localeCompare(b.ma))
  const chiCoDuToan = ra.filter((g) => g.trangThai === 'CHI_CO_DU_TOAN')
  if (chiTiet.length > 0 && chiCoDuToan.length > 0) {
    ghi(bc, {
      ma: 'CONG_TAC_KHONG_CO_CHI_TIET', mucDo: 'CANH_BAO', tep, sheet: '(chi tiết ↔ dự toán)', o: '', hienTai: `${chiCoDuToan.length} công tác`,
      noiDung: `${chiCoDuToan.length} công tác có trong dự toán nhưng không có dòng nào ở bảng chi tiết khối lượng (vd: ${chiCoDuToan.slice(0, 3).map((g) => `${g.ma} ${g.ten.slice(0, 30)}`).join('; ')}).`,
      kienNghi: 'Yêu cầu bổ sung diễn giải khối lượng từ bản vẽ cho các công tác này.', canCu: 'Prompt thẩm định mục 17',
    })
  }
  return ra
}

/** Đọc & tính lại bảng tổng hợp chi phí xây dựng (THKP) theo Bảng 3.8 TT 36/2026. */
function docThkp(bc: BoiCanh, tep: string, sheet: string, l: LuoiO, cKy: number, trucTiep: { vl: number; nc: number; m: number }[]): KetQuaThkp {
  const dong: DongThkp[] = []
  // Cột giá trị: cột phải nhất có số ở nhiều dòng ký hiệu
  const demSo = new Map<number, number>()
  const dongKy: { r: number; ky: string }[] = []
  for (let r = l.r0; r <= l.r1; r++) {
    // PHẢI dùng cùng bộ lọc chặt như timCotKyHieuThkp: chỉ nhận ô có văn bản GỐC thuần chữ ASCII
    // ≤ 6 ký tự. Nếu bóc số/dấu câu trước rồi mới so khớp, dòng tham chiếu nội bộ "C1"/"A1"/"B1"
    // (dưới mỗi khoản mục, dùng làm ký hiệu trung gian, KHÔNG phải symbol THKP) sẽ bị rút gọn
    // thành "C"/"A"/"B" và đè nhầm lên dòng "C" (chi phí chung) THẬT — đã bắt được lỗi này khi
    // chạy thử trên hồ sơ thật (dòng "C1" của mục Máy thi công lấn dòng "C" của Chi phí chung).
    const goc = chuoiO(o(l, r, cKy))
    if (!RE_UNG_VIEN_KY_HIEU.test(goc)) continue
    const ky = goc.toUpperCase()
    if (!KY_HIEU_THKP.has(ky)) continue
    dongKy.push({ r, ky })
    for (let c = cKy + 1; c <= l.c1; c++) { const v = o(l, r, c); if (v && v.t === 'n' && laSo(v.v) && Math.abs(v.v) >= 1) demSo.set(c, (demSo.get(c) ?? 0) + 1) }
  }
  let cGia = -1, max = 0
  for (const [c, n] of demSo) if (n >= max) { max = n; cGia = c }
  const layGia = (r: number) => (cGia < 0 ? null : soTuO(o(l, r, cGia)))
  const layTyLe = (r: number): number | null => {
    for (let c = cKy + 1; c <= l.c1; c++) {
      if (c === cGia) continue
      const t = tyLeTuO(o(l, r, c))
      if (t !== null && t > 0 && t < 1) return t
    }
    return null
  }
  const layTen = (r: number) => { for (let c = l.c0; c < cKy; c++) { const t = chuoiO(o(l, r, c)); if (t && !/^\d+$/.test(t) && !/^[IVX]+$/.test(t)) return t } return '' }
  const layCach = (r: number) => { for (let c = cKy + 1; c <= l.c1; c++) { if (c === cGia) continue; const t = chuoiO(o(l, r, c)); if (t && /[x×%+]/i.test(t)) return t } return '' }

  const gt = new Map<string, DongThkp>()
  for (const { r, ky } of dongKy) {
    const d: DongThkp = { kyHieu: ky, ten: layTen(r), o: refO(r, Math.max(cGia, 0)), giaTri: layGia(r), tyLe: layTyLe(r), cachTinh: layCach(r) }
    dong.push(d)
    if (!gt.has(ky)) gt.set(ky, d)
  }
  const v = (k: string) => gt.get(k)?.giaTri ?? null
  const VL = v('VL'), NC = v('NC'), M = v('M'), T = v('T'), C = v('C'), TT = v('TT'), LT = v('LT'), GT = v('GT'), TL = v('TL')
  const G = v('GXDTT') ?? v('G'), GTGT = v('GTGT') ?? v('VAT'), GXD = v('GXD')

  let cauTruc: KetQuaThkp['cauTruc'] = 'KHONG_RO'
  if (GT !== null && C !== null && TT !== null) {
    if (Math.abs(GT - (C + TT)) <= tolTien(GT, 2)) cauTruc = 'TT36_2026'
    else if (LT !== null && Math.abs(GT - (C + LT + TT)) <= tolTien(GT, 3)) cauTruc = 'TT11_2021_CU'
  }
  const tinhLai: KetQuaThkp['tinhLai'] = []
  const them = (kyHieu: string, ten: string, trongTep: number | null, tinh: number | null, mucDo: MucDo, o2: string, canCu: string, kienNghi: string) => {
    const lech = trongTep !== null && tinh !== null ? trongTep - tinh : null
    tinhLai.push({ kyHieu, ten, trongTep, tinhLai: tinh, lech })
    if (lech !== null && tinh !== null && Math.abs(lech) > tolTien(tinh, 3)) {
      ghi(bc, { ma: `THKP_${kyHieu}_LECH`, mucDo, tep, sheet, o: o2, hienTai: fmt(trongTep), noiDung: `${ten} (${kyHieu}) trong tệp = ${fmt(trongTep)}, tính lại = ${fmt(tinh)}.`, giaTriAnhHuong: lech, kienNghi, canCu })
    }
  }
  const oc = (k: string) => gt.get(k)?.o ?? ''
  if (VL !== null && NC !== null && M !== null) them('T', 'Chi phí trực tiếp', T, VL + NC + M, 'LOI', oc('T'), 'TT 36/2026 PL III Bảng 3.8 (T = VL+NC+M)', 'Sửa công thức cộng trực tiếp.')
  const tyC = gt.get('C')?.tyLe, tyTT = gt.get('TT')?.tyLe, tyTL = gt.get('TL')?.tyLe, tyLT = gt.get('LT')?.tyLe
  if (T !== null && tyC != null) them('C', 'Chi phí chung', C, T * tyC, 'LOI', oc('C'), 'TT 36/2026 PL III Bảng 3.8 (C = T × tỷ lệ)', 'Sửa công thức chi phí chung.')
  if (T !== null && tyTT != null) them('TT', 'Chi phí không xác định được KL từ thiết kế', TT, T * tyTT, 'LOI', oc('TT'), 'TT 36/2026 PL III Bảng 3.8 (TT = T × tỷ lệ)', 'Sửa công thức.')
  if (C !== null && TT !== null && GT !== null) {
    them('GT', 'Chi phí gián tiếp', GT, cauTruc === 'TT11_2021_CU' && LT !== null ? C + LT + TT : C + TT, 'LOI', oc('GT'), 'TT 36/2026 PL III Bảng 3.8 (GT = C + TT)', 'Sửa công thức cộng gián tiếp.')
  }
  if (T !== null && GT !== null && tyTL != null) them('TL', 'Thu nhập chịu thuế tính trước', TL, (T + GT) * tyTL, 'LOI', oc('TL'), 'TT 36/2026 PL III Bảng 3.8 (TL = (T+GT) × tỷ lệ)', 'Sửa công thức TNCTTT.')
  if (T !== null && GT !== null && TL !== null) them('GXDTT', 'Chi phí xây dựng trước thuế', G, T + GT + TL, 'LOI', oc('GXDTT') || oc('G'), 'TT 36/2026 PL III Bảng 3.8 (G_XDTT = T+GT+TL)', 'Sửa công thức.')
  if (G !== null && GTGT !== null) them('GTGT', 'Thuế GTGT', GTGT, G * bc.tuyChon.thueSuat, 'CANH_BAO', oc('GTGT') || oc('VAT'), `Thuế suất áp dụng ${bc.tuyChon.thueSuat * 100}% (tuỳ chọn kiểm tra)`, 'Đối chiếu thuế suất GTGT xây dựng tại thời điểm lập dự toán.')
  if (G !== null && GTGT !== null && GXD !== null) them('GXD', 'Chi phí xây dựng sau thuế', GXD, G + GTGT, 'LOI', oc('GXD'), 'TT 36/2026 PL III Bảng 3.8', 'Sửa công thức.')
  if (cauTruc === 'TT36_2026' && LT !== null && G !== null && tyLT != null) them('LT', 'Chi phí nhà tạm', LT, G * tyLT, 'CANH_BAO', oc('LT'), 'TT 36/2026 PL III Bảng 3.8 (LT = G_XDTT × tỷ lệ)', 'Nhà tạm tính trên chi phí xây dựng trước thuế, là khoản riêng chịu thuế.')

  if (cauTruc === 'TT11_2021_CU') {
    ghi(bc, {
      ma: 'THKP_CAU_TRUC_CU', mucDo: 'CANH_BAO', tep, sheet, o: oc('GT'), hienTai: 'GT = C + LT + TT',
      noiDung: 'Bảng tổng hợp gộp nhà tạm (LT) vào chi phí gián tiếp và tính LT trên chi phí trực tiếp — đây là cấu trúc theo TT 11/2021/TT-BXD cũ. Từ 01/7/2026, Bảng 3.8 TT 36/2026: GT = C + TT (không gồm LT); nhà tạm là mục V riêng, giá trị trước thuế = G_XDTT × tỷ lệ Bảng 3.7, cộng GTGT riêng khi tính vào tổng chi phí xây dựng.',
      kienNghi: 'Nếu dự toán lập/điều chỉnh sau 01/7/2026 phải lập lại THKP theo Bảng 3.8 TT 36/2026; nếu lập trước đó, ghi rõ quy định chuyển tiếp áp dụng (NĐ 206/2026 Điều 36).', canCu: 'TT 36/2026 PL III mục 5, 6; NĐ 206/2026 Đ12 k2, Đ36',
    })
  }

  // Đối chiếu tỷ lệ với bảng TT 36 (qua gói DuToanAI) — CHỈ khi cán bộ đã chọn loại công trình.
  const bang = bc.dl.bangTyLe
  const loai = bc.tuyChon.loaiCongTrinh ? NHAN_LOAI_CONG_TRINH[bc.tuyChon.loaiCongTrinh] : null
  const quyMo = bc.tuyChon.quyMoTyDong ?? (G !== null ? G / 1e9 : null)
  if (bang && loai && quyMo !== null) {
    const soSanh = (ky: string, ten: string, tyTrongTep: number | null | undefined, maBang: string, loaiBang: string, bangSo: string) => {
      if (tyTrongTep == null) return
      const tra = traTyLe(bang, maBang, loaiBang, quyMo)
      if (!tra) return
      const kyVong = tra.tyLe / 100
      if (Math.abs(tyTrongTep - kyVong) > 0.00005) {
        ghi(bc, {
          ma: `TY_LE_${ky}_KHAC_BANG`, mucDo: 'CANH_BAO', tep, sheet, o: oc(ky), hienTai: `${(tyTrongTep * 100).toFixed(2)}%`,
          noiDung: `Tỷ lệ ${ten} trong tệp ${(tyTrongTep * 100).toFixed(2)}% khác ${tra.tyLe}% của ${bangSo} (${loaiBang}${tra.bac < 1e9 ? `, bậc ≤ ${tra.bac} tỷ đồng` : ''}; quy mô dùng để tra: ${quyMo.toFixed(2)} tỷ).`,
          kienNghi: 'Nếu tỷ lệ khác do công trình đặc thù (hải đảo ×1,1; hầm; lập dự toán riêng) phải có thuyết minh; nếu không, sửa theo bảng.', canCu: `TT 36/2026 PL III ${bangSo}; số liệu tra từ gói DuToanAI ${bc.dl.ma ?? ''} phiên bản ${bc.dl.phienBan ?? ''}`,
        })
      }
    }
    soSanh('C', 'chi phí chung', tyC, 'CPXD_CHUNG', loai, 'Bảng 3.3')
    soSanh('TT', 'chi phí không xác định được KL', tyTT, 'CPXD_KHONGXACDINH', loai, 'Bảng 3.5')
    soSanh('TL', 'thu nhập chịu thuế tính trước', tyTL, 'CPXD_TNCTTT', loai, 'Bảng 3.6')
    soSanh('LT', 'nhà tạm để ở và điều hành thi công', tyLT, 'CPXD_NHATAM', bc.tuyChon.theoTuyen ? 'Công trình xây dựng theo tuyến' : 'Công trình xây dựng còn lại', 'Bảng 3.7')
  }

  // Đối chiếu T với tổng VL/NC/M cộng từ bảng hạng mục cùng tệp
  if (T !== null && trucTiep.length > 0) {
    const khop = trucTiep.some((tt) => Math.abs(tt.vl + tt.nc + tt.m - T) <= tolTien(T, 50))
    if (!khop) {
      ghi(bc, {
        ma: 'THKP_T_KHAC_HANG_MUC', mucDo: 'CANH_BAO', tep, sheet, o: oc('T'), hienTai: fmt(T),
        noiDung: `Chi phí trực tiếp T = ${fmt(T)} không khớp tổng VL+NC+M của bảng hạng mục nào trong tệp (${trucTiep.map((x) => fmt(x.vl + x.nc + x.m)).join('; ')}).`,
        kienNghi: 'Xác định THKP này tổng hợp cho hạng mục nào; nếu tổng hợp nhiều hạng mục thì đối chiếu từng bảng.', canCu: 'Prompt thẩm định mục 15.2',
      })
    }
  }
  return { tep, sheet, dong, cauTruc, tinhLai }
}

/** Đọc bảng tổng hợp dự toán XDCT / TMĐT (Bảng 2.1 / Bảng 1.2 TT 36/2026). */
function docTongHopKinhPhi(bc: BoiCanh, tep: string, sheet: string, l: LuoiO, thkpGxd: number | null): KetQuaTongHopKinhPhi | null {
  // Tìm cột nhãn: cột có nhiều nhãn khoản mục nhất
  const dem = new Map<number, number>()
  for (let r = l.r0; r <= l.r1; r++) for (let c = l.c0; c <= Math.min(l.c1, l.c0 + 6); c++) {
    const t = boDau(chuoiO(o(l, r, c)))
    if (t && NHAN_KHOAN_MUC.some((k) => k.tu.some((tu) => t.includes(tu)))) dem.set(c, (dem.get(c) ?? 0) + 1)
  }
  let cNhan = -1, max = 0
  for (const [c, n] of dem) if (n > max) { max = n; cNhan = c }
  if (cNhan < 0 || max < 4) return null

  // Tiêu đề cột số: trước thuế / GTGT / sau thuế
  let cTruoc = -1, cGtgt = -1, cSau = -1, dongTd = -1
  for (let r = l.r0; r <= Math.min(l.r1, l.r0 + 25) && cSau < 0; r++) {
    for (let c = cNhan + 1; c <= l.c1; c++) {
      const t = boDau(chuoiO(o(l, r, c)))
      if (!t) continue
      if (t.includes('truoc thue') && cTruoc < 0) { cTruoc = c; dongTd = r }
      else if ((t.includes('gtgt') || t.includes('gia tri gia tang')) && cGtgt < 0) cGtgt = c
      else if (t.includes('sau thue') && cSau < 0) cSau = c
    }
  }
  if (cSau < 0 && cTruoc < 0) {
    // Không có tiêu đề: lấy cột số phải nhất
    for (let r = l.r0; r <= l.r1; r++) for (let c = l.c1; c > cNhan; c--) { const v = o(l, r, c); if (v && v.t === 'n' && laSo(v.v) && Math.abs(v.v) > 1000) { cSau = Math.max(cSau, c); break } }
    if (cSau < 0) return null
  }
  // Dò tiêu đề TMĐT/dự toán trong 10 dòng × 6 cột đầu — tiêu đề nằm ở ô gộp nên vị trí lệch,
  // không chỉ ở đúng (l.r0, l.c0). Còn PHẢI đối chiếu lại bằng nội dung sau khi đọc khoanMuc
  // (bên dưới): "Chi phí bồi thường, hỗ trợ và tái định cư" CHỈ có ở TMĐT (Đ5 NĐ 206/2026),
  // KHÔNG có ở dự toán XDCT (Đ12) — tín hiệu này chắc hơn nhiều so với dò chữ tiêu đề.
  let tieuDe = ''
  for (let r = l.r0; r <= Math.min(l.r1, l.r0 + 10); r++) {
    for (let c = l.c0; c <= Math.min(l.c1, l.c0 + 6); c++) tieuDe += ' ' + boDau(chuoiO(o(l, r, c)))
  }
  let loai: KetQuaTongHopKinhPhi['loai'] = tieuDe.includes('tong muc dau tu') ? 'TMDT' : 'DU_TOAN_XDCT'

  const khoanMuc: KhoanMucChiPhi[] = []
  const daCo = new Set<string>()
  for (let r = Math.max(dongTd, l.r0) + 1; r <= l.r1; r++) {
    const nhan = chuoiO(o(l, r, cNhan))
    const t = boDau(nhan)
    if (!t) continue
    const stt = chuoiO(o(l, r, l.c0))
    const laDongChinh = /^\d+(\.0)?$/.test(stt) || /^[IVX]+$/.test(stt) || cNhan === l.c0
    for (const k of NHAN_KHOAN_MUC) {
      if (daCo.has(k.ma)) continue
      if (!k.tu.some((tu) => t.includes(tu))) continue
      if (k.loaiTru?.some((lt) => t.includes(lt)) && k.ma !== 'TONG') continue
      if (k.ma === 'TONG' && k.loaiTru?.some((lt) => t.includes(lt))) continue
      if (!laDongChinh && k.ma !== 'TONG') continue
      const truoc = cTruoc >= 0 ? soTuO(o(l, r, cTruoc)) : null
      const gtgt = cGtgt >= 0 ? soTuO(o(l, r, cGtgt)) : null
      const sau = cSau >= 0 ? soTuO(o(l, r, cSau)) : null
      if (truoc === null && sau === null) continue
      let cach = ''
      for (let c = cNhan + 1; c <= l.c1; c++) { if (c === cTruoc || c === cGtgt || c === cSau) continue; const s = chuoiO(o(l, r, c)); if (s && /[%x×+]/i.test(s)) { cach = s; break } }
      khoanMuc.push({ ma: k.ma, ten: k.ten, tep, sheet, dong: r + 1, truocThue: truoc, gtgt, sauThue: sau, cachTinh: cach })
      daCo.add(k.ma)
      if (sau !== null && truoc !== null && gtgt !== null && Math.abs(sau - (truoc + gtgt)) > tolTien(sau, 2)) {
        ghi(bc, { ma: 'SAU_THUE_LECH', mucDo: 'LOI', tep, sheet, o: refO(r, cSau), hienTai: fmt(sau), noiDung: `${k.ten}: sau thuế ${fmt(sau)} ≠ trước thuế ${fmt(truoc)} + GTGT ${fmt(gtgt)}.`, giaTriAnhHuong: sau - truoc - gtgt, kienNghi: 'Sửa công thức cộng ngang.', canCu: 'Prompt thẩm định mục 15.2' })
      }
      break
    }
  }
  if (khoanMuc.length < 3) return null

  const lay = (ma: KhoanMucChiPhi['ma']) => khoanMuc.find((k) => k.ma === ma)
  // BT_TDC chỉ tồn tại trong TMĐT (NĐ 206/2026 Đ5 k1 điểm a) — chắc hơn dò chữ tiêu đề ở ô gộp.
  if (lay('BT_TDC')) loai = 'TMDT'
  const tong = lay('TONG')
  const thanhPhan = khoanMuc.filter((k) => k.ma !== 'TONG')
  const bangSo = loai === 'TMDT' ? 'TT 36/2026 PL I Bảng 1.2 (công thức 1.4)' : 'TT 36/2026 PL II Bảng 2.1 (công thức 2.1)'
  if (tong) {
    for (const [nhan, key, c] of [['trước thuế', 'truocThue', cTruoc], ['GTGT', 'gtgt', cGtgt], ['sau thuế', 'sauThue', cSau]] as const) {
      if (c < 0 || tong[key] === null) continue
      const s = thanhPhan.reduce((a, k) => a + (k[key] ?? 0), 0)
      if (Math.abs((tong[key] ?? 0) - s) > tolTien(s, thanhPhan.length)) {
        ghi(bc, {
          ma: 'TONG_KINH_PHI_LECH', mucDo: 'LOI', tep, sheet, o: refO(tong.dong - 1, c), hienTai: fmt(tong[key]),
          noiDung: `Tổng cộng (${nhan}) = ${fmt(tong[key])} ≠ cộng ${thanhPhan.length} khoản mục = ${fmt(s)} (${thanhPhan.map((k) => k.ma).join('+')}).`,
          giaTriAnhHuong: (tong[key] ?? 0) - s, kienNghi: 'Kiểm tra khoản mục bị bỏ sót/cộng trùng (vd nhà tạm, chi phí hoạt động BQLDA) hoặc dòng ẩn.', canCu: bangSo,
        })
      }
    }
  }
  // Dự toán XDCT (Đ12 NĐ 206/2026, công thức 2.1): XD+TB+QLDA+TV+K+DP — không có BT_TDC.
  // TMĐT (Đ5, công thức 1.4): thêm BT_TDC. Thiếu TB trước đây không bị báo — bỏ sót khoản mục thật.
  const khoanMucBatBuoc = loai === 'TMDT'
    ? (['BT_TDC', 'XD', 'TB', 'QLDA', 'TV', 'K', 'DP'] as const)
    : (['XD', 'TB', 'QLDA', 'TV', 'K', 'DP'] as const)
  const thieu = khoanMucBatBuoc.filter((m) => !lay(m))
  if (thieu.length) {
    ghi(bc, { ma: 'THIEU_KHOAN_MUC', mucDo: 'CANH_BAO', tep, sheet, o: '', hienTai: khoanMuc.map((k) => k.ma).join(', '), noiDung: `Bảng tổng hợp (${loai === 'TMDT' ? 'TMĐT' : 'dự toán XDCT'}) không nhận ra khoản mục: ${thieu.map((m) => NHAN_KHOAN_MUC.find((k) => k.ma === m)?.ten).join('; ')}.`, kienNghi: `Đối chiếu bằng tay đủ ${khoanMucBatBuoc.length} khoản mục; có thể bảng đặt tên khác hoặc khoản mục bằng 0 nên không có dòng riêng.`, canCu: `NĐ 206/2026 Đ5 k1, Đ12; ${bangSo}` })
  }
  const xd = lay('XD')
  if (xd && thkpGxd !== null) {
    const trongTep = xd.sauThue ?? xd.truocThue
    if (trongTep !== null && Math.abs(trongTep - thkpGxd) > tolTien(thkpGxd, 5)) {
      ghi(bc, { ma: 'GXD_KHAC_THKP', mucDo: 'CANH_BAO', tep, sheet, o: refO(xd.dong - 1, cSau >= 0 ? cSau : cTruoc), hienTai: fmt(trongTep), noiDung: `Chi phí xây dựng trong bảng tổng hợp ${fmt(trongTep)} khác chi phí xây dựng sau thuế của THKP ${fmt(thkpGxd)}.`, giaTriAnhHuong: trongTep - thkpGxd, kienNghi: 'Xác định bảng tổng hợp gồm những hạng mục nào; chênh lệch phải giải thích được bằng các THKP thành phần.', canCu: 'Prompt thẩm định mục 15.2' })
    }
  }
  // Dự phòng: DP1 (khối lượng, công việc phát sinh) ≤ 5% (dự toán XDCT) / ≤ 10% (TMĐT) —
  // TRẦN CHỈ ÁP CHO DP1, KHÔNG áp cho tổng DP = DP1 + DP2 (DP2 trượt giá không có trần cứng,
  // phụ thuộc thời gian thực hiện và chỉ số giá). Bản `NHAN_KHOAN_MUC` cố tình loại trừ dòng con
  // "khối lượng/trượt giá/phát sinh" khỏi khoanMuc (tránh lẫn với dòng DP tổng) nên phải dò riêng.
  const dp = lay('DP')
  if (dp) {
    let dp1: number | null = null
    for (let r = Math.max(dongTd, l.r0) + 1; r <= l.r1; r++) {
      const t = boDau(chuoiO(o(l, r, cNhan)))
      if (t.includes('du phong') && (t.includes('khoi luong') || t.includes('phat sinh')) && !t.includes('truot gia')) {
        dp1 = (cSau >= 0 ? soTuO(o(l, r, cSau)) : null) ?? (cTruoc >= 0 ? soTuO(o(l, r, cTruoc)) : null)
        if (dp1 !== null) break
      }
    }
    const conLai = thanhPhan.filter((k) => k.ma !== 'DP').reduce((a, k) => a + (k.sauThue ?? k.truocThue ?? 0), 0)
    const gtDp = dp.sauThue ?? dp.truocThue ?? 0
    const tran = loai === 'TMDT' ? 10 : 5
    if (dp1 !== null && conLai > 0) {
      const tyDp1 = (dp1 / conLai) * 100
      if (tyDp1 > tran + 0.01) {
        ghi(bc, {
          ma: 'TY_LE_DU_PHONG', mucDo: 'CANH_BAO', tep, sheet, o: refO(dp.dong - 1, cSau >= 0 ? cSau : cTruoc), hienTai: `${tyDp1.toFixed(2)}%`,
          noiDung: `Dự phòng khối lượng, công việc phát sinh (DP1) = ${fmt(dp1)} = ${tyDp1.toFixed(2)}% của các khoản mục còn lại (${fmt(conLai)}), vượt trần k_ps ≤ ${tran}%.`,
          giaTriAnhHuong: dp1 - (conLai * tran) / 100,
          kienNghi: 'Giảm DP1 về đúng trần hoặc giải trình mức độ phức tạp/điều kiện địa chất theo quy định.', canCu: loai === 'TMDT' ? 'TT 36/2026 PL I công thức 1.12 (k_ps ≤ 10%)' : 'TT 36/2026 PL II công thức 2.8 (k_ps ≤ 5%)',
        })
      }
    } else if (conLai > 0) {
      // Không tách được DP1/DP2 riêng — chỉ cảnh báo khi TỔNG dự phòng vượt xa mọi giới hạn hợp
      // lý (ngưỡng nới hơn nhiều so với trần DP1 vì DP2 trượt giá có thể cộng thêm đáng kể).
      const tyTong = (gtDp / conLai) * 100
      if (tyTong > tran * 2.5) {
        ghi(bc, {
          ma: 'TY_LE_DU_PHONG_TONG', mucDo: 'THONG_TIN', tep, sheet, o: refO(dp.dong - 1, cSau >= 0 ? cSau : cTruoc), hienTai: `${tyTong.toFixed(2)}%`,
          noiDung: `Tổng dự phòng (DP1+DP2, KHÔNG tách được riêng DP1) = ${fmt(gtDp)} = ${tyTong.toFixed(2)}% của các khoản mục còn lại — cao bất thường so với trần DP1 ≤ ${tran}% dù đã cộng cả trượt giá.`,
          kienNghi: 'Yêu cầu bảng tính tách rõ DP1 (≤ trần k_ps) và DP2 (thuyết minh chỉ số giá, kế hoạch vốn theo năm).', canCu: loai === 'TMDT' ? 'TT 36/2026 PL I công thức 1.11–1.13' : 'TT 36/2026 PL II công thức 2.7–2.9',
        })
      }
    }
  }
  for (const m of ['QLDA', 'TV'] as const) {
    const k = lay(m)
    if (k && k.cachTinh) {
      ghi(bc, { ma: `${m}_CACH_TINH`, mucDo: 'THONG_TIN', tep, sheet, o: refO(k.dong - 1, cNhan), hienTai: k.cachTinh.slice(0, 60), noiDung: `${k.ten}: ${fmt(k.sauThue ?? k.truocThue)} — cách tính ghi "${k.cachTinh.slice(0, 60)}".`, kienNghi: 'Đối chiếu định mức tỷ lệ QLDA/tư vấn bằng phần mềm DuToanAI (bảng định mức BXD hiện hành) theo loại công trình và quy mô.', canCu: 'NĐ 206/2026 Đ25, Đ26; TT 36/2026 Đ14' })
    }
  }
  return { tep, sheet, loai, khoanMuc }
}

// ── Hàm chính ────────────────────────────────────────────────────────────────

export async function kiemTraDuToan(goc: string, files: FileHoSo[], tuyChonDauVao?: Partial<TuyChonKiemTra>): Promise<KetQuaKiemTraDuToan> {
  const tuyChon: TuyChonKiemTra = { ...TUY_CHON_MAC_DINH, ...(tuyChonDauVao ?? {}) }
  const dl = await napDuLieuDuToanAI()
  const bc: BoiCanh = { tuyChon, dl, phatHien: [], daCat: false }
  const ra: KetQuaKiemTraDuToan = {
    tuyChon,
    duLieuDuToanAI: { coDuLieu: dl.coDuLieu, ghiChu: dl.ghiChu, phienBan: dl.phienBan, ngay: dl.ngay, vanBan: dl.vanBan },
    tep: [], phatHien: bc.phatHien, tomTat: { loi: 0, canhBao: 0, thongTin: 0, daCat: false },
    khoiLuong: [], thkp: [], tongHopKinhPhi: [], trucTiepTuHangMuc: [], canhBao: [],
  }
  if (!dl.coDuLieu) ra.canhBao.push(`Không đối chiếu được tỷ lệ chi phí với bảng TT 36/2026: ${dl.ghiChu}`)
  if (!tuyChon.loaiCongTrinh) ra.canhBao.push('Chưa chọn loại công trình → không đối chiếu tỷ lệ chi phí chung/TNCTTT/nhà tạm với Bảng 3.3/3.5/3.6/3.7 TT 36/2026 (mỗi loại công trình có tỷ lệ khác nhau, không tự chọn "hạ tầng kỹ thuật" mặc định).')

  const bangTinh = files.filter((f) => ['xlsx', 'xls', 'xlsm'].includes(f.duoi)).slice(0, 12)
  for (const f of bangTinh) {
    if (f.kichThuoc > GIOI_HAN.kichThuocDocToiDa) { ra.canhBao.push(`${f.ten}: vượt trần dung lượng, chưa kiểm tra.`); continue }
    let wb: XLSX.WorkBook
    try {
      const buf = await readFile(path.join(goc, f.duongDanTuongDoi))
      wb = XLSX.read(buf, { type: 'buffer', cellFormula: true, cellNF: false, cellStyles: true, sheetStubs: false })
    } catch (e) {
      ra.canhBao.push(`${f.ten}: lỗi đọc — ${e instanceof Error ? e.message : String(e)}`); continue
    }
    const tep = f.duongDanTuongDoi
    const tk = kiemTraSucKhoe(bc, tep, wb)
    ra.tep.push(tk)

    const hangMuc: DongHangMuc[] = []
    const chiTiet: DongChiTiet[] = []
    const trucTiepTep: { vl: number; nc: number; m: number }[] = []
    const thkpChoSau: { sheet: string; l: LuoiO; cKy: number }[] = []
    const tongHopChoSau: { sheet: string; l: LuoiO }[] = []
    let laDuToan = false

    for (const ten of wb.SheetNames) {
      const ws = wb.Sheets[ten]
      const l = ws ? luoi(ws) : null
      if (!l) continue
      const meta = tk.sheets.find((s) => s.ten === ten)!
      // Sheet quyết toán/dự thầu/... (hậu tố QT, "thầu") cũng là bảng hạng mục: vẫn đọc nhưng đánh dấu
      const cotHm = timCotHangMuc(l)
      const cotCt = timCotChiTietKl(l)
      const cKy = timCotKyHieuThkp(l)
      if (cotCt) {
        meta.vaiTro.push('CHI_TIET_KL'); laDuToan = true
        chiTiet.push(...docChiTietKl(bc, tep, ten, l, cotCt))
      } else if (cotHm) {
        meta.vaiTro.push('HANG_MUC'); laDuToan = true
        const kq = docHangMuc(bc, tep, ten, l, cotHm)
        // Chỉ dùng bảng có thành tiền để đối chiếu THKP; bảng khối lượng thuần (không giá) vẫn gộp KL
        hangMuc.push(...kq.dong)
        if (kq.trucTiep.vl + kq.trucTiep.nc + kq.trucTiep.m > 0) {
          trucTiepTep.push(kq.trucTiep)
          ra.trucTiepTuHangMuc.push({ tep, sheet: ten, ...kq.trucTiep })
        }
      }
      if (cKy !== null) { meta.vaiTro.push('THKP'); laDuToan = true; thkpChoSau.push({ sheet: ten, l, cKy }) }
      const tieuDe = boDau([0, 1, 2].map((i) => chuoiO(o(l, l.r0 + i, l.c0))).join(' '))
      if (/tong hop (du toan|kinh phi|tong muc)|tong muc dau tu|tong hop chi phi/.test(tieuDe) && cKy === null) tongHopChoSau.push({ sheet: ten, l })
    }
    // Bảng chi tiết ↔ bảng dự toán trong CÙNG tệp. Bảng dự toán lấy sheet hạng mục đầu tiên có KL
    // (tránh cộng trùng khi tệp có nhiều bảng chép cùng khối lượng: "Công trình", "Giá tổng hợp"...).
    // Chọn sheet hạng mục "chính" để đối chiếu khối lượng — KHÔNG lấy sheet xuất hiện đầu tiên
    // theo thứ tự trong workbook (thứ tự sheet không phản ánh vai trò; tệp thật có nhiều sheet
    // hạng mục: "Giá tổng hợp", "Công trình", có khi cả "Dự thầu"...). Chấm điểm theo bằng chứng:
    // càng nhiều dòng có MÃ HIỆU công tác + thành tiền → càng giống bảng dự toán chính thức.
    const sheetsHm = [...new Set(hangMuc.map((d) => d.sheet))]
    let sheetChinh = sheetsHm[0] ?? ''
    let diemCao = -1
    for (const s of sheetsHm) {
      const dong = hangMuc.filter((d) => d.sheet === s)
      const diem = dong.filter((d) => d.ma && d.thanhTien.tong !== null).length
      if (diem > diemCao) { diemCao = diem; sheetChinh = s }
    }
    const duToanDeSoSanh = sheetsHm.length ? hangMuc.filter((d) => d.sheet === sheetChinh) : []
    if (chiTiet.length && duToanDeSoSanh.length) ra.khoiLuong.push(...doiChieuKhoiLuong(bc, tep, chiTiet, duToanDeSoSanh))
    else if (chiTiet.length === 0 && duToanDeSoSanh.length) {
      ghi(bc, { ma: 'KHONG_CO_BANG_CHI_TIET', mucDo: 'CANH_BAO', tep, sheet: '', o: '', hienTai: `${duToanDeSoSanh.length} công tác`, noiDung: 'Tệp có bảng dự toán nhưng không có bảng chi tiết khối lượng (diễn giải từ bản vẽ) — không đối chiếu được chi tiết → tổng hợp.', kienNghi: 'Yêu cầu nộp bảng tính khối lượng chi tiết kèm diễn giải theo bản vẽ.', canCu: 'NĐ 206/2026 Đ16 k3b; Prompt thẩm định mục 17' })
    }
    let thkpGxd: number | null = null
    for (const t of thkpChoSau) {
      const kq = docThkp(bc, tep, t.sheet, t.l, t.cKy, trucTiepTep)
      ra.thkp.push(kq)
      const gxd = kq.dong.find((d) => d.kyHieu === 'GXD')?.giaTri ?? null
      if (thkpGxd === null && gxd !== null) thkpGxd = gxd
    }
    for (const t of tongHopChoSau) {
      const kq = docTongHopKinhPhi(bc, tep, t.sheet, t.l, thkpGxd)
      if (kq) { ra.tongHopKinhPhi.push(kq); tk.sheets.find((s) => s.ten === t.sheet)!.vaiTro.push(kq.loai); laDuToan = true }
    }
    if (!laDuToan) {
      tk.ghiChu.push('Không nhận ra bảng dự toán/khối lượng/THKP nào — tệp có thể không phải dự toán.')
      ghi(bc, { ma: 'KHONG_PHAI_DU_TOAN', mucDo: 'CANH_BAO', tep, sheet: '', o: '', hienTai: wb.SheetNames.slice(0, 5).join(', '), noiDung: 'Tệp bảng tính được xếp nhóm dự toán nhưng không có sheet nào có cấu trúc dự toán (mã hiệu/khối lượng/đơn giá/thành tiền, THKP, tổng hợp kinh phí).', kienNghi: 'Xác nhận lại tệp; nếu là dự toán ở định dạng khác (PDF, ảnh) thì yêu cầu nộp bản Excel gốc.', canCu: 'Prompt thẩm định mục 5, 15' })
    }
  }
  if (bangTinh.length === 0) ra.canhBao.push('Không có tệp bảng tính (.xls/.xlsx/.xlsm) nào trong thư mục để kiểm tra dự toán.')
  if (files.filter((f) => ['xlsx', 'xls', 'xlsm'].includes(f.duoi)).length > 12) ra.canhBao.push('Chỉ kiểm tra 12 tệp bảng tính đầu tiên.')

  const thuTu: Record<MucDo, number> = { LOI: 0, CANH_BAO: 1, THONG_TIN: 2 }
  bc.phatHien.sort((a, b) => thuTu[a.mucDo] - thuTu[b.mucDo] || Math.abs(b.giaTriAnhHuong ?? 0) - Math.abs(a.giaTriAnhHuong ?? 0))
  ra.tomTat = {
    loi: bc.phatHien.filter((p) => p.mucDo === 'LOI').length,
    canhBao: bc.phatHien.filter((p) => p.mucDo === 'CANH_BAO').length,
    thongTin: bc.phatHien.filter((p) => p.mucDo === 'THONG_TIN').length,
    daCat: bc.daCat,
  }
  if (bc.daCat) ra.canhBao.push(`Đã cắt danh sách phát hiện ở ${TRAN_PHAT_HIEN} mục — sửa các lỗi lớn rồi kiểm tra lại.`)
  return ra
}
