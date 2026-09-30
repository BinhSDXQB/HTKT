import { NextRequest, NextResponse } from 'next/server'
import { generateVanBanFull, estimateTokens, estimateCost, VANBAN_MODEL } from '@/lib/openai'
import { aiDaCauHinh, laLoiHetHanMuc, laLoiDichVuAI, AI_TEN_NHA_CUNG_CAP } from '@/lib/ai/cau-hinh'
import { requireHtktAccess } from '@/lib/auth'

/**
 * POST /api/htkt/ai-generate
 * Sinh tờ trình / công văn từ prompt
 *
 * Request body:
 * {
 *   prompt: string,
 *   streaming?: boolean (default: false)
 * }
 *
 * Response:
 * {
 *   text: string,
 *   inputTokens: number,
 *   outputTokens: number,
 *   estimatedCost: number,
 *   model: string (theo AI_VANBAN_MODEL / AI_CHAT_MODEL)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Kiểm tra quyền HTKT
    await requireHtktAccess()  // throws redirect('/forbidden') nếu không có quyền

    const { prompt, streaming = false } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt là bắt buộc và phải là string' },
        { status: 400 }
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: 'Prompt quá dài (max 5000 ký tự)' },
        { status: 400 }
      )
    }

    // Ước tính input tokens
    const inputTokens = estimateTokens(prompt)

    if (inputTokens > 2000) {
      return NextResponse.json(
        { error: 'Prompt quá dài (~2000 tokens max)' },
        { status: 400 }
      )
    }

    // Gọi dịch vụ AI (nhà cung cấp cấu hình ở lib/ai/cau-hinh.ts)
    const text = await generateVanBanFull(prompt)

    if (!text) {
      return NextResponse.json(
        { error: `Dịch vụ AI (${AI_TEN_NHA_CUNG_CAP}) trả về nội dung trống` },
        { status: 500 }
      )
    }

    // Ước tính output tokens & chi phí
    const outputTokens = estimateTokens(text)
    const cost = estimateCost(inputTokens, outputTokens)

    // Log chi phí (tùy chọn: ghi vào database để tracking)
    console.log(`[AI Generate] Input: ${inputTokens} tokens, Output: ${outputTokens} tokens, Cost: $${cost.total.toFixed(4)}`)

    return NextResponse.json({
      text,
      inputTokens,
      outputTokens,
      estimatedCost: parseFloat(cost.total.toFixed(4)),
      model: VANBAN_MODEL,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[AI Generate Error]', error)

    // Phân loại theo mã trạng thái thật của SDK — trước đây dò chuỗi message
    // (includes('5') khớp gần như mọi lỗi) nên báo sai nguyên nhân.
    if (laLoiHetHanMuc(error)) {
      return NextResponse.json(
        { error: `Tài khoản dịch vụ AI (${AI_TEN_NHA_CUNG_CAP}) của hệ thống đã hết hạn mức — liên hệ quản trị viên nạp thêm.` },
        { status: 503 }
      )
    }
    if (laLoiDichVuAI(error)) {
      const status = (error as { status?: number }).status
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: `Khoá dịch vụ AI (${AI_TEN_NHA_CUNG_CAP}) không hợp lệ` }, { status: 503 })
      }
      if (status === 429) {
        return NextResponse.json({ error: 'Dịch vụ AI đang quá tải, vui lòng thử lại sau' }, { status: 429 })
      }
      return NextResponse.json(
        { error: `Dịch vụ AI (${AI_TEN_NHA_CUNG_CAP}) tạm thời không khả dụng` },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Lỗi sinh tờ trình: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

/**
 * GET /api/htkt/ai-generate/status
 * Kiểm tra xem OpenAI API có khả dụng không
 */
export async function GET(req: NextRequest) {
  try {
    await requireHtktAccess()  // throws redirect('/forbidden') nếu không có quyền

    // Đơn giản: có khoá dịch vụ AI = OK (không trả ra đầu khoá — không cần thiết cho client)
    const hasApiKey = aiDaCauHinh()

    return NextResponse.json({
      status: hasApiKey ? 'ok' : 'error',
      provider: AI_TEN_NHA_CUNG_CAP,
      model: VANBAN_MODEL,
      availableAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Kiểm tra status thất bại' },
      { status: 500 }
    )
  }
}
