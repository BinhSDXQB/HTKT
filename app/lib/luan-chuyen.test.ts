import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lapKeHoach, ngayHieuLuc, ngayTruoc, moTaLuanChuyen } from './luan-chuyen.ts'

const x = (cu: string, moi: string, cdCu = 'CV', cdMoi = 'CV') => ({ toChucIdCu: cu, toChucIdMoi: moi, chucDanhIdCu: cdCu, chucDanhIdMoi: cdMoi })

test('luân chuyển: đổi phòng → tài khoản, cờ lãnh đạo, phân công, quá trình công tác đều đi theo', () => {
  const k = lapKeHoach(x('HTKT', 'QLVT'), true, { taiKhoanToChucId: 'HTKT', phanCongKhop: false })
  assert.deepEqual(k, { doiPhong: true, doiChucDanh: false, capNhatTaiKhoan: true, tatCoLanhDao: true, doiPhanCong: true, ghiQuaTrinh: true })
})

test('luân chuyển: lưu lại hồ sơ KHÔNG đổi nhưng tài khoản đang lệch (ca Trần Văn Bình) → sửa tài khoản, không ghi quá trình', () => {
  const k = lapKeHoach(x('QLVT', 'QLVT'), true, { taiKhoanToChucId: 'HTKT', phanCongKhop: true })
  assert.equal(k.capNhatTaiKhoan, true)
  assert.equal(k.tatCoLanhDao, true)
  assert.equal(k.ghiQuaTrinh, false)
  assert.equal(k.doiPhanCong, false)
})

test('luân chuyển: phân công chính lệch hồ sơ (ca Trần Trung Thông) → sửa phân công, không ghi quá trình', () => {
  const k = lapKeHoach(x('VP', 'VP'), true, { taiKhoanToChucId: 'VP', phanCongKhop: false })
  assert.equal(k.doiPhanCong, true)
  assert.equal(k.capNhatTaiKhoan, false)
  assert.equal(k.ghiQuaTrinh, false)
})

test('luân chuyển: tài khoản đã ở đúng phòng mới → giữ nguyên cờ lãnh đạo; không có tài khoản → không động', () => {
  const k = lapKeHoach(x('HTKT', 'QLVT'), true, { taiKhoanToChucId: 'QLVT', phanCongKhop: true })
  assert.equal(k.capNhatTaiKhoan, false)
  assert.equal(k.tatCoLanhDao, false)
  assert.equal(k.ghiQuaTrinh, true)
  assert.equal(lapKeHoach(x('HTKT', 'QLVT'), false).capNhatTaiKhoan, false)
  const khongDoi = lapKeHoach(x('A', 'A'), true, { taiKhoanToChucId: 'A', phanCongKhop: true })
  assert.equal(khongDoi.capNhatTaiKhoan || khongDoi.doiPhanCong || khongDoi.ghiQuaTrinh, false)
})

test('luân chuyển: đổi chức danh trong cùng phòng → đổi phân công + ghi quá trình, không động tài khoản', () => {
  const k = lapKeHoach(x('A', 'A', 'CV', 'PTP'), true, { taiKhoanToChucId: 'A', phanCongKhop: false })
  assert.equal(k.doiChucDanh && k.doiPhanCong && k.ghiQuaTrinh, true)
  assert.equal(k.capNhatTaiKhoan, false)
})

test('ngày hiệu lực: theo form, mặc định hôm nay giờ Việt Nam; ngày kết thúc = hôm trước', () => {
  assert.equal(ngayHieuLuc('2026-12-01')!.toISOString().slice(0, 10), '2026-12-01')
  assert.equal(ngayHieuLuc('', new Date('2026-11-17T18:30:00Z'))!.toISOString().slice(0, 10), '2026-11-18') // 01:30 sáng 18/11 giờ VN
  assert.equal(ngayTruoc(new Date(Date.UTC(2026, 0, 1))).toISOString().slice(0, 10), '2025-12-31')
  assert.match(moTaLuanChuyen({ phongCu: 'Phòng HTKT', phongMoi: 'Phòng QLVT' }, lapKeHoach(x('a', 'b'), false)), /từ Phòng HTKT sang Phòng QLVT/)
})

test('ngày hiệu lực: sai định dạng hoặc ngày không có thật → null (báo lỗi, không tự thay)', () => {
  assert.equal(ngayHieuLuc('2026-02-31'), null)
  assert.equal(ngayHieuLuc('01/12/2026'), null)
  assert.equal(ngayHieuLuc('2026-12-01')!.toISOString().slice(0, 10), '2026-12-01')
})
