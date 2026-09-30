import 'server-only'
import OpenAI from 'openai'

/**
 * ĐẦU MỐI CẤU HÌNH DỊCH VỤ AI — mọi chỗ gọi mô hình ngôn ngữ đều lấy client/model từ đây,
 * KHÔNG tự `new OpenAI(...)` rải rác trong route.
 *
 * Đổi nhà cung cấp chỉ cần sửa .env (không sửa mã), vì Google Gemini, Groq, OpenRouter,
 * DeepSeek, Ollama… đều có cổng tương thích chuẩn OpenAI:
 *   AI_BASE_URL   = https://generativelanguage.googleapis.com/v1beta/openai/   (vd Gemini)
 *   AI_API_KEY    = <khoá của nhà cung cấp đó>
 *   AI_CHAT_MODEL = gemini-2.5-flash
 * Để trống cả ba → giữ nguyên OpenAI như cũ (đọc OPENAI_API_KEY / OPENAI_CHAT_MODEL).
 *
 * NHÚNG VECTOR (RAG) CẤU HÌNH RIÊNG — CỐ Ý không đi theo AI_BASE_URL:
 * kho tai_lieu_chunk đang lưu véc-tơ của text-embedding-3-small. Nếu đổi nhà cung cấp chat
 * mà nhúng câu hỏi bằng mô hình khác thì phép so khoảng cách vẫn chạy nhưng ra kết quả RÁC
 * (không báo lỗi). Chỉ đổi AI_EMBED_* khi đã nhúng lại TOÀN BỘ kho bằng mô hình mới.
 */

function env(k: string): string | undefined {
  const v = process.env[k]?.trim()
  return v ? v : undefined
}

// ── Chat ──────────────────────────────────────────────────────────────────────
const CHAT_KEY = env('AI_API_KEY') ?? env('OPENAI_API_KEY')
const CHAT_BASE_URL = env('AI_BASE_URL') ?? env('OPENAI_BASE_URL')

/** Model chat mặc định (chatbot, hỏi đáp hồ sơ). */
export const AI_CHAT_MODEL = env('AI_CHAT_MODEL') ?? env('OPENAI_CHAT_MODEL') ?? 'gpt-4.1-mini'

/** Model soạn văn bản hành chính — mặc định dùng chung model chat. */
export const AI_VANBAN_MODEL = env('AI_VANBAN_MODEL') ?? AI_CHAT_MODEL

/** Tên hiển thị nhà cung cấp — dùng trong thông báo lỗi cho người dùng/quản trị. */
export const AI_TEN_NHA_CUNG_CAP =
  env('AI_PROVIDER_NAME') ??
  (!CHAT_BASE_URL ? 'OpenAI'
    : /googleapis|gemini/i.test(CHAT_BASE_URL) ? 'Google Gemini'
    : /groq/i.test(CHAT_BASE_URL) ? 'Groq'
    : /openrouter/i.test(CHAT_BASE_URL) ? 'OpenRouter'
    : /deepseek/i.test(CHAT_BASE_URL) ? 'DeepSeek'
    : /localhost|127\.0\.0\.1|11434/.test(CHAT_BASE_URL) ? 'Ollama (máy chủ nội bộ)'
    : 'dịch vụ AI')

/** Đã có khoá dịch vụ AI để gọi chat chưa. */
export function aiDaCauHinh(): boolean {
  return !!CHAT_KEY
}

let chatClient: OpenAI | null = null
/** Client chat dùng chung (khởi tạo lười — thiếu khoá thì chỉ lỗi khi thật sự gọi, không làm sập import). */
export function aiChat(): OpenAI {
  if (!CHAT_KEY) throw new ChuaCauHinhAIError()
  chatClient ??= new OpenAI({ apiKey: CHAT_KEY, baseURL: CHAT_BASE_URL })
  return chatClient
}

// ── Nhúng vector (RAG) ─────────────────────────────────────────────────────────
const EMBED_KEY = env('AI_EMBED_API_KEY') ?? env('OPENAI_API_KEY')
// Ghi TƯỜNG MINH địa chỉ OpenAI: nếu để undefined, SDK tự đọc OPENAI_BASE_URL — biến đó có thể
// đang trỏ chat sang nhà cung cấp khác, kéo theo nhúng véc-tơ sai model mà không báo lỗi.
const EMBED_BASE_URL = env('AI_EMBED_BASE_URL') ?? 'https://api.openai.com/v1'

export const AI_EMBED_MODEL = env('AI_EMBED_MODEL') ?? env('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-small'
/** Số chiều cột vector ở bảng tai_lieu_chunk — đổi phải có migration mới. */
export const AI_EMBED_DIM = 1536
/**
 * Có gửi tham số `dimensions` khi nhúng không. text-embedding-3-small mặc định đã 1536 nên
 * không cần; mô hình khác (vd gemini-embedding-001 mặc định 3072) thì bật AI_EMBED_SEND_DIM=1.
 */
export const AI_EMBED_GUI_SO_CHIEU = env('AI_EMBED_SEND_DIM') === '1'

let embedClient: OpenAI | null = null
export function aiEmbed(): OpenAI {
  if (!EMBED_KEY) throw new ChuaCauHinhAIError()
  embedClient ??= new OpenAI({ apiKey: EMBED_KEY, baseURL: EMBED_BASE_URL })
  return embedClient
}

// ── Phân loại lỗi ─────────────────────────────────────────────────────────────
export class ChuaCauHinhAIError extends Error {
  constructor() {
    super('Máy chủ chưa cấu hình khoá dịch vụ AI (AI_API_KEY hoặc OPENAI_API_KEY trong .env)')
    this.name = 'ChuaCauHinhAIError'
  }
}

/**
 * Lỗi do TÀI KHOẢN dịch vụ AI hết tiền/hết hạn mức — khác hẳn quá tải tạm thời, thử lại
 * là vô ích. Chỉ nhận các mã/cụm từ chắc chắn về hạn mức tài khoản: 429 "RESOURCE_EXHAUSTED"
 * của Gemini cũng dùng cho vượt tốc độ nên KHÔNG xếp vào đây.
 */
export function laLoiHetHanMuc(e: unknown): boolean {
  const err = e as { code?: string; type?: string; message?: string; error?: { code?: string } }
  const code = err?.code || err?.error?.code || ''
  if (code === 'credit_balance_exhausted' || code === 'insufficient_quota' || err?.type === 'insufficient_quota') return true
  return /no credits remaining|insufficient_quota|exceeded your current quota|insufficient balance/i.test(err?.message || '')
}

/**
 * Lỗi phát sinh từ PHÍA DỊCH VỤ AI (mất kết nối, sai khoá, hết hạn mức, quá tải, lỗi máy chủ AI…)
 * — phân biệt với lỗi của chính hệ thống (CSDL, mã nguồn) để quyết định chuyển sang chế độ
 * trả lời không dùng AI.
 */
export function laLoiDichVuAI(e: unknown): boolean {
  return e instanceof OpenAI.APIError || e instanceof ChuaCauHinhAIError
}
