// Chuyển cột "Thời gian yêu cầu đặt ra" của Phụ lục KPI thành quý áp dụng.
// Chỉ phân tích chữ trong ô; ô mơ hồ được đánh dấu để cán bộ tự quyết thay vì đoán.

export type Quy = 1 | 2 | 3 | 4

export type ThoiHan = {
  /** Các quý có hạn/sản phẩm cụ thể (rỗng nếu nhiệm vụ trải suốt năm hoặc không rõ). */
  quy: Quy[]
  /** Nhiệm vụ thường xuyên/định kỳ/theo phát sinh: có thể phát sinh ở bất kỳ quý nào. */
  lienTuc: boolean
  /** Ô trống hoặc cách viết chưa nhận diện: cần người dùng xác nhận. */
  khongRo: boolean
}

const LA_MA: Record<string, Quy> = { I: 1, II: 2, III: 3, IV: 4 }
const quyCuaThang = (t: number): Quy => (Math.ceil(t / 3) as Quy)

export function phanTichThoiHan(raw: string): ThoiHan {
  const s = raw.replace(/\s+/g, ' ').trim()
  if (!s) return { quy: [], lienTuc: true, khongRo: true }
  const quy = new Set<Quy>()
  let lienTuc = false

  // "Quý III, IV/2026", "Quý I,III/2026", "Quý III- IV", "Quý II", "Quý I năm 2026"
  for (const m of s.matchAll(/Quý\s*((?:IV|I{1,3}|V)(?:\s*(?:,|-|–|và)\s*(?:IV|I{1,3}))*)/g)) {
    const so = m[1].split(/\s*(?:,|-|–|và)\s*/).map((x) => LA_MA[x]).filter(Boolean)
    const noiTiep = /-|–/.test(m[1]) && so.length === 2 && !/,/.test(m[1])
    if (noiTiep) for (let q = so[0]; q <= so[1]; q++) quy.add(q as Quy)
    else so.forEach((q) => quy.add(q))
  }
  // "Tháng 8/2026"
  for (const m of s.matchAll(/Tháng\s*(\d{1,2})\s*\/\s*2026/g)) {
    const t = Number(m[1])
    if (t >= 1 && t <= 12) quy.add(quyCuaThang(t))
  }
  // "31/12/2026", "Trước ngày 31/12/2026 …": hạn cuối cùng
  for (const m of s.matchAll(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*2026/g)) {
    const t = Number(m[2])
    if (t >= 1 && t <= 12) quy.add(quyCuaThang(t))
  }

  // Có kèm cụm trải suốt năm / phát sinh → có thể ở quý khác
  if (/Năm 2026|Cả năm|Thường xuyên|Định kỳ|theo (từng|tiến độ|thời hạn|yêu cầu|kế hoạch|đề nghị)|Khi có|cập nhật|đúng thời hạn|cuối quý/i.test(s)) lienTuc = true
  const khongRo = quy.size === 0 && !lienTuc
  if (khongRo) lienTuc = true
  return { quy: [...quy].sort() as Quy[], lienTuc, khongRo }
}

export type ChonMacDinh = 'CO' | 'KHONG' | 'TUY_CHON'

/**
 * Mặc định "nhiệm vụ này có thuộc quý q không":
 * - có hạn đúng quý q → CÓ; có hạn ở quý khác và không thường xuyên → KHÔNG;
 * - thường xuyên/định kỳ/không rõ → TUY_CHON (cán bộ tự đánh dấu nếu có phát sinh công việc trong quý).
 */
export function macDinhTheoQuy(t: ThoiHan, q: Quy): ChonMacDinh {
  if (t.quy.includes(q)) return 'CO'
  if (t.quy.length > 0 && !t.lienTuc) return 'KHONG'
  return 'TUY_CHON'
}
