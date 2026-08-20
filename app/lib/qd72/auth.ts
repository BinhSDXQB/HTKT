import 'server-only'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { suyVaiTro, type Qd72VaiTro, type Qd72User } from './phan-quyen'

// Giải quyền QĐ72 cho user hiện tại: suy vai trò + phạm vi địa bàn (wardId).
export type Qd72Auth = {
  userId: string
  vaiTro: Qd72VaiTro
  wardId: string | null      // XA_PHUONG: khoá theo địa bàn
  toChucId: string | null
}

export async function getQd72Auth(): Promise<Qd72Auth | null> {
  const user = await getCurrentUser()
  if (!user) return null

  // Lấy mã tổ chức + phòng ban để suy vai trò (đơn vị ngoài Sở / cán bộ Sở).
  let toChucMa: string | null = null
  if (user.toChucId) {
    const tc = await db.toChuc.findUnique({ where: { id: user.toChucId }, select: { ma: true } })
    toChucMa = tc?.ma ?? null
  }
  const canBo = user.wardId ? null : await db.canBo.findFirst({ where: { userId: user.id }, select: { phongBan: true } })

  const qUser: Qd72User = {
    roleName: user.role.name,
    wardId: user.wardId,
    toChucId: user.toChucId,
    toChucMa,
    phongBan: canBo?.phongBan ?? null,
  }
  return { userId: user.id, vaiTro: suyVaiTro(qUser), wardId: user.wardId, toChucId: user.toChucId }
}
