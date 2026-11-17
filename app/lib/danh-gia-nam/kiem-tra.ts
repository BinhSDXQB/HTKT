// 10 kiểm tra tự động hồ sơ đánh giá cuối năm. Hàm thuần: nhận dữ liệu đã nạp, trả danh sách vấn đề.
// Mỗi vấn đề nêu rõ lỗi, vị trí cần sửa và dữ liệu liên quan. Không tự sửa, không tự đổi mức xếp loại.
import { kiemTraDiemChung, mucCao, mucToiDaTheoDiem, tongDiemNam, TIEU_CHI_CHUNG, type DieuKienXepLoai, type MucXepLoaiMa } from './tieu-chi'
import { kiemTraMauDungDoiTuong, type DoiTuongChonMau } from './mau-bieu'
import { phanLoaiKhoa } from './dao-tao'
import { THIEU } from './nhan-xet'

export type MaKiemTra =
  | 'THIEU_MINH_CHUNG'
  | 'NHAN_XET_LECH_VTVL'
  | 'THANH_TICH_TRUNG'
  | 'NHIEM_VU_CHUA_XONG_GHI_XONG'
  | 'KHOA_CHUA_XONG_GHI_CHUNG_CHI'
  | 'DIEM_KHONG_KHOP'
  | 'MAU_SAI_DOI_TUONG'
  | 'MAU_THUAN_GIUA_CAC_KY'
  | 'DE_XUAT_CHUA_DU_DIEU_KIEN'
  | 'TRUY_CAP_NGOAI_THAM_QUYEN'

export type VanDe = {
  ma: MaKiemTra
  mucDo: 'LOI' | 'CANH_BAO'
  thongDiep: string
  /** nơi cần sửa, ví dụ "Nhận xét › Kết quả thực hiện nhiệm vụ" */
  viTri: string
  duLieu?: Record<string, unknown>
}

export type DoanNhanXet = {
  /** mã mục trong 9 phần, vd 'uu_diem', 'trach_nhiem_lanh_dao', 'khac_phuc' */
  muc: string
  noiDung: string
  /** nguồn dữ liệu: id công việc, khoá học, minh chứng… */
  nguon: string[]
  /** id công việc mà đoạn này khẳng định là ĐÃ hoàn thành */
  khangDinhHoanThanh?: string[]
  /** id khoá học mà đoạn này khẳng định là ĐÃ có chứng chỉ */
  khangDinhChungChi?: string[]
}

export type CongViecDanhGia = {
  id: string; tieuDe: string; trangThai: string; tienDo?: number | null; soMinhChung: number
}

export type KhoaHocDanhGia = { id: string; tenKhoa: string; ketQua?: string | null; coChungChi?: boolean | null }

export type SuKienTruyCap = {
  nguoiXemId: string; nguoiXemTen?: string; laChinhChu: boolean; coQuyenXem: boolean; loaiHoSo: string; luc?: string
}

export type DauVaoKiemTra = {
  nam: number
  canBo: { id: string; hoTen: string; laLanhDaoQuanLy: boolean } & DoiTuongChonMau
  mauApDung?: string
  nhanXet: DoanNhanXet[]
  congViec: CongViecDanhGia[]
  khoaHoc: KhoaHocDanhGia[]
  diemChung?: Record<string, number | null | undefined>
  /** Tổng điểm KPI (≤100) lấy từ Mẫu 04 */
  diemKpiTong?: number | null
  /** Tổng điểm người dùng nhập tay (nếu có) để đối chiếu */
  tongDiemNhap?: number | null
  mucDeXuat?: MucXepLoaiMa | null
  dieuKienXepLoai?: DieuKienXepLoai
  kyTruoc?: { nam: number; mucXepLoai?: MucXepLoaiMa | null; soHanChe: number }
  truyCap?: SuKienTruyCap[]
}

const MUC_NHAN_XET_BAT_BUOC_NGUON = new Set(['uu_diem', 'ket_qua_nhiem_vu', 'dao_tao', 'han_che', 'khac_phuc'])

function chuanHoaChu(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function kiemTraHoSo(d: DauVaoKiemTra): VanDe[] {
  const vd: VanDe[] = []
  const cvTheoId = new Map(d.congViec.map((c) => [c.id, c]))
  const khoaTheoId = new Map(d.khoaHoc.map((k) => [k.id, k]))

  // 1. Thiếu minh chứng
  for (const x of d.nhanXet) {
    if (x.noiDung.endsWith(THIEU)) {
      vd.push({ ma: 'THIEU_MINH_CHUNG', mucDo: 'CANH_BAO', viTri: `Nhận xét › ${x.muc}`, thongDiep: 'Đoạn nhận xét chưa có dữ liệu trong hệ thống; cần bổ sung nội dung kèm minh chứng hoặc để trống có chủ ý.', duLieu: { doan: x.muc } })
    } else if (MUC_NHAN_XET_BAT_BUOC_NGUON.has(x.muc) && x.noiDung.trim() && x.nguon.length === 0) {
      vd.push({ ma: 'THIEU_MINH_CHUNG', mucDo: 'LOI', viTri: `Nhận xét › ${x.muc}`, thongDiep: 'Đoạn nhận xét không gắn nguồn dữ liệu hoặc minh chứng.', duLieu: { doan: x.muc } })
    }
  }
  for (const c of d.congViec) {
    if (c.trangThai === 'HOAN_THANH' && c.soMinhChung === 0) {
      vd.push({ ma: 'THIEU_MINH_CHUNG', mucDo: 'CANH_BAO', viTri: `Nhiệm vụ › ${c.tieuDe}`, thongDiep: 'Nhiệm vụ đã hoàn thành nhưng chưa có minh chứng đính kèm.', duLieu: { congViecId: c.id } })
    }
  }

  // 2. Nhận xét không hợp vị trí việc làm: người không giữ chức vụ lại có nhận xét trách nhiệm lãnh đạo
  if (!d.canBo.laLanhDaoQuanLy) {
    for (const x of d.nhanXet) {
      if (x.muc === 'trach_nhiem_lanh_dao' && x.noiDung.trim()) {
        vd.push({ ma: 'NHAN_XET_LECH_VTVL', mucDo: 'LOI', viTri: 'Nhận xét › Trách nhiệm lãnh đạo, quản lý', thongDiep: 'Người không giữ chức vụ lãnh đạo, quản lý nhưng có nhận xét về trách nhiệm lãnh đạo, quản lý.', duLieu: { canBoId: d.canBo.id } })
      }
    }
  }

  // 4. Nhiệm vụ chưa xong mà ghi đã xong
  for (const x of d.nhanXet) {
    for (const id of x.khangDinhHoanThanh ?? []) {
      const c = cvTheoId.get(id)
      if (!c) vd.push({ ma: 'NHIEM_VU_CHUA_XONG_GHI_XONG', mucDo: 'LOI', viTri: `Nhận xét › ${x.muc}`, thongDiep: 'Đoạn nhận xét nêu nhiệm vụ không có trong dữ liệu.', duLieu: { congViecId: id } })
      else if (c.trangThai !== 'HOAN_THANH') {
        vd.push({ ma: 'NHIEM_VU_CHUA_XONG_GHI_XONG', mucDo: 'LOI', viTri: `Nhận xét › ${x.muc}`, thongDiep: `Nhiệm vụ "${c.tieuDe}" ghi đã hoàn thành nhưng dữ liệu đang là ${c.trangThai} (tiến độ ${c.tienDo ?? 0}%).`, duLieu: { congViecId: id, trangThai: c.trangThai } })
      }
    }
  }

  // 5. Khoá học chưa xong mà ghi có chứng chỉ
  for (const x of d.nhanXet) {
    for (const id of x.khangDinhChungChi ?? []) {
      const k = khoaTheoId.get(id)
      if (!k) vd.push({ ma: 'KHOA_CHUA_XONG_GHI_CHUNG_CHI', mucDo: 'LOI', viTri: `Nhận xét › ${x.muc}`, thongDiep: 'Đoạn nhận xét nêu chứng chỉ của khoá học không có trong dữ liệu.', duLieu: { khoaId: id } })
      else if (phanLoaiKhoa(k.ketQua) !== 'HOAN_THANH') {
        vd.push({ ma: 'KHOA_CHUA_XONG_GHI_CHUNG_CHI', mucDo: 'LOI', viTri: `Nhận xét › ${x.muc}`, thongDiep: `Khoá "${k.tenKhoa}" chưa hoàn thành (${k.ketQua ?? 'chưa rõ'}) nhưng được ghi có chứng chỉ.`, duLieu: { khoaId: id } })
      }
    }
  }
  for (const k of d.khoaHoc) {
    if (k.coChungChi && phanLoaiKhoa(k.ketQua) !== 'HOAN_THANH') {
      vd.push({ ma: 'KHOA_CHUA_XONG_GHI_CHUNG_CHI', mucDo: 'LOI', viTri: `Đào tạo › ${k.tenKhoa}`, thongDiep: 'Khoá học chưa hoàn thành nhưng đã đánh dấu có chứng chỉ.', duLieu: { khoaId: k.id, ketQua: k.ketQua } })
    }
  }

  // 6. Điểm không khớp bộ tiêu chí
  if (d.diemChung) {
    const kt = kiemTraDiemChung(d.diemChung)
    for (const l of kt.loi) vd.push({ ma: 'DIEM_KHONG_KHOP', mucDo: 'LOI', viTri: 'Tự đánh giá › Tiêu chí chung', thongDiep: l })
    if (d.diemKpiTong !== null && d.diemKpiTong !== undefined) {
      if (d.diemKpiTong < 0 || d.diemKpiTong > 100) vd.push({ ma: 'DIEM_KHONG_KHOP', mucDo: 'LOI', viTri: 'KPI › Tổng điểm', thongDiep: `Tổng điểm KPI ${d.diemKpiTong} ngoài khoảng 0–100.` })
      else if (d.tongDiemNhap !== null && d.tongDiemNhap !== undefined) {
        const dung = tongDiemNam(kt.tong, d.diemKpiTong)
        if (Math.abs(dung - d.tongDiemNhap) > 0.01) {
          vd.push({ ma: 'DIEM_KHONG_KHOP', mucDo: 'LOI', viTri: 'Tự đánh giá › Tổng điểm', thongDiep: `Tổng điểm nhập ${d.tongDiemNhap} khác tính lại ${dung} (chung ${kt.tong} + KPI×70/100).`, duLieu: { nhap: d.tongDiemNhap, tinhLai: dung } })
        }
      }
    }
  }

  // 7. Biểu mẫu sai đối tượng
  if (d.mauApDung) {
    const l = kiemTraMauDungDoiTuong(d.mauApDung, d.canBo)
    if (l) vd.push({ ma: 'MAU_SAI_DOI_TUONG', mucDo: 'LOI', viTri: 'Biểu mẫu áp dụng', thongDiep: l, duLieu: { mau: d.mauApDung } })
  }

  // 8. Mâu thuẫn giữa các kỳ
  if (d.kyTruoc) {
    const khacPhuc = d.nhanXet.find((x) => x.muc === 'khac_phuc' && x.noiDung.trim() && !x.noiDung.endsWith(THIEU))
    if (khacPhuc && d.kyTruoc.soHanChe === 0) {
      vd.push({ ma: 'MAU_THUAN_GIUA_CAC_KY', mucDo: 'CANH_BAO', viTri: 'Nhận xét › Kết quả khắc phục', thongDiep: `Nêu kết quả khắc phục nhưng kỳ ${d.kyTruoc.nam} không ghi nhận hạn chế nào.`, duLieu: { kyTruoc: d.kyTruoc.nam } })
    }
    if (d.mucDeXuat && d.kyTruoc.mucXepLoai === 'KHONG_HOAN_THANH_NHIEM_VU' && d.mucDeXuat === 'HOAN_THANH_XUAT_SAC_NHIEM_VU') {
      vd.push({ ma: 'MAU_THUAN_GIUA_CAC_KY', mucDo: 'CANH_BAO', viTri: 'Đề xuất xếp loại', thongDiep: `Năm ${d.kyTruoc.nam} không hoàn thành nhiệm vụ, năm nay đề xuất xuất sắc: cần minh chứng khắc phục.` })
    }
  }

  // 7b. Có đề xuất mức nhưng chưa đủ dữ liệu chấm điểm (không để bỏ trống điểm/KPI để né kiểm tra điều kiện)
  if (d.mucDeXuat) {
    const thieu = TIEU_CHI_CHUNG.filter((c) => d.diemChung?.[c.ma] === null || d.diemChung?.[c.ma] === undefined).map((c) => c.ma)
    if (thieu.length || d.diemKpiTong === null || d.diemKpiTong === undefined) {
      vd.push({ ma: 'DE_XUAT_CHUA_DU_DIEU_KIEN', mucDo: 'LOI', viTri: 'Tự đánh giá › Điểm', thongDiep: `Đã đề xuất mức xếp loại nhưng chưa đủ dữ liệu chấm điểm${thieu.length ? ` (thiếu tiêu chí ${thieu.join(', ')})` : ''}${d.diemKpiTong === null || d.diemKpiTong === undefined ? ' và chưa có điểm KPI' : ''}.`, duLieu: { thieu } })
    }
  }

  // 9. Kết quả đề xuất chưa đủ điều kiện
  if (d.mucDeXuat && d.diemChung && d.diemKpiTong !== null && d.diemKpiTong !== undefined) {
    const tong = tongDiemNam(kiemTraDiemChung(d.diemChung).tong, d.diemKpiTong)
    const toiDa = mucToiDaTheoDiem(tong, d.dieuKienXepLoai)
    if (mucCao(d.mucDeXuat, toiDa.muc)) {
      vd.push({ ma: 'DE_XUAT_CHUA_DU_DIEU_KIEN', mucDo: 'LOI', viTri: 'Đề xuất xếp loại', thongDiep: `Đề xuất ${d.mucDeXuat} cao hơn mức tối đa ${toiDa.muc} theo điểm ${tong}. ${toiDa.ghiChu.join(' ')}`.trim(), duLieu: { tong, toiDa: toiDa.muc } })
    }
  }

  // 10. Truy cập ngoài thẩm quyền
  for (const t of d.truyCap ?? []) {
    if (!t.laChinhChu && !t.coQuyenXem) {
      vd.push({ ma: 'TRUY_CAP_NGOAI_THAM_QUYEN', mucDo: 'LOI', viTri: `Nhật ký truy cập › ${t.loaiHoSo}`, thongDiep: `Người dùng ${t.nguoiXemTen ?? t.nguoiXemId} đã cố truy cập hồ sơ khi không có quyền (hệ thống đã chặn).`, duLieu: { nguoiXemId: t.nguoiXemId, luc: t.luc } })
    }
  }
  return vd
}

export type ThanhTichCaNhan = { canBoId: string; hoTen?: string; noiDung: string }

/** 3. Thành tích trùng giữa các cá nhân (so khớp sau khi chuẩn hoá chữ, bỏ đoạn quá ngắn). */
export function kiemTraThanhTichTrung(ds: ThanhTichCaNhan[], minKyTu = 30): VanDe[] {
  const nhom = new Map<string, ThanhTichCaNhan[]>()
  for (const t of ds) {
    const k = chuanHoaChu(t.noiDung)
    if (k.length < minKyTu) continue
    if (!nhom.has(k)) nhom.set(k, [])
    nhom.get(k)!.push(t)
  }
  const vd: VanDe[] = []
  for (const [, v] of nhom) {
    const nguoi = new Set(v.map((x) => x.canBoId))
    if (nguoi.size >= 2) {
      vd.push({ ma: 'THANH_TICH_TRUNG', mucDo: 'CANH_BAO', viTri: 'Nhận xét › Thành tích', thongDiep: `Cùng một nội dung thành tích xuất hiện ở ${nguoi.size} cá nhân; cần minh chứng riêng cho từng người.`, duLieu: { canBoIds: [...nguoi], doan: v[0].noiDung.slice(0, 80) } })
    }
  }
  return vd
}
