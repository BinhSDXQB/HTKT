// Test cccd.ts và ten-dang-nhap.ts. Số CCCD dùng trong test là SỐ GIẢ tự dựng theo cấu trúc TT 07/2016/TT-BCA
// (3 số tỉnh · 1 số thế kỷ+giới tính · 2 số năm sinh · 6 số ngẫu nhiên) — không phải CCCD của người thật.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCccd, crossCheckCccd } from './cccd.ts'
import {
  chuanHoaTenDangNhap, kiemTraTenDangNhap, chapNhanChoQuenMatKhau, phanLoaiTenDangNhap,
} from './ten-dang-nhap.ts'

test('parseCccd: giới tính và thế kỷ theo số thứ 4', () => {
  assert.deepEqual(parseCccd('001076123456'), { valid: true, maTinh: '001', gioiTinh: 'NAM', namSinh: 1976 })  // 0 = nam TK20
  assert.deepEqual(parseCccd('001180123456'), { valid: true, maTinh: '001', gioiTinh: 'NU', namSinh: 1980 })   // 1 = nữ TK20
  assert.deepEqual(parseCccd('001203123456'), { valid: true, maTinh: '001', gioiTinh: 'NAM', namSinh: 2003 })  // 2 = nam TK21
  assert.deepEqual(parseCccd('001305123456'), { valid: true, maTinh: '001', gioiTinh: 'NU', namSinh: 2005 })   // 3 = nữ TK21
})

test('parseCccd: bỏ khoảng trắng; sai định dạng thì không hợp lệ', () => {
  assert.equal(parseCccd('001 076 123456').valid, true)
  for (const x of ['', null, undefined, '12345', '00107612345', '0010761234567', '00107612345a']) {
    assert.equal(parseCccd(x as string).valid, false, String(x))
  }
})

test('crossCheckCccd: lệch giới tính/năm sinh/định dạng được cảnh báo, khớp thì không', () => {
  assert.deepEqual(crossCheckCccd({ cccd: '001076123456', gioiTinh: 'NAM', ngaySinh: '1976-06-15' }), [])
  assert.deepEqual(crossCheckCccd({ cccd: '001076123456', gioiTinh: 'NU' }).map(m => m.field), ['gioiTinh'])
  assert.deepEqual(crossCheckCccd({ cccd: '001076123456', ngaySinh: '1980-06-15' }).map(m => m.field), ['namSinh'])
  assert.deepEqual(crossCheckCccd({ cccd: '123' }).map(m => m.field), ['format'])
})

test('chuanHoaTenDangNhap: gỡ dấu phân cách ở CCCD, nhưng giữ dấu chấm của email và hạ chữ thường', () => {
  assert.equal(chuanHoaTenDangNhap(' 001.076-123 456 '), '001076123456')
  assert.equal(chuanHoaTenDangNhap(' Admin@HTKT.com.vn '), 'admin@htkt.com.vn')
})

test('kiemTraTenDangNhap: CCCD 12 số, CMND 9 số, email — còn lại bị từ chối', () => {
  assert.deepEqual(kiemTraTenDangNhap('001076123456'), { ok: true, giaTri: '001076123456', loai: 'CCCD' })
  assert.deepEqual(kiemTraTenDangNhap('123456789'), { ok: true, giaTri: '123456789', loai: 'CMND' })
  assert.deepEqual(kiemTraTenDangNhap('a@b.vn'), { ok: true, giaTri: 'a@b.vn', loai: 'EMAIL' })
  for (const x of ['', '   ', 'abc', "' OR 1=1 --", '00107612345a', '1234567']) {
    assert.equal(kiemTraTenDangNhap(x).ok, false, x)
  }
})

test('kiemTraTenDangNhap: CCCD 11 số (Excel cắt số 0 đầu) bị từ chối KÈM gợi ý', () => {
  const r = kiemTraTenDangNhap('01076123456')
  assert.equal(r.ok, false)
  assert.match(r.ok ? '' : r.loi, /số 0/)
})

test('chapNhanChoQuenMatKhau: nhận CCCD 12/11 số và mã xã 5 số; KHÔNG nhận email hay chuỗi lẫn chữ', () => {
  assert.deepEqual(chapNhanChoQuenMatKhau('12345'), { ok: true, digits: '12345' })
  assert.deepEqual(chapNhanChoQuenMatKhau('01076123456'), { ok: true, digits: '01076123456' })
  assert.deepEqual(chapNhanChoQuenMatKhau('001 076-123456'), { ok: true, digits: '001076123456' })
  for (const x of ['a@b.vn', '12a45', '1234', '1234567', '']) assert.deepEqual(chapNhanChoQuenMatKhau(x), { ok: false }, x)
})

test('phanLoaiTenDangNhap: wardId ưu tiên hơn suy đoán theo định dạng', () => {
  assert.equal(phanLoaiTenDangNhap('001076123456', 'w1'), 'MA_XA')
  assert.equal(phanLoaiTenDangNhap('001076123456'), 'CCCD')
  assert.equal(phanLoaiTenDangNhap('123456789'), 'CMND')
  assert.equal(phanLoaiTenDangNhap('12345'), 'MA_XA')
  assert.equal(phanLoaiTenDangNhap('a@b.vn'), 'EMAIL')
  assert.equal(phanLoaiTenDangNhap('xyz'), 'KHONG_XAC_DINH')
})
