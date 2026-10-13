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
  ghiChu: 'QH thông qua 10/12/2025. Thay Luật Xây dựng 2014 và Luật sửa đổi 62/2020/QH14. Đ26–27: thẩm định BCNCKT tại cơ quan chuyên môn; Đ29–30: chủ đầu tư thẩm định thiết kế triển khai; Đ43–47: giấy phép xây dựng, trật tự xây dựng; Đ48: điều kiện khởi công.',
  trongTam: true,
}
const ND_217_2026: VanBan = {
  loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Xây dựng về quản lý hoạt động xây dựng',
  hieuLuc: 'Ban hành 19/6/2026 · hiệu lực 01/7/2026',
  // Cấu trúc đối chiếu bản Công báo (rà soát 13/10/2026): Chương II gồm Mục 1 khảo sát, Mục 2 thiết kế,
  // Mục 3 lập/thẩm định dự án (Đ26–40), Mục 4 thiết kế triển khai (Đ41–43), Mục 5 tổ chức QLDA;
  // Chương III giấy phép xây dựng và trật tự xây dựng (Đ49–67); Chương IV công trình đặc thù.
  ghiChu: 'Thay NĐ 175/2024 (Đ75). '
    + 'Đ8 k1 điểm a: BIM áp dụng với công trình xây dựng MỚI từ cấp II trở lên kể từ giai đoạn lập BCNCKT/BCKTKT. '
    + 'Chương II Mục 3: thẩm định BCNCKT tại cơ quan chuyên môn (thẩm quyền Đ32–33, trình tự Đ36, thời hạn Đ37: '
    + 'nhóm A 25/20, nhóm B 20/16, nhóm C 15/12 ngày làm việc tuỳ có công trình cấp I trở lên hay không). '
    + 'Mục 4: thiết kế triển khai do CHỦ ĐẦU TƯ thẩm định (Đ41, Mẫu số 12). '
    + 'Chương III: GPXD — thẩm quyền Đ53 (UBND cấp xã: cấp III, IV, nhà ở riêng lẻ; Ban quản lý khu: công trình trong khu; '
    + 'Sở XD: còn lại); công khai GPXD tối thiểu 12 tháng (Đ66); quản lý trật tự xây dựng (Đ67). '
    + 'Đ74 (sửa NĐ 105 về PCCC) đã bị NĐ 347/2026 bãi bỏ.',
  trongTam: true,
}
const ND_207_2026: VanBan = {
  loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều của Luật Xây dựng về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
  hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
  // Cấu trúc đối chiếu bản gốc: Chương II thi công, nghiệm thu, bàn giao; Chương III bảo hành, bảo trì,
  // phá dỡ; Chương IV sự cố.
  ghiChu: 'Thay NĐ 06/2021/NĐ-CP. '
    + 'Chương II: quản lý thi công (Đ12 điều kiện khởi công, Đ14 quản lý vật liệu, sản phẩm, cấu kiện, thiết bị), '
    + 'nghiệm thu (Đ24), KIỂM TRA CÔNG TÁC NGHIỆM THU của cơ quan nhà nước (Đ25 đối tượng, Đ26 thẩm quyền, Đ27 trình tự), '
    + 'hồ sơ hoàn thành (Đ28). '
    + 'Chương III: bảo hành, bảo trì, phá dỡ công trình. '
    + 'Chương IV: sự cố — chủ đầu tư thông báo ngay bằng biện pháp nhanh nhất cho UBND cấp xã; '
    + 'trong 24 giờ báo cáo bằng văn bản tới UBND cấp tỉnh.',
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
  ghiChu: 'Chương II: CSDL quốc gia về hoạt động xây dựng (quy hoạch, dự án, định mức – giá, năng lực). '
    + 'Chương IV Mục 1: chứng chỉ hành nghề CÁ NHÂN (Đ27–40; Hội đồng xét cấp Đ40; thẩm quyền Đ31). '
    + 'Mục 2: tổ chức TỰ CÔNG KHAI thông tin năng lực trên CSDL (Đ41) — không còn thủ tục cấp chứng chỉ năng lực; '
    + 'nội dung công khai gồm hạng, lĩnh vực theo chứng chỉ năng lực đã được cấp (nếu có) (Đ41 k3 điểm e). '
    + 'Mục 3: giấy phép hoạt động xây dựng cho NHÀ THẦU NƯỚC NGOÀI (Đ42–49). '
    + 'Đ27 k3 điểm d: không yêu cầu chứng chỉ hành nghề với công viên cây xanh, chiếu sáng công cộng, đường cáp truyền dẫn tín hiệu viễn thông. '
    + 'Chứng chỉ cấp mới hiệu lực 10 năm (Đ27 k5).',
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
// Căn cứ hiện hành (rà soát 13/10/2026, đối chiếu NĐ 105/2025 và NĐ 347/2026 bản gốc):
//   • Đ6 k1 NĐ 105 (sửa bởi Đ12 NĐ 347/2026, hiệu lực 15/9/2026): công trình thuộc diện thẩm định
//     BCNCKT tại cơ quan chuyên môn về xây dựng VÀ thuộc Phụ lục III → cơ quan chuyên môn thẩm định
//     thiết kế PCCC; việc thẩm định và THỜI GIAN TRẢ KẾT QUẢ được TÍCH HỢP vào thẩm định BCNCKT.
//   • Phần của cơ quan Công an (điểm e, g khoản 1 Điều 16 Luật PCCC) ở bước thiết kế triển khai/BCKTKT
//     (Đ9 k4 điểm a NĐ 105, sửa bởi Đ14 NĐ 347/2026).
//   • Phụ lục III NĐ 105 = danh mục công trình, phương tiện giao thông thuộc diện thẩm định thiết kế PCCC
//     (NĐ 347/2026 thay Phụ lục III). Ngưỡng từng loại công trình PHẢI tra bản gốc — không chép số ở đây.
//   • Nghiệm thu PCCC: chủ đầu tư tổ chức và khai báo trên CSDL PCCC trước khi đưa vào hoạt động
//     (Đ12 k1 điểm đ NĐ 105, sửa bởi Đ16 NĐ 347/2026).
//   • Cấp GPXD: hồ sơ gồm kết quả thực hiện TTHC về PCCC đối với hồ sơ thiết kế (nếu có yêu cầu) (Đ57 k1 điểm c
//     NĐ 217/2026); cơ quan cấp phép đối chiếu bản vẽ với bản vẽ đã thẩm duyệt/thẩm định PCCC (Đ54 k6 điểm b).
// (Bản trước chép danh sách ngưỡng Phụ lục III và thời hạn "≤ 10/≤ 6 ngày" chưa đối chiếu — đã gỡ.)

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
    + 'Điều 17: phân công thẩm định thiết kế PCCC giữa cơ quan chuyên môn về xây dựng và cơ quan Công an; '
    + 'khoản 4: Chính phủ quy định danh mục công trình thuộc diện thẩm định (Phụ lục III NĐ 105/2025).',
  trongTam: true,
}
const ND_105_2025: VanBan = {
  loai: 'Nghị định', soHieu: '105/2025/NĐ-CP (sửa bởi 347/2026)', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',
  hieuLuc: 'Ban hành 15/5/2025 · hiệu lực 01/7/2025; NĐ 347/2026 sửa đổi, hiệu lực 15/9/2026',
  ghiChu: 'Đ6 k1 (sửa bởi NĐ 347): cơ quan chuyên môn về xây dựng thẩm định thiết kế PCCC với công trình thuộc diện '
    + 'thẩm định BCNCKT tại cơ quan chuyên môn và thuộc Phụ lục III — tích hợp vào thẩm định BCNCKT, không có thời hạn riêng. '
    + 'Phụ lục III: danh mục công trình, phương tiện giao thông thuộc diện thẩm định thiết kế PCCC (NĐ 347 thay Phụ lục III; '
    + 'công trình ngoài danh mục chỉ phải thẩm định khi thiết kế cùng lúc VÀ dùng chung hệ thống báo cháy/chữa cháy với công trình thuộc diện). '
    + 'Phụ lục IV (NĐ 347 thay thế): phương tiện PCCC, CNCH, vật liệu, cấu kiện ngăn cháy — không phải danh mục công trình; '
    + 'Phụ lục V đã bị bãi bỏ (Đ30 k3 NĐ 347/2026). '
    + 'Đ13–14 (sửa bởi NĐ 347): UBND tỉnh phân công cơ quan chuyên môn về xây dựng kiểm tra định kỳ cơ sở nhóm 1, nhóm 2 Phụ lục II; '
    + 'lập kế hoạch kiểm tra năm sau trước 15/12.',
  trongTam: true,
}
const QCVN_06: VanBan = {
  loai: 'QCVN', soHieu: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)', ten: 'An toàn cháy cho nhà và công trình',
  ghiChu: 'Ban hành kèm TT 06/2022/TT-BXD; Sửa đổi 1:2023 kèm TT 09/2023/TT-BXD. '
    + 'Quy định bậc chịu lửa, khoảng cách PCCC, lối thoát nạn, ngăn cháy — '
    + 'dùng khi thẩm định thiết kế PCCC phần thuộc cơ quan chuyên môn về xây dựng.',
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
  hieuLuc: 'Ban hành 04/8/2025 · hiệu lực từ ngày ký (Đ145); sửa đổi bởi NĐ 349/2026/NĐ-CP (có trong kho) và NĐ 165/2026/NĐ-CP (theo tra cứu, chưa có bản trong kho)',
  ghiChu: 'Thay Nghị định 24/2024/NĐ-CP. Hạn mức chỉ định thầu quy định tại Luật Đấu thầu, không nằm trong Nghị định này.',
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
        { loai: 'TCVN', soHieu: 'TCVN ISO 9001:2015', ten: 'Hệ thống quản lý chất lượng — Các yêu cầu' },
        { loai: 'Nghị quyết', soHieu: 'Nghị quyết 76/NQ-CP', ten: 'Chương trình tổng thể cải cách hành chính nhà nước giai đoạn 2021–2030' },
      ]},
      { key: 'chuyen-doi-so', ten: 'Chuyển đổi số & Đề án 06', vanBan: [
        { loai: 'Luật', soHieu: '148/2025/QH15', ten: 'Luật Chuyển đổi số',
          hieuLuc: 'QH thông qua 11/12/2025 · hiệu lực 01/7/2026',
          ghiChu: 'Luật ĐẦU TIÊN điều chỉnh toàn diện chuyển đổi số (8 chương, 48 điều): nguyên tắc, chính sách '
            + 'chuyển đổi số; phát triển chính phủ số, kinh tế số, xã hội số; dữ liệu số; nền tảng số; '
            + 'bảo đảm an toàn thông tin, an ninh mạng.', trongTam: true },
        { loai: 'Luật', soHieu: '20/2023/QH15', ten: 'Luật Giao dịch điện tử', hieuLuc: 'Hiệu lực 01/7/2024', trongTam: true },
        { loai: 'Luật', soHieu: '60/2024/QH15', ten: 'Luật Dữ liệu', hieuLuc: 'Hiệu lực 01/7/2025' },
        { loai: 'Quyết định', soHieu: '06/QĐ-TTg', ten: 'Đề án phát triển ứng dụng dữ liệu dân cư, định danh và xác thực điện tử (Đề án 06)' },
      ]},
      { key: 'hanh-chinh-quan-tri', ten: 'Hành chính – Quản trị, tài sản công', vanBan: [
        { loai: 'Luật', soHieu: '15/2017/QH14', ten: 'Luật Quản lý, sử dụng tài sản công', trongTam: true },
        { loai: 'Nghị định', soHieu: '186/2025/NĐ-CP', ten: 'Quy định chi tiết một số điều của Luật Quản lý, sử dụng tài sản công',
          hieuLuc: 'Ban hành & hiệu lực 01/7/2025',
          ghiChu: 'THAY NĐ 151/2017/NĐ-CP (và các NĐ sửa đổi, gồm 114/2024/NĐ-CP). '
            + 'Giao, mua sắm, thuê, khai thác, vận hành, chuyển đổi công năng, xử lý tài sản công; '
            + 'sử dụng tài sản công vào KD/cho thuê/liên doanh; quản lý nguồn thu từ khai thác, xử lý tài sản công.', trongTam: true },
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
        { loai: 'Nghị định', soHieu: '115/2024/NĐ-CP', ten: 'Chi tiết Luật Đấu thầu về lựa chọn nhà đầu tư thực hiện dự án đầu tư có sử dụng đất',
          ghiChu: 'Ban hành 16/9/2024. Áp dụng cho dự án khu ĐT, nhà ở, hạ tầng, thương mại dịch vụ có sử dụng đất. '
            + '(NĐ 23/2024/NĐ-CP là lựa chọn nhà đầu tư dự án phải đấu thầu theo pháp luật quản lý ngành, lĩnh vực — phạm vi khác.)' },
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
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật Xây dựng — Điều 26–27: thẩm định BCNCKT; Điều 29–30: thẩm định thiết kế',
          ghiChu: 'Sở XD thẩm định BCNCKT công trình giao thông thuộc thẩm quyền (khoản 4 Điều 27). Thiết kế triển khai sau khi dự án được phê duyệt do CHỦ ĐẦU TƯ thẩm định (Đ29 k1).', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Quản lý HĐXD — Chương II Mục 3: lập, thẩm định dự án (Đ26–40)',
          ghiChu: 'Thẩm quyền Đ32–33; trình tự Đ36; thời hạn Đ37: nhóm A 25/20, nhóm B 20/16, nhóm C 15/12 ngày làm việc (có/không có công trình cấp I trở lên). Đ41: thiết kế triển khai do chủ đầu tư thẩm định.', trongTam: true },
        { loai: 'Luật', soHieu: '35/2024/QH15', ten: 'Luật Đường bộ', hieuLuc: 'Hiệu lực 01/01/2025',
          ghiChu: 'Điều 11–15: yêu cầu kỹ thuật kết cấu hạ tầng đường bộ; Điều 16: phân loại đường; Điều 18: quản lý chất lượng công trình đường bộ.', trongTam: true },
        // ── PCCC khi thẩm định thiết kế công trình giao thông ──
        // Công trình GT thuộc Phụ lục III NĐ 105/2025 (sửa bởi NĐ 347/2026) và thuộc diện thẩm định BCNCKT tại
        // cơ quan chuyên môn → Sở thẩm định thiết kế PCCC tích hợp vào thẩm định BCNCKT (Đ6 k1 NĐ 105).
        // Phần cơ quan Công an (điểm e, g khoản 1 Điều 16 Luật PCCC) thuộc bước thiết kế triển khai.
        // Ngưỡng từng loại công trình: tra Phụ lục III bản gốc (bản trước chép số chưa đối chiếu — đã gỡ).
        { loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật PCCC&CNCH — Điều 16, 17: yêu cầu & thẩm định PCCC khi thiết kế công trình',
          ghiChu: 'Khoản 1 Điều 16: các yêu cầu PCCC khi thiết kế (điểm a–g). Điều 17: phân công thẩm định giữa cơ quan '
            + 'chuyên môn về xây dựng và cơ quan Công an (điểm e, g thuộc Công an).', trongTam: true },
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP (sửa bởi 347/2026)', ten: 'Chi tiết Luật PCCC — Đ6 k1, Phụ lục III',
          ghiChu: 'Thẩm định thiết kế PCCC và thời gian trả kết quả tích hợp vào thẩm định BCNCKT (Đ6 k1, sửa bởi Đ12 NĐ 347/2026) — '
            + 'không có thời hạn PCCC riêng. Phụ lục III do NĐ 347/2026 thay thế.' },
        QCVN_06,
      ]},
      { key: 'kiem-tra-nghiem-thu', ten: 'Kiểm tra công tác nghiệm thu', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Đ24: nghiệm thu; Đ25–27: kiểm tra công tác nghiệm thu',
          ghiChu: 'CĐT tổ chức nghiệm thu từng phần, giai đoạn, hạng mục; bộ phận bị che khuất phải nghiệm thu '
            + 'trước khi tiếp tục thi công. Cơ quan chuyên môn XD kiểm tra nghiệm thu theo phân cấp.', trongTam: true },
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 57: nghiệm thu; Điều 58: bàn giao công trình',
          ghiChu: 'Công trình chỉ được đưa vào sử dụng khi đã nghiệm thu đạt yêu cầu.' },
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP (sửa bởi 347/2026)', ten: 'Nghiệm thu về PCCC',
          ghiChu: 'Chủ đầu tư tổ chức nghiệm thu về PCCC, chịu trách nhiệm về kết quả và khai báo trên CSDL PCCC trước khi đưa '
            + 'công trình vào hoạt động (Đ12 k1 điểm đ, sửa bởi Đ16 NĐ 347/2026). Thủ tục kiểm tra kết quả nghiệm thu PCCC '
            + 'của cơ quan Công an (Đ10 NĐ 105) đã bị bãi bỏ (Đ30 k1 NĐ 347/2026) — không yêu cầu "văn bản chấp thuận nghiệm thu PCCC".' },
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
        { loai: 'Luật', soHieu: '23/2004/QH11 (sửa đổi 48/2014/QH13)', ten: 'Luật Giao thông đường thủy nội địa',
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
        { loai: 'Luật', soHieu: '23/2004/QH11 (sửa đổi 48/2014/QH13)', ten: 'Luật GTĐTNĐ — quản lý cảng, bến thủy nội địa',
          ghiChu: 'Chương IV: cảng, bến thủy nội địa — phân loại, công bố hoạt động, an toàn.' },
      ]},
      { key: 'pha-do-nong-thon-moi', ten: 'Giao thông nông thôn mới', vanBan: [
        { loai: 'Quyết định', soHieu: 'QĐ 318/QĐ-TTg + bộ tiêu chí NTM', ten: 'Tiêu chí giao thông trong xây dựng nông thôn mới',
          ghiChu: 'Tiêu chí đường giao thông xã, thôn: tỷ lệ cứng hoá, bảo trì, an toàn; '
            + 'phối hợp đánh giá đạt tiêu chí NTM/NTM nâng cao.' },
      ]},
    ],
  },

  // 5. PHÒNG QL HOẠT ĐỘNG XÂY DỰNG ─────────────────────────────────────────────
  'phong-qlhd-xd': {
    ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng', baseHref: '/dashboard/phong-qlhd-xd', color: 'indigo',
    moTaPhong: 'Cấp phép xây dựng; quản lý trật tự xây dựng; thẩm định BCNCKT dự án dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở; chứng chỉ hành nghề cá nhân, giấy phép nhà thầu nước ngoài; thí nghiệm chuyên ngành.',
    chung: [LUAT_XD_2025, LUAT_QHDT_NT, ND_217_2026, ND_207_2026, ND_212_2026, ND_30_2020],
    linhVuc: [
      { key: 'cap-phep-xay-dung', ten: 'Cấp phép xây dựng', vanBan: [
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 43–46: giấy phép xây dựng',
          ghiChu: 'Đ43: quy định chung, khoản 2 các trường hợp được miễn GPXD; Đ44: cấp GPXD; '
            + 'Đ45: quyền, trách nhiệm của cơ quan cấp GPXD; Đ46: quyền, trách nhiệm của người đề nghị cấp. '
            + 'Khoản 2, 3 Điều 43 có hiệu lực từ 01/01/2026.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Chương III: giấy phép xây dựng (Đ49–66)',
          ghiChu: 'Đ50–52: điều kiện cấp GPXD mới, sửa chữa cải tạo, có thời hạn. '
            + 'Đ53 thẩm quyền: UBND cấp xã — công trình cấp III, IV và nhà ở riêng lẻ trên địa bàn; '
            + 'Ban quản lý KCN, KCX, KCNC, KKT — công trình trong khu; Sở Xây dựng — các công trình còn lại; '
            + 'dự án nhiều công trình xác định theo công trình có cấp cao nhất (k4 điểm c). '
            + 'Đ54: trình tự xem xét; Đ56–62: hồ sơ; Đ63–65: điều chỉnh, gia hạn, cấp lại, thu hồi; '
            + 'Đ66: công khai GPXD trên trang thông tin điện tử tối thiểu 12 tháng.', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'PCCC khi cấp GPXD — Đ57 k1 điểm c, Đ54 k6 điểm b',
          ghiChu: 'Hồ sơ cấp GPXD mới gồm kết quả thực hiện thủ tục hành chính về PCCC đối với hồ sơ thiết kế đề nghị cấp phép '
            + '(nếu có yêu cầu) — công trình thuộc diện thẩm duyệt/thẩm định thiết kế PCCC (Phụ lục III NĐ 105/2025, sửa bởi NĐ 347/2026). '
            + 'Khi xem xét, cơ quan cấp phép đối chiếu bản vẽ đề nghị cấp phép với bản vẽ đã được thẩm duyệt/thẩm định PCCC; '
            + 'không thẩm định lại nội dung PCCC.' },
      ]},
      { key: 'trat-tu-xay-dung', ten: 'Quản lý trật tự xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Điều 67: quản lý trật tự xây dựng',
          ghiChu: 'Theo Đ47 Luật XD 2025. Nội dung: kiểm tra điều kiện khởi công (Đ48 Luật XD); công trình có GPXD — theo nội dung GPXD; '
            + 'công trình miễn GPXD — kiểm tra điều kiện miễn, sự phù hợp quy hoạch và thiết kế tại BCNCKT đã thẩm định. '
            + 'Phát hiện vi phạm: yêu cầu dừng thi công, xử lý theo thẩm quyền hoặc kiến nghị xử lý.', trongTam: true },
        { loai: 'Nghị định', soHieu: '339/2026/NĐ-CP', ten: 'Xử phạt vi phạm hành chính trong lĩnh vực xây dựng, quản lý công trình HTKT, phát triển nhà, kinh doanh BĐS',
          hieuLuc: 'Ban hành 26/8/2026 · hiệu lực 26/8/2026',
          ghiChu: 'Thay NĐ 16/2022/NĐ-CP (hết hiệu lực từ 26/8/2026 — Đ90). Mức phạt quy định là của tổ chức; cá nhân bằng 1/2.', trongTam: true },
      ]},
      { key: 'tham-dinh-du-an', ten: 'Thẩm định dự án (BCNCKT)', vanBan: [
        { loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật XD — Điều 26–27: thẩm định BCNCKT, BCKTKT; Điều 29–30: thẩm định thiết kế',
          ghiChu: 'Cơ quan chuyên môn về xây dựng thẩm định BCNCKT theo khoản 4 Điều 27. '
            + 'Thiết kế triển khai sau khi dự án được phê duyệt do CHỦ ĐẦU TƯ thẩm định (Đ29 k1, Đ30).', trongTam: true },
        { loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Chương II Mục 3: lập, thẩm định dự án (Đ26–40)',
          ghiChu: 'Thẩm quyền Đ32–33; trình tự Đ36 (yêu cầu bổ sung một lần, tạm dừng, thông báo kết quả); '
            + 'thời hạn Đ37: nhóm A 25/20, nhóm B 20/16, nhóm C 15/12 ngày làm việc (có/không có công trình cấp I trở lên); '
            + 'nội dung, kết quả Đ38. Đ41: chủ đầu tư thẩm định thiết kế triển khai (Mẫu số 12 là văn bản của chủ đầu tư). '
            + 'Đ8 k1 điểm a: BIM với công trình xây mới từ cấp II trở lên kể từ giai đoạn lập BCNCKT.', trongTam: true },
        { loai: 'Thông tư', soHieu: '34/2026/TT-BXD', ten: 'Quy định chi tiết về cấp công trình xây dựng phục vụ quản lý hoạt động xây dựng',
          hieuLuc: 'Ban hành 25/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Thay TT 06/2021/TT-BXD. Phân cấp công trình (đặc biệt, I–IV) — căn cứ thời hạn thẩm định (Đ37 NĐ 217), '
            + 'thẩm quyền cấp GPXD (Đ53), đối tượng kiểm tra nghiệm thu, BIM. Tổng mức đầu tư KHÔNG phải tiêu chí xác định cấp công trình.', trongTam: true },
        ND_207_2026,
        // ── PCCC khi thẩm định dự án ĐTXD ──
        // Phòng QLHĐ-XD thẩm định dự án dân dụng, nhà ở, khu đô thị → nhiều công trình thuộc Phụ lục III NĐ 105/2025
        // (sửa bởi NĐ 347/2026). Thẩm định thiết kế PCCC tích hợp vào thẩm định BCNCKT (Đ6 k1 NĐ 105).
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP (sửa bởi 347/2026)', ten: 'Thẩm định thiết kế PCCC trong thẩm định BCNCKT',
          ghiChu: '⚠️ Công trình thuộc diện thẩm định BCNCKT tại cơ quan chuyên môn và thuộc Phụ lục III: Sở thẩm định thiết kế PCCC '
            + 'cùng lúc, trả kết quả cùng kết quả thẩm định BCNCKT (Đ6 k1, sửa bởi Đ12 NĐ 347/2026). '
            + 'Không yêu cầu chủ đầu tư nộp văn bản thẩm duyệt PCCC của Công an ở bước này — phần của Công an thuộc bước '
            + 'thiết kế triển khai (Đ9 k4 điểm a, sửa bởi Đ14 NĐ 347/2026). Tra ngưỡng từng loại công trình ở Phụ lục III bản gốc.', trongTam: true },
        QCVN_06,
      ]},
      { key: 'chung-chi-nha-thau', ten: 'Chứng chỉ hành nghề & nhà thầu nước ngoài', vanBan: [
        { loai: 'Nghị định', soHieu: '212/2026/NĐ-CP', ten: 'Chứng chỉ hành nghề cá nhân, công khai năng lực tổ chức, giấy phép nhà thầu nước ngoài',
          ghiChu: 'Chứng chỉ hành nghề cá nhân: Đ27–40 (cấp, thu hồi Đ29–30; thẩm quyền Đ31; điều kiện Đ33–38; hồ sơ Đ39; '
            + 'Hội đồng xét cấp Đ40); hiệu lực 10 năm. '
            + 'Tổ chức: không còn thủ tục cấp chứng chỉ năng lực — tự công khai thông tin năng lực trên CSDL quốc gia về hoạt động xây dựng, '
            + 'kể cả hạng/lĩnh vực theo chứng chỉ năng lực đã được cấp nếu có (Đ41). '
            + 'Nhà thầu nước ngoài: giấy phép hoạt động xây dựng (Đ42–49; hồ sơ, thẩm quyền Đ44; thu hồi Đ47).', trongTam: true },
        { loai: 'Thông tư', soHieu: '39/2026/TT-BXD', ten: 'Hệ thống thông tin, cơ sở dữ liệu quốc gia về hoạt động xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn NĐ 212/2026: đăng tải, tra cứu thông tin năng lực trên CSDL quốc gia; '
            + 'trách nhiệm cập nhật dữ liệu của Sở XD.' },
      ]},
      { key: 'thi-nghiem-chuyen-nganh', ten: 'Thí nghiệm chuyên ngành xây dựng', vanBan: [
        { loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Điều 14: quản lý vật liệu, sản phẩm, cấu kiện, thiết bị sử dụng cho công trình',
          ghiChu: 'Kiểm soát chủng loại, nguồn gốc, thông số kỹ thuật vật liệu trước khi đưa vào thi công.' },
        { loai: 'QCVN', soHieu: 'QCVN 16:2023/BXD', ten: 'Sản phẩm, hàng hóa vật liệu xây dựng',
          ghiChu: 'Hợp quy, thí nghiệm chứng nhận chất lượng sản phẩm VLXD.', trongTam: true },
        { loai: 'Thông tư', soHieu: '41/2026/TT-BXD', ten: 'Quản lý chất lượng sản phẩm, hàng hóa vật liệu xây dựng',
          hieuLuc: 'Ban hành 26/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Hướng dẫn NĐ 209/2026 và NĐ 207/2026: quản lý chất lượng sản phẩm, hàng hóa VLXD (hợp quy, chứng nhận). '
            + 'Bản trong kho không có quy định về phòng thí nghiệm chuyên ngành (LAS-XD) — tra văn bản riêng.' },
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
        { loai: 'Luật', soHieu: '16/2023/QH15', ten: 'Luật Giá', hieuLuc: 'Hiệu lực 01/7/2024',
          ghiChu: 'Nền quản lý giá. LƯU Ý: giá VLXD KHÔNG thuộc danh mục Nhà nước định giá/bình ổn — '
            + 'Sở XD khảo sát, công bố giá VLXD địa phương định kỳ theo pháp luật quản lý chi phí ĐTXD (NĐ 206/2026), '
            + 'không áp cơ chế định giá nhà nước.', trongTam: true },
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
        { loai: 'Luật', soHieu: '05/2007/QH12 (sửa đổi 78/2025/QH15)', ten: 'Luật Chất lượng sản phẩm, hàng hóa',
          hieuLuc: 'Luật sửa đổi 78/2025/QH15 hiệu lực 01/01/2026',
          ghiChu: 'Nền quản lý chất lượng sản phẩm, hàng hóa VLXD; phân loại nhóm 2 (có khả năng gây mất an toàn). '
            + 'Luật 78/2025 chi tiết bởi NĐ 37/2026/NĐ-CP.', trongTam: true },
        { loai: 'Luật', soHieu: '68/2006/QH11 (sửa đổi 70/2025/QH15)', ten: 'Luật Tiêu chuẩn và quy chuẩn kỹ thuật',
          hieuLuc: 'Luật sửa đổi 70/2025/QH15 hiệu lực 01/01/2026',
          ghiChu: 'Nền cho hệ thống TCVN/QCVN áp dụng với VLXD (căn cứ ban hành, công bố hợp chuẩn, hợp quy).' },
        { loai: 'QCVN', soHieu: 'QCVN 16:2023/BXD', ten: 'Sản phẩm, hàng hóa vật liệu xây dựng',
          ghiChu: 'Hợp quy, chứng nhận chất lượng sản phẩm VLXD trước khi lưu thông, sử dụng. '
            + 'Đối chiếu TT 41/2026/TT-BXD (hiệu lực 01/7/2026) về phạm vi quản lý chất lượng VLXD.' },
      ]},
    ],
  },

  // 7. PHÒNG PHÁT TRIỂN ĐÔ THỊ ─────────────────────────────────────────────────
  'phong-ptdt': {
    ma: 'PHONG_PTDT', ten: 'Phòng Phát triển đô thị', baseHref: '/dashboard/phong-ptdt', color: 'indigo',
    moTaPhong: 'Chương trình phát triển đô thị; phân loại đô thị; đô thị thông minh & tăng trưởng xanh; góp ý thẩm định dự án khu đô thị, khu vực phát triển đô thị; CSDL phát triển đô thị.',
    chung: [
      LUAT_QHDT_NT,
      LUAT_XD_2025,
      { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Quản lý đầu tư phát triển đô thị',
        // Đối chiếu bản hợp nhất 04/VBHN-BXD (rà soát 13/10/2026): Điều 3, 4, 5 đã bị bãi bỏ.
        ghiChu: 'Chương II — khu vực phát triển đô thị: hồ sơ đề xuất (Đ8, Đ10), thẩm định đề xuất (Đ9 k3–5, tối đa 30 ngày làm việc), '
          + 'kế hoạch thực hiện (Đ11), công bố (Đ12), quản lý (Đ13). '
          + 'Chương III — dự án ĐTPTĐT: quy hoạch chi tiết (Đ14), nghĩa vụ chủ đầu tư cấp 1, thứ cấp (Đ17–18), '
          + 'lấy ý kiến thẩm định của Sở XD khi chấp thuận chủ trương đầu tư dự án khu đô thị (Đ29), tiến độ (Đ34), '
          + 'hạ tầng xã hội (Đ35), bàn giao quản lý (Đ38). '
          + 'Riêng CHƯƠNG TRÌNH phát triển đô thị: thực hiện theo NĐ 35/2026/NĐ-CP.', trongTam: true },
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
          ghiChu: 'Chương II: chương trình phát triển đô thị cấp tỉnh lập theo giai đoạn 10 NĂM, rà soát sau 05 năm; '
            + 'kế hoạch phát triển đô thị theo giai đoạn 05 năm. Chương III: đô thị tăng trưởng xanh (tiêu chí Đ11, đánh giá Đ12), '
            + 'thích ứng biến đổi khí hậu (Đ13–16). Đ23: kinh phí lập chương trình, kế hoạch.', trongTam: true },
        { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Quản lý ĐTPTĐT — khu vực PTĐT, khu đô thị mới',
          ghiChu: 'Phần chương trình PTĐT chuyển sang NĐ 35/2026; NĐ 11/2013 tiếp tục áp dụng cho '
            + 'khu vực PTĐT, dự án khu đô thị mới, chuyển quyền sử dụng đất đã có hạ tầng.' },
        { loai: 'Luật', soHieu: 'Luật Quản lý phát triển đô thị (dự thảo)', ten: 'Đang xây dựng — theo dõi để cập nhật',
          ghiChu: 'Chưa có hiệu lực; hiện áp dụng NĐ 11/2013, NĐ 35/2026 và Luật QHĐT-NT 47/2024 (sửa đổi 144/2025). '
            + 'Dự kiến trình QH khoá XVI — sẽ thay NĐ 11/2013.' },
      ]},
      { key: 'phan-loai-do-thi', ten: 'Phân loại đô thị', vanBan: [
        { loai: 'Nghị quyết', soHieu: '111/2025/UBTVQH15', ten: 'Nghị quyết về phân loại đô thị',
          hieuLuc: 'Ban hành 24/12/2025 · hiệu lực 01/01/2026',
          ghiChu: 'THAY NQ 1210/2016 và NQ 26/2022. Còn 4 loại đô thị (đặc biệt, I, II, III — BỎ loại IV, V) từ 01/01/2026; '
            + '3 nhóm tiêu chí mới: vai trò – vị trí, điều kiện phát triển KT-XH, quy mô – mật độ – hạ tầng; '
            + 'phù hợp mô hình chính quyền 2 cấp sau sáp nhập ĐVHC.', trongTam: true },
        { loai: 'Nghị định', soHieu: '35/2026/NĐ-CP', ten: 'Chi tiết NQ 111/2025 — hồ sơ, trình tự công nhận loại đô thị',
          ghiChu: 'Chương IV: trường hợp lập đề án công nhận loại đô thị, báo cáo đánh giá trình độ phát triển đô thị (Đ18); '
            + 'hồ sơ (Đ19); trình tự công nhận đô thị loại I (Đ20), loại II, III (Đ21), trình độ phát triển đô thị (Đ22).', trongTam: true },
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
          ghiChu: 'Đề án giai đoạn 2018–2025 (đã hết giai đoạn) — nay khung pháp lý chính là NĐ 269/2025 và TT 03/2026. '
            + 'Trụ cột: CSDL không gian đô thị, ICT/IoT, quản trị và dịch vụ đô thị thông minh.' },
        { loai: 'Quyết định', soHieu: '84/QĐ-TTg', ten: 'Kế hoạch phát triển đô thị tăng trưởng xanh VN đến 2030',
          ghiChu: 'Giảm phát thải KNK, tiết kiệm năng lượng, sử dụng VLXD xanh, hạ tầng xanh trong PTĐT.' },
        { loai: 'Luật', soHieu: '72/2020/QH14 (sửa đổi 146/2025)', ten: 'Luật Bảo vệ môi trường',
          hieuLuc: 'Luật 146/2025/QH15 sửa đổi, hiệu lực 01/01/2026',
          ghiChu: 'Bảo vệ môi trường đô thị, phân loại chất thải rắn sinh hoạt; ĐTM dự án phát triển đô thị '
            + '(trình đồng thời với BCNCKT — Đ34 k2 sau sửa đổi).' },
      ]},
      { key: 'tham-dinh-htkt-khu-do-thi', ten: 'Góp ý thẩm định dự án khu đô thị', vanBan: [
        // ⚠️ Rà soát 13/10/2026: bản trước ghi "Điều 11 NĐ 11/2013: Sở XD thẩm định HTKT khu ĐT mới" — SAI.
        // Điều 11 là "Nội dung kế hoạch thực hiện khu vực phát triển đô thị"; NĐ 11/2013 không có thủ tục Sở thẩm định
        // thiết kế HTKT. Vai trò thật của Sở: góp ý thẩm định chủ trương (Đ29) và thẩm định BCNCKT theo NĐ 217/2026.
        { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Đ29: lấy ý kiến thẩm định của Sở XD khi chấp thuận chủ trương đầu tư dự án khu đô thị',
          ghiChu: 'Dự án thuộc thẩm quyền chấp thuận chủ trương của UBND tỉnh: cơ quan đăng ký đầu tư lấy ý kiến thẩm định '
            + 'của Sở Xây dựng về các nội dung tại khoản 3, 4 Điều 29 (dự án khu đô thị có nhà ở: như dự án nhà ở theo pháp luật về nhà ở). '
            + 'Chấp thuận chủ trương thực hiện theo pháp luật về đầu tư (k1).', trongTam: true },
        { loai: 'Nghị định', soHieu: '11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', ten: 'Đ14–18, Đ35, Đ38: yêu cầu đối với dự án khu đô thị',
          ghiChu: 'Quy hoạch chi tiết của dự án (Đ14); quản lý thực hiện đầu tư xây dựng (Đ15); nghĩa vụ chủ đầu tư cấp 1 '
            + 'đầu tư đồng bộ hạ tầng (Đ17), chủ đầu tư thứ cấp (Đ18); hạ tầng xã hội (Đ35); bàn giao quản lý (Đ38).' },
        ND_217_2026,
        QCVN_01_2021,
        { loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD', ten: 'Hệ thống công trình hạ tầng kỹ thuật',
          ghiChu: 'Thay bộ QCVN 07-1÷07-10:2016/BXD (07-1 cấp nước, 07-2 thoát nước, 07-3 hào và tuy nen kỹ thuật, 07-4 giao thông, '
            + '07-5 cấp điện, 07-7 chiếu sáng, 07-8 viễn thông, 07-9 chất thải rắn, 07-10 nghĩa trang). '
            + 'Bản trước gán sai số phần (07-3 cấp điện, 07-4 chiếu sáng...).', trongTam: true },
        // ── PCCC khu đô thị ── hạng mục thuộc Phụ lục III NĐ 105/2025 (sửa bởi NĐ 347/2026) được thẩm định thiết kế
        // PCCC tích hợp khi thẩm định BCNCKT của từng dự án/công trình (Đ6 k1 NĐ 105). Ngưỡng: tra bản gốc.
        { loai: 'Nghị định', soHieu: '105/2025/NĐ-CP (sửa bởi 347/2026)', ten: 'PCCC trong dự án khu đô thị',
          ghiChu: 'Kiểm tra hạ tầng phục vụ chữa cháy trong quy hoạch, thiết kế khu đô thị: nguồn nước, trụ nước chữa cháy, '
            + 'đường và bãi đỗ cho xe chữa cháy, khoảng cách an toàn PCCC (QCVN 06). Hạng mục thuộc Phụ lục III được thẩm định '
            + 'thiết kế PCCC tích hợp khi thẩm định BCNCKT (Đ6 k1, sửa bởi NĐ 347/2026).', trongTam: true },
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
        { loai: 'Luật', soHieu: '23/2004/QH11 (sửa đổi 48/2014/QH13; hợp nhất 56/VBHN-VPQH 2026)', ten: 'Luật GTĐTNĐ — đăng ký, đăng kiểm phương tiện thủy nội địa',
          ghiChu: 'Điều 24–26: đăng ký phương tiện thủy nội địa — thẩm quyền Sở GTVT/XD. '
            + 'Điều 27–29: đăng kiểm — an toàn kỹ thuật, bảo vệ MT, trung tâm đăng kiểm. '
            + 'Điều 30: giấy chứng nhận an toàn kỹ thuật phương tiện.', trongTam: true },
        { loai: 'Nghị định', soHieu: '123/2026/NĐ-CP', ten: 'Quy định chi tiết Luật Giao thông đường thủy nội địa',
          hieuLuc: 'Hiệu lực 2026',
          ghiChu: 'Chi tiết Luật GTĐTNĐ (thay/hợp nhất các NĐ cũ về đường thủy). '
            + 'Đăng ký phương tiện thủy nội địa: phân cấp Sở XD cấp tỉnh; điều kiện KD vận tải đường thủy.' },
        { loai: 'Thông tư', soHieu: '28/2026/TT-BXD', ten: 'Quy định về đăng kiểm phương tiện thủy nội địa',
          hieuLuc: 'Hiệu lực 2026',
          ghiChu: 'Trình tự, hồ sơ đăng kiểm an toàn kỹ thuật & bảo vệ môi trường phương tiện thủy nội địa; '
            + 'chứng nhận, tem kiểm định phương tiện thủy.' },
        { loai: 'Thông tư', soHieu: '43/2026/TT-BXD', ten: 'Đăng kiểm viên phương tiện thủy nội địa và nhân viên nghiệp vụ kiểm tra',
          hieuLuc: 'Ban hành 29/6/2026',
          ghiChu: 'Tiêu chuẩn, tập huấn, công nhận đăng kiểm viên phương tiện thủy nội địa.' },
      ]},
      { key: 'dang-kiem-xe-co-gioi', ten: 'Đăng kiểm xe cơ giới, xe máy chuyên dùng', vanBan: [
        { loai: 'Nghị định', soHieu: '89/2026/NĐ-CP', ten: 'Điều kiện kinh doanh dịch vụ kiểm định xe cơ giới; tổ chức, hoạt động của cơ sở đăng kiểm; niên hạn sử dụng của xe cơ giới',
          hieuLuc: 'Hiệu lực 01/7/2026',
          ghiChu: 'Điều kiện cơ sở đăng kiểm (diện tích, dây chuyền, tối thiểu 02 đăng kiểm viên; lãnh đạo bộ phận kiểm định ≥ 60 tháng kinh nghiệm). '
            + 'KHÔNG áp dụng cho hoạt động thuộc Bộ Quốc phòng, Bộ Công an. '
            + 'Cơ quan QLNN cấp tỉnh (Sở XD) quản lý, kiểm tra hoạt động cơ sở đăng kiểm trên địa bàn.', trongTam: true },
        { loai: 'Thông tư', soHieu: '30/2026/TT-BXD', ten: 'Kiểm định xe cơ giới, xe máy chuyên dùng; kiểm định khí thải mô tô, xe máy',
          hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
          ghiChu: 'Trình tự kiểm định, miễn kiểm định lần đầu; chứng nhận xe cải tạo; '
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
      { loai: 'Thông tư', soHieu: '16/2025/TT-BXD (sửa đổi 43/2025/TT-BXD)', ten: 'Quy định chi tiết một số điều của Luật Quy hoạch đô thị và nông thôn',
        hieuLuc: 'TT 16/2025 ban hành 30/6/2025 · TT 43/2025 (09/12/2025) sửa đổi — bắt buộc hồ sơ điện tử từ 09/12/2025',
        ghiChu: 'Hướng dẫn nội dung, hồ sơ nhiệm vụ & đồ án quy hoạch. '
          + 'TT 43/2025 sửa Điều 2: hồ sơ QH gồm hồ sơ GIẤY (đóng dấu) + hồ sơ ĐIỆN TỬ '
          + '(CSDL số cơ bản, CSDL số pháp lý, CSDL số địa lý GIS).', trongTam: true },
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
            + 'Điều 35–38: phê duyệt — UBND tỉnh phê duyệt QH chung đô thị loại III (trở xuống theo phân cấp), QH nông thôn.', trongTam: true },
        { loai: 'Nghị định', soHieu: '178/2025/NĐ-CP', ten: 'Chi tiết thẩm định QH — hồ sơ, trình tự',
          ghiChu: 'Hồ sơ trình thẩm định; quy cách bản vẽ QH; lấy ý kiến phối hợp các sở ngành; '
            + 'nội dung nhiệm vụ QH cần phê duyệt trước khi lập đồ án.', trongTam: true },
        { loai: 'Quyết định', soHieu: '18/2025/QĐ-TTg', ten: 'Trình tự, thủ tục phê duyệt điều chỉnh cục bộ QHĐT-NT thuộc thẩm quyền Thủ tướng, do UBND tỉnh tổ chức lập',
          hieuLuc: 'Ban hành 28/6/2025 · hiệu lực 01/7/2025',
          ghiChu: 'Áp dụng khi điều chỉnh CỤC BỘ quy hoạch (đô thị/nông thôn) vốn do Thủ tướng phê duyệt: '
            + 'UBND cấp tỉnh lập hồ sơ (hoặc phân cấp cơ quan chuyên môn), thẩm định, phê duyệt và công bố công khai '
            + 'toàn bộ nội dung điều chỉnh (trừ nội dung QP-AN, bí mật nhà nước).' },
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
        ghiChu: 'Thay Luật KD BĐS 2014 (hiệu lực sớm 01/8/2024 theo Luật 43/2024/QH15). '
          + 'Điều kiện tổ chức/cá nhân KD BĐS: BỎ mức vốn pháp định cố định của luật cũ; '
          + 'chủ đầu tư dự án phải bảo đảm TỶ LỆ VỐN CHỦ SỞ HỮU theo pháp luật đất đai (20%/15%). '
          + 'Kinh doanh nhà ở/công trình hình thành trong tương lai: đặt cọc ≤ 5% giá bán/thuê mua. '
          + 'Dịch vụ BĐS — môi giới, sàn giao dịch, tư vấn, quản lý: '
          + 'giao dịch qua sàn KHÔNG bắt buộc (Nhà nước khuyến khích). '
          + 'Môi giới: cá nhân phải có chứng chỉ hành nghề (do Sở XD tổ chức thi, cấp) và hành nghề trong một doanh nghiệp.', trongTam: true },
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
        { loai: 'Nghị định', soHieu: '98/2024/NĐ-CP', ten: 'Chi tiết Luật Nhà ở về cải tạo, xây dựng lại nhà chung cư',
          hieuLuc: 'Ban hành 25/7/2024 · hiệu lực 01/8/2024',
          ghiChu: 'Thay NĐ 69/2021/NĐ-CP. Kiểm định, đánh giá chất lượng chung cư; lập, phê duyệt kế hoạch cải tạo; '
            + 'lựa chọn chủ đầu tư dự án cải tạo, xây dựng lại; phương án bồi thường, tái định cư (hệ số K). '
            + 'Sở XD tham mưu UBND tỉnh ban hành kế hoạch cải tạo chung cư cũ trên địa bàn.', trongTam: true },
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
          ghiChu: 'Nguyên tắc KD BĐS — công khai, minh bạch. '
            + 'Điều kiện KD BĐS: thành lập doanh nghiệp/HTX; BỎ vốn pháp định cố định — chủ đầu tư dự án bảo đảm '
            + 'tỷ lệ vốn chủ sở hữu theo pháp luật đất đai. '
            + 'Sàn giao dịch BĐS: giao dịch qua sàn KHÔNG bắt buộc (khuyến khích), sàn phải công khai thông tin. '
            + 'Môi giới BĐS: cá nhân phải có chứng chỉ hành nghề do Sở XD tổ chức thi, cấp; hành nghề trong một doanh nghiệp.', trongTam: true },
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
