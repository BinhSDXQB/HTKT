// Test PHÂN QUYỀN ÂM TÍNH cho các hàm kiểm quyền thật trong lib/auth.ts (CCCD/lương/hồ sơ cán bộ).
// Nạp qua tools/test-support/register.mjs (giả lập server-only/db/session; db bị gọi sẽ ném lỗi).
// Không ghi CCCD thật vào test: tài khoản được phép lấy từ các tập hằng đã export; "người lạ" dùng số giả.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  canManageCanBo, canViewOfficeSensitive, canManageSalary, canReviewSalary, isLeadership, isOfficeLeader,
  canAccessOffice, canAccessHtkt, canAccessCongViec, canViewAllCongViec, CAN_BO_MANAGER_CCCD, SALARY_STAFF_CCCD,
  type CurrentUser,
} from './auth.ts'

const NGUOI_LA = '000000000000'   // số giả, không thuộc tập nào

function user(p: Omit<Partial<CurrentUser>, 'role'> & { role?: string; perms?: string[] } = {}): CurrentUser {
  const { role = 'user', perms = [], ...rest } = p
  return {
    id: 'u1', email: NGUOI_LA, name: 'Test', phone: null, isActive: true, lastLoginAt: null, createdAt: new Date(0),
    wardId: null, toChucId: null, departmentCode: null, isDepartmentLeader: false,
    role: { id: 'r', name: role, displayName: role, description: null, isSystem: false },
    permissions: perms, ...rest,
  }
}
const quanLy = [...CAN_BO_MANAGER_CCCD][0]
const nhanVienLuong = [...SALARY_STAFF_CCCD][0]
const tatCa = (u: CurrentUser) => ({
  manageCanBo: canManageCanBo(u), sensitive: canViewOfficeSensitive(u), manageSalary: canManageSalary(u),
  reviewSalary: canReviewSalary(u), office: canAccessOffice(u), htkt: canAccessHtkt(u), congViec: canAccessCongViec(u),
  xemTatCaCongViec: canViewAllCongViec(u), leadership: isLeadership(u), officeLeader: isOfficeLeader(u),
})
const TOAN_FALSE = Object.fromEntries(Object.keys(tatCa(user())).map(k => [k, false]))

test('tập CCCD được cấp quyền không rỗng (tránh test rỗng vô nghĩa)', () => {
  assert.ok(quanLy && nhanVienLuong)
})

test('người dùng thường không có bất kỳ quyền nhạy cảm nào', () => {
  assert.deepEqual(tatCa(user()), TOAN_FALSE)
})

test('thành viên Văn phòng Sở KHÔNG phải lãnh đạo: vào được menu VPS nhưng không xem CCCD/lương, không quản lý lương', () => {
  const r = tatCa(user({ departmentCode: 'VPS', toChucId: 't1' }))
  assert.equal(r.office, true)
  assert.equal(r.sensitive, false)
  assert.equal(r.manageSalary, false)
  assert.equal(r.reviewSalary, false)
  assert.equal(r.manageCanBo, false)
})

test('cờ trưởng phòng ở phòng KHÁC VPS không cho xem CCCD/lương', () => {
  const r = tatCa(user({ departmentCode: 'HTKT', isDepartmentLeader: true }))
  assert.equal(r.sensitive, false)
  assert.equal(r.officeLeader, false)
  assert.equal(r.manageSalary, false)
})

test('cờ lãnh đạo mà KHÔNG thuộc VPS không phải lãnh đạo Văn phòng Sở', () => {
  assert.equal(isOfficeLeader(user({ isDepartmentLeader: true, departmentCode: null })), false)
})

test('lãnh đạo Chánh/Phó Chánh VPS: xem dữ liệu nhạy cảm + quản lý/rà soát lương', () => {
  const r = tatCa(user({ departmentCode: 'VPS', isDepartmentLeader: true }))
  assert.equal(r.sensitive, true)
  assert.equal(r.officeLeader, true)
  assert.equal(r.manageSalary, true)
  assert.equal(r.reviewSalary, true)
})

test('lãnh đạo Sở (LANH_DAO_SO) xem được MỌI phòng nhưng CCCD/lương vẫn che', () => {
  const r = tatCa(user({ departmentCode: 'LANH_DAO_SO' }))
  assert.equal(r.leadership, true)
  assert.equal(r.office, true)
  assert.equal(r.htkt, true)
  assert.equal(r.xemTatCaCongViec, true)
  assert.equal(r.sensitive, false)      // quy ước: lãnh đạo xem toàn bộ, CCCD/lương vẫn che
  assert.equal(r.manageSalary, false)
})

test('admin có toàn quyền', () => {
  const r = tatCa(user({ role: 'admin' }))
  for (const k of Object.keys(TOAN_FALSE)) assert.equal(r[k as keyof typeof r], true, k)
})

test('nhóm CCCD quản lý cán bộ: sửa được thì phải xem được CCCD/lương, nhưng KHÔNG thành lãnh đạo', () => {
  const r = tatCa(user({ email: quanLy }))
  assert.equal(r.manageCanBo, true)
  assert.equal(r.sensitive, true)
  assert.equal(r.leadership, false)
  assert.equal(r.officeLeader, false)
})

test('cán bộ chuyên trách lương: dự thảo + rà soát, nhưng KHÔNG phải lãnh đạo VPS (không có quyền duyệt)', () => {
  const r = tatCa(user({ email: nhanVienLuong }))
  assert.equal(r.manageSalary, true)
  assert.equal(r.reviewSalary, true)
  assert.equal(r.officeLeader, false)
})

test('quyền cấp qua permissions khớp CHÍNH XÁC module:action, không khớp phần tử gần giống', () => {
  assert.equal(canViewOfficeSensitive(user({ perms: ['office:personnel_sensitive_view'] })), true)
  assert.equal(canViewOfficeSensitive(user({ perms: ['htkt:personnel_sensitive_view'] })), false)
  assert.equal(canViewOfficeSensitive(user({ perms: ['office:personnel_sensitive'] })), false)
  assert.equal(canManageSalary(user({ perms: ['office:salary_review'] })), false)   // review ≠ manage
  assert.equal(canReviewSalary(user({ perms: ['office:salary_manage'] })), false)   // manage ≠ review
  assert.equal(canAccessHtkt(user({ perms: ['office:menu_access'] })), false)
})

test('Quản lý công việc: cần thuộc một phòng (có toChucId) hoặc admin', () => {
  assert.equal(canAccessCongViec(user()), false)
  assert.equal(canAccessCongViec(user({ toChucId: 't1' })), true)
})

test('email giống CCCD được cấp quyền nhưng sai khác chữ số/khoảng trắng thì KHÔNG được quyền', () => {
  assert.equal(canManageCanBo(user({ email: quanLy + ' ' })), false)
  assert.equal(canManageCanBo(user({ email: quanLy.slice(1) })), false)
  assert.equal(canManageCanBo(user({ email: '' })), false)
})
