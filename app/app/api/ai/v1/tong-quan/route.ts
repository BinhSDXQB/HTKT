import { routeAi, dbAi } from '@/lib/ai-content/may-chu'
import { thongKe, nhatKy } from '@/lib/ai-content/kho'
import { CAU_HINH_KENH } from '@/lib/ai-content/nghiep-vu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/ai/v1/tong-quan — số liệu tổng quan + nhật ký gần nhất + cấu hình kênh. */
export const GET = routeAi(async ({ req }) => {
  const n = Number(req.nextUrl.searchParams.get('nhatKy') ?? 30)
  return { thongKe: await thongKe(dbAi), nhatKy: await nhatKy(dbAi, Number.isFinite(n) ? n : 30), kenh: CAU_HINH_KENH }
})
