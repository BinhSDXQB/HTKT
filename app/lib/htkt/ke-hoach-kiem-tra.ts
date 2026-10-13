// Kế hoạch kiểm tra QLNN hàng năm của Phòng Hạ tầng kỹ thuật.
// Ma trận phân loại công trình, nội dung kiểm tra định kỳ, quy mô theo lĩnh vực.
// Căn cứ: TT 34/2026/TT-BXD (phân cấp công trình), TT 33/2026/TT-BXD (đánh giá an toàn), NĐ 207/2026 (kiểm tra bảo trì).

import type { LinhVucKey } from './phap-ly'

// ───────── Ma trận phân loại công trình HTKT ─────────
// Bảng phân cấp NHOM_CONG_TRINH (số liệu tự đặt, không khớp TT 34/2026) đã bị xoá 13/10/2026 —
// phân cấp lấy từ lib/htkt/cap-cong-trinh-tt34.ts (chép nguyên văn bản gốc).

// ───────── Nội dung kiểm tra định kỳ ─────────
export type NoiDungKiemTra = {
  linhVuc: LinhVucKey
  hinhThucKiemTra: 'thuong_xuyen' | 'dinh_ky' | 'dot_xuat'
  tanSuat: string              // vd "Tháng/Quý/Năm"
  noiDungKiemTra: string[]     // các nội dung cụ thể
  taiLieuYeuCau: string[]      // danh sách hồ sơ cần kiểm
  tieuChi: string[]            // tiêu chí đánh giá
}

export const NOI_DUNG_KIEM_TRA: NoiDungKiemTra[] = [
  {
    linhVuc: 'cap-nuoc',
    hinhThucKiemTra: 'thuong_xuyen',
    tanSuat: 'Tháng/Quý',
    noiDungKiemTra: [
      'Vận hành hệ thống cấp nước theo quy hoạch, thiết kế được phê duyệt',
      'Chất lượng nước sạch đạt tiêu chuẩn (mầu, độ đục, chlorine tự do, ...)',
      'An toàn công trình, hệ thống cảnh báo rò rỉ, mất áp',
      'Thống kê nước tiêu thụ, nước không doanh thu, phí dịch vụ',
    ],
    taiLieuYeuCau: [
      'Báo cáo vận hành tháng/quý',
      'Kết quả kiểm nghiệm chất lượng nước',
      'Sổ theo dõi thống kê nước',
      'Đơn đề nghị bảo trì sửa chữa (nếu có)',
    ],
    tieuChi: [
      'Tuân thủ quy hoạch, thiết kế, QCVN 07:2023/BXD (phần cấp nước, Sửa đổi 1:2025)',
      'Nước đạt tiêu chuẩn chất lượng (QCVN 01-1:2024/BYT)',
      'Tỷ lệ nước không doanh thu ≤ 15%',
      'Không xảy ra sự cố mất áp, mất nước > 6 giờ liên tiếp',
    ],
  },
  {
    linhVuc: 'thoat-nuoc',
    hinhThucKiemTra: 'thuong_xuyen',
    tanSuat: 'Tháng/Quý',
    noiDungKiemTra: [
      'Chống ngập: vận hành bơm, van chặn, yếu tố thời tiết',
      'Lưu lượng thoát nước, xử lý bùn thải',
      'Chất lượng nước xả ra (COD, BOD, chất lơ lửng, N, P)',
      'An toàn hệ thống, không rò rỉ, không hoạt động bất thường',
    ],
    taiLieuYeuCau: [
      'Báo cáo vận hành, chống ngập tháng/quý',
      'Kết quả kiểm nghiệm chất lượng nước',
      'Báo cáo xử lý bùn thải (lượng, đặc tính)',
      'Sự cố xảy ra (nếu có) và cách xử lý',
    ],
    tieuChi: [
      'Tuân thủ QCVN 07:2023/BXD (phần thoát nước), QCVN 14:2025/BTNMT (thay QCVN 14:2008)',
      'Tỷ lệ thu gom thoát nước ≥ 80% khu vực phục vụ',
      'Xử lý nước thải đạt tiêu chuẩn xả ra',
      'Không xảy ra ngập ngoài dự tính > 2 lần/năm',
    ],
  },
  {
    linhVuc: 'cay-xanh',
    hinhThucKiemTra: 'dinh_ky',
    tanSuat: 'Quý/Năm',
    noiDungKiemTra: [
      'Tình trạng cây xanh: sống chết, bệnh tật, cây thay thế',
      'Bảo dưỡng, cắt tỉa, tưới nước theo quy định',
      'Kiểm tra đất, phân bón, diệt cỏ dại',
      'Điều chỉnh cơ cấu cây xanh theo quy hoạch',
    ],
    taiLieuYeuCau: [
      'Báo cáo tình trạng cây xanh định kỳ',
      'Hóa đơn bảo dưỡng (cắt tỉa, tưới nước, phân bón)',
      'Kế hoạch bổ sung, thay thế cây (nếu có)',
      'Ảnh chụp hiện trường (so sánh định kỳ)',
    ],
    tieuChi: [
      'Tuân thủ NĐ 258/2025/NĐ-CP về quản lý công viên, cây xanh, mặt nước; chỉ tiêu theo QCVN 01:2021/BXD',
      'Tỷ lệ cây sống ≥ 90%',
      'Không có cây chết lâm sàng trên 3 tháng',
      'Diện tích cây xanh công viên ≥ 6 m²/cư dân đô thị',
    ],
  },
  {
    linhVuc: 'chieu-sang',
    hinhThucKiemTra: 'dinh_ky',
    tanSuat: 'Tháng/Quý',
    noiDungKiemTra: [
      'Vận hành hệ thống chiếu sáng (sáng tối, sự cố, tắt bất thường)',
      'Thay thế, bảo dưỡng đèn, cột chiếu sáng',
      'Tiêu thụ điện, chi phí dịch vụ',
      'Cắt cạo cây che phủ ánh sáng',
    ],
    taiLieuYeuCau: [
      'Báo cáo vận hành chiếu sáng tháng/quý',
      'Chứng từ bảo dưỡng, thay thế đèn/cột',
      'Hóa đơn tiêu thụ điện',
      'Phương án cải tạo (nếu cần nâng cấp)',
    ],
    tieuChi: [
      'Tuân thủ QCVN 07:2023/BXD (phần chiếu sáng), NĐ 79/2009/NĐ-CP',
      'Tỷ lệ chiếu sáng đường đô thị ≥ 80%',
      'Độ chiếu sáng đạt tiêu chuẩn (≥ 15 lux phố chính)',
      'Tiết kiệm điện: chuyển đổi LED ≥ 70%',
    ],
  },
  {
    linhVuc: 'nghia-trang',
    hinhThucKiemTra: 'dinh_ky',
    tanSuat: 'Quý/Năm',
    noiDungKiemTra: [
      'Quản lý, bảo trì phần mộ, dịch vụ hỏa táng',
      'Tình trạng công trình phụ (nhà chứng, bàn thờ, tường rào)',
      'Vệ sinh, xanh sạch, an ninh nhân chứng, pháp lý',
      'Thống kê số liệu an táng, hỏa táng, doanh thu dịch vụ',
    ],
    taiLieuYeuCau: [
      'Báo cáo tình trạng, dịch vụ hỏa táng',
      'Sổ ghi chép an táng, hỏa táng',
      'Hóa đơn bảo dưỡng, sửa chữa công trình',
      'Tờ khai thuế dịch vụ (nếu có)',
    ],
    tieuChi: [
      'Tuân thủ NĐ 23/2016/NĐ-CP, quy chế quản lý địa phương',
      'Khuyến khích hỏa táng ≥ 30% trường hợp mới',
      'Không vi phạm pháp luật, tôn giáo',
      'Không xảy ra sự cố an toàn, vệ sinh công cộng',
    ],
  },
  {
    linhVuc: 'giao-thong-do-thi',
    hinhThucKiemTra: 'thuong_xuyen',
    tanSuat: 'Tháng/Quý',
    noiDungKiemTra: [
      'Tình trạng mặt đường: ổ gà, sà lan, băng rơi',
      'Hệ thống thoát nước, rãnh, nắp cống',
      'Vạch kẻ đường, biển báo, gờ đường',
      'Bảo dưỡng, sửa chữa định kỳ theo kế hoạch',
    ],
    taiLieuYeuCau: [
      'Báo cáo tình trạng đường tháng/quý',
      'Chứng từ bảo dưỡng, sửa chữa đường',
      'Danh sách sự cố, cách xử lý',
      'Kế hoạch bảo trì hàng năm (định mức, dự toán)',
    ],
    tieuChi: [
      'Tuân thủ Luật Đường bộ 35/2024/QH15, QCVN 07:2023/BXD (phần giao thông)',
      'Mặt đường không có ổ gà, sà lan > 2 cm chiều sâu',
      'Tỷ lệ đường sạch ≥ 90%',
      'Bảo trì hàng năm ≥ 10% chiều dài mạng lưới',
    ],
  },
  {
    linhVuc: 'khong-gian-ngam',
    hinhThucKiemTra: 'dinh_ky',
    tanSuat: 'Năm',
    noiDungKiemTra: [
      'Kiểm tra an toàn công trình ngầm (bàn giao, cầu chì, chiếu sáng)',
      'Vấn đề thống kê công trình ngầm (tuy-nen, bãi đỗ)',
      'Phân cấp, chuyên môn giao quản lý',
      'Kế hoạch hạ ngầm dây cáp điện, viễn thông',
    ],
    taiLieuYeuCau: [
      'Bảng tổng hợp công trình ngầm, tuy-nen',
      'Báo cáo tình trạng quản lý, bảo dưỡng',
      'Sơ đồ cấp phân bổ quyền quản lý',
      'Kế hoạch hạ ngầm (nếu có dự án mới)',
    ],
    tieuChi: [
      'Tuân thủ NĐ 39/2010/NĐ-CP (đã được sửa đổi — đối chiếu văn bản hợp nhất)',
      'Cơ sở dữ liệu công trình ngầm cập nhật hàng năm',
      'Không xảy ra sự cố đấu nối, va chạm công trình',
      'Kế hoạch hạ ngầm ≥ 10% mạng lưới cáp nổi hàng năm',
    ],
  },
  {
    linhVuc: 'su-dung-chung',
    hinhThucKiemTra: 'dinh_ky',
    tanSuat: 'Năm',
    noiDungKiemTra: [
      'Quản lý, duy trì công trình dùng chung (cột, cống bể cáp)',
      'Thỏa thuận sử dụng chung, giá thuê, đôi soát hợp đồng',
      'Thực trạng sắp xếp cáp, đường dây nổi trên cột',
      'Kế hoạch hạ ngầm, tối ưu hóa sử dụng chung',
    ],
    taiLieuYeuCau: [
      'Danh sách công trình dùng chung, giá thuê',
      'Dossier thỏa thuận/hợp đồng sử dụng chung',
      'Báo cáo doanh thu và chi phí bảo trì',
      'Kế hoạch cải tạo, hạ ngầm (nếu có)',
    ],
    tieuChi: [
      'Tuân thủ NĐ 72/2012, TT 03/2013 về sử dụng chung',
      'Áp dụng mẫu hợp đồng của Bộ Xây dựng',
      'Doanh thu dùng chung cân bằng với chi phí bảo dưỡng',
      'Cấp phép hạ ngầm mới ≥ 10% mạng lưới hàng năm',
    ],
  },
]

export function getNoiDungKiemTra(linhVuc: LinhVucKey): NoiDungKiemTra[] {
  return NOI_DUNG_KIEM_TRA.filter((n) => n.linhVuc === linhVuc)
}

// Bảng QUY_MO_LINH_VUC (nhóm A/B/C theo km, thẩm quyền "huyện/xã", "Sở LĐ-TBXH", "Sở GTVT") đã bị xoá 13/10/2026 —
// không có căn cứ. Nhóm dự án theo Đ9–11 Luật Đầu tư công; thẩm quyền theo Đ32–33 NĐ 217/2026.

// ───────── Khung kế hoạch kiểm tra hàng năm ─────────
export type ThoiDiemKiemTra = {
  thang: number        // 1–12
  cauHinhLinhVuc: string[]  // danh sách lĩnh vực được kiểm tra
  noiDungChiDao?: string    // hướng dẫn chỉ đạo từ Sở
}

export const KE_HOACH_KIEM_TRA_NAM: ThoiDiemKiemTra[] = [
  {
    thang: 1,
    cauHinhLinhVuc: ['cap-nuoc', 'thoat-nuoc', 'su-dung-chung'],
    noiDungChiDao: 'Kiểm tra tổng kết năm trước, lên kế hoạch bảo trì hàng năm, rà soát danh mục công trình phải đánh giá an toàn định kỳ (TT 33/2026/TT-BXD).',
  },
  {
    thang: 2,
    cauHinhLinhVuc: ['cay-xanh', 'chieu-sang', 'giao-thong-do-thi'],
    noiDungChiDao: 'Chuẩn bị tưới nước cây mùa đông, kiểm tra chiếu sáng, bảo trì đường năm mới.',
  },
  {
    thang: 3,
    cauHinhLinhVuc: ['cap-nuoc', 'cay-xanh', 'khong-gian-ngam'],
    noiDungChiDao: 'Bắt đầu mùa sinh trưởng cây, tăng tần suất kiểm tra cấp nước, kiểm tra công trình ngầm.',
  },
  {
    thang: 4,
    cauHinhLinhVuc: ['giao-thong-do-thi', 'thoat-nuoc', 'nghia-trang'],
    noiDungChiDao: 'Kiểm tra và bảo trì đường nhân dịp hè, xử lý ngập mưa xuân hè, chuẩn bị mùa tang chế.',
  },
  {
    thang: 5,
    cauHinhLinhVuc: ['chieu-sang', 'cay-xanh', 'cap-nuoc'],
    noiDungChiDao: 'Kiểm tra cắt tỉa cây, bảo dưỡng chiếu sáng, điều chỉnh cấp nước mùa hạ.',
  },
  {
    thang: 6,
    cauHinhLinhVuc: ['thoat-nuoc', 'su-dung-chung', 'giao-thong-do-thi'],
    noiDungChiDao: 'Chuẩn bị hạn thoát nước, kiểm tra độ an toàn sử dụng chung cột, bảo trì đường.',
  },
  {
    thang: 7,
    cauHinhLinhVuc: ['cap-nuoc', 'cay-xanh', 'chieu-sang'],
    noiDungChiDao: 'Kiểm tra nước mùa nóng, chăm sóc cây xanh (tưới nước nhiều), nâng cấp chiếu sáng LED.',
  },
  {
    thang: 8,
    cauHinhLinhVuc: ['giao-thong-do-thi', 'khong-gian-ngam', 'thoat-nuoc'],
    noiDungChiDao: 'Chuẩn bị hạn mưa lũ, kiểm tra an toàn công trình ngầm, xử lý thoát nước mưa lũ.',
  },
  {
    thang: 9,
    cauHinhLinhVuc: ['cay-xanh', 'nghia-trang', 'cap-nuoc'],
    noiDungChiDao: 'Chuẩn bị mùa khô, bảo dưỡng cây đông hạ, bảo trì nghĩa trang, kiểm tra cấp nước đông hạ.',
  },
  {
    thang: 10,
    cauHinhLinhVuc: ['chieu-sang', 'su-dung-chung', 'giao-thong-do-thi'],
    noiDungChiDao: 'Nâng cấp chiếu sáng mùa đông, theo dõi tiến độ đánh giá an toàn định kỳ của chủ sở hữu (TT 33/2026), kiểm tra đường.',
  },
  {
    thang: 11,
    cauHinhLinhVuc: ['thoat-nuoc', 'cap-nuoc', 'khong-gian-ngam'],
    noiDungChiDao: 'Chuẩn bị mùa đông, kiểm tra nước mùa đông, bảo trì công trình ngầm.',
  },
  {
    thang: 12,
    cauHinhLinhVuc: ['cay-xanh', 'giao-thong-do-thi', 'su-dung-chung'],
    noiDungChiDao: 'Tổng kết năm, lập kế hoạch năm sau, kiểm tra tổng quát toàn bộ hệ thống HTKT, tổng hợp kết quả đánh giá an toàn định kỳ.',
  },
]

export function getKeHoachThang(thang: number): ThoiDiemKiemTra | undefined {
  return KE_HOACH_KIEM_TRA_NAM.find((k) => k.thang === thang)
}
