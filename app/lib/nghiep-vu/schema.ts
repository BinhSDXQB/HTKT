// Cấu hình TRƯỜNG ĐỘNG cho module Hồ sơ nghiệp vụ (dùng chung mọi phòng — QĐ 331).
// Key = linhVuc = đường dẫn sau /dashboard/ (vd 'phong-htkt/cap-nuoc'). Mỗi lĩnh vực
// định nghĩa nhãn cho ô "Tiêu đề" + danh sách trường riêng (lưu trong customFields jsonb).
// Thêm/bớt trường tại đây KHÔNG cần migration. Trường chuẩn (trạng thái, địa bàn,
// ngày ghi nhận, ghi chú) do module tự thêm — ở đây chỉ khai trường ĐẶC THÙ lĩnh vực.

export type NvFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea'

export type NvField = {
  key: string
  label: string
  type: NvFieldType
  options?: string[]
  required?: boolean
}

export type NvSchema = {
  label: string          // tên lĩnh vực (hiển thị tiêu đề module)
  tieuDeLabel: string     // nhãn cho ô tiêu đề chuẩn
  fields: NvField[]       // trường đặc thù → customFields
  tableFields?: string[]  // danh sách key các trường hiển thị ngoài bảng (mặc định lấy 2 trường đầu)
}

export const NGHIEP_VU_SCHEMAS: Record<string, NvSchema> = {
  // ===== Phòng Hạ tầng kỹ thuật =====
  'phong-htkt/cap-nuoc': {
    label: 'Cấp nước sạch đô thị', tieuDeLabel: 'Tên công trình / đơn vị cấp nước',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư / đơn vị quản lý', type: 'text' },
      { key: 'congSuat', label: 'Công suất (m³/ngđ)', type: 'number' },
      { key: 'nguonNuoc', label: 'Nguồn nước', type: 'text' },
      { key: 'phamViCapNuoc', label: 'Phạm vi cấp nước', type: 'text' },
      { key: 'tyLeThatThoat', label: 'Tỷ lệ thất thoát (%)', type: 'number' },
    ],
  },
  'phong-htkt/thoat-nuoc': {
    label: 'Thoát nước & xử lý nước thải', tieuDeLabel: 'Tên công trình / hệ thống',
    fields: [
      { key: 'loaiHeThong', label: 'Loại hệ thống', type: 'select', options: ['Thoát nước mưa', 'Thoát nước thải', 'Hỗn hợp'] },
      { key: 'congSuatXuLy', label: 'Công suất XLNT (m³/ngđ)', type: 'number' },
      { key: 'chieuDaiTuyen', label: 'Chiều dài tuyến (m)', type: 'number' },
      { key: 'congNghe', label: 'Công nghệ xử lý', type: 'text' },
    ],
  },
  'phong-htkt/cay-xanh': {
    label: 'Công viên, cây xanh đô thị', tieuDeLabel: 'Tên công viên / khu cây xanh',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Công viên', 'Vườn hoa', 'Cây xanh đường phố', 'Mảng xanh khác'] },
      { key: 'dienTich', label: 'Diện tích (m²)', type: 'number' },
      { key: 'soLuongCay', label: 'Số lượng cây', type: 'number' },
      { key: 'donViQuanLy', label: 'Đơn vị quản lý', type: 'text' },
    ],
  },
  'phong-htkt/chieu-sang': {
    label: 'Chiếu sáng đô thị', tieuDeLabel: 'Tên tuyến / công trình chiếu sáng',
    fields: [
      { key: 'soBongDen', label: 'Số bóng đèn', type: 'number' },
      { key: 'loaiDen', label: 'Loại đèn', type: 'text' },
      { key: 'congSuat', label: 'Tổng công suất (kW)', type: 'number' },
      { key: 'chieuDai', label: 'Chiều dài (m)', type: 'number' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Hoạt động', 'Hư hỏng', 'Đang sửa chữa'] },
    ],
  },
  'phong-htkt/nghia-trang': {
    label: 'Nghĩa trang & cơ sở hỏa táng', tieuDeLabel: 'Tên nghĩa trang / cơ sở',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Nghĩa trang', 'Cơ sở hỏa táng', 'Nhà tang lễ'] },
      { key: 'dienTich', label: 'Diện tích (ha)', type: 'number' },
      { key: 'soMo', label: 'Số mộ', type: 'number' },
      { key: 'tinhTrangSuDung', label: 'Tình trạng sử dụng', type: 'text' },
      { key: 'donViQuanLy', label: 'Đơn vị quản lý', type: 'text' },
    ],
  },
  'phong-htkt/giao-thong-do-thi': {
    label: 'Hạ tầng giao thông đô thị', tieuDeLabel: 'Tên tuyến / công trình',
    fields: [
      { key: 'loaiCongTrinh', label: 'Loại công trình', type: 'text' },
      { key: 'chieuDai', label: 'Chiều dài (m)', type: 'number' },
      { key: 'beRong', label: 'Bề rộng (m)', type: 'number' },
      { key: 'ketCau', label: 'Kết cấu mặt đường', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Tốt', 'Trung bình', 'Xuống cấp'] },
    ],
  },
  'phong-htkt/khong-gian-ngam': {
    label: 'Không gian xây dựng ngầm', tieuDeLabel: 'Tên công trình ngầm',
    fields: [
      { key: 'loaiCongTrinh', label: 'Loại công trình', type: 'select', options: ['Bãi đỗ xe ngầm', 'Hầm đi bộ', 'Tuy-nen kỹ thuật', 'Khác'] },
      { key: 'doSau', label: 'Độ sâu (m)', type: 'number' },
      { key: 'dienTich', label: 'Diện tích (m²)', type: 'number' },
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
    ],
  },
  'phong-htkt/su-dung-chung': {
    label: 'Sử dụng chung công trình HTKT', tieuDeLabel: 'Tên công trình HTKT dùng chung',
    fields: [
      { key: 'loaiCongTrinh', label: 'Loại công trình', type: 'select', options: ['Cột điện/cột đa năng', 'Cống/bể cáp', 'Hào kỹ thuật', 'Tuy-nen', 'Khác'] },
      { key: 'donViSoHuu', label: 'Đơn vị sở hữu', type: 'text' },
      { key: 'donViThue', label: 'Đơn vị thuê / dùng chung', type: 'text' },
      { key: 'giaThue', label: 'Giá thuê (đồng)', type: 'number' },
    ],
  },

  // ===== Phòng Kinh tế và Vật liệu xây dựng =====
  'phong-kt-vl/dinh-muc-don-gia': {
    label: 'Định mức, đơn giá, chỉ số giá XD', tieuDeLabel: 'Tên định mức / đơn giá',
    fields: [
      { key: 'maHieu', label: 'Mã hiệu', type: 'text' },
      { key: 'donViTinh', label: 'Đơn vị tính', type: 'text' },
      { key: 'donGia', label: 'Đơn giá (đồng)', type: 'number' },
      { key: 'canCu', label: 'Căn cứ ban hành', type: 'text' },
      { key: 'thoiDiemApDung', label: 'Thời điểm áp dụng', type: 'date' },
    ],
  },
  'phong-kt-vl/cong-bo-gia-vlxd': {
    label: 'Công bố giá vật liệu xây dựng', tieuDeLabel: 'Tên vật liệu',
    fields: [
      { key: 'chungLoai', label: 'Chủng loại / quy cách', type: 'text' },
      { key: 'donViTinh', label: 'Đơn vị tính', type: 'text' },
      { key: 'giaCongBo', label: 'Giá công bố (đồng)', type: 'number' },
      { key: 'kyCongBo', label: 'Kỳ công bố', type: 'text' },
      { key: 'khuVuc', label: 'Khu vực', type: 'text' },
    ],
  },
  'phong-kt-vl/tham-dinh-du-toan-qh': {
    label: 'Thẩm định dự toán quy hoạch', tieuDeLabel: 'Tên đồ án quy hoạch',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'giaTriDeNghi', label: 'Giá trị đề nghị (đồng)', type: 'number' },
      { key: 'giaTriThamDinh', label: 'Giá trị thẩm định (đồng)', type: 'number' },
      { key: 'ngayThamDinh', label: 'Ngày thẩm định', type: 'date' },
    ],
  },
  'phong-kt-vl/quan-ly-vlxd-khoang-san': {
    label: 'Quản lý VLXD & khoáng sản', tieuDeLabel: 'Tên cơ sở / mỏ',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Sản xuất VLXD', 'Khai thác khoáng sản', 'Kinh doanh VLXD'] },
      { key: 'loaiKhoangSan', label: 'Loại khoáng sản / sản phẩm', type: 'text' },
      { key: 'congSuat', label: 'Công suất / năm', type: 'number' },
      { key: 'diaDiem', label: 'Địa điểm', type: 'text' },
      { key: 'giayPhep', label: 'Số giấy phép', type: 'text' },
    ],
  },

  // ===== Phòng Phát triển đô thị =====
  'phong-ptdt/chuong-trinh-ptdt': {
    label: 'Chương trình phát triển đô thị', tieuDeLabel: 'Tên chương trình / đô thị',
    fields: [
      { key: 'capDoThi', label: 'Cấp/loại đô thị', type: 'text' },
      { key: 'giaiDoan', label: 'Giai đoạn', type: 'text' },
      { key: 'tongVon', label: 'Tổng vốn đầu tư (tỷ đồng)', type: 'number' },
      { key: 'tienDo', label: 'Tiến độ', type: 'text' },
    ],
  },
  'phong-ptdt/phan-loai-do-thi': {
    label: 'Phân loại đô thị', tieuDeLabel: 'Tên đô thị',
    fields: [
      { key: 'loaiHienTai', label: 'Loại hiện tại', type: 'select', options: ['Loại đặc biệt', 'Loại I', 'Loại II', 'Loại III', 'Loại IV', 'Loại V', 'Chưa phân loại'] },
      { key: 'loaiDeNghi', label: 'Loại đề nghị', type: 'text' },
      { key: 'danSo', label: 'Dân số', type: 'number' },
      { key: 'namCongNhan', label: 'Năm công nhận', type: 'number' },
    ],
  },
  'phong-ptdt/do-thi-thong-minh': {
    label: 'Đô thị thông minh & tăng trưởng xanh', tieuDeLabel: 'Tên dự án / đề án',
    fields: [
      { key: 'linhVucApDung', label: 'Lĩnh vực áp dụng', type: 'text' },
      { key: 'donViChuTri', label: 'Đơn vị chủ trì', type: 'text' },
      { key: 'tongMucDauTu', label: 'Tổng mức đầu tư (tỷ đồng)', type: 'number' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Đề xuất', 'Đang triển khai', 'Hoàn thành'] },
    ],
  },
  'phong-ptdt/tham-dinh-htkt-khu-do-thi': {
    label: 'Thẩm định HTKT khu đô thị', tieuDeLabel: 'Tên dự án khu đô thị',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'dienTich', label: 'Diện tích (ha)', type: 'number' },
      { key: 'hangMuc', label: 'Hạng mục HTKT', type: 'textarea' },
      { key: 'ngayThamDinh', label: 'Ngày thẩm định', type: 'date' },
    ],
  },
  'phong-ptdt/csdl-ptdt': {
    label: 'CSDL phát triển đô thị', tieuDeLabel: 'Tên đô thị / đối tượng',
    fields: [
      { key: 'chiTieu', label: 'Chỉ tiêu theo dõi', type: 'text' },
      { key: 'giaTri', label: 'Giá trị', type: 'text' },
      { key: 'kyBaoCao', label: 'Kỳ báo cáo', type: 'text' },
      { key: 'nguonSoLieu', label: 'Nguồn số liệu', type: 'text' },
    ],
  },

  // ===== Phòng Kế hoạch - Tài chính =====
  'phong-kh-tc/ke-hoach-phat-trien': {
    label: 'Kế hoạch phát triển ngành', tieuDeLabel: 'Tên kế hoạch / chỉ tiêu',
    fields: [
      { key: 'loaiKeHoach', label: 'Loại kế hoạch', type: 'select', options: ['Năm', 'Trung hạn', 'Dài hạn'] },
      { key: 'ky', label: 'Năm / Kỳ', type: 'text' },
      { key: 'chiTieu', label: 'Chỉ tiêu', type: 'text' },
      { key: 'donViThucHien', label: 'Đơn vị thực hiện', type: 'text' },
    ],
  },
  'phong-kh-tc/dau-thau': {
    label: 'Đấu thầu', tieuDeLabel: 'Tên gói thầu / dự án',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'hinhThucLCNT', label: 'Hình thức lựa chọn nhà thầu', type: 'text' },
      { key: 'giaGoiThau', label: 'Giá gói thầu (đồng)', type: 'number' },
      { key: 'nhaThau', label: 'Nhà thầu trúng thầu', type: 'text' },
      { key: 'ngayPheDuyet', label: 'Ngày phê duyệt', type: 'date' },
    ],
  },
  'phong-kh-tc/ke-hoach-von': {
    label: 'Kế hoạch vốn & dự toán', tieuDeLabel: 'Tên dự án / nội dung',
    fields: [
      { key: 'nguonVon', label: 'Nguồn vốn', type: 'text' },
      { key: 'keHoachVon', label: 'Kế hoạch vốn (đồng)', type: 'number' },
      { key: 'daGiaiNgan', label: 'Đã giải ngân (đồng)', type: 'number' },
      { key: 'nam', label: 'Năm', type: 'number' },
    ],
  },
  'phong-kh-tc/tai-chinh-ke-toan': {
    label: 'Tài chính - kế toán', tieuDeLabel: 'Nội dung / chứng từ',
    fields: [
      { key: 'loaiNghiepVu', label: 'Loại nghiệp vụ', type: 'select', options: ['Thu', 'Chi', 'Lương', 'BHXH', 'Thuế', 'Khác'] },
      { key: 'soTien', label: 'Số tiền (đồng)', type: 'number' },
      { key: 'ngayPhatSinh', label: 'Ngày phát sinh', type: 'date' },
      { key: 'chungTu', label: 'Số chứng từ', type: 'text' },
    ],
  },
  'phong-kh-tc/thong-ke': {
    label: 'Thống kê ngành', tieuDeLabel: 'Tên chỉ tiêu thống kê',
    fields: [
      { key: 'kyThongKe', label: 'Kỳ thống kê', type: 'text' },
      { key: 'donViTinh', label: 'Đơn vị tính', type: 'text' },
      { key: 'giaTri', label: 'Giá trị', type: 'number' },
      { key: 'nguonSoLieu', label: 'Nguồn số liệu', type: 'text' },
    ],
  },

  // ===== Phòng Quản lý chất lượng công trình giao thông =====
  'phong-clct/tham-dinh-thiet-ke': {
    label: 'Thẩm định BCNCKT, thiết kế', tieuDeLabel: 'Tên công trình',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'buocThietKe', label: 'Bước thiết kế', type: 'text' },
      { key: 'tongMucDauTu', label: 'Tổng mức đầu tư (đồng)', type: 'number' },
      { key: 'ketQua', label: 'Kết quả', type: 'select', options: ['Đạt', 'Yêu cầu bổ sung', 'Không đạt'] },
      { key: 'ngayThamDinh', label: 'Ngày thẩm định', type: 'date' },
    ],
  },
  'phong-clct/kiem-tra-nghiem-thu': {
    label: 'Kiểm tra công tác nghiệm thu', tieuDeLabel: 'Tên công trình',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'hangMuc', label: 'Hạng mục', type: 'text' },
      { key: 'ketQua', label: 'Kết quả kiểm tra', type: 'select', options: ['Đủ điều kiện', 'Chưa đủ điều kiện'] },
      { key: 'ngayKiemTra', label: 'Ngày kiểm tra', type: 'date' },
    ],
  },
  'phong-clct/chat-luong-an-toan': {
    label: 'Chất lượng & an toàn thi công', tieuDeLabel: 'Tên công trình / sự việc',
    fields: [
      { key: 'noiDung', label: 'Nội dung', type: 'textarea' },
      { key: 'mucDo', label: 'Mức độ', type: 'select', options: ['Bình thường', 'Cảnh báo', 'Sự cố'] },
      { key: 'bienPhap', label: 'Biện pháp xử lý', type: 'text' },
      { key: 'ngayPhatHien', label: 'Ngày phát hiện', type: 'date' },
    ],
  },
  'phong-clct/bao-tri-cong-trinh': {
    label: 'Bảo trì công trình giao thông', tieuDeLabel: 'Tên công trình',
    fields: [
      { key: 'hangMucBaoTri', label: 'Hạng mục bảo trì', type: 'text' },
      { key: 'kinhPhi', label: 'Kinh phí (đồng)', type: 'number' },
      { key: 'tanSuat', label: 'Tần suất', type: 'text' },
      { key: 'lanGanNhat', label: 'Lần bảo trì gần nhất', type: 'date' },
    ],
  },
  'phong-clct/giam-dinh-dinh-muc': {
    label: 'Giám định tư pháp & định mức KT-KT', tieuDeLabel: 'Tên vụ việc / định mức',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Giám định tư pháp', 'Định mức KT-KT'] },
      { key: 'donViTrungCau', label: 'Đơn vị trưng cầu / ban hành', type: 'text' },
      { key: 'ketQua', label: 'Kết quả', type: 'textarea' },
      { key: 'ngayThucHien', label: 'Ngày thực hiện', type: 'date' },
    ],
  },

  // ===== Phòng Quản lý kết cấu hạ tầng giao thông =====
  'phong-qlkcht/ket-cau-ha-tang': {
    label: 'Kết cấu hạ tầng giao thông', tieuDeLabel: 'Tên tuyến / công trình',
    fields: [
      { key: 'loaiDuong', label: 'Loại đường', type: 'select', options: ['Đường bộ', 'Đường sắt', 'Đường thủy nội địa'] },
      { key: 'chieuDai', label: 'Chiều dài (km)', type: 'number' },
      { key: 'capDuong', label: 'Cấp đường / tuyến', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Tốt', 'Trung bình', 'Xuống cấp'] },
    ],
  },
  'phong-qlkcht/an-toan-giao-thong': {
    label: 'An toàn giao thông', tieuDeLabel: 'Tên vụ việc / điểm',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Tai nạn', 'Điểm đen', 'Điểm tiềm ẩn', 'Khác'] },
      { key: 'viTri', label: 'Vị trí', type: 'text' },
      { key: 'thietHai', label: 'Thiệt hại / mô tả', type: 'textarea' },
      { key: 'ngayXayRa', label: 'Ngày xảy ra', type: 'date' },
    ],
  },
  'phong-qlkcht/cap-phep-thi-cong': {
    label: 'Cấp phép thi công đường bộ', tieuDeLabel: 'Tên công trình / hạng mục',
    fields: [
      { key: 'donViXinPhep', label: 'Đơn vị xin phép', type: 'text' },
      { key: 'viTri', label: 'Vị trí (lý trình)', type: 'text' },
      { key: 'thoiHan', label: 'Thời hạn', type: 'text' },
      { key: 'ngayCap', label: 'Ngày cấp', type: 'date' },
    ],
  },
  'phong-qlkcht/ben-xe-cang-ben': {
    label: 'Bến xe, bãi đỗ, cảng bến', tieuDeLabel: 'Tên bến / cảng',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Bến xe', 'Bãi đỗ xe', 'Cảng', 'Bến thủy nội địa'] },
      { key: 'capBen', label: 'Loại / cấp', type: 'text' },
      { key: 'diaDiem', label: 'Địa điểm', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Đang hoạt động', 'Tạm ngừng', 'Đóng'] },
    ],
  },
  'phong-qlkcht/pha-do-nong-thon-moi': {
    label: 'Phá dỡ tàu biển & Nông thôn mới', tieuDeLabel: 'Tên đối tượng / xã',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Phá dỡ tàu biển', 'Tiêu chí giao thông NTM'] },
      { key: 'noiDung', label: 'Nội dung', type: 'textarea' },
      { key: 'ketQua', label: 'Kết quả', type: 'text' },
      { key: 'nam', label: 'Năm', type: 'number' },
    ],
  },

  // ===== Phòng Quản lý hoạt động xây dựng =====
  'phong-qlhd-xd/cap-phep-xay-dung': {
    label: 'Cấp phép xây dựng', tieuDeLabel: 'Số giấy phép',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'diaChi', label: 'Địa chỉ công trình', type: 'text' },
      { key: 'loaiCongTrinh', label: 'Loại công trình', type: 'text' },
      { key: 'dienTichXD', label: 'Diện tích XD (m²)', type: 'number' },
      { key: 'soTang', label: 'Số tầng', type: 'number' },
      { key: 'ngayCap', label: 'Ngày cấp', type: 'date' },
    ],
  },
  'phong-qlhd-xd/trat-tu-xay-dung': {
    label: 'Quản lý trật tự xây dựng', tieuDeLabel: 'Tên vụ việc / công trình',
    fields: [
      { key: 'diaChi', label: 'Địa chỉ', type: 'text' },
      { key: 'loaiViPham', label: 'Loại vi phạm', type: 'text' },
      { key: 'bienPhap', label: 'Biện pháp xử lý', type: 'text' },
      { key: 'trangThaiXuLy', label: 'Trạng thái xử lý', type: 'select', options: ['Mới phát hiện', 'Đang xử lý', 'Đã xử lý'] },
      { key: 'ngayPhatHien', label: 'Ngày phát hiện', type: 'date' },
    ],
  },
  'phong-qlhd-xd/tham-dinh-du-an': {
    label: 'Thẩm định dự án, thiết kế', tieuDeLabel: 'Tên dự án / công trình',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'loaiCongTrinh', label: 'Loại công trình', type: 'text' },
      { key: 'tongMucDauTu', label: 'Tổng mức đầu tư (đồng)', type: 'number' },
      { key: 'ketQua', label: 'Kết quả', type: 'select', options: ['Đạt', 'Yêu cầu bổ sung', 'Không đạt'] },
      { key: 'ngayThamDinh', label: 'Ngày thẩm định', type: 'date' },
    ],
  },
  'phong-qlhd-xd/chung-chi-nha-thau': {
    label: 'Chứng chỉ & nhà thầu nước ngoài', tieuDeLabel: 'Tên tổ chức / cá nhân',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Chứng chỉ hành nghề', 'Chứng chỉ năng lực', 'Nhà thầu nước ngoài'] },
      { key: 'soChungChi', label: 'Số chứng chỉ / giấy phép', type: 'text' },
      { key: 'linhVuc', label: 'Lĩnh vực', type: 'text' },
      { key: 'hang', label: 'Hạng', type: 'text' },
      { key: 'ngayCap', label: 'Ngày cấp', type: 'date' },
    ],
  },
  'phong-qlhd-xd/thi-nghiem-chuyen-nganh': {
    label: 'Thí nghiệm chuyên ngành', tieuDeLabel: 'Tên phòng thí nghiệm (LAS-XD)',
    fields: [
      { key: 'maLAS', label: 'Mã LAS-XD', type: 'text' },
      { key: 'donViChuQuan', label: 'Đơn vị chủ quản', type: 'text' },
      { key: 'linhVucThiNghiem', label: 'Lĩnh vực thí nghiệm', type: 'textarea' },
      { key: 'hieuLuc', label: 'Hiệu lực đến', type: 'date' },
    ],
  },

  // ===== Phòng Quản lý vận tải =====
  'phong-ql-vt/dang-kiem-duong-thuy': {
    label: 'Đăng ký, đăng kiểm đường thủy', tieuDeLabel: 'Tên / số đăng ký phương tiện',
    fields: [
      { key: 'chuPhuongTien', label: 'Chủ phương tiện', type: 'text' },
      { key: 'loaiPhuongTien', label: 'Loại phương tiện', type: 'text' },
      { key: 'trongTai', label: 'Trọng tải (tấn)', type: 'number' },
      { key: 'hanDangKiem', label: 'Hạn đăng kiểm', type: 'date' },
    ],
  },
  'phong-ql-vt/dao-tao-sat-hach': {
    label: 'Đào tạo, sát hạch GPLX', tieuDeLabel: 'Tên cơ sở / kỳ sát hạch',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Cơ sở đào tạo', 'Trung tâm sát hạch', 'Kỳ sát hạch'] },
      { key: 'hangGPLX', label: 'Hạng GPLX', type: 'text' },
      { key: 'soLuong', label: 'Số học viên / thí sinh', type: 'number' },
      { key: 'ngay', label: 'Ngày', type: 'date' },
    ],
  },
  'phong-ql-vt/quan-ly-van-tai': {
    label: 'Quản lý vận tải, bến xe, taxi', tieuDeLabel: 'Tên đơn vị vận tải',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Tuyến cố định', 'Taxi', 'Hợp đồng', 'Container', 'Khác'] },
      { key: 'soPhuongTien', label: 'Số phương tiện', type: 'number' },
      { key: 'soPhuHieu', label: 'Số phù hiệu đã cấp', type: 'number' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'text' },
    ],
  },
  'phong-ql-vt/van-tai-cong-cong': {
    label: 'Vận tải hành khách công cộng', tieuDeLabel: 'Tên tuyến buýt',
    fields: [
      { key: 'loTrinh', label: 'Lộ trình', type: 'textarea' },
      { key: 'soChuyen', label: 'Số chuyến/ngày', type: 'number' },
      { key: 'donViVanHanh', label: 'Đơn vị vận hành', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Đang khai thác', 'Tạm ngừng'] },
    ],
  },
  'phong-ql-vt/htx-gtvt': {
    label: 'Hợp tác xã GTVT', tieuDeLabel: 'Tên hợp tác xã',
    fields: [
      { key: 'diaChi', label: 'Địa chỉ', type: 'text' },
      { key: 'soXaVien', label: 'Số xã viên', type: 'number' },
      { key: 'nganhNghe', label: 'Ngành nghề', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'select', options: ['Đang hoạt động', 'Ngừng hoạt động'] },
    ],
  },

  // ===== Phòng Quy hoạch - Kiến trúc =====
  'phong-qh-kt/csdl-quy-hoach': {
    label: 'CSDL quy hoạch đô thị - nông thôn', tieuDeLabel: 'Tên đồ án quy hoạch',
    fields: [
      { key: 'loaiQuyHoach', label: 'Loại quy hoạch', type: 'select', options: ['QH chung', 'QH phân khu', 'QH chi tiết', 'QH nông thôn', 'QH khác'] },
      { key: 'capPheDuyet', label: 'Cấp phê duyệt', type: 'text' },
      { key: 'tyLe', label: 'Tỷ lệ', type: 'text' },
      { key: 'namPheDuyet', label: 'Năm phê duyệt', type: 'number' },
    ],
  },
  'phong-qh-kt/tham-dinh-quy-hoach': {
    label: 'Thẩm định, phê duyệt quy hoạch', tieuDeLabel: 'Tên đồ án / nhiệm vụ',
    fields: [
      { key: 'chuDauTu', label: 'Chủ đầu tư / cơ quan trình', type: 'text' },
      { key: 'loaiQuyHoach', label: 'Loại quy hoạch', type: 'text' },
      { key: 'ketQua', label: 'Kết quả', type: 'select', options: ['Đạt', 'Yêu cầu chỉnh sửa', 'Không đạt'] },
      { key: 'ngayThamDinh', label: 'Ngày thẩm định', type: 'date' },
    ],
  },
  'phong-qh-kt/thiet-ke-do-thi': {
    label: 'Thiết kế đô thị', tieuDeLabel: 'Tên khu vực / đồ án',
    fields: [
      { key: 'phamVi', label: 'Phạm vi', type: 'text' },
      { key: 'capPheDuyet', label: 'Cấp phê duyệt', type: 'text' },
      { key: 'namLap', label: 'Năm lập', type: 'number' },
    ],
  },
  'phong-qh-kt/quy-che-kien-truc': {
    label: 'Quy chế quản lý kiến trúc', tieuDeLabel: 'Tên quy chế / khu vực',
    fields: [
      { key: 'phamViApDung', label: 'Phạm vi áp dụng', type: 'text' },
      { key: 'capBanHanh', label: 'Cấp ban hành', type: 'text' },
      { key: 'soQuyetDinh', label: 'Số quyết định', type: 'text' },
      { key: 'ngayBanHanh', label: 'Ngày ban hành', type: 'date' },
    ],
  },
  'phong-qh-kt/chung-chi-kien-truc': {
    label: 'Chứng chỉ hành nghề kiến trúc', tieuDeLabel: 'Họ tên kiến trúc sư',
    fields: [
      { key: 'soChungChi', label: 'Số chứng chỉ', type: 'text' },
      { key: 'linhVuc', label: 'Lĩnh vực', type: 'text' },
      { key: 'ngayCap', label: 'Ngày cấp', type: 'date' },
      { key: 'hieuLuc', label: 'Hiệu lực đến', type: 'date' },
    ],
  },

  // ===== Phòng Quản lý nhà và thị trường BĐS =====
  'phong-ql-nha/phat-trien-nha-o': {
    label: 'Chương trình phát triển nhà ở', tieuDeLabel: 'Tên chương trình / dự án',
    fields: [
      { key: 'loaiNhaO', label: 'Loại nhà ở', type: 'text' },
      { key: 'diaDiem', label: 'Địa điểm', type: 'text' },
      { key: 'quyMo', label: 'Quy mô (căn / ha)', type: 'text' },
      { key: 'giaiDoan', label: 'Giai đoạn', type: 'text' },
    ],
  },
  'phong-ql-nha/nha-o-xa-hoi': {
    label: 'Nhà ở xã hội, nhà công vụ', tieuDeLabel: 'Tên dự án / quỹ nhà',
    fields: [
      { key: 'loaiHinh', label: 'Loại hình', type: 'select', options: ['Nhà ở xã hội', 'Nhà công vụ', 'Nhà tái định cư'] },
      { key: 'chuDauTu', label: 'Chủ đầu tư', type: 'text' },
      { key: 'soCanHo', label: 'Số căn hộ', type: 'number' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'text' },
    ],
  },
  'phong-ql-nha/dinh-gia-nha': {
    label: 'Định giá nhà', tieuDeLabel: 'Tên / địa chỉ nhà',
    fields: [
      { key: 'loaiNha', label: 'Loại nhà', type: 'text' },
      { key: 'dienTich', label: 'Diện tích (m²)', type: 'number' },
      { key: 'donGia', label: 'Đơn giá (đồng/m²)', type: 'number' },
      { key: 'giaTri', label: 'Giá trị (đồng)', type: 'number' },
      { key: 'thoiDiem', label: 'Thời điểm định giá', type: 'date' },
    ],
  },
  'phong-ql-nha/thi-truong-bds': {
    label: 'Thị trường BĐS & môi giới', tieuDeLabel: 'Tên tổ chức / dự án',
    fields: [
      { key: 'loai', label: 'Loại', type: 'select', options: ['Doanh nghiệp BĐS', 'Dự án BĐS', 'Chứng chỉ môi giới'] },
      { key: 'diaBanHoatDong', label: 'Địa bàn hoạt động', type: 'text' },
      { key: 'soChungChi', label: 'Số chứng chỉ (nếu có)', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng', type: 'text' },
    ],
  },
  'phong-ql-nha/he-thong-thong-tin': {
    label: 'Hệ thống thông tin nhà ở & BĐS', tieuDeLabel: 'Tên chỉ tiêu / dữ liệu',
    fields: [
      { key: 'nhomDuLieu', label: 'Nhóm dữ liệu', type: 'text' },
      { key: 'giaTri', label: 'Giá trị', type: 'text' },
      { key: 'kyCapNhat', label: 'Kỳ cập nhật', type: 'text' },
      { key: 'nguon', label: 'Nguồn', type: 'text' },
    ],
  },
  // ===== Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật =====
  // Kho dữ liệu các tuyến đường được giao bảo trì (mặt cắt ≥ 20m) trên địa bàn
  // các phường Đồng Hới, Đồng Thuận, Đồng Sơn. Cô lập theo to_chuc BAN_BAO_TRI_GT.
  'trung-tam-bao-tri/tuyen-duong-mat-cat-lon': {
    label: 'Tuyến đường giao bảo trì', tieuDeLabel: 'Tên tuyến đường',
    fields: [
      { key: 'chieuDai', label: 'Chiều dài tuyến (km)', type: 'number' },
      { key: 'matCat', label: 'Bề rộng hiện trạng (m)', type: 'number' },
      { key: 'matCatQH', label: 'Bề rộng quy hoạch (m)', type: 'number' },
      { key: 'diemDau', label: 'Điểm đầu (lý trình)', type: 'text' },
      { key: 'diemCuoi', label: 'Điểm cuối (lý trình)', type: 'text' },
      { key: 'ketCau', label: 'Kết cấu mặt đường', type: 'text' },
      { key: 'tinhTrang', label: 'Tình trạng mặt đường', type: 'select', options: ['Tốt', 'Trung bình', 'Xuống cấp'] },
      { key: 'namBaoTri', label: 'Năm bảo trì gần nhất', type: 'number' },
    ],
    tableFields: ['chieuDai', 'matCat', 'matCatQH'],
  },
}

export function getNghiepVuSchema(linhVuc: string): NvSchema | null {
  return NGHIEP_VU_SCHEMAS[linhVuc] ?? null
}

// Trạng thái chuẩn dùng chung cho mọi bản ghi nghiệp vụ.
export const NV_TRANG_THAI: { value: string; label: string; color: string }[] = [
  { value: 'MOI', label: 'Mới', color: 'bg-slate-100 text-slate-700' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700' },
  { value: 'HOAN_THANH', label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'HUY', label: 'Huỷ', color: 'bg-rose-100 text-rose-700' },
]

export function trangThaiInfo(v: string) {
  return NV_TRANG_THAI.find((t) => t.value === v) ?? NV_TRANG_THAI[0]
}
