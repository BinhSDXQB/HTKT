import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Số người online (truy cập trong 15 phút gần đây)
    const onlineUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: fifteenMinutesAgo,
        },
        isActive: true,
      },
    })

    // Số người truy cập hôm nay
    const usersToday = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: startOfDay,
        },
        isActive: true,
      },
    })

    // Tổng người dùng
    const totalUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    })

    return NextResponse.json({
      online: onlineUsers,
      today: usersToday,
      total: totalUsers,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[stats/users]', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
