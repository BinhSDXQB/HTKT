// Tổng hợp đào tạo, bồi dưỡng trong năm cho hồ sơ đánh giá. Hàm thuần.
// Nguồn: lĩnh vực nghiệp vụ động `van-phong-so/dao-tao-boi-duong` (nghiep_vu_ban_ghi.customFields).
// Khoá đang học KHÔNG được tính là hoàn thành.

export type KetQuaDaoTao = 'Đang học' | 'Hoàn thành' | 'Chưa đạt' | 'Bỏ dở'

export type DongDaoTao = {
  id: string
  canBoId: string
  toChucMa?: string | null
  tenKhoa: string
  ketQua?: string | null
  soGio?: number | null
  coChungChi?: boolean | null
  daUngDung?: boolean | null
  nam: number
}

export type PhanLoaiDaoTao = 'HOAN_THANH' | 'DANG_HOC' | 'CHUA_HOAN_THANH' | 'CHUA_RO'

export function phanLoaiKhoa(ketQua?: string | null): PhanLoaiDaoTao {
  switch ((ketQua ?? '').trim()) {
    case 'Hoàn thành': return 'HOAN_THANH'
    case 'Đang học': return 'DANG_HOC'
    case 'Chưa đạt':
    case 'Bỏ dở': return 'CHUA_HOAN_THANH'
    default: return 'CHUA_RO'
  }
}

export type TongHopDaoTao = {
  soKhoa: number
  hoanThanh: number
  dangHoc: number
  chuaHoanThanh: number
  chuaRo: number
  /** Chỉ cộng giờ của khoá ĐÃ hoàn thành */
  tongGioHoanThanh: number
  daCapChungChi: number
  /** Khoá hoàn thành nhưng chưa có chứng nhận/chứng chỉ */
  hoanThanhChuaChungNhan: number
  daUngDung: number
}

export function rongTongHop(): TongHopDaoTao {
  return { soKhoa: 0, hoanThanh: 0, dangHoc: 0, chuaHoanThanh: 0, chuaRo: 0, tongGioHoanThanh: 0, daCapChungChi: 0, hoanThanhChuaChungNhan: 0, daUngDung: 0 }
}

export function tongHop(dong: DongDaoTao[], nam: number): TongHopDaoTao {
  const t = rongTongHop()
  for (const d of dong) {
    if (d.nam !== nam) continue
    t.soKhoa++
    const pl = phanLoaiKhoa(d.ketQua)
    if (pl === 'HOAN_THANH') {
      t.hoanThanh++
      t.tongGioHoanThanh += Math.max(0, d.soGio ?? 0)
      if (d.coChungChi) t.daCapChungChi++
      else t.hoanThanhChuaChungNhan++
      if (d.daUngDung) t.daUngDung++
    } else if (pl === 'DANG_HOC') t.dangHoc++
    else if (pl === 'CHUA_HOAN_THANH') t.chuaHoanThanh++
    else t.chuaRo++
  }
  return t
}

export function tongHopTheoNhom(dong: DongDaoTao[], nam: number, khoa: 'canBoId' | 'toChucMa'): Map<string, TongHopDaoTao> {
  const nhom = new Map<string, DongDaoTao[]>()
  for (const d of dong) {
    const k = (khoa === 'canBoId' ? d.canBoId : d.toChucMa) ?? '(không rõ)'
    if (!nhom.has(k)) nhom.set(k, [])
    nhom.get(k)!.push(d)
  }
  const kq = new Map<string, TongHopDaoTao>()
  for (const [k, v] of nhom) kq.set(k, tongHop(v, nam))
  return kq
}

/** Chuẩn hoá customFields của bản ghi đào tạo (chuỗi/ số lẫn lộn) về DongDaoTao. */
export function tuBanGhi(b: {
  id: string; canBoId: string | null; toChucMa?: string | null; tieuDe: string
  ngayGhiNhan?: Date | string | null; customFields: unknown
}, namMacDinh: number): DongDaoTao | null {
  if (!b.canBoId) return null
  const cf = (b.customFields && typeof b.customFields === 'object' ? b.customFields : {}) as Record<string, unknown>
  const so = (v: unknown) => { const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null }
  const co = (v: unknown) => v === true || v === 'Có' || v === 'true' || v === 'on'
  // Năm của khoá: từ ngày ghi nhận (cột chỉ có ngày → đọc theo UTC); nếu thiếu thì lấy năm cuối cùng trong ô "Thời gian";
  // vẫn không có thì 0 = chưa rõ năm, KHÔNG cộng vào bất kỳ năm nào (tránh một khoá bị tính cho nhiều năm).
  const tg = String(cf.thoiGian ?? '').match(/(?:19|20)\d\d/g)
  const nam = b.ngayGhiNhan ? new Date(b.ngayGhiNhan).getUTCFullYear() : tg ? Number(tg[tg.length - 1]) : 0
  void namMacDinh
  return {
    id: b.id, canBoId: b.canBoId, toChucMa: b.toChucMa ?? null, tenKhoa: b.tieuDe,
    ketQua: typeof cf.ketQua === 'string' ? cf.ketQua : null,
    soGio: so(cf.thoiLuongGio), coChungChi: co(cf.coChungChi), daUngDung: co(cf.daUngDung), nam,
  }
}
