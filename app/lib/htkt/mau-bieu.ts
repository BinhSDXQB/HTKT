// Danh mục mẫu biểu / văn bản hành chính của Phòng Hạ tầng kỹ thuật.
// key: dùng cho /api/htkt/mau-bieu/[key] (tải mẫu .docx skeleton theo thể thức NĐ 30/2020).
// coFormDien: có form soạn nhanh trên web → POST /api/htkt/van-ban sinh .docx hoàn chỉnh.

export type LoaiMau =
  | 'to-trinh' | 'cong-van' | 'giay-moi' | 'bao-cao' | 'ke-hoach'
  | 'phieu-gop-y' | 'quyet-dinh' | 'van-ban-chi-dao'
  | 'thong-bao-tham-dinh-bcnckt' | 'thong-bao-tham-dinh-bcktkt'
  | 'thong-bao-tham-dinh-thiet-ke' | 'chap-thuan-nghiem-thu' | 'bien-ban-kiem-tra'

export type MauBieu = {
  key: LoaiMau
  ten: string
  nhom: string
  moTa: string
  coFormDien?: boolean
}

export const MAU_BIEU: MauBieu[] = [
  {
    key: 'to-trinh', ten: 'Tờ trình', nhom: 'Tham mưu, trình ký',
    moTa: 'Tờ trình trình Lãnh đạo Sở/UBND tỉnh (vd trình phê duyệt, ban hành văn bản, thẩm định).',
    coFormDien: true,
  },
  {
    key: 'cong-van', ten: 'Công văn', nhom: 'Hành chính, điều hành',
    moTa: 'Công văn trao đổi, hướng dẫn, đôn đốc, trả lời, lấy ý kiến.',
    coFormDien: true,
  },
  {
    key: 'quyet-dinh', ten: 'Dự thảo Quyết định', nhom: 'Tham mưu, trình ký',
    moTa: 'Dự thảo Quyết định của Sở hoặc UBND tỉnh (ban hành quy định, phê duyệt, công bố...).',
    coFormDien: true,
  },
  {
    key: 'giay-moi', ten: 'Giấy mời', nhom: 'Hành chính, điều hành',
    moTa: 'Giấy mời họp, làm việc, kiểm tra hiện trường.',
  },
  {
    key: 'bao-cao', ten: 'Báo cáo', nhom: 'Tổng hợp, báo cáo',
    moTa: 'Báo cáo định kỳ/đột xuất về tình hình, kết quả công tác lĩnh vực HTKT.',
  },
  {
    key: 'ke-hoach', ten: 'Kế hoạch triển khai văn bản QPPL', nhom: 'Tổng hợp, báo cáo',
    moTa: 'Kế hoạch triển khai Luật/Nghị định/Thông tư mới về hạ tầng kỹ thuật.',
  },
  {
    key: 'phieu-gop-y', ten: 'Văn bản góp ý dự thảo VBPL', nhom: 'Tham mưu, trình ký',
    moTa: 'Công văn/phiếu góp ý đối với dự thảo văn bản quy phạm pháp luật, quy hoạch, đề án.',
  },
  {
    key: 'van-ban-chi-dao', ten: 'Văn bản chỉ đạo, đôn đốc', nhom: 'Hành chính, điều hành',
    moTa: 'Văn bản chỉ đạo, đôn đốc thực hiện nhiệm vụ đối với đơn vị, địa phương.',
  },
  {
    key: 'thong-bao-tham-dinh-bcnckt', ten: 'Thông báo kết quả thẩm định BCNCKT', nhom: 'Kết quả thẩm định & nghiệm thu',
    moTa: 'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi công trình HTKT theo NĐ 217/2026.',
    coFormDien: true,
  },
  {
    key: 'thong-bao-tham-dinh-bcktkt', ten: 'Thông báo kết quả thẩm định BCKTKT', nhom: 'Kết quả thẩm định & nghiệm thu',
    moTa: 'Thông báo kết quả thẩm định Báo cáo kinh tế - kỹ thuật công trình HTKT theo NĐ 217/2026.',
    coFormDien: true,
  },
  {
    key: 'thong-bao-tham-dinh-thiet-ke', ten: 'Thông báo kết quả thẩm định thiết kế triển khai', nhom: 'Kết quả thẩm định & nghiệm thu',
    moTa: 'Thông báo kết quả thẩm định thiết kế triển khai sau thiết kế cơ sở công trình HTKT theo NĐ 217/2026.',
    coFormDien: true,
  },
  {
    key: 'chap-thuan-nghiem-thu', ten: 'Văn bản chấp thuận kết quả kiểm tra nghiệm thu', nhom: 'Kết quả thẩm định & nghiệm thu',
    moTa: 'Văn bản chấp thuận hoặc đề nghị khắc phục kết quả kiểm tra nghiệm thu công trình HTKT theo NĐ 207/2026.',
    coFormDien: true,
  },
  {
    key: 'bien-ban-kiem-tra', ten: 'Biên bản kiểm tra hiện trường', nhom: 'Kết quả thẩm định & nghiệm thu',
    moTa: 'Biên bản kiểm tra hiện trường, đánh giá tình trạng công trình, kết quả nghiệm thu lần 1/2/3 theo NĐ 207/2026.',
    coFormDien: true,
  },
]

export function getMauBieu(key: string): MauBieu | undefined {
  return MAU_BIEU.find((m) => m.key === key)
}

export const NHOM_MAU = [
  'Tham mưu, trình ký',
  'Hành chính, điều hành',
  'Tổng hợp, báo cáo',
  'Kết quả thẩm định & nghiệm thu',
] as const
