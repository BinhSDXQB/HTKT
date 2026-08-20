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
  /** con_hieu_luc | het_hieu_luc | du_thao | can_kiem_chung (mig 043) */
  tinhTrangHieuLuc: string
  /** Số hiệu văn bản thay thế, khi tài liệu đã hết hiệu lực */
  thayTheBoi: string | null
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

  // pgvector HNSW: mặc định ef_search=40. Truy vấn này còn LỌC thêm theo phamVi /
  // trạng thái tài liệu sau khi index trả top-K, nên ef thấp dễ trả về THIẾU đoạn.
  // Nâng ef_search trong phạm vi transaction (SET LOCAL) để đủ ứng viên mà vẫn nhanh.
  const rows = await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL hnsw.ef_search = 100')
    return tx.$queryRawUnsafe<
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
      tinhTrangHieuLuc: string
      thayTheBoi: string | null
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
            d."tinhTrangHieuLuc" AS "tinhTrangHieuLuc",
            d."thayTheBoi"       AS "thayTheBoi",
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
  })

  return rows.map((r) => ({ ...r, distance: Number(r.distance) }))
}
