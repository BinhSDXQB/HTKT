// Quy trình 8 bước hồ sơ đánh giá cuối năm (PATCH V7.1.1). Hàm thuần, không chạm CSDL.
// Không có bước nào tự động: mỗi lần chuyển trạng thái phải do một người có quyền thực hiện.

export const TRANG_THAI_DANH_GIA = [
  'DU_THAO',
  'TU_DANH_GIA',
  'GUI_NHAN_XET',
  'TONG_HOP',
  'HOP_DANH_GIA',
  'TRINH_PHE_DUYET',
  'DA_PHE_DUYET',
  'LUU_HO_SO',
] as const
export type TrangThaiDanhGia = (typeof TRANG_THAI_DANH_GIA)[number]

export const TRANG_THAI_DANH_GIA_LABEL: Record<TrangThaiDanhGia, string> = {
  DU_THAO: 'Dự thảo',
  TU_DANH_GIA: 'Tự đánh giá',
  GUI_NHAN_XET: 'Gửi nhận xét',
  TONG_HOP: 'Tổng hợp',
  HOP_DANH_GIA: 'Họp đánh giá',
  TRINH_PHE_DUYET: 'Trình phê duyệt',
  DA_PHE_DUYET: 'Đã phê duyệt',
  LUU_HO_SO: 'Lưu hồ sơ',
}

/** Vai trò thao tác trên quy trình. */
export type VaiTroDanhGia = 'CHINH_CHU' | 'NGUOI_NHAN_XET' | 'THU_KY_TONG_HOP' | 'CAP_PHE_DUYET'

/** Bước tiếp theo hợp lệ + vai trò được làm. Không cho nhảy cóc. */
const BUOC_TIEP: Record<TrangThaiDanhGia, { den: TrangThaiDanhGia; vaiTro: VaiTroDanhGia | VaiTroDanhGia[] } | null> = {
  // Cá nhân tự mở bước tự đánh giá của mình (theo lịch của Sở) hoặc thư ký mở hàng loạt
  DU_THAO: { den: 'TU_DANH_GIA', vaiTro: ['THU_KY_TONG_HOP', 'CHINH_CHU'] },
  TU_DANH_GIA: { den: 'GUI_NHAN_XET', vaiTro: 'CHINH_CHU' },
  GUI_NHAN_XET: { den: 'TONG_HOP', vaiTro: 'NGUOI_NHAN_XET' },
  TONG_HOP: { den: 'HOP_DANH_GIA', vaiTro: 'THU_KY_TONG_HOP' },
  HOP_DANH_GIA: { den: 'TRINH_PHE_DUYET', vaiTro: 'THU_KY_TONG_HOP' },
  TRINH_PHE_DUYET: { den: 'DA_PHE_DUYET', vaiTro: 'CAP_PHE_DUYET' },
  DA_PHE_DUYET: { den: 'LUU_HO_SO', vaiTro: 'THU_KY_TONG_HOP' },
  LUU_HO_SO: null,
}

/** Từ bước này trở đi nội dung bị khoá (chỉ mở lại bằng thao tác trả về có lý do). */
export const TRANG_THAI_KHOA_NOI_DUNG: readonly TrangThaiDanhGia[] = ['TRINH_PHE_DUYET', 'DA_PHE_DUYET', 'LUU_HO_SO']

export type KetQuaChuyen = { ok: true; den: TrangThaiDanhGia } | { ok: false; loi: string }

export type DieuKienChuyen = {
  coTuDanhGia?: boolean
  coNhanXetLanhDao?: boolean
  coMucDeXuat?: boolean
  coBienBanHop?: boolean
}

/**
 * Kiểm tra có được chuyển từ `tu` sang bước kế tiếp hay không.
 * `nguoiThaoTacId` phải khác `chinhChuId` ở các bước do người khác làm (không tự duyệt cho mình).
 */
export function chuyenTrangThai(args: {
  tu: TrangThaiDanhGia
  vaiTro: VaiTroDanhGia
  nguoiThaoTacId: string
  chinhChuId?: string | null
  dieuKien?: DieuKienChuyen
}): KetQuaChuyen {
  const buoc = BUOC_TIEP[args.tu]
  if (!buoc) return { ok: false, loi: 'Hồ sơ đã lưu, không còn bước tiếp theo.' }
  const duocLam = Array.isArray(buoc.vaiTro) ? buoc.vaiTro.includes(args.vaiTro) : buoc.vaiTro === args.vaiTro
  if (!duocLam) {
    return { ok: false, loi: `Bước "${TRANG_THAI_DANH_GIA_LABEL[args.tu]}" → "${TRANG_THAI_DANH_GIA_LABEL[buoc.den]}" không thuộc vai trò của bạn.` }
  }
  const dk = args.dieuKien ?? {}
  if (buoc.den === 'GUI_NHAN_XET' && !dk.coTuDanhGia) return { ok: false, loi: 'Chưa có nội dung tự đánh giá.' }
  if (buoc.den === 'TONG_HOP' && !dk.coNhanXetLanhDao) return { ok: false, loi: 'Chưa có nhận xét của người có thẩm quyền.' }
  if (buoc.den === 'TRINH_PHE_DUYET' && !dk.coMucDeXuat) return { ok: false, loi: 'Chưa có mức xếp loại đề xuất.' }
  if (buoc.den === 'DA_PHE_DUYET') {
    if (args.chinhChuId && args.nguoiThaoTacId === args.chinhChuId) {
      return { ok: false, loi: 'Không được tự phê duyệt hồ sơ của chính mình.' }
    }
  }
  return { ok: true, den: buoc.den }
}

/** Trả về bước trước (cần lý do). Không cho trả từ hồ sơ đã lưu. */
export function traVe(tu: TrangThaiDanhGia, lyDo: string): KetQuaChuyen {
  if (tu === 'LUU_HO_SO') return { ok: false, loi: 'Hồ sơ đã lưu không thể trả về.' }
  if (tu === 'DA_PHE_DUYET') return { ok: false, loi: 'Hồ sơ đã phê duyệt không trả về được; cần quy trình hủy kết quả riêng do cấp có thẩm quyền.' }
  if (!lyDo.trim()) return { ok: false, loi: 'Cần nêu lý do trả về.' }
  const i = TRANG_THAI_DANH_GIA.indexOf(tu)
  if (i <= 0) return { ok: false, loi: 'Đang ở bước đầu.' }
  return { ok: true, den: TRANG_THAI_DANH_GIA[i - 1] }
}

export function noiDungBiKhoa(t: TrangThaiDanhGia): boolean {
  return TRANG_THAI_KHOA_NOI_DUNG.includes(t)
}

/** Chỉ trạng thái này mới được ghi mức xếp loại chính thức vào office_annual_evaluations. */
export function duocGhiXepLoaiChinhThuc(t: TrangThaiDanhGia): boolean {
  return t === 'DA_PHE_DUYET' || t === 'LUU_HO_SO'
}
