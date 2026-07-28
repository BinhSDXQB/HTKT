import 'server-only'
import type { CurrentUser } from '@/lib/auth'
import { canAccessOffice } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'

// Phân quyền chấm công làm thêm giờ — KHÔNG nằm trong module Văn phòng Sở để
// MỌI phòng đều dùng được. Nguyên tắc: mỗi phòng tự chấm công phòng MÌNH; Văn
// phòng Sở / admin tổng hợp & thao tác cho TẤT CẢ các phòng.

/** Admin hoặc cán bộ có quyền truy cập module Văn phòng Sở (VP Sở tổng hợp toàn cơ quan). */
export function isOfficeOrAdmin(user: CurrentUser): boolean {
  return user.role.name === 'admin' || canAccessOffice(user)
}

/**
 * Phòng/đơn vị của user. Ưu tiên User.toChucId; nếu trống thì lấy từ HỒ SƠ CÁN BỘ
 * (can_bo.toChucId) gắn với tài khoản — vì nhiều nhân viên chỉ gắn phòng ở hồ sơ
 * cán bộ chứ không set trực tiếp trên bản ghi User.
 */
export async function effectiveToChucId(user: CurrentUser): Promise<string | null> {
  if (user.toChucId) return user.toChucId
  const cb = await db.canBo.findFirst({
    where: { userId: user.id, toChucId: { not: null } },
    select: { toChucId: true },
  })
  return cb?.toChucId ?? null
}

/** Được quản lý (tạo/sửa/chấm công/xuất) bảng của phòng `toChucId`? */
export async function canManageOvertimeFor(user: CurrentUser, toChucId: string): Promise<boolean> {
  if (isOfficeOrAdmin(user)) return true
  const my = await effectiveToChucId(user)
  return !!my && my === toChucId
}

/** Được xem bảng của phòng `toChucId`? (hiện tại = được quản lý). */
export async function canViewOvertimeFor(user: CurrentUser, toChucId: string): Promise<boolean> {
  return canManageOvertimeFor(user, toChucId)
}

/** Danh sách phòng user được thao tác: VP Sở/admin → toàn Sở; còn lại → phòng của mình. */
export async function manageableToChucIds(user: CurrentUser): Promise<string[]> {
  if (isOfficeOrAdmin(user)) return getSoToChucIds()
  const my = await effectiveToChucId(user)
  return my ? [my] : []
}
