// Soạn nhận xét hỗ trợ — 9 phần, 3 độ dài — CHỈ từ dữ liệu có trong hệ thống. Hàm thuần, KHÔNG gọi AI ngoài,
// không gửi dữ liệu nhân sự ra ngoài. Phần nào thiếu dữ liệu thì để trống và ghi rõ "chưa có dữ liệu";
// không tự tạo thành tích, khuyết điểm, hay mức xếp loại. Mỗi đoạn mang danh sách nguồn để truy ngược.
import type { DoanNhanXet } from './kiem-tra'
import type { TongHopDaoTao } from './dao-tao'
import { mucToiDaTheoDiem, type DieuKienXepLoai } from './tieu-chi'

export type DoDai = 'NGAN_GON' | 'TIEU_CHUAN' | 'CHI_TIET'
const GIOI_HAN: Record<DoDai, number> = { NGAN_GON: 2, TIEU_CHUAN: 5, CHI_TIET: 50 }

export const MUC_NHAN_XET = [
  ['uu_diem', 'Ưu điểm, kết quả nổi bật'],
  ['ket_qua_nhiem_vu', 'Kết quả thực hiện nhiệm vụ'],
  ['trach_nhiem_lanh_dao', 'Trách nhiệm lãnh đạo, quản lý'],
  ['dao_tao', 'Đào tạo, bồi dưỡng'],
  ['han_che', 'Hạn chế, khuyết điểm có căn cứ'],
  ['nguyen_nhan', 'Nguyên nhân và trách nhiệm'],
  ['khac_phuc', 'Kết quả khắc phục'],
  ['phuong_huong', 'Phương hướng, giải pháp'],
  ['de_xuat_xep_loai', 'Đề xuất mức xếp loại theo quy trình'],
] as const

export type DuKienNhanXet = {
  nam: number
  hoTen: string
  tenPhong?: string | null
  chucVu?: string | null
  viTriViecLam?: string | null
  laLanhDaoQuanLy: boolean
  congViec: { id: string; tieuDe: string; trangThai: string; tienDo?: number | null; soMinhChung: number }[]
  /** Thành tích đã có trong hồ sơ (khen thưởng…) kèm mã nguồn */
  thanhTich: { id: string; noiDung: string }[]
  /** Hạn chế đã được ghi nhận (kết luận, kỷ luật, nhận xét kỳ trước) kèm mã nguồn */
  hanChe: { id: string; noiDung: string; nguyenNhan?: string | null; daKhacPhuc?: boolean | null }[]
  daoTao: TongHopDaoTao
  khoaHoc: { id: string; tenKhoa: string; ketQua?: string | null; coChungChi?: boolean | null }[]
  /** Có khi không tự gán đào tạo cho người này (ví dụ trùng họ tên) — hiển thị cho người xem */
  daoTaoChuaGan?: string
  /** Việc cấp có thẩm quyền ghi cho cán bộ lãnh đạo: số đơn vị, nhiệm vụ quản lý… (nếu có) */
  quanLy?: { id: string; noiDung: string }[]
  tongDiem?: number | null
  dieuKienXepLoai?: DieuKienXepLoai
}

const nhan = (m: string) => MUC_NHAN_XET.find((x) => x[0] === m)![1]
export const THIEU = 'Chưa có dữ liệu trong hệ thống; người có thẩm quyền bổ sung.'

export function soanNhanXet(d: DuKienNhanXet, doDai: DoDai): DoanNhanXet[] {
  const gh = GIOI_HAN[doDai]
  const kq: DoanNhanXet[] = []
  const them = (muc: string, noiDung: string, nguon: string[], extra: Partial<DoanNhanXet> = {}) => {
    kq.push({ muc, noiDung, nguon, ...extra })
  }
  const xong = d.congViec.filter((c) => c.trangThai === 'HOAN_THANH')
  const chuaXong = d.congViec.filter((c) => c.trangThai !== 'HOAN_THANH' && c.trangThai !== 'HUY')

  // 1. Ưu điểm: chỉ từ thành tích đã ghi nhận
  if (d.thanhTich.length) {
    const ds = d.thanhTich.slice(0, gh)
    them('uu_diem', `${d.hoTen}: ${ds.map((t) => t.noiDung).join('; ')}.`, ds.map((t) => t.id))
  } else them('uu_diem', '', [], {})

  // 2. Kết quả nhiệm vụ: số liệu thật + kể tên việc đã hoàn thành (có minh chứng mới nêu tên)
  if (d.congViec.length) {
    const cmc = xong.filter((c) => c.soMinhChung > 0).slice(0, gh)
    let nd = `Năm ${d.nam} được giao ${d.congViec.length} nhiệm vụ trên hệ thống; ${xong.length} đã hoàn thành, ${chuaXong.length} chưa hoàn thành.`
    if (doDai !== 'NGAN_GON' && cmc.length) nd += ` Nhiệm vụ hoàn thành có minh chứng: ${cmc.map((c) => c.tieuDe).join('; ')}.`
    if (doDai === 'CHI_TIET' && chuaXong.length) nd += ` Chưa hoàn thành: ${chuaXong.slice(0, gh).map((c) => `${c.tieuDe} (${c.tienDo ?? 0}%)`).join('; ')}.`
    them('ket_qua_nhiem_vu', nd, d.congViec.slice(0, gh * 2).map((c) => c.id), { khangDinhHoanThanh: cmc.map((c) => c.id) })
  } else them('ket_qua_nhiem_vu', '', [])

  // 3. Trách nhiệm lãnh đạo: chỉ cho người giữ chức vụ
  if (d.laLanhDaoQuanLy) {
    if (d.quanLy?.length) them('trach_nhiem_lanh_dao', d.quanLy.slice(0, gh).map((q) => q.noiDung).join('; ') + '.', d.quanLy.slice(0, gh).map((q) => q.id))
    else them('trach_nhiem_lanh_dao', '', [])
  }

  // 4. Đào tạo: khoá đang học KHÔNG tính hoàn thành
  const t = d.daoTao
  if (t.soKhoa) {
    let nd = `Năm ${d.nam}: ${t.soKhoa} khoá; ${t.hoanThanh} hoàn thành (${t.tongGioHoanThanh} giờ), ${t.dangHoc} đang học (chưa tính hoàn thành), ${t.chuaHoanThanh} chưa hoàn thành; ${t.daCapChungChi} khoá đã cấp chứng chỉ, ${t.hoanThanhChuaChungNhan} khoá hoàn thành chưa có chứng nhận.`
    if (doDai === 'CHI_TIET') nd += ` Đã ứng dụng vào nhiệm vụ: ${t.daUngDung} khoá. Danh sách: ${d.khoaHoc.map((k) => `${k.tenKhoa} (${k.ketQua ?? 'chưa rõ'})`).join('; ')}.`
    them('dao_tao', nd, d.khoaHoc.map((k) => k.id))
  } else them('dao_tao', '', [])

  // 5–7. Hạn chế, nguyên nhân, khắc phục: chỉ từ hạn chế ĐÃ GHI NHẬN, không tự suy
  if (d.hanChe.length) {
    const ds = d.hanChe.slice(0, gh)
    them('han_che', ds.map((h) => h.noiDung).join('; ') + '.', ds.map((h) => h.id))
    const co = ds.filter((h) => h.nguyenNhan)
    them('nguyen_nhan', co.length ? co.map((h) => h.nguyenNhan).join('; ') + '.' : '', co.map((h) => h.id))
    const kp = ds.filter((h) => h.daKhacPhuc !== null && h.daKhacPhuc !== undefined)
    them('khac_phuc', kp.length ? kp.map((h) => `${h.noiDung}: ${h.daKhacPhuc ? 'đã khắc phục' : 'chưa khắc phục'}`).join('; ') + '.' : '', kp.map((h) => h.id))
  } else {
    them('han_che', '', []); them('nguyen_nhan', '', []); them('khac_phuc', '', [])
  }

  // 8. Phương hướng: chỉ nêu việc đang dở có trong dữ liệu
  if (chuaXong.length) {
    them('phuong_huong', `Tiếp tục hoàn thành: ${chuaXong.slice(0, gh).map((c) => c.tieuDe).join('; ')}.`, chuaXong.slice(0, gh).map((c) => c.id))
  } else them('phuong_huong', '', [])

  // 9. Đề xuất mức: không tự quyết; chỉ nêu mức tối đa theo điểm nếu đã có điểm
  if (d.tongDiem !== null && d.tongDiem !== undefined) {
    const m = mucToiDaTheoDiem(d.tongDiem, d.dieuKienXepLoai)
    them('de_xuat_xep_loai', `Tổng điểm ${d.tongDiem}; theo ngưỡng điểm, mức cao nhất có thể đề xuất là ${m.muc}. ${m.ghiChu.join(' ')} Mức xếp loại do cấp có thẩm quyền quyết định.`.trim(), ['diem-tong'])
  } else them('de_xuat_xep_loai', '', [])

  // Đoạn trống → ghi rõ thiếu dữ liệu để người sửa thấy, không để AI/hệ thống bịa
  return kq.map((x) => (x.noiDung.trim() ? x : { ...x, noiDung: `[${nhan(x.muc)}] ${THIEU}` }))
}

/** Đoạn còn là chỗ trống thiếu dữ liệu (để giao diện tô nổi và chặn trình duyệt khi chưa sửa). */
export function laDoanThieuDuLieu(x: DoanNhanXet): boolean {
  return x.noiDung.endsWith(THIEU)
}
