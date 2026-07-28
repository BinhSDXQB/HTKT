import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const { logId, feedback } = await req.json()

    if (!logId || !['LIKE', 'DISLIKE'].includes(feedback)) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    await db.chatbotLog.update({
      where: { id: logId },
      data: {
        feedback: feedback as 'LIKE' | 'DISLIKE',
        feedbackAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
