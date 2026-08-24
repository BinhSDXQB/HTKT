// Tìm kiếm theo TỪ trong nội dung nghiệp vụ HTKT.
//
// Vì sao cần: chatbot truyền nguyên câu hỏi của cán bộ ("nhà máy nước cấp mấy",
// "chặt hạ cây xanh"), trong khi tiêu đề trong dữ liệu là "Cấp giấy phép chặt hạ,
// DỊCH CHUYỂN cây xanh" hay "Nhà máy nước, công trình xử lý nước sạch". Khớp nguyên
// cụm sẽ trượt hết. Kiểm thử 24/8/2026 bắt được đúng lỗi này: 3/4 câu hỏi mẫu không
// ra kết quả đúng.
//
// Cách làm: tách câu hỏi thành từ, bỏ từ đệm, cho điểm theo số từ khớp, xếp hạng giảm dần.

/** Từ quá phổ biến, giữ lại chỉ làm nhiễu điểm. */
const TU_DEM = new Set([
  'là', 'của', 'và', 'các', 'những', 'cho', 'với', 'thì', 'mà', 'ở', 'tại', 'về', 'theo',
  'trong', 'ngoài', 'khi', 'nào', 'gì', 'sao', 'thế', 'ra', 'được', 'có', 'không', 'phải',
  'này', 'đó', 'một', 'hay', 'hoặc', 'bao', 'nhiêu', 'mấy', 'như', 'nếu', 'để', 'từ', 'đến',
  'công', 'trình', 'quy', 'định', 'thủ', 'tục', 'hỏi', 'xin', 'cần', 'làm', 'ai', 'đâu',
])

/** Tách câu hỏi thành các từ có nghĩa để chấm điểm. */
export function tachTu(tuKhoa: string): string[] {
  return (tuKhoa || '')
    .toLowerCase()
    .replace(/[.,;:!?()[\]"'/\\]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !TU_DEM.has(t))
}

/**
 * Chấm điểm một mục theo câu hỏi.
 *   - Khớp nguyên cụm  → cộng đậm (ưu tiên cao nhất)
 *   - Mỗi từ khớp      → cộng 1
 * Trả 0 nghĩa là không liên quan.
 */
export function chamDiem(noiDung: string, tuKhoa: string): number {
  const van = (noiDung || '').toLowerCase()
  const cum = (tuKhoa || '').toLowerCase().trim()
  if (!cum) return 0
  let diem = van.includes(cum) ? 5 : 0
  for (const t of tachTu(cum)) if (van.includes(t)) diem += 1
  return diem
}

/**
 * Lọc và xếp hạng danh sách theo câu hỏi.
 * `lay` trả về toàn bộ chữ có thể so khớp của một phần tử.
 * `toiThieu` = số từ tối thiểu phải khớp thì mới coi là liên quan (mặc định 1).
 */
export function xepHang<T>(
  ds: T[],
  tuKhoa: string,
  lay: (x: T) => string,
  toiThieu = 1
): T[] {
  const cum = (tuKhoa || '').trim()
  if (!cum) return ds
  const soTu = Math.max(1, tachTu(cum).length)
  // Câu hỏi nhiều từ thì đòi khớp chặt hơn để không trả về mọi thứ.
  const nguong = soTu >= 4 ? Math.max(toiThieu, 2) : toiThieu
  return ds
    .map((x) => ({ x, d: chamDiem(lay(x), cum) }))
    .filter((r) => r.d >= nguong)
    .sort((a, b) => b.d - a.d)
    .map((r) => r.x)
}
