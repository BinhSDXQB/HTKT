// Cảnh báo hết hạn hợp đồng lao động (NLĐ) — Bộ luật Lao động 2019, Nghị định 111/2022/NĐ-CP.
// Theo BLLĐ 2019: HĐ xác định thời hạn hết hạn mà NLĐ vẫn làm việc thì trong 30 ngày phải ký
// HĐ mới; quá hạn không ký → thành HĐ không xác định thời hạn. Vì vậy nhắc trước 30/60/90 ngày.

import { daysUntil, type SalaryAlertBucket } from './salary-alert'

export type ContractAlert = {
  bucket: SalaryAlertBucket   // OVERDUE | D30 | D60 | D90 | null
  daysLeft: number | null
  label: string
}

export function classifyContractAlert(
  ngayKetThucHopDong: Date | string | null | undefined,
  now: Date = new Date(),
): ContractAlert {
  const d = daysUntil(ngayKetThucHopDong, now)
  if (d === null) return { bucket: null, daysLeft: null, label: 'Không có/không xác định thời hạn' }
  if (d < 0)   return { bucket: 'OVERDUE', daysLeft: d, label: `Đã hết hạn ${Math.abs(d)} ngày` }
  if (d <= 30) return { bucket: 'D30', daysLeft: d, label: `Còn ${d} ngày (≤30) — cần ký HĐ mới` }
  if (d <= 60) return { bucket: 'D60', daysLeft: d, label: `Còn ${d} ngày (≤60)` }
  if (d <= 90) return { bucket: 'D90', daysLeft: d, label: `Còn ${d} ngày (≤90)` }
  return { bucket: null, daysLeft: d, label: `Còn ${d} ngày` }
}

export function coCanhBaoHopDong(ngayKetThucHopDong: Date | string | null | undefined, now: Date = new Date()): boolean {
  return classifyContractAlert(ngayKetThucHopDong, now).bucket !== null
}
