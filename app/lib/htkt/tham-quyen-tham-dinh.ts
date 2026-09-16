// THẨM QUYỀN THẨM ĐỊNH & KIỂM TRA NGHIỆM THU — chép từ bản gốc trong kho VBPL của Sở.
//
// ⚠️ KẾT LUẬN QUAN TRỌNG: KHÔNG tồn tại bảng ánh xạ "cấp công trình → cơ quan có thẩm quyền".
// Bảng cũ trong hệ thống từng gán "Cấp I–II → Sở XD, Cấp III–IV → HĐNT/Chủ đầu tư" là SAI MÔ HÌNH:
// - NĐ 217/2026 Điều 32 phân thẩm quyền thẩm định BCNCKT theo LOẠI DỰ ÁN (đầu tư công / PPP /
//   đầu tư kinh doanh quy mô lớn / có công trình thuộc Phụ lục IV), theo CƠ QUAN CHỦ QUẢN và
//   theo ĐỊA BÀN — KHÔNG có bảng ánh xạ "cấp nào → cơ quan nào".
// - NĐ 207/2026 Điều 26 phân thẩm quyền kiểm tra nghiệm thu cũng theo cơ quan/địa bàn.
//
// NHƯNG cấp công trình VẪN THAM GIA, theo cách khác — đừng nói "thẩm quyền không liên quan cấp":
//   + Đ32 khoản 2 NĐ 217 và Đ26 khoản 1 điểm b NĐ 207: công trình CẤP ĐẶC BIỆT → cơ quan chuyên
//     môn thuộc bộ (đây là quy tắc ánh xạ theo cấp duy nhất).
//   + Đ33 khoản 3 NĐ 217: dự án nhiều công trình khác loại, khác cấp thì thẩm quyền xác định theo
//     công trình chính, hoặc CÔNG TRÌNH CHÍNH CÓ CẤP CAO NHẤT nếu có nhiều công trình chính.
//   + Đ33 khoản 4: dự án thành phần độc lập → theo nhóm dự án thành phần VÀ CẤP CỦA CÔNG TRÌNH
//     thuộc dự án thành phần đó.
//   + Đ33 khoản 5: phân chia không độc lập / trình theo giai đoạn → theo quy mô nhóm VÀ CẤP CÔNG
//     TRÌNH của TOÀN BỘ dự án.
//   + Đ33 khoản 6: dự án sửa chữa, cải tạo → theo quy mô của công trình sửa chữa, cải tạo.
//   + Đ26 khoản 3 NĐ 207: dự án nhiều công trình khác loại, khác cấp → cơ quan kiểm tra là cơ quan
//     có thẩm quyền với CÔNG TRÌNH CHÍNH CÓ CẤP CAO NHẤT.
//   ⇒ Cấp công trình quyết định LẤY CÔNG TRÌNH NÀO làm căn cứ, chứ không tự nó chỉ ra cơ quan.
//
// Cái THỰC SỰ khoá theo cấp công trình là NGƯỠNG THUỘC DIỆN: Phụ lục IV NĐ 217/2026
// (danh mục công trình ảnh hưởng lớn đến an toàn, lợi ích cộng đồng). Ngưỡng đó vừa là điều kiện
// để dự án đầu tư kinh doanh phải qua cơ quan chuyên môn thẩm định (Đ32 khoản 1 điểm d), vừa là
// đối tượng phải kiểm tra công tác nghiệm thu (NĐ 207/2026 Điều 25 khoản 1 điểm b).
//
// Nguồn (đọc trực tiếp, không lấy theo trí nhớ):
//   217_2026_ND-CP_Quan ly hoat dong xay dung (Cong bao).docx — Điều 32, 33, Phụ lục IV
//   207_2026_ND-CP_Huong dan Luat XD ve quan ly chat luong, thi cong xay dung va bao tri...docx
//     — Điều 25, Điều 26, Phụ lục IX

import type { LinhVucKey } from './phap-ly'
import type { CapCongTrinhTT34 } from './cap-cong-trinh-tt34'
import { THU_TU_CAP } from './cap-cong-trinh-tt34'

export const ND217 = {
  so: '217/2026/NĐ-CP',
  ten: 'Nghị định quy định chi tiết một số điều của Luật Xây dựng về quản lý hoạt động xây dựng',
  ngay: '19/6/2026',
} as const

export const ND207 = {
  so: '207/2026/NĐ-CP',
  ten: 'Nghị định hướng dẫn Luật Xây dựng về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
} as const

/**
 * Một dòng của Phụ lục IV NĐ 217/2026 — danh mục công trình ảnh hưởng lớn đến an toàn,
 * lợi ích cộng đồng. `nguong` chép NGUYÊN VĂN cột "Cấp công trình".
 */
export type DongPhuLucIV = {
  ma: string
  ten: string
  /** Mô tả chi tiết ở cột giữa (nếu bản gốc có). */
  chiTiet?: string
  linhVuc: LinhVucKey[]
  /** Nguyên văn ô "Cấp công trình", vd "Cấp II trở lên" / "Mọi cấp". */
  nguong: string
  /** Cấp thấp nhất còn thuộc danh mục; null = mọi cấp đều thuộc. */
  capThapNhat: CapCongTrinhTT34 | null
}

// Phụ lục IV — chỉ chép các dòng liên quan hạ tầng kỹ thuật và giao thông đô thị.
export const PHU_LUC_IV_HTKT: DongPhuLucIV[] = [
  { ma: 'III.1', ten: 'Công trình cấp nước', linhVuc: ['cap-nuoc'], nguong: 'Cấp II trở lên', capThapNhat: 'II' },
  { ma: 'III.2', ten: 'Công trình thoát nước', linhVuc: ['thoat-nuoc'], nguong: 'Cấp II trở lên', capThapNhat: 'II' },
  {
    ma: 'III.4', ten: 'Công trình hạ tầng kỹ thuật viễn thông thụ động',
    chiTiet: 'Nhà, trạm viễn thông, cột ăng ten, cột treo cáp',
    linhVuc: ['su-dung-chung'], nguong: 'Cấp II trở lên', capThapNhat: 'II',
  },
  { ma: 'III.5', ten: 'Nhà tang lễ; cơ sở hỏa táng', linhVuc: ['nghia-trang'], nguong: 'Cấp II trở lên', capThapNhat: 'II' },
  {
    ma: 'III.6', ten: 'Nhà để xe (ngầm và nổi); cống, bể, hào, hầm tuy nen kỹ thuật',
    linhVuc: ['khong-gian-ngam', 'su-dung-chung'], nguong: 'Cấp II trở lên', capThapNhat: 'II',
  },
  {
    ma: 'IV.1.a', ten: 'Đường bộ — đường ô tô cao tốc',
    chiTiet: 'Bản gốc ghi "Mọi cấp" — KHÔNG áp ngưỡng Cấp II trở lên cho loại này.',
    linhVuc: [], nguong: 'Mọi cấp', capThapNhat: null,
  },
  {
    ma: 'IV.1.b', ten: 'Đường bộ — đường ô tô, đường trong đô thị',
    chiTiet: 'Cùng mục IV.1 còn có bến phà; bến xe, cơ sở đăng kiểm, trạm thu phí, trạm dừng nghỉ; cầu (đường bộ, bộ hành, đường sắt, cầu phao); hầm đường ô tô, hầm đường sắt, hầm cho người đi bộ — đều "Cấp II trở lên". Riêng hầm tàu điện ngầm (Metro) và đường sắt: "Mọi cấp".',
    linhVuc: ['giao-thong-do-thi'], nguong: 'Cấp II trở lên', capThapNhat: 'II',
  },
  {
    // Có trong phần III (hạ tầng kỹ thuật) của Phụ lục IV nhưng KHÔNG nằm trong 8 lĩnh vực đang
    // khai ở phap-ly.ts → để linhVuc rỗng: hiện ra để cán bộ thấy, nhưng không khớp khi tra theo
    // lĩnh vực. Phòng HTKT vẫn hay gặp nên không được giấu đi.
    ma: 'III.3', ten: 'Công trình xử lý chất thải rắn',
    chiTiet: 'Không thuộc 8 lĩnh vực HTKT đang khai trong hệ thống — tra thủ công.',
    linhVuc: [], nguong: 'Cấp II trở lên', capThapNhat: 'II',
  },
]

/**
 * Phụ lục IX NĐ 207/2026 — DANH MỤC CÔNG TRÌNH QUY MÔ LỚN, KỸ THUẬT PHỨC TẠP.
 * Đ25 khoản 1 điểm a gồm HAI trường hợp THAY THẾ nhau (bản gốc ngăn bằng dấu phẩy, KHÔNG phải
 * điều kiện đồng thời): công trình thuộc dự án quan trọng quốc gia, HOẶC công trình quy mô lớn,
 * kỹ thuật phức tạp theo Phụ lục IX. Cả hai đều do
 * HỘI ĐỒNG KIỂM TRA NHÀ NƯỚC về công tác nghiệm thu kiểm tra — NĐ 207 Đ25 khoản 1 điểm a,
 * Đ26 khoản 1 điểm a. Khác hẳn nhánh Phụ lục IV (điểm b) do cơ quan chuyên môn kiểm tra.
 *
 * Chép đủ cả 6 dòng dù phần lớn ngoài phạm vi HTKT, để lần sau khỏi phải đoán.
 */
export type DongPhuLucIX = {
  stt: number
  ten: string
  tieuChi: string
  quyMo: string
  /** Rỗng = không thuộc 8 lĩnh vực HTKT đang khai trong hệ thống. */
  linhVuc: LinhVucKey[]
}

export const PHU_LUC_IX_207: DongPhuLucIX[] = [
  { stt: 1, ten: 'Cảng hàng không', tieuChi: 'Lượt hành khách (triệu khách/năm)', quyMo: '≥ 25', linhVuc: [] },
  { stt: 2, ten: 'Đường sắt tốc độ cao', tieuChi: 'Tầm quan trọng', quyMo: 'Với mọi quy mô', linhVuc: [] },
  // Dòng DUY NHẤT của Phụ lục IX CÓ THỂ chạm tới hạ tầng kỹ thuật đô thị. Bản gốc ghi "Cầu" chung,
  // không giới hạn cầu quốc gia hay cầu đô thị — nên gán vào giao-thong-do-thi chỉ là "có thể liên
  // quan" trong phạm vi 8 lĩnh vực đang khai, KHÔNG phải quan hệ pháp lý duy nhất.
  { stt: 3, ten: 'Cầu', tieuChi: 'Nhịp kết cấu lớn nhất (m)', quyMo: '≥ 350', linhVuc: ['giao-thong-do-thi'] },
  { stt: 4, ten: 'Cảng biển', tieuChi: 'Tải trọng của tàu (DWT)', quyMo: '≥ 100.000', linhVuc: [] },
  { stt: 5, ten: 'Nhà máy điện hạt nhân', tieuChi: 'Tổng công suất (MW)', quyMo: '≥ 1.000', linhVuc: [] },
  { stt: 6, ten: 'Công trình thủy điện, công trình nhiệt điện', tieuChi: 'Tổng công suất (MW)', quyMo: '≥ 1.000', linhVuc: [] },
]

/**
 * Các nhánh thẩm quyền KIỂM TRA CÔNG TÁC NGHIỆM THU — NĐ 207/2026 Điều 26.
 * Chép rút gọn nhưng giữ đúng điều khoản; KHÔNG suy diễn. Dùng để cán bộ đối chiếu, vì công cụ
 * không đủ dữ kiện (cơ quan chủ quản, địa bàn, nguồn vốn) để tự chỉ ra cơ quan nào.
 */
export const NHANH_THAM_QUYEN_KIEM_TRA: { dieuKhoan: string; coQuan: string; truongHop: string }[] = [
  { dieuKhoan: 'Đ26 k1 điểm a', coQuan: 'Hội đồng kiểm tra nhà nước về công tác nghiệm thu', truongHop: 'Công trình thuộc Đ25 khoản 1 điểm a (dự án quan trọng quốc gia, HOẶC công trình quy mô lớn/kỹ thuật phức tạp theo Phụ lục IX).' },
  { dieuKhoan: 'Đ26 k1 điểm b', coQuan: 'Cơ quan chuyên môn về xây dựng thuộc bộ quản lý công trình xây dựng chuyên ngành', truongHop: 'Công trình do Thủ tướng Chính phủ giao; công trình CẤP ĐẶC BIỆT thuộc chuyên ngành quản lý; công trình xây dựng trên địa bàn từ hai tỉnh, thành phố trở lên.' },
  { dieuKhoan: 'Đ26 k1 điểm c', coQuan: 'Cơ quan chuyên môn về xây dựng thuộc UBND cấp tỉnh', truongHop: 'Các loại công trình trên địa bàn thuộc phạm vi quản lý, trừ công trình nêu ở điểm a và b. ĐÂY LÀ NHÁNH THƯỜNG GẶP của Sở Xây dựng.' },
  { dieuKhoan: 'Đ26 k2 điểm a', coQuan: 'Cơ quan chuyên môn thuộc bộ quản lý công trình chuyên ngành', truongHop: 'Công trình do chính bộ đó quyết định đầu tư, thuộc chuyên ngành quản lý.' },
  { dieuKhoan: 'Đ26 k2 điểm b', coQuan: 'Cơ quan chuyên môn thuộc Bộ Xây dựng', truongHop: 'Công trình lĩnh vực hàng không, đường sắt quốc gia và hàng hải (trừ trường hợp điểm đ).' },
  { dieuKhoan: 'Đ26 k2 điểm c', coQuan: 'Cơ quan chuyên môn thuộc Bộ Nông nghiệp và Môi trường', truongHop: 'Công trình thủy lợi, đê điều có mục tiêu đầu tư và phạm vi khai thác, bảo vệ liên quan từ 02 tỉnh trở lên.' },
  { dieuKhoan: 'Đ26 k2 điểm d', coQuan: 'Cơ quan chuyên môn thuộc Bộ Công Thương', truongHop: 'Công trình theo chức năng quản lý được xây dựng trên biển, ngoài phạm vi quản lý của UBND cấp tỉnh.' },
  { dieuKhoan: 'Đ26 k2 điểm đ', coQuan: 'Cơ quan chuyên môn thuộc Bộ Quốc phòng, Bộ Công an', truongHop: 'Công trình phục vụ quốc phòng, an ninh và công trình theo điểm b khoản 1 Điều 69 Luật Xây dựng 135/2025.' },
  { dieuKhoan: 'Đ26 k2 điểm e', coQuan: 'Cơ quan chuyên môn thuộc UBND cấp tỉnh', truongHop: 'Công trình thuộc dự án do UBND cấp tỉnh là cơ quan chủ quản (đầu tư công) hoặc cơ quan có thẩm quyền (PPP); trừ công trình Thủ tướng giao cho bộ và các trường hợp điểm b, c, d.' },
  { dieuKhoan: 'Đ26 k2 điểm g', coQuan: 'Cơ quan chuyên môn thuộc UBND TP Hà Nội, TP Hồ Chí Minh', truongHop: 'Công trình trên địa bàn hành chính của mình, trừ điểm a, b, c, d và công trình cấp đặc biệt do người đứng đầu cơ quan trung ương quyết định đầu tư.' },
  { dieuKhoan: 'Đ26 k2 điểm h', coQuan: 'Theo pháp luật về đất đai', truongHop: 'Công trình hoặc hạng mục lấn biển của dự án đầu tư lấn biển; các hạng mục còn lại theo Nghị định này.' },
  { dieuKhoan: 'Đ26 k4', coQuan: 'Cơ quan chuyên môn thuộc UBND cấp tỉnh đã thẩm định BCNCKT', truongHop: 'Công trình trên địa bàn từ 02 tỉnh trở lên nhưng KHÔNG thuộc thẩm quyền kiểm tra của cơ quan chuyên môn thuộc bộ — chủ đầu tư gửi thông báo khởi công và báo cáo hoàn thành tới cơ quan này.' },
]

export type KetQuaThamQuyen = {
  /** Có thuộc danh mục Phụ lục IV NĐ 217/2026 không. null = lĩnh vực không có dòng nào trong PL IV. */
  thuocPhuLucIV: boolean | null
  dongPhuLucIV: DongPhuLucIV | null
  /** Dòng Phụ lục IX có thể liên quan lĩnh vực này (nếu có) — nhánh Hội đồng kiểm tra nhà nước. */
  dongPhuLucIX: DongPhuLucIX | null
  /** Diễn giải hệ quả, mỗi ý kèm điều khoản. */
  heQua: string[]
  canhBao: string[]
}

function capTuCapTroLen(cap: CapCongTrinhTT34, capThapNhat: CapCongTrinhTT34 | null): boolean {
  if (capThapNhat === null) return true
  return THU_TU_CAP.indexOf(cap) <= THU_TU_CAP.indexOf(capThapNhat)
}

/**
 * Tra hệ quả pháp lý theo lĩnh vực + cấp công trình.
 *
 * KHÔNG trả lời "ai thẩm định" — câu đó phụ thuộc loại dự án, cơ quan chủ quản và địa bàn
 * (Điều 32, 33 NĐ 217/2026), không suy ra được từ lĩnh vực và cấp. Hàm này chỉ trả lời
 * câu suy ra được: công trình có thuộc danh mục Phụ lục IV hay không, và hệ quả kèm theo.
 */
export function traHeQuaThamQuyen(linhVuc: LinhVucKey, cap: CapCongTrinhTT34): KetQuaThamQuyen {
  const dong = PHU_LUC_IV_HTKT.find((d) => d.linhVuc.includes(linhVuc)) ?? null
  const dongIX = PHU_LUC_IX_207.find((d) => d.linhVuc.includes(linhVuc)) ?? null

  const canhBao: string[] = [
    `Thẩm quyền THẨM ĐỊNH (ai thẩm định) xác định theo Điều 32, 33 NĐ ${ND217.so} — căn cứ loại dự án (đầu tư công/PPP/đầu tư kinh doanh), cơ quan chủ quản và địa bàn, KHÔNG suy ra được từ cấp công trình.`,
    `Cấp công trình VẪN tham gia nhưng theo cách khác: công trình CẤP ĐẶC BIỆT → cơ quan chuyên môn thuộc bộ (Đ32 khoản 2 NĐ ${ND217.so}; Đ26 khoản 1 điểm b NĐ ${ND207.so}); dự án nhiều công trình thì lấy CÔNG TRÌNH CHÍNH CÓ CẤP CAO NHẤT làm căn cứ (Đ33 khoản 3 NĐ ${ND217.so}; Đ26 khoản 3 NĐ ${ND207.so}); dự án thành phần / phân kỳ / sửa chữa cải tạo có quy tắc riêng (Đ33 khoản 4, 5, 6).`,
    'Trong nhóm giao thông của Phụ lục IV có tiểu mục ghi "Mọi cấp" (đường ô tô cao tốc, đường sắt, hầm Metro, hàng không) — không được suy mọi công trình giao thông đều là "Cấp II trở lên".',
    `Nhánh RIÊNG: công trình thuộc dự án quan trọng quốc gia và công trình quy mô lớn, kỹ thuật phức tạp (Phụ lục IX NĐ ${ND207.so}) do HỘI ĐỒNG KIỂM TRA NHÀ NƯỚC kiểm tra, không phải cơ quan chuyên môn (Đ25 khoản 1 điểm a; Đ26 khoản 1 điểm a). Phụ lục IX gồm 6 loại: cảng hàng không, đường sắt tốc độ cao, cầu, cảng biển, nhà máy điện hạt nhân, thủy điện/nhiệt điện.`,
  ]

  if (!dong) {
    return {
      thuocPhuLucIV: null,
      dongPhuLucIV: null,
      dongPhuLucIX: dongIX,
      heQua: [
        `Lĩnh vực này KHÔNG có dòng nào trong Phụ lục IV NĐ ${ND217.so} khớp được (các dòng đã chép: cấp nước, thoát nước, xử lý chất thải rắn, viễn thông thụ động, nhà tang lễ/hỏa táng, nhà để xe và cống bể hào tuy nen, đường bộ).`,
        'Không kết luận thay: phải mở Phụ lục IV bản gốc đối chiếu, vì công trình cụ thể có thể rơi vào dòng thuộc loại khác (dân dụng, công nghiệp, nông nghiệp và môi trường).',
      ],
      canhBao,
    }
  }

  const thuoc = capTuCapTroLen(cap, dong.capThapNhat)
  const heQua = thuoc
    ? [
        `Cấp ${cap} THUỘC danh mục Phụ lục IV (dòng ${dong.ma} — ${dong.ten}, ngưỡng "${dong.nguong}").`,
        `⇒ Thuộc diện phải KIỂM TRA CÔNG TÁC NGHIỆM THU: NĐ ${ND207.so} Điều 25 khoản 1 điểm b.`,
        `⇒ Với dự án ĐẦU TƯ KINH DOANH: thuộc diện cơ quan chuyên môn về xây dựng thẩm định BCNCKT (NĐ ${ND217.so} Điều 32 khoản 1 điểm d). Dự án đầu tư công và PPP đã thuộc diện thẩm định theo điểm a, b cùng khoản, không phụ thuộc danh mục này.`,
      ]
    : [
        `Cấp ${cap} KHÔNG thuộc danh mục Phụ lục IV (dòng ${dong.ma} — ${dong.ten}, ngưỡng "${dong.nguong}").`,
        `⇒ Không thuộc diện kiểm tra nghiệm thu theo NĐ ${ND207.so} Điều 25 khoản 1 điểm b (vẫn có thể thuộc điểm a — xem cảnh báo).`,
        `⇒ Dự án đầu tư kinh doanh không bị kéo vào diện thẩm định của cơ quan chuyên môn bởi điểm d; nhưng dự án đầu tư công và PPP thì VẪN thuộc diện thẩm định theo Điều 32 khoản 1 điểm a, b.`,
      ]

  if (dongIX) {
    heQua.push(
      `⚠️ Lĩnh vực này CÓ THỂ liên quan dòng ${dongIX.stt} Phụ lục IX NĐ ${ND207.so} (${dongIX.ten}, ${dongIX.tieuChi} ${dongIX.quyMo}). CHỈ áp dụng khi hạng mục đúng là ${dongIX.ten.toLowerCase()} VÀ đạt ngưỡng "${dongIX.quyMo}" — công cụ không nhận loại hạng mục và trị số này nên KHÔNG tự kết luận được. Đường đô thị, hay cầu dưới ngưỡng, KHÔNG thuộc dòng này. Nếu đạt ngưỡng thì rơi vào nhánh HỘI ĐỒNG KIỂM TRA NHÀ NƯỚC (Đ25 khoản 1 điểm a), loại trừ nhánh Phụ lục IV (điểm b ghi rõ "trừ các công trình đã nêu tại điểm a").`,
    )
  }

  return { thuocPhuLucIV: thuoc, dongPhuLucIV: dong, dongPhuLucIX: dongIX, heQua, canhBao }
}
