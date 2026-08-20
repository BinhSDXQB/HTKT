// Cấu hình TRƯỜNG NHẬP con cho Phiếu 02/03/04 (đường / dây-cáp / nguồn nước).
// Mỗi field.key = TÊN CỘT chính trong bảng nguồn (mig 038) → action ghi thẳng cột.
// `rule` = mã tiêu chí (qd72_technical_rules) để hiện đánh giá sơ bộ khi nhập. Client-safe.

export type EntryFieldType = 'text' | 'number' | 'integer' | 'select' | 'boolean' | 'textarea'
export type EntryField = { key: string; label: string; type: EntryFieldType; options?: string[]; required?: boolean; unit?: string; rule?: string }
export type EntryPhieu = { ma: string; ten: string; table: string; nameField: string; fields: EntryField[] }

const LOAI_DOI_TUONG = [
  'Đường dây điện trung thế', 'Đường dây điện hạ thế', 'Dây điện sau công tơ',
  'Cáp viễn thông', 'Cáp internet', 'Cáp truyền hình', 'Cáp thông tin khác',
  'Dây điện chiếu sáng', 'Cần đèn / đèn trang trí', 'Cổng chào', 'Biển quảng cáo', 'Cành cây', 'Kết cấu kiến trúc khác',
]

export const QD72_ENTRY: Record<string, EntryPhieu> = {
  PHIEU_02: {
    ma: 'PHIEU_02', ten: 'Giao thông phục vụ chữa cháy', table: 'qd72_road_segments', nameField: 'ten',
    fields: [
      { key: 'ten', label: 'Tên đường/ngõ/hẻm', type: 'text', required: true },
      { key: 'diem_dau', label: 'Điểm đầu', type: 'text' },
      { key: 'diem_cuoi', label: 'Điểm cuối', type: 'text' },
      { key: 'chieu_dai_m', label: 'Chiều dài', type: 'number', unit: 'm' },
      { key: 'rong_thong_thuy_min_m', label: 'Rộng thông thủy nhỏ nhất', type: 'number', unit: 'm', rule: 'ROAD_MIN_WIDTH' },
      { key: 'cao_thong_thuy_min_m', label: 'Cao thông thủy nhỏ nhất', type: 'number', unit: 'm', rule: 'CLEARANCE_MIN_HEIGHT' },
      { key: 'do_doc_max', label: 'Độ dốc lớn nhất (tỉ lệ)', type: 'text', rule: 'APPROACH_MAX_SLOPE' },
      { key: 'loai_mat_duong', label: 'Loại mặt đường', type: 'text' },
      { key: 'tinh_trang_mat_duong', label: 'Tình trạng mặt đường', type: 'select', options: ['Tốt', 'Trung bình', 'Xuống cấp'] },
      { key: 'la_duong_cut', label: 'Là đường cụt', type: 'boolean' },
      { key: 'chieu_dai_cut_m', label: 'Chiều dài đường cụt', type: 'number', unit: 'm', rule: 'DEADEND_TURN_LENGTH' },
      { key: 'co_diem_quay_xe', label: 'Có điểm quay xe', type: 'boolean' },
      { key: 'de_xuat_chinh_trang', label: 'Đề xuất chỉnh trang', type: 'textarea' },
    ],
  },
  PHIEU_03: {
    ma: 'PHIEU_03', ten: 'Dây, cáp, điện chiếu sáng', table: 'qd72_overhead_utility_lines', nameField: 'ten_tuyen',
    fields: [
      { key: 'loai_doi_tuong', label: 'Loại đối tượng', type: 'select', required: true, options: LOAI_DOI_TUONG },
      { key: 'ten_tuyen', label: 'Tên tuyến', type: 'text' },
      { key: 'chu_so_huu_text', label: 'Chủ sở hữu (ghi tự do)', type: 'text' },
      { key: 'trang_thai_chu_so_huu', label: 'Tình trạng chủ sở hữu', type: 'select', options: ['XAC_DINH', 'CHUA_XAC_DINH'] },
      { key: 'don_vi_van_hanh', label: 'Đơn vị quản lý vận hành', type: 'text' },
      { key: 'cao_diem_thap_nhat_m', label: 'Cao điểm thấp nhất', type: 'number', unit: 'm', rule: 'CLEARANCE_MIN_HEIGHT' },
      { key: 'chay_doc_hay_cat_ngang', label: 'Chạy dọc / cắt ngang', type: 'select', options: ['Chạy dọc', 'Giao cắt ngang'] },
      { key: 'do_vong_quan_sat', label: 'Độ võng quan sát', type: 'text' },
      { key: 'co_can_tro_xe_cc', label: 'Cản trở xe chữa cháy', type: 'boolean' },
      { key: 'tinh_trang_su_dung', label: 'Tình trạng sử dụng', type: 'select', options: ['Đang sử dụng', 'Ngừng sử dụng', 'Chưa xác định'] },
    ],
  },
  PHIEU_04: {
    ma: 'PHIEU_04', ten: 'Nguồn nước chữa cháy', table: 'qd72_water_sources', nameField: 'ten',
    fields: [
      { key: 'loai_nguon', label: 'Loại nguồn', type: 'select', required: true, options: ['Trụ nước', 'Bể nước', 'Hồ/ao', 'Sông/kênh', 'Khác'] },
      { key: 'ten', label: 'Tên nguồn', type: 'text' },
      { key: 'dia_chi', label: 'Địa chỉ', type: 'text' },
      { key: 'don_vi_quan_ly', label: 'Đơn vị quản lý', type: 'text' },
      { key: 'tinh_trang', label: 'Tình trạng', type: 'select', options: ['Hoạt động', 'Hư hỏng', 'Ngừng'] },
      { key: 'duong_kinh_ong_dn', label: 'Đường kính ống', type: 'number', unit: 'DN', rule: 'PIPE_MIN_DIAMETER' },
      { key: 'mang_vong_hay_cut', label: 'Mạng vòng / cụt', type: 'select', options: ['Mạng vòng', 'Mạng cụt'] },
      { key: 'chieu_dai_cut_m', label: 'Chiều dài nhánh cụt', type: 'number', unit: 'm', rule: 'DEADEND_PIPE_MAX_LENGTH' },
      { key: 'dung_tich_m3', label: 'Dung tích', type: 'number', unit: 'm³' },
      { key: 'de_xuat_sua_chua', label: 'Đề xuất sửa chữa', type: 'textarea' },
    ],
  },
}

export function getEntryPhieu(ma: string): EntryPhieu | null {
  return QD72_ENTRY[ma] ?? null
}
