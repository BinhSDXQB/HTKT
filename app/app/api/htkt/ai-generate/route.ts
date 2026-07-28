import { NextRequest, NextResponse } from 'next/server'
import { generateVanBanFull, estimateTokens, estimateCost } from '@/lib/openai'
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
 *   model: "gpt-3.5-turbo"
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

    // Gọi OpenAI API
    const text = await generateVanBanFull(prompt)

    if (!text) {
      return NextResponse.json(
        { error: 'OpenAI trả về response trống' },
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
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[AI Generate Error]', error)

    if (error instanceof Error) {
      // OpenAI API errors
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'OpenAI API key không hợp lệ' },
          { status: 401 }
        )
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Quá nhiều requests, vui lòng thử lại sau' },
          { status: 429 }
        )
      }
      if (error.message.includes('5')) {
        return NextResponse.json(
          { error: 'OpenAI service tạm thời không khả dụng' },
          { status: 503 }
        )
      }
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

    // Đơn giản: nếu biến API key tồn tại = OK
    const hasApiKey = !!process.env.OPENAI_API_KEY
    const keyPreview = hasApiKey ? process.env.OPENAI_API_KEY!.slice(0, 7) + '***' : 'NOT SET'

    return NextResponse.json({
      status: hasApiKey ? 'ok' : 'error',
      model: 'gpt-3.5-turbo',
      apiKeyPreview: keyPreview,
      availableAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Kiểm tra status thất bại' },
      { status: 500 }
    )
  }
}
