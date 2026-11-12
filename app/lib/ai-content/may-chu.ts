import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isLeadership, type CurrentUser } from '@/lib/auth'
import { DEPARTMENT_CODES } from '@/lib/permissions'
import { aiContentBat, duocSoan, nguonGocHopLe, type NguoiDungToiThieu } from './nghiep-vu'
import { LoiNghiepVu, type Db } from './kho'

type PrismaToiThieu = {
  $queryRawUnsafe: (sql: string, ...params: unknown[]) => Promise<unknown>
}

function boc(c: PrismaToiThieu): Db {
  return {
    q: async <T,>(sql: string, params: unknown[] = []) => (await c.$queryRawUnsafe(sql, ...params)) as T[],
    tx: async () => { throw new Error('không lồng giao dịch') },
  }
}

/** Db cho route: SQL tham số hoá qua Prisma ($1..$n), KHÔNG nối chuỗi dữ liệu người dùng vào câu lệnh. */
export const dbAi: Db = {
  q: async <T,>(sql: string, params: unknown[] = []) => (await db.$queryRawUnsafe(sql, ...params)) as T[],
  tx: (fn) => db.$transaction((t) => fn(boc(t as unknown as PrismaToiThieu)), { timeout: 15_000 }),
}

/**
 * Quy đổi người dùng hệ thống sang vai trò của module:
 *  - soạn/đặt lịch/xác nhận: quản trị, lãnh đạo Sở, cán bộ THUỘC Văn phòng Sở
 *    (cố ý hẹp hơn canAccessOffice: quyền office:menu_access đơn thuần KHÔNG đủ để soạn bài công khai);
 *  - duyệt/thu hồi: quản trị hoặc lãnh đạo Sở (kiểm bốn mắt ở lớp nghiệp vụ).
 */
export function vaiTroAi(user: CurrentUser): NguoiDungToiThieu {
  const laAdmin = user.role.name === 'admin'
  return {
    id: user.id,
    laAdmin,
    laLanhDao: !laAdmin && isLeadership(user),
    laVanPhong: user.departmentCode === DEPARTMENT_CODES.VPS,
  }
}

export function duocVaoAiWorkspace(user: CurrentUser): boolean {
  return aiContentBat() && duocSoan(vaiTroAi(user))
}

/**
 * Tên miền công khai của hệ thống. Production đứng sau IIS reverse proxy: trình duyệt gửi Origin là tên miền công khai
 * còn Host tới Node có thể là localhost:3001 — nếu chỉ so Origin với Host thì MỌI thao tác ghi sẽ bị 403.
 * Giữ khớp với experimental.serverActions.allowedOrigins trong next.config.ts; bổ sung qua APP_URL.
 */
const HOST_DUOC_PHEP: string[] = [
  'qlhtkt.htkt.com.vn', '36.50.27.222', '36.50.27.222:81', 'localhost:3001',
  ...(() => { try { return process.env.APP_URL ? [new URL(process.env.APP_URL).host] : [] } catch { return [] } })(),
]

type Ctx<P> = { params: Promise<P> }
type XuLy<P> = (a: { req: NextRequest; params: P; nd: NguoiDungToiThieu; user: CurrentUser }) => Promise<unknown>

/**
 * Bọc mọi route /api/ai/v1/*: cờ tắt → 404 (như không tồn tại); chưa đăng nhập → 401; không quyền → 403;
 * yêu cầu ghi từ nguồn khác (Origin lệch Host) → 403; lỗi nghiệp vụ → mã tương ứng; lỗi khác → 500 không lộ chi tiết.
 */
export function routeAi<P = Record<string, never>>(xuLy: XuLy<P>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    if (!aiContentBat()) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (req.method !== 'GET') {
      const hostCuaYeuCau = [req.headers.get('host'), req.headers.get('x-forwarded-host'), ...HOST_DUOC_PHEP]
      if (!nguonGocHopLe(req.headers.get('origin'), hostCuaYeuCau)) {
        return NextResponse.json({ error: 'Yêu cầu từ nguồn không hợp lệ' }, { status: 403 })
      }
    }
    let user: CurrentUser | null
    try { user = await getCurrentUser() } catch { user = null }
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    const nd = vaiTroAi(user)
    if (!duocSoan(nd)) return NextResponse.json({ error: 'Không có quyền dùng AI Workspace' }, { status: 403 })
    try {
      const kq = await xuLy({ req, params: await ctx.params, nd, user })
      return NextResponse.json(kq ?? { ok: true })
    } catch (e) {
      if (e instanceof LoiNghiepVu) return NextResponse.json({ error: e.message, chiTiet: e.chiTiet }, { status: e.ma })
      const ma = (e as { code?: string })?.code
      // Vi phạm chỉ mục "một lịch sống mỗi phiên bản + kênh" khi hai yêu cầu chạy đua
      if (ma === '23505' || /ux_ai_pub_song/.test(String((e as Error)?.message))) {
        return NextResponse.json({ error: 'Thao tác trùng: kênh này đã có lịch' }, { status: 409 })
      }
      console.error('[ai-content]', (e as Error)?.message)
      return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
    }
  }
}

export async function docJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const j = await req.json()
    if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>
  } catch { /* rơi xuống lỗi chung */ }
  throw new LoiNghiepVu(400, 'Dữ liệu gửi lên không phải JSON hợp lệ')
}
