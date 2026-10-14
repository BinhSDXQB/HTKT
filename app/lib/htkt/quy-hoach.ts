// HẠ TẦNG KỸ THUẬT TRONG QUY HOẠCH ĐÔ THỊ VÀ NÔNG THÔN.
//
// Phòng Hạ tầng kỹ thuật không lập đồ án quy hoạch, nhưng phải GÓP Ý / THAM GIA THẨM ĐỊNH
// phần hạ tầng kỹ thuật của đồ án. Tệp này gom đúng phần đó.
//
// Nguồn đã đối chiếu bản gốc trong kho văn bản của Sở ngày 24/8/2026:
//   • Luật Quy hoạch đô thị và nông thôn số 47/2024/QH15.
//   • Luật số 144/2025/QH15 sửa đổi, bổ sung một số điều của Luật Quy hoạch đô thị và nông thôn.
//   • Thông tư 16/2025/TT-BXD hướng dẫn Luật Quy hoạch đô thị và nông thôn.
//
// Không viết ra mốc thời gian, thẩm quyền nào mà chưa tra được điều khoản — xem CAN_DOI_CHIEU.

export type MucQuyHoach = {
  noiDung: string
  canCu: string
}

// ── Các loại và cấp độ quy hoạch (Luật 47/2024/QH15, Điều 3) ─────────────────
export const LOAI_QUY_HOACH: MucQuyHoach[] = [
  {
    noiDung:
      // Rà soát 14/10/2026: bản trước chép khoản 2 Điều 3 Luật 47/2024 nguyên gốc (còn "thị xã, thị trấn", "huyện") —
      // khoản này đã được Luật 144/2025 (Điều 1 khoản 2 điểm a, hiệu lực 01/01/2026) sửa theo chính quyền 2 cấp.
      'Các LOẠI quy hoạch: (a) quy hoạch đô thị — đối với thành phố; đô thị thuộc tỉnh; đô thị thuộc thành phố; đặc khu là đô thị; đô thị mới; (b) quy hoạch nông thôn — đối với xã; đặc khu không phải là đô thị; (c) quy hoạch khu chức năng; (d) quy hoạch KHÔNG GIAN NGẦM — đối với thành phố; (đ) quy hoạch CHUYÊN NGÀNH HẠ TẦNG KỸ THUẬT — đối với thành phố.',
    canCu: 'Luật 47/2024/QH15, Điều 3 khoản 2 (sửa bởi Luật 144/2025/QH15, Điều 1 khoản 2 điểm a)',
  },
  {
    noiDung: 'Các CẤP ĐỘ quy hoạch: quy hoạch chung → quy hoạch phân khu → quy hoạch chi tiết.',
    canCu: 'Luật 47/2024/QH15, Điều 3 khoản 3',
  },
]

// ── Định nghĩa cần thuộc ─────────────────────────────────────────────────────
export const DINH_NGHIA: MucQuyHoach[] = [
  {
    noiDung:
      'QUY HOẠCH CHUYÊN NGÀNH HẠ TẦNG KỸ THUẬT là việc xác định hệ thống hạ tầng kỹ thuật gồm công trình hạ tầng kỹ thuật THEO TUYẾN và công trình hạ tầng kỹ thuật KHÔNG THEO TUYẾN.',
    canCu: 'Luật 47/2024/QH15, Điều 2 khoản 14',
  },
  {
    noiDung:
      'HẠ TẦNG KỸ THUẬT KHUNG là hệ thống các công trình hạ tầng kỹ thuật CHÍNH của đô thị, nông thôn và khu chức năng, được xác định trong nội dung quy hoạch chung hoặc quy hoạch phân khu, gồm: các trục giao thông, tuyến truyền tải năng lượng, tuyến truyền dẫn cấp nước, thoát nước, công trình viễn thông, các công trình hạ tầng kỹ thuật không theo tuyến, công trình thuỷ lợi.',
    canCu: 'Luật 144/2025/QH15 sửa đổi khoản 15 Điều 2 Luật 47/2024/QH15',
  },
  {
    noiDung:
      'QUY HOẠCH CHUNG là việc xác định mục tiêu, định hướng phát triển tổng thể, kế hoạch phát triển dài hạn; tổ chức không gian, HỆ THỐNG CÔNG TRÌNH HẠ TẦNG KỸ THUẬT, công trình hạ tầng xã hội, nhà ở cho đô thị hoặc đô thị mới hoặc nông thôn hoặc khu kinh tế hoặc khu du lịch quốc gia.',
    canCu: 'Luật 144/2025/QH15 sửa đổi khoản 11 Điều 2 Luật 47/2024/QH15',
  },
  {
    noiDung:
      'QUY HOẠCH PHÂN KHU là việc phân chia và xác định chức năng, chỉ tiêu sử dụng đất quy hoạch và BỐ TRÍ HỆ THỐNG CÔNG TRÌNH HẠ TẦNG KỸ THUẬT, công trình hạ tầng xã hội, nhà ở cho một khu vực; cụ thể hoá quy hoạch chung hoặc quy hoạch tỉnh.',
    canCu: 'Luật 47/2024/QH15, Điều 2 khoản 12',
  },
  {
    noiDung:
      'QUY HOẠCH CHI TIẾT là việc phân chia và xác định chỉ tiêu sử dụng đất quy hoạch, yêu cầu quản lý kiến trúc cảnh quan cho từng lô đất, BỐ TRÍ CÔNG TRÌNH HẠ TẦNG KỸ THUẬT, công trình hạ tầng xã hội, nhà ở — cụ thể hoá quy hoạch phân khu hoặc quy hoạch chung hoặc quy hoạch không gian ngầm hoặc quy hoạch chuyên ngành hạ tầng kỹ thuật.',
    canCu: 'Luật 47/2024/QH15, Điều 2 khoản 13',
  },
]

// ── Điểm phải nắm với tỉnh Quảng Trị ─────────────────────────────────────────
export const AP_DUNG_TAI_TINH: MucQuyHoach[] = [
  {
    noiDung:
      'Quy hoạch CHUYÊN NGÀNH hạ tầng kỹ thuật và quy hoạch KHÔNG GIAN NGẦM chỉ lập đối với THÀNH PHỐ — Luật 144/2025 (Điều 1 khoản 36) thay cụm từ "thành phố trực thuộc trung ương" bằng "thành phố" trong Luật 47/2024, tức đơn vị hành chính cấp tỉnh là thành phố. Quảng Trị là tỉnh, nên trên địa bàn KHÔNG lập hai loại quy hoạch này; nội dung hạ tầng kỹ thuật được thể hiện trong quy hoạch chung, quy hoạch phân khu và quy hoạch chi tiết.',
    canCu: 'Luật 47/2024/QH15, Điều 3 khoản 2 điểm d và điểm đ (sửa bởi Luật 144/2025/QH15)',
  },
  {
    noiDung:
      'Quy hoạch không gian ngầm và quy hoạch chuyên ngành hạ tầng kỹ thuật của một thành phố trực thuộc trung ương phải ĐỒNG BỘ VỚI NHAU, cụ thể hoá hệ thống công trình hạ tầng kỹ thuật KHUNG và thống nhất với định hướng phát triển không gian, kiến trúc cảnh quan tại quy hoạch chung.',
    canCu: 'Luật 47/2024/QH15, Điều 7 khoản 1 điểm d',
  },
]

// ── Yêu cầu về hạ tầng kỹ thuật đối với mọi đồ án (Luật 47/2024/QH15, Điều 6) ─
export const YEU_CAU_HTKT_DOI_VOI_DO_AN: MucQuyHoach[] = [
  {
    noiDung:
      'Đáp ứng nhu cầu về hạ tầng kỹ thuật; bảo đảm sự KẾT NỐI ĐỒNG BỘ, THỐNG NHẤT giữa các hệ thống công trình hạ tầng kỹ thuật TRONG khu vực quy hoạch với các công trình hạ tầng kỹ thuật NGOÀI khu vực quy hoạch.',
    canCu: 'Luật 47/2024/QH15, Điều 6 khoản 6',
  },
  {
    noiDung:
      'Dự báo chỉ tiêu kinh tế – kỹ thuật phải bảo đảm cơ sở khoa học, đáp ứng yêu cầu thực tế, phù hợp xu thế phát triển; TUÂN THỦ QUY CHUẨN về quy hoạch đô thị và nông thôn; khai thác, sử dụng hợp lý tài nguyên thiên nhiên, đất đai.',
    canCu: 'Luật 47/2024/QH15, Điều 6 khoản 2',
  },
  {
    noiDung:
      'Khi lập, điều chỉnh quy hoạch để CẢI TẠO, CHỈNH TRANG đô thị: phải đánh giá đầy đủ về pháp lý, hiện trạng sử dụng đất, công trình hạ tầng kỹ thuật, công trình hạ tầng xã hội và không gian ngầm (nếu có), các yếu tố văn hoá – xã hội, môi trường, giá trị kiến trúc cảnh quan, để có giải pháp khai thác, sử dụng tiết kiệm, hiệu quả đất đô thị.',
    canCu: 'Luật 47/2024/QH15, Điều 6 khoản 8',
  },
]

// ── Trình tự lập, thẩm định, phê duyệt (Luật 47/2024/QH15, Điều 16) ──────────
export const TRINH_TU: string[] = [
  'Lựa chọn tổ chức tư vấn lập nhiệm vụ quy hoạch (nếu có)',
  'Lập nhiệm vụ quy hoạch',
  'Thẩm định nhiệm vụ quy hoạch',
  'Phê duyệt nhiệm vụ quy hoạch',
  'Lựa chọn tổ chức tư vấn lập quy hoạch',
  'Lập quy hoạch',
  'Thẩm định quy hoạch',
  'Phê duyệt quy hoạch',
]

export const TRINH_TU_CAN_CU = 'Luật 47/2024/QH15, Điều 16 khoản 1'

// ── Tám chuyên ngành HTKT phải có trong đồ án ────────────────────────────────
// Thông tư 16/2025/TT-BXD liệt kê thống nhất nhóm hạ tầng kỹ thuật cho bản đồ hiện trạng
// và bản đồ định hướng ở các cấp độ quy hoạch.
export type ChuyenNganhQH = {
  ten: string
  linhVucHtkt?: string       // khớp key lĩnh vực của Phòng HTKT (nếu có)
  ghiChu?: string
}

export const CHUYEN_NGANH_HTKT_TRONG_DO_AN: ChuyenNganhQH[] = [
  { ten: 'Giao thông', linhVucHtkt: 'giao-thong-do-thi' },
  { ten: 'Cấp điện và chiếu sáng đô thị', linhVucHtkt: 'chieu-sang', ghiChu: 'Đây là chỗ nội dung chiếu sáng đô thị xuất hiện trong đồ án quy hoạch — đi kèm cấp điện, không tách riêng.' },
  { ten: 'Thông tin liên lạc (hạ tầng viễn thông thụ động)', linhVucHtkt: 'su-dung-chung' },
  { ten: 'Cấp nước', linhVucHtkt: 'cap-nuoc' },
  { ten: 'Cao độ nền và thoát nước mưa', linhVucHtkt: 'thoat-nuoc' },
  { ten: 'Thoát nước thải', linhVucHtkt: 'thoat-nuoc' },
  { ten: 'Quản lý chất thải rắn', linhVucHtkt: 'thoat-nuoc' },
  { ten: 'Nghĩa trang và môi trường', linhVucHtkt: 'nghia-trang' },
]

export const CHUYEN_NGANH_CAN_CU =
  'Thông tư 16/2025/TT-BXD — thành phần bản vẽ hiện trạng và bản đồ định hướng hạ tầng kỹ thuật của quy hoạch chung, quy hoạch khu kinh tế'

// ── Yêu cầu về bản vẽ hạ tầng kỹ thuật ───────────────────────────────────────
export const YEU_CAU_BAN_VE: MucQuyHoach[] = [
  {
    noiDung:
      'Căn cứ điều kiện, đặc điểm phạm vi quy hoạch, CÓ THỂ lập các bản đồ, sơ đồ RIÊNG cho từng nội dung hiện trạng và định hướng hạ tầng kỹ thuật để thể hiện đầy đủ nội dung theo yêu cầu.',
    canCu: 'Thông tư 16/2025/TT-BXD, Điều 3 khoản 3',
  },
  {
    noiDung:
      'Phải LỒNG GHÉP các giải pháp, thiết kế về phòng cháy và chữa cháy phù hợp với từng cấp độ quy hoạch theo pháp luật về phòng cháy, chữa cháy và cứu nạn, cứu hộ.',
    canCu: 'Thông tư 16/2025/TT-BXD, Điều 3 khoản 3',
  },
  {
    noiDung:
      'Mọi sơ đồ, bản đồ trong hồ sơ nhiệm vụ và hồ sơ quy hoạch phải thể hiện rõ phạm vi quy hoạch; ranh giới và tên các đơn vị hành chính trong và tiếp giáp phạm vi quy hoạch.',
    canCu: 'Thông tư 16/2025/TT-BXD, Điều 3 khoản 4',
  },
  {
    noiDung:
      'Bản đồ hiện trạng của quy hoạch chung đô thị: thể hiện trên nền bản đồ địa hình tỷ lệ 1/10.000 hoặc 1/5.000 (khi quy hoạch chung là căn cứ lập quy hoạch chi tiết). Sơ đồ hiện trạng phát triển không gian và hạ tầng kỹ thuật toàn thành phố trực thuộc trung ương: tỷ lệ 1/25.000 hoặc 1/50.000.',
    canCu: 'Thông tư 16/2025/TT-BXD — thành phần bản vẽ quy hoạch chung',
  },
  {
    noiDung:
      'Bản đồ ĐỊNH HƯỚNG hạ tầng kỹ thuật: xác định mạng lưới, vị trí, quy mô các công trình HTKT cấp quốc gia, cấp vùng, cấp tỉnh theo từng chuyên ngành (cao độ nền, giao thông, hệ thống điện, cấp nước, cung cấp năng lượng, thoát nước và xử lý nước thải, quản lý chất thải rắn và nghĩa trang, hạ tầng viễn thông thụ động); thể hiện trên nền địa hình hiện trạng kết hợp bản đồ định hướng phát triển không gian, tỷ lệ 1/10.000 và 1/5.000 (khu vực xây dựng).',
    canCu: 'Thông tư 16/2025/TT-BXD — thành phần bản vẽ quy hoạch chung',
  },
]

// ── Nội dung thông minh phải lồng ghép vào quy hoạch ─────────────────────────
export const LONG_GHEP_THONG_MINH: MucQuyHoach[] = [
  {
    noiDung:
      'Lồng ghép nội dung, giải pháp THÔNG MINH vào quy hoạch chung đô thị, quy hoạch chuyên ngành hạ tầng kỹ thuật (với các thành phố), quy hoạch phân khu và quy hoạch chi tiết — phù hợp Đề án phát triển đô thị thông minh cấp tỉnh và kế hoạch cấp khu vực, được cấp có thẩm quyền phê duyệt.',
    canCu: 'Thông tư 03/2026/TT-BXD, Phụ lục I — chỉ số II.QH.03.01',
  },
  {
    noiDung: 'Quy hoạch đô thị và nông thôn LẬP MỚI phải được xây dựng cơ sở dữ liệu GIS và tích hợp lên Hệ thống cơ sở dữ liệu quốc gia về hoạt động xây dựng.',
    canCu: 'Thông tư 03/2026/TT-BXD, Phụ lục I — chỉ số II.QH.03.03',
  },
]

// ── Danh mục kiểm khi Phòng HTKT góp ý đồ án ────────────────────────────────
// Đây là DIỄN GIẢI NGHIỆP VỤ (không phải trích nguyên văn), mỗi mục nêu rõ bám vào đâu.
export const CHECKLIST_GOP_Y: { muc: string; bamVao: string }[] = [
  { muc: 'Đủ 8 chuyên ngành hạ tầng kỹ thuật trong phần hiện trạng và phần định hướng chưa (giao thông; cấp điện & chiếu sáng; thông tin liên lạc; cấp nước; cao độ nền & thoát nước mưa; thoát nước thải; chất thải rắn; nghĩa trang & môi trường)?', bamVao: 'TT 16/2025/TT-BXD — thành phần bản vẽ' },
  { muc: 'Hệ thống hạ tầng kỹ thuật KHUNG (trục giao thông, tuyến truyền tải năng lượng, tuyến cấp nước, thoát nước, viễn thông, công trình không theo tuyến, thuỷ lợi) đã được xác định trong quy hoạch chung hoặc phân khu chưa?', bamVao: 'Luật 144/2025/QH15 sửa khoản 15 Điều 2 Luật 47/2024' },
  { muc: 'Đồ án cấp dưới đã cụ thể hoá đúng hệ thống hạ tầng kỹ thuật của đồ án cấp trên chưa; có mâu thuẫn về hướng tuyến, cao độ nền, điểm đấu nối không?', bamVao: 'Luật 47/2024/QH15, Điều 7 khoản 1 điểm b và điểm c' },
  { muc: 'Hệ thống HTKT trong khu vực quy hoạch có kết nối đồng bộ, thống nhất với công trình HTKT NGOÀI khu vực quy hoạch không (điểm đấu nối cấp nước, thoát nước, cao độ nền, hướng tuyến giao thông)?', bamVao: 'Luật 47/2024/QH15, Điều 6 khoản 6' },
  { muc: 'Giải pháp phòng cháy chữa cháy đã lồng ghép phù hợp cấp độ quy hoạch chưa (đặc biệt: cấp nước chữa cháy, đường cho xe chữa cháy)?', bamVao: 'TT 16/2025/TT-BXD, Điều 3 khoản 3' },
  { muc: 'Nội dung, giải pháp thông minh đã lồng ghép chưa (điều khiển chiếu sáng, giám sát cấp – thoát nước, dữ liệu GIS)?', bamVao: 'TT 03/2026/TT-BXD, chỉ số II.QH.03.01' },
  { muc: 'Bản đồ có ghi rõ phạm vi, ranh giới và tên đơn vị hành chính trong và tiếp giáp không; tỷ lệ bản đồ có đúng cấp độ quy hoạch không?', bamVao: 'TT 16/2025/TT-BXD, Điều 3 khoản 4 và thành phần bản vẽ' },
]

// ── Điểm còn phải đối chiếu ─────────────────────────────────────────────────
export const CAN_DOI_CHIEU: string[] = [
  'Luật 47/2024/QH15 đã được sửa đổi, bổ sung HAI LẦN: bởi Luật số 71/2025/QH15 rồi bởi Luật số 144/2025/QH15 (ngày 11/12/2025, hiệu lực 01/01/2026). Kho văn bản của Sở hiện CHƯA có Luật 71/2025/QH15 — khi trích điều khoản Luật 47/2024 phải kiểm xem điều đó đã bị Luật 71/2025 sửa chưa.',
  'Tệp Luật 144/2025 trong kho đang mang tiêu đề "Luat quy hoach nong thon" — tên tệp SAI, nội dung thật là Luật sửa đổi, bổ sung một số điều của Luật Quy hoạch đô thị và nông thôn.',
  'Thẩm quyền và THỜI HẠN thẩm định từng cấp độ quy hoạch (bao nhiêu ngày, Hội đồng thẩm định gồm ai) chưa được đưa vào tệp này vì cần tra đúng điều khoản của Luật 47/2024/QH15 và Nghị định hướng dẫn; tra bằng công cụ tra cứu tài liệu trước khi trả lời công dân.',
  'Chỉ tiêu quy hoạch hạ tầng kỹ thuật (m³ nước/người/ngày đêm, tỷ lệ đất giao thông, chỉ tiêu cây xanh m²/người…) nằm ở quy chuẩn kỹ thuật quốc gia về quy hoạch xây dựng — CHƯA có bản gốc trong kho văn bản của Sở, không được nêu con số từ trí nhớ.',
  'Quy hoạch tỉnh Quảng Trị và quy hoạch chung các đô thị trên địa bàn chưa được nạp vào hệ thống; khi góp ý phải mở hồ sơ giấy hoặc bản số do phòng quản lý quy hoạch cung cấp.',
]

export const CAN_CU_MODULE = [
  'Luật Quy hoạch đô thị và nông thôn số 47/2024/QH15',
  'Luật số 144/2025/QH15 sửa đổi, bổ sung một số điều của Luật Quy hoạch đô thị và nông thôn',
  'Thông tư 16/2025/TT-BXD hướng dẫn Luật Quy hoạch đô thị và nông thôn',
  'Thông tư 03/2026/TT-BXD hướng dẫn Nghị định về phát triển đô thị thông minh (phần lồng ghép nội dung thông minh vào quy hoạch)',
]
