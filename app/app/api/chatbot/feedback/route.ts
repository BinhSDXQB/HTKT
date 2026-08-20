import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { logId, feedback } = await req.json()

    if (!logId || !['LIKE', 'DISLIKE'].includes(feedback)) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    // BẢO MẬT: chỉ cho đánh giá log CỦA CHÍNH MÌNH.
    // Trước đây update theo id thuần → người dùng B có thể LIKE/DISLIKE log của A,
    // làm sai lệch "kiến thức đã học" mà chatbot dùng lại cho các câu sau.
    const res = await db.chatbotLog.updateMany({
      where: { id: logId, userId: user.id },
      data: {
        feedback: feedback as 'LIKE' | 'DISLIKE',
        feedbackAt: new Date(),
      },
    })

    if (res.count === 0) {
      return NextResponse.json({ error: 'Không tìm thấy lượt hỏi này' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
