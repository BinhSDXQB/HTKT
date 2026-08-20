// Registry 20 LỚP BẢN ĐỒ GIS phân hệ QĐ 72 (Mục 4.1). Bản đồ MapLibre tiêu thụ config này.
// Geometry lưu GeoJSON (EPSG:4326) trong cột jsonb của bảng nguồn (038) + tam_lat/tam_lng.
// Ngưỡng cảnh báo (4,5m / 400m / 150m) KHÔNG hard-code — tham chiếu mã tiêu chí trong
// qd72_technical_rules (canhBaoRule / banKinhRule / khoangCachRule) và nạp lúc chạy.

export type Qd72LayerGeom = 'Point' | 'LineString' | 'Polygon' | 'Mixed'
export type Qd72LayerNhom = 'RANH_GIOI' | 'GIAO_THONG' | 'DUONG_DAY' | 'NGUON_NUOC' | 'CHINH_TRANG'

export type Qd72Layer = {
  key: string
  ten: string
  nhom: Qd72LayerNhom
  geometry: Qd72LayerGeom
  bang: string                 // bảng nguồn (038); 'derived' = suy từ điều kiện trên bảng khác
  filter?: string              // mô tả điều kiện lọc (để backend dựng WHERE)
  mau: string                  // màu mặc định (hex)
  cluster?: boolean            // gom cụm khi nhiều điểm
  canhBaoRule?: string         // mã tiêu chí → tô CẢNH BÁO khi vi phạm sơ bộ
  banKinhRule?: string         // mã tiêu chí bán kính phục vụ (vẽ vùng đệm)
  khoangCachRule?: string      // mã tiêu chí khoảng cách (cảnh báo khi vượt)
  mauTheoChuSoHuu?: boolean    // tô màu theo chủ sở hữu (dây/cáp)
  moTa?: string
}

export const QD72_GIS_LAYERS: Qd72Layer[] = [
  // 1
  { key: 'ranh_gioi_do_thi', ten: 'Ranh giới khu vực đô thị', nhom: 'RANH_GIOI', geometry: 'Polygon',
    bang: 'qd72_urban_areas', mau: '#6366f1', moTa: 'Ranh giới xác định theo căn cứ (không mặc định toàn xã).' },
  // 2
  { key: 'tuyen_duong_cc', ten: 'Tuyến đường phục vụ xe chữa cháy', nhom: 'GIAO_THONG', geometry: 'LineString',
    bang: 'qd72_road_segments', mau: '#10b981', canhBaoRule: 'ROAD_MIN_WIDTH',
    moTa: 'Tô cảnh báo đoạn rộng thông thủy < 3,5 m.' },
  // 3
  { key: 'diem_tranh_quay_xe', ten: 'Điểm tránh / quay xe / đường cụt', nhom: 'GIAO_THONG', geometry: 'Mixed',
    bang: 'qd72_passing_bays', filter: 'passing_bays + road_segments.la_duong_cut', mau: '#22c55e',
    khoangCachRule: 'PASSINGBAY_MAX_SPACING', moTa: 'Cảnh báo điểm tránh cách nhau > 100 m.' },
  // 4
  { key: 'bai_do_xe_cc', ten: 'Bãi đỗ xe chữa cháy', nhom: 'GIAO_THONG', geometry: 'Polygon',
    bang: 'qd72_fire_parking_areas', mau: '#84cc16' },
  // 5
  { key: 'vat_can', ten: 'Vật cản (cố định / di động)', nhom: 'GIAO_THONG', geometry: 'Mixed',
    bang: 'qd72_road_obstacles', mau: '#f97316', cluster: true },
  // 6
  { key: 'day_dien', ten: 'Đường dây điện (trung/hạ thế, sau công tơ)', nhom: 'DUONG_DAY', geometry: 'LineString',
    bang: 'qd72_overhead_utility_lines', filter: "loai_doi_tuong IN ('Đường dây điện trung thế','Đường dây điện hạ thế','Dây điện sau công tơ')",
    mau: '#ef4444', canhBaoRule: 'CLEARANCE_MIN_HEIGHT', mauTheoChuSoHuu: true },
  // 7
  { key: 'cap_vien_thong', ten: 'Cáp viễn thông / internet / truyền hình', nhom: 'DUONG_DAY', geometry: 'LineString',
    bang: 'qd72_overhead_utility_lines', filter: "loai_doi_tuong IN ('Cáp viễn thông','Cáp internet','Cáp truyền hình','Cáp thông tin khác')",
    mau: '#3b82f6', canhBaoRule: 'CLEARANCE_MIN_HEIGHT', mauTheoChuSoHuu: true },
  // 8
  { key: 'day_chieu_sang', ten: 'Dây & thiết bị chiếu sáng công cộng', nhom: 'DUONG_DAY', geometry: 'Mixed',
    bang: 'qd72_overhead_utility_lines', filter: "loai_doi_tuong IN ('Dây điện chiếu sáng','Cần đèn / đèn trang trí') + qd72_public_lighting_assets",
    mau: '#eab308', canhBaoRule: 'CLEARANCE_MIN_HEIGHT' },
  // 9
  { key: 'cot', ten: 'Cột (điện / viễn thông / dùng chung / chiếu sáng)', nhom: 'DUONG_DAY', geometry: 'Point',
    bang: 'qd72_utility_poles', mau: '#78716c', cluster: true, mauTheoChuSoHuu: true },
  // 10
  { key: 'diem_giao_cat', ten: 'Điểm giao cắt dây/cáp qua đường', nhom: 'DUONG_DAY', geometry: 'Point',
    bang: 'qd72_utility_crossings', mau: '#a855f7', cluster: true, canhBaoRule: 'CLEARANCE_MIN_HEIGHT' },
  // 11
  { key: 'diem_thong_thuy_thap', ten: 'Điểm chiều cao thông thủy dưới yêu cầu', nhom: 'DUONG_DAY', geometry: 'Point',
    bang: 'derived', filter: 'road_segments/lines/crossings có chiều cao < ngưỡng CLEARANCE_MIN_HEIGHT', mau: '#dc2626',
    canhBaoRule: 'CLEARANCE_MIN_HEIGHT', moTa: 'Lớp CẢNH BÁO điểm dưới 4,5 m (sơ bộ).' },
  // 12
  { key: 'day_vong_khong_ro_chu', ten: 'Dây/cáp chùng võng / bó rối / không rõ chủ sở hữu', nhom: 'DUONG_DAY', geometry: 'Mixed',
    bang: 'qd72_overhead_utility_lines', filter: "trang_thai_chu_so_huu='CHUA_XAC_DINH' OR do_vong_quan_sat IS NOT NULL", mau: '#be123c' },
  // 13
  { key: 'ha_tang_dung_chung', ten: 'Cống cáp / hào / tuy nen kỹ thuật hiện có', nhom: 'DUONG_DAY', geometry: 'Mixed',
    bang: 'qd72_shared_technical_infrastructure', mau: '#0ea5e9' },
  // 14
  { key: 'tuyen_ha_ngam', ten: 'Tuyến dự kiến hạ ngầm', nhom: 'DUONG_DAY', geometry: 'LineString',
    bang: 'qd72_undergrounding_proposals', filter: "cac_phuong_an chứa phương án hạ ngầm (13) hoặc xây cống/hào (12)", mau: '#7c3aed' },
  // 15
  { key: 'tru_nuoc_cc', ten: 'Trụ nước chữa cháy', nhom: 'NGUON_NUOC', geometry: 'Point',
    bang: 'qd72_fire_hydrants', mau: '#0891b2', cluster: true, khoangCachRule: 'HYDRANT_MAX_SPACING',
    moTa: 'Cảnh báo khoảng cách giữa các trụ > 150 m.' },
  // 16
  { key: 'nguon_nuoc', ten: 'Bể / hồ / ao / sông / kênh & nguồn nước khác', nhom: 'NGUON_NUOC', geometry: 'Mixed',
    bang: 'qd72_water_sources', filter: "loai_nguon <> 'Trụ nước'", mau: '#2563eb', banKinhRule: 'WATER_SERVICE_RADIUS',
    moTa: 'Vẽ vùng phục vụ bán kính 400 m.' },
  // 17
  { key: 'ben_ho_thu_nuoc', ten: 'Bến lấy nước / hố thu nước', nhom: 'NGUON_NUOC', geometry: 'Mixed',
    bang: 'qd72_water_intake_points', mau: '#0369a1' },
  // 18
  { key: 'ct_can_tiep_can_cc', ten: 'Công trình cần tiếp cận chữa cháy', nhom: 'GIAO_THONG', geometry: 'Mixed',
    bang: 'derived', filter: 'urban_areas.so_ct_tu_3_tang / cơ sở nguy hiểm cháy nổ (chi_tiet)', mau: '#f43f5e',
    moTa: 'Lớp tùy chọn — công trình 3 tầng trở lên / cơ sở nguy hiểm cháy nổ.' },
  // 19
  { key: 'de_xuat_chinh_trang', ten: 'Vị trí đề xuất chỉnh trang', nhom: 'CHINH_TRANG', geometry: 'Mixed',
    bang: 'qd72_renovation_plans', filter: "trang_thai chưa hoàn thành", mau: '#f59e0b' },
  // 20
  { key: 'da_chinh_trang', ten: 'Vị trí đã hoàn thành chỉnh trang', nhom: 'CHINH_TRANG', geometry: 'Mixed',
    bang: 'qd72_renovation_plans', filter: "trang_thai = hoàn thành", mau: '#16a34a' },
]

// Bảng màu tô theo CHỦ SỞ HỮU (dây/cáp/cột) — gán ổn định theo owner_id ở tầng render.
export const QD72_MAU_CHU_SO_HUU = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#f97316', '#14b8a6', '#ec4899']

// Chức năng bản đồ (Mục 4.2) — cờ để UI bật/tắt.
export const QD72_MAP_FEATURES = {
  veSuaTheoQuyen: true,        // vẽ/sửa đối tượng theo phân quyền
  gpsDienThoai: true,          // lấy toạ độ GPS từ điện thoại
  doDacDaiDienTich: true,      // đo dài/diện tích/khoảng cách
  mauTheoLoaiVaChuSoHuu: true, // màu theo loại + chủ sở hữu
  hienDuoi45m: true,           // hiển thị điểm thông thủy < ngưỡng (lớp 11)
  vungAnhHuongVatCanTrenCao: true,
  anhKhiBamDoiTuong: true,     // hiện ảnh hiện trường khi bấm đối tượng
  vungPhucVu400m: true,        // vùng phục vụ nguồn nước (banKinhRule)
  canhBaoTruVuot150m: true,    // cảnh báo khoảng cách trụ (khoangCachRule)
  loc: ['xa_phuong', 'loai_cong_trinh', 'chu_so_huu', 'trang_thai', 'muc_uu_tien'],
  nhap: ['GeoJSON', 'KML', 'CSV toạ độ'],
  xuat: ['GeoJSON', 'Excel', 'Bản đồ báo cáo'],
  clusteringLopNhieuDiem: true,
  khongTaiAnhLonKhiMoBanDo: true,
}

export function getLayer(key: string): Qd72Layer | null {
  return QD72_GIS_LAYERS.find((l) => l.key === key) ?? null
}
