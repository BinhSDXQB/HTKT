import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, canViewOfficeSensitive } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // BẢO MẬT: route này TỪNG mở công khai và trả về cột email = SỐ CCCD của cán bộ
    // đang online → lộ dữ liệu cá nhân ra Internet. Nay bắt buộc đăng nhập, và chỉ
    // nhóm được xem dữ liệu nhạy cảm (admin / lãnh đạo VP Sở) mới thấy CCCD.
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    const xemDuocCccd = canViewOfficeSensitive(user)

    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

    // Danh sách người online chi tiết
    const onlineUsers = await db.user.findMany({
      where: {
        lastLoginAt: {
          gte: fifteenMinutesAgo,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        role: { select: { displayName: true } },
        toChuc: { select: { ten: true, tenVietTat: true } },
      },
      orderBy: {
        lastLoginAt: 'desc',
      },
    })

    // Ẩn CCCD (cột email) với người không đủ quyền
    const danhSach = onlineUsers.map(({ email, ...rest }) =>
      xemDuocCccd ? { ...rest, email } : rest,
    )

    return NextResponse.json({
      online: danhSach,
      count: onlineUsers.length,
      timestamp: now.toISOString(),
      refreshAt: new Date(now.getTime() + 60000).toISOString(), // 1 phút nữa
    })
  } catch (error) {
    console.error('[stats/users/online]', error)
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    )
  }
}
