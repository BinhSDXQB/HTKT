// Test âm tính cho các hàm quyền/phạm vi nhỏ: salary-perms, ward-report-perms, lich-scope, permissions.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canImportSalary, SALARY_IMPORT_EMAILS } from './salary-perms.ts'
import { canEditReport, type WardReportPerms } from './ward-report-perms.ts'
import { lichScopeWhere } from './lich-scope.ts'
import { hasPermission, formatPermissionKey } from './permissions.ts'
import type { CurrentUser } from './auth.ts'

test('canImportSalary: chỉ admin hoặc email trong danh sách', () => {
  const duoc = [...SALARY_IMPORT_EMAILS][0]
  assert.equal(canImportSalary({ email: '000000000000', role: { name: 'admin' } }), true)
  assert.equal(canImportSalary({ email: duoc, role: { name: 'user' } }), true)
  assert.equal(canImportSalary({ email: '000000000000', role: { name: 'user' } }), false)
  assert.equal(canImportSalary({ email: duoc + '0', role: { name: 'user' } }), false)
  assert.equal(canImportSalary({ email: '', role: { name: 'Admin' } }), false)   // phân biệt hoa/thường, không nới lỏng
})

const quyen = (p: Partial<WardReportPerms>): WardReportPerms => ({ type: 'WARD', viewAll: false, canWrite: true, limitWardId: 'w1', ...p } as WardReportPerms)

test('canEditReport: không có quyền ghi thì luôn false', () => {
  assert.equal(canEditReport(quyen({ canWrite: false, limitWardId: null }), 'w1'), false)
})
test('canEditReport: phường/xã chỉ sửa báo cáo của chính mình', () => {
  assert.equal(canEditReport(quyen({}), 'w1'), true)
  assert.equal(canEditReport(quyen({}), 'w2'), false)
  assert.equal(canEditReport(quyen({}), null), false)
})
test('canEditReport: không giới hạn phường (admin/HTKT) sửa được mọi báo cáo', () => {
  assert.equal(canEditReport(quyen({ limitWardId: null }), 'w2'), true)
  assert.equal(canEditReport(quyen({ limitWardId: null }), null), true)
})

const nguoi = (p: Partial<CurrentUser>): CurrentUser => ({
  id: 'me', email: '000000000000', name: 'T', phone: null, isActive: true, lastLoginAt: null, createdAt: new Date(0),
  wardId: null, toChucId: null, departmentCode: null, isDepartmentLeader: false,
  role: { id: 'r', name: 'user', displayName: 'user', description: null, isSystem: false }, permissions: [], ...p,
})

test('lichScopeWhere: người thường chỉ thấy việc của mình (+ mục công khai cùng phòng), luôn loại bản ghi đã xoá', () => {
  const w = lichScopeWhere(nguoi({})) as { deletedAt: null; OR: unknown[] }
  assert.equal(w.deletedAt, null)
  assert.deepEqual(w.OR, [{ userId: 'me' }])     // không toChucId → không có nhánh công khai
})
test('lichScopeWhere: có phòng → thêm đúng nhánh công khai CÙNG phòng, không phải phòng khác', () => {
  const w = lichScopeWhere(nguoi({ toChucId: 'P1' })) as { OR: unknown[] }
  assert.deepEqual(w.OR, [{ userId: 'me' }, { congKhai: true, toChucId: 'P1' }])
})
test('lichScopeWhere: admin/lãnh đạo Sở xem tất cả (chỉ lọc bản ghi đã xoá)', () => {
  assert.deepEqual(lichScopeWhere(nguoi({ departmentCode: 'LANH_DAO_SO' })), { deletedAt: null })
  assert.deepEqual(lichScopeWhere(nguoi({ role: { id: 'r', name: 'admin', displayName: 'a', description: null, isSystem: true } })), { deletedAt: null })
})

test('hasPermission: khớp tuyệt đối, danh sách rỗng thì false', () => {
  assert.equal(formatPermissionKey('office', 'menu_access'), 'office:menu_access')
  assert.equal(hasPermission([], 'office', 'menu_access'), false)
  assert.equal(hasPermission(['office:menu_access'], 'office', 'menu_access'), true)
  assert.equal(hasPermission(['office:menu_access_x'], 'office', 'menu_access'), false)
  assert.equal(hasPermission(['OFFICE:menu_access'], 'office', 'menu_access'), false)
})
