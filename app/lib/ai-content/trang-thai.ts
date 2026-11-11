/**
 * MÁY TRẠNG THÁI của module Nội dung AI (thuần, không chạm CSDL — test bằng node:test).
 *
 * Hai tầng trạng thái tách nhau:
 *  - NỘI DUNG (bài gốc):   DRAFT → PENDING_REVIEW → APPROVED | REJECTED ; CANCELLED
 *  - LỊCH ĐĂNG từng kênh:  SCHEDULED → PUBLISHING → PUBLISHED | FAILED | RETRY_PENDING | UNKNOWN_OUTCOME ; CANCELLED ; EXPIRED
 * Trạng thái tổng hợp nhiều kênh (PARTIALLY_PUBLISHED…) SUY RA ĐỘNG từ các lịch, không lưu cờ.
 */

export const TRANG_THAI_NOI_DUNG = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'] as const
export type TrangThaiNoiDung = (typeof TRANG_THAI_NOI_DUNG)[number]

export const TRANG_THAI_LICH = [
  'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'RETRY_PENDING', 'UNKNOWN_OUTCOME', 'CANCELLED', 'EXPIRED',
] as const
export type TrangThaiLich = (typeof TRANG_THAI_LICH)[number]

const CHUYEN_NOI_DUNG: Record<TrangThaiNoiDung, TrangThaiNoiDung[]> = {
  DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT', 'CANCELLED'],
  APPROVED: ['DRAFT', 'CANCELLED'],       // sửa nội dung / thu hồi duyệt → về DRAFT
  REJECTED: ['DRAFT', 'CANCELLED'],
  CANCELLED: [],
}

const CHUYEN_LICH: Record<TrangThaiLich, TrangThaiLich[]> = {
  SCHEDULED: ['PUBLISHING', 'CANCELLED', 'EXPIRED'],
  PUBLISHING: ['PUBLISHED', 'FAILED', 'RETRY_PENDING', 'UNKNOWN_OUTCOME'],
  RETRY_PENDING: ['PUBLISHING', 'CANCELLED', 'EXPIRED', 'FAILED'],
  // Kết quả chưa xác định (timeout…): KHÔNG tự đăng lại. Chỉ con người đối soát rồi chốt.
  UNKNOWN_OUTCOME: ['PUBLISHED', 'FAILED'],
  FAILED: ['SCHEDULED', 'CANCELLED'],     // người dùng chủ động đặt lại lịch
  PUBLISHED: [],
  CANCELLED: [],
  EXPIRED: [],
}

export function duocChuyenNoiDung(tu: TrangThaiNoiDung, den: TrangThaiNoiDung): boolean {
  return CHUYEN_NOI_DUNG[tu]?.includes(den) ?? false
}

export function duocChuyenLich(tu: TrangThaiLich, den: TrangThaiLich): boolean {
  return CHUYEN_LICH[tu]?.includes(den) ?? false
}

export type TongHopXuatBan =
  | 'CHUA_DAT_LICH' | 'DA_DAT_LICH' | 'DANG_DANG' | 'DA_DANG' | 'DANG_MOT_PHAN' | 'CAN_DOI_SOAT' | 'LOI' | 'DA_HUY'

/** Suy trạng thái tổng hợp của một bài từ trạng thái các lịch đăng (mỗi kênh độc lập). */
export function tongHopXuatBan(lich: TrangThaiLich[]): TongHopXuatBan {
  const con = lich.filter((s) => s !== 'CANCELLED' && s !== 'EXPIRED')
  if (lich.length === 0) return 'CHUA_DAT_LICH'
  if (con.length === 0) return 'DA_HUY'
  if (con.includes('UNKNOWN_OUTCOME')) return 'CAN_DOI_SOAT'
  const daDang = con.filter((s) => s === 'PUBLISHED').length
  if (daDang === con.length) return 'DA_DANG'
  if (con.includes('PUBLISHING')) return 'DANG_DANG'
  if (daDang > 0) return 'DANG_MOT_PHAN'
  if (con.includes('FAILED')) return 'LOI'
  return 'DA_DAT_LICH'
}

export const NHAN_TRANG_THAI_NOI_DUNG: Record<TrangThaiNoiDung, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã huỷ',
}

export const NHAN_TRANG_THAI_LICH: Record<TrangThaiLich, string> = {
  SCHEDULED: 'Đã đặt lịch',
  PUBLISHING: 'Đang đăng',
  PUBLISHED: 'Đã đăng',
  FAILED: 'Lỗi',
  RETRY_PENDING: 'Chờ thử lại',
  UNKNOWN_OUTCOME: 'Cần đối soát',
  CANCELLED: 'Đã huỷ',
  EXPIRED: 'Quá hạn',
}
