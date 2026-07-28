// Định nghĩa techSpecs chi tiết cho từng loại tài sản
// Dùng cho: form nhập liệu, Excel template, hiển thị chi tiết, GIS popup

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean'

export type SpecField = {
  key: string
  label: string
  unit?: string
  type: FieldType
  options?: { value: string; label: string }[]
  required?: boolean
  description?: string
}

export type AssetTypeSpec = {
  code: string           // Khớp với AssetType.code trong DB
  geometryType: 'POINT' | 'LINE' | 'POLYGON'
  fields: SpecField[]
  excelHeaders: string[] // Tên cột trong file Excel mẫu (theo thứ tự)
}

// ─── CÂY XANH ────────────────────────────────────────────────────────────────

const CAY_XANH_FIELDS: SpecField[] = [
  { key: 'species', label: 'Chủng loại / Tên cây', type: 'text', required: true, description: 'Tên phổ thông + tên khoa học' },
  { key: 'scientific_name', label: 'Tên khoa học', type: 'text' },
  { key: 'tree_zone', label: 'Vị trí trồng', type: 'select', options: [
    { value: 'DUONG_PHO', label: 'Đường phố / Vỉa hè' },
    { value: 'CONG_VIEN', label: 'Công viên' },
    { value: 'QUANG_TRUONG', label: 'Quảng trường' },
    { value: 'DAI_PHAN_CACH', label: 'Dải phân cách' },
    { value: 'KHAC', label: 'Khác' },
  ]},
  { key: 'height_m', label: 'Chiều cao (m)', type: 'number', unit: 'm' },
  { key: 'circumference_cm', label: 'Chu vi thân (cm)', type: 'number', unit: 'cm', description: 'Đo ở độ cao 1.3m' },
  { key: 'canopy_diameter_m', label: 'Đường kính tán (m)', type: 'number', unit: 'm' },
  { key: 'age_years', label: 'Tuổi cây ước tính (năm)', type: 'number', unit: 'năm' },
  { key: 'health_status', label: 'Tình trạng sức khoẻ', type: 'select', options: [
    { value: 'KHOE_MANH', label: 'Khoẻ mạnh' },
    { value: 'BINH_THUONG', label: 'Bình thường' },
    { value: 'YEU', label: 'Yếu / Cần chăm sóc' },
    { value: 'SAU_BENH', label: 'Sâu bệnh' },
    { value: 'NGUY_HIEM', label: 'Nguy hiểm / Cần đốn hạ' },
  ]},
  { key: 'last_pruning', label: 'Ngày cắt tỉa cuối', type: 'date' },
  { key: 'last_fertilizing', label: 'Ngày bón phân cuối', type: 'date' },
  { key: 'last_pesticide', label: 'Ngày phun thuốc cuối', type: 'date' },
  { key: 'planting_year', label: 'Năm trồng', type: 'number' },
  { key: 'has_protection_cage', label: 'Có khung bảo vệ', type: 'boolean' },
]

// ─── CỐNG THOÁT NƯỚC ─────────────────────────────────────────────────────────

const CONG_THOAT_NUOC_FIELDS: SpecField[] = [
  { key: 'pipe_shape', label: 'Hình dạng cống', type: 'select', required: true, options: [
    { value: 'TRON', label: 'Tròn' },
    { value: 'VUONG', label: 'Vuông / Hộp' },
    { value: 'CHU_NHAT', label: 'Chữ nhật' },
    { value: 'BAN_NGUYET', label: 'Bán nguyệt' },
  ]},
  { key: 'diameter_mm', label: 'Đường kính (mm) — nếu tròn', type: 'number', unit: 'mm' },
  { key: 'width_mm', label: 'Chiều rộng (mm) — nếu hộp/chữ nhật', type: 'number', unit: 'mm' },
  { key: 'height_mm', label: 'Chiều cao (mm) — nếu hộp/chữ nhật', type: 'number', unit: 'mm' },
  { key: 'length_m', label: 'Chiều dài đoạn cống (m)', type: 'number', unit: 'm' },
  { key: 'material', label: 'Vật liệu', type: 'select', options: [
    { value: 'BE_TONG', label: 'Bê tông' },
    { value: 'HDPE', label: 'HDPE' },
    { value: 'PVC', label: 'PVC' },
    { value: 'GANG', label: 'Gang' },
    { value: 'GACH', label: 'Gạch xây' },
    { value: 'UONG_THEP', label: 'Thép' },
  ]},
  { key: 'depth_cover_m', label: 'Độ sâu đến đỉnh cống (m)', type: 'number', unit: 'm' },
  { key: 'invert_elevation_m', label: 'Cao độ đáy cống (m)', type: 'number', unit: 'm', description: 'Cao độ VN-2000 hoặc so với mặt đất' },
  { key: 'gradient_pct', label: 'Độ dốc (%)', type: 'number', unit: '%' },
  { key: 'flow_direction', label: 'Hướng thoát nước', type: 'text', description: 'VD: Bắc → Nam' },
  { key: 'capacity_m3h', label: 'Lưu lượng thiết kế (m³/h)', type: 'number', unit: 'm³/h' },
  { key: 'is_combined', label: 'Cống chung (nước mưa + nước thải)', type: 'boolean' },
  { key: 'start_point', label: 'Điểm đầu (hố ga)', type: 'text' },
  { key: 'end_point', label: 'Điểm cuối (hố ga)', type: 'text' },
]

// ─── HỐ GA ────────────────────────────────────────────────────────────────────

const HO_GA_FIELDS: SpecField[] = [
  { key: 'hoga_type', label: 'Loại hố ga', type: 'select', required: true, options: [
    { value: 'THU_NUOC', label: 'Thu nước mặt đường' },
    { value: 'KIEM_TRA', label: 'Kiểm tra / Thông cống' },
    { value: 'THOAT_KHI', label: 'Thoát khí' },
    { value: 'CHIA_NUOC', label: 'Phân chia dòng chảy' },
  ]},
  { key: 'cover_shape', label: 'Hình dạng nắp', type: 'select', options: [
    { value: 'TRON', label: 'Tròn' },
    { value: 'VUONG', label: 'Vuông' },
    { value: 'CHU_NHAT', label: 'Chữ nhật' },
  ]},
  { key: 'cover_diameter_mm', label: 'Đường kính/cạnh nắp (mm)', type: 'number', unit: 'mm', required: true },
  { key: 'depth_m', label: 'Chiều sâu hố ga (m)', type: 'number', unit: 'm', required: true },
  { key: 'cover_material', label: 'Vật liệu nắp', type: 'select', options: [
    { value: 'GANG', label: 'Gang' },
    { value: 'COMPOSITE', label: 'Composite' },
    { value: 'BE_TONG', label: 'Bê tông' },
    { value: 'THEP', label: 'Thép' },
  ]},
  { key: 'wall_material', label: 'Vật liệu thành hố', type: 'select', options: [
    { value: 'GACH', label: 'Gạch xây' },
    { value: 'BE_TONG', label: 'Bê tông' },
    { value: 'HDPE', label: 'HDPE đúc sẵn' },
  ]},
  { key: 'connected_pipes', label: 'Số ống/cống kết nối', type: 'number' },
  { key: 'top_elevation_m', label: 'Cao độ đỉnh nắp (m)', type: 'number', unit: 'm' },
  { key: 'load_class', label: 'Tải trọng (EN124)', type: 'select', options: [
    { value: 'A15', label: 'A15 — vỉa hè, đi bộ' },
    { value: 'B125', label: 'B125 — đường xe ô tô nhẹ' },
    { value: 'C250', label: 'C250 — bãi xe, xe tải nhẹ' },
    { value: 'D400', label: 'D400 — đường xe tải nặng' },
    { value: 'E600', label: 'E600 — cảng, sân bay' },
  ]},
  { key: 'has_screen', label: 'Có lưới chắn rác', type: 'boolean' },
]

// ─── ĐÈN CHIẾU SÁNG ──────────────────────────────────────────────────────────

const DEN_DUONG_FIELDS: SpecField[] = [
  { key: 'pole_height_m', label: 'Chiều cao cột (m)', type: 'number', unit: 'm', required: true },
  { key: 'pole_material', label: 'Vật liệu cột', type: 'select', options: [
    { value: 'THEP', label: 'Thép (ống thép mạ kẽm)' },
    { value: 'BE_TONG', label: 'Bê tông ly tâm' },
    { value: 'COMPOSITE', label: 'Composite' },
    { value: 'NHOM', label: 'Nhôm đúc' },
  ]},
  { key: 'bulb_type', label: 'Loại bóng đèn', type: 'select', required: true, options: [
    { value: 'LED', label: 'LED' },
    { value: 'HPS', label: 'Sodium cao áp (HPS)' },
    { value: 'MH', label: 'Metal Halide' },
    { value: 'CFL', label: 'Compact Fluorescent' },
  ]},
  { key: 'power_watt', label: 'Công suất bóng (W)', type: 'number', unit: 'W', required: true },
  { key: 'luminous_flux_lm', label: 'Quang thông (lm)', type: 'number', unit: 'lm' },
  { key: 'arm_length_m', label: 'Chiều dài cần đèn (m)', type: 'number', unit: 'm' },
  { key: 'span_m', label: 'Khoảng cách giữa 2 trụ (m)', type: 'number', unit: 'm' },
  { key: 'cable_installation', label: 'Lắp đặt cáp điện', type: 'select', required: true, options: [
    { value: 'NGAM', label: 'Ngầm (cáp ngầm)' },
    { value: 'NOI', label: 'Nổi (treo trên cột)' },
  ]},
  { key: 'cable_section_mm2', label: 'Tiết diện cáp (mm²)', type: 'number', unit: 'mm²' },
  { key: 'voltage_v', label: 'Điện áp (V)', type: 'number', unit: 'V' },
  { key: 'control_type', label: 'Điều khiển', type: 'select', options: [
    { value: 'TU_DONG', label: 'Tự động (hẹn giờ)' },
    { value: 'SENSOR', label: 'Cảm biến ánh sáng' },
    { value: 'THU_CONG', label: 'Thủ công' },
    { value: 'SCADA', label: 'Điều khiển từ xa (SCADA)' },
  ]},
  { key: 'control_cabinet_id', label: 'Tủ điện điều khiển', type: 'text', description: 'Mã tủ điện quản lý đèn này' },
  { key: 'has_solar', label: 'Có pin năng lượng mặt trời', type: 'boolean' },
  { key: 'ip_rating', label: 'Cấp bảo vệ IP', type: 'text', description: 'VD: IP65, IP67' },
]

// ─── TRỤ ĐIỆN / TỦ ĐIỆN CHIẾU SÁNG ──────────────────────────────────────────

const TU_DIEN_CS_FIELDS: SpecField[] = [
  { key: 'cabinet_type', label: 'Loại tủ', type: 'select', options: [
    { value: 'TU_DIEU_KHIEN', label: 'Tủ điều khiển chiếu sáng' },
    { value: 'TU_PHAN_PHOI', label: 'Tủ phân phối điện' },
  ]},
  { key: 'managed_poles', label: 'Số trụ đèn quản lý', type: 'number' },
  { key: 'power_source', label: 'Nguồn điện cấp', type: 'text' },
  { key: 'total_power_kw', label: 'Tổng công suất (kW)', type: 'number', unit: 'kW' },
  { key: 'has_remote', label: 'Có điều khiển từ xa', type: 'boolean' },
  { key: 'protection_level', label: 'Cấp bảo vệ (IP)', type: 'text' },
]

// ─── CÁP VIỄN THÔNG ──────────────────────────────────────────────────────────

const CAP_VIEN_THONG_FIELDS: SpecField[] = [
  { key: 'operator', label: 'Đơn vị/Nhà mạng', type: 'select', required: true, options: [
    { value: 'VIETTEL', label: 'Viettel' },
    { value: 'VNPT', label: 'VNPT / VinaPhone' },
    { value: 'MOBIFONE', label: 'MobiFone' },
    { value: 'FPT', label: 'FPT Telecom' },
    { value: 'SCTV', label: 'SCTV (truyền hình cáp)' },
    { value: 'VTVHUE', label: 'VTV Huế / Đài địa phương' },
    { value: 'TRUNG_TAM_KTTT', label: 'Trung tâm KTTT đô thị' },
    { value: 'KHAC', label: 'Khác' },
  ]},
  { key: 'cable_type', label: 'Loại cáp', type: 'select', required: true, options: [
    { value: 'QUANG', label: 'Cáp quang (Fiber Optic)' },
    { value: 'DONG', label: 'Cáp đồng (Copper)' },
    { value: 'DONG_TRUC', label: 'Cáp đồng trục (Coaxial)' },
    { value: 'CAT6', label: 'Cáp mạng (CAT6/UTP)' },
  ]},
  { key: 'installation_type', label: 'Hình thức lắp đặt', type: 'select', required: true, options: [
    { value: 'NGAM', label: 'Ngầm (chôn ngầm)' },
    { value: 'NOI', label: 'Nổi (treo trên cột)' },
    { value: 'NGAM_ong', label: 'Ngầm trong ống bảo vệ' },
  ]},
  { key: 'core_count', label: 'Số lõi/sợi', type: 'number', description: 'VD: 12, 24, 48, 96 lõi quang' },
  { key: 'duct_diameter_mm', label: 'Đường kính ống bảo vệ (mm)', type: 'number', unit: 'mm', description: 'Nếu đi ngầm' },
  { key: 'duct_material', label: 'Vật liệu ống', type: 'select', options: [
    { value: 'HDPE', label: 'HDPE' },
    { value: 'PVC', label: 'PVC' },
    { value: 'THEP', label: 'Thép' },
  ]},
  { key: 'depth_m', label: 'Độ sâu chôn (m)', type: 'number', unit: 'm', description: 'Nếu đi ngầm' },
  { key: 'length_m', label: 'Chiều dài tuyến (m)', type: 'number', unit: 'm' },
  { key: 'bandwidth_gbps', label: 'Băng thông (Gbps)', type: 'number', unit: 'Gbps', description: 'Cáp quang' },
  { key: 'year_installed', label: 'Năm lắp đặt', type: 'number' },
  { key: 'joint_boxes', label: 'Số hộp măng sông/kết nối', type: 'number' },
]

// ─── ĐƯỜNG GIAO THÔNG ─────────────────────────────────────────────────────────

const DUONG_GT_FIELDS: SpecField[] = [
  { key: 'road_class', label: 'Cấp đường', type: 'select', required: true, options: [
    { value: 'QUOC_LO', label: 'Quốc lộ' },
    { value: 'TINH_LO', label: 'Tỉnh lộ' },
    { value: 'DUONG_HUYEN', label: 'Đường huyện' },
    { value: 'DUONG_XA', label: 'Đường xã' },
    { value: 'DUONG_DO_THI', label: 'Đường đô thị' },
    { value: 'DUONG_NOI_BO', label: 'Đường nội bộ/khu dân cư' },
  ]},
  { key: 'total_length_m', label: 'Tổng chiều dài (m)', type: 'number', unit: 'm', required: true },
  { key: 'road_width_m', label: 'Chiều rộng mặt đường (m)', type: 'number', unit: 'm' },
  { key: 'total_width_m', label: 'Chiều rộng toàn lộ giới (m)', type: 'number', unit: 'm' },
  { key: 'sidewalk_width_m', label: 'Chiều rộng vỉa hè (m)', type: 'number', unit: 'm' },
  { key: 'median_width_m', label: 'Chiều rộng dải phân cách (m)', type: 'number', unit: 'm' },
  { key: 'lanes', label: 'Số làn xe', type: 'number' },
  { key: 'surface_type', label: 'Loại mặt đường', type: 'select', options: [
    { value: 'NHUA', label: 'Bê tông nhựa (Asphalt)' },
    { value: 'BT', label: 'Bê tông xi măng' },
    { value: 'GAY_LONG', label: 'Gạch lát' },
    { value: 'DAT_DA', label: 'Đất đá' },
  ]},
  { key: 'surface_year', label: 'Năm trải nhựa/đổ bê tông gần nhất', type: 'number' },
  { key: 'lighting', label: 'Có chiếu sáng', type: 'boolean' },
  { key: 'trees_count', label: 'Số cây xanh hai bên', type: 'number' },
  { key: 'drainage_type', label: 'Hệ thống thoát nước', type: 'select', options: [
    { value: 'CONG_HOI', label: 'Cống hở (mương)' },
    { value: 'CONG_KIN', label: 'Cống kín (đậy nắp)' },
    { value: 'CONG_NGAM', label: 'Cống ngầm' },
    { value: 'KHONG', label: 'Không có hệ thống' },
  ]},
]

// ─── ỐNG CẤP NƯỚC ────────────────────────────────────────────────────────────

const ONG_CAP_NUOC_FIELDS: SpecField[] = [
  { key: 'pipe_material', label: 'Vật liệu ống', type: 'select', required: true, options: [
    { value: 'GANG_DEO', label: 'Gang dẻo (DI)' },
    { value: 'HDPE', label: 'HDPE (polyethylene)' },
    { value: 'UPVC', label: 'uPVC (nhựa cứng)' },
    { value: 'THEP', label: 'Thép (có bọc)' },
    { value: 'ABS', label: 'ABS' },
    { value: 'GANG_XAM', label: 'Gang xám (cũ)' },
  ]},
  { key: 'diameter_mm', label: 'Đường kính trong (mm)', type: 'number', unit: 'mm', required: true },
  { key: 'outer_diameter_mm', label: 'Đường kính ngoài (mm)', type: 'number', unit: 'mm' },
  { key: 'length_m', label: 'Chiều dài đoạn ống (m)', type: 'number', unit: 'm' },
  { key: 'design_pressure_bar', label: 'Áp suất thiết kế (bar)', type: 'number', unit: 'bar' },
  { key: 'working_pressure_bar', label: 'Áp suất vận hành (bar)', type: 'number', unit: 'bar' },
  { key: 'depth_m', label: 'Độ sâu chôn (m)', type: 'number', unit: 'm' },
  { key: 'pipe_zone', label: 'Cấp mạng đường ống', type: 'select', options: [
    { value: 'TRUYEN_DAN', label: 'Truyền dẫn (chính)' },
    { value: 'PHAN_PHOI', label: 'Phân phối' },
    { value: 'DICH_VU', label: 'Dịch vụ (nhánh)' },
  ]},
  { key: 'joint_type', label: 'Kiểu nối ống', type: 'select', options: [
    { value: 'BICH', label: 'Mặt bích' },
    { value: 'MIENG_BICH', label: 'Miệng bích (Socket)' },
    { value: 'HAN', label: 'Hàn điện' },
    { value: 'VONG_CAO_SU', label: 'Vòng cao su (push-fit)' },
  ]},
  { key: 'has_cathodic_protection', label: 'Có bảo vệ cathodic', type: 'boolean' },
]

// ─── VAN KHOÁ CẤP NƯỚC ───────────────────────────────────────────────────────

const VAN_CAP_NUOC_FIELDS: SpecField[] = [
  { key: 'valve_type', label: 'Loại van', type: 'select', required: true, options: [
    { value: 'VAN_KHUA', label: 'Van khoá (Gate valve)' },
    { value: 'VAN_BUOM', label: 'Van bướm (Butterfly)' },
    { value: 'VAN_CAU', label: 'Van cầu (Globe)' },
    { value: 'VAN_KIEM_TRA', label: 'Van một chiều (Check)' },
    { value: 'VAN_XA_KHI', label: 'Van xả khí' },
    { value: 'VAN_BEP', label: 'Van béo / Tháo cặn' },
  ]},
  { key: 'diameter_mm', label: 'Đường kính (mm)', type: 'number', unit: 'mm', required: true },
  { key: 'material', label: 'Vật liệu thân van', type: 'select', options: [
    { value: 'GANG', label: 'Gang' },
    { value: 'DONG', label: 'Đồng' },
    { value: 'THEP', label: 'Thép không gỉ' },
  ]},
  { key: 'pressure_rating_bar', label: 'Áp suất định mức (bar)', type: 'number', unit: 'bar' },
  { key: 'depth_m', label: 'Độ sâu lắp đặt (m)', type: 'number', unit: 'm' },
  { key: 'has_valve_box', label: 'Có hộp bảo vệ (valve box)', type: 'boolean' },
  { key: 'operation_type', label: 'Vận hành', type: 'select', options: [
    { value: 'TAY', label: 'Bằng tay' },
    { value: 'DIEN', label: 'Điện (motor)' },
    { value: 'KHI_NEN', label: 'Khí nén (pneumatic)' },
  ]},
]

// ─── VỈA HÈ / LỀ ĐƯỜNG ───────────────────────────────────────────────────────

const VIA_HE_FIELDS: SpecField[] = [
  { key: 'length_m', label: 'Chiều dài đoạn (m)', type: 'number', unit: 'm', required: true },
  { key: 'width_m', label: 'Chiều rộng vỉa hè (m)', type: 'number', unit: 'm', required: true },
  { key: 'surface_material', label: 'Vật liệu lát', type: 'select', required: true, options: [
    { value: 'GACH_TU_NHIEN', label: 'Gạch tự nhiên (đá granite, đá xanh)' },
    { value: 'GACH_BE_TONG', label: 'Gạch bê tông' },
    { value: 'GAY_CERAMIC', label: 'Gạch ceramic / terazzo' },
    { value: 'BT_NHUA', label: 'Bê tông nhựa' },
    { value: 'BT_XM', label: 'Bê tông xi măng' },
    { value: 'DAT_DA', label: 'Đất / Đá dăm' },
  ]},
  { key: 'has_curb', label: 'Có đá lề đường (curb)', type: 'boolean' },
  { key: 'curb_material', label: 'Vật liệu đá lề', type: 'select', options: [
    { value: 'DA_GRANIT', label: 'Đá granite' },
    { value: 'BE_TONG', label: 'Bê tông' },
    { value: 'KHAC', label: 'Khác' },
  ]},
  { key: 'has_trees', label: 'Có cây xanh trên vỉa hè', type: 'boolean' },
  { key: 'trees_count', label: 'Số cây xanh', type: 'number' },
  { key: 'has_drainage', label: 'Có hệ thống thoát nước', type: 'boolean' },
  { key: 'area_m2', label: 'Diện tích (m²)', type: 'number', unit: 'm²' },
]

// ─── CẦU ĐƯỜNG BỘ ────────────────────────────────────────────────────────────

const CAU_FIELDS: SpecField[] = [
  { key: 'bridge_type', label: 'Loại kết cấu cầu', type: 'select', required: true, options: [
    { value: 'DAM_GIAN_DON', label: 'Dầm giản đơn' },
    { value: 'DAM_LIEN_TUC', label: 'Dầm liên tục' },
    { value: 'KHUNG', label: 'Khung cứng' },
    { value: 'TREO', label: 'Cầu treo / Dây văng' },
    { value: 'CONG_VONG', label: 'Vòm / Cổng' },
    { value: 'NGAM', label: 'Cầu hầm (ngầm)' },
    { value: 'TAM', label: 'Cầu tấm (cầu tạm)' },
  ]},
  { key: 'total_length_m', label: 'Chiều dài toàn cầu (m)', type: 'number', unit: 'm', required: true },
  { key: 'span_m', label: 'Khẩu độ nhịp chính (m)', type: 'number', unit: 'm' },
  { key: 'width_m', label: 'Chiều rộng cầu (m)', type: 'number', unit: 'm', required: true },
  { key: 'road_width_m', label: 'Chiều rộng phần xe chạy (m)', type: 'number', unit: 'm' },
  { key: 'span_count', label: 'Số nhịp', type: 'number' },
  { key: 'main_material', label: 'Vật liệu kết cấu chính', type: 'select', required: true, options: [
    { value: 'BTCT', label: 'Bê tông cốt thép (BTCT)' },
    { value: 'BTCT_DUL', label: 'BTCT dự ứng lực' },
    { value: 'THEP', label: 'Thép' },
    { value: 'THEP_BTCT', label: 'Liên hợp thép - BTCT' },
    { value: 'GO', label: 'Gỗ (cầu tạm)' },
  ]},
  { key: 'load_capacity_ton', label: 'Tải trọng cho phép (tấn)', type: 'number', unit: 'tấn', required: true },
  { key: 'clearance_m', label: 'Tĩnh không thuyền bè (m)', type: 'number', unit: 'm' },
  { key: 'foundation_type', label: 'Loại móng', type: 'select', options: [
    { value: 'COC', label: 'Cọc khoan nhồi' },
    { value: 'COC_DONG', label: 'Cọc đóng' },
    { value: 'BANG', label: 'Móng bằng' },
    { value: 'GIENG_CHIM', label: 'Giếng chìm' },
  ]},
  { key: 'construction_year', label: 'Năm xây dựng', type: 'number' },
  { key: 'design_standard', label: 'Tiêu chuẩn thiết kế', type: 'text', description: 'VD: 22TCN-272-01, AASHTO' },
  { key: 'has_lighting', label: 'Có chiếu sáng cầu', type: 'boolean' },
  { key: 'has_sidewalk', label: 'Có vỉa hè dành cho người đi bộ', type: 'boolean' },
  { key: 'last_inspection_date', label: 'Ngày kiểm tra gần nhất', type: 'date' },
]

// ─── ĐƯỜNG HỘP GIAO THÔNG (CỐNG HỘP ĐƯỜNG) ────────────────────────────────────

const CONG_HOP_FIELDS: SpecField[] = [
  { key: 'width_m', label: 'Chiều rộng hộp (m)', type: 'number', unit: 'm', required: true },
  { key: 'height_m', label: 'Chiều cao hộp (m)', type: 'number', unit: 'm', required: true },
  { key: 'length_m', label: 'Chiều dài (m)', type: 'number', unit: 'm', required: true },
  { key: 'material', label: 'Vật liệu', type: 'select', required: true, options: [
    { value: 'BTCT', label: 'Bê tông cốt thép' },
    { value: 'BTCT_DUL', label: 'BTCT dự ứng lực' },
    { value: 'THEP', label: 'Thép' },
  ]},
  { key: 'fill_height_m', label: 'Chiều cao đất đắp trên đỉnh (m)', type: 'number', unit: 'm' },
  { key: 'design_load', label: 'Tải trọng thiết kế', type: 'text', description: 'VD: HL-93, H30' },
  { key: 'function', label: 'Chức năng', type: 'select', options: [
    { value: 'THOAT_NUOC', label: 'Thoát nước' },
    { value: 'CHUI_QUA_DUONG', label: 'Đường chui qua đường' },
    { value: 'KENH_MUONG', label: 'Kênh mương' },
  ]},
]

// ─── ĐÈN TÍN HIỆU GIAO THÔNG ─────────────────────────────────────────────────

const DEN_TH_FIELDS: SpecField[] = [
  { key: 'signal_type', label: 'Loại đèn tín hiệu', type: 'select', required: true, options: [
    { value: 'NGAY_TU', label: 'Ngã tư (4 pha)' },
    { value: 'NGAY_BA', label: 'Ngã ba (3 pha)' },
    { value: 'NGUOI_DI_BO', label: 'Đèn người đi bộ' },
    { value: 'KIEM_SOAT_LANE', label: 'Kiểm soát làn xe' },
    { value: 'CANH_BAO', label: 'Cảnh báo / Nhấp nháy' },
  ]},
  { key: 'phase_count', label: 'Số pha (hướng điều khiển)', type: 'number', required: true },
  { key: 'cycle_time_s', label: 'Thời gian chu kỳ (giây)', type: 'number', unit: 's', required: true },
  { key: 'green_time_s', label: 'Thời gian xanh chính (giây)', type: 'number', unit: 's' },
  { key: 'control_mode', label: 'Chế độ điều khiển', type: 'select', required: true, options: [
    { value: 'CO_DINH', label: 'Cố định (timer)' },
    { value: 'THICH_UNG', label: 'Thích ứng (adaptive)' },
    { value: 'TT_DIEU_KHIEN', label: 'Trung tâm điều khiển' },
    { value: 'CAM_BIEN', label: 'Cảm biến xe' },
  ]},
  { key: 'has_countdown', label: 'Có đèn đếm ngược', type: 'boolean' },
  { key: 'has_pedestrian', label: 'Có đèn người đi bộ', type: 'boolean' },
  { key: 'has_camera', label: 'Có camera giám sát', type: 'boolean' },
  { key: 'has_sound', label: 'Có âm thanh cho người khiếm thị', type: 'boolean' },
  { key: 'pole_height_m', label: 'Chiều cao cột đèn (m)', type: 'number', unit: 'm' },
  { key: 'power_supply', label: 'Nguồn điện', type: 'select', options: [
    { value: 'LUOI_DIEN', label: 'Lưới điện' },
    { value: 'NANG_LUONG_MT', label: 'Năng lượng mặt trời' },
    { value: 'DU_PHONG', label: 'Pin dự phòng (UPS)' },
  ]},
  { key: 'installation_year', label: 'Năm lắp đặt', type: 'number' },
  { key: 'management_unit', label: 'Đơn vị quản lý vận hành', type: 'text' },
]

// ─── BIỂN BÁO GIAO THÔNG ─────────────────────────────────────────────────────

const BIEN_BAO_FIELDS: SpecField[] = [
  { key: 'sign_category', label: 'Nhóm biển báo', type: 'select', required: true, options: [
    { value: 'CAM', label: 'Biển báo cấm (P)' },
    { value: 'NGUY_HIEM', label: 'Biển báo nguy hiểm (W)' },
    { value: 'HIEU_LENH', label: 'Biển hiệu lệnh (R)' },
    { value: 'CHI_DAN', label: 'Biển chỉ dẫn (I)' },
    { value: 'PHU', label: 'Biển phụ' },
    { value: 'VACH_KE', label: 'Vạch kẻ đường' },
  ]},
  { key: 'sign_code', label: 'Số hiệu biển', type: 'text', required: true, description: 'VD: P.102, W.201, R.301' },
  { key: 'sign_content', label: 'Nội dung biển', type: 'text', required: true, description: 'Mô tả nội dung / ý nghĩa' },
  { key: 'size_mm', label: 'Kích thước biển (mm)', type: 'text', description: 'VD: 700x700, ∅600' },
  { key: 'material', label: 'Vật liệu mặt biển', type: 'select', options: [
    { value: 'NHOM_PHAN_QUANG', label: 'Nhôm phản quang' },
    { value: 'INOX', label: 'Inox' },
    { value: 'THEP_GAP', label: 'Thép gập' },
    { value: 'COMPOSITE', label: 'Composite' },
  ]},
  { key: 'reflective_class', label: 'Cấp phản quang', type: 'select', options: [
    { value: 'CAP_1', label: 'Cấp 1 (Engineering Grade)' },
    { value: 'CAP_2', label: 'Cấp 2 (High Intensity)' },
    { value: 'CAP_3', label: 'Cấp 3 (Diamond Grade)' },
  ]},
  { key: 'pole_type', label: 'Kiểu lắp đặt', type: 'select', options: [
    { value: 'COT_DON', label: 'Cột đơn' },
    { value: 'COT_DOI', label: 'Cột đôi' },
    { value: 'THANH_NGANG', label: 'Thanh ngang cổng' },
    { value: 'TUONG', label: 'Gắn tường / rào' },
    { value: 'XA_BANG', label: 'Xà bang trên cao' },
  ]},
  { key: 'pole_height_m', label: 'Chiều cao mặt biển (m)', type: 'number', unit: 'm' },
  { key: 'position', label: 'Vị trí đặt biển', type: 'select', options: [
    { value: 'PHAI', label: 'Bên phải chiều đi' },
    { value: 'TRAI', label: 'Bên trái chiều đi' },
    { value: 'GIUA_DUONG', label: 'Dải phân cách giữa đường' },
    { value: 'TREN_CAO', label: 'Biển trên cao / cổng' },
  ]},
]

// ─── TRẠM BƠM ────────────────────────────────────────────────────────────────

const TRAM_BOM_FIELDS: SpecField[] = [
  { key: 'pump_count', label: 'Số máy bơm', type: 'number', required: true },
  { key: 'flow_rate_m3h', label: 'Lưu lượng thiết kế (m³/h)', type: 'number', unit: 'm³/h', required: true },
  { key: 'head_m', label: 'Cột áp thiết kế (m)', type: 'number', unit: 'm' },
  { key: 'total_power_kw', label: 'Tổng công suất (kW)', type: 'number', unit: 'kW', required: true },
  { key: 'pump_type', label: 'Loại máy bơm', type: 'select', options: [
    { value: 'LY_TAM', label: 'Ly tâm' },
    { value: 'CHIM', label: 'Bơm chìm' },
    { value: 'TRUC', label: 'Trục đứng' },
    { value: 'PITTONG', label: 'Piston' },
  ]},
  { key: 'area_m2', label: 'Diện tích trạm (m²)', type: 'number', unit: 'm²' },
  { key: 'has_backup_power', label: 'Có máy phát dự phòng', type: 'boolean' },
  { key: 'has_scada', label: 'Có điều khiển SCADA/từ xa', type: 'boolean' },
  { key: 'automation_level', label: 'Mức độ tự động', type: 'select', options: [
    { value: 'TU_DONG_HOAN_TOAN', label: 'Tự động hoàn toàn' },
    { value: 'BAN_TU_DONG', label: 'Bán tự động' },
    { value: 'THU_CONG', label: 'Thủ công' },
  ]},
  { key: 'service_area', label: 'Khu vực phục vụ', type: 'text' },
  { key: 'construction_year', label: 'Năm xây dựng', type: 'number' },
]

// ─── CÁC LOẠI ĐƠN GIẢN ───────────────────────────────────────────────────────

const THUNG_RAC_FIELDS: SpecField[] = [
  { key: 'bin_type', label: 'Loại thùng rác', type: 'select', options: [
    { value: 'DON', label: 'Thùng đơn (1 ngăn)' },
    { value: 'DOI', label: 'Thùng đôi (2 ngăn phân loại)' },
    { value: 'BA_NGAN', label: 'Thùng 3 ngăn phân loại' },
  ]},
  { key: 'volume_l', label: 'Thể tích (lít)', type: 'number', unit: 'lít' },
  { key: 'material', label: 'Vật liệu', type: 'select', options: [
    { value: 'NHUA_HDPE', label: 'Nhựa HDPE' },
    { value: 'INOX', label: 'Inox' },
    { value: 'COMPOSITE', label: 'Composite' },
    { value: 'THEP_KHUNG', label: 'Thép khung hộp' },
  ]},
  { key: 'has_lid', label: 'Có nắp đậy', type: 'boolean' },
  { key: 'color', label: 'Màu sắc / Ký hiệu phân loại', type: 'text' },
]

const NHA_CHO_FIELDS: SpecField[] = [
  { key: 'shelter_area_m2', label: 'Diện tích mái che (m²)', type: 'number', unit: 'm²' },
  { key: 'seats', label: 'Số chỗ ngồi', type: 'number' },
  { key: 'material', label: 'Vật liệu khung', type: 'select', options: [
    { value: 'THEP_INOX', label: 'Thép / Inox' },
    { value: 'NHOM', label: 'Nhôm' },
    { value: 'COMPOSITE', label: 'Composite' },
  ]},
  { key: 'has_display', label: 'Có màn hình thông tin', type: 'boolean' },
  { key: 'has_lighting', label: 'Có chiếu sáng', type: 'boolean' },
  { key: 'route_numbers', label: 'Tuyến xe buýt phục vụ', type: 'text', description: 'VD: Tuyến 01, 03, 07' },
]

const TUONG_RAO_FIELDS: SpecField[] = [
  { key: 'length_m', label: 'Chiều dài (m)', type: 'number', unit: 'm', required: true },
  { key: 'height_m', label: 'Chiều cao (m)', type: 'number', unit: 'm', required: true },
  { key: 'material', label: 'Vật liệu', type: 'select', required: true, options: [
    { value: 'GACH', label: 'Gạch xây' },
    { value: 'BTCT', label: 'Bê tông cốt thép' },
    { value: 'THEP_HANG_RAO', label: 'Thép hàng rào' },
    { value: 'LUOI_THEP', label: 'Lưới thép' },
    { value: 'COMPOSITE', label: 'Composite' },
    { value: 'GOC_GAY', label: 'Góc gạch / đá tự nhiên' },
  ]},
  { key: 'has_cap', label: 'Có mũ tường / đỉnh trang trí', type: 'boolean' },
  { key: 'has_gate', label: 'Có cổng ra vào', type: 'boolean' },
]

const VIA_GACH_FIELDS: SpecField[] = [
  { key: 'length_m', label: 'Chiều dài (m)', type: 'number', unit: 'm', required: true },
  { key: 'width_m', label: 'Chiều rộng (m)', type: 'number', unit: 'm', required: true },
  { key: 'area_m2', label: 'Diện tích (m²)', type: 'number', unit: 'm²' },
  { key: 'material', label: 'Loại vật liệu lát', type: 'select', required: true, options: [
    { value: 'DA_TU_NHIEN', label: 'Đá tự nhiên (granite, basalt)' },
    { value: 'GACH_BE_TONG', label: 'Gạch bê tông' },
    { value: 'CERAMIC', label: 'Gạch ceramic / porcelain' },
    { value: 'TERRAZZO', label: 'Terrazzo' },
    { value: 'GACH_VUONG', label: 'Gạch vuông bê tông' },
  ]},
  { key: 'pattern', label: 'Kiểu lát', type: 'text', description: 'VD: chạy thẳng, xương cá, ô vuông...' },
]

const BIEN_HIEU_FIELDS: SpecField[] = [
  { key: 'width_m', label: 'Chiều rộng (m)', type: 'number', unit: 'm' },
  { key: 'height_m', label: 'Chiều cao (m)', type: 'number', unit: 'm' },
  { key: 'material', label: 'Vật liệu', type: 'select', options: [
    { value: 'NHOM', label: 'Nhôm' },
    { value: 'INOX', label: 'Inox' },
    { value: 'COMPOSITE', label: 'Composite / Alu' },
    { value: 'HIFLEX', label: 'Hiflex (bạt in)' },
  ]},
  { key: 'sign_type', label: 'Hình thức', type: 'select', options: [
    { value: 'NOI', label: 'Biển nổi (gắn tường)' },
    { value: 'TREO', label: 'Biển treo' },
    { value: 'PANO_CO_DINH', label: 'Pano cố định' },
    { value: 'LED', label: 'Màn hình LED' },
  ]},
  { key: 'has_lighting', label: 'Có chiếu sáng biển', type: 'boolean' },
  { key: 'content', label: 'Nội dung biển', type: 'text' },
]

const THAO_VIEN_FIELDS: SpecField[] = [
  { key: 'area_m2', label: 'Diện tích (m²)', type: 'number', unit: 'm²', required: true },
  { key: 'grass_type', label: 'Loại cỏ', type: 'select', options: [
    { value: 'CO_NHAT', label: 'Cỏ Nhật (Zoysiagrass)' },
    { value: 'CO_BERMUDA', label: 'Cỏ Bermuda' },
    { value: 'CO_LAO_BAO', label: 'Cỏ Lào Bảo' },
    { value: 'CO_MAY', label: 'Cỏ May / Cỏ dại' },
    { value: 'CO_ARTIFICIAL', label: 'Cỏ nhân tạo' },
  ]},
  { key: 'irrigation_type', label: 'Hệ thống tưới', type: 'select', options: [
    { value: 'TU_DONG', label: 'Tưới tự động (phun)' },
    { value: 'NHOI_GIOT', label: 'Tưới nhỏ giọt' },
    { value: 'THU_CONG', label: 'Tưới thủ công' },
    { value: 'KHONG', label: 'Không có' },
  ]},
  { key: 'mowing_frequency', label: 'Tần suất cắt cỏ', type: 'select', options: [
    { value: 'HANG_TUAN', label: 'Hàng tuần' },
    { value: 'NUA_THANG', label: 'Nửa tháng' },
    { value: 'HANG_THANG', label: 'Hàng tháng' },
  ]},
]

const DAY_CAP_CS_FIELDS: SpecField[] = [
  { key: 'length_m', label: 'Chiều dài (m)', type: 'number', unit: 'm', required: true },
  { key: 'section_mm2', label: 'Tiết diện cáp (mm²)', type: 'number', unit: 'mm²', required: true },
  { key: 'voltage_v', label: 'Điện áp (V)', type: 'number', unit: 'V' },
  { key: 'installation_type', label: 'Hình thức lắp đặt', type: 'select', required: true, options: [
    { value: 'NGAM', label: 'Ngầm (chôn ngầm)' },
    { value: 'NOI', label: 'Nổi (treo trên cột)' },
  ]},
  { key: 'core_count', label: 'Số lõi', type: 'number' },
  { key: 'insulation', label: 'Loại cách điện', type: 'text', description: 'VD: XLPE, PVC' },
]

const TRU_DIEN_CS_FIELDS: SpecField[] = [
  { key: 'height_m', label: 'Chiều cao trụ (m)', type: 'number', unit: 'm', required: true },
  { key: 'material', label: 'Vật liệu', type: 'select', required: true, options: [
    { value: 'THEP', label: 'Thép mạ kẽm' },
    { value: 'BT_LY_TAM', label: 'Bê tông ly tâm' },
    { value: 'COMPOSITE', label: 'Composite' },
  ]},
  { key: 'arm_count', label: 'Số cần đèn', type: 'number' },
  { key: 'arm_length_m', label: 'Chiều dài cần đèn (m)', type: 'number', unit: 'm' },
  { key: 'base_type', label: 'Loại móng', type: 'select', options: [
    { value: 'BTCT_CHON_NGAM', label: 'Chân BTCT chôn ngầm' },
    { value: 'BULONG_NEO', label: 'Bulông neo tấm đế' },
  ]},
]

// ─── REGISTRY: map mã loại tài sản → spec config ─────────────────────────────

export const ASSET_TYPE_SPECS: Record<string, AssetTypeSpec> = {
  // Cây xanh
  'CX_CAY_DUONG': {
    code: 'CX_CAY_DUONG',
    geometryType: 'POINT',
    fields: CAY_XANH_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','species','scientific_name','tree_zone','height_m','circumference_cm','canopy_diameter_m','age_years','health_status','last_pruning','last_fertilizing','last_pesticide','planting_year','has_protection_cage','notes'],
  },
  'CX_CONG_VIEN': {
    code: 'CX_CONG_VIEN',
    geometryType: 'POINT',
    fields: CAY_XANH_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','species','scientific_name','tree_zone','height_m','circumference_cm','canopy_diameter_m','age_years','health_status','last_pruning','last_fertilizing','planting_year','notes'],
  },
  // Cống thoát nước
  'TN_CONG': {
    code: 'TN_CONG',
    geometryType: 'LINE',
    fields: CONG_THOAT_NUOC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','pipe_shape','diameter_mm','width_mm','height_mm','length_m','material','depth_cover_m','invert_elevation_m','gradient_pct','flow_direction','capacity_m3h','is_combined','start_point','end_point','notes'],
  },
  // Hố ga
  'TN_HO_GA': {
    code: 'TN_HO_GA',
    geometryType: 'POINT',
    fields: HO_GA_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','hoga_type','cover_shape','cover_diameter_mm','depth_m','cover_material','wall_material','connected_pipes','top_elevation_m','load_class','has_screen','notes'],
  },
  // Mương thoát nước
  'TN_MUONG': {
    code: 'TN_MUONG',
    geometryType: 'LINE',
    fields: CONG_THOAT_NUOC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','pipe_shape','width_mm','height_mm','length_m','material','depth_cover_m','gradient_pct','capacity_m3h','notes'],
  },
  // Đèn đường
  'CS_DEN_DUONG': {
    code: 'CS_DEN_DUONG',
    geometryType: 'POINT',
    fields: DEN_DUONG_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','warrantyExpiry','pole_height_m','pole_material','bulb_type','power_watt','luminous_flux_lm','arm_length_m','span_m','cable_installation','cable_section_mm2','voltage_v','control_type','control_cabinet_id','has_solar','ip_rating','notes'],
  },
  // Tủ điện
  'CS_TU_DIEN': {
    code: 'CS_TU_DIEN',
    geometryType: 'POINT',
    fields: TU_DIEN_CS_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','cabinet_type','managed_poles','power_source','total_power_kw','has_remote','protection_level','notes'],
  },
  // Cáp viễn thông
  'VT_CAP': {  // Cần thêm loại này vào seed nếu chưa có
    code: 'VT_CAP',
    geometryType: 'LINE',
    fields: CAP_VIEN_THONG_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','operator','cable_type','installation_type','core_count','duct_diameter_mm','duct_material','depth_m','length_m','bandwidth_gbps','year_installed','joint_boxes','notes'],
  },
  // Đường giao thông
  'GT_DUONG': {
    code: 'GT_DUONG',
    geometryType: 'LINE',
    fields: DUONG_GT_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','road_class','total_length_m','road_width_m','total_width_m','sidewalk_width_m','median_width_m','lanes','surface_type','surface_year','lighting','trees_count','drainage_type','notes'],
  },
  'GT_VIA_HE': {
    code: 'GT_VIA_HE',
    geometryType: 'LINE',
    fields: VIA_HE_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','length_m','width_m','surface_material','has_curb','has_trees','trees_count','area_m2','notes'],
  },
  'GT_CAU': {
    code: 'GT_CAU',
    geometryType: 'LINE',
    fields: CAU_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','bridge_type','total_length_m','width_m','road_width_m','span_count','main_material','load_capacity_ton','clearance_m','construction_year','has_lighting','notes'],
  },
  'GT_CONG': {
    code: 'GT_CONG',
    geometryType: 'LINE',
    fields: CONG_HOP_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','width_m','height_m','length_m','material','fill_height_m','function','notes'],
  },
  'GT_DEN_TH': {
    code: 'GT_DEN_TH',
    geometryType: 'POINT',
    fields: DEN_TH_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','signal_type','phase_count','cycle_time_s','green_time_s','control_mode','has_countdown','has_pedestrian','has_camera','installation_year','notes'],
  },
  'GT_BIEN': {
    code: 'GT_BIEN',
    geometryType: 'POINT',
    fields: BIEN_BAO_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','sign_category','sign_code','sign_content','size_mm','material','reflective_class','pole_type','pole_height_m','position','notes'],
  },
  // Ống cấp nước
  'CN_ONG_CAI': {
    code: 'CN_ONG_CAI',
    geometryType: 'LINE',
    fields: ONG_CAP_NUOC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','pipe_material','diameter_mm','outer_diameter_mm','length_m','design_pressure_bar','working_pressure_bar','depth_m','pipe_zone','joint_type','has_cathodic_protection','notes'],
  },
  'CN_ONG_PHAN': {
    code: 'CN_ONG_PHAN',
    geometryType: 'LINE',
    fields: ONG_CAP_NUOC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','pipe_material','diameter_mm','length_m','design_pressure_bar','depth_m','pipe_zone','notes'],
  },
  // Van khoá
  'CN_VAN': {
    code: 'CN_VAN',
    geometryType: 'POINT',
    fields: VAN_CAP_NUOC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','elevation','installDate','valve_type','diameter_mm','material','pressure_rating_bar','depth_m','has_valve_box','operation_type','notes'],
  },
  // Trạm bơm
  'CN_TRAM_BOM': {
    code: 'CN_TRAM_BOM',
    geometryType: 'POINT',
    fields: TRAM_BOM_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','pump_count','flow_rate_m3h','head_m','total_power_kw','pump_type','has_backup_power','has_scada','construction_year','notes'],
  },
  'TN_TRAM_BOM': {
    code: 'TN_TRAM_BOM',
    geometryType: 'POINT',
    fields: TRAM_BOM_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','pump_count','flow_rate_m3h','total_power_kw','pump_type','has_backup_power','has_scada','construction_year','notes'],
  },
  // Chiếu sáng còn lại
  'CS_TRU_DIEN': {
    code: 'CS_TRU_DIEN',
    geometryType: 'POINT',
    fields: TRU_DIEN_CS_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','height_m','material','arm_count','arm_length_m','base_type','notes'],
  },
  'CS_DAY_CAP': {
    code: 'CS_DAY_CAP',
    geometryType: 'LINE',
    fields: DAY_CAP_CS_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','length_m','section_mm2','voltage_v','installation_type','core_count','notes'],
  },
  // Cây xanh còn lại
  'CX_THAO_VIEN': {
    code: 'CX_THAO_VIEN',
    geometryType: 'POLYGON',
    fields: THAO_VIEN_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','area_m2','grass_type','irrigation_type','mowing_frequency','notes'],
  },
  // Môi trường
  'MT_THUNG_RAC': {
    code: 'MT_THUNG_RAC',
    geometryType: 'POINT',
    fields: THUNG_RAC_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','bin_type','volume_l','material','has_lid','color','notes'],
  },
  'MT_NHA_CHO': {
    code: 'MT_NHA_CHO',
    geometryType: 'POINT',
    fields: NHA_CHO_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','shelter_area_m2','seats','material','has_display','has_lighting','route_numbers','notes'],
  },
  // Chỉnh trang
  'CT_TUONG_RAO': {
    code: 'CT_TUONG_RAO',
    geometryType: 'LINE',
    fields: TUONG_RAO_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','length_m','height_m','material','has_cap','has_gate','notes'],
  },
  'CT_VIA_DAP': {
    code: 'CT_VIA_DAP',
    geometryType: 'LINE',
    fields: VIA_GACH_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','length_m','width_m','area_m2','material','pattern','notes'],
  },
  'CT_BIEN_HIEU': {
    code: 'CT_BIEN_HIEU',
    geometryType: 'POINT',
    fields: BIEN_HIEU_FIELDS,
    excelHeaders: ['assetCode','name','address','latitude','longitude','installDate','width_m','height_m','material','sign_type','has_lighting','content','notes'],
  },
}

// Helper lấy spec theo code, trả về null nếu chưa có cấu hình
export function getAssetTypeSpec(code: string): AssetTypeSpec | null {
  return ASSET_TYPE_SPECS[code] ?? null
}

// Label tiếng Việt cho headers Excel
export const HEADER_LABELS: Record<string, string> = {
  assetCode: 'Mã tài sản (*)',
  name: 'Tên tài sản (*)',
  address: 'Địa chỉ / Vị trí',
  latitude: 'Vĩ độ (Latitude)',
  longitude: 'Kinh độ (Longitude)',
  elevation: 'Cao độ / Độ sâu (m)',
  installDate: 'Ngày lắp đặt (dd/mm/yyyy)',
  warrantyExpiry: 'Hạn bảo hành (dd/mm/yyyy)',
  notes: 'Ghi chú',
}
