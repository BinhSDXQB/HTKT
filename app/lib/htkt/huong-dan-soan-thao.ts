// Hướng dẫn soạn thảo chi tiết các mẫu VBPL theo quy mô công trình cụ thể
// Căn cứ pháp lý: NĐ 217/2026, NĐ 207/2026, TT 34/2026, NĐ 206/2026
// Mục đích: Smart-fill dữ liệu, hiển thị căn cứ, từng bước soạn thảo chi tiết

import type { LinhVucKey } from './phap-ly'

export type QuyMoCongTrinh = 'A' | 'B' | 'C'

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

// ───────── Tờ trình thẩm định BCNCKT ─────────
export const HUONG_DAN_TO_TRINH_BCNCKT: HuongDanSoanThao = {
  tenMau: 'Tờ trình thẩm định Báo cáo nghiên cứu khả thi',
  moTa: 'Tờ trình gửi Lãnh đạo Sở để trình thẩm định BCNCKT công trình HTKT',
  canCuChiay: [
    'Luật Xây dựng 135/2025/QH15 (Điều 43: BCNCKT)',
    'NĐ 217/2026/NĐ-CP (Chương II: Thẩm định)',
    'TT 34/2026/TT-BXD (Phân cấp công trình)',
    'NĐ 206/2026/NĐ-CP (Thẩm định TMĐT)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Xác định loại công trình & quy mô',
      noiDung: 'Nếu công trình cấp I/II (Nhóm A): Sở Xây dựng thẩm định. Nếu cấp III/IV (Nhóm B/C): HĐNT/chủ đầu tư thẩm định.',
      dulieu: 'Chọn từ ma trận phân loại: lĩnh vực + loại + cấp + quy mô',
    },
    {
      buoc: 2,
      tieu: 'Ghi tên dự án, chủ đầu tư, địa điểm',
      noiDung: 'Tên dự án phải cụ thể (vd "Nhà máy nước Đồng Hới Giai đoạn I, công suất 50.000 m³/ngày"), không nêu chung chung.',
      dulieu: 'Từ hồ sơ chủ đầu tư/phương án đầu tư',
      ghiChu: 'Phải ghi rõ quy mô: "Công suất XXX m³/ngày" hoặc "Diện tích XXX ha" v.v.',
    },
    {
      buoc: 3,
      tieu: 'Liệt kê nội dung thẩm định chi tiết',
      noiDung: 'Thẩm định: (1) Quy hoạch & tiêu chí thiết kế cơ sở (theo QCVN 07); (2) Khối lượng, công nghệ phù hợp; (3) Tổng mức đầu tư (NĐ 206/2026); (4) Năng lực nhà thầu (NĐ 212/2026).',
      dulieu: 'Danh sách nội dung từ lib/htkt/tham-dinh.ts (quy trình BCNCKT)',
    },
    {
      buoc: 4,
      tieu: 'Ghi thời hạn & thẩm quyền',
      noiDung: 'Thời hạn: Nhóm A ≤ 40 ngày; Nhóm B ≤ 30 ngày; Nhóm C ≤ 20 ngày (từ khi nhận đủ hồ sơ hợp lệ).',
      dulieu: 'NĐ 217/2026, Chương II, Điều 5',
      ghiChu: 'Tính từ ngày nhập lệnh thẩm định, không tính thời gian yêu cầu bổ sung.',
    },
    {
      buoc: 5,
      tieu: 'Kết luận & đề nghị',
      noiDung: 'Kết luận: "Đề nghị Lãnh đạo Sở ủy quyền thẩm định BCNCKT. Nếu chấp thuận, sẽ làm cơ sở cho lập BCKTKT" hoặc "Yêu cầu chủ đầu tư bổ sung/sửa đổi phương án như sau: ..." (ghi cụ thể).',
      dulieu: 'Nội dung từ rà soát sơ bộ phòng HTKT',
    },
  ],
  templateChiDan: `
【TỜ TRÌNH】
Kính gửi: Giám đốc Sở Xây dựng

Về việc thẩm định Báo cáo nghiên cứu khả thi:
"Dự án [TÊN CÔNG TRÌNH CHI TIẾT: vd Nhà máy nước Đồng Hới Giai đoạn I, công suất 50.000 m³/ngày]"

Căn cứ:
- Luật Xây dựng 135/2025/QH15 (Điều 43 về BCNCKT)
- NĐ 217/2026/NĐ-CP (Quy định chi tiết thẩm định)
- TT 34/2026/TT-BXD (Phân cấp công trình HTKT cấp [I/II/III/IV])
- NĐ 206/2026/NĐ-CP (Thẩm định tổng mức đầu tư)

Nội dung:
1. Dự án: [Tên + Chủ đầu tư + Địa điểm + Quy mô cụ thể]
2. Loại công trình: [Cấp I/II/III/IV theo TT 34/2026]
3. Nội dung thẩm định: Quy hoạch, thiết kế cơ sở, TMĐT, năng lực nhà thầu
4. Thẩm quyền: [Sở Xây dựng / HĐNT / Chủ đầu tư]
5. Thời hạn: [40/30/20] ngày (tính từ khi nhận đủ hồ sơ hợp lệ)

Đề nghị: Ủy quyền thẩm định BCNCKT theo thẩm quyền, làm cơ sở tiếp tục lập BCKTKT.

【KÝ】
Trưởng Phòng HTKT
  `,
  ghiChu: 'Phải hiển thị cụ thể "Cấp I/II/III/IV" và "quy mô công trình" — không dùng "…" hoặc "như trên".',
}

// ───────── Công văn lấy ý kiến phối hợp ─────────
export const HUONG_DAN_CONG_VAN_LAY_Y_KIEN: HuongDanSoanThao = {
  tenMau: 'Công văn lấy ý kiến phối hợp thẩm định',
  moTa: 'Công văn gửi các cơ quan liên quan (môi trường, quy hoạch, PCCC, điện lực...) để lấy ý kiến thẩm định BCNCKT.',
  canCuChiay: [
    'NĐ 217/2026/NĐ-CP (Điều 6: Lấy ý kiến các cơ quan liên quan)',
    'TT 34/2026/TT-BXD (Phân cấp công trình)',
    'NĐ 206/2026/NĐ-CP (Thẩm định chi phí)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Xác định cơ quan cần lấy ý kiến',
      noiDung: 'Môi trường (nếu lĩnh vực nhạy cảm); Quy hoạch & kiến trúc; PCCC; Điện lực (nếu công trình chiếu sáng); Sở Công Thương (nếu công trình chiếu sáng công cộng).',
      dulieu: 'NĐ 217/2026, Điều 6.2 (danh sách cơ quan phối hợp)',
      ghiChu: 'Công trình CHIẾU SÁNG: bắt buộc lấy ý kiến Sở Công Thương (quy định mới NĐ 217/2026).',
    },
    {
      buoc: 2,
      tieu: 'Ghi rõ loại công trình & yêu cầu thẩm định',
      noiDung: 'Phải ghi: "Dự án [TÊN], công trình [LOẠI], cấp [I/II/III/IV] theo TT 34/2026, quy mô [CỤ THỂ]". Liệt kê yêu cầu chi tiết (vd "Xác nhận không có tác động môi trường tiêu cực", "Phê duyệt phương án đấu nối điện", v.v.).',
      dulieu: 'Nội dung từ BCNCKT dự kiến / thông tin chủ đầu tư',
    },
    {
      buoc: 3,
      tieu: 'Ghi hạn chót phản hồi',
      noiDung: 'Hạn chót: 10–15 ngày làm việc tùy tính chất (yêu cầu Sở Công Thương 15 ngày, môi trường 10 ngày).',
      dulieu: 'Tính theo NĐ 217/2026: thời hạn phối hợp không quá 1/3 thời hạn thẩm định toàn bộ',
    },
    {
      buoc: 4,
      tieu: 'Liên hệ người tiếp nhận ý kiến',
      noiDung: 'Ghi tên, điện thoại, email người phụ trách tại Phòng HTKT để cơ quan phối hợp liên hệ đặt câu hỏi.',
      dulieu: 'Từ danh sách phân công HTKT',
    },
  ],
  templateChiDan: `
【CÔNG VĂN】
V/v: Lấy ý kiến thẩm định dự án [TÊN CÔNG TRÌNH]

Kính gửi: [Sở Công Thương / Sở Tài nguyên Môi trường / Sở Quy hoạch Kiến trúc / PCCC]

Trên cơ sở Dự án "[TÊN ĐẦY ĐỦ: VD Nhà máy nước Đồng Hới Giai đoạn I, công suất 50.000 m³/ngày]":
- Chủ đầu tư: [Tên cơ quan / công ty]
- Địa điểm: [Xã/phường, huyện/thị xã]
- Loại công trình: [HTKT cấp I/II/III/IV theo TT 34/2026/TT-BXD]
- Quy mô: [Ghi cụ thể: "Công suất XXX", "Diện tích XXX ha", v.v.]

Sở Xây dựng đang thẩm định BCNCKT. Kính yêu cầu [Sở/Cơ quan] phối hợp lấy ý kiến về:
1. [Chi tiết yêu cầu 1: VD "Xác nhận không tác động tiêu cực đến môi trường"]
2. [Chi tiết yêu cầu 2: VD "Phê duyệt phương án đấu nối, cấp phép sử dụng năng lượng"]
3. [Chi tiết yêu cầu 3, nếu có]

Hạn chót phản hồi: [Ngày], năm 2026 (15 ngày làm việc tính từ ngày nhận công văn).

Liên hệ: [Tên người phụ trách], Phòng HTKT, ĐT: [Số], Email: [Email]

Xin cảm ơn.

【KÝ】
Phòng HTKT
  `,
  ghiChu: 'CHIẾU SÁNG: bắt buộc gửi Sở Công Thương (NĐ 217/2026 Điều 6.2). Hạn chót tối thiểu 15 ngày vì Sở Công Thương cần thẩm xét kỹ.',
}

// ───────── Thông báo kết quả thẩm định BCNCKT ─────────
export const HUONG_DAN_THONG_BAO_KQ_BCNCKT: HuongDanSoanThao = {
  tenMau: 'Thông báo kết quả thẩm định BCNCKT',
  moTa: 'Thông báo chính thức kết quả thẩm định (chấp thuận / không chấp thuận / yêu cầu bổ sung) gửi chủ đầu tư.',
  canCuChiay: [
    'NĐ 217/2026/NĐ-CP (Điều 9: Kết quả thẩm định)',
    'TT 34/2026/TT-BXD (Phân cấp quyết định)',
    'Luật Xây dựng 135/2025/QH15 (Điều 44: Hiệu lực BCNCKT)',
  ],
  cacBuoc: [
    {
      buoc: 1,
      tieu: 'Ghi kết quả rõ ràng (Chấp thuận / Không chấp thuận / Yêu cầu bổ sung)',
      noiDung: 'Phải ghi cụ thể: "CHẤP THUẬN BCNCKT" hoặc "KHÔNG CHẤP THUẬN vì: [lý do cụ thể]" hoặc "YÊU CẦU BỔ SUNG: [danh sách chi tiết]".',
      dulieu: 'Kết luận từ cuộc họp thẩm định nội bộ',
      ghiChu: 'Không dùng "tạm thời chấp thuận" hay "có điều kiện" — phải rõ ràng.',
    },
    {
      buoc: 2,
      tieu: 'Ghi chi tiết lý do (nếu không chấp thuận)',
      noiDung: 'Nếu từ chối: ghi cụ thể từng vấn đề (vd "Công suất thiết kế không phù hợp với nhu cầu Đồng Hới đến 2040", "Phương án thoát nước không đáp ứng QCVN 07-2:2016", v.v.).',
      dulieu: 'Kết quả thẩm định chi tiết từ phòng HTKT',
    },
    {
      buoc: 3,
      tieu: 'Ghi hạn bổ sung (nếu yêu cầu)',
      noiDung: 'Hạn bổ sung = 30–60 ngày tùy tính chất (NĐ 217/2026). Ghi rõ: "Yêu cầu bổ sung trong vòng 45 ngày, gửi lại lần 2 để thẩm định tiếp."',
      dulieu: 'NĐ 217/2026, Điều 8 (thời gian bổ sung)',
    },
    {
      buoc: 4,
      tieu: 'Ghi cơ sở pháp lý chi tiết',
      noiDung: 'Liệt kê tất cả VBPL dùng thẩm định (NĐ 217/2026, NĐ 206/2026, TT 34/2026, QCVN 07, v.v.).',
      dulieu: 'Từ hướng dẫn phap-ly.ts',
    },
  ],
  templateChiDan: `
【THÔNG BÁO KẾT QUẢ THẨM ĐỊNH】

Dự án: [TÊN ĐẦY ĐỦ + QUY MỌ CỤTH thể]
Chủ đầu tư: [Tên]
Loại công trình: [Cấp I/II/III/IV theo TT 34/2026]

Căn cứ NĐ 217/2026/NĐ-CP và các VBPL khác, Sở Xây dựng thẩm định BCNCKT kết luận như sau:

【KẾT QUẢ】
✓ CHẤP THUẬN BCNCKT.
  Căn cứ thẩm định: Phương án phù hợp với quy hoạch, QCVN 07-1:2016/BXD, NĐ 206/2026. Công suất thiết kế 50.000 m³/ngày đáp ứng nhu cầu Đồng Hới đến 2040.

Hoặc:

✗ KHÔNG CHẤP THUẬN vì:
1. Công suất thiết kế (30.000 m³/ngày) < nhu cầu dự kiến đến 2040 (45.000 m³/ngày) theo kế hoạch phát triển đô thị.
2. Phương án thoát nước không đáp ứng QCVN 07-2:2016/BXD về độ an toàn.
3. Năng lực nhà thầu chưa đủ tiêu chí NĐ 212/2026.

Yêu cầu chủ đầu tư bổ sung/sửa đổi, gửi lại BCNCKT lần 2 trong vòng 45 ngày.

Hoặc:

⚠ YÊU CẦU BỔ SUNG:
1. Thuyết minh chi tiết công nghệ xử lý nước (hiện chưa rõ công nghệ membran hay truyền thống).
2. Lập thêm phương án thoát nước theo QCVN 07-2:2016/BXD (hiện chỉ lập phương án cấp nước).
3. Cung cấp chứng chỉ năng lực nhà thầu theo NĐ 212/2026.

Hạn bổ sung: 45 ngày tính từ ngày nhận thông báo này.

【CĂN CỨ PH ÁP LÝ】
- Luật Xây dựng 135/2025/QH15 (Điều 43–44 về BCNCKT)
- NĐ 217/2026/NĐ-CP (Điều 5–9: Thẩm định BCNCKT)
- NĐ 206/2026/NĐ-CP (Thẩm định TMĐT)
- NĐ 212/2026/NĐ-CP (Năng lực nhà thầu)
- TT 34/2026/TT-BXD (Phân cấp công trình cấp [I/II/III/IV])
- QCVN 07-1:2016/BXD (Công trình cấp nước)
- QCVN 07-2:2016/BXD (Công trình thoát nước)

【KÝ】
Giám đốc Sở / Trưởng Phòng HTKT
  `,
  ghiChu: 'Không dùng từ mập mờ như "tạm chấp thuận", "có điều kiện", "có ý kiến khác" — phải rõ ràng một trong 3: Chấp / Không chấp / Yêu cầu bổ sung.',
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

// Hàm helper: Sinh dữ liệu smart-fill từ quy mô công trình
export function smartFillTuQuyMo(linhVuc: LinhVucKey, quyMo: QuyMoCongTrinh): Record<string, string> {
  const loaiVanBan = quyMo === 'A' ? 'CHẤP THUẬN' : quyMo === 'B' ? 'YÊU CẦU BỔ SUNG' : 'KHÔNG CHẤP THUẬN'
  const thamQuyen = quyMo === 'A' ? 'Sở Xây dựng' : 'HĐNT / Chủ đầu tư'
  const thoiHan = quyMo === 'A' ? '40' : quyMo === 'B' ? '30' : '20'

  return {
    loaiVanBan,
    thamQuyen,
    thoiHan,
    linhVuc,
    quyMo,
  }
}
