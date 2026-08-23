// CƠ SỞ PHÁP LÝ quản lý công chức, viên chức, người lao động — dùng cho chatbot và dashboard.
// Mỗi mục: trích yếu + điều/khoản/điểm + HIỆU LỰC TỪ NGÀY … (đến ngày … nếu đã/ sẽ hết hiệu lực).
// Người làm lương/quản lý đối chiếu để cập nhật ĐÚNG nội dung. Khi văn bản mới thay thế, cập nhật tại đây.
//
// LƯU Ý: đây là tóm tắt phục vụ tra cứu nhanh — KHÔNG thay thế văn bản gốc; luôn đối chiếu bản chính thức.

export type VanBanPhapLy = {
  soHieu: string         // VD "Nghị định 62/2020/NĐ-CP"
  ngayBanHanh: string    // dd/mm/yyyy
  hieuLucTu: string      // dd/mm/yyyy
  hieuLucDen?: string    // để trống = còn hiệu lực ("hiện hành")
  thayTheBoi?: string    // văn bản thay thế — BẮT BUỘC điền khi có hieuLucDen
  canhBao?: string       // cảnh báo cần đối chiếu (chưa khẳng định được hiệu lực)
  trichYeu: string       // trích yếu nội dung văn bản
  dieuKhoan?: string[]   // điều/khoản/điểm liên quan + nội dung tóm tắt
}

export type PhapLyMuc = {
  id: string
  tieuDe: string
  tuKhoa: string[]       // từ khoá để tìm
  yeuCauQuanLy: string   // việc người quản lý/làm lương phải làm
  vanBan: VanBanPhapLy[]
}

/**
 * Tìm VĂN BẢN trong cơ sở pháp lý nhân sự theo số hiệu hoặc tên gọi.
 *
 * Dùng cho tool tra_cuu_hieu_luc_van_ban: kho tài liệu chỉ có toàn văn một số văn bản, nhưng
 * tình trạng hiệu lực của các văn bản nhân sự (VD Luật Viên chức 58/2010 hết hiệu lực 01/7/2026)
 * đã được rà và mã hoá ở đây — không tra tới thì chatbot trả lời "không có trong kho" dù hệ thống
 * biết rõ (bắt được ngày 23/8/2026 khi hỏi "Luật Viên chức 2010 còn hiệu lực không?").
 */
export function timVanBanNhanSu(tuKhoa: string): Array<{ muc: string; vanBan: VanBanPhapLy }> {
  const tu = (tuKhoa || '').toLowerCase().trim()
  if (!tu) return []
  // Khớp theo TỪNG TỪ có nghĩa, không đòi khớp nguyên chuỗi: người dùng gõ "Luật Viên chức 2010"
  // còn dữ liệu ghi "Luật Viên chức 2010 (Luật 58/2010/QH12)". Bỏ các từ quá chung.
  const BO_QUA = new Set(['luật', 'nghị', 'định', 'thông', 'tư', 'số', 'năm', 'của', 'và', 'về'])
  const tuKhoaCon = tu.split(/[^\p{L}\p{N}/]+/u).filter((w) => w.length > 1 && !BO_QUA.has(w))
  const ra: Array<{ muc: string; vanBan: VanBanPhapLy }> = []
  const daCo = new Set<string>()
  for (const muc of CO_SO_PHAP_LY) {
    for (const vb of muc.vanBan) {
      const kho = `${vb.soHieu} ${vb.trichYeu}`.toLowerCase()
      const khop = kho.includes(tu) || (tuKhoaCon.length > 0 && tuKhoaCon.every((w) => kho.includes(w)))
      if (!khop || daCo.has(vb.soHieu)) continue
      daCo.add(vb.soHieu)
      ra.push({ muc: muc.tieuDe, vanBan: vb })
    }
  }
  return ra
}

export const CO_SO_PHAP_LY: PhapLyMuc[] = [
  {
    id: 'vi_tri_viec_lam',
    tieuDe: 'Vị trí việc làm (VTVL)',
    tuKhoa: ['vị trí việc làm', 'vtvl', 'vi tri viec lam', 'mô tả công việc', 'khung năng lực', 'biên chế'],
    yeuCauQuanLy:
      'NGƯỜI QUẢN LÝ PHẢI cập nhật VỊ TRÍ VIỆC LÀM cho TỪNG công chức/viên chức (gắn bản mô tả công việc + khung năng lực). ' +
      'Đây là căn cứ để xác định biên chế, tuyển dụng, bố trí, đánh giá và trả lương theo vị trí việc làm.',
    vanBan: [
      {
        soHieu: 'Luật Cán bộ, công chức năm 2025',
        ngayBanHanh: '24/6/2025',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Quản lý công chức theo VỊ TRÍ VIỆC LÀM; bỏ phân loại công chức theo ngạch là tiêu chí duy nhất, liên thông cán bộ, công chức cấp xã với cấp tỉnh.',
        dieuKhoan: [
          'Nguyên tắc: bố trí, sử dụng công chức theo vị trí việc làm và chỉ tiêu biên chế được giao.',
        ],
      },
      {
        soHieu: 'Nghị định 62/2020/NĐ-CP',
        ngayBanHanh: '01/6/2020',
        hieuLucTu: '20/7/2020',
        trichYeu: 'Về VỊ TRÍ VIỆC LÀM và biên chế công chức.',
        dieuKhoan: [
          'Điều 3: Căn cứ xác định vị trí việc làm (chức năng, nhiệm vụ, tổ chức bộ máy; tính chất, đặc điểm, khối lượng công việc).',
          'Điều 4: Phân loại vị trí việc làm (theo khối lượng công việc; theo tính chất, nội dung công việc: lãnh đạo–quản lý, nghiệp vụ chuyên ngành, nghiệp vụ dùng chung, hỗ trợ–phục vụ).',
          'Điều 5–7: Bản mô tả công việc, khung năng lực và xác định cơ cấu ngạch công chức.',
        ],
      },
      {
        soHieu: 'Nghị định 106/2020/NĐ-CP',
        ngayBanHanh: '10/9/2020',
        hieuLucTu: '15/11/2020',
        trichYeu: 'Về VỊ TRÍ VIỆC LÀM và số lượng người làm việc trong đơn vị sự nghiệp công lập (áp dụng cho viên chức).',
        dieuKhoan: [
          'Điều 3–4: Căn cứ, nguyên tắc xác định vị trí việc làm và số lượng người làm việc.',
        ],
      },
      {
        soHieu: 'Nghị định 170/2025/NĐ-CP',
        ngayBanHanh: '30/6/2025',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Về tuyển dụng, sử dụng và quản lý công chức — quản lý, bố trí công chức theo vị trí việc làm.',
      },
    ],
  },
  {
    id: 'nang_luong_thuong_xuyen',
    tieuDe: 'Nâng bậc lương thường xuyên',
    tuKhoa: ['nâng lương', 'nâng bậc lương', 'nang luong', 'thường xuyên', 'niên hạn', 'bậc lương'],
    yeuCauQuanLy:
      'Rà soát đủ điều kiện THỜI GIAN GIỮ BẬC và TIÊU CHUẨN trước khi trình; cập nhật đúng ngày hưởng và ngày nâng lương lần sau.',
    vanBan: [
      {
        soHieu: 'Nghị định 204/2004/NĐ-CP',
        ngayBanHanh: '14/12/2004',
        hieuLucTu: '04/01/2005',
        trichYeu: 'Chế độ tiền lương đối với cán bộ, công chức, viên chức và lực lượng vũ trang (bảng lương theo ngạch/bậc/hệ số).',
      },
      {
        soHieu: 'Thông tư 08/2013/TT-BNV',
        ngayBanHanh: '31/7/2013',
        hieuLucTu: '15/9/2013',
        trichYeu: 'Hướng dẫn chế độ nâng bậc lương thường xuyên và nâng bậc lương trước thời hạn.',
        dieuKhoan: [
          'Điều 2 khoản 1 điểm a: Thời gian giữ bậc để xét nâng thường xuyên — loại A0 đến A3 (yêu cầu cao đẳng trở lên): đủ 36 tháng (3 năm); loại B, C và NLĐ: đủ 24 tháng (2 năm).',
          'Điều 2 khoản 1 điểm b: Tiêu chuẩn — được đánh giá từ HOÀN THÀNH NHIỆM VỤ trở lên và KHÔNG bị kỷ luật; thời gian bị kỷ luật/không hoàn thành bị kéo dài thời gian nâng bậc.',
        ],
      },
      {
        soHieu: 'Thông tư 03/2021/TT-BNV',
        ngayBanHanh: '29/6/2021',
        hieuLucTu: '15/8/2021',
        trichYeu: 'Sửa đổi, bổ sung Thông tư 08/2013/TT-BNV về nâng bậc lương thường xuyên, trước thời hạn và phụ cấp thâm niên vượt khung.',
        dieuKhoan: [
          'Nâng bậc lương TRƯỚC thời hạn do lập thành tích: tối đa 12 tháng; chỉ tiêu KHÔNG quá 10% tổng số CBCCVC trong danh sách trả lương của cơ quan.',
        ],
      },
    ],
  },
  {
    id: 'vuot_khung',
    tieuDe: 'Phụ cấp thâm niên vượt khung',
    // Bỏ từ khoá quá chung 'phụ cấp': câu hỏi "phụ cấp độc hại nguy hiểm" từng
    // khớp nhầm vào mục vượt khung và bị trình bày như căn cứ liên quan.
    tuKhoa: ['vượt khung', 'vuot khung', 'thâm niên vượt khung', 'phụ cấp thâm niên'],
    yeuCauQuanLy: 'Khi đã hưởng bậc CUỐI của ngạch đủ thời gian quy định thì xét hưởng %; cập nhật % vượt khung và mốc tăng tiếp theo (+1%/năm).',
    vanBan: [
      {
        soHieu: 'Thông tư 04/2005/TT-BNV',
        ngayBanHanh: '05/01/2005',
        hieuLucTu: '20/01/2005',
        trichYeu: 'Hướng dẫn chế độ phụ cấp thâm niên vượt khung.',
        dieuKhoan: [
          'Sau khi xếp bậc lương cuối cùng trong ngạch: loại A đủ 3 năm (36 tháng), loại B–C đủ 2 năm (24 tháng) thì hưởng 5%; mỗi năm tiếp theo có đủ điều kiện được cộng thêm 1%.',
        ],
      },
      {
        soHieu: 'Thông tư 03/2021/TT-BNV',
        ngayBanHanh: '29/6/2021',
        hieuLucTu: '15/8/2021',
        trichYeu: 'Sửa đổi chế độ phụ cấp thâm niên vượt khung (gắn tiêu chuẩn đánh giá và kỷ luật).',
      },
    ],
  },
  {
    id: 'luong_co_so',
    tieuDe: 'Mức lương cơ sở',
    tuKhoa: ['lương cơ sở', 'luong co so', 'mức lương', '2.340.000', '2340000', 'tiền lương'],
    yeuCauQuanLy: 'Tính lương = hệ số × mức lương cơ sở. Mức hiện hành 2.340.000đ/tháng. Khi Chính phủ điều chỉnh, cập nhật mức cơ sở trong hệ thống.',
    vanBan: [
      {
        soHieu: 'Nghị định 73/2024/NĐ-CP',
        ngayBanHanh: '30/6/2024',
        hieuLucTu: '01/7/2024',
        trichYeu: 'Quy định MỨC LƯƠNG CƠ SỞ 2.340.000 đồng/tháng và chế độ tiền thưởng đối với CBCCVC và lực lượng vũ trang.',
      },
    ],
  },
  {
    id: 'nghi_phep_nam',
    tieuDe: 'Nghỉ phép năm, nghỉ lễ, nghỉ hằng tuần',
    tuKhoa: [
      'nghỉ phép', 'phép năm', 'nghi phep', 'phep nam', 'nghỉ hằng năm', 'số ngày phép', 'định mức phép',
      'nghỉ lễ', 'nghi le', 'lễ tết', 'nghỉ tết', 'ngày nghỉ lễ', 'nghỉ hằng tuần', 'thứ bảy', 'chủ nhật',
      'thâm niên phép', 'tính ngày phép', 'ngày làm việc',
    ],
    yeuCauQuanLy:
      'Tính phép năm theo NGÀY LÀM VIỆC — KHÔNG trừ thứ Bảy, Chủ nhật và ngày nghỉ lễ/Tết rơi vào kỳ nghỉ. ' +
      'Theo dõi định mức + đã nghỉ + còn lại cho từng người; trường hợp do nhiệm vụ không nghỉ hết phép thì thanh toán thêm tiền lương cho những ngày chưa nghỉ.',
    vanBan: [
      {
        soHieu: 'Bộ luật Lao động 2019 (Luật 45/2019/QH14)',
        ngayBanHanh: '20/11/2019',
        hieuLucTu: '01/01/2021',
        trichYeu: 'Nghỉ hằng tuần, nghỉ lễ–Tết, nghỉ hằng năm và tăng ngày phép theo thâm niên.',
        dieuKhoan: [
          'Điều 111: Nghỉ hằng tuần — mỗi tuần nghỉ ít nhất 24 giờ liên tục; cơ quan làm việc 40 giờ/tuần thường nghỉ thứ Bảy và Chủ nhật.',
          'Điều 112 khoản 1: Nghỉ lễ, Tết hưởng nguyên lương — 11 ngày/năm: Tết Dương lịch 01 ngày (01/01); Tết Âm lịch 05 ngày; Giỗ Tổ Hùng Vương 01 ngày (10/3 âm lịch); 30/4 01 ngày; Quốc tế Lao động 01/5 01 ngày; Quốc khánh 02 ngày (02/9 và 01 ngày liền kề).',
          'Điều 113 khoản 1: Nghỉ hằng năm hưởng nguyên lương theo NGÀY LÀM VIỆC — 12 ngày (điều kiện bình thường); 14 ngày (người chưa thành niên, người khuyết tật, nghề/công việc nặng nhọc–độc hại–nguy hiểm); 16 ngày (đặc biệt nặng nhọc–độc hại–nguy hiểm).',
          'Điều 113 khoản 4: Người sử dụng lao động quy định lịch nghỉ hằng năm sau khi tham khảo ý kiến người lao động.',
          'Điều 114: Cứ đủ 05 năm làm việc cho một người sử dụng lao động thì số ngày nghỉ hằng năm được tăng thêm tương ứng 01 ngày.',
        ],
      },
      {
        soHieu: 'Luật Cán bộ, công chức 2008 (Luật 22/2008/QH12)',
        ngayBanHanh: '13/11/2008',
        hieuLucTu: '01/01/2010',
        hieuLucDen: '30/6/2025 (hết hiệu lực TỪ 01/7/2025)',
        thayTheBoi: 'Luật Cán bộ, công chức năm 2025 (hiệu lực 01/7/2025)',
        canhBao: 'Đã đối chiếu 23/8/2026: Luật Cán bộ, công chức số 80/2025/QH15 (bản Công báo số 951+952 '
          + 'ngày 21/7/2025, nay đã nạp vào kho tài liệu) quy định tại Điều 11 khoản 1: "Cán bộ, công chức '
          + 'được nghỉ hằng năm, nghỉ lễ, tết, nghỉ việc riêng, nghỉ không hưởng lương theo quy định của '
          + 'pháp luật về lao động. Trường hợp do yêu cầu nhiệm vụ, cán bộ, công chức không sử dụng hoặc '
          + 'sử dụng không hết số ngày nghỉ hằng năm thì ngoài tiền lương còn được thanh toán thêm một '
          + 'khoản tiền bằng tiền lương cho những ngày không nghỉ." — nội dung kế thừa Điều 13 Luật 2008.',
        trichYeu: 'Quyền nghỉ của cán bộ, công chức (VĂN BẢN ĐÃ HẾT HIỆU LỰC — chỉ để đối chiếu lịch sử).',
        dieuKhoan: [
          'Điều 13: Cán bộ, công chức được nghỉ hằng năm, nghỉ lễ, nghỉ việc riêng theo quy định của pháp luật về lao động; do yêu cầu nhiệm vụ chưa nghỉ hoặc nghỉ chưa hết phép thì được thanh toán thêm tiền lương cho những ngày chưa nghỉ.',
        ],
      },
      {
        soHieu: 'Luật Viên chức 2010 (Luật 58/2010/QH12)',
        ngayBanHanh: '15/11/2010',
        hieuLucTu: '01/01/2012',
        hieuLucDen: '30/6/2026 (hết hiệu lực TỪ 01/7/2026)',
        thayTheBoi: 'Luật Viên chức số 129/2025/QH15 (hiệu lực 01/7/2026)',
        canhBao: 'ĐÃ XÁC MINH 23/8/2026 từ bản Công báo số 41 ngày 22/01/2026 (nay đã nạp vào kho tài liệu). '
          + 'Nguyên văn Điều 43 khoản 2 Luật Viên chức 129/2025: "Luật Viên chức số 58/2010/QH12 đã được sửa '
          + 'đổi, bổ sung một số điều theo Luật số 52/2019/QH14 hết hiệu lực kể từ ngày Luật này có hiệu lực '
          + 'thi hành" (01/7/2026). KHÔNG dùng Luật 58/2010 làm căn cứ hiện hành.',
        trichYeu: 'Quyền nghỉ của viên chức (ĐÃ HẾT HIỆU LỰC — chỉ để đối chiếu lịch sử).',
        dieuKhoan: [
          'Điều 13: Viên chức được nghỉ hằng năm, nghỉ lễ, nghỉ việc riêng theo quy định của pháp luật về lao động. (Nay: Luật Viên chức 129/2025)',
        ],
      },
      {
        soHieu: 'Luật Viên chức số 129/2025/QH15',
        ngayBanHanh: '10/12/2025',
        hieuLucTu: '01/7/2026',
        trichYeu: 'Luật Viên chức hiện hành — thay Luật 58/2010 và Luật 52/2019 kể từ 01/7/2026 (Điều 43).',
        dieuKhoan: [
          'Điều 32 khoản 2 (nguyên văn): "Viên chức được nghỉ hưu theo quy định của pháp luật về lao động và pháp luật về bảo hiểm xã hội; việc nghỉ hưu ở tuổi thấp hơn hoặc ở tuổi cao hơn được thực hiện theo quy định của pháp luật về hoạt động nghề nghiệp hoặc quy định của cấp có thẩm quyền."',
          'Điều 32 khoản 3: Chính phủ quy định thẩm quyền, trình tự, thủ tục thôi việc, nghỉ hưu (hiện là Nghị định 259/2026/NĐ-CP).',
          'Điều 43 khoản 1, 2: hiệu lực 01/7/2026; Luật Viên chức 58/2010 (sửa đổi bởi Luật 52/2019) hết hiệu lực từ ngày này.',
        ],
      },
      {
        soHieu: 'Nghị định 145/2020/NĐ-CP',
        ngayBanHanh: '14/12/2020',
        hieuLucTu: '01/02/2021',
        trichYeu: 'Hướng dẫn cách tính ngày nghỉ hằng năm.',
        dieuKhoan: [
          'Điều 65: Thời gian được coi là thời gian làm việc để tính số ngày nghỉ hằng năm (nghỉ phép, nghỉ ốm cộng dồn ≤ quy định, nghỉ thai sản, ngừng việc không do lỗi NLĐ...).',
          'Điều 66: Người làm chưa đủ 12 tháng — số ngày nghỉ = (số ngày phép năm + ngày tăng theo thâm niên) chia 12 nhân số tháng làm việc thực tế.',
        ],
      },
    ],
  },
  {
    id: 'nghi_viec_rieng_thai_san',
    tieuDe: 'Nghỉ việc riêng, vợ sinh con, chăm con ốm',
    tuKhoa: [
      'nghỉ việc riêng', 'viec rieng', 'cưới', 'kết hôn', 'ket hon', 'đám cưới', 'tang', 'tang lễ', 'hiếu', 'từ trần', 'chết', 'ma chay',
      'vợ sinh', 'vợ đẻ', 'vo sinh con', 'sinh con', 'thai sản', 'thai san', 'chồng nghỉ', 'lao động nam', 'chăm vợ',
      'con ốm', 'chăm con ốm', 'con om', 'nghỉ chăm con', 'ốm đau', 'om dau', 'nghỉ không lương', 'khong luong',
    ],
    yeuCauQuanLy:
      'Áp ĐÚNG loại nghỉ và SỐ NGÀY theo từng trường hợp; phân biệt nghỉ HƯỞNG LƯƠNG (việc riêng theo BLLĐ) với nghỉ do BHXH chi trả (vợ sinh con, chăm con ốm). ' +
      'Nghỉ vợ sinh con và chăm con ốm phải lập hồ sơ hưởng chế độ với cơ quan BHXH.',
    vanBan: [
      {
        soHieu: 'Bộ luật Lao động 2019 (Luật 45/2019/QH14)',
        ngayBanHanh: '20/11/2019',
        hieuLucTu: '01/01/2021',
        trichYeu: 'Nghỉ việc riêng, nghỉ không hưởng lương.',
        dieuKhoan: [
          'Điều 115 khoản 1: Nghỉ việc riêng HƯỞNG NGUYÊN LƯƠNG (báo trước) — điểm a) bản thân kết hôn: nghỉ 03 ngày; điểm b) con đẻ, con nuôi kết hôn: nghỉ 01 ngày; điểm c) cha/mẹ đẻ, cha/mẹ nuôi của mình và của vợ-chồng; vợ hoặc chồng; con đẻ, con nuôi CHẾT: nghỉ 03 ngày.',
          'Điều 115 khoản 2: Nghỉ KHÔNG hưởng lương 01 ngày (phải thông báo) khi: ông nội/bà nội, ông ngoại/bà ngoại, anh/chị/em ruột chết; cha hoặc mẹ kết hôn; anh/chị/em ruột kết hôn.',
          'Điều 115 khoản 3: Ngoài ra, người lao động có thể thỏa thuận với người sử dụng lao động để nghỉ không hưởng lương.',
        ],
      },
      {
        soHieu: 'Luật Bảo hiểm xã hội 2024 (Luật 41/2024/QH15)',
        ngayBanHanh: '29/6/2024',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Chế độ thai sản khi vợ sinh con (lao động nam) và nghỉ chăm sóc con ốm đau.',
        dieuKhoan: [
          'Điều 53 khoản 2: Lao động nam đang đóng BHXH bắt buộc khi vợ sinh con được nghỉ — 05 ngày làm việc; 07 ngày (vợ sinh con phải phẫu thuật hoặc sinh con dưới 32 tuần tuổi); 10 ngày (sinh đôi, từ con thứ ba trở lên thêm 03 ngày/mỗi con); 14 ngày (sinh đôi trở lên mà phải phẫu thuật). Phải nghỉ trong vòng 60 ngày đầu kể từ ngày vợ sinh con.',
          'Điều 44 khoản 1: Nghỉ chăm sóc con ốm đau (tính theo ngày làm việc) — tối đa 20 ngày/năm cho mỗi con dưới 03 tuổi; tối đa 15 ngày/năm cho mỗi con từ đủ 03 đến dưới 07 tuổi.',
          'Điều 45 khoản 2: Mức hưởng trợ cấp ốm đau bằng 75% tiền lương làm căn cứ đóng BHXH (áp dụng cho cả nghỉ chăm con ốm).',
        ],
      },
    ],
  },
  {
    id: 'nghi_huu',
    tieuDe: 'Nghỉ hưu (tuổi & thủ tục)',
    tuKhoa: [
      'nghỉ hưu', 'nghi huu', 'về hưu', 'tuổi nghỉ hưu', 'thông báo nghỉ hưu', 'quyết định nghỉ hưu',
      'lùi thời điểm nghỉ hưu', 'lui nghi huu', 'lùi nghỉ hưu', 'hoãn nghỉ hưu', 'kéo dài thời gian công tác',
      'mẫu số 2', 'mẫu số 3',
    ],
    yeuCauQuanLy:
      'PHẠM VI: mục này là nghỉ hưu THÔNG THƯỜNG (đủ tuổi theo Phụ lục I NĐ 135/2020). KHÔNG áp dụng cho nghỉ hưu ở '
      + 'tuổi THẤP HƠN (Phụ lục II: nghề nặng nhọc–độc hại–nguy hiểm, vùng đặc biệt khó khăn, suy giảm khả năng lao động) '
      + 'và nghỉ hưu TRƯỚC TUỔI do sắp xếp tổ chức bộ máy/tinh giản biên chế — các trường hợp này hệ thống chưa tính tự động, '
      + 'phải xét thủ công theo nghị định chuyên ngành. '
      + 'Theo dõi thời điểm nghỉ hưu của từng người; TRƯỚC 6 THÁNG ra Thông báo nghỉ hưu theo Mẫu số 2 (bố trí người thay thế, bàn giao), '
      + 'TRƯỚC 3 THÁNG ra Quyết định nghỉ hưu theo Mẫu số 3 (NĐ 170/2025). PHÂN BIỆT: ngày nghỉ hưu do hệ thống tính theo NĐ 135/2020 chỉ là '
      + 'DỰ KIẾN; nếu người có thẩm quyền đã quyết định LÙI (NĐ 170/2025 Điều 61 khoản 3, tối đa 1/3/6 tháng tuỳ trường hợp, không cộng dồn) '
      + 'thì phải ghi nhận ngày lùi + số văn bản vào hồ sơ và mọi văn bản phải lấy theo ngày đã lùi.',
    vanBan: [
      {
        soHieu: 'Bộ luật Lao động 2019 (Luật 45/2019/QH14)',
        ngayBanHanh: '20/11/2019',
        hieuLucTu: '01/01/2021',
        trichYeu: 'Tuổi nghỉ hưu của người lao động trong điều kiện bình thường.',
        dieuKhoan: ['Điều 169: Lộ trình tăng tuổi nghỉ hưu — nam đạt 62 tuổi (năm 2028), nữ đạt 60 tuổi (năm 2035).'],
      },
      {
        soHieu: 'Nghị định 135/2020/NĐ-CP',
        ngayBanHanh: '18/11/2020',
        hieuLucTu: '01/01/2021',
        trichYeu: 'Quy định về tuổi nghỉ hưu (chi tiết Điều 169 Bộ luật Lao động 2019) — văn bản GỐC xác định THỜI ĐIỂM nghỉ hưu cho cả công chức, viên chức và người lao động.',
        dieuKhoan: [
          // Nguyên văn bản Công báo số 1117+1118 ngày 03/12/2020 (đã nạp vào kho tài liệu 23/8/2026).
          'Điều 3 khoản 1: "Thời điểm nghỉ hưu là KẾT THÚC NGÀY CUỐI CÙNG CỦA THÁNG đủ tuổi nghỉ hưu theo quy định. Đối với trường hợp người lao động tiếp tục làm việc sau khi đã đủ tuổi nghỉ hưu theo quy định thì thời điểm nghỉ hưu là thời điểm chấm dứt hợp đồng lao động."',
          'Điều 3 khoản 2: "Thời điểm HƯỞNG CHẾ ĐỘ HƯU TRÍ là bắt đầu NGÀY ĐẦU TIÊN CỦA THÁNG LIỀN KỀ sau thời điểm nghỉ hưu." → đây chính là cột "ngày nghỉ hưu" mà hệ thống đang lưu và là mốc ghi trong Quyết định nghỉ hưu (Mẫu số 3: "được nghỉ hưu để hưởng chế độ bảo hiểm xã hội từ ngày …").',
          'Điều 3 khoản 3: hồ sơ KHÔNG xác định được ngày, tháng sinh mà chỉ có năm sinh thì lấy NGÀY 01 THÁNG 01 của năm sinh làm căn cứ xác định thời điểm nghỉ hưu và thời điểm hưởng chế độ hưu trí.',
          'Điều 4 khoản 1: từ 01/01/2021, tuổi nghỉ hưu trong điều kiện lao động bình thường là đủ 60 tuổi 03 tháng (nam), đủ 55 tuổi 04 tháng (nữ); mỗi năm tăng 03 tháng với nam đến khi đủ 62 tuổi vào năm 2028, tăng 04 tháng với nữ đến khi đủ 60 tuổi vào năm 2035.',
          'Điều 4 khoản 2 + Phụ lục I: đối chiếu THÁNG, NĂM SINH với tuổi nghỉ hưu — nam sinh 01/1961–9/1961 nghỉ ở 60 tuổi 3 tháng, mỗi nhóm 9 tháng sinh kế tiếp tăng 3 tháng, sinh từ 4/1966 trở đi là 62 tuổi; nữ sinh 01/1966–8/1966 nghỉ ở 55 tuổi 4 tháng, mỗi nhóm 8 tháng sinh kế tiếp tăng 4 tháng, sinh từ 5/1975 trở đi là 60 tuổi. Cột cuối Phụ lục I là THỜI ĐIỂM HƯỞNG LƯƠNG HƯU (tháng liền kề).',
          'Phụ lục II: tuổi nghỉ hưu THẤP HƠN tối đa 5 tuổi (nghề nặng nhọc–độc hại–nguy hiểm, vùng đặc biệt khó khăn, suy giảm khả năng lao động) — hệ thống CHƯA tính trường hợp này, phải xét thủ công.',
        ],
      },
      {
        soHieu: 'Luật Cán bộ, công chức số 80/2025/QH15',
        ngayBanHanh: '24/6/2025',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Luật gốc về nghỉ hưu của CÁN BỘ và CÔNG CHỨC — dẫn chiếu sang pháp luật lao động (Bộ luật Lao động 2019 + NĐ 135/2020).',
        dieuKhoan: [
          // Nguyên văn bản Công báo số 951+952 ngày 21/7/2025 (đã nạp vào kho tài liệu 23/8/2026).
          'Điều 32 khoản 2 (công chức, nguyên văn): "Công chức được nghỉ hưu theo quy định của Bộ luật Lao động, trừ trường hợp theo quy định của cấp có thẩm quyền."',
          'Điều 32 khoản 3: thẩm quyền, trình tự, thủ tục cho thôi việc, nghỉ hưu và chế độ, chính sách thực hiện theo quy định của cấp có thẩm quyền và của Chính phủ (hiện là Nghị định 170/2025/NĐ-CP).',
          'Điều 17 khoản 2 (cán bộ, nguyên văn): "Cán bộ được nghỉ hưu theo quy định của pháp luật về lao động, trừ trường hợp thực hiện theo quy định của cấp có thẩm quyền."',
        ],
      },
      {
        soHieu: 'Nghị định 259/2026/NĐ-CP',
        ngayBanHanh: '30/6/2026',
        hieuLucTu: '01/7/2026',
        canhBao: 'ÁP DỤNG CHO VIÊN CHỨC (các đơn vị sự nghiệp thuộc Sở). Nghị định thay Nghị định 115/2020, '
          + '85/2023, 101/2017, 89/2021 kể từ 01/7/2026 — thông tin lấy từ Cổng TTĐT Chính phủ ngày 23/8/2026. '
          + '⚠️ CHƯA trích được NGUYÊN VĂN điều khoản nghỉ hưu: bản đăng trên vanban.chinhphu.vn là PDF SCAN '
          + '(76 trang, không có lớp văn bản) nên chưa nạp được vào kho tài liệu. Trước khi ra Thông báo/Quyết '
          + 'định nghỉ hưu cho VIÊN CHỨC, Văn phòng Sở phải đối chiếu bản chính thức — KHÔNG suy diễn theo '
          + 'quy định của công chức (NĐ 170/2025) vì hai đối tượng do hai nghị định khác nhau điều chỉnh.',
        trichYeu: 'Quy định về tuyển dụng, sử dụng và quản lý VIÊN CHỨC (hướng dẫn Luật Viên chức 129/2025). '
          + 'Theo bản tin tóm tắt của Cổng TTĐT Chính phủ thì Nghị định có quy định tuổi nghỉ hưu, thời điểm nghỉ hưu, '
          + 'lùi thời điểm nghỉ hưu và thủ tục nghỉ hưu đối với viên chức — CHƯA đối chiếu được điều khoản chi tiết.',
      },
      {
        soHieu: 'Nghị định 170/2025/NĐ-CP',
        ngayBanHanh: '30/6/2025',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Quy định về tuyển dụng, sử dụng và quản lý CÔNG CHỨC — THAY THẾ Nghị định 46/2010 về thủ tục nghỉ hưu. '
          + 'ĐÃ ĐƯỢC SỬA ĐỔI, BỔ SUNG bởi Nghị định 300/2026/NĐ-CP (hiệu lực 01/8/2026): sửa 34 điều nhưng '
          + 'KHÔNG sửa Điều 61, 62, 63 (nghỉ hưu) — riêng Điều 57 mà Điều 61 khoản 1 dẫn chiếu thì đã bị thay.',
        dieuKhoan: [
          'Điều 61 khoản 1: Người có thẩm quyền cho thôi việc (Điều 57) là người có thẩm quyền cho nghỉ hưu. '
            + 'LƯU Ý: Điều 57 ĐÃ ĐƯỢC THAY bằng Điều 28 Nghị định 300/2026/NĐ-CP (hiệu lực 01/8/2026) — nay: '
            + 'người đứng đầu cơ quan có thẩm quyền TUYỂN DỤNG quyết định cho thôi việc (và cho nghỉ hưu) đối với '
            + 'công chức KHÔNG giữ chức vụ lãnh đạo, quản lý; người đứng đầu cơ quan có thẩm quyền BỔ NHIỆM đối với '
            + 'công chức GIỮ chức vụ lãnh đạo, quản lý.',
          'Điều 61 khoản 2: Thời điểm nghỉ hưu thực hiện theo pháp luật về lao động và bảo hiểm xã hội, trừ trường hợp có quy định khác của cơ quan có thẩm quyền.',
          'Điều 61 khoản 3: LÙI thời điểm nghỉ hưu theo MỘT trong các trường hợp — a) KHÔNG QUÁ 01 THÁNG: thời điểm nghỉ hưu trùng ngày nghỉ Tết Nguyên đán; vợ/chồng, bố, mẹ (vợ hoặc chồng), con từ trần hoặc bị Toà án tuyên bố mất tích; bản thân và gia đình bị thiệt hại do thiên tai, địch hoạ, hoả hoạn. b) KHÔNG QUÁ 03 THÁNG: bị bệnh nặng hoặc bị tai nạn có giấy xác nhận của bệnh viện. c) KHÔNG QUÁ 06 THÁNG: đang điều trị bệnh thuộc danh mục bệnh cần chữa trị dài ngày do Bộ Y tế ban hành, có giấy xác nhận của bệnh viện.',
          'Điều 61 khoản 4: Thuộc NHIỀU trường hợp tại khoản 3 thì CHỈ được thực hiện theo MỘT trường hợp có thời gian lùi NHIỀU NHẤT — không cộng dồn (do đó mức lùi nhiều nhất có thể là 06 tháng theo điểm c khoản 3).',
          'Điều 61 khoản 5: Người có thẩm quyền cho nghỉ hưu QUYẾT ĐỊNH việc lùi, trừ trường hợp công chức không có nguyện vọng lùi.',
          'Điều 61 khoản 6: Kéo dài thời gian công tác với công chức có trình độ chuyên môn cao, bề dày kinh nghiệm đã đủ tuổi nghỉ hưu thực hiện theo pháp luật có liên quan (khác với LÙI thời điểm nghỉ hưu ở khoản 3).',
          'Điều 62: TRƯỚC 06 THÁNG tính đến thời điểm nghỉ hưu, người có thẩm quyền cho nghỉ hưu phải ra THÔNG BÁO bằng văn bản về thời điểm nghỉ hưu để công chức biết — theo MẪU SỐ 2 ban hành kèm theo Nghị định.',
          'Điều 63 khoản 1: TRƯỚC 03 THÁNG tính đến thời điểm nghỉ hưu, người có thẩm quyền ra QUYẾT ĐỊNH nghỉ hưu — theo MẪU SỐ 3 ban hành kèm theo Nghị định.',
          'Điều 63 khoản 2: Căn cứ quyết định nghỉ hưu, cơ quan quản lý công chức phối hợp với tổ chức bảo hiểm xã hội làm thủ tục cho công chức được hưởng chế độ.',
          'Điều 63 khoản 3: Công chức nghỉ hưu có trách nhiệm BÀN GIAO hồ sơ tài liệu và công việc đang làm cho người được phân công tiếp nhận TRƯỚC thời điểm nghỉ hưu ghi trong quyết định.',
          'Điều 63 khoản 4: Kể từ thời điểm nghỉ hưu GHI TRONG QUYẾT ĐỊNH, công chức được nghỉ hưu và hưởng chế độ bảo hiểm xã hội theo quy định.',
          'Điều 71 khoản 2 điểm b: Nghị định 46/2010/NĐ-CP HẾT HIỆU LỰC kể từ ngày Nghị định này có hiệu lực (01/7/2025).',
        ],
      },
      {
        soHieu: 'Nghị định 300/2026/NĐ-CP',
        ngayBanHanh: '29/7/2026',
        hieuLucTu: '01/8/2026',
        trichYeu: 'Sửa đổi, bổ sung một số điều của Nghị định 170/2025/NĐ-CP về tuyển dụng, sử dụng và quản lý công chức (bản .docx do Văn phòng Sở cung cấp, đã nạp vào kho tài liệu).',
        dieuKhoan: [
          'Sửa 34 điều của NĐ 170/2025 (Điều 6, 9, 13, 14, 18, 19, 20, 23, 24, 26, 27, 29, 33–37, 39–41, 51a, 52–59, 64, 66–68). '
            + 'ĐÃ ĐỐI CHIẾU: KHÔNG sửa Điều 61 (thời điểm nghỉ hưu, lùi nghỉ hưu), Điều 62 (thông báo, Mẫu số 2), Điều 63 (quyết định, Mẫu số 3) — phần nghỉ hưu giữ nguyên.',
          'Điều 28 thay toàn bộ Điều 57 "Thẩm quyền, trình tự, thủ tục giải quyết thôi việc" — do Điều 61 khoản 1 dẫn chiếu Điều 57 nên THẨM QUYỀN CHO NGHỈ HƯU cũng theo quy định mới: '
            + 'khoản 1 điểm a người đứng đầu cơ quan có thẩm quyền TUYỂN DỤNG (công chức không giữ chức vụ lãnh đạo, quản lý); điểm b người đứng đầu cơ quan có thẩm quyền BỔ NHIỆM (công chức giữ chức vụ lãnh đạo, quản lý).',
          'Điều 36: Nghị định này có hiệu lực thi hành từ ngày 01 tháng 8 năm 2026.',
        ],
      },
      {
        soHieu: 'Nghị định 46/2010/NĐ-CP',
        ngayBanHanh: '27/4/2010',
        hieuLucTu: '01/7/2010',
        hieuLucDen: '30/6/2025 (hết hiệu lực TỪ 01/7/2025)',
        thayTheBoi: 'Nghị định 170/2025/NĐ-CP (Điều 61, 62, 63)',
        canhBao: 'ĐÃ XÁC MINH DỨT ĐIỂM ngày 20/8/2026 từ chính văn bản gốc trong kho tài liệu của Sở '
          + '(170_2025_ND-CP_663212.docx). Nguyên văn Điều 71 khoản 2: "Các văn bản quy phạm pháp luật '
          + 'sau đây hết hiệu lực kể từ ngày Nghị định này có hiệu lực thi hành: … b) Nghị định số '
          + '46/2010/NĐ-CP ngày 27 tháng 4 năm 2010 của Chính phủ quy định về thôi việc và thủ tục nghỉ '
          + 'hưu đối với công chức". Dùng Nghị định 170/2025/NĐ-CP thay thế. LƯU Ý: Thông báo nghỉ hưu '
          + 'phải theo Mẫu số 2 và Quyết định nghỉ hưu theo Mẫu số 3 ban hành kèm NĐ 170/2025 — Văn phòng '
          + 'Sở cần đối chiếu biểu mẫu hệ thống đang sinh với hai mẫu này.',
        trichYeu: 'Quy định về thôi việc và thủ tục nghỉ hưu đối với công chức (ĐÃ HẾT HIỆU LỰC — chỉ để đối chiếu lịch sử).',
        dieuKhoan: [
          'Điều 9 khoản 1: Thời điểm nghỉ hưu là ngày 01 của tháng liền kề sau tháng công chức đủ tuổi nghỉ hưu. (Nay: Điều 61 NĐ 170/2025)',
          'Điều 9 khoản 3: TRƯỚC 06 THÁNG ra THÔNG BÁO nghỉ hưu. (Nay: Điều 62 NĐ 170/2025, theo Mẫu số 2)',
          'Điều 9 khoản 4: TRƯỚC 03 THÁNG ra QUYẾT ĐỊNH nghỉ hưu. (Nay: Điều 63 NĐ 170/2025, theo Mẫu số 3)',
        ],
      },
    ],
  },
  {
    id: 'hop_dong_lao_dong',
    tieuDe: 'Hợp đồng lao động (người lao động)',
    tuKhoa: ['hợp đồng', 'hop dong', 'người lao động', 'nlđ', 'hết hạn hợp đồng', 'hđlđ'],
    yeuCauQuanLy:
      'Cập nhật loại HĐ và NGÀY KẾT THÚC hợp đồng; theo dõi để ký HĐ mới trước khi hết hạn — quá 30 ngày không ký lại, HĐ xác định thời hạn trở thành không xác định thời hạn.',
    vanBan: [
      {
        soHieu: 'Bộ luật Lao động 2019 (Luật 45/2019/QH14)',
        ngayBanHanh: '20/11/2019',
        hieuLucTu: '01/01/2021',
        trichYeu: 'Loại hợp đồng lao động và xử lý khi hết hạn.',
        dieuKhoan: [
          'Điều 20: 02 loại HĐLĐ — không xác định thời hạn và xác định thời hạn (≤ 36 tháng).',
          'Điều 20 khoản 2: Hết hạn mà NLĐ vẫn làm việc thì trong 30 ngày phải ký HĐ mới; không ký thì HĐ xác định thời hạn trở thành HĐ không xác định thời hạn.',
        ],
      },
      {
        soHieu: 'Nghị định 111/2022/NĐ-CP',
        ngayBanHanh: '30/12/2022',
        hieuLucTu: '22/02/2023',
        trichYeu: 'Về hợp đồng đối với một số loại công việc trong cơ quan hành chính nhà nước và đơn vị sự nghiệp công lập.',
      },
    ],
  },
  {
    id: 'danh_gia_xep_loai',
    tieuDe: 'Đánh giá, xếp loại chất lượng',
    tuKhoa: ['đánh giá', 'xếp loại', 'danh gia', 'xep loai', 'hoàn thành nhiệm vụ'],
    yeuCauQuanLy: 'Đánh giá, xếp loại hằng năm làm căn cứ nâng lương, khen thưởng, quy hoạch; cập nhật kết quả xếp loại từng năm cho từng người.',
    vanBan: [
      {
        soHieu: 'Nghị định 90/2020/NĐ-CP',
        ngayBanHanh: '13/8/2020',
        hieuLucTu: '20/8/2020',
        trichYeu: 'Đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức (4 mức: HTXSNV, HTTNV, HTNV, không HTNV).',
      },
      {
        soHieu: 'Nghị định 48/2023/NĐ-CP',
        ngayBanHanh: '17/7/2023',
        hieuLucTu: '15/9/2023',
        trichYeu: 'Sửa đổi, bổ sung Nghị định 90/2020/NĐ-CP về đánh giá, xếp loại chất lượng CBCCVC.',
      },
    ],
  },
  {
    id: 'ky_luat',
    tieuDe: 'Xử lý kỷ luật',
    tuKhoa: ['kỷ luật', 'ky luat', 'khiển trách', 'cảnh cáo', 'thời hiệu'],
    yeuCauQuanLy: 'Ghi nhận hình thức, thời hạn kỷ luật và hệ quả KÉO DÀI thời gian nâng lương; theo dõi để gỡ ràng buộc đúng hạn.',
    vanBan: [
      {
        soHieu: 'Nghị định 112/2020/NĐ-CP',
        ngayBanHanh: '18/9/2020',
        hieuLucTu: '20/9/2020',
        trichYeu: 'Xử lý kỷ luật cán bộ, công chức, viên chức (hình thức, thẩm quyền, thời hiệu, thời hạn).',
      },
      {
        soHieu: 'Nghị định 71/2023/NĐ-CP',
        ngayBanHanh: '20/9/2023',
        hieuLucTu: '20/9/2023',
        trichYeu: 'Sửa đổi, bổ sung Nghị định 112/2020/NĐ-CP về xử lý kỷ luật CBCCVC.',
      },
    ],
  },
  {
    id: 'ke_khai_tai_san',
    tieuDe: 'Kê khai tài sản, thu nhập',
    tuKhoa: ['kê khai tài sản', 'ke khai tai san', 'thu nhập', 'minh bạch'],
    yeuCauQuanLy: 'Xác định đối tượng phải kê khai và theo dõi kê khai hằng năm đúng hạn.',
    vanBan: [
      {
        soHieu: 'Nghị định 130/2020/NĐ-CP',
        ngayBanHanh: '30/10/2020',
        hieuLucTu: '20/12/2020',
        trichYeu: 'Kiểm soát tài sản, thu nhập của người có chức vụ, quyền hạn trong cơ quan, tổ chức, đơn vị.',
      },
    ],
  },
]

/** Định dạng một mục pháp lý ra văn bản (markdown) — dùng cho chatbot. */
export function formatPhapLyMuc(m: PhapLyMuc): string {
  const dong: string[] = [`📖 **${m.tieuDe}**`, `➡️ Yêu cầu quản lý: ${m.yeuCauQuanLy}`]
  for (const v of m.vanBan) {
    // CHỐNG DẪN CHỨNG SAI CĂN CỨ: trước đây mọi văn bản đều được in kèm chữ
    // "(hiện hành)" vì không mục nào điền hieuLucDen — kể cả Luật CBCC 2008 đã
    // bị Luật CBCC 2025 thay từ 01/7/2025. Nay tách rõ 2 trạng thái.
    if (v.hieuLucDen) {
      dong.push(
        `\n• ⛔ **${v.soHieu}** — ĐÃ HẾT HIỆU LỰC ngày ${v.hieuLucDen}` +
          (v.thayTheBoi ? `, thay thế bởi ${v.thayTheBoi}` : '') +
          '. KHÔNG dùng làm căn cứ hiện hành, chỉ nêu khi đối chiếu lịch sử.',
      )
    } else {
      dong.push(`\n• **${v.soHieu}** — ban hành ${v.ngayBanHanh}, hiệu lực từ ${v.hieuLucTu} (hiện hành).`)
    }
    if (v.canhBao) dong.push(`  ⚠️ ${v.canhBao}`)
    dong.push(`  Trích yếu: ${v.trichYeu}`)
    for (const dk of v.dieuKhoan ?? []) dong.push(`  – ${dk}`)
  }
  return dong.join('\n')
}

/**
 * Tìm các mục pháp lý theo từ khoá; rỗng = trả toàn bộ (dùng để liệt kê danh mục chủ đề).
 *
 * CHỐNG BỊA: khi có từ khoá mà KHÔNG mục nào khớp thì trả về MẢNG RỖNG.
 * Trước đây hàm trả về toàn bộ CO_SO_PHAP_LY khi không khớp — chatbot nhận
 * các mục pháp lý KHÔNG liên quan và dễ suy diễn thành căn cứ sai
 * (VD hỏi "phụ cấp độc hại theo điều nào" → trả 3 mục đầu về nghỉ hưu/nâng lương).
 */
export function timPhapLy(tuKhoa?: string): PhapLyMuc[] {
  const q = (tuKhoa ?? '').trim().toLowerCase()
  if (!q) return CO_SO_PHAP_LY
  // Bỏ dấu để khớp cả khi người dùng gõ không dấu
  const boDau = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
  const qk = boDau(q)
  return CO_SO_PHAP_LY.filter((m) =>
    m.id.includes(q) ||
    boDau(m.tieuDe.toLowerCase()).includes(qk) ||
    m.tuKhoa.some((k) => {
      const kk = boDau(k.toLowerCase())
      // Chiều "câu hỏi chứa từ khoá" chỉ nhận từ khoá đủ đặc trưng (>= 8 ký tự),
      // tránh từ chung như "phụ cấp" kéo về mục không liên quan.
      return kk.includes(qk) || (kk.length >= 8 && qk.includes(kk))
    }) ||
    m.vanBan.some(
      (v) =>
        v.soHieu.toLowerCase().includes(q) ||
        boDau(v.trichYeu.toLowerCase()).includes(qk),
    )
  )
}
