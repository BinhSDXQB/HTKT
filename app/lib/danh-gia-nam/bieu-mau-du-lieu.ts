// Dữ liệu NHẬP của các biểu mẫu (lưu vào cột jsonb "bieuMau" của office_year_reviews / office_year_dept_reviews — mig 058).
// Hàm thuần: danh sách ô theo đúng thứ tự, câu chữ của bản gốc (CV 6862/SNV-CBCCVC); chuẩn hoá + kiểm tra dữ liệu gửi lên;
// tính điểm KPI từ các dòng Mẫu 04. Không chạm CSDL.
import { tinhNhomKpi, DIEM_NHOM_A, DIEM_NHOM_B, type DongKpi, type MucXepLoaiMa } from './tieu-chi'

export const MUC_HOP_LE: readonly MucXepLoaiMa[] = ['HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU']
const DAI_TOI_DA = 8000

// ── Phần A của Mẫu 2A/2B/2C (cá nhân tự viết) ─────────────────────────────
export type ONhap = { ma: string; nhan: string; goiY?: string }

const A_CHUNG: ONhap[] = [
  { ma: 'A_I_1', nhan: 'I.1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc.' },
  { ma: 'A_I_2', nhan: 'I.2. Việc thực hiện nhiệm vụ, quyền hạn và kết quả thực hiện các chỉ tiêu, nhiệm vụ được giao trong năm, gắn với hiệu quả, tiến độ, chất lượng công việc.' },
  { ma: 'A_I_3', nhan: 'I.3. Việc thực hiện cam kết tu dưỡng, rèn luyện, phấn đấu của cá nhân theo quy định.' },
]
const A_LANH_DAO: ONhap[] = [
  { ma: 'A_I_4', nhan: 'I.4. Kết quả công tác lãnh đạo, chỉ đạo, quản lý, điều hành; thực hiện chức trách, nhiệm vụ; mức độ hoàn thành nhiệm vụ của các cấp uỷ, tổ chức đảng trực thuộc, địa phương, tổ chức, cơ quan, đơn vị thuộc quyền quản lý; khả năng quy tụ, xây dựng đoàn kết nội bộ.' },
  { ma: 'A_I_5', nhan: 'I.5. Trách nhiệm trong công việc; tinh thần năng động, đổi mới sáng tạo, dám nghĩ, dám nói, dám làm, dám chịu trách nhiệm…; trách nhiệm trong xây dựng đội ngũ cán bộ, kiểm soát quyền lực, phòng, chống tiêu cực…; xử lý những vấn đề khó, phức tạp, nhạy cảm trong thực hiện nhiệm vụ.' },
  { ma: 'A_I_6', nhan: 'I.6. Trách nhiệm nêu gương của bản thân và gia đình; việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí…; sự tín nhiệm của cán bộ, đảng viên; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết…' },
]
const A_2C_1: ONhap = { ma: 'A_I_1', nhan: 'I.1. Về phẩm chất chính trị, đạo đức, lối sống; tinh thần đoàn kết, thống nhất trong nội bộ; ý thức tổ chức kỷ luật, trách nhiệm nêu gương, việc thực hiện những điều đảng viên không được làm; tác phong, lề lối làm việc; việc đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí…; việc học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh; việc nghiên cứu, học tập và triển khai nghị quyết.' }
const A_SAU: ONhap[] = [
  { ma: 'A_II_1', nhan: 'II.1. Hạn chế, khuyết điểm.' },
  { ma: 'A_II_2', nhan: 'II.2. Nguyên nhân của hạn chế, khuyết điểm.' },
  { ma: 'A_III', nhan: 'III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', goiY: 'Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của cá nhân.' },
  { ma: 'A_IV', nhan: 'IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)', goiY: 'Giải trình từng vấn đề được gợi ý kiểm điểm, nêu nguyên nhân, xác định trách nhiệm của cá nhân đối với từng vấn đề được gợi ý kiểm điểm.' },
  { ma: 'A_V', nhan: 'V. Làm rõ trách nhiệm của cá nhân đối với những hạn chế, khuyết điểm của tập thể (nếu có)' },
  { ma: 'A_VI', nhan: 'VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm' },
]

export function oPhanA(ma: '2A' | '2B' | '2C'): ONhap[] {
  return ma === '2C' ? [A_2C_1, A_CHUNG[1], A_CHUNG[2], ...A_SAU] : [...A_CHUNG, ...A_LANH_DAO, ...A_SAU]
}

// ── Mẫu 01 (tập thể) ────────────────────────────────────────────────────────
export const O_MAU_01: ONhap[] = [
  { ma: 'A_I_1', nhan: 'I.1. Việc chấp hành nguyên tắc tổ chức và hoạt động, nhất là nguyên tắc tập trung dân chủ; thực hiện quy chế làm việc.' },
  { ma: 'A_I_2', nhan: 'I.2. Kết quả thực hiện các mục tiêu, chỉ tiêu, nhiệm vụ được đề ra trong nghị quyết đại hội nhiệm kỳ, kế hoạch, chương trình công tác năm, được cấp có thẩm quyền giao, phê duyệt và các nhiệm vụ phát sinh, đột xuất được cấp có thẩm quyền giao.' },
  { ma: 'A_I_3', nhan: 'I.3. Công tác xây dựng, chỉnh đốn Đảng và hệ thống chính trị; xây dựng tổ chức bộ máy tinh gọn…; năng lực, trách nhiệm của tập thể lãnh đạo, quản lý; trách nhiệm nêu gương; trách nhiệm giải trình; công tác đấu tranh phòng, chống tham nhũng, tiêu cực, lãng phí…; công tác kiểm tra, giám sát, kỷ luật đảng và công tác tiếp công dân, giải quyết khiếu nại, tố cáo…' },
  { ma: 'A_I_4', nhan: 'I.4. Trách nhiệm của tập thể lãnh đạo, quản lý trong triển khai thực hiện các chủ trương, đường lối, nghị quyết, văn bản chỉ đạo của Đảng, của cấp trên; thực hiện nhiệm vụ chính trị của địa phương, tổ chức, cơ quan, đơn vị.' },
  { ma: 'A_II_1', nhan: 'II. Hạn chế, khuyết điểm.' },
  { ma: 'A_II_2', nhan: 'II. Nguyên nhân của hạn chế, khuyết điểm.' },
  { ma: 'A_III', nhan: 'III. Kết quả khắc phục những hạn chế, khuyết điểm đã được cấp có thẩm quyền kết luận hoặc được chỉ ra ở các kỳ kiểm điểm trước', goiY: 'Kiểm điểm rõ từng hạn chế, khuyết điểm (đã được khắc phục; đang khắc phục, mức độ khắc phục; chưa được khắc phục); những khó khăn, vướng mắc (nếu có); trách nhiệm của tập thể, cá nhân có liên quan.' },
  { ma: 'A_IV', nhan: 'IV. Giải trình những vấn đề được gợi ý kiểm điểm (nếu có)' },
  { ma: 'A_V', nhan: 'V. Trách nhiệm của tập thể, cá nhân', goiY: 'Về hạn chế, khuyết điểm trong thực hiện nhiệm vụ hoặc khi có dấu hiệu vi phạm; để xảy ra những vấn đề bức xúc, phức tạp…; trì trệ, yếu kém, không hoàn thành chức trách, nhiệm vụ được giao.' },
  { ma: 'A_VI', nhan: 'VI. Phương hướng, biện pháp khắc phục hạn chế, khuyết điểm' },
]
/** 6 tiêu chí chung của tập thể, mỗi tiêu chí tối đa 5 điểm (Mẫu 01 mục B.I.1). */
export const TIEU_CHI_TAP_THE: readonly string[] = [
  'Kết quả công tác xây dựng, chỉnh đốn Đảng; củng cố, xây dựng tổ chức đảng và hệ thống chính trị; nâng cao chất lượng đội ngũ cán bộ, đảng viên theo nghị quyết, kế hoạch, chỉ tiêu được giao.',
  'Năng lực lãnh đạo của cấp uỷ; hiệu quả lãnh đạo, chỉ đạo của cấp uỷ đối với chính quyền, Mặt trận Tổ quốc và các tổ chức chính trị - xã hội; hiệu quả trong phối hợp công tác; xây dựng đoàn kết nội bộ.',
  'Hiệu quả trong công tác thanh tra, kiểm tra, giám sát và kỷ luật đảng; thực hiện các quy định về kiểm soát quyền lực; không để xảy ra tham nhũng, lãng phí, tiêu cực, suy thoái về tư tưởng chính trị, đạo đức, lối sống, "tự diễn biến", "tự chuyển hoá" trong nội bộ.',
  'Kết quả thực hiện các nguyên tắc tổ chức và hoạt động của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình; việc chấp hành quy chế làm việc, nội quy, chế độ công tác; phân công nhiệm vụ, tổ chức thực hiện hiệu quả.',
  'Kết quả lãnh đạo, chỉ đạo, kiểm tra, giám sát việc thực hiện nhiệm vụ chính trị; xây dựng bộ máy tinh gọn, tinh giản biên chế, hoạt động hiệu năng, hiệu lực, hiệu quả; thực hiện cải cách hành chính, chuyển đổi số, đẩy mạnh ứng dụng khoa học, công nghệ, phương pháp quản lý gắn với xây dựng văn hoá công vụ trong hoạt động quản lý, điều hành tổ chức, cơ quan, đơn vị.',
  'Tinh thần tự phê bình và phê bình, tự soi, tự sửa của tập thể; kết quả khắc phục những hạn chế, yếu kém, khuyết điểm đã được chỉ ra trong các kỳ kiểm điểm trước hoặc qua thanh tra, kiểm tra, giám sát.',
]

// ── Kiểu dữ liệu lưu ────────────────────────────────────────────────────────
export type DongM04 = DongKpi & { nhiemVu: string; congViec?: string; sanPham?: string; hanHoanThanh?: string; ngayHoanThanh?: string }
export type BangIII = Record<'A' | 'B', { tong?: number | null; vuot?: number | null; dotPha?: number | null; khongHoanThanh?: number | null }>

export type BieuMauCaNhan = {
  phanA?: Record<string, string>
  tuNhanMuc?: MucXepLoaiMa | null
  m04?: { A: DongM04[]; B: DongM04[] }
  bangIII?: BangIII
  /** C.I (Mẫu 2B/2C): ý kiến người đứng đầu đơn vị cấu thành */
  yKienDonViCauThanh?: string
  /** Mẫu 03: mức xếp loại từng quý + đề xuất phương án xử lý */
  m03?: { mucQuy?: Partial<Record<'I' | 'II' | 'III' | 'IV', MucXepLoaiMa | null>>; deXuatXuLy?: string }
  /** Họp đánh giá của TẬP THỂ PHÒNG: cùng điểm vẫn phải có nhận xét của tập thể trước khi đề xuất mức */
  hopTapThe?: HopTapThe
}

export type HopTapThe = {
  ngayHop?: string
  chuTri?: string
  soNguoiDuHop?: number | null
  /** Ý kiến nhận xét của tập thể phòng về cá nhân (bắt buộc trước khi trình phê duyệt) */
  yKien?: string
  /** Kết quả biểu quyết mức đề xuất (nếu có): số phiếu từng mức */
  bieuQuyet?: Partial<Record<MucXepLoaiMa, number | null>>
  /** Mức tập thể phòng đề xuất sau họp */
  mucTapTheDeXuat?: MucXepLoaiMa | null
}

export type BieuMauTapThe = {
  phanA?: Record<string, string>
  diemChung6?: (number | null)[]
  kpiA?: number | null
  kpiB?: number | null
  bangIII?: BangIII
}

// ── Chuẩn hoá dữ liệu gửi lên ───────────────────────────────────────────────
const chu = (v: unknown): string => String(v ?? '').replace(/\r\n/g, '\n').slice(0, DAI_TOI_DA)

/** Ô nào dài quá giới hạn thì trả tên ô để báo lỗi (không cắt âm thầm). */
export function oQuaDai(raw: Record<string, unknown>): string | null {
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string' && v.length > DAI_TOI_DA) return k
  return null
}
export const SO_DONG_TOI_DA = 300
function so(v: unknown, min = 0, max = 1e9): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return NaN
  return n < min || n > max ? NaN : n
}
const muc = (v: unknown): MucXepLoaiMa | null => (MUC_HOP_LE.includes(v as MucXepLoaiMa) ? (v as MucXepLoaiMa) : null)

export type KetQuaChuanHoa<T> = { ok: true; giaTri: T } | { ok: false; loi: string }

/** Chỉ nhận các ô có trong danh sách (không cho ghi khoá lạ vào jsonb). */
export function chuanHoaPhanA(raw: Record<string, unknown>, o: ONhap[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const x of o) if (raw[x.ma] !== undefined) out[x.ma] = chu(raw[x.ma])
  return out
}

export function chuanHoaDongM04(raw: Record<string, unknown>[]): KetQuaChuanHoa<DongM04[]> {
  if (raw.length > SO_DONG_TOI_DA) return { ok: false, loi: `Tối đa ${SO_DONG_TOI_DA} dòng mỗi nhóm.` }
  const out: DongM04[] = []
  for (const [i, r] of raw.entries()) {
    const nhiemVu = chu(r.nhiemVu).trim()
    const coSo = ['diemDanhMuc', 'soLuong', 'hoanThanhThucTe', 'soLanChinhSua', 'soNgayCham'].some((k) => r[k] !== undefined && r[k] !== '')
    if (!nhiemVu && !coSo) continue // dòng trống bỏ qua
    if (!nhiemVu) return { ok: false, loi: `Dòng ${i + 1}: chưa nhập nhiệm vụ / công việc.` }
    const d = so(r.diemDanhMuc, 0, 100000), sl = so(r.soLuong, 0, 10000), ht = so(r.hoanThanhThucTe, 0, 10000)
    const cs = so(r.soLanChinhSua, 0, 100), ch = so(r.soNgayCham, 0, 3650)
    for (const [ten, v] of [['điểm danh mục', d], ['số lượng', sl], ['hoàn thành thực tế', ht], ['số lần chỉnh sửa', cs], ['số ngày chậm', ch]] as const) {
      if (Number.isNaN(v)) return { ok: false, loi: `Dòng ${i + 1} (${nhiemVu.slice(0, 40)}): ${ten} không hợp lệ.` }
    }
    if ((ht ?? 0) > (sl ?? 0)) return { ok: false, loi: `Dòng ${i + 1} (${nhiemVu.slice(0, 40)}): số hoàn thành thực tế lớn hơn số lượng giao.` }
    out.push({
      nhiemVu, congViec: chu(r.congViec), sanPham: chu(r.sanPham), hanHoanThanh: chu(r.hanHoanThanh).slice(0, 20), ngayHoanThanh: chu(r.ngayHoanThanh).slice(0, 20),
      diemDanhMuc: d ?? 0, soLuong: sl ?? 0, hoanThanhThucTe: ht ?? 0, soLanChinhSua: cs ?? 0, soNgayCham: ch ?? 0,
    })
  }
  return { ok: true, giaTri: out }
}

export function chuanHoaBangIII(raw: Record<string, unknown>): KetQuaChuanHoa<BangIII> {
  const out = { A: {}, B: {} } as BangIII
  for (const nhom of ['A', 'B'] as const) {
    for (const k of ['tong', 'vuot', 'dotPha', 'khongHoanThanh'] as const) {
      const v = so(raw[`${nhom}_${k}`], 0, 100000)
      if (Number.isNaN(v)) return { ok: false, loi: `Bảng III nhóm ${nhom}: số không hợp lệ.` }
      out[nhom][k] = v
    }
    const t = out[nhom]
    if (t.tong !== null && t.tong !== undefined && [t.vuot, t.dotPha, t.khongHoanThanh].some((x) => (x ?? 0) > (t.tong ?? 0))) {
      return { ok: false, loi: `Bảng III nhóm ${nhom}: số vượt / đột phá / không hoàn thành không được lớn hơn tổng.` }
    }
  }
  return { ok: true, giaTri: out }
}

export function chuanHoaMucQuy(raw: Record<string, unknown>): Partial<Record<'I' | 'II' | 'III' | 'IV', MucXepLoaiMa | null>> {
  const out: Partial<Record<'I' | 'II' | 'III' | 'IV', MucXepLoaiMa | null>> = {}
  for (const q of ['I', 'II', 'III', 'IV'] as const) if (raw[`mucQuy_${q}`] !== undefined) out[q] = muc(raw[`mucQuy_${q}`])
  return out
}

export function chuanHoaMuc(v: unknown): MucXepLoaiMa | null { return muc(v) }

/** Họp đánh giá tập thể phòng: ngày yyyy-mm-dd; số phiếu không âm và tổng không vượt số người dự họp. */
export function chuanHoaHop(raw: Record<string, unknown>): KetQuaChuanHoa<HopTapThe> {
  const ngay = String(raw.ngayHop ?? '').trim()
  if (ngay && !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return { ok: false, loi: 'Ngày họp không hợp lệ.' }
  const duHop = so(raw.soNguoiDuHop, 0, 500)
  if (Number.isNaN(duHop)) return { ok: false, loi: 'Số người dự họp không hợp lệ.' }
  const bieuQuyet: Partial<Record<MucXepLoaiMa, number | null>> = {}
  let tong = 0
  for (const m of MUC_HOP_LE) {
    const v = so(raw[`phieu_${m}`], 0, 500)
    if (Number.isNaN(v)) return { ok: false, loi: 'Số phiếu biểu quyết không hợp lệ.' }
    bieuQuyet[m] = v
    tong += v ?? 0
  }
  if (duHop !== null && tong > duHop) return { ok: false, loi: `Tổng số phiếu (${tong}) lớn hơn số người dự họp (${duHop}).` }
  return { ok: true, giaTri: {
    ngayHop: ngay || undefined, chuTri: chu(raw.chuTri).slice(0, 200), soNguoiDuHop: duHop, yKien: chu(raw.yKien),
    bieuQuyet, mucTapTheDeXuat: muc(raw.mucTapTheDeXuat),
  } }
}

/** Đã có nhận xét của tập thể phòng (điều kiện để trình phê duyệt). */
export function coNhanXetTapThe(b?: BieuMauCaNhan | null): boolean {
  return !!b?.hopTapThe?.yKien?.trim()
}

export function chuanHoaDiemTapThe(raw: Record<string, unknown>): KetQuaChuanHoa<Pick<BieuMauTapThe, 'diemChung6' | 'kpiA' | 'kpiB'>> {
  const diem: (number | null)[] = []
  for (let i = 0; i < 6; i++) {
    const v = so(raw[`tc_${i + 1}`], 0, 5)
    if (Number.isNaN(v)) return { ok: false, loi: `Tiêu chí ${i + 1}: điểm từ 0 đến 5.` }
    diem.push(v)
  }
  const kpiA = so(raw.kpiA, 0, DIEM_NHOM_A), kpiB = so(raw.kpiB, 0, DIEM_NHOM_B)
  if (Number.isNaN(kpiA)) return { ok: false, loi: `Điểm KPI nhiệm vụ trọng tâm từ 0 đến ${DIEM_NHOM_A}.` }
  if (Number.isNaN(kpiB)) return { ok: false, loi: `Điểm KPI nhiệm vụ thường xuyên từ 0 đến ${DIEM_NHOM_B}.` }
  return { ok: true, giaTri: { diemChung6: diem, kpiA, kpiB } }
}

/** Số quý xuất sắc / không hoàn thành theo mức quý ghi ở Mẫu 03 (null nếu Mẫu 03 chưa ghi quý nào). */
export function demQuyMau03(b?: BieuMauCaNhan | null): { xs: number; kht: number } | null {
  const m = b?.m03?.mucQuy
  if (!m || !Object.values(m).some(Boolean)) return null
  const v = Object.values(m)
  return { xs: v.filter((x) => x === 'HOAN_THANH_XUAT_SAC_NHIEM_VU').length, kht: v.filter((x) => x === 'KHONG_HOAN_THANH_NHIEM_VU').length }
}

// ── Tính điểm ──────────────────────────────────────────────────────────────
/** Điểm KPI tổng (≤100) từ các dòng Mẫu 04: nhóm A tối đa 10, nhóm B tối đa 90. Không có dòng nào thì null. */
export function kpiTuMau04(m04?: { A: DongM04[]; B: DongM04[] } | null): { A: ReturnType<typeof tinhNhomKpi>; B: ReturnType<typeof tinhNhomKpi>; tong: number | null } {
  const A = tinhNhomKpi(m04?.A ?? [], DIEM_NHOM_A)
  const B = tinhNhomKpi(m04?.B ?? [], DIEM_NHOM_B)
  const coDong = (m04?.A?.length ?? 0) + (m04?.B?.length ?? 0) > 0
  return { A, B, tong: coDong ? Math.round((A.diemDat + B.diemDat) * 1e6) / 1e6 : null }
}

/** Tổng điểm tập thể = 6 tiêu chí (≤30) + (KPI A + KPI B) × 70/100. */
/** Đủ dữ liệu để TRÌNH: đủ 6 điểm tiêu chí chung và cả hai điểm KPI. */
export function duDiemTapThe(b: BieuMauTapThe): boolean {
  const ds = b.diemChung6 ?? []
  return ds.length === 6 && ds.every((x) => x !== null && x !== undefined) && b.kpiA !== null && b.kpiA !== undefined && b.kpiB !== null && b.kpiB !== undefined
}

export function tongDiemTapThe(b: BieuMauTapThe): { chung: number | null; nhiemVu: number | null; tong: number | null } {
  const ds = b.diemChung6 ?? []
  const chung = ds.some((x) => x !== null && x !== undefined) ? ds.reduce<number>((t, x) => t + (x ?? 0), 0) : null
  const kpi = b.kpiA === null || b.kpiA === undefined || b.kpiB === null || b.kpiB === undefined ? null : b.kpiA + b.kpiB
  const nhiemVu = kpi === null ? null : Math.round(kpi * 70) / 100
  return { chung, nhiemVu, tong: chung === null || nhiemVu === null ? null : Math.round((chung + nhiemVu) * 100) / 100 }
}

// ── Mẫu 05 / 06 / 07: tổng hợp từ kết quả ĐÃ PHÊ DUYỆT ─────────────────────
export type DongTongHop = { hoTen: string; viTri: string; doiTuong: 'CONG_CHUC' | 'VIEN_CHUC' | 'NGUOI_LAO_DONG' | null; laLanhDao: boolean; muc: MucXepLoaiMa | null; ghiChu?: string }

export type HangMau05 = { nhan: string; tong: number; theoMuc: Record<MucXepLoaiMa, number>; ghiChu: string }

function demHang(nhan: string, ds: DongTongHop[]): HangMau05 {
  const theoMuc = Object.fromEntries(MUC_HOP_LE.map((m) => [m, 0])) as Record<MucXepLoaiMa, number>
  for (const d of ds) if (d.muc) theoMuc[d.muc]++
  const ghiChu = ds.filter((d) => d.muc === 'KHONG_HOAN_THANH_NHIEM_VU').map((d) => `${d.hoTen}${d.ghiChu ? `: ${d.ghiChu}` : ''}`).join('; ')
  return { nhan, tong: ds.length, theoMuc, ghiChu }
}

/** Mẫu 05 (công chức) cho một Sở: 1.2 công chức giữ chức vụ lãnh đạo, quản lý; 1.3 công chức không giữ chức vụ. Mục 1.1 "Cán bộ" (diện bầu cử) Sở không có. */
export function lapMau05(ds: DongTongHop[]): HangMau05[] {
  const cc = ds.filter((d) => d.doiTuong === 'CONG_CHUC')
  return [demHang('Công chức giữ chức vụ lãnh đạo, quản lý', cc.filter((d) => d.laLanhDao)), demHang('Công chức không giữ chức vụ lãnh đạo, quản lý', cc.filter((d) => !d.laLanhDao))]
}
/** Mẫu 06 (viên chức): 1.1 viên chức quản lý; 1.2 viên chức không giữ chức vụ quản lý. */
export function lapMau06(ds: DongTongHop[]): HangMau05[] {
  const vc = ds.filter((d) => d.doiTuong === 'VIEN_CHUC')
  return [demHang('Viên chức quản lý', vc.filter((d) => d.laLanhDao)), demHang('Viên chức không giữ chức vụ quản lý', vc.filter((d) => !d.laLanhDao))]
}
/** Người đã phê duyệt nhưng hồ sơ chưa ghi đối tượng (công chức / viên chức): không được tính vào Mẫu 05/06, phải báo. */
export function chuaPhanLoai(ds: DongTongHop[]): DongTongHop[] {
  return ds.filter((d) => d.doiTuong !== 'CONG_CHUC' && d.doiTuong !== 'VIEN_CHUC')
}

export function tyLe(n: number, tong: number): string {
  return tong ? `${(Math.round((n / tong) * 1000) / 10).toString().replace('.', ',')}` : ''
}
