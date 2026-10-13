// Dữ liệu 03 sơ đồ PC-10/11/12 — nội dung lấy từ Noi_dung_PC10_11_12.md (đã kiểm chứng, Codex phản biện 13/10/2026).
// Viết tắt dùng trên sơ đồ: CĐT = chủ đầu tư; CQCBDA = cơ quan chuẩn bị dự án; QĐĐT = quyết định đầu tư.

export const NGAY_CHOT = '13/10/2026'
export const NHAN_TRANG_THAI = 'Dựng từ văn bản pháp luật — chờ đối chiếu với 03 ảnh gốc'

export const SO_DO = [
  {
    ma: 'PC-10',
    tieuDe: 'PC-10 · KHẢO SÁT XÂY DỰNG',
    phuDe: 'Luật Xây dựng 135/2025/QH15 (Đ21, 22, 37, 88) · NĐ 217/2026/NĐ-CP (Đ10–15) · NĐ 212/2026/NĐ-CP',
    buoc: [
      { id: 'b101', so: '10.1', chuThe: 'CĐT hoặc CQCBDA', viec: 'Xác định yêu cầu khảo sát theo loại, cấp công trình, bước thiết kế; xem xét kết quả khảo sát đã có (nếu có).', ketQua: 'Yêu cầu khảo sát', canCu: 'Đ22 k1 Luật 135; Đ11 k6 NĐ 217' },
      { id: 'b102', so: '10.2', chuThe: 'CĐT/CQCBDA tự lập, hoặc thuê/giao tổ chức, cá nhân có chuyên môn thiết kế hoặc khảo sát', viec: 'Lập nhiệm vụ khảo sát: mục đích, phạm vi, tiêu chuẩn áp dụng, sơ bộ khối lượng, dự toán (nếu có), thời gian.', ketQua: 'Dự thảo nhiệm vụ khảo sát', canCu: 'Đ11 k2, k4 NĐ 217' },
      { id: 'b103', so: '10.3', chuThe: 'CĐT hoặc CQCBDA', viec: 'PHÊ DUYỆT nhiệm vụ khảo sát (bằng văn bản hoặc phê duyệt trực tiếp tại nhiệm vụ).', ketQua: 'Nhiệm vụ khảo sát được phê duyệt', canCu: 'Đ11 k3 NĐ 217' },
      { id: 'b104', so: '10.4', chuThe: 'CĐT', viec: 'Lựa chọn nhà thầu khảo sát, ký hợp đồng. Chủ nhiệm khảo sát có chứng chỉ hành nghề phù hợp; năng lực tổ chức tra cứu trên csdlhdxd.gov.vn. Dự án thuộc phạm vi Luật Đấu thầu thì lựa chọn theo pháp luật đấu thầu.', ketQua: 'Hợp đồng khảo sát', canCu: 'Đ88 Luật 135; Đ28, 34, 41 NĐ 212; NĐ 214/2025 (sửa bởi NĐ 349/2026)' },
      { id: 'b105', so: '10.5', chuThe: 'Nhà thầu khảo sát', viec: 'Lập phương án kỹ thuật khảo sát phù hợp nhiệm vụ đã duyệt (khối lượng, phương pháp, thiết bị, tiêu chuẩn, kiểm soát chất lượng, tiến độ, an toàn, môi trường).', ketQua: 'Phương án kỹ thuật khảo sát', canCu: 'Đ12 k1, k2 NĐ 217' },
      { id: 'b106', so: '10.6', chuThe: 'CĐT hoặc CQCBDA', viec: 'KIỂM TRA phương án (hoặc thuê tư vấn THẨM TRA), sau đó PHÊ DUYỆT theo hợp đồng.', ketQua: 'Kết quả kiểm tra/thẩm tra', canCu: 'Đ12 k3 NĐ 217' },
      { id: 'q106', loai: 'quyetDinh', cauHoi: 'Phương án đạt yêu cầu, được phê duyệt?', khong: { ve: 'b105', nhan: 'Không', ghiChu: 'Nhà thầu chỉnh sửa phương án' } },
      { id: 'b107', so: '10.7', chuThe: 'Nhà thầu khảo sát', viec: 'Thực hiện khảo sát đúng phương án đã duyệt; chủ nhiệm khảo sát đủ điều kiện; kiểm soát chất lượng, an toàn, môi trường.', ketQua: 'Số liệu khảo sát, mẫu thí nghiệm', canCu: 'Đ13 k1 NĐ 217; Đ22 k3 Luật 135',
        ben: { loai: 'tuyChon', nhan: 'song song', chuThe: 'Giám sát khảo sát — tùy quy mô, loại hình', viec: 'CĐT tự giám sát hoặc thuê tổ chức, cá nhân phù hợp. CĐT/CQCBDA được đình chỉ khi nhà thầu làm sai phương án, hợp đồng.', canCu: 'Đ13 k2, k3 NĐ 217' } },
      { id: 'q108', loai: 'quyetDinh', cauHoi: 'Phát hiện yếu tố khác thường, hoặc nhiệm vụ thiết kế thay đổi?', canCu: 'Đ11 k5 a NĐ 217; Đ37 k2 b Luật 135', co: { ve: 'b102', nhan: 'Có', ghiChu: 'Sửa đổi, bổ sung nhiệm vụ khảo sát' }, diTiep: 'Không' },
      { id: 'b109', so: '10.8', chuThe: 'Nhà thầu khảo sát', viec: 'Lập Báo cáo kết quả khảo sát: căn cứ, điều kiện tự nhiên, phương pháp, khối lượng, số liệu, phân tích, kiến nghị, kết luận, phụ lục.', ketQua: 'Báo cáo kết quả khảo sát', canCu: 'Đ14 NĐ 217',
        ben: { loai: 'tuyChon', nhan: 'tùy chọn', chuThe: 'Kiểm tra báo cáo (không bắt buộc)', viec: 'CĐT/CQCBDA được yêu cầu nhà thầu thiết kế độc lập, hoặc thuê tổ chức tư vấn KIỂM TRA báo cáo làm cơ sở phê duyệt.', canCu: 'Đ15 k1 NĐ 217' } },
      { id: 'b110', so: '10.9', chuThe: 'CĐT hoặc CQCBDA', viec: 'NGHIỆM THU, PHÊ DUYỆT Báo cáo kết quả khảo sát (bằng văn bản hoặc phê duyệt trực tiếp tại báo cáo).', ketQua: 'Kết quả nghiệm thu', canCu: 'Đ10 k4, Đ15 k1 NĐ 217; Đ22 k4 Luật 135' },
      { id: 'q110', loai: 'quyetDinh', cauHoi: 'Báo cáo kết quả khảo sát đạt, được phê duyệt?', khong: { ve: 'b109', nhan: 'Không', ghiChu: 'Nhà thầu hoàn thiện báo cáo' } },
    ],
    dauRa: [
      'Nhiệm vụ khảo sát đã phê duyệt; phương án kỹ thuật khảo sát đã phê duyệt.',
      'Báo cáo kết quả khảo sát đã phê duyệt — thành phần hồ sơ trình thẩm định dự án và hồ sơ hoàn thành công trình, lưu trữ theo quy định (Đ15 k3 NĐ 217).',
    ],
    chuyenBuoc: [
      'Thiết kế/lập dự án sử dụng kết quả khảo sát phù hợp đã được phê duyệt cho phần việc cần khảo sát (Đ22 k4 Luật 135).',
      'Không phải điều kiện tuyệt đối: khảo sát bổ sung có thể phát sinh trong thiết kế hoặc thi công (Đ11 k5 điểm b, c NĐ 217).',
    ],
    luuY: [
      'Phê duyệt kết quả không thay thế, không làm giảm trách nhiệm của nhà thầu khảo sát về chất lượng (Đ15 k2 NĐ 217; Đ37 k2 điểm c, d Luật 135).',
      'NĐ 217 không quy định biểu mẫu nghiệm thu khảo sát riêng — thực hiện theo hợp đồng; không đặt thêm thủ tục.',
    ],
  },
  {
    ma: 'PC-11',
    tieuDe: 'PC-11 · LẬP VÀ CHẤP THUẬN NHIỆM VỤ THIẾT KẾ XÂY DỰNG',
    phuDe: 'Luật Xây dựng 135/2025/QH15 (Đ19, 20) · NĐ 217/2026/NĐ-CP (Đ8, 11 k5, 16, 17)',
    buoc: [
      { id: 'b111', so: '11.1', chuThe: 'CĐT hoặc CQCBDA', viec: 'Tập hợp căn cứ: chủ trương đầu tư (nếu có); quy hoạch làm căn cứ lập dự án; thông tin địa điểm; kết quả khảo sát sẵn có (nếu có); yêu cầu thi tuyển phương án kiến trúc (nếu thuộc diện).', ketQua: 'Bộ căn cứ lập nhiệm vụ', canCu: 'Đ17 k2, k3 a NĐ 217; Đ26 NĐ 217; Đ17 Luật Kiến trúc' },
      { id: 'b112', so: '11.2', chuThe: 'CĐT/CQCBDA lập, hoặc thuê tổ chức, cá nhân có kinh nghiệm thiết kế', viec: 'Lập nhiệm vụ thiết kế: căn cứ; mục tiêu; địa điểm; yêu cầu quy hoạch, cảnh quan, kiến trúc; quy mô, thời hạn sử dụng, công năng, tiêu chuẩn, công nghệ; chỉ dẫn kỹ thuật; thông tin BIM. Thiết kế FEED: thêm nội dung Đ17 k4.', ketQua: 'Dự thảo nhiệm vụ thiết kế', canCu: 'Đ17 k1, k3, k4 NĐ 217' },
      { id: 'q112', loai: 'quyetDinh', cauHoi: 'Công trình xây mới từ cấp II trở lên?', canCu: 'Đ8 k1 NĐ 217', co: { ben: 'BẮT BUỘC áp dụng BIM từ giai đoạn lập BCNCKT/BCKTKT → nhiệm vụ thiết kế nêu yêu cầu thông tin BIM. Người QĐĐT được quyết định không áp dụng với công trình theo tuyến, khu vực đặc thù, dự án cần bảo mật. (Không: khuyến khích)', nhan: 'Có' }, diTiep: 'Tiếp tục' },
      { id: 'b113', loai: 'tuyChon', so: '11.3 (tùy chọn)', chuThe: 'Tổ chức tư vấn, chuyên gia do CĐT thuê', viec: 'GÓP Ý hoặc THẨM TRA nhiệm vụ thiết kế — "được thuê", không bắt buộc.', ketQua: 'Ý kiến góp ý/thẩm tra', canCu: 'Đ17 k2 NĐ 217' },
      { id: 'b114', so: '11.4', chuThe: 'CĐT hoặc cơ quan được giao nhiệm vụ chuẩn bị dự án', viec: 'CHẤP THUẬN bằng văn bản hoặc PHÊ DUYỆT TRỰC TIẾP tại nhiệm vụ thiết kế.', ketQua: 'Nhiệm vụ thiết kế được chấp thuận/phê duyệt', canCu: 'Đ17 k6 NĐ 217' },
      { id: 'q114', loai: 'quyetDinh', cauHoi: 'Nhiệm vụ thiết kế đạt yêu cầu?', khong: { ve: 'b112', nhan: 'Không', ghiChu: 'Hoàn thiện nhiệm vụ thiết kế' } },
      { id: 'q115', loai: 'quyetDinh', cauHoi: 'Phát sinh yêu cầu khảo sát mới (do nhiệm vụ thiết kế thay đổi)?', canCu: 'Đ11 k5 a NĐ 217', co: { ben: 'Sửa đổi, bổ sung nhiệm vụ khảo sát → thực hiện theo quy trình Khảo sát xây dựng; kết quả quay lại phục vụ thiết kế.', nhan: 'Có' }, diTiep: 'Không' },
      { id: 'b116', so: '11.5', chuThe: 'CĐT hoặc CQCBDA', viec: 'Dùng nhiệm vụ thiết kế làm căn cứ lập dự án (BCNCKT/BCKTKT) và lập thiết kế. Khi cần đáp ứng điều kiện thực tế, sửa đổi, bổ sung nhiệm vụ rồi chấp thuận lại.', ketQua: 'Căn cứ lập dự án, thiết kế', canCu: 'Đ17 k2, k5 NĐ 217; Đ20 k1 Luật 135' },
    ],
    dauRa: [
      'Nhiệm vụ thiết kế được chấp thuận bằng văn bản hoặc được phê duyệt trực tiếp tại nhiệm vụ (Đ17 k6 NĐ 217).',
    ],
    chuyenBuoc: [
      'Lập dự án/thiết kế khi đã có nhiệm vụ thiết kế được chấp thuận; thiết kế phải phù hợp nhiệm vụ thiết kế (Đ20 k1 Luật 135).',
      'Nhiệm vụ thiết kế phù hợp chủ trương đầu tư "nếu có" — không phải dự án nào cũng có quyết định chủ trương (Đ17 k2 NĐ 217).',
    ],
    luuY: [
      'Khảo sát và nhiệm vụ thiết kế có quan hệ qua lại, không bắt buộc tuyến tính: nhiệm vụ thiết kế không phải chờ khảo sát xong; thay đổi nhiệm vụ thiết kế có thể kéo theo khảo sát bổ sung.',
      'Số bước thiết kế do người QĐĐT quyết định; dự án chỉ lập BCKTKT áp dụng thiết kế một bước là thiết kế bản vẽ thi công (Đ19 k1 Luật 135; Đ16 k2, k3 NĐ 217).',
    ],
  },
  {
    ma: 'PC-12',
    tieuDe: 'PC-12 · LẬP, THẨM ĐỊNH, PHÊ DUYỆT BÁO CÁO KINH TẾ – KỸ THUẬT',
    phuDe: 'Luật Xây dựng 135/2025/QH15 (Đ23, 25–28) · NĐ 217/2026/NĐ-CP (Đ27, 30, 31, 39, 73) · NĐ 206/2026/NĐ-CP (Đ5 k6, Đ7)',
    buoc: [
      { id: 'q120', loai: 'quyetDinh', cauHoi: 'Thuộc trường hợp chỉ lập BCKTKT (Đ27 k2 NĐ 217)?', canCu: 'Đ23 k2 Luật 135', co: { ben: 'Phải lập Báo cáo nghiên cứu khả thi — thủ tục khác, không thuộc sơ đồ này.', nhan: 'Không', loai: 'canhBao' }, diTiep: 'Có' },
      { id: 'b120', loai: 'luuY', noiDung: 'Các trường hợp (Đ27 k2 NĐ 217): a) dự án mục đích tôn giáo; b) tổng mức đầu tư không quá 40 tỷ đồng, KHÔNG gồm chi phí bồi thường, giải phóng mặt bằng, tiền sử dụng đất; c) sửa chữa nhằm mục đích bảo trì quy mô nhóm C; d) nạo vét duy tu luồng hàng hải, đường thủy nội địa; đ) chủ yếu mua sắm hàng hóa, dịch vụ, lắp đặt thiết bị, chi phí xây dựng (không gồm thiết bị) dưới 10% tổng mức đầu tư VÀ không quá 20 tỷ đồng — trừ dự án quan trọng quốc gia, nhóm A, PPP.\nNgười QĐĐT được cho lập BCNCKT thay BCKTKT; khi đó vẫn không thẩm định tại cơ quan chuyên môn về xây dựng (Đ27 k3). Bảo trì trên thiết kế hiện hữu hoặc không cần thiết kế: không phải lập dự án, vẫn theo quy định bảo trì (Đ27 k4).' },
      { id: 'b121', so: '12.1', chuThe: 'Cấp có thẩm quyền theo pháp luật về đầu tư công, đầu tư', viec: 'Quyết định/chấp thuận chủ trương đầu tư — chỉ khi dự án phải có (dự án tại Đ19 k6 Luật Đầu tư công không phải quyết định chủ trương).', ketQua: 'Văn bản chủ trương (nếu có)', canCu: 'Đ23 k5 Luật 135; Đ19 k6 Luật Đầu tư công 58/2024' },
      { id: 'b122', so: '12.2', chuThe: 'CĐT hoặc CQCBDA', viec: 'Khảo sát xây dựng và nhiệm vụ thiết kế (theo hai quy trình trên).', ketQua: 'Báo cáo khảo sát đã duyệt; nhiệm vụ thiết kế đã chấp thuận', canCu: 'Đ10–17 NĐ 217' },
      { id: 'b123', so: '12.3', chuThe: 'CĐT/CQCBDA; nhà thầu tư vấn lập BCKTKT', viec: 'Lập BCKTKT: thuyết minh (Đ30 k1 a–q, luôn có nội dung bảo vệ môi trường; GPMB, PCCC "nếu có"); thiết kế bản vẽ thi công (thiết kế một bước); thiết kế công nghệ (nếu có); tổng mức đầu tư = dự toán xây dựng công trình + bồi thường, hỗ trợ, tái định cư (nếu có) + chi phí liên quan chung.', ketQua: 'Hồ sơ BCKTKT', canCu: 'Đ25 Luật 135; Đ30 NĐ 217; Đ5 k6, Đ12 NĐ 206' },
      { id: 'q124', loai: 'quyetDinh', cauHoi: 'Phải thẩm tra thiết kế (Đ26 k5 Luật 135)?', canCu: 'PL IV NĐ 217; PL IX NĐ 207', co: { ben: 'Thuê tư vấn THẨM TRA thiết kế: công trình thuộc Phụ lục IV NĐ 217 (HTKT cấp II trở lên), Phụ lục IX NĐ 207, hoặc thuộc diện thẩm định thiết kế PCCC (thẩm tra nội dung PCCC) → Báo cáo kết quả thẩm tra.', nhan: 'Có' }, diTiep: 'Tiếp tục' },
      { id: 'q125', loai: 'quyetDinh', cauHoi: 'Thuộc diện thẩm định thiết kế PCCC hoặc ĐTM?', canCu: 'Đ9 NĐ 105 (sửa bởi NĐ 347/2026); Luật BVMT', co: { ben: 'Thủ tục chuyên ngành RIÊNG: PCCC — Công an thẩm định thiết kế bản vẽ thi công trong BCKTKT (Đ9 k1, k4 a NĐ 105; Phụ lục III thay bởi NĐ 347/2026). ĐTM — có quyết định phê duyệt kết quả thẩm định trước khi phê duyệt dự án (Đ30, 31, 36 k1 d Luật BVMT sửa bởi Luật 146/2025).', nhan: 'Có' }, diTiep: 'Tiếp tục' },
      { id: 'b126', so: '12.4', chuThe: 'CQCBDA', viec: 'Trình thẩm định bằng văn bản Mẫu số 04 tới cơ quan/đơn vị được người QĐĐT giao chủ trì thẩm định (có thể là cơ quan chuyên môn trực thuộc). Không thuộc thủ tục thẩm định tại cơ quan chuyên môn về xây dựng theo Đ27 Luật 135.', ketQua: 'Hồ sơ trình thẩm định', canCu: 'Đ27 k2 Luật 135; Đ31 k3, k4 NĐ 217; Mẫu 04 PL I' },
      { id: 'b127', so: '12.5', chuThe: 'Cơ quan chủ trì thẩm định do người QĐĐT giao', viec: 'THẨM ĐỊNH: đầu tư công — Đ26 k3 Luật 135 (điểm h: an toàn công trình, công trình lân cận, giải pháp PCCC của BVTC); đầu tư kinh doanh — Đ26 k4; phù hợp quy hoạch (Đ31 k6 đ); tổng mức đầu tư (Đ7 k3, k4 NĐ 206). Người QĐĐT có thể giao CĐT thẩm định nội dung điểm h (Đ31 k7 b).', ketQua: 'Thông báo kết quả thẩm định (Mẫu 06 tham khảo — xem lưu ý)', canCu: 'Đ26 Luật 135; Đ31 NĐ 217; Đ7 NĐ 206' },
      { id: 'q127', loai: 'quyetDinh', cauHoi: 'Đủ điều kiện trình phê duyệt?', khong: { ve: 'b123', nhan: 'Không', ghiChu: 'Hoàn thiện hồ sơ BCKTKT' } },
      { id: 'b128', so: '12.6', chuThe: 'Người quyết định đầu tư', viec: 'PHÊ DUYỆT dự án (quyết định đầu tư xây dựng) theo Mẫu số 10; giao CĐT đóng dấu phê duyệt hồ sơ thiết kế bản vẽ thi công.', ketQua: 'Quyết định phê duyệt dự án; bản vẽ được đóng dấu', canCu: 'Đ28 k1 Luật 135; Đ39 k1, k5 NĐ 217' },
    ],
    dauRa: [
      'Quyết định phê duyệt dự án (Mẫu số 10 Phụ lục I NĐ 217); hồ sơ thiết kế bản vẽ thi công đã đóng dấu phê duyệt; tổng mức đầu tư được phê duyệt.',
    ],
    chuyenBuoc: [
      'Lựa chọn nhà thầu thi công; giấy phép xây dựng (nếu không thuộc trường hợp miễn); khởi công khi đủ điều kiện (Đ48 Luật 135).',
    ],
    luuY: [
      'Ngưỡng 40 tỷ chỉ để xét điều kiện lập BCKTKT; tổng mức đầu tư vẫn tính đủ chi phí bồi thường, hỗ trợ, tái định cư (Đ5 k6 NĐ 206). Điều kiện lập BCKTKT khác tiêu chí nhóm A/B/C.',
      'Thời hạn thẩm định BCKTKT: NĐ 217 không quy định; UBND cấp tỉnh ban hành quy trình thẩm định, phê duyệt BCKTKT dự án đầu tư công cấp tỉnh, cấp xã (Đ73 k4 b NĐ 217).',
      'Mẫu kết quả thẩm định: Đ31 k4 NĐ 217 ghi "Mẫu số 03, Mẫu số 04", còn danh mục Phụ lục I ghi Mẫu số 06 là thông báo kết quả thẩm định BCKTKT (tham khảo) — văn bản chưa thống nhất.',
    ],
  },
]

// Danh mục nguồn chính thức (ngày kiểm tra 13/10/2026)
export const NGUON = [
  ['Luật Xây dựng 135/2025/QH15', 'https://congbao.chinhphu.vn/van-ban/luat-so-135-2025-qh15-468695/61629.htm'],
  ['Nghị định 217/2026/NĐ-CP (19/6/2026, hiệu lực 01/7/2026)', 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-217-2026-nd-cp-469819.htm'],
  ['Văn bản hợp nhất 91/2026/VBHN-BXD (NĐ 217 + NĐ 347) — ngày ký chưa xác minh', 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/9/91-vbhn-bxd.signed.pdf'],
  ['Nghị định 347/2026/NĐ-CP (08/9/2026, hiệu lực 15/9/2026)', 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-347-2026-nd-cp-470418.htm'],
  ['Nghị định 206/2026/NĐ-CP', 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-206-2026-nd-cp-469768.htm'],
  ['Luật 146/2025/QH15 (sửa Luật Bảo vệ môi trường; hiệu lực 01/01/2026)', 'https://congbao.chinhphu.vn/van-ban/luat-so-146-2025-qh15-468706/61741.htm'],
  ['Luật 90/2025/QH15 (sửa Luật Đầu tư công)', 'https://congbao.chinhphu.vn/van-ban/luat-so-90-2025-qh15-45389.htm'],
  ['NĐ 212/2026, NĐ 207/2026, NĐ 105/2025, NĐ 214/2025, NĐ 349/2026 (09/9/2026), Luật Đầu tư công 58/2024', 'Bản gốc lưu tại kho văn bản của Sở (Tailieu_VBPL) — cần bổ sung đường dẫn Công báo'],
]
