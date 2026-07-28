// Công việc thường xuyên của 9 phòng thuộc Sở XD Quảng Trị (trừ Phòng HTKT).
// Căn cứ chức năng, nhiệm vụ theo Quyết định 331/QĐ-SXD ngày 05/9/2025.

export type NhomCongViec = { nhom: string; tanSuat: string; viec: string[] }
export type CongViecPhong = { ma: string; ten: string; congViec: NhomCongViec[] }

export const CONG_VIEC_PHONG: Record<string, CongViecPhong> = {
  'phong-clct': {
    ma: 'PHONG_CLCT', ten: 'Phòng Quản lý chất lượng công trình giao thông',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo văn bản QPPL, hướng dẫn nghiệp vụ về quản lý chất lượng, an toàn thi công công trình GT.',
        'Xây dựng kế hoạch kiểm tra chất lượng, an toàn thi công công trình GT hằng năm.',
        'Soạn văn bản hướng dẫn áp dụng định mức, đơn giá, quy trình bảo trì công trình GT.',
      ]},
      { nhom: 'Thẩm định, kiểm tra', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm định hồ sơ BCNCKT, BCKTKT, thiết kế triển khai sau TKCS công trình GT theo phân cấp.',
        'Kiểm tra công tác nghiệm thu công trình GT hoàn thành (bao gồm nghiệm thu PCCC tích hợp).',
        'Kiểm tra chất lượng, an toàn thi công tại công trường; yêu cầu khắc phục khi vi phạm.',
        'Thẩm tra dự toán, áp dụng định mức, đơn giá cho công trình GT.',
      ]},
      { nhom: 'Bảo trì, giám định', tanSuat: 'Thường xuyên', viec: [
        'Theo dõi, đôn đốc công tác bảo trì KCHT đường bộ theo phân cấp.',
        'Tổ chức giám định tư pháp chất lượng công trình XD GT khi có yêu cầu của cơ quan tố tụng.',
        'Tiếp nhận, xử lý sự cố công trình GT; lập báo cáo sự cố theo quy định (24 giờ).',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật CSDL về thẩm định thiết kế, kiểm tra nghiệm thu công trình GT.',
        'Lập báo cáo định kỳ (tháng/quý/năm) về tình hình chất lượng, an toàn công trình GT.',
        'Tổng hợp số liệu phục vụ lập kế hoạch bảo trì, đầu tư công trình GT.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Phòng QLKCHT, UBND cấp huyện kiểm tra trật tự, chất lượng công trình GT.',
        'Phối hợp cơ quan Công an thẩm định PCCC đồng thời (điểm e, g khoản 1 Điều 16 Luật 55/2024).',
        'Hướng dẫn, tập huấn nghiệp vụ quản lý chất lượng cho UBND cấp huyện, chủ đầu tư.',
      ]},
    ],
  },

  'phong-qlhd-xd': {
    ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo văn bản QPPL, hướng dẫn nghiệp vụ về cấp GPXD, trật tự XD, chứng chỉ hành nghề.',
        'Xây dựng kế hoạch kiểm tra trật tự XD hằng năm; phương án xử lý công trình vi phạm.',
        'Soạn văn bản hướng dẫn UBND cấp huyện, xã về cấp GPXD nhà ở riêng lẻ (phân cấp từ 01/7/2026).',
      ]},
      { nhom: 'Thẩm định, cấp phép', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm định hồ sơ cấp GPXD công trình cấp II trở lên, công trình đặc thù; gia hạn, điều chỉnh GPXD.',
        'Thẩm định BCNCKT, BCKTKT, thiết kế công trình dân dụng, công nghiệp nhẹ, khu ĐT, nhà ở.',
        'Tổ chức sát hạch, cấp chứng chỉ hành nghề HĐXD, chứng chỉ năng lực tổ chức.',
        'Thẩm định hồ sơ cấp phép nhà thầu nước ngoài hoạt động XD tại Quảng Trị.',
      ]},
      { nhom: 'Kiểm tra trật tự xây dựng', tanSuat: 'Thường xuyên', viec: [
        'Kiểm tra, phát hiện, xử lý vi phạm trật tự XD trên địa bàn; đình chỉ thi công, cưỡng chế phá dỡ.',
        'Công khai GPXD đã cấp trên cổng điện tử (≥ 12 tháng) theo NĐ 217/2026.',
        'Kiểm tra hoạt động phòng thí nghiệm chuyên ngành XD (LAS-XD).',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật CSDL quốc gia về HĐXD (năng lực cá nhân, tổ chức, GPXD).',
        'Lập báo cáo tình hình trật tự XD, cấp GPXD, chứng chỉ hành nghề định kỳ.',
        'Tổng hợp số liệu phục vụ kiểm tra, đánh giá CCHC lĩnh vực XD.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp UBND cấp huyện, xã trong quản lý trật tự XD; hướng dẫn nghiệp vụ cấp GPXD.',
        'Phối hợp cơ quan Công an thẩm định PCCC khi cấp GPXD cho công trình thuộc Phụ lục III/IV NĐ 105/2025.',
        'Tiếp nhận, giải quyết khiếu nại, tố cáo liên quan hoạt động XD.',
      ]},
    ],
  },

  'phong-kh-tc': {
    ma: 'PHONG_KH_TC', ten: 'Phòng Kế hoạch - Tài chính',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo kế hoạch phát triển ngành XD, GT trung hạn và hằng năm.',
        'Xây dựng dự toán thu-chi ngân sách, kế hoạch vốn đầu tư công của Sở.',
        'Soạn văn bản hướng dẫn nghiệp vụ đấu thầu, kế hoạch vốn, tài chính cho các đơn vị.',
      ]},
      { nhom: 'Thẩm định, kiểm tra', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm tra kế hoạch lựa chọn nhà thầu, hồ sơ mời thầu, kết quả lựa chọn nhà thầu.',
        'Thẩm tra dự toán, tổng mức đầu tư dự án thuộc thẩm quyền.',
        'Kiểm tra thanh toán, quyết toán hợp đồng XD; tạm ứng, bảo lãnh theo quy định.',
        'Kiểm tra chứng từ kế toán, sổ sách, báo cáo tài chính của Sở và đơn vị trực thuộc.',
      ]},
      { nhom: 'Tài chính, kế toán', tanSuat: 'Thường xuyên', viec: [
        'Hạch toán kế toán thu-chi ngân sách; lập chứng từ thanh toán lương, phụ cấp, BHXH.',
        'Quản lý tài sản công; lập sổ theo dõi, kiểm kê tài sản định kỳ.',
        'Đôn đốc giải ngân vốn đầu tư công; theo dõi tiến độ giải ngân các dự án.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Lập báo cáo tài chính, quyết toán ngân sách hằng năm.',
        'Tổng hợp báo cáo thống kê ngành XD, GT (tháng/quý/năm) gửi Bộ XD, UBND tỉnh.',
        'Cập nhật số liệu giải ngân, kế hoạch vốn phục vụ điều hành.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Sở Tài chính, Sở KHĐT về phân bổ ngân sách, kế hoạch vốn.',
        'Phối hợp Cục Thống kê thực hiện điều tra, báo cáo thống kê chuyên ngành.',
        'Giải quyết kiến nghị về đấu thầu; phối hợp thanh tra kiểm tra tài chính.',
      ]},
    ],
  },

  'phong-qh-kt': {
    ma: 'PHONG_QH_KT', ten: 'Phòng Quy hoạch - Kiến trúc',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo văn bản QPPL, hướng dẫn nghiệp vụ về quy hoạch, kiến trúc.',
        'Chủ trì lập, điều chỉnh Quy chế quản lý kiến trúc trình UBND tỉnh ban hành.',
        'Xây dựng quy định thiết kế đô thị cho các khu vực trọng điểm.',
      ]},
      { nhom: 'Thẩm định, cấp phép', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm định nhiệm vụ và đồ án quy hoạch phân khu, chi tiết theo phân cấp.',
        'Thẩm định nội dung thiết kế đô thị trong đồ án QH (chiều cao, mật độ, khoảng lùi, vật liệu).',
        'Tổ chức sát hạch, cấp chứng chỉ hành nghề kiến trúc; gia hạn, thu hồi chứng chỉ.',
        'Cung cấp thông tin quy hoạch, giấy phép quy hoạch cho tổ chức, cá nhân.',
      ]},
      { nhom: 'Quản lý quy hoạch, kiến trúc', tanSuat: 'Thường xuyên', viec: [
        'Kiểm tra việc thực hiện quy hoạch đã phê duyệt; xử lý vi phạm quy hoạch.',
        'Rà soát Quy chế quản lý kiến trúc; hướng dẫn UBND cấp huyện thực hiện.',
        'Quản lý phát triển nghề nghiệp liên tục (PDU) của kiến trúc sư trên địa bàn.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật CSDL quy hoạch đô thị, nông thôn; kết nối CSDL QH quốc gia.',
        'Lập báo cáo tình hình lập, thẩm định, phê duyệt quy hoạch trên địa bàn.',
        'Tổng hợp số liệu chứng chỉ hành nghề kiến trúc; công khai trên hệ thống.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Lấy ý kiến cộng đồng dân cư khi lập đồ án QH; phối hợp sở ngành thẩm định QH.',
        'Phối hợp Phòng PTĐT về quy hoạch trong chương trình phát triển đô thị.',
        'Hướng dẫn UBND cấp huyện về quy hoạch nông thôn, quy hoạch chi tiết.',
      ]},
    ],
  },

  'phong-ptdt': {
    ma: 'PHONG_PTDT', ten: 'Phòng Phát triển đô thị',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo chương trình phát triển đô thị tỉnh; kế hoạch phân loại, nâng loại đô thị.',
        'Xây dựng kế hoạch phát triển đô thị thông minh, tăng trưởng xanh tại Quảng Trị.',
        'Soạn văn bản hướng dẫn điều kiện đầu tư khu đô thị mới, chuyển nhượng đất có HTKT.',
      ]},
      { nhom: 'Thẩm định, kiểm tra', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm định HTKT khu đô thị mới (đường, cấp thoát nước, điện, chiếu sáng, viễn thông, xử lý rác).',
        'Kiểm tra nội dung PCCC khu ĐT mới (hạng mục thuộc Phụ lục III NĐ 105/2025).',
        'Rà soát, đánh giá tiêu chí phân loại đô thị; lập hồ sơ đề nghị công nhận loại đô thị.',
        'Kiểm tra điều kiện chuyển nhượng quyền sử dụng đất có HTKT trong khu ĐT.',
      ]},
      { nhom: 'Đô thị thông minh, tăng trưởng xanh', tanSuat: 'Thường xuyên', viec: [
        'Triển khai ứng dụng ICT/IoT trong quản lý đô thị; xây dựng CSDL không gian đô thị.',
        'Theo dõi chỉ tiêu đô thị tăng trưởng xanh (giảm phát thải, tiết kiệm năng lượng, VLXD xanh).',
        'Lồng ghép tiêu chí bền vững, bảo vệ môi trường vào dự án PTĐT.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật CSDL phát triển đô thị; tích hợp dữ liệu QH, hạ tầng, dân cư.',
        'Lập báo cáo đánh giá thực hiện chương trình PTĐT (gửi Bộ XD, UBND tỉnh).',
        'Tổng hợp số liệu phân loại đô thị, khu ĐT mới trên địa bàn.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Phòng QH-KT về quy hoạch trong chương trình PTĐT.',
        'Phối hợp UBND cấp huyện về nâng loại đô thị; hướng dẫn hoàn thiện tiêu chí.',
        'Phối hợp Sở TNMT, Sở TTTT về tăng trưởng xanh, chuyển đổi số đô thị.',
      ]},
    ],
  },

  'phong-kt-vl': {
    ma: 'PHONG_KT_VL', ten: 'Phòng Kinh tế và Vật liệu xây dựng',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo văn bản hướng dẫn áp dụng định mức, đơn giá, chỉ số giá XD trên địa bàn.',
        'Xây dựng phương án công bố giá VLXD địa phương; cơ chế khuyến khích VLXD xanh, tái chế.',
        'Soạn văn bản giải quyết vướng mắc biến động giá VLXD, điều chỉnh đơn giá hợp đồng.',
      ]},
      { nhom: 'Thẩm định, kiểm tra', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm tra dự toán chi phí lập quy hoạch XD, quy hoạch ĐT-NT.',
        'Thẩm tra sơ bộ tổng mức đầu tư, dự toán XD cho dự án thuộc thẩm quyền.',
        'Kiểm tra chất lượng sản phẩm VLXD lưu thông trên thị trường theo QCVN 16:2023/BXD.',
      ]},
      { nhom: 'Khảo sát, công bố giá VLXD', tanSuat: 'Thường xuyên', viec: [
        'Khảo sát, thu thập giá VLXD trên thị trường; tổng hợp trình UBND tỉnh công bố (hằng tháng/quý).',
        'Rà soát, cập nhật hệ thống định mức, đơn giá nhân công, giá ca máy theo NĐ 206/2026.',
        'Theo dõi biến động giá VLXD; phối hợp CĐT điều chỉnh giá hợp đồng khi cần.',
        'Quản lý hoạt động sản xuất, kinh doanh VLXD; phối hợp Sở TNMT về khoáng sản làm VLXD.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật bảng giá VLXD, chỉ số giá XD trên địa bàn tỉnh.',
        'Lập báo cáo tình hình sản xuất, kinh doanh VLXD; số liệu khoáng sản làm VLXD.',
        'Tổng hợp số liệu phục vụ lập kế hoạch, quy hoạch phát triển VLXD.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Sở TNMT quản lý khoáng sản làm VLXD (cát, sỏi, đá); cấp phép khai thác.',
        'Phối hợp Sở Công Thương kiểm tra chất lượng VLXD trên thị trường.',
        'Hướng dẫn CĐT, nhà thầu áp dụng định mức, đơn giá; giải đáp vướng mắc chi phí XD.',
      ]},
    ],
  },

  'phong-qlkcht': {
    ma: 'PHONG_QLKCHT', ten: 'Phòng Quản lý kết cấu hạ tầng giao thông',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo văn bản về đầu tư, vận hành, bảo trì KCHT giao thông.',
        'Xây dựng kế hoạch bảo đảm ATGT hằng năm; phương án xử lý điểm đen TNGT.',
        'Soạn văn bản phân cấp quản lý đường bộ (quốc lộ ủy thác, tỉnh lộ, đường đô thị, đường xã).',
      ]},
      { nhom: 'Thẩm định, cấp phép', tanSuat: 'Theo hồ sơ', viec: [
        'Cấp phép thi công trên đường bộ đang khai thác; cấp phép đấu nối đường nhánh vào quốc lộ/tỉnh lộ.',
        'Thẩm định điều kiện hoạt động bến xe, bãi đỗ xe; công bố hoạt động cảng, bến thủy nội địa.',
        'Cấp phép nhập khẩu tàu biển phá dỡ; kiểm tra cơ sở phá dỡ tàu biển.',
      ]},
      { nhom: 'An toàn giao thông, bảo trì', tanSuat: 'Thường xuyên', viec: [
        'Thực hiện nhiệm vụ Thường trực Ban ATGT tỉnh; triển khai tuần lễ, tháng ATGT.',
        'Rà soát, xử lý điểm đen, điểm tiềm ẩn TNGT; bổ sung biển báo, rào chắn, chiếu sáng.',
        'Theo dõi, đôn đốc bảo trì KCHT đường bộ; kiểm tra nhà thầu khôi phục mặt đường sau thi công.',
        'Đánh giá tiêu chí giao thông nông thôn mới; phối hợp công nhận xã/huyện đạt NTM.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật CSDL KCHT giao thông (đường bộ, bến xe, cảng bến) trên địa bàn.',
        'Lập báo cáo tình hình ATGT, bảo trì KCHT giao thông định kỳ.',
        'Tổng hợp số liệu phục vụ lập kế hoạch đầu tư, bảo trì công trình GT.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Phòng CLCT về chất lượng, nghiệm thu công trình GT.',
        'Phối hợp UBND cấp huyện, Công an tỉnh về trật tự ATGT; kiểm tra bến xe, bãi đỗ.',
        'Phối hợp Ban ATGT tỉnh triển khai chương trình, chiến dịch ATGT.',
      ]},
    ],
  },

  'phong-ql-nha': {
    ma: 'PHONG_QL_NHA', ten: 'Phòng Quản lý nhà và thị trường bất động sản',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo chương trình, kế hoạch phát triển nhà ở địa phương (5 năm, hằng năm).',
        'Xây dựng chính sách NƠXH, nhà công vụ; phương án giá thuê nhà ở thuộc SHNN.',
        'Soạn văn bản hướng dẫn kinh doanh BĐS, điều kiện sàn giao dịch, môi giới BĐS.',
      ]},
      { nhom: 'Thẩm định, cấp phép', tanSuat: 'Theo hồ sơ', viec: [
        'Thẩm định điều kiện dự án ĐTXD nhà ở thương mại, nhà ở tái định cư, dự án NƠXH.',
        'Tổ chức sát hạch, cấp chứng chỉ hành nghề môi giới BĐS.',
        'Xét duyệt đối tượng mua/thuê nhà ở xã hội; kiểm tra giá bán NƠXH (lợi nhuận ≤ 10%).',
        'Kiểm tra điều kiện kinh doanh BĐS (pháp nhân, vốn ≥ 50 tỷ); xử phạt vi phạm.',
      ]},
      { nhom: 'Quản lý nhà ở, thị trường BĐS', tanSuat: 'Thường xuyên', viec: [
        'Quản lý nhà ở công vụ, nhà tái định cư; theo dõi giá thuê, bàn giao, trả lại nhà.',
        'Theo dõi tình hình thị trường BĐS; kiểm tra sàn giao dịch, nghĩa vụ công khai thông tin.',
        'Thu thập dữ liệu giao dịch BĐS từ CĐT, sàn GD; công khai thông tin theo quy định.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật HTTT nhà ở & thị trường BĐS cấp tỉnh; kết nối HTTT quốc gia (Bộ XD).',
        'Lập báo cáo tình hình phát triển nhà ở, giao dịch BĐS định kỳ.',
        'Tổng hợp chỉ số thị trường BĐS; số liệu NƠXH, nhà công vụ trên địa bàn.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Sở TNMT về giá đất, giao đất xây dựng nhà ở; quyền sử dụng đất gắn nhà.',
        'Phối hợp UBND cấp huyện xét duyệt đối tượng NƠXH; quản lý nhà ở trên địa bàn.',
        'Phối hợp Sở Tài chính về giá thuê nhà ở thuộc SHNN; kinh phí bảo trì nhà ở.',
      ]},
    ],
  },

  'phong-ql-vt': {
    ma: 'PHONG_QL_VT', ten: 'Phòng Quản lý vận tải',
    congViec: [
      { nhom: 'Tham mưu, xây dựng văn bản', tanSuat: 'Theo phát sinh', viec: [
        'Soạn dự thảo quy hoạch mạng lưới tuyến xe buýt, vận tải HK công cộng.',
        'Xây dựng phương án trợ giá vận tải công cộng; chính sách khuyến khích xe buýt điện.',
        'Soạn văn bản hướng dẫn hoạt động vận tải, đào tạo lái xe, HTX GTVT.',
      ]},
      { nhom: 'Thẩm định, cấp phép', tanSuat: 'Theo hồ sơ', viec: [
        'Cấp đăng ký, xóa đăng ký phương tiện thủy nội địa; cấp giấy chứng nhận an toàn kỹ thuật.',
        'Cấp phù hiệu, biển hiệu xe kinh doanh vận tải; phê duyệt tuyến, biểu đồ chạy xe.',
        'Cấp chứng chỉ điều khiển phương tiện thủy nội địa.',
        'Chấp thuận hoạt động cơ sở đào tạo lái xe; kiểm tra điều kiện hoạt động.',
      ]},
      { nhom: 'Quản lý vận tải, bến xe', tanSuat: 'Thường xuyên', viec: [
        'Kiểm tra hoạt động vận tải HK tuyến cố định, taxi, hợp đồng, du lịch trên địa bàn.',
        'Kiểm tra điều kiện bến xe khách, bãi đỗ, trạm dừng nghỉ; xử phạt vi phạm.',
        'Quản lý lưu lượng đào tạo lái xe; phối hợp cơ quan Công an về sát hạch GPLX.',
        'Hướng dẫn thành lập, quản trị HTX GTVT; kiểm tra hoạt động HTX.',
      ]},
      { nhom: 'Cơ sở dữ liệu, báo cáo', tanSuat: 'Định kỳ', viec: [
        'Cập nhật sổ đăng ký phương tiện thủy; CSDL cơ sở đào tạo lái xe.',
        'Lập báo cáo tình hình hoạt động vận tải, bến xe, HTX GTVT trên địa bàn.',
        'Tổng hợp số liệu phù hiệu, biển hiệu, chứng chỉ điều khiển phương tiện đã cấp.',
      ]},
      { nhom: 'Phối hợp, hành chính', tanSuat: 'Thường xuyên', viec: [
        'Phối hợp Công an tỉnh về đào tạo lái xe, sát hạch, GPLX (sau chuyển giao 01/01/2025).',
        'Phối hợp Phòng QLKCHT về quản lý bến xe, bãi đỗ, KCHT vận tải.',
        'Phối hợp UBND cấp huyện quản lý vận tải, HTX GTVT; giải quyết khiếu nại.',
      ]},
    ],
  },
}

export function getCongViecPhong(key: string): CongViecPhong | undefined {
  return CONG_VIEC_PHONG[key]
}
