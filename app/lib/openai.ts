import { aiChat, AI_VANBAN_MODEL } from '@/lib/ai/cau-hinh'

// Nhà cung cấp/model lấy từ lib/ai/cau-hinh.ts (AI_BASE_URL, AI_VANBAN_MODEL…).
// Trước đây file này ném lỗi ngay khi import nếu thiếu OPENAI_API_KEY và ghi cứng
// gpt-3.5-turbo — nay khởi tạo lười và đổi model qua .env.
export const VANBAN_MODEL = AI_VANBAN_MODEL

const SYSTEM_SOAN_VAN_BAN = `Bạn là chuyên gia soạn thảo văn bản hành chính tại Sở Xây dựng Quảng Trị.
Nhiệm vụ: Soạn thảo tờ trình, công văn, thông báo kết quả thẩm định VBPL Xây dựng.
Yêu cầu:
- Chi tiết, cụ thể, không nêu chung chung
- Phong cách chính thức, chuẩn mực hành chính Việt Nam
- Tuân thủ format NĐ 30/2020 (thể thức văn bản)
- Tham chiếu đầy đủ các VBPL (số/năm/NĐ/TT)
- Tên cơ quan: "SỞ XÂY DỰNG" (chữ hoa)
- Địa danh: "Quảng Trị"
- Chữ ký: "GIÁM ĐỐC" hoặc "TRƯỞNG PHÒNG"
- Không dùng placeholder "…" mà phải ghi cụ thể`

/**
 * Sinh tờ trình / công văn chi tiết từ prompt
 * Hỗ trợ streaming để return dần-dần
 */
export async function generateVanBanWithStreaming(prompt: string) {
  const stream = await aiChat().chat.completions.create({
    model: VANBAN_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_SOAN_VAN_BAN },
      { role: 'user', content: prompt },
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
  const response = await aiChat().chat.completions.create({
    model: VANBAN_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_SOAN_VAN_BAN },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ''
  return content
}

/**
 * Đếm tokens (ước tính)
 * ~1 token ≈ 4 ký tự
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Ước tính chi phí — đơn giá tham khảo (USD/1M token), đặt qua .env khi đổi model:
 * AI_GIA_INPUT, AI_GIA_OUTPUT. Mặc định theo bảng giá cũ gpt-3.5-turbo ($0.50 / $1.50).
 */
export function estimateCost(inputTokens: number, outputTokens: number): {
  input: number
  output: number
  total: number
} {
  const INPUT_PRICE = (Number(process.env.AI_GIA_INPUT) || 0.5) / 1_000_000
  const OUTPUT_PRICE = (Number(process.env.AI_GIA_OUTPUT) || 1.5) / 1_000_000

  return {
    input: inputTokens * INPUT_PRICE,
    output: outputTokens * OUTPUT_PRICE,
    total: inputTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE,
  }
}
