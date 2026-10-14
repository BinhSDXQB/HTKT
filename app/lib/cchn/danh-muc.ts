// DANH MỤC HỒ SƠ ĐỀ NGHỊ CẤP CHỨNG CHỈ HÀNH NGHỀ HOẠT ĐỘNG XÂY DỰNG (cá nhân).
// Căn cứ (đọc nguyên văn bản .docx trong kho, 14/10/2026): Nghị định 212/2026/NĐ-CP — Đ3, Đ27–40, Đ55;
// Luật Xây dựng 135/2025/QH15 — Đ88–90. Báo cáo kiểm chứng: Kiem_chung_CCHN_Giam_sat_thi_cong_ND212_2026.md.
//
// ⚠️ Phụ lục I (chuyên môn phù hợp), Phụ lục II (phạm vi hoạt động), Phụ lục III (Mẫu số 01, 02, 03)
// CHƯA có trong kho → không mã hoá ở đây; bộ đánh giá đánh dấu "cần kiểm tra" cho các nội dung đó.
// Bảng DB: cchn_ho_so, cchn_kinh_nghiem (migration 047). Chứng chỉ đã cấp ghi sang httt_nang_luc_ca_nhan.

export type LoaiThuTuc = 'CAP_MOI' | 'CAP_LAI' | 'CHUYEN_DOI'
export type LinhVuc = 'KHAO_SAT' | 'QUY_HOACH' | 'THIET_KE' | 'GIAM_SAT'
export type Hang = 'I' | 'II' | 'III'
export type CapCongTrinh = 'DAC_BIET' | 'I' | 'II' | 'III' | 'IV'
export type NhomDuAn = 'QUAN_TRONG_QG' | 'A' | 'B' | 'C'
export type CapPheDuyetQh = 'TTG' | 'UBND_TINH' | 'UBND_XA'
export type TrinhDo = 'TIEN_SI' | 'THAC_SI' | 'DAI_HOC' | 'CAO_DANG' | 'TRUNG_CAP' | 'KHAC'

export const LOAI_THU_TUC: { value: LoaiThuTuc; label: string; canCu: string }[] = [
  { value: 'CAP_MOI', label: 'Cấp mới', canCu: 'Đ29 k1 điểm a, d' },
  { value: 'CAP_LAI', label: 'Cấp lại', canCu: 'Đ29 k1 điểm b' },
  { value: 'CHUYEN_DOI', label: 'Cấp chuyển đổi', canCu: 'Đ29 k1 điểm c, đ' },
]

/** Trường hợp cụ thể của từng loại thủ tục — chép theo Đ29 k1. */
export const TRUONG_HOP: Record<LoaiThuTuc, { value: string; label: string }[]> = {
  CAP_MOI: [
    { value: 'LAN_DAU', label: 'Lần đầu được cấp chứng chỉ' },
    { value: 'DIEU_CHINH_HANG', label: 'Điều chỉnh hạng chứng chỉ' },
    { value: 'HET_HAN', label: 'Chứng chỉ hết thời hạn hiệu lực' },
    { value: 'CON_HAN_KHAC', label: 'Đề nghị cấp lại khi chứng chỉ còn hạn, không thuộc trường hợp cấp lại' },
    { value: 'NUOC_NGOAI_KHONG_HE_THONG', label: 'Người nước ngoài — nước sở tại không có hệ thống cấp giấy phép năng lực (điểm d)' },
    { value: 'SAU_THU_HOI', label: 'Đề nghị cấp mới sau khi bị thu hồi (Đ29 k3)' },
  ],
  CAP_LAI: [
    { value: 'MAT', label: 'Còn hạn nhưng bị mất' },
    { value: 'HU_HONG', label: 'Còn hạn nhưng bị hư hỏng' },
    { value: 'GHI_SAI', label: 'Còn hạn nhưng ghi sai thông tin' },
    { value: 'DIEU_CHINH_THONG_TIN', label: 'Điều chỉnh, bổ sung thông tin cá nhân' },
    { value: 'LINH_VUC_KHONG_THU_HOI', label: 'Lĩnh vực không bị thu hồi (Đ29 k4)' },
    { value: 'THU_HOI_DO_LOI_CQ', label: 'Bị thu hồi do cơ quan cấp ghi sai (Đ29 k5)' },
  ],
  CHUYEN_DOI: [
    { value: 'GIAY_PHEP_NUOC_NGOAI', label: 'Có giấy phép năng lực hành nghề do nước ngoài cấp (Đ27 k2)' },
    { value: 'GIA_HAN_GPLD', label: 'Người nước ngoài tiếp tục hoạt động sau khi gia hạn giấy phép lao động/thẻ tạm trú (điểm đ)' },
  ],
}

export const HINH_THUC_NOP = [
  { value: 'TRUC_TIEP', label: 'Trực tiếp tại Bộ phận Một cửa' },
  { value: 'BUU_CHINH', label: 'Qua dịch vụ bưu chính' },
  { value: 'TRUC_TUYEN', label: 'Trực tuyến — Cổng dịch vụ công quốc gia' },
] // Đ30 k1

export const TRINH_DO: { value: TrinhDo; label: string; daiHocTroLen: boolean }[] = [
  { value: 'TIEN_SI', label: 'Tiến sĩ', daiHocTroLen: true },
  { value: 'THAC_SI', label: 'Thạc sĩ', daiHocTroLen: true },
  { value: 'DAI_HOC', label: 'Đại học', daiHocTroLen: true },
  { value: 'CAO_DANG', label: 'Cao đẳng', daiHocTroLen: false },
  { value: 'TRUNG_CAP', label: 'Trung cấp', daiHocTroLen: false },
  { value: 'KHAC', label: 'Khác', daiHocTroLen: false },
]

export const LINH_VUC: { value: LinhVuc; label: string; dieu: string; noiDung: string[] }[] = [
  { value: 'KHAO_SAT', label: 'Khảo sát xây dựng', dieu: 'Đ34', noiDung: ['Khảo sát địa hình', 'Khảo sát địa chất công trình'] },
  { value: 'QUY_HOACH', label: 'Lập quy hoạch đô thị và nông thôn', dieu: 'Đ35', noiDung: ['Lập quy hoạch đô thị và nông thôn'] },
  { value: 'THIET_KE', label: 'Thiết kế xây dựng', dieu: 'Đ36', noiDung: ['Thiết kế xây dựng công trình', 'Thiết kế cơ - điện công trình'] },
  { value: 'GIAM_SAT', label: 'Giám sát thi công xây dựng', dieu: 'Đ37', noiDung: ['Giám sát công tác xây dựng công trình', 'Giám sát công tác lắp đặt thiết bị công trình'] },
] // Đ28 k1 (thiết kế kiến trúc thực hiện theo pháp luật về kiến trúc — không cấp ở đây)

export const CAP_CONG_TRINH: { value: CapCongTrinh; label: string }[] = [
  { value: 'DAC_BIET', label: 'Cấp đặc biệt' },
  { value: 'I', label: 'Cấp I' },
  { value: 'II', label: 'Cấp II' },
  { value: 'III', label: 'Cấp III' },
  { value: 'IV', label: 'Cấp IV' },
]
/** Thứ bậc để so "từ cấp X trở lên": số nhỏ = cấp cao hơn. */
export const BAC_CAP: Record<CapCongTrinh, number> = { DAC_BIET: 0, I: 1, II: 2, III: 3, IV: 4 }

export const NHOM_DU_AN: { value: NhomDuAn; label: string }[] = [
  { value: 'QUAN_TRONG_QG', label: 'Dự án quan trọng quốc gia' },
  { value: 'A', label: 'Nhóm A' },
  { value: 'B', label: 'Nhóm B' },
  { value: 'C', label: 'Nhóm C' },
]
export const BAC_NHOM: Record<NhomDuAn, number> = { QUAN_TRONG_QG: 0, A: 1, B: 2, C: 3 }

export const CAP_PHE_DUYET_QH: { value: CapPheDuyetQh; label: string }[] = [
  { value: 'TTG', label: 'Thủ tướng Chính phủ phê duyệt' },
  { value: 'UBND_TINH', label: 'UBND cấp tỉnh phê duyệt' },
  { value: 'UBND_XA', label: 'UBND cấp xã phê duyệt' },
]

export const LOAI_QUY_HOACH = ['Quy hoạch chung', 'Quy hoạch phân khu', 'Quy hoạch chi tiết', 'Khác'] as const

/** Vai trò trong từng công trình/dự án/quy hoạch kê khai kinh nghiệm. */
export const VAI_TRO: { value: string; label: string; linhVuc: LinhVuc[] }[] = [
  { value: 'CHU_NHIEM_KHAO_SAT', label: 'Chủ nhiệm khảo sát xây dựng', linhVuc: ['KHAO_SAT'] },
  { value: 'THAM_GIA_KHAO_SAT', label: 'Tham gia khảo sát xây dựng', linhVuc: ['KHAO_SAT'] },
  { value: 'CHU_NHIEM_QH', label: 'Chủ nhiệm lập quy hoạch', linhVuc: ['QUY_HOACH'] },
  { value: 'CHU_TRI_QH', label: 'Chủ trì lập quy hoạch (lĩnh vực chuyên môn)', linhVuc: ['QUY_HOACH'] },
  { value: 'THAM_GIA_QH', label: 'Tham gia lập quy hoạch', linhVuc: ['QUY_HOACH'] },
  { value: 'CHU_NHIEM_TK', label: 'Chủ nhiệm thiết kế xây dựng', linhVuc: ['THIET_KE'] },
  { value: 'CHU_TRI_TK', label: 'Chủ trì thiết kế xây dựng', linhVuc: ['THIET_KE', 'GIAM_SAT'] },
  { value: 'CHU_NHIEM_THAM_TRA', label: 'Chủ nhiệm thẩm tra thiết kế', linhVuc: ['THIET_KE'] },
  { value: 'CHU_TRI_THAM_TRA', label: 'Chủ trì thẩm tra thiết kế', linhVuc: ['THIET_KE'] },
  { value: 'THAM_GIA_TK', label: 'Tham gia thiết kế xây dựng', linhVuc: ['THIET_KE', 'GIAM_SAT'] },
  { value: 'THAM_GIA_THAM_TRA', label: 'Tham gia thẩm tra thiết kế', linhVuc: ['THIET_KE'] },
  { value: 'GIAM_SAT_TRUONG', label: 'Giám sát trưởng', linhVuc: ['GIAM_SAT'] },
  { value: 'THAM_GIA_GIAM_SAT', label: 'Tham gia giám sát thi công xây dựng', linhVuc: ['GIAM_SAT'] },
  { value: 'THAM_GIA_THI_CONG', label: 'Tham gia thi công xây dựng', linhVuc: ['GIAM_SAT'] },
]

export const TAI_LIEU_KINH_NGHIEM = [
  { value: 'QUYET_DINH_PHAN_CONG', label: 'Quyết định phân công công việc của tổ chức' },
  { value: 'XAC_NHAN_CDT', label: 'Văn bản xác nhận của đại diện hợp pháp chủ đầu tư' },
  { value: 'VAN_BAN_CQCM', label: 'Văn bản của cơ quan chuyên môn về xây dựng' },
  { value: 'HOP_DONG_NGHIEM_THU', label: 'Hợp đồng kinh tế và biên bản nghiệm thu (hành nghề độc lập)' },
] // Đ39 k1 điểm đ — các nhóm thay thế nhau

export const NGUON_BAT_DAU_KN = [
  { value: 'DON', label: 'Đơn đề nghị' },
  { value: 'HOP_DONG_LAO_DONG', label: 'Hợp đồng lao động' },
  { value: 'XAC_NHAN_SU_DUNG_LD', label: 'Xác nhận của bên sử dụng lao động' },
  { value: 'BHXH', label: 'Bảo hiểm xã hội' },
  { value: 'CSDL_HDXD', label: 'Hệ thống thông tin về hoạt động xây dựng' },
  { value: 'KHAC', label: 'Giấy tờ tương tự khác' },
] // Đ33 k5

export const TRANG_THAI: { value: string; label: string; mau: string }[] = [
  { value: 'MOI_TIEP_NHAN', label: 'Mới tiếp nhận', mau: 'bg-slate-100 text-slate-700' },
  { value: 'YEU_CAU_BO_SUNG', label: 'Yêu cầu bổ sung', mau: 'bg-amber-100 text-amber-800' },
  { value: 'DANG_XEM_XET', label: 'Đang xem xét', mau: 'bg-sky-100 text-sky-800' },
  { value: 'TRINH_HOI_DONG', label: 'Trình Hội đồng', mau: 'bg-indigo-100 text-indigo-800' },
  { value: 'DU_DIEU_KIEN', label: 'Đủ điều kiện', mau: 'bg-emerald-100 text-emerald-800' },
  { value: 'KHONG_DU_DIEU_KIEN', label: 'Không đủ điều kiện', mau: 'bg-rose-100 text-rose-800' },
  { value: 'DA_CAP', label: 'Đã cấp chứng chỉ', mau: 'bg-emerald-600 text-white' },
  { value: 'DUNG_GIA_MAO', label: 'Dừng xem xét (giả mạo/kê khai không trung thực)', mau: 'bg-rose-600 text-white' },
]

/** Thành phần hồ sơ theo Đ39 — `apDung` quyết định mục nào phải có với hồ sơ cụ thể. */
export type DieuKienThanhPhan = {
  loaiThuTuc: LoaiThuTuc
  truongHop: string
  laCongDanVN: boolean
  vanBangTrenCsdl: boolean
  coCchnCu: boolean
  hanhNgheDocLap: boolean
}
export const THANH_PHAN_HO_SO: {
  key: string; label: string; canCu: string; apDung: (d: DieuKienThanhPhan) => boolean; ghiChu?: string
}[] = [
  { key: 'don', label: 'Đơn đề nghị theo Mẫu số 01 Phụ lục III (bản gốc; trực tuyến: biểu mẫu điện tử)', canCu: 'Đ39 k1 điểm a, k2 điểm a',
    apDung: (d) => d.loaiThuTuc !== 'CHUYEN_DOI' },
  { key: 'don_chuyen_doi', label: 'Đơn đề nghị cấp chuyển đổi theo Mẫu số 02 Phụ lục III', canCu: 'Đ39 k3 điểm a',
    apDung: (d) => d.loaiThuTuc === 'CHUYEN_DOI' },
  { key: 'anh', label: 'Tệp ảnh màu 4×6 cm, nền trắng, chụp không quá 06 tháng', canCu: 'Đ39 k1 điểm b, k2 điểm b, k3 điểm b',
    apDung: () => true },
  { key: 'van_bang', label: 'Văn bằng phù hợp (kèm bảng điểm/phụ lục nếu không ghi rõ chuyên ngành) — bản sao có chứng thực', canCu: 'Đ39 k1 điểm c, g',
    apDung: (d) => d.loaiThuTuc === 'CAP_MOI' && !d.vanBangTrenCsdl,
    ghiChu: 'Không phải nộp nếu đã có trên CSDL ngành Giáo dục.' },
  { key: 'cchn_cu', label: 'Chứng chỉ hành nghề đã được cấp, phù hợp thời gian và phạm vi chứng minh kinh nghiệm — bản sao có chứng thực', canCu: 'Đ39 k1 điểm d, g',
    apDung: (d) => d.loaiThuTuc === 'CAP_MOI' && d.coCchnCu,
    ghiChu: 'Không phải nộp nếu đã có trên CSDL quốc gia về hoạt động xây dựng.' },
  { key: 'tai_lieu_kn', label: 'Tài liệu chứng minh kinh nghiệm (một trong các nhóm: quyết định phân công / xác nhận của chủ đầu tư / văn bản của cơ quan chuyên môn)', canCu: 'Đ39 k1 điểm đ, g',
    apDung: (d) => d.loaiThuTuc === 'CAP_MOI' && !d.hanhNgheDocLap },
  { key: 'hop_dong_nghiem_thu', label: 'Hợp đồng kinh tế và biên bản nghiệm thu các công việc đã kê khai', canCu: 'Đ39 k1 điểm đ',
    apDung: (d) => d.loaiThuTuc === 'CAP_MOI' && d.hanhNgheDocLap },
  { key: 'cu_tru', label: 'Giấy tờ về cư trú hoặc giấy phép lao động tại Việt Nam — bản sao có chứng thực', canCu: 'Đ39 k1 điểm e, k3 điểm d',
    apDung: (d) => d.loaiThuTuc === 'CHUYEN_DOI' || (!d.laCongDanVN && d.loaiThuTuc === 'CAP_MOI'),
    ghiChu: 'Cấp mới: chỉ người nước ngoài, người Việt Nam định cư ở nước ngoài. Chuyển đổi: luôn phải có (Đ39 k3 điểm d).' },
  { key: 'ban_goc_cchn', label: 'Bản gốc chứng chỉ đề nghị cấp lại', canCu: 'Đ39 k2 điểm c',
    apDung: (d) => d.loaiThuTuc === 'CAP_LAI' && !['MAT', 'LINH_VUC_KHONG_THU_HOI'].includes(d.truongHop) },
  { key: 'cam_ket', label: 'Bản cam kết của người đề nghị (chứng chỉ bị mất hoặc đã bị thu hồi theo Đ29 k4)', canCu: 'Đ39 k2 điểm c',
    apDung: (d) => d.loaiThuTuc === 'CAP_LAI' && ['MAT', 'LINH_VUC_KHONG_THU_HOI'].includes(d.truongHop) },
  { key: 'giay_phep_nn', label: 'Văn bằng, giấy phép năng lực hành nghề nước ngoài đã hợp pháp hóa lãnh sự, bản dịch công chứng', canCu: 'Đ39 k3 điểm c, đ',
    apDung: (d) => d.loaiThuTuc === 'CHUYEN_DOI' },
  { key: 'le_phi', label: 'Đã nộp lệ phí', canCu: 'Đ39 k4', apDung: () => true },
]
