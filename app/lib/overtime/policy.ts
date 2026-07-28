// Chính sách làm thêm giờ theo Bộ luật Lao động 2019.
//   - Trần làm thêm: ≤ 200 giờ/người/NĂM (Điều 107); một số trường hợp tới 300 giờ.
//   - Vì trần tính cho cả 12 tháng → cảnh báo theo nhịp TRUNG BÌNH/tháng của mỗi
//     người: 200 ÷ 12 ≈ 16,7 giờ/tháng. Dự kiến cả năm = TB/tháng × 12.
//   - Ngày ký văn bản phải là ngày làm việc (không rơi vào Thứ Bảy/Chủ nhật).
// Chấm công CHI TIẾT theo từng ngày trong tháng (tự nhận Thứ Bảy/Chủ nhật theo lịch).

export const OT_LIMIT_NAM = 200 // giờ/người/năm
export const OT_AVG_THANG = r2(OT_LIMIT_NAM / 12) // ≈ 16,67 giờ/tháng/người

/** Giờ làm thêm theo từng ngày trong tháng: { "1": 4, "2": 0, ... } */
export type GioNgay = Record<string, number>

/** Tổng giờ làm thêm trong tháng của 1 người (cộng tất cả các ngày). */
export function sumDayHours(g: GioNgay | null | undefined): number {
  if (!g) return 0
  let s = 0
  for (const k of Object.keys(g)) {
    const v = Number(g[k])
    if (!isNaN(v)) s += v
  }
  return r2(s)
}

/** Làm tròn 2 chữ số (tránh sai số dấu phẩy động khi cộng giờ). */
export function r2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] // index = getDay()

export function thuTrongTuan(d: Date): string {
  return THU[new Date(d).getDay()]
}
export function thuNgan(d: Date): string {
  return THU_NGAN[new Date(d).getDay()]
}
export function laCuoiTuan(d: Date): boolean {
  const g = new Date(d).getDay()
  return g === 0 || g === 6
}

export type MonthDay = {
  day: number       // 1..31
  dow: number       // getDay(): 0=CN..6=T7
  thu: string       // nhãn ngắn: T2..T7, CN
  weekend: boolean  // Thứ Bảy / Chủ nhật
}

/** Danh sách các ngày trong tháng kèm thứ + cờ cuối tuần. */
export function monthDays(nam: number, thang: number): MonthDay[] {
  const n = new Date(nam, thang, 0).getDate() // số ngày trong tháng
  const out: MonthDay[] = []
  for (let day = 1; day <= n; day++) {
    const d = new Date(nam, thang - 1, day)
    const dow = d.getDay()
    out.push({ day, dow, thu: THU_NGAN[dow], weekend: dow === 0 || dow === 6 })
  }
  return out
}

/**
 * Danh sách ngày trong khoảng [from, to] (bao gồm 2 đầu mút) kèm thứ + cờ cuối tuần.
 * Dùng cho lưới chấm công tự sinh theo "từ ngày → đến ngày". `day` = ngày trong tháng.
 * Giới hạn an toàn 62 ngày.
 */
export function rangeDays(from: Date, to: Date): MonthDay[] {
  const out: MonthDay[] = []
  const a = new Date(from); a.setHours(0, 0, 0, 0)
  const b = new Date(to); b.setHours(0, 0, 0, 0)
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return out
  let guard = 0
  for (const d = new Date(a); d <= b && guard < 62; d.setDate(d.getDate() + 1), guard++) {
    const dow = d.getDay()
    out.push({ day: d.getDate(), dow, thu: THU_NGAN[dow], weekend: dow === 0 || dow === 6 })
  }
  return out
}

/** Chuyển chuỗi 'yyyy-mm-dd' thành Date (00:00 giờ địa phương). */
export function parseYMD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/**
 * Ngày lưu DB phải là UTC-00:00 để khớp với cách ĐỌC bằng getUTC* (toDateInput,
 * plainDate, fmtNgay). Nếu lưu bằng new Date(nam,thang,day) giờ địa phương (UTC+7)
 * thì getUTC* sẽ đọc lùi 1 ngày → lệch thứ/ngày trên lưới chấm công.
 */
export function utcDate(nam: number, thang: number, day: number): Date {
  return new Date(Date.UTC(nam, thang - 1, day))
}
/** Ngày đầu tháng (UTC-00:00). */
export function utcMonthStart(nam: number, thang: number): Date {
  return utcDate(nam, thang, 1)
}
/** Ngày cuối tháng (UTC-00:00). */
export function utcMonthEnd(nam: number, thang: number): Date {
  return new Date(Date.UTC(nam, thang, 0))
}
/** Chuyển 'yyyy-mm-dd' (từ <input type=date>) thành Date UTC-00:00. */
export function ymdToUTC(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

/** Chuyển @db.Date (UTC) về Date 00:00 giờ địa phương theo đúng y/m/d đã lưu. */
export function plainDate(d: Date): Date {
  const dt = new Date(d)
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

/**
 * Ngày ký phải là ngày làm việc. Nếu rơi vào Thứ Bảy/Chủ nhật thì lùi về Thứ Sáu
 * gần nhất (giữ ngày ký nằm trong/sát kỳ làm thêm thay vì nhảy sang tuần sau).
 */
export function ngayKyHopLe(d: Date): Date {
  const r = new Date(d)
  const g = r.getUTCDay() // dùng UTC để khớp ngày lưu UTC-00:00
  if (g === 6) r.setUTCDate(r.getUTCDate() - 1) // Thứ Bảy → Thứ Sáu
  else if (g === 0) r.setUTCDate(r.getUTCDate() - 2) // Chủ nhật → Thứ Sáu
  return r
}

/** Ngày cuối cùng của tháng (thang: 1..12). */
export function ngayCuoiThang(nam: number, thang: number): Date {
  return new Date(nam, thang, 0)
}

export function fmtNgay(d?: Date | null): string {
  if (!d) return '…/…/……'
  const dt = new Date(d)
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`
}
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Lý do làm thêm mặc định (theo mẫu Phòng Hạ tầng kỹ thuật) — người dùng sửa được. */
export const LY_DO_MAC_DINH = [
  'Thực hiện các nhiệm vụ thuộc chức năng, nhiệm vụ của Phòng đảm bảo thời gian theo quy định.',
].join('\n')

export const DIA_DIEM_MAC_DINH = 'Sở Xây dựng tỉnh Quảng Trị'
