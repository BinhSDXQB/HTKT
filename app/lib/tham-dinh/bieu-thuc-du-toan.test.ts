// Test tinhBieuThuc (kiem-tra-du-toan.ts): biểu thức diễn giải khối lượng, KHÔNG dùng eval.
// Giá trị mong đợi tính tay. Bẫy đã gặp: loại bỏ ký tự có thể biến chữ ("Đạt", mã hiệu) thành số/biểu thức giả
// → mọi chuỗi có chữ cái phải trả null.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tinhBieuThuc } from './kiem-tra-du-toan.ts'

const gan = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`)

test('tính đúng số học cơ bản, thứ tự ưu tiên và ngoặc', () => {
  gan(tinhBieuThuc('210*0,5*0,8/100'), 0.84)
  gan(tinhBieuThuc('25+8'), 33)
  gan(tinhBieuThuc('2+3*4'), 14)
  gan(tinhBieuThuc('(2+3)*4'), 20)
  gan(tinhBieuThuc('-3+5'), 2)
  gan(tinhBieuThuc('10/4'), 2.5)
})

test('"x" và "×" là dấu nhân; chỉ lấy vế trái của "="', () => {
  gan(tinhBieuThuc('2 x 3,5'), 7)
  gan(tinhBieuThuc('2×3'), 6)
  gan(tinhBieuThuc('5 X 3'), 15)
  gan(tinhBieuThuc('5+5=10'), 10)
  gan(tinhBieuThuc('5=6'), 5)
})

test('dấu thập phân kiểu Việt: "." ngàn, "," thập phân', () => {
  gan(tinhBieuThuc('1.000,5+0,5'), 1001)
  gan(tinhBieuThuc('0,25*4'), 1)
})

test('không phải biểu thức thuần → null (kể cả chữ có thể bị nhầm thành phép nhân)', () => {
  for (const x of ['', '   ', 'abc', 'Đạt', 'Max 5', 'THKP x 2', 'a+1', '1+a', 'alert(1)', '1;2', '=5']) {
    assert.equal(tinhBieuThuc(x), null, JSON.stringify(x))
  }
})

// Ghi chú hành vi hiện tại (không khẳng định đúng/sai): mọi khoảng trắng bị gỡ TRƯỚC khi tính nên "1 2" = 12.
// Có thể cố ý (đọc "1 000"); nếu muốn chặn, phải sửa mã và cập nhật test.
test('biểu thức sai cấu trúc → null', () => {
  for (const x of ['(1+2', '1+2)', '1+', '*3', '()']) assert.equal(tinhBieuThuc(x), null, x)
})

test('chia cho 0 → null (không Infinity/NaN)', () => {
  assert.equal(tinhBieuThuc('1/0'), null)
  assert.equal(tinhBieuThuc('5/(2-2)'), null)
})

test('chặn đầu vào bất thường: quá dài, ngoặc lồng quá sâu', () => {
  assert.equal(tinhBieuThuc('1+'.repeat(70) + '1'), null)                       // 141 ký tự > 120
  assert.equal(tinhBieuThuc('('.repeat(21) + '1' + ')'.repeat(21)), null)         // sâu 21 > 20
  gan(tinhBieuThuc('('.repeat(20) + '1' + ')'.repeat(20)), 1)                     // sâu đúng 20 vẫn tính
})
