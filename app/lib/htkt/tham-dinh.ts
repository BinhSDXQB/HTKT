// Quy trình thẩm định / kiểm tra công tác nghiệm thu công trình hạ tầng kỹ thuật
// tại cơ quan chuyên môn về xây dựng (Sở Xây dựng) — theo Luật Xây dựng 135/2025/QH15,
// Nghị định 217/2026/NĐ-CP (thay NĐ 175/2024, hiệu lực 01/7/2026), NĐ 206/2026, NĐ 207/2026,
// NĐ 105/2025 sửa bởi NĐ 347/2026 (PCCC). Đối chiếu bản gốc ngày 13/10/2026 — xem
// C:\Troly\HTKT\Bo_Prompt_Tham_Dinh_BCNCKT_2026.md (KHỐI 0 + Bảng hiệu lực).

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
// Nguồn: Th.s Nguyễn Phú Bình – FUBI XD360 – INNOVATA (cập nhật 20/6/2026); rà soát căn cứ 13/10/2026.
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
      noiDung: 'Phân loại theo Đ17 k1 Luật Xây dựng 2025: vốn đầu tư công / PPP / vốn chi thường xuyên hoặc vốn NSNN khác (quản lý như đầu tư công) / đầu tư kinh doanh.',
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
      noiDung: 'Phân loại: dự án đầu tư công / PPP / đầu tư kinh doanh / trường hợp khác. Xác định dự án lập BCNCKT hay chỉ lập Báo cáo kinh tế - kỹ thuật (Đ27 k2 NĐ 217: tôn giáo, TMĐT ≤ 40 tỷ không gồm GPMB/tiền sử dụng đất, sửa chữa bảo trì nhóm C…).',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 7,
      ten: 'Xác định nhóm dự án',
      noiDung: 'Phân nhóm theo Đ8–11 Luật Đầu tư công 58/2024 (Luật 90/2025 không sửa ngưỡng). HTKT: cấp thoát nước, xử lý rác thải, HTKT khác — nhóm A từ 3.000 tỷ, nhóm B 160–<3.000 tỷ, nhóm C < 160 tỷ; HTKT khu đô thị mới — nhóm A từ 2.000 tỷ, nhóm B 120–<2.000 tỷ, nhóm C < 120 tỷ.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 8,
      ten: 'Xác định loại và cấp công trình',
      noiDung: 'Xác định loại, cấp TỪNG công trình theo TT 34/2026/TT-BXD (cấp = cao nhất giữa Phụ lục I và Phụ lục II), công trình chính và cấp áp dụng để xác định thẩm quyền (công trình chính cấp cao nhất — Đ33 k3 NĐ 217). Xác định công trình có thuộc Phụ lục IV NĐ 217 (ảnh hưởng lớn an toàn cộng đồng), Phụ lục IX NĐ 207 (quy mô lớn, kỹ thuật phức tạp), Phụ lục III NĐ 105 sửa bởi NĐ 347/2026 (thẩm định thiết kế PCCC) không.',
      trachNhiem: 'Phòng chuyên môn được giao',
    },
    {
      buoc: 9,
      ten: 'Xác định thẩm quyền quyết định đầu tư',
      noiDung: 'Làm rõ người quyết định đầu tư / cơ quan có thẩm quyền phê duyệt dự án (Quốc hội, Thủ tướng, Bộ trưởng, Chủ tịch UBND cấp tỉnh/cấp xã…).',
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
      noiDung: 'Có sử dụng đất không? Có thu hồi đất, giao đất, cho thuê đất không? Xác định thủ tục đất đai cần thực hiện. Lưu ý: quyết định giao đất/cho thuê đất KHÔNG phải thành phần hồ sơ thẩm định BCNCKT (Đ35 k2 NĐ 217), trừ trường hợp điểm b.',
      trachNhiem: 'Phòng chuyên môn phối hợp Sở Nông nghiệp và Môi trường',
    },
    {
      buoc: 12,
      ten: 'Rà soát yêu cầu về quy hoạch',
      noiDung: 'Xác định quy hoạch làm căn cứ lập dự án thuộc trường hợp nào trong 9 trường hợp tại Đ26 k1 NĐ 217 (không mặc định QHCT 1/500); trường hợp sửa chữa, cải tạo giữ nguyên mục tiêu, địa điểm, quy mô thì không yêu cầu quy hoạch (Đ26 k2).',
      trachNhiem: 'Phòng chuyên môn phối hợp QH-KT',
    },
    {
      buoc: 13,
      ten: 'Rà soát yêu cầu về môi trường',
      noiDung: 'Có thuộc đối tượng ĐTM không? ĐTM thực hiện đồng thời với lập BCNCKT; được trình đồng thời với hồ sơ thẩm định BCNCKT, nhưng phải có quyết định phê duyệt ĐTM trước khi phê duyệt dự án (Đ31, Đ34 k2 Luật BVMT sửa bởi Luật 146/2025).',
      trachNhiem: 'Phòng chuyên môn phối hợp Sở Nông nghiệp và Môi trường',
    },
    {
      buoc: 14,
      ten: 'Rà soát yêu cầu về kiến trúc',
      noiDung: 'Có phải thi tuyển phương án kiến trúc không (Đ17 k2 Luật Kiến trúc 2019: công trình công cộng cấp đặc biệt, cấp I; cầu trong đô thị từ cấp II; công trình điểm nhấn…). Luật sửa đổi 19/2026/QH16 có hiệu lực từ 01/3/2027.',
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
      noiDung: 'Xác định quy trình áp dụng: thẩm định BCNCKT tại cơ quan chuyên môn (Đ27 Luật 135) / BCKTKT do người quyết định đầu tư thẩm định (Đ31 NĐ 217) / kiểm tra công tác nghiệm thu (NĐ 207). Điều kiện đặc thù: dự án đường bộ phải thẩm tra, thẩm định an toàn giao thông ngay từ giai đoạn lập dự án (Đ29 Luật Đường bộ 35/2024); công trình chồng lấn hành lang bảo vệ thủy lợi, nguồn nước, lưới điện; dự án có hạng mục công trình năng lượng (đường dây, trạm biến áp) thì lấy ý kiến Sở Công Thương theo Đ33 k3 NĐ 217. Chiếu sáng công cộng là dự án HTKT (Phụ lục III NĐ 217), không bắt buộc ý kiến Sở Công Thương.',
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
    'Nghị định 206/2026/NĐ-CP; Nghị định 207/2026/NĐ-CP',
    'Thông tư 34/2026/TT-BXD (cấp công trình phục vụ quản lý hoạt động xây dựng)',
    'Nghị định 105/2025/NĐ-CP sửa bởi NĐ 347/2026/NĐ-CP (PCCC)',
  ],
  ghiChu: [
    'Phải hoàn thành đầy đủ 17 bước trước khi chuyển sang quy trình cụ thể (BCNCKT / BCKTKT / nghiệm thu).',
    'Nếu bước 2 chưa đủ thông tin: yêu cầu bổ sung, không được bỏ qua để chốt phân loại.',
    'Bước 8 (loại & cấp CT) quyết định thẩm quyền thẩm định — tra TT 34/2026/TT-BXD và Đ32, Đ33 NĐ 217. QCVN 03:2022/BXD là cấp công trình phục vụ THIẾT KẾ, không dùng để xác định thẩm quyền.',
    'Bước 17: nếu có điều kiện đặc thù (quốc phòng, bí mật nhà nước, vùng đặc biệt…) phải mở nhánh quy trình riêng.',
  ],
}

export const QUY_TRINH_THAM_DINH: QuyTrinh[] = [
  QUY_TRINH_NHAN_DIEN,
  {
    key: 'bcnckt',
    ten: 'Thẩm định Báo cáo nghiên cứu khả thi (BCNCKT)',
    moTa: 'Thẩm định BCNCKT dự án đầu tư xây dựng công trình HTKT tại cơ quan chuyên môn về xây dựng (Sở Xây dựng).',
    apDung: 'Dự án đầu tư công; dự án PPP; dự án đầu tư kinh doanh quy mô lớn (do Quốc hội, Thủ tướng chấp thuận chủ trương hoặc đạt tiêu chí dự án quan trọng quốc gia) hoặc có công trình thuộc Phụ lục IV NĐ 217 (HTKT: cấp II trở lên) — Đ27 k1 Luật 135, Đ32 k1 NĐ 217; thuộc thẩm quyền Sở theo Đ32 k5, Đ33 NĐ 217. KHÔNG áp dụng cho dự án chỉ lập BCKTKT (Đ27 k2 Luật 135).',
    hoSo: [
      'Tờ trình thẩm định BCNCKT theo Mẫu số 01 Phụ lục I NĐ 217 (kê khai đủ 16 mục).',
      'Văn bản chủ trương đầu tư / phê duyệt thông tin dự án (Đ35 k2 điểm a), trừ dự án không phải quyết định chủ trương theo Đ19 k6 Luật Đầu tư công; với dự án chuyển tiếp: GCN đăng ký đầu tư, QĐ trúng đấu giá/đấu thầu… (điểm b).',
      'Văn bản phê duyệt và bản vẽ của quy hoạch làm căn cứ lập dự án theo Đ26 NĐ 217 (điểm d) — đồ án đã có mã số thông tin thì chỉ cần mã số.',
      'Văn bản thỏa thuận, xác nhận đấu nối hạ tầng kỹ thuật; chấp thuận độ cao tĩnh không (nếu thuộc diện) (điểm đ).',
      'Văn bản phê duyệt phương án kiến trúc qua thi tuyển (nếu thuộc diện) (điểm c).',
      'Hồ sơ khảo sát xây dựng ĐÃ ĐƯỢC PHÊ DUYỆT (điểm g).',
      'BCNCKT gồm thuyết minh (Đ29 NĐ 217) và thiết kế cơ sở: thuyết minh, thuyết minh tính toán kết cấu, bản vẽ, nội dung PCCC (Đ20 NĐ 217) (điểm h).',
      'Báo cáo kết quả thẩm tra thiết kế theo Mẫu số 02 — BẮT BUỘC với công trình thuộc Phụ lục IV NĐ 217, Phụ lục IX NĐ 207 hoặc thuộc diện thẩm định thiết kế PCCC (Đ26 k5 Luật 135) (điểm h).',
      'Dự án đầu tư công, PPP, vốn NSNN khác: tổng mức đầu tư kèm thông tin giá, định mức, báo giá, kết quả thẩm định giá (điểm k).',
      'Dự án sửa chữa, cải tạo: hồ sơ khảo sát hiện trạng, báo cáo kiểm định khả năng chịu lực nếu liên quan (điểm m).',
      'Danh sách mã số chứng chỉ hành nghề của chủ nhiệm khảo sát, chủ nhiệm/chủ trì thiết kế, thẩm tra (Mẫu 01 mục II.3) — chỉ cần mã số, không nộp bản sao (Đ7 k3 NĐ 217); không yêu cầu chứng chỉ năng lực tổ chức (Đ41 NĐ 212/2026).',
      'Dự án đường bộ: báo cáo thẩm tra an toàn giao thông (Đ29 Luật Đường bộ 35/2024).',
    ],
    buoc: [
      { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận (trực tiếp, bưu chính hoặc trực tuyến). Từ chối tiếp nhận nếu: sai thẩm quyền, không thuộc đối tượng thẩm định, hồ sơ không hợp lệ (Đ36 k2 NĐ 217).', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
      { buoc: 2, ten: 'Kiểm tra thành phần hồ sơ', noiDung: 'Trong 05 ngày làm việc: gửi MỘT LẦN văn bản yêu cầu bổ sung thành phần hồ sơ (Mẫu 15), hoặc từ chối thẩm định nếu nội dung hồ sơ khác Tờ trình dẫn tới sai thẩm quyền/đối tượng (Đ36 k3 NĐ 217).', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Lấy ý kiến phối hợp (khi cần)', noiDung: 'Lấy ý kiến cơ quan chuyên môn theo chuyên ngành đối với các công trình chính còn lại (Đ33 k3); đơn vị quản lý hạ tầng về kết nối (Đ38 k2); Sở Công Thương chỉ khi dự án có hạng mục công trình năng lượng như đường dây, trạm biến áp (Đ73 k5 điểm c, Đ33 k3). Chiếu sáng công cộng là dự án HTKT do Sở Xây dựng thẩm định (Phụ lục III mục III.4, Đ73 k5 điểm a NĐ 217) — KHÔNG có quy định bắt buộc lấy ý kiến Sở Công Thương. Chỉ hỏi nội dung thuộc chức năng cơ quan được hỏi; không hỏi lại nội dung đã có văn bản chấp thuận (Đ7 k5). Có thể thuê tư vấn tham gia thẩm định (Đ36 k7).', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Theo Đ27 k4 Luật 135 và Đ38 NĐ 217: (1) phù hợp của thiết kế với quy hoạch làm căn cứ lập dự án; (2) khả năng kết nối HTKT khu vực; (3) tuân thủ quy chuẩn, áp dụng tiêu chuẩn, an toàn xây dựng, giải pháp PCCC (thẩm định thiết kế PCCC tích hợp — Đ6 k1 NĐ 105 sửa bởi NĐ 347/2026); (4) tuân thủ quy định quản lý chi phí đối với dự án đầu tư công, PPP — 3 nội dung tại Đ7 k5 NĐ 206/2026. KHÔNG thẩm định chủ trương, hiệu quả, môi trường (thuộc người quyết định đầu tư) trừ khi Sở được giao chủ trì thẩm định.', trachNhiem: 'Phòng HTKT (chủ trì)' },
      { buoc: 5, ten: 'Tạm dừng (nếu cần)', noiDung: 'Nếu có lỗi, sai sót thông tin, số liệu dẫn đến không thể kết luận: tạm dừng thẩm định không quá 01 lần (Mẫu 16, Đ36 k4). Sau 20 ngày làm việc không bổ sung thì dừng thẩm định, trả hồ sơ (Đ36 k5).', trachNhiem: 'Phòng HTKT' },
      { buoc: 6, ten: 'Dự thảo, phát hành kết quả', noiDung: 'Lập Thông báo kết quả thẩm định theo Mẫu số 03 (kết luận: đủ điều kiện / chỉ đủ điều kiện sau khi hoàn thiện / chưa đủ điều kiện); đóng dấu thẩm định bản vẽ (Đ36 k8); gửi cơ quan chuẩn bị dự án và đồng gửi cơ quan quản lý xây dựng địa phương (Đ38 k6).', trachNhiem: 'Phòng HTKT / Văn phòng Sở' },
    ],
    thoiGian: [
      'Dự án quan trọng quốc gia: không quá 60 ngày.',
      'Nhóm A: không quá 25 ngày làm việc nếu có công trình cấp I trở lên; 20 ngày làm việc với các dự án nhóm A còn lại.',
      'Nhóm B: không quá 20 ngày làm việc nếu có công trình cấp I trở lên; 16 ngày làm việc với các dự án nhóm B còn lại.',
      'Nhóm C: không quá 15 ngày làm việc nếu có công trình cấp I trở lên; 12 ngày làm việc với các dự án nhóm C còn lại.',
      '(Đ37 NĐ 217 — tính từ ngày nhận đủ hồ sơ hợp lệ; gia hạn tối đa 01 lần, thời gian gia hạn không quá thời hạn tương ứng.)',
    ],
    ketQua: 'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi (Mẫu số 03 Phụ lục I NĐ 217).',
    canCu: [
      'Luật Xây dựng 135/2025/QH15 (Đ26, Đ27)',
      'Nghị định 217/2026/NĐ-CP (Đ26, Đ32–38, Phụ lục I, IV)',
      'Nghị định 206/2026/NĐ-CP (Đ7 k5 — thẩm định tổng mức đầu tư)',
      'Nghị định 105/2025/NĐ-CP sửa bởi NĐ 347/2026/NĐ-CP (PCCC)',
      'QCVN 07:2023/BXD và Sửa đổi 1:2025 (hệ thống công trình HTKT)',
      'QCVN 01:2021/BXD (quy hoạch xây dựng; QCVN 01:2026/BXD áp dụng từ 01/01/2027)',
    ],
    ghiChu: [
      'Chỉ được yêu cầu bổ sung thành phần hồ sơ MỘT LẦN, trong 05 ngày làm việc kể từ khi tiếp nhận — phải gom đủ mọi thiếu sót.',
      'Thời gian lấy ý kiến phối hợp KHÔNG làm dừng thời hạn thẩm định; cần thêm thời gian thì gia hạn 01 lần theo Đ37 k2 NĐ 217.',
      'ĐTM không phải thành phần hồ sơ thẩm định tại Sở; chỉ kiến nghị cơ quan chuẩn bị dự án bảo đảm có quyết định phê duyệt ĐTM trước khi trình phê duyệt dự án.',
      'Không yêu cầu văn bản thẩm duyệt PCCC của Công an ở bước BCNCKT — phần của Công an thuộc bước thiết kế triển khai (Đ9 k4 NĐ 105 sửa bởi NĐ 347/2026).',
      'Hạ tầng kỹ thuật của khu đô thị, khu nhà ở, KCN, CCN, khu du lịch… thuộc mục 11 Phụ lục III NĐ 105 (diện thẩm định thiết kế PCCC).',
      'Kết quả thẩm định là cơ sở để người quyết định đầu tư phê duyệt dự án, KHÔNG phải là quyết định phê duyệt.',
    ],
  },
  {
    key: 'bcktkt',
    ten: 'Báo cáo kinh tế - kỹ thuật (BCKTKT) — khi Sở được giao thẩm định',
    moTa: 'Dự án chỉ lập BCKTKT KHÔNG thẩm định tại cơ quan chuyên môn về xây dựng (Đ27 k2 Luật 135). Sở chỉ thẩm định khi được người quyết định đầu tư giao làm cơ quan chủ trì thẩm định (Đ31 k3 NĐ 217).',
    apDung: 'Dự án chỉ cần lập BCKTKT theo Đ27 k2 NĐ 217 (tôn giáo; TMĐT không quá 40 tỷ không gồm bồi thường, GPMB, tiền sử dụng đất; sửa chữa bảo trì nhóm C; nạo vét luồng; mua sắm thiết bị là chủ yếu…) mà người quyết định đầu tư (ví dụ Chủ tịch UBND tỉnh) giao Sở chủ trì thẩm định.',
    hoSo: [
      'Văn bản đề nghị thẩm định BCKTKT theo Mẫu số 04 Phụ lục I NĐ 217.',
      'Thuyết minh BCKTKT (Đ25 k2 Luật 135), thiết kế bản vẽ thi công, thiết kế công nghệ (nếu có), dự toán.',
      'Văn bản pháp lý liên quan (chủ trương, quy hoạch làm căn cứ, khảo sát được phê duyệt).',
      'Danh sách mã số chứng chỉ hành nghề của các chức danh chủ chốt (nếu thuộc diện phải có chứng chỉ; công viên cây xanh, chiếu sáng công cộng được miễn — Đ27 k3 NĐ 212).',
    ],
    buoc: [
      { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận văn bản đề nghị thẩm định và hồ sơ; kiểm tra văn bản giao nhiệm vụ của người quyết định đầu tư.', trachNhiem: 'Văn thư / Phòng HTKT' },
      { buoc: 2, ten: 'Kiểm tra hợp lệ', noiDung: 'Kiểm tra thành phần hồ sơ; yêu cầu bổ sung nếu thiếu.', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Thẩm định', noiDung: 'Theo Đ26 k3 Luật 135 (đầu tư công) hoặc k4 (đầu tư kinh doanh); riêng BCKTKT phải đánh giá thiết kế bản vẽ thi công về an toàn công trình, công trình lân cận và giải pháp PCCC (Đ26 k3 điểm h); đánh giá sự phù hợp với quy hoạch làm cơ sở lập dự án (Đ31 k6 điểm đ NĐ 217).', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Kết quả', noiDung: 'Lập thông báo kết quả thẩm định (Mẫu số 06 tham khảo), tổng hợp trình người quyết định đầu tư phê duyệt (Mẫu số 10).', trachNhiem: 'Phòng HTKT / Văn phòng Sở' },
    ],
    thoiGian: ['NĐ 217/2026 không quy định thời hạn cho thẩm định BCKTKT của người quyết định đầu tư. UBND tỉnh ban hành quy trình thẩm định, phê duyệt BCNCKT, BCKTKT các dự án đầu tư công do UBND cấp tỉnh, cấp xã quyết định đầu tư (Đ73 k4 điểm b NĐ 217) — áp dụng thời hạn theo quy trình đó.'],
    ketQua: 'Thông báo kết quả thẩm định BCKTKT (Mẫu số 06 tham khảo) làm cơ sở phê duyệt dự án (Mẫu số 10).',
    canCu: ['Luật Xây dựng 135/2025/QH15 (Đ25, Đ26, Đ27 k2)', 'Nghị định 217/2026/NĐ-CP (Đ27 k2, Đ31)', 'Nghị định 206/2026/NĐ-CP', 'Thông tư 36/2026/TT-BXD'],
    ghiChu: [
      'Nếu không có văn bản giao của người quyết định đầu tư thì Sở KHÔNG có thẩm quyền thẩm định BCKTKT.',
      'Người quyết định đầu tư cho lập BCNCKT thay BCKTKT (Đ27 k3 NĐ 217) thì dự án cũng không thẩm định tại cơ quan chuyên môn.',
      'Dự án lập thiết kế bản vẽ thi công tại BCKTKT: chủ đầu tư được giao thẩm định nội dung tại Đ26 k3 điểm h (Đ31 k7 NĐ 217).',
    ],
  },
  {
    key: 'thiet-ke-tk',
    ten: 'Thiết kế triển khai sau khi dự án được phê duyệt (chủ đầu tư thẩm định)',
    moTa: 'Từ 01/7/2026 CHỦ ĐẦU TƯ thẩm định, phê duyệt thiết kế xây dựng triển khai sau khi dự án được phê duyệt (Đ29 k1 Luật 135; Đ41 NĐ 217). Sở Xây dựng không còn thủ tục thẩm định thiết kế triển khai sau thiết kế cơ sở như trước.',
    apDung: 'Áp dụng để Sở hướng dẫn, kiểm tra. Ngoại lệ Sở còn thẩm định: dự toán xây dựng hạng mục sử dụng vốn đầu tư công của dự án PPP theo điểm d khoản 1 Điều 57 Luật PPP (Đ41 k2 điểm b NĐ 217).',
    hoSo: [
      'Hồ sơ thiết kế triển khai (thiết kế kỹ thuật/bản vẽ thi công), dự toán; quyết định phê duyệt dự án.',
      'Báo cáo kết quả thẩm tra thiết kế theo Mẫu số 11 (bắt buộc với công trình thuộc Đ26 k5 Luật 135).',
      'Trường hợp Sở thẩm định dự toán hạng mục vốn đầu tư công dự án PPP: văn bản đề nghị của chủ đầu tư kèm dự toán.',
    ],
    buoc: [
      { buoc: 1, ten: 'Chủ đầu tư thẩm định', noiDung: 'Chủ đầu tư thẩm định bước thiết kế ngay trước khi lựa chọn nhà thầu thi công/EPC theo Đ30 k1 Luật 135 (đầu tư công) hoặc Đ41 k2 NĐ 217 (PPP, đầu tư kinh doanh); có thể mời cơ quan liên quan góp ý, thuê tư vấn tham gia (Đ41 k3).', trachNhiem: 'Chủ đầu tư' },
      { buoc: 2, ten: 'Góp ý khi được mời', noiDung: 'Sở/Phòng HTKT góp ý nội dung thuộc chức năng quản lý nhà nước khi chủ đầu tư đề nghị — không kết luận thay chủ đầu tư.', trachNhiem: 'Phòng HTKT' },
      { buoc: 3, ten: 'Thẩm định dự toán (ngoại lệ PPP)', noiDung: 'Thẩm định dự toán hạng mục vốn đầu tư công của dự án PPP theo NĐ 206/2026 (Đ41 k2 điểm b NĐ 217).', trachNhiem: 'Phòng HTKT (phối hợp KT-VLXD)' },
      { buoc: 4, ten: 'Kết quả', noiDung: 'Chủ đầu tư ra thông báo kết quả thẩm định (Mẫu số 12) và phê duyệt thiết kế (Mẫu số 13, Đ42 NĐ 217).', trachNhiem: 'Chủ đầu tư' },
    ],
    thoiGian: ['Không có thời hạn thẩm định của cơ quan chuyên môn đối với thiết kế triển khai (đã chuyển cho chủ đầu tư).'],
    ketQua: 'Thông báo kết quả thẩm định (Mẫu số 12) và quyết định phê duyệt thiết kế (Mẫu số 13) của chủ đầu tư.',
    canCu: ['Luật Xây dựng 135/2025/QH15 (Đ29, Đ30)', 'Nghị định 217/2026/NĐ-CP (Đ41, Đ42)', 'Nghị định 206/2026/NĐ-CP', 'QCVN 07:2023/BXD và Sửa đổi 1:2025'],
    ghiChu: [
      'Thủ tục "thẩm định thiết kế triển khai sau thiết kế cơ sở tại cơ quan chuyên môn" (NĐ 15/2021, NĐ 175/2024) KHÔNG còn áp dụng từ 01/7/2026.',
      'Thẩm định thiết kế PCCC phần hệ thống (báo cháy, chữa cháy…) ở bước này thuộc cơ quan Công an (Đ9 NĐ 105 sửa bởi NĐ 347/2026).',
    ],
  },
  {
    key: 'nghiem-thu',
    ten: 'Kiểm tra công tác nghiệm thu công trình',
    moTa: 'Kiểm tra công tác nghiệm thu trong quá trình thi công và khi hoàn thành công trình HTKT (Đ57 k4 Luật 135; Đ25–27 NĐ 207/2026).',
    apDung: 'Công trình thuộc Phụ lục IV NĐ 217 (HTKT: cấp II trở lên; công trình xây mới hoặc cải tạo làm thay đổi quy mô, công năng, kết cấu chịu lực chính) trên địa bàn tỉnh, trừ công trình do Hội đồng kiểm tra nhà nước (Phụ lục IX NĐ 207, dự án quan trọng quốc gia) hoặc cơ quan chuyên môn thuộc bộ kiểm tra (Đ25 k1, Đ26 k1 điểm c NĐ 207).',
    hoSo: [
      'Báo cáo hoàn thành thi công xây dựng hạng mục công trình, công trình theo Phụ lục VI NĐ 207.',
      'Hồ sơ quản lý chất lượng; kết quả thí nghiệm, quan trắc, nghiệm thu lắp đặt, chạy thử thiết bị.',
    ],
    buoc: [
      { buoc: 1, ten: 'Kiểm tra trong quá trình thi công', noiDung: 'Căn cứ thông tin khởi công, Sở quyết định thời điểm và thông báo kế hoạch kiểm tra; kiểm tra không quá 03 lần (công trình cấp đặc biệt, cấp I) hoặc 02 lần (công trình còn lại); ra thông báo kết quả trong 10 ngày làm việc kể từ ngày kiểm tra (Đ27 k3 NĐ 207).', trachNhiem: 'Phòng HTKT' },
      { buoc: 2, ten: 'Tiếp nhận báo cáo hoàn thành', noiDung: 'Chủ đầu tư gửi 01 báo cáo hoàn thành thi công theo Phụ lục VI NĐ 207 để được kiểm tra công tác nghiệm thu hoàn thành (Đ27 k4 điểm a).', trachNhiem: 'Chủ đầu tư' },
      { buoc: 3, ten: 'Kiểm tra nghiệm thu hoàn thành', noiDung: 'Kiểm tra các điều kiện nghiệm thu hoàn thành; nếu công trình chưa được kiểm tra trong thi công thì kiểm tra cả sự tuân thủ quản lý chất lượng, an toàn (Đ27 k1, k4 điểm b). Không kiểm tra phần dây chuyền, thiết bị công nghệ (Đ27 k2). Được yêu cầu thí nghiệm đối chứng, kiểm định (Đ25 k4).', trachNhiem: 'Phòng HTKT' },
      { buoc: 4, ten: 'Thông báo kết quả', noiDung: 'Ra văn bản thông báo kết quả kiểm tra công tác nghiệm thu theo Phụ lục VIII NĐ 207, nêu rõ chấp thuận hoặc không chấp thuận kết quả nghiệm thu, tồn tại cần khắc phục.', trachNhiem: 'Phòng HTKT / Lãnh đạo Sở' },
    ],
    thoiGian: [
      'Kiểm tra trong thi công: ra thông báo kết quả không quá 10 ngày làm việc kể từ ngày kiểm tra.',
      'Nghiệm thu hoàn thành: không quá 16 ngày làm việc (công trình cấp I, cấp đặc biệt) và 12 ngày làm việc (công trình còn lại) kể từ khi nhận hồ sơ đề nghị kiểm tra (Đ27 k4 điểm b NĐ 207).',
    ],
    ketQua: 'Văn bản thông báo kết quả kiểm tra công tác nghiệm thu (Phụ lục VIII NĐ 207), chấp thuận hoặc không chấp thuận kết quả nghiệm thu của chủ đầu tư — phải có trước khi đưa công trình vào khai thác, sử dụng (Đ29 k2 NĐ 207).',
    canCu: ['Luật Xây dựng 135/2025/QH15 (Đ57)', 'Nghị định 207/2026/NĐ-CP (Đ24–27, Phụ lục VI, VIII, IX)', 'Nghị định 217/2026/NĐ-CP (Phụ lục IV)'],
    ghiChu: [
      'Chỉ kiểm tra công trình thuộc Phụ lục IV NĐ 217 (hoặc theo Đ25 k1 NĐ 207); dự án nhiều công trình chỉ kiểm tra các công trình thuộc diện (Đ25 k1 điểm c).',
      'Thủ tục kiểm tra nghiệm thu PCCC của cơ quan Công an đã bị bãi bỏ (Đ30 NĐ 347/2026 bãi bỏ Đ10 NĐ 105) — không yêu cầu "văn bản chấp thuận nghiệm thu PCCC".',
      'Việc kiểm tra không thay thế, không làm giảm trách nhiệm của chủ đầu tư và nhà thầu (Đ25 k4 điểm d NĐ 207).',
      'Chi phí kiểm tra do chủ đầu tư lập dự toán, tính trong tổng mức đầu tư (Đ25 k5 NĐ 207).',
    ],
  },
]

export function getQuyTrinh(key: string): QuyTrinh | undefined {
  return QUY_TRINH_THAM_DINH.find((q) => q.key === key)
}
