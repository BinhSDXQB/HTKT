// Đầu ra hồ sơ cán bộ khi thiếu quyền nhạy cảm (B0 — S11/Q4): dữ liệu vào có ĐỦ trường nhạy cảm,
// đầu ra không được chứa bất kỳ giá trị nào trong số đó. Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hoSoCongVu } from './ho-so-cong-vu.ts'

// Bản ghi giả, đủ các trường mà truy vấn ho_so_can_bo thực tế lấy về
const gia = (hoTen: string, nam: number) => ({
  hoTen, soDienThoai: '0912345678', email: `${hoTen.split(' ').pop()}@vd.vn`,
  chucDanh: { ten: 'Chuyên viên' }, toChuc: { ten: 'Phòng HTKT' },
  cccd: '045199000123', ngaySinh: new Date(Date.UTC(nam, 4, 17)),
  heSoLuong: 4.98, phuCap: 0.3, vuotKhung: 7, ngayNangLuong: new Date(Date.UTC(2024, 0, 1)),
  ngayNangLuongKeTiep: new Date(Date.UTC(2027, 0, 1)), ngayVeHuu: new Date(Date.UTC(nam + 62, 4, 17)),
})

const CAM = (nam: number) => [
  '045199000123', String(nam), '17/5', '17/05', '4,98', '4.98', '0,3', '7%', '2027', String(nam + 62),
  'Hệ số', 'Phụ cấp', 'CCCD', 'Ngày sinh', 'nghỉ hưu:',
]

test('một người: chỉ có tên, chức danh, đơn vị, SĐT, email', () => {
  const kq = hoSoCongVu([gia('Nguyễn Văn A', 1975)], 'Nguyễn Văn A')
  for (const s of CAM(1975)) assert.ok(!kq.includes(s), `lộ "${s}"`)
  for (const s of ['Nguyễn Văn A', 'Chuyên viên', 'Phòng HTKT', '0912345678', 'A@vd.vn']) assert.ok(kq.includes(s), `thiếu "${s}"`)
})

test('trùng tên: danh sách KHÔNG kèm năm sinh, gợi ý đơn vị/chức danh', () => {
  const kq = hoSoCongVu([gia('Lê Văn B', 1970), gia('Lê Văn B', 1985)], 'Lê Văn B')
  for (const s of [...CAM(1970), ...CAM(1985)]) assert.ok(!kq.includes(s), `lộ "${s}"`)
  assert.ok(!/năm sinh|sinh năm/i.test(kq.split('\n\n')[0]), 'phần danh sách không được nhắc năm sinh')
  assert.ok(kq.includes('đơn vị/chức danh'))
})
