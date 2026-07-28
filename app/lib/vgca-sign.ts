'use client'

/**
 * Tích hợp ký số trên web qua VGCA Sign Service (Ban Cơ yếu Chính phủ).
 *
 * VGCA Sign Service là dịch vụ chạy nền trên MÁY NGƯỜI KÝ (cần cài đặt + driver USB Token).
 * Trang web gọi tới endpoint localhost của dịch vụ, dịch vụ bật hộp thoại chọn chứng thư + nhập PIN,
 * ký file PDF rồi trả về. Endpoint/giao thức KHÁC NHAU theo phiên bản triển khai nên để cấu hình qua
 * biến môi trường NEXT_PUBLIC_VGCA_SIGN_URL — phải xác nhận đúng trên máy có agent + token thật.
 *
 * Nếu chưa cấu hình agent → ném lỗi để UI chuyển sang đường "tải lên bản đã ký" thủ công.
 */

const VGCA_URL = process.env.NEXT_PUBLIC_VGCA_SIGN_URL || ''

export function isVgcaConfigured(): boolean {
  return Boolean(VGCA_URL)
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Gửi PDF tới VGCA Sign Service để ký, nhận lại PDF đã ký (PAdES).
 * Hợp đồng dữ liệu mặc định: POST JSON { fileName, fileType:'pdf', dataBase64 } → { dataBase64 }.
 * Điều chỉnh cho khớp giao thức agent thực tế khi triển khai.
 */
export async function vgcaSignPdf(pdf: Uint8Array, fileName = 'don-nghi-phep.pdf'): Promise<Uint8Array> {
  if (!VGCA_URL) throw new Error('Chưa cấu hình VGCA Sign Service (NEXT_PUBLIC_VGCA_SIGN_URL).')

  const res = await fetch(VGCA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileType: 'pdf', dataBase64: bytesToBase64(pdf) }),
  })
  if (!res.ok) throw new Error(`VGCA Sign Service lỗi (${res.status}). Kiểm tra dịch vụ ký số trên máy.`)
  const json = await res.json().catch(() => null)
  const signed = json?.dataBase64 || json?.signedData || json?.data
  if (!signed) throw new Error('VGCA Sign Service không trả về dữ liệu đã ký.')
  return base64ToBytes(signed)
}
