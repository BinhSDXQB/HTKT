// Danh mục công việc thường xuyên của Phòng Hạ tầng kỹ thuật — gom theo nhóm nghiệp vụ,
// dùng để định hướng đầu việc hàng ngày/định kỳ và làm gợi ý khi tạo Công việc của phòng.

export type NhomCongViec = {
  nhom: string
  tanSuat: string
  viec: string[]
}

export const CONG_VIEC_THUONG_XUYEN: NhomCongViec[] = [
  {
    nhom: 'Tham mưu, xây dựng văn bản',
    tanSuat: 'Theo phát sinh',
    viec: [
      'Dự thảo tờ trình, công văn, báo cáo, kế hoạch trình Lãnh đạo Sở/UBND tỉnh.',
      'Tham mưu xây dựng cơ chế, chính sách, quy định quản lý HTKT đô thị.',
      'Góp ý dự thảo văn bản quy phạm pháp luật, quy hoạch, dự án do bộ/ngành/địa phương gửi.',
      'Tham mưu triển khai Luật, Nghị định, Thông tư mới về HTKT (xây dựng kế hoạch triển khai, phổ biến).',
    ],
  },
  {
    nhom: 'Thẩm định, kiểm tra',
    tanSuat: 'Theo hồ sơ',
    viec: [
      'Thẩm định Báo cáo NCKT dự án HTKT thuộc thẩm quyền (BCKTKT chỉ khi Sở trực thuộc người quyết định đầu tư và được giao — Đ31 k3); thiết kế triển khai do chủ đầu tư thẩm định (Đ41 NĐ 217/2026).',
      'Kiểm tra công tác nghiệm thu hoàn thành công trình HTKT.',
      'Lấy ý kiến, tổng hợp ý kiến phối hợp; lập thông báo kết quả thẩm định.',
    ],
  },
  {
    nhom: 'Quản lý, vận hành hạ tầng',
    tanSuat: 'Thường xuyên',
    viec: [
      'Theo dõi quản lý, bảo trì, vận hành hệ thống HTKT do tỉnh giao (cấp nước, thoát nước, chiếu sáng, cây xanh...).',
      'Theo dõi chất lượng dịch vụ HTKT, xử lý sự cố, phản ánh của người dân.',
      'Quản lý chi phí, định mức dịch vụ HTKT đô thị.',
    ],
  },
  {
    nhom: 'Cơ sở dữ liệu, báo cáo',
    tanSuat: 'Định kỳ',
    viec: [
      'Cập nhật, quản lý cơ sở dữ liệu hạ tầng kỹ thuật của tỉnh.',
      'Tổng hợp số liệu, lập báo cáo định kỳ (tháng/quý/năm) và đột xuất theo yêu cầu.',
      'Xây dựng các chỉ tiêu HTKT đô thị (tỷ lệ cấp nước, thu gom xử lý nước thải, đất cây xanh...).',
    ],
  },
  {
    nhom: 'Phối hợp, hành chính',
    tanSuat: 'Thường xuyên',
    viec: [
      'Chuẩn bị nội dung, giấy mời, tài liệu họp; tham gia đoàn kiểm tra, khảo sát hiện trường.',
      'Phối hợp các phòng, đơn vị, UBND cấp xã trong quản lý HTKT.',
      'Tiếp nhận, xử lý văn bản đến/đi liên quan lĩnh vực phòng phụ trách.',
    ],
  },
]
