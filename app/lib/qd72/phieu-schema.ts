// Cấu hình TRƯỜNG cho 6 phiếu khảo sát QĐ 72/2026 + wizard 8 bước.
// Nguyên tắc: KHÔNG hard-code tiêu chí trong UI (ngưỡng lấy từ bảng qd72_technical_rules).
// Mỗi field ánh xạ tới 1 CỘT định kiểu (col) trong migration 038, hoặc lưu vào chi_tiet JSONB
// (khi bỏ trống col). `rule` = mã tiêu chí liên quan để hiển thị ĐÁNH GIÁ SƠ BỘ khi nhập.
//
// Bảng liên quan (038): qd72_urban_areas, qd72_road_segments (+road_obstacles/passing_bays/
// fire_parking_areas), qd72_overhead_utility_lines (+utility_poles/utility_crossings/
// clearance_measurements/public_lighting_assets/undergrounding_proposals), qd72_water_sources
// (+fire_hydrants/water_test_results/water_intake_points), qd72_verification_records/items,
// qd72_renovation_plans/tasks, qd72_attachments.

export type Qd72FieldType =
  | 'text' | 'textarea' | 'number' | 'integer' | 'date' | 'datetime'
  | 'select' | 'multiselect' | 'boolean' | 'owner' | 'geometry' | 'coord' | 'photo'

export type Qd72Field = {
  key: string             // khoá dữ liệu (= tên cột nếu có col, hoặc khoá trong chi_tiet)
  label: string
  type: Qd72FieldType
  unit?: string
  options?: string[]      // cho select/multiselect
  required?: boolean
  col?: string            // tên CỘT DB (038); bỏ trống ⇒ lưu vào chi_tiet JSONB
  table?: string          // bảng đích nếu KHÁC bảng chính của phiếu (vd cột cấp hồ sơ / bảng con / bảng đo)
  nguon?: string          // với bảng đo tách xã-khai↔xác-minh: giá trị nguon mặc định (XA_KHAI…)
  rule?: string           // mã tiêu chí (qd72_technical_rules.ma_tieu_chi) để đánh giá sơ bộ
  help?: string
}

export type Qd72GeometryKind = 'Point' | 'LineString' | 'Polygon'

export type Qd72Phieu = {
  ma: string              // 'PHIEU_01'..'PHIEU_06'
  ten: string
  bang: string            // bảng chính
  geometry?: Qd72GeometryKind
  moTa?: string
  fields: Qd72Field[]
  // Bảng con nhập nhiều dòng (obstacles, poles, hydrants…): khai tối giản, chi tiết ở chính bảng đó.
  bangCon?: { bang: string; ten: string; geometry?: Qd72GeometryKind }[]
}

// ─── PHIẾU 01: Thông tin khu vực đô thị ──────────────────────────────────────
const PHIEU_01: Qd72Phieu = {
  ma: 'PHIEU_01', ten: 'Thông tin khu vực đô thị', bang: 'qd72_urban_areas', geometry: 'Polygon',
  moTa: 'Không mặc định toàn bộ địa bàn xã/phường là khu vực đô thị — phải xác định căn cứ và ranh giới cụ thể.',
  fields: [
    { key: 'ma', label: 'Mã hồ sơ', type: 'text', col: 'ma', table: 'qd72_survey_cases', help: 'Cấp hồ sơ; tự sinh nếu để trống' },
    { key: 'ten', label: 'Tên khu vực đô thị', type: 'text', required: true, col: 'ten' },
    { key: 'don_vi_hanh_chinh_id', label: 'Xã/phường', type: 'select', required: true, col: 'don_vi_hanh_chinh_id' },
    { key: 'thon_to_dan_pho', label: 'Thôn / tổ dân phố', type: 'text', col: 'thon_to_dan_pho' },
    { key: 'can_cu_xac_dinh', label: 'Căn cứ xác định là khu vực đô thị', type: 'textarea', required: true, col: 'can_cu_xac_dinh' },
    { key: 'so_van_ban_cong_nhan', label: 'Số văn bản công nhận', type: 'text', col: 'so_van_ban_cong_nhan' },
    { key: 'ngay_van_ban', label: 'Ngày văn bản', type: 'date', col: 'ngay_van_ban' },
    { key: 'dien_tich_ha', label: 'Diện tích', type: 'number', unit: 'ha', col: 'dien_tich_ha' },
    { key: 'dan_so', label: 'Dân số', type: 'integer', unit: 'người', col: 'dan_so' },
    { key: 'so_ho', label: 'Số hộ', type: 'integer', col: 'so_ho' },
    { key: 'so_cong_trinh', label: 'Số công trình', type: 'integer', col: 'so_cong_trinh' },
    { key: 'so_ct_tu_3_tang', label: 'Số công trình từ 3 tầng trở lên', type: 'integer', col: 'so_ct_tu_3_tang' },
    { key: 'so_cs_nguy_hiem_chay', label: 'Số cơ sở có nguy hiểm cháy, nổ', type: 'integer', col: 'so_cs_nguy_hiem_chay' },
    { key: 'don_vi_quan_ly', label: 'Đơn vị quản lý', type: 'text' },
    { key: 'nguoi_phu_trach', label: 'Người phụ trách', type: 'text' },
    { key: 'so_dien_thoai', label: 'Số điện thoại', type: 'text' },
    { key: 'geometry', label: 'Ranh giới khu vực (GIS)', type: 'geometry', col: 'geometry', help: 'Vẽ Polygon ranh giới trên bản đồ' },
    { key: 'mo_ta_hien_trang', label: 'Mô tả hiện trạng', type: 'textarea' },
    { key: 'anh_tong_the', label: 'Ảnh tổng thể', type: 'photo' },
    { key: 'ngay_khao_sat', label: 'Ngày khảo sát', type: 'date', col: 'ngay_khao_sat', table: 'qd72_survey_cases' },
    { key: 'thanh_phan_khao_sat', label: 'Thành phần khảo sát', type: 'textarea', col: 'thanh_phan_khao_sat', table: 'qd72_survey_cases' },
    { key: 'ho_so_dinh_kem', label: 'Hồ sơ đính kèm', type: 'photo' },
  ],
}

// ─── PHIẾU 02: Khảo sát giao thông phục vụ chữa cháy (mỗi đoạn = 1 bản ghi GIS) ──
const PHIEU_02: Qd72Phieu = {
  ma: 'PHIEU_02', ten: 'Khảo sát giao thông phục vụ chữa cháy', bang: 'qd72_road_segments', geometry: 'LineString',
  bangCon: [
    { bang: 'qd72_passing_bays', ten: 'Điểm tránh xe', geometry: 'Polygon' },
    { bang: 'qd72_fire_parking_areas', ten: 'Bãi đỗ xe chữa cháy', geometry: 'Polygon' },
    { bang: 'qd72_road_obstacles', ten: 'Vật cản', geometry: 'Point' },
  ],
  fields: [
    { key: 'ma', label: 'Mã đoạn đường', type: 'text', col: 'ma' },
    { key: 'ten', label: 'Tên đường/ngõ/hẻm', type: 'text', required: true, col: 'ten' },
    { key: 'diem_dau', label: 'Điểm đầu', type: 'text', col: 'diem_dau' },
    { key: 'diem_cuoi', label: 'Điểm cuối', type: 'text', col: 'diem_cuoi' },
    { key: 'chieu_dai_m', label: 'Chiều dài', type: 'number', unit: 'm', col: 'chieu_dai_m' },
    { key: 'rong_thong_thuy_min_m', label: 'Chiều rộng thông thủy nhỏ nhất', type: 'number', unit: 'm', col: 'rong_thong_thuy_min_m', rule: 'ROAD_MIN_WIDTH' },
    { key: 'cao_thong_thuy_min_m', label: 'Chiều cao thông thủy nhỏ nhất', type: 'number', unit: 'm', col: 'cao_thong_thuy_min_m', rule: 'CLEARANCE_MIN_HEIGHT' },
    { key: 'do_doc_max', label: 'Độ dốc lớn nhất', type: 'text', col: 'do_doc_max', rule: 'APPROACH_MAX_SLOPE', help: 'Tỉ lệ, vd 1:8,3' },
    { key: 'loai_mat_duong', label: 'Loại mặt đường', type: 'text', col: 'loai_mat_duong' },
    { key: 'tinh_trang_mat_duong', label: 'Tình trạng mặt đường', type: 'select', options: ['Tốt', 'Trung bình', 'Xuống cấp'], col: 'tinh_trang_mat_duong' },
    { key: 'chiu_tai', label: 'Khả năng chịu tải', type: 'text', col: 'chiu_tai' },
    { key: 'phuong_phap_danh_gia_tai', label: 'Phương pháp đánh giá tải trọng', type: 'text' },
    { key: 'so_lan', label: 'Số làn (một/nhiều làn)', type: 'select', options: ['Một làn', 'Nhiều làn'] },
    { key: 'la_duong_cut', label: 'Đường cụt', type: 'boolean', col: 'la_duong_cut' },
    { key: 'chieu_dai_cut_m', label: 'Chiều dài đường cụt', type: 'number', unit: 'm', col: 'chieu_dai_cut_m', rule: 'DEADEND_TURN_LENGTH' },
    { key: 'co_diem_quay_xe', label: 'Có điểm quay xe', type: 'boolean', col: 'co_diem_quay_xe' },
    { key: 'khoang_cach_diem_tranh_m', label: 'Khoảng cách giữa các điểm tránh', type: 'number', unit: 'm', rule: 'PASSINGBAY_MAX_SPACING' },
    { key: 'geometry', label: 'Vẽ tuyến đường (GIS)', type: 'geometry', col: 'geometry', help: 'LineString + lấy GPS' },
    { key: 'anh_dau_tuyen', label: 'Ảnh đầu tuyến', type: 'photo' },
    { key: 'anh_cuoi_tuyen', label: 'Ảnh cuối tuyến', type: 'photo' },
    { key: 'anh_vi_tri_khong_dat', label: 'Ảnh vị trí không đạt', type: 'photo' },
    { key: 'nguoi_do', label: 'Người đo', type: 'text' },
    { key: 'thiet_bi_do', label: 'Thiết bị đo', type: 'text' },
    { key: 'ngay_gio_do', label: 'Ngày giờ đo', type: 'datetime' },
    { key: 'de_xuat_chinh_trang', label: 'Đề xuất chỉnh trang', type: 'textarea', col: 'de_xuat_chinh_trang' },
  ],
}

// ─── PHIẾU 03: Đường dây, cáp, điện chiếu sáng và vật cản trên cao ────────────
const LOAI_DOI_TUONG_03 = [
  'Đường dây điện trung thế', 'Đường dây điện hạ thế', 'Dây điện sau công tơ',
  'Cáp viễn thông', 'Cáp internet', 'Cáp truyền hình', 'Cáp thông tin khác',
  'Dây điện chiếu sáng', 'Cần đèn / đèn trang trí', 'Cổng chào', 'Biển quảng cáo',
  'Cành cây', 'Kết cấu kiến trúc khác',
]
const PHUONG_AN_03D = [
  '1. Căng chỉnh, xử lý độ võng', '2. Nâng cao vị trí treo dây/cáp', '3. Bó gọn, sắp xếp lại cáp',
  '4. Chuyển dây/cáp sang cột phù hợp', '5. Thay/nâng cột hoặc điều chỉnh khoảng cột',
  '6. Di chuyển tuyến ra khỏi phạm vi đường xe chữa cháy', '7. Tháo dỡ dây, cáp không còn sử dụng',
  '8. Di chuyển cần đèn/đèn trang trí/thiết bị chiếu sáng', '9. Cắt tỉa cây xanh tác động',
  '10. Bố trí vào cống cáp hiện có', '11. Bố trí vào hào/tuy nen kỹ thuật hiện có',
  '12. Xây dựng mới cống cáp/hào kỹ thuật dùng chung', '13. Hạ ngầm đồng bộ điện + viễn thông + chiếu sáng',
  '14. Cải tạo cục bộ tại điểm giao cắt', '15. Phương án kỹ thuật khác do đơn vị chuyên ngành đề xuất',
]
const PHIEU_03: Qd72Phieu = {
  ma: 'PHIEU_03', ten: 'Khảo sát đường dây, cáp, điện chiếu sáng và vật cản trên cao', bang: 'qd72_overhead_utility_lines', geometry: 'LineString',
  moTa: 'Mỗi đoạn dây/cáp/cột/điểm giao cắt là 1 bản ghi GIS. KHÔNG mặc định hạ ngầm — chọn phương án phù hợp (mục E).',
  bangCon: [
    { bang: 'qd72_utility_poles', ten: 'Cột (điện/viễn thông/chiếu sáng/dùng chung)', geometry: 'Point' },
    { bang: 'qd72_utility_crossings', ten: 'Điểm giao cắt qua đường', geometry: 'Point' },
    { bang: 'qd72_clearance_measurements', ten: 'Đo chiều cao thông thủy' },
    { bang: 'qd72_public_lighting_assets', ten: 'Tài sản chiếu sáng công cộng', geometry: 'Point' },
    { bang: 'qd72_undergrounding_proposals', ten: 'Phương án xử lý (mục D)' },
  ],
  fields: [
    // A. Nhận dạng
    { key: 'ma', label: 'Mã đối tượng', type: 'text', col: 'ma' },
    { key: 'loai_doi_tuong', label: 'Loại đối tượng', type: 'select', required: true, options: LOAI_DOI_TUONG_03, col: 'loai_doi_tuong' },
    { key: 'ten_tuyen', label: 'Tên tuyến', type: 'text', col: 'ten_tuyen' },
    { key: 'owner_id', label: 'Chủ sở hữu', type: 'owner', col: 'owner_id', help: 'Chọn từ danh mục; nếu chưa rõ → để trống và chọn "Chưa xác định"' },
    { key: 'chu_so_huu_text', label: 'Chủ sở hữu (ghi tự do nếu chưa có trong danh mục)', type: 'text', col: 'chu_so_huu_text' },
    { key: 'trang_thai_chu_so_huu', label: 'Tình trạng xác định chủ sở hữu', type: 'select', options: ['XAC_DINH', 'CHUA_XAC_DINH'], col: 'trang_thai_chu_so_huu' },
    { key: 'don_vi_van_hanh', label: 'Đơn vị quản lý vận hành', type: 'text', col: 'don_vi_van_hanh' },
    { key: 'ma_cot_thiet_bi', label: 'Mã cột / số hiệu thiết bị', type: 'text' },
    { key: 'loai_cot', label: 'Loại cột', type: 'text' },
    { key: 'cot_dung_chung', label: 'Cột dùng riêng/dùng chung', type: 'select', options: ['Dùng riêng', 'Dùng chung'] },
    { key: 'so_bo_cap', label: 'Số lượng bó cáp', type: 'integer' },
    { key: 'tinh_trang_su_dung', label: 'Tình trạng sử dụng', type: 'select', options: ['Đang sử dụng', 'Ngừng sử dụng', 'Chưa xác định'], col: 'tinh_trang_su_dung' },
    // B. Số liệu khảo sát
    { key: 'cao_diem_thap_nhat_m', label: 'Chiều cao từ mặt đường đến điểm thấp nhất', type: 'number', unit: 'm', col: 'cao_diem_thap_nhat_m', rule: 'CLEARANCE_MIN_HEIGHT' },
    { key: 'cao_tim_duong_m', label: 'Chiều cao tại tim đường', type: 'number', unit: 'm' },
    { key: 'cao_mep_duong_m', label: 'Chiều cao tại mép đường', type: 'number', unit: 'm' },
    { key: 'chay_doc_hay_cat_ngang', label: 'Chạy dọc / giao cắt ngang đường', type: 'select', options: ['Chạy dọc', 'Giao cắt ngang'], col: 'chay_doc_hay_cat_ngang' },
    { key: 'chieu_dai_khong_dat_m', label: 'Chiều dài đoạn không đạt', type: 'number', unit: 'm' },
    { key: 'do_vong_quan_sat', label: 'Độ võng quan sát', type: 'text', col: 'do_vong_quan_sat' },
    { key: 'do_vong_do_m', label: 'Độ võng đo được (nếu có)', type: 'number', unit: 'm' },
    { key: 'nguyen_nhan_vong', label: 'Nguyên nhân võng', type: 'multiselect', options: ['Khoảng cột lớn', 'Dây chùng', 'Cột nghiêng', 'Phụ kiện hư hỏng', 'Treo cáp không đúng kỹ thuật', 'Kéo ghép nhiều loại cáp', 'Cây xanh tác động', 'Khác'] },
    { key: 'khoang_cach_hai_cot_m', label: 'Khoảng cách giữa hai cột', type: 'number', unit: 'm' },
    { key: 'tinh_trang_cot', label: 'Tình trạng cột', type: 'text' },
    { key: 'tinh_trang_mong_cot', label: 'Tình trạng móng cột', type: 'text' },
    { key: 'tinh_trang_xa_day_neo', label: 'Tình trạng xà, dây néo, phụ kiện', type: 'text' },
    { key: 'nguy_co_dut_roi_cham_chap', label: 'Nguy cơ đứt/rơi/chạm chập', type: 'boolean' },
    { key: 'co_can_tro_xe_cc', label: 'Cản trở xe chữa cháy', type: 'boolean', col: 'co_can_tro_xe_cc' },
    { key: 'co_can_tro_xe_thang', label: 'Cản trở xe thang/thiết bị chữa cháy', type: 'boolean' },
    { key: 'geometry', label: 'Vẽ tuyến dây/cáp (GIS)', type: 'geometry', col: 'geometry' },
    { key: 'anh_toan_canh', label: 'Ảnh toàn cảnh', type: 'photo' },
    { key: 'anh_diem_thap_nhat', label: 'Ảnh điểm thấp nhất', type: 'photo' },
    { key: 'anh_ma_cot', label: 'Ảnh mã cột / dấu hiệu nhận biết', type: 'photo' },
    { key: 'video_hien_truong', label: 'Video hiện trường (nếu cần)', type: 'photo' },
    { key: 'nguoi_khao_sat', label: 'Người khảo sát', type: 'text' },
    { key: 'thiet_bi_phuong_phap_do', label: 'Thiết bị / phương pháp đo', type: 'text' },
    { key: 'ngay_gio_do', label: 'Ngày giờ đo', type: 'datetime' },
    { key: 'dieu_kien_thoi_tiet', label: 'Điều kiện thời tiết', type: 'text' },
    { key: 'ghi_chu', label: 'Ghi chú', type: 'textarea' },
    // D. Phương án xử lý (chọn nhiều) — lưu ở qd72_undergrounding_proposals.cac_phuong_an
    { key: 'cac_phuong_an', label: 'Phương án xử lý đề xuất (chọn 1 hoặc nhiều)', type: 'multiselect', options: PHUONG_AN_03D, col: 'cac_phuong_an', table: 'qd72_undergrounding_proposals', help: 'Ưu tiên xử lý an toàn/căng chỉnh/tháo dỡ trước; hạ ngầm chỉ khi đủ điều kiện (mục E).' },
  ],
}

// ─── PHIẾU 04: Khảo sát nguồn nước chữa cháy (mỗi nguồn/trụ = 1 bản ghi GIS) ──
const PHIEU_04: Qd72Phieu = {
  ma: 'PHIEU_04', ten: 'Khảo sát nguồn nước chữa cháy', bang: 'qd72_water_sources', geometry: 'Point',
  bangCon: [
    { bang: 'qd72_fire_hydrants', ten: 'Trụ nước chữa cháy', geometry: 'Point' },
    { bang: 'qd72_water_test_results', ten: 'Kết quả đo lưu lượng/áp lực (xã khai ↔ xác minh)' },
    { bang: 'qd72_water_intake_points', ten: 'Bến/hố thu nước', geometry: 'Point' },
  ],
  fields: [
    { key: 'ma', label: 'Mã nguồn nước', type: 'text', col: 'ma' },
    { key: 'loai_nguon', label: 'Loại nguồn', type: 'select', required: true, options: ['Trụ nước', 'Bể nước', 'Hồ/ao', 'Sông/kênh', 'Khác'], col: 'loai_nguon' },
    { key: 'ten', label: 'Tên nguồn', type: 'text', col: 'ten' },
    { key: 'don_vi_hanh_chinh_id', label: 'Xã/phường', type: 'select', col: 'don_vi_hanh_chinh_id' },
    { key: 'dia_chi', label: 'Địa chỉ', type: 'text', col: 'dia_chi' },
    { key: 'don_vi_quan_ly', label: 'Đơn vị quản lý', type: 'text', col: 'don_vi_quan_ly' },
    { key: 'tinh_trang', label: 'Tình trạng hoạt động', type: 'select', options: ['Hoạt động', 'Hư hỏng', 'Ngừng'], col: 'tinh_trang' },
    { key: 'duong_kinh_ong_dn', label: 'Đường kính ống', type: 'number', unit: 'DN', col: 'duong_kinh_ong_dn', rule: 'PIPE_MIN_DIAMETER' },
    { key: 'mang_vong_hay_cut', label: 'Mạng vòng / mạng cụt', type: 'select', options: ['Mạng vòng', 'Mạng cụt'], col: 'mang_vong_hay_cut' },
    { key: 'chieu_dai_cut_m', label: 'Chiều dài nhánh cụt', type: 'number', unit: 'm', col: 'chieu_dai_cut_m', rule: 'DEADEND_PIPE_MAX_LENGTH' },
    { key: 'khoang_cach_tru_gan_nhat_m', label: 'Khoảng cách đến trụ gần nhất', type: 'number', unit: 'm', rule: 'HYDRANT_MAX_SPACING' },
    { key: 'khoang_cach_khu_bao_ve_m', label: 'Khoảng cách đến khu vực cần bảo vệ', type: 'number', unit: 'm', rule: 'WATER_SERVICE_RADIUS' },
    { key: 'dung_tich_m3', label: 'Dung tích nguồn nước', type: 'number', unit: 'm³', col: 'dung_tich_m3' },
    { key: 'muc_nuoc_mua_kho', label: 'Mực nước mùa khô', type: 'text' },
    { key: 'thoi_gian_duy_tri', label: 'Thời gian duy trì cấp nước', type: 'text', rule: 'FIRE_DURATION_DEFAULT' },
    { key: 'kha_nang_tiep_can', label: 'Khả năng xe chữa cháy tiếp cận', type: 'text' },
    { key: 'so_xe_dong_thoi', label: 'Số xe lấy nước đồng thời', type: 'integer' },
    { key: 'geometry', label: 'Vị trí nguồn nước (GIS)', type: 'geometry', col: 'geometry' },
    { key: 'anh_hien_truong', label: 'Ảnh hiện trường', type: 'photo' },
    { key: 'tinh_trang_hu_hong', label: 'Tình trạng hư hỏng', type: 'textarea' },
    { key: 'de_xuat_sua_chua', label: 'Đề xuất sửa chữa', type: 'textarea', col: 'de_xuat_sua_chua' },
    // Trụ nước (bảng con qd72_fire_hydrants) — khoảng cách mép đường/tường
    { key: 'cach_mep_duong_m', label: 'Trụ nước cách mép đường', type: 'number', unit: 'm', col: 'cach_mep_duong_m', table: 'qd72_fire_hydrants', rule: 'HYDRANT_MAX_DIST_ROAD' },
    { key: 'cach_tuong_m', label: 'Trụ nước cách tường nhà', type: 'number', unit: 'm', col: 'cach_tuong_m', table: 'qd72_fire_hydrants', rule: 'HYDRANT_MIN_DIST_WALL' },
    // Số liệu đo lưu ở qd72_water_test_results với nguon='XA_KHAI' (số liệu XÃ KHAI).
    // Đơn vị cấp nước xác minh sẽ tạo bản ghi RIÊNG nguon='XAC_MINH' (KHÔNG ghi đè xã khai).
    { key: 'luu_luong_ls', label: 'Lưu lượng (xã khai)', type: 'number', unit: 'L/s', col: 'luu_luong_ls', table: 'qd72_water_test_results', nguon: 'XA_KHAI', rule: 'WATER_FLOW_TWO_SOURCES', help: 'Số liệu xã khai — chờ đơn vị cấp nước/cơ quan chuyên môn XÁC MINH (lưu bản ghi riêng).' },
    { key: 'ap_luc_du_m', label: 'Áp lực dư (xã khai)', type: 'number', unit: 'm cột nước', col: 'ap_luc_du_m', table: 'qd72_water_test_results', nguon: 'XA_KHAI', rule: 'WATER_MIN_PRESSURE' },
    { key: 'thoi_diem_do', label: 'Thời điểm đo', type: 'datetime', col: 'thoi_diem_do', table: 'qd72_water_test_results', nguon: 'XA_KHAI' },
    { key: 'thiet_bi_do', label: 'Thiết bị đo', type: 'text', table: 'qd72_water_test_results', nguon: 'XA_KHAI' },
    { key: 'nguoi_don_vi_do', label: 'Người và đơn vị đo', type: 'text', col: 'nguoi_don_vi_do', table: 'qd72_water_test_results', nguon: 'XA_KHAI' },
    { key: 'bien_ban_kiem_tra', label: 'Biên bản kiểm tra', type: 'photo' },
  ],
}

// ─── PHIẾU 05: Biên bản xác minh liên ngành (post-submit, KHÔNG trong wizard xã) ──
const PHIEU_05: Qd72Phieu = {
  ma: 'PHIEU_05', ten: 'Biên bản xác minh liên ngành', bang: 'qd72_verification_records',
  moTa: 'Do các cơ quan/đơn vị chuyên ngành lập. Mỗi tiêu chí có kết quả: Đạt / Không đạt / Chưa đủ dữ liệu / Không áp dụng / Chờ xác minh chuyên môn.',
  bangCon: [{ bang: 'qd72_verification_items', ten: 'Kết quả từng tiêu chí' }],
  fields: [
    { key: 'ma', label: 'Số biên bản', type: 'text', col: 'ma' },
    { key: 'ngay_xac_minh', label: 'Ngày xác minh', type: 'date', col: 'ngay_xac_minh' },
    { key: 'thanh_phan', label: 'Thành phần tham gia', type: 'multiselect', options: ['UBND xã/phường', 'Sở Xây dựng', 'Công an tỉnh', 'Sở Công Thương', 'Sở Khoa học và Công nghệ', 'Đơn vị điện lực', 'Đơn vị cấp nước', 'Đơn vị quản lý chiếu sáng', 'Doanh nghiệp viễn thông', 'Đơn vị quản lý công trình liên quan'], col: 'thanh_phan' },
    { key: 'noi_dung', label: 'Nội dung (số liệu xã khai, số liệu đo lại, ý kiến từng đơn vị, phương án, yêu cầu bổ sung, thời hạn)', type: 'textarea', col: 'noi_dung' },
    { key: 'tai_lieu_dinh_kem', label: 'Tài liệu và ảnh đính kèm', type: 'photo' },
  ],
}

// ─── PHIẾU 06: Kế hoạch cải tạo, chỉnh trang (post-verify) ────────────────────
const NHOM_GIAI_PHAP_06 = [
  'Mở rộng/cải tạo đường', 'Xử lý vật cản', 'Cải tạo điểm quay xe', 'Xây dựng điểm tránh',
  'Xây dựng bãi đỗ xe chữa cháy', 'Nâng/căng chỉnh/di chuyển dây-cáp', 'Xử lý độ võng',
  'Tháo dỡ cáp không sử dụng', 'Cải tạo cột điện/viễn thông/chiếu sáng', 'Hạ ngầm đường dây điện',
  'Hạ ngầm cáp viễn thông', 'Hạ ngầm dây điện chiếu sáng', 'Xây dựng cống cáp/hào/tuy nen dùng chung',
  'Bổ sung/sửa chữa trụ nước', 'Cải tạo mạng cấp nước', 'Xây bể chứa/bến lấy nước/hố thu nước',
  'Giải pháp thay thế cho khu vực không thể cải tạo đầy đủ',
]
const PHIEU_06: Qd72Phieu = {
  ma: 'PHIEU_06', ten: 'Kế hoạch cải tạo, chỉnh trang', bang: 'qd72_renovation_plans', geometry: 'Point',
  bangCon: [{ bang: 'qd72_renovation_tasks', ten: 'Công việc chi tiết' }],
  fields: [
    { key: 'van_de_ton_tai', label: 'Vấn đề tồn tại', type: 'textarea', required: true, col: 'van_de_ton_tai' },
    { key: 'geometry', label: 'Vị trí (GIS)', type: 'geometry', col: 'geometry' },
    { key: 'can_cu_xac_dinh', label: 'Căn cứ xác định', type: 'textarea', col: 'can_cu_xac_dinh' },
    { key: 'giai_phap', label: 'Giải pháp', type: 'textarea', col: 'giai_phap' },
    { key: 'nhom_giai_phap', label: 'Nhóm giải pháp', type: 'select', options: NHOM_GIAI_PHAP_06, col: 'nhom_giai_phap' },
    { key: 'khoi_luong', label: 'Khối lượng', type: 'text' },
    { key: 'muc_uu_tien', label: 'Mức độ ưu tiên', type: 'select', options: ['Cao', 'Trung bình', 'Thấp'], col: 'muc_uu_tien' },
    { key: 'co_quan_chu_tri', label: 'Cơ quan chủ trì', type: 'text', col: 'co_quan_chu_tri' },
    { key: 'don_vi_phoi_hop', label: 'Đơn vị phối hợp', type: 'text', col: 'don_vi_phoi_hop' },
    { key: 'chu_so_huu_ct', label: 'Chủ sở hữu công trình', type: 'text', col: 'chu_so_huu_ct' },
    { key: 'nguon_von', label: 'Nguồn vốn', type: 'text', col: 'nguon_von' },
    { key: 'kinh_phi', label: 'Kinh phí', type: 'number', unit: 'đồng', col: 'kinh_phi' },
    { key: 'nam_chuan_bi_dau_tu', label: 'Năm chuẩn bị đầu tư', type: 'integer' },
    { key: 'nam_thuc_hien', label: 'Năm thực hiện', type: 'integer', col: 'nam_thuc_hien' },
    { key: 'ngay_bat_dau', label: 'Ngày bắt đầu', type: 'date' },
    { key: 'ngay_hoan_thanh_dk', label: 'Ngày hoàn thành dự kiến', type: 'date' },
    { key: 'tien_do', label: 'Tiến độ', type: 'text', col: 'tien_do' },
    { key: 'kho_khan', label: 'Khó khăn', type: 'textarea' },
    { key: 'anh_truoc', label: 'Ảnh trước thực hiện', type: 'photo' },
    { key: 'anh_trong', label: 'Ảnh trong thực hiện', type: 'photo' },
    { key: 'anh_sau', label: 'Ảnh sau thực hiện', type: 'photo' },
    { key: 'ho_so_nghiem_thu', label: 'Hồ sơ nghiệm thu', type: 'photo' },
    { key: 'ket_qua_sau_chinh_trang', label: 'Kết quả sau chỉnh trang', type: 'textarea' },
  ],
}

export const QD72_PHIEU: Record<string, Qd72Phieu> = {
  PHIEU_01, PHIEU_02, PHIEU_03, PHIEU_04, PHIEU_05, PHIEU_06,
}

// ─── WIZARD nhập liệu 8 bước (Mục 10) — chỉ dùng cho UBND xã/phường khảo sát ──
// Phiếu 05 (xác minh liên ngành) và phần thẩm định Phiếu 06 nằm ở luồng riêng sau khi gửi hồ sơ.
export type Qd72WizardStep = {
  buoc: number
  ten: string
  phieu?: string          // phiếu liên quan (nếu có)
  moTa: string
}

export const QD72_WIZARD: Qd72WizardStep[] = [
  { buoc: 1, ten: 'Thông tin chung', phieu: 'PHIEU_01', moTa: 'Mã hồ sơ, tên khu vực, xã/phường, đơn vị/người phụ trách, ngày & thành phần khảo sát.' },
  { buoc: 2, ten: 'Ranh giới khu vực', phieu: 'PHIEU_01', moTa: 'Vẽ ranh giới Polygon trên bản đồ + căn cứ xác định là khu vực đô thị (không mặc định toàn xã).' },
  { buoc: 3, ten: 'Giao thông', phieu: 'PHIEU_02', moTa: 'Nhập từng đoạn đường (LineString), rộng/cao thông thủy, độ dốc, điểm tránh/quay xe, bãi đỗ, vật cản.' },
  { buoc: 4, ten: 'Dây, cáp, điện chiếu sáng & vật cản trên cao', phieu: 'PHIEU_03', moTa: 'Nhập từng đoạn dây/cáp/cột/điểm giao cắt, chiều cao điểm thấp nhất, chủ sở hữu, phương án xử lý.' },
  { buoc: 5, ten: 'Nguồn nước', phieu: 'PHIEU_04', moTa: 'Nhập nguồn nước/trụ nước, lưu lượng/áp lực (xã khai — chờ đơn vị cấp nước xác minh), bến/hố thu nước.' },
  { buoc: 6, ten: 'Ảnh và minh chứng', moTa: 'Chụp ảnh từ điện thoại (tự gắn GPS), tải video/hồ sơ; nén ảnh phù hợp; không tải ảnh lớn khi mở bản đồ.' },
  { buoc: 7, ten: 'Đề xuất giải pháp (sơ bộ)', moTa: 'Xã ĐỀ XUẤT sơ bộ theo từng đối tượng (đề xuất chỉnh trang ở Phiếu 02, phương án dây/cáp ở Phiếu 03, đề xuất sửa chữa ở Phiếu 04). KẾ HOẠCH chính thức (Phiếu 06 → qd72_renovation_plans) do Sở Xây dựng lập/tổng hợp SAU xác minh liên ngành.' },
  { buoc: 8, ten: 'Kiểm tra và gửi hồ sơ', moTa: 'Xem trước hồ sơ, cảnh báo trường thiếu & đánh giá sơ bộ, gửi (DRAFT → SUBMITTED). Tự động lưu nháp mọi bước.' },
]

export function getPhieu(ma: string): Qd72Phieu | null {
  return QD72_PHIEU[ma] ?? null
}
