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
        canhBao: 'CHƯA đối chiếu được điều khoản tương ứng về chế độ nghỉ trong Luật CBCC 2025 '
          + '(văn bản chưa có trong kho tài liệu). Phải tra bản chính thức trước khi dùng làm căn cứ.',
        trichYeu: 'Quyền nghỉ của cán bộ, công chức (VĂN BẢN ĐÃ HẾT HIỆU LỰC — chỉ để đối chiếu lịch sử).',
        dieuKhoan: [
          'Điều 13: Cán bộ, công chức được nghỉ hằng năm, nghỉ lễ, nghỉ việc riêng theo quy định của pháp luật về lao động; do yêu cầu nhiệm vụ chưa nghỉ hoặc nghỉ chưa hết phép thì được thanh toán thêm tiền lương cho những ngày chưa nghỉ.',
        ],
      },
      {
        soHieu: 'Luật Viên chức 2010 (Luật 58/2010/QH12)',
        ngayBanHanh: '15/11/2010',
        hieuLucTu: '01/01/2012',
        canhBao: 'CHƯA XÁC MINH ĐƯỢC HIỆU LỰC. Phải đối chiếu bản chính thức trước khi dùng làm '
          + 'căn cứ — cần kiểm tra Luật Viên chức mới (được nêu là Luật 129/2025/QH15, hiệu lực '
          + '01/7/2026) và Luật Cán bộ, công chức năm 2025. Cả hai văn bản này CHƯA có trong kho '
          + 'tài liệu của Sở nên hệ thống không tự khẳng định được.',
        trichYeu: 'Quyền nghỉ của viên chức.',
        dieuKhoan: [
          'Điều 13: Viên chức được nghỉ hằng năm, nghỉ lễ, nghỉ việc riêng theo quy định của pháp luật về lao động.',
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
    tuKhoa: ['nghỉ hưu', 'nghi huu', 'về hưu', 'tuổi nghỉ hưu', 'thông báo nghỉ hưu', 'quyết định nghỉ hưu'],
    yeuCauQuanLy:
      'Theo dõi thời điểm nghỉ hưu của từng người; TRƯỚC 6 THÁNG ra Thông báo nghỉ hưu (bố trí người thay thế, bàn giao), TRƯỚC 3 THÁNG ra Quyết định nghỉ hưu.',
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
        trichYeu: 'Quy định về tuổi nghỉ hưu.',
        dieuKhoan: [
          'Điều 4 + Phụ lục I, II: Lộ trình tuổi nghỉ hưu theo năm/tháng sinh; ngày nghỉ hưu = ngày 01 tháng liền kề sau tháng đủ tuổi.',
        ],
      },
      {
        soHieu: 'Nghị định 170/2025/NĐ-CP',
        ngayBanHanh: '30/6/2025',
        hieuLucTu: '01/7/2025',
        trichYeu: 'Quy định về tuyển dụng, sử dụng và quản lý công chức — THAY THẾ Nghị định 46/2010 về thủ tục nghỉ hưu.',
        dieuKhoan: [
          'Điều 61: Thẩm quyền, thời điểm nghỉ hưu.',
          'Điều 62: TRƯỚC 06 THÁNG tính đến thời điểm nghỉ hưu, người có thẩm quyền cho nghỉ hưu phải ra THÔNG BÁO bằng văn bản về thời điểm nghỉ hưu để công chức biết — theo MẪU SỐ 2 ban hành kèm theo Nghị định.',
          'Điều 63 khoản 1: TRƯỚC 03 THÁNG tính đến thời điểm nghỉ hưu, người có thẩm quyền ra QUYẾT ĐỊNH nghỉ hưu — theo MẪU SỐ 3 ban hành kèm theo Nghị định.',
          'Điều 63 khoản 2: Căn cứ quyết định nghỉ hưu, cơ quan quản lý công chức phối hợp với tổ chức bảo hiểm xã hội làm thủ tục cho công chức được hưởng chế độ.',
          'Điều 71 khoản 2 điểm b: Nghị định 46/2010/NĐ-CP HẾT HIỆU LỰC kể từ ngày Nghị định này có hiệu lực (01/7/2025).',
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
