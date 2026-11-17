import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keHoachHieuLuc } from './sync-hieu-luc-tai-lieu.mjs'

const tl = (o) => ({ id: 'x', nguon: 'a.pdf', tinhTrangHieuLuc: 'con_hieu_luc', thayTheBoi: null, ghiChuHieuLuc: null, ...o })

test('trạng thái giữ nguyên nhưng ghiChu đổi → PHẢI cập nhật', () => {
  const k = keHoachHieuLuc([tl({ ghiChuHieuLuc: 'cũ' })], { 'a.pdf': { tinhTrang: 'con_hieu_luc', ghiChu: 'mới' } })
  assert.equal(k.capNhat.length, 1)
  assert.equal(k.capNhat[0].ghiChu, 'mới')
})
test('trạng thái giữ nguyên nhưng thayTheBoi đổi → PHẢI cập nhật', () => {
  const k = keHoachHieuLuc([tl({ tinhTrangHieuLuc: 'het_hieu_luc', thayTheBoi: 'NĐ 1' })],
    { 'a.pdf': { tinhTrang: 'het_hieu_luc', thayTheBoi: 'NĐ 2' } })
  assert.equal(k.capNhat.length, 1)
  assert.equal(k.capNhat[0].thayTheBoi, 'NĐ 2')
})
test('cả ba trường giống ("" coi như rỗng) → giữ nguyên', () => {
  const k = keHoachHieuLuc([tl({})], { 'a.pdf': { tinhTrang: 'con_hieu_luc', thayTheBoi: '', ghiChu: '' } })
  assert.equal(k.capNhat.length, 0)
  assert.equal(k.giuNguyen, 1)
})
test('key bị xoá khỏi bảng đăng ký → đặt lại can_kiem_chung, xoá thayTheBoi/ghiChu', () => {
  const k = keHoachHieuLuc([tl({ nguon: 'b.pdf', thayTheBoi: 'X', ghiChuHieuLuc: 'Y' })], { 'a.pdf': { tinhTrang: 'con_hieu_luc' } })
  assert.equal(k.capNhat.length, 1)
  assert.deepEqual(
    [k.capNhat[0].tinhTrang, k.capNhat[0].thayTheBoi, k.capNhat[0].ghiChu, k.capNhat[0].datLai],
    ['can_kiem_chung', null, null, true])
})
test('không có trong đăng ký và đã ở mặc định → không ghi', () => {
  const k = keHoachHieuLuc([tl({ nguon: 'b.pdf', tinhTrangHieuLuc: 'can_kiem_chung' })], { 'a.pdf': { tinhTrang: 'con_hieu_luc' } })
  assert.equal(k.capNhat.length, 0)
  assert.equal(k.khongCoTrongDangKy, 1)
})
test('giá trị sai → bỏ qua, không ghi', () => {
  const k = keHoachHieuLuc([tl({})], { 'a.pdf': { tinhTrang: 'het_hieu_luc_mot_phan' } })
  assert.equal(k.capNhat.length, 0)
  assert.equal(k.saGiaTri, 1)
})
test('bảng đăng ký rỗng → ném lỗi, không đặt lại hàng loạt', () => {
  assert.throws(() => keHoachHieuLuc([tl({})], {}))
})
