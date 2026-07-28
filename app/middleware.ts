import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Chặn nhanh ở edge cho nhóm route nội bộ theo phòng ban.
// Đây là lớp phòng thủ thứ nhất; trang/API vẫn gọi requireOfficeAccess (DB-backed) làm lớp xác thực chính.

const SESSION_COOKIE = 'session'

type TokenPayload = {
  roleName?: string
  departmentCode?: string | null
  allowedModules?: string[]
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

async function readToken(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return payload as TokenPayload
  } catch {
    return null
  }
}

function canAccessModule(p: TokenPayload | null, mod: 'office' | 'htkt', deptCode: string): boolean {
  if (!p) return false
  if (p.roleName === 'admin') return true
  if (p.departmentCode === deptCode) return true
  return Array.isArray(p.allowedModules) && p.allowedModules.includes(mod)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Chuyển pathname xuống server components qua header (cho phép SSR dữ liệu nghiệp
  // vụ theo lĩnh vực, bỏ vòng gọi phía client). Áp dụng cho mọi /dashboard.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } })

  const isOfficeApi = pathname.startsWith('/api/office')
  const isOfficePage = pathname.startsWith('/dashboard/van-phong-so')
  const isHtktApi = pathname.startsWith('/api/htkt')
  const isHtktPage = pathname.startsWith('/dashboard/phong-htkt')

  if (!isOfficeApi && !isOfficePage && !isHtktApi && !isHtktPage) {
    return pass()
  }

  const token = await readToken(req)

  // Chưa đăng nhập
  if (!token) {
    if (isOfficeApi || isHtktApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const okOffice = canAccessModule(token, 'office', 'VPS')
  const okHtkt = canAccessModule(token, 'htkt', 'HTKT')

  if ((isOfficeApi || isOfficePage) && !okOffice) {
    if (isOfficeApi) {
      return NextResponse.json({ error: 'Không có quyền truy cập Văn phòng Sở' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/forbidden'
    return NextResponse.redirect(url)
  }

  if ((isHtktApi || isHtktPage) && !okHtkt) {
    if (isHtktApi) {
      return NextResponse.json({ error: 'Không có quyền truy cập Phòng Hạ tầng kỹ thuật' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/forbidden'
    return NextResponse.redirect(url)
  }

  return pass()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/office/:path*',
    '/api/htkt/:path*',
  ],
}
