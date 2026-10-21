// Nhận diện "chính mình" cho luong_cua_toi (B0 vòng 2). Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nhanDienBanThan } from './nhan-dien-ban-than.ts'

const A = { id: 'cbA', userId: 'u1' }
const B = { id: 'cbB', userId: null }
const C = { id: 'cbC', userId: 'u2' }

test('ưu tiên liên kết userId', () => {
  assert.deepEqual(nhanDienBanThan(A, null, 'u1'), { loai: 'TIM_THAY', hoSo: A })
  assert.deepEqual(nhanDienBanThan(A, A, 'u1'), { loai: 'TIM_THAY', hoSo: A })
})

test('userId và CCCD trỏ hai hồ sơ khác nhau → từ chối, không đoán', () => {
  assert.deepEqual(nhanDienBanThan(A, B, 'u1'), { loai: 'XUNG_DOT' })
})

test('chỉ khớp CCCD: dùng khi hồ sơ chưa gắn tài khoản nào; từ chối nếu đã gắn tài khoản khác', () => {
  assert.deepEqual(nhanDienBanThan(null, B, 'u1'), { loai: 'TIM_THAY', hoSo: B })
  assert.deepEqual(nhanDienBanThan(null, C, 'u1'), { loai: 'XUNG_DOT' })
  assert.deepEqual(nhanDienBanThan(null, C, 'u2'), { loai: 'TIM_THAY', hoSo: C })
})

test('không khớp gì', () => {
  assert.deepEqual(nhanDienBanThan(null, null, 'u1'), { loai: 'KHONG_THAY' })
})
