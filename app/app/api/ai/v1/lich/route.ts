import { routeAi, dbAi } from '@/lib/ai-content/may-chu'
import { lichTrongKhoang, LoiNghiepVu } from '@/lib/ai-content/kho'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/ai/v1/lich?tu=ISO&den=ISO — lịch đăng trong khoảng (tối đa 62 ngày, 500 dòng). */
export const GET = routeAi(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  const tu = new Date(sp.get('tu') ?? '')
  const den = new Date(sp.get('den') ?? '')
  if (Number.isNaN(tu.getTime()) || Number.isNaN(den.getTime()) || den <= tu) throw new LoiNghiepVu(400, 'Khoảng thời gian không hợp lệ')
  if (den.getTime() - tu.getTime() > 62 * 86400e3) throw new LoiNghiepVu(400, 'Khoảng thời gian tối đa 62 ngày')
  return { items: await lichTrongKhoang(dbAi, tu.toISOString(), den.toISOString()) }
})
