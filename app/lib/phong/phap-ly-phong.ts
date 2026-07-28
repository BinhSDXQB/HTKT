// CƠ SỞ PHÁP LÝ CHUYÊN NGÀNH các phòng thuộc Sở Xây dựng Quảng Trị.
// Căn cứ chức năng, nhiệm vụ theo Quyết định 331/QĐ-SXD ngày 05/9/2025.
// Cập nhật theo văn bản MỚI NHẤT còn hiệu lực hoặc có hiệu lực từ 01/7/2026 (đợt rà soát 6/2026).
//
// LƯU Ý: đây là danh mục tổng hợp phục vụ tra cứu nhanh — KHÔNG thay thế văn bản gốc;
// luôn đối chiếu hiệu lực thực tế trên CSDL pháp luật trước khi viện dẫn.
//
// Phòng Hạ tầng kỹ thuật có danh mục riêng tại lib/htkt/phap-ly.ts (đã triển khai trước).

import type { VanBan } from '@/lib/htkt/phap-ly'
export type { VanBan, LoaiVanBan } from '@/lib/htkt/phap-ly'
export { LOAI_VANBAN_MAU } from '@/lib/htkt/phap-ly'

export type PhapLyLinhVuc = { key: string; ten: string; vanBan: VanBan[] }
export type PhapLyPhong = {
  ma: string          // mã phòng trùng to_chuc.ma (PHONG_CLCT...)
  ten: string
  baseHref: string    // /dashboard/phong-clct
  moTaPhong: string
  color: 'indigo' | 'emerald' | 'cyan'
  chung: VanBan[]     // văn bản chung của phòng (nền tảng)
  linhVuc: PhapLyLinhVuc[]
}

// ─────────────────────────────────────────────────────────────────────────────
// KHỐI VĂN BẢN NỀN DÙNG LẠI (tái sử dụng giữa các phòng)
// ─────────────────────────────────────────────────────────────────────────────

// Luật Xây dựng 2025 + bộ Nghị định 2026 (hiệu lực 01/7/2026)
const LUAT_XD_2025: VanBan = {
  loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật Xây dựng',
  hieuLuc: 'Hiệu lực 01/7/2026 (một số điều: khoản 2,3 Điều 43, Điều 71, khoản 3,4,5 Điều 95 từ 01/01/2026)',
  ghiChu: 'QH thông qua 10/12/2025. Thay Luật Xây dựng 2014 và Luật sửa đổi 62/2020/QH14. Tăng phân cấp thẩm định, kiểm tra nghiệm thu cho địa phương; bắt buộc áp dụng BIM với công trình cấp II trở lên.',
  trongTam: true,
}
const ND_217_2026: VanBan = {
  loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Xây dựng về quản lý hoạt động xây dựng',
  hieuLuc: 'Ban hành 19/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay NĐ 175/2024 (và NĐ 15/2021). '
    + 'Điều 4: trình tự ĐTXD 3 giai đoạn (chuẩn bị/thực hiện/kết thúc). '
    + 'Chương IV: thẩm định dự án, thiết kế (thẩm quyền Sở XD theo phân cấp Điều 35 Luật XD 2025). '
    + 'Chương V: cấp GPXD — Điều 66 công khai GPXD trên cổng ĐT ≥ 12 tháng; '
    + 'nhà ở riêng lẻ ≤ 7 tầng do UBND cấp xã cấp (Điều 67 khoản 7 — gia hạn, cấp lại). '
    + 'Chương VI: quản lý trật tự XD; xử lý vi phạm. '
    + 'Điều 8: bắt buộc BIM với công trình cấp II trở lên từ giai đoạn khả thi. '
    + 'Quản lý nhà thầu nước ngoài; công trình đặc thù, công trình cấp bách.',
  trongTam: true,
}
const ND_207_2026: VanBan = {
  loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều của Luật Xây dựng về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
  hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay NĐ 06/2021/NĐ-CP. '
    + 'Chương II: quản lý chất lượng khảo sát–thiết kế–thi công (yêu cầu xác định chủng loại, '
    + 'nguồn gốc, thông số kỹ thuật VL trước khi đưa vào thi công). '
    + 'Chương III: nghiệm thu — CĐT tổ chức nghiệm thu từng phần, giai đoạn, hạng mục; '
    + 'bộ phận bị che khuất phải nghiệm thu trước khi tiếp tục thi công. '
    + 'Chương IV: kiểm tra công tác nghiệm thu của cơ quan chuyên môn XD (theo phân cấp). '
    + 'Chương V: bảo trì — chủ sở hữu phải xây dựng kế hoạch + bảo đảm kinh phí bảo trì. '
    + 'Chương VI: sự cố công trình — thông báo sơ bộ nhanh nhất, báo cáo VB trong 24 giờ. '
    + 'Chương VII: an toàn thi công, phá dỡ công trình.',
  trongTam: true,
}
const ND_206_2026: VanBan = {
  loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quy định chi tiết về quản lý chi phí đầu tư xây dựng',
  hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay NĐ 10/2021/NĐ-CP. '
    + 'Sơ bộ tổng mức đầu tư (TMĐT), TMĐT, dự toán XD, giá gói thầu XD. '
    + 'Chi phí quản lý dự án, chi phí tư vấn XD, chi phí khác. '
    + 'Hệ thống công cụ: định mức XD, giá XD, chỉ số giá XD. '
    + 'Phân cấp mạnh cho CĐT: được điều chỉnh cơ cấu khoản mục chi phí (kể cả dự phòng) '
    + 'mà không phải điều chỉnh dự án, miễn không vượt TMĐT đã duyệt. '
    + 'Cho phép tham khảo giá, định mức, dữ liệu chi phí công trình tương tự nước ngoài '
    + 'khi VN chưa có định mức (công nghệ mới, vật liệu mới). '
    + 'Dự án nộp thẩm định trước 01/7/2026 chưa duyệt: phải cập nhật theo NĐ mới.',
}
const ND_210_2026: VanBan = {
  loai: 'Nghị định', soHieu: '210/2026/NĐ-CP', ten: 'Quy định chi tiết về hợp đồng xây dựng',
  hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay NĐ 37/2015/NĐ-CP và 50/2021/NĐ-CP. '
    + 'Phân loại, nội dung, tạm ứng, thanh toán, điều chỉnh hợp đồng XD. '
    + 'Tạm ứng tối đa 30% giá trị HĐ; HĐ tạm ứng > 1 tỷ đồng phải có bảo lãnh tạm ứng. '
    + 'Nhà thầu được tạm ngừng nếu CĐT chậm thanh toán quá 28 ngày. '
    + 'Ban giải quyết tranh chấp HĐ: có thể lập ngay khi ký hoặc khi phát sinh tranh chấp.',
}
const ND_212_2026: VanBan = {
  loai: 'Nghị định', soHieu: '212/2026/NĐ-CP', ten: 'Quy định về điều kiện năng lực hoạt động xây dựng và hệ thống thông tin, cơ sở dữ liệu quốc gia về hoạt động xây dựng',
  hieuLuc: 'Ban hành 17/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay phần năng lực của NĐ 15/2021. '
    + 'Điều kiện năng lực cá nhân (khảo sát, thiết kế, giám sát, quản lý dự án): '
    + 'trình tự sát hạch, cấp mới/cấp lại/gia hạn/thu hồi chứng chỉ hành nghề. '
    + 'Điều kiện năng lực tổ chức: chứng chỉ năng lực tổ chức khảo sát, thiết kế, thi công, '
    + 'tư vấn giám sát, quản lý dự án. '
    + 'Nhà thầu nước ngoài: điều kiện, thẩm quyền, trình tự cấp/thu hồi giấy phép. '
    + 'Hệ thống thông tin & CSDL quốc gia về hoạt động xây dựng — số hoá, công khai năng lực.',
}
const ND_209_2026: VanBan = {
  loai: 'Nghị định', soHieu: '209/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Xây dựng về quản lý vật liệu xây dựng',
  hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
  ghiChu: 'Thay NĐ 09/2021/NĐ-CP. '
    + 'Phát triển, sản xuất, sử dụng VLXD & cấu kiện XD trong công trình. '
    + 'Quản lý chất lượng sản phẩm, hàng hóa VLXD (phải tuân thủ PL về CLSP, TCVN, QCVN). '
    + 'Ưu tiên VLXD xanh, VLXD tái chế, VL thông minh, VL thân thiện môi trường '
    + 'khi lập/thẩm định/phê duyệt dự án, thiết kế, đấu thầu. '
    + 'Cơ chế khuyến khích, ưu đãi R&D vật liệu mới; chuyển đổi xanh, giảm phát thải.',
}

// ── PHÒNG CHÁY CHỮA CHÁY (PCCC) ───────────────────────────────────────────
// Tích hợp trong thẩm định thiết kế — phân công theo Điều 17 Luật 55/2024:
//   • Cơ quan chuyên môn XD (Sở XD): thẩm định nội dung điểm a–đ khoản 1 Điều 16
//     (khoảng cách PCCC, đường bộ/bãi đỗ xe chữa cháy, giải pháp thoát nạn,
//      bậc chịu lửa/ngăn cháy/chống cháy lan/chống khói, giải pháp PCCC riêng)
//   • Cơ quan Công an: thẩm định nội dung điểm e, g khoản 1 Điều 16
//     (hệ thống điện phục vụ PCCC; phương tiện, hệ thống PCCC)
//   • Chủ đầu tư tự thẩm định: công trình KHÔNG thuộc Phụ lục III, IV NĐ 105/2025
//
// ĐỐI TƯỢNG PHẢI THẨM ĐỊNH (Phụ lục III NĐ 105/2025/NĐ-CP — trích quy mô):
//   ▸ Nhà chung cư, nhà ở tập thể: từ 7 tầng HOẶC tổng sàn ≥ 3.000 m²
//   ▸ Khách sạn, nhà nghỉ, toà nhà VP, cơ sở lưu trú: từ 7 tầng HOẶC sàn ≥ 3.000 m²
//   ▸ Trường học, cơ sở giáo dục: từ 5 tầng HOẶC sàn ≥ 3.000 m²
//   ▸ Nhà trẻ, mẫu giáo: từ 150 trẻ HOẶC sàn ≥ 2.000 m²
//   ▸ Bệnh viện, cơ sở y tế: từ 5 tầng HOẶC sàn ≥ 2.000 m²
//   ▸ Rạp chiếu phim, nhà hát, trung tâm hội nghị, bảo tàng, thư viện: từ 300 chỗ
//     HOẶC từ 5 tầng HOẶC sàn ≥ 3.000 m²
//   ▸ Khu vui chơi, karaoke, vũ trường: từ 4 tầng HOẶC sàn ≥ 1.000 m²
//   ▸ Trung tâm thương mại, chợ, siêu thị: sàn ≥ 2.000 m²
//   ▸ Nhà hàng, cửa hàng hàng dễ cháy: sàn ≥ 3.000 m²
//   ▸ Sân vận động, nhà thi đấu: từ 5.000 chỗ HOẶC sàn ≥ 5.000 m²
//   ▸ Nhà xưởng, nhà công nghiệp: có nguy cơ cháy nổ cao (hạng A–E)
//   ▸ Kho chứa hàng nguy hiểm cháy nổ: thể tích ≥ 15.000 m³
//   ▸ Sân bay, cảng biển (≥ cấp III), ga đường sắt: sàn ≥ 3.000 m²
//   ▸ Hầm đường bộ, đường sắt: chiều dài ≥ 1.000 m
//   ▸ Công trình HTKT đô thị (cấp nước, thoát nước, chiếu sáng...): theo quy mô dự án
//
// NGHIỆM THU PCCC: Điều 18 Luật 55/2024 — cơ quan nào thẩm định thiết kế thì
// kiểm tra nghiệm thu PCCC. Công trình chỉ được đưa vào sử dụng sau khi có văn bản
// chấp thuận nghiệm thu. (Từ 01/7/2026: NQ 66/2025 bỏ nghiệm thu PCCC riêng —
// tích hợp vào kiểm tra nghiệm thu chung của cơ quan chuyên môn XD.)
//
// ⚠️ KHI THẨM ĐỊNH DỰ ÁN/THIẾT KẾ: cần đối chiếu công trình có thuộc Phụ lục III
// (cơ quan XD thẩm định) hay Phụ lục IV (cơ quan Công an thẩm định) của NĐ 105/2025
// để yêu cầu hồ sơ PCCC đúng cơ quan. Không yêu cầu CĐT cung cấp văn bản thẩm định
// PCCC khi công trình thuộc thẩm quyền cơ quan XD (Bộ CA đã làm rõ).

const LUAT_PCCC_2024: VanBan = {
  loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',
  hieuLuc: 'Hiệu lực 01/7/2025',
  ghiChu: 'QH thông qua 29/11/2024, thay Luật PCCC 2001 (sửa 2013). '
    + 'Điều 15: yêu cầu PCCC khi lập quy hoạch (QH chung/phân khu/chi tiết). '
    + 'Điều 16 khoản 1: yêu cầu PCCC khi lập dự án/thiết kế công trình — điểm a: khoảng cách PCCC; '
    + 'điểm b: đường bộ, bãi đỗ phục vụ chữa cháy; điểm c: giải pháp thoát nạn; '
    + 'điểm d: bậc chịu lửa, ngăn cháy, chống cháy lan, chống khói; '
    + 'điểm đ: giải pháp PCCC riêng theo đặc thù công trình; '
    + 'điểm e: hệ thống điện phục vụ PCCC; điểm g: phương tiện, hệ thống PCCC. '
    + 'Điều 17: cơ quan XD thẩm định điểm a–đ; Công an thẩm định điểm e, g; '
    + 'khoản 4: Chính phủ quy định danh mục công trình thuộc diện thẩm định. '
    + 'Điều 18: nghiệm thu PCCC — cơ quan nào thẩm định thì kiểm tra nghiệm thu.',
  trongTam: true,
}
const ND_105_2025: VanBan = {
  loai: 'Nghị định', soHieu: '105/2025/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',
  hieuLuc: 'Ban hành 15/5/2025 · hiệu lực 01/7/2025',
  ghiChu: 'Thay NĐ 136/2020, NĐ 83/2017, NĐ 50/2024 về PCCC. '
    + 'Phụ lục III: danh mục công trình do cơ quan chuyên môn XD thẩm định PCCC '
    + '(nhà chung cư ≥ 7 tầng/3.000 m²; bệnh viện ≥ 5 tầng/2.000 m²; '
    + 'trường học ≥ 5 tầng/3.000 m²; TTTM ≥ 2.000 m²; khách sạn/VP ≥ 7 tầng/3.000 m²; '
    + 'nhà xưởng hạng A–E; kho ≥ 15.000 m³; hầm ≥ 1.000 m...). '
    + 'Phụ lục IV: danh mục công trình do cơ quan Công an thẩm định. '
    + 'Thời hạn thẩm định: dự án nhóm A, công trình quan trọng ≤ 10 ngày; còn lại ≤ 6 ngày làm việc. '
    + 'Báo cáo PCCC định kỳ 2 lần/năm (trước 15/6 và 15/12).',
  trongTam: true,
}
const QCVN_06: VanBan = {
  loai: 'QCVN', soHieu: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)', ten: 'An toàn cháy cho nhà và công trình',
  ghiChu: 'Ban hành kèm TT 06/2022/TT-BXD; Sửa đổi 1:2023 kèm TT 09/2023/TT-BXD. '
    + 'Quy định bậc chịu lửa, khoảng cách PCCC, lối thoát nạn, ngăn cháy — '
    + 'dùng khi thẩm định nội dung điểm a–d khoản 1 Điều 16 Luật 55/2024. '
    + 'Theo dõi phiên bản cập nhật QCVN 06:2025 theo Luật PCCC&CNCH 2024.',
  trongTam: true,
}
const QCVN_10_BCA: VanBan = {
  loai: 'QCVN', soHieu: 'QCVN 10:2025/BCA', ten: 'Trang bị, bố trí phương tiện phòng cháy, chữa cháy, cứu nạn, cứu hộ cho nhà và công trình',
  hieuLuc: 'Ban hành kèm TT 103/2025/TT-BCA · hiệu lực 30/12/2025',
  ghiChu: 'Liên quan nội dung điểm g khoản 1 Điều 16 Luật 55/2024 (phương tiện PCCC) — '
    + 'do cơ quan Công an thẩm định; cơ quan XD cần nắm để phối hợp khi thẩm định đồng thời.',
}

// Đấu thầu / Đầu tư công (dùng cho thẩm định dự án, kế hoạch vốn)
const LUAT_DAU_THAU: VanBan = {
  loai: 'Luật', soHieu: '22/2023/QH15 (sửa đổi 57/2024, 90/2025)', ten: 'Luật Đấu thầu',
  hieuLuc: 'Hiệu lực 01/01/2024; sửa đổi bởi Luật 57/2024/QH15 và Luật 90/2025/QH15 (hiệu lực 01/7/2025)',
  ghiChu: 'Lựa chọn nhà thầu, nhà đầu tư. Luật 90/2025 bỏ vai trò bên mời thầu, mở rộng chỉ định thầu, phân cấp mạnh.',
  trongTam: true,
}
const ND_214_2025: VanBan = {
  loai: 'Nghị định', soHieu: '214/2025/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu',
  hieuLuc: 'Ban hành 04/8/2025 · hiệu lực 01/7/2025 (theo Luật 90/2025)',
  ghiChu: 'Thay Nghị định 24/2024/NĐ-CP.',
}
const LUAT_DTC: VanBan = {
  loai: 'Luật', soHieu: '58/2024/QH15 (sửa đổi 90/2025)', ten: 'Luật Đầu tư công',
  hieuLuc: 'Hiệu lực 01/01/2025 (một số điều 01/7/2024); sửa đổi bởi Luật 90/2025/QH15',
  ghiChu: 'Thay Luật Đầu tư công 39/2019. Phân cấp quyết định chủ trương đầu tư, kế hoạch vốn trung hạn.',
  trongTam: true,
}

// Văn thư – thể thức (dùng chung mọi phòng khi soạn văn bản)
const ND_30_2020: VanBan = {
  loai: 'Nghị định', soHieu: '30/2020/NĐ-CP', ten: 'Công tác văn thư',
  ghiChu: 'Thể thức và kỹ thuật trình bày văn bản hành chính — áp dụng cho tờ trình, công văn, quyết định, giấy mời, báo cáo.',
}

// Quy hoạch nền
const LUAT_QHDT_NT: VanBan = {
  loai: 'Luật', soHieu: '47/2024/QH15 (sửa đổi 144/2025)', ten: 'Luật Quy hoạch đô thị và nông thôn',
  hieuLuc: 'Hiệu lực 01/7/2025; sửa đổi bởi Luật 144/2025/QH15',
  ghiChu: 'QH thông qua 26/11/2024. Thay Luật Quy hoạch đô thị 2009 và chương quy hoạch xây dựng của Luật Xây dựng. Hệ thống quy hoạch đô thị – nông thôn thống nhất.',
  trongTam: true,
}
const ND_178_2025: VanBan = {
  loai: 'Nghị định', soHieu: '178/2025/NĐ-CP', ten: 'Quy định chi tiết một số điều của Luật Quy hoạch đô thị và nông thôn',
  hieuLuc: 'Ban hành 01/7/2025 · hiệu lực 01/7/2025',
}
const QCVN_01_2021: VanBan = {
  loai: 'QCVN', soHieu: 'QCVN 01:2021/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia về Quy hoạch xây dựng',
  trongTam: true,
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY 10 PHÒNG (trừ Phòng HTKT đã có riêng)
// ─────────────────────────────────────────────────────────────────────────────

export const PHAP_LY_PHONG: Record<string, PhapLyPhong> = {
  // 1. VĂN PHÒNG SỞ ───────────────────────────────────────────────────────────
  'van-phong-so': {
    ma: 'VAN_PHONG_SO', ten: 'Văn phòng Sở', baseHref: '/dashboard/van-phong-so', color: 'indigo',
    moTaPhong: 'Hành chính – quản trị; pháp chế; ISO–CCHC; chuyển đổi số & Đề án 06; văn thư – lưu trữ; tài sản công. (Cơ sở pháp lý nhân sự có ở mục riêng.)',
    chung: [ND_30_2020],
    linhVuc: [
      { key: 'phap-che', ten: 'Pháp chế & theo dõi thi hành pháp luật', vanBan: [
        { loai: 'Nghị định', soHieu: '55/2011/NĐ-CP (sửa đổi 56/2024/NĐ-CP)', ten: 'Chức năng, nhiệm vụ, quyền hạn và tổ chức bộ máy pháp chế', hieuLuc: 'NĐ 56/2024 hiệu lực 02/6/2024', trongTam: true },
        { loai: 'Luật', soHieu: '64/2025/QH15 (sửa đổi 87/2025)', ten: 'Luật Ban hành văn bản quy phạm pháp luật', hieuLuc: 'Hiệu lực 01/4/2025', ghiChu: 'Thay Luật 80/2015 và Luật sửa đổi 63/2020. Quy trình xây dựng, thẩm định, kiểm tra, rà soát văn bản QPPL; sửa đổi 87/2025/QH15 cập nhật theo mô hình chính quyền 2 cấp.' },
      ]},
      { key: 'van-thu-luu-tru', ten: 'Văn thư – Lưu trữ', vanBan: [
        { loai: 'Luật', soHieu: '33/2024/QH15', ten: 'Luật Lưu trữ', hieuLuc: 'Hiệu lực 01/7/2025', ghiChu: 'Thay Luật Lưu trữ 2011; lưu trữ điện tử, tài liệu lưu trữ số.', trongTam: true },
        ND_30_2020,
      ]},
      { key: 'iso-cchc', ten: 'ISO & Cải cách hành chính', vanBan: [
        { loai: 'Quyết định', soHieu: '19/2014/QĐ-TTg', ten: 'Áp dụng Hệ thống quản lý chất lượng theo TCVN ISO 9001 vào hoạt động của cơ quan hành chính nhà nước', trongTam: true },
        { loai: 'QCVN', soHieu: 'TCVN ISO 9001:2015', ten: 'Hệ thống quản lý chất lượng — Các yêu cầu' },
        { loai: 'Quyết định', soHieu: 'Nghị quyết 76/NQ-CP', ten: 'Chương trình tổng thể cải cách hành chính nhà nước giai đoạn 2021–2030' },
      ]},
      { key: 'chuyen-doi-so', ten: 'Chuyển đổi số & Đề án 06', vanBan: [
        { loai: 'Luật', soHieu: '20/2023/QH15', ten: 'Luật Giao dịch điện tử', hieuLuc: 'Hiệu lực 01/7/2024', trongTam: true },
        { loai: 'Luật', soHieu: '60/2024/QH15', ten: 'Luật Dữ liệu', hieuLuc: 'Hiệu lực 01/7/2025' },
        { loai: 'Quyết định', soHieu: '06/QĐ-TTg', ten: 'Đề án phát triển ứng dụng dữ liệu dân cư, định danh và xác thực điện tử (Đề án 06)' },
      ]},
      { key: 'hanh-chinh-quan-tri', ten: 'Hành chính – Quản trị, tài sản công', vanBan: [
        { loai: 'Luật', soHieu: '15/2017/QH14', ten: 'Luật Quản lý, sử dụng tài sản công', trongTam: true },
        { loai: 'Nghị định', soHieu: '151/2017/NĐ-CP (sửa đổi 114/2024/NĐ-CP)', ten: 'Quy định chi tiết Luật Quản lý, sử dụng tài sản công' },
      ]},
    ],
  },

  // 2. PHÒNG KẾ HOẠCH – TÀI CHÍNH ──────────────────────────────────────────────
  'phong-kh-tc': {
    ma: 'PHONG_KH_TC', ten: 'Phòng Kế hoạch - Tài chính', baseHref: '/dashboard/phong-kh-tc', color: 'emerald',
    moTaPhong: 'Kế hoạch phát triển ngành; đấu thầu; kế hoạch vốn; tài chính – kế toán; quản lý tài sản; thống kê ngành.',
    chung: [LUAT_DTC, LUAT_DAU_THAU, ND_206_2026, ND_30_2020],
    linhVuc: [
      { key: 'ke-hoach-phat-trien', ten: 'Kế hoạch phát triển ngành', vanBan: [
        { loai: 'Luật', soHieu: '112/2025/QH15', ten: 'Luật Quy hoạch',
          hieuLuc: 'QH thông qua 10/12/2025 · hiệu lực 01/3/2026',
          ghiChu: 'THAY Luật Quy hoạch 21/2017. Hệ thống quy hoạch quốc gia/vùng/tỉnh; '
            + 'tích hợp quy hoạch ngành vào quy hoạch tỉnh; đơn giản hoá trình tự lập, thẩm định, '
            + 'phê duyệt; tăng phân cấp cho địa phương.', trongTam: true },
        { loai: 'Nghị định', soHieu: '70/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều của Luật Quy hoạch',
          hieuLuc: 'Ban hành 09/3/2026 · hiệu lực ngay',
          ghiChu: '6 chương, 63 điều. Thời hạn lập quy hoạch: cấp quốc gia ≤ 24 tháng, ngành/vùng ≤ 18 tháng; '
            + 'đơn giản thủ tục lập, thẩm định, phê duyệt quy hoạch tỉnh.' },
        { loai: 'Luật', soHieu: '58/2024/QH15 (sửa đổi 90/2025)', ten: 'Luật Đầu tư công',
          ghiChu: 'Điều 7: phân loại dự án (nhóm A/B/C theo tổng mức ĐT); '
            + 'Điều 17–18: thẩm quyền quyết định chủ trương ĐT (HĐND/UBND tỉnh); '
            + 'Điều 43–47: kế hoạch ĐT công trung hạn; Điều 52–56: kế hoạch ĐT công hằng năm.', trongTam: true },
      ]},
      { key: 'dau-thau', ten: 'Đấu thầu', vanBan: [
        { loai: 'Luật', soHieu: '22/2023/QH15 (sửa đổi 57/2024, 90/2025)', ten: 'Luật Đấu thầu',
          ghiChu: 'Điều 20–23: hình thức lựa chọn nhà thầu (đấu thầu rộng rãi, hạn chế, chỉ định thầu...); '
            + 'Điều 24: chỉ định thầu (mở rộng theo Luật 90/2025); '
            + 'Điều 39: phê duyệt kế hoạch lựa chọn nhà thầu; '
            + 'Luật 90/2025/QH15: bỏ vai trò bên mời thầu, phân cấp mạnh.', trongTam: true },
        { loai: 'Nghị định', soHieu: '214/2025/NĐ-CP', ten: 'Chi tiết Luật Đấu thầu — lựa chọn nhà thầu',
          ghiChu: 'Thay NĐ 24/2024/NĐ-CP. Trình tự đấu thầu qua mạng, hồ sơ mời thầu, '
            + 'đánh giá HSDT, thương thảo hợp đồng, ưu đãi nhà thầu.', trongTam: true },
        { loai: 'Nghị định', soHieu: '23/2024/NĐ-CP', ten: 'Lựa chọn nhà đầu tư thực hiện dự án có sử dụng đất',
          ghiChu: 'Áp dụng cho dự án khu ĐT, nhà ở, hạ tầng, thương mại dịch vụ.' },
      ]},
      { key: 'ke-hoach-von', ten: 'Kế hoạch vốn & dự toán', vanBan: [
        { loai: 'Luật', soHieu: '58/2024/QH15', ten: 'Luật Đầu tư công — kế hoạch vốn',
          ghiChu: 'Chương IV: kế hoạch ĐT công trung hạn (5 năm); '
            + 'Chương V: kế hoạch ĐT công hằng năm. '
            + 'Điều 56: điều chỉnh kế hoạch vốn; Điều 68: giải ngân vốn ĐT công.', trongTam: true },
        { loai: 'Luật', soHieu: '89/2025/QH15', ten: 'Luật Ngân sách nhà nước',
          ghiChu: 'THAY Luật NSNN 83/2015, áp dụng từ năm ngân sách 2026. '
            + 'Phân cấp nguồn thu – nhiệm vụ chi theo mô hình chính quyền 2 cấp; '
            + 'lập, phân bổ dự toán; tăng thẩm quyền HĐND/UBND tỉnh.', trongTam: true },
        { loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quản lý chi phí ĐTXD — TMĐT, dự toán XD',
          ghiChu: 'Sơ bộ TMĐT, TMĐT, dự toán XD, giá gói thầu XD — cơ sở bố trí vốn; '
            + 'phân cấp CĐT điều chỉnh cơ cấu chi phí không vượt TMĐT đã duyệt.' },
      ]},
      { key: 'tai-chinh-ke-toan', ten: 'Tài chính – Kế toán', vanBan: [
        { loai: 'Luật', soHieu: '88/2015/QH13 (sửa đổi 56/2024/QH15)', ten: 'Luật Kế toán',
          ghiChu: 'Điều 9: chế độ kế toán; Điều 15: chứng từ kế toán; '
            + 'Điều 29: báo cáo tài chính; sửa đổi 2024 cập nhật kế toán điện tử.', trongTam: true },
        { loai: 'Nghị định', soHieu: '174/2016/NĐ-CP', ten: 'Chi tiết một số điều của Luật Kế toán',
          ghiChu: 'Quy định kế toán đơn vị hành chính sự nghiệp, chế độ chứng từ, sổ sách, báo cáo.' },
        { loai: 'Nghị định', soHieu: '210/2026/NĐ-CP', ten: 'Hợp đồng XD — tạm ứng, thanh toán, quyết toán',
          ghiChu: 'Tạm ứng ≤ 30% giá trị HĐ; > 1 tỷ phải bảo lãnh tạm ứng. '
            + 'Nhà thầu được tạm ngừng nếu chậm thanh toán > 28 ngày. '
            + 'Liên quan trực tiếp nghiệp vụ kế toán thanh toán, quyết toán hợp đồng XD.' },
        { loai: 'Nghị định', soHieu: '193/2026/NĐ-CP', ten: 'Quy định về quyết toán vốn đầu tư dự án',
          hieuLuc: 'Ban hành 01/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Lập, thẩm tra, phê duyệt quyết toán vốn đầu tư dự án hoàn thành (gồm dự án thành phần, '
            + 'tiểu dự án). Đối chiếu NĐ 254/2025 về quản lý, thanh toán vốn đầu tư công.', trongTam: true },
        ND_206_2026,
      ]},
      { key: 'thong-ke', ten: 'Thống kê ngành', vanBan: [
        { loai: 'Luật', soHieu: '89/2015/QH13 (sửa đổi 01/2021/QH15)', ten: 'Luật Thống kê',
          ghiChu: 'Điều 17: hệ thống chỉ tiêu thống kê; Điều 26: chế độ báo cáo thống kê; '
            + 'sửa đổi 2021 bổ sung chỉ tiêu phát triển bền vững.', trongTam: true },
      ]},
    ],
  },

  // 3. PHÒNG QL CHẤT LƯỢNG CÔNG TRÌNH GIAO THÔNG ───────────────────────────────
  'phong-clct': {
    ma: 'PHONG_CLCT', ten: 'Phòng Quản lý chất lượng công trình giao thông', baseHref: '/dashboard/phong-clct', color: 'indigo',
    moTaPhong: 'Thẩm định BCNCKT/thiết kế; kiểm tra công tác nghiệm thu; chất lượng, an toàn thi công; bảo trì; giám định tư pháp xây dựng giao thông.',
    chung: [LUAT_XD_2025, ND_217_2026, ND_207_2026, ND_206_2026, ND_30_2020],
    linhVuc: [
      { key: 'tham-dinh-thiet-ke', ten: 'Thẩm định BCNCKT, thiết kế công trình giao thông', vanBan: [
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật Xây dựng — Điều 35: thẩm quyền thẩm định dự án, thiết kế XD (phân cấp cho Sở XD)',
          ghiChu: 'Sở XD thẩm định dự án/thiết kế công trình giao thông thuộc thẩm quyền theo phân cấp.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Quản lý HĐXD — Chương IV: thẩm định dự án, thiết kế',
          ghiChu: 'Trình tự thẩm định BCNCKT, BCKTKT, thiết kế triển khai sau TKCS; thời hạn theo nhóm dự án (A: 40 ngày, B: 30 ngày, C: 20 ngày).', trongTam: true },
        { loai: 'Luật', soHieu: '35/2024/QH15', ten: 'Luật Đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
          ghiChu: 'Điều 11–15: yêu cầu kỹ thuật kết cấu hạ tầng đường bộ; Điều 16: phân loại đường; Điều 18: quản lý chất lượng công trình đường bộ.', trongTam: true },
        // ── PCCC khi thẩm định thiết kế công trình giao thông ──
        // Công trình GT thuộc Phụ lục III NĐ 105/2025 (ga đường sắt ≥ 3.000 m², hầm ≥ 1.000 m,
        // cầu cạn, bến xe...) → Sở XD thẩm định nội dung PCCC điểm a–đ khoản 1 Điều 16 Luật 55/2024
        // (khoảng cách PCCC, lối thoát nạn, bậc chịu lửa, ngăn cháy, chống khói).
        // Cơ quan Công an thẩm định riêng nội dung điểm e, g (hệ thống điện PCCC, phương tiện PCCC).
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC&CNCH — Điều 16, 17: yêu cầu & thẩm định PCCC khi thiết kế công trình',
          ghiChu: 'Khoản 1 Điều 16: 7 yêu cầu PCCC (a–g). Điều 17 khoản 1: cơ quan XD thẩm định điểm a–đ '
            + '(khoảng cách, đường chữa cháy, thoát nạn, bậc chịu lửa, giải pháp PCCC riêng); '
            + 'khoản 2: Công an thẩm định điểm e, g (điện PCCC, phương tiện PCCC). '
            + 'Công trình GT thuộc diện: ga ≥ 3.000 m², hầm ≥ 1.000 m, nhà điều hành ≥ 7 tầng.', trongTam: true },
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP', ten: 'Chi tiết Luật PCCC — Phụ lục III: danh mục công trình cơ quan XD thẩm định PCCC',
          ghiChu: 'Thời hạn thẩm định PCCC: dự án nhóm A ≤ 10 ngày, còn lại ≤ 6 ngày làm việc. '
            + 'Hồ sơ PCCC nộp đồng thời với hồ sơ thẩm định thiết kế XD.' },
        QCVN_06,
      ]},
      { key: 'kiem-tra-nghiem-thu', ten: 'Kiểm tra công tác nghiệm thu', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Quản lý chất lượng — Chương III–IV: nghiệm thu & kiểm tra nghiệm thu',
          ghiChu: 'CĐT tổ chức nghiệm thu từng phần, giai đoạn, hạng mục; bộ phận bị che khuất phải nghiệm thu '
            + 'trước khi tiếp tục thi công. Cơ quan chuyên môn XD kiểm tra nghiệm thu theo phân cấp.', trongTam: true },
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 82–84: nghiệm thu, kiểm tra nghiệm thu, đưa công trình vào sử dụng',
          ghiChu: 'Công trình chỉ được đưa vào sử dụng khi đã nghiệm thu đạt yêu cầu.' },
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC — Điều 18: nghiệm thu PCCC tích hợp',
          ghiChu: 'Cơ quan nào thẩm định thiết kế PCCC thì kiểm tra nghiệm thu PCCC. '
            + 'Từ 01/7/2026 (NQ 66/2025): bỏ nghiệm thu PCCC riêng, tích hợp vào kiểm tra nghiệm thu chung.' },
        { loai: 'Thông tư', soHieu: '32/2026/TT-BXD', ten: 'Quy định chi tiết một số điều của Nghị định 207/2026/NĐ-CP',
          hieuLuc: 'Ban hành 22/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn hồ sơ, trình tự kiểm tra công tác nghiệm thu; biểu mẫu biên bản nghiệm thu; '
            + 'phân định trách nhiệm quản lý chất lượng.' },
        { loai: 'Thông tư', soHieu: '33/2026/TT-BXD', ten: 'Đánh giá an toàn công trình trong quá trình khai thác, sử dụng',
          hieuLuc: 'Ban hành 25/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Đánh giá an toàn LẦN ĐẦU trong ≤ 10 năm kể từ khi nghiệm thu; định kỳ sau đó ≤ 5 năm/lần — '
            + 'áp dụng cho công trình thuộc quản lý của Bộ XD (gồm cầu, hầm, công trình giao thông).' },
      ]},
      { key: 'chat-luong-an-toan', ten: 'Chất lượng & an toàn thi công', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Chương II & VII: quản lý chất lượng thi công & an toàn',
          ghiChu: 'Nhà thầu chịu trách nhiệm trực tiếp, toàn diện về chất lượng, an toàn thi công. '
            + 'Phải xác định chủng loại, nguồn gốc, thông số kỹ thuật VL trước khi đưa vào thi công.', trongTam: true },
        { loai: 'QCVN', soHieu: 'QCVN 18:2021/BXD', ten: 'An toàn trong thi công xây dựng', trongTam: true },
        { loai: 'Thông tư', soHieu: '42/2026/TT-BXD', ten: 'Sửa đổi quy trình kiểm định kỹ thuật an toàn máy, thiết bị, vật tư trong thi công xây dựng',
          hieuLuc: 'Ban hành 29/6/2026',
          ghiChu: 'Máy, thiết bị có yêu cầu nghiêm ngặt về an toàn lao động (cần trục, vận thăng, giàn giáo...) '
            + 'thuộc phạm vi quản lý của Bộ XD.' },
        { loai: 'Nghị định', soHieu: '220/2026/NĐ-CP', ten: 'Sửa đổi quy định về bảo hiểm bắt buộc trong hoạt động đầu tư xây dựng',
          hieuLuc: 'Ban hành 22/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Bảo hiểm công trình trong thời gian XD, bảo hiểm trách nhiệm nghề nghiệp tư vấn, '
            + 'bảo hiểm cho người lao động thi công — cập nhật theo Luật XD 2025.' },
        QCVN_10_BCA,
      ]},
      { key: 'bao-tri-cong-trinh', ten: 'Bảo trì công trình giao thông', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Chương V: bảo trì công trình XD',
          ghiChu: 'Chủ sở hữu phải xây dựng kế hoạch bảo trì, bảo đảm nguồn kinh phí. '
            + 'Quy trình bảo trì do nhà thầu thiết kế lập, CĐT phê duyệt.' },
        { loai: 'Nghị định', soHieu: '165/2024/NĐ-CP', ten: 'Kết cấu hạ tầng đường bộ — bảo trì, vận hành khai thác',
          ghiChu: 'Điều 36–48: bảo trì kết cấu hạ tầng đường bộ; phân cấp quản lý bảo trì quốc lộ/tỉnh lộ/đường đô thị.', trongTam: true },
        { loai: 'Thông tư', soHieu: '40/2026/TT-BXD', ten: 'Hướng dẫn xác định chi phí bảo trì công trình xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 14/2021/TT-BXD. Phương pháp lập dự toán chi phí bảo trì; định mức chi phí '
            + 'bảo trì theo NĐ 207/2026.' },
      ]},
      { key: 'giam-dinh-dinh-muc', ten: 'Giám định tư pháp & định mức KT-KT', vanBan: [
        { loai: 'Luật', soHieu: '13/2012/QH13 (sửa đổi 56/2020/QH14)', ten: 'Luật Giám định tư pháp',
          ghiChu: 'Điều 2: khái niệm; Điều 3: lĩnh vực giám định (XD là lĩnh vực bổ trợ); Điều 7: quyền, nghĩa vụ giám định viên.', trongTam: true },
        { loai: 'Nghị định', soHieu: '157/2020/NĐ-CP', ten: 'Sửa đổi NĐ 62/2016 về giám định tư pháp trong lĩnh vực XD',
          ghiChu: 'Trình tự, hồ sơ giám định chất lượng công trình; phí giám định.' },
        { loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quản lý chi phí ĐTXD — định mức, đơn giá, chỉ số giá',
          ghiChu: 'Hệ thống định mức XD, giá XD, chỉ số giá XD phục vụ lập/thẩm tra dự toán công trình GT.', trongTam: true },
        { loai: 'Thông tư', soHieu: '38/2026/TT-BXD', ten: 'Ban hành định mức xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 12/2021/TT-BXD. 8 phụ lục: khảo sát, xây dựng, lắp đặt HTKT, thiết bị, '
            + 'thí nghiệm, sửa chữa bảo dưỡng, sử dụng vật liệu, chi phí QLDA – tư vấn.' },
      ]},
    ],
  },

  // 4. PHÒNG QL KẾT CẤU HẠ TẦNG GIAO THÔNG ─────────────────────────────────────
  'phong-qlkcht': {
    ma: 'PHONG_QLKCHT', ten: 'Phòng Quản lý kết cấu hạ tầng giao thông', baseHref: '/dashboard/phong-qlkcht', color: 'emerald',
    moTaPhong: 'Đầu tư – bảo trì – vận hành kết cấu hạ tầng giao thông; an toàn giao thông; cấp phép thi công trên đường bộ; bến xe – cảng bến; nông thôn mới.',
    chung: [
      { loai: 'Luật', soHieu: '35/2024/QH15', ten: 'Luật Đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
        ghiChu: 'Thay phần kết cấu hạ tầng của Luật GTĐB 2008. '
          + 'Chương II (Điều 11–26): kết cấu hạ tầng đường bộ — phân loại đường, yêu cầu kỹ thuật. '
          + 'Chương III (Điều 27–35): đầu tư, xây dựng, quản lý, bảo trì. '
          + 'Chương IV (Điều 36–42): phạm vi bảo vệ kết cấu HT, cấp phép thi công.', trongTam: true },
      { loai: 'Luật', soHieu: '36/2024/QH15', ten: 'Luật Trật tự, an toàn giao thông đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
        ghiChu: 'Tách ra từ Luật GTĐB 2008. Điều 33–38: an toàn GT đường bộ; Điều 55: Thường trực Ban ATGT.' },
      { loai: 'Nghị định', soHieu: '165/2024/NĐ-CP', ten: 'Chi tiết, hướng dẫn Luật Đường bộ về kết cấu hạ tầng đường bộ',
        ghiChu: 'Điều 3–15: phân loại, đầu tư, xây dựng kết cấu HT đường bộ. '
          + 'Điều 16–25: phạm vi bảo vệ, cấp phép thi công/đấu nối trên đường bộ. '
          + 'Điều 36–48: bảo trì, vận hành khai thác kết cấu HT đường bộ (phân cấp quốc lộ/tỉnh lộ/đường ĐT).', trongTam: true },
    ],
    linhVuc: [
      { key: 'ket-cau-ha-tang', ten: 'Kết cấu hạ tầng giao thông', vanBan: [
        { loai: 'Nghị định', soHieu: '165/2024/NĐ-CP', ten: 'KCHT đường bộ — đầu tư, vận hành, khai thác, bảo trì',
          ghiChu: 'Điều 3–15: phân loại đường, tiêu chuẩn kỹ thuật, quy trình đầu tư. '
            + 'Điều 36–48: bảo trì — phân cấp quản lý bảo trì quốc lộ, tỉnh lộ, đường đô thị, đường xã.', trongTam: true },
        { loai: 'Luật', soHieu: '95/2025/QH15', ten: 'Luật Đường sắt', hieuLuc: 'Hiệu lực 01/01/2026',
          ghiChu: 'QH thông qua 27/6/2025; thay Luật Đường sắt 2017. '
            + 'Kết cấu hạ tầng đường sắt, ga đường sắt, đầu tư bảo trì đường sắt.' },
        { loai: 'Luật', soHieu: '08/2017/QH14', ten: 'Luật Giao thông đường thủy nội địa (hợp nhất)',
          ghiChu: 'Kết cấu hạ tầng đường thủy nội địa: luồng, tuyến, cảng bến, phao tiêu.' },
        { loai: 'Thông tư', soHieu: '21/2026/TT-BXD', ten: 'Quản lý kết cấu hạ tầng đường thủy nội địa',
          hieuLuc: 'Ban hành 15/5/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Quản lý, bảo trì, khai thác kết cấu hạ tầng đường thủy nội địa — phân cấp cho địa phương.' },
      ]},
      { key: 'an-toan-giao-thong', ten: 'An toàn giao thông (Thường trực Ban ATGT)', vanBan: [
        { loai: 'Luật', soHieu: '36/2024/QH15', ten: 'Luật TTATGT đường bộ — ATGT',
          ghiChu: 'Điều 33–38: bảo đảm ATGT (biển báo, rào chắn, chiếu sáng, tầm nhìn). '
            + 'Điều 55: Ban ATGT — Phòng QLKCHT là Thường trực Ban ATGT tỉnh (phía Sở GTVT/XD). '
            + 'Điều 7: trách nhiệm cơ quan QLNN cấp tỉnh về TTATGT đường bộ.', trongTam: true },
        { loai: 'Nghị định', soHieu: '168/2024/NĐ-CP (sửa đổi 238/2026)', ten: 'Xử phạt vi phạm hành chính về TTATGT đường bộ',
          hieuLuc: 'Hiệu lực 01/01/2025 · NĐ 238/2026 sửa đổi từ 15/8/2026',
          ghiChu: 'Thay NĐ 100/2019. Mức phạt vi phạm ATGT đường bộ. '
            + 'NĐ 238/2026/NĐ-CP: siết quản lý xe hợp đồng, cập nhật phương tiện vi phạm lên hệ thống đăng kiểm.' },
      ]},
      { key: 'cap-phep-thi-cong', ten: 'Cấp phép thi công trên đường bộ', vanBan: [
        { loai: 'Nghị định', soHieu: '165/2024/NĐ-CP', ten: 'Cấp phép thi công, đấu nối, sử dụng phạm vi bảo vệ KCHT đường bộ',
          ghiChu: 'Điều 16–25: trình tự cấp phép thi công trên đường bộ đang khai thác; '
            + 'đấu nối đường nhánh vào quốc lộ/tỉnh lộ; sử dụng tạm hành lang ATGT; '
            + 'trách nhiệm khôi phục mặt đường sau thi công.', trongTam: true },
      ]},
      { key: 'ben-xe-cang-ben', ten: 'Bến xe – bãi đỗ – cảng, bến', vanBan: [
        { loai: 'Nghị định', soHieu: '158/2024/NĐ-CP (sửa đổi 218/2026)', ten: 'Hoạt động vận tải đường bộ',
          hieuLuc: 'Hiệu lực 01/01/2025 · NĐ 218/2026 sửa đổi từ 10/8/2026',
          ghiChu: 'Thay NĐ 10/2020. Điều 25–31: bến xe khách, bãi đỗ xe, trạm dừng nghỉ '
            + '— điều kiện hoạt động, phân loại, quy mô.', trongTam: true },
        { loai: 'Luật', soHieu: '08/2017/QH14', ten: 'Luật GTĐTNĐ — quản lý cảng, bến thủy nội địa',
          ghiChu: 'Chương IV: cảng, bến thủy nội địa — phân loại, công bố hoạt động, an toàn.' },
      ]},
      { key: 'pha-do-nong-thon-moi', ten: 'Phá dỡ tàu biển & nông thôn mới', vanBan: [
        { loai: 'Nghị định', soHieu: '82/2019/NĐ-CP', ten: 'Nhập khẩu, phá dỡ tàu biển đã qua sử dụng',
          ghiChu: 'Điều kiện cơ sở phá dỡ tàu biển, trình tự cấp phép nhập khẩu tàu biển phá dỡ.' },
        { loai: 'Quyết định', soHieu: 'QĐ 318/QĐ-TTg + bộ tiêu chí NTM', ten: 'Tiêu chí giao thông trong xây dựng nông thôn mới',
          ghiChu: 'Tiêu chí đường giao thông xã, thôn: tỷ lệ cứng hoá, bảo trì, an toàn; '
            + 'phối hợp đánh giá đạt tiêu chí NTM/NTM nâng cao.' },
      ]},
    ],
  },

  // 5. PHÒNG QL HOẠT ĐỘNG XÂY DỰNG ─────────────────────────────────────────────
  'phong-qlhd-xd': {
    ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng', baseHref: '/dashboard/phong-qlhd-xd', color: 'indigo',
    moTaPhong: 'Cấp phép xây dựng; quản lý trật tự xây dựng; thẩm định dự án dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở; chứng chỉ hành nghề; thí nghiệm chuyên ngành.',
    chung: [LUAT_XD_2025, ND_217_2026, ND_207_2026, ND_212_2026, ND_30_2020],
    linhVuc: [
      { key: 'cap-phep-xay-dung', ten: 'Cấp phép xây dựng', vanBan: [
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 43–50: giấy phép xây dựng',
          ghiChu: 'Điều 43: đối tượng phải có GPXD; Điều 44 khoản 1: điều kiện cấp GPXD '
            + '(phù hợp mục đích sử dụng đất, thiết kế đã thẩm định phê duyệt); '
            + 'Điều 45: thẩm quyền (Sở XD: cấp II trở lên; UBND cấp xã: cấp III, IV, nhà ở riêng lẻ); '
            + 'Điều 50: thu hồi GPXD.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Chương V: cấp giấy phép xây dựng',
          ghiChu: 'Điều 66: công khai GPXD trên cổng điện tử ≥ 12 tháng. '
            + 'Điều 67 khoản 7: UBND cấp xã cấp GPXD cho nhà ở riêng lẻ ≤ 7 tầng, công trình cấp III–IV. '
            + 'Quy định mới về nhà ở riêng lẻ từ 01/7/2026: phân cấp mạnh cho xã/phường.', trongTam: true },
        // ── PCCC khi cấp phép: công trình thuộc Phụ lục III/IV NĐ 105/2025 phải có
        // văn bản thẩm định PCCC trước khi cấp GPXD (Điều 17 khoản 3 Luật 55/2024) ──
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC — Điều 17 khoản 3: điều kiện thi công',
          ghiChu: 'CĐT chỉ được thi công khi có văn bản thẩm định thiết kế PCCC. '
            + 'Khi cấp GPXD cho công trình thuộc diện thẩm định PCCC (Phụ lục III/IV NĐ 105/2025): '
            + 'chung cư ≥ 7 tầng/3.000 m², bệnh viện ≥ 5 tầng/2.000 m², trường học ≥ 5 tầng/3.000 m², '
            + 'khách sạn/VP ≥ 7 tầng/3.000 m², TTTM ≥ 2.000 m², nhà xưởng hạng A–E, kho ≥ 15.000 m³ — '
            + 'phải kiểm tra có văn bản thẩm định PCCC trong hồ sơ.' },
      ]},
      { key: 'trat-tu-xay-dung', ten: 'Quản lý trật tự xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Chương VI: quản lý trật tự xây dựng',
          ghiChu: 'Kiểm tra điều kiện khởi công (Điều 67); xử lý vi phạm trật tự XD; đình chỉ, phá dỡ công trình vi phạm.', trongTam: true },
        { loai: 'Nghị định', soHieu: '16/2022/NĐ-CP', ten: 'Xử phạt vi phạm hành chính về xây dựng',
          ghiChu: 'Mức phạt XD không phép, sai phép, sai thiết kế; thẩm quyền xử phạt (Thanh tra XD, UBND).', trongTam: true },
      ]},
      { key: 'tham-dinh-du-an', ten: 'Thẩm định dự án, thiết kế', vanBan: [
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 35: thẩm quyền thẩm định dự án ĐTXD',
          ghiChu: 'Sở XD thẩm định dự án/thiết kế công trình dân dụng, công nghiệp nhẹ, khu ĐT, nhà ở '
            + 'theo phân cấp. Thời hạn: nhóm A 40 ngày, B 30 ngày, C 20 ngày.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Chương IV: thẩm định BCNCKT, BCKTKT, thiết kế triển khai sau TKCS',
          ghiChu: 'Trình tự tiếp nhận hồ sơ, lấy ý kiến phối hợp, thẩm định nội dung, phát hành kết quả. '
            + 'Điều 8: bắt buộc BIM công trình cấp II trở lên từ giai đoạn khả thi.', trongTam: true },
        { loai: 'Thông tư', soHieu: '34/2026/TT-BXD', ten: 'Quy định chi tiết về cấp công trình xây dựng phục vụ quản lý hoạt động xây dựng',
          hieuLuc: 'Ban hành 25/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 06/2021/TT-BXD. Phân cấp công trình (đặc biệt, I–IV) làm căn cứ xác định '
            + 'thẩm quyền thẩm định, cấp GPXD, kiểm tra nghiệm thu, yêu cầu BIM.', trongTam: true },
        ND_207_2026,
        // ── PCCC khi thẩm định dự án ĐTXD ──
        // Đây là mảng CẦN CHÚ Ý NHẤT: phòng QLHD-XD thẩm định dự án dân dụng, nhà ở, khu ĐT
        // → hầu hết thuộc Phụ lục III NĐ 105/2025 (chung cư ≥ 7 tầng, bệnh viện, trường, TTTM...).
        // Sở XD thẩm định đồng thời nội dung PCCC (điểm a–đ khoản 1 Điều 16 Luật 55/2024):
        //   a) Khoảng cách an toàn PCCC
        //   b) Đường bộ, bãi đỗ cho xe chữa cháy
        //   c) Giải pháp thoát nạn (lối thoát, cầu thang thoát hiểm, chiều rộng hành lang)
        //   d) Bậc chịu lửa, giải pháp ngăn cháy, chống cháy lan, chống khói
        //   đ) Giải pháp PCCC riêng theo đặc thù công trình
        // Cơ quan Công an đồng thời thẩm định điểm e (hệ thống điện PCCC) và g (phương tiện PCCC).
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC&CNCH — Điều 16, 17: PCCC trong thẩm định dự án ĐTXD',
          ghiChu: '⚠️ Phòng QLHD-XD thẩm định dự án dân dụng/nhà ở → phần lớn thuộc Phụ lục III NĐ 105/2025. '
            + 'Sở XD thẩm định nội dung PCCC điểm a–đ (khoảng cách, đường CC, thoát nạn, bậc chịu lửa, '
            + 'ngăn cháy/chống cháy lan/chống khói, giải pháp PCCC riêng). '
            + 'Hồ sơ PCCC nộp đồng thời hồ sơ thẩm định thiết kế — không yêu cầu CĐT cung cấp '
            + 'VB thẩm định PCCC riêng khi thuộc thẩm quyền cơ quan XD.', trongTam: true },
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP', ten: 'Chi tiết Luật PCCC — Phụ lục III & thời hạn thẩm định',
          ghiChu: 'Thời hạn: nhóm A ≤ 10 ngày, còn lại ≤ 6 ngày làm việc. '
            + 'Công trình dân dụng thường gặp thuộc diện: chung cư ≥ 7 tầng/3.000 m², '
            + 'trường học ≥ 5 tầng/3.000 m², nhà trẻ ≥ 150 trẻ/2.000 m², '
            + 'bệnh viện ≥ 5 tầng/2.000 m², khách sạn ≥ 7 tầng/3.000 m², '
            + 'karaoke/vũ trường ≥ 4 tầng/1.000 m², nhà xưởng hạng A–E.' },
        QCVN_06,
      ]},
      { key: 'chung-chi-nha-thau', ten: 'Chứng chỉ hành nghề & nhà thầu nước ngoài', vanBan: [
        { loai: 'Nghị định', soHieu: '212/2026/NĐ-CP', ten: 'Điều kiện năng lực HĐXD — chứng chỉ hành nghề, năng lực tổ chức',
          ghiChu: 'Trình tự sát hạch, cấp mới/cấp lại/gia hạn/thu hồi chứng chỉ hành nghề cá nhân '
            + '(khảo sát, thiết kế, giám sát, quản lý dự án). '
            + 'Chứng chỉ năng lực tổ chức: khảo sát, thiết kế, thi công, tư vấn giám sát, QLDA. '
            + 'Số hoá: đăng ký, tra cứu trên CSDL quốc gia về HĐXD.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Nhà thầu nước ngoài hoạt động xây dựng tại Việt Nam',
          ghiChu: 'Điều kiện, thẩm quyền, trình tự cấp/thu hồi giấy phép nhà thầu nước ngoài.' },
        { loai: 'Thông tư', soHieu: '39/2026/TT-BXD', ten: 'Hệ thống thông tin, cơ sở dữ liệu quốc gia về hoạt động xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn NĐ 212/2026: đăng tải, tra cứu chứng chỉ hành nghề/năng lực trên CSDL quốc gia; '
            + 'trách nhiệm cập nhật dữ liệu của Sở XD.' },
      ]},
      { key: 'thi-nghiem-chuyen-nganh', ten: 'Thí nghiệm chuyên ngành xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Chương II: quản lý chất lượng — yêu cầu thí nghiệm VL',
          ghiChu: 'Xác định chủng loại, nguồn gốc, thông số kỹ thuật vật liệu trước khi đưa vào thi công. '
            + 'Thí nghiệm đối chứng, kiểm định theo yêu cầu.' },
        { loai: 'QCVN', soHieu: 'QCVN 16:2023/BXD', ten: 'Sản phẩm, hàng hóa vật liệu xây dựng',
          ghiChu: 'Hợp quy, thí nghiệm chứng nhận chất lượng sản phẩm VLXD.', trongTam: true },
        { loai: 'Thông tư', soHieu: '41/2026/TT-BXD', ten: 'Quản lý chất lượng sản phẩm, hàng hóa vật liệu xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn NĐ 209/2026: hợp quy, thử nghiệm, chứng nhận chất lượng VLXD; '
            + 'quản lý phòng thí nghiệm chuyên ngành XD (LAS-XD).' },
        { loai: 'Thông tư', soHieu: '42/2026/TT-BXD', ten: 'Kiểm định kỹ thuật an toàn máy, thiết bị thi công (sửa đổi)',
          hieuLuc: 'Ban hành 29/6/2026',
          ghiChu: 'Quy trình kiểm định máy, thiết bị, vật tư có yêu cầu nghiêm ngặt về an toàn lao động trong thi công XD.' },
        ND_209_2026,
      ]},
    ],
  },

  // 6. PHÒNG KINH TẾ & VẬT LIỆU XÂY DỰNG ───────────────────────────────────────
  'phong-kt-vl': {
    ma: 'PHONG_KT_VL', ten: 'Phòng Kinh tế và Vật liệu xây dựng', baseHref: '/dashboard/phong-kt-vl', color: 'emerald',
    moTaPhong: 'Định mức – đơn giá – chỉ số giá xây dựng; công bố giá VLXD; thẩm định dự toán quy hoạch; quản lý VLXD và khoáng sản làm VLXD.',
    chung: [LUAT_XD_2025, ND_206_2026, ND_209_2026, ND_210_2026, ND_30_2020],
    linhVuc: [
      { key: 'dinh-muc-don-gia', ten: 'Định mức – đơn giá – chỉ số giá xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quản lý chi phí ĐTXD — hệ thống công cụ: định mức, giá, chỉ số giá',
          ghiChu: 'Hệ thống định mức XD: định mức dự toán (nhân công, vật liệu, máy thi công), '
            + 'định mức chi phí (QLDA, tư vấn, chi phí khác). '
            + 'Giá XD: đơn giá nhân công, giá ca máy, giá VLXD → tính đơn giá XD. '
            + 'Chỉ số giá XD: chỉ số giá theo công trình, loại công trình, khu vực. '
            + 'Cho phép tham khảo giá/định mức nước ngoài khi VN chưa có (công nghệ mới). '
            + 'Phân cấp: CĐT được điều chỉnh cơ cấu chi phí mà không phải điều chỉnh dự án.', trongTam: true },
        { loai: 'Thông tư', soHieu: '36/2026/TT-BXD', ten: 'Hướng dẫn xác định và quản lý chi phí đầu tư xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn NĐ 206/2026 — thay bộ TT 11–14/2021/TT-BXD. 8 phụ lục: sơ bộ TMĐT/TMĐT, '
            + 'dự toán XD, chi phí XD, dự toán công việc, đơn giá – giá ca máy, chỉ số giá, mẫu báo cáo.', trongTam: true },
        { loai: 'Thông tư', soHieu: '37/2026/TT-BXD', ten: 'Phương pháp xác định định mức dự toán và các chỉ tiêu kinh tế – kỹ thuật',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 13/2021/TT-BXD. Xác định định mức dự toán mới/điều chỉnh, chỉ tiêu KT-KT, '
            + 'đo bóc khối lượng.', trongTam: true },
        { loai: 'Thông tư', soHieu: '38/2026/TT-BXD', ten: 'Ban hành định mức xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 12/2021/TT-BXD. 8 phụ lục định mức: khảo sát, xây dựng, lắp đặt HTKT, '
            + 'lắp đặt thiết bị, thí nghiệm, sửa chữa – bảo dưỡng, sử dụng vật liệu, chi phí QLDA – tư vấn.', trongTam: true },
      ]},
      { key: 'cong-bo-gia-vlxd', ten: 'Công bố giá vật liệu xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quản lý chi phí — giá VLXD, công bố giá',
          ghiChu: 'Sở XD tham mưu UBND tỉnh công bố giá VLXD địa phương hằng tháng/quý. '
            + 'Giá VLXD là cơ sở lập dự toán, xác định giá gói thầu, điều chỉnh hợp đồng. '
            + 'Giải quyết vướng mắc biến động giá: cho phép cập nhật giá theo sát thị trường.', trongTam: true },
        { loai: 'Thông tư', soHieu: '36/2026/TT-BXD', ten: 'Phương pháp xác định giá VLXD, đơn giá nhân công, giá ca máy, chỉ số giá XD',
          hieuLuc: 'Hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 11/2021 và 13/2021/TT-BXD. Cơ sở để Sở XD khảo sát, công bố giá VLXD, '
            + 'đơn giá nhân công, giá ca máy và chỉ số giá XD địa phương.' },
      ]},
      { key: 'tham-dinh-du-toan-qh', ten: 'Thẩm định dự toán quy hoạch', vanBan: [
        { loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Chi phí ĐTXD — dự toán, tổng mức đầu tư',
          ghiChu: 'Thẩm định dự toán chi phí lập quy hoạch XD, quy hoạch ĐT-NT; '
            + 'sơ bộ TMĐT cho dự án lớn, kỹ thuật phức tạp.', trongTam: true },
        LUAT_QHDT_NT,
        { loai: 'Nghị định', soHieu: '210/2026/NĐ-CP', ten: 'Hợp đồng XD — điều chỉnh đơn giá, giá hợp đồng',
          ghiChu: 'Phương pháp điều chỉnh đơn giá, giá hợp đồng XD khi biến động giá VLXD/nhân công. '
            + 'Tạm ứng ≤ 30% giá trị HĐ; chậm thanh toán > 28 ngày: nhà thầu được tạm ngừng.' },
      ]},
      { key: 'quan-ly-vlxd-khoang-san', ten: 'Quản lý VLXD & khoáng sản làm VLXD', vanBan: [
        { loai: 'Nghị định', soHieu: '209/2026/NĐ-CP', ten: 'Quản lý VLXD — phát triển, sản xuất, sử dụng VLXD',
          ghiChu: 'Ưu tiên VLXD xanh, tái chế, thông minh, thân thiện MT trong thẩm định/phê duyệt dự án, '
            + 'thiết kế, đấu thầu. Cơ chế khuyến khích R&D vật liệu mới; chuyển đổi xanh, giảm phát thải. '
            + 'Chất lượng VLXD: tuân thủ PL về CLSP, TCVN, QCVN.', trongTam: true },
        { loai: 'Luật', soHieu: '54/2024/QH15', ten: 'Luật Địa chất và khoáng sản', hieuLuc: 'Hiệu lực 01/7/2025',
          ghiChu: 'Thay Luật Khoáng sản 2010. Điều 6: phân nhóm khoáng sản (nhóm IV: khoáng sản '
            + 'làm VLXD thông thường — cát, sỏi, đá XD). '
            + 'Điều 27: cấp phép khai thác; Điều 42: quản lý hoạt động khai thác khoáng sản.', trongTam: true },
        { loai: 'QCVN', soHieu: 'QCVN 16:2023/BXD', ten: 'Sản phẩm, hàng hóa vật liệu xây dựng',
          ghiChu: 'Hợp quy, chứng nhận chất lượng sản phẩm VLXD trước khi lưu thông, sử dụng.' },
      ]},
    ],
  },

  // 7. PHÒNG PHÁT TRIỂN ĐÔ THỊ ─────────────────────────────────────────────────
  'phong-ptdt': {
    ma: 'PHONG_PTDT', ten: 'Phòng Phát triển đô thị', baseHref: '/dashboard/phong-ptdt', color: 'indigo',
    moTaPhong: 'Chương trình phát triển đô thị; phân loại đô thị; đô thị thông minh & tăng trưởng xanh; thẩm định HTKT khu đô thị; CSDL phát triển đô thị.',
    chung: [
      LUAT_QHDT_NT,
      LUAT_XD_2025,
      { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Quản lý đầu tư phát triển đô thị',
        ghiChu: 'Điều 3–5: nguyên tắc quản lý PTĐT, khu vực PTĐT. '
          + 'Điều 9–14: khu đô thị mới — điều kiện đầu tư, thẩm định, phê duyệt. '
          + 'Đã hợp nhất các lần sửa đổi tại VBHN 04/VBHN-BXD (11/02/2026). '
          + 'Riêng CHƯƠNG TRÌNH phát triển đô thị: từ 2026 thực hiện theo NĐ 35/2026/NĐ-CP.', trongTam: true },
      { loai: 'Nghị định', soHieu: '35/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều của Nghị quyết về phân loại đô thị',
        hieuLuc: 'Ban hành 22/01/2026',
        ghiChu: 'Chi tiết NQ 111/2025/UBTVQH15. Chương trình phát triển đô thị cấp tỉnh theo giai đoạn 10 năm; '
          + 'tiêu chí phát triển đô thị tăng trưởng xanh; trình tự công nhận loại đô thị.', trongTam: true },
      ND_30_2020,
    ],
    linhVuc: [
      { key: 'chuong-trinh-ptdt', ten: 'Chương trình phát triển đô thị', vanBan: [
        { loai: 'Nghị định', soHieu: '35/2026/NĐ-CP', ten: 'Chương trình, kế hoạch phát triển đô thị (mới)',
          hieuLuc: 'Ban hành 22/01/2026',
          ghiChu: 'Chương trình PTĐT cấp tỉnh lập theo giai đoạn 10 NĂM — Sở XD tham mưu UBND tỉnh lập, '
            + 'phê duyệt; định hướng không gian đô thị, danh mục dự án ưu tiên, huy động nguồn lực. '
            + 'Kèm tiêu chí phát triển đô thị tăng trưởng xanh đến 2030.', trongTam: true },
        { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Quản lý ĐTPTĐT — khu vực PTĐT, khu đô thị mới',
          ghiChu: 'Phần chương trình PTĐT chuyển sang NĐ 35/2026; NĐ 11/2013 tiếp tục áp dụng cho '
            + 'khu vực PTĐT, dự án khu đô thị mới, chuyển quyền sử dụng đất đã có hạ tầng.' },
        { loai: 'Luật', soHieu: 'Luật Quản lý phát triển đô thị (dự thảo)', ten: 'Đang xây dựng — theo dõi để cập nhật',
          ghiChu: 'Chưa có hiệu lực; hiện áp dụng NĐ 11/2013, NĐ 35/2026 và Luật QHĐT-NT 47/2024 (sửa đổi 144/2025). '
            + 'Dự kiến trình QH khoá XVI — sẽ thay NĐ 11/2013.' },
      ]},
      { key: 'phan-loai-do-thi', ten: 'Phân loại đô thị', vanBan: [
        { loai: 'Quyết định', soHieu: 'NQ 111/2025/UBTVQH15', ten: 'Nghị quyết về phân loại đô thị',
          hieuLuc: 'Ban hành 24/12/2025 · hiệu lực 01/01/2026',
          ghiChu: 'THAY NQ 1210/2016 và NQ 26/2022. 6 loại đô thị (đặc biệt, I–V); '
            + '3 nhóm tiêu chí mới: vai trò – vị trí, điều kiện phát triển KT-XH, quy mô – mật độ – hạ tầng; '
            + 'phù hợp mô hình chính quyền 2 cấp sau sáp nhập ĐVHC.', trongTam: true },
        { loai: 'Nghị định', soHieu: '35/2026/NĐ-CP', ten: 'Chi tiết NQ 111/2025 — hồ sơ, trình tự công nhận loại đô thị',
          ghiChu: 'Trình tự rà soát, lập đề án phân loại đô thị; thẩm quyền công nhận; '
            + 'đánh giá tiêu chí sau sắp xếp ĐVHC.', trongTam: true },
      ]},
      { key: 'do-thi-thong-minh', ten: 'Đô thị thông minh & tăng trưởng xanh', vanBan: [
        { loai: 'Nghị định', soHieu: '269/2025/NĐ-CP', ten: 'Về phát triển đô thị thông minh',
          hieuLuc: 'Ban hành 14/10/2025',
          ghiChu: 'Khung pháp lý đầu tiên về xây dựng, quản lý, vận hành đô thị thông minh: '
            + 'hạ tầng số, thu thập – phân tích – tích hợp dữ liệu, dịch vụ tiện ích thông minh '
            + '(thiết kế lấy người dùng làm trung tâm), an toàn thông tin.', trongTam: true },
        { loai: 'Thông tư', soHieu: '03/2026/TT-BXD', ten: 'Hướng dẫn một số điều của Nghị định về phát triển đô thị thông minh',
          hieuLuc: 'Ban hành 28/01/2026',
          ghiChu: 'Hướng dẫn NĐ 269/2025: tiêu chí, đánh giá khu đô thị thông minh; lộ trình chuyển đổi.' },
        { loai: 'Quyết định', soHieu: '950/QĐ-TTg', ten: 'Đề án phát triển đô thị thông minh bền vững VN 2018–2025, tầm nhìn 2030',
          ghiChu: 'Trụ cột: CSDL không gian đô thị, ICT/IoT, quản trị ĐT thông minh, dịch vụ ĐT thông minh. '
            + 'Quảng Trị: áp dụng cho phường Đông Hà nâng chất lượng đô thị.', trongTam: true },
        { loai: 'Quyết định', soHieu: '84/QĐ-TTg', ten: 'Kế hoạch phát triển đô thị tăng trưởng xanh VN đến 2030',
          ghiChu: 'Giảm phát thải KNK, tiết kiệm năng lượng, sử dụng VLXD xanh, hạ tầng xanh trong PTĐT.' },
        { loai: 'Luật', soHieu: '72/2020/QH14', ten: 'Luật Bảo vệ môi trường',
          ghiChu: 'Điều 86: bảo vệ MT đô thị; Điều 87: phân loại rác tại nguồn trong ĐT. '
            + 'Liên quan tăng trưởng xanh, đánh giá tác động MT dự án PTĐT.' },
      ]},
      { key: 'tham-dinh-htkt-khu-do-thi', ten: 'Thẩm định hạ tầng kỹ thuật khu đô thị', vanBan: [
        { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Quản lý ĐTPTĐT — thẩm định HTKT khu ĐT',
          ghiChu: 'Điều 9: khu đô thị mới — phải đầu tư đồng bộ HTKT (đường, cấp thoát nước, '
            + 'điện, chiếu sáng, viễn thông, xử lý rác). '
            + 'Điều 11: thẩm định dự án khu ĐT mới — Sở XD thẩm định HTKT. '
            + 'Điều 12: điều kiện chuyển nhượng quyền sử dụng đất có HTKT trong khu ĐT.', trongTam: true },
        QCVN_01_2021,
        { loai: 'QCVN', soHieu: 'QCVN 07:2016/BXD', ten: 'Các công trình hạ tầng kỹ thuật',
          ghiChu: 'QCVN 07-1: cấp nước; QCVN 07-2: thoát nước, xử lý nước thải; '
            + 'QCVN 07-3: cấp điện; QCVN 07-4: chiếu sáng; QCVN 07-5: viễn thông. '
            + 'Bắt buộc tuân thủ khi thẩm định HTKT khu ĐT mới.', trongTam: true },
        // ── PCCC khu đô thị ──
        // Khu ĐT mới thường có chung cư, TTTM, trường học, bệnh viện → thuộc Phụ lục III NĐ 105/2025.
        // Sở XD thẩm định HTKT khu ĐT → cần kiểm tra PCCC cho từng hạng mục:
        // chung cư ≥ 7 tầng/3.000 m², TTTM ≥ 2.000 m², trường học ≥ 5 tầng/3.000 m²...
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC&CNCH — PCCC khu đô thị mới',
          ghiChu: '⚠️ Khu ĐT mới thường chứa nhiều hạng mục thuộc Phụ lục III NĐ 105/2025: '
            + 'chung cư ≥ 7 tầng/3.000 m², TTTM ≥ 2.000 m², trường học ≥ 5 tầng/3.000 m², '
            + 'nhà trẻ ≥ 150 trẻ/2.000 m², bệnh viện ≥ 5 tầng/2.000 m². '
            + 'Khi thẩm định HTKT: kiểm tra bể nước chữa cháy, trụ nước chữa cháy, '
            + 'đường cho xe chữa cháy, khoảng cách ATPCCC giữa các công trình (QCVN 06). '
            + 'Điều 16 khoản 1 Luật 55/2024: yêu cầu PCCC a–g; Điều 17: thẩm quyền thẩm định.', trongTam: true },
        QCVN_06,
        ND_207_2026,
      ]},
      { key: 'csdl-ptdt', ten: 'CSDL phát triển đô thị', vanBan: [
        ND_212_2026,
        LUAT_QHDT_NT,
        { loai: 'Quyết định', soHieu: '950/QĐ-TTg', ten: 'ĐT thông minh — CSDL không gian đô thị',
          ghiChu: 'Xây dựng CSDL không gian đô thị, tích hợp dữ liệu quy hoạch, hạ tầng, dân cư phục vụ quản lý PTĐT.' },
      ] },
    ],
  },

  // 8. PHÒNG QUẢN LÝ VẬN TẢI ───────────────────────────────────────────────────
  'phong-ql-vt': {
    ma: 'PHONG_QL_VT', ten: 'Phòng Quản lý vận tải', baseHref: '/dashboard/phong-ql-vt', color: 'emerald',
    moTaPhong: 'Đăng kiểm phương tiện thủy nội địa; đào tạo – sát hạch; quản lý vận tải, bến xe, taxi; vận tải hành khách công cộng; HTX GTVT.',
    chung: [
      { loai: 'Luật', soHieu: '35/2024/QH15', ten: 'Luật Đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
        ghiChu: 'Chương V (Điều 43–55): vận tải đường bộ — phương tiện, kinh doanh vận tải, bến xe. '
          + 'Chương VI (Điều 56–62): phương tiện giao thông đường bộ (đăng ký, đăng kiểm, niên hạn). '
          + 'Điều 73–80: quản lý nhà nước về đường bộ.', trongTam: true },
      { loai: 'Luật', soHieu: '36/2024/QH15', ten: 'Luật Trật tự, an toàn giao thông đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
        ghiChu: 'Điều 46–54: đào tạo lái xe, sát hạch, cấp GPLX (chuyển Bộ Công an từ 01/01/2025). '
          + 'Điều 23–30: phương tiện GT đường bộ — đăng ký, biển số, niên hạn sử dụng.' },
      { loai: 'Nghị định', soHieu: '158/2024/NĐ-CP', ten: 'Hoạt động vận tải đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
        ghiChu: 'Thay NĐ 10/2020. Chương II (Điều 3–11): kinh doanh vận tải hành khách (tuyến cố định, hợp đồng, du lịch, taxi). '
          + 'Chương III (Điều 12–18): kinh doanh vận tải hàng hóa. '
          + 'Chương IV (Điều 19–24): hoạt động vận tải nội bộ. '
          + 'Chương V (Điều 25–31): bến xe khách, bãi đỗ xe, trạm dừng nghỉ. '
          + 'Chương VI (Điều 32–37): đào tạo lái xe (cơ sở đào tạo, chương trình, giáo viên).', trongTam: true },
    ],
    linhVuc: [
      { key: 'dang-kiem-duong-thuy', ten: 'Đăng ký – đăng kiểm phương tiện đường thủy nội địa', vanBan: [
        { loai: 'Luật', soHieu: '08/2017/QH14 (hợp nhất)', ten: 'Luật GTĐTNĐ — đăng ký, đăng kiểm phương tiện thủy nội địa',
          ghiChu: 'Điều 24–26: đăng ký phương tiện thủy nội địa — thẩm quyền Sở GTVT/XD. '
            + 'Điều 27–29: đăng kiểm — an toàn kỹ thuật, bảo vệ MT, trung tâm đăng kiểm. '
            + 'Điều 30: giấy chứng nhận an toàn kỹ thuật phương tiện.', trongTam: true },
        { loai: 'Nghị định', soHieu: '128/2018/NĐ-CP', ten: 'Chi tiết thi hành Luật GTĐTNĐ — phương tiện thủy',
          ghiChu: 'Trình tự đăng ký, xoá đăng ký phương tiện thủy nội địa; '
            + 'phân cấp: Sở GTVT/XD cấp tỉnh đăng ký phương tiện.' },
        { loai: 'Thông tư', soHieu: '43/2026/TT-BXD', ten: 'Đăng kiểm viên phương tiện thủy nội địa và nhân viên nghiệp vụ kiểm tra',
          hieuLuc: 'Ban hành 29/6/2026',
          ghiChu: 'Tiêu chuẩn, tập huấn, công nhận đăng kiểm viên phương tiện thủy nội địa.' },
        { loai: 'Thông tư', soHieu: '30/2026/TT-BXD', ten: 'Kiểm định xe cơ giới, xe máy chuyên dùng; kiểm định khí thải mô tô, xe máy',
          hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Trình tự kiểm định, miễn kiểm định lần đầu; chứng nhận cải tạo; '
            + 'phương tiện chưa nộp phạt VPGT bị cập nhật lên hệ thống đăng kiểm. '
            + 'Kèm TT 49/2026/TT-BXD: danh mục hàng hóa rủi ro lĩnh vực GTVT.' },
      ]},
      { key: 'dao-tao-sat-hach', ten: 'Đào tạo – sát hạch, cấp GPLX, chứng chỉ', vanBan: [
        { loai: 'Luật', soHieu: '36/2024/QH15', ten: 'Luật TTATGT — đào tạo, sát hạch, GPLX',
          hieuLuc: 'Hiệu lực 01/01/2025',
          ghiChu: '⚠️ Thay đổi lớn: sát hạch + cấp GPLX chuyển sang Bộ Công an từ 01/01/2025. '
            + 'Sở GTVT/XD: quản lý đào tạo lái xe (cơ sở đào tạo, chương trình, giáo viên). '
            + 'Điều 46: cơ sở đào tạo lái xe — điều kiện, cấp phép. '
            + 'Điều 47: chương trình đào tạo, thời gian đào tạo theo hạng GPLX. '
            + 'Cấp chứng chỉ điều khiển phương tiện thủy nội địa: vẫn thuộc Sở.', trongTam: true },
        { loai: 'Nghị định', soHieu: '158/2024/NĐ-CP', ten: 'Hoạt động VTĐB — Chương VI: đào tạo lái xe',
          ghiChu: 'Điều 32–37: điều kiện cơ sở đào tạo, sân tập, xe tập lái, giáo viên, '
            + 'số lượng lưu lượng đào tạo, kiểm tra cơ sở đào tạo. Sửa đổi bởi NĐ 218/2026 từ 10/8/2026.' },
        { loai: 'Thông tư', soHieu: '17/2026/TT-BXD', ten: 'Sửa đổi quy định đào tạo lái xe và cấp chứng chỉ',
          hieuLuc: 'Hiệu lực 01/7/2026',
          ghiChu: 'Sửa đổi TT 14/2025/TT-BXD: chương trình đào tạo, hồ sơ, chứng chỉ đào tạo lái xe.' },
      ]},
      { key: 'quan-ly-van-tai', ten: 'Quản lý vận tải, bến xe, taxi', vanBan: [
        { loai: 'Nghị định', soHieu: '158/2024/NĐ-CP (sửa đổi 218/2026)', ten: 'Kinh doanh VTĐB — vận tải, bến xe, taxi',
          hieuLuc: 'Hiệu lực 01/01/2025 · NĐ 218/2026 sửa đổi từ 10/8/2026',
          ghiChu: 'Điều 3–5: vận tải HK tuyến cố định (điều kiện, tuyến, biểu đồ). '
            + 'Điều 6–8: vận tải HK hợp đồng, du lịch (phù hiệu, lệnh). '
            + 'Điều 9–11: taxi truyền thống + taxi công nghệ. '
            + 'Điều 25–31: bến xe khách — phân loại, điều kiện hoạt động. '
            + 'NĐ 218/2026: tăng cường xe dịp lễ Tết/kỳ thi, hỗ trợ xe buýt, niên hạn xe hợp đồng, '
            + 'thu hồi giấy phép KD vận tải trực tuyến từ 15/9/2026.', trongTam: true },
        { loai: 'Nghị định', soHieu: '168/2024/NĐ-CP (sửa đổi 238/2026)', ten: 'Xử phạt VPHC về TTATGT đường bộ',
          hieuLuc: 'Hiệu lực 01/01/2025 · NĐ 238/2026 sửa đổi từ 15/8/2026',
          ghiChu: 'Mức phạt vi phạm kinh doanh vận tải không phép, quá tải, vượt tuyến; '
            + 'phạt bến xe vi phạm điều kiện hoạt động. NĐ 238/2026: siết xe hợp đồng trá hình tuyến cố định.' },
      ]},
      { key: 'van-tai-cong-cong', ten: 'Vận tải hành khách công cộng', vanBan: [
        { loai: 'Nghị định', soHieu: '158/2024/NĐ-CP', ten: 'VTĐB — vận tải HK công cộng bằng xe buýt',
          ghiChu: 'Điều 3 khoản 3: xe buýt hoạt động trên tuyến theo biểu đồ, lịch trình. '
            + 'Bổ sung quy định xe buýt điện, phương tiện năng lượng xanh.' },
        { loai: 'Quyết định', soHieu: '876/QĐ-TTg', ten: 'Chiến lược phát triển GTVT đến 2030, tầm nhìn 2045',
          ghiChu: 'Ưu tiên phát triển vận tải HK công cộng tại đô thị, giảm phương tiện cá nhân.' },
      ]},
      { key: 'htx-gtvt', ten: 'Hợp tác xã giao thông vận tải', vanBan: [
        { loai: 'Luật', soHieu: '17/2023/QH15', ten: 'Luật Hợp tác xã', hieuLuc: 'Hiệu lực 01/7/2024',
          ghiChu: 'Điều 3: HTX, Liên hiệp HTX — nguyên tắc tổ chức, hoạt động. '
            + 'Điều 12–15: thành lập, đăng ký kinh doanh HTX. '
            + 'Điều 32–38: quản trị HTX (Đại hội, HĐQT, Ban kiểm soát). '
            + 'Điều 51: giải thể, phá sản HTX. '
            + 'HTX GTVT: tổ chức kinh doanh vận tải cho xã viên.', trongTam: true },
        { loai: 'Nghị định', soHieu: '113/2024/NĐ-CP', ten: 'Chi tiết Luật HTX — đăng ký, quản trị, kiểm toán HTX',
          ghiChu: 'Thủ tục đăng ký thành lập, thay đổi, giải thể HTX; báo cáo tài chính HTX.' },
      ]},
    ],
  },

  // 9. PHÒNG QUY HOẠCH – KIẾN TRÚC ─────────────────────────────────────────────
  'phong-qh-kt': {
    ma: 'PHONG_QH_KT', ten: 'Phòng Quy hoạch - Kiến trúc', baseHref: '/dashboard/phong-qh-kt', color: 'indigo',
    moTaPhong: 'CSDL quy hoạch đô thị – nông thôn; thẩm định/phê duyệt quy hoạch; thiết kế đô thị; quy chế quản lý kiến trúc; chứng chỉ hành nghề kiến trúc.',
    chung: [
      { loai: 'Luật', soHieu: '47/2024/QH15 (sửa đổi 144/2025)', ten: 'Luật Quy hoạch đô thị và nông thôn', hieuLuc: 'Hiệu lực 01/7/2025 · Luật 144/2025 sửa đổi từ 01/01/2026',
        ghiChu: 'Thay Luật QHĐT 2009 & phần QHXD nông thôn Luật XD 2014. '
          + 'Luật 144/2025/QH15 (11/12/2025): tăng phân cấp, đơn giản trình tự điều chỉnh cục bộ, '
          + 'thúc đẩy chuyển đổi số trong quy hoạch. '
          + 'Chương II (Điều 6–15): loại và cấp độ QH (chung, phân khu, chi tiết, nông thôn, chuyên ngành). '
          + 'Chương III (Điều 16–30): lập QH — nội dung từng loại, trình tự. '
          + 'Chương IV (Điều 31–40): thẩm định, phê duyệt QH — Sở XD thẩm định QH phân khu/chi tiết '
          + 'theo phân cấp UBND tỉnh. '
          + 'Chương V (Điều 41–50): quản lý QH — cung cấp thông tin, giấy phép QH, cắm mốc. '
          + 'Chương VI (Điều 51–55): điều chỉnh QH — điều kiện, trình tự.', trongTam: true },
      { loai: 'Nghị định', soHieu: '178/2025/NĐ-CP', ten: 'Chi tiết thi hành Luật QHĐT-NT',
        ghiChu: 'Hướng dẫn Luật 47/2024 về trình tự lập, thẩm định, phê duyệt quy hoạch; '
          + 'nội dung hồ sơ QH; quy cách bản vẽ; lấy ý kiến cộng đồng dân cư; '
          + 'công bố, cung cấp thông tin QH; quản lý mốc giới QH.', trongTam: true },
      QCVN_01_2021,
      ND_30_2020,
    ],
    linhVuc: [
      { key: 'csdl-quy-hoach', ten: 'CSDL quy hoạch đô thị – nông thôn', vanBan: [
        { loai: 'Luật', soHieu: '47/2024/QH15', ten: 'Luật QHĐT-NT — hệ thống thông tin, CSDL QH',
          ghiChu: 'Điều 44: hệ thống thông tin & CSDL quy hoạch đô thị, nông thôn. '
            + 'Điều 45: trách nhiệm cập nhật, cung cấp thông tin QH. '
            + 'Sở XD quản lý CSDL QH trên địa bàn tỉnh.', trongTam: true },
        { loai: 'Nghị định', soHieu: '178/2025/NĐ-CP', ten: 'Chi tiết Luật QHĐT-NT — CSDL quy hoạch',
          ghiChu: 'Quy định quy cách dữ liệu, chuẩn thông tin, kết nối liên thông CSDL QH.' },
      ]},
      { key: 'tham-dinh-quy-hoach', ten: 'Thẩm định, phê duyệt quy hoạch', vanBan: [
        { loai: 'Luật', soHieu: '47/2024/QH15', ten: 'Luật QHĐT-NT — Chương IV: thẩm định, phê duyệt QH',
          ghiChu: 'Điều 31: thẩm quyền thẩm định QH (Sở XD thẩm định QH phân khu, chi tiết theo phân cấp). '
            + 'Điều 32: nội dung thẩm định (sự phù hợp QH cấp trên, QCVN, đánh giá tác động). '
            + 'Điều 33: thời hạn thẩm định (QH chung ≤ 25 ngày, phân khu ≤ 20 ngày, chi tiết ≤ 15 ngày). '
            + 'Điều 35–38: phê duyệt — UBND tỉnh phê duyệt QH chung đô thị loại III–V, QH nông thôn.', trongTam: true },
        { loai: 'Nghị định', soHieu: '178/2025/NĐ-CP', ten: 'Chi tiết thẩm định QH — hồ sơ, trình tự',
          ghiChu: 'Hồ sơ trình thẩm định; quy cách bản vẽ QH; lấy ý kiến phối hợp các sở ngành; '
            + 'nội dung nhiệm vụ QH cần phê duyệt trước khi lập đồ án.', trongTam: true },
        { loai: 'Quyết định', soHieu: '18/2025/QĐ-TTg', ten: 'Chi tiết một số nội dung Luật QHĐT-NT',
          hieuLuc: 'Ban hành 28/6/2025',
          ghiChu: 'Quy định chi tiết các nội dung QH giao Chính phủ hướng dẫn: '
            + 'tỷ lệ bản đồ, phạm vi ranh giới, đánh giá môi trường chiến lược.' },
        ND_206_2026,
      ]},
      { key: 'thiet-ke-do-thi', ten: 'Thiết kế đô thị', vanBan: [
        { loai: 'Luật', soHieu: '47/2024/QH15', ten: 'Luật QHĐT-NT — thiết kế đô thị',
          ghiChu: 'Điều 22: thiết kế đô thị trong QH phân khu — tổ chức không gian, cảnh quan, '
            + 'chiều cao tầng, mật độ XD, khoảng lùi, hệ số sử dụng đất. '
            + 'Điều 23: thiết kế đô thị trong QH chi tiết — chi tiết hóa kiến trúc, vật liệu, màu sắc, '
            + 'cây xanh, chiếu sáng, biển quảng cáo.', trongTam: true },
        QCVN_01_2021,
        { loai: 'Luật', soHieu: '40/2019/QH14', ten: 'Luật Kiến trúc — kiến trúc cảnh quan trong thiết kế ĐT',
          ghiChu: 'Điều 11: kiến trúc đô thị — phù hợp QH, quy chế quản lý kiến trúc. '
            + 'Điều 13: bản sắc kiến trúc địa phương.' },
      ]},
      { key: 'quy-che-kien-truc', ten: 'Quy chế quản lý kiến trúc', vanBan: [
        { loai: 'Luật', soHieu: '40/2019/QH14', ten: 'Luật Kiến trúc — quy chế quản lý kiến trúc',
          hieuLuc: 'Hiệu lực 01/7/2020',
          ghiChu: 'Điều 14: quy chế quản lý kiến trúc (QCQLKT) — UBND tỉnh ban hành. '
            + 'Điều 15: nội dung QCQLKT: quy định về hình thức kiến trúc, chiều cao, mái, '
            + 'màu sắc, vật liệu, cây xanh, biển hiệu, quảng cáo cho từng khu vực. '
            + 'Sở XD chủ trì tham mưu lập, điều chỉnh QCQLKT.', trongTam: true },
        { loai: 'Nghị định', soHieu: '85/2020/NĐ-CP', ten: 'Chi tiết Luật Kiến trúc — QCQLKT',
          ghiChu: 'Điều 3–6: nội dung, trình tự lập, lấy ý kiến, phê duyệt QCQLKT. '
            + 'Điều 7: rà soát, điều chỉnh QCQLKT (tối đa 5 năm/lần). '
            + 'Điều 8: trách nhiệm Sở XD trong tham mưu QCQLKT.' },
      ]},
      { key: 'chung-chi-kien-truc', ten: 'Chứng chỉ hành nghề kiến trúc', vanBan: [
        { loai: 'Luật', soHieu: '40/2019/QH14', ten: 'Luật Kiến trúc — hành nghề kiến trúc',
          ghiChu: 'Điều 19: điều kiện hành nghề KTS (bằng KTS + chứng chỉ hành nghề). '
            + 'Điều 20: sát hạch chứng chỉ (kiến thức pháp luật + chuyên môn). '
            + 'Điều 21: cấp, gia hạn, thu hồi chứng chỉ — Sở XD cấp. '
            + 'Điều 25: phát triển nghề nghiệp liên tục (PDU) — KTS phải cập nhật kiến thức.', trongTam: true },
        { loai: 'Nghị định', soHieu: '85/2020/NĐ-CP', ten: 'Chi tiết Luật KT — sát hạch, cấp CCHN kiến trúc',
          ghiChu: 'Điều 9–12: trình tự sát hạch, hội đồng sát hạch, nội dung sát hạch. '
            + 'Điều 13: mẫu chứng chỉ, đăng ký thông tin trên hệ thống quốc gia. '
            + 'Phân biệt: CCHN kiến trúc (Luật Kiến trúc) ≠ CCHN HĐXD (Luật XD, NĐ 212/2026).' },
      ]},
    ],
  },

  // 10. PHÒNG QUẢN LÝ NHÀ & THỊ TRƯỜNG BĐS ─────────────────────────────────────
  'phong-ql-nha': {
    ma: 'PHONG_QL_NHA', ten: 'Phòng Quản lý nhà và thị trường bất động sản', baseHref: '/dashboard/phong-ql-nha', color: 'emerald',
    moTaPhong: 'Chương trình phát triển nhà ở; nhà ở xã hội, nhà công vụ; định giá nhà; quản lý thị trường BĐS; chứng chỉ môi giới; hệ thống thông tin nhà ở – BĐS.',
    chung: [
      { loai: 'Luật', soHieu: '27/2023/QH15', ten: 'Luật Nhà ở', hieuLuc: 'Hiệu lực 01/8/2024',
        ghiChu: 'Thay Luật Nhà ở 2014. '
          + 'Chương II (Điều 6–14): sở hữu nhà ở — hình thức sở hữu, công nhận quyền sở hữu. '
          + 'Chương III (Điều 15–30): phát triển nhà ở — chương trình/kế hoạch phát triển nhà ở, '
          + 'điều kiện dự án đầu tư XD nhà ở. '
          + 'Chương IV (Điều 31–45): nhà ở xã hội — đối tượng, điều kiện, quỹ đất 20%, ưu đãi. '
          + 'Chương VI (Điều 55–70): quản lý sử dụng nhà ở — bảo hành, bảo trì, cải tạo, phá dỡ. '
          + 'Chương VII (Điều 71–80): giao dịch nhà ở — mua bán, cho thuê, cho ở nhờ, thừa kế.', trongTam: true },
      { loai: 'Luật', soHieu: '29/2023/QH15', ten: 'Luật Kinh doanh bất động sản', hieuLuc: 'Hiệu lực 01/8/2024',
        ghiChu: 'Thay Luật KD BĐS 2014. '
          + 'Chương II (Điều 6–18): kinh doanh BĐS — điều kiện, vốn pháp định, bảo lãnh nhà ở. '
          + 'Điều 8: điều kiện tổ chức KD BĐS (vốn ≥ 50 tỷ, pháp nhân). '
          + 'Chương III (Điều 19–35): kinh doanh quyền sử dụng đất. '
          + 'Chương IV (Điều 36–48): dịch vụ BĐS — môi giới, sàn giao dịch, tư vấn, quản lý. '
          + 'Điều 37: điều kiện hành nghề môi giới BĐS — chứng chỉ do Sở XD cấp.', trongTam: true },
      { loai: 'Luật', soHieu: '31/2024/QH15', ten: 'Luật Đất đai', hieuLuc: 'Hiệu lực 01/8/2024',
        ghiChu: 'Liên quan quyền sử dụng đất gắn liền nhà ở, BĐS. '
          + 'Điều 153: bảng giá đất; Điều 159: giá đất cụ thể. '
          + 'Điều 45: giao đất xây dựng nhà ở xã hội; Điều 79: thu hồi đất, TĐC.' },
      ND_30_2020,
    ],
    linhVuc: [
      { key: 'phat-trien-nha-o', ten: 'Chương trình, kế hoạch phát triển nhà ở', vanBan: [
        { loai: 'Luật', soHieu: '27/2023/QH15', ten: 'Luật Nhà ở — phát triển nhà ở',
          ghiChu: 'Điều 15: chương trình phát triển nhà ở (Chính phủ phê duyệt QG; UBND tỉnh phê duyệt địa phương). '
            + 'Điều 16: nội dung chương trình (nhu cầu, mục tiêu, quỹ đất, vốn, lộ trình). '
            + 'Điều 17: kế hoạch phát triển nhà ở 5 năm, hằng năm — Sở XD chủ trì tham mưu. '
            + 'Điều 18–20: dự án ĐTXD nhà ở — điều kiện, thẩm quyền chấp thuận chủ trương đầu tư.', trongTam: true },
        { loai: 'Nghị định', soHieu: '95/2024/NĐ-CP (sửa đổi 54/2026)', ten: 'Chi tiết Luật Nhà ở — phát triển nhà ở',
          ghiChu: 'Điều 3–5: nội dung chi tiết chương trình phát triển nhà ở địa phương. '
            + 'Điều 6: trình tự lập, thẩm định, phê duyệt chương trình (Sở XD tham mưu). '
            + 'Điều 8–10: điều kiện, thẩm quyền dự án nhà ở thương mại, tái định cư. '
            + 'Sửa đổi bởi NĐ 54/2026/NĐ-CP (09/2/2026) và TT 08/2026/TT-BXD.' },
        { loai: 'Nghị định', soHieu: '54/2026/NĐ-CP', ten: 'Sửa đổi các Nghị định lĩnh vực nhà ở, kinh doanh BĐS',
          hieuLuc: 'Ban hành 09/2/2026 · hiệu lực ngay',
          ghiChu: 'Sửa đồng loạt NĐ 95/2024, 96/2024, 100/2024: chuẩn hoá, công khai quy trình mua/thuê NƠXH '
            + 'trên hệ thống thông tin nhà ở; CĐT công bố thông tin dự án trong 30 ngày kể từ khởi công.', trongTam: true },
      ]},
      { key: 'nha-o-xa-hoi', ten: 'Nhà ở xã hội, nhà công vụ', vanBan: [
        { loai: 'Nghị định', soHieu: '100/2024/NĐ-CP (sửa đổi 54/2026, 136/2026)', ten: 'Phát triển và quản lý nhà ở xã hội',
          ghiChu: 'Điều 3: đối tượng được mua/thuê NƠXH. '
            + 'Điều 5–8: điều kiện dự án NƠXH — quỹ đất 20%, ưu đãi thuế, miễn tiền sử dụng đất. '
            + 'Điều 11–15: giá bán, giá thuê NƠXH — lợi nhuận tối đa 10%. '
            + 'NĐ 54/2026: đa dạng cách nộp hồ sơ, ưu tiên bán cho người đang thuê trước hạn 10 năm. '
            + 'NĐ 136/2026 (hiệu lực 07/4/2026): nâng trần thu nhập được mua NƠXH lên 25 triệu đồng/tháng.', trongTam: true },
        { loai: 'Nghị định', soHieu: '95/2024/NĐ-CP', ten: 'Chi tiết Luật Nhà ở — nhà công vụ, TĐC',
          ghiChu: 'Điều 25–30: nhà ở công vụ — đối tượng, quản lý, giá thuê, trả lại nhà CV. '
            + 'Điều 31–35: nhà ở tái định cư — quy hoạch, xây dựng, bàn giao, giá bán.' },
        { loai: 'Luật', soHieu: '27/2023/QH15', ten: 'Luật Nhà ở — Chương IV: NƠXH',
          ghiChu: 'Điều 31–33: đối tượng, điều kiện thụ hưởng NƠXH. '
            + 'Điều 35: quỹ đất xây dựng NƠXH (dự án ≥ 2 ha phải dành ≥ 20% đất). '
            + 'Điều 37: hình thức phát triển NƠXH (nhà nước, doanh nghiệp, PPP). '
            + 'Điều 40: ưu đãi NƠXH — miễn tiền SDĐ, thuế TNDN, hỗ trợ tín dụng.', trongTam: true },
      ]},
      { key: 'dinh-gia-nha', ten: 'Định giá nhà', vanBan: [
        { loai: 'Nghị định', soHieu: '95/2024/NĐ-CP', ten: 'Chi tiết Luật Nhà ở — khung giá, giá thuê nhà ở',
          ghiChu: 'Điều 36–40: phương pháp định giá nhà ở (thu nhập, so sánh, chi phí). '
            + 'Điều 41: giá thuê nhà ở thuộc SHNN — UBND tỉnh quyết định. '
            + 'Điều 43: giá bán nhà ở xã hội — chi phí + lợi nhuận ≤ 10%.', trongTam: true },
        { loai: 'Luật', soHieu: '31/2024/QH15', ten: 'Luật Đất đai — liên quan giá đất, nhà ở',
          ghiChu: 'Điều 153: bảng giá đất → ảnh hưởng giá nhà ở, NƠXH. '
            + 'Điều 159: giá đất cụ thể khi giao đất dự án nhà ở.' },
      ]},
      { key: 'thi-truong-bds', ten: 'Quản lý thị trường BĐS & chứng chỉ môi giới', vanBan: [
        { loai: 'Luật', soHieu: '29/2023/QH15', ten: 'Luật KD BĐS — thị trường BĐS',
          ghiChu: 'Điều 6: nguyên tắc KD BĐS — công khai, minh bạch. '
            + 'Điều 8: điều kiện KD BĐS (pháp nhân, vốn ≥ 50 tỷ, không nợ xấu). '
            + 'Điều 36: sàn giao dịch BĐS — giao dịch BĐS hình thành trong tương lai phải qua sàn. '
            + 'Điều 37: điều kiện hành nghề môi giới BĐS — chứng chỉ hành nghề do Sở XD cấp.', trongTam: true },
        { loai: 'Nghị định', soHieu: '96/2024/NĐ-CP (sửa đổi 54/2026)', ten: 'Chi tiết Luật KD BĐS — điều kiện KD, chứng chỉ môi giới',
          ghiChu: 'Điều 4–7: hồ sơ, trình tự cấp chứng chỉ hành nghề môi giới BĐS. '
            + 'Điều 8: nội dung sát hạch (pháp luật BĐS + nghiệp vụ môi giới). '
            + 'Điều 12–15: điều kiện sàn giao dịch BĐS, nghĩa vụ công khai thông tin. '
            + 'Điều 20: xử lý vi phạm — thu hồi chứng chỉ, đình chỉ hoạt động. '
            + 'Sửa đổi bởi NĐ 54/2026/NĐ-CP (09/2/2026).', trongTam: true },
        { loai: 'Thông tư', soHieu: '08/2026/TT-BXD', ten: 'Sửa đổi, bổ sung quy định lĩnh vực nhà ở',
          hieuLuc: 'Ban hành 15/02/2026',
          ghiChu: 'Cập nhật biểu mẫu, trình tự nghiệp vụ nhà ở theo NĐ 54/2026.' },
      ]},
      { key: 'he-thong-thong-tin', ten: 'Hệ thống thông tin về nhà ở & thị trường BĐS', vanBan: [
        { loai: 'Nghị định', soHieu: '94/2024/NĐ-CP', ten: 'Hệ thống thông tin, CSDL về nhà ở & thị trường BĐS',
          ghiChu: 'Điều 3: nội dung HTTT (dự án nhà ở, giao dịch BĐS, giá bán, giá thuê, chỉ số BĐS). '
            + 'Điều 5: trách nhiệm Sở XD — xây dựng, quản lý, vận hành HTTT cấp tỉnh. '
            + 'Điều 8: kết nối, chia sẻ dữ liệu với HTTT quốc gia về nhà ở & BĐS (Bộ XD). '
            + 'Điều 12: chế độ báo cáo — CĐT/sàn GD BĐS gửi thông tin giao dịch về Sở XD.', trongTam: true },
        { loai: 'Luật', soHieu: '29/2023/QH15', ten: 'Luật KD BĐS — HTTT thị trường BĐS',
          ghiChu: 'Điều 44: hệ thống thông tin, CSDL về thị trường BĐS — liên thông, công khai.' },
      ]},
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HÀM TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────

export function getPhapLyPhong(key: string): PhapLyPhong | undefined {
  return PHAP_LY_PHONG[key]
}

export const DANH_SACH_PHONG_PHAP_LY = Object.values(PHAP_LY_PHONG).map((p) => ({
  key: p.baseHref.split('/').pop()!, ma: p.ma, ten: p.ten, baseHref: p.baseHref,
}))
