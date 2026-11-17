import { routeAi, dbAi, docJson } from '@/lib/ai-content/may-chu'
import { danhSachBai, taoBai } from '@/lib/ai-content/kho'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/ai/v1/noi-dung?trangThai=&tu= — danh sách bài (tối đa 200). */
export const GET = routeAi(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  return { items: await danhSachBai(dbAi, { trangThai: sp.get('trangThai') ?? undefined, tu: sp.get('tu') ?? undefined }) }
})

/** POST /api/ai/v1/noi-dung — tạo bài gốc (phiên bản 1). */
export const POST = routeAi(async ({ req, nd }) => {
  const b = await docJson(req)
  return taoBai(dbAi, nd, {
    tieuDe: String(b.tieuDe ?? ''), noiDung: String(b.noiDung ?? ''),
    phanLoai: b.phanLoai ? String(b.phanLoai) : undefined,
    doAiTao: b.doAiTao === true, coTheGayNhamLan: b.coTheGayNhamLan === true,
    nguonIds: Array.isArray(b.nguonIds) ? b.nguonIds.map(String) : [],
  })
})
