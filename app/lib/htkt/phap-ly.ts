// Danh mục căn cứ pháp lý chuyên ngành Phòng Hạ tầng kỹ thuật (cập nhật 4/7/2026 — đợt rà soát bộ văn bản hiệu lực 01/7/2026).
// Dùng cho trang /dashboard/phong-htkt/phap-ly và làm gợi ý "Căn cứ" khi soạn văn bản.
// Lưu ý hiệu lực: nhiều văn bản vừa thay thế trong 2024–2026 — xem field ghiChu.

export type LoaiVanBan = 'Luật' | 'Nghị định' | 'Thông tư' | 'QCVN' | 'Quyết định'

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
    ghiChu: 'Thay phần lớn Nghị định 175/2024/NĐ-CP (và NĐ 15/2021). Thẩm định Báo cáo NCKT/BCKTKT, thiết kế, cấp phép, quản lý trật tự xây dựng, công trình đặc thù.',
    trongTam: true,
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
  },
  {
    loai: 'QCVN', soHieu: 'QCVN 07:2016/BXD', ten: 'Quy chuẩn kỹ thuật quốc gia — Các công trình hạ tầng kỹ thuật (10 phần 07-1…07-10)',
    ghiChu: '07-1 cấp nước; 07-2 thoát nước; 07-3 chiếu sáng; 07-4 cây xanh; 07-5 nghĩa trang; 07-9 hào & tuy-nen kỹ thuật...',
    trongTam: true,
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
      loai: 'QCVN', soHieu: 'QCVN 07-1:2016/BXD', ten: 'Các công trình cấp nước',
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
      loai: 'QCVN', soHieu: 'QCVN 07-2:2016/BXD', ten: 'Các công trình thoát nước',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 14:2008/BTNMT', ten: 'Nước thải sinh hoạt',
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
      loai: 'Nghị định', soHieu: '258/2025/NĐ-CP', ten: 'Quản lý cây xanh, công viên đô thị',
      hieuLuc: 'Ban hành 09/10/2025',
      ghiChu: 'Thay Nghị định 64/2010/NĐ-CP; bổ sung quản lý cây xanh khu dân cư nông thôn, công viên, mặt nước.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '12/2024/TT-BXD', ten: 'Hướng dẫn quản lý chiếu sáng và cây xanh đô thị',
      hieuLuc: 'Ban hành 2024',
      ghiChu: 'Hướng dẫn áp dụng NĐ 258/2025 về cây xanh, công viên; đối chiếu với TT 20/2009/TT-BXD.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07-4:2016/BXD', ten: 'Các công trình cây xanh sử dụng công cộng',
    },
    {
      loai: 'Thông tư', soHieu: '20/2009/TT-BXD', ten: 'Sửa đổi, bổ sung Thông tư 20/2005/TT-BXD hướng dẫn quản lý cây xanh đô thị',
      ghiChu: 'Đối chiếu với NĐ 258/2025 và hướng dẫn mới TT 12/2024/TT-BXD.',
    },
  ],
  'chieu-sang': [
    {
      loai: 'Nghị định', soHieu: '79/2009/NĐ-CP', ten: 'Quản lý chiếu sáng đô thị',
      ghiChu: 'Đã được sửa đổi, bổ sung. Cốt lõi quản lý chiếu sáng công cộng đô thị.',
      trongTam: true,
    },
    {
      loai: 'Thông tư', soHieu: '12/2024/TT-BXD', ten: 'Hướng dẫn quản lý chiếu sáng và cây xanh đô thị',
      hieuLuc: 'Ban hành 2024',
      ghiChu: 'Hướng dẫn áp dụng NĐ 79/2009 (chiếu sáng) và NĐ 258/2025 (cây xanh) — yêu cầu kỹ thuật, tiêu chí thiết kế.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07-3:2016/BXD', ten: 'Các công trình chiếu sáng',
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
      loai: 'Thông tư', soHieu: '03/2016/TT-BXD', ten: 'Quy định về phân cấp công trình xây dựng và hướng dẫn áp dụng (liên quan nghĩa trang/HTKT)',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07-5:2016/BXD', ten: 'Các công trình nghĩa trang',
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
    },
    {
      loai: 'Quyết định', soHieu: '30/2026/QĐ-UBND Quảng Trị', ten: 'Quy định về bồi thường, hỗ trợ, tái định cư khi Nhà nước thu hồi đất',
      hieuLuc: 'Ban hành 26/6/2026',
      ghiChu: 'Áp dụng cho dự án giao thông, HTKT trên địa bàn Quảng Trị khi cần thu hồi đất.',
    },
    {
      loai: 'QCVN', soHieu: 'QCVN 07-4 & QCVN 01:2021/BXD', ten: 'Yêu cầu hạ tầng giao thông trong quy hoạch đô thị',
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
      loai: 'QCVN', soHieu: 'QCVN 08:2009/BXD', ten: 'Công trình ngầm đô thị (phần ga ra ngầm, đường tàu điện ngầm...)',
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
      loai: 'QCVN', soHieu: 'QCVN 07-9:2016/BXD', ten: 'Công trình hào và tuy-nen kỹ thuật',
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
  'Quyết định': 'bg-emerald-100 text-emerald-700',
}
