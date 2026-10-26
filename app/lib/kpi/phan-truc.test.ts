// Đề xuất trục cho nhiệm vụ trong Phụ lục KPI. Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deXuatTruc } from './phan-truc.ts'

test('mặc định Trục 1 khi không khớp từ khoá', () => {
  assert.deepEqual(deXuatTruc('Thực hiện các nhiệm vụ khác thuộc lĩnh vực phòng phụ trách'), { truc: 1, tuKhoa: null })
  assert.equal(deXuatTruc('Quy hoạch chung Khu du lịch quốc gia Phong Nha - Kẻ Bàng').truc, 1)
})

test('từ khoá → trục', () => {
  assert.equal(deXuatTruc('Công tác đánh giá, xếp loại; thi đua khen thưởng; chỉ đạo, điều hành phòng').truc, 4)
  assert.equal(deXuatTruc('Công tác kiểm soát thủ tục hành chính').truc, 2)
  assert.equal(deXuatTruc('Ứng dụng công nghệ thông tin, chuyển đổi số trong lĩnh vực xây dựng').truc, 3)
  assert.equal(deXuatTruc('Quản lý nhà ở xã hội').truc, 5)
  assert.equal(deXuatTruc('Phối hợp bảo đảm quốc phòng, an ninh').truc, 6)
})

test('khớp nhiều trục → theo thứ tự ưu tiên (4 trước 2)', () => {
  assert.equal(deXuatTruc('Đánh giá xếp loại và cải cách hành chính').truc, 4)
})

test('xét cả cột sản phẩm', () => {
  assert.equal(deXuatTruc('Tham mưu UBND tỉnh quy định chi tiết', 'Dự thảo văn bản quy phạm pháp luật').truc, 2)
})
