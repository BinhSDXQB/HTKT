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

/** Danh sách đơn vị (cấp 2+) thuộc Sở để hiển thị bộ lọc theo phòng. */
export async function getSoDonViOptions(): Promise<{ id: string; ten: string; ma: string }[]> {
  const ids = await getSoToChucIds()
  const rows = await db.toChuc.findMany({
    where: { id: { in: ids }, ma: { not: SO_ROOT_MA } },
    orderBy: [{ cap: 'asc' }, { thuTu: 'asc' }],
    select: { id: true, ten: true, ma: true },
  })
  return rows
}
