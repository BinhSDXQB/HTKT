// Ma trận PHÂN QUYỀN phân hệ QĐ 72 (Mục 7). Là CẤU HÌNH — enforcement thực thi ở API (CP3).
// Ánh xạ vào cơ chế sẵn có: role (admin/LANH_DAO_SO) + toChucId (đơn vị) + wardId (xã/phường).
// Nguyên tắc chốt:
//  - UBND xã/phường CHỈ khảo sát-ghi nhận-đề xuất, KHÔNG tự xác nhận tải trọng đường / lưu lượng
//    nước / an toàn đường dây; KHÔNG sửa hồ sơ đã xác minh.
//  - Cơ quan chuyên ngành CHỈ xác minh TRƯỜNG chuyên môn được phân công; KHÔNG sửa số liệu gốc xã nhập.

export type Qd72VaiTro =
  | 'XA_PHUONG' | 'SO_XAY_DUNG' | 'CONG_AN_TINH' | 'SO_CONG_THUONG' | 'DON_VI_DIEN_LUC'
  | 'SO_KHCN' | 'DOANH_NGHIEP_VIEN_THONG' | 'DON_VI_CHIEU_SANG' | 'DON_VI_CAP_NUOC'
  | 'SO_KHAC' | 'QUAN_TRI'

export type Qd72HanhDong =
  | 'XEM' | 'TAO' | 'SUA_GOC' | 'GUI' | 'TRA_LAI' | 'BO_SUNG'
  | 'XAC_MINH' | 'PHE_DUYET' | 'TONG_HOP' | 'CAU_HINH_TIEU_CHI' | 'QUAN_TRI_HE_THONG'

export type Qd72PhamVi = 'DIA_BAN' | 'TOAN_TINH' | 'PHAN_CONG'

// Nhóm TRƯỜNG/tiêu chí một đơn vị được xác minh (khớp qd72_technical_rules.nhom + loại đối tượng dây/cáp).
export type Qd72NhomXacMinh =
  | 'PCCC_GIAO_THONG' | 'PCCC_CHIEU_CAO' | 'PCCC_NGUON_NUOC'
  | 'DIEN' | 'VIEN_THONG' | 'CHIEU_SANG' | 'CAP_NUOC' | 'TAT_CA'

export type Qd72QuyenVaiTro = {
  vaiTro: Qd72VaiTro
  ten: string
  phamVi: Qd72PhamVi
  hanhDong: Qd72HanhDong[]
  nhomXacMinh: Qd72NhomXacMinh[]     // rỗng = không xác minh chuyên môn
  ghiChu?: string
}

export const QD72_MA_TRAN_QUYEN: Record<Qd72VaiTro, Qd72QuyenVaiTro> = {
  XA_PHUONG: {
    vaiTro: 'XA_PHUONG', ten: 'UBND xã/phường', phamVi: 'DIA_BAN',
    hanhDong: ['XEM', 'TAO', 'SUA_GOC', 'GUI', 'BO_SUNG'],
    nhomXacMinh: [],
    ghiChu: 'Khảo sát, vẽ bản đồ, nhập số liệu, tải ảnh; lưu nháp/gửi/bổ sung hồ sơ bị trả lại. KHÔNG sửa hồ sơ đã xác minh; KHÔNG tự xác nhận tải trọng đường/lưu lượng nước/an toàn đường dây.',
  },
  SO_XAY_DUNG: {
    vaiTro: 'SO_XAY_DUNG', ten: 'Sở Xây dựng', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM', 'TRA_LAI', 'PHE_DUYET', 'TONG_HOP', 'CAU_HINH_TIEU_CHI'],
    nhomXacMinh: [],
    ghiChu: 'Xem toàn tỉnh; kiểm tra tính đầy đủ; trả lại hồ sơ; tổng hợp kế hoạch/kinh phí; quản lý cấu hình tiêu chí; tổng hợp phương án chỉnh trang/hạ ngầm.',
  },
  CONG_AN_TINH: {
    vaiTro: 'CONG_AN_TINH', ten: 'Công an tỉnh', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['PCCC_GIAO_THONG', 'PCCC_CHIEU_CAO', 'PCCC_NGUON_NUOC'],
    ghiChu: 'Xác minh tiêu chí PCCC: đường xe chữa cháy, chiều cao thông thủy, bãi đỗ, nguồn nước. KHÔNG sửa số liệu gốc do xã/phường nhập.',
  },
  SO_CONG_THUONG: {
    vaiTro: 'SO_CONG_THUONG', ten: 'Sở Công Thương', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['DIEN'],
    ghiChu: 'Xác minh đường dây điện, cột điện, độ võng, an toàn điện; xác định chủ sở hữu; đề xuất nâng/di chuyển/hạ ngầm.',
  },
  DON_VI_DIEN_LUC: {
    vaiTro: 'DON_VI_DIEN_LUC', ten: 'Đơn vị điện lực', phamVi: 'PHAN_CONG',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['DIEN'],
    ghiChu: 'Xác minh dây/cột điện, độ võng, an toàn điện; xác nhận ảnh hưởng cấp điện & phương án thi công.',
  },
  SO_KHCN: {
    vaiTro: 'SO_KHCN', ten: 'Sở Khoa học và Công nghệ', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['VIEN_THONG'],
    ghiChu: 'Xác minh cáp viễn thông; xác định cáp đang dùng/không dùng; đề xuất bó gọn/di chuyển/tháo dỡ/hạ ngầm.',
  },
  DOANH_NGHIEP_VIEN_THONG: {
    vaiTro: 'DOANH_NGHIEP_VIEN_THONG', ten: 'Doanh nghiệp viễn thông', phamVi: 'PHAN_CONG',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['VIEN_THONG'],
    ghiChu: 'Chỉ xác minh cáp được phân công; xác nhận phương án bảo đảm thông tin liên lạc.',
  },
  DON_VI_CHIEU_SANG: {
    vaiTro: 'DON_VI_CHIEU_SANG', ten: 'Đơn vị quản lý chiếu sáng', phamVi: 'PHAN_CONG',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['CHIEU_SANG'],
    ghiChu: 'Xác minh dây/cột/cần đèn/đèn trang trí/tủ điều khiển; đề xuất cải tạo/hạ ngầm.',
  },
  DON_VI_CAP_NUOC: {
    vaiTro: 'DON_VI_CAP_NUOC', ten: 'Đơn vị cấp nước', phamVi: 'PHAN_CONG',
    hanhDong: ['XEM', 'XAC_MINH'],
    nhomXacMinh: ['CAP_NUOC'],
    ghiChu: 'Xác minh lưu lượng, áp lực, đường ống, trụ nước.',
  },
  SO_KHAC: {
    vaiTro: 'SO_KHAC', ten: 'Cán bộ Sở/đơn vị khác (chỉ xem)', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM'],
    nhomXacMinh: [],
    ghiChu: 'Mặc định an toàn cho tài khoản chưa được phân vai trò QĐ72 — CHỈ được xem, không sửa/xác minh/phê duyệt.',
  },
  QUAN_TRI: {
    vaiTro: 'QUAN_TRI', ten: 'Quản trị viên', phamVi: 'TOAN_TINH',
    hanhDong: ['XEM', 'TAO', 'SUA_GOC', 'GUI', 'TRA_LAI', 'BO_SUNG', 'XAC_MINH', 'PHE_DUYET', 'TONG_HOP', 'CAU_HINH_TIEU_CHI', 'QUAN_TRI_HE_THONG'],
    nhomXacMinh: ['TAT_CA'],
    ghiChu: 'Quản lý tài khoản, địa bàn, vai trò, danh mục, tiêu chí và nhật ký.',
  },
}

// Ánh xạ NHÓM tiêu chí (qd72_technical_rules.nhom) → nhóm xác minh chuyên môn.
export const NHOM_TIEU_CHI_TO_XAC_MINH: Record<string, Qd72NhomXacMinh> = {
  GIAO_THONG: 'PCCC_GIAO_THONG',
  CHIEU_CAO: 'PCCC_CHIEU_CAO',
  NGUON_NUOC: 'PCCC_NGUON_NUOC',
  // DUONG_DAY: KHÔNG map mặc định — BẮT BUỘC route theo LOAI_DOI_TUONG_TO_XAC_MINH
  // (điện→DIEN, cáp→VIEN_THONG, dây chiếu sáng→CHIEU_SANG) để không gán nhầm đơn vị xác minh.
}

// Ánh xạ LOẠI ĐỐI TƯỢNG dây/cáp (Phiếu 03) → nhóm xác minh (đơn vị nào được xác minh dòng đó).
export const LOAI_DOI_TUONG_TO_XAC_MINH: Record<string, Qd72NhomXacMinh> = {
  'Đường dây điện trung thế': 'DIEN', 'Đường dây điện hạ thế': 'DIEN', 'Dây điện sau công tơ': 'DIEN',
  'Cáp viễn thông': 'VIEN_THONG', 'Cáp internet': 'VIEN_THONG', 'Cáp truyền hình': 'VIEN_THONG', 'Cáp thông tin khác': 'VIEN_THONG',
  'Dây điện chiếu sáng': 'CHIEU_SANG', 'Cần đèn / đèn trang trí': 'CHIEU_SANG',
}

// Mã to_chuc (ma) → vai trò QĐ72. ⚠️ CẦN cập nhật theo mã to_chuc thực tế của tỉnh khi tạo tài khoản
// cho Công an/điện lực/cấp nước/viễn thông (hiện hệ thống có Sở XD + Trung tâm bảo trì…).
export const ORG_MA_TO_VAITRO: Record<string, Qd72VaiTro> = {
  // 'CONG_AN_TINH': 'CONG_AN_TINH',
  // 'DIEN_LUC_QT': 'DON_VI_DIEN_LUC',
  // 'CAP_NUOC_QT': 'DON_VI_CAP_NUOC',
  // 'VNPT_QT': 'DOANH_NGHIEP_VIEN_THONG',
  // 'CHIEU_SANG_QT': 'DON_VI_CHIEU_SANG',
}

export type Qd72User = {
  roleName: string
  wardId?: string | null
  toChucId?: string | null
  toChucMa?: string | null      // mã to_chuc (nếu resolve được)
  phongBan?: string | null
}

/** Suy vai trò QĐ72 từ tài khoản hệ thống (ưu tiên admin → ward → mã đơn vị → phòng Sở). */
export function suyVaiTro(u: Qd72User): Qd72VaiTro {
  if (u.roleName === 'admin') return 'QUAN_TRI'
  if (u.wardId) return 'XA_PHUONG'
  if (u.toChucMa && ORG_MA_TO_VAITRO[u.toChucMa]) return ORG_MA_TO_VAITRO[u.toChucMa]
  if (u.roleName === 'LANH_DAO_SO' || u.phongBan === 'Phòng Hạ tầng kỹ thuật') return 'SO_XAY_DUNG'
  return 'SO_KHAC' // FALLBACK AN TOÀN: chưa phân vai trò → chỉ được XEM (không trả lại/phê duyệt/cấu hình).
}

export function coQuyen(vaiTro: Qd72VaiTro, hanhDong: Qd72HanhDong): boolean {
  return QD72_MA_TRAN_QUYEN[vaiTro]?.hanhDong.includes(hanhDong) ?? false
}

/** Guard SỬA theo trạng thái hồ sơ. Xã/phường CHỈ sửa khi DRAFT/RETURNED (không sửa hồ sơ đã xác minh). */
export function coTheSua(vaiTro: Qd72VaiTro, trangThaiHoSo: string): boolean {
  if (!coQuyen(vaiTro, 'SUA_GOC')) return false
  if (vaiTro === 'QUAN_TRI') return true
  if (vaiTro === 'XA_PHUONG') return trangThaiHoSo === 'DRAFT' || trangThaiHoSo === 'RETURNED'
  return false
}

export function duocXacMinhNhom(vaiTro: Qd72VaiTro, nhom: Qd72NhomXacMinh): boolean {
  const q = QD72_MA_TRAN_QUYEN[vaiTro]
  if (!q) return false
  return q.nhomXacMinh.includes('TAT_CA') || q.nhomXacMinh.includes(nhom)
}
