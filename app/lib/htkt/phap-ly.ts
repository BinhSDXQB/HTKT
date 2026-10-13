// Danh mục căn cứ pháp lý chuyên ngành Phòng Hạ tầng kỹ thuật (cập nhật 4/7/2026; rà soát lại 13/10/2026:
// NĐ 347/2026 sửa NĐ 105 về PCCC, QCVN 07:2023 thay QCVN 07:2016, QCVN 14:2025, NĐ 212/2026, TT 12/2024 mô tả lại đúng phạm vi).
// Dùng cho trang /dashboard/phong-htkt/phap-ly và làm gợi ý "Căn cứ" khi soạn văn bản.
// Lưu ý hiệu lực: nhiều văn bản vừa thay thế trong 2024–2026 — xem field ghiChu.

export type LoaiVanBan = 'Luật' | 'Nghị định' | 'Thông tư' | 'QCVN' | 'TCVN' | 'Quyết định' | 'Nghị quyết'

export type VanBan = {
  loai: LoaiVanBan
  soHieu: string
  ten: string
  hieuLuc?: string   // mốc hiệu lực hoặc ngày ban hành
  ghiChu?: string    // thay thế / sửa đổi / lưu ý áp dụng
  trongTam?: boolean // văn bản cốt lõi của lĩnh vực
}

// Các lĩnh vực HTKT (khớp path /dashboard/phong-htkt/<key>)
export const LINH_VUC_HTKT = [
  { key: 'cap-nuoc', ten: 'Cấp nước sạch đô thị' },
  { key: 'thoat-nuoc', ten: 'Thoát nước & xử lý nước thải' },
  { key: 'cay-xanh', ten: 'Công viên, cây xanh đô thị' },
  { key: 'chieu-sang', ten: 'Chiếu sáng đô thị' },
  { key: 'nghia-trang', ten: 'Nghĩa trang & cơ sở hỏa táng' },
  { key: 'giao-thong-do-thi', ten: 'Hạ tầng giao thông đô thị' },
  { key: 'khong-gian-ngam', ten: 'Không gian xây dựng ngầm' },
  { key: 'su-dung-chung', ten: 'Sử dụng chung công trình HTKT' },
] as const

export type LinhVucKey = (typeof LINH_VUC_HTKT)[number]['key']

// ───────── Văn bản chung: xây dựng, thẩm định, chất lượng, chi phí, thể thức ─────────
export const PHAP_LY_CHUNG: VanBan[] = [
  {
    loai: 'Luật', soHieu: '135/2025/QH15', ten: 'Luật Xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026 (Điều 43, 71, 95 từ 01/01/2026)',
    ghiChu: 'Thay Luật Xây dựng 2014 và Luật sửa đổi 2020. Tăng phân cấp thẩm định, kiểm tra nghiệm thu cho địa phương.',
    trongTam: true,
  },
  {
    loai: 'Nghị định', soHieu: '217/2026/NĐ-CP', ten: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Xây dựng về quản lý hoạt động xây dựng',
    hieuLuc: 'Ban hành 19/6/2026 · hiệu lực 01/7/2026',
    ghiChu: 'NĐ 175/2024/NĐ-CP hết hiệu lực từ 01/7/2026 (Đ75). Thẩm định BCNCKT tại cơ quan chuyên môn (Đ32–38), thời hạn Đ37; thiết kế triển khai do chủ đầu tư thẩm định (Đ41); cấp phép, trật tự xây dựng. Đ74 (sửa NĐ 105 về PCCC) đã bị bãi bỏ bởi NĐ 347/2026.',
    trongTam: true,
  },
  {
    loai: 'Nghị định', soHieu: '105/2025/NĐ-CP', ten: 'Quy định chi tiết Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',
    hieuLuc: 'Hiệu lực 01/7/2025 · sửa đổi bởi NĐ 347/2026/NĐ-CP (hiệu lực 15/9/2026)',
    ghiChu: 'Đ6 k1: cơ quan chuyên môn về xây dựng thẩm định thiết kế PCCC tích hợp trong thẩm định BCNCKT. Phụ lục III (thay bởi NĐ 347) mục 11: hạ tầng kỹ thuật khu đô thị, khu nhà ở, KCN, CCN, khu du lịch… thuộc diện thẩm định thiết kế PCCC. Thủ tục kiểm tra nghiệm thu PCCC đã bị bãi bỏ.',
    trongTam: true,
  },
  {
    loai: 'Luật', soHieu: '55/2024/QH15', ten: 'Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',
    hieuLuc: 'Hiệu lực 01/7/2025',
  },
  {
    loai: 'Nghị định', soHieu: '212/2026/NĐ-CP', ten: 'Điều kiện năng lực hoạt động xây dựng; Hệ thống thông tin, Cơ sở dữ liệu quốc gia về hoạt động xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Mã số chứng chỉ hành nghề 8 chữ số; miễn chứng chỉ hành nghề với công viên cây xanh, chiếu sáng công cộng, cáp viễn thông (Đ27 k3); tổ chức tự công khai năng lực trên csdlhdxd.gov.vn (Đ41), không bắt buộc chứng chỉ năng lực.',
  },
  {
    loai: 'Luật', soHieu: '58/2024/QH15', ten: 'Luật Đầu tư công (sửa đổi bởi Luật 90/2025/QH15)',
    hieuLuc: 'Hiệu lực 01/01/2025; bản sửa đổi 01/7/2025',
    ghiChu: 'Đ9–11 phân nhóm dự án: cấp thoát nước, xử lý rác thải, HTKT khác — nhóm A từ 3.000 tỷ; HTKT khu đô thị mới — nhóm A từ 2.000 tỷ. Luật 90/2025 không sửa ngưỡng.',
  },
  {
    loai: 'Nghị định', soHieu: '207/2026/NĐ-CP', ten: 'Quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Thay Nghị định 06/2021/NĐ-CP; chi tiết Luật Xây dựng 2025. Liên quan kiểm tra công tác nghiệm thu của cơ quan chuyên môn.',
  },
  {
    loai: 'Nghị định', soHieu: '206/2026/NĐ-CP', ten: 'Quản lý chi phí đầu tư xây dựng',
    hieuLuc: 'Ban hành 15/6/2026 · hiệu lực 01/7/2026',
    ghiChu: 'Thay Nghị định 10/2021/NĐ-CP. Cơ sở thẩm định tổng mức đầu tư, dự toán, định mức; quản lý chi phí dịch vụ HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '34/2026/TT-BXD', ten: 'Quy định chi tiết về cấp công trình xây dựng',
    hieuLuc: 'Ban hành 25/6/2026 · hiệu lực 01/7/2026',
    ghiChu: 'Thay TT 06/2021/TT-BXD. Phân cấp công trình HTKT (cấp nước, thoát nước, chiếu sáng, xử lý chất thải...) — căn cứ xác định thẩm quyền thẩm định, cấp phép, kiểm tra nghiệm thu.',
  },
  {
    loai: 'Thông tư', soHieu: '32/2026/TT-BXD', ten: 'Hướng dẫn thi hành Nghị định 207/2026/NĐ-CP về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng',
    hieuLuc: 'Ban hành 25/6/2026 · hiệu lực 01/7/2026',
    ghiChu: 'Chi tiết hóa quy trình kiểm tra công tác bảo trì, quản lý chất lượng công trình HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '33/2026/TT-BXD', ten: 'Quy định về đánh giá an toàn công trình',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Lần đầu đánh giá an toàn công trình ≤10 năm (cơ sở cho kiểm tra định kỳ HTKT).',
  },
  {
    loai: 'Thông tư', soHieu: '36/2026/TT-BXD', ten: 'Xác định và quản lý chi phí đầu tư xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Thay TT 11/2021/TT-BXD. Cơ sở định giá, tổng mức đầu tư xây dựng công trình HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '37/2026/TT-BXD', ten: 'Xác định định mức dự toán chi phí công việc xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Thay TT 13/2021/TT-BXD. Định mức chi phí dịch vụ tham vấn, lập dự toán HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '38/2026/TT-BXD', ten: 'Định mức xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Thay TT 12 & 14/2021/TT-BXD. Phụ lục 3: định mức lắp đặt, xây lắp công trình HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '39/2026/TT-BXD', ten: 'Hệ thống thông tin hoạt động xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Quy định cơ sở dữ liệu quốc gia hoạt động xây dựng — liên quan khai báo, cấp phép HTKT.',
  },
  {
    loai: 'Thông tư', soHieu: '40/2026/TT-BXD', ten: 'Xác định chi phí bảo trì công trình xây dựng',
    hieuLuc: 'Hiệu lực 01/7/2026',
    ghiChu: 'Thay TT 09/2019/TT-BXD. Định mức, tài chính bảo trì công trình HTKT do Sở giao quản lý.',
    trongTam: true,
  },
  {
    loai: 'Nghị định', soHieu: '30/2020/NĐ-CP', ten: 'Công tác văn thư',
    ghiChu: 'Thể thức và kỹ thuật trình bày văn bản hành chính — áp dụng cho mọi tờ trình, công văn, quyết định, giấy mời.',
  },
  {
    loai: 'QCVN', soHieu: 'QCVN 01:2021/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia về Quy hoạch xây dựng',
    ghiChu: 'Áp dụng đến hết 31/12/2026. QCVN 01:2026/BXD (Quy hoạch đô thị và nông thôn, TT 46/2026/TT-BXD) có hiệu lực từ 01/01/2027.',
  },
  {
    loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia về Hệ thống công trình hạ tầng kỹ thuật',
    hieuLuc: 'TT 15/2023/TT-BXD, hiệu lực 01/7/2024 · Sửa đổi 1:2025 (TT 42/2025/TT-BXD, hiệu lực 23/01/2026)',
    ghiChu: 'Thay bộ QCVN 07:2016/BXD. 10 phần: cấp nước; thoát nước; hào và tuy nen kỹ thuật; giao thông; cấp điện; cấp xăng dầu, khí đốt; chiếu sáng; viễn thông; thu gom, xử lý chất thải rắn và nhà vệ sinh công cộng; nghĩa trang, cơ sở hỏa táng, nhà tang lễ (theo nguồn thứ cấp — cần đối chiếu tên phần). Sửa đổi 1:2025 sửa yêu cầu dung tích bể chứa nước sạch.',
    trongTam: true,
  },
  {
    loai: 'QCVN', soHieu: 'QCVN 06:2022/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình',
    hieuLuc: 'TT 06/2022/TT-BXD · Sửa đổi 1:2023 (TT 09/2023/TT-BXD, hiệu lực 01/12/2023)',
  },
  {
    loai: 'QCVN', soHieu: 'QCVN 10:2024/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia về Xây dựng công trình đảm bảo tiếp cận sử dụng',
    hieuLuc: 'TT 06/2024/TT-BXD, hiệu lực 01/02/2025',
    ghiChu: 'Thay QCVN 10:2014/BXD.',
  },
]

// ───────── Văn bản theo từng lĩnh vực ─────────
export const PHAP_LY_LINH_VUC: Record<LinhVucKey, VanBan[]> = {
  'cap-nuoc': [
    {
      loai: 'Nghị định', soHieu: '117/2007/NĐ-CP', ten: 'Sản xuất, cung cấp và tiêu thụ nước sạch',
      ghiChu: 'Được sửa đổi bởi Nghị định 124/2011/NĐ-CP. Cốt lõi quản lý cấp nước đô thị.',
      trongTam: true,
    },
    {
      loai: 'Nghị định', soHieu: '124/2011/NĐ-CP', ten: 'Sửa đổi, bổ sung Nghị định 117/2007/NĐ-CP về sản xuất, cung cấp và tiêu thụ nước sạch',
    },
    {
      loai: 'Thông tư', soHieu: '01/2008/TT-BXD', ten: 'Hướng dẫn thực hiện Nghị định 117/2007/NĐ-CP',
    },
    {
      loai: 'Thông tư', soHieu: '08/2012/TT-BXD', ten: 'Hướng dẫn lập, thẩm định, phê duyệt Quy hoạch cấp nước đô thị',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần cấp nước)', ten: 'Hệ thống công trình hạ tầng kỹ thuật — công trình cấp nước',
      ghiChu: 'Thay QCVN 07-1:2016/BXD. Sửa đổi 1:2025 (TT 42/2025/TT-BXD, hiệu lực 23/01/2026): dung tích tối thiểu bể chứa nước sạch.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 01-1:2024/BYT', ten: 'Chất lượng nước sạch sử dụng cho mục đích sinh hoạt',
    },
    {
      loai: 'Quyết định', soHieu: '2502/QĐ-TTg', ten: 'Định hướng phát triển cấp nước đô thị và khu công nghiệp Việt Nam đến 2025, tầm nhìn 2050',
    },
    {
      loai: 'Luật', soHieu: '(dự thảo) Luật Cấp, thoát nước', ten: 'Đang xây dựng — chương trình lập pháp 2026–2027 QH khoá XVI',
      ghiChu: 'Chưa có hiệu lực (dự kiến trình Chính phủ 12/2026). Kèm theo: NĐ quản lý cấp, thoát nước '
        + '(thay toàn diện NĐ 117/2007 & 80/2014) dự kiến trình thẩm định 8/2026 — theo dõi để cập nhật. '
        + 'Hiện vẫn áp dụng NĐ 117/2007 & 124/2011.',
    },
  ],
  'thoat-nuoc': [
    {
      loai: 'Nghị định', soHieu: '80/2014/NĐ-CP', ten: 'Thoát nước và xử lý nước thải',
      ghiChu: 'Cốt lõi quản lý thoát nước, XLNT đô thị, khu dân cư nông thôn tập trung, KCN.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '04/2015/TT-BXD', ten: 'Hướng dẫn thi hành một số điều của Nghị định 80/2014/NĐ-CP về thoát nước và xử lý nước thải',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần thoát nước)', ten: 'Hệ thống công trình hạ tầng kỹ thuật — công trình thoát nước',
      ghiChu: 'Thay QCVN 07-2:2016/BXD.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 14:2025/BTNMT', ten: 'Nước thải sinh hoạt và nước thải đô thị, khu dân cư tập trung',
      hieuLuc: 'TT 05/2025/TT-BTNMT, hiệu lực 01/9/2025',
      ghiChu: 'Thay QCVN 14:2008/BTNMT. Dự án đã có ĐTM/giấy phép môi trường trước 01/9/2025 được áp dụng quy chuẩn cũ đến hết 31/12/2031 (theo nguồn thứ cấp — cần đối chiếu Đ3, Đ4 TT 05/2025).',
    },
    {
      loai: 'Quyết định', soHieu: '589/QĐ-TTg', ten: 'Điều chỉnh Định hướng phát triển thoát nước đô thị và KCN Việt Nam đến 2025, tầm nhìn 2050',
    },
    {
      loai: 'Luật', soHieu: '(dự thảo) Luật Cấp, thoát nước', ten: 'Đang xây dựng — chương trình lập pháp 2026–2027 QH khoá XVI',
      ghiChu: 'Chưa có hiệu lực; NĐ quản lý cấp, thoát nước mới (thay NĐ 80/2014) dự kiến trình thẩm định 8/2026. '
        + 'Hiện vẫn áp dụng NĐ 80/2014.',
    },
  ],
  'cay-xanh': [
    {
      loai: 'Nghị định', soHieu: '258/2025/NĐ-CP', ten: 'Về quản lý công viên, cây xanh, mặt nước',
      hieuLuc: 'Hiệu lực từ ngày ký (09/10/2025)',
      ghiChu: 'Bãi bỏ Nghị định 64/2010/NĐ-CP về quản lý cây xanh đô thị (Đ47); quản lý công viên, cây xanh, mặt nước cả đô thị và nông thôn.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '12/2024/TT-BXD', ten: 'Hướng dẫn phương pháp xác định và quản lý chi phí dịch vụ sự nghiệp công chiếu sáng đô thị, cây xanh đô thị',
      hieuLuc: 'Ban hành 2024',
      ghiChu: 'Về CHI PHÍ dịch vụ sự nghiệp công dùng ngân sách chi thường xuyên — không phải văn bản hướng dẫn quản lý kỹ thuật.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 01:2021/BXD', ten: 'Quy hoạch xây dựng — chỉ tiêu đất cây xanh sử dụng công cộng',
      ghiChu: 'QCVN 07:2023/BXD không có phần riêng cho cây xanh; chỉ tiêu cây xanh lấy theo quy chuẩn quy hoạch (QCVN 01:2026/BXD từ 01/01/2027).',
    },
    {
      loai: 'Thông tư', soHieu: '20/2009/TT-BXD', ten: 'Sửa đổi, bổ sung Thông tư 20/2005/TT-BXD hướng dẫn quản lý cây xanh đô thị',
      ghiChu: 'Hướng dẫn NĐ 64/2010 — nghị định này đã bị NĐ 258/2025 bãi bỏ; cần đối chiếu hiệu lực trước khi viện dẫn.',
    },
  ],
  'chieu-sang': [
    {
      loai: 'Nghị định', soHieu: '79/2009/NĐ-CP', ten: 'Quản lý chiếu sáng đô thị',
      ghiChu: 'Đã được sửa đổi, bổ sung. Cốt lõi quản lý chiếu sáng công cộng đô thị.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '12/2024/TT-BXD', ten: 'Hướng dẫn phương pháp xác định và quản lý chi phí dịch vụ sự nghiệp công chiếu sáng đô thị, cây xanh đô thị',
      hieuLuc: 'Ban hành 2024',
      ghiChu: 'Về CHI PHÍ dịch vụ sự nghiệp công chiếu sáng, cây xanh dùng ngân sách chi thường xuyên.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần chiếu sáng)', ten: 'Hệ thống công trình hạ tầng kỹ thuật — công trình chiếu sáng',
      ghiChu: 'Thay QCVN 07-7:2016/BXD. Hoạt động xây dựng công trình chiếu sáng công cộng không yêu cầu chứng chỉ hành nghề (Đ27 k3 NĐ 212/2026).',
    },
    {
      loai: 'Quyết định', soHieu: '1874/QĐ-TTg', ten: 'Định hướng phát triển chiếu sáng đô thị Việt Nam đến năm 2025',
    },
  ],
  'nghia-trang': [
    {
      loai: 'Nghị định', soHieu: '23/2016/NĐ-CP', ten: 'Xây dựng, quản lý, sử dụng nghĩa trang và cơ sở hỏa táng',
      ghiChu: 'Cốt lõi quản lý nghĩa trang (trừ nghĩa trang liệt sĩ), cơ sở hỏa táng, nhà tang lễ.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '34/2026/TT-BXD', ten: 'Hướng dẫn về cấp công trình xây dựng phục vụ quản lý hoạt động xây dựng',
      ghiChu: 'Thay TT 06/2021 (TT 03/2016 đã hết hiệu lực từ trước). Cơ sở hỏa táng: cấp II với mọi quy mô; nghĩa trang, nhà tang lễ quốc gia xác định theo mức độ quan trọng.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần nghĩa trang)', ten: 'Hệ thống công trình hạ tầng kỹ thuật — nghĩa trang, cơ sở hỏa táng, nhà tang lễ',
      ghiChu: 'Thay QCVN 07-10:2016/BXD.',
    },
  ],
  'giao-thong-do-thi': [
    {
      loai: 'Luật', soHieu: '35/2024/QH15', ten: 'Luật Đường bộ',
      hieuLuc: 'Hiệu lực 01/01/2025',
      ghiChu: 'Thay phần kết cấu hạ tầng của Luật Giao thông đường bộ 2008. Quy hoạch, đầu tư, khai thác, bảo trì đường bộ (gồm đường đô thị).',
      trongTam: true,
    },
    {
      loai: 'Luật', soHieu: '36/2024/QH15', ten: 'Luật Trật tự, an toàn giao thông đường bộ',
      hieuLuc: 'Hiệu lực 01/01/2025',
    },
    {
      loai: 'Nghị định', soHieu: '165/2024/NĐ-CP', ten: 'Quy định chi tiết, hướng dẫn thi hành một số điều của Luật Đường bộ về kết cấu hạ tầng đường bộ',
      hieuLuc: 'Sửa đổi bởi NĐ 241/2026/NĐ-CP (hiệu lực 01/7/2026)',
      ghiChu: 'Đ32–34: thẩm tra, thẩm định an toàn giao thông. Dự án đường bộ phải thẩm tra, thẩm định ATGT ngay giai đoạn lập dự án, cùng thẩm định BCNCKT (Đ29 Luật Đường bộ). NĐ 241/2026 phân cấp quản lý quốc lộ cho UBND tỉnh.',
    },
    {
      loai: 'Quyết định', soHieu: '30/2026/QĐ-UBND Quảng Trị', ten: 'Quy định về bồi thường, hỗ trợ, tái định cư khi Nhà nước thu hồi đất',
      hieuLuc: 'Ban hành 26/6/2026',
      ghiChu: 'Áp dụng cho dự án giao thông, HTKT trên địa bàn Quảng Trị khi cần thu hồi đất.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần giao thông) & QCVN 01:2021/BXD', ten: 'Công trình giao thông đô thị; yêu cầu hạ tầng giao thông trong quy hoạch',
      ghiChu: 'Phần giao thông thay QCVN 07-4:2016/BXD. Cầu trong đô thị từ cấp II phải thi tuyển phương án kiến trúc (Đ17 Luật Kiến trúc).',
    },
  ],
  'khong-gian-ngam': [
    {
      loai: 'Nghị định', soHieu: '39/2010/NĐ-CP', ten: 'Quản lý không gian xây dựng ngầm đô thị',
      ghiChu: 'Từng được sửa đổi bởi NĐ 175/2024 — NĐ 175/2024 đã bị THAY bởi NĐ 217/2026 từ 01/7/2026; '
        + 'áp dụng quy định chuyển tiếp NĐ 217/2026 và chờ NĐ sửa đổi nhóm nghị định HTKT '
        + '(Bộ XD dự kiến trình thẩm định 10/2026).',
      trongTam: true,
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 08:2018/BXD', ten: 'Công trình tàu điện ngầm',
      hieuLuc: 'TT 11/2018/TT-BXD, hiệu lực 15/3/2019',
      ghiChu: 'Thay Phần 1 "Tàu điện ngầm" của QCVN 08:2009/BXD; phần ga ra ô tô ngầm được thay theo TT 12/2018/TT-BXD (cần đối chiếu).',
    },
  ],
  'su-dung-chung': [
    {
      loai: 'Nghị định', soHieu: '72/2012/NĐ-CP', ten: 'Quản lý và sử dụng chung công trình hạ tầng kỹ thuật',
      ghiChu: 'Cốt lõi quản lý dùng chung cột, cống bể cáp, hào/tuy-nen kỹ thuật.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '03/2013/TT-BXD', ten: 'Ban hành mẫu hợp đồng sử dụng chung công trình hạ tầng kỹ thuật',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07:2023/BXD (phần hào và tuy nen kỹ thuật)', ten: 'Hệ thống công trình hạ tầng kỹ thuật — hào và tuy nen kỹ thuật',
      ghiChu: 'Thay QCVN 07-3:2016/BXD.',
    },
  ],
}

export function getPhapLy(key: LinhVucKey): VanBan[] {
  return PHAP_LY_LINH_VUC[key] ?? []
}

export const LOAI_VANBAN_MAU: Record<LoaiVanBan, string> = {
  'Luật': 'bg-rose-100 text-rose-700',
  'Nghị định': 'bg-indigo-100 text-indigo-700',
  'Thông tư': 'bg-sky-100 text-sky-700',
  'QCVN': 'bg-amber-100 text-amber-700',
  'TCVN': 'bg-yellow-100 text-yellow-700',
  'Quyết định': 'bg-emerald-100 text-emerald-700',
  'Nghị quyết': 'bg-purple-100 text-purple-700',
}
