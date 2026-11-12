// Test hồi quy lib/nghi-huu.ts. Chạy: npm test  (node --test, Node 24 strip-types).
// Mốc kiểm tra theo Phụ lục I NĐ 135/2020/NĐ-CP (nam sinh 01/1961 → hưu trí từ 01/05/2021; nữ sinh 01/1966 → 01/06/2021).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  tuoiNghiHuuThang, tinhNgayNghiHuu, ngayKetThucLamViec, thangDuTuoi,
  hanLuiToiDa, thoiDiemNghiHuu, tuoiNghiHuuLabel,
} from './nghi-huu.ts'

const d = (y: number, m: number, day = 1) => new Date(Date.UTC(y, m - 1, day))
const ngay = (x: Date | null) => x?.toISOString().slice(0, 10) ?? null

test('tuổi nghỉ hưu NAM theo lộ trình', () => {
  assert.equal(tuoiNghiHuuThang(d(1960, 12), 'NAM'), 60 * 12)        // trước mốc → 60 tuổi
  assert.equal(tuoiNghiHuuThang(d(1961, 1), 'NAM'), 60 * 12 + 3)     // 60t3m
  assert.equal(tuoiNghiHuuThang(d(1966, 3), 'NAM'), 61 * 12 + 9)     // 61t9m
  assert.equal(tuoiNghiHuuThang(d(1966, 4), 'NAM'), 62 * 12)         // trần 62
  assert.equal(tuoiNghiHuuThang(d(1990, 6), 'NAM'), 62 * 12)
})

test('tuổi nghỉ hưu NỮ theo lộ trình', () => {
  assert.equal(tuoiNghiHuuThang(d(1965, 12), 'NU'), 55 * 12)
  assert.equal(tuoiNghiHuuThang(d(1966, 1), 'NU'), 55 * 12 + 4)      // 55t4m
  assert.equal(tuoiNghiHuuThang(d(1975, 4), 'NU'), 59 * 12 + 8)      // 59t8m
  assert.equal(tuoiNghiHuuThang(d(1975, 5), 'NU'), 60 * 12)          // trần 60
})

test('ngày hưởng hưu trí = ngày 01 tháng liền kề sau tháng đủ tuổi', () => {
  assert.equal(ngay(tinhNgayNghiHuu(d(1961, 1, 15), 'NAM')), '2021-05-01')
  assert.equal(ngay(tinhNgayNghiHuu(d(1966, 1, 20), 'NU')), '2021-06-01')
  assert.equal(ngay(tinhNgayNghiHuu(d(1966, 4, 10), 'NAM')), '2028-05-01')
})

test('thời điểm nghỉ hưu (NĐ 135 Đ3 k1) = ngày cuối tháng đủ tuổi, lệch mốc hưởng đúng 1 ngày', () => {
  assert.equal(ngay(ngayKetThucLamViec(d(1961, 1, 15), 'NAM')), '2021-04-30')
  assert.equal(ngay(ngayKetThucLamViec(d(1966, 1, 20), 'NU')), '2021-05-31')
})

test('thangDuTuoi', () => {
  assert.deepEqual(thangDuTuoi(d(1961, 1, 15), 'NAM'), { thang: 4, nam: 2021 })
})

test('thiếu dữ liệu → null, không ném lỗi', () => {
  assert.equal(tinhNgayNghiHuu(null, 'NAM'), null)
  assert.equal(tinhNgayNghiHuu(d(1970, 1), null), null)
  assert.equal(ngayKetThucLamViec(undefined, 'NU'), null)
  assert.equal(thangDuTuoi(null, 'NAM'), null)
  assert.equal(tuoiNghiHuuLabel(null, 'NAM'), null)
})

test('nhãn tuổi nghỉ hưu', () => {
  assert.equal(tuoiNghiHuuLabel(d(1990, 1), 'NAM'), '62 tuổi')
  assert.equal(tuoiNghiHuuLabel(d(1966, 3), 'NAM'), '61 tuổi 9 tháng')
})

test('hanLuiToiDa: trần 1/3/6 tháng theo NĐ 170/2025 Đ61', () => {
  const dk = d(2028, 5, 1)
  assert.equal(ngay(hanLuiToiDa(dk, 'A')), '2028-06-01')
  assert.equal(ngay(hanLuiToiDa(dk, 'B')), '2028-08-01')
  assert.equal(ngay(hanLuiToiDa(dk, 'C')), '2028-11-01')
  assert.equal(hanLuiToiDa(dk, 'X'), null)
  assert.equal(hanLuiToiDa(dk, null), null)
  assert.equal(hanLuiToiDa(null, 'A'), null)
})

test('thoiDiemNghiHuu: DỰ KIẾN tách khỏi ĐÃ QUYẾT ĐỊNH LÙI', () => {
  const duKien = thoiDiemNghiHuu({ ngaySinh: d(1961, 1, 15), gioiTinh: 'NAM' })
  assert.equal(duKien.nguon, 'DU_KIEN')
  assert.equal(duKien.laDuKien, true)
  assert.equal(ngay(duKien.ngay), '2021-05-01')

  const lui = thoiDiemNghiHuu({
    ngaySinh: d(1961, 1, 15), gioiTinh: 'NAM', ngayNghiHuuLui: d(2021, 7, 1), truongHopLui: 'B',
  })
  assert.equal(lui.nguon, 'DA_LUI')
  assert.equal(lui.laDuKien, false)
  assert.equal(ngay(lui.ngay), '2021-07-01')
  assert.equal(ngay(lui.ngayDuKien), '2021-05-01')
  assert.equal(lui.truongHop, 'B')
})

test('thoiDiemNghiHuu: ưu tiên cột ngayVeHuu nếu có; giới tính lạ → không tính', () => {
  assert.equal(ngay(thoiDiemNghiHuu({ ngayVeHuu: d(2030, 1, 1) }).ngay), '2030-01-01')
  assert.equal(thoiDiemNghiHuu({ ngaySinh: d(1970, 1), gioiTinh: 'KHAC' }).ngay, null)
})
