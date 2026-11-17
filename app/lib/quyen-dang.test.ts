import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canViewThongTinDang, type CurrentUser } from './auth.ts'

function nguoi(p: Partial<CurrentUser> & { quyen?: string[]; vaiTro?: string } = {}): CurrentUser {
  return {
    id: 'u1', email: 'x@htkt.vn', name: 'Thử', phone: null, isActive: true, lastLoginAt: null, createdAt: new Date(),
    wardId: null, toChucId: null, departmentCode: 'VPS', isDepartmentLeader: false,
    role: { id: 'r', name: p.vaiTro ?? 'staff', permissions: [] },
    permissions: p.quyen ?? ['office:menu_access'],
    ...p,
  } as unknown as CurrentUser
}

test('thông tin Đảng: chỉ chính chủ, admin hoặc người có quyền riêng mới xem', () => {
  assert.equal(canViewThongTinDang(nguoi(), false), false)
  assert.equal(canViewThongTinDang(nguoi(), true), true)
  assert.equal(canViewThongTinDang(nguoi({ vaiTro: 'admin' }), false), true)
  assert.equal(canViewThongTinDang(nguoi({ quyen: ['office:menu_access', 'office:party_review_view'] }), false), true)
  // quyền xem hồ sơ đánh giá CC/VC (annual_evaluation_manage) KHÔNG kéo theo quyền xem hồ sơ Đảng
  assert.equal(canViewThongTinDang(nguoi({ quyen: ['office:menu_access', 'office:annual_evaluation_manage'] }), false), false)
})
