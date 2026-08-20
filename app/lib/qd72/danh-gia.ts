// Engine ĐÁNH GIÁ SƠ BỘ theo tiêu chí cấu hình (bảng qd72_technical_rules).
// NGUYÊN TẮC (QĐ 72):
//  #5 KHÔNG hard-code tiêu chí — tiêu chí truyền vào từ bảng cấu hình.
//  #6 Kết quả tự tính CHỈ là "đánh giá sơ bộ"; kết luận chính thức do người có thẩm quyền.
//  #7 Thiếu số liệu/minh chứng → "CHUA_DU_DU_LIEU", KHÔNG tự kết luận "không đạt".
// Hàm thuần (không DB) → dễ kiểm thử, tái dùng ở API và giao diện.

export type ToanTu = '>=' | '<=' | '>' | '<' | '=' | 'range' | 'info'
export type KetQua = 'DAT' | 'KHONG_DAT' | 'CHUA_DU_DU_LIEU' | 'KHONG_AP_DUNG'

export type TieuChi = {
  maTieuChi: string
  ten: string
  giaTri: number | null          // ngưỡng số (null nếu ngưỡng phi số / chỉ thông tin)
  toanTu: ToanTu
  donVi?: string | null
  trangThai?: string             // 'ACTIVE' | 'INACTIVE'
}

export type KetQuaDanhGia = {
  ketQua: KetQua
  thongDiep: string
  soBo: true                     // luôn đánh dấu là sơ bộ
}

const HAU_TO = ' (đánh giá sơ bộ; kết luận chính thức do người có thẩm quyền xác minh).'

function hopLeSo(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Đánh giá SƠ BỘ một tiêu chí ngưỡng-số với giá trị đo. */
export function danhGiaTieuChi(tc: TieuChi, giaTriDo: number | null | undefined): KetQuaDanhGia {
  if (tc.trangThai && tc.trangThai !== 'ACTIVE') {
    return { ketQua: 'KHONG_AP_DUNG', thongDiep: `Tiêu chí "${tc.ten}" đang ngừng áp dụng.`, soBo: true }
  }
  if (tc.toanTu === 'info') {
    return { ketQua: 'KHONG_AP_DUNG', thongDiep: `"${tc.ten}" chỉ mang tính thông tin, không dùng để kết luận đạt/không đạt.`, soBo: true }
  }
  // Ngưỡng phi số (vd tỉ lệ dốc "1:8,3") → cần xác minh thủ công, không tự kết luận.
  if (!hopLeSo(tc.giaTri)) {
    return { ketQua: 'CHUA_DU_DU_LIEU', thongDiep: `Tiêu chí "${tc.ten}" có ngưỡng không phải số — cần đơn vị chuyên môn đối chiếu thủ công.` + HAU_TO, soBo: true }
  }
  // Thiếu dữ liệu đo → CHUA_DU_DU_LIEU (Nguyên tắc #7).
  if (!hopLeSo(giaTriDo)) {
    return { ketQua: 'CHUA_DU_DU_LIEU', thongDiep: `Chưa đủ dữ liệu để đánh giá "${tc.ten}" — cần đo/bổ sung số liệu và minh chứng.`, soBo: true }
  }

  const nguong = tc.giaTri as number
  const dv = tc.donVi ? ` ${tc.donVi}` : ''
  let dat: boolean
  switch (tc.toanTu) {
    case '>=': dat = giaTriDo >= nguong; break
    case '>':  dat = giaTriDo >  nguong; break
    case '<=': dat = giaTriDo <= nguong; break
    case '<':  dat = giaTriDo <  nguong; break
    case '=':  dat = giaTriDo === nguong; break
    default:
      return { ketQua: 'CHUA_DU_DU_LIEU', thongDiep: `Chưa hỗ trợ tự đánh giá toán tử "${tc.toanTu}" cho "${tc.ten}".` + HAU_TO, soBo: true }
  }
  const moTa = `Đo ${giaTriDo}${dv}, ngưỡng ${tc.toanTu} ${nguong}${dv}`
  return dat
    ? { ketQua: 'DAT', thongDiep: `${moTa}: đạt sơ bộ` + HAU_TO, soBo: true }
    : { ketQua: 'KHONG_DAT', thongDiep: `${moTa}: KHÔNG đạt sơ bộ` + HAU_TO, soBo: true }
}

/** Cảnh báo chuẩn cho chiều cao thông thủy < 4,5 m (đúng câu chữ QĐ 72 / QCVN 06). */
export function canhBaoChieuCaoThongThuy(giaTriDoM: number | null | undefined, nguongM: number): string | null {
  if (!hopLeSo(giaTriDoM)) return null
  if (giaTriDoM >= nguongM) return null
  return 'Không bảo đảm chiều cao thông thủy sơ bộ cho xe chữa cháy theo mục 6.2.1.3 QCVN 06:2022/BXD; ' +
    'cần đơn vị chuyên ngành kiểm tra, xác minh và đề xuất xử lý. ' +
    'Lưu ý: KHÔNG dùng giá trị này thay cho các khoảng cách an toàn điện chuyên ngành.'
}

/** Trạng thái chủ sở hữu khi chưa xác định (Nguyên tắc #C Phiếu 03). */
export function trangThaiChuSoHuu(daXacDinh: boolean): string {
  return daXacDinh ? 'Đã xác định chủ sở hữu' : 'Chưa xác định chủ sở hữu - cần phối hợp rà soát'
}
