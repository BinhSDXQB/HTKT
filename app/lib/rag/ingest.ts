import 'server-only'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { chunkText } from './chunk'
import { embedTexts, toVectorLiteral } from './embeddings'

export type IngestInput = {
  tieuDe: string
  loai?: string
  phamVi?: 'CONG_KHAI' | 'NOI_BO_SO'
  nguon?: string
  moTa?: string
  text: string
  createdById?: string | null
}

/** Tìm "[Trang N]" gần nhất trong đoạn để gợi ý vị trí trích dẫn. */
function viTriTuNoiDung(content: string): string | null {
  const matches = [...content.matchAll(/\[Trang (\d+)\]/g)]
  if (matches.length === 0) return null
  return `Trang ${matches[matches.length - 1][1]}`
}

/**
 * Nạp 1 tài liệu: tạo bản ghi tai_lieu (dang_xu_ly) → cắt đoạn → nhúng vector →
 * chèn tai_lieu_chunk → chuyển trạng thái san_sang. Lỗi giữa chừng → trạng thái 'loi'.
 */
export async function ingestDocument(
  input: IngestInput
): Promise<{ id: string; soChunk: number }> {
  const doc = await db.taiLieu.create({
    data: {
      tieuDe: input.tieuDe,
      loai: input.loai || 'KHAC',
      phamVi: input.phamVi || 'NOI_BO_SO',
      nguon: input.nguon,
      moTa: input.moTa,
      createdById: input.createdById ?? undefined,
      trangThai: 'dang_xu_ly',
      soKyTu: input.text.length,
    },
  })

  try {
    const chunks = chunkText(input.text)
    if (chunks.length === 0) throw new Error('Không tách được nội dung nào để nhúng.')

    const vectors = await embedTexts(chunks.map((c) => c.content))

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      await db.$executeRawUnsafe(
        `INSERT INTO tai_lieu_chunk (id, "taiLieuId", "chunkIndex", "noiDung", embedding, "soToken", "viTri")
         VALUES ($1, $2, $3, $4, $5::vector, $6, $7)`,
        randomUUID(),
        doc.id,
        c.index,
        c.content,
        toVectorLiteral(vectors[i]),
        c.soToken,
        viTriTuNoiDung(c.content)
      )
    }

    await db.taiLieu.update({
      where: { id: doc.id },
      data: { trangThai: 'san_sang', soChunk: chunks.length },
    })
    return { id: doc.id, soChunk: chunks.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await db.taiLieu.update({
      where: { id: doc.id },
      data: { trangThai: 'loi', ghiChuLoi: msg.slice(0, 500) },
    })
    throw e
  }
}
