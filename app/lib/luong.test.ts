// Test hồi quy lib/luong.ts. Chạy: npm test  (node --test, Node 24 strip-types, không cần thư viện).
// Giá trị mong đợi được TÍNH TAY từ luật (NĐ 161/2026, Luật Thuế TNCN 109/2025...), không chép từ đầu ra của code.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LUONG_CO_SO, chuanHoaPhanTramVuotKhung, fmtSo, fmtVND, laLuongKhoan,
  tinhThueTNCNThang, tinhLuongThucLinh, tinhBangLuongThang,
} from './luong.ts'

const gan = (a: number, b: number, dung = 1) => assert.ok(Math.abs(a - b) <= dung, `${a} ≉ ${b}`)

test('lương cơ sở theo NĐ 161/2026', () => {
  assert.equal(LUONG_CO_SO, 2_530_000)
})

test('chuanHoaPhanTramVuotKhung: sửa phân số kiểu Excel, giữ số nguyên (lỗi 24/9/26)', () => {
  assert.equal(chuanHoaPhanTramVuotKhung(0.09), 9)
  assert.equal(chuanHoaPhanTramVuotKhung(0.5), 50)
  assert.equal(chuanHoaPhanTramVuotKhung(9), 9)
  assert.equal(chuanHoaPhanTramVuotKhung(5.5), 6)      // làm tròn phần lẻ
  assert.equal(chuanHoaPhanTramVuotKhung(0), null)
  assert.equal(chuanHoaPhanTramVuotKhung(null), null)
  assert.equal(chuanHoaPhanTramVuotKhung(undefined), null)
  assert.equal(chuanHoaPhanTramVuotKhung(Number.NaN), null)
  assert.equal(chuanHoaPhanTramVuotKhung(-3), -3)      // cố ý KHÔNG xoá giá trị âm (xem ghi chú trong lib)
})

test('fmtSo / fmtVND: số kiểu Việt Nam', () => {
  assert.equal(fmtSo(4.98), '4,98')
  assert.equal(fmtSo(null), '—')
  assert.equal(fmtSo(undefined), '—')
  assert.equal(fmtSo(Number.NaN), '—')
  assert.equal(fmtVND(8_190_000), '8.190.000đ')
})

test('laLuongKhoan: ngưỡng 100.000', () => {
  assert.equal(laLuongKhoan(99_999), false)
  assert.equal(laLuongKhoan(100_000), true)
  assert.equal(laLuongKhoan(null), false)
})

test('tinhThueTNCNThang: biểu 5 bậc lũy tiến từng phần', () => {
  assert.equal(tinhThueTNCNThang(0), 0)
  assert.equal(tinhThueTNCNThang(-5), 0)
  assert.equal(tinhThueTNCNThang(10_000_000), 500_000)        // 10tr × 5%
  assert.equal(tinhThueTNCNThang(30_000_000), 2_500_000)      // + 20tr × 10%
  assert.equal(tinhThueTNCNThang(60_000_000), 8_500_000)      // + 30tr × 20%
  assert.equal(tinhThueTNCNThang(100_000_000), 20_500_000)    // + 40tr × 30%
  assert.equal(tinhThueTNCNThang(110_000_000), 24_000_000)    // + 10tr × 35%
})

test('tinhLuongThucLinh: công chức hệ số 2,34 vượt khung 10%', () => {
  const r = tinhLuongThucLinh({ doiTuong: 'CONG_CHUC', heSoLuong: 2.34, vuotKhung: 10 })
  assert.equal(r.apDung, true)
  gan(r.luongNgachBac, 5_920_200)   // 2,34 × 2.530.000
  gan(r.vuotKhungTien, 592_020)     // 10% lương ngạch bậc
})

test('tinhLuongThucLinh: người lao động không quy đổi theo hệ số', () => {
  assert.equal(tinhLuongThucLinh({ doiTuong: 'NGUOI_LAO_DONG', heSoLuong: 3 }).apDung, false)
})

test('bảng lương: công chức hệ số 3 — có PC công vụ 25%, KHÔNG đóng BHTN', () => {
  const b = tinhBangLuongThang({ doiTuong: 'CONG_CHUC', heSoLuong: 3, loaiToChuc: 'PHONG' })
  gan(b.tongThuNhap, 9_487_500)     // 7.590.000 × 1,25
  gan(b.luongDongBH, 7_590_000)     // BH không tính PC công vụ
  assert.equal(b.khauTru.some(d => d.ma === 'bhtn'), false)
  assert.equal(b.khauTru.find(d => d.ma === 'bhxh')?.soTien, 607_200)
  assert.equal(b.khauTru.find(d => d.ma === 'bhyt')?.soTien, 113_850)
  assert.equal(b.thueTNCN, 0)       // dưới mức giảm trừ bản thân
  gan(b.thucLinh, 8_766_450)
})

test('bảng lương: viên chức hệ số 3 — không PC công vụ, có BHTN 1%', () => {
  const b = tinhBangLuongThang({ doiTuong: 'VIEN_CHUC', heSoLuong: 3, loaiToChuc: 'PHONG' })
  gan(b.tongThuNhap, 7_590_000)
  assert.equal(b.thuNhap.some(d => d.ma === 'pcCongVu'), false)
  assert.equal(b.khauTru.find(d => d.ma === 'bhtn')?.soTien, 75_900)
  gan(b.thucLinh, 6_793_050)
})

test('bảng lương: thuế TNCN dương và giảm trừ người phụ thuộc', () => {
  const cc = { doiTuong: 'CONG_CHUC', heSoLuong: 8, loaiToChuc: 'PHONG' }
  const b0 = tinhBangLuongThang(cc)
  gan(b0.tongThuNhap, 25_300_000)
  assert.equal(b0.thuNhapTinhThue, 25_300_000 - 1_922_800 - 15_500_000)   // 7.877.200
  assert.equal(b0.thueTNCN, 393_860)                                       // 5%
  const b1 = tinhBangLuongThang({ ...cc, soNguoiPhuThuoc: 1 })
  assert.equal(b1.thuNhapTinhThue, 7_877_200 - 6_200_000)                  // 1.677.200
  assert.equal(b1.thueTNCN, 83_860)
})

test('bảng lương: trần đóng BH = 20 × lương cơ sở', () => {
  const b = tinhBangLuongThang({ doiTuong: 'CONG_CHUC', heSoLuong: 30, loaiToChuc: 'PHONG' })
  assert.equal(b.luongDongBH, 20 * LUONG_CO_SO)   // 50.600.000
})

test('bảng lương: NLĐ lương khoán không cộng PC công vụ', () => {
  const b = tinhBangLuongThang({ doiTuong: 'NGUOI_LAO_DONG', heSoLuong: 8_000_000, loaiToChuc: 'PHONG' })
  assert.equal(b.tongThuNhap, 8_000_000)
  assert.equal(b.thuNhap.some(d => d.ma === 'pcCongVu'), false)
  assert.match(b.doiTuongNhan, /khoán/)
})

test('bảng lương: thiếu hệ số → không áp dụng', () => {
  const b = tinhBangLuongThang({ doiTuong: 'CONG_CHUC', heSoLuong: null })
  assert.equal(b.apDung, false)
  assert.equal(b.thucLinh, 0)
})
