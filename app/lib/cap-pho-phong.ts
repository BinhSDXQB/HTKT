/**
 * Đối chiếu số cấp phó thực tế của 11 phòng thuộc Sở với định mức.
 *
 * Nguồn định mức: công văn của Sở Xây dựng "V/v rà soát, sắp xếp cấp phó các phòng
 * thuộc Sở theo Kết luận số 213-KL/TU" (Số .../SXD-VP, năm 2026). Công văn chỉ nêu số
 * tổng từng phòng, nên `tangThem` là số suy ra (định mức − 1); tổng 11 + 9 = 20 khớp
 * công văn. Khi có văn bản mới thay đổi định mức thì sửa bảng dưới đây.
 *
 * Cảnh báo chỉ đếm theo phòng, không chỉ ra người dôi dư: việc lựa chọn thuộc về phòng
 * và Lãnh đạo Sở theo quy trình đánh giá trong công văn.
 */

export interface DinhMucCapPho {
  ma: string
  ten: string
  theoBienChe: number
  tangThem: number
}

export const DINH_MUC_CAP_PHO_PHONG: readonly DinhMucCapPho[] = [
  { ma: 'VAN_PHONG_SO', ten: 'Văn phòng Sở', theoBienChe: 1, tangThem: 2 },
  { ma: 'PHONG_KH_TC', ten: 'Phòng Kế hoạch - Tài chính', theoBienChe: 1, tangThem: 2 },
  { ma: 'PHONG_CLCT', ten: 'Phòng Quản lý chất lượng công trình giao thông', theoBienChe: 1, tangThem: 1 },
  { ma: 'PHONG_QLKCHT', ten: 'Phòng Quản lý kết cấu hạ tầng giao thông', theoBienChe: 1, tangThem: 1 },
  { ma: 'PHONG_QL_VT', ten: 'Phòng Quản lý vận tải', theoBienChe: 1, tangThem: 1 },
  { ma: 'PHONG_QH_KT', ten: 'Phòng Quy hoạch - Kiến trúc', theoBienChe: 1, tangThem: 1 },
  { ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng', theoBienChe: 1, tangThem: 1 },
  { ma: 'PHONG_HTKT', ten: 'Phòng Hạ tầng kỹ thuật', theoBienChe: 1, tangThem: 0 },
  { ma: 'PHONG_KT_VL', ten: 'Phòng Kinh tế và Vật liệu xây dựng', theoBienChe: 1, tangThem: 0 },
  { ma: 'PHONG_QL_NHA', ten: 'Phòng Quản lý nhà và thị trường bất động sản', theoBienChe: 1, tangThem: 0 },
  { ma: 'PHONG_PTDT', ten: 'Phòng Phát triển đô thị', theoBienChe: 1, tangThem: 0 },
]

/** Hết ngày 06/11/2026 giờ Việt Nam: công văn yêu cầu gửi đề xuất "trước ngày 07/11/2026". */
export const HAN_DE_XUAT_CAP_PHO = new Date('2026-11-06T17:00:00.000Z')

/** Định mức theo biên chế chỉ áp dụng mức 01 cấp phó khi phòng dưới ngưỡng này. */
export const NGUONG_BIEN_CHE_CONG_CHUC = 10

export interface CanBoDoiChieu {
  toChucMa?: string | null
  chucVu?: string | null
  chucDanhTen?: string | null
  doiTuong?: string | null
}

export type TrangThaiCapPho = 'THUA' | 'THIEU' | 'DU'

export interface DongDoiChieuCapPho extends DinhMucCapPho {
  dinhMuc: number
  thucTe: number
  chenhLech: number
  trangThai: TrangThaiCapPho
  soCongChuc: number
  /** Đủ ngưỡng biên chế: mức 01 cấp phó trong bảng có thể không còn đúng, cần rà lại. */
  canRaLaiDinhMuc: boolean
}

export interface KetQuaDoiChieuCapPho {
  dong: DongDoiChieuCapPho[]
  tongDinhMuc: number
  tongThucTe: number
  soPhongThua: number
  soPhongThieu: number
  soNguoiThua: number
  soNguoiThieu: number
}

function chuanHoa(s: string | null | undefined): string {
  return (s ?? '').normalize('NFC').trim().toLowerCase()
}

/** Chỉ tính cấp phó của phòng, gồm cả cách ghi kèm "phụ trách". */
export function laCapPhoPhong(cb: Pick<CanBoDoiChieu, 'chucVu' | 'chucDanhTen'>): boolean {
  return [cb.chucDanhTen, cb.chucVu].some((giaTri) => {
    const s = chuanHoa(giaTri)
    return s.startsWith('phó trưởng phòng') || s.startsWith('phó chánh văn phòng')
  })
}

export function doiChieuCapPhoPhong(danhSach: readonly CanBoDoiChieu[]): KetQuaDoiChieuCapPho {
  const dong = DINH_MUC_CAP_PHO_PHONG.map((dm): DongDoiChieuCapPho => {
    const trongPhong = danhSach.filter((cb) => cb.toChucMa === dm.ma)
    const dinhMuc = dm.theoBienChe + dm.tangThem
    const thucTe = trongPhong.filter(laCapPhoPhong).length
    const chenhLech = thucTe - dinhMuc
    const soCongChuc = trongPhong.filter((cb) => cb.doiTuong === 'CONG_CHUC').length
    return {
      ...dm,
      dinhMuc,
      thucTe,
      chenhLech,
      trangThai: chenhLech > 0 ? 'THUA' : chenhLech < 0 ? 'THIEU' : 'DU',
      soCongChuc,
      canRaLaiDinhMuc: soCongChuc >= NGUONG_BIEN_CHE_CONG_CHUC,
    }
  })
  const thua = dong.filter((d) => d.trangThai === 'THUA')
  const thieu = dong.filter((d) => d.trangThai === 'THIEU')
  return {
    dong,
    tongDinhMuc: dong.reduce((tong, d) => tong + d.dinhMuc, 0),
    tongThucTe: dong.reduce((tong, d) => tong + d.thucTe, 0),
    soPhongThua: thua.length,
    soPhongThieu: thieu.length,
    soNguoiThua: thua.reduce((tong, d) => tong + d.chenhLech, 0),
    soNguoiThieu: thieu.reduce((tong, d) => tong - d.chenhLech, 0),
  }
}
