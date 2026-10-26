// Phân tích cột thời hạn của Phụ lục KPI. Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { phanTichThoiHan, macDinhTheoQuy } from './thoi-han.ts'

test('quý đơn, nhiều quý, viết tắt', () => {
  assert.deepEqual(phanTichThoiHan('Quý III/2026').quy, [3])
  assert.deepEqual(phanTichThoiHan('Quý III, IV/2026').quy, [3, 4])
  assert.deepEqual(phanTichThoiHan('Quý I,III/2026').quy, [1, 3])
  assert.deepEqual(phanTichThoiHan('Quý III- IV').quy, [3, 4])
  assert.deepEqual(phanTichThoiHan('Quý II').quy, [2])
  assert.deepEqual(phanTichThoiHan('Quý I năm 2026').quy, [1])
})

test('tháng và ngày hạn → quý chứa tháng đó', () => {
  assert.deepEqual(phanTichThoiHan('Tháng 8/2026').quy, [3])
  assert.deepEqual(phanTichThoiHan('Tháng 4/2026').quy, [2])
  assert.deepEqual(phanTichThoiHan('31/12/2026').quy, [4])
})

test('thường xuyên/cả năm/định kỳ → lienTuc, không có quý cụ thể', () => {
  for (const s of ['Năm 2026', 'Cả năm', 'Cả năm 2026', 'Thường xuyên', 'Định kỳ hàng quý', 'Theo từng hồ sơ, đúng thời hạn quy định', 'Khi có yêu cầu']) {
    const t = phanTichThoiHan(s)
    assert.equal(t.lienTuc, true, s)
    assert.deepEqual(t.quy, [], s)
    assert.equal(t.khongRo, false, s)
  }
})

test('ô hỗn hợp: có quý và có phát sinh', () => {
  const t = phanTichThoiHan('Quý I và cập nhật khi có thay đổi VBQPPL của cấp trên')
  assert.deepEqual(t.quy, [1])
  assert.equal(t.lienTuc, true)
  assert.deepEqual(phanTichThoiHan('Quý IV/2026/theo tiến độ được giao').quy, [4])
})

test('ô trống → không rõ, cán bộ tự chọn', () => {
  const t = phanTichThoiHan('')
  assert.equal(t.khongRo, true)
  assert.equal(macDinhTheoQuy(t, 3), 'TUY_CHON')
})

test('mặc định theo quý', () => {
  assert.equal(macDinhTheoQuy(phanTichThoiHan('Quý III/2026'), 3), 'CO')
  assert.equal(macDinhTheoQuy(phanTichThoiHan('Quý IV/2026'), 3), 'KHONG')
  assert.equal(macDinhTheoQuy(phanTichThoiHan('Quý III, IV/2026'), 3), 'CO')
  assert.equal(macDinhTheoQuy(phanTichThoiHan('Năm 2026'), 3), 'TUY_CHON')
})

test('mọi ô thời hạn trong Phụ lục thật đều nhận diện được (không còn "không rõ" ngoài ô trống)', () => {
  const d = JSON.parse(readFileSync(fileURLToPath(new URL('./ke-hoach-2026.json', import.meta.url)), 'utf8'))
  const khongRo = d.nhiemVu.filter((n: { thoiHan: string }) => n.thoiHan.trim() && phanTichThoiHan(n.thoiHan).khongRo)
  assert.deepEqual(khongRo.map((n: { id: string; thoiHan: string }) => `${n.id}: ${n.thoiHan}`), [])
})
