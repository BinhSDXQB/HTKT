// Đường dẫn của chức năng Đánh giá cuối năm nằm dưới /dashboard/van-phong-so và /api/office nhưng phục vụ
// MỌI cán bộ (chính chủ tự đánh giá, trưởng phòng, thư ký họp phòng, lãnh đạo đơn vị...).
// Middleware chặn thô theo phòng (chỉ Văn phòng Sở) nên phải mở riêng các đường dẫn này; quyền thật kiểm ở
// trang / server action / API bằng CSDL (requireAuth + nguCanhQuyen/moHoSo/quyenTapThe/duocXemTongHop*).
// Liệt kê CHÍNH XÁC từng route (không mở cả nhánh con): route mới phải tự thêm vào đây sau khi đã tự kiểm quyền.
// KHÔNG mở các trang khác của Văn phòng Sở (hồ sơ cán bộ có CCCD, lương...).
// Thuần (không import server) để middleware edge dùng được và test được.

const MO_CHO_MOI_CAN_BO: RegExp[] = [
  // Hồ sơ đánh giá của một cán bộ (không mở /ho-so/[id] chính nó)
  /^\/dashboard\/van-phong-so\/ho-so\/[^/]+\/danh-gia-nam\/?$/,
  // Form nhập theo mẫu 2A/2B/2C/03/04
  /^\/dashboard\/van-phong-so\/ho-so\/[^/]+\/danh-gia-nam\/mau\/[^/]+\/?$/,
  // Biên bản họp, tổng hợp phòng, Mẫu 01 của phòng, tổng hợp Sở — trang tự kiểm quyền
  /^\/dashboard\/van-phong-so\/danh-gia\/(?:bien-ban|tong-hop|tong-hop\/mau-01|tong-hop-so)\/?$/,
  // Xuất Word/Excel (bản trống, hồ sơ, biên bản, mẫu tổng hợp) — route tự kiểm quyền
  /^\/api\/office\/danh-gia-nam\/xuat\/?$/,
]

export function laDuongDanDanhGiaNam(pathname: string): boolean {
  return MO_CHO_MOI_CAN_BO.some((r) => r.test(pathname))
}
