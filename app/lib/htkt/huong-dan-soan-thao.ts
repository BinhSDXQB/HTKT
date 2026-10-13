// Hướng dẫn soạn thảo các văn bản trong quy trình thẩm định BCNCKT công trình HTKT tại Sở Xây dựng.
// Căn cứ (đối chiếu bản gốc 13/10/2026): Luật Xây dựng 135/2025/QH15 (Đ24, Đ26, Đ27); NĐ 217/2026/NĐ-CP
// (Đ7, Đ33, Đ35–38, Mẫu 01, 03, 15, 16); NĐ 206/2026 (Đ7 k5); NĐ 105/2025 sửa bởi NĐ 347/2026 (PCCC);
// TT 34/2026 (cấp công trình). Xem thêm C:\Troly\HTKT\Bo_Prompt_Tham_Dinh_BCNCKT_2026.md.

import type { LinhVucKey } from './phap-ly'

// Nhóm dự án theo Luật Đầu tư công (Đ8–11) — KHÔNG đồng nhất với cấp công trình.
export type QuyMoCongTrinh = 'A' | 'B' | 'C'
export type CapCongTrinh = 'Đặc biệt' | 'I' | 'II' | 'III' | 'IV'
export type LoaiThamDinhSoanThao = 'bcnckt' | 'bcktkt' | 'thiet-ke' | 'nghiem-thu'

export type HuongDanSoanThao = {
  tenMau: string
  moTa: string
  canCuChiay: string[]
  cacBuoc: BuocSoanThao[]
  templateChiDan: string
  ghiChu?: string
}

export type BuocSoanThao = {
  buoc: number
  tieu: string
  noiDung: string
  dulieu?: string
  ghiChu?: string
}

// ───────── Tờ trình nội bộ trình Lãnh đạo Sở ký kết quả thẩm định BCNCKT ─────────
export const HUONG_DAN_TO_TRINH_BCNCKT: HuongDanSoanThao = {
  tenMau: 'Tờ trình (nội bộ) về kết quả thẩm định Báo cáo nghiên cứu khả thi',
  moTa: 'Phòng HTKT trình Lãnh đạo Sở kết quả thẩm định và dự thảo Thông báo kết quả thẩm định (Mẫu 03). Khác với Tờ trình thẩm định theo Mẫu 01 NĐ 217 — văn bản do cơ quan chuẩn bị dự án gửi Sở.',
  canCuChiay: [
    'Luật Xây dựng 135/2025/QH15 (Đ27 — thẩm định BCNCKT của cơ quan chuyên môn về xây dựng)',
    'Nghị định 217/2026/NĐ-CP (Đ32, Đ33 thẩm quyền; Đ35 hồ sơ; Đ36 trình tự; Đ37 thời hạn; Đ38 nội dung, kết quả)',
    'Nghị định 206/2026/NĐ-CP (Đ7 k5 — nội dung thẩm định tổng mức đầu tư của cơ quan chuyên môn)',
    'Thông tư 34/2026/TT-BXD (cấp công trình)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Khẳng định thẩm quyền và đối tượng',
      noiDung: 'Nêu loại dự án (Đ17 Luật 135), căn cứ thuộc đối tượng thẩm định (Đ27 k1 Luật 135, Đ32 k1 NĐ 217) và thẩm quyền của Sở (Đ32 k5, Đ33 NĐ 217) — xét theo công trình chính có cấp cao nhất. Cấp đặc biệt hoặc dự án trên 2 tỉnh trở lên thuộc bộ (Đ32 k2).',
      dulieu: 'Tờ trình Mẫu 01 của cơ quan chuẩn bị dự án; kết quả xác định cấp theo TT 34/2026',
    },
    {
      buoc: 2,
      tieu: 'Tóm tắt dự án',
      noiDung: 'Tên dự án cụ thể, cơ quan chuẩn bị dự án, địa điểm (cấp xã, tỉnh), quy mô (công suất, chiều dài, diện tích), nhóm dự án, loại và cấp công trình chính, tổng mức đầu tư, nguồn vốn.',
      dulieu: 'Mục I Tờ trình Mẫu 01',
      ghiChu: 'Ghi số liệu cụ thể, kèm vị trí trong hồ sơ; không dùng "…" hoặc "như trên".',
    },
    {
      buoc: 3,
      tieu: 'Kết quả thẩm định theo 4 nhóm nội dung',
      noiDung: '(1) Phù hợp với quy hoạch làm căn cứ lập dự án (Đ26, Đ38 k1 NĐ 217); (2) khả năng kết nối HTKT khu vực (Đ38 k2); (3) tuân thủ quy chuẩn, tiêu chuẩn, an toàn xây dựng, giải pháp PCCC (Đ38 k3, k4; thẩm định thiết kế PCCC tích hợp theo Đ6 k1 NĐ 105 sửa bởi NĐ 347/2026); (4) quản lý chi phí — chỉ với dự án đầu tư công, PPP — 3 nội dung tại Đ7 k5 NĐ 206.',
      dulieu: 'Mục V Mẫu 03; quy trình BCNCKT tại lib/htkt/tham-dinh.ts',
    },
    {
      buoc: 4,
      tieu: 'Thời hạn',
      noiDung: 'Theo Đ37 NĐ 217 (ngày làm việc, tính từ khi nhận đủ hồ sơ hợp lệ): nhóm A 25/20; nhóm B 20/16; nhóm C 15/12 (số đầu khi dự án có công trình cấp I trở lên); dự án quan trọng quốc gia 60 ngày. Gia hạn tối đa 01 lần.',
      dulieu: 'Ngày nhận đủ hồ sơ hợp lệ trên hệ thống Một cửa',
    },
    {
      buoc: 5,
      tieu: 'Đề xuất kết luận',
      noiDung: 'Đề xuất 1 trong 3 mức của Mẫu 03: "đủ điều kiện" / "chỉ đủ điều kiện sau khi hoàn thiện các nội dung yêu cầu" / "chưa đủ điều kiện" để tổng hợp, trình phê duyệt. Kèm dự thảo Thông báo kết quả thẩm định.',
      dulieu: 'Kết quả rà soát của Phòng HTKT',
    },
  ],
  templateChiDan: `
【TỜ TRÌNH】
Kính gửi: Giám đốc Sở Xây dựng

V/v kết quả thẩm định Báo cáo nghiên cứu khả thi dự án [TÊN DỰ ÁN CỤ THỂ]

Ngày …/…/…, Sở Xây dựng nhận Tờ trình số … của [cơ quan chuẩn bị dự án] trình thẩm định BCNCKT dự án nêu trên (hồ sơ hợp lệ ngày …/…/…).

1. Thông tin dự án: [tên, địa điểm cấp xã/tỉnh, quy mô cụ thể, nhóm dự án, loại và cấp công trình chính theo TT 34/2026, tổng mức đầu tư, nguồn vốn]
2. Thẩm quyền: thuộc đối tượng thẩm định tại [Đ27 k1 điểm … Luật 135]; thuộc thẩm quyền Sở theo [Đ32 k5 / Đ33 khoản … NĐ 217/2026]
3. Kết quả thẩm định:
   3.1. Phù hợp quy hoạch làm căn cứ lập dự án: …
   3.2. Kết nối hạ tầng kỹ thuật khu vực: …
   3.3. Quy chuẩn, tiêu chuẩn, an toàn xây dựng, PCCC: …
   3.4. Quản lý chi phí (dự án đầu tư công/PPP): …
4. Thời hạn: [số] ngày làm việc theo Đ37 NĐ 217/2026, hạn trả kết quả …/…/…
5. Đề xuất: Báo cáo nghiên cứu khả thi [đủ điều kiện / chỉ đủ điều kiện sau khi hoàn thiện / chưa đủ điều kiện] để tổng hợp, trình phê duyệt. Kính trình Giám đốc Sở xem xét, ký Thông báo kết quả thẩm định (dự thảo kèm theo).

【KÝ】
Trưởng Phòng HTKT
  `,
  ghiChu: 'Phải ghi cụ thể cấp công trình (Đặc biệt/I/II/III/IV theo TT 34/2026) và quy mô; nhóm dự án (A/B/C) xác định theo tổng mức đầu tư, không suy từ cấp công trình.',
}

// ───────── Công văn lấy ý kiến phối hợp ─────────
export const HUONG_DAN_CONG_VAN_LAY_Y_KIEN: HuongDanSoanThao = {
  tenMau: 'Công văn lấy ý kiến cơ quan chuyên ngành',
  moTa: 'Công văn của Sở lấy ý kiến cơ quan có chức năng quản lý liên quan trong quá trình thẩm định BCNCKT — chỉ hỏi nội dung thuộc chức năng của cơ quan được hỏi.',
  canCuChiay: [
    'Nghị định 217/2026/NĐ-CP (Đ33 k3 — lấy ý kiến cơ quan chuyên môn theo chuyên ngành đối với công trình chính còn lại; Đ38 k2 — văn bản thỏa thuận, hướng dẫn kết nối HTKT; Đ7 k5)',
    'Nghị định 105/2025/NĐ-CP sửa bởi NĐ 347/2026 (Đ11 — cơ quan quản lý chuyên ngành phối hợp khi có yêu cầu)',
    'Nghị định 30/2020/NĐ-CP (thể thức văn bản)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Kiểm tra trước khi hỏi',
      noiDung: '(K1) nội dung có thuộc chức năng cơ quan được hỏi không; (K2) đã có văn bản thỏa thuận của cơ quan đó trong hồ sơ chưa — nếu có thì không hỏi lại (Đ7 k5); (K3) có căn cứ lấy ý kiến không; (K4) nội dung có phải Sở bắt buộc tự kết luận không (quy hoạch, quy chuẩn, an toàn, PCCC, chi phí) — nếu phải thì không hỏi để cơ quan khác kết luận thay.',
      dulieu: 'Danh mục văn bản pháp lý trong hồ sơ (Đ35 k2 NĐ 217)',
      ghiChu: 'Chiếu sáng công cộng là dự án HTKT do Sở Xây dựng thẩm định (Phụ lục III, Đ73 k5 NĐ 217) — không có quy định bắt buộc lấy ý kiến Sở Công Thương. Chỉ hỏi Sở Công Thương khi có hạng mục công trình năng lượng (đường dây, trạm biến áp).',
    },
    {
      buoc: 2,
      tieu: 'Mở đầu và nêu vấn đề cụ thể',
      noiDung: 'Mở đầu: "Ngày … tháng … năm …, Sở Xây dựng nhận được Tờ trình số … của … về việc thẩm định …; sau khi rà soát, để có cơ sở thẩm định theo quy định, Sở Xây dựng đề nghị … có ý kiến đối với các nội dung sau:". Mỗi vấn đề nêu: vì sao cần ý kiến (kèm vị trí trong hồ sơ), thuộc chức năng quản lý nào, câu hỏi cụ thể có thể trả lời được, tài liệu đối chiếu.',
      dulieu: 'Nội dung BCNCKT, bản vẽ liên quan',
    },
    {
      buoc: 3,
      tieu: 'Trách nhiệm và thời hạn',
      noiDung: 'Ghi: "Ý kiến của quý cơ quan là cơ sở để Sở Xây dựng xem xét trong quá trình thẩm định; Sở Xây dựng chịu trách nhiệm về kết quả thẩm định theo quy định." Thời hạn trả lời do Sở ấn định, phải nằm trong thời hạn thẩm định Đ37 NĐ 217.',
      dulieu: 'Hạn trả kết quả thẩm định',
      ghiChu: 'NĐ 217 không quy định thời hạn trả lời của cơ quan được hỏi và không quy định "quá hạn coi như đồng ý" — không tự ghi các nội dung này. Việc lấy ý kiến không làm dừng thời hạn thẩm định; cần thêm thời gian thì gia hạn 01 lần (Đ37 k2).',
    },
    {
      buoc: 4,
      tieu: 'Nơi nhận, liên hệ',
      noiDung: 'Nơi nhận: cơ quan được hỏi; cơ quan chuẩn bị dự án (để phối hợp cung cấp tài liệu); Lưu VT, Phòng HTKT. Ghi người liên hệ tại Phòng HTKT.',
      dulieu: 'Danh sách phân công HTKT',
    },
  ],
  templateChiDan: `
【CÔNG VĂN】
UBND TỈNH QUẢNG TRỊ / SỞ XÂY DỰNG
Số: …/SXD-HTKT
V/v lấy ý kiến về [nội dung cụ thể] của dự án [TÊN DỰ ÁN]

Kính gửi: [cơ quan có chức năng quản lý nội dung cần hỏi — ví dụ đơn vị quản lý hạ tầng tiếp nhận đấu nối; Sở Nông nghiệp và Môi trường về hành lang bảo vệ nguồn nước/thủy lợi; Sở Công Thương nếu có hạng mục công trình năng lượng]

Ngày …/…/…, Sở Xây dựng nhận được Tờ trình số … ngày … của [cơ quan chuẩn bị dự án] về việc thẩm định Báo cáo nghiên cứu khả thi dự án [tên]; sau khi rà soát, để có cơ sở thẩm định theo quy định, Sở Xây dựng đề nghị [cơ quan] có ý kiến đối với các nội dung sau:

1. [Vấn đề 1]: Hồ sơ thể hiện … (thuyết minh trang …, bản vẽ số …). Đề nghị cho ý kiến: [câu hỏi cụ thể thuộc chức năng quản lý của cơ quan].
2. [Vấn đề 2, nếu có] …

Tài liệu gửi kèm: …
Ý kiến của quý cơ quan là cơ sở để Sở Xây dựng xem xét trong quá trình thẩm định; Sở Xây dựng chịu trách nhiệm về kết quả thẩm định theo quy định.
Văn bản góp ý đề nghị gửi về Sở Xây dựng trước ngày …/…/… để kịp tổng hợp trong thời hạn thẩm định theo quy định.
Liên hệ: [tên], Phòng HTKT, ĐT: …

Nơi nhận: Như trên; [cơ quan chuẩn bị dự án]; Lưu: VT, HTKT.
【KÝ】 KT. GIÁM ĐỐC / PHÓ GIÁM ĐỐC
  `,
  ghiChu: 'Không hỏi chung chung; không đề nghị cơ quan khác "thẩm định" hay "kết luận" thay nội dung thuộc thẩm quyền Sở; nhiều cơ quan thì mặc định mỗi cơ quan một văn bản.',
}

// ───────── Thông báo kết quả thẩm định BCNCKT (Mẫu 03) ─────────
export const HUONG_DAN_THONG_BAO_KQ_BCNCKT: HuongDanSoanThao = {
  tenMau: 'Thông báo kết quả thẩm định BCNCKT (Mẫu số 03 NĐ 217)',
  moTa: 'Thông báo kết quả thẩm định gửi cơ quan chuẩn bị dự án, đồng gửi cơ quan quản lý xây dựng địa phương (Đ38 k6 NĐ 217).',
  canCuChiay: [
    'Luật Xây dựng 135/2025/QH15 (Đ27 k4)',
    'Nghị định 217/2026/NĐ-CP (Đ36 k8 đóng dấu bản vẽ; Đ38; Mẫu số 03 Phụ lục I)',
    'Nghị định 206/2026/NĐ-CP (Đ7 k5)',
    'Nghị định 105/2025/NĐ-CP sửa bởi NĐ 347/2026 (thẩm định thiết kế PCCC tích hợp)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Chọn đúng loại văn bản',
      noiDung: 'Thiếu THÀNH PHẦN hồ sơ (trong 05 ngày làm việc, 01 lần): Phiếu bổ sung, hoàn thiện hồ sơ Mẫu 15. Lỗi, sai sót số liệu không thể kết luận: Phiếu tạm dừng thẩm định Mẫu 16 (01 lần). Đã thẩm định xong: Thông báo kết quả Mẫu 03.',
      dulieu: 'Đ36 k3, k4 NĐ 217',
    },
    {
      buoc: 2,
      tieu: 'Kết luận theo 3 mức của Mẫu 03',
      noiDung: '"Đủ điều kiện" / "chỉ đủ điều kiện sau khi hoàn thiện các nội dung yêu cầu" / "chưa đủ điều kiện" để tổng hợp, trình phê duyệt và triển khai các bước tiếp theo.',
      dulieu: 'Kết quả thẩm định của Phòng HTKT',
      ghiChu: 'Không dùng "bác", "không chấp thuận" khi chưa đến mức từ chối.',
    },
    {
      buoc: 3,
      tieu: 'Đánh giá từng nội dung (mục V Mẫu 03)',
      noiDung: 'Mỗi tồn tại viết: "Nội dung hồ sơ đang thể hiện …; tuy nhiên …; đề nghị [cơ quan chuẩn bị dự án] chỉ đạo Tư vấn …; cập nhật tại …".',
      dulieu: 'Kết quả thẩm định chi tiết',
    },
    {
      buoc: 4,
      tieu: 'Thời hạn bổ sung, đóng dấu bản vẽ',
      noiDung: 'Với Mẫu 15/16: sau 20 ngày làm việc không bổ sung thì dừng thẩm định, trả hồ sơ; nộp lại thì thời hạn tính lại từ đầu (Đ36 k5). Với kết luận "chỉ đủ điều kiện sau khi hoàn thiện": cơ quan chuẩn bị dự án hoàn thiện, nộp văn bản đề nghị đóng dấu kèm hồ sơ (Đ36 k8 điểm d).',
      dulieu: 'Đ36 k5, k8 NĐ 217',
    },
  ],
  templateChiDan: `
【THÔNG BÁO KẾT QUẢ THẨM ĐỊNH — theo Mẫu số 03 Phụ lục I NĐ 217/2026】
UBND TỈNH QUẢNG TRỊ / SỞ XÂY DỰNG
Số: …/SXD-HTKT
V/v thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi dự án [TÊN]

Kính gửi: [cơ quan chuẩn bị dự án]

Sở Xây dựng đã nhận Tờ trình số … ngày … của [cơ quan chuẩn bị dự án] trình thẩm định BCNCKT dự án [tên].
Căn cứ Luật Xây dựng số 135/2025/QH15; Nghị định số 217/2026/NĐ-CP; Nghị định số 206/2026/NĐ-CP; các căn cứ khác có liên quan;
Sau khi xem xét, Sở Xây dựng thông báo kết quả thẩm định như sau:

I. THÔNG TIN CHUNG VỀ DỰ ÁN — [tên; nhóm dự án; loại, cấp công trình chính theo TT 34/2026; quy mô; địa điểm; tổng mức đầu tư; nguồn vốn; nhà thầu tư vấn, khảo sát, thẩm tra]
II. HỒ SƠ TRÌNH THẨM ĐỊNH — [văn bản pháp lý; hồ sơ khảo sát, thiết kế; báo cáo kết quả thẩm tra]
III. NỘI DUNG HỒ SƠ TRÌNH THẨM ĐỊNH — [tóm tắt]
IV. PHẠM VI VÀ NGUYÊN TẮC THẨM ĐỊNH — [theo Đ27 k4 Luật 135; Đ7 k5 NĐ 217]
V. KẾT QUẢ THẨM ĐỊNH
  1. Tuân thủ quy định về lập dự án, thiết kế; năng lực hành nghề (nếu cần thiết): …
  2. Phù hợp với quy hoạch làm căn cứ lập dự án (Đ26 NĐ 217): …
  3. Khả năng kết nối hạ tầng kỹ thuật khu vực: …
  4. Quy chuẩn (QCVN 07:2023/BXD và Sửa đổi 1:2025; QCVN 01:2021/BXD…), tiêu chuẩn, an toàn xây dựng, giải pháp PCCC: …
  5. Quản lý chi phí đầu tư xây dựng (dự án đầu tư công, PPP): …
VI. KẾT LUẬN VÀ KIẾN NGHỊ
  Báo cáo nghiên cứu khả thi [đủ điều kiện / chỉ đủ điều kiện sau khi hoàn thiện các nội dung yêu cầu / chưa đủ điều kiện] để tổng hợp, trình phê duyệt và triển khai các bước tiếp theo.
  Kiến nghị: …; yêu cầu sửa đổi, bổ sung, hoàn thiện: …

Nơi nhận: Như trên; Cơ quan quản lý nhà nước về xây dựng tại địa phương xây dựng dự án; Lưu: VT, HTKT.
【KÝ】 GIÁM ĐỐC (hoặc KT. GIÁM ĐỐC – PHÓ GIÁM ĐỐC)
  `,
  ghiChu: 'Kết quả thẩm định là cơ sở để người quyết định đầu tư phê duyệt dự án, không phải quyết định phê duyệt. Không yêu cầu chứng chỉ năng lực tổ chức hay văn bản thẩm duyệt PCCC của Công an.',
}

// Export danh sách hướng dẫn
export const HUONG_DAN_SOAN_THAO_LIST: Record<string, HuongDanSoanThao> = {
  'to-trinh-bcnckt': HUONG_DAN_TO_TRINH_BCNCKT,
  'cong-van-lay-y-kien': HUONG_DAN_CONG_VAN_LAY_Y_KIEN,
  'thong-bao-kq-bcnckt': HUONG_DAN_THONG_BAO_KQ_BCNCKT,
}

export function getHuongDan(key: string): HuongDanSoanThao | undefined {
  return HUONG_DAN_SOAN_THAO_LIST[key]
}

// Thời hạn thẩm định BCNCKT theo Đ37 k1 NĐ 217/2026 (ngày làm việc), theo nhóm dự án và việc có công trình cấp I trở lên.
export function thoiHanThamDinhBcnckt(nhom: QuyMoCongTrinh, cap: CapCongTrinh): string {
  const capITroLen = cap === 'Đặc biệt' || cap === 'I'
  const bang: Record<QuyMoCongTrinh, [number, number]> = { A: [25, 20], B: [20, 16], C: [15, 12] }
  const [coCapI, conLai] = bang[nhom]
  return `${capITroLen ? coCapI : conLai} ngày làm việc (Đ37 k1 NĐ 217/2026${capITroLen ? ', dự án có công trình cấp I trở lên' : ''})`
}

// Dữ liệu tự điền: KHÔNG suy kết luận thẩm định từ quy mô — kết luận chỉ có sau khi thẩm định.
export function smartFillTuQuyMo(
  linhVuc: LinhVucKey,
  quyMo: QuyMoCongTrinh,
  cap: CapCongTrinh = 'III',
  loai: LoaiThamDinhSoanThao = 'bcnckt',
): Record<string, string> {
  const capDacBiet = cap === 'Đặc biệt'
  const theoLoai: Record<LoaiThamDinhSoanThao, { loaiVanBan: string; thamQuyen: string; thoiHan: string }> = {
    bcnckt: {
      loaiVanBan: 'Thông báo kết quả thẩm định BCNCKT (Mẫu số 03 NĐ 217) — kết luận 1 trong 3 mức sau khi thẩm định',
      thamQuyen: capDacBiet
        ? 'Cơ quan chuyên môn về xây dựng thuộc bộ quản lý chuyên ngành (dự án có công trình cấp đặc biệt — Đ32 k2 NĐ 217)'
        : 'Sở Xây dựng nếu dự án thuộc đối tượng Đ27 k1 Luật 135 và không thuộc Đ32 k2–k4, Đ33 NĐ 217 (kiểm tra theo công trình chính cấp cao nhất)',
      thoiHan: thoiHanThamDinhBcnckt(quyMo, cap),
    },
    bcktkt: {
      loaiVanBan: 'Thông báo kết quả thẩm định BCKTKT (Mẫu số 06 tham khảo)',
      thamQuyen: 'Không thẩm định tại cơ quan chuyên môn (Đ27 k2 Luật 135); Sở chỉ thẩm định khi được người quyết định đầu tư giao (Đ31 k3 NĐ 217)',
      thoiHan: 'Theo quy trình do UBND tỉnh ban hành (Đ73 k4 điểm b NĐ 217) — NĐ 217 không quy định thời hạn',
    },
    'thiet-ke': {
      loaiVanBan: 'Thông báo kết quả thẩm định thiết kế của CHỦ ĐẦU TƯ (Mẫu số 12 NĐ 217)',
      thamQuyen: 'Chủ đầu tư thẩm định (Đ29 k1 Luật 135, Đ41 NĐ 217); Sở chỉ thẩm định dự toán hạng mục vốn đầu tư công của dự án PPP (Đ41 k2 điểm b)',
      thoiHan: 'Không có thời hạn thẩm định của cơ quan chuyên môn',
    },
    'nghiem-thu': {
      loaiVanBan: 'Thông báo kết quả kiểm tra công tác nghiệm thu (Phụ lục VIII NĐ 207/2026)',
      thamQuyen: 'Sở Xây dựng đối với công trình thuộc Phụ lục IV NĐ 217 trên địa bàn (Đ25, Đ26 k1 điểm c NĐ 207)',
      thoiHan: capDacBiet || cap === 'I' ? '16 ngày làm việc (Đ27 k4 NĐ 207)' : '12 ngày làm việc (Đ27 k4 NĐ 207)',
    },
  }
  return { ...theoLoai[loai], linhVuc, quyMo }
}
