// Cảnh báo nâng lương — tính số ngày tới NGÀY ĐẾN HẠN nâng lương lần sau
// (can_bo.ngayNangLuongKeTiep) và phân nhóm 30/60/90 ngày + quá hạn.
//
// LƯU Ý: đây chỉ là cảnh báo nhắc việc dựa trên mốc thời gian. Hệ thống KHÔNG tự quyết định
// nâng lương — Văn phòng Sở rà soát ngạch/bậc/đánh giá/kỷ luật/căn cứ pháp lý trước khi trình.

export type SalaryAlertBucket = 'OVERDUE' | 'D30' | 'D60' | 'D90' | null

export type SalaryAlert = {
  bucket: SalaryAlertBucket
  daysLeft: number | null // số ngày còn lại (âm = quá hạn); null nếu chưa có mốc
  label: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Số ngày trọn vẹn từ hôm nay đến mốc (âm nếu mốc đã qua). So sánh theo ngày (bỏ giờ). */
export function daysUntil(target: Date | string | null | undefined, now: Date = new Date()): number | null {
  if (!target) return null
  const t = typeof target === 'string' ? new Date(target) : target
  if (Number.isNaN(t.getTime())) return null
  const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((a - b) / MS_PER_DAY)
}

export function classifySalaryAlert(
  ngayNangLuong: Date | string | null | undefined,
  now: Date = new Date()
): SalaryAlert {
  const d = daysUntil(ngayNangLuong, now)
  if (d === null) return { bucket: null, daysLeft: null, label: 'Chưa có mốc nâng lương' }
  if (d < 0) return { bucket: 'OVERDUE', daysLeft: d, label: `Quá hạn ${Math.abs(d)} ngày` }
  if (d <= 30) return { bucket: 'D30', daysLeft: d, label: `Còn ${d} ngày (≤30)` }
  if (d <= 60) return { bucket: 'D60', daysLeft: d, label: `Còn ${d} ngày (≤60)` }
  if (d <= 90) return { bucket: 'D90', daysLeft: d, label: `Còn ${d} ngày (≤90)` }
  return { bucket: null, daysLeft: d, label: `Còn ${d} ngày` }
}

/** Có cảnh báo cần chú ý (quá hạn hoặc trong vòng 90 ngày). */
export function isUpcomingRaise(ngayNangLuong: Date | string | null | undefined, now: Date = new Date()): boolean {
  return classifySalaryAlert(ngayNangLuong, now).bucket !== null
}

/** Lớp màu Tailwind theo nhóm cảnh báo (badge). */
export function salaryAlertBadgeClass(bucket: SalaryAlertBucket): string {
  switch (bucket) {
    case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200'
    case 'D30':     return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'D60':     return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'D90':     return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:        return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}
