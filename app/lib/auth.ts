import 'server-only'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { hasPermission, formatPermissionKey, MODULES, DEPARTMENT_CODES, deptCodeFromToChucMa } from '@/lib/permissions'

export type CurrentUser = {
  id: string
  email: string
  name: string
  phone: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  wardId: string | null
  toChucId: string | null
  departmentCode: string | null
  isDepartmentLeader: boolean
  role: {
    id: string
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
  }
  permissions: string[]
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession()
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId, isActive: true },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      toChuc: { select: { ma: true } },
    },
  })

  if (!user) return null

  const permissions = user.role.permissions.map(({ permission }) =>
    formatPermissionKey(permission.module, permission.action)
  )

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    wardId: user.wardId ?? null,
    toChucId: user.toChucId ?? null,
    // Suy ĐỘNG từ to_chuc.ma — không đọc cột users.departmentCode (chờ xoá khi cutover org_v2)
    departmentCode: deptCodeFromToChucMa(user.toChuc?.ma),
    isDepartmentLeader: user.isDepartmentLeader,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName,
      description: user.role.description,
      isSystem: user.role.isSystem,
    },
    permissions,
  }
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requirePermission(
  module: string,
  action: string
): Promise<CurrentUser> {
  const user = await requireAuth()
  if (!hasPermission(user.permissions, module, action)) {
    redirect('/forbidden')
  }
  return user
}

const SALARY_SENSITIVE_CCCD = new Set<string>([
  '044076001638', // Hoàng Đăng Cương
  '044080000694', // Trần Nguyễn
  '045083007427', // Nguyễn Thành Lai
])

/** CCCD (email đăng nhập) được phép THÊM / SỬA / XOÁ hồ sơ cán bộ — ngoài admin. */
export const CAN_BO_MANAGER_CCCD = new Set<string>([
  '044175011484', // Trần Thị Thu Liễu — Chánh Văn phòng Sở
  '044183001228', // Lê Thị Xuân Quý — Phó Chánh Văn phòng Sở
  '044191010085', // Lê Cẩm Nhung — Chuyên viên Văn phòng Sở
])

/** Quyền thêm/sửa/xoá hồ sơ cán bộ: admin hoặc nhóm VP Sở được chỉ định. */
export function canManageCanBo(user: Pick<CurrentUser, 'email' | 'role'>): boolean {
  return user.role.name === 'admin' || CAN_BO_MANAGER_CCCD.has(user.email)
}

/**
 * CCCD (email đăng nhập) của cán bộ chuyên trách THEO DÕI & DỰ THẢO nâng lương toàn Sở.
 * Được rà soát + sinh dự thảo / ban hành văn bản nâng lương dù KHÔNG phải lãnh đạo VPS.
 * KHÔNG bao gồm quyền DUYỆT (duyệt vẫn là lãnh đạo VPS / office:salary_approve_department).
 */
export const SALARY_STAFF_CCCD = new Set<string>([
  '044191010085', // Lê Cẩm Nhung — Chuyên viên VP Sở theo dõi & dự thảo nâng lương
])

/** Quyền nghiệp vụ lương: thêm lịch sử lương, sinh dự thảo/QĐ nâng lương, lưu văn bản. */
export function canManageSalary(user: CurrentUser): boolean {
  return (
    isOfficeLeader(user) ||
    hasPermission(user.permissions, MODULES.OFFICE, 'salary_manage') ||
    SALARY_STAFF_CCCD.has(user.email)
  )
}

/** Quyền rà soát nâng lương: sinh danh sách đến hạn, ghi kết luận, trình duyệt. */
export function canReviewSalary(user: CurrentUser): boolean {
  return (
    isOfficeLeader(user) ||
    hasPermission(user.permissions, MODULES.OFFICE, 'salary_review') ||
    SALARY_STAFF_CCCD.has(user.email)
  )
}

/**
 * Lãnh đạo Sở (Giám đốc/Phó Giám đốc thuộc nhóm LANH_DAO_SO) hoặc admin.
 * Được giám sát & truy cập module nghiệp vụ của TẤT CẢ các phòng.
 */
export function isLeadership(user: CurrentUser): boolean {
  return user.role.name === 'admin' || user.departmentCode === 'LANH_DAO_SO'
}

/** Quyền truy cập menu/API Văn phòng Sở: admin/lãnh đạo Sở, thuộc VPS, hoặc có quyền office:menu_access */
export function canAccessOffice(user: CurrentUser): boolean {
  return (
    isLeadership(user) ||
    user.departmentCode === DEPARTMENT_CODES.VPS ||
    hasPermission(user.permissions, MODULES.OFFICE, 'menu_access')
  )
}

/** Quyền truy cập menu/API Phòng Hạ tầng kỹ thuật: admin/lãnh đạo Sở, thuộc HTKT, hoặc có quyền htkt:menu_access */
export function canAccessHtkt(user: CurrentUser): boolean {
  return (
    isLeadership(user) ||
    user.departmentCode === DEPARTMENT_CODES.HTKT ||
    hasPermission(user.permissions, MODULES.HTKT, 'menu_access')
  )
}

/** Quyền dùng module Quản lý công việc: admin hoặc thành viên thuộc một phòng (có toChucId). */
export function canAccessCongViec(user: CurrentUser): boolean {
  return user.role.name === 'admin' || !!user.toChucId
}

/** Admin hoặc Lãnh đạo Sở → xem & điều phối toàn bộ công việc các phòng. */
export function canViewAllCongViec(user: CurrentUser): boolean {
  return isLeadership(user)
}

/**
 * Quyền xem dữ liệu cá nhân nhạy cảm (CCCD/lương):
 * - admin
 * - có quyền office:personnel_sensitive_view
 * - lãnh đạo Văn phòng Sở (Chánh/Phó Chánh Văn phòng: isDepartmentLeader + departmentCode=VPS)
 * - nhóm CCCD được chỉ định (import lương)
 * - nhóm được phép thêm/sửa/xoá cán bộ (canManageCanBo) — sửa được thì phải xem được
 */
export function canViewOfficeSensitive(user: CurrentUser): boolean {
  return (
    user.role.name === 'admin' ||
    hasPermission(user.permissions, MODULES.OFFICE, 'personnel_sensitive_view') ||
    (user.isDepartmentLeader && user.departmentCode === DEPARTMENT_CODES.VPS) ||
    SALARY_SENSITIVE_CCCD.has(user.email) ||
    canManageCanBo(user)
  )
}

/** Lãnh đạo Văn phòng Sở (Chánh/Phó Chánh VP) — dùng để gate các thao tác duyệt/quản lý nghiệp vụ VPS */
export function isOfficeLeader(user: CurrentUser): boolean {
  return (
    user.role.name === 'admin' ||
    (user.isDepartmentLeader && user.departmentCode === DEPARTMENT_CODES.VPS)
  )
}

export async function requireOfficeAccess(): Promise<CurrentUser> {
  const user = await requireAuth()
  if (!canAccessOffice(user)) redirect('/forbidden')
  return user
}

export async function requireHtktAccess(): Promise<CurrentUser> {
  const user = await requireAuth()
  if (!canAccessHtkt(user)) redirect('/forbidden')
  return user
}

/**
 * Quyền truy cập module nghiệp vụ của một phòng theo to_chuc.ma (vd PHONG_KT_VL, PHONG_PTDT):
 * admin xem tất cả; cán bộ chỉ vào module của chính phòng mình. Gate này tin cậy hơn departmentCode
 * (mã ngắn chỉ có cho HTKT/VPS) vì so trực tiếp to_chuc.ma. Là lớp xác thực chính ở server.
 */
export async function requireDeptAccess(deptMa: string): Promise<CurrentUser> {
  const user = await requireAuth()
  if (isLeadership(user)) return user
  if (user.toChucId) {
    const tc = await db.toChuc.findUnique({ where: { id: user.toChucId }, select: { ma: true } })
    if (tc?.ma === deptMa) return user
  }
  redirect('/forbidden')
}

export async function requireDeptAccessAny(...deptMas: string[]): Promise<CurrentUser> {
  const user = await requireAuth()
  if (isLeadership(user)) return user
  if (user.toChucId) {
    const tc = await db.toChuc.findUnique({ where: { id: user.toChucId }, select: { ma: true } })
    if (tc?.ma && deptMas.includes(tc.ma)) return user
  }
  redirect('/forbidden')
}
