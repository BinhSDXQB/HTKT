import { checkHoSoCompleteness, type HoSoForCheck, type MissingItem } from './ho-so-completeness'

// Các mục KHÔNG đưa vào tin nhắc "liên hệ bổ sung hồ sơ" gửi tới cá nhân, vì
// KHÔNG phải giấy tờ cá nhân tự nộp mà do Văn phòng/lãnh đạo gán:
//   - viTriViecLam: Vị trí việc làm (NĐ 62/2020) — quản lý gán, theo dõi riêng ở mục VTVL.
const EXCLUDE_FIELDS = new Set(['viTriViecLam'])

/**
 * Các mục BẮT BUỘC còn thiếu thực sự cần CÁ NHÂN bổ sung (đã loại VTVL).
 * Dùng cho cảnh báo Telegram + đếm số người trên nút gửi — để khớp nhau.
 */
export function missingRequiredChoCanhBao(cb: HoSoForCheck): MissingItem[] {
  return checkHoSoCompleteness(cb).missingRequired.filter((m) => !EXCLUDE_FIELDS.has(m.field))
}
