// Công tác tham mưu của Phòng Hạ tầng kỹ thuật theo từng lĩnh vực (QĐ 331/QĐ-SXD mục 7).
// noiDung = các nội dung tham mưu quản lý nhà nước; sanPham = sản phẩm/văn bản đầu ra thường gặp.
// 3 lĩnh vực trọng tâm (cấp nước, thoát nước, cây xanh) chi tiết; còn lại nêu khung.

import type { LinhVucKey } from './phap-ly'

export type ThamMuu = {
  noiDung: string[]
  sanPham: string[]
}

export const THAM_MUU: Record<LinhVucKey, ThamMuu> = {
  'cap-nuoc': {
    noiDung: [
      'Tham mưu xây dựng kế hoạch, chương trình, chỉ tiêu cấp nước sạch đô thị; lập/điều chỉnh quy hoạch cấp nước trong quy hoạch đô thị.',
      'Tham mưu cơ chế, chính sách phát triển cấp nước, xã hội hóa đầu tư, giá nước sạch, vùng phục vụ cấp nước.',
      'Tham mưu thẩm định, góp ý dự án cấp nước; theo dõi cấp nước an toàn, chống thất thoát thất thu (giảm tỷ lệ nước không doanh thu).',
      'Tham mưu quản lý, bảo trì, vận hành hệ thống cấp nước đô thị do tỉnh giao; xử lý sự cố, bảo đảm an ninh, an toàn cấp nước.',
      'Xây dựng, cập nhật cơ sở dữ liệu mạng lưới cấp nước; tổng hợp báo cáo định kỳ, đột xuất.',
    ],
    sanPham: [
      'Tờ trình/Báo cáo về kế hoạch, chương trình cấp nước.',
      'Văn bản góp ý/thẩm định dự án cấp nước.',
      'Dự thảo Quyết định công bố vùng phục vụ cấp nước.',
      'Báo cáo hiện trạng cấp nước, tỷ lệ dân đô thị được cấp nước sạch.',
    ],
  },
  'thoat-nuoc': {
    noiDung: [
      'Tham mưu lập, quản lý quy hoạch thoát nước; kế hoạch đầu tư hệ thống thoát nước mưa, nước thải, XLNT đô thị.',
      'Tham mưu cơ chế quản lý dịch vụ thoát nước, giá dịch vụ thoát nước và xử lý nước thải, hợp đồng quản lý vận hành.',
      'Tham mưu giải pháp chống ngập đô thị, đấu nối thoát nước, quản lý bùn thải.',
      'Tham mưu thẩm định, góp ý dự án thoát nước & XLNT; theo dõi tỷ lệ thu gom, xử lý nước thải đô thị.',
      'Xây dựng cơ sở dữ liệu hệ thống thoát nước; báo cáo định kỳ, đột xuất.',
    ],
    sanPham: [
      'Tờ trình/Báo cáo quy hoạch, kế hoạch thoát nước.',
      'Dự thảo phương án giá dịch vụ thoát nước và xử lý nước thải.',
      'Văn bản góp ý/thẩm định dự án thoát nước, XLNT.',
      'Báo cáo tỷ lệ thu gom, xử lý nước thải đô thị.',
    ],
  },
  'cay-xanh': {
    noiDung: [
      'Tham mưu kế hoạch phát triển công viên, cây xanh đô thị; chỉ tiêu diện tích cây xanh/người theo loại đô thị.',
      'Tham mưu quy định quản lý cây xanh đô thị: danh mục cây trồng/hạn chế/cấm trồng, cấp phép chặt hạ - dịch chuyển cây xanh.',
      'Tham mưu phân cấp, giao quản lý cây xanh, công viên (chú ý xu hướng phân cấp đến cấp xã theo NĐ 258/2025).',
      'Tham mưu thẩm định, góp ý phương án cây xanh trong dự án HTKT, khu đô thị.',
      'Xây dựng cơ sở dữ liệu cây xanh, công viên; thống kê, báo cáo.',
    ],
    sanPham: [
      'Dự thảo Quy định quản lý cây xanh đô thị (trình UBND tỉnh).',
      'Dự thảo Quyết định ban hành danh mục cây trồng đô thị.',
      'Văn bản hướng dẫn cấp phép chặt hạ, dịch chuyển cây xanh.',
      'Báo cáo chỉ tiêu đất cây xanh đô thị.',
    ],
  },
  'chieu-sang': {
    noiDung: [
      'Tham mưu lập, quản lý quy hoạch chiếu sáng đô thị; kế hoạch, chương trình phát triển chiếu sáng công cộng (đường phố, công viên, quảng trường, công trình công cộng).',
      'Tham mưu cơ chế đầu tư, xã hội hóa chiếu sáng; chương trình tiết kiệm điện, thay thế đèn LED, chiếu sáng thông minh - điều khiển tập trung.',
      'Tham mưu quản lý vận hành, bảo trì hệ thống chiếu sáng công cộng; định mức, dự toán dịch vụ và hợp đồng quản lý vận hành.',
      'Tham mưu thẩm định, góp ý dự án chiếu sáng; phối hợp hạ ngầm, dùng chung cột với hạ tầng kỹ thuật khác.',
      'Xây dựng, cập nhật cơ sở dữ liệu hệ thống chiếu sáng; thống kê tỷ lệ chiếu sáng đường đô thị; báo cáo định kỳ, đột xuất.',
    ],
    sanPham: [
      'Báo cáo/kế hoạch phát triển chiếu sáng đô thị.',
      'Dự thảo quy định quản lý chiếu sáng công cộng đô thị.',
      'Văn bản góp ý/thẩm định dự án chiếu sáng.',
      'Báo cáo tỷ lệ chiều dài đường đô thị được chiếu sáng.',
    ],
  },
  'nghia-trang': {
    noiDung: [
      'Tham mưu lập, quản lý quy hoạch nghĩa trang, cơ sở hỏa táng, nhà tang lễ vùng tỉnh và đô thị.',
      'Tham mưu cơ chế quản lý, sử dụng, đầu tư xây dựng; giá dịch vụ nghĩa trang, hỏa táng; khuyến khích hỏa táng, hình thức táng văn minh, tiết kiệm đất.',
      'Tham mưu phương án đóng cửa, di chuyển nghĩa trang không phù hợp quy hoạch; cải tạo, chỉnh trang nghĩa trang hiện hữu.',
      'Tham mưu thẩm định, góp ý dự án nghĩa trang, cơ sở hỏa táng, nhà tang lễ.',
      'Xây dựng cơ sở dữ liệu nghĩa trang, cơ sở hỏa táng; thống kê, báo cáo.',
    ],
    sanPham: [
      'Báo cáo/Tờ trình quy hoạch nghĩa trang, cơ sở hỏa táng.',
      'Dự thảo quy định quản lý, sử dụng nghĩa trang trên địa bàn (trình UBND tỉnh).',
      'Dự thảo phương án giá dịch vụ nghĩa trang, hỏa táng.',
      'Văn bản góp ý/thẩm định dự án.',
    ],
  },
  'giao-thong-do-thi': {
    noiDung: [
      'Tham mưu quản lý kết cấu hạ tầng giao thông đô thị (đường, hè phố, cầu, nút giao, bãi đỗ); kế hoạch đầu tư, bảo trì.',
      'Tham mưu tổ chức giao thông đô thị, giao thông tĩnh, bãi đỗ xe; kết nối với vận tải hành khách công cộng.',
      'Tham mưu phân cấp quản lý, bảo trì đường đô thị; định mức, dự toán bảo trì.',
      'Tham mưu thẩm định, góp ý dự án hạ tầng giao thông đô thị; cấp phép thi công, đấu nối (theo phân cấp).',
      'Xây dựng cơ sở dữ liệu hạ tầng giao thông đô thị; báo cáo định kỳ, đột xuất.',
    ],
    sanPham: [
      'Báo cáo/kế hoạch đầu tư, bảo trì hạ tầng giao thông đô thị.',
      'Dự thảo phương án tổ chức giao thông, bãi đỗ xe đô thị.',
      'Văn bản góp ý/thẩm định dự án giao thông đô thị.',
      'Báo cáo hiện trạng hạ tầng giao thông đô thị.',
    ],
  },
  'khong-gian-ngam': {
    noiDung: [
      'Tham mưu lập, quản lý quy hoạch không gian xây dựng ngầm đô thị; cơ sở dữ liệu công trình ngầm.',
      'Tham mưu cơ chế đầu tư, khai thác công trình ngầm (bãi đỗ xe ngầm, hầm bộ hành, tuy-nen kỹ thuật, công trình công cộng ngầm).',
      'Tham mưu thẩm định, góp ý, cấp phép xây dựng công trình ngầm (theo phân cấp).',
      'Tham mưu kết nối, đồng bộ công trình ngầm với hạ tầng kỹ thuật dùng chung, hạ ngầm đường dây, cáp.',
      'Xây dựng cơ sở dữ liệu công trình ngầm; thống kê, báo cáo.',
    ],
    sanPham: [
      'Báo cáo/Tờ trình quản lý, quy hoạch không gian xây dựng ngầm.',
      'Văn bản góp ý/thẩm định công trình ngầm.',
      'Báo cáo hiện trạng công trình ngầm đô thị.',
    ],
  },
  'su-dung-chung': {
    noiDung: [
      'Tham mưu quản lý sử dụng chung công trình HTKT (cột điện/cột đa năng, cống bể cáp, hào/tuy-nen kỹ thuật).',
      'Tham mưu ban hành/điều chỉnh giá thuê công trình HTKT dùng chung; áp dụng mẫu hợp đồng sử dụng chung (TT 03/2013/TT-BXD).',
      'Tham mưu kế hoạch hạ ngầm, sắp xếp đường dây, cáp đi nổi; chỉnh trang đô thị.',
      'Tham mưu thẩm định, góp ý phương án sử dụng chung trong dự án HTKT, khu đô thị.',
      'Xây dựng cơ sở dữ liệu công trình HTKT dùng chung; thống kê, báo cáo.',
    ],
    sanPham: [
      'Dự thảo Quyết định ban hành giá thuê công trình HTKT dùng chung (trình UBND tỉnh).',
      'Dự thảo quy định/kế hoạch hạ ngầm, sắp xếp cáp đi nổi.',
      'Văn bản hướng dẫn, thỏa thuận sử dụng chung công trình HTKT.',
      'Báo cáo hiện trạng sử dụng chung công trình HTKT.',
    ],
  },
}

export function getThamMuu(key: LinhVucKey): ThamMuu {
  return THAM_MUU[key]
}
