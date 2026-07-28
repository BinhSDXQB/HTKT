// Kiểu dữ liệu trung gian sau khi parse — trước khi lưu vào DB

export type ParsedGeometry =
  | { type: 'Point';      coordinates: [number, number, number?] }
  | { type: 'LineString'; coordinates: [number, number, number?][] }
  | { type: 'Polygon';    coordinates: [number, number, number?][][] }

export type ParsedFeature = {
  geometry: ParsedGeometry
  properties: Record<string, string | number | boolean | null>
  sourceLayer?: string   // Tên layer/layer gốc (từ DXF/Shapefile)
  label?: string         // Nhãn/text annotation
}

export type ParseResult = {
  format: 'DXF' | 'KML' | 'KMZ' | 'GEOJSON' | 'SHAPEFILE' | 'CSV' | 'WEBHOOK'
  features: ParsedFeature[]
  errors: string[]
  warnings: string[]
  crs?: string           // Hệ tọa độ gốc (VD: VN2000, WGS84)
  layers?: string[]      // Danh sách layer trong file
}

// Hệ tọa độ Việt Nam phổ biến
export const CRS_OPTIONS = [
  { value: 'WGS84',   label: 'WGS84 (GPS quốc tế)' },
  { value: 'VN2000',  label: 'VN-2000 (Hệ tọa độ Việt Nam)' },
  { value: 'HN72',    label: 'Hà Nội 72 (cũ)' },
]

// Ánh xạ layer DXF → loại hạ tầng
export const DXF_LAYER_MAP: Record<string, string> = {
  // Thoát nước
  'CONG':           'CongThoatNuoc',
  'CONG_THOAT':     'CongThoatNuoc',
  'DRAINAGE':       'CongThoatNuoc',
  'HO_GA':          'HoGa',
  'MANHOLE':        'HoGa',
  // Cấp nước
  'ONG_NUOC':       'OngCapNuoc',
  'WATER_PIPE':     'OngCapNuoc',
  'VAN_NUOC':       'VanCapNuoc',
  // Điện chiếu sáng
  'DEN':            'DenChieuSang',
  'LIGHTING':       'DenChieuSang',
  'LAMP':           'DenChieuSang',
  // Cây xanh
  'CAY':            'CayXanhDuong',
  'TREE':           'CayXanhDuong',
  'VEGETATION':     'CayXanhDuong',
  // Đường
  'DUONG':          'TuyenMangLuoi',
  'ROAD':           'TuyenMangLuoi',
  'STREET':         'TuyenMangLuoi',
  // Cáp viễn thông
  'CAP':            'CapVienThong',
  'CABLE':          'CapVienThong',
  'TELECOM':        'CapVienThong',
}
