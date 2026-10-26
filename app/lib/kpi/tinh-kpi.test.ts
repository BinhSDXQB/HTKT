// Tính điểm KPI quý — kiểm thử theo ĐÚNG ví dụ/ngưỡng trong Công văn 9409/SXD-VP. Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TRUC, tinhKpi, mucTheoDiem, gioiHanXuatSac, type NhiemVuKpi, type DauVaoKpi, type MaTruc,
} from './tinh-kpi.ts'

const nv = (truc: MaTruc, o: Partial<NhiemVuKpi> = {}): NhiemVuKpi => ({
  truc, heSo: 1, chon: true, hoanThanh: true, dungHan: true, chatLuongDat: true, vuotMuc: false, ...o,
})
const dv = (nhiemVu: NhiemVuKpi[], o: Partial<DauVaoKpi> = {}): DauVaoKpi => ({
  nhiemVu, laLanhDao: false, d: null, diemChung: 30, ...o,
})
const phu = (m: MaTruc) => TRUC.find((t) => t.ma === m)!.diemToiDa

test('điểm tối đa 6 trục = 35/10/7/8/5/5, cộng đúng 70', () => {
  assert.deepEqual(TRUC.map((t) => t.diemToiDa), [35, 10, 7, 8, 5, 5])
  assert.equal(TRUC.reduce((s, t) => s + t.diemToiDa, 0), 70)
})

test('ngưỡng xếp loại theo tổng điểm: 90 / 70 / 50', () => {
  assert.equal(mucTheoDiem(90), 'HOAN_THANH_XUAT_SAC')
  assert.equal(mucTheoDiem(89.99), 'HOAN_THANH_TOT')
  assert.equal(mucTheoDiem(70), 'HOAN_THANH_TOT')
  assert.equal(mucTheoDiem(69.99), 'HOAN_THANH')
  assert.equal(mucTheoDiem(50), 'HOAN_THANH')
  assert.equal(mucTheoDiem(49.99), 'KHONG_HOAN_THANH')
  assert.equal(mucTheoDiem(89.996), 'HOAN_THANH_XUAT_SAC', 'làm tròn 2 chữ số trước khi so ngưỡng (G5)')
})

test('hoàn thành 100% mọi trục: điểm kết quả = 70, tổng 100 → xuất sắc nếu ≥30% vượt mức', () => {
  const ds = [nv(1, { vuotMuc: true }), nv(2), nv(3), nv(4), nv(5), nv(6)]
  const kq = tinhKpi(dv(ds))
  assert.equal(kq.diemKetQua, 70)
  assert.equal(kq.tongDiem, 100)
  assert.ok(kq.tong.tyLeVuotMuc < 0.3)
  assert.equal(kq.xepLoaiDeXuat, 'HOAN_THANH_TOT', '1/6 vượt mức = 16,7% < 30% → chỉ "tốt"')
  const kq2 = tinhKpi(dv([nv(1, { vuotMuc: true }), nv(2, { vuotMuc: true }), nv(3), nv(4), nv(5), nv(6)]))
  assert.equal(kq2.xepLoaiDeXuat, 'HOAN_THANH_XUAT_SAC', '2/6 = 33% ≥ 30%')
})

test('trục phụ không có nhiệm vụ: toàn bộ điểm chuyển về Trục 1', () => {
  const kq = tinhKpi(dv([nv(1), nv(1)]))
  assert.equal(kq.truc[0].diemToiDaSauChuyen, 70)
  assert.equal(kq.truc[0].diem, 70)
  for (const t of kq.truc.slice(1)) assert.equal(t.diem, 0)
  assert.equal(kq.diemKetQua, 70)
})

test('công thức KPI = (A+B+C+D)/4 cho người lãnh đạo; điểm = KPI × điểm tối đa trục', () => {
  // Trục 1: 2 NV, hoàn thành cả 2, 1 đúng hạn → A=1, B=1, C=0.5; D=1 → KPI=(1+1+.5+1)/4=0.875
  const ds = [nv(1), nv(1, { dungHan: false })]
  const kq = tinhKpi(dv(ds, { laLanhDao: true, d: 1 }))
  assert.equal(kq.truc[0].a, 1)
  assert.equal(kq.truc[0].c, 0.5)
  assert.ok(Math.abs((kq.truc[0].kpi ?? 0) - 0.875) < 1e-12)
  assert.ok(Math.abs(kq.truc[0].diem - 0.875 * 70) < 1e-9)
})

test('người không lãnh đạo: KPI = (A+B+C)/3 (giả định G3)', () => {
  const kq = tinhKpi(dv([nv(1, { dungHan: false })]))
  assert.ok(Math.abs((kq.truc[0].kpi ?? 0) - 2 / 3) < 1e-12)
})

test('"hoàn thành nhiệm vụ": số lượng, chất lượng, D = 100% và tiến độ từ 80% đến dưới 100%', () => {
  // 5 NV, 4 đúng hạn → C = 80%
  const ds = [nv(1), nv(1), nv(1), nv(1), nv(1, { dungHan: false })]
  const kq = tinhKpi(dv(ds, { laLanhDao: true, d: 1, diemChung: 30 }))
  assert.equal(kq.mucToiDaTheoKpi, 'HOAN_THANH')
  // KPI = (1+1+0,8+1)/4 = 95% → 66,5 + 30 = 96,5 điểm: thuộc mức XUẤT SẮC theo điểm
  assert.equal(kq.tongDiem, 96.5)
  assert.equal(kq.mucTheoDiem, 'HOAN_THANH_XUAT_SAC')
  // …nhưng chỉ cần 1/5 nhiệm vụ trễ hạn là điều kiện KPI chỉ còn cho "hoàn thành" (điểm không cứu được)
  assert.equal(kq.xepLoaiDeXuat, 'HOAN_THANH', 'lấy mức thấp hơn của (điểm, điều kiện KPI)')
  assert.ok(kq.canhBao.some((c) => c.includes('chỉ cho phép tối đa')))
})

test('tiến độ dưới 80% → ngoài các mức văn bản quy định → CAN_XEM_XET (giả định G6)', () => {
  const ds = [nv(1), nv(1, { dungHan: false }), nv(1, { dungHan: false }), nv(1, { dungHan: false }), nv(1, { dungHan: false })]
  const kq = tinhKpi(dv(ds, { laLanhDao: true, d: 1 }))
  assert.equal(kq.xepLoaiDeXuat, 'CAN_XEM_XET')
  assert.ok(kq.canhBao.some((c) => c.includes('tiến độ')))
})

test('một nhiệm vụ chưa hoàn thành → không đạt "100% nhiệm vụ" → CAN_XEM_XET; dưới 70% có cảnh báo diện KHT', () => {
  const ds = [nv(1), nv(1), nv(1, { hoanThanh: false, dungHan: null, chatLuongDat: null })]
  const kq = tinhKpi(dv(ds))
  assert.equal(kq.xepLoaiDeXuat, 'CAN_XEM_XET')
  const ds2 = [nv(1), nv(1, { hoanThanh: false, dungHan: false, chatLuongDat: false }), nv(1, { hoanThanh: false, dungHan: false, chatLuongDat: false })]
  assert.ok(tinhKpi(dv(ds2)).canhBao.some((c) => c.includes('dưới 70%')))
})

test('tổng điểm dưới 50 → không hoàn thành', () => {
  const ds = [nv(1, { hoanThanh: false, dungHan: false, chatLuongDat: false })]
  const kq = tinhKpi(dv(ds, { diemChung: 20 }))
  assert.equal(kq.tongDiem, 20)
  assert.equal(kq.xepLoaiDeXuat, 'KHONG_HOAN_THANH')
})

test('chỉ đưa vào quý các nhiệm vụ được chọn; hệ số quy đổi tham gia trọng số', () => {
  const ds = [nv(1), nv(1, { chon: false, hoanThanh: false })]
  assert.equal(tinhKpi(dv(ds)).tong.soNhiemVu, 1)
  // trọng số: NV hệ số 3 hoàn thành, NV hệ số 1 không → A = 3/4
  const kq = tinhKpi(dv([nv(1, { heSo: 3 }), nv(1, { heSo: 1, hoanThanh: false, dungHan: null, chatLuongDat: null })]))
  assert.equal(kq.tong.a, 0.75)
})

test('chưa nhập kết quả/D/điểm chung → daNhapDu=false và có cảnh báo, không âm thầm tính như đã nhập', () => {
  const kq = tinhKpi({ nhiemVu: [nv(1, { hoanThanh: null, dungHan: null, chatLuongDat: null })], laLanhDao: true, d: null, diemChung: null })
  assert.equal(kq.daNhapDu, false)
  assert.ok(kq.canhBao.length >= 3)
})

test('không có nhiệm vụ nào được chọn → KHONG_CO_NHIEM_VU', () => {
  assert.equal(tinhKpi(dv([nv(1, { chon: false })])).xepLoaiDeXuat, 'KHONG_CO_NHIEM_VU')
})

test('Trục 1 không có nhiệm vụ: điểm chuyển về trục có điểm tối đa lớn nhất trong các trục có nhiệm vụ (G7)', () => {
  const kq = tinhKpi(dv([nv(2), nv(4)]))
  assert.equal(kq.truc[1].diemToiDaSauChuyen, 10 + 35 + 7 + 5 + 5)
  assert.equal(kq.truc[3].diemToiDaSauChuyen, 8)
  assert.equal(kq.diemKetQua, 70)
  assert.ok(kq.canhBao.some((c) => c.includes('Trục 1')))
})

test('tối đa 01 cá nhân xuất sắc mỗi tập thể lãnh đạo', () => {
  const ra = gioiHanXuatSac([
    { id: 'tp', xepLoaiDeXuat: 'HOAN_THANH_XUAT_SAC', tongDiem: 98 },
    { id: 'ptp1', xepLoaiDeXuat: 'HOAN_THANH_XUAT_SAC', tongDiem: 95 },
    { id: 'ptp2', xepLoaiDeXuat: 'HOAN_THANH_TOT', tongDiem: 80 },
  ])
  assert.deepEqual(ra.map((r) => r.xepLoai), ['HOAN_THANH_XUAT_SAC', 'HOAN_THANH_TOT', 'HOAN_THANH_TOT'])
  // đồng điểm → không tự chọn
  const hoa = gioiHanXuatSac([
    { id: 'a', xepLoaiDeXuat: 'HOAN_THANH_XUAT_SAC', tongDiem: 95 },
    { id: 'b', xepLoaiDeXuat: 'HOAN_THANH_XUAT_SAC', tongDiem: 95 },
  ])
  assert.ok(hoa.every((r) => r.xepLoai === 'HOAN_THANH_XUAT_SAC' && r.ghiChu?.includes('lãnh đạo quyết định')))
  // chỉ 1 người đủ điều kiện → giữ nguyên
  assert.equal(gioiHanXuatSac([{ id: 'a', xepLoaiDeXuat: 'HOAN_THANH_XUAT_SAC', tongDiem: 95 }])[0].xepLoai, 'HOAN_THANH_XUAT_SAC')
})

test('điểm tối đa trục dùng đúng (kiểm tra tay một trục phụ)', () => {
  const kq = tinhKpi(dv([nv(1), nv(3, { hoanThanh: false, dungHan: false, chatLuongDat: false })]))
  // Trục 3 có NV nhưng không đạt → 0/7; Trục 1 nhận điểm các trục TRỐNG (2,4,5,6 = 28) → tối đa 35+28 = 63
  assert.equal(kq.truc[0].diemToiDaSauChuyen, 35 + 10 + 8 + 5 + 5)
  assert.equal(kq.truc[2].diem, 0)
  assert.equal(kq.truc[2].diemToiDa, phu(3))
  assert.equal(kq.diemKetQua, 63)
})
