// Công tác tham mưu của 9 phòng thuộc Sở XD Quảng Trị (trừ Phòng HTKT có riêng tại lib/htkt/tham-muu.ts).
// Căn cứ chức năng, nhiệm vụ theo Quyết định 331/QĐ-SXD ngày 05/9/2025.

export type ThamMuu = { noiDung: string[]; sanPham: string[] }
export type LinhVucThamMuu = { key: string; ten: string; thamMuu: ThamMuu }

export type ThamMuuPhong = {
  ma: string; ten: string
  linhVuc: LinhVucThamMuu[]
}

export const THAM_MUU_PHONG: Record<string, ThamMuuPhong> = {
  'phong-clct': {
    ma: 'PHONG_CLCT', ten: 'Phòng Quản lý chất lượng công trình giao thông',
    linhVuc: [
      { key: 'tham-dinh-thiet-ke', ten: 'Thẩm định BCNCKT, thiết kế công trình giao thông', thamMuu: {
        noiDung: [
          'Tham mưu tiếp nhận, thẩm định hồ sơ BCNCKT, BCKTKT, thiết kế triển khai sau TKCS các công trình giao thông theo phân cấp.',
          'Tham mưu lấy ý kiến phối hợp các sở ngành liên quan; kiểm tra sự phù hợp quy hoạch, QCVN, tiêu chuẩn kỹ thuật.',
          'Tham mưu thẩm định nội dung PCCC (điểm a-đ khoản 1 Điều 16 Luật 55/2024) đối với công trình GT thuộc Phụ lục III NĐ 105/2025.',
          'Tham mưu kiểm tra điều kiện năng lực tổ chức, cá nhân tham gia khảo sát, thiết kế công trình GT.',
        ],
        sanPham: [
          'Văn bản kết quả thẩm định dự án/thiết kế công trình giao thông.',
          'Tờ trình xin ý kiến hoặc văn bản góp ý thiết kế.',
          'Thông báo bổ sung hồ sơ thẩm định.',
        ],
      }},
      { key: 'kiem-tra-nghiem-thu', ten: 'Kiểm tra công tác nghiệm thu', thamMuu: {
        noiDung: [
          'Tham mưu kiểm tra công tác nghiệm thu công trình giao thông hoàn thành đưa vào sử dụng theo phân cấp.',
          'Tham mưu kiểm tra nghiệm thu PCCC tích hợp (Điều 18 Luật 55/2024) đối với công trình GT thuộc diện.',
          'Tham mưu xử lý các trường hợp bộ phận bị che khuất chưa nghiệm thu trước khi tiếp tục thi công.',
        ],
        sanPham: [
          'Thông báo kết quả kiểm tra nghiệm thu công trình giao thông.',
          'Văn bản chấp thuận kết quả kiểm tra công tác nghiệm thu (đưa công trình vào khai thác, sử dụng).',
          'Biên bản kiểm tra hiện trường.',
        ],
      }},
      { key: 'chat-luong-an-toan', ten: 'Chất lượng & an toàn thi công', thamMuu: {
        noiDung: [
          'Tham mưu quản lý chất lượng thi công công trình giao thông theo NĐ 207/2026/NĐ-CP; kiểm tra chủng loại, nguồn gốc, thông số kỹ thuật vật liệu.',
          'Tham mưu giám sát, đôn đốc chủ đầu tư, nhà thầu thực hiện quy định an toàn thi công, phá dỡ công trình.',
          'Tham mưu xử lý sự cố công trình giao thông; tiếp nhận, báo cáo sự cố theo quy định (24 giờ).',
          'Tham mưu kiểm tra điều kiện an toàn lao động trên công trường theo QCVN 18:2021/BXD.',
        ],
        sanPham: [
          'Báo cáo kết quả kiểm tra chất lượng, an toàn thi công.',
          'Văn bản yêu cầu khắc phục vi phạm chất lượng, an toàn.',
          'Báo cáo sự cố công trình.',
        ],
      }},
      { key: 'bao-tri-cong-trinh', ten: 'Bảo trì công trình giao thông', thamMuu: {
        noiDung: [
          'Tham mưu quản lý công tác bảo trì kết cấu hạ tầng đường bộ; kiểm tra quy trình bảo trì do nhà thầu thiết kế lập.',
          'Tham mưu kế hoạch bảo trì công trình GT hằng năm; đề xuất nguồn kinh phí bảo trì.',
          'Tham mưu phân cấp quản lý bảo trì quốc lộ ủy thác, tỉnh lộ, đường đô thị theo NĐ 165/2024 (sửa đổi bởi NĐ 241/2026, hiệu lực 01/7/2026).',
        ],
        sanPham: [
          'Kế hoạch bảo trì công trình giao thông hằng năm.',
          'Báo cáo đánh giá hiện trạng bảo trì KCHT đường bộ.',
          'Văn bản đôn đốc thực hiện quy trình bảo trì.',
        ],
      }},
      { key: 'giam-dinh-dinh-muc', ten: 'Giám định tư pháp & định mức KT-KT', thamMuu: {
        noiDung: [
          'Tham mưu tổ chức giám định tư pháp về chất lượng công trình xây dựng giao thông theo yêu cầu cơ quan tố tụng (Luật Giám định tư pháp 13/2012/QH13, sửa đổi 56/2020/QH14).',
          'Tham mưu rà soát, áp dụng hệ thống định mức, đơn giá, chỉ số giá XD cho công trình GT.',
          'Tham mưu giải quyết vướng mắc về chi phí, dự toán công trình giao thông.',
        ],
        sanPham: [
          'Kết luận giám định tư pháp về chất lượng công trình.',
          'Văn bản hướng dẫn áp dụng định mức, đơn giá cho công trình GT.',
          'Báo cáo thẩm tra dự toán công trình giao thông.',
        ],
      }},
    ],
  },

  'phong-qlhd-xd': {
    ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng',
    linhVuc: [
      { key: 'cap-phep-xay-dung', ten: 'Cấp phép xây dựng', thamMuu: {
        noiDung: [
          'Tham mưu cấp giấy phép xây dựng cho công trình không thuộc thẩm quyền UBND cấp xã (cấp III, IV, nhà ở riêng lẻ) hoặc Ban quản lý khu (Đ53 NĐ 217/2026).',
          'Tham mưu giải quyết hồ sơ gia hạn, cấp lại, điều chỉnh GPXD; thu hồi GPXD khi vi phạm.',
          'Tham mưu đối chiếu bản vẽ đề nghị cấp phép với bản vẽ đã thẩm duyệt/thẩm định PCCC đối với công trình thuộc diện (Đ54 k6 điểm b, Đ57 k1 điểm c NĐ 217/2026; Phụ lục III NĐ 105/2025 sửa bởi NĐ 347/2026).',
          'Tham mưu công khai GPXD trên trang thông tin điện tử tối thiểu 12 tháng (Đ66 NĐ 217/2026).',
        ],
        sanPham: [
          'Giấy phép xây dựng (cấp mới, gia hạn, điều chỉnh).',
          'Văn bản từ chối cấp GPXD (nêu rõ lý do).',
          'Thông báo bổ sung hồ sơ xin cấp GPXD.',
        ],
      }},
      { key: 'trat-tu-xay-dung', ten: 'Quản lý trật tự xây dựng', thamMuu: {
        noiDung: [
          'Tham mưu kiểm tra, phát hiện, xử lý vi phạm trật tự xây dựng trên địa bàn theo phân cấp.',
          'Tham mưu, đề xuất cấp có thẩm quyền (Chủ tịch UBND cấp xã/tỉnh, thanh tra xây dựng) đình chỉ thi công, cưỡng chế phá dỡ công trình không phép, sai phép theo pháp luật xử lý vi phạm hành chính và phân cấp — Sở không trực tiếp ban hành quyết định cưỡng chế.',
          'Tham mưu phối hợp UBND cấp xã trong quản lý trật tự XD; hướng dẫn nghiệp vụ.',
          'Tham mưu tổng hợp, báo cáo tình hình trật tự xây dựng trên địa bàn tỉnh.',
        ],
        sanPham: [
          'Biên bản kiểm tra, hồ sơ vi phạm trật tự xây dựng phục vụ xử lý vi phạm hành chính.',
          'Văn bản kiến nghị/đề xuất cấp có thẩm quyền xử lý vi phạm (đình chỉ, cưỡng chế phá dỡ).',
          'Báo cáo tình hình trật tự xây dựng định kỳ/đột xuất.',
        ],
      }},
      { key: 'tham-dinh-du-an', ten: 'Thẩm định dự án (BCNCKT) dân dụng', thamMuu: {
        noiDung: [
          'Tham mưu thẩm định BCNCKT dự án công trình dân dụng, công nghiệp nhẹ, khu đô thị, nhà ở (Đ32–38 NĐ 217/2026); BCKTKT chỉ khi người quyết định đầu tư giao. Thiết kế triển khai do chủ đầu tư thẩm định (Đ41).',
          'Tham mưu thẩm định thiết kế PCCC tích hợp trong thẩm định BCNCKT cho công trình thuộc Phụ lục III NĐ 105/2025 (Đ6 k1, sửa bởi NĐ 347/2026).',
          'Tham mưu kiểm tra yêu cầu áp dụng BIM đối với công trình xây dựng mới từ cấp II trở lên (Đ8 k1 điểm a NĐ 217/2026).',
          'Tham mưu lấy ý kiến phối hợp sở ngành; phát hành kết quả thẩm định đúng thời hạn.',
        ],
        sanPham: [
          'Văn bản kết quả thẩm định dự án/thiết kế công trình dân dụng.',
          'Thông báo bổ sung hồ sơ thẩm định.',
          'Tờ trình phê duyệt dự án ĐTXD (đối với dự án thuộc thẩm quyền UBND tỉnh).',
        ],
      }},
      { key: 'chung-chi-nha-thau', ten: 'Chứng chỉ hành nghề & nhà thầu nước ngoài', thamMuu: {
        noiDung: [
          'Tham mưu xét cấp, cấp lại, thu hồi chứng chỉ hành nghề hoạt động xây dựng của cá nhân qua Hội đồng xét cấp (Đ29–31, Đ40 NĐ 212/2026).',
          'Tham mưu kiểm tra việc tổ chức tự công khai thông tin năng lực trên CSDL quốc gia — không còn thủ tục cấp chứng chỉ năng lực tổ chức (Đ41 NĐ 212/2026).',
          'Tham mưu cấp, điều chỉnh, thu hồi giấy phép hoạt động xây dựng cho nhà thầu nước ngoài theo thẩm quyền (Đ42–47 NĐ 212/2026).',
          'Tham mưu cập nhật, công khai thông tin năng lực trên CSDL quốc gia về hoạt động XD.',
        ],
        sanPham: [
          'Chứng chỉ hành nghề hoạt động xây dựng (cá nhân).',
          'Giấy phép hoạt động xây dựng cho nhà thầu nước ngoài.',
        ],
      }},
      { key: 'thi-nghiem-chuyen-nganh', ten: 'Thí nghiệm chuyên ngành xây dựng', thamMuu: {
        noiDung: [
          'Tham mưu quản lý hoạt động thí nghiệm vật liệu, chất lượng công trình trên địa bàn tỉnh.',
          'Tham mưu kiểm tra phòng thí nghiệm chuyên ngành XD đủ điều kiện hoạt động (LAS-XD).',
          'Tham mưu yêu cầu thí nghiệm đối chứng, kiểm định chất lượng khi phát hiện nghi vấn.',
        ],
        sanPham: [
          'Văn bản xác nhận đủ điều kiện phòng LAS-XD.',
          'Văn bản yêu cầu thí nghiệm đối chứng.',
          'Báo cáo tổng hợp hoạt động thí nghiệm chuyên ngành XD.',
        ],
      }},
    ],
  },

  'phong-kh-tc': {
    ma: 'PHONG_KH_TC', ten: 'Phòng Kế hoạch - Tài chính',
    linhVuc: [
      { key: 'ke-hoach-phat-trien', ten: 'Kế hoạch phát triển ngành', thamMuu: {
        noiDung: [
          'Tham mưu xây dựng kế hoạch, chương trình, đề án phát triển ngành XD, GT trung hạn và hằng năm.',
          'Tham mưu tích hợp quy hoạch ngành XD, GT vào quy hoạch tỉnh theo Luật Quy hoạch.',
          'Tham mưu đề xuất danh mục dự án ưu tiên đầu tư; theo dõi, đánh giá kết quả thực hiện kế hoạch.',
          'Tham mưu lập kế hoạch thực hiện quy hoạch phát triển ngành tại địa phương.',
        ],
        sanPham: [
          'Kế hoạch phát triển ngành XD, GT hằng năm/trung hạn.',
          'Báo cáo đánh giá kết quả thực hiện kế hoạch.',
          'Tờ trình đề xuất danh mục dự án đầu tư.',
        ],
      }},
      { key: 'dau-thau', ten: 'Đấu thầu', thamMuu: {
        noiDung: [
          'Tham mưu thẩm tra kế hoạch lựa chọn nhà thầu, hồ sơ mời thầu, kết quả lựa chọn nhà thầu theo Luật Đấu thầu 22/2023 (sửa 57/2024, 90/2025) và NĐ 214/2025/NĐ-CP — trong vai trò chủ đầu tư/bên mời thầu hoặc được giao thẩm tra.',
          'Tham mưu giải quyết kiến nghị trong đấu thầu; kiểm tra, giám sát hoạt động đấu thầu.',
          'Tham mưu áp dụng hình thức lựa chọn nhà thầu phù hợp (đấu thầu rộng rãi, chỉ định thầu) theo Luật Đấu thầu.',
          'Tham mưu quản lý đấu thầu qua mạng, ứng dụng CNTT trong đấu thầu.',
        ],
        sanPham: [
          'Báo cáo thẩm tra kế hoạch lựa chọn nhà thầu.',
          'Báo cáo thẩm tra kết quả lựa chọn nhà thầu.',
          'Văn bản giải quyết kiến nghị đấu thầu.',
        ],
      }},
      { key: 'ke-hoach-von', ten: 'Kế hoạch vốn & dự toán', thamMuu: {
        noiDung: [
          'Tham mưu lập kế hoạch vốn đầu tư công trung hạn, hằng năm cho các dự án ngành XD, GT theo Luật Đầu tư công 58/2024 (sửa 90/2025) và quyết định giao kế hoạch vốn của UBND tỉnh.',
          'Tham mưu phân bổ, điều chỉnh kế hoạch vốn; đôn đốc giải ngân vốn đầu tư công.',
          'Tham mưu thẩm tra dự toán thu-chi ngân sách của Sở; lập dự toán chi thường xuyên, chi đầu tư.',
        ],
        sanPham: [
          'Kế hoạch vốn đầu tư công trung hạn/hằng năm.',
          'Báo cáo giải ngân vốn đầu tư công.',
          'Dự toán thu-chi ngân sách của Sở.',
          'Tờ trình điều chỉnh kế hoạch vốn.',
        ],
      }},
      { key: 'tai-chinh-ke-toan', ten: 'Tài chính - Kế toán', thamMuu: {
        noiDung: [
          'Tham mưu quản lý tài chính, kế toán của Sở; hạch toán, quyết toán ngân sách hằng năm.',
          'Tham mưu thanh toán, quyết toán hợp đồng xây dựng; kiểm tra tạm ứng, bảo lãnh theo NĐ 210/2026.',
          'Tham mưu quản lý tài sản công; lập báo cáo tài chính theo chế độ kế toán đơn vị HCSN.',
          'Tham mưu thực hiện chế độ lương, phụ cấp, BHXH, BHYT cho cán bộ, công chức, viên chức.',
        ],
        sanPham: [
          'Báo cáo tài chính, quyết toán ngân sách hằng năm.',
          'Bảng lương, chứng từ thanh toán.',
          'Báo cáo kiểm kê tài sản công.',
        ],
      }},
      { key: 'thong-ke', ten: 'Thống kê ngành', thamMuu: {
        noiDung: [
          'Tham mưu tổng hợp, báo cáo thống kê ngành XD, GT theo chế độ báo cáo của Bộ XD, UBND tỉnh.',
          'Tham mưu xây dựng hệ thống chỉ tiêu thống kê ngành; cập nhật dữ liệu phục vụ quy hoạch, kế hoạch.',
          'Tham mưu phối hợp Cục Thống kê, các sở ngành thực hiện điều tra thống kê chuyên ngành.',
        ],
        sanPham: [
          'Báo cáo thống kê ngành XD, GT định kỳ (tháng/quý/năm).',
          'Số liệu thống kê phục vụ lập kế hoạch, quy hoạch.',
          'Biểu mẫu thống kê chuyên ngành.',
        ],
      }},
    ],
  },

  'phong-qh-kt': {
    ma: 'PHONG_QH_KT', ten: 'Phòng Quy hoạch - Kiến trúc',
    linhVuc: [
      { key: 'csdl-quy-hoach', ten: 'CSDL quy hoạch đô thị - nông thôn', thamMuu: {
        noiDung: [
          'Tham mưu xây dựng, quản lý hệ thống thông tin và CSDL quy hoạch đô thị, nông thôn trên địa bàn tỉnh.',
          'Tham mưu cập nhật dữ liệu quy hoạch khi có đồ án QH mới được phê duyệt; cung cấp thông tin QH cho tổ chức, cá nhân.',
          'Tham mưu kết nối, liên thông CSDL QH tỉnh với CSDL QH quốc gia (Bộ XD) theo NĐ 178/2025 (sửa đổi bởi NĐ 34/2026).',
        ],
        sanPham: [
          'CSDL quy hoạch đô thị, nông thôn trên địa bàn tỉnh.',
          'Văn bản cung cấp thông tin quy hoạch.',
          'Báo cáo cập nhật CSDL quy hoạch.',
        ],
      }},
      { key: 'tham-dinh-quy-hoach', ten: 'Thẩm định, phê duyệt quy hoạch', thamMuu: {
        noiDung: [
          'Tham mưu thẩm định nhiệm vụ và đồ án quy hoạch phân khu, chi tiết theo phân cấp UBND tỉnh.',
          'Tham mưu kiểm tra sự phù hợp QH cấp trên, QCVN, đánh giá tác động; lấy ý kiến phối hợp sở ngành.',
          'Tham mưu thẩm định, lập tờ trình để UBND tỉnh phê duyệt QH theo thẩm quyền (Sở không tự phê duyệt) — QH chung đô thị loại I/loại đặc biệt và một số QH thuộc thẩm quyền Thủ tướng Chính phủ/Bộ Xây dựng, Sở chỉ phối hợp, lấy ý kiến theo Luật QHĐT-NT 47/2024 (sửa đổi 144/2025).',
          'Tham mưu điều chỉnh quy hoạch khi có căn cứ theo Chương VI Luật QHĐT-NT (NĐ 178/2025 sửa đổi bởi NĐ 34/2026).',
        ],
        sanPham: [
          'Văn bản kết quả thẩm định nhiệm vụ/đồ án quy hoạch.',
          'Tờ trình UBND tỉnh phê duyệt quy hoạch.',
          'Dự thảo Quyết định phê duyệt quy hoạch trình UBND tỉnh ký ban hành.',
          'Văn bản thông báo bổ sung hồ sơ QH.',
        ],
      }},
      { key: 'thiet-ke-do-thi', ten: 'Thiết kế đô thị', thamMuu: {
        noiDung: [
          'Tham mưu hướng dẫn, kiểm tra nội dung thiết kế đô thị trong QH phân khu, chi tiết (không gian, cảnh quan, chiều cao, mật độ XD) theo Luật Kiến trúc 40/2019/QH14 và Luật Quy hoạch đô thị - nông thôn 47/2024/QH15.',
          'Tham mưu thẩm định nội dung thiết kế đô thị: khoảng lùi, hệ số sử dụng đất, vật liệu, màu sắc, cây xanh, chiếu sáng.',
          'Tham mưu bảo tồn bản sắc kiến trúc địa phương trong thiết kế đô thị.',
        ],
        sanPham: [
          'Văn bản hướng dẫn thiết kế đô thị cho đồ án QH.',
          'Báo cáo đánh giá thiết kế đô thị khu vực.',
          'Góp ý nội dung thiết kế đô thị trong đồ án QH.',
        ],
      }},
      { key: 'quy-che-kien-truc', ten: 'Quy chế quản lý kiến trúc', thamMuu: {
        noiDung: [
          'Tham mưu chủ trì lập, điều chỉnh Quy chế quản lý kiến trúc (QCQLKT) trình UBND tỉnh ban hành.',
          'Tham mưu lấy ý kiến cộng đồng, phối hợp sở ngành khi lập QCQLKT; rà soát định kỳ (tối đa 5 năm/lần).',
          'Tham mưu hướng dẫn UBND cấp huyện thực hiện QCQLKT; kiểm tra, xử lý vi phạm.',
          'Tham mưu quy định hình thức kiến trúc, chiều cao, mái, màu sắc, vật liệu, biển hiệu cho từng khu vực.',
        ],
        sanPham: [
          'Dự thảo Quy chế quản lý kiến trúc trình UBND tỉnh.',
          'Báo cáo rà soát Quy chế quản lý kiến trúc.',
          'Văn bản hướng dẫn thực hiện QCQLKT.',
        ],
      }},
      { key: 'chung-chi-kien-truc', ten: 'Chứng chỉ hành nghề kiến trúc', thamMuu: {
        noiDung: [
          'Tham mưu tổ chức sát hạch, cấp mới, cấp lại, gia hạn chứng chỉ hành nghề kiến trúc theo Luật Kiến trúc.',
          'Tham mưu quản lý phát triển nghề nghiệp liên tục (PDU) của kiến trúc sư trên địa bàn.',
          'Tham mưu thu hồi chứng chỉ hành nghề KTS khi vi phạm; đăng ký thông tin trên hệ thống quốc gia.',
        ],
        sanPham: [
          'Chứng chỉ hành nghề kiến trúc.',
          'Quyết định thu hồi chứng chỉ hành nghề KTS.',
          'Báo cáo tổng hợp chứng chỉ hành nghề kiến trúc trên địa bàn.',
        ],
      }},
    ],
  },

  'phong-ptdt': {
    ma: 'PHONG_PTDT', ten: 'Phòng Phát triển đô thị',
    linhVuc: [
      { key: 'chuong-trinh-ptdt', ten: 'Chương trình phát triển đô thị', thamMuu: {
        noiDung: [
          'Tham mưu lập, điều chỉnh chương trình phát triển đô thị cấp tỉnh (giai đoạn 10 năm) trình UBND tỉnh phê duyệt theo NĐ 35/2026/NĐ-CP.',
          'Tham mưu xác định khu vực phát triển đô thị; lập danh mục dự án ưu tiên, lộ trình thực hiện.',
          'Tham mưu theo dõi, đánh giá kết quả thực hiện chương trình PTĐT; báo cáo Bộ XD.',
          'Tham mưu điều kiện đầu tư khu đô thị mới; thẩm định dự án khu ĐT mới theo Điều 11 NĐ 11/2013 (VBHN 04/VBHN-BXD 2026).',
        ],
        sanPham: [
          'Dự thảo Chương trình phát triển đô thị tỉnh.',
          'Tờ trình phê duyệt/điều chỉnh chương trình PTĐT.',
          'Báo cáo đánh giá thực hiện chương trình PTĐT.',
        ],
      }},
      { key: 'phan-loai-do-thi', ten: 'Phân loại đô thị', thamMuu: {
        noiDung: [
          'Tham mưu rà soát, đánh giá tiêu chí phân loại đô thị trên địa bàn tỉnh theo NQ 111/2025/UBTVQH15 (thay NQ 1210/2016, hiệu lực 01/01/2026) và NĐ 35/2026/NĐ-CP.',
          'Tham mưu lập hồ sơ đề nghị công nhận loại đô thị theo trình tự NĐ 35/2026; hướng dẫn UBND cấp xã hoàn thiện tiêu chí sau sắp xếp ĐVHC.',
          'Tham mưu theo dõi tiêu chí đô thị đặc thù (miền núi, biên giới, ven biển) tại Quảng Trị.',
        ],
        sanPham: [
          'Hồ sơ đề nghị công nhận loại đô thị.',
          'Báo cáo rà soát tiêu chí phân loại đô thị.',
          'Tờ trình UBND tỉnh về nâng loại đô thị.',
        ],
      }},
      { key: 'do-thi-thong-minh', ten: 'Đô thị thông minh & tăng trưởng xanh', thamMuu: {
        noiDung: [
          'Tham mưu triển khai phát triển đô thị thông minh theo NĐ 269/2025/NĐ-CP và TT 03/2026/TT-BXD (bản gốc có trong kho của Sở); xây dựng CSDL không gian đô thị.',
          'Tham mưu ứng dụng ICT/IoT trong quản lý đô thị; dịch vụ đô thị thông minh.',
          'Tham mưu thực hiện kế hoạch đô thị tăng trưởng xanh; giảm phát thải, tiết kiệm năng lượng, VLXD xanh.',
          'Tham mưu lồng ghép tiêu chí môi trường, bền vững trong các dự án phát triển đô thị.',
        ],
        sanPham: [
          'Kế hoạch phát triển đô thị thông minh tại Quảng Trị.',
          'Kế hoạch đô thị tăng trưởng xanh.',
          'Báo cáo triển khai đô thị thông minh, tăng trưởng xanh.',
        ],
      }},
      { key: 'tham-dinh-htkt-khu-do-thi', ten: 'Góp ý thẩm định dự án khu đô thị', thamMuu: {
        noiDung: [
          'Tham mưu ý kiến thẩm định của Sở khi cơ quan đăng ký đầu tư lấy ý kiến chấp thuận chủ trương đầu tư dự án khu đô thị (Đ29 NĐ 11/2013, VBHN 04/VBHN-BXD 2026): phù hợp quy hoạch, chương trình phát triển đô thị; đồng bộ phân kỳ đầu tư, hạ tầng trong và ngoài dự án.',
          'Tham mưu đôn đốc chủ đầu tư cấp 1 đầu tư đồng bộ hạ tầng kỹ thuật, hạ tầng xã hội và bàn giao quản lý (Đ17, Đ35, Đ38 NĐ 11/2013).',
          'Tham mưu tuân thủ QCVN 01:2021/BXD, QCVN 07:2023/BXD trong quy hoạch, dự án khu đô thị. (Thẩm định BCNCKT công trình trong dự án theo NĐ 217/2026; thiết kế triển khai do chủ đầu tư thẩm định.)',
        ],
        sanPham: [
          'Văn bản ý kiến thẩm định gửi cơ quan đăng ký đầu tư (dự án khu đô thị).',
          'Văn bản đôn đốc, kiểm tra tiến độ đầu tư hạ tầng, bàn giao quản lý khu đô thị.',
        ],
      }},
      { key: 'csdl-ptdt', ten: 'CSDL phát triển đô thị', thamMuu: {
        noiDung: [
          'Tham mưu xây dựng, quản lý CSDL phát triển đô thị trên địa bàn tỉnh theo NĐ 35/2026/NĐ-CP; tích hợp dữ liệu QH, hạ tầng, dân cư.',
          'Tham mưu cập nhật dữ liệu dự án khu ĐT, chương trình PTĐT; kết nối với CSDL quốc gia về HĐXD.',
          'Tham mưu ứng dụng CSDL phục vụ quản lý, đánh giá tình hình phát triển đô thị.',
        ],
        sanPham: [
          'CSDL phát triển đô thị trên địa bàn tỉnh.',
          'Báo cáo cập nhật, vận hành CSDL PTĐT.',
          'Bản đồ, thống kê dữ liệu phát triển đô thị.',
        ],
      }},
    ],
  },

  'phong-kt-vl': {
    ma: 'PHONG_KT_VL', ten: 'Phòng Kinh tế và Vật liệu xây dựng',
    linhVuc: [
      { key: 'dinh-muc-don-gia', ten: 'Định mức - đơn giá - chỉ số giá xây dựng', thamMuu: {
        noiDung: [
          'Tham mưu rà soát, áp dụng hệ thống định mức XD (dự toán, chi phí), đơn giá nhân công, giá ca máy theo NĐ 206/2026.',
          'Tham mưu xây dựng, điều chỉnh chỉ số giá XD theo loại công trình, khu vực trên địa bàn tỉnh.',
          'Tham mưu hướng dẫn các chủ đầu tư áp dụng định mức, đơn giá; giải quyết vướng mắc về chi phí XD.',
          'Tham mưu tham khảo giá, định mức nước ngoài khi VN chưa có (công nghệ mới, vật liệu mới) theo NĐ 206/2026.',
        ],
        sanPham: [
          'Bảng chỉ số giá XD trên địa bàn tỉnh.',
          'Văn bản hướng dẫn áp dụng định mức, đơn giá.',
          'Báo cáo rà soát hệ thống định mức XD.',
        ],
      }},
      { key: 'cong-bo-gia-vlxd', ten: 'Công bố giá vật liệu xây dựng', thamMuu: {
        noiDung: [
          'Tham mưu UBND tỉnh công bố giá VLXD địa phương hằng tháng/quý; khảo sát, thu thập giá thị trường.',
          'Tham mưu giải quyết vướng mắc biến động giá VLXD; cập nhật giá theo sát thị trường.',
          'Tham mưu kiểm tra, đối chiếu giá VLXD do nhà cung cấp, nhà thầu báo giá.',
        ],
        sanPham: [
          'Bảng công bố giá VLXD trên địa bàn tỉnh (hằng tháng/quý).',
          'Văn bản xử lý biến động giá VLXD.',
          'Báo cáo tổng hợp giá VLXD.',
        ],
      }},
      { key: 'tham-dinh-du-toan-qh', ten: 'Thẩm tra dự toán quy hoạch', thamMuu: {
        noiDung: [
          'Tham mưu thẩm tra dự toán chi phí lập quy hoạch XD, quy hoạch ĐT-NT theo NĐ 206/2026.',
          'Tham mưu thẩm tra sơ bộ tổng mức đầu tư, dự toán XD cho dự án lớn, kỹ thuật phức tạp.',
          'Tham mưu kiểm tra phương pháp xác định chi phí, áp dụng đơn giá, hệ số điều chỉnh.',
          'Tham mưu phương pháp điều chỉnh đơn giá, giá hợp đồng XD khi biến động giá theo NĐ 210/2026.',
        ],
        sanPham: [
          'Báo cáo thẩm tra dự toán chi phí quy hoạch.',
          'Báo cáo thẩm tra tổng mức đầu tư, dự toán XD.',
          'Văn bản hướng dẫn điều chỉnh đơn giá hợp đồng.',
        ],
      }},
      { key: 'quan-ly-vlxd-khoang-san', ten: 'Quản lý VLXD & khoáng sản làm VLXD', thamMuu: {
        noiDung: [
          'Tham mưu quản lý hoạt động sản xuất, kinh doanh VLXD trên địa bàn; ưu tiên VLXD xanh, tái chế, thân thiện MT.',
          'Tham mưu quản lý khoáng sản làm VLXD thông thường (cát, sỏi, đá XD): góp ý quy hoạch thăm dò/khai thác, chất lượng, cân đối cung–cầu VLXD — Sở TNMT chủ trì cấp phép khai thác khoáng sản, Sở Xây dựng không cấp phép khai thác.',
          'Tham mưu kiểm tra chất lượng sản phẩm VLXD lưu thông trên thị trường theo QCVN 16:2023/BXD.',
          'Tham mưu cơ chế khuyến khích R&D vật liệu mới, chuyển đổi xanh, giảm phát thải trong sản xuất VLXD.',
        ],
        sanPham: [
          'Báo cáo tình hình sản xuất, kinh doanh VLXD trên địa bàn.',
          'Văn bản đề xuất quản lý khoáng sản làm VLXD.',
          'Báo cáo kiểm tra chất lượng sản phẩm VLXD.',
        ],
      }},
    ],
  },

  'phong-qlkcht': {
    ma: 'PHONG_QLKCHT', ten: 'Phòng Quản lý kết cấu hạ tầng giao thông',
    linhVuc: [
      { key: 'ket-cau-ha-tang', ten: 'Kết cấu hạ tầng giao thông', thamMuu: {
        noiDung: [
          'Tham mưu quản lý đầu tư, vận hành, khai thác kết cấu hạ tầng đường bộ (quốc lộ ủy thác, tỉnh lộ, đường đô thị).',
          'Tham mưu phân loại, đánh giá hiện trạng KCHT đường bộ; đề xuất đầu tư nâng cấp, sửa chữa.',
          'Tham mưu quản lý KCHT đường sắt, đường thủy nội địa trên địa bàn theo phân cấp.',
          'Tham mưu kế hoạch bảo trì KCHT đường bộ hằng năm; phân cấp quản lý bảo trì theo NĐ 165/2024 (sửa đổi bởi NĐ 241/2026) — quản lý quốc lộ ủy thác theo quyết định ủy thác của Bộ Xây dựng/Cục Đường bộ VN.',
        ],
        sanPham: [
          'Kế hoạch đầu tư, bảo trì KCHT giao thông hằng năm.',
          'Báo cáo đánh giá hiện trạng KCHT đường bộ.',
          'Tờ trình đề xuất nâng cấp, sửa chữa công trình GT.',
        ],
      }},
      { key: 'an-toan-giao-thong', ten: 'An toàn giao thông (Thường trực Ban ATGT)', thamMuu: {
        noiDung: [
          'Tham mưu thực hiện nhiệm vụ được phân công tại Ban ATGT tỉnh (do UBND tỉnh thành lập và quy định quy chế) theo Luật TTATGT đường bộ 36/2024/QH15 — theo phân công của UBND tỉnh, không mặc định Sở là Thường trực Ban.',
          'Tham mưu xây dựng kế hoạch, chương trình bảo đảm ATGT; triển khai tuần lễ, tháng ATGT.',
          'Tham mưu rà soát, xử lý điểm đen, điểm tiềm ẩn tai nạn GT; bổ sung biển báo, rào chắn, chiếu sáng.',
          'Tham mưu tổng hợp, báo cáo tình hình ATGT trên địa bàn tỉnh; đề xuất giải pháp giảm TNGT.',
        ],
        sanPham: [
          'Kế hoạch bảo đảm ATGT hằng năm.',
          'Báo cáo tình hình ATGT định kỳ/đột xuất.',
          'Văn bản xử lý điểm đen, điểm tiềm ẩn TNGT.',
          'Tờ trình bổ sung hệ thống biển báo, an toàn đường bộ.',
        ],
      }},
      { key: 'cap-phep-thi-cong', ten: 'Cấp phép thi công trên đường bộ', thamMuu: {
        noiDung: [
          'Tham mưu cấp phép thi công trên đường bộ đang khai thác theo NĐ 165/2024 (sửa đổi bởi NĐ 241/2026).',
          'Tham mưu cấp phép đấu nối đường nhánh vào quốc lộ, tỉnh lộ; sử dụng tạm hành lang ATGT.',
          'Tham mưu kiểm tra, đôn đốc nhà thầu khôi phục mặt đường sau thi công.',
        ],
        sanPham: [
          'Giấy phép thi công trên đường bộ.',
          'Văn bản chấp thuận đấu nối đường nhánh.',
          'Biên bản kiểm tra khôi phục mặt đường sau thi công.',
        ],
      }},
      { key: 'ben-xe-cang-ben', ten: 'Bến xe - bãi đỗ - cảng, bến', thamMuu: {
        noiDung: [
          'Tham mưu quản lý bến xe khách, bãi đỗ xe, trạm dừng nghỉ trên địa bàn; kiểm tra điều kiện hoạt động.',
          'Tham mưu quy hoạch, phân loại bến xe theo NĐ 158/2024; đề xuất nâng cấp, mở mới bến xe.',
          'Tham mưu quản lý cảng, bến thủy nội địa; công bố hoạt động, kiểm tra an toàn.',
        ],
        sanPham: [
          'Văn bản phê duyệt hoạt động bến xe, bãi đỗ.',
          'Báo cáo kiểm tra điều kiện hoạt động bến xe.',
          'Quyết định công bố hoạt động cảng, bến thủy nội địa.',
        ],
      }},
      { key: 'pha-do-nong-thon-moi', ten: 'Giao thông nông thôn mới', thamMuu: {
        noiDung: [
          'Tham mưu đánh giá tiêu chí giao thông trong xây dựng nông thôn mới (tỷ lệ cứng hóa, bảo trì, ATGT).',
          'Tham mưu phối hợp đánh giá đạt tiêu chí NTM/NTM nâng cao về giao thông.',
          'Tham mưu quản lý, bảo trì đường giao thông nông thôn theo phân cấp.',
        ],
        sanPham: [
          'Báo cáo đánh giá tiêu chí GT nông thôn mới.',
          'Văn bản phối hợp công nhận xã/huyện đạt NTM.',
        ],
      }},
    ],
  },

  'phong-ql-nha': {
    ma: 'PHONG_QL_NHA', ten: 'Phòng Quản lý nhà và thị trường bất động sản',
    linhVuc: [
      { key: 'phat-trien-nha-o', ten: 'Chương trình, kế hoạch phát triển nhà ở', thamMuu: {
        noiDung: [
          'Tham mưu lập, điều chỉnh chương trình phát triển nhà ở địa phương, trình HĐND tỉnh thông qua và UBND tỉnh phê duyệt theo Luật Nhà ở 27/2023/QH15.',
          'Tham mưu xây dựng kế hoạch phát triển nhà ở 5 năm, hằng năm; xác định nhu cầu, quỹ đất, vốn.',
          'Tham mưu thẩm định điều kiện dự án ĐTXD nhà ở thương mại, nhà ở tái định cư.',
          'Tham mưu theo dõi, đánh giá tình hình thực hiện chương trình phát triển nhà ở; báo cáo Bộ XD.',
        ],
        sanPham: [
          'Dự thảo Chương trình phát triển nhà ở địa phương.',
          'Kế hoạch phát triển nhà ở 5 năm/hằng năm.',
          'Báo cáo tình hình phát triển nhà ở trên địa bàn.',
        ],
      }},
      { key: 'nha-o-xa-hoi', ten: 'Nhà ở xã hội, nhà công vụ', thamMuu: {
        noiDung: [
          'Tham mưu quản lý, phát triển nhà ở xã hội trên địa bàn; bố trí quỹ đất 20% theo Luật Nhà ở.',
          'Tham mưu thẩm định dự án NƠXH; theo dõi, công khai, cập nhật và HẬU KIỂM danh sách đối tượng mua/thuê (chủ đầu tư xét duyệt hồ sơ); giám sát giá bán (lợi nhuận ≤ 10%).',
          'Tham mưu quản lý nhà ở công vụ, nhà ở tái định cư; giá thuê, bàn giao, trả lại nhà công vụ.',
          'Tham mưu chính sách ưu đãi NƠXH: miễn tiền sử dụng đất, thuế TNDN, hỗ trợ tín dụng.',
        ],
        sanPham: [
          'Văn bản thẩm định dự án NƠXH.',
          'Danh sách đối tượng mua/thuê NƠXH được công khai, hậu kiểm.',
          'Báo cáo quản lý nhà ở công vụ, tái định cư.',
        ],
      }},
      { key: 'dinh-gia-nha', ten: 'Định giá nhà', thamMuu: {
        noiDung: [
          'Tham mưu phương pháp định giá nhà ở (thu nhập, so sánh, chi phí) theo NĐ 95/2024.',
          'Tham mưu UBND tỉnh ban hành giá thuê nhà ở thuộc sở hữu nhà nước, nhà ở công vụ (NĐ 95/2024).',
          'Tham mưu thẩm định giá bán, giá thuê mua nhà ở xã hội do chủ đầu tư lập theo Điều 35 NĐ 100/2024 (chủ đầu tư xây dựng giá, Sở Xây dựng thẩm định — không phải UBND tỉnh quyết định giá bán NƠXH).',
          'Tham mưu giải quyết vướng mắc về giá nhà ở, đất ở gắn liền nhà; phối hợp Sở TNMT về giá đất.',
        ],
        sanPham: [
          'Tờ trình UBND tỉnh ban hành giá thuê nhà ở thuộc SHNN/nhà công vụ.',
          'Văn bản thẩm định giá bán/thuê mua nhà ở xã hội.',
          'Văn bản hướng dẫn phương pháp định giá nhà.',
        ],
      }},
      { key: 'thi-truong-bds', ten: 'Quản lý thị trường BĐS & chứng chỉ môi giới', thamMuu: {
        noiDung: [
          'Tham mưu quản lý hoạt động kinh doanh BĐS trên địa bàn; kiểm tra điều kiện KD BĐS (thành lập doanh nghiệp; bảo đảm tỷ lệ vốn chủ sở hữu theo dự án — Điều 6 NĐ 96/2024, không còn ngưỡng vốn pháp định cố định).',
          'Tham mưu tổ chức sát hạch, cấp chứng chỉ hành nghề môi giới BĐS theo NĐ 96/2024.',
          'Tham mưu quản lý sàn giao dịch BĐS; kiểm tra nghĩa vụ công khai thông tin giao dịch.',
          'Tham mưu xử lý vi phạm kinh doanh BĐS; thu hồi chứng chỉ, đình chỉ hoạt động sàn.',
        ],
        sanPham: [
          'Chứng chỉ hành nghề môi giới BĐS.',
          'Báo cáo tình hình thị trường BĐS trên địa bàn.',
          'Quyết định xử phạt vi phạm kinh doanh BĐS.',
        ],
      }},
      { key: 'he-thong-thong-tin', ten: 'Hệ thống thông tin về nhà ở & thị trường BĐS', thamMuu: {
        noiDung: [
          'Tham mưu xây dựng, quản lý, vận hành hệ thống thông tin nhà ở & thị trường BĐS cấp tỉnh theo NĐ 94/2024.',
          'Tham mưu thu thập dữ liệu giao dịch BĐS từ CĐT, sàn GD BĐS; công khai thông tin theo quy định.',
          'Tham mưu kết nối, chia sẻ dữ liệu với HTTT quốc gia về nhà ở & BĐS (Bộ XD).',
        ],
        sanPham: [
          'HTTT nhà ở & thị trường BĐS cấp tỉnh.',
          'Báo cáo giao dịch BĐS định kỳ.',
          'Chỉ số thị trường BĐS trên địa bàn.',
        ],
      }},
    ],
  },

  'phong-ql-vt': {
    ma: 'PHONG_QL_VT', ten: 'Phòng Quản lý vận tải',
    linhVuc: [
      { key: 'dang-kiem-duong-thuy', ten: 'Đăng ký - đăng kiểm phương tiện đường thủy nội địa', thamMuu: {
        noiDung: [
          'Tham mưu tiếp nhận, xử lý hồ sơ đăng ký, xóa đăng ký phương tiện thủy nội địa theo Luật GTĐTNĐ 23/2004 (sửa 48/2014) và Thông tư 09/2025/TT-BXD — phân cấp: Sở XD đăng ký phương tiện VR-SB/không động cơ >15 tấn/có động cơ, UBND cấp xã đăng ký phương tiện nhỏ còn lại.',
          'Tham mưu phối hợp Cục Đăng kiểm Việt Nam về đăng kiểm an toàn kỹ thuật, bảo vệ môi trường phương tiện thủy nội địa theo Thông tư 28/2026/TT-BXD (hiệu lực 01/8/2026); TT 38/2025/TT-BXD về giá dịch vụ đăng kiểm.',
          'Tham mưu quản lý đào tạo, thi, cấp/cấp lại/chuyển đổi giấy chứng nhận khả năng chuyên môn (GCNKNCM), chứng chỉ chuyên môn (CCCM) thuyền viên, người lái phương tiện thủy nội địa theo Thông tư 09/2025/TT-BXD.',
        ],
        sanPham: [
          'Giấy chứng nhận đăng ký phương tiện thủy nội địa.',
          'Giấy chứng nhận an toàn kỹ thuật phương tiện thủy.',
          'Sổ đăng ký phương tiện thủy trên địa bàn.',
        ],
      }},
      { key: 'dao-tao-sat-hach', ten: 'Đào tạo - sát hạch, cấp chứng chỉ', thamMuu: {
        noiDung: [
          'Tham mưu quản lý cơ sở đào tạo lái xe trên địa bàn (điều kiện, sân tập, xe tập lái, giáo viên) theo NĐ 158/2024.',
          'Tham mưu kiểm tra lưu lượng đào tạo, chương trình đào tạo theo hạng GPLX; xử lý vi phạm cơ sở đào tạo.',
          'Tham mưu cấp chứng chỉ điều khiển phương tiện thủy nội địa (vẫn thuộc Sở sau khi sát hạch GPLX chuyển Bộ CA).',
          'Tham mưu theo dõi, đánh giá chất lượng đào tạo lái xe; phối hợp cơ quan Công an về sát hạch.',
        ],
        sanPham: [
          'Văn bản chấp thuận hoạt động cơ sở đào tạo lái xe.',
          'Chứng chỉ điều khiển phương tiện thủy nội địa.',
          'Báo cáo kiểm tra cơ sở đào tạo lái xe.',
        ],
      }},
      { key: 'quan-ly-van-tai', ten: 'Quản lý vận tải, bến xe, taxi', thamMuu: {
        noiDung: [
          'Tham mưu quản lý hoạt động vận tải HK tuyến cố định, hợp đồng, du lịch, taxi trên địa bàn tỉnh.',
          'Tham mưu cấp phù hiệu, biển hiệu xe kinh doanh vận tải; quản lý tuyến, biểu đồ chạy xe.',
          'Tham mưu quản lý bến xe khách; kiểm tra điều kiện hoạt động, phân loại bến xe theo NĐ 158/2024.',
          'Tham mưu xử lý vi phạm kinh doanh vận tải (không phép, quá tải, vượt tuyến).',
        ],
        sanPham: [
          'Phù hiệu, biển hiệu xe kinh doanh vận tải.',
          'Văn bản phê duyệt tuyến, biểu đồ chạy xe.',
          'Báo cáo tình hình hoạt động vận tải trên địa bàn.',
          'Quyết định xử phạt vi phạm kinh doanh vận tải.',
        ],
      }},
      { key: 'van-tai-cong-cong', ten: 'Vận tải hành khách công cộng', thamMuu: {
        noiDung: [
          'Tham mưu quy hoạch mạng lưới tuyến xe buýt, vận tải HK công cộng trên địa bàn tỉnh.',
          'Tham mưu chính sách trợ giá, trợ cước vận tải HK công cộng theo quy định đặt hàng/đấu thầu cung cấp sản phẩm, dịch vụ công ích (NĐ 32/2019/NĐ-CP); khuyến khích xe buýt điện, năng lượng xanh.',
          'Tham mưu quản lý biểu đồ, lịch trình hoạt động xe buýt; kiểm tra chất lượng dịch vụ.',
        ],
        sanPham: [
          'Quy hoạch mạng lưới tuyến xe buýt.',
          'Phương án trợ giá vận tải HK công cộng.',
          'Báo cáo hoạt động vận tải HK công cộng.',
        ],
      }},
      { key: 'htx-gtvt', ten: 'Hợp tác xã giao thông vận tải', thamMuu: {
        noiDung: [
          'Tham mưu quản lý nhà nước về HOẠT ĐỘNG VẬN TẢI của HTX GTVT trên địa bàn (điều kiện kinh doanh vận tải, phương tiện, tuyến). Việc đăng ký thành lập/giải thể/phá sản HTX thuộc cơ quan đăng ký kinh doanh, không thuộc Sở XD.',
          'Tham mưu kiểm tra hoạt động vận tải, quản trị HTX GTVT; hỗ trợ, ưu đãi HTX GTVT theo chính sách của tỉnh.',
          'Tham mưu phối hợp xử lý vi phạm về kinh doanh vận tải của HTX GTVT.',
        ],
        sanPham: [
          'Báo cáo tình hình hoạt động vận tải của HTX GTVT trên địa bàn.',
          'Văn bản kiểm tra, đánh giá hoạt động vận tải HTX GTVT.',
        ],
      }},
    ],
  },
}

export function getThamMuuPhong(key: string): ThamMuuPhong | undefined {
  return THAM_MUU_PHONG[key]
}
