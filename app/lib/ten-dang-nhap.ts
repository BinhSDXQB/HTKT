/**
 * TÊN ĐĂNG NHẬP của hệ thống là SỐ CCCD, không phải email.
 *
 * Cột users.email giữ tên đăng nhập vì lý do lịch sử (219 tài khoản, phần lớn là
 * CCCD 12 số: 0440…, 0450…). Trước đây form quản trị lại validate bằng
 * z.string().email() và <input type="email"> nên KHÔNG thêm được người dùng bằng
 * số CCCD — trình duyệt bắt phải có "@".
 *
 * Chấp nhận 3 dạng:
 *   - CCCD 12 số            (chuẩn hiện hành)
 *   - CMND 9 số             (một số hồ sơ cũ chưa đổi)
 *   - Email thật            (tài khoản quản trị: admin@htkt.com.vn)
 */
export const CCCD_12 = /^\d{12}$/
export const CMND_9 = /^\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Bỏ khoảng trắng, dấu chấm/gạch người dùng hay gõ xen giữa số CCCD. */
export function chuanHoaTenDangNhap(raw: string): string {
  const s = (raw ?? '').trim()
  // Chỉ gỡ dấu phân cách khi chuỗi KHÔNG phải email (email có thể chứa dấu chấm)
  if (s.includes('@')) return s.toLowerCase()
  return s.replace(/[\s.\-_]/g, '')
}

export type KetQuaTenDangNhap =
  | { ok: true; giaTri: string; loai: 'CCCD' | 'CMND' | 'EMAIL' }
  | { ok: false; loi: string }

export function kiemTraTenDangNhap(raw: string): KetQuaTenDangNhap {
  const v = chuanHoaTenDangNhap(raw)
  if (!v) return { ok: false, loi: 'Vui lòng nhập tên đăng nhập (số CCCD)' }
  if (CCCD_12.test(v)) return { ok: true, giaTri: v, loai: 'CCCD' }
  if (CMND_9.test(v)) return { ok: true, giaTri: v, loai: 'CMND' }
  if (EMAIL.test(v)) return { ok: true, giaTri: v, loai: 'EMAIL' }
  if (/^\d+$/.test(v)) {
    const goiY = v.length === 11
      ? ' Lưu ý: CCCD bắt đầu bằng số 0 hay bị Excel cắt mất — kiểm tra xem có thiếu số 0 ở đầu không.'
      : ''
    return { ok: false, loi: `Số CCCD phải đủ 12 chữ số (đang nhập ${v.length} chữ số).${goiY} CMND cũ 9 số cũng được chấp nhận.` }
  }
  return { ok: false, loi: 'Tên đăng nhập phải là số CCCD 12 chữ số (hoặc email đối với tài khoản quản trị)' }
}
