// Danh mục bảng trung tâm đối tượng HTKT (htkt_doi_tuong — migration 049). Dùng chung server + client.
// Trường từng lĩnh vực lấy theo 7 Biểu mẫu xã/phường đang dùng (lib/ward-report-schema.ts) để dữ liệu cũ nạp
// sang không mất cột; cột chung là cột có kiểu của bảng, cột riêng nằm trong thong_so (JSONB).
// Số hiệu đường: Điều 5 QĐ 56/2025/QĐ-UBND tỉnh Quảng Trị.

export type LinhVuc =
  | 'DUONG' | 'CHIEU_SANG' | 'CAY_XANH' | 'CONG_VIEN'
  | 'THOAT_NUOC_MUA' | 'THOAT_NUOC_THAI' | 'THOAT_NUOC_CHUNG' | 'CAP_NUOC' | 'BAI_DO_XE'

export type KieuHinhHoc = 'tuyen' | 'diem' | 'vung'

export type TruongDef = {
  key: string                 // cột của bảng (snake_case) hoặc 'ts.<khoá>' = thong_so.<khoá>
  label: string
  kind: 'text' | 'textarea' | 'number' | 'integer' | 'select' | 'boolean'
  unit?: string
  heSo?: number               // giá trị lưu = giá trị nhập × heSo (vd km → m: 1000)
  options?: { value: string; label: string }[]
  rong?: boolean              // chiếm cả hàng trong form
}

export type LinhVucDef = {
  value: LinhVuc
  label: string
  ma: string                  // mã ngắn trong mã định danh <mã xã>-<ma>-<NNNN>
  mau: string                 // màu trên bản đồ
  hinhHoc: KieuHinhHoc[]      // kiểu hình học được phép (trùng ràng buộc trong trigger CSDL)
  trenTuyen: boolean          // có liên kết "nằm trên tuyến đường"
  bieuMau: string | null      // bảng Biểu mẫu nguồn
  truong: TruongDef[]
}

const TINH_TRANG_OPTS = [
  { value: 'TOT', label: 'Tốt' }, { value: 'TRUNG_BINH', label: 'Trung bình' },
  { value: 'KEM', label: 'Kém' }, { value: 'HU_HONG', label: 'Hư hỏng' },
]
const PHIA_OPTS = [{ value: '1 phía', label: '1 phía' }, { value: '2 phía', label: '2 phía' }, { value: 'Giữa', label: 'Giữa' }]

const TRUONG_TUYEN: TruongDef[] = [
  { key: 'diem_dau', label: 'Điểm đầu', kind: 'text' },
  { key: 'diem_cuoi', label: 'Điểm cuối', kind: 'text' },
]
const TRUONG_CUOI: TruongDef[] = [
  { key: 'nam_su_dung', label: 'Năm đưa vào sử dụng', kind: 'integer' },
  { key: 'tinh_trang', label: 'Tình trạng', kind: 'select', options: TINH_TRANG_OPTS },
  { key: 'don_vi_quan_ly', label: 'Đơn vị quản lý', kind: 'text' },
]
const TRUONG_THOAT_NUOC: TruongDef[] = [
  ...TRUONG_TUYEN,
  { key: 'chieu_dai_m', label: 'Chiều dài', kind: 'number', unit: 'm' },
  { key: 'ts.kichThuocCong', label: 'Kích thước cống/mương', kind: 'text', unit: 'D800, B500…' },
  { key: 'ts.ketCau', label: 'Kết cấu', kind: 'select', options: [
    { value: 'Cống tròn', label: 'Cống tròn' }, { value: 'Cống hộp', label: 'Cống hộp' },
    { value: 'Mương hở', label: 'Mương hở' }, { value: 'Mương nắp đan', label: 'Mương nắp đan' }] },
  { key: 'ts.phia', label: 'Bố trí', kind: 'select', options: PHIA_OPTS },
  { key: 'ts.noiXa', label: 'Điểm xả / nơi tiếp nhận', kind: 'text' },
  ...TRUONG_CUOI,
]

export const LINH_VUC: LinhVucDef[] = [
  {
    value: 'DUONG', label: 'Đường giao thông', ma: 'DG', mau: '#2563eb', hinhHoc: ['tuyen'], trenTuyen: false, bieuMau: 'report_duong',
    truong: [
      ...TRUONG_TUYEN,
      { key: 'chieu_dai_m', label: 'Chiều dài', kind: 'number', unit: 'km', heSo: 1000 },
      { key: 'be_rong_nen_m', label: 'Bề rộng nền', kind: 'number', unit: 'm' },
      { key: 'be_rong_mat_m', label: 'Bề rộng mặt', kind: 'number', unit: 'm' },
      { key: 'ket_cau_mat', label: 'Kết cấu mặt', kind: 'select', options: [
        { value: 'Bê tông nhựa', label: 'Bê tông nhựa' }, { value: 'Láng nhựa', label: 'Láng nhựa' },
        { value: 'Bê tông xi măng', label: 'Bê tông xi măng' }, { value: 'Cấp phối', label: 'Cấp phối' },
        { value: 'Đất', label: 'Đất' }, { value: 'Khác', label: 'Khác' }] },
      { key: 'ts.heTraiM', label: 'Hè trái', kind: 'number', unit: 'm' },
      { key: 'ts.hePhaiM', label: 'Hè phải', kind: 'number', unit: 'm' },
      { key: 'ts.giaiPhanCachM', label: 'Giải phân cách', kind: 'number', unit: 'm' },
      ...TRUONG_CUOI,
      { key: 'de_xuat_dieu_chinh', label: 'Đề xuất điều chỉnh (Mẫu 01/02)', kind: 'textarea', rong: true },
    ],
  },
  {
    value: 'CHIEU_SANG', label: 'Chiếu sáng công cộng', ma: 'CS', mau: '#f59e0b', hinhHoc: ['tuyen', 'diem'], trenTuyen: true, bieuMau: 'report_dien_cs',
    truong: [
      ...TRUONG_TUYEN,
      { key: 'chieu_dai_m', label: 'Chiều dài chiếu sáng', kind: 'number', unit: 'km', heSo: 1000 },
      { key: 'so_luong', label: 'Số cột đèn', kind: 'integer', unit: 'cột' },
      { key: 'ts.loaiDen', label: 'Loại đèn', kind: 'select', options: [
        { value: 'LED', label: 'LED' }, { value: 'Sodium', label: 'Sodium' }, { value: 'Halogen', label: 'Halogen' },
        { value: 'Compact', label: 'Compact' }, { value: 'Khác', label: 'Khác' }] },
      { key: 'ts.congSuatW', label: 'Công suất', kind: 'number', unit: 'W' },
      { key: 'ts.chieuSangPhia', label: 'Chiếu sáng', kind: 'select', options: PHIA_OPTS },
      ...TRUONG_CUOI,
    ],
  },
  {
    value: 'CAY_XANH', label: 'Cây xanh đường phố', ma: 'CX', mau: '#16a34a', hinhHoc: ['tuyen', 'diem'], trenTuyen: true, bieuMau: 'report_cay_xanh',
    truong: [
      ...TRUONG_TUYEN,
      { key: 'chieu_dai_m', label: 'Chiều dài tuyến trồng', kind: 'number', unit: 'm' },
      { key: 'so_luong', label: 'Số lượng cây', kind: 'integer', unit: 'cây' },
      { key: 'ts.chungLoaiCay', label: 'Chủng loại cây', kind: 'text' },
      { key: 'ts.phiaTrong', label: 'Trồng', kind: 'select', options: PHIA_OPTS },
      ...TRUONG_CUOI,
    ],
  },
  {
    value: 'CONG_VIEN', label: 'Công viên, vườn hoa', ma: 'CV', mau: '#db2777', hinhHoc: ['vung', 'diem'], trenTuyen: false, bieuMau: 'report_cong_vien',
    truong: [
      { key: 'vi_tri', label: 'Vị trí', kind: 'text', rong: true },
      { key: 'ts.loaiHinh', label: 'Loại hình', kind: 'select', options: [
        { value: 'Công viên', label: 'Công viên' }, { value: 'Quảng trường', label: 'Quảng trường' },
        { value: 'Vườn hoa', label: 'Vườn hoa' }, { value: 'Khác', label: 'Khác' }] },
      { key: 'dien_tich_m2', label: 'Diện tích', kind: 'number', unit: 'm²' },
      { key: 'ts.dienTichThamCoM2', label: 'Diện tích thảm cỏ', kind: 'number', unit: 'm²' },
      { key: 'so_luong', label: 'Số lượng cây', kind: 'integer', unit: 'cây' },
      { key: 'ts.chungLoaiCay', label: 'Chủng loại cây', kind: 'text' },
      ...TRUONG_CUOI,
    ],
  },
  { value: 'THOAT_NUOC_MUA', label: 'Thoát nước mưa', ma: 'TM', mau: '#0ea5e9', hinhHoc: ['tuyen'], trenTuyen: true, bieuMau: 'report_thoat_nuoc', truong: TRUONG_THOAT_NUOC },
  { value: 'THOAT_NUOC_THAI', label: 'Thoát nước thải', ma: 'TT', mau: '#7c3aed', hinhHoc: ['tuyen'], trenTuyen: true, bieuMau: 'report_thoat_nuoc', truong: TRUONG_THOAT_NUOC },
  { value: 'THOAT_NUOC_CHUNG', label: 'Thoát nước chung (mưa + thải)', ma: 'TC', mau: '#0d9488', hinhHoc: ['tuyen'], trenTuyen: true, bieuMau: 'report_thoat_nuoc', truong: TRUONG_THOAT_NUOC },
  {
    value: 'CAP_NUOC', label: 'Cấp nước', ma: 'CN', mau: '#0891b2', hinhHoc: ['tuyen', 'diem'], trenTuyen: true, bieuMau: 'report_cap_nuoc',
    truong: [
      { key: 'vi_tri', label: 'Địa chỉ', kind: 'text', rong: true },
      { key: 'so_luong', label: 'Số hộ gia đình', kind: 'integer', unit: 'hộ' },
      { key: 'ts.hienTrang', label: 'Hiện trạng sử dụng nước', kind: 'text' },
      { key: 'ts.duKienNguon', label: 'Dự kiến nguồn nước', kind: 'text' },
      { key: 'chieu_dai_m', label: 'Chiều dài tuyến ống', kind: 'number', unit: 'm' },
      ...TRUONG_CUOI,
    ],
  },
  {
    value: 'BAI_DO_XE', label: 'Bãi đỗ xe', ma: 'BX', mau: '#64748b', hinhHoc: ['vung', 'diem'], trenTuyen: false, bieuMau: 'report_bai_do_xe',
    truong: [
      { key: 'vi_tri', label: 'Địa điểm', kind: 'text', rong: true },
      { key: 'dien_tich_m2', label: 'Diện tích', kind: 'number', unit: 'm²' },
      { key: 'so_luong', label: 'Số vị trí đỗ', kind: 'integer', unit: 'chỗ' },
      { key: 'ts.coTramSacDien', label: 'Có trạm sạc xe điện', kind: 'boolean' },
      ...TRUONG_CUOI,
    ],
  },
]

export const LINH_VUC_MAP: Record<string, LinhVucDef> = Object.fromEntries(LINH_VUC.map((l) => [l.value, l]))

// ── Đường: cấp quản lý (QĐ 56 Đ3) ─────────────────────────────────────────────────────────────────────
export const CAP_DUONG = [
  { value: 'DUONG_XA', label: 'Đường xã' },
  { value: 'DUONG_THON', label: 'Đường thôn' },
  { value: 'DUONG_GOM', label: 'Đường gom, đường bên tách khỏi quốc lộ' },
  { value: 'DUONG_DO_THI', label: 'Đường đô thị' },
  { value: 'DUONG_TINH', label: 'Đường tỉnh (tham chiếu)' },
  { value: 'QUOC_LO', label: 'Quốc lộ (tham chiếu)' },
  { value: 'CHUA_PHAN_CAP', label: 'Chưa phân cấp — cần xác định' },
] as const

// Nhóm đường đô thị theo Mẫu 03 QĐ 56.
export const PHAN_LOAI_DO_THI = [
  { value: 'TRUC_CHINH', label: 'Đường trục chính đô thị', nhom: 'A' },
  { value: 'CHINH_DO_THI', label: 'Đường chính đô thị', nhom: 'A' },
  { value: 'LIEN_KHU_VUC', label: 'Đường liên khu vực', nhom: 'A' },
  { value: 'CHINH_KHU_VUC', label: 'Đường chính khu vực', nhom: 'B' },
  { value: 'KHU_VUC', label: 'Đường khu vực', nhom: 'B' },
  { value: 'NOI_BO', label: 'Đường cấp nội bộ', nhom: 'B' },
] as const

export const SH_TRANG_THAI = [
  { value: 'DE_XUAT', label: 'Đề xuất (giữ số)', mau: 'bg-amber-100 text-amber-800' },
  { value: 'HIEU_LUC', label: 'Đã quyết định', mau: 'bg-emerald-100 text-emerald-800' },
] as const

// Đ5 k1 điểm c: chữ cái cho đường thứ hai trở lên dùng chung số (không có A, J).
export const CHU_CAI_SO_HIEU = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N'] as const

export const TINH_TRANG = TINH_TRANG_OPTS

export function kyHieuCap(cap: string | null | undefined): 'ĐX.' | 'Đth.' | null {
  return cap === 'DUONG_XA' ? 'ĐX.' : cap === 'DUONG_THON' ? 'Đth.' : null
}

/** Thẩm quyền đặt số hiệu (Đ5 k2): ĐX. → UBND tỉnh; Đth. → UBND cấp xã. */
export function coQuanDatSoHieu(cap: string | null | undefined): string | null {
  return cap === 'DUONG_XA' ? 'UBND tỉnh' : cap === 'DUONG_THON' ? 'UBND cấp xã' : null
}

/**
 * Tách chuỗi số hiệu người dùng gõ/nhập Excel về (cấp, số, chữ cái): "ĐX.15B", "dx 15 b", "Đth.101", "DTH-101c".
 * Trả null nếu không phải số hiệu Đ5.
 */
export function tachSoHieu(s: string | null | undefined): { cap: 'DUONG_XA' | 'DUONG_THON'; so: number; chuCai: string | null } | null {
  if (!s) return null
  const t = s.normalize('NFC').trim().replace(/Đ/g, 'D').replace(/đ/g, 'd').toUpperCase()
  const m = t.match(/^D(X|TH)\s*[.\-]?\s*(\d{1,5})\s*([A-Z])?$/)
  if (!m) return null
  const chu = m[3] ?? null
  if (chu && !(CHU_CAI_SO_HIEU as readonly string[]).includes(chu)) return null
  return { cap: m[1] === 'X' ? 'DUONG_XA' : 'DUONG_THON', so: Number(m[2]), chuCai: chu }
}

/** Chuẩn hoá chuỗi để so khớp tên (bỏ dấu, chữ thường, gộp khoảng trắng, bỏ tiền tố "đường"). */
export function chuanHoaTen(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^duong\s+/, '').trim()
}

/** Phân loại "loại nước" lộn xộn của Biểu mẫu thoát nước cũ → lĩnh vực hub; null = chưa rõ (không tự nạp). */
export function phanLoaiThoatNuoc(loaiNuoc: string | null | undefined): LinhVuc | null {
  const t = chuanHoaTen(loaiNuoc)
  if (!t) return null
  const mua = /\b(mua|nm)\b/.test(t)
  const thai = /\b(thai|nt)\b/.test(t)
  if (mua && thai) return 'THOAT_NUOC_CHUNG'
  if (/\bchung\b/.test(t)) return 'THOAT_NUOC_CHUNG'
  if (mua) return 'THOAT_NUOC_MUA'
  if (thai) return 'THOAT_NUOC_THAI'
  return null
}

/** Nhận diện QL/ĐT trong tên tuyến của Biểu mẫu đường → cấp tham chiếu + số hiệu chuẩn. */
export function nhanDienQuocLoTinhLo(ten: string | null | undefined): { cap: 'QUOC_LO' | 'DUONG_TINH'; soHieu: string } | null {
  const t = (ten ?? '').normalize('NFC').trim()
  const ql = t.match(/^(?:QL|Quốc\s*lộ)\s*\.?\s*(\d+[A-Z]?)/i)
  if (ql) return { cap: 'QUOC_LO', soHieu: `QL.${ql[1].toUpperCase()}` }
  const dt = t.match(/^(?:ĐT|DT|TL|Tỉnh\s*lộ|Đường\s*tỉnh)\s*\.?\s*(\d+[A-Z]?)/i)
  if (dt) return { cap: 'DUONG_TINH', soHieu: `ĐT.${dt[1].toUpperCase()}` }
  return null
}
