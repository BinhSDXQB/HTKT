import { OpenAI } from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY chưa được set trong .env')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Sinh tờ trình / công văn chi tiết từ prompt
 * Sử dụng gpt-3.5-turbo (nhanh + chi phí thấp)
 * Hỗ trợ streaming để return dần-dần
 */
export async function generateVanBanWithStreaming(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Bạn là chuyên gia soạn thảo văn bản hành chính tại Sở Xây dựng Quảng Trị.
Nhiệm vụ: Soạn thảo tờ trình, công văn, thông báo kết quả thẩm định VBPL Xây dựng.
Yêu cầu:
- Chi tiết, cụ thể, không nêu chung chung
- Phong cách chính thức, chuẩn mực hành chính Việt Nam
- Tuân thủ format NĐ 30/2020 (thể thức văn bản)
- Tham chiếu đầy đủ các VBPL (số/năm/NĐ/TT)
- Tên cơ quan: "SỞ XÂY DỰNG" (chữ hoa)
- Địa danh: "Quảng Trị"
- Chữ ký: "GIÁM ĐỐC" hoặc "TRƯỞNG PHÒNG"
- Không dùng placeholder "…" mà phải ghi cụ thể`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  })

  return stream
}

/**
 * Sinh tờ trình mà không dùng streaming (response toàn bộ)
 */
export async function generateVanBanFull(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Bạn là chuyên gia soạn thảo văn bản hành chính tại Sở Xây dựng Quảng Trị.
Nhiệm vụ: Soạn thảo tờ trình, công văn, thông báo kết quả thẩm định VBPL Xây dựng.
Yêu cầu:
- Chi tiết, cụ thể, không nêu chung chung
- Phong cách chính thức, chuẩn mực hành chính Việt Nam
- Tuân thủ format NĐ 30/2020 (thể thức văn bản)
- Tham chiếu đầy đủ các VBPL (số/năm/NĐ/TT)
- Tên cơ quan: "SỞ XÂY DỰNG" (chữ hoa)
- Địa danh: "Quảng Trị"
- Chữ ký: "GIÁM ĐỐC" hoặc "TRƯỞNG PHÒNG"
- Không dùng placeholder "…" mà phải ghi cụ thể`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ''
  return content
}

/**
 * Đếm tokens (ước tính)
 * OpenAI: ~1 token ≈ 4 ký tự
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Tính chi phí OpenAI
 * gpt-3.5-turbo: $0.50/M input, $1.50/M output
 */
export function estimateCost(inputTokens: number, outputTokens: number): {
  input: number
  output: number
  total: number
} {
  const INPUT_PRICE = 0.5 / 1_000_000 // $0.50 per M tokens
  const OUTPUT_PRICE = 1.5 / 1_000_000 // $1.50 per M tokens

  return {
    input: inputTokens * INPUT_PRICE,
    output: outputTokens * OUTPUT_PRICE,
    total: inputTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE,
  }
}
