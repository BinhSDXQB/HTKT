import 'server-only'
import { aiEmbed, AI_EMBED_MODEL, AI_EMBED_DIM, AI_EMBED_GUI_SO_CHIEU } from '@/lib/ai/cau-hinh'

// Nhúng vector cho RAG. Mặc định text-embedding-3-small (1536 chiều) — rẻ, đủ tốt
// cho tiếng Việt; KHỚP với kiểu vector(1536) ở bảng tai_lieu_chunk.
// Nhà cung cấp/model cấu hình ở lib/ai/cau-hinh.ts (AI_EMBED_*), TÁCH RIÊNG khỏi model chat.
// Đổi model ở đây thì PHẢI nhúng lại toàn bộ kho (véc-tơ khác model không so sánh được).
export const EMBED_MODEL = AI_EMBED_MODEL
export const EMBED_DIM = AI_EMBED_DIM

/** Nhúng một lô văn bản. Gọi theo lô ≤96 để tránh vượt giới hạn request. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const out: number[][] = []
  const BATCH = 96
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.replace(/\n/g, ' ').slice(0, 8000))
    const res = await aiEmbed().embeddings.create({
      model: EMBED_MODEL,
      input: batch,
      ...(AI_EMBED_GUI_SO_CHIEU ? { dimensions: EMBED_DIM } : {}),
    })
    for (const d of res.data) {
      // Chặn ghi/tra véc-tơ lệch số chiều — pgvector sẽ báo lỗi khó hiểu hoặc (khi so) ra rác.
      if (d.embedding.length !== EMBED_DIM) {
        throw new Error(
          `Model nhúng "${EMBED_MODEL}" trả véc-tơ ${d.embedding.length} chiều, cột CSDL cần ${EMBED_DIM}. ` +
          'Đặt AI_EMBED_SEND_DIM=1 (nếu model hỗ trợ tham số dimensions) hoặc dùng model 1536 chiều.',
        )
      }
      out.push(d.embedding as number[])
    }
  }
  return out
}

/** Nhúng một câu hỏi → 1 vector. */
export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedTexts([text])
  return v
}

/** Chuyển mảng số → literal vector pgvector: "[0.1,0.2,...]". */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`
}
