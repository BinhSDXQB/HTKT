// Kế hoạch kiểm tra QLNN hàng năm của Phòng Hạ tầng kỹ thuật.
// Ma trận phân loại công trình, nội dung kiểm tra định kỳ, quy mô theo lĩnh vực.
// Căn cứ: TT 34/2026/TT-BXD (phân cấp công trình), TT 33/2026/TT-BXD (đánh giá an toàn), NĐ 207/2026 (kiểm tra bảo trì).

import type { LinhVucKey } from './phap-ly'

// ───────── Ma trận phân loại công trình HTKT ─────────
export type NhomCongTrinh = {
  linhVuc: LinhVucKey
  loai: string                                  // vd "Nhà máy nước", "Trạm bơm", "Đường cấp thoát nước"
  cap: 'I' | 'II' | 'III' | 'IV'
  quyMo: string                                 // vd "Công suất > 100.000 m³/ngày", "Dung tích > 10.000 m³"
  thamQuyenThamDinh: 'So_XD' | 'HDNT_ChuDauTu' // Thẩm quyền thẩm định (Sở hay HĐNT/chủ đầu tư)
  doiTuongKiemTraNT: boolean                    // Cơ quan chuyên môn có trách nhiệm kiểm tra nghiệm thu?
  ghiChu?: string
}

export const NHOM_CONG_TRINH: NhomCongTrinh[] = [
  // Cấp nước
  { linhVuc: 'cap-nuoc', loai: 'Nhà máy nước', cap: 'I', quyMo: 'Công suất ≥ 100.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cap-nuoc', loai: 'Nhà máy nước', cap: 'II', quyMo: 'Công suất 10.000–100.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cap-nuoc', loai: 'Nhà máy nước', cap: 'III', quyMo: 'Công suất 1.000–10.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cap-nuoc', loai: 'Nhà máy nước', cap: 'IV', quyMo: 'Công suất < 1.000 m³/ngày', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
  { linhVuc: 'cap-nuoc', loai: 'Mạng phân phối cấp nước', cap: 'I', quyMo: 'Chiều dài > 50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cap-nuoc', loai: 'Mạng phân phối cấp nước', cap: 'II', quyMo: 'Chiều dài 20–50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cap-nuoc', loai: 'Mạng phân phối cấp nước', cap: 'III', quyMo: 'Chiều dài 5–20 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'cap-nuoc', loai: 'Mạng phân phối cấp nước', cap: 'IV', quyMo: 'Chiều dài < 5 km', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Thoát nước
  { linhVuc: 'thoat-nuoc', loai: 'Hệ thống thoát nước công cộng', cap: 'I', quyMo: 'Dung tích/lưu lượng ≥ 500 l/s', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'thoat-nuoc', loai: 'Hệ thống thoát nước công cộng', cap: 'II', quyMo: 'Dung tích/lưu lượng 100–500 l/s', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'thoat-nuoc', loai: 'Hệ thống thoát nước công cộng', cap: 'III', quyMo: 'Dung tích/lưu lượng 10–100 l/s', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'thoat-nuoc', loai: 'Hệ thống thoát nước công cộng', cap: 'IV', quyMo: 'Dung tích/lưu lượng < 10 l/s', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
  { linhVuc: 'thoat-nuoc', loai: 'Nhà máy xử lý nước thải', cap: 'I', quyMo: 'Công suất ≥ 50.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'thoat-nuoc', loai: 'Nhà máy xử lý nước thải', cap: 'II', quyMo: 'Công suất 5.000–50.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'thoat-nuoc', loai: 'Nhà máy xử lý nước thải', cap: 'III', quyMo: 'Công suất 500–5.000 m³/ngày', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'thoat-nuoc', loai: 'Nhà máy xử lý nước thải', cap: 'IV', quyMo: 'Công suất < 500 m³/ngày', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Cây xanh
  { linhVuc: 'cay-xanh', loai: 'Công viên đô thị', cap: 'I', quyMo: 'Diện tích ≥ 20 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cay-xanh', loai: 'Công viên đô thị', cap: 'II', quyMo: 'Diện tích 5–20 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cay-xanh', loai: 'Công viên đô thị', cap: 'III', quyMo: 'Diện tích 0,5–5 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'cay-xanh', loai: 'Công viên đô thị', cap: 'IV', quyMo: 'Diện tích < 0,5 ha', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
  { linhVuc: 'cay-xanh', loai: 'Trồng cây xanh đường phố', cap: 'I', quyMo: 'Chiều dài ≥ 30 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'cay-xanh', loai: 'Trồng cây xanh đường phố', cap: 'II', quyMo: 'Chiều dài 10–30 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'cay-xanh', loai: 'Trồng cây xanh đường phố', cap: 'III', quyMo: 'Chiều dài 2–10 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'cay-xanh', loai: 'Trồng cây xanh đường phố', cap: 'IV', quyMo: 'Chiều dài < 2 km', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Chiếu sáng
  { linhVuc: 'chieu-sang', loai: 'Hệ thống chiếu sáng công cộng', cap: 'I', quyMo: 'Chiều dài ≥ 50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'chieu-sang', loai: 'Hệ thống chiếu sáng công cộng', cap: 'II', quyMo: 'Chiều dài 20–50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'chieu-sang', loai: 'Hệ thống chiếu sáng công cộng', cap: 'III', quyMo: 'Chiều dài 5–20 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'chieu-sang', loai: 'Hệ thống chiếu sáng công cộng', cap: 'IV', quyMo: 'Chiều dài < 5 km', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Nghĩa trang
  { linhVuc: 'nghia-trang', loai: 'Nghĩa trang công cộng', cap: 'I', quyMo: 'Diện tích ≥ 10 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'nghia-trang', loai: 'Nghĩa trang công cộng', cap: 'II', quyMo: 'Diện tích 2–10 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'nghia-trang', loai: 'Nghĩa trang công cộng', cap: 'III', quyMo: 'Diện tích 0,2–2 ha', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'nghia-trang', loai: 'Nghĩa trang công cộng', cap: 'IV', quyMo: 'Diện tích < 0,2 ha', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Giao thông đô thị
  { linhVuc: 'giao-thong-do-thi', loai: 'Đường đô thị', cap: 'I', quyMo: 'Chiều dài ≥ 50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'giao-thong-do-thi', loai: 'Đường đô thị', cap: 'II', quyMo: 'Chiều dài 10–50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'giao-thong-do-thi', loai: 'Đường đô thị', cap: 'III', quyMo: 'Chiều dài 2–10 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'giao-thong-do-thi', loai: 'Đường đô thị', cap: 'IV', quyMo: 'Chiều dài < 2 km', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
  { linhVuc: 'giao-thong-do-thi', loai: 'Cầu đô thị', cap: 'I', quyMo: 'Nhịp chính ≥ 100 m', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'giao-thong-do-thi', loai: 'Cầu đô thị', cap: 'II', quyMo: 'Nhịp chính 30–100 m', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'giao-thong-do-thi', loai: 'Cầu đô thị', cap: 'III', quyMo: 'Nhịp chính 10–30 m', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'giao-thong-do-thi', loai: 'Cầu đô thị', cap: 'IV', quyMo: 'Nhịp chính < 10 m', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },

  // Không gian ngầm
  { linhVuc: 'khong-gian-ngam', loai: 'Bãi đỗ xe ngầm', cap: 'I', quyMo: 'Sức chứa ≥ 1.000 chỗ', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'khong-gian-ngam', loai: 'Bãi đỗ xe ngầm', cap: 'II', quyMo: 'Sức chứa 300–1.000 chỗ', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'khong-gian-ngam', loai: 'Bãi đỗ xe ngầm', cap: 'III', quyMo: 'Sức chứa 50–300 chỗ', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'khong-gian-ngam', loai: 'Bãi đỗ xe ngầm', cap: 'IV', quyMo: 'Sức chứa < 50 chỗ', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
  { linhVuc: 'khong-gian-ngam', loai: 'Tuy-nen kỹ thuật', cap: 'I', quyMo: 'Diện tích tiết diện ≥ 5 m²', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'khong-gian-ngam', loai: 'Tuy-nen kỹ thuật', cap: 'II', quyMo: 'Diện tích tiết diện 2–5 m²', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },

  // Sử dụng chung
  { linhVuc: 'su-dung-chung', loai: 'Cột dùng chung HTKT', cap: 'I', quyMo: 'Chiều dài ≥ 50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'su-dung-chung', loai: 'Cột dùng chung HTKT', cap: 'II', quyMo: 'Chiều dài 10–50 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: true },
  { linhVuc: 'su-dung-chung', loai: 'Cột dùng chung HTKT', cap: 'III', quyMo: 'Chiều dài 2–10 km', thamQuyenThamDinh: 'So_XD', doiTuongKiemTraNT: false },
  { linhVuc: 'su-dung-chung', loai: 'Cột dùng chung HTKT', cap: 'IV', quyMo: 'Chiều dài < 2 km', thamQuyenThamDinh: 'HDNT_ChuDauTu', doiTuongKiemTraNT: false },
]

export function getNhomCongTrinh(linhVuc: LinhVucKey): NhomCongTrinh[] {
  return NHOM_CONG_TRINH.filter((n) => n.linhVuc === linhVuc)
}

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
      'Tuân thủ quy hoạch, thiết kế, TCVN về cấp nước',
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
      'Tuân thủ TCVN 07-2:2016/BXD, QCVN 14:2008/BTNMT',
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
      'Tuân thủ QCVN 07-4:2016/BXD về cây xanh',
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
      'Tuân thủ TCVN 07-3:2016/BXD, NĐ 79/2009',
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
      'Tuân thủ Luật 35/2024, TCVN 07-4:2016/BXD',
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
      'Tuân thủ NĐ 39/2010 (theo quy định chuyển tiếp NĐ 217/2026)',
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

// ───────── Quy mô công trình theo 3 nhóm (A/B/C) ─────────
export type QuyMo = {
  linhVuc: LinhVucKey
  nhomA: { moTa: string; thamQuyen: string }
  nhomB: { moTa: string; thamQuyen: string }
  nhomC: { moTa: string; thamQuyen: string }
}

export const QUY_MO_LINH_VUC: QuyMo[] = [
  {
    linhVuc: 'cap-nuoc',
    nhomA: { moTa: 'Nhà máy nước cấp I-II, mạng phân phối > 20 km', thamQuyen: 'Sở Xây dựng thẩm định, theo dõi bảo trì' },
    nhomB: { moTa: 'Nhà máy nước cấp III, mạng phân phối 5–20 km', thamQuyen: 'Sở Xây dựng thẩm định, huyện bảo trì' },
    nhomC: { moTa: 'Mạng phân phối cấp IV < 5 km, hộ dân nước nông thôn', thamQuyen: 'Huyện/xã thẩm định, thôn xã bảo trì' },
  },
  {
    linhVuc: 'thoat-nuoc',
    nhomA: { moTa: 'Hệ thống > 500 l/s, NM XLNT cấp I-II', thamQuyen: 'Sở XD thẩm định, theo dõi bảo trì' },
    nhomB: { moTa: 'Hệ thống 100–500 l/s, NM XLNT cấp III', thamQuyen: 'Sở XD thẩm định, huyện bảo trì' },
    nhomC: { moTa: 'Hệ thống 10–100 l/s, tiểu quy mô nông thôn', thamQuyen: 'Huyện/xã thẩm định, bảo trì' },
  },
  {
    linhVuc: 'cay-xanh',
    nhomA: { moTa: 'Công viên ≥ 5 ha, trồng cây ≥ 30 km', thamQuyen: 'Sở XD thẩm định, quản lý; phòng HTKT theo dõi' },
    nhomB: { moTa: 'Công viên 0,5–5 ha, trồng cây 10–30 km', thamQuyen: 'Sở XD thẩm định; huyện, phường quản lý' },
    nhomC: { moTa: 'Công viên < 0,5 ha, trồng cây < 10 km', thamQuyen: 'Phường/xã thẩm định, quản lý' },
  },
  {
    linhVuc: 'chieu-sang',
    nhomA: { moTa: 'Chiếu sáng phố chính ≥ 50 km', thamQuyen: 'Sở XD thẩm định, đơn vị quản lý' },
    nhomB: { moTa: 'Chiếu sáng phố nhỏ, công viên 20–50 km', thamQuyen: 'Sở XD thẩm định; phường/huyện quản lý' },
    nhomC: { moTa: 'Chiếu sáng tiểu quy mô < 20 km', thamQuyen: 'Phường/xã thẩm định, quản lý' },
  },
  {
    linhVuc: 'nghia-trang',
    nhomA: { moTa: 'Nghĩa trang ≥ 10 ha hoặc NM hỏa táng cấp I', thamQuyen: 'Sở XD thẩm định, Sở LĐ-TBXH quản lý' },
    nhomB: { moTa: 'Nghĩa trang 2–10 ha hoặc NM hỏa táng cấp II', thamQuyen: 'Sở XD thẩm định; huyện/phường quản lý' },
    nhomC: { moTa: 'Nghĩa trang < 2 ha hoặc tiểu quy mô nông thôn', thamQuyen: 'Huyện/xã thẩm định, quản lý' },
  },
  {
    linhVuc: 'giao-thong-do-thi',
    nhomA: { moTa: 'Đường cấp I-II ≥ 50 km, cầu lớn ≥ 100 m', thamQuyen: 'Sở XD thẩm định, Sở GTVT quản lý bảo trì' },
    nhomB: { moTa: 'Đường cấp III 10–50 km, cầu trung bình', thamQuyen: 'Sở XD thẩm định; huyện quản lý bảo trì' },
    nhomC: { moTa: 'Đường cấp IV < 10 km, cầu nhỏ', thamQuyen: 'Huyện/xã thẩm định, bảo trì' },
  },
  {
    linhVuc: 'khong-gian-ngam',
    nhomA: { moTa: 'Bãi đỗ ngầm ≥ 1000 chỗ, tuy-nen ≥ 5 m²', thamQuyen: 'Sở XD thẩm định, quản lý' },
    nhomB: { moTa: 'Bãi đỗ ngầm 300–1000 chỗ, tuy-nen 2–5 m²', thamQuyen: 'Sở XD thẩm định; huyện quản lý' },
    nhomC: { moTa: 'Bãi đỗ < 300 chỗ, tuy-nen < 2 m²', thamQuyen: 'Huyện/xã thẩm định, quản lý' },
  },
  {
    linhVuc: 'su-dung-chung',
    nhomA: { moTa: 'Cột/cống dùng chung ≥ 50 km', thamQuyen: 'Sở XD quản lý, chủ cột thích ứng' },
    nhomB: { moTa: 'Cột/cống dùng chung 10–50 km', thamQuyen: 'Huyện/phường quản lý' },
    nhomC: { moTa: 'Cột/cống dùng chung < 10 km', thamQuyen: 'Phường/xã quản lý' },
  },
]

export function getQuyMoLinhVuc(linhVuc: LinhVucKey): QuyMo | undefined {
  return QUY_MO_LINH_VUC.find((q) => q.linhVuc === linhVuc)
}

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
    noiDungChiDao: 'Kiểm tra tổng kết năm trước, lên kế hoạch bảo trì hàng năm, thực hiện đánh giá an toàn công trình lần đầu.',
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
    noiDungChiDao: 'Nâng cấp chiếu sáng mùa đông, đánh giá an toàn lần 2 (nửa năm sau), kiểm tra đường.',
  },
  {
    thang: 11,
    cauHinhLinhVuc: ['thoat-nuoc', 'cap-nuoc', 'khong-gian-ngam'],
    noiDungChiDao: 'Chuẩn bị mùa đông, kiểm tra nước mùa đông, bảo trì công trình ngầm.',
  },
  {
    thang: 12,
    cauHinhLinhVuc: ['cay-xanh', 'giao-thong-do-thi', 'su-dung-chung'],
    noiDungChiDao: 'Tổng kết năm, lập kế hoạch năm sau, kiểm tra tổng quát toàn bộ hệ thống HTKT, đánh giá an toàn lần 3.',
  },
]

export function getKeHoachThang(thang: number): ThoiDiemKiemTra | undefined {
  return KE_HOACH_KIEM_TRA_NAM.find((k) => k.thang === thang)
}
