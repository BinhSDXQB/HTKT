import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chuanHoaBienBan, kiemTraBienBan, kiemTraTrinhTheoBienBan, thongKeThamDu, bienBanHopLe, type NguoiTrieuTap, type BienBanHop } from './bien-ban-hop.ts'

const ds: NguoiTrieuTap[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ canBoId: id, hoTen: `Người ${id.toUpperCase()}`, chucVu: 'Chuyên viên', vaiTro: 'THANH_VIEN' }))
const coMatHet = (xs: NguoiTrieuTap[]) => Object.fromEntries(xs.map((d) => [`td_${d.canBoId}`, 'CO_MAT']))
const day = (them: Record<string, unknown> = {}) => ({ ...coMatHet(ds), ngayHop: '2026-12-10', gioBatDau: '08:00', chuTriId: 'a', thuKyId: 'b', tanThanh: '6', khongTanThanh: '0', ...them })
const chuan = (raw: Record<string, unknown>, xs = ds): BienBanHop => { const r = chuanHoaBienBan(raw, 'PHONG', xs); assert.ok(r.ok, r.ok ? '' : r.loi); return (r as { giaTri: BienBanHop }).giaTri }

test('biên bản đủ thành phần, đủ nội dung → hợp lệ; thành phần lấy từ máy chủ, bỏ người lạ', () => {
  const bb = chuan({ ...day(), td_la: 'CO_MAT' })
  assert.equal(bb.thanhVien.length, 6)
  assert.ok(!bb.thanhVien.some((x) => x.canBoId === 'la'))
  assert.equal(bienBanHopLe(bb, ds), true)
})

test('không mặc định "có mặt": thiếu trạng thái tham dự của một người → từ chối', () => {
  const raw: Record<string, unknown> = day(); delete raw.td_f
  const r = chuanHoaBienBan(raw, 'PHONG', ds)
  assert.ok(!r.ok && /Chưa chọn trạng thái tham dự của Người F/.test(r.loi))
})

test('chưa chốt: thiếu người trong thành phần (mới chuyển đến) → lỗi; đã chốt → chỉ cảnh báo', () => {
  const bb = chuan(day({ tanThanh: '5' }), ds.slice(0, 5))
  assert.ok(kiemTraBienBan(bb, ds).some((x) => x.mucDo === 'LOI' && /thiếu Người F/.test(x.thongDiep)))
  const chot: BienBanHop = { ...bb, chot: { luc: 'x', boi: 'u', yKien: [] } }
  const v = kiemTraBienBan(chot, ds)
  assert.ok(!v.some((x) => x.mucDo === 'LOI') && v.some((x) => x.mucDo === 'CANH_BAO' && /sau cuộc họp/.test(x.thongDiep)))
})

test('chủ trì/thư ký phải có mặt, khác nhau; người lạ làm chủ trì bị từ chối', () => {
  assert.equal(chuanHoaBienBan(day({ chuTriId: 'zz' }), 'PHONG', ds).ok, false)
  const bb = chuan(day({ td_a: 'VANG_CO_LY_DO', ly_a: 'Ốm', thuKyId: 'a', tanThanh: '5' }))
  const v = kiemTraBienBan(bb, ds).filter((x) => x.mucDo === 'LOI').map((x) => x.thongDiep)
  assert.ok(v.some((t) => /chủ trì phải có mặt/.test(t)))
  assert.ok(v.some((t) => /hai người khác nhau/.test(t)))
})

test('đơn vị chỉ 1 người có mặt: chủ trì kiêm thư ký chỉ cảnh báo', () => {
  const mot = ds.slice(0, 1)
  const bb = chuan({ ...coMatHet(mot), ngayHop: '2026-12-10', chuTriId: 'a', thuKyId: 'a', tanThanh: '1' }, mot)
  const v = kiemTraBienBan(bb, mot)
  assert.ok(!v.some((x) => x.mucDo === 'LOI') && v.some((x) => /kiêm thư ký/.test(x.thongDiep)))
})

test('thông qua: bắt buộc; không vượt số có mặt; KHÔNG quá nửa tán thành → biên bản chưa thông qua (lỗi)', () => {
  assert.ok(kiemTraBienBan(chuan(day({ tanThanh: '', khongTanThanh: '' })), ds).some((x) => x.mucDo === 'LOI' && /biểu quyết thông qua/.test(x.thongDiep)))
  assert.ok(kiemTraBienBan(chuan(day({ td_f: 'VANG_CO_LY_DO', ly_f: 'Công tác', tanThanh: '6' })), ds).some((x) => x.mucDo === 'LOI' && /vượt số người có mặt/.test(x.thongDiep)))
  assert.ok(kiemTraBienBan(chuan(day({ tanThanh: '0', khongTanThanh: '6' })), ds).some((x) => x.mucDo === 'LOI' && /CHƯA được thông qua/.test(x.thongDiep)))
  assert.ok(kiemTraBienBan(chuan(day({ tanThanh: '3', khongTanThanh: '3' })), ds).some((x) => x.mucDo === 'LOI' && /CHƯA được thông qua/.test(x.thongDiep)))
  assert.equal(bienBanHopLe(chuan(day({ tanThanh: '4', khongTanThanh: '2' })), ds), true)
  assert.equal(chuanHoaBienBan(day({ tanThanh: '-1' }), 'PHONG', ds).ok, false)
})

test('có mặt dưới 2/3 chỉ CẢNH BÁO (không có căn cứ số tối thiểu); người được đánh giá vắng → cảnh báo', () => {
  const bb = chuan(day({ td_c: 'VANG_CO_LY_DO', ly_c: 'Nghỉ phép', td_d: 'VANG_KHONG_LY_DO', td_e: 'VANG_CO_LY_DO', tanThanh: '3' }))
  const v = kiemTraBienBan(bb, ds, ['c'])
  assert.equal(thongKeThamDu(bb).coMat, 3)
  assert.ok(v.some((x) => x.mucDo === 'CANH_BAO' && /dưới 2\/3/.test(x.thongDiep)))
  assert.ok(v.some((x) => x.mucDo === 'CANH_BAO' && /Người E vắng có lý do nhưng chưa ghi lý do/.test(x.thongDiep)))
  assert.ok(v.some((x) => x.mucDo === 'CANH_BAO' && /Người C được đánh giá/.test(x.thongDiep)))
  assert.equal(bienBanHopLe(bb, ds, ['c']), true) // cảnh báo không chặn
})

test('họp lãnh đạo Sở: bắt buộc đại diện cấp ủy; chỉ trưởng đơn vị được góp ý bằng văn bản và phải ghi số văn bản', () => {
  const ld: NguoiTrieuTap[] = [
    { canBoId: 'gd', hoTen: 'Giám đốc', chucVu: 'Giám đốc', vaiTro: 'LANH_DAO' },
    { canBoId: 'pgd', hoTen: 'Phó Giám đốc', chucVu: 'Phó Giám đốc', vaiTro: 'LANH_DAO' },
    { canBoId: 'tp1', hoTen: 'Trưởng phòng 1', chucVu: 'Trưởng phòng', vaiTro: 'TRUONG_DON_VI' },
  ]
  const raw = { ...coMatHet(ld), ngayHop: '2026-12-12', chuTriId: 'gd', thuKyId: 'pgd', tanThanh: '2' }
  assert.equal(chuanHoaBienBan({ ...raw, td_pgd: 'Y_KIEN_VAN_BAN', ly_pgd: 'CV 1' }, 'LANH_DAO_SO', ld).ok, false)
  assert.equal(chuanHoaBienBan({ ...raw, td_tp1: 'Y_KIEN_VAN_BAN' }, 'LANH_DAO_SO', ld).ok, false) // thiếu số văn bản
  const r = chuanHoaBienBan({ ...raw, td_tp1: 'Y_KIEN_VAN_BAN', ly_tp1: 'Văn bản số 12/PHTKT ngày 08/12/2026' }, 'LANH_DAO_SO', ld)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.ok(kiemTraBienBan(r.giaTri, ld).some((x) => x.mucDo === 'LOI' && /đại diện cấp ủy/.test(x.thongDiep)))
  const co = chuanHoaBienBan({ ...raw, td_tp1: 'Y_KIEN_VAN_BAN', ly_tp1: 'VB 12', daiDienCapUy: 'Đ/c X, Bí thư Chi bộ' }, 'LANH_DAO_SO', ld)
  assert.ok(co.ok && bienBanHopLe(co.giaTri, ld))
  const phong = chuanHoaBienBan({ ...day(), daiDienCapUy: 'x' }, 'PHONG', ds)
  assert.ok(phong.ok && phong.giaTri.daiDienCapUy === null)
})

test('họp lãnh đạo đơn vị sự nghiệp có đơn vị cấu thành: bắt buộc đại diện tổ chức chính trị - xã hội (NĐ 233 Đ15 k2)', () => {
  const ld: NguoiTrieuTap[] = [{ canBoId: 'gdtt', hoTen: 'GĐ Trung tâm', chucVu: 'Giám đốc', vaiTro: 'LANH_DAO' }, { canBoId: 'tpb', hoTen: 'Trưởng phòng B', chucVu: 'Trưởng phòng', vaiTro: 'TRUONG_DON_VI' }]
  const r = chuanHoaBienBan({ ...coMatHet(ld), ngayHop: '2026-12-12', chuTriId: 'gdtt', thuKyId: 'tpb', tanThanh: '2', daiDienCapUy: 'Bí thư' }, 'LANH_DAO_DON_VI', ld)
  assert.ok(r.ok && kiemTraBienBan(r.giaTri, ld).some((x) => x.mucDo === 'LOI' && /chính trị - xã hội/.test(x.thongDiep)))
})

test('trình theo biên bản: phải chốt, có tên người được đánh giá và có ý kiến trong bản chốt', () => {
  const bb = chuan(day())
  assert.ok(kiemTraTrinhTheoBienBan(bb, ds, 'c').some((x) => /chưa được chốt/.test(x.thongDiep)))
  const chot: BienBanHop = { ...bb, chot: { luc: 'x', boi: 'u', yKien: [{ canBoId: 'c', hoTen: 'Người C', chucVu: null, tongDiem: 80, tuNhanMuc: null, yKien: 'Tốt.', bieuQuyet: null, mucTapTheDeXuat: null }] } }
  assert.deepEqual(kiemTraTrinhTheoBienBan(chot, ds, 'c'), [])
  assert.ok(kiemTraTrinhTheoBienBan(chot, ds, 'd').some((x) => /chưa có ý kiến/.test(x.thongDiep)))
  assert.ok(kiemTraTrinhTheoBienBan(chot, ds, 'moiden').some((x) => /không có trong biên bản/.test(x.thongDiep)))
  assert.ok(kiemTraTrinhTheoBienBan(null, ds, 'c').length > 0)
})

test('chưa lập biên bản → lỗi; ngày/giờ sai định dạng bị từ chối', () => {
  assert.ok(kiemTraBienBan(null, ds).some((x) => x.mucDo === 'LOI'))
  assert.equal(chuanHoaBienBan(day({ ngayHop: '10/12/2026' }), 'PHONG', ds).ok, false)
  assert.equal(chuanHoaBienBan(day({ gioBatDau: '25:00' }), 'PHONG', ds).ok, false)
})
