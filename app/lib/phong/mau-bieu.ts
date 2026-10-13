import type { MauBieu } from '@/lib/htkt/mau-bieu'

// Bộ mẫu biểu HÀNH CHÍNH DÙNG CHUNG (NĐ 30/2020/NĐ-CP) cho MỌI phòng/đơn vị.
// KHÔNG chứa mẫu chuyên môn của riêng phòng nào — mẫu thẩm định/nghiệm thu công trình
// HTKT (NĐ 217/207-2026) chỉ thuộc Phòng HTKT và nằm ở lib/htkt/mau-bieu.ts.
// key trùng mẫu tương ứng ở lib/htkt để API tải .docx /api/htkt/mau-bieu/[key] phục vụ ngay.
export const MAU_HANH_CHINH_CHUNG: MauBieu[] = [
  { key: 'to-trinh', ten: 'Tờ trình', nhom: 'Tham mưu, trình ký',
    moTa: 'Tờ trình trình Lãnh đạo Sở/UBND tỉnh (trình phê duyệt, ban hành văn bản, đề án...).', coFormDien: true },
  { key: 'cong-van', ten: 'Công văn', nhom: 'Hành chính, điều hành',
    moTa: 'Công văn trao đổi, hướng dẫn, đôn đốc, trả lời, lấy ý kiến.', coFormDien: true },
  { key: 'quyet-dinh', ten: 'Dự thảo Quyết định', nhom: 'Tham mưu, trình ký',
    moTa: 'Dự thảo Quyết định của Sở hoặc UBND tỉnh (ban hành quy định, phê duyệt, công bố...).', coFormDien: true },
  { key: 'giay-moi', ten: 'Giấy mời', nhom: 'Hành chính, điều hành',
    moTa: 'Giấy mời họp, làm việc, kiểm tra hiện trường.' },
  { key: 'bao-cao', ten: 'Báo cáo', nhom: 'Tổng hợp, báo cáo',
    moTa: 'Báo cáo định kỳ/đột xuất về tình hình, kết quả công tác của phòng.' },
  { key: 'ke-hoach', ten: 'Kế hoạch công tác', nhom: 'Tổng hợp, báo cáo',
    moTa: 'Kế hoạch công tác, triển khai nhiệm vụ hoặc văn bản QPPL mới.' },
  { key: 'phieu-gop-y', ten: 'Văn bản góp ý dự thảo VBPL', nhom: 'Tham mưu, trình ký',
    moTa: 'Công văn/phiếu góp ý đối với dự thảo văn bản QPPL, quy hoạch, đề án.' },
  { key: 'van-ban-chi-dao', ten: 'Văn bản chỉ đạo, đôn đốc', nhom: 'Hành chính, điều hành',
    moTa: 'Văn bản chỉ đạo, đôn đốc thực hiện nhiệm vụ đối với đơn vị, địa phương.' },
]

export const NHOM_MAU_CHUNG = [
  'Tham mưu, trình ký',
  'Hành chính, điều hành',
  'Tổng hợp, báo cáo',
  'Kết quả thẩm định & nghiệm thu',
] as const

// Bộ mẫu THẨM ĐỊNH – NGHIỆM THU dùng cho các phòng có chức năng thẩm định dự án/thiết kế,
// kiểm tra công tác nghiệm thu (dùng chung builder trong lib/htkt/van-ban-docx.ts — KHÔNG phải
// mẫu chuyên môn riêng của Phòng HTKT; các builder này là biểu mẫu hành chính theo NĐ 217/207-2026).
function mauThamDinh(chuyenNganh: string): MauBieu[] {
  return [
    { key: 'thong-bao-tham-dinh-bcnckt', ten: 'Thông báo kết quả thẩm định BCNCKT', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: `Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi ${chuyenNganh} (NĐ 217/2026).`, coFormDien: true },
    { key: 'thong-bao-tham-dinh-bcktkt', ten: 'Thông báo kết quả thẩm định BCKTKT', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: `Thông báo kết quả thẩm định Báo cáo kinh tế - kỹ thuật ${chuyenNganh} (NĐ 217/2026).`, coFormDien: true },
    // Không còn mẫu "Thông báo kết quả thẩm định thiết kế triển khai": từ 01/7/2026 chủ đầu tư thẩm định
    // (Đ41 NĐ 217/2026, Mẫu số 12 là văn bản của chủ đầu tư).
    { key: 'chap-thuan-nghiem-thu', ten: 'Văn bản chấp thuận kết quả kiểm tra nghiệm thu', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: `Văn bản chấp thuận/đề nghị khắc phục kết quả kiểm tra nghiệm thu ${chuyenNganh} (NĐ 207/2026).`, coFormDien: true },
    { key: 'bien-ban-kiem-tra', ten: 'Biên bản kiểm tra hiện trường', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: `Biên bản kiểm tra hiện trường, đánh giá tình trạng ${chuyenNganh} (NĐ 207/2026).`, coFormDien: true },
  ]
}

// Mẫu biểu CHUYÊN MÔN RIÊNG theo phòng (mã phongKey = baseHref bỏ '/dashboard/', vd 'phong-kh-tc').
// Chỉ dùng lại các builder DÙNG CHUNG đã có; KHÔNG đưa mẫu chuyên môn riêng của Phòng HTKT vào đây.
const MAU_RIENG_THEO_PHONG: Record<string, MauBieu[]> = {
  'phong-clct': mauThamDinh('công trình giao thông'),
  'phong-qlhd-xd': mauThamDinh('công trình dân dụng, công nghiệp'),
  'phong-ptdt': [
    // Đã gỡ mẫu "Thông báo kết quả thẩm định thiết kế HTKT khu đô thị": NĐ 11/2013 và NĐ 35/2026 không
    // quy định thủ tục Sở thẩm định thiết kế; thiết kế triển khai do chủ đầu tư thẩm định (Đ41 NĐ 217/2026).
    { key: 'bien-ban-kiem-tra', ten: 'Biên bản kiểm tra hiện trường', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Biên bản kiểm tra hiện trường hạ tầng kỹ thuật khu đô thị.', coFormDien: true },
  ],
  'phong-kh-tc': [
    { key: 'bao-cao-tham-tra', ten: 'Báo cáo kết quả thẩm tra', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Báo cáo kết quả thẩm tra dự toán, hồ sơ đấu thầu, quyết toán vốn đầu tư dự án hoàn thành.', coFormDien: true },
  ],
  'phong-kt-vl': [
    { key: 'bao-cao-tham-tra', ten: 'Báo cáo kết quả thẩm tra dự toán', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Báo cáo kết quả thẩm tra dự toán xây dựng, tổng mức đầu tư (NĐ 206/2026).', coFormDien: true },
  ],
  'phong-qlkcht': [
    { key: 'van-ban-chap-thuan', ten: 'Văn bản chấp thuận / cấp phép đường bộ', nhom: 'Hành chính, điều hành',
      moTa: 'Văn bản chấp thuận công trình thiết yếu, cấp phép thi công trên đường bộ (NĐ 165/2024).', coFormDien: true },
    { key: 'bien-ban-kiem-tra', ten: 'Biên bản kiểm tra hiện trường', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Biên bản kiểm tra hiện trường thi công, đấu nối trên đường bộ.', coFormDien: true },
  ],
  'phong-ql-vt': [
    { key: 'van-ban-chap-thuan', ten: 'Văn bản chấp thuận / cấp phép vận tải', nhom: 'Hành chính, điều hành',
      moTa: 'Văn bản chấp thuận, cấp phép kinh doanh vận tải, đăng ký phương tiện (NĐ 158/2024).', coFormDien: true },
  ],
  'phong-qh-kt': [
    { key: 'van-ban-chap-thuan', ten: 'Văn bản cung cấp thông tin quy hoạch', nhom: 'Hành chính, điều hành',
      moTa: 'Văn bản cung cấp thông tin quy hoạch đô thị, nông thôn theo đề nghị (QĐ 1218/QĐ-BXD).', coFormDien: true },
    { key: 'bien-ban-kiem-tra', ten: 'Biên bản kiểm tra mốc giới, hiện trường quy hoạch', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Biên bản kiểm tra cắm mốc giới, hiện trường thực hiện quy hoạch.', coFormDien: true },
  ],
  'phong-ql-nha': [
    { key: 'bao-cao-tham-tra', ten: 'Báo cáo thẩm định giá nhà ở xã hội', nhom: 'Kết quả thẩm định & nghiệm thu',
      moTa: 'Báo cáo kết quả thẩm định giá bán, giá thuê mua nhà ở xã hội (Điều 35 NĐ 100/2024).', coFormDien: true },
  ],
}

// Tập hợp key mẫu riêng (đã lọc trùng) — dùng để hợp lệ hoá endpoint tải .docx.
const MAU_RIENG_KEYS = Array.from(
  new Set(Object.values(MAU_RIENG_THEO_PHONG).flat().map((m) => m.key)),
)

/** Key có được phép tải qua /api/phong/mau-bieu/[key] không (mẫu chung + mẫu riêng theo phòng). */
export function isMauBieuPhongKey(key: string): boolean {
  return MAU_HANH_CHINH_CHUNG.some((m) => m.key === key) || MAU_RIENG_KEYS.includes(key as MauBieu['key'])
}

/** Mẫu biểu hiển thị cho một phòng = bộ hành chính chung + (nếu có) mẫu chuyên môn riêng. */
export function getMauBieuByPhong(phongKey: string): MauBieu[] {
  return [...MAU_HANH_CHINH_CHUNG, ...(MAU_RIENG_THEO_PHONG[phongKey] ?? [])]
}
