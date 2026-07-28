// Tự động chuyển đổi địa danh "trước hợp nhất" → "sau hợp nhất" (NQ 1680/NQ-UBTVQH15).
// Áp dụng cho Quê quán / Nơi ở thuộc Quảng Bình + Quảng Trị cũ; tỉnh khác trả về null (nhập tay).

import { SAP_NHAP_XA_2025, BI_DANH_XA_CU, type LoaiDonViMoi } from './data/sap-nhap-xa-2025'

interface KetQuaChuyenDoi {
  ten: string
  loai: LoaiDonViMoi
  /** Chuỗi chuẩn hoá, VD: "Xã Triệu Bình, tỉnh Quảng Trị" */
  text: string
}

interface MucTraCuu {
  moi: string
  loai: LoaiDonViMoi
  huyen?: string
}

// Đồng nhất chính tả kiểu cũ (hoà/thuỷ) về kiểu mới (hòa/thủy) để tra cứu ổn định
const TONE_FIX: [RegExp, string][] = [
  [/uỷ/g, 'ủy'], [/uý/g, 'úy'], [/uỳ/g, 'ùy'], [/uỹ/g, 'ũy'], [/uỵ/g, 'ụy'],
  [/oà/g, 'òa'], [/oá/g, 'óa'], [/oả/g, 'ỏa'], [/oã/g, 'õa'], [/oạ/g, 'ọa'],
  [/oè/g, 'òe'], [/oé/g, 'óe'], [/oẻ/g, 'ỏe'], [/oẽ/g, 'õe'], [/oẹ/g, 'ọe'],
]

function norm(s: string): string {
  let out = s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(/[.]+$/g, '').trim()
  for (const [re, thay] of TONE_FIX) out = out.replace(re, thay)
  return out
}

/** Bỏ tiền tố loại đơn vị: "xã ", "phường ", "thị trấn ", "tt.", "h.", "tx." ... */
function stripDonViPrefix(s: string): string {
  return s
    .replace(/^(tt|tx|tp|h|p|q)\.\s*/i, '')
    .replace(/^(xã|phường|thị trấn|huyện|thị xã|thành phố|quận|đặc khu|tỉnh)\s+/i, '')
    .trim()
}

// Tỉnh/thành khác — chỉ chặn khi hồ sơ KHÔNG có ngữ cảnh Quảng Bình/Quảng Trị
const TINH_KHAC = [
  'hà nội', 'huế', 'thừa thiên', 'đà nẵng', 'quảng nam', 'quảng ngãi', 'nghệ an', 'hà tĩnh',
  'thanh hóa', 'thái bình', 'hưng yên', 'nam định', 'ninh bình', 'hải phòng',
  'gia lai', 'đắk lắk', 'lâm đồng', 'khánh hòa', 'bình định', 'phú yên', 'tphcm', 'hồ chí minh',
  'cần thơ', 'đồng nai', 'bình dương', 'tây ninh', 'vĩnh long', 'đồng tháp', 'an giang', 'cà mau',
  'lào cai', 'yên bái', 'tuyên quang', 'thái nguyên', 'phú thọ', 'bắc ninh', 'bắc giang', 'lạng sơn',
  'cao bằng', 'điện biên', 'lai châu', 'sơn la', 'hòa bình', 'hà nam', 'hải dương', 'vĩnh phúc',
]

// Huyện/TX/TP thuộc Quảng Bình + Quảng Trị cũ — dùng làm ngữ cảnh phân biệt
const HUYEN_QBQT = [
  'minh hóa', 'tuyên hóa', 'quảng trạch', 'ba đồn', 'bố trạch', 'đồng hới', 'quảng ninh', 'lệ thủy',
  'vĩnh linh', 'gio linh', 'cam lộ', 'đông hà', 'triệu phong', 'quảng trị', 'hải lăng', 'đakrông',
  'đa krông', 'hướng hóa', 'cồn cỏ',
]

// Chỉ mục: tên xã cũ (chuẩn hoá, không tiền tố — riêng "phường N" giữ nguyên) → các đích
const INDEX: Map<string, MucTraCuu[]> = (() => {
  const idx = new Map<string, MucTraCuu[]>()
  const add = (key: string, muc: MucTraCuu) => {
    const k = norm(key)
    const arr = idx.get(k) ?? []
    arr.push(muc)
    idx.set(k, arr)
  }
  for (const dv of SAP_NHAP_XA_2025) {
    for (const cu of dv.cu) {
      const ten = typeof cu === 'string' ? cu : cu.ten
      const huyen = typeof cu === 'string' ? undefined : cu.huyen
      add(ten, { moi: dv.ten, loai: dv.loai, huyen })
    }
  }
  for (const bd of BI_DANH_XA_CU) {
    const dich = SAP_NHAP_XA_2025.find((d) => d.ten === bd.moi)
    if (dich) add(bd.ten, { moi: dich.ten, loai: dich.loai, huyen: bd.huyen })
  }
  return idx
})()

function loaiLabel(loai: LoaiDonViMoi): string {
  return loai === 'PHUONG' ? 'Phường' : loai === 'DAC_KHU' ? 'Đặc khu' : 'Xã'
}

function timCandidates(seg: string): MucTraCuu[] {
  const truc = INDEX.get(seg) ?? INDEX.get(stripDonViPrefix(seg))
  if (truc) return truc
  // "Lương Ninh Quảng Ninh" (thiếu dấu phẩy) — thử bỏ tên huyện dính ở cuối
  const stripped = stripDonViPrefix(seg)
  for (const huyen of HUYEN_QBQT) {
    if (stripped.endsWith(' ' + huyen)) {
      const conLai = stripped.slice(0, -huyen.length).trim()
      const hit = INDEX.get(conLai)
      if (hit) return hit
    }
  }
  return []
}

/**
 * Chuyển địa danh trước hợp nhất → sau hợp nhất.
 * VD: "Xã Triệu Độ, Huyện Triệu Phong, Tỉnh Quảng Trị" → "Xã Triệu Bình, tỉnh Quảng Trị".
 * Trả về null nếu thuộc tỉnh khác hoặc không tra cứu được (cần nhập tay).
 */
export function chuyenDoiDiaDanh(truoc: string | null | undefined): KetQuaChuyenDoi | null {
  if (!truoc || !truoc.trim()) return null
  const segments = truoc.split(/[,;]|[-–]/g).map((s) => norm(s)).filter(Boolean)
  if (segments.length === 0) return null

  const ghep = segments.join(' ')
  const huyenContext = segments.map((s) => stripDonViPrefix(s)).filter((s) => HUYEN_QBQT.includes(s))
  const coNguCanhQBQT =
    ghep.includes('quảng bình') || ghep.includes('quảng trị') || huyenContext.length > 0

  if (!coNguCanhQBQT) {
    // Không có dấu hiệu QB/QT: nếu nêu tỉnh khác hoặc nhiều phân đoạn → không chuyển
    if (TINH_KHAC.some((t) => ghep.includes(t))) return null
    if (segments.length >= 2) return null
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    // Ngoài phân đoạn đầu, bỏ qua phân đoạn trùng tên huyện (đó là huyện, không phải xã)
    if (i > 0 && HUYEN_QBQT.includes(stripDonViPrefix(seg))) continue
    // Bỏ qua phân đoạn chỉ là tỉnh
    if (/^(tỉnh\s+)?(quảng bình|quảng trị)$/.test(seg)) continue

    const candidates = timCandidates(seg)
    if (candidates.length === 0) continue

    let chon: MucTraCuu | undefined
    if (candidates.length === 1) {
      const c = candidates[0]
      // Mục có ràng buộc huyện thì phải khớp ngữ cảnh (nếu hồ sơ có ghi huyện)
      chon = !c.huyen || huyenContext.length === 0 || huyenContext.includes(c.huyen) ? c : undefined
    } else {
      // Trùng tên ở nhiều huyện → bắt buộc có ngữ cảnh huyện để chọn
      chon = candidates.find((c) => c.huyen && huyenContext.includes(c.huyen))
    }
    if (chon) {
      return { ten: chon.moi, loai: chon.loai, text: `${loaiLabel(chon.loai)} ${chon.moi}, tỉnh Quảng Trị` }
    }
  }
  return null
}

/** Tiện ích cho form/import: trả thẳng chuỗi sau hợp nhất hoặc null. */
export function convertQueQuan(truoc: string | null | undefined): string | null {
  return chuyenDoiDiaDanh(truoc)?.text ?? null
}
