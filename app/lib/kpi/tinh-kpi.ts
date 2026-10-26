/**
 * TÍNH ĐIỂM KPI VÀ ĐỀ XUẤT XẾP LOẠI THEO QUÝ — Sở Xây dựng Quảng Trị, năm 2026.
 *
 * Căn cứ (đã dán vào hội thoại, CHƯA có bản gốc trong repo):
 *  - Công văn số 9409/SXD-VP ngày 23/10/2026 (phần II — Quý III/2026), gồm trích Công văn 5653/SNV-CBCCVC ngày 30/9/2026 của Sở Nội vụ.
 *  - Quyết định số 954/QĐ-SXD ngày 25/8/2026 ban hành Kế hoạch nhiệm vụ năm 2026 (Phụ lục KPI).
 *
 * QUY TẮC LẤY NGUYÊN VĂN TỪ CÔNG VĂN
 *  - Tổng điểm = điểm tiêu chí chung (≤ 30) + điểm kết quả thực hiện nhiệm vụ (≤ 70).
 *  - Điểm kết quả = Σ (Điểm KPI từng trục × Điểm tối đa của trục); 6 trục: 35 / 10 / 7 / 8 / 5 / 5.
 *  - Điểm KPI (mỗi trục) = (A + B + C + D) / 4;  A số lượng, B chất lượng, C tiến độ, D năng lực lãnh đạo, chỉ đạo, điều hành.
 *  - Trục phụ không có nhiệm vụ → ghi "Không có nhiệm vụ" và chuyển toàn bộ điểm về Trục 1 (trục chính).
 *  - Mức xếp loại theo tổng điểm: ≥ 90 xuất sắc; 70–<90 tốt; 50–<70 hoàn thành; < 50 không hoàn thành.
 *  - Điều kiện KPI (CV 5653 + diễn giải của CV 9409): xuất sắc — hoàn thành 100% NV, ít nhất 30% NV vượt mức;
 *    tốt — KPI đạt 100%; hoàn thành — KPI số lượng, chất lượng, chỉ đạo-điều hành 100% và KPI tiến độ từ 80% đến dưới 100%.
 *  - Mỗi tập thể lãnh đạo phòng/đơn vị chọn tối đa 01 cá nhân xuất sắc.
 *
 * GIẢ ĐỊNH CỦA CÔNG CỤ (văn bản không quy định — phải được Văn phòng Sở/Sở Nội vụ xác nhận):
 *  G1. KPI mỗi trục bị chặn tối đa 100% (vượt mức chỉ ghi nhận ở tỷ lệ NV vượt mức, không cộng điểm).
 *  G2. A, B, C tính từ trạng thái từng nhiệm vụ: A = trọng số NV hoàn thành / trọng số NV giao; B = trọng số NV đạt chất lượng /
 *      trọng số NV hoàn thành; C = trọng số NV hoàn thành đúng hạn / trọng số NV giao. (Hệ số quy đổi mặc định 1.)
 *  G3. Người không giữ chức vụ lãnh đạo, quản lý: không có chỉ số D → KPI = (A + B + C) / 3.
 *  G4. Điều kiện KPI áp trên chỉ số tổng hợp mọi nhiệm vụ (không áp riêng từng trục).
 *  G5. Làm tròn tổng điểm 2 chữ số thập phân trước khi so ngưỡng.
 *  G6. Không đạt điều kiện nào trong ba mức trên nhưng chưa đủ căn cứ "không hoàn thành" → "CAN_XEM_XET" (văn bản có khoảng trống).
 *  G7. Trục chính không có nhiệm vụ → điểm các trục trống chuyển về trục có điểm tối đa lớn nhất trong các trục CÓ nhiệm vụ.
 */

export type MaTruc = 1 | 2 | 3 | 4 | 5 | 6

export const TRUC: readonly { ma: MaTruc; ten: string; diemToiDa: number }[] = [
  { ma: 1, ten: 'Thực hiện mục tiêu phát triển kinh tế - xã hội và nhiệm vụ chính trị được giao (trục chính)', diemToiDa: 35 },
  { ma: 2, ten: 'Hoàn thiện thể chế, đẩy mạnh phân cấp, phân quyền gắn với kiểm tra, giám sát', diemToiDa: 10 },
  { ma: 3, ten: 'Thúc đẩy phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số', diemToiDa: 7 },
  { ma: 4, ten: 'Xây dựng Đảng và hệ thống chính trị trong sạch, vững mạnh; giữ gìn đoàn kết, thống nhất nội bộ; phòng, chống tham nhũng, lãng phí, tiêu cực', diemToiDa: 8 },
  { ma: 5, ten: 'Phát triển văn hóa, con người, bảo đảm an sinh xã hội, nâng cao đời sống Nhân dân', diemToiDa: 5 },
  { ma: 6, ten: 'Củng cố quốc phòng, an ninh, giữ vững ổn định chính trị - xã hội, nâng cao hiệu quả đối ngoại và hội nhập quốc tế', diemToiDa: 5 },
]

export const DIEM_CHUNG_TOI_DA = 30
export const DIEM_KET_QUA_TOI_DA = 70
export const NGUONG = { xuatSac: 90, tot: 70, hoanThanh: 50, tienDoToiThieuHoanThanh: 0.8, tyLeVuotMucXuatSac: 0.3, tyLeNvToiThieu: 0.7 } as const

export type MucXepLoai = 'HOAN_THANH_XUAT_SAC' | 'HOAN_THANH_TOT' | 'HOAN_THANH' | 'KHONG_HOAN_THANH'
export type DeXuat = MucXepLoai | 'CAN_XEM_XET' | 'KHONG_CO_NHIEM_VU'

/** null = chưa nhập kết quả. */
export type NhiemVuKpi = {
  truc: MaTruc
  /** Hệ số quy đổi (Hướng dẫn 05/HD-BTCTU); mặc định 1. */
  heSo: number
  /** Có đưa vào danh mục của quý đang đánh giá. */
  chon: boolean
  hoanThanh: boolean | null
  dungHan: boolean | null
  chatLuongDat: boolean | null
  vuotMuc: boolean | null
}

export type DauVaoKpi = {
  nhiemVu: NhiemVuKpi[]
  laLanhDao: boolean
  /** Chỉ số D (0..1). Bắt buộc với người lãnh đạo, quản lý. */
  d: number | null
  /** Điểm tiêu chí chung (0..30). */
  diemChung: number | null
}

export type KetQuaTruc = {
  ma: MaTruc
  diemToiDa: number
  soNhiemVu: number
  coNhiemVu: boolean
  a: number | null
  b: number | null
  c: number | null
  d: number | null
  kpi: number | null
  /** Điểm tối đa sau khi nhận điểm chuyển về từ trục không có nhiệm vụ. */
  diemToiDaSauChuyen: number
  diem: number
}

export type KetQuaKpi = {
  truc: KetQuaTruc[]
  tong: { a: number | null; b: number | null; c: number | null; d: number | null; soNhiemVu: number; tyLeVuotMuc: number }
  diemKetQua: number
  diemChung: number
  tongDiem: number
  mucTheoDiem: MucXepLoai
  /** Mức tối đa cho phép theo điều kiện KPI. */
  mucToiDaTheoKpi: MucXepLoai | 'CAN_XEM_XET' | null
  xepLoaiDeXuat: DeXuat
  daNhapDu: boolean
  canhBao: string[]
}

const EPS = 1e-9
const lamTron2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100
const bang = (x: number, y: number) => Math.abs(x - y) < EPS
const kep01 = (x: number) => Math.min(1, Math.max(0, x))

/** So sánh thứ hạng mức xếp loại: số càng lớn càng cao. */
export const HANG: Record<MucXepLoai, number> = {
  KHONG_HOAN_THANH: 0, HOAN_THANH: 1, HOAN_THANH_TOT: 2, HOAN_THANH_XUAT_SAC: 3,
}

export function mucTheoDiem(tongDiem: number): MucXepLoai {
  const d = lamTron2(tongDiem)
  if (d >= NGUONG.xuatSac) return 'HOAN_THANH_XUAT_SAC'
  if (d >= NGUONG.tot) return 'HOAN_THANH_TOT'
  if (d >= NGUONG.hoanThanh) return 'HOAN_THANH'
  return 'KHONG_HOAN_THANH'
}

type ChiSo = { a: number | null; b: number | null; c: number | null }

function chiSo(ds: NhiemVuKpi[]): ChiSo {
  const w = ds.reduce((s, n) => s + n.heSo, 0)
  if (w <= 0) return { a: null, b: null, c: null }
  const ht = ds.reduce((s, n) => s + (n.hoanThanh === true ? n.heSo : 0), 0)
  const dat = ds.reduce((s, n) => s + (n.hoanThanh === true && n.chatLuongDat === true ? n.heSo : 0), 0)
  const dh = ds.reduce((s, n) => s + (n.hoanThanh === true && n.dungHan === true ? n.heSo : 0), 0)
  return { a: ht / w, b: ht > 0 ? dat / ht : 0, c: dh / w }
}

export function tinhKpi(v: DauVaoKpi): KetQuaKpi {
  const canhBao: string[] = []
  const chon = v.nhiemVu.filter((n) => n.chon && n.heSo > 0)
  const daNhapDu0 = chon.every((n) => n.hoanThanh !== null && (n.hoanThanh === false || (n.dungHan !== null && n.chatLuongDat !== null)))
  let daNhapDu = daNhapDu0

  if (v.laLanhDao && v.d === null) { daNhapDu = false; canhBao.push('Chưa nhập chỉ số D (năng lực lãnh đạo, chỉ đạo, điều hành) — tạm tính D = 0.') }
  if (v.diemChung === null) { daNhapDu = false; canhBao.push('Chưa nhập điểm tiêu chí chung (tối đa 30) — tạm tính 0.') }
  if (v.diemChung !== null && (v.diemChung < 0 || v.diemChung > DIEM_CHUNG_TOI_DA)) canhBao.push(`Điểm tiêu chí chung phải trong khoảng 0–${DIEM_CHUNG_TOI_DA}.`)
  if (!daNhapDu0) canhBao.push('Còn nhiệm vụ chưa nhập kết quả (hoàn thành / đúng hạn / chất lượng) — chỉ số tính tạm, nhiệm vụ chưa nhập coi như chưa đạt.')

  const d = v.laLanhDao ? kep01(v.d ?? 0) : null
  const coNv = (ma: MaTruc) => chon.some((n) => n.truc === ma)

  // Điểm chuyển về trục chính từ các trục KHÔNG có nhiệm vụ
  const diemTrucTrong = TRUC.filter((t) => !coNv(t.ma)).reduce((s, t) => s + t.diemToiDa, 0)
  let trucNhan: MaTruc | null = null
  if (chon.length > 0 && diemTrucTrong > 0) {
    if (coNv(1)) trucNhan = 1
    else {
      const ungVien = TRUC.filter((t) => coNv(t.ma)).sort((x, y) => y.diemToiDa - x.diemToiDa)[0]
      trucNhan = ungVien.ma
      canhBao.push(`Trục 1 (trục chính) không có nhiệm vụ — điểm các trục trống chuyển về Trục ${trucNhan} (giả định G7).`)
    }
  }

  const truc: KetQuaTruc[] = TRUC.map((t) => {
    const ds = chon.filter((n) => n.truc === t.ma)
    const cs = chiSo(ds)
    let kpi: number | null = null
    if (ds.length > 0 && cs.a !== null && cs.b !== null && cs.c !== null) {
      kpi = d === null ? (cs.a + cs.b + cs.c) / 3 : (cs.a + cs.b + cs.c + d) / 4
    }
    // Điểm trục trống (không có NV) đã được chuyển đi → trục đó = 0 điểm
    const diemToiDaSauChuyen = ds.length === 0 ? 0 : t.diemToiDa + (trucNhan === t.ma ? diemTrucTrong : 0)
    return {
      ma: t.ma, diemToiDa: t.diemToiDa, soNhiemVu: ds.length, coNhiemVu: ds.length > 0,
      a: cs.a, b: cs.b, c: cs.c, d, kpi, diemToiDaSauChuyen,
      diem: kpi === null ? 0 : kep01(kpi) * diemToiDaSauChuyen,
    }
  })

  const diemKetQua = truc.reduce((s, t) => s + t.diem, 0)
  const diemChung = v.diemChung === null ? 0 : Math.min(DIEM_CHUNG_TOI_DA, Math.max(0, v.diemChung))
  const tongDiem = lamTron2(diemKetQua + diemChung)

  const cs = chiSo(chon)
  const soVuot = chon.filter((n) => n.hoanThanh === true && n.vuotMuc === true).length
  const tyLeVuotMuc = chon.length > 0 ? soVuot / chon.length : 0
  const tong = { a: cs.a, b: cs.b, c: cs.c, d, soNhiemVu: chon.length, tyLeVuotMuc }
  const diemMuc = mucTheoDiem(tongDiem)

  let mucToiDaTheoKpi: KetQuaKpi['mucToiDaTheoKpi'] = null
  let xepLoaiDeXuat: DeXuat
  if (chon.length === 0) {
    xepLoaiDeXuat = 'KHONG_CO_NHIEM_VU'
    canhBao.push('Chưa có nhiệm vụ nào được đưa vào danh mục của quý.')
  } else {
    const a = cs.a ?? 0, b = cs.b ?? 0, c = cs.c ?? 0
    const dDat = d === null || bang(d, 1)
    const tatCa100 = bang(a, 1) && bang(b, 1) && bang(c, 1) && dDat
    if (tatCa100) mucToiDaTheoKpi = tyLeVuotMuc >= NGUONG.tyLeVuotMucXuatSac - EPS ? 'HOAN_THANH_XUAT_SAC' : 'HOAN_THANH_TOT'
    else if (bang(a, 1) && bang(b, 1) && dDat && c >= NGUONG.tienDoToiThieuHoanThanh - EPS) mucToiDaTheoKpi = 'HOAN_THANH'
    else mucToiDaTheoKpi = 'CAN_XEM_XET'

    if (diemMuc === 'KHONG_HOAN_THANH') xepLoaiDeXuat = 'KHONG_HOAN_THANH'
    else if (mucToiDaTheoKpi === 'CAN_XEM_XET') {
      xepLoaiDeXuat = 'CAN_XEM_XET'
      const ly: string[] = []
      if (!bang(a, 1)) ly.push(`số lượng ${(a * 100).toFixed(1)}% (<100%)`)
      if (!bang(b, 1)) ly.push(`chất lượng ${(b * 100).toFixed(1)}% (<100%)`)
      if (c < NGUONG.tienDoToiThieuHoanThanh - EPS) ly.push(`tiến độ ${(c * 100).toFixed(1)}% (<80%)`)
      if (!dDat) ly.push(`chỉ đạo, điều hành ${((d ?? 0) * 100).toFixed(1)}% (<100%)`)
      canhBao.push(`Không đủ điều kiện KPI của mức "hoàn thành nhiệm vụ": ${ly.join('; ')}. Văn bản chưa quy định mức xếp loại trong trường hợp này (giả định G6) — cần lãnh đạo xem xét.`)
      if (a < NGUONG.tyLeNvToiThieu) canhBao.push('Số lượng nhiệm vụ hoàn thành dưới 70% — có thể thuộc diện "không hoàn thành nhiệm vụ" theo mục (iv) của Công văn 5653.')
    } else {
      xepLoaiDeXuat = HANG[diemMuc] <= HANG[mucToiDaTheoKpi] ? diemMuc : mucToiDaTheoKpi
      if (HANG[diemMuc] > HANG[mucToiDaTheoKpi]) {
        canhBao.push(`Tổng điểm ${tongDiem} thuộc mức cao hơn nhưng điều kiện KPI chỉ cho phép tối đa mức "${nhanMuc(mucToiDaTheoKpi)}".`)
      }
    }
  }

  return { truc, tong, diemKetQua, diemChung, tongDiem, mucTheoDiem: diemMuc, mucToiDaTheoKpi, xepLoaiDeXuat, daNhapDu, canhBao }
}

export function nhanMuc(m: DeXuat): string {
  switch (m) {
    case 'HOAN_THANH_XUAT_SAC': return 'Hoàn thành xuất sắc nhiệm vụ'
    case 'HOAN_THANH_TOT': return 'Hoàn thành tốt nhiệm vụ'
    case 'HOAN_THANH': return 'Hoàn thành nhiệm vụ'
    case 'KHONG_HOAN_THANH': return 'Không hoàn thành nhiệm vụ'
    case 'CAN_XEM_XET': return 'Cần xem xét (ngoài các mức văn bản quy định)'
    case 'KHONG_CO_NHIEM_VU': return 'Chưa có nhiệm vụ'
  }
}

/**
 * Mỗi tập thể lãnh đạo phòng/đơn vị chỉ được chọn tối đa 01 cá nhân "Hoàn thành xuất sắc nhiệm vụ".
 * Người có tổng điểm cao nhất giữ mức; còn lại hạ xuống "tốt". Cùng điểm cao nhất → KHÔNG tự chọn, báo để lãnh đạo quyết.
 */
export function gioiHanXuatSac<T extends { id: string; xepLoaiDeXuat: DeXuat; tongDiem: number }>(
  tapThe: T[],
): { id: string; xepLoai: DeXuat; ghiChu: string | null }[] {
  const xs = tapThe.filter((x) => x.xepLoaiDeXuat === 'HOAN_THANH_XUAT_SAC')
  const cao = xs.length ? Math.max(...xs.map((x) => x.tongDiem)) : 0
  const dungDau = xs.filter((x) => bang(x.tongDiem, cao))
  return tapThe.map((x) => {
    if (x.xepLoaiDeXuat !== 'HOAN_THANH_XUAT_SAC' || xs.length <= 1) return { id: x.id, xepLoai: x.xepLoaiDeXuat, ghiChu: null }
    if (dungDau.length > 1) {
      return dungDau.some((y) => y.id === x.id)
        ? { id: x.id, xepLoai: 'HOAN_THANH_XUAT_SAC' as DeXuat, ghiChu: `Có ${dungDau.length} người cùng điểm cao nhất đủ điều kiện xuất sắc — tập thể chỉ được chọn 01, lãnh đạo quyết định.` }
        : { id: x.id, xepLoai: 'HOAN_THANH_TOT' as DeXuat, ghiChu: 'Tập thể chỉ được chọn tối đa 01 người xuất sắc — hạ xuống mức tốt.' }
    }
    return x.id === dungDau[0].id
      ? { id: x.id, xepLoai: 'HOAN_THANH_XUAT_SAC' as DeXuat, ghiChu: 'Được chọn xuất sắc (điểm cao nhất tập thể).' }
      : { id: x.id, xepLoai: 'HOAN_THANH_TOT' as DeXuat, ghiChu: 'Tập thể chỉ được chọn tối đa 01 người xuất sắc — hạ xuống mức tốt.' }
  })
}
