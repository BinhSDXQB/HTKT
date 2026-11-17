import { routeAi, dbAi, docJson } from '@/lib/ai-content/may-chu'
import { huyLich, xacNhanDangTay, doiSoat, LoiNghiepVu } from '@/lib/ai-content/kho'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/v1/lich/[id] — body { loai }:
 *  huy · xac_nhan {url} (đăng tay xong, khai đường dẫn bài) · doi_soat {ketQua: PUBLISHED|FAILED, url?}
 */
export const POST = routeAi<{ id: string }>(async ({ req, params, nd }) => {
  const b = await docJson(req)
  switch (b.loai) {
    case 'huy': return huyLich(dbAi, nd, params.id)
    case 'xac_nhan': return xacNhanDangTay(dbAi, nd, params.id, String(b.url ?? ''))
    case 'doi_soat': return doiSoat(dbAi, nd, params.id, String(b.ketQua ?? ''), b.url ? String(b.url) : undefined)
    default: throw new LoiNghiepVu(400, 'Hành động không hợp lệ')
  }
})
