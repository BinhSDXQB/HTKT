import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  oPhanA, chuanHoaPhanA, chuanHoaDongM04, chuanHoaBangIII, chuanHoaMucQuy, chuanHoaDiemTapThe,
  kpiTuMau04, tongDiemTapThe, lapMau05, lapMau06, tyLe, O_MAU_01, type DongTongHop,
} from './bieu-mau-du-lieu.ts'

test('phần A: 2A/2B có 6 mục ưu điểm, 2C có 3; chỉ nhận ô có trong mẫu', () => {
  assert.equal(oPhanA('2B').filter((o) => o.ma.startsWith('A_I_')).length, 6)
  assert.equal(oPhanA('2C').filter((o) => o.ma.startsWith('A_I_')).length, 3)
  const r = chuanHoaPhanA({ A_I_1: 'Tốt', A_I_5: 'x', la: 'chèn khoá lạ' }, oPhanA('2C'))
  assert.deepEqual(r, { A_I_1: 'Tốt' })
  assert.equal(O_MAU_01.length, 10)
})

test('Mẫu 04: chuẩn hoá dòng, bỏ dòng trống, chặn số sai và hoàn thành > giao', () => {
  const ok = chuanHoaDongM04([{ nhiemVu: 'Thẩm định', diemDanhMuc: '100', soLuong: '1', hoanThanhThucTe: '1', soLanChinhSua: '0', soNgayCham: '4' }, { nhiemVu: '' }])
  assert.equal(ok.ok && ok.giaTri.length, 1)
  assert.equal(chuanHoaDongM04([{ nhiemVu: 'x', soLuong: '1', hoanThanhThucTe: '2' }]).ok, false)
  assert.equal(chuanHoaDongM04([{ nhiemVu: 'x', diemDanhMuc: 'abc' }]).ok, false)
  assert.equal(chuanHoaDongM04([{ soLuong: '3' }]).ok, false) // có số mà không ghi nhiệm vụ
})

test('Mẫu 04: điểm KPI tự tính đúng ví dụ bản gốc (9,475 + 86,7)', () => {
  const r = (diemDanhMuc: number, soLuong: number, soLanChinhSua: number, soNgayCham: number) => ({ nhiemVu: 'x', diemDanhMuc, soLuong, hoanThanhThucTe: soLuong, soLanChinhSua, soNgayCham })
  const k = kpiTuMau04({
    A: [r(100, 1, 0, 4), r(300, 1, 1, 0), r(400, 1, 1, 0), r(100, 2, 0, 0), r(200, 2, 1, 1), r(300, 1, 0, 0), r(100, 1, 0, 0), r(200, 1, 0, 0)],
    B: [r(200, 2, 1, 0), r(100, 2, 0, 1), r(200, 2, 0, 0)],
  })
  assert.equal(Math.round(k.tong! * 1000) / 1000, 96.175)
  assert.equal(kpiTuMau04({ A: [], B: [] }).tong, null)
})

test('bảng III và mức quý: chặn số vượt tổng; mức lạ bị bỏ', () => {
  assert.equal(chuanHoaBangIII({ A_tong: '5', A_vuot: '6' }).ok, false)
  const b = chuanHoaBangIII({ A_tong: '5', A_vuot: '2', B_tong: '' })
  assert.equal(b.ok && b.giaTri.A.vuot, 2)
  assert.deepEqual(chuanHoaMucQuy({ mucQuy_I: 'HOAN_THANH_TOT_NHIEM_VU', mucQuy_II: 'LA' }), { I: 'HOAN_THANH_TOT_NHIEM_VU', II: null })
})

test('tập thể: 6 tiêu chí ≤5, KPI A ≤10, B ≤90; tổng = chung + KPI×70/100', () => {
  assert.equal(chuanHoaDiemTapThe({ tc_1: '6' }).ok, false)
  assert.equal(chuanHoaDiemTapThe({ kpiA: '11' }).ok, false)
  const d = chuanHoaDiemTapThe({ tc_1: '5', tc_2: '5', tc_3: '4', tc_4: '5', tc_5: '5', tc_6: '4', kpiA: '9', kpiB: '85' })
  assert.ok(d.ok)
  if (d.ok) assert.deepEqual(tongDiemTapThe(d.giaTri), { chung: 28, nhiemVu: 65.8, tong: 93.8 })
})

test('Mẫu 05/06: đếm theo đối tượng và chức vụ, chỉ mức đã có; ghi chú lý do không hoàn thành', () => {
  const ds: DongTongHop[] = [
    { hoTen: 'A', viTri: 'TP', doiTuong: 'CONG_CHUC', laLanhDao: true, muc: 'HOAN_THANH_TOT_NHIEM_VU' },
    { hoTen: 'B', viTri: 'CV', doiTuong: 'CONG_CHUC', laLanhDao: false, muc: 'HOAN_THANH_NHIEM_VU' },
    { hoTen: 'C', viTri: 'CV', doiTuong: 'CONG_CHUC', laLanhDao: false, muc: 'KHONG_HOAN_THANH_NHIEM_VU', ghiChu: 'vi phạm' },
    { hoTen: 'D', viTri: 'VC', doiTuong: 'VIEN_CHUC', laLanhDao: false, muc: null },
  ]
  const m5 = lapMau05(ds)
  assert.equal(m5[0].tong, 1)
  assert.equal(m5[1].tong, 2)
  assert.equal(m5[1].theoMuc.KHONG_HOAN_THANH_NHIEM_VU, 1)
  assert.match(m5[1].ghiChu, /C: vi phạm/)
  const m6 = lapMau06(ds)
  assert.equal(m6[1].tong, 1)
  assert.equal(m6[1].theoMuc.HOAN_THANH_NHIEM_VU, 0) // chưa có mức thì không tính vào mức nào
  assert.equal(tyLe(1, 3), '33,3')
})

import { chuanHoaHop, coNhanXetTapThe } from './bieu-mau-du-lieu.ts'
import { kiemTraHoSo } from './kiem-tra.ts'

test('họp tập thể phòng: bắt buộc ý kiến; phiếu không vượt số người dự họp', () => {
  assert.equal(coNhanXetTapThe({}), false)
  assert.equal(coNhanXetTapThe({ hopTapThe: { yKien: '  ' } }), false)
  assert.equal(coNhanXetTapThe({ hopTapThe: { yKien: 'Tập thể thống nhất.' } }), true)
  assert.equal(chuanHoaHop({ soNguoiDuHop: '5', phieu_HOAN_THANH_TOT_NHIEM_VU: '4', phieu_HOAN_THANH_NHIEM_VU: '2' }).ok, false)
  assert.equal(chuanHoaHop({ ngayHop: '18/11/2026' }).ok, false)
  const r = chuanHoaHop({ ngayHop: '2026-11-18', soNguoiDuHop: '6', yKien: 'x', phieu_HOAN_THANH_TOT_NHIEM_VU: '5', mucTapTheDeXuat: 'HOAN_THANH_TOT_NHIEM_VU' })
  assert.ok(r.ok && r.giaTri.mucTapTheDeXuat === 'HOAN_THANH_TOT_NHIEM_VU' && r.giaTri.bieuQuyet?.HOAN_THANH_TOT_NHIEM_VU === 5)
})

test('cùng điểm nhưng mức đề xuất cao hơn mức tập thể phòng đề xuất → lỗi; thấp hơn → cảnh báo', () => {
  const co = { nam: 2026, canBo: { id: 'a', hoTen: 'A', laNguoiDungDau: false, laLanhDaoQuanLy: false }, nhanXet: [], congViec: [], khoaHoc: [] }
  const cao = kiemTraHoSo({ ...co, mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU', mucTapTheDeXuat: 'HOAN_THANH_TOT_NHIEM_VU' })
  assert.ok(cao.some((v) => v.mucDo === 'LOI' && /tập thể phòng/.test(v.thongDiep)))
  const thap = kiemTraHoSo({ ...co, mucDeXuat: 'HOAN_THANH_NHIEM_VU', mucTapTheDeXuat: 'HOAN_THANH_TOT_NHIEM_VU' })
  assert.ok(thap.some((v) => v.mucDo === 'CANH_BAO' && /giải trình/.test(v.thongDiep)))
})
