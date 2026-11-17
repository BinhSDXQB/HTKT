// Quyền trên hồ sơ đánh giá cuối năm. Hàm thuần: tầng máy chủ nạp dữ kiện rồi gọi vào đây.
// Hồ sơ loại DANG_VIEN (kiểm điểm đảng viên) tách quyền riêng khỏi hồ sơ CBCCVC.
import type { VaiTroDanhGia } from './trang-thai'

export type LoaiHoSo = 'CBCCVC' | 'DANG_VIEN'

export type NguCanhQuyen = {
  /** Người thao tác là chính chủ hồ sơ (can_bo.userId = user.id) */
  laChinhChu: boolean
  /** admin hoặc lãnh đạo Sở (LANH_DAO_SO) */
  laLanhDaoSo: boolean
  /** Chánh/Phó Chánh Văn phòng Sở hoặc admin (isOfficeLeader) */
  laLanhDaoVanPhong: boolean
  /** Là trưởng/phó phòng (cờ isDepartmentLeader) CỦA CHÍNH PHÒNG chứa người được đánh giá */
  laLanhDaoCungPhong: boolean
  coQuyenQuanLyDanhGia: boolean // office:annual_evaluation_manage
  coQuyenPheDuyet: boolean // office:annual_evaluation_approve
  coQuyenXemDang: boolean // office:party_review_view hoặc nhóm nhạy cảm
  coQuyenQuanLyDang: boolean // office:party_review_manage
}

/** Xem hồ sơ: CBCCVC → chính chủ + người có thẩm quyền; DANG_VIEN → chính chủ + quyền xem Đảng. */
export function duocXemHoSo(loai: LoaiHoSo, c: NguCanhQuyen): boolean {
  if (loai === 'DANG_VIEN') return c.laChinhChu || c.coQuyenXemDang
  return c.laChinhChu || c.laLanhDaoSo || c.laLanhDaoVanPhong || c.laLanhDaoCungPhong || c.coQuyenQuanLyDanhGia || c.coQuyenPheDuyet
}

/** Vai trò trên quy trình. Hồ sơ Đảng: chỉ chính chủ và người có party_review_manage mới làm được các bước. */
export function xacDinhVaiTro(loai: LoaiHoSo, c: NguCanhQuyen): VaiTroDanhGia[] {
  if (!duocXemHoSo(loai, c)) return []
  // Chính chủ chỉ có vai trò chính chủ: không tự nhận xét, tổng hợp hay phê duyệt hồ sơ của mình dù là lãnh đạo phòng, thư ký hay lãnh đạo Sở.
  if (c.laChinhChu) return ['CHINH_CHU']
  const v: VaiTroDanhGia[] = []
  if (loai === 'DANG_VIEN') {
    if (c.coQuyenQuanLyDang) v.push('THU_KY_TONG_HOP', 'NGUOI_NHAN_XET')
    // Phê duyệt hồ sơ Đảng: cần ĐỒNG THỜI quyền quản lý hồ sơ Đảng và quyền phê duyệt; không suy từ chức danh lãnh đạo Sở hay quyền duyệt CBCCVC.
    if (c.coQuyenQuanLyDang && c.coQuyenPheDuyet) v.push('CAP_PHE_DUYET')
    return v
  }
  if (c.laLanhDaoCungPhong || c.laLanhDaoSo || c.laLanhDaoVanPhong) v.push('NGUOI_NHAN_XET')
  if (c.coQuyenQuanLyDanhGia || c.laLanhDaoVanPhong || c.laLanhDaoCungPhong || c.laLanhDaoSo) v.push('THU_KY_TONG_HOP')
  // Phê duyệt: người được cấp quyền hoặc lãnh đạo Sở; người đứng đầu phòng KHÔNG tự động có quyền phê duyệt
  if (c.coQuyenPheDuyet || c.laLanhDaoSo) v.push('CAP_PHE_DUYET')
  return v
}

/** Sửa nội dung: chính chủ chỉ sửa phần tự đánh giá khi hồ sơ ở bước Tự đánh giá; người quản lý sửa các phần còn lại. */
export function duocSuaPhan(phan: 'tuDanhGia' | 'nhanXet' | 'diem' | 'mucDeXuat', trangThai: string, vaiTro: VaiTroDanhGia[]): boolean {
  if (['TRINH_PHE_DUYET', 'DA_PHE_DUYET', 'LUU_HO_SO'].includes(trangThai)) return false
  if (phan === 'tuDanhGia') return vaiTro.includes('CHINH_CHU') && trangThai === 'TU_DANH_GIA'
  if (phan === 'nhanXet') return vaiTro.includes('NGUOI_NHAN_XET') || vaiTro.includes('THU_KY_TONG_HOP')
  return vaiTro.includes('THU_KY_TONG_HOP')
}
