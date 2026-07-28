import 'server-only'
import { db } from '@/lib/db'
import { embedQuery, toVectorLiteral } from './embeddings'

export type SearchHit = {
  taiLieuId: string
  tieuDe: string
  nguon: string | null
  loai: string
  phamVi: string
  viTri: string | null
  chunkIndex: number
  noiDung: string
  distance: number
}

/**
 * Tìm top-K đoạn gần nghĩa nhất với câu hỏi, CHỈ trong các phạm vi được phép
 * (phamViCho). Trả về kèm khoảng cách cosine để caller lọc ngưỡng nếu cần.
 */
export async function searchTaiLieu(opts: {
  query: string
  phamViCho: string[]
  topK?: number
}): Promise<SearchHit[]> {
  const { query, phamViCho } = opts
  const topK = Math.min(Math.max(opts.topK ?? 6, 1), 20)
  if (!query.trim() || phamViCho.length === 0) return []

  const qvec = toVectorLiteral(await embedQuery(query))
  // $1 = vector câu hỏi; $2.. = danh sách phạm vi cho phép.
  const inParams = phamViCho.map((_, i) => `$${i + 2}`).join(', ')

  const rows = await db.$queryRawUnsafe<
    Array<{
      taiLieuId: string
      tieuDe: string
      nguon: string | null
      loai: string
      phamVi: string
      viTri: string | null
      chunkIndex: number
      noiDung: string
      distance: number
    }>
  >(
    `SELECT c."taiLieuId"  AS "taiLieuId",
            d."tieuDe"     AS "tieuDe",
            d.nguon        AS nguon,
            d.loai         AS loai,
            d."phamVi"     AS "phamVi",
            c."viTri"      AS "viTri",
            c."chunkIndex" AS "chunkIndex",
            c."noiDung"    AS "noiDung",
            (c.embedding <=> $1::vector) AS distance
       FROM tai_lieu_chunk c
       JOIN tai_lieu d ON d.id = c."taiLieuId"
      WHERE d."deletedAt" IS NULL
        AND d."trangThai" = 'san_sang'
        AND d."phamVi" IN (${inParams})
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT ${topK}`,
    qvec,
    ...phamViCho
  )

  return rows.map((r) => ({ ...r, distance: Number(r.distance) }))
}
