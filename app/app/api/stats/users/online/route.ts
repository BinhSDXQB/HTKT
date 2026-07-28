import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      online: onlineUsers,
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
