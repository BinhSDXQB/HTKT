// So khớp số hiệu văn bản (số/năm/LOẠI-CƠ QUAN) với tên tệp/tiêu đề trong kho tài liệu.
// Trước đây tool tra hiệu lực chỉ so số + năm: hỏi 73/2026/TT-BXD có thể nhận 73/2026/TT-BTC.

export type SoHieu = { so: string; nam: string; kyHieu: string[] }

/** Bỏ dấu, Đ→D, viết hoa, mọi ký tự không phải chữ/số thành một dấu cách. */
export const chuanHoaSoHieu = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'D')
    .toUpperCase().replace(/[^0-9A-Z]+/g, ' ').trim()

export function tachSoHieu(raw: string): SoHieu | null {
  const m = raw.match(/(\d{1,4})\s*[/-]\s*(20\d\d|19\d\d)(?:\s*[/-]\s*([A-Za-zĐđ][A-Za-zĐđ0-9]*(?:\s*-\s*[A-Za-zĐđ0-9]+)*))?/)
  if (!m) return null
  return { so: String(Number(m[1])), nam: m[2], kyHieu: m[3] ? chuanHoaSoHieu(m[3]).split(' ') : [] }
}

// Token là LOẠI văn bản (hoặc QHxx với luật) / CƠ QUAN ban hành.
const LA_LOAI = /^(ND|TT|TTLT|QD|NQ|CT|HD|CV|KH|BC|TB|VBHN|PL|QH\d*|UBTVQH\d*)$/
// Danh sách CỤ THỂ (không dùng mẫu B…: "BO SUNG", "BAN HANH" sẽ bị nhận nhầm là cơ quan).
const LA_CQ = /^(CP|TTG|UBND|HDND|BXD|BTC|BNV|BKHDT|BTNMT|BNNMT|BGTVT|BCT|BLDTBXH|BNNPTNT|BTP|BQP|BCA|BYT|BGDDT|BVHTTDL|BTTTT|BKHCN|BNG|NHNN|VPCP|BTCTW|TW|SXD|KTNN|TANDTC|VKSNDTC)$/
// Tên loại viết đầy đủ ("Nghị định 30/2026") → viết tắt, để so cùng hệ với "ND 30 2026".
const TEN_DAY_DU: Array<[RegExp, string]> = [
  [/\bNGHI DINH\b/g, 'ND'], [/\bTHONG TU LIEN TICH\b/g, 'TTLT'], [/\bTHONG TU\b/g, 'TT'], [/\bQUYET DINH\b/g, 'QD'],
  [/\bNGHI QUYET\b/g, 'NQ'], [/\bCHI THI\b/g, 'CT'], [/\bVAN BAN HOP NHAT\b/g, 'VBHN'],
]
const tachToken = (text: string) => TEN_DAY_DU.reduce((s, [re, v]) => s.replace(re, v), chuanHoaSoHieu(text)).split(' ')

export type PhanLoai = 'khop' | 'chua_ro' | 'khac' | 'khong_co'
/**
 * Phân loại một chuỗi (tên tệp, tiêu đề, số hiệu) so với số hiệu được hỏi:
 *  khop     — sau "số năm" là đúng ký hiệu; hoặc loại đứng TRƯỚC số ("TT_30_2026 BXD") và cơ quan đứng sau khớp
 *  khac     — có loại/cơ quan rõ ràng nhưng KHÁC (TT-BTC khi hỏi TT-BXD; "TT 30 2026" khi hỏi QĐ-UBND)
 *  chua_ro  — có "số năm" nhưng không đọc được loại/cơ quan
 *  khong_co — không có "số năm"
 */
export function phanLoaiSoHieu(text: string, q: SoHieu): PhanLoai {
  const tok = tachToken(text)
  const k = q.kyHieu
  // Thành phần ĐÃ BIẾT mà khác → mâu thuẫn; thành phần thiếu → chỉ là chưa rõ.
  const loaiHoi = LA_LOAI.test(k[0] ?? '') ? k[0] : undefined
  const cqHoi = k.slice(loaiHoi ? 1 : 0)
  let thay = false, khac = false
  for (let i = 0; i + 1 < tok.length; i++) {
    if (!/^\d+$/.test(tok[i]) || String(Number(tok[i])) !== q.so || tok[i + 1] !== q.nam) continue
    thay = true
    const sau = tok.slice(i + 2)
    if (k.every((x, j) => sau[j] === x)) return 'khop'
    // loại: ngay sau năm, hoặc đứng trước số ("TT_30_2026 BXD", "Nghị định 30/2026")
    const loaiSau = LA_LOAI.test(sau[0] ?? '') ? sau[0] : undefined
    const loaiTruoc = LA_LOAI.test(tok[i - 1] ?? '') ? tok[i - 1] : undefined
    const loai = loaiSau ?? loaiTruoc
    const sauLoai = loaiSau ? sau.slice(1) : sau
    const cq: string[] = []
    for (const t of sauLoai) { if (LA_CQ.test(t)) cq.push(t); else break }
    const loaiLech = !!(loaiHoi && loai && loai !== loaiHoi)
    const cqLech = cq.length > 0 && cqHoi.length > 0 && cq.some((t, j) => cqHoi[j] !== undefined && t !== cqHoi[j])
    if (loaiLech || cqLech) { khac = true; continue }
    if (loai && loai === loaiHoi && cq.length === cqHoi.length && cq.every((t, j) => t === cqHoi[j])) return 'khop'
  }
  return khac ? 'khac' : thay ? 'chua_ro' : 'khong_co'
}

/**
 * Dùng cho danh mục/nhánh dự phòng: CHÍNH chuỗi số hiệu phải chứa đúng "số năm" (không nhận văn bản
 * chỉ nhắc số hiệu trong trích yếu/ghi chú) và không mâu thuẫn loại/cơ quan được hỏi.
 */
export const soHieuKhongMauThuan = (text: string, q: SoHieu) => ['khop', 'chua_ro'].includes(phanLoaiSoHieu(text, q))

/**
 * Lọc dòng kho (đã khớp thô số + năm bằng SQL) theo ký hiệu được hỏi.
 * khop: khớp đủ ký hiệu. chuaRo: không đọc được loại/cơ quan (phải nói rõ là chưa chắc).
 * khacKyHieu: cùng số/năm nhưng KHÁC loại/cơ quan. phuHop = khop + chuaRo.
 * Không nêu ký hiệu → mọi dòng là chuaRo (giữ hành vi cũ, nhưng nói rõ là chưa phân biệt).
 */
export function locTheoSoHieu<T extends { tieuDe: string; nguon: string | null }>(rows: T[], q: SoHieu) {
  if (!q.kyHieu.length) return { khop: [] as T[], chuaRo: rows, phuHop: rows, khacKyHieu: [] as T[] }
  const khop: T[] = [], chuaRo: T[] = [], khacKyHieu: T[] = []
  for (const r of rows) {
    // tên tệp và tiêu đề xét riêng: nối lại có thể ghép nhầm token cuối tên tệp với đầu tiêu đề
    const ds = [phanLoaiSoHieu(r.nguon ?? '', q), phanLoaiSoHieu(r.tieuDe, q)]
    if (ds.includes('khop')) khop.push(r)
    else if (ds.includes('khac')) khacKyHieu.push(r)
    else chuaRo.push(r)
  }
  return { khop, chuaRo, phuHop: [...khop, ...chuaRo], khacKyHieu }
}
