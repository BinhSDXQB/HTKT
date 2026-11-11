import { routeAi, dbAi } from '@/lib/ai-content/may-chu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/v1/nguon?q= — tài liệu trong kho có thể gắn làm nguồn cho bài.
 * Chỉ trả tiêu đề + phạm vi + hiệu lực (không trả nội dung). Tài liệu nội bộ vẫn hiện để người soạn
 * thấy vì sao không dùng được cho bài công khai; cổng xuất bản mới là nơi chặn.
 */
export const GET = routeAi(async ({ req }) => {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)
  const items = await dbAi.q(
    `select id, "tieuDe" as "tieuDe", "phamVi" as "phamVi", "tinhTrangHieuLuc" as "tinhTrangHieuLuc"
       from tai_lieu
      where "deletedAt" is null and "trangThai" = 'san_sang'
        and ($1::text = '' or "tieuDe" ilike '%' || $1 || '%')
      order by ("phamVi" = 'CONG_KHAI' and "tinhTrangHieuLuc" = 'con_hieu_luc') desc, "tieuDe"
      limit 50`, [q])
  return { items }
})
