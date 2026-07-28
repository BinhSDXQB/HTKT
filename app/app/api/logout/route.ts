import { NextRequest, NextResponse } from 'next/server'
import { getSession, deleteSession } from '@/lib/session'
import { logAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (session?.userId) {
      await logAction({
        userId: session.userId,
        action: 'LOGOUT',
        module: 'admin',
        detail: `Đăng xuất: ${session.email}`,
      })
    }
    await deleteSession()
  } catch { /* xóa session dù có lỗi */ }

  // Dùng origin của request để build URL tuyệt đối
  const origin = req.nextUrl.origin
  const response = NextResponse.redirect(`${origin}/login`, { status: 302 })
  // Xóa cookie rõ ràng trong response header
  response.cookies.set('session', '', { maxAge: 0, path: '/' })
  return response
}
