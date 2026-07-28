// Phân tích & đối chiếu Căn cước công dân (CCCD) 12 số.
//
// Cấu trúc CCCD 12 số (Thông tư 07/2016/TT-BCA):
//   - 3 số đầu : mã tỉnh/thành nơi đăng ký khai sinh
//   - số thứ 4 : mã thế kỷ + giới tính
//       0/1 → TK20 (19xx) nam/nữ · 2/3 → TK21 (20xx) · 4/5 → TK22 (21xx) ...
//       chẵn = NAM, lẻ = NU; thế kỷ = 19 + floor(d4/2) (lấy 2 số đầu năm sinh)
//   - số 5–6  : 2 số cuối năm sinh
//   - số 7–12 : số ngẫu nhiên

export type CccdInfo = {
  valid: boolean
  maTinh: string | null
  gioiTinh: 'NAM' | 'NU' | null
  namSinh: number | null
}

/** Phân tích CCCD 12 số → suy ra mã tỉnh, giới tính, năm sinh. */
export function parseCccd(cccd?: string | null): CccdInfo {
  const s = (cccd ?? '').replace(/\s/g, '')
  if (!/^\d{12}$/.test(s)) {
    return { valid: false, maTinh: null, gioiTinh: null, namSinh: null }
  }
  const d4 = Number(s[3])
  const gioiTinh = d4 % 2 === 0 ? 'NAM' : 'NU'
  const theKyPrefix = 19 + Math.floor(d4 / 2) // 19, 20, 21...
  const namSinh = theKyPrefix * 100 + Number(s.slice(4, 6))
  return { valid: true, maTinh: s.slice(0, 3), gioiTinh, namSinh }
}

export type CccdMismatch = {
  field: 'format' | 'gioiTinh' | 'namSinh'
  message: string
}

/**
 * Đối chiếu CCCD với hồ sơ (giới tính, ngày sinh). Trả về danh sách cảnh báo lệch.
 * KHÔNG chặn — chỉ cảnh báo để người dùng kiểm tra lại.
 */
export function crossCheckCccd(input: {
  cccd?: string | null
  gioiTinh?: 'NAM' | 'NU' | null
  ngaySinh?: Date | string | null
}): CccdMismatch[] {
  const info = parseCccd(input.cccd)
  const out: CccdMismatch[] = []
  if (!info.valid) {
    out.push({ field: 'format', message: 'CCCD không đúng định dạng 12 số.' })
    return out
  }
  if (input.gioiTinh && info.gioiTinh && input.gioiTinh !== info.gioiTinh) {
    out.push({
      field: 'gioiTinh',
      message: `Giới tính trong CCCD (${info.gioiTinh === 'NAM' ? 'Nam' : 'Nữ'}) lệch với hồ sơ (${input.gioiTinh === 'NAM' ? 'Nam' : 'Nữ'}).`,
    })
  }
  if (input.ngaySinh && info.namSinh) {
    const namHoSo = new Date(input.ngaySinh).getFullYear()
    if (namHoSo && namHoSo !== info.namSinh) {
      out.push({
        field: 'namSinh',
        message: `Năm sinh suy từ CCCD (${info.namSinh}) lệch với hồ sơ (${namHoSo}).`,
      })
    }
  }
  return out
}
