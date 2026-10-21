/**
 * Xác định hồ sơ cán bộ CỦA CHÍNH người đang đăng nhập (tool luong_cua_toi).
 *
 * Trước đây dùng findFirst({ OR: [{ userId }, { cccd: email }] }): nếu userId khớp hồ sơ A còn CCCD/email
 * khớp hồ sơ B thì CSDL trả ngẫu nhiên một trong hai → có thể trả lương NGƯỜI KHÁC (Codex phản biện B0 vòng 2).
 * Nay: ưu tiên liên kết userId; CCCD chỉ là đường dự phòng; mọi xung đột → TỪ CHỐI.
 */
export type HoSoTim = { id: string; userId: string | null }

export type KetQuaNhanDien<T> =
  | { loai: 'TIM_THAY'; hoSo: T }
  | { loai: 'KHONG_THAY' }
  | { loai: 'XUNG_DOT' }

export function nhanDienBanThan<T extends HoSoTim>(
  theoUserId: T | null, theoCccd: T | null, userIdDangNhap: string,
): KetQuaNhanDien<T> {
  if (theoUserId && theoCccd && theoUserId.id !== theoCccd.id) return { loai: 'XUNG_DOT' }
  if (theoUserId) return { loai: 'TIM_THAY', hoSo: theoUserId }
  if (theoCccd) {
    // Hồ sơ khớp CCCD nhưng đã gắn với TÀI KHOẢN KHÁC → không phải của người đang hỏi
    if (theoCccd.userId && theoCccd.userId !== userIdDangNhap) return { loai: 'XUNG_DOT' }
    return { loai: 'TIM_THAY', hoSo: theoCccd }
  }
  return { loai: 'KHONG_THAY' }
}
