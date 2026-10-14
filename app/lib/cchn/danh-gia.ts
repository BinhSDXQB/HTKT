// BỘ ĐÁNH GIÁ SƠ BỘ hồ sơ đề nghị cấp chứng chỉ hành nghề — hỗ trợ cán bộ Phòng QLHĐ-XD rà hồ sơ.
// KHÔNG thay kết luận của Hội đồng xét cấp (NĐ 212/2026 Đ30 k4, Đ40). Hàm thuần, không truy cập CSDL.
//
// Căn cứ: NĐ 212/2026 Đ33 (điều kiện chung), Đ34–37 (kinh nghiệm theo lĩnh vực), Đ39 (thành phần hồ sơ),
// Đ30 (thời hạn). Đã qua phản biện Codex 14/10/2026 (ngưỡng quy hoạch theo nguyên văn; "chưa đánh giá phần
// việc" và vai trò suy luận chỉ cho CAN_KIEM_TRA; cơ chế kinh nghiệm quá 10 năm theo Đ33 k3; hạn "trước ngày").

import {
  BAC_CAP, BAC_NHOM, THANH_PHAN_HO_SO, TRINH_DO,
  type CapCongTrinh, type CapPheDuyetQh, type Hang, type LinhVuc, type LoaiThuTuc, type NhomDuAn, type TrinhDo,
} from './danh-muc'

export type KinhNghiemInput = {
  tenCongTrinh: string
  vaiTro: string
  capCongTrinh?: CapCongTrinh | null
  nhomDuAn?: NhomDuAn | null
  capPheDuyetQh?: CapPheDuyetQh | null
  loaiQuyHoach?: string | null
  denNgay?: string | null          // thời điểm hoàn thành phần việc (yyyy-mm-dd)
  taiLieu?: string | null
  phuHopNoiDung?: boolean | null   // true = phần việc thuộc nội dung đề nghị; null = chưa đánh giá; false = loại
}

export type HoSoInput = {
  loaiThuTuc: LoaiThuTuc
  truongHop?: string | null
  laCongDanVN: boolean
  trinhDo?: TrinhDo | null
  linhVuc?: LinhVuc | null
  noiDung?: string | null
  hangDeNghi?: Hang | null
  hanhNgheDocLap: boolean
  vanBangTrenCsdl: boolean
  soCchnCu?: string | null
  ngayBatDauKinhNghiem?: string | null
  ngayNop?: string | null           // = thời điểm đề nghị cấp
  thanhPhan: Record<string, boolean>
  kinhNghiem: KinhNghiemInput[]
}

export type KetQua = 'DAT' | 'CHUA_DAT' | 'CAN_KIEM_TRA' | 'KHONG_AP_DUNG'
export type MucDanhGia = { ma: string; noiDung: string; ketQua: KetQua; canCu: string; ghiChu?: string }

export type KetQuaDanhGia = {
  muc: MucDanhGia[]
  /** Hạng cao nhất ĐẠT sơ bộ về trình độ + số năm + công trình (chưa xét chuyên ngành Phụ lục I). */
  hangDatSoBo: Hang | null
  thanhPhanThieu: { key: string; label: string; canCu: string }[]
}

const HANG: Hang[] = ['I', 'II', 'III']
const HANG_TREN: Record<Hang, Hang | null> = { I: null, II: 'I', III: 'II' }

/** 'yyyy-mm-dd' → Date lúc 00:00 giờ địa phương (chỉ dùng so sánh ngày trong hàm thuần). */
function parse(d?: string | null): Date | null {
  if (!d) return null
  const t = new Date(d + 'T00:00:00')
  return Number.isNaN(t.getTime()) ? null : t
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Số năm tròn giữa hai ngày (đủ ngày-tháng mới tính tròn năm). */
export function soNamTron(tu: Date, den: Date): number {
  let n = den.getFullYear() - tu.getFullYear()
  if (den.getMonth() < tu.getMonth() || (den.getMonth() === tu.getMonth() && den.getDate() < tu.getDate())) n--
  return n
}

/** Mốc 10 năm trước thời điểm đề nghị cấp (Đ33 k3). */
export function moc10Nam(ngayDeNghi: Date): Date {
  return new Date(ngayDeNghi.getFullYear() - 10, ngayDeNghi.getMonth(), ngayDeNghi.getDate())
}

// ── Điều kiện kinh nghiệm theo lĩnh vực, hạng (Đ34–37) ───────────────────────────────────────────
// Mỗi hạng = các PHƯƠNG ÁN thay thế nhau ("hoặc"); mỗi phương án: đủ `soLuong` mục đạt ngưỡng.
type PhuongAn =
  | { kieu: 'CAP'; soLuong: number; capToiThieu: CapCongTrinh; moTa: string }
  | { kieu: 'NHOM'; soLuong: number; nhomToiThieu: NhomDuAn; moTa: string }
  | { kieu: 'QH'; soLuong: number; capPheDuyet: CapPheDuyetQh[] | 'BAT_KY'; coQhChungPhanKhu?: boolean; moTa: string }

/**
 * vaiTro: vai trò ĐÚNG NGUYÊN VĂN điều luật → có thể kết luận DAT.
 * vaiTroSuyLuan: vai trò cao hơn được coi là đã "tham gia" (giám sát trưởng ⊇ tham gia giám sát…) — văn bản
 * không viết quy tắc này → chỉ cho CAN_KIEM_TRA, Hội đồng quyết định.
 */
type DieuKienHang = { vaiTro: string[]; vaiTroSuyLuan: string[]; phuongAn: PhuongAn[]; canCu: string; luuY?: string }

const CAP = (soLuong: number, capToiThieu: CapCongTrinh, moTa: string): PhuongAn => ({ kieu: 'CAP', soLuong, capToiThieu, moTa })
const NHOM = (soLuong: number, nhomToiThieu: NhomDuAn, moTa: string): PhuongAn => ({ kieu: 'NHOM', soLuong, nhomToiThieu, moTa })

function dieuKienKinhNghiem(linhVuc: LinhVuc, noiDung: string | null | undefined, hang: Hang): DieuKienHang {
  if (linhVuc === 'GIAM_SAT') {
    const vt = ['GIAM_SAT_TRUONG', 'CHU_TRI_TK']
    if (hang === 'I') return { vaiTro: vt, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ37 k1', phuongAn: [CAP(1, 'I', '01 công trình từ cấp I trở lên'), CAP(2, 'II', '02 công trình cấp II')] }
    if (hang === 'II') return { vaiTro: vt, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ37 k2', phuongAn: [CAP(1, 'II', '01 công trình cấp II'), CAP(2, 'III', '02 công trình cấp III')] }
    return { vaiTro: ['THAM_GIA_GIAM_SAT', 'THAM_GIA_TK', 'THAM_GIA_THI_CONG'], vaiTroSuyLuan: vt, canCu: 'NĐ 212 Đ37 k3',
      luuY: 'Tham gia giám sát không yêu cầu có chứng chỉ (Đ37 k3); người chưa có chứng chỉ không được đảm nhận chức danh giám sát (Đ27 k4).',
      phuongAn: [CAP(1, 'III', '01 công trình từ cấp III trở lên'), CAP(2, 'IV', '02 công trình cấp IV')] }
  }
  if (linhVuc === 'THIET_KE') {
    const chuTri = ['CHU_NHIEM_TK', 'CHU_TRI_TK', 'CHU_NHIEM_THAM_TRA', 'CHU_TRI_THAM_TRA']
    if (hang === 'I') return { vaiTro: chuTri, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ36 k1', phuongAn: [CAP(1, 'I', '01 công trình từ cấp I trở lên'), CAP(2, 'II', '02 công trình cấp II')] }
    if (hang === 'II') return { vaiTro: chuTri, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ36 k2', phuongAn: [CAP(1, 'II', '01 công trình cấp II'), CAP(2, 'III', '02 công trình cấp III')] }
    return { vaiTro: ['THAM_GIA_TK', 'THAM_GIA_THAM_TRA'], vaiTroSuyLuan: chuTri, canCu: 'NĐ 212 Đ36 k3',
      phuongAn: [CAP(3, 'III', '03 công trình từ cấp III trở lên'), CAP(5, 'IV', '05 công trình cấp IV')] }
  }
  if (linhVuc === 'KHAO_SAT') {
    const diaHinh = (noiDung ?? '').includes('địa hình')
    if (hang === 'III') return { vaiTro: ['THAM_GIA_KHAO_SAT'], vaiTroSuyLuan: ['CHU_NHIEM_KHAO_SAT'], canCu: 'NĐ 212 Đ34 k3',
      phuongAn: [NHOM(1, 'C', '01 dự án từ nhóm C trở lên'), CAP(1, 'III', '01 công trình từ cấp III trở lên'), CAP(2, 'IV', '02 công trình cấp IV')] }
    if (hang === 'I') return { vaiTro: ['CHU_NHIEM_KHAO_SAT'], vaiTroSuyLuan: [], canCu: diaHinh ? 'NĐ 212 Đ34 k1 điểm a' : 'NĐ 212 Đ34 k1 điểm b',
      phuongAn: [...(diaHinh ? [NHOM(1, 'A', '01 dự án từ nhóm A trở lên'), NHOM(2, 'B', '02 dự án nhóm B')] : []),
        CAP(1, 'I', '01 công trình từ cấp I trở lên'), CAP(2, 'II', '02 công trình cấp II')] }
    return { vaiTro: ['CHU_NHIEM_KHAO_SAT'], vaiTroSuyLuan: [], canCu: diaHinh ? 'NĐ 212 Đ34 k2 điểm a' : 'NĐ 212 Đ34 k2 điểm b',
      phuongAn: [...(diaHinh ? [NHOM(1, 'B', '01 dự án nhóm B'), NHOM(2, 'C', '02 dự án nhóm C')] : []),
        CAP(1, 'II', '01 công trình cấp II'), CAP(2, 'III', '02 công trình cấp III')] }
  }
  // QUY_HOACH — ngưỡng cấp phê duyệt theo NGUYÊN VĂN Đ35 (không tự nới "từ cấp tỉnh trở lên").
  const vt = ['CHU_NHIEM_QH', 'CHU_TRI_QH']
  if (hang === 'I') return { vaiTro: vt, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ35 k1', phuongAn: [
    { kieu: 'QH', soLuong: 1, capPheDuyet: ['TTG'], moTa: '01 quy hoạch do Thủ tướng Chính phủ phê duyệt' },
    { kieu: 'QH', soLuong: 2, capPheDuyet: ['UBND_TINH'], coQhChungPhanKhu: true, moTa: '02 quy hoạch do UBND cấp tỉnh phê duyệt (trong đó có 01 quy hoạch chung hoặc phân khu)' }] }
  if (hang === 'II') return { vaiTro: vt, vaiTroSuyLuan: [], canCu: 'NĐ 212 Đ35 k2', phuongAn: [
    { kieu: 'QH', soLuong: 1, capPheDuyet: ['UBND_TINH'], moTa: '01 quy hoạch do UBND cấp tỉnh phê duyệt' },
    { kieu: 'QH', soLuong: 2, capPheDuyet: ['UBND_XA'], moTa: '02 quy hoạch do UBND cấp xã phê duyệt' }],
    luuY: 'Quy hoạch do Thủ tướng phê duyệt không được liệt kê ở hạng II — cán bộ xem xét riêng nếu có.' }
  return { vaiTro: ['THAM_GIA_QH'], vaiTroSuyLuan: vt, canCu: 'NĐ 212 Đ35 k3', phuongAn: [
    { kieu: 'QH', soLuong: 2, capPheDuyet: 'BAT_KY', moTa: '02 quy hoạch đã được phê duyệt' }] }
}

function datNguong(k: KinhNghiemInput, pa: PhuongAn): boolean {
  if (pa.kieu === 'CAP') return !!k.capCongTrinh && BAC_CAP[k.capCongTrinh] <= BAC_CAP[pa.capToiThieu]
  if (pa.kieu === 'NHOM') return !!k.nhomDuAn && BAC_NHOM[k.nhomDuAn] <= BAC_NHOM[pa.nhomToiThieu]
  if (pa.capPheDuyet === 'BAT_KY') return !!k.capPheDuyetQh
  return !!k.capPheDuyetQh && pa.capPheDuyet.includes(k.capPheDuyetQh)
}

function thoa(ds: KinhNghiemInput[], dk: DieuKienHang): boolean {
  return dk.phuongAn.some((pa) => {
    const dat = ds.filter((k) => datNguong(k, pa))
    if (dat.length < pa.soLuong) return false
    if (pa.kieu === 'QH' && pa.coQhChungPhanKhu) return dat.some((k) => k.loaiQuyHoach === 'Quy hoạch chung' || k.loaiQuyHoach === 'Quy hoạch phân khu')
    return true
  })
}

const NAM_TOI_THIEU: Record<Hang, { daiHoc: number; caoDang: number | null }> = {
  I: { daiHoc: 7, caoDang: null },   // Đ33 k4 điểm a
  II: { daiHoc: 4, caoDang: null },  // Đ33 k4 điểm b
  III: { daiHoc: 2, caoDang: 3 },    // Đ33 k4 điểm c
}

/** Đánh giá kinh nghiệm công trình cho hạng `hang` (Đ34–37 + Đ33 k3). */
function danhGiaCongTrinh(hs: HoSoInput, hang: Hang, ngayDeNghi: Date | null): MucDanhGia {
  if (!hs.linhVuc) return { ma: 'cong_trinh', noiDung: 'Kinh nghiệm công trình', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ34–37', ghiChu: 'Chưa chọn lĩnh vực đề nghị cấp.' }
  const dk = dieuKienKinhNghiem(hs.linhVuc, hs.noiDung, hang)
  const moc = ngayDeNghi ? moc10Nam(ngayDeNghi) : null
  const trong10 = (k: KinhNghiemInput) => { const d = parse(k.denNgay); return !!d && !!moc && d >= moc }
  const hopLe = hs.kinhNghiem.filter((k) => k.phuHopNoiDung !== false)
  const xacNhan = (ds: string[]) => hopLe.filter((k) => k.phuHopNoiDung === true && ds.includes(k.vaiTro))
  const kheNang = (d: DieuKienHang) => hopLe.filter((k) => [...d.vaiTro, ...d.vaiTroSuyLuan].includes(k.vaiTro))

  const ghi: string[] = []
  if (dk.luuY) ghi.push(dk.luuY)
  const moTa = dk.phuongAn.map((p) => p.moTa).join(' HOẶC ')
  const canCu = `${dk.canCu}; Đ33 k3`

  // 1) Đạt bằng kinh nghiệm trong 10 năm, vai trò đúng nguyên văn, đã xác nhận phần việc.
  const xn10 = xacNhan(dk.vaiTro).filter(trong10)
  if (thoa(xn10, dk)) return { ma: 'cong_trinh', noiDung: `Đạt: ${xn10.length} công trình hợp lệ trong 10 năm — yêu cầu ${moTa}`, ketQua: 'DAT', canCu, ghiChu: ghi.join(' ') || undefined }

  // 2) Đ33 k3: kinh nghiệm quá 10 năm đáp ứng HẠNG CAO HƠN 01 hạng → được đề nghị hạng này.
  const tren = HANG_TREN[hang]
  if (tren) {
    const dkTren = dieuKienKinhNghiem(hs.linhVuc, hs.noiDung, tren)
    if (thoa(xacNhan(dkTren.vaiTro).filter(trong10), dkTren)) {
      return { ma: 'cong_trinh', noiDung: `Đạt: kinh nghiệm trong 10 năm đáp ứng điều kiện hạng ${tren} (cao hơn hạng đề nghị)`, ketQua: 'DAT',
        canCu: dkTren.canCu, ghiChu: [...ghi, 'Đề nghị hạng thấp hơn mức đã đáp ứng — Hội đồng xác nhận.'].join(' ') }
    }
    if (thoa(xacNhan(dkTren.vaiTro), dkTren)) {
      return { ma: 'cong_trinh', noiDung: `Đạt theo Đ33 k3: kinh nghiệm (kể cả quá 10 năm) đáp ứng hạng ${tren} → được đề nghị hạng ${hang}`, ketQua: 'DAT',
        canCu: `${dkTren.canCu}; Đ33 k3`, ghiChu: ghi.join(' ') || undefined }
    }
  }

  // 3) Chỉ đạt nếu tính cả công trình chưa đánh giá phần việc / vai trò suy luận → cần kiểm tra.
  const kn10 = kheNang(dk).filter(trong10)
  const coTheTren = tren ? (() => { const d = dieuKienKinhNghiem(hs.linhVuc!, hs.noiDung, tren); return thoa(kheNang(d), d) })() : false
  if (thoa(kn10, dk) || coTheTren) {
    const chuaDg = hopLe.filter((k) => k.phuHopNoiDung == null).length
    const suyLuan = hopLe.filter((k) => dk.vaiTroSuyLuan.includes(k.vaiTro)).length
    if (chuaDg) ghi.push(`${chuaDg} công trình chưa đánh giá "phần việc thuộc nội dung đề nghị".`)
    if (suyLuan) ghi.push(`${suyLuan} công trình có vai trò cao hơn "tham gia" — văn bản không quy định bao hàm, Hội đồng quyết định.`)
    return { ma: 'cong_trinh', noiDung: `Có thể đạt nếu được xác nhận — yêu cầu ${moTa}`, ketQua: 'CAN_KIEM_TRA', canCu, ghiChu: ghi.join(' ') || undefined }
  }

  // 4) Không đạt.
  const thieuNgay = hopLe.filter((k) => !parse(k.denNgay)).length
  if (thieuNgay) ghi.push(`${thieuNgay} công trình chưa nhập ngày hoàn thành — chưa tính vào 10 năm.`)
  if (thoa(xacNhan(dk.vaiTro), dk)) {
    ghi.push(hang === 'III'
      ? 'Kinh nghiệm chỉ đạt khi tính cả phần quá 10 năm; hạng III không còn hạng thấp hơn để đề nghị (Đ33 k3).'
      : `Kinh nghiệm chỉ đạt khi tính cả phần quá 10 năm → theo Đ33 k3 chỉ được đề nghị hạng ${hang === 'I' ? 'II' : 'III'}.`)
  }
  return { ma: 'cong_trinh', noiDung: `Chưa đạt: ${xn10.length} công trình hợp lệ trong 10 năm — yêu cầu ${moTa}`, ketQua: 'CHUA_DAT', canCu, ghiChu: ghi.join(' ') || undefined }
}

function danhGiaTrinhDo(hs: HoSoInput, hang: Hang): MucDanhGia {
  const td = TRINH_DO.find((t) => t.value === hs.trinhDo)
  const caoDangDuoc = NAM_TOI_THIEU[hang].caoDang !== null
  if (!td) return { ma: 'trinh_do', noiDung: 'Trình độ đào tạo', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ33 k4', ghiChu: 'Chưa nhập trình độ.' }
  if (td.daiHocTroLen || (hs.trinhDo === 'CAO_DANG' && caoDangDuoc)) return { ma: 'trinh_do', noiDung: `Trình độ ${td.label} — phù hợp hạng ${hang}`, ketQua: 'DAT', canCu: 'NĐ 212 Đ33 k4' }
  return { ma: 'trinh_do', noiDung: `Trình độ ${td.label} — hạng ${hang} ${hang === 'III' ? 'yêu cầu đại học hoặc cao đẳng' : 'yêu cầu trình độ đại học'}`,
    ketQua: 'CHUA_DAT', canCu: `NĐ 212 Đ33 k4 điểm ${hang === 'I' ? 'a' : hang === 'II' ? 'b' : 'c'}` }
}

function danhGiaSoNam(hs: HoSoInput, hang: Hang, ngayDeNghi: Date | null): MucDanhGia {
  const batDau = parse(hs.ngayBatDauKinhNghiem)
  const ng = NAM_TOI_THIEU[hang]
  const yeuCau = hs.trinhDo === 'CAO_DANG' ? ng.caoDang : ng.daiHoc
  if (!batDau || !ngayDeNghi) return { ma: 'so_nam', noiDung: 'Thời gian kinh nghiệm', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ33 k4, k5', ghiChu: 'Thiếu ngày bắt đầu tham gia hoạt động xây dựng hoặc ngày nộp.' }
  if (yeuCau === null) return { ma: 'so_nam', noiDung: `Hạng ${hang} không xét với trình độ này`, ketQua: 'CHUA_DAT', canCu: 'NĐ 212 Đ33 k4' }
  const n = soNamTron(batDau, ngayDeNghi)
  return { ma: 'so_nam', noiDung: `Có ${n} năm kinh nghiệm (yêu cầu từ ${yeuCau} năm)`, ketQua: n >= yeuCau ? 'DAT' : 'CHUA_DAT',
    canCu: 'NĐ 212 Đ33 k4, k5', ghiChu: 'Tính từ thời điểm tham gia hoạt động xây dựng đến ngày nộp hồ sơ.' }
}

/** Danh sách thành phần hồ sơ áp dụng cho hồ sơ cụ thể (Đ39). */
export function thanhPhanApDung(hs: Pick<HoSoInput, 'loaiThuTuc' | 'truongHop' | 'laCongDanVN' | 'vanBangTrenCsdl' | 'soCchnCu' | 'hanhNgheDocLap'>) {
  const d = { loaiThuTuc: hs.loaiThuTuc, truongHop: hs.truongHop ?? '', laCongDanVN: hs.laCongDanVN, vanBangTrenCsdl: hs.vanBangTrenCsdl,
    coCchnCu: !!hs.soCchnCu?.trim(), hanhNgheDocLap: hs.hanhNgheDocLap }
  return THANH_PHAN_HO_SO.filter((t) => t.apDung(d))
}

export function danhGiaHoSo(hs: HoSoInput): KetQuaDanhGia {
  const muc: MucDanhGia[] = []
  const ngayDeNghi = parse(hs.ngayNop)

  const thanhPhanThieu = thanhPhanApDung(hs).filter((t) => !hs.thanhPhan[t.key]).map((t) => ({ key: t.key, label: t.label, canCu: t.canCu }))
  muc.push({
    ma: 'thanh_phan', noiDung: thanhPhanThieu.length ? `Còn thiếu ${thanhPhanThieu.length} thành phần hồ sơ` : 'Đủ thành phần hồ sơ',
    ketQua: thanhPhanThieu.length ? 'CHUA_DAT' : 'DAT', canCu: 'NĐ 212 Đ39; Đ30 k5 (thông báo bổ sung một lần trong 05 ngày làm việc)',
  })

  if (hs.loaiThuTuc === 'CAP_LAI') {
    muc.push({ ma: 'nang_luc', noiDung: 'Cấp lại — không đánh giá lại điều kiện năng lực; thời hạn ghi theo chứng chỉ cũ', ketQua: 'KHONG_AP_DUNG', canCu: 'NĐ 212 Đ27 k5, Đ29 k1 điểm b, Đ39 k2' })
    return { muc, hangDatSoBo: null, thanhPhanThieu }
  }

  muc.push({ ma: 'chuyen_nganh', noiDung: 'Chuyên ngành đào tạo phù hợp lĩnh vực đề nghị (Phụ lục I)', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ33 k2',
    ghiChu: 'Phụ lục I chưa có trong kho — cán bộ đối chiếu văn bằng, bảng điểm.' })
  if (!hs.laCongDanVN || hs.loaiThuTuc === 'CHUYEN_DOI') {
    muc.push({ ma: 'cu_tru', noiDung: 'Giấy tờ cư trú hoặc giấy phép lao động tại Việt Nam', ketQua: hs.thanhPhan['cu_tru'] ? 'DAT' : 'CHUA_DAT', canCu: 'NĐ 212 Đ33 k1; Đ39 k1 điểm e, k3 điểm d' })
  }
  if (hs.truongHop === 'DIEU_CHINH_HANG' && !hs.soCchnCu?.trim()) {
    muc.push({ ma: 'cchn_cu', noiDung: 'Điều chỉnh hạng nhưng chưa nhập số chứng chỉ đang có', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ29 k1 điểm a' })
  }

  const thieuTaiLieu = hs.kinhNghiem.filter((k) => !k.taiLieu).length
  const saiNhom = hs.kinhNghiem.filter((k) => k.taiLieu && (hs.hanhNgheDocLap !== (k.taiLieu === 'HOP_DONG_NGHIEM_THU'))).length
  if (hs.kinhNghiem.length) {
    muc.push({
      ma: 'tai_lieu', noiDung: thieuTaiLieu ? `${thieuTaiLieu} công trình chưa có tài liệu chứng minh` : 'Các công trình đều có tài liệu chứng minh',
      ketQua: thieuTaiLieu ? 'CHUA_DAT' : saiNhom ? 'CAN_KIEM_TRA' : 'DAT', canCu: 'NĐ 212 Đ39 k1 điểm đ',
      ghiChu: saiNhom ? `${saiNhom} công trình dùng nhóm tài liệu không khớp hình thức hành nghề (hợp đồng + biên bản nghiệm thu chỉ cho hành nghề độc lập).` : undefined,
    })
  }

  let hangDatSoBo: Hang | null = null
  for (const h of HANG) {
    if (danhGiaTrinhDo(hs, h).ketQua === 'DAT' && danhGiaSoNam(hs, h, ngayDeNghi).ketQua === 'DAT' && danhGiaCongTrinh(hs, h, ngayDeNghi).ketQua === 'DAT') { hangDatSoBo = h; break }
  }
  if (hs.hangDeNghi) {
    const h = hs.hangDeNghi
    for (const m of [danhGiaTrinhDo(hs, h), danhGiaSoNam(hs, h, ngayDeNghi), danhGiaCongTrinh(hs, h, ngayDeNghi)]) muc.push({ ...m, noiDung: `[Hạng ${h}] ${m.noiDung}` })
  } else {
    muc.push({ ma: 'hang', noiDung: 'Chưa chọn hạng đề nghị', ketQua: 'CAN_KIEM_TRA', canCu: 'NĐ 212 Đ33 k4' })
  }
  return { muc, hangDatSoBo, thanhPhanThieu }
}

// ── Thời hạn giải quyết (Đ30) — ngày làm việc tính thứ Hai–thứ Sáu, CHƯA trừ ngày lễ, Tết ──────────
export function congNgayLamViec(tu: Date, soNgay: number): Date {
  const d = new Date(tu)
  let con = soNgay
  while (con > 0) {
    d.setDate(d.getDate() + 1)
    const w = d.getDay()
    if (w !== 0 && w !== 6) con--
  }
  return d
}

export type MocThoiHan = { nhan: string; ngay: string | null; canCu: string }

export function tinhThoiHan(p: {
  loaiThuTuc: LoaiThuTuc; ngayNop?: string | null; ngayNhanDu?: string | null
  ngayHoiDong?: string | null; ngayThongBao?: string | null
}): MocThoiHan[] {
  const out: MocThoiHan[] = []
  const nop = parse(p.ngayNop)
  out.push({ nhan: 'Hạn thông báo bổ sung hồ sơ (một lần)', ngay: nop ? iso(congNgayLamViec(nop, 5)) : null, canCu: 'Đ30 k5 — 05 ngày làm việc kể từ ngày nộp' })
  const du = parse(p.ngayNhanDu)
  if (p.loaiThuTuc === 'CAP_LAI') {
    out.push({ nhan: 'Hạn cấp lại chứng chỉ', ngay: du ? iso(congNgayLamViec(du, 5)) : null, canCu: 'Đ30 k2 điểm b — 05 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ' })
    return out
  }
  // Đ30 k4: "trước ngày cuối cùng của tháng" / "trước ngày 15 của tháng tiếp theo" → hạn chót là ngày liền trước.
  let mocThang: Date | null = null
  if (du) {
    mocThang = du.getDate() < 15
      ? new Date(du.getFullYear(), du.getMonth() + 1, -1)   // ngày áp chót của tháng nhận đủ hồ sơ
      : new Date(du.getFullYear(), du.getMonth() + 1, 14)   // ngày 14 tháng sau
  }
  out.push({ nhan: 'Hạn chót thông báo kết quả đánh giá', ngay: mocThang ? iso(mocThang) : null,
    canCu: 'Đ30 k4 — trước ngày cuối cùng của tháng (hồ sơ hợp lệ trước ngày 15) hoặc trước ngày 15 tháng sau' })
  const hd = parse(p.ngayHoiDong)
  out.push({ nhan: 'Hạn thông báo sau khi Hội đồng có kết quả', ngay: hd ? iso(congNgayLamViec(hd, 2)) : null, canCu: 'Đ30 k4 — 02 ngày làm việc kể từ ngày có kết quả của Hội đồng' })
  const tb = parse(p.ngayThongBao)
  const soNgayCap = p.loaiThuTuc === 'CHUYEN_DOI' ? 11 : 6
  out.push({ nhan: `Hạn cấp chứng chỉ (${soNgayCap} ngày làm việc)`, ngay: tb ? iso(congNgayLamViec(tb, soNgayCap)) : null,
    canCu: `Đ30 k2 điểm ${p.loaiThuTuc === 'CHUYEN_DOI' ? 'c' : 'a'} — kể từ ngày thông báo kết quả đủ điều kiện` })
  return out
}

/** Ngày hôm nay theo giờ địa phương, dạng yyyy-mm-dd (tránh lệch ngày của toISOString ở UTC+7). */
export function homNay(): string {
  return iso(new Date())
}
