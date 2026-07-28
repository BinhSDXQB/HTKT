import 'server-only'
import { db } from '@/lib/db'

export const PHONG_HTKT = 'Phòng Hạ tầng kỹ thuật'

export type WardReportPerms = {
  /** Loại user */
  type: 'WARD' | 'SO_HTKT' | 'SO_OTHER' | 'ADMIN'
  /** Có thể xem tất cả (Sở) hay chỉ xem ward của mình */
  viewAll: boolean
  /** Có thể thêm/sửa/xóa */
  canWrite: boolean
  /** wardId bị giới hạn (null = không giới hạn) */
  limitWardId: string | null
}

/**
 * Xác định quyền truy cập dữ liệu báo cáo phường/xã.
 *
 * Luật:
 * - admin              → toàn quyền
 * - Sở HTKT (canBo.phongBan = "Phòng Hạ tầng kỹ thuật") → toàn quyền + xem tất cả
 * - Phường/xã (có wardId) → chỉ xem + sửa/xóa ward của mình
 * - Sở khác            → chỉ xem tất cả
 */
export async function getWardReportPerms(
  userId: string,
  roleName: string,
  wardId: string | null | undefined,
): Promise<WardReportPerms> {
  // Admin: toàn quyền
  if (roleName === 'admin') {
    return { type: 'ADMIN', viewAll: true, canWrite: true, limitWardId: null }
  }

  // Phường/xã: có wardId gắn vào tài khoản
  if (wardId) {
    return { type: 'WARD', viewAll: false, canWrite: true, limitWardId: wardId }
  }

  // Cán bộ Sở: kiểm tra phòng ban qua bảng can_bo
  const canBo = await db.canBo.findFirst({
    where: { userId },
    select: { phongBan: true },
  })

  if (canBo?.phongBan === PHONG_HTKT) {
    return { type: 'SO_HTKT', viewAll: true, canWrite: true, limitWardId: null }
  }

  // Cán bộ Sở khác: chỉ xem
  return { type: 'SO_OTHER', viewAll: true, canWrite: false, limitWardId: null }
}

/** Kiểm tra user có quyền thao tác trên một WardReport cụ thể không */
export function canEditReport(
  perms: WardReportPerms,
  reportWardId: string | null,
): boolean {
  if (!perms.canWrite) return false
  if (perms.limitWardId === null) return true  // admin hoặc HTKT
  return perms.limitWardId === reportWardId     // phường/xã: chỉ ward của mình
}
