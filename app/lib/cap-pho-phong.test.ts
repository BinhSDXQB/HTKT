import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DINH_MUC_CAP_PHO_PHONG,
  doiChieuCapPhoPhong,
  laCapPhoPhong,
  type CanBoDoiChieu,
} from './cap-pho-phong.ts'

const PTP = 'Phó Trưởng phòng'

function capPho(toChucMa: string, soNguoi: number, chucVu = PTP): CanBoDoiChieu[] {
  return Array.from({ length: soNguoi }, () => ({ toChucMa, chucVu, doiTuong: 'CONG_CHUC' }))
}

/** Hiện trạng theo công văn: VP 1, QLKCHT 3, HTKT 2, các phòng khác đủ. */
function hienTrangTheoCongVan(): CanBoDoiChieu[] {
  return DINH_MUC_CAP_PHO_PHONG.flatMap((dm) => {
    if (dm.ma === 'VAN_PHONG_SO') return capPho(dm.ma, 1, 'Phó Chánh Văn phòng')
    if (dm.ma === 'PHONG_QLKCHT') return capPho(dm.ma, 3)
    if (dm.ma === 'PHONG_HTKT') return capPho(dm.ma, 2)
    return capPho(dm.ma, dm.theoBienChe + dm.tangThem)
  })
}

test('định mức khớp công văn: 11 phòng, 11 theo biên chế + 9 tăng thêm cho 7 phòng = 20', () => {
  assert.equal(DINH_MUC_CAP_PHO_PHONG.length, 11)
  assert.equal(DINH_MUC_CAP_PHO_PHONG.reduce((t, d) => t + d.theoBienChe, 0), 11)
  assert.equal(DINH_MUC_CAP_PHO_PHONG.reduce((t, d) => t + d.tangThem, 0), 9)
  assert.equal(DINH_MUC_CAP_PHO_PHONG.filter((d) => d.tangThem > 0).length, 7)
})

test('hiện trạng theo công văn: Văn phòng thiếu 2, QLKCHT và HTKT mỗi phòng thừa 1', () => {
  const kq = doiChieuCapPhoPhong(hienTrangTheoCongVan())
  assert.equal(kq.tongDinhMuc, 20)
  assert.equal(kq.tongThucTe, 20)
  assert.equal(kq.soPhongThua, 2)
  assert.equal(kq.soPhongThieu, 1)
  assert.equal(kq.soNguoiThua, 2)
  assert.equal(kq.soNguoiThieu, 2)
  assert.deepEqual(kq.dong.filter((d) => d.trangThai === 'THUA').map((d) => d.ma), ['PHONG_QLKCHT', 'PHONG_HTKT'])
  assert.deepEqual(kq.dong.filter((d) => d.trangThai === 'THIEU').map((d) => [d.ma, d.chenhLech]), [['VAN_PHONG_SO', -2]])
})

test('không tính trưởng phòng, Chánh Văn phòng, phó đơn vị sự nghiệp vào cấp phó phòng', () => {
  assert.equal(laCapPhoPhong({ chucVu: 'Trưởng phòng' }), false)
  assert.equal(laCapPhoPhong({ chucVu: 'Chánh Văn phòng' }), false)
  assert.equal(laCapPhoPhong({ chucVu: 'Phó Giám đốc' }), false)
  assert.equal(laCapPhoPhong({ chucVu: null, chucDanhTen: null }), false)
  assert.equal(laCapPhoPhong({ chucVu: '  phó trưởng phòng phụ trách ' }), true)
  assert.equal(laCapPhoPhong({ chucDanhTen: 'Phó Chánh Văn phòng' }), true)
})

test('không tính cấp phó ở đơn vị ngoài 11 phòng', () => {
  const kq = doiChieuCapPhoPhong(capPho('VIEN_QHXD', 2))
  assert.equal(kq.tongThucTe, 0)
})

test('phòng không có cán bộ nào vẫn hiện và báo thiếu', () => {
  const kq = doiChieuCapPhoPhong([])
  assert.equal(kq.dong.length, 11)
  assert.equal(kq.soPhongThieu, 11)
  assert.equal(kq.soNguoiThieu, 20)
})

test('phòng từ 10 công chức trở lên được đánh dấu cần rà lại định mức', () => {
  const duoiNguong = Array.from({ length: 9 }, () => ({ toChucMa: 'PHONG_HTKT', doiTuong: 'CONG_CHUC' }))
  const duNguong = [...duoiNguong, { toChucMa: 'PHONG_HTKT', doiTuong: 'CONG_CHUC' }]
  const nguoiLaoDong = [...duoiNguong, { toChucMa: 'PHONG_HTKT', doiTuong: 'NGUOI_LAO_DONG' }]
  const dong = (ds: CanBoDoiChieu[]) => doiChieuCapPhoPhong(ds).dong.find((d) => d.ma === 'PHONG_HTKT')
  assert.equal(dong(duoiNguong)?.canRaLaiDinhMuc, false)
  assert.equal(dong(duNguong)?.canRaLaiDinhMuc, true)
  assert.equal(dong(nguoiLaoDong)?.canRaLaiDinhMuc, false)
})
