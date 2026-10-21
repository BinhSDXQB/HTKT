/**
 * Quyết định cờ `secure` cho cookie phiên.
 *
 * Trước đây chỉ bật khi COOKIE_SECURE=true → quên đặt biến là cookie phiên đi qua HTTP thường
 * (rà soát HTKT Brain 21/10/2026, S16). Nay: production MẶC ĐỊNH bật; chỉ tắt khi đặt TƯỜNG MINH
 * COOKIE_SECURE=false (vd còn truy cập nội bộ bằng http://IP:3001 — khi đó nên chuyển sang HTTPS).
 */
export function cookieSecure(env: { NODE_ENV?: string; COOKIE_SECURE?: string }): boolean {
  const v = (env.COOKIE_SECURE ?? '').trim().toLowerCase()
  if (v === 'true') return true
  if (v === 'false') return false
  return env.NODE_ENV === 'production'
}
