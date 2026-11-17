'use client'

import { NHAN_TRANG_THAI_LICH, NHAN_TRANG_THAI_NOI_DUNG, type TrangThaiLich, type TrangThaiNoiDung } from '@/lib/ai-content/trang-thai'

export class LoiGoi extends Error {
  chiTiet?: string[]
  constructor(thongBao: string, chiTiet?: string[]) {
    super(thongBao)
    this.chiTiet = chiTiet
  }
}

/** Gọi API module; lỗi → LoiGoi kèm danh sách lý do (để hiện đúng điều kiện còn thiếu). */
export async function goi<T = unknown>(url: string, body?: unknown, method?: string): Promise<T> {
  const res = await fetch(url, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  let j: { error?: string; chiTiet?: string[] } & Record<string, unknown> = {}
  try { j = await res.json() } catch { /* phản hồi không phải JSON */ }
  if (!res.ok) throw new LoiGoi(j.error ?? `Lỗi ${res.status}`, j.chiTiet)
  return j as T
}

const MAU_NOI_DUNG: Record<TrangThaiNoiDung, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  CANCELLED: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}
const MAU_LICH: Record<TrangThaiLich, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  PUBLISHING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  RETRY_PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  UNKNOWN_OUTCOME: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200',
  CANCELLED: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  EXPIRED: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}
const NEN = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap'

export function NhanNoiDung({ tt }: { tt: string }) {
  const k = tt as TrangThaiNoiDung
  return <span className={`${NEN} ${MAU_NOI_DUNG[k] ?? MAU_NOI_DUNG.DRAFT}`}>{NHAN_TRANG_THAI_NOI_DUNG[k] ?? tt}</span>
}

export function NhanLich({ tt }: { tt: string }) {
  const k = tt as TrangThaiLich
  return <span className={`${NEN} ${MAU_LICH[k] ?? MAU_LICH.CANCELLED}`}>{NHAN_TRANG_THAI_LICH[k] ?? tt}</span>
}

export const TEN_KENH: Record<string, string> = { facebook: 'Facebook', linkedin: 'LinkedIn', threads: 'Threads', website: 'Website' }

export const TEN_PHAN_LOAI: Record<string, string> = {
  PUBLIC: 'Công khai', INTERNAL: 'Nội bộ', CONFIDENTIAL: 'Hạn chế', RESTRICTED: 'Mật / dữ liệu cá nhân',
}

export const TEN_LOI_LICH: Record<string, string> = {
  NOI_DUNG_DA_SUA: 'Nội dung đã sửa sau khi đặt lịch',
  BIEN_THE_DA_SUA: 'Biến thể kênh đã sửa sau khi đặt lịch',
  THU_HOI_PHE_DUYET: 'Phê duyệt đã bị thu hồi',
  NGUOI_DUNG_HUY: 'Người dùng huỷ',
  CONG_XUAT_BAN_CHAN: 'Không còn đủ điều kiện xuất bản lúc đến giờ đăng',
  WORKER_TREO: 'Tiến trình đăng bị ngắt giữa chừng',
  QUA_HAN: 'Quá 24 giờ chưa đăng được',
  TIMEOUT: 'Nền tảng không phản hồi kịp',
  DOI_SOAT_KHONG_THAY_BAI: 'Đối soát: không thấy bài trên nền tảng',
}

const DINH_DANG = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
/** Hiển thị thời điểm theo giờ Việt Nam (dữ liệu lưu UTC). */
export function gioVn(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DINH_DANG.format(d)
}

export const O_NHAP =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
export const NUT =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50'
export const NUT_CHINH = `${NUT} bg-indigo-600 text-white hover:bg-indigo-700`
export const NUT_PHU =
  `${NUT} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`
export const NUT_NGUY = `${NUT} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300`
export const THE = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'
