/**
 * TẠO DỮ LIỆU STAGING TỪ BẢN KHÔI PHỤC CSDL — DANH SÁCH TRẮNG + DỮ LIỆU GIẢ
 * (B0 mục 7 — docs/htkt-brain-review/B0-staging-vps.md §4).
 *
 * Bản đầu dùng "ẩn danh từng cột nghi ngờ" (danh sách đen) — Codex phản biện CHƯA ĐẠT: lọt DOCX/PDF/ảnh chữ ký
 * (cột Bytes), Json/ghi chú tự do, và đổi tên không chống được tái định danh (chức vụ duy nhất, lịch sử lương
 * theo canBoId, liên kết User↔CanBo). Thiết kế lại:
 *
 *  1. MẶC ĐỊNH XOÁ: bảng nào KHÔNG có trong BANG_GIU bị xoá toàn bộ (bảng mới thêm vào schema tự động an toàn).
 *  2. Bảng giữ (hạ tầng công, danh mục): chỉ giữ cột văn bản/Json/nhị phân/mảng có tên trong danh sách trắng
 *     `cot`; mọi cột loại đó khác bị XOÁ TRẮNG. Cột số/ngày/boolean/enum/khoá được giữ.
 *  3. Khoá ngoại từ bảng giữ trỏ sang bảng bị xoá: cho phép NULL → NULL; bắt buộc → tài khoản giữ chỗ (chỉ User).
 *  4. Xoá theo thứ tự tôpô từ đồ thị quan hệ trong schema.
 *  5. Sinh tài khoản + cán bộ GIẢ đủ để kiểm thử staging.
 *  6. Kiểm tra hậu điều kiện; script bọc chỉ xuất dump khi tất cả đạt.
 *
 * KHÔNG phải công cụ kiểm soát truy cập: rào chặn chỉ giảm nhầm lẫn — công cụ phải chạy trên máy nội bộ không có
 * đường kết nối tới production.
 */

// ── Đọc schema ────────────────────────────────────────────────────────────────

export type Cot = {
  ten: string
  /** String | Int | Float | Boolean | DateTime | Json | Decimal | BigInt | Bytes | Enum | Unsupported */
  kieu: string
  mang: boolean
  tuyChon: boolean
  coMacDinh: boolean
}
export type KhoaNgoai = { cot: string[]; toi: string; tuyChon: boolean }
export type Bang = { model: string; bang: string; cot: Cot[]; fk: KhoaNgoai[] }

const KIEU_VO_HUONG = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'BigInt', 'Bytes'])

export function docSchema(noiDung: string): Bang[] {
  const enums = new Set<string>()
  for (const m of noiDung.matchAll(/^enum\s+(\w+)\s*\{/gm)) enums.add(m[1])
  const ra: Bang[] = []
  let hienTai: Bang | null = null
  for (const dong of noiDung.split(/\r?\n/)) {
    const mo = dong.match(/^model\s+(\w+)\s*\{/)
    if (mo) { hienTai = { model: mo[1], bang: mo[1], cot: [], fk: [] }; continue }
    if (!hienTai) continue
    if (/^\}/.test(dong)) { ra.push(hienTai); hienTai = null; continue }
    const map = dong.match(/^\s*@@map\("([^"]+)"\)/)
    if (map) { hienTai.bang = map[1]; continue }
    const f = dong.match(/^\s+(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/)
    if (!f) continue
    const [, ten, kieu, mang, tuyChon, conLai] = f
    const rel = conLai.match(/@relation\([^)]*fields:\s*\[([^\]]+)\]/)
    if (rel) {
      hienTai.fk.push({ cot: rel[1].split(',').map((s) => s.trim()), toi: kieu, tuyChon: !!tuyChon })
      continue
    }
    const coMacDinh = /@default\(/.test(conLai)
    if (dong.includes('Unsupported(')) {
      hienTai.cot.push({ ten, kieu: 'Unsupported', mang: false, tuyChon: true, coMacDinh })
    } else if (KIEU_VO_HUONG.has(kieu) || enums.has(kieu)) {
      hienTai.cot.push({ ten, kieu: enums.has(kieu) ? 'Enum' : kieu, mang: !!mang, tuyChon: !!tuyChon, coMacDinh })
    }
    // còn lại: trường quan hệ ngược (Model[] / Model?) — không phải cột
  }
  return ra
}

/** Cột có thể CHỨA nội dung tự do / định danh: văn bản, Json, nhị phân, mọi loại mảng. */
export function laCotNoiDung(c: Cot): boolean {
  return c.mang || c.kieu === 'String' || c.kieu === 'Json' || c.kieu === 'Bytes'
}

// ── Danh sách trắng ──────────────────────────────────────────────────────────

export type BangGiu = {
  /** Cột nội dung (String/Json/Bytes/mảng) được GIỮ — duyệt từng cột. Cột nội dung khác bị xoá trắng. */
  cot: string[]
  /** Chỉ giữ các dòng thoả điều kiện SQL (dòng khác bị xoá). */
  giuDongNeu?: string
  /** Cột GIỮ nhưng phải biến đổi (biểu thức SQL thay giá trị) — vd chỉ giữ hình học của geojson. */
  bienDoi?: Record<string, string>
}

/**
 * Hình học GeoJSON chỉ gồm type + coordinates; coordinates phải THUẦN SỐ (mảng lồng nhau của số) — có chuỗi/đối tượng/
 * boolean ở bất kỳ mức nào → bỏ cả hình học (NULL). Cần PostgreSQL ≥ 12 (jsonb_path_exists).
 */
const hinhHoc = (g: string) =>
  `CASE WHEN (${g})->>'type' IN ('Point','LineString','Polygon','MultiPoint','MultiLineString','MultiPolygon') ` +
  `AND jsonb_typeof((${g})->'coordinates') = 'array' ` +
  `AND NOT jsonb_path_exists((${g})->'coordinates', '$.** ? (@.type() != "number" && @.type() != "array")') ` +
  `THEN jsonb_build_object('type', (${g})->>'type', 'coordinates', (${g})->'coordinates') END`

/** GeoJSON (Geometry / Feature / FeatureCollection) → chỉ hình học; properties luôn rỗng. */
export function geojsonChiHinhHoc(cot: string): string {
  const c = `"${cot}"::jsonb`
  return `CASE
    WHEN "${cot}" IS NULL THEN NULL
    WHEN ${c}->>'type' = 'Feature' THEN jsonb_build_object('type', 'Feature', 'geometry', ${hinhHoc(`${c}->'geometry'`)}, 'properties', '{}'::jsonb)
    WHEN ${c}->>'type' = 'FeatureCollection' AND jsonb_typeof(${c}->'features') = 'array' THEN jsonb_build_object('type', 'FeatureCollection', 'features', coalesce((
      SELECT jsonb_agg(jsonb_build_object('type', 'Feature', 'geometry', ${hinhHoc(`f`)}, 'properties', '{}'::jsonb))
      FROM jsonb_array_elements(${c}->'features') AS e(v), LATERAL (SELECT e.v->'geometry' AS f) x), '[]'::jsonb))
    ELSE ${hinhHoc(c)}
  END`
}

/**
 * Bảng GIỮ. Nguyên tắc chọn cột: mã, tên/loại/vật liệu/trạng thái của TÀI SẢN, tên đơn vị hành chính/tổ chức —
 * KHÔNG giữ ghi chú, mô tả, đường dẫn tệp, ảnh, Json tự do, tên/liên hệ cá nhân.
 */
export const BANG_GIU: Record<string, BangGiu> = {
  // Phân quyền (cần để đăng nhập/kiểm thử quyền trên staging)
  Role: { cot: ['name', 'displayName'] },
  Permission: { cot: ['module', 'action'] },
  RolePermission: { cot: ['roleId', 'permissionId'] },
  // Hành chính, tổ chức (công khai)
  AdministrativeUnit: { cot: ['code', 'name', 'fullName', 'parentId', 'trungTamHc', 'truocSapNhap', 'huyenThiCu', 'vungLoi'] },
  ToChuc: { cot: ['ma', 'ten', 'tenVietTat', 'cap', 'parentId', 'donViHCId'] },
  ChucDanh: { cot: ['ma', 'ten', 'capQuanLy'] },
  Street: { cot: ['code', 'name', 'wardId'] },
  AssetType: { cot: ['code', 'name'] },
  // Hạ tầng kỹ thuật (tài sản công)
  DenChieuSang: { cot: ['maTS', 'streetId', 'wardId', 'vatLieuCot', 'loaiBong', 'loaiBongChuan', 'dieuKhien', 'capDien', 'tuDienId', 'hangSX', 'model'] },
  CayXanhDuong: { cot: ['maTS', 'streetId', 'wardId', 'tenCay', 'tenKhoaHoc', 'viTriTrong', 'sucKhoe'] },
  HoGa: { cot: ['maTS', 'streetId', 'wardId', 'loaiHoGa', 'vatLieuNap', 'vatLieuThanh', 'taiTrongEN124'] },
  CongThoatNuoc: { cot: ['maTS', 'streetId', 'wardId', 'hoGaDauId', 'hoGaCuoiId', 'hinhDang', 'vatLieu', 'huongThoat', 'loaiNuoc'] },
  OngCapNuoc: { cot: ['maTS', 'streetId', 'wardId', 'vatLieu', 'capMang', 'kieuNoi'] },
  VanCapNuoc: { cot: ['maTS', 'streetId', 'wardId', 'ongCapNuocId', 'loaiVan', 'vatLieu', 'vanHanh'] },
  CapVienThong: { cot: ['maTS', 'streetId', 'wardId', 'donViMang', 'loaiCap', 'hinhThucLapDat', 'vatLieuOng'] },
  ViaHe: { cot: ['maTS', 'streetId', 'wardId', 'vatLieuLat', 'vatLieuLe'] },
  TuyenMangLuoi: { cot: ['maTuyen', 'tenTuyen', 'loai', 'wardId', 'diemBatDau', 'diemKetThuc', 'nhaMayXuLyId', 'tramBomId'] },
  DoanTuyenCong: { cot: ['tuyenId', 'streetId', 'hinhDang', 'vatLieu'] },
  DoanTuyenOng: { cot: ['tuyenId', 'streetId', 'vatLieu'] },
  NhaMayXuLyNuocThai: { cot: ['maCS', 'ten', 'wardId', 'diaChi', 'congNghe', 'tieuchuanXaThai', 'nguonTiepNhan', 'noiXaThai', 'donViQuanLy'] },
  TramBom: { cot: ['maCS', 'ten', 'loai', 'wardId', 'streetId', 'diaChi', 'nhaMayXuLyId', 'donViQuanLy'] },
  // techSpecs (Json mở) bị xoá; geojson chỉ giữ HÌNH HỌC (bỏ properties) — xem BIEN_DOI
  Asset: { cot: ['assetCode', 'nationalCode', 'name', 'assetTypeId', 'address', 'wardId', 'streetId', 'lyTrinh', 'viTriDuong', 'geojson', 'manufacturer', 'model'], bienDoi: { geojson: geojsonChiHinhHoc('geojson') } },
  MaintenanceSchedule: { cot: ['name', 'assetTypeId', 'assetId'] },
  InspectionTemplate: { cot: ['name', 'assetTypeId'] },
  InspectionTemplateItem: { cot: ['templateId', 'name'] },
  // Vật tư, dự án (công khai)
  MaterialCategory: { cot: ['code', 'name', 'parentId'] },
  Material: { cot: ['code', 'name', 'categoryId', 'unit'] },
  Project: { cot: ['projectCode', 'nationalCode', 'name', 'location', 'wardId', 'investor', 'pmUnit', 'designUnit', 'executingUnitId', 'supervisionUnit', 'fundingSource', 'decisionNumber', 'approvalDecisionNo', 'approvalAuthority', 'constructionPermitNo'] },
  ProjectMilestone: { cot: ['projectId', 'name'] },
  ExecutingUnit: { cot: ['name', 'code'] },
  // Báo cáo hạ tầng phường/xã (số liệu tài sản công)
  ReportDuong: { cot: ['wardId', 'tenDuong', 'diemDau', 'diemCuoi', 'ketCauMat'] },
  ReportDienCS: { cot: ['wardId', 'tuyenDuong', 'loaiDen', 'loaiDenChuan', 'chieuSangPhia'] },
  ReportThoatNuoc: { cot: ['wardId', 'tuyen', 'diemDau', 'diemCuoi', 'loaiNuoc', 'chieuSangPhia', 'kichThuocCong'] },
  ReportCayXanh: { cot: ['wardId', 'tuyen', 'diemDau', 'diemCuoi', 'chieuSangPhia', 'chungLoaiCay'] },
  ReportCongVien: { cot: ['wardId', 'tenCongVien', 'viTri', 'chungLoaiCay'] },
  ReportCapNuoc: { cot: ['wardId', 'tuyenDuong', 'hienTrang', 'duKienNguon'] },
  ReportBaiDoXe: { cot: ['wardId', 'tenBai', 'diaDiem'] },
  WardGisLength: { cot: ['wardId', 'nguon'] },
  WardKhaiBao: { cot: ['wardId', 'linhVuc', 'chiTieu', 'donVi'] },
  FacilityConfig: { cot: ['coQuanCapTren', 'tenCoQuan', 'tenDonVi', 'diaChi', 'website'] },
  // Danh mục nghiệp vụ (không gắn người)
  OfficeSalaryRule: { cot: ['ma', 'ten', 'loaiCanBo', 'nhomNgach', 'vanBanCanCu'] },
  OfficeRewardTitle: { cot: ['ma', 'ten', 'capKhen'] },
  OfficeEmulationMovement: { cot: ['ten', 'capPhatDong'] },
  RoadLegalReference: { cot: ['code', 'title', 'documentType', 'scope', 'url'] },
  CongViecLoai: { cot: ['toChucId', 'ten', 'mauSac'] },
  // Tài liệu RAG: CHỈ tài liệu công khai (văn bản pháp luật) — tài liệu nội bộ có thể chứa dữ liệu cá nhân (S22)
  // nguon: chỉ giữ TÊN TỆP (bỏ đường dẫn thư mục có thể lộ tên người/máy nội bộ)
  TaiLieu: {
    cot: ['tieuDe', 'loai', 'nguon', 'phamVi', 'trangThai', 'tinhTrangHieuLuc', 'thayTheBoi'], giuDongNeu: `"phamVi" = 'CONG_KHAI'`,
    // SQL: regexp_replace("nguon", '^.*[\\/]', '') — lớp ký tự gồm dấu \ (Windows) và / (URL)
    bienDoi: { nguon: `regexp_replace("nguon", '^.*[\\\\/]', '')` },
  },
  TaiLieuChunk: { cot: ['taiLieuId', 'noiDung', 'viTri'], giuDongNeu: `"taiLieuId" IN (SELECT id FROM tai_lieu WHERE "phamVi" = 'CONG_KHAI')` },
  // QĐ 72 — khảo sát hạ tầng PCCC (tài sản công; bỏ toàn bộ chi_tiet Json, mô tả, ý kiến, tệp)
  qd72_legal_documents: { cot: ['ma_van_ban', 'loai', 'so_hieu', 'ten', 'co_quan_ban_hanh', 'sua_doi_cho_id', 'trang_thai', 'nguon_url'] },
  qd72_technical_rules: { cot: ['ma_tieu_chi', 'nhom', 'ten', 'gia_tri_text', 'toan_tu', 'don_vi', 'legal_document_id', 'dieu_khoan', 'phien_ban', 'trang_thai'] },
}

/** Tài khoản giữ chỗ: khoá ngoại BẮT BUỘC từ bảng giữ trỏ tới users được chuyển về đây. */
export const ID_GIU_CHO = 'an-danh-giu-cho'

// ── Kiểm tra quy tắc với schema ──────────────────────────────────────────────

export type LoiKiemTra = { loai: string; chiTiet: string }

export function kiemTraQuyTac(bangs: Bang[]): LoiKiemTra[] {
  const loi: LoiKiemTra[] = []
  const theoModel = new Map(bangs.map((b) => [b.model, b]))
  for (const [model, g] of Object.entries(BANG_GIU)) {
    const b = theoModel.get(model)
    if (!b) { loi.push({ loai: 'BANG_GIU_KHONG_TON_TAI', chiTiet: model }); continue }
    for (const c of g.cot) {
      const cot = b.cot.find((x) => x.ten === c)
      if (!cot) loi.push({ loai: 'COT_GIU_KHONG_TON_TAI', chiTiet: `${model}.${c}` })
      else if (cot.kieu === 'Bytes') loi.push({ loai: 'KHONG_DUOC_GIU_NHI_PHAN', chiTiet: `${model}.${c}` })
    }
    for (const fk of b.fk) {
      if (fk.toi in BANG_GIU) continue
      // Trỏ sang bảng bị xoá: cột FK phải cho phép NULL, hoặc là users (về tài khoản giữ chỗ)
      if (!fk.tuyChon && fk.toi !== 'User') {
        loi.push({ loai: 'FK_BAT_BUOC_TOI_BANG_XOA', chiTiet: `${model}(${fk.cot.join(',')}) → ${fk.toi}` })
      }
    }
  }
  try { thuTuXoa(bangs) } catch (e) { loi.push({ loai: 'VONG_KHOA_NGOAI', chiTiet: (e as Error).message }) }
  return loi
}

/** Thứ tự xoá các bảng KHÔNG giữ: bảng tham chiếu (con) trước bảng bị tham chiếu (cha). */
export function thuTuXoa(bangs: Bang[]): Bang[] {
  const xoa = bangs.filter((b) => !(b.model in BANG_GIU))
  const tapXoa = new Set(xoa.map((b) => b.model))
  // canhVao[m] = số bảng xoá đang tham chiếu tới m (phải xoá trước m)
  const thamChieuToi = new Map<string, Set<string>>()
  for (const b of xoa) thamChieuToi.set(b.model, new Set())
  for (const b of xoa) for (const fk of b.fk) {
    if (fk.toi !== b.model && tapXoa.has(fk.toi)) thamChieuToi.get(fk.toi)!.add(b.model)
  }
  const ra: Bang[] = []
  const conLai = new Map(xoa.map((b) => [b.model, b]))
  while (conLai.size) {
    const san = [...conLai.keys()].filter((m) => [...thamChieuToi.get(m)!].every((con) => !conLai.has(con)))
    if (!san.length) throw new Error('vòng khoá ngoại giữa: ' + [...conLai.keys()].join(', '))
    for (const m of san.sort()) { ra.push(conLai.get(m)!); conLai.delete(m) }
  }
  return ra
}

// ── Sinh SQL ─────────────────────────────────────────────────────────────────

const q = (ten: string) => `"${ten.replace(/"/g, '""')}"`

function giaTriTrang(c: Cot): string {
  if (c.mang) return `'{}'`
  if (c.tuyChon) return 'NULL'
  if (c.kieu === 'Json') return `'{}'::jsonb`
  if (c.kieu === 'Bytes') return `'\\x'::bytea`
  return `''`
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Võ', 'Đặng', 'Bùi', 'Đỗ']
const DEM = ['Văn', 'Thị', 'Hữu', 'Minh', 'Ngọc', 'Thanh', 'Quốc', 'Thu']
const TEN = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Lan', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vy']
const mangSql = (a: string[]) => `ARRAY[${a.map((s) => `'${s}'`).join(', ')}]`

export function sinhSql(bangs: Bang[]): string {
  const loi = kiemTraQuyTac(bangs)
  if (loi.length) throw new Error('Quy tắc chưa hợp lệ:\n' + loi.map((l) => `${l.loai}: ${l.chiTiet}`).join('\n'))
  const theoModel = new Map(bangs.map((b) => [b.model, b]))
  const tenBang = (m: string) => {
    const b = theoModel.get(m)
    if (!b) throw new Error(`schema thiếu model ${m}`)
    return q(b.bang)
  }
  const users = theoModel.get('User')!.bang
  const [roles, toChuc, chucDanh, canBo] = ['Role', 'ToChuc', 'ChucDanh', 'CanBo'].map(tenBang)
  const bangGiu = Object.keys(BANG_GIU).map((m) => theoModel.get(m)!.bang)
  const L: string[] = []
  L.push('-- SINH TỰ ĐỘNG bởi app/lib/an-danh/an-danh.ts — KHÔNG SỬA TAY. KHÔNG CHẠY TRÊN PRODUCTION.')
  L.push('\\set ON_ERROR_STOP on')
  L.push(`SET client_encoding = 'UTF8';`)
  L.push(`SET standard_conforming_strings = on;`) // '\x' bytea, '\\' trong regex — không phụ thuộc cấu hình phiên
  L.push('\\if :{?mat_khau}')
  L.push('\\else')
  L.push('\\echo THIẾU biến mat_khau (chạy qua scripts/an-danh-hoa.ps1)')
  L.push('\\quit 3')
  L.push('\\endif')
  // psql KHÔNG thay biến bên trong khối DO $$…$$ → kiểm độ dài ở ngoài bằng \gset
  L.push(`SELECT length(:'mat_khau') >= 12 AS mat_khau_dat \\gset`)
  L.push('\\if :mat_khau_dat')
  L.push('\\else')
  L.push('\\echo Mật khẩu staging phải ≥ 12 ký tự')
  L.push('\\quit 3')
  L.push('\\endif')
  // Rào chặn (giảm nhầm lẫn — KHÔNG thay kiểm soát truy cập): tên CSDL + bảng đánh dấu môi trường nội bộ
  // do scripts/an-danh-hoa.ps1 tạo trên BẢN SAO vừa khôi phục (production không bao giờ có bảng này).
  L.push(`DO $$ BEGIN
  IF current_database() IN ('ql_htkt', 'postgres') OR current_database() !~ '(khoi_?phuc|an_?danh)' THEN
    RAISE EXCEPTION 'TỪ CHỐI: CSDL "%" không phải bản khôi phục (tên phải chứa khoi_phuc/an_danh).', current_database();
  END IF;
  IF to_regclass('public.an_danh_moi_truong_noi_bo') IS NULL THEN
    RAISE EXCEPTION 'TỪ CHỐI: thiếu bảng đánh dấu public.an_danh_moi_truong_noi_bo (chỉ tạo trên bản khôi phục nội bộ).';
  END IF;
END $$;`)
  L.push('BEGIN;')
  L.push('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

  // 1. Từ điển định danh GỐC (trước khi xoá) để quét sót ở các bảng giữ
  L.push('CREATE TEMP TABLE an_danh_goc (gia_tri text PRIMARY KEY) ON COMMIT DROP;')
  const nguon: [string, string, 'so' | 'chu'][] = [
    ['CanBo', 'cccd', 'so'], ['CanBo', 'soDienThoai', 'so'], ['CanBo', 'email', 'chu'], ['CanBo', 'hoTen', 'chu'],
    ['User', 'email', 'chu'], ['User', 'phone', 'so'], ['User', 'name', 'chu'],
    ['LanhDaoXa', 'hoTen', 'chu'], ['LanhDaoXa', 'soDienThoai', 'so'],
    ['cchn_ho_so', 'ho_ten', 'chu'], ['cchn_ho_so', 'ma_dinh_danh', 'so'], ['cchn_ho_so', 'dien_thoai', 'so'],
    ['ConCanBo', 'hoTen', 'chu'], ['DsLienHe', 'hoTen', 'chu'], ['DsLienHe', 'dienThoai', 'so'],
    ['PermitVehicle', 'ownerName', 'chu'], ['PermitVehicle', 'plateNumber', 'chu'],
    ['cchn_ho_so', 'email', 'chu'], ['cchn_lich_su', 'nguoi_ten', 'chu'],
    ['httt_dinh_danh', 'ma_dinh_danh', 'so'], ['httt_nang_luc_ca_nhan', 'ho_ten', 'chu'], ['httt_nang_luc_ca_nhan', 'ma_dinh_danh', 'so'],
    ['OfficeLeaveRequest', 'dienThoaiLienHe', 'so'], ['OfficeLeaveRequest', 'nguoiBanGiao', 'chu'],
    ['OversizedVehiclePermit', 'applicantName', 'chu'], ['OversizedVehiclePermit', 'applicantPhone', 'so'],
    ['RoadConnectionApplication', 'applicantName', 'chu'], ['RoadConnectionApplication', 'applicantPhone', 'so'],
    ['Incident', 'reporterName', 'chu'], ['Incident', 'reporterPhone', 'so'],
    ['OvertimeEntry', 'hoTen', 'chu'], ['OvertimeTimesheet', 'nguoiChamCong', 'chu'],
    ['qd72_clearance_measurements', 'nguoi_do', 'chu'], ['BimModelVersion', 'nguoiNopTen', 'chu'],
  ]
  for (const [model, cot, loai] of nguon) {
    const b = theoModel.get(model)
    if (!b?.cot.some((c) => c.ten === cot)) continue
    // số: chỉ giữ chữ số (bắt cả "0913.018.002"); chữ (họ tên/email/biển số): chữ thường, ≥ 8 ký tự
    const bt = loai === 'so' ? `regexp_replace(${q(cot)}, '\\D', '', 'g')` : `lower(trim(${q(cot)}))`
    L.push(`INSERT INTO an_danh_goc SELECT DISTINCT ${bt} FROM public.${q(b.bang)} WHERE ${q(cot)} IS NOT NULL AND length(${bt}) >= 8 ON CONFLICT DO NOTHING;`)
  }

  // 2. Tài khoản giữ chỗ (khoá ngoại bắt buộc từ bảng giữ trỏ tới users)
  L.push(`INSERT INTO ${q(users)} (id, email, name, password, "roleId", "isActive", "updatedAt")
  SELECT '${ID_GIU_CHO}', 'giu-cho@staging.local', 'Tài khoản giữ chỗ (staging)', crypt(gen_random_uuid()::text, gen_salt('bf', 10)),
         (SELECT id FROM ${roles} ORDER BY name LIMIT 1), false, now();`)

  // 3. Bảng giữ: lọc dòng, chuyển/ngắt khoá ngoại sang bảng bị xoá, xoá trắng cột nội dung ngoài danh sách trắng
  for (const [model, g] of Object.entries(BANG_GIU)) {
    const b = theoModel.get(model)!
    if (g.giuDongNeu) L.push(`DELETE FROM ${q(b.bang)} WHERE NOT (${g.giuDongNeu});`)
    const gan: string[] = []
    const cotFkXoa = new Set<string>()
    for (const fk of b.fk) {
      if (fk.toi in BANG_GIU) continue
      for (const c of fk.cot) {
        cotFkXoa.add(c)
        gan.push(`${q(c)} = ${fk.tuyChon ? 'NULL' : `CASE WHEN ${q(c)} IS NULL THEN NULL ELSE '${ID_GIU_CHO}' END`}`)
      }
    }
    for (const c of b.cot) {
      if (cotFkXoa.has(c.ten) || c.ten === 'id' || !laCotNoiDung(c)) continue
      if (g.bienDoi?.[c.ten]) { gan.push(`${q(c.ten)} = ${g.bienDoi[c.ten]}`); continue }
      if (g.cot.includes(c.ten)) continue
      gan.push(`${q(c.ten)} = ${giaTriTrang(c)}`)
    }
    if (gan.length) L.push(`UPDATE ${q(b.bang)} SET\n  ${gan.join(',\n  ')};`)
  }

  // 3b. Lịch sử migration của Prisma (không phải model): giữ tên/checksum để staging biết trạng thái schema, xoá log
  L.push(`DO $$ BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN UPDATE public._prisma_migrations SET logs = NULL; END IF;
END $$;`)

  // 4. Xoá toàn bộ bảng không giữ (con trước cha); users giữ lại tài khoản giữ chỗ
  for (const b of thuTuXoa(bangs)) {
    L.push(b.model === 'User' ? `DELETE FROM ${q(b.bang)} WHERE id <> '${ID_GIU_CHO}';` : `DELETE FROM ${q(b.bang)};`)
  }

  // Manifest cột Prisma của các bảng giữ — cột nội dung có trong CSDL thực mà KHÔNG có trong Prisma (do SQL tay thêm)
  // thì công cụ không biết để xoá trắng → phải từ chối.
  const manifest: Record<string, string[]> = {}
  for (const m of Object.keys(BANG_GIU)) { const b = theoModel.get(m)!; manifest[b.bang] = b.cot.map((c) => c.ten) }

  // 5. Hậu điều kiện — chạy TRƯỚC khi sinh dữ liệu giả (tên giả có thể trùng tên người thật → báo nhầm).
  //    Bất kỳ điều kiện nào sai → RAISE → ROLLBACK → script bọc KHÔNG xuất dump.
  L.push(`DO $$
DECLARE r record; n bigint; tong bigint := 0; bao text := ''; tu_dien bigint;
  giu text[] := ${mangSql([...bangGiu, '_prisma_migrations'])};
  manifest jsonb := '${JSON.stringify(manifest)}'::jsonb;
BEGIN
  -- 5a. Chỉ có schema public (ngoài schema hệ thống); không large object; không materialized view
  SELECT count(*) INTO n FROM pg_namespace WHERE nspname NOT IN ('public', 'information_schema') AND nspname NOT LIKE 'pg\\_%';
  IF n > 0 THEN RAISE EXCEPTION 'Có % schema ngoài public — không xác minh được, dừng.', n; END IF;
  SELECT count(*) INTO n FROM pg_largeobject_metadata;
  IF n > 0 THEN RAISE EXCEPTION 'Có % large object — không xác minh được, dừng.', n; END IF;
  SELECT count(*) INTO n FROM pg_matviews WHERE schemaname = 'public';
  IF n > 0 THEN RAISE EXCEPTION 'Có % materialized view — không xác minh được, dừng.', n; END IF;
  -- 5b. MỌI bảng không thuộc danh sách giữ phải rỗng (kể cả bảng tạo bằng SQL tay, không có trong Prisma)
  FOR r IN SELECT table_name AS bang FROM information_schema.tables
           WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND NOT (table_name = ANY (giu)) LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.bang) INTO n;
    IF r.bang = '${users}' THEN n := n - 1; END IF; -- tài khoản giữ chỗ
    IF n > 0 THEN tong := tong + n; bao := bao || format(E'\\n  bảng không giữ %s còn %s dòng', r.bang, n); END IF;
  END LOOP;
  -- 5b'. Bảng giữ: không có cột nội dung lạ ngoài manifest Prisma
  FOR r IN SELECT table_name AS bang, column_name AS cot FROM information_schema.columns
           WHERE table_schema = 'public' AND manifest ? table_name
             AND data_type IN ('text', 'character varying', 'jsonb', 'json', 'ARRAY', 'bytea', 'USER-DEFINED')
             AND NOT ((manifest -> table_name) ? column_name) LOOP
    tong := tong + 1; bao := bao || format(E'\\n  cột ngoài manifest Prisma: %s.%s', r.bang, r.cot);
  END LOOP;
  -- 5c. Không còn cột nhị phân nào có dữ liệu
  FOR r IN SELECT table_name AS bang, column_name AS cot FROM information_schema.columns
           WHERE table_schema = 'public' AND data_type = 'bytea' LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE length(%I) > 0', r.bang, r.cot) INTO n;
    IF n > 0 THEN tong := tong + n; bao := bao || format(E'\\n  nhị phân %s.%s: %s dòng', r.bang, r.cot, n); END IF;
  END LOOP;
  -- 5d. Quét định danh gốc (so khớp LITERAL bằng position, không wildcard) trong mọi cột văn bản/Json/mảng
  SELECT count(*) INTO tu_dien FROM an_danh_goc;
  FOR r IN SELECT c.table_name AS bang, c.column_name AS cot FROM information_schema.columns c
           JOIN information_schema.tables t USING (table_schema, table_name)
           WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
             AND c.data_type IN ('text', 'character varying', 'jsonb', 'json', 'ARRAY') LOOP
    EXECUTE format($q$SELECT count(*) FROM public.%I x WHERE EXISTS (SELECT 1 FROM an_danh_goc g
      WHERE position(g.gia_tri IN lower(x.%I::text)) > 0
         OR position(g.gia_tri IN regexp_replace(x.%I::text, '[\\s.\\-]', '', 'g')) > 0)$q$, r.bang, r.cot, r.cot) INTO n;
    IF n > 0 THEN tong := tong + n; bao := bao || format(E'\\n  %s.%s: %s dòng', r.bang, r.cot, n); END IF;
  END LOOP;
  IF tong > 0 THEN RAISE EXCEPTION 'DỮ LIỆU STAGING CHƯA SẠCH — % dòng:%', tong, bao; END IF;
  IF tu_dien = 0 THEN RAISE EXCEPTION 'Từ điển định danh gốc rỗng — bản khôi phục bất thường, không xác minh được.'; END IF;
  RAISE NOTICE 'HAU_DIEU_KIEN_DAT (từ điển % giá trị gốc; bảng không giữ rỗng; manifest khớp; nhị phân rỗng; chỉ schema public).', tu_dien;
END $$;`)

  // 6. Dữ liệu GIẢ: mỗi vai trò 1 tài khoản <tên vai trò>@staging.local + 40 cán bộ giả; CHỈ N cán bộ đầu
  //    (N = số vai trò) gắn tài khoản, số còn lại không có tài khoản — chủ ý, đủ cho kiểm thử quyền.
  L.push(`INSERT INTO ${q(users)} (id, email, name, password, "roleId", "isActive", "mustChangePassword", "updatedAt")
  SELECT 'staging-' || r.name, r.name || '@staging.local', 'Tài khoản thử ' || r."displayName",
         crypt(:'mat_khau', gen_salt('bf', 10)), r.id, true, false, now()
  FROM ${roles} r;`)
  L.push(`WITH tk AS (SELECT id, row_number() OVER (ORDER BY id) AS n FROM ${q(users)} WHERE id LIKE 'staging-%'),
     tc AS (SELECT id, row_number() OVER (ORDER BY ma) AS n, count(*) OVER () AS tong FROM ${toChuc}),
     cd AS (SELECT id, row_number() OVER (ORDER BY ma) AS n, count(*) OVER () AS tong FROM ${chucDanh})
INSERT INTO ${canBo} (id, cccd, "hoTen", email, "soDienThoai", "ngaySinh", "heSoLuong", "phuCap", "vuotKhung",
                    "ngayNangLuongKeTiep", "toChucId", "chucDanhId", "userId", "updatedAt")
SELECT 'staging-cb-' || g, '099' || lpad(g::text, 9, '0'),
       (${mangSql(HO)})[1 + g % ${HO.length}] || ' ' || (${mangSql(DEM)})[1 + (g / 3) % ${DEM.length}] || ' ' || (${mangSql(TEN)})[1 + (g * 7) % ${TEN.length}],
       'cb' || g || '@staging.local', '0999' || lpad(g::text, 6, '0'),
       make_date(1965 + g % 35, 1 + g % 12, 1 + g % 28), round((2.34 + (g % 20) * 0.33)::numeric, 2), CASE WHEN g % 5 = 0 THEN 0.3 ELSE NULL END,
       CASE WHEN g % 9 = 0 THEN 5 ELSE NULL END, make_date(extract(year FROM now())::int, 1 + g % 12, 1),
       (SELECT id FROM tc WHERE tc.n = 1 + g % tc.tong), (SELECT id FROM cd WHERE cd.n = 1 + g % cd.tong),
       (SELECT id FROM tk WHERE tk.n = g), now()
FROM generate_series(1, 40) AS g;`)
  L.push('DROP TABLE an_danh_moi_truong_noi_bo;') // không mang bảng đánh dấu sang staging
  L.push('COMMIT;')
  return L.join('\n') + '\n'
}
