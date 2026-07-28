// Quy trình thẩm định các phòng chuyên môn thuộc Sở Xây dựng Quảng Trị (trừ Phòng HTKT)

export type { BuocThamDinh, QuyTrinh } from '@/lib/htkt/tham-dinh'
import type { QuyTrinh } from '@/lib/htkt/tham-dinh'

export const THAM_DINH_PHONG: Record<string, QuyTrinh[]> = {
  'phong-clct': [
    {
      key: 'clct-tham-dinh-ct-gt',
      ten: 'Thẩm định BCNCKT/thiết kế công trình giao thông',
      moTa: 'Thẩm định Báo cáo nghiên cứu khả thi, thiết kế cơ sở công trình giao thông thuộc thẩm quyền Sở Xây dựng.',
      apDung: 'Dự án công trình giao thông thuộc thẩm quyền thẩm định của Sở Xây dựng (theo phân cấp).',
      hoSo: [
        'Tờ trình thẩm định BCNCKT/thiết kế công trình giao thông.',
        'Thuyết minh BCNCKT và thiết kế cơ sở (kèm bản vẽ).',
        'Tổng mức đầu tư, các căn cứ xác định chi phí.',
        'Văn bản pháp lý: chủ trương đầu tư, quy hoạch được duyệt, kết quả khảo sát.',
        'Hồ sơ năng lực tổ chức, cá nhân lập dự án, khảo sát, thiết kế.',
        'Phương án PCCC đối với công trình thuộc diện thẩm duyệt.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng CLCT.', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
        { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần, tính pháp lý hồ sơ. Nếu thiếu/không hợp lệ: trong 5 ngày làm việc ra văn bản yêu cầu bổ sung (một lần).', trachNhiem: 'Phòng CLCT' },
        { buoc: 3, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi văn bản lấy ý kiến cơ quan liên quan (PCCC, quản lý đường bộ, môi trường...) khi cần. Công trình có hạng mục điện chiếu sáng: lấy ý kiến Sở Công Thương.', trachNhiem: 'Phòng CLCT' },
        { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá sự phù hợp quy hoạch, quy chuẩn, tiêu chuẩn; giải pháp kết cấu giao thông, an toàn; điều kiện năng lực; tổng mức đầu tư.', trachNhiem: 'Phòng CLCT (chủ trì)' },
        { buoc: 5, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập Thông báo kết quả thẩm định; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng CLCT' },
        { buoc: 6, ten: 'Phát hành kết quả', noiDung: 'Phát hành Thông báo kết quả thẩm định gửi chủ đầu tư.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Dự án nhóm A: không quá 40 ngày.',
        'Dự án nhóm B: không quá 30 ngày.',
        'Dự án nhóm C: không quá 20 ngày.',
        '(Tính từ ngày nhận đủ hồ sơ hợp lệ; chưa kể thời gian bổ sung hồ sơ.)',
      ],
      ketQua: 'Thông báo kết quả thẩm định BCNCKT/thiết kế công trình giao thông.',
      canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP', 'Luật PCCC 55/2024/QH15'],
    },
    {
      key: 'clct-nghiem-thu-ct-gt',
      ten: 'Kiểm tra nghiệm thu công trình giao thông',
      moTa: 'Kiểm tra hồ sơ nghiệm thu của chủ đầu tư trước khi đưa công trình giao thông vào sử dụng.',
      apDung: 'Công trình giao thông thuộc đối tượng kiểm tra công tác nghiệm thu của cơ quan chuyên môn về xây dựng.',
      hoSo: [
        'Báo cáo hoàn thành thi công xây dựng của chủ đầu tư.',
        'Danh mục hồ sơ hoàn thành công trình.',
        'Kết quả thí nghiệm, quan trắc, chạy thử; hồ sơ quản lý chất lượng.',
        'Văn bản chấp thuận của cơ quan PCCC, môi trường (nếu thuộc đối tượng).',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận báo cáo', noiDung: 'Chủ đầu tư gửi báo cáo hoàn thành đến cơ quan chuyên môn.', trachNhiem: 'Chủ đầu tư' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Phòng CLCT kiểm tra hồ sơ nghiệm thu, sự tuân thủ thiết kế, quy chuẩn.', trachNhiem: 'Phòng CLCT' },
        { buoc: 3, ten: 'Kiểm tra hiện trường', noiDung: 'Tổ chức kiểm tra tại hiện trường (khi cần); lập biên bản.', trachNhiem: 'Phòng CLCT' },
        { buoc: 4, ten: 'Thông báo kết quả', noiDung: 'Ra văn bản chấp thuận kết quả nghiệm thu hoặc yêu cầu khắc phục tồn tại.', trachNhiem: 'Phòng CLCT / Lãnh đạo Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Nghị định 207/2026/NĐ-CP.',
      ],
      ketQua: 'Văn bản chấp thuận kết quả nghiệm thu công trình giao thông.',
      canCu: ['Nghị định 207/2026/NĐ-CP'],
    },
  ],

  'phong-qlhd-xd': [
    {
      key: 'qlhdxd-tham-dinh-du-an',
      ten: 'Thẩm định dự án đầu tư xây dựng',
      moTa: 'Sở Xây dựng thẩm định BCNCKT, BCKTKT, thiết kế đối với dự án công trình dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở.',
      apDung: 'Dự án đầu tư xây dựng công trình dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở thuộc thẩm quyền Sở Xây dựng. PCCC đồng thời cho công trình thuộc Phụ lục III Nghị định 105/2025/NĐ-CP.',
      hoSo: [
        'Tờ trình thẩm định BCNCKT/BCKTKT/thiết kế.',
        'Thuyết minh BCNCKT hoặc BCKTKT và thiết kế cơ sở (kèm bản vẽ).',
        'Tổng mức đầu tư hoặc dự toán.',
        'Văn bản pháp lý: chủ trương đầu tư, quy hoạch được duyệt, kết quả khảo sát.',
        'Hồ sơ năng lực tổ chức, cá nhân lập dự án, khảo sát, thiết kế.',
        'Hồ sơ thiết kế PCCC đối với công trình thuộc Phụ lục III NĐ 105/2025.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLHĐ-XD.', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
        { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần, tính pháp lý hồ sơ. Yêu cầu bổ sung nếu thiếu (một lần, trong 5 ngày).', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 3, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi lấy ý kiến cơ quan liên quan (PCCC, quy hoạch, môi trường...) khi cần. Thẩm duyệt PCCC đồng thời với thẩm định thiết kế. Công trình có hạng mục điện chiếu sáng: lấy ý kiến Sở Công Thương về phương án cấp điện, an toàn điện.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá sự phù hợp quy hoạch, quy chuẩn, tiêu chuẩn; giải pháp thiết kế; điều kiện năng lực; tổng mức đầu tư/dự toán.', trachNhiem: 'Phòng QLHĐ-XD (chủ trì)' },
        { buoc: 5, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập Thông báo kết quả thẩm định; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 6, ten: 'Phát hành kết quả', noiDung: 'Phát hành Thông báo kết quả thẩm định gửi chủ đầu tư.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Dự án nhóm A: không quá 40 ngày.',
        'Dự án nhóm B: không quá 30 ngày.',
        'Dự án nhóm C: không quá 20 ngày.',
        '(Tính từ ngày nhận đủ hồ sơ hợp lệ; chưa kể thời gian bổ sung hồ sơ.)',
      ],
      ketQua: 'Thông báo kết quả thẩm định dự án đầu tư xây dựng.',
      canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP', 'Luật PCCC 55/2024/QH15'],
    },
    {
      key: 'qlhdxd-cap-gpxd',
      ten: 'Cấp giấy phép xây dựng',
      moTa: 'Sở Xây dựng cấp giấy phép xây dựng đối với công trình cấp II trở lên.',
      apDung: 'Công trình xây dựng cấp II trở lên thuộc thẩm quyền cấp GPXD của Sở Xây dựng.',
      hoSo: [
        'Đơn đề nghị cấp GPXD (theo mẫu).',
        'Bản sao giấy tờ về quyền sử dụng đất.',
        'Hồ sơ thiết kế xây dựng (bản vẽ, thuyết minh) đã được thẩm định.',
        'Văn bản thẩm định PCCC trong hồ sơ (đối với công trình thuộc diện).',
        'Giấy phép môi trường (nếu thuộc đối tượng).',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLHĐ-XD.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính pháp lý hồ sơ; kiểm tra văn bản thẩm định PCCC. Yêu cầu bổ sung nếu thiếu.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 3, ten: 'Thẩm tra điều kiện cấp phép', noiDung: 'Đánh giá sự phù hợp quy hoạch, thiết kế, quy chuẩn; kiểm tra điều kiện về đất, môi trường, PCCC.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 4, ten: 'Dự thảo GPXD', noiDung: 'Dự thảo giấy phép xây dựng; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 5, ten: 'Phát hành GPXD', noiDung: 'Phát hành giấy phép xây dựng gửi chủ đầu tư.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Không quá 20 ngày kể từ ngày nhận đủ hồ sơ hợp lệ.',
        'Nhà ở riêng lẻ: không quá 15 ngày.',
      ],
      ketQua: 'Giấy phép xây dựng.',
      canCu: ['Luật Xây dựng 135/2025/QH15', 'Nghị định 217/2026/NĐ-CP'],
    },
    {
      key: 'qlhdxd-chung-chi-hanh-nghe',
      ten: 'Cấp chứng chỉ hành nghề hoạt động xây dựng',
      moTa: 'Sát hạch, cấp/gia hạn/thu hồi chứng chỉ hành nghề cá nhân và chứng nhận năng lực tổ chức hoạt động xây dựng.',
      apDung: 'Cá nhân hành nghề hoạt động xây dựng và tổ chức tham gia hoạt động xây dựng thuộc thẩm quyền cấp chứng chỉ của Sở Xây dựng.',
      hoSo: [
        'Đơn đề nghị cấp/gia hạn chứng chỉ hành nghề (theo mẫu).',
        'Bản sao văn bằng, chứng chỉ đào tạo.',
        'Bản khai kinh nghiệm nghề nghiệp.',
        'Ảnh chân dung, bản sao CCCD.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLHĐ-XD.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính hợp lệ của hồ sơ; đối chiếu điều kiện năng lực.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 3, ten: 'Tổ chức sát hạch', noiDung: 'Tổ chức sát hạch kiến thức pháp luật, chuyên môn theo quy định (đối với trường hợp cấp mới).', trachNhiem: 'Hội đồng xét cấp CCHN' },
        { buoc: 4, ten: 'Thẩm định, dự thảo', noiDung: 'Thẩm định kết quả sát hạch, dự thảo quyết định cấp chứng chỉ; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QLHĐ-XD' },
        { buoc: 5, ten: 'Phát hành chứng chỉ', noiDung: 'Phát hành chứng chỉ hành nghề/chứng nhận năng lực gửi cá nhân/tổ chức.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Nghị định 212/2026/NĐ-CP.',
      ],
      ketQua: 'Chứng chỉ hành nghề hoạt động xây dựng / Chứng nhận năng lực tổ chức.',
      canCu: ['Nghị định 212/2026/NĐ-CP'],
    },
  ],

  'phong-kh-tc': [
    {
      key: 'khtc-tham-dinh-ke-hoach-von',
      ten: 'Thẩm định kế hoạch vốn đầu tư công',
      moTa: 'Rà soát phân bổ vốn, tổng hợp kế hoạch đầu tư công trung hạn và hằng năm thuộc ngành xây dựng.',
      apDung: 'Kế hoạch đầu tư công trung hạn và hằng năm của các dự án thuộc ngành xây dựng do Sở Xây dựng quản lý.',
      hoSo: [
        'Tờ trình đề xuất kế hoạch vốn đầu tư công.',
        'Danh mục dự án, tổng mức đầu tư, tiến độ giải ngân.',
        'Quyết định phê duyệt chủ trương đầu tư, dự án.',
        'Báo cáo tình hình thực hiện vốn đầu tư công kỳ trước.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận đề xuất kế hoạch vốn từ các phòng, đơn vị trực thuộc.', trachNhiem: 'Phòng KH-TC' },
        { buoc: 2, ten: 'Rà soát, tổng hợp', noiDung: 'Rà soát danh mục, đối chiếu chủ trương đầu tư, nguồn vốn, khả năng cân đối; tổng hợp kế hoạch.', trachNhiem: 'Phòng KH-TC' },
        { buoc: 3, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá tính khả thi, thứ tự ưu tiên, sự phù hợp với kế hoạch trung hạn và chỉ tiêu giao.', trachNhiem: 'Phòng KH-TC (chủ trì)' },
        { buoc: 4, ten: 'Dự thảo kế hoạch', noiDung: 'Dự thảo kế hoạch phân bổ vốn; trình Lãnh đạo Sở xem xét, ký gửi Sở KH-ĐT/UBND tỉnh.', trachNhiem: 'Phòng KH-TC' },
      ],
      thoiGian: [
        'Theo tiến độ lập kế hoạch đầu tư công hằng năm/trung hạn do UBND tỉnh quy định.',
      ],
      ketQua: 'Báo cáo tổng hợp kế hoạch vốn đầu tư công ngành xây dựng.',
      canCu: ['Luật Đầu tư công 58/2024/QH15 (sửa đổi 90/2025)', 'Nghị định 206/2026/NĐ-CP'],
    },
    {
      key: 'khtc-tham-tra-dau-thau',
      ten: 'Thẩm tra hồ sơ đấu thầu',
      moTa: 'Thẩm tra E-HSMT, E-HSYC, kết quả lựa chọn nhà thầu các gói thầu thuộc dự án do Sở Xây dựng làm chủ đầu tư.',
      apDung: 'Các gói thầu thuộc dự án do Sở Xây dựng làm chủ đầu tư hoặc được giao thẩm tra.',
      hoSo: [
        'Tờ trình đề nghị phê duyệt E-HSMT/E-HSYC/kết quả lựa chọn nhà thầu.',
        'Dự thảo E-HSMT hoặc E-HSYC.',
        'Báo cáo đánh giá E-HSDT/E-HSĐX.',
        'Kế hoạch lựa chọn nhà thầu được duyệt.',
        'Các tài liệu liên quan (dự toán gói thầu, thiết kế...) .',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận hồ sơ đấu thầu từ bộ phận/đơn vị liên quan.', trachNhiem: 'Phòng KH-TC' },
        { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần hồ sơ, sự phù hợp với kế hoạch lựa chọn nhà thầu.', trachNhiem: 'Phòng KH-TC' },
        { buoc: 3, ten: 'Thẩm tra nội dung', noiDung: 'Thẩm tra tiêu chuẩn đánh giá, điều kiện hợp đồng, giá gói thầu; đánh giá kết quả lựa chọn nhà thầu.', trachNhiem: 'Phòng KH-TC (chủ trì)' },
        { buoc: 4, ten: 'Báo cáo kết quả', noiDung: 'Lập báo cáo thẩm tra; trình Lãnh đạo Sở phê duyệt.', trachNhiem: 'Phòng KH-TC' },
      ],
      thoiGian: [
        'Không quá 20 ngày kể từ ngày nhận đủ hồ sơ hợp lệ.',
        'Gói thầu quy mô nhỏ: không quá 15 ngày.',
      ],
      ketQua: 'Báo cáo thẩm tra hồ sơ đấu thầu / kết quả lựa chọn nhà thầu.',
      canCu: ['Luật Đấu thầu 22/2023/QH15 (sửa đổi 57/2024, 90/2025)', 'Nghị định 214/2025/NĐ-CP (thay NĐ 24/2024)'],
    },
  ],

  'phong-qh-kt': [
    {
      key: 'qhkt-tham-dinh-quy-hoach',
      ten: 'Thẩm định quy hoạch đô thị, nông thôn',
      moTa: 'Thẩm định đồ án quy hoạch phân khu, quy hoạch chi tiết theo phân cấp của Sở Xây dựng.',
      apDung: 'Đồ án quy hoạch đô thị, nông thôn (phân khu, chi tiết) thuộc thẩm quyền thẩm định của Sở Xây dựng theo phân cấp.',
      hoSo: [
        'Tờ trình thẩm định đồ án quy hoạch.',
        'Thuyết minh tổng hợp đồ án quy hoạch.',
        'Bản vẽ các loại (hiện trạng, quy hoạch sử dụng đất, giao thông, hạ tầng kỹ thuật...).',
        'Quy định quản lý theo đồ án quy hoạch.',
        'Văn bản pháp lý: nhiệm vụ quy hoạch được duyệt, ý kiến cộng đồng dân cư.',
        'Hồ sơ năng lực tổ chức tư vấn lập quy hoạch.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QH-KT.', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
        { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần hồ sơ, sự phù hợp với nhiệm vụ quy hoạch được duyệt.', trachNhiem: 'Phòng QH-KT' },
        { buoc: 3, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi lấy ý kiến các sở, ngành, UBND cấp huyện liên quan.', trachNhiem: 'Phòng QH-KT' },
        { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá sự phù hợp quy hoạch cấp trên, quy chuẩn, tiêu chuẩn; giải pháp không gian, hạ tầng kỹ thuật, hạ tầng xã hội; tính khả thi.', trachNhiem: 'Phòng QH-KT (chủ trì)' },
        { buoc: 5, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập báo cáo thẩm định; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QH-KT' },
        { buoc: 6, ten: 'Phát hành kết quả', noiDung: 'Phát hành báo cáo thẩm định gửi cơ quan trình duyệt.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Quy hoạch chung: không quá 25 ngày.',
        'Quy hoạch phân khu: không quá 20 ngày.',
        'Quy hoạch chi tiết: không quá 15 ngày.',
        '(Tính từ ngày nhận đủ hồ sơ hợp lệ.)',
      ],
      ketQua: 'Báo cáo thẩm định đồ án quy hoạch đô thị, nông thôn.',
      canCu: ['Luật Quy hoạch đô thị - nông thôn 47/2024/QH15', 'Nghị định 178/2025/NĐ-CP'],
    },
    {
      key: 'qhkt-chung-chi-kts',
      ten: 'Cấp chứng chỉ hành nghề kiến trúc sư',
      moTa: 'Sát hạch, cấp chứng chỉ hành nghề kiến trúc sư cho cá nhân.',
      apDung: 'Cá nhân đề nghị cấp chứng chỉ hành nghề kiến trúc sư thuộc thẩm quyền Sở Xây dựng.',
      hoSo: [
        'Đơn đề nghị cấp chứng chỉ hành nghề kiến trúc (theo mẫu).',
        'Bản sao văn bằng chuyên ngành kiến trúc.',
        'Bản khai kinh nghiệm nghề nghiệp, danh mục công trình đã thực hiện.',
        'Ảnh chân dung, bản sao CCCD.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, chuyển Phòng QH-KT.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính hợp lệ; đối chiếu điều kiện hành nghề.', trachNhiem: 'Phòng QH-KT' },
        { buoc: 3, ten: 'Tổ chức sát hạch', noiDung: 'Tổ chức sát hạch kiến thức pháp luật, chuyên môn kiến trúc.', trachNhiem: 'Hội đồng xét cấp CCHN' },
        { buoc: 4, ten: 'Thẩm định, cấp chứng chỉ', noiDung: 'Thẩm định kết quả sát hạch, dự thảo quyết định cấp; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QH-KT' },
        { buoc: 5, ten: 'Phát hành chứng chỉ', noiDung: 'Phát hành chứng chỉ hành nghề kiến trúc sư.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Luật Kiến trúc 40/2019/QH14 và Nghị định 85/2020/NĐ-CP.',
      ],
      ketQua: 'Chứng chỉ hành nghề kiến trúc sư.',
      canCu: ['Luật Kiến trúc 40/2019/QH14', 'Nghị định 85/2020/NĐ-CP'],
    },
  ],

  'phong-ptdt': [
    {
      key: 'ptdt-tham-dinh-htkt-kdt',
      ten: 'Thẩm định hạ tầng kỹ thuật khu đô thị mới',
      moTa: 'Thẩm định hạ tầng kỹ thuật (cấp nước, thoát nước, điện, chiếu sáng...) trong dự án khu đô thị mới. Kiểm tra PCCC cho hạng mục thuộc Phụ lục III Nghị định 105/2025/NĐ-CP.',
      apDung: 'Dự án khu đô thị mới có hạng mục hạ tầng kỹ thuật thuộc thẩm quyền thẩm định của Sở Xây dựng.',
      hoSo: [
        'Tờ trình thẩm định hạ tầng kỹ thuật khu đô thị.',
        'Thuyết minh thiết kế hệ thống HTKT (cấp nước, thoát nước, điện, chiếu sáng, cây xanh...).',
        'Bản vẽ thiết kế hạ tầng kỹ thuật.',
        'Quy hoạch chi tiết khu đô thị được duyệt.',
        'Hồ sơ thiết kế PCCC đối với hạng mục thuộc Phụ lục III NĐ 105/2025.',
        'Hồ sơ năng lực tổ chức tư vấn thiết kế.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng PTĐT.', trachNhiem: 'Bộ phận Một cửa / Văn thư' },
        { buoc: 2, ten: 'Kiểm tra tính hợp lệ', noiDung: 'Kiểm tra thành phần hồ sơ, sự phù hợp với quy hoạch được duyệt.', trachNhiem: 'Phòng PTĐT' },
        { buoc: 3, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi lấy ý kiến các đơn vị quản lý hạ tầng, cơ quan PCCC, môi trường. Hạng mục điện chiếu sáng trong khu đô thị: lấy ý kiến Sở Công Thương về nguồn cấp điện, an toàn điện, phù hợp quy hoạch điện lực.', trachNhiem: 'Phòng PTĐT' },
        { buoc: 4, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá sự phù hợp quy chuẩn QCVN 07:2016/BXD, QCVN 06; giải pháp HTKT, kết nối hạ tầng chung; phương án PCCC.', trachNhiem: 'Phòng PTĐT (chủ trì)' },
        { buoc: 5, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập Thông báo kết quả thẩm định; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng PTĐT' },
        { buoc: 6, ten: 'Phát hành kết quả', noiDung: 'Phát hành Thông báo kết quả thẩm định gửi chủ đầu tư.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Nghị định 11/2013/NĐ-CP (bản hợp nhất VBHN 04/VBHN-BXD 2026) và NĐ 35/2026/NĐ-CP.',
      ],
      ketQua: 'Thông báo kết quả thẩm định hạ tầng kỹ thuật khu đô thị mới.',
      canCu: ['Nghị định 11/2013/NĐ-CP (VBHN 04/VBHN-BXD 2026)', 'Nghị định 35/2026/NĐ-CP', 'QCVN 07:2016/BXD', 'QCVN 06:2022/BXD', 'Luật PCCC 55/2024/QH15'],
    },
  ],

  'phong-kt-vl': [
    {
      key: 'ktvl-tham-tra-du-toan',
      ten: 'Thẩm tra dự toán xây dựng',
      moTa: 'Thẩm tra sơ bộ tổng mức đầu tư, tổng mức đầu tư, dự toán xây dựng (nhân công, vật liệu, máy).',
      apDung: 'Dự án, công trình thuộc thẩm quyền thẩm tra chi phí đầu tư xây dựng của Sở Xây dựng.',
      hoSo: [
        'Tờ trình đề nghị thẩm tra dự toán/tổng mức đầu tư.',
        'Hồ sơ tổng mức đầu tư hoặc dự toán xây dựng (bảng tính chi tiết).',
        'Thiết kế, bản vẽ, khối lượng tương ứng.',
        'Đơn giá, định mức áp dụng.',
        'Văn bản phê duyệt dự án, thiết kế (nếu có).',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận hồ sơ từ phòng chuyên môn hoặc chủ đầu tư.', trachNhiem: 'Phòng KT-VLXD' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần hồ sơ, đối chiếu khối lượng với thiết kế.', trachNhiem: 'Phòng KT-VLXD' },
        { buoc: 3, ten: 'Thẩm tra chi phí', noiDung: 'Thẩm tra đơn giá nhân công, vật liệu, máy; kiểm tra định mức, hệ số điều chỉnh; đánh giá tính hợp lý của tổng mức đầu tư/dự toán.', trachNhiem: 'Phòng KT-VLXD (chủ trì)' },
        { buoc: 4, ten: 'Báo cáo kết quả', noiDung: 'Lập báo cáo kết quả thẩm tra; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng KT-VLXD' },
      ],
      thoiGian: [
        'Theo quy định tại Nghị định 206/2026/NĐ-CP.',
      ],
      ketQua: 'Báo cáo kết quả thẩm tra dự toán / tổng mức đầu tư xây dựng.',
      canCu: ['Nghị định 206/2026/NĐ-CP'],
    },
    {
      key: 'ktvl-cong-bo-gia-vlxd',
      ten: 'Công bố giá vật liệu xây dựng',
      moTa: 'Thu thập, tổng hợp, tham mưu UBND tỉnh công bố giá vật liệu xây dựng hằng tháng/quý trên địa bàn.',
      apDung: 'Giá vật liệu xây dựng trên địa bàn tỉnh Quảng Trị phục vụ lập và quản lý chi phí đầu tư xây dựng.',
      hoSo: [
        'Bảng khảo sát giá vật liệu xây dựng tại các cơ sở sản xuất, kinh doanh.',
        'Báo giá của nhà cung cấp, nhà sản xuất.',
        'Dữ liệu giá kỳ trước để so sánh biến động.',
      ],
      buoc: [
        { buoc: 1, ten: 'Thu thập dữ liệu', noiDung: 'Khảo sát, thu thập báo giá vật liệu xây dựng tại các cơ sở trên địa bàn.', trachNhiem: 'Phòng KT-VLXD' },
        { buoc: 2, ten: 'Tổng hợp, phân tích', noiDung: 'Tổng hợp giá, phân tích biến động so với kỳ trước; loại bỏ giá bất thường.', trachNhiem: 'Phòng KT-VLXD' },
        { buoc: 3, ten: 'Dự thảo công bố', noiDung: 'Dự thảo bảng công bố giá VLXD; trình Lãnh đạo Sở xem xét.', trachNhiem: 'Phòng KT-VLXD' },
        { buoc: 4, ten: 'Tham mưu, phát hành', noiDung: 'Tham mưu UBND tỉnh ban hành hoặc Sở Xây dựng công bố giá VLXD theo thẩm quyền.', trachNhiem: 'Phòng KT-VLXD / Lãnh đạo Sở' },
      ],
      thoiGian: [
        'Công bố hằng tháng hoặc hằng quý theo quy định.',
      ],
      ketQua: 'Bảng công bố giá vật liệu xây dựng trên địa bàn tỉnh.',
      canCu: ['Nghị định 206/2026/NĐ-CP', 'Nghị định 209/2026/NĐ-CP'],
    },
  ],

  'phong-qlkcht': [
    {
      key: 'qlkcht-cap-phep-thi-cong-duong-bo',
      ten: 'Cấp phép thi công trên đường bộ',
      moTa: 'Cấp phép thi công, đấu nối, sử dụng phạm vi bảo vệ kết cấu hạ tầng đường bộ.',
      apDung: 'Tổ chức, cá nhân có nhu cầu thi công, đấu nối hoặc sử dụng phạm vi bảo vệ kết cấu hạ tầng đường bộ thuộc thẩm quyền quản lý.',
      hoSo: [
        'Đơn đề nghị cấp phép thi công/đấu nối (theo mẫu).',
        'Hồ sơ thiết kế kỹ thuật biện pháp thi công, phương án đảm bảo giao thông.',
        'Văn bản chấp thuận của cơ quan quản lý đường bộ (nếu cần).',
        'Hồ sơ năng lực đơn vị thi công.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLKCHT.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính pháp lý hồ sơ; đánh giá phương án thi công, đảm bảo ATGT.', trachNhiem: 'Phòng QLKCHT' },
        { buoc: 3, ten: 'Khảo sát hiện trường', noiDung: 'Kiểm tra hiện trường vị trí thi công/đấu nối (khi cần).', trachNhiem: 'Phòng QLKCHT' },
        { buoc: 4, ten: 'Dự thảo, cấp phép', noiDung: 'Dự thảo giấy phép thi công; trình Lãnh đạo Sở ký, phát hành.', trachNhiem: 'Phòng QLKCHT / Lãnh đạo Sở' },
      ],
      thoiGian: [
        'Không quá 7 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ.',
      ],
      ketQua: 'Giấy phép thi công/đấu nối/sử dụng phạm vi bảo vệ KCHT đường bộ.',
      canCu: ['Luật Đường bộ 35/2024/QH15', 'Nghị định 165/2024/NĐ-CP'],
    },
  ],

  'phong-ql-nha': [
    {
      key: 'qlnha-chung-chi-moi-gioi-bds',
      ten: 'Cấp chứng chỉ hành nghề môi giới bất động sản',
      moTa: 'Sát hạch, cấp/gia hạn chứng chỉ hành nghề môi giới bất động sản.',
      apDung: 'Cá nhân đề nghị cấp chứng chỉ hành nghề môi giới BĐS thuộc thẩm quyền Sở Xây dựng.',
      hoSo: [
        'Đơn đề nghị cấp chứng chỉ hành nghề môi giới BĐS (theo mẫu).',
        'Bản sao văn bằng, chứng chỉ đào tạo môi giới BĐS.',
        'Bản khai kinh nghiệm hành nghề.',
        'Ảnh chân dung, bản sao CCCD.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, chuyển Phòng QL Nhà & BĐS.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính hợp lệ; đối chiếu điều kiện hành nghề.', trachNhiem: 'Phòng QL Nhà & BĐS' },
        { buoc: 3, ten: 'Tổ chức sát hạch', noiDung: 'Tổ chức sát hạch kiến thức pháp luật, nghiệp vụ môi giới BĐS.', trachNhiem: 'Hội đồng sát hạch' },
        { buoc: 4, ten: 'Thẩm định, cấp chứng chỉ', noiDung: 'Thẩm định kết quả sát hạch, dự thảo quyết định cấp; trình Lãnh đạo Sở ký.', trachNhiem: 'Phòng QL Nhà & BĐS' },
        { buoc: 5, ten: 'Phát hành chứng chỉ', noiDung: 'Phát hành chứng chỉ hành nghề môi giới BĐS.', trachNhiem: 'Văn phòng Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Luật Kinh doanh BĐS 29/2023/QH15 và Nghị định 96/2024/NĐ-CP.',
      ],
      ketQua: 'Chứng chỉ hành nghề môi giới bất động sản.',
      canCu: ['Luật Kinh doanh BĐS 29/2023/QH15', 'Nghị định 96/2024/NĐ-CP'],
    },
    {
      key: 'qlnha-tham-dinh-ct-phat-trien-nha-o',
      ten: 'Thẩm định chương trình phát triển nhà ở',
      moTa: 'Sở Xây dựng chủ trì thẩm định chương trình, kế hoạch phát triển nhà ở địa phương.',
      apDung: 'Chương trình, kế hoạch phát triển nhà ở trên địa bàn tỉnh Quảng Trị do UBND tỉnh giao Sở Xây dựng thẩm định.',
      hoSo: [
        'Tờ trình đề nghị thẩm định chương trình/kế hoạch phát triển nhà ở.',
        'Dự thảo chương trình/kế hoạch phát triển nhà ở.',
        'Báo cáo đánh giá thực trạng nhà ở trên địa bàn.',
        'Số liệu thống kê dân số, nhu cầu nhà ở.',
        'Ý kiến của các sở, ngành, UBND cấp huyện liên quan.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Tiếp nhận dự thảo chương trình/kế hoạch từ đơn vị tư vấn hoặc cơ quan trình.', trachNhiem: 'Phòng QL Nhà & BĐS' },
        { buoc: 2, ten: 'Lấy ý kiến phối hợp', noiDung: 'Gửi lấy ý kiến các sở, ngành, UBND cấp huyện có liên quan.', trachNhiem: 'Phòng QL Nhà & BĐS' },
        { buoc: 3, ten: 'Thẩm định nội dung', noiDung: 'Đánh giá tính khả thi, phù hợp quy hoạch, nhu cầu thực tế; rà soát chỉ tiêu phát triển nhà ở.', trachNhiem: 'Phòng QL Nhà & BĐS (chủ trì)' },
        { buoc: 4, ten: 'Tổng hợp, dự thảo kết quả', noiDung: 'Tổng hợp ý kiến, lập báo cáo thẩm định; trình Lãnh đạo Sở ký gửi UBND tỉnh.', trachNhiem: 'Phòng QL Nhà & BĐS' },
      ],
      thoiGian: [
        'Theo quy định tại Luật Nhà ở 27/2023/QH15 và Nghị định 95/2024/NĐ-CP.',
      ],
      ketQua: 'Báo cáo thẩm định chương trình/kế hoạch phát triển nhà ở địa phương.',
      canCu: ['Luật Nhà ở 27/2023/QH15', 'Nghị định 95/2024/NĐ-CP'],
    },
  ],

  'phong-ql-vt': [
    {
      key: 'qlvt-cap-phep-kinh-doanh-van-tai',
      ten: 'Cấp phép kinh doanh vận tải',
      moTa: 'Thẩm tra điều kiện kinh doanh vận tải đường bộ (phù hiệu, xe, bến).',
      apDung: 'Doanh nghiệp, hợp tác xã kinh doanh vận tải đường bộ trên địa bàn thuộc thẩm quyền quản lý.',
      hoSo: [
        'Đơn đề nghị cấp giấy phép kinh doanh vận tải (theo mẫu).',
        'Bản sao giấy đăng ký kinh doanh.',
        'Phương án kinh doanh vận tải.',
        'Danh sách phương tiện, lái xe đáp ứng điều kiện.',
        'Giấy chứng nhận an toàn kỹ thuật phương tiện.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLVT.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính hợp lệ; đối chiếu điều kiện kinh doanh vận tải.', trachNhiem: 'Phòng QLVT' },
        { buoc: 3, ten: 'Thẩm tra điều kiện', noiDung: 'Thẩm tra phương tiện, lái xe, bến bãi, phương án kinh doanh; kiểm tra thực tế nếu cần.', trachNhiem: 'Phòng QLVT (chủ trì)' },
        { buoc: 4, ten: 'Dự thảo, cấp phép', noiDung: 'Dự thảo giấy phép kinh doanh vận tải/phù hiệu; trình Lãnh đạo Sở ký, phát hành.', trachNhiem: 'Phòng QLVT / Lãnh đạo Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Nghị định 158/2024/NĐ-CP.',
      ],
      ketQua: 'Giấy phép kinh doanh vận tải / Phù hiệu xe.',
      canCu: ['Nghị định 158/2024/NĐ-CP'],
    },
    {
      key: 'qlvt-dang-ky-phuong-tien-thuy',
      ten: 'Đăng ký phương tiện thủy nội địa',
      moTa: 'Đăng ký, xoá đăng ký phương tiện thủy nội địa trên địa bàn.',
      apDung: 'Tổ chức, cá nhân đề nghị đăng ký hoặc xoá đăng ký phương tiện thủy nội địa thuộc thẩm quyền.',
      hoSo: [
        'Đơn đề nghị đăng ký/xoá đăng ký phương tiện thủy nội địa (theo mẫu).',
        'Giấy chứng nhận an toàn kỹ thuật phương tiện.',
        'Giấy tờ chứng minh quyền sở hữu hợp pháp.',
        'Bản sao CCCD chủ phương tiện.',
      ],
      buoc: [
        { buoc: 1, ten: 'Tiếp nhận hồ sơ', noiDung: 'Bộ phận Một cửa tiếp nhận, vào sổ, chuyển Phòng QLVT.', trachNhiem: 'Bộ phận Một cửa' },
        { buoc: 2, ten: 'Kiểm tra hồ sơ', noiDung: 'Kiểm tra thành phần, tính hợp lệ, đối chiếu hồ sơ phương tiện.', trachNhiem: 'Phòng QLVT' },
        { buoc: 3, ten: 'Thẩm định, cấp đăng ký', noiDung: 'Thẩm định điều kiện đăng ký; cấp giấy chứng nhận đăng ký hoặc quyết định xoá đăng ký.', trachNhiem: 'Phòng QLVT' },
        { buoc: 4, ten: 'Phát hành', noiDung: 'Phát hành giấy chứng nhận đăng ký phương tiện thủy nội địa.', trachNhiem: 'Phòng QLVT / Văn phòng Sở' },
      ],
      thoiGian: [
        'Theo quy định tại Luật Giao thông đường thủy nội địa và Nghị định 128/2018/NĐ-CP.',
      ],
      ketQua: 'Giấy chứng nhận đăng ký phương tiện thủy nội địa.',
      canCu: ['Luật Giao thông đường thủy nội địa', 'Nghị định 128/2018/NĐ-CP'],
    },
  ],
}

export function getThamDinhPhong(key: string): QuyTrinh[] {
  return THAM_DINH_PHONG[key] ?? []
}
