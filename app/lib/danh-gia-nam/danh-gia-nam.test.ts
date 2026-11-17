import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chuyenTrangThai, traVe, duocGhiXepLoaiChinhThuc, noiDungBiKhoa } from './trang-thai.ts'
import { tinhNhomKpi, tinhDongKpi, tongDiemNam, mucToiDaTheoDiem, tongDiemChungToiDa, kiemTraDiemChung } from './tieu-chi.ts'
import { chonMauCaNhan, timMau, DANH_MUC_MAU } from './mau-bieu.ts'
import { tongHop, tongHopTheoNhom, phanLoaiKhoa, tuBanGhi } from './dao-tao.ts'
import { kiemTraHoSo, kiemTraThanhTichTrung, type DauVaoKiemTra } from './kiem-tra.ts'
import { tongHopPhong, duThaoNhanXetTapThe } from './tong-hop-phong.ts'

// ── Quy trình 8 bước ────────────────────────────────────────────────────────
test('quy trình: đi đúng thứ tự, không nhảy cóc, không tự phê duyệt', () => {
  assert.deepEqual(chuyenTrangThai({ tu: 'DU_THAO', vaiTro: 'THU_KY_TONG_HOP', nguoiThaoTacId: 'tk' }), { ok: true, den: 'TU_DANH_GIA' })
  assert.equal(chuyenTrangThai({ tu: 'DU_THAO', vaiTro: 'CAP_PHE_DUYET', nguoiThaoTacId: 'x' }).ok, false)
  // chính chủ tự mở bước tự đánh giá của mình
  assert.deepEqual(chuyenTrangThai({ tu: 'DU_THAO', vaiTro: 'CHINH_CHU', nguoiThaoTacId: 'a', chinhChuId: 'a' }), { ok: true, den: 'TU_DANH_GIA' })
  assert.equal(chuyenTrangThai({ tu: 'TU_DANH_GIA', vaiTro: 'CHINH_CHU', nguoiThaoTacId: 'a', dieuKien: {} }).ok, false)
  assert.equal(chuyenTrangThai({ tu: 'TRINH_PHE_DUYET', vaiTro: 'CAP_PHE_DUYET', nguoiThaoTacId: 'a', chinhChuId: 'a' }).ok, false)
  assert.deepEqual(chuyenTrangThai({ tu: 'TRINH_PHE_DUYET', vaiTro: 'CAP_PHE_DUYET', nguoiThaoTacId: 'gd', chinhChuId: 'a' }), { ok: true, den: 'DA_PHE_DUYET' })
  assert.equal(chuyenTrangThai({ tu: 'LUU_HO_SO', vaiTro: 'THU_KY_TONG_HOP', nguoiThaoTacId: 'x' }).ok, false)
})

test('quy trình: trả về cần lý do; chỉ bước đã phê duyệt mới ghi xếp loại chính thức', () => {
  assert.equal(traVe('HOP_DANH_GIA', '  ').ok, false)
  assert.deepEqual(traVe('HOP_DANH_GIA', 'Thiếu biên bản'), { ok: true, den: 'TONG_HOP' })
  assert.equal(traVe('LUU_HO_SO', 'x').ok, false)
  assert.equal(duocGhiXepLoaiChinhThuc('TRINH_PHE_DUYET'), false)
  assert.equal(duocGhiXepLoaiChinhThuc('DA_PHE_DUYET'), true)
  assert.equal(noiDungBiKhoa('TONG_HOP'), false)
  assert.equal(noiDungBiKhoa('TRINH_PHE_DUYET'), true)
})

// ── Điểm: số liệu trong tệp Mẫu 04 gốc cho 96,175 ───────────────────────────
test('KPI: tái hiện ví dụ Mẫu 04 gốc (nhóm A 9,475; nhóm B 86,7; tổng 96,175)', () => {
  // Cột 14/17 của tệp gốc: chất lượng và tiến độ đã quy đổi; dựng lại từ dòng thô
  const A = tinhNhomKpi([
    { diemDanhMuc: 100, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 0, soNgayCham: 4 },
    { diemDanhMuc: 300, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 1, soNgayCham: 0 },
    { diemDanhMuc: 400, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 1, soNgayCham: 0 },
    { diemDanhMuc: 100, soLuong: 2, hoanThanhThucTe: 2, soLanChinhSua: 0, soNgayCham: 0 },
    { diemDanhMuc: 200, soLuong: 2, hoanThanhThucTe: 2, soLanChinhSua: 1, soNgayCham: 1 },
    { diemDanhMuc: 300, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 0, soNgayCham: 0 },
    { diemDanhMuc: 100, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 0, soNgayCham: 0 },
    { diemDanhMuc: 200, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 0, soNgayCham: 0 },
  ], 10)
  assert.equal(A.tongDiem, 2000)
  assert.equal(A.binhQuan, 1895)
  assert.equal(A.kpi, 0.9475)
  assert.equal(A.diemDat, 9.475)
  const B = tinhNhomKpi([
    { diemDanhMuc: 200, soLuong: 2, hoanThanhThucTe: 2, soLanChinhSua: 1, soNgayCham: 0 },
    { diemDanhMuc: 100, soLuong: 2, hoanThanhThucTe: 2, soLanChinhSua: 0, soNgayCham: 1 },
    { diemDanhMuc: 200, soLuong: 2, hoanThanhThucTe: 2, soLanChinhSua: 0, soNgayCham: 0 },
  ], 90)
  assert.equal(B.tongDiem, 1000)
  assert.equal(Math.round(B.diemDat * 10) / 10, 86.7)
  assert.equal(Math.round((A.diemDat + B.diemDat) * 1000) / 1000, 96.175)
})

test('KPI dòng: chậm 4 ngày = 0,8; chỉnh sửa 1 lần = 0,75; không âm', () => {
  const r = tinhDongKpi({ diemDanhMuc: 100, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 1, soNgayCham: 4 })
  assert.equal(r.tienDo, 80)
  assert.equal(r.chatLuong, 75)
  assert.equal(tinhDongKpi({ diemDanhMuc: 100, soLuong: 1, hoanThanhThucTe: 1, soLanChinhSua: 9, soNgayCham: 99 }).chatLuong, 0)
})

test('điểm chung: tổng tối đa 30, vượt tối đa và mã lạ bị báo', () => {
  assert.equal(tongDiemChungToiDa(), 30)
  const r = kiemTraDiemChung({ 'I.1': 6, 'II.1': 2, 'X.9': 1 })
  assert.equal(r.loi.length, 2)
  assert.ok(Math.abs(tongDiemNam(27, 96.175) - 94.3225) < 1e-9)
})

test('xếp loại: chỉ gợi ý mức tối đa, xuất sắc cần top 20% và 2 quý xuất sắc', () => {
  assert.equal(mucToiDaTheoDiem(95).muc, 'HOAN_THANH_TOT_NHIEM_VU')
  assert.equal(mucToiDaTheoDiem(95, { trongTop20: true, soQuyXuatSac: 2 }).muc, 'HOAN_THANH_XUAT_SAC_NHIEM_VU')
  assert.equal(mucToiDaTheoDiem(75).muc, 'HOAN_THANH_TOT_NHIEM_VU')
  assert.equal(mucToiDaTheoDiem(60).muc, 'HOAN_THANH_NHIEM_VU')
  assert.equal(mucToiDaTheoDiem(49).muc, 'KHONG_HOAN_THANH_NHIEM_VU')
  assert.equal(mucToiDaTheoDiem(95, { soQuyKhongHoanThanh: 3 }).muc, 'KHONG_HOAN_THANH_NHIEM_VU')
})

// ── Biểu mẫu ────────────────────────────────────────────────────────────────
test('biểu mẫu: chọn 2A/2B/2C đúng đối tượng; mẫu chưa có bản gốc là UNKNOWN', () => {
  assert.equal(chonMauCaNhan({ laNguoiDungDau: true, laLanhDaoQuanLy: true }), '2A')
  assert.equal(chonMauCaNhan({ laNguoiDungDau: false, laLanhDaoQuanLy: true }), '2B')
  assert.equal(chonMauCaNhan({ laNguoiDungDau: false, laLanhDaoQuanLy: false }), '2C')
  for (const ma of ['4B', '6C', '6F1', '6F2', '6F3', '6F4', '07', 'BB-HOP']) {
    assert.equal(timMau(ma)?.trangThai, 'UNKNOWN', ma)
  }
  assert.equal(timMau('2C', 'SNV_CV6862')?.bo, 'SNV_CV6862')
  assert.equal(DANH_MUC_MAU.filter((m) => m.bo === 'HD43_BTCTW' && m.doiTuong === '').length >= 3, true)
})

// ── Đào tạo ────────────────────────────────────────────────────────────────
test('đào tạo: khoá đang học không tính hoàn thành; giờ chỉ cộng khoá đã xong', () => {
  const dong = [
    { id: '1', canBoId: 'a', toChucMa: 'PHONG_HTKT', tenKhoa: 'QLNN', ketQua: 'Hoàn thành', soGio: 40, coChungChi: true, daUngDung: true, nam: 2026 },
    { id: '2', canBoId: 'a', toChucMa: 'PHONG_HTKT', tenKhoa: 'Tin học', ketQua: 'Đang học', soGio: 30, coChungChi: false, daUngDung: false, nam: 2026 },
    { id: '3', canBoId: 'b', toChucMa: 'PHONG_QL_VT', tenKhoa: 'CCHN', ketQua: 'Hoàn thành', soGio: 16, coChungChi: false, daUngDung: false, nam: 2026 },
    { id: '4', canBoId: 'b', toChucMa: 'PHONG_QL_VT', tenKhoa: 'Cũ', ketQua: 'Hoàn thành', soGio: 99, coChungChi: true, daUngDung: false, nam: 2025 },
  ]
  const t = tongHop(dong, 2026)
  assert.equal(t.soKhoa, 3)
  assert.equal(t.hoanThanh, 2)
  assert.equal(t.dangHoc, 1)
  assert.equal(t.tongGioHoanThanh, 56)
  assert.equal(t.daCapChungChi, 1)
  assert.equal(t.hoanThanhChuaChungNhan, 1)
  assert.equal(t.daUngDung, 1)
  assert.equal(tongHopTheoNhom(dong, 2026, 'canBoId').get('a')!.dangHoc, 1)
  assert.equal(tongHopTheoNhom(dong, 2026, 'toChucMa').get('PHONG_QL_VT')!.tongGioHoanThanh, 16)
  assert.equal(phanLoaiKhoa('Bỏ dở'), 'CHUA_HOAN_THANH')
})

// ── 10 kiểm tra tự động: các ca nghiệm thu ──────────────────────────────────
function dauVao(p: Partial<DauVaoKiemTra> = {}): DauVaoKiemTra {
  return {
    nam: 2026,
    canBo: { id: 'cb1', hoTen: 'Cán bộ thử', laNguoiDungDau: false, laLanhDaoQuanLy: false },
    nhanXet: [], congViec: [], khoaHoc: [], ...p,
  }
}

test('kiểm tra: chuyên viên có nhận xét trách nhiệm lãnh đạo → lệch vị trí việc làm', () => {
  const vd = kiemTraHoSo(dauVao({ nhanXet: [{ muc: 'trach_nhiem_lanh_dao', noiDung: 'Điều hành phòng', nguon: ['x'] }] }))
  assert.equal(vd.some((v) => v.ma === 'NHAN_XET_LECH_VTVL'), true)
  const ok = kiemTraHoSo(dauVao({ canBo: { id: 'cb2', hoTen: 'Phó phòng', laNguoiDungDau: false, laLanhDaoQuanLy: true }, nhanXet: [{ muc: 'trach_nhiem_lanh_dao', noiDung: 'Điều hành', nguon: ['x'] }] }))
  assert.equal(ok.some((v) => v.ma === 'NHAN_XET_LECH_VTVL'), false)
})

test('kiểm tra: người thiếu minh chứng bị nêu rõ vị trí', () => {
  const vd = kiemTraHoSo(dauVao({
    nhanXet: [{ muc: 'uu_diem', noiDung: 'Hoàn thành tốt', nguon: [] }],
    congViec: [{ id: 'c1', tieuDe: 'Báo cáo A', trangThai: 'HOAN_THANH', soMinhChung: 0 }],
  }))
  const tm = vd.filter((v) => v.ma === 'THIEU_MINH_CHUNG')
  assert.equal(tm.length, 2)
  assert.match(tm[0].viTri, /Nhận xét/)
  assert.match(tm[1].viTri, /Báo cáo A/)
})

test('kiểm tra: nhiệm vụ chưa xong ghi đã xong; khoá chưa xong ghi chứng chỉ', () => {
  const vd = kiemTraHoSo(dauVao({
    congViec: [{ id: 'c1', tieuDe: 'Dự thảo QĐ', trangThai: 'DANG_LAM', tienDo: 40, soMinhChung: 1 }],
    khoaHoc: [{ id: 'k1', tenKhoa: 'Quản lý nhà nước', ketQua: 'Đang học', coChungChi: false }],
    nhanXet: [{ muc: 'ket_qua_nhiem_vu', noiDung: 'x', nguon: ['c1'], khangDinhHoanThanh: ['c1', 'khong-co'], khangDinhChungChi: ['k1'] }],
  }))
  assert.equal(vd.filter((v) => v.ma === 'NHIEM_VU_CHUA_XONG_GHI_XONG').length, 2)
  assert.equal(vd.filter((v) => v.ma === 'KHOA_CHUA_XONG_GHI_CHUNG_CHI').length, 1)
  const d2 = kiemTraHoSo(dauVao({ khoaHoc: [{ id: 'k2', tenKhoa: 'Tin học', ketQua: 'Đang học', coChungChi: true }] }))
  assert.equal(d2.some((v) => v.ma === 'KHOA_CHUA_XONG_GHI_CHUNG_CHI'), true)
})

test('kiểm tra: điểm không khớp, mẫu sai đối tượng, đề xuất chưa đủ điều kiện', () => {
  const vd = kiemTraHoSo(dauVao({
    mauApDung: '2A',
    diemChung: { 'I.1': 5, 'I.2': 5, 'II.1': 2.5, 'II.2': 2.5, 'II.3': 2.5, 'II.4': 2.5, 'III.1': 2.5, 'III.2': 2.5, 'III.3': 2.5, 'III.4': 2.5 },
    diemKpiTong: 96.175,
    tongDiemNhap: 99,
    mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU',
  }))
  const ma = new Set(vd.map((v) => v.ma))
  assert.equal(ma.has('DIEM_KHONG_KHOP'), true)
  assert.equal(ma.has('MAU_SAI_DOI_TUONG'), true)
  assert.equal(ma.has('DE_XUAT_CHUA_DU_DIEU_KIEN'), true)
  // đủ điều kiện thì không báo
  const ok = kiemTraHoSo(dauVao({
    mauApDung: '2C',
    diemChung: { 'I.1': 5, 'I.2': 5, 'II.1': 2.5, 'II.2': 2.5, 'II.3': 2.5, 'II.4': 2.5, 'III.1': 2.5, 'III.2': 2.5, 'III.3': 2.5, 'III.4': 2.5 },
    diemKpiTong: 96.175,
    mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU',
    dieuKienXepLoai: { trongTop20: true, soQuyXuatSac: 2 },
  }))
  assert.equal(ok.length, 0)
})

test('kiểm tra: mâu thuẫn giữa các kỳ, truy cập ngoài thẩm quyền, thành tích trùng', () => {
  const vd = kiemTraHoSo(dauVao({
    kyTruoc: { nam: 2025, mucXepLoai: 'KHONG_HOAN_THANH_NHIEM_VU', soHanChe: 0 },
    nhanXet: [{ muc: 'khac_phuc', noiDung: 'Đã khắc phục', nguon: ['a'] }],
    mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU',
    truyCap: [
      { nguoiXemId: 'u1', laChinhChu: true, coQuyenXem: false, loaiHoSo: 'DANG_VIEN' },
      { nguoiXemId: 'u2', nguoiXemTen: 'Người lạ', laChinhChu: false, coQuyenXem: false, loaiHoSo: 'DANG_VIEN' },
    ],
  }))
  assert.equal(vd.filter((v) => v.ma === 'MAU_THUAN_GIUA_CAC_KY').length, 2)
  assert.equal(vd.filter((v) => v.ma === 'TRUY_CAP_NGOAI_THAM_QUYEN').length, 1)
  const trung = kiemTraThanhTichTrung([
    { canBoId: 'a', noiDung: 'Hoàn thành xuất sắc nhiệm vụ thẩm định hồ sơ cấp phép năm 2026' },
    { canBoId: 'b', noiDung: 'hoàn thành xuất sắc nhiệm vụ, thẩm định hồ sơ cấp phép năm 2026.' },
    { canBoId: 'a', noiDung: 'Ngắn' }, { canBoId: 'b', noiDung: 'Ngắn' },
  ])
  assert.equal(trung.length, 1)
})

// ── Tổng hợp phòng ──────────────────────────────────────────────────────────
test('tổng hợp phòng: chỉ đếm mức đã phê duyệt; không suy xếp loại tập thể', () => {
  const hs = [
    { canBoId: '1', hoTen: 'TP', trangThai: 'DA_PHE_DUYET' as const, mucPheDuyet: 'HOAN_THANH_TOT_NHIEM_VU' as const },
    { canBoId: '2', hoTen: 'PTP', trangThai: 'TRINH_PHE_DUYET' as const, mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU' as const },
    { canBoId: '3', hoTen: 'CV', trangThai: 'GUI_NHAN_XET' as const },
    { canBoId: '4', hoTen: 'CV2', trangThai: null },
  ]
  const t = tongHopPhong(hs, [
    { trangThai: 'HOAN_THANH', tieuDe: 'a' }, { trangThai: 'DANG_LAM', tieuDe: 'b', ngayHetHan: '2026-01-01' }, { trangThai: 'TAM_DUNG', tieuDe: 'c' },
  ], [], 2026, new Date('2026-11-17'))
  assert.equal(t.tongNhanSu, 4)
  assert.equal(t.chuaLapHoSo, 1)
  assert.equal(t.hoSoHoanThanh, 1)
  assert.equal(t.hoSoConThieu, 3)
  assert.equal(t.choNhanXet, 1)
  assert.equal(t.choPheDuyet, 1)
  assert.equal(t.mucDaPheDuyet.HOAN_THANH_XUAT_SAC_NHIEM_VU, 0)
  assert.equal(t.mucDaPheDuyet.HOAN_THANH_TOT_NHIEM_VU, 1)
  assert.equal(t.nhiemVu.quaHan, 1)
  const nx = duThaoNhanXetTapThe('Phòng Hạ tầng kỹ thuật', 2026, t).join('\n')
  assert.match(nx, /3 công việc/)
  assert.match(nx, /không suy ra từ xếp loại cá nhân/)
  assert.doesNotMatch(nx, /Hoàn thành tốt nhiệm vụ|xuất sắc/)
})

// ── Nhận xét hỗ trợ: không bịa, đủ 3 độ dài, có nguồn ───────────────────────
import { soanNhanXet, laDoanThieuDuLieu } from './nhan-xet.ts'
import { rongTongHop } from './dao-tao.ts'

test('nhận xét: thiếu dữ liệu thì ghi rõ thiếu, không bịa; chuyên viên không có đoạn lãnh đạo', () => {
  const kq = soanNhanXet({
    nam: 2026, hoTen: 'Cán bộ thử', laLanhDaoQuanLy: false, congViec: [], thanhTich: [], hanChe: [],
    daoTao: rongTongHop(), khoaHoc: [],
  }, 'TIEU_CHUAN')
  assert.equal(kq.length, 8)
  assert.equal(kq.some((x) => x.muc === 'trach_nhiem_lanh_dao'), false)
  assert.equal(kq.every(laDoanThieuDuLieu), true)
  assert.equal(kq.every((x) => x.nguon.length === 0), true)
})

test('nhận xét: số liệu thật, nguồn đầy đủ, khoá đang học không tính hoàn thành, độ dài khác nhau', () => {
  const du = {
    nam: 2026, hoTen: 'Phó phòng thử', laLanhDaoQuanLy: true,
    congViec: [
      { id: 'c1', tieuDe: 'Thẩm định A', trangThai: 'HOAN_THANH', soMinhChung: 2 },
      { id: 'c2', tieuDe: 'Thẩm định B', trangThai: 'HOAN_THANH', soMinhChung: 0 },
      { id: 'c3', tieuDe: 'Dự thảo C', trangThai: 'DANG_LAM', tienDo: 30, soMinhChung: 0 },
    ],
    thanhTich: [{ id: 't1', noiDung: 'Giấy khen năm 2026' }],
    hanChe: [{ id: 'h1', noiDung: 'Chậm tiến độ báo cáo quý II', nguyenNhan: 'Thiếu số liệu đầu vào', daKhacPhuc: true }],
    daoTao: { soKhoa: 2, hoanThanh: 1, dangHoc: 1, chuaHoanThanh: 0, chuaRo: 0, tongGioHoanThanh: 40, daCapChungChi: 1, hoanThanhChuaChungNhan: 0, daUngDung: 1 },
    khoaHoc: [{ id: 'k1', tenKhoa: 'QLNN', ketQua: 'Hoàn thành' }, { id: 'k2', tenKhoa: 'Tin học', ketQua: 'Đang học' }],
    quanLy: [{ id: 'q1', noiDung: 'Phụ trách 3 chuyên viên' }],
    tongDiem: 82,
  }
  const ngan = soanNhanXet(du, 'NGAN_GON')
  const ct = soanNhanXet(du, 'CHI_TIET')
  assert.equal(ngan.length, 9)
  const kqNv = ct.find((x) => x.muc === 'ket_qua_nhiem_vu')!
  assert.match(kqNv.noiDung, /3 nhiệm vụ.*2 đã hoàn thành, 1 chưa/)
  // chỉ nêu tên việc CÓ minh chứng; việc hoàn thành không minh chứng không được khẳng định
  assert.deepEqual(kqNv.khangDinhHoanThanh, ['c1'])
  assert.doesNotMatch(kqNv.noiDung, /Thẩm định B\b.*minh chứng/)
  assert.match(ct.find((x) => x.muc === 'dao_tao')!.noiDung, /1 đang học \(chưa tính hoàn thành\)/)
  assert.equal(ct.find((x) => x.muc === 'han_che')!.nguon[0], 'h1')
  assert.match(ct.find((x) => x.muc === 'de_xuat_xep_loai')!.noiDung, /cấp có thẩm quyền quyết định/)
  assert.ok(ct.find((x) => x.muc === 'dao_tao')!.noiDung.length > ngan.find((x) => x.muc === 'dao_tao')!.noiDung.length)
  // kết quả tự soạn phải qua được bộ kiểm tra tự động
  const vd = kiemTraHoSo({ nam: 2026, canBo: { id: 'p', hoTen: 'P', laNguoiDungDau: false, laLanhDaoQuanLy: true }, nhanXet: ct, congViec: du.congViec, khoaHoc: du.khoaHoc })
  assert.equal(vd.filter((v) => v.mucDo === 'LOI').length, 0)
})

// ── Quyền xem, vai trò, sửa nội dung ───────────────────────────────────────
import { duocXemHoSo, xacDinhVaiTro, duocSuaPhan, type NguCanhQuyen } from './quyen.ts'

function nc(p: Partial<NguCanhQuyen> = {}): NguCanhQuyen {
  return { laChinhChu: false, laLanhDaoSo: false, laLanhDaoVanPhong: false, laLanhDaoCungPhong: false,
    coQuyenQuanLyDanhGia: false, coQuyenPheDuyet: false, coQuyenXemDang: false, coQuyenQuanLyDang: false, ...p }
}

test('quyền: hồ sơ Đảng tách khỏi hồ sơ CBCCVC', () => {
  // trưởng phòng cùng phòng xem được hồ sơ đánh giá CBCCVC nhưng KHÔNG xem được hồ sơ kiểm điểm Đảng
  const tp = nc({ laLanhDaoCungPhong: true })
  assert.equal(duocXemHoSo('CBCCVC', tp), true)
  assert.equal(duocXemHoSo('DANG_VIEN', tp), false)
  assert.deepEqual(xacDinhVaiTro('DANG_VIEN', tp), [])
  // người có quyền xem Đảng nhưng không có thẩm quyền CBCCVC
  const dang = nc({ coQuyenXemDang: true })
  assert.equal(duocXemHoSo('DANG_VIEN', dang), true)
  assert.equal(duocXemHoSo('CBCCVC', dang), false)
  // người lạ không xem được gì; chính chủ xem được của mình
  assert.equal(duocXemHoSo('CBCCVC', nc()), false)
  assert.equal(duocXemHoSo('DANG_VIEN', nc({ laChinhChu: true })), true)
})

test('quyền: vai trò quy trình; trưởng phòng không tự động có quyền phê duyệt', () => {
  assert.deepEqual(xacDinhVaiTro('CBCCVC', nc({ laChinhChu: true })), ['CHINH_CHU'])
  // Trưởng phòng/lãnh đạo Sở/thư ký là chính chủ của hồ sơ thì KHÔNG được tự nhận xét, tổng hợp, phê duyệt
  assert.deepEqual(xacDinhVaiTro('CBCCVC', nc({ laChinhChu: true, laLanhDaoCungPhong: true, laLanhDaoSo: true, coQuyenPheDuyet: true, coQuyenQuanLyDanhGia: true })), ['CHINH_CHU'])
  assert.deepEqual(xacDinhVaiTro('DANG_VIEN', nc({ laChinhChu: true, coQuyenQuanLyDang: true, coQuyenPheDuyet: true })), ['CHINH_CHU'])
  // Hồ sơ Đảng: quyền phê duyệt CBCCVC hoặc chức danh lãnh đạo Sở KHÔNG kéo theo quyền phê duyệt hồ sơ Đảng
  assert.equal(xacDinhVaiTro('DANG_VIEN', nc({ coQuyenXemDang: true, coQuyenPheDuyet: true })).includes('CAP_PHE_DUYET'), false)
  assert.equal(xacDinhVaiTro('DANG_VIEN', nc({ coQuyenXemDang: true, laLanhDaoSo: true })).includes('CAP_PHE_DUYET'), false)
  assert.equal(xacDinhVaiTro('DANG_VIEN', nc({ coQuyenXemDang: true, coQuyenQuanLyDang: true, coQuyenPheDuyet: true })).includes('CAP_PHE_DUYET'), true)
  const tp = xacDinhVaiTro('CBCCVC', nc({ laLanhDaoCungPhong: true }))
  assert.equal(tp.includes('NGUOI_NHAN_XET'), true)
  assert.equal(tp.includes('CAP_PHE_DUYET'), false)
  assert.equal(xacDinhVaiTro('CBCCVC', nc({ laLanhDaoSo: true })).includes('CAP_PHE_DUYET'), true)
  assert.equal(xacDinhVaiTro('CBCCVC', nc({ coQuyenPheDuyet: true, coQuyenQuanLyDanhGia: true })).includes('CAP_PHE_DUYET'), true)
})

test('quyền: chính chủ chỉ sửa tự đánh giá ở bước Tự đánh giá; hồ sơ đã trình bị khoá', () => {
  const cc = xacDinhVaiTro('CBCCVC', nc({ laChinhChu: true }))
  assert.equal(duocSuaPhan('tuDanhGia', 'TU_DANH_GIA', cc), true)
  assert.equal(duocSuaPhan('tuDanhGia', 'DU_THAO', cc), false)
  assert.equal(duocSuaPhan('nhanXet', 'TU_DANH_GIA', cc), false)
  assert.equal(duocSuaPhan('diem', 'TU_DANH_GIA', cc), false)
  const tk = xacDinhVaiTro('CBCCVC', nc({ coQuyenQuanLyDanhGia: true }))
  assert.equal(duocSuaPhan('diem', 'TONG_HOP', tk), true)
  assert.equal(duocSuaPhan('diem', 'TRINH_PHE_DUYET', tk), false)
  assert.equal(duocSuaPhan('nhanXet', 'DA_PHE_DUYET', tk), false)
})

test('kiểm tra: đoạn nhận xét trống do thiếu dữ liệu chỉ là cảnh báo, không phải lỗi chặn trình', () => {
  const kq = soanNhanXet({ nam: 2026, hoTen: 'A', laLanhDaoQuanLy: false, congViec: [], thanhTich: [], hanChe: [], daoTao: rongTongHop(), khoaHoc: [] }, 'NGAN_GON')
  const vd = kiemTraHoSo(dauVao({ nhanXet: kq }))
  assert.equal(vd.length > 0, true)
  assert.equal(vd.every((v) => v.mucDo === 'CANH_BAO'), true)
})

test('kiểm tra: để trống điểm/KPI không né được kiểm tra điều kiện; khoá học không tồn tại bị báo', () => {
  const vd = kiemTraHoSo(dauVao({ mucDeXuat: 'HOAN_THANH_XUAT_SAC_NHIEM_VU', diemChung: {}, diemKpiTong: null }))
  assert.equal(vd.some((v) => v.ma === 'DE_XUAT_CHUA_DU_DIEU_KIEN' && v.mucDo === 'LOI'), true)
  const vd2 = kiemTraHoSo(dauVao({ nhanXet: [{ muc: 'dao_tao', noiDung: 'x', nguon: ['k9'], khangDinhChungChi: ['k9'] }] }))
  assert.equal(vd2.some((v) => v.ma === 'KHOA_CHUA_XONG_GHI_CHUNG_CHI'), true)
})

test('đào tạo: khoá không có ngày không bị tính cho năm đang xem; lấy năm từ ô Thời gian', () => {
  const khongNgay = tuBanGhi({ id: '1', canBoId: 'a', tieuDe: 'K', ngayGhiNhan: null, customFields: { ketQua: 'Hoàn thành' } }, 2026)!
  assert.equal(khongNgay.nam, 0)
  assert.equal(tongHop([khongNgay], 2026).soKhoa, 0)
  const tg = tuBanGhi({ id: '2', canBoId: 'a', tieuDe: 'K', ngayGhiNhan: null, customFields: { thoiGian: '10/2025 – 03/2026' } }, 2026)!
  assert.equal(tg.nam, 2026)
  const ngay = tuBanGhi({ id: '3', canBoId: 'a', tieuDe: 'K', ngayGhiNhan: new Date(Date.UTC(2026, 0, 1)), customFields: {} }, 2025)!
  assert.equal(ngay.nam, 2026)
})
