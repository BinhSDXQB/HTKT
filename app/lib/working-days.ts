/**
 * Tính NGÀY LÀM VIỆC cho nghỉ phép năm — KHÔNG tính thứ Bảy, Chủ nhật và
 * ngày nghỉ lễ/Tết (Điều 112, 113 Bộ luật Lao động 2019).
 *
 * Cơ quan nhà nước làm việc T2–T6, nghỉ T7 + CN. Khi kỳ nghỉ phép năm trùng
 * ngày lễ/Tết hoặc cuối tuần thì những ngày đó KHÔNG bị trừ vào định mức phép.
 *
 * Dùng được ở cả client (xem trước) lẫn server (tính chính thức) — KHÔNG import db.
 *
 * ⚠️ Ngày lễ ÂM LỊCH (Tết Nguyên đán, Giỗ Tổ) thay đổi theo năm. Khi sang năm
 * mới phải cập nhật theo lịch nghỉ chính thức do Chính phủ công bố.
 */

/** Ngày nghỉ lễ chính thức theo từng năm (định dạng 'YYYY-MM-DD', giờ địa phương). */
const VN_HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01',                                                   // Tết Dương lịch
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', // Tết Nguyên đán (5 ngày)
    '2025-04-07',                                                   // Giỗ Tổ Hùng Vương (10/3 ÂL)
    '2025-04-30',                                                   // Giải phóng miền Nam
    '2025-05-01',                                                   // Quốc tế Lao động
    '2025-09-01', '2025-09-02',                                     // Quốc khánh (2 ngày)
  ],
  2026: [
    '2026-01-01',                                                   // Tết Dương lịch
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', // Tết Nguyên đán (mùng 1 = 17/2)
    '2026-04-26',                                                   // Giỗ Tổ Hùng Vương (10/3 ÂL)
    '2026-04-30',                                                   // Giải phóng miền Nam
    '2026-05-01',                                                   // Quốc tế Lao động
    '2026-09-01', '2026-09-02',                                     // Quốc khánh (2 ngày)
  ],
  2027: [
    '2027-01-01',                                                   // Tết Dương lịch
    '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', // Tết Nguyên đán (mùng 1 = 6/2)
    '2027-04-16',                                                   // Giỗ Tổ Hùng Vương (10/3 ÂL)
    '2027-04-30',                                                   // Giải phóng miền Nam
    '2027-05-01',                                                   // Quốc tế Lao động
    '2027-09-01', '2027-09-02',                                     // Quốc khánh (2 ngày)
  ],
}

/** Tập hợp tất cả ngày lễ (mọi năm) để tra cứu nhanh. */
const HOLIDAY_SET = new Set<string>(Object.values(VN_HOLIDAYS).flat())

function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Định dạng Date → 'YYYY-MM-DD' (giờ địa phương) cho input[type=date]. */
export function formatYmd(d: Date): string {
  return ymdLocal(d)
}

/** Một ngày có phải ngày nghỉ lễ chính thức không. */
export function isHoliday(d: Date): boolean {
  return HOLIDAY_SET.has(ymdLocal(d))
}

/** Có phải cuối tuần (T7/CN) không. */
export function isWeekend(d: Date): boolean {
  const w = d.getDay()
  return w === 0 || w === 6
}

/** Ngày làm việc = không phải T7/CN và không phải ngày lễ. */
export function isWorkingDay(d: Date): boolean {
  return !isWeekend(d) && !isHoliday(d)
}

/** Tổng số ngày dương lịch (gồm cả 2 đầu mút). */
export function calendarDays(from: Date, to: Date): number {
  const a = new Date(from).setHours(0, 0, 0, 0)
  const b = new Date(to).setHours(0, 0, 0, 0)
  if (isNaN(a) || isNaN(b) || b < a) return 0
  return Math.floor((b - a) / 86400000) + 1
}

/**
 * Số NGÀY LÀM VIỆC từ `from` đến `to` (gồm cả 2 đầu mút), loại trừ T7/CN và lễ.
 * Đây là số ngày trừ vào định mức phép năm.
 */
export function workingDays(from: Date, to: Date): number {
  const start = new Date(from); start.setHours(0, 0, 0, 0)
  const end = new Date(to); end.setHours(0, 0, 0, 0)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (isWorkingDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Số ngày T7/CN/lễ rơi vào kỳ nghỉ (phần KHÔNG bị trừ phép). */
export function nonWorkingInRange(from: Date, to: Date): number {
  return calendarDays(from, to) - workingDays(from, to)
}

/**
 * Tính NGÀY KẾT THÚC khi biết ngày bắt đầu + số NGÀY LÀM VIỆC cần nghỉ.
 * Đếm `n` ngày làm việc (bỏ T7/CN/lễ), trả về ngày làm việc cuối cùng được dùng.
 * Dùng cho phép năm. Nửa ngày (0.5) → cùng ngày bắt đầu (làm tròn lên).
 */
export function endDateByWorkingDays(from: Date, n: number): Date | null {
  const days = Math.ceil(n)
  if (!(days >= 1)) return null
  const cur = new Date(from); cur.setHours(0, 0, 0, 0)
  if (isNaN(cur.getTime())) return null
  let count = 0
  for (let i = 0; i < 3650; i++) {
    if (isWorkingDay(cur)) {
      count++
      if (count >= days) return new Date(cur)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return null
}

/**
 * Tính NGÀY KẾT THÚC khi biết ngày bắt đầu + số NGÀY dương lịch (gồm cả 2 đầu mút).
 * Dùng cho các loại nghỉ không phải phép năm.
 */
export function endDateByCalendarDays(from: Date, n: number): Date | null {
  const days = Math.ceil(n)
  if (!(days >= 1)) return null
  const cur = new Date(from); cur.setHours(0, 0, 0, 0)
  if (isNaN(cur.getTime())) return null
  cur.setDate(cur.getDate() + (days - 1))
  return cur
}

/** Tính đến-ngày theo loại nghỉ. PHEP_NAM → ngày làm việc; loại khác → ngày dương lịch. */
export function endDateForLeave(loaiNghi: string, from: Date, n: number): Date | null {
  return loaiNghi === 'PHEP_NAM' ? endDateByWorkingDays(from, n) : endDateByCalendarDays(from, n)
}
