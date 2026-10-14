// Giá trị mặc định của form hồ sơ CCHN — tách khỏi component client để trang server dùng được.
import type { HoSoForm } from '@/app/actions/cchn'
import { homNay } from './danh-gia'

export const hoSoTrong = (): HoSoForm => ({
  loaiThuTuc: 'CAP_MOI', truongHop: 'LAN_DAU', hinhThucNop: 'TRUC_TUYEN', ngayNop: homNay(),
  hoTen: '', ngaySinh: '', gioiTinh: '', laCongDanVN: true, quocTich: '', maDinhDanh: '', dienThoai: '', email: '', diaChi: '', donViCongTac: '',
  trinhDo: '', chuyenNganh: '', coSoDaoTao: '', namTotNghiep: '', soHieuVanBang: '', vanBangNuocNgoai: false, vanBangTrenCsdl: false,
  linhVuc: '', noiDung: '', loaiCongTrinh: '', hangDeNghi: '', hanhNgheDocLap: false, soCchnCu: '', ngayBatDauKn: '', nguonBatDauKn: '',
  thanhPhan: {}, trangThai: 'MOI_TIEP_NHAN', ngayYeuCauBoSung: '', noiDungBoSung: '', ngayNhanDu: '', ngayHoiDong: '', hangHoiDong: '',
  ketLuanHoiDong: '', ngayThongBao: '', ngayCap: '', soChungChi: '', ghiChu: '', kinhNghiem: [],
})
