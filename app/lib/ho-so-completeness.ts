// Kiểm tra mức độ đầy đủ của hồ sơ cán bộ theo biểu QLNS 53 cột.
// Trả về danh sách CỤ THỂ từng mục còn thiếu, chia 2 mức:
//   - 'required'    (BẮT BUỘC): thiếu là cảnh báo đỏ — ảnh hưởng nghiệp vụ (lương, ngạch, nghỉ hưu).
//   - 'recommended' (KHUYẾN NGHỊ): nên bổ sung cho đủ biểu QLNS.
//
// Các cột TỰ ĐỘNG/ TÍNH ĐỘNG không tính vào thiếu: quê quán sau hợp nhất (H, tự chuyển),
// ngày về hưu (S, tính theo NĐ 135), ngày bổ nhiệm tiếp theo (R = Q+5), tuổi đời/tuổi Đảng.

export type CompletenessTier = 'required' | 'recommended'

export type MissingItem = {
  field: string
  label: string   // nhãn kèm cột biểu QLNS, vd "Mã ngạch (cột T)"
  tier: CompletenessTier
}

export type CompletenessResult = {
  missingRequired: MissingItem[]
  missingRecommended: MissingItem[]
  totalChecked: number
  filled: number
  /** 0..100 — tỉ lệ mục đã có / tổng mục được kiểm tra (theo điều kiện áp dụng). */
  percent: number
  hasRequiredGap: boolean
}

/** Dữ liệu tối thiểu cần để kiểm tra (khớp tên cột Prisma của CanBo). */
export type HoSoForCheck = {
  cccd?: string | null
  hoTen?: string | null
  gioiTinh?: string | null
  ngaySinh?: Date | string | null
  queQuanTruoc?: string | null
  noiOTruoc?: string | null
  noiOHienNay?: string | null
  doiTuong?: string | null
  viTriViecLam?: string | null
  loaiHopDong?: string | null
  ngayKetThucHopDong?: Date | string | null
  loaiHinh?: string | null
  ngayVaoBienChe?: Date | string | null
  boNhiemLanDau?: string | null
  ngayBoNhiemGanNhat?: Date | string | null
  maNgach?: string | null
  bacLuong?: number | null
  heSoLuong?: number | null
  ngachHienHuong?: string | null
  ngayBoNhiemNgach?: Date | string | null
  ngayNangLuong?: Date | string | null
  ngayNangLuongKeTiep?: Date | string | null
  trinhDoChuyenMon?: string | null
  chuyenNganh?: string | null
  namTotNghiep?: string | null
  heDaoTao?: string | null
  trinhDoQLNN?: string | null
  namDaoTaoQLNN?: string | null
  trinhDoLLCT?: string | null
  namDaoTaoLLCT?: string | null
  trinhDoNgoaiNgu?: string | null
  namDaoTaoNgoaiNgu?: string | null
  trinhDoTinHoc?: string | null
  namDaoTaoTinHoc?: string | null
  soTheDang?: string | null
  ngayKetNapDang?: Date | string | null
  ngayVaoDangChinhThuc?: Date | string | null
  chiBo?: string | null
  soDienThoai?: string | null
  email?: string | null
  toChucId?: string | null
  phongBan?: string | null
  chucDanhId?: string | null
  chucVu?: string | null
}

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === '' || v.trim() === '-'
  return false
}

/** CCCD tạm (tiền tố TAM-) coi như chưa có số CCCD thật. */
function cccdMissing(cccd?: string | null): boolean {
  return isBlank(cccd) || (typeof cccd === 'string' && cccd.startsWith('TAM-'))
}

/** Là đảng viên nếu có bất kỳ thông tin Đảng nào → khi đó các mục Đảng còn thiếu mới bị nhắc. */
function laDangVien(cb: HoSoForCheck): boolean {
  return !isBlank(cb.soTheDang) || !isBlank(cb.ngayKetNapDang) ||
    !isBlank(cb.ngayVaoDangChinhThuc) || !isBlank(cb.chiBo)
}

/**
 * Là biên chế (công chức/viên chức) — ưu tiên trường `doiTuong`; nếu chưa phân loại thì
 * suy từ loại hình bắt đầu bằng "BC" (BCHC, BCSN...). Người LAO ĐỘNG (HĐ111, HĐTV, LX BP...)
 * hưởng lương khoán, KHÔNG có ngạch/bậc nên các mục ngạch/bậc/nâng lương không bắt buộc.
 */
function laBienChe(cb: HoSoForCheck): boolean {
  if (cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') return true
  if (cb.doiTuong === 'NGUOI_LAO_DONG') return false
  const lh = (cb.loaiHinh ?? '').trim().toUpperCase()
  if (lh === '') return true
  return lh.startsWith('BC')
}

type FieldDef = {
  field: string
  label: string
  tier: CompletenessTier
  empty: (cb: HoSoForCheck) => boolean
  when?: (cb: HoSoForCheck) => boolean // chỉ kiểm tra khi điều kiện đúng
}

const FIELDS: FieldDef[] = [
  // ── Nhân thân (BẮT BUỘC) ──
  { field: 'cccd',         label: 'Số CCCD (cột BA)',                tier: 'required',    empty: (c) => cccdMissing(c.cccd) },
  { field: 'gioiTinh',     label: 'Giới tính (cột F)',               tier: 'required',    empty: (c) => isBlank(c.gioiTinh) },
  { field: 'ngaySinh',     label: 'Ngày sinh (cột E)',               tier: 'required',    empty: (c) => isBlank(c.ngaySinh) },
  { field: 'queQuanTruoc', label: 'Quê quán trước hợp nhất (cột G)', tier: 'required',    empty: (c) => isBlank(c.queQuanTruoc) },
  { field: 'noiOHienNay',  label: 'Nơi ở hiện nay (cột J)',          tier: 'required',    empty: (c) => isBlank(c.noiOHienNay) },
  { field: 'donVi',        label: 'Đơn vị công tác (cột D)',         tier: 'required',    empty: (c) => isBlank(c.toChucId) && isBlank(c.phongBan) },
  { field: 'chucVu',       label: 'Chức vụ / chức danh (cột C)',     tier: 'required',    empty: (c) => isBlank(c.chucDanhId) && isBlank(c.chucVu) },

  // ── Biên chế & ngạch (BẮT BUỘC) ──
  { field: 'loaiHinh',         label: 'Loại hình BC, HĐ (cột N)',          tier: 'required', empty: (c) => isBlank(c.loaiHinh) },
  { field: 'ngayVaoBienChe',   label: 'Ngày vào BC, HĐ (cột O)',           tier: 'required', empty: (c) => isBlank(c.ngayVaoBienChe) },
  // Ngạch/bậc/nâng lương — chỉ BẮT BUỘC với biên chế (HĐ hưởng lương khoán, không có ngạch).
  { field: 'maNgach',          label: 'Mã ngạch (cột T)',                  tier: 'required', empty: (c) => isBlank(c.maNgach),        when: laBienChe },
  { field: 'bacLuong',         label: 'Bậc lương (cột U)',                 tier: 'required', empty: (c) => c.bacLuong == null,        when: laBienChe },
  { field: 'heSoLuong',        label: 'Hệ số lương (cột V)',               tier: 'required', empty: (c) => c.heSoLuong == null },
  { field: 'ngachHienHuong',   label: 'Ngạch hiện hưởng (cột AB)',         tier: 'required', empty: (c) => isBlank(c.ngachHienHuong), when: laBienChe },
  { field: 'ngayNangLuong',    label: 'Ngày hưởng bậc hiện tại (cột Y)',   tier: 'required', empty: (c) => isBlank(c.ngayNangLuong),   when: laBienChe },
  { field: 'ngayNangLuongKeTiep', label: 'Ngày nâng lương lần sau (cột AA)', tier: 'required', empty: (c) => isBlank(c.ngayNangLuongKeTiep), when: laBienChe },
  { field: 'ngayBoNhiemNgach', label: 'Ngày bổ nhiệm vào ngạch (cột AC)',  tier: 'recommended', empty: (c) => isBlank(c.ngayBoNhiemNgach), when: laBienChe },
  { field: 'trinhDoChuyenMon', label: 'Trình độ chuyên môn (cột AE)',      tier: 'required', empty: (c) => isBlank(c.trinhDoChuyenMon) },
  // Vị trí việc làm — bắt buộc với công chức (NĐ 361/2025) và viên chức (NĐ 106/2020).
  { field: 'viTriViecLam',     label: 'Vị trí việc làm (CC: NĐ 361/2025 · VC: NĐ 106/2020)', tier: 'required', empty: (c) => isBlank(c.viTriViecLam), when: laBienChe },

  // ── Hợp đồng lao động (với NLĐ) ──
  { field: 'ngayKetThucHopDong', label: 'Ngày kết thúc hợp đồng', tier: 'recommended', empty: (c) => isBlank(c.ngayKetThucHopDong), when: (c) => c.doiTuong === 'NGUOI_LAO_DONG' },

  // ── Liên hệ (KHUYẾN NGHỊ) ──
  { field: 'soDienThoai', label: 'Điện thoại',          tier: 'recommended', empty: (c) => isBlank(c.soDienThoai) },
  { field: 'email',       label: 'Email',               tier: 'recommended', empty: (c) => isBlank(c.email) },
  { field: 'noiOTruoc',   label: 'Nơi ở trước hợp nhất (cột I)', tier: 'recommended', empty: (c) => isBlank(c.noiOTruoc) },

  // ── Bổ nhiệm (KHUYẾN NGHỊ) ──
  { field: 'boNhiemLanDau',      label: 'Bổ nhiệm lần đầu (cột P)',      tier: 'recommended', empty: (c) => isBlank(c.boNhiemLanDau) },
  { field: 'ngayBoNhiemGanNhat', label: 'Bổ nhiệm gần nhất (cột Q)',     tier: 'recommended', empty: (c) => isBlank(c.ngayBoNhiemGanNhat) },

  // ── Đào tạo (KHUYẾN NGHỊ) ──
  { field: 'chuyenNganh',  label: 'Ngành/chuyên ngành (cột AF)', tier: 'recommended', empty: (c) => isBlank(c.chuyenNganh) },
  { field: 'namTotNghiep', label: 'Năm tốt nghiệp (cột AG)',     tier: 'recommended', empty: (c) => isBlank(c.namTotNghiep) },
  { field: 'heDaoTao',     label: 'Hệ đào tạo (cột AH)',         tier: 'recommended', empty: (c) => isBlank(c.heDaoTao) },
  { field: 'trinhDoQLNN',     label: 'Trình độ QLNN (cột AI)',     tier: 'recommended', empty: (c) => isBlank(c.trinhDoQLNN) },
  { field: 'trinhDoLLCT',     label: 'Trình độ LLCT (cột AK)',     tier: 'recommended', empty: (c) => isBlank(c.trinhDoLLCT) },
  { field: 'trinhDoNgoaiNgu', label: 'Trình độ ngoại ngữ (cột AM)', tier: 'recommended', empty: (c) => isBlank(c.trinhDoNgoaiNgu) },
  { field: 'trinhDoTinHoc',   label: 'Trình độ tin học (cột AO)',  tier: 'recommended', empty: (c) => isBlank(c.trinhDoTinHoc) },
  // Năm đào tạo chỉ nhắc khi đã có trình độ tương ứng
  { field: 'namDaoTaoQLNN',     label: 'Năm đào tạo QLNN (cột AJ)',     tier: 'recommended', empty: (c) => isBlank(c.namDaoTaoQLNN),     when: (c) => !isBlank(c.trinhDoQLNN) },
  { field: 'namDaoTaoLLCT',     label: 'Năm đào tạo LLCT (cột AL)',     tier: 'recommended', empty: (c) => isBlank(c.namDaoTaoLLCT),     when: (c) => !isBlank(c.trinhDoLLCT) },
  { field: 'namDaoTaoNgoaiNgu', label: 'Năm đào tạo ngoại ngữ (cột AN)', tier: 'recommended', empty: (c) => isBlank(c.namDaoTaoNgoaiNgu), when: (c) => !isBlank(c.trinhDoNgoaiNgu) },
  { field: 'namDaoTaoTinHoc',   label: 'Năm đào tạo tin học (cột AP)',  tier: 'recommended', empty: (c) => isBlank(c.namDaoTaoTinHoc),   when: (c) => !isBlank(c.trinhDoTinHoc) },

  // ── Đảng (KHUYẾN NGHỊ — chỉ khi là đảng viên) ──
  { field: 'soTheDang',            label: 'Số thẻ Đảng viên (cột AU)', tier: 'recommended', empty: (c) => isBlank(c.soTheDang),            when: laDangVien },
  { field: 'ngayKetNapDang',       label: 'Ngày kết nạp Đảng (cột AV)', tier: 'recommended', empty: (c) => isBlank(c.ngayKetNapDang),       when: laDangVien },
  { field: 'ngayVaoDangChinhThuc', label: 'Ngày vào Đảng chính thức (cột AW)', tier: 'recommended', empty: (c) => isBlank(c.ngayVaoDangChinhThuc), when: laDangVien },
  { field: 'chiBo',                label: 'Chi bộ sinh hoạt (cột AZ)', tier: 'recommended', empty: (c) => isBlank(c.chiBo),                when: laDangVien },
]

export function checkHoSoCompleteness(cb: HoSoForCheck): CompletenessResult {
  const applicable = FIELDS.filter((f) => !f.when || f.when(cb))
  const missing = applicable.filter((f) => f.empty(cb))
  const missingRequired = missing.filter((f) => f.tier === 'required').map(toItem)
  const missingRecommended = missing.filter((f) => f.tier === 'recommended').map(toItem)

  const totalChecked = applicable.length
  const filled = totalChecked - missing.length
  return {
    missingRequired,
    missingRecommended,
    totalChecked,
    filled,
    percent: totalChecked === 0 ? 100 : Math.round((filled / totalChecked) * 100),
    hasRequiredGap: missingRequired.length > 0,
  }
}

function toItem(f: FieldDef): MissingItem {
  return { field: f.field, label: f.label, tier: f.tier }
}
