// Phân công nhiệm vụ cán bộ, công chức Phòng Hạ tầng kỹ thuật
// Nguồn: Thông báo số 01/TB-HTKT ngày 10/10/2025 (căn cứ QĐ 331/QĐ-SXD ngày 05/9/2025).

export type PhanCongCanBo = {
  hoTen: string
  chucVu: string
  // Các lĩnh vực HTKT trực tiếp phụ trách (khớp key trong LINH_VUC_HTKT, dùng để liên kết).
  linhVuc: string[]
  // Nhiệm vụ chính được giao.
  nhiemVu: string[]
  // Địa bàn xã/phường được phân công (nếu có).
  diaBan?: string[]
}

export const PHAN_CONG: PhanCongCanBo[] = [
  {
    hoTen: 'Trần Hữu Sửu',
    chucVu: 'Trưởng phòng',
    linhVuc: [], // phụ trách chung toàn bộ lĩnh vực
    nhiemVu: [
      'Phụ trách chung, chỉ đạo điều hành toàn bộ hoạt động của Phòng theo QĐ 331/QĐ-SXD',
      'Chỉ đạo xây dựng kế hoạch, chương trình, chỉ tiêu, cơ chế chính sách phát triển hạ tầng kỹ thuật; hướng dẫn, kiểm tra sau phê duyệt',
      'Tổ chức hoạt động xúc tiến đầu tư, vận động, khai thác nguồn lực phát triển HTKT',
      'Chỉ đạo thẩm định BCNCKT/BCKTKT, thiết kế triển khai sau TKCS; kiểm tra nghiệm thu HTKT khu chức năng, khu dân cư nông thôn, đường bộ trong đô thị (trừ quốc lộ qua đô thị)',
      'Chỉ đạo PCTN, thực hành tiết kiệm chống lãng phí, KNTC; quy hoạch - đào tạo bồi dưỡng CBCC; CCHC; thi đua - khen thưởng của Phòng',
      'Chỉ đạo CCHC, Khoa học công nghệ và đổi mới sáng tạo; thông tin báo cáo định kỳ, đột xuất',
      'Xây dựng và quản lý cơ sở dữ liệu về hạ tầng kỹ thuật',
    ],
    diaBan: [
      'Nam Gianh', 'Nam Ba Đồn', 'Tân Gianh', 'Trung Thuần', 'Quảng Trạch',
      'Hòa Trạch', 'Phú Trạch', 'P. Ba Đồn', 'P. Bắc Gianh',
    ],
  },
  {
    hoTen: 'Ngô Thị Ái Linh',
    chucVu: 'Phó Trưởng phòng',
    linhVuc: ['cay-xanh', 'nghia-trang'],
    nhiemVu: [
      'Giúp Trưởng phòng phụ trách một số mặt công tác; điều hành hoạt động của Phòng khi Trưởng phòng đi vắng',
      'Trực tiếp tham mưu QLNN lĩnh vực hạ tầng cây xanh, nghĩa trang, cơ sở hỏa táng (quy hoạch, kế hoạch, đầu tư xây dựng, quản lý vận hành, tổng hợp dữ liệu báo cáo)',
      'Trực tiếp tham gia thẩm định, kiểm tra nghiệm thu các công trình HTKT được phân công',
      'Tổng hợp báo cáo định kỳ tháng, quý, 6 tháng, năm và đột xuất báo cáo UBND tỉnh, Bộ Xây dựng',
    ],
  },
  {
    hoTen: 'Trần Văn Bình',
    chucVu: 'Phó Trưởng phòng',
    linhVuc: ['chieu-sang', 'su-dung-chung'],
    nhiemVu: [
      'Giúp Trưởng phòng phụ trách một số mặt công tác',
      'Trực tiếp tham mưu QLNN lĩnh vực hạ tầng điện chiếu sáng (quy hoạch, kế hoạch, đầu tư xây dựng, quản lý vận hành, tổng hợp dữ liệu báo cáo)',
      'Trực tiếp tham gia thẩm định, kiểm tra nghiệm thu các công trình HTKT được phân công',
      'Trực tiếp tham mưu công tác đổi mới sáng tạo và chuyển đổi số',
      'Tham gia hội đồng thẩm định đánh giá tác động môi trường các dự án HTKT trên địa bàn',
      'Tham gia tổ giúp việc Ban chỉ đạo chỉnh trang cáp thông tin',
      'Tổng hợp, tích hợp cơ sở dữ liệu về hạ tầng kỹ thuật',
    ],
  },
  {
    hoTen: 'Phạm Minh Thành',
    chucVu: 'Chuyên viên',
    linhVuc: ['giao-thong-do-thi'],
    nhiemVu: [
      'Trực tiếp tham mưu QLNN lĩnh vực hạ tầng giao thông (quy hoạch, kế hoạch, đầu tư xây dựng, quản lý vận hành, tổng hợp dữ liệu báo cáo)',
      'Trực tiếp tham gia thẩm định, kiểm tra nghiệm thu các công trình HTKT được phân công',
    ],
  },
  {
    hoTen: 'Nguyễn Tuấn Long',
    chucVu: 'Chuyên viên',
    linhVuc: ['khong-gian-ngam', 'thoat-nuoc'],
    nhiemVu: [
      'Trực tiếp tham mưu QLNN lĩnh vực: quản lý không gian xây dựng ngầm; hạ tầng thoát nước mưa, thoát nước thải (quy hoạch, kế hoạch, đầu tư xây dựng, quản lý vận hành, tổng hợp dữ liệu báo cáo)',
      'Trực tiếp tham gia thẩm định, kiểm tra nghiệm thu các công trình HTKT được phân công',
    ],
  },
  {
    hoTen: 'Lê Quang Nhật Minh',
    chucVu: 'Chuyên viên',
    linhVuc: ['cap-nuoc'],
    nhiemVu: [
      'Trực tiếp tham mưu QLNN lĩnh vực hạ tầng cấp nước (quy hoạch, kế hoạch, đầu tư xây dựng, quản lý vận hành, tổng hợp dữ liệu báo cáo)',
      'Trực tiếp tham gia thẩm định, kiểm tra nghiệm thu các công trình HTKT được phân công',
      'Tham gia tổ cấp nước an toàn',
    ],
  },
]

// Tra cứu nhanh: theo key lĩnh vực -> tên cán bộ phụ trách trực tiếp.
export function nguoiPhuTrach(linhVucKey: string): string | null {
  const cb = PHAN_CONG.find((p) => p.linhVuc.includes(linhVucKey))
  return cb ? cb.hoTen : null
}
