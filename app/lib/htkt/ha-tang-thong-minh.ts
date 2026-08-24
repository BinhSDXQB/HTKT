// HẠ TẦNG KỸ THUẬT ĐÔ THỊ THÔNG MINH — nội dung chuyên môn của Phòng Hạ tầng kỹ thuật.
//
// NGUỒN: toàn bộ nội dung dưới đây trích từ hai văn bản CÓ THẬT, đã đối chiếu bản gốc
// trong kho văn bản của Sở (G:\My Drive\Tailieu_VBPL) ngày 24/8/2026:
//   • Nghị định 269/2025/NĐ-CP ngày 14/10/2025 về phát triển đô thị thông minh
//     — Điều 23 (yêu cầu chung), Điều 24 (lĩnh vực HTKT thông minh), Điều 25 (tích hợp, liên thông).
//   • Thông tư 03/2026/TT-BXD ngày 28/01/2026 hướng dẫn Nghị định về phát triển đô thị thông minh
//     — Điều 2 (đánh giá cấp độ trưởng thành) và Phụ lục I (bộ chỉ số theo 3 cấp độ).
//
// KHÔNG suy diễn, không thêm số hiệu văn bản từ trí nhớ. Chỗ nào văn bản không quy định
// thì ghi vào KHOANG_TRONG bên dưới thay vì tự đặt ra quy định.

import type { LinhVucKey } from './phap-ly'
import { xepHang } from './tim-kiem'

// ── Ba cấp độ trưởng thành (TT 03/2026/TT-BXD, Điều 2 khoản 2 điểm a) ────────
export const CAP_DO = [
  { key: 'nen_tang', ten: 'Xây dựng nền tảng', moTa: 'Cấp độ thấp nhất — hình thành thiết bị, hệ thống rời rạc.' },
  { key: 'lien_ket', ten: 'Liên kết hệ thống', moTa: 'Các hệ thống được quản lý tập trung và chia sẻ dữ liệu với Trung tâm điều hành cấp tỉnh.' },
  { key: 'doi_moi', ten: 'Đổi mới quản trị', moTa: 'Tích hợp AI và công nghệ mới vào phân tích, tối ưu hoá vận hành.' },
] as const

export type CapDoKey = (typeof CAP_DO)[number]['key']

// ── Nguyên tắc phát triển HTKT thông minh (NĐ 269/2025, Điều 23) ─────────────
export const NGUYEN_TAC_PHAT_TRIEN: { khoan: string; noiDung: string }[] = [
  {
    khoan: 'Điều 23 khoản 1',
    noiDung:
      'Phát triển HTKT đô thị thông minh là ứng dụng công nghệ số và giải pháp đổi mới sáng tạo trong xây dựng, nâng cấp, quản lý, vận hành để tối ưu hoá việc sử dụng tài nguyên, bảo vệ môi trường, nâng cao chất lượng dịch vụ và thúc đẩy phát triển bền vững.',
  },
  {
    khoan: 'Điều 23 khoản 2',
    noiDung:
      'Ưu tiên hình thức giải quyết được vấn đề cấp bách của từng đô thị; huy động được nguồn lực xã hội; linh hoạt và nhân rộng được; ưu tiên vật liệu xanh, công nghệ xanh, giảm phát thải. Khuyến khích mô hình quản lý – vận hành hệ thống điện, chiếu sáng, cấp nhiệt, cấp khí.',
  },
  {
    khoan: 'Điều 23 khoản 3',
    noiDung:
      'Thiết kế theo nguyên tắc ƯU TIÊN TIÊU CHUẨN MỞ, bảo đảm khả năng mở rộng và KHÔNG PHỤ THUỘC vào một công nghệ hay nhà cung cấp duy nhất. Đây là điều kiện phải đưa vào yêu cầu kỹ thuật khi thẩm định dự án.',
  },
  {
    khoan: 'Điều 23 khoản 4',
    noiDung:
      'Tổ chức được giao quản lý khai thác, sử dụng công trình HTKT phải xây dựng kế hoạch, lộ trình phát triển HTKT thông minh và cung cấp, chia sẻ dữ liệu theo thời gian thực.',
  },
]

// ── Yêu cầu tích hợp, liên thông (NĐ 269/2025, Điều 25) ──────────────────────
export const YEU_CAU_LIEN_THONG: { khoan: string; noiDung: string }[] = [
  {
    khoan: 'Điều 25 khoản 1 điểm a',
    noiDung:
      'Kết nối và chia sẻ dữ liệu liên thông theo thời gian thực với Nền tảng tích hợp, chia sẻ dữ liệu cấp tỉnh (LGSP) và Trung tâm giám sát, điều hành đô thị thông minh.',
  },
  {
    khoan: 'Điều 25 khoản 1 điểm b',
    noiDung: 'Tuân thủ các mô hình dữ liệu chung và quy chuẩn kỹ thuật, tiêu chuẩn về khả năng tương tác theo quy định.',
  },
  {
    khoan: 'Điều 25 khoản 1 điểm c',
    noiDung: 'Cung cấp giao diện lập trình ứng dụng (API) MỞ để tích hợp được với các hệ thống khác.',
  },
  {
    khoan: 'Điều 25 khoản 2',
    noiDung:
      'Uỷ ban nhân dân cấp tỉnh quy định cụ thể trách nhiệm cung cấp, chu kỳ và tiêu chuẩn chất lượng dữ liệu của từng cơ quan quản lý hạ tầng kỹ thuật.',
  },
]

// ── Năm lĩnh vực HTKT thông minh (NĐ 269/2025, Điều 24) ──────────────────────
export type LinhVucThongMinh = {
  khoan: string
  ten: string
  linhVucHtkt: LinhVucKey[]      // ánh xạ sang lĩnh vực của Phòng HTKT
  thanhPhan: string[]            // nguyên văn các hợp phần Nghị định liệt kê
}

export const LINH_VUC_THONG_MINH: LinhVucThongMinh[] = [
  {
    khoan: 'Điều 24 khoản 1',
    ten: 'Hạ tầng phục vụ quản lý, giám sát, điều hành giao thông đô thị',
    linhVucHtkt: ['giao-thong-do-thi'],
    thanhPhan: [
      'Hệ thống điều khiển tín hiệu giao thông thích ứng',
      'Hệ thống quản lý, giám sát và phân tích lưu lượng giao thông',
      'Hệ thống thu phí điện tử không dừng',
      'Hệ thống quản lý bến xe, bãi đỗ xe thông minh',
      'Hạ tầng cho phương tiện giao thông xanh thông minh, hệ thống trạm sạc điện, trạm cấp năng lượng, hạ tầng cho xe tự lái',
      'Hạ tầng vận tải đa phương thức và kết nối liên thông; các điểm trung chuyển thông minh',
      'Nền tảng tích hợp các loại hình giao thông công cộng hỗ trợ lập kế hoạch, đặt chỗ, thanh toán điện tử toàn trình',
    ],
  },
  {
    khoan: 'Điều 24 khoản 2',
    ten: 'Hệ thống năng lượng thông minh',
    linhVucHtkt: ['chieu-sang'],
    thanhPhan: [
      'Lưới điện thông minh tích hợp thiết bị và công nghệ quản lý năng lượng thông minh',
      'Khả năng giám sát và quản lý phụ tải',
      'Tích hợp các nguồn năng lượng tái tạo',
      'Hệ thống đo lường, giám sát sử dụng năng lượng theo thời gian thực',
    ],
  },
  {
    khoan: 'Điều 24 khoản 3',
    ten: 'Chiếu sáng công cộng thông minh',
    linhVucHtkt: ['chieu-sang'],
    thanhPhan: [
      'Sử dụng thiết bị chiếu sáng tiết kiệm năng lượng, hiệu suất cao',
      'Được trang bị cảm biến và kết nối mạng',
      'Tự động điều chỉnh độ sáng dựa trên điều kiện môi trường và lưu lượng giao thông',
      'Được quản lý tập trung để giám sát và cảnh báo sự cố',
    ],
  },
  {
    khoan: 'Điều 24 khoản 4',
    ten: 'Cấp, thoát nước thông minh',
    linhVucHtkt: ['cap-nuoc', 'thoat-nuoc'],
    thanhPhan: [
      'Hệ thống cảm biến giám sát chất lượng nước, áp suất, lưu lượng',
      'Hệ thống cảnh báo rò rỉ, thất thoát nước',
      'Hệ thống cảnh báo ngập lụt và điều phối vận hành hệ thống thoát nước',
      'Hệ thống cơ sở dữ liệu, thông tin khách hàng và các giải pháp, công nghệ thông minh khác',
    ],
  },
  {
    khoan: 'Điều 24 khoản 5',
    ten: 'Quản lý chất thải rắn thông minh',
    linhVucHtkt: ['thoat-nuoc'],
    thanhPhan: [
      'Hệ thống giám sát thu gom, vận chuyển',
      'Hệ thống tối ưu hoá lộ trình thu gom rác thải',
      'Các công nghệ xử lý rác thải tiên tiến thu hồi năng lượng',
    ],
  },
]

// ── Bộ chỉ số trưởng thành liên quan HTKT (TT 03/2026/TT-BXD, Phụ lục I) ─────
export type ChiSoTruongThanh = {
  kyHieu: string                 // ví dụ III.NL.06.01
  truCot: string                 // trụ cột trong Phụ lục I
  nhom: string                   // tiêu chí / nhóm lĩnh vực
  ten: string
  coBan?: 'B1' | 'B2'            // chỉ số cơ bản (B1 do cấp tỉnh, B2 do đô thị) — chỉ ghi khi Phụ lục I có ký hiệu
  linhVucHtkt: LinhVucKey[]
  nenTang: string
  lienKet?: string
  doiMoi?: string
  /** Nội dung ở bảng "Giải thích nội dung chỉ số" của Phụ lục I — KHÁC với ô cấp độ ở bảng chính. */
  giaiThich?: string
}

export const CHI_SO_TRUONG_THANH: ChiSoTruongThanh[] = [
  // ── Trụ cột II — Quy hoạch và xây dựng thông minh ──
  {
    kyHieu: 'II.QH.03.01',
    truCot: 'Quy hoạch và xây dựng thông minh',
    nhom: 'Quy hoạch đô thị thông minh',
    ten: 'Nội dung thông minh được tích hợp vào các quy hoạch đô thị',
    coBan: 'B2',
    linhVucHtkt: [],
    nenTang: '(B2) Tích hợp vào các cấp độ quy hoạch đô thị.',
    giaiThich:
      'Lồng ghép nội dung, giải pháp thông minh vào quy hoạch chung đô thị, QUY HOẠCH CHUYÊN NGÀNH HẠ TẦNG KỸ THUẬT đối với các thành phố, quy hoạch phân khu, quy hoạch chi tiết — phù hợp Đề án phát triển đô thị thông minh cấp tỉnh và kế hoạch phát triển đô thị thông minh cấp khu vực, cụ thể hoá nội dung thông minh của quy hoạch cấp cao hơn, được cấp có thẩm quyền phê duyệt.',
  },
  {
    kyHieu: 'II.QH.03.02',
    truCot: 'Quy hoạch và xây dựng thông minh',
    nhom: 'Quy hoạch đô thị thông minh',
    ten: 'Nền tảng hỗ trợ lập, thẩm định, phê duyệt quy hoạch đô thị và nông thôn',
    coBan: 'B1',
    linhVucHtkt: [],
    nenTang: 'Có nền tảng, công cụ hỗ trợ lập, thẩm định quy hoạch đô thị và nông thôn trên nền GIS.',
    lienKet: 'Có nền tảng, công cụ hỗ trợ lập, thẩm định, PHÊ DUYỆT quy hoạch đô thị và nông thôn trên nền GIS.',
  },
  {
    kyHieu: 'II.QH.03.03',
    truCot: 'Quy hoạch và xây dựng thông minh',
    nhom: 'Quy hoạch đô thị thông minh',
    ten: 'Xây dựng cơ sở dữ liệu quy hoạch đô thị và nông thôn',
    coBan: 'B2',
    linhVucHtkt: [],
    nenTang:
      'Quy hoạch đô thị và nông thôn lập mới được xây dựng cơ sở dữ liệu GIS và tích hợp lên Hệ thống cơ sở dữ liệu quốc gia về hoạt động xây dựng.',
    lienKet: 'Chuyển đổi, số hoá và xây dựng cơ sở dữ liệu quy hoạch đô thị, nông thôn trên địa bàn phục vụ quản lý tại địa phương.',
  },

  // ── Trụ cột III — Hạ tầng kỹ thuật · Giao thông ──
  {
    kyHieu: 'III.GT.05.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Hạ tầng cho phương tiện xe đạp',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Khu trung tâm đô thị, các điểm trung chuyển giao thông có bố trí hệ thống giao thông tĩnh và dịch vụ cung cấp chia sẻ xe đạp trong bán kính 250 m.',
    lienKet: 'Thông tin về hệ thống giao thông tĩnh và phương tiện xe đạp chia sẻ được chia sẻ trên 01 ứng dụng dùng chung; tích hợp vào hệ thống quản lý điều hành giao thông của tỉnh.',
    doiMoi: 'Có hệ thống phân tích nâng cao hỗ trợ tối ưu hoá dịch vụ giao thông xe đạp chia sẻ.',
  },
  {
    kyHieu: 'III.GT.05.02',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Hệ thống điều khiển tín hiệu giao thông thông minh',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các tuyến đường chính đô thị được trang bị hệ thống điều khiển tín hiệu giao thông thông minh.',
    lienKet: 'Hệ thống tín hiệu giao thông được tích hợp vào hệ thống quản lý điều hành giao thông của tỉnh.',
    doiMoi: 'Có hệ thống phân tích nâng cao hỗ trợ tối ưu hoá điều tiết giao thông.',
  },
  {
    kyHieu: 'III.GT.05.03',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Đường phố được giám sát theo thời gian thực',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các tuyến đường chính đô thị được trang bị hệ thống giám sát đa mục tiêu (an ninh trật tự, an toàn giao thông…) theo thời gian thực.',
    lienKet: 'Thông tin giám sát đường phố được tích hợp vào hệ thống quản lý điều hành giao thông thông minh, chia sẻ thông tin cần thiết tới người dân.',
    doiMoi: 'Có hệ thống phân tích nâng cao hỗ trợ, cảnh báo điều hành giao thông.',
  },
  {
    kyHieu: 'III.GT.05.04',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Bãi đỗ xe công cộng có thông tin chỗ trống theo thời gian thực và trạm cấp năng lượng sạch',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các bãi đỗ xe công cộng có hệ thống kiểm soát tự động, quản lý chỗ trống theo thời gian thực.',
    lienKet: 'Thông tin chỗ trống và trạm cấp năng lượng sạch được chia sẻ theo thời gian thực trên 01 ứng dụng dùng chung, tích hợp vào hệ thống quản lý điều hành giao thông của tỉnh.',
    doiMoi: 'Có hệ thống phân tích hỗ trợ điều hướng đỗ xe theo khu vực.',
  },
  {
    kyHieu: 'III.GT.05.05',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Hệ thống giao thông công cộng truy cập trực tuyến theo thời gian thực',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Thông tin các tuyến xe buýt, đường sắt đô thị được quản lý và truy cập trực tuyến theo thời gian thực.',
    lienKet: 'Thông tin nêu trên được cung cấp trên 01 ứng dụng dùng chung và tích hợp vào hệ thống quản lý điều hành giao thông của tỉnh.',
    doiMoi: 'Có hệ thống phân tích hỗ trợ trung chuyển đa phương thức, chia sẻ phục vụ người dân trên 01 ứng dụng dùng chung.',
  },
  {
    kyHieu: 'III.GT.05.06',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Giao thông công cộng cung cấp Internet không dây miễn phí và thông tin thời gian thực',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các tuyến xe buýt công cộng đô thị cung cấp kết nối Internet không dây miễn phí.',
    lienKet: 'Các tuyến xe buýt công cộng đô thị và nhà chờ xe buýt cung cấp thông tin về giao thông công cộng theo thời gian thực.',
  },
  {
    kyHieu: 'III.GT.05.07',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Phương tiện giao thông đô thị có mức phát thải thấp',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các tuyến xe buýt công cộng đô thị sử dụng năng lượng có mức phát thải thấp.',
    lienKet: 'Các phương tiện giao thông dịch vụ sử dụng năng lượng có mức phát thải thấp.',
    doiMoi: 'Số phương tiện cơ giới cá nhân chuyển sang phi cơ giới hoặc năng lượng sạch đạt theo kế hoạch của tỉnh.',
  },
  {
    kyHieu: 'III.GT.05.08',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Dịch vụ giao thông đô thị sử dụng thanh toán điện tử',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Các bãi đỗ xe, loại hình giao thông công cộng đô thị sử dụng phương thức thanh toán điện tử.',
    lienKet: 'Các dịch vụ giao thông đô thị thiết yếu sử dụng phương thức thanh toán điện tử.',
  },
  {
    kyHieu: 'III.GT.05.09',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Giao thông',
    ten: 'Hệ thống quản lý điều hành giám sát giao thông đô thị',
    linhVucHtkt: ['giao-thong-do-thi'],
    nenTang: 'Thiết lập hệ thống quản lý điều hành giám sát giao thông đô thị.',
    lienKet: 'Tích hợp tổng thể các hệ thống, thông tin, dữ liệu giao thông đô thị theo thời gian thực vào hệ thống quản lý điều hành giám sát giao thông đô thị cấp tỉnh.',
    doiMoi: 'Tích hợp trí tuệ nhân tạo (AI) và công nghệ mới vào quản lý điều hành giao thông đô thị thông minh.',
  },

  // ── Trụ cột III — Hạ tầng kỹ thuật · Năng lượng (CHIẾU SÁNG) ──
  {
    kyHieu: 'III.NL.06.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Năng lượng',
    ten: 'Chiếu sáng đường phố thông minh',
    linhVucHtkt: ['chieu-sang'],
    nenTang: 'Đèn chiếu sáng đường phố sử dụng thiết bị tiết kiệm năng lượng, hiệu suất cao.',
    lienKet:
      'Đèn chiếu sáng đường phố được tối ưu hoá, điều chỉnh TỰ ĐỘNG dựa trên cảm biến; được quản lý, vận hành TẬP TRUNG và chia sẻ thông tin với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Tích hợp AI và công nghệ mới vào hệ thống chiếu sáng đô thị.',
  },
  {
    kyHieu: 'III.NL.06.02',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Năng lượng',
    ten: 'Quản lý năng lượng theo thời gian thực',
    linhVucHtkt: ['chieu-sang'],
    nenTang: 'Các hộ tiêu thụ được lắp đồng hồ điện tử; thông tin tiêu thụ năng lượng được chia sẻ theo thời gian thực.',
    lienKet: 'Có hệ thống quản lý, giám sát, điều tiết năng lượng tiêu thụ theo thời gian thực, vận hành tập trung và chia sẻ với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Nguồn năng lượng tái tạo hoà lưới được kiểm soát và điều tiết bởi hệ thống quản lý, giám sát, điều tiết tập trung.',
  },

  // ── Trụ cột III — Hạ tầng kỹ thuật · Cấp nước, thoát nước, chất thải, môi trường ──
  {
    kyHieu: 'III.CN.07.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Cấp nước',
    ten: 'Quản lý cấp nước theo thời gian thực',
    linhVucHtkt: ['cap-nuoc'],
    nenTang: 'Các toà nhà, hộ dân được lắp đặt đồng hồ đo nước thông minh.',
    lienKet: 'Các đơn vị cấp nước có hệ thống quản lý, giám sát mạng lưới và chất lượng nước, chia sẻ liên thông với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Tích hợp AI và công nghệ mới vào quản lý cấp nước thông minh.',
  },
  {
    kyHieu: 'III.TNT.08.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Thoát nước thải',
    ten: 'Quản lý thoát nước thải theo thời gian thực',
    linhVucHtkt: ['thoat-nuoc'],
    nenTang: 'Có hệ thống quản lý thoát nước tập trung và giám sát chất lượng nước tại khu vực xả thải vào môi trường.',
    lienKet: 'Hệ thống thoát nước thải được quản lý, giám sát theo thời gian thực, tích hợp chia sẻ thông tin với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Áp dụng công nghệ mới tối ưu hoá vận hành, xử lý và tái sử dụng nước thải.',
  },
  {
    kyHieu: 'III.TNM.09.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Thoát nước mưa',
    ten: 'Quản lý thoát nước mưa bền vững và cảnh báo ngập lụt theo thời gian thực',
    linhVucHtkt: ['thoat-nuoc'],
    nenTang: 'Có giải pháp thoát nước bền vững; có hệ thống quản lý, giám sát thoát nước mưa và cảnh báo ngập lụt đô thị.',
    lienKet: 'Hệ thống thoát nước mưa, cảnh báo ngập lụt được quản lý, giám sát theo thời gian thực, tích hợp và chia sẻ với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Tích hợp AI và công nghệ mới hỗ trợ phân tích, đánh giá, kiểm soát rủi ro ngập lụt.',
  },
  {
    kyHieu: 'III.CTR.10.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Chất thải rắn',
    ten: 'Chất thải rắn đô thị được phân loại tại nguồn',
    linhVucHtkt: ['thoat-nuoc'],
    nenTang: 'Chất thải rắn được phân loại tại nguồn, được giám sát thu gom và trung chuyển theo thời gian thực.',
    lienKet: 'Hệ thống giám sát, quản lý thu gom, xử lý chất thải rắn chia sẻ thông tin với Trung tâm điều hành cấp tỉnh.',
    doiMoi: 'Tích hợp AI hỗ trợ tối ưu hoá lộ trình, quy trình xử lý; ứng dụng khoa học công nghệ trong thu gom, thu hồi, tái chế, tạo năng lượng.',
  },
  {
    kyHieu: 'III.MT.11.01',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Môi trường',
    ten: 'Hệ thống quan trắc môi trường theo thời gian thực',
    linhVucHtkt: ['thoat-nuoc', 'cay-xanh'],
    nenTang: 'Có hệ thống quan trắc chất lượng không khí và nước theo thời gian thực tại khu vực trung tâm đô thị và các khu dân cư.',
    lienKet: 'Hệ thống quan trắc môi trường theo thời gian thực được tích hợp với Trung tâm điều hành cấp tỉnh và chia sẻ thông tin với người dân.',
  },
  {
    kyHieu: 'III.MT.11.02',
    truCot: 'Hạ tầng kỹ thuật',
    nhom: 'Môi trường',
    ten: 'Hệ thống thông tin phục vụ dự báo, cảnh báo, truyền tin thiên tai và cấp độ rủi ro thiên tai',
    linhVucHtkt: ['thoat-nuoc', 'giao-thong-do-thi'],
    nenTang: 'Có cơ sở hạ tầng công cộng đáp ứng khả năng ứng cứu sự cố thiên tai và biến đổi khí hậu theo các cấp độ rủi ro.',
    lienKet: 'Hệ thống quy trình ứng phó và thông tin cảnh báo thiên tai được liên thông, tích hợp với Trung tâm điều hành cấp tỉnh và chia sẻ với người dân.',
    doiMoi: 'Tích hợp AI và công nghệ mới hỗ trợ phân tích, đánh giá, kiểm soát rủi ro sự cố thiên tai và kịch bản sơ tán.',
  },
]

// ── Cách đánh giá, công nhận (TT 03/2026/TT-BXD, Điều 2) ─────────────────────
export const CACH_DANH_GIA: { khoan: string; noiDung: string }[] = [
  {
    khoan: 'Điều 2 khoản 1',
    noiDung: 'Đánh giá phải công khai, khách quan, minh bạch; áp dụng thống nhất bộ tiêu chí, chỉ số tại Phụ lục I.',
  },
  {
    khoan: 'Điều 2 khoản 1 điểm c',
    noiDung:
      'Đánh giá phải dựa trên DỮ LIỆU, HỒ SƠ, KẾT QUẢ THỰC HIỆN THỰC TẾ đến thời điểm đánh giá. KHÔNG đánh giá trên cơ sở định hướng, đề án, kế hoạch chưa được thực hiện có kết quả cụ thể.',
  },
  {
    khoan: 'Điều 2 khoản 2 điểm b',
    noiDung: 'Mỗi chỉ số chỉ có hai kết quả: ĐẠT hoặc KHÔNG ĐẠT. Chỉ số không có minh chứng phù hợp được đánh giá là KHÔNG ĐẠT.',
  },
  {
    khoan: 'Điều 2 khoản 2 điểm c',
    noiDung: 'Đô thị, đô thị mới CẤP TỈNH đánh giá theo 19 chỉ số cơ bản (B1, B2) và chọn thêm các chỉ số nâng cao theo lĩnh vực ưu tiên.',
  },
  {
    khoan: 'Điều 2 khoản 2 điểm d',
    noiDung:
      'Đô thị, đô thị mới THUỘC TỈNH đánh giá theo 09 chỉ số cơ bản (B2) và chọn thêm chỉ số nâng cao; đồng thời đánh giá 10 chỉ số cơ bản (B1) do cấp tỉnh thực hiện.',
  },
  {
    khoan: 'Điều 2 khoản 3 điểm b',
    noiDung:
      'Được công nhận theo cấp độ trưởng thành khi đạt các tiêu chí cơ bản (B1, B2) của cấp độ đó VÀ các cấp độ liền kề trước, đồng thời đạt toàn bộ tiêu chí nâng cao theo các lĩnh vực khi đánh giá.',
  },
  {
    khoan: 'Điều 2 khoản 5',
    noiDung:
      'UBND cấp tỉnh tổ chức lựa chọn tổ chức đánh giá và lập hồ sơ đề nghị đối với đô thị cấp tỉnh hoặc đô thị có ranh giới hơn 01 đơn vị hành chính cấp xã; UBND cấp xã thực hiện đối với đô thị nằm gọn trong 01 đơn vị hành chính cấp xã.',
  },
]

// ── Việc của Phòng Hạ tầng kỹ thuật khi triển khai ───────────────────────────
// Đây là DIỄN GIẢI NGHIỆP VỤ từ các quy định trên (không phải trích nguyên văn),
// nêu rõ mỗi việc bám vào điều khoản nào để cán bộ đối chiếu được.
export const VIEC_CUA_PHONG: { viec: string; bamVao: string }[] = [
  {
    viec: 'Khi thẩm định dự án HTKT có hạng mục thông minh: kiểm tra điều kiện “tiêu chuẩn mở, không phụ thuộc một nhà cung cấp duy nhất” đã được đưa vào yêu cầu kỹ thuật chưa.',
    bamVao: 'NĐ 269/2025 Điều 23 khoản 3',
  },
  {
    viec: 'Kiểm tra hồ sơ thiết kế có yêu cầu API mở và khả năng kết nối LGSP / Trung tâm điều hành đô thị thông minh hay không — thiếu thì yêu cầu bổ sung.',
    bamVao: 'NĐ 269/2025 Điều 25 khoản 1',
  },
  {
    viec: 'Tham mưu UBND tỉnh quy định trách nhiệm cung cấp dữ liệu, chu kỳ và tiêu chuẩn chất lượng dữ liệu của từng đơn vị quản lý HTKT (cấp nước, thoát nước, chiếu sáng, cây xanh, bãi đỗ xe).',
    bamVao: 'NĐ 269/2025 Điều 25 khoản 2',
  },
  {
    viec: 'Yêu cầu đơn vị được giao quản lý công trình HTKT lập kế hoạch, lộ trình phát triển HTKT thông minh và cam kết chia sẻ dữ liệu theo thời gian thực.',
    bamVao: 'NĐ 269/2025 Điều 23 khoản 4',
  },
  {
    viec: 'Khi góp ý đồ án quy hoạch: kiểm tra nội dung, giải pháp thông minh đã được lồng ghép vào quy hoạch chuyên ngành HTKT / phân khu / chi tiết chưa.',
    bamVao: 'TT 03/2026/TT-BXD Phụ lục I, chỉ số II.QH.03.01',
  },
  {
    viec: 'Trước khi báo cáo mức độ đạt chỉ số: chuẩn bị MINH CHỨNG THỰC TẾ (dữ liệu vận hành, ảnh hiện trường, biên bản nghiệm thu). Đề án hoặc kế hoạch chưa triển khai không được tính là đạt.',
    bamVao: 'TT 03/2026/TT-BXD Điều 2 khoản 1 điểm c và khoản 2 điểm b',
  },
]

// ── Khoảng trống đã đối chiếu — nói rõ để không ai hiểu nhầm là hệ thống thiếu sót ──
export const KHOANG_TRONG: string[] = [
  'Phụ lục I Thông tư 03/2026/TT-BXD KHÔNG có chỉ số riêng cho công viên, cây xanh đô thị (đã tra toàn văn 97 đoạn trong kho ngày 24/8/2026). Cây xanh chỉ xuất hiện gián tiếp qua chỉ số môi trường III.MT.11.01. Nội dung quản lý công viên, cây xanh áp dụng theo Nghị định 258/2025/NĐ-CP.',
  'Nghị định 269/2025/NĐ-CP và Thông tư 03/2026/TT-BXD KHÔNG quy định thông số kỹ thuật cụ thể của đèn (độ rọi, công suất, nhiệt độ màu). Các thông số này thuộc quy chuẩn/tiêu chuẩn kỹ thuật chuyên ngành — hiện CHƯA có bản gốc trong kho văn bản của Sở, cần bổ sung trước khi dùng làm căn cứ thẩm định.',
  'Đề án phát triển đô thị thông minh tỉnh Quảng Trị (Điều 6, Điều 7 NĐ 269/2025) chưa được nạp vào hệ thống. Nhiều chỉ số phải đối chiếu Đề án của tỉnh mới kết luận được đạt hay không đạt.',
]

// ── Truy vấn ────────────────────────────────────────────────────────────────
export function chiSoTheoLinhVuc(linhVuc: LinhVucKey): ChiSoTruongThanh[] {
  return CHI_SO_TRUONG_THANH.filter((c) => c.linhVucHtkt.includes(linhVuc))
}

export function timChiSo(tuKhoa: string): ChiSoTruongThanh[] {
  if (!tuKhoa.trim()) return []
  return xepHang(
    CHI_SO_TRUONG_THANH,
    tuKhoa,
    (c) => [c.kyHieu, c.ten, c.nhom, c.truCot, c.nenTang, c.lienKet, c.doiMoi, c.giaiThich].filter(Boolean).join(' '),
    2
  )
}

export const CAN_CU_MODULE = [
  'Nghị định 269/2025/NĐ-CP ngày 14/10/2025 của Chính phủ về phát triển đô thị thông minh',
  'Thông tư 03/2026/TT-BXD ngày 28/01/2026 của Bộ Xây dựng hướng dẫn một số điều của Nghị định về phát triển đô thị thông minh',
]
