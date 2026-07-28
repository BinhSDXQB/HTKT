import 'server-only'
import OpenAI from 'openai'

// Nhúng vector cho RAG. Dùng text-embedding-3-small (1536 chiều) — rẻ, đủ tốt
// cho tiếng Việt; KHỚP với kiểu vector(1536) ở bảng tai_lieu_chunk.
// Đổi model ở đây thì PHẢI đổi số chiều cột vector (migration mới) cho khớp.
export const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'
export const EMBED_DIM = 1536

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** Nhúng một lô văn bản. Gọi theo lô ≤96 để tránh vượt giới hạn request. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const out: number[][] = []
  const BATCH = 96
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => t.replace(/\n/g, ' ').slice(0, 8000))
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch })
    for (const d of res.data) out.push(d.embedding as number[])
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
