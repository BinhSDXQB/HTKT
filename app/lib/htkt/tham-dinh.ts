// Quy trình thẩm định / kiểm tra công tác nghiệm thu công trình hạ tầng kỹ thuật
// tại cơ quan chuyên môn về xây dựng (Sở Xây dựng) — theo Luật Xây dựng 135/2025/QH15
// và Nghị định 217/2026/NĐ-CP (thay NĐ 175/2024, hiệu lực 01/7/2026) + NĐ 206/2026 + bộ TT 32–38/2026/TT-BXD.
// Mốc thời gian là quy định khung — đối chiếu nhóm dự án và văn bản hiện hành khi áp dụng.

export type BuocThamDinh = {
  buoc: number
  ten: string
  noiDung: string
  trachNhiem?: string
}

export type QuyTrinh = {
  key: string
  ten: string
  moTa: string
  apDung: string          // phạm vi áp dụng
  hoSo: string[]          // thành phần hồ sơ
  buoc: BuocThamDinh[]
  thoiGian: string[]      // thời hạn theo nhóm dự án
  ketQua: string          // sản phẩm đầu ra
  canCu: string[]
  ghiChu?: string[]       // lưu ý cho người thẩm định
}

// Quy trình HTKT.01 — 17 bước nhận diện và phân loại dự án trước khi bắt đầu thẩm định
// Theo Luật Xây dựng 135/2025/QH15 & các Nghị định hướng dẫn (hiệu lực 01/7/2026).
// Nguồn: Th.s Nguyễn Phú Bình – FUBI XD360 – INNOVATA (cập nhật 20/6/2026).
export const QUY_TRINH_NHAN_DIEN: QuyTrinh = {
  key: 'nhan-dien-phan-loai',
  ten: 'Nhận diện và phân loại dự án (HTKT.01)',
  moTa: '17 bước nhận diện, phân loại dự án trước khi bắt đầu thẩm định — xác định quy trình thẩm định phù hợp theo Luật XD & NĐ hướng dẫn 01/7/2026.',
  apDung: 'Tất cả dự án đầu tư xây dựng trước khi lập hồ sơ thẩm định tại cơ quan chuyên môn về xây dựng.',
  hoSo: [
    'Ý tưởng đầu tư / văn bản yêu cầu lập hồ sơ nhận diện.',
    'Hồ sơ, tài liệu, dữ liệu pháp lý và thông tin nền liên quan.',
    'Bản đồ vị trí, quy hoạch liên quan (nếu có).',
    'Văn bản chủ trương đầu tư (nếu đã có).',
  ],
  buoc: [
    {
      buoc: 1,
      ten: 'Tiếp nhận nhiệm vụ',
      noiDung: 'Xác định yêu cầu lập hồ sơ nhận diện và phân loại dự án từ ý tưởng đầu tư hoặc yêu cầu của cơ quan có thẩm quyền.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 2,
      ten: 'Thu thập thông tin ban đầu',
      noiDung: 'Thu thập hồ sơ, tài liệu, dữ liệu pháp lý và thông tin nền về dự án. Nếu chưa đủ thông tin: yêu cầu bổ sung trước khi chốt phân loại.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 3,
      ten: 'Xác định mục tiêu – quy mô – địa điểm',
      noiDung: 'Làm rõ mục tiêu đầu tư, quy mô sơ bộ, địa điểm dự kiến của dự án.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 4,
      ten: 'Xác định nguồn vốn',
      noiDung: 'Phân loại nguồn vốn: đầu tư công / PPP / vốn khác / vốn hỗn hợp.',
      trachNhiem: 'Phòng chuyên môn phối hợp KH-TC',
    },
    {
      buoc: 5,
      ten: 'Xác định hình thức đầu tư',
      noiDung: 'Xác định hình thức: đầu tư mới / sửa chữa / cải tạo / mở rộng / nâng cấp / di dời.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 6,
      ten: 'Xác định loại dự án',
      noiDung: 'Phân loại: dự án đầu tư công / PPP / đầu tư kinh doanh / trường hợp khác.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 7,
      ten: 'Xác định nhóm dự án',
      noiDung: 'Phân nhóm theo quy mô, tổng mức đầu tư: Quan trọng quốc gia / Nhóm A / Nhóm B / Nhóm C.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 8,
      ten: 'Xác định loại và cấp công trình',
      noiDung: 'Xác định loại công trình (dân dụng, công nghiệp, HTKT, giao thông…), cấp công trình (đặc biệt, I, II, III, IV) và công trình chính của dự án. Lưu ý: công trình điện chiếu sáng cần xác định rõ để lấy ý kiến Sở Công Thương ở bước phối hợp.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 9,
      ten: 'Xác định thẩm quyền quyết định đầu tư',
      noiDung: 'Làm rõ người quyết định đầu tư / cơ quan có thẩm quyền phê duyệt dự án (Quốc hội, Thủ tướng, Bộ trưởng, Chủ tịch UBND tỉnh/huyện…).',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 10,
      ten: 'Xác định chủ đầu tư / cơ quan chuẩn bị dự án',
      noiDung: 'Chốt chủ thể chủ trì thực hiện và chịu trách nhiệm: chủ đầu tư, ban quản lý dự án, cơ quan chuẩn bị dự án.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 11,
      ten: 'Rà soát yêu cầu về đất đai',
      noiDung: 'Có sử dụng đất không? Có thu hồi đất, giao đất, cho thuê đất không? Xác định thủ tục đất đai cần thực hiện.',
      trachNhiem: 'Phòng chuyên môn phối hợp Sở TN&MT',
    },
    {
      buoc: 12,
      ten: 'Rà soát yêu cầu về quy hoạch',
      noiDung: 'Có cần lập, điều chỉnh hoặc sử dụng quy hoạch làm căn cứ hay không? Kiểm tra sự phù hợp quy hoạch hiện hành.',
      trachNhiem: 'Phòng chuyên môn phối hợp QH-KT',
    },
    {
      buoc: 13,
      ten: 'Rà soát yêu cầu về môi trường',
      noiDung: 'Có phải lập báo cáo đánh giá tác động môi trường (ĐTM) hoặc xin giấy phép môi trường hay không?',
      trachNhiem: 'Phòng chuyên môn phối hợp Sở TN&MT',
    },
    {
      buoc: 14,
      ten: 'Rà soát yêu cầu về kiến trúc',
      noiDung: 'Có phải thi tuyển phương án kiến trúc hay không? Kiểm tra điều kiện theo Luật Kiến trúc.',
      trachNhiem: 'Phòng chuyên môn phối hợp QH-KT',
    },
    {
      buoc: 15,
      ten: 'Rà soát yêu cầu về giấy phép xây dựng',
      noiDung: 'Thuộc diện yêu cầu giấy phép xây dựng hay được miễn giấy phép? Xác định loại GPXD cần xin.',
      trachNhiem: 'Phòng chuyên môn phối hợp QLHĐ-XD',
    },
    {
      buoc: 16,
      ten: 'Rà soát yêu cầu về lựa chọn nhà thầu',
      noiDung: 'Có phát sinh hoạt động lựa chọn nhà thầu hay không? Xác định hình thức lựa chọn nhà thầu.',
      trachNhiem: 'Phòng chuyên môn phối hợp KH-TC',
    },
    {
      buoc: 17,
      ten: 'Rà soát điều kiện đặc thù & chốt phân loại',
      noiDung: 'Xác định quy trình thẩm định áp dụng (BCNCKT / BCKTKT / thiết kế triển khai / nghiệm thu…), điều kiện đặc thù và hoàn thành sơ đồ phân loại HTKT.01. Nếu có điều kiện đặc thù: mở nhánh quy trình riêng. Đặc thù điện chiếu sáng: bắt buộc lấy ý kiến Sở Công Thương về phương án điện, nguồn cấp điện, an toàn điện.',
      trachNhiem: 'Phòng chuyên môn được giao (chủ trì)',
    },
  ],
  thoiGian: [
    'Hoàn thành nhận diện và phân loại trước khi lập hồ sơ thẩm định.',
    'Thời gian thực hiện phụ thuộc mức độ đầy đủ thông tin ban đầu.',
  ],
  ketQua: 'Hồ sơ nhận diện và phân loại dự án hoàn chỉnh — xác định quy trình thẩm định tiếp theo.',
  canCu: [
    'Luật Xây dựng 135/2025/QH15',
    'Luật Đầu tư công 58/2024/QH15 (sửa đổi 90/2025)',
    'Nghị định 217/2026/NĐ-CP (thay NĐ 175/2024 từ 01/7/2026)',
    'Nghị định 206/2026/NĐ-CP',
    'Thông tư 34/2026/TT-BXD (cấp công trình)',
    'QCVN 03:2022/BXD (phân cấp công trình)',
  ],
  ghiChu: [
    'Phải hoàn thành đầy đủ 17 bước trước khi chuyển sang quy trình thẩm định cụ thể (BCNCKT / BCKTKT / thiết kế / nghiệm thu).',
    'Nếu bước 2 chưa đủ thông tin: yêu cầu bổ sung, không được bỏ qua để chốt phân loại.',
    'Công trình có hạng mục điện chiếu sáng: bắt buộc lấy ý kiến Sở Công Thương về phương án cấp điện, an toàn điện, phù hợp quy hoạch phát triển điện lực.',
    'Bước 8 (loại & cấp CT) quyết định thẩm quyền thẩm định — tra cứu QCVN 03:2022/BXD, Phụ lục I Nghị định 217/2026.',
    'Bước 17: nếu có điều kiện đặc thù (quốc phòng, bí mật nhà nước, vùng đặc biệt…) phải mở nhánh quy trình riêng.',
  ],
}

export const QUY_TRINH_THAM_DINH: QuyTrinh[] = [
  QUY_TRINH_NHAN_DIEN,
  {
    key: 'bcnckt',
    ten: 'Thẩm định Báo cáo nghiên cứu khả thi (BCNCKT)',
    moTa: 'Thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng công trình HTKT tại cơ quan chuyên môn về xây dựng.',
    apDung: 'Dự án HTKT sử dụng vốn đầu tư công, vốn nhà nước ngoài đầu tư công thuộc thẩm quyền thẩm định của cơ quan chuyên môn về xây dựng (theo phân cấp).',
    hoSo: [
      'Tờ trình thẩm định BCNCKT (theo mẫu).',
      'Thuyết minh BCNCKT và thiết kế cơ sở (kèm bản vẽ).',
      'Tổng mức đầu tư, các căn cứ xác định chi phí.',
      'Văn bản pháp lý: chủ trương đầu tư, quy hoạch được duyệt, kết quả khảo sát xây dựng.',
      'Báo cáo đánh giá tác động môi trường/giấy phép môi trường (nếu thuộc đối tượng).',
      'Hồ sơ năng lực của tổ chức, cá nhân lập dự án, khảo sát, thiết kế cơ sở.',
    ],
    buoc: [
      { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng HTKT.', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
      { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần, tính pháp lý của hồ sơ. Nếu thiếu/không hợp lệ: trong 5 ngày làm việc ra văn bản yêu cầu bổ sung (một lần).', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi văn bản lấy ý kiến cơ quan, đơn vị liên quan (PCCC, môi trường, quản lý quy hoạch, đơn vị quản lý hạ tầng...) khi cần. Đối với công trình có hạng mục điện chiếu sáng: bắt buộc lấy ý kiến Sở Công Thương về phương án cấp điện, an toàn điện và phù hợp quy hoạch phát triển điện lực.', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá: sự phù hợp quy hoạch, chủ trương đầu tư; sự phù hợp của thiết kế cơ sở với quy chuẩn, tiêu chuẩn; giải pháp HTKT, kết nối hạ tầng; điều kiện năng lực; sự phù hợp của tổng mức đầu tư.', trachNhiem: 'Phòng HTKT (chủ trì)' },
      { buoc: 5, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập Thông báo kết quả thẩm định; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng HTKT' },
      { buoc: 6, ten: 'Phát hành kết quả', noiDung: 'Phát hành Thông báo kết quả thẩm định gửi chủ đầu tư làm cơ sở phê duyệt dự án.', trachNhiem: 'Văn phòng Sở' },
    ],
    thoiGian: [
      'Dự án nhóm A: không quá 40 ngày.',
      'Dự án nhóm B: không quá 30 ngày.',
      'Dự án nhóm C: không quá 20 ngày.',
      '(Tính từ ngày nhận đủ hồ sơ hợp lệ; chưa kể thời gian bổ sung hồ sơ.)',
    ],
    ketQua: 'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi.',
    canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP', 'QCVN 07:2016/BXD', 'QCVN 01:2021/BXD'],
    ghiChu: [
      'Bước 2: chỉ được yêu cầu bổ sung hồ sơ MỘT LẦN duy nhất, trong vòng 5 ngày làm việc kể từ ngày nhận hồ sơ.',
      'Bước 3: Công trình điện chiếu sáng → bắt buộc lấy ý kiến Sở Công Thương. Thời gian chờ ý kiến phối hợp không tính vào thời hạn thẩm định.',
      'Bước 4: Đối chiếu QCVN 07:2016/BXD (hệ thống HTKT), QCVN 01:2021/BXD (quy hoạch xây dựng) khi thẩm định thiết kế cơ sở.',
      'Thời hạn tính từ ngày nhận ĐỦ hồ sơ hợp lệ — thời gian bổ sung hồ sơ không tính.',
      'Kết quả thẩm định là cơ sở để người quyết định đầu tư phê duyệt dự án, KHÔNG phải là quyết định phê duyệt.',
    ],
  },
  {
    key: 'bcktkt',
    ten: 'Thẩm định Báo cáo kinh tế - kỹ thuật (BCKTKT)',
    moTa: 'Thẩm định đối với công trình HTKT quy mô nhỏ chỉ lập Báo cáo kinh tế - kỹ thuật.',
    apDung: 'Công trình thuộc diện chỉ lập BCKTKT theo Luật Xây dựng 2025 (công trình quy mô nhỏ, sửa chữa, cải tạo, duy tu... theo ngưỡng quy định).',
    hoSo: [
      'Tờ trình thẩm định BCKTKT.',
      'Thuyết minh, thiết kế bản vẽ thi công, dự toán.',
      'Văn bản pháp lý liên quan (chủ trương, quy hoạch, khảo sát).',
      'Hồ sơ năng lực đơn vị khảo sát, thiết kế.',
    ],
    buoc: [
      { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận tại Bộ phận Một cửa, chuyển Phòng HTKT.', trachNhiem: 'Bộ phận Một cửa' },
      { buoc: 2, ten: 'Kiểm tra hợp lệ', noiDung: 'Kiểm tra thành phần hồ sơ; yêu cầu bổ sung nếu thiếu.', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Thẩm định', noiDung: 'Thẩm định thiết kế bản vẽ thi công (sự phù hợp quy chuẩn, tiêu chuẩn, giải pháp kỹ thuật) và dự toán xây dựng.', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Kết quả', noiDung: 'Lập, trình ký và phát hành Thông báo kết quả thẩm định.', trachNhiem: 'Phòng HTKT / Văn phòng Sở' },
    ],
    thoiGian: ['Không quá 20 ngày kể từ ngày nhận đủ hồ sơ hợp lệ.'],
    ketQua: 'Thông báo kết quả thẩm định Báo cáo kinh tế - kỹ thuật.',
    canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP', 'Nghị định 206/2026/NĐ-CP', 'Thông tư 36/2026/TT-BXD'],
    ghiChu: [
      'BCKTKT áp dụng cho công trình quy mô nhỏ — không thay thế BCNCKT đối với dự án lớn hơn ngưỡng.',
      'Thẩm định đồng thời thiết kế bản vẽ thi công VÀ dự toán (khác BCNCKT chỉ thẩm định thiết kế cơ sở).',
      'Công trình điện chiếu sáng quy mô nhỏ (sửa chữa, duy tu): vẫn cần kiểm tra phù hợp quy chuẩn an toàn điện.',
      'Không quá 20 ngày — ngắn hơn BCNCKT, cần phân công sớm ngay khi tiếp nhận.',
    ],
  },
  {
    key: 'thiet-ke-tk',
    ten: 'Thẩm định thiết kế triển khai sau thiết kế cơ sở',
    moTa: 'Thẩm định thiết kế kỹ thuật / thiết kế bản vẽ thi công và dự toán của công trình HTKT.',
    apDung: 'Công trình HTKT thuộc đối tượng cơ quan chuyên môn về xây dựng thẩm định thiết kế triển khai sau thiết kế cơ sở (theo cấp công trình và phân cấp).',
    hoSo: [
      'Tờ trình thẩm định thiết kế xây dựng triển khai sau thiết kế cơ sở.',
      'Thuyết minh, bản vẽ thiết kế kỹ thuật/bản vẽ thi công, dự toán.',
      'Kết quả thẩm định BCNCKT/BCKTKT và quyết định phê duyệt dự án.',
      'Báo cáo kết quả khảo sát xây dựng; chỉ dẫn kỹ thuật.',
      'Hồ sơ năng lực nhà thầu khảo sát, thiết kế; văn bản thẩm tra (nếu có).',
    ],
    buoc: [
      { buoc: 1, ten: 'Tiếp nhận', noiDung: 'Tiếp nhận hồ sơ tại Một cửa, chuyển Phòng HTKT.', trachNhiem: 'Bộ phận Một cửa' },
      { buoc: 2, ten: 'Kiểm tra hợp lệ', noiDung: 'Kiểm tra thành phần, điều kiện năng lực; yêu cầu bổ sung nếu thiếu.', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Thẩm định thiết kế', noiDung: 'Đánh giá sự phù hợp thiết kế với thiết kế cơ sở, quy chuẩn/tiêu chuẩn áp dụng, giải pháp kết cấu - kỹ thuật, an toàn, bảo vệ môi trường. Đối với hạng mục điện chiếu sáng: lấy ý kiến Sở Công Thương về phương án cấp điện, an toàn điện, phù hợp quy hoạch phát triển điện lực.', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Thẩm định dự toán', noiDung: 'Kiểm tra sự phù hợp của dự toán, đơn giá, định mức, khối lượng.', trachNhiem: 'Phòng HTKT (phối hợp KT-VLXD nếu cần)' },
      { buoc: 5, ten: 'Kết quả', noiDung: 'Lập, trình ký, phát hành Thông báo kết quả thẩm định thiết kế.', trachNhiem: 'Phòng HTKT / Văn phòng Sở' },
    ],
    thoiGian: [
      'Công trình cấp I trở lên (tương ứng nhóm A): không quá 35 ngày.',
      'Công trình còn lại (nhóm B): không quá 25 ngày.',
      'Nhóm C: không quá 15 ngày.',
    ],
    ketQua: 'Thông báo kết quả thẩm định thiết kế xây dựng triển khai sau thiết kế cơ sở.',
    canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP', 'Nghị định 206/2026/NĐ-CP', 'Thông tư 36/2026 & 38/2026/TT-BXD', 'QCVN 07:2016/BXD'],
    ghiChu: [
      'Phải có kết quả thẩm định BCNCKT/BCKTKT và quyết định phê duyệt dự án MỚI được thẩm định thiết kế triển khai.',
      'Bước 3 – Điện chiếu sáng: bắt buộc lấy ý kiến Sở Công Thương trước khi kết luận thẩm định thiết kế.',
      'Bước 4 – Dự toán: đối chiếu đơn giá nhân công, vật liệu theo công bố giá VLXD mới nhất của tỉnh; phối hợp Phòng KT-VLXD nếu cần.',
      'Thiết kế triển khai phải phù hợp thiết kế cơ sở đã thẩm định — sai lệch phải có văn bản giải trình.',
    ],
  },
  {
    key: 'nghiem-thu',
    ten: 'Kiểm tra công tác nghiệm thu hoàn thành',
    moTa: 'Kiểm tra công tác nghiệm thu của chủ đầu tư trước khi đưa công trình HTKT vào khai thác, sử dụng.',
    apDung: 'Công trình HTKT thuộc đối tượng cơ quan chuyên môn về xây dựng kiểm tra công tác nghiệm thu (theo cấp công trình).',
    hoSo: [
      'Báo cáo hoàn thành thi công xây dựng của chủ đầu tư (theo mẫu).',
      'Danh mục hồ sơ hoàn thành công trình.',
      'Kết quả thí nghiệm, quan trắc, chạy thử; hồ sơ quản lý chất lượng.',
      'Văn bản chấp thuận của cơ quan PCCC, môi trường (nếu thuộc đối tượng).',
    ],
    buoc: [
      { buoc: 1, ten: 'Thông báo của chủ đầu tư', noiDung: 'Chủ đầu tư gửi báo cáo hoàn thành (định kỳ/trước khi nghiệm thu) đến cơ quan chuyên môn.', trachNhiem: 'Chủ đầu tư' },
      { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Phòng HTKT kiểm tra hồ sơ nghiệm thu, sự tuân thủ thiết kế, quy chuẩn, quy trình. Đối với hạng mục điện chiếu sáng: kiểm tra văn bản chấp thuận/nghiệm thu đấu nối của Sở Công Thương hoặc đơn vị điện lực.', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Kiểm tra hiện trường', noiDung: 'Tổ chức kiểm tra tại hiện trường (khi cần); lập biên bản.', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Thông báo kết quả', noiDung: 'Ra văn bản chấp thuận kết quả nghiệm thu hoặc yêu cầu khắc phục tồn tại trước khi đưa vào sử dụng.', trachNhiem: 'Phòng HTKT / Lãnh đạo Sở' },
    ],
    thoiGian: [
      'Theo quy định tại Nghị định 207/2026/NĐ-CP (kiểm tra lần cuối trong thời hạn quy định kể từ khi nhận báo cáo hoàn thành).',
    ],
    ketQua: 'Văn bản chấp thuận kết quả nghiệm thu của cơ quan chuyên môn về xây dựng.',
    canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 207/2026/NĐ-CP'],
    ghiChu: [
      'Chủ đầu tư phải gửi báo cáo hoàn thành TRƯỚC khi tổ chức nghiệm thu lần cuối, không phải sau.',
      'Hạng mục điện chiếu sáng: phải có văn bản chấp thuận nghiệm thu đấu nối của Sở Công Thương hoặc đơn vị điện lực trước khi chấp thuận kết quả nghiệm thu.',
      'Bước 3 – Kiểm tra hiện trường: ghi nhận đầy đủ biên bản, ảnh chụp; đặc biệt lưu ý an toàn điện khi kiểm tra hạng mục chiếu sáng.',
      'Nếu phát hiện tồn tại: ra văn bản yêu cầu khắc phục, KHÔNG chấp thuận nghiệm thu cho đến khi hoàn thành.',
    ],
  },
]

export function getQuyTrinh(key: string): QuyTrinh | undefined {
  return QUY_TRINH_THAM_DINH.find((q) => q.key === key)
}
