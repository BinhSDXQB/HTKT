// Tìm kiếm "thông minh" cho Quản lý công việc — tách cụm thành từng từ khoá rồi
// yêu cầu MỌI từ phải xuất hiện ở ÍT NHẤT một trong các trường tiêu đề/mô tả/mã.
// Nhờ vậy gõ vài từ rời (vd "TĐC trục Bắc Nam quảng trạch") vẫn khớp việc có
// tiêu đề "Khu TĐC trên trục Bắc–Nam thuộc xã Quảng Trạch" — thay vì phải gõ
// đúng nguyên văn cả cụm như trước. Dùng chung cho trang danh sách + API gợi ý.

/** Tách chuỗi tìm kiếm thành các từ khoá (bỏ khoảng trắng thừa, dấu gạch lạc). */
export function tokenizeQuery(q: string): string[] {
  return q
    .split(/[\s,]+/)
    .map((t) => t.replace(/^[-–—]+/, '').trim()) // bỏ dấu gạch đầu mẩu ("-Nam" → "Nam")
    .filter((t) => t.length > 0)
}

/**
 * Dựng mệnh đề Prisma `AND` cho tìm kiếm theo từ khoá trên CongViec.
 * Trả về `null` nếu chuỗi rỗng (không thêm điều kiện).
 */
export function buildCongViecSearchAND(q: string | undefined | null) {
  if (!q || !q.trim()) return null
  const tokens = tokenizeQuery(q)
  if (tokens.length === 0) return null
  return tokens.map((tok) => ({
    OR: [
      { tieuDe: { contains: tok, mode: 'insensitive' as const } },
      { moTa: { contains: tok, mode: 'insensitive' as const } },
      { maCongViec: { contains: tok, mode: 'insensitive' as const } },
    ],
  }))
}
