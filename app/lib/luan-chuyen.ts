// Luân chuyển / điều động cán bộ giữa các phòng — hàm thuần (không chạm CSDL), dùng chung cho action và test.
// Nguyên tắc: HỒ SƠ CÁN BỘ (can_bo.toChucId, chucDanhId) là nơi duy nhất Văn phòng Sở cập nhật đơn vị, chức danh.
// Khi đổi, tài khoản đăng nhập, phân công chính và quá trình công tác đi theo trong cùng một giao dịch
// (xem lib/luan-chuyen-db.ts). Menu và quyền vào phòng dựng theo users.toChucId nên phải đồng bộ ô này.

export type TruocSau = {
  toChucIdCu: string | null
  toChucIdMoi: string | null
  chucDanhIdCu: string | null
  chucDanhIdMoi: string | null
}

export type KeHoachLuanChuyen = {
  doiPhong: boolean
  doiChucDanh: boolean
  /** cập nhật phòng của tài khoản đăng nhập (chỉ khi có tài khoản gắn hồ sơ) */
  capNhatTaiKhoan: boolean
  /** tắt cờ lãnh đạo phòng: quyền lãnh đạo của phòng cũ không mang sang phòng mới */
  tatCoLanhDao: boolean
  /** đóng phân công chính cũ, mở phân công chính mới */
  doiPhanCong: boolean
  /** ghi một dòng quá trình công tác */
  ghiQuaTrinh: boolean
}

/**
 * @param hienTai trạng thái THẬT trước khi lưu: tài khoản đang ở phòng nào, phân công chính đang mở có khớp hồ sơ MỚI không.
 * Ngoài luân chuyển thật (hồ sơ đổi), lần lưu nào cũng đưa tài khoản và phân công chính về khớp hồ sơ (sửa dữ liệu lệch cũ),
 * nhưng chỉ ghi QUÁ TRÌNH CÔNG TÁC khi hồ sơ thật sự đổi đơn vị/chức danh.
 */
export function lapKeHoach(x: TruocSau, coTaiKhoan: boolean, hienTai: { taiKhoanToChucId?: string | null; phanCongKhop?: boolean } = {}): KeHoachLuanChuyen {
  const doiPhong = !!x.toChucIdMoi && x.toChucIdMoi !== x.toChucIdCu
  const doiChucDanh = (x.chucDanhIdMoi ?? null) !== (x.chucDanhIdCu ?? null)
  // Chỉ động vào tài khoản khi phòng của tài khoản THẬT SỰ khác phòng mới của hồ sơ (không biết thì theo việc hồ sơ đổi phòng).
  // Tài khoản đã ở đúng phòng mới thì giữ nguyên cờ lãnh đạo (có thể lãnh đạo Sở đã bật đúng cho phòng mới).
  const taiKhoanLech = hienTai.taiKhoanToChucId === undefined ? doiPhong : (hienTai.taiKhoanToChucId ?? null) !== (x.toChucIdMoi ?? null)
  const capNhatTaiKhoan = coTaiKhoan && taiKhoanLech
  return {
    doiPhong,
    doiChucDanh,
    capNhatTaiKhoan,
    tatCoLanhDao: capNhatTaiKhoan,
    doiPhanCong: doiPhong || doiChucDanh || hienTai.phanCongKhop === false,
    ghiQuaTrinh: doiPhong || doiChucDanh,
  }
}

/** Ngày kết thúc phân công cũ = ngày trước ngày hiệu lực (cột chỉ có ngày, tính theo UTC). */
export function ngayTruoc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1))
}

/** Hôm nay theo giờ Việt Nam (ngày, UTC 00:00). */
export function homNayVN(bayGio = new Date()): Date {
  const vn = new Date(bayGio.getTime() + 7 * 3600 * 1000)
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()))
}

/** Ngày hiệu lực: trống → hôm nay (giờ VN); yyyy-mm-dd hợp lệ → ngày đó; sai định dạng hoặc ngày không có thật → null (báo lỗi). */
export function ngayHieuLuc(v: string | null | undefined, bayGio = new Date()): Date | null {
  const t = v?.trim() ?? ''
  if (!t) return homNayVN(bayGio)
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null
}

export function moTaLuanChuyen(p: { phongCu?: string | null; phongMoi?: string | null; chucCu?: string | null; chucMoi?: string | null }, k: KeHoachLuanChuyen): string {
  const phan: string[] = []
  if (k.doiPhong) phan.push(`chuyển từ ${p.phongCu ?? '(chưa có đơn vị)'} sang ${p.phongMoi ?? '?'}`)
  if (k.doiChucDanh) phan.push(`chức danh ${p.chucCu ?? '(chưa có)'} → ${p.chucMoi ?? '(chưa có)'}`)
  return phan.join('; ')
}
