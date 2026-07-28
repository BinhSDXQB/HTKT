export const MODULES = {
  TAI_SAN:         'tai_san',
  KIEM_TRA:        'kiem_tra',
  SU_CO:           'su_co',
  PHIEU_CV:        'phieu_cv',
  DU_AN:           'du_an',
  VAT_TU:          'vat_tu',
  BAO_CAO:         'bao_cao',
  DANH_MUC:        'danh_muc',
  ADMIN:           'admin',
  OFFICE:          'office',   // Văn phòng Sở
  HTKT:            'htkt',     // Phòng Hạ tầng kỹ thuật
} as const

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES]

// Mã phòng ban tối thiểu (theo prompt mục 13). User.toChucId trỏ tới to_chuc tương ứng:
//   HTKT → to_chuc.ma = PHONG_HTKT | VPS → to_chuc.ma = VAN_PHONG_SO
export const DEPARTMENT_CODES = {
  HTKT:  'HTKT',  // Phòng Hạ tầng kỹ thuật
  VPS:   'VPS',   // Văn phòng Sở
} as const

// Map department_code → to_chuc.ma (mã đơn vị trong cây tổ chức)
export const DEPT_TO_CHUC_MA: Record<string, string> = {
  HTKT: 'PHONG_HTKT',
  VPS:  'VAN_PHONG_SO',
}

/**
 * Suy departmentCode ĐỘNG từ to_chuc.ma (nguồn sự thật duy nhất — cột users.departmentCode
 * đã ngừng đọc, chờ xoá khi cutover org_v2). 2 mã tắt lịch sử giữ nguyên để không phải sửa
 * các gate VPS/HTKT; đơn vị khác dùng thẳng to_chuc.ma (LANH_DAO_SO, PHONG_KH_TC, ...).
 */
export function deptCodeFromToChucMa(ma: string | null | undefined): string | null {
  if (!ma) return null
  if (ma === 'VAN_PHONG_SO') return DEPARTMENT_CODES.VPS
  if (ma === 'PHONG_HTKT') return DEPARTMENT_CODES.HTKT
  return ma
}

// Action quyền của module Văn phòng Sở (lưu Permission.action; key = office:<action>)
export const OFFICE_ACTIONS = [
  'menu_access',
  'dashboard_view',
  'personnel_view',
  'personnel_create',
  'personnel_edit',
  'personnel_sensitive_view', // xem CCCD / dữ liệu cá nhân nhạy cảm
  'salary_view',
  'salary_manage',
  'salary_review',
  'salary_approve_department',
  'reward_view',
  'reward_manage',
  'reward_review',
  'annual_evaluation_manage',
  'discipline_manage',
  'leave_view',
  'leave_manage',
  'leave_approve',   // Văn phòng Sở xem xét / vào sổ
  'leave_sign',      // Lãnh đạo Sở ký duyệt
  'leave_finance',   // Phòng KH-TC cho ứng lương
  'overtime_view',     // Xem bảng chấm công làm thêm giờ
  'overtime_manage',   // Tạo / chấm công / xuất văn bản làm thêm giờ
  'overtime_sign',     // Lãnh đạo Sở ký số bảng chấm công làm thêm
  'overtime_vanthu',   // Văn thư đóng dấu (ký số) bảng chấm công làm thêm
  'legal_manage',
  'template_manage',
  'generate_document',
  'report_view',
  'admin',
] as const

export type OfficeAction = (typeof OFFICE_ACTIONS)[number]

export const ACTIONS = {
  VIEW:   'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
} as const

export type ActionKey = (typeof ACTIONS)[keyof typeof ACTIONS]

export function formatPermissionKey(module: string, action: string): string {
  return `${module}:${action}`
}

export function hasPermission(
  userPermissions: string[],
  module: string,
  action: string
): boolean {
  return userPermissions.includes(formatPermissionKey(module, action))
}
