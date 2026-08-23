// Cảnh báo nghỉ hưu — nhắc việc theo thủ tục nghỉ hưu đối với CÔNG CHỨC
// (Nghị định 170/2025/NĐ-CP — thay Nghị định 46/2010 từ 01/7/2025):
//   - Điều 62: TRƯỚC 06 THÁNG tính đến thời điểm nghỉ hưu → RA THÔNG BÁO (Mẫu số 2), chuẩn bị người thay thế, bàn giao.
//   - Điều 63: TRƯỚC 03 THÁNG tính đến thời điểm nghỉ hưu → RA QUYẾT ĐỊNH nghỉ hưu (Mẫu số 3).
// Viên chức: thủ tục theo Nghị định 259/2026/NĐ-CP (hiệu lực 01/7/2026) — chưa đối chiếu được nguyên văn.
//
// MỐC ĐẾM LÙI: cả hai điều đếm từ THỜI ĐIỂM NGHỈ HƯU = kết thúc ngày cuối cùng của tháng đủ tuổi
// (NĐ 135/2020 Điều 3 khoản 1), tức TRƯỚC ngày lưu trong can_bo."ngayVeHuu" (ngày 01 tháng liền kề,
// là thời điểm HƯỞNG chế độ hưu trí — khoản 2) đúng 1 ngày.
//
// Đây là cảnh báo nhắc việc theo mốc thời gian; Văn phòng Sở rà soát hồ sơ trước khi trình.

import { daysUntil } from './salary-alert'

// Ngưỡng theo NĐ 170/2025 Điều 62, 63 — đặt hằng số để dễ điều chỉnh nếu văn bản mới thay đổi.
export const THANG_RA_THONG_BAO = 6
export const THANG_RA_QUYET_DINH = 3

export type RetireBucket =
  | 'RETIRED'      // đã đến/qua thời điểm nghỉ hưu
  | 'QUYET_DINH'   // trong vòng 3 tháng → ban hành QĐ nghỉ hưu
  | 'THONG_BAO'    // trong vòng 6 tháng (chưa tới 3) → ra thông báo + bàn giao
  | null

export type RetireAlert = {
  bucket: RetireBucket
  daysLeft: number | null      // số ngày tới ngày nghỉ hưu (âm = đã qua)
  ngayVeHuu: Date | null
  ngayRaThongBao: Date | null  // = ngayVeHuu - 6 tháng
  ngayRaQuyetDinh: Date | null // = ngayVeHuu - 3 tháng
  label: string
  /** Việc cần làm gần nhất (để hiển thị/nhắc). */
  viecCanLam: string | null
}

function addMonths(d: Date, months: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate()))
}

export function classifyRetireAlert(
  ngayVeHuu: Date | string | null | undefined,
  now: Date = new Date(),
): RetireAlert {
  if (!ngayVeHuu) {
    return { bucket: null, daysLeft: null, ngayVeHuu: null, ngayRaThongBao: null, ngayRaQuyetDinh: null, label: 'Chưa có ngày nghỉ hưu', viecCanLam: null }
  }
  const veHuu = typeof ngayVeHuu === 'string' ? new Date(ngayVeHuu) : ngayVeHuu
  if (Number.isNaN(veHuu.getTime())) {
    return { bucket: null, daysLeft: null, ngayVeHuu: null, ngayRaThongBao: null, ngayRaQuyetDinh: null, label: 'Chưa có ngày nghỉ hưu', viecCanLam: null }
  }

  // Đếm lùi từ thời điểm nghỉ hưu (hết ngày cuối tháng đủ tuổi), không từ ngày hưởng lương hưu.
  const thoiDiemNghiHuu = new Date(Date.UTC(veHuu.getUTCFullYear(), veHuu.getUTCMonth(), veHuu.getUTCDate() - 1))
  const ngayRaThongBao = addMonths(thoiDiemNghiHuu, -THANG_RA_THONG_BAO)
  const ngayRaQuyetDinh = addMonths(thoiDiemNghiHuu, -THANG_RA_QUYET_DINH)
  const daysLeft = daysUntil(veHuu, now)!

  const base = { daysLeft, ngayVeHuu: veHuu, ngayRaThongBao, ngayRaQuyetDinh }

  if (daysLeft <= 0) {
    return { ...base, bucket: 'RETIRED', label: `Đã đến thời điểm nghỉ hưu (${daysLeft === 0 ? 'hôm nay' : `quá ${Math.abs(daysLeft)} ngày`})`, viecCanLam: 'Hoàn tất thủ tục nghỉ hưu, bàn giao công việc' }
  }
  const toThongBao = daysUntil(ngayRaThongBao, now)!
  const toQuyetDinh = daysUntil(ngayRaQuyetDinh, now)!

  if (toQuyetDinh <= 0) {
    return { ...base, bucket: 'QUYET_DINH', label: `Còn ${daysLeft} ngày nghỉ hưu — đến hạn ra Quyết định`, viecCanLam: 'Dự thảo & ban hành Quyết định nghỉ hưu (trước 3 tháng — NĐ 46/2010)' }
  }
  if (toThongBao <= 0) {
    return { ...base, bucket: 'THONG_BAO', label: `Còn ${daysLeft} ngày nghỉ hưu — đến hạn ra Thông báo`, viecCanLam: 'Ra Thông báo nghỉ hưu, bố trí người thay thế & bàn giao công việc (trước 6 tháng — NĐ 46/2010)' }
  }
  return { ...base, bucket: null, label: `Còn ${daysLeft} ngày nghỉ hưu`, viecCanLam: null }
}

/** Có cảnh báo nghỉ hưu cần chú ý (đã tới mốc thông báo/quyết định, hoặc đã nghỉ hưu). */
export function coCanhBaoNghiHuu(ngayVeHuu: Date | string | null | undefined, now: Date = new Date()): boolean {
  return classifyRetireAlert(ngayVeHuu, now).bucket !== null
}

export function retireAlertBadgeClass(bucket: RetireBucket): string {
  switch (bucket) {
    case 'RETIRED':    return 'bg-slate-200 text-slate-700 border-slate-300'
    case 'QUYET_DINH': return 'bg-red-100 text-red-700 border-red-200'
    case 'THONG_BAO':  return 'bg-amber-100 text-amber-700 border-amber-200'
    default:           return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}
