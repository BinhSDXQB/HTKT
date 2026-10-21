import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * XÁC THỰC TOKEN WEBHOOK (SCADA / phần mềm nhà máy).
 *
 * Trước đây route dùng `process.env.WEBHOOK_SECRET ?? '<token mặc định>'` và GET công khai luôn
 * token mặc định đó trong ví dụ — máy chủ quên đặt biến là ai cũng ghi được dữ liệu trạm bơm/nhà máy
 * (rà soát HTKT Brain 21/10/2026, phát hiện S1). Nay: KHÔNG có giá trị dự phòng; thiếu hoặc quá ngắn
 * → từ chối mọi yêu cầu (fail-closed).
 */

/** Độ dài tối thiểu của WEBHOOK_SECRET — chặn đặt nhầm giá trị ngắn/dễ đoán. */
export const DO_DAI_TOI_THIEU_SECRET = 24

export type KetQuaXacThucWebhook =
  | { ok: true }
  | { ok: false; status: 401 | 503; loi: string }

/** Lấy token từ header `Authorization: Bearer <token>` hoặc `X-API-Key: <token>`. */
export function layTokenTuHeader(authorization: string | null, apiKey: string | null): string {
  const a = (authorization ?? '').trim()
  if (a) return a.replace(/^Bearer\s+/i, '').trim()
  return (apiKey ?? '').trim()
}

/** So sánh hằng thời gian (băm SHA-256 trước để hai bên luôn cùng độ dài). */
function bangNhau(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest()
  const hb = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(ha, hb)
}

export function xacThucWebhook(token: string, secret: string | undefined): KetQuaXacThucWebhook {
  const s = (secret ?? '').trim()
  if (s.length < DO_DAI_TOI_THIEU_SECRET) {
    return { ok: false, status: 503, loi: 'Webhook chưa được cấu hình trên máy chủ (thiếu WEBHOOK_SECRET hợp lệ).' }
  }
  if (!token || !bangNhau(token, s)) {
    return { ok: false, status: 401, loi: 'Unauthorized — sai API token' }
  }
  return { ok: true }
}
