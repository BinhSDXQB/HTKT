import 'server-only'
import { db } from '@/lib/db'

// Mã đơn vị gốc của Sở trong cây tổ chức (to_chuc.ma)
export const SO_ROOT_MA = 'SO_XD_QT'

/**
 * Phạm vi nghiệp vụ Văn phòng Sở = TOÀN BỘ cán bộ thuộc cây tổ chức của Sở
 * (gốc SO_XD_QT + mọi cấp con: Lãnh đạo Sở, Văn phòng Sở và tất cả các phòng).
 * Trả về danh sách to_chuc.id để lọc: where { toChucId: { in } } hoặc
 * { canBo: { toChucId: { in } } }.
 */
export async function getSoToChucIds(): Promise<string[]> {
  const all = await db.toChuc.findMany({ select: { id: true, parentId: true, ma: true } })
  const root = all.find((t) => t.ma === SO_ROOT_MA)
  // Fallback an toàn: nếu không tìm thấy gốc, trả toàn bộ đơn vị (không thu hẹp ngoài ý muốn).
  if (!root) return all.map((t) => t.id)

  const childrenOf = new Map<string, string[]>()
  for (const t of all) {
    if (!t.parentId) continue
    const arr = childrenOf.get(t.parentId) ?? []
    arr.push(t.id)
    childrenOf.set(t.parentId, arr)
  }

  const ids: string[] = []
  const stack = [root.id]
  while (stack.length) {
    const id = stack.pop() as string
    ids.push(id)
    for (const child of childrenOf.get(id) ?? []) stack.push(child)
  }
  return ids
}

/**
 * Danh sách đơn vị (cấp 2+) thuộc Sở để hiển thị bộ lọc theo phòng / ô chọn "đơn vị" khi thêm
 * mới. CHỈ đơn vị còn hoạt động (isActive=true) — đơn vị đã chuyển đi/giải thể (như Ban QLDA GT,
 * xem prisma/khoa-dang-nhap-ban-qlda-gt.ts) không được chọn cho hồ sơ MỚI/thêm mới. Hồ sơ can_bo
 * CŨ đã gắn với đơn vị ngừng hoạt động vẫn giữ nguyên trong CSDL — không hàm nào ở đây xoá dữ liệu,
 * chỉ bớt khỏi danh sách để CHỌN. Nơi sửa hồ sơ của người thuộc đơn vị đã ngừng hoạt động phải tự
 * bổ sung riêng đơn vị hiện tại của người đó vào options (xem ho-so/[id]/sua/page.tsx) để không
 * vô tình xoá mất toChucId khi lưu.
 */
export async function getSoDonViOptions(): Promise<{ id: string; ten: string; ma: string }[]> {
  const ids = await getSoToChucIds()
  const rows = await db.toChuc.findMany({
    where: { id: { in: ids }, ma: { not: SO_ROOT_MA }, isActive: true },
    orderBy: [{ cap: 'asc' }, { thuTu: 'asc' }],
    select: { id: true, ten: true, ma: true },
  })
  return rows
}
