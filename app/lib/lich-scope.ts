import { canViewAllCongViec, type CurrentUser } from '@/lib/auth'

// Phạm vi xem Lịch công tác: việc của mình + mục công khai cùng phòng + admin/Lãnh
// đạo Sở xem tất cả. Tách khỏi file 'use server' (mọi export ở đó phải là async).
export function lichScopeWhere(user: CurrentUser): Record<string, unknown> {
  if (canViewAllCongViec(user)) return { deletedAt: null }
  const or: Record<string, unknown>[] = [{ userId: user.id }]
  if (user.toChucId) or.push({ congKhai: true, toChucId: user.toChucId })
  return { deletedAt: null, OR: or }
}
