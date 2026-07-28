import 'server-only'
import { isOfficeLeader, type CurrentUser } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'

/**
 * Quy trình duyệt đơn nghỉ phép (đối tượng quản lý trực tiếp → trình → ký → ứng lương):
 *
 *   CHO_TRUONG_PHONG  Trưởng phòng (quản lý trực tiếp) XEM XÉT đơn
 *        → CHO_VAN_PHONG   Chánh/Phó Chánh Văn phòng Sở TRÌNH Giám đốc
 *        → CHO_LANH_DAO_SO Giám đốc Sở KÝ DUYỆT
 *        → CHO_TAI_CHINH   Phòng KH-TC cho ỨNG LƯƠNG (chỉ khi đề nghị ứng lương)
 *        → HOAN_TAT
 *
 * Từ chối tại bất kỳ cấp → TU_CHOI (ghi rõ tuChoiCap). Người tạo huỷ khi còn CHO_TRUONG_PHONG.
 */

export type LeaveStatus =
  | 'CHO_TRUONG_PHONG' | 'CHO_VAN_PHONG' | 'CHO_LANH_DAO_SO' | 'CHO_TAI_CHINH'
  | 'HOAN_TAT' | 'TU_CHOI' | 'DA_HUY'

export type StageConfig = {
  label: string          // mô tả hành động cấp này
  actionLabel: string    // nhãn nút duyệt
  idField: 'tpDuyetId' | 'vpsId' | 'ldsKyId' | 'khtcId'
  ngayField: 'tpNgay' | 'vpsNgay' | 'ldsNgay' | 'khtcNgay'
  yKienField: 'tpYKien' | 'vpsYKien' | 'ldsYKien' | 'khtcYKien'
  capCode: 'TRUONG_PHONG' | 'VAN_PHONG' | 'LANH_DAO_SO' | 'TAI_CHINH'
}

/** Cấu hình cột ghi nhận theo trạng thái đang chờ. */
export const STAGE: Record<string, StageConfig> = {
  CHO_TRUONG_PHONG: { label: 'Trưởng phòng xem xét',     actionLabel: 'Xem xét',  idField: 'tpDuyetId', ngayField: 'tpNgay',  yKienField: 'tpYKien',  capCode: 'TRUONG_PHONG' },
  CHO_VAN_PHONG:    { label: 'Văn phòng Sở trình',       actionLabel: 'Trình GĐ', idField: 'vpsId',     ngayField: 'vpsNgay', yKienField: 'vpsYKien', capCode: 'VAN_PHONG' },
  CHO_LANH_DAO_SO:  { label: 'Giám đốc Sở ký duyệt',     actionLabel: 'Ký duyệt', idField: 'ldsKyId',   ngayField: 'ldsNgay', yKienField: 'ldsYKien', capCode: 'LANH_DAO_SO' },
  CHO_TAI_CHINH:    { label: 'Phòng KH-TC cho ứng lương', actionLabel: 'Ứng lương', idField: 'khtcId',   ngayField: 'khtcNgay', yKienField: 'khtcYKien', capCode: 'TAI_CHINH' },
}

/** Thứ tự các bước (để vẽ pipeline). */
export const STAGE_PIPELINE = [
  'CHO_TRUONG_PHONG', 'CHO_VAN_PHONG', 'CHO_LANH_DAO_SO', 'CHO_TAI_CHINH', 'HOAN_TAT',
] as const

/** Trạng thái kế tiếp sau khi cấp hiện tại duyệt. */
export function nextStatusAfter(status: string, deNghiUngLuong: boolean): LeaveStatus {
  switch (status) {
    case 'CHO_TRUONG_PHONG': return 'CHO_VAN_PHONG'
    case 'CHO_VAN_PHONG':    return 'CHO_LANH_DAO_SO'
    case 'CHO_LANH_DAO_SO':  return deNghiUngLuong ? 'CHO_TAI_CHINH' : 'HOAN_TAT'
    case 'CHO_TAI_CHINH':    return 'HOAN_TAT'
    default:                 return 'HOAN_TAT'
  }
}

/** Lãnh đạo trực tiếp của phòng người làm đơn (Trưởng/Phó phòng cùng đơn vị) hoặc admin. */
function isDirectManagerOf(user: CurrentUser, requesterToChucId: string | null): boolean {
  if (user.role.name === 'admin') return true
  return Boolean(user.isDepartmentLeader && requesterToChucId && user.toChucId === requesterToChucId)
}

/** User có được xử lý đơn ở trạng thái hiện tại không. */
export function canActOnStage(
  user: CurrentUser,
  status: string,
  requesterToChucId: string | null,
): boolean {
  switch (status) {
    case 'CHO_TRUONG_PHONG': return isDirectManagerOf(user, requesterToChucId)
    case 'CHO_VAN_PHONG':    return isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'leave_approve')
    case 'CHO_LANH_DAO_SO':  return user.role.name === 'admin' || hasPermission(user.permissions, MODULES.OFFICE, 'leave_sign')
    case 'CHO_TAI_CHINH':    return user.role.name === 'admin' || hasPermission(user.permissions, MODULES.OFFICE, 'leave_finance')
    default:                 return false
  }
}

/**
 * Trạng thái khởi tạo khi tạo đơn. Nếu người làm đơn chính là lãnh đạo phòng của mình
 * (Trưởng/Phó phòng) → bỏ qua bước "Trưởng phòng xem xét", vào thẳng Văn phòng Sở.
 */
export function initialStatus(requesterIsOwnDeptLeader: boolean): LeaveStatus {
  return requesterIsOwnDeptLeader ? 'CHO_VAN_PHONG' : 'CHO_TRUONG_PHONG'
}

/** Cấp đang chờ có phải bước cuối (không còn ứng lương) → sẽ HOAN_TAT. */
export function isPendingStatus(status: string): boolean {
  return status in STAGE
}
