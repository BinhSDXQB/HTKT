// Tổng hợp đánh giá cuối năm theo phòng (dashboard). Hàm thuần.
// KHÔNG suy mức xếp loại tập thể từ xếp loại cá nhân: kết quả tập thể do tập thể nhập (Mẫu 01),
// ở đây chỉ đếm số liệu cá nhân và dự thảo nhận xét tập thể từ kết quả công việc thực tế.
import { TRANG_THAI_DANH_GIA, TRANG_THAI_DANH_GIA_LABEL, duocGhiXepLoaiChinhThuc, type TrangThaiDanhGia } from './trang-thai'
import { rongTongHop, tongHop, type DongDaoTao, type TongHopDaoTao } from './dao-tao'
import type { MucXepLoaiMa } from './tieu-chi'

export type HoSoTongHop = {
  canBoId: string
  hoTen: string
  trangThai: TrangThaiDanhGia | null // null = chưa lập hồ sơ
  tongDiem?: number | null
  mucDeXuat?: MucXepLoaiMa | null
  mucPheDuyet?: MucXepLoaiMa | null
  soVanDe?: number
}

export type CongViecPhong = { trangThai: string; tienDo?: number | null; tieuDe: string; ngayHetHan?: Date | string | null }

export type TongHopPhong = {
  tongNhanSu: number
  chuaLapHoSo: number
  theoTrangThai: Record<TrangThaiDanhGia, number>
  hoSoHoanThanh: number
  hoSoConThieu: number
  choNhanXet: number
  choPheDuyet: number
  /** Chỉ đếm mức đã phê duyệt chính thức; hồ sơ chưa duyệt KHÔNG vào bảng này */
  mucDaPheDuyet: Record<MucXepLoaiMa, number>
  nhiemVu: { tong: number; hoanThanh: number; dangLam: number; tamDung: number; choDuyet: number; moi: number; huy: number; quaHan: number }
  daoTao: TongHopDaoTao
}

export function tongHopPhong(hoSo: HoSoTongHop[], congViec: CongViecPhong[], daoTao: DongDaoTao[], nam: number, homNay = new Date()): TongHopPhong {
  const theoTrangThai = Object.fromEntries(TRANG_THAI_DANH_GIA.map((t) => [t, 0])) as Record<TrangThaiDanhGia, number>
  const mucDaPheDuyet: Record<MucXepLoaiMa, number> = {
    HOAN_THANH_XUAT_SAC_NHIEM_VU: 0, HOAN_THANH_TOT_NHIEM_VU: 0, HOAN_THANH_NHIEM_VU: 0, KHONG_HOAN_THANH_NHIEM_VU: 0,
  }
  let chuaLap = 0, hoanThanh = 0
  for (const h of hoSo) {
    if (!h.trangThai) { chuaLap++; continue }
    theoTrangThai[h.trangThai]++
    if (duocGhiXepLoaiChinhThuc(h.trangThai)) {
      hoanThanh++
      if (h.mucPheDuyet) mucDaPheDuyet[h.mucPheDuyet]++
    }
  }
  const nv = { tong: congViec.length, hoanThanh: 0, dangLam: 0, tamDung: 0, choDuyet: 0, moi: 0, huy: 0, quaHan: 0 }
  for (const c of congViec) {
    if (c.trangThai === 'HOAN_THANH') nv.hoanThanh++
    else if (c.trangThai === 'DANG_LAM') nv.dangLam++
    else if (c.trangThai === 'TAM_DUNG') nv.tamDung++
    else if (c.trangThai === 'CHO_DUYET') nv.choDuyet++
    else if (c.trangThai === 'MOI') nv.moi++
    else if (c.trangThai === 'HUY') nv.huy++
    if (c.ngayHetHan && c.trangThai !== 'HOAN_THANH' && c.trangThai !== 'HUY' && new Date(c.ngayHetHan) < homNay) nv.quaHan++
  }
  return {
    tongNhanSu: hoSo.length,
    chuaLapHoSo: chuaLap,
    theoTrangThai,
    hoSoHoanThanh: hoanThanh,
    hoSoConThieu: hoSo.length - hoanThanh,
    choNhanXet: theoTrangThai.GUI_NHAN_XET,
    choPheDuyet: theoTrangThai.TRINH_PHE_DUYET,
    mucDaPheDuyet,
    nhiemVu: nv,
    daoTao: daoTao.length ? tongHop(daoTao, nam) : rongTongHop(),
  }
}

/**
 * Dự thảo nhận xét tập thể từ số liệu công việc thực tế. Không nêu mức xếp loại, không khẳng định ngoài số liệu.
 * Người có thẩm quyền sửa, hoàn thiện Mẫu 01.
 */
export function duThaoNhanXetTapThe(tenPhong: string, nam: number, t: TongHopPhong): string[] {
  const dong: string[] = []
  const nv = t.nhiemVu
  if (nv.tong === 0) {
    dong.push(`Năm ${nam}, hệ thống chưa ghi nhận công việc nào của ${tenPhong}; chưa đủ dữ liệu để nhận xét kết quả nhiệm vụ.`)
  } else {
    const tl = Math.round((nv.hoanThanh / nv.tong) * 100)
    dong.push(`Năm ${nam}, ${tenPhong} có ${nv.tong} công việc được ghi nhận trên hệ thống; ${nv.hoanThanh} việc đã hoàn thành (${tl}%), ${nv.dangLam} đang thực hiện, ${nv.choDuyet} chờ duyệt, ${nv.tamDung} tạm dừng.`)
    if (nv.quaHan > 0) dong.push(`Có ${nv.quaHan} công việc quá hạn chưa hoàn thành, cần nêu nguyên nhân và trách nhiệm trong phần hạn chế.`)
  }
  const d = t.daoTao
  if (d.soKhoa > 0) dong.push(`Đào tạo, bồi dưỡng: ${d.soKhoa} khoá ghi nhận, ${d.hoanThanh} khoá đã hoàn thành (${d.tongGioHoanThanh} giờ), ${d.dangHoc} khoá đang học (chưa tính hoàn thành).`)
  dong.push(`Hồ sơ đánh giá cá nhân: ${t.hoSoHoanThanh}/${t.tongNhanSu} đã phê duyệt; ${t.choNhanXet} chờ nhận xét; ${t.choPheDuyet} chờ phê duyệt.`)
  dong.push('Mức xếp loại tập thể do tập thể lãnh đạo, quản lý tự đánh giá theo Mẫu 01; không suy ra từ xếp loại cá nhân.')
  return dong
}

export { TRANG_THAI_DANH_GIA_LABEL }
