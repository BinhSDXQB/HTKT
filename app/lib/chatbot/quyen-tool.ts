/**
 * QUYỀN GỌI TOOL CỦA CHATBOT — một chỗ duy nhất, không phụ thuộc CSDL/Next để kiểm thử được.
 *
 * Route chatbot dùng module này ở HAI lớp: (1) lọc danh sách tool gửi cho mô hình, (2) chặn lại
 * trong executeTool (không tin mô hình — và đường trả lời không-AI cũng gọi executeTool).
 *
 * Quyết định của chủ hệ thống 21/10/2026 (docs/htkt-brain-review/14 §9):
 *  - Q4: qua chatbot, CCCD + ngày sinh + lương (hệ số, phụ cấp, vượt khung, ngày nâng lương) chỉ
 *    dành cho người có quyền xem dữ liệu nhạy cảm (canViewOfficeSensitive). SĐT/email công vụ vẫn tra được.
 *  - Q1/B0: TẮT các tool GHI cho tới khi có cổng xác nhận phía máy chủ (Action Service, ADR-4) —
 *    câu "đồng ý" trong hội thoại không được coi là xác nhận.
 */

/** Tool chỉ dành cho tài khoản cấp Sở (tài khoản phường/xã không được dùng). */
export const SO_ONLY_TOOLS = new Set([
  'tim_can_bo', 'ho_so_can_bo', 'xem_luong_can_bo', 'so_do_to_chuc', 'sinh_nhat_hom_nay', 'sinh_nhat_thang_nay',
  'len_luong_thang_nay', 'thong_ke_nang_luong', 'du_thao_qd_nang_luong', 'xep_hang_nhan_su', 'luong_cua_toi',
  'luu_lanh_dao_xa', 'cap_nhat_luong_can_bo', 'them_can_bo',
])

/** Tool GHI dữ liệu — tạm tắt toàn bộ (B0). Mở lại chỉ khi có Action Service + kiểm thử 12 §2.1. */
export const TOOL_GHI_TAM_TAT = new Set(['luu_lanh_dao_xa', 'cap_nhat_luong_can_bo', 'them_can_bo'])

/**
 * Tool mà TOÀN BỘ nội dung trả về là lương/ngày nâng lương → chỉ người có quyền nhạy cảm.
 *
 * Quyết định chủ hệ thống 21/10/2026 (sau phản biện Codex bản vá B0):
 *  - luong_cua_toi: CHẶN cả khi tự xem lương của chính mình nếu thiếu quyền nhạy cảm.
 *  - du_thao_qd_nang_luong: CHỈ cần quyền nghiệp vụ lương (canManageSalary, kiểm trong handler) — không ở đây.
 *  - sinh_nhat_*: ngày/tháng (không năm) — mọi cán bộ Sở xem được (vẫn chặn tài khoản xã qua SO_ONLY_TOOLS).
 */
export const TOOL_CHI_QUYEN_NHAY_CAM = new Set([
  'xem_luong_can_bo', 'len_luong_thang_nay', 'thong_ke_nang_luong', 'luong_cua_toi',
])

/**
 * Tiêu chí xep_hang_nhan_su lộ lương, ngày sinh/tuổi, thời điểm nghỉ hưu (suy ra từ ngày sinh) hoặc
 * ngày kết nạp Đảng → chỉ người có quyền nhạy cảm. 'don_vi_dong_nhat' là số liệu tổng hợp, ai cũng xem được.
 */
export const TIEU_CHI_XEP_HANG_NHAY_CAM = new Set([
  'he_so_cao_nhat', 'he_so_thap_nhat', 'vuot_khung', 'sap_nghi_huu', 'lon_tuoi_nhat', 'tre_nhat', 'tuoi_dang_cao_nhat',
])

export type QuyenNguoiHoi = {
  /** Tài khoản phường/xã. */
  laTaiKhoanXa: boolean
  /** canViewOfficeSensitive(user) — xem CCCD/ngày sinh/lương. */
  xemNhanSuNhayCam: boolean
}

export type QuyetDinhTool =
  | { choPhep: true; anTruongNhayCam: boolean }
  | { choPhep: false; lyDo: string }

const LY_DO_GHI_TAM_TAT =
  'Chức năng cập nhật dữ liệu qua chatbot đang TẠM TẮT để bảo đảm an toàn dữ liệu (cần cổng xác nhận phía máy chủ). ' +
  'Vui lòng thao tác trực tiếp trên giao diện nghiệp vụ của hệ thống.'
const LY_DO_NHAY_CAM =
  'Thông tin này (lương, ngày nâng lương, ngày sinh/tuổi, thời điểm nghỉ hưu, ngày kết nạp Đảng) chỉ dành cho người có quyền ' +
  'xem dữ liệu nhân sự nhạy cảm. Vui lòng liên hệ Văn phòng Sở nếu cần.'
const LY_DO_TK_XA = 'Tài khoản phường/xã không được tra cứu thông tin nhân sự nội bộ Sở.'

export function quyetDinhTool(ten: string, args: Record<string, string>, q: QuyenNguoiHoi): QuyetDinhTool {
  if (TOOL_GHI_TAM_TAT.has(ten)) return { choPhep: false, lyDo: LY_DO_GHI_TAM_TAT }
  if (q.laTaiKhoanXa && SO_ONLY_TOOLS.has(ten)) return { choPhep: false, lyDo: LY_DO_TK_XA }
  if (!q.xemNhanSuNhayCam) {
    if (TOOL_CHI_QUYEN_NHAY_CAM.has(ten)) return { choPhep: false, lyDo: LY_DO_NHAY_CAM }
    if (ten === 'xep_hang_nhan_su' && TIEU_CHI_XEP_HANG_NHAY_CAM.has((args.tieu_chi || '').trim())) {
      return { choPhep: false, lyDo: LY_DO_NHAY_CAM }
    }
  }
  // ho_so_can_bo: ai cấp Sở cũng xem được phần liên hệ công vụ; trường nhạy cảm bị ẩn nếu thiếu quyền.
  return { choPhep: true, anTruongNhayCam: !q.xemNhanSuNhayCam }
}

/** Tool trả về dữ liệu cá nhân nhạy cảm — dùng cho nhật ký truy cập (VIEW_SENSITIVE) và đánh dấu lượt nhạy cảm. */
export const TOOL_NHAY_CAM = new Set([
  'ho_so_can_bo', 'xem_luong_can_bo', 'cap_nhat_luong_can_bo', 'them_can_bo',
  'luong_cua_toi', 'xep_hang_nhan_su', 'len_luong_thang_nay', 'thong_ke_nang_luong',
  'du_thao_qd_nang_luong', 'tim_can_bo', 'tra_cuu_lanh_dao_xa', 'luu_lanh_dao_xa',
])

/**
 * Dấu ghi vào `toolsUsed` của lượt mà NGỮ CẢNH (lịch sử) có chứa lượt nhạy cảm: mô hình có thể đã
 * nhắc lại dữ liệu đó mà không gọi tool ("nhắc lại hệ số của ông A"). Thiếu dấu này, lượt đó trông như
 * lượt thường → vẫn được nạp lại sau khi người dùng bị thu hồi quyền và còn lọt vào "học từ LIKE"
 * (chỉ lấy lượt có toolsUsed rỗng) để chèn vào prompt NGƯỜI KHÁC (Codex phản biện B0 vòng 2).
 */
export const DAU_KE_THUA_NHAY_CAM = '__ke_thua_nhay_cam__'

/** Lượt có chạm dữ liệu nhạy cảm — trực tiếp (tool) hoặc kế thừa qua lịch sử. */
export function laLuotNhayCam(toolsUsed: readonly string[]): boolean {
  return toolsUsed.some((t) => t === DAU_KE_THUA_NHAY_CAM || TOOL_NHAY_CAM.has(t))
}

/**
 * Chọn các lượt cũ đưa vào ngữ cảnh. Thiếu quyền nhạy cảm → bỏ mọi lượt nhạy cảm (kể cả kế thừa).
 * `keThuaNhayCam` = ngữ cảnh giữ lại có lượt nhạy cảm → lượt mới phải mang DAU_KE_THUA_NHAY_CAM.
 */
export function chonLichSu<T extends { toolsUsed: readonly string[] }>(
  luot: T[], boLuotNhayCam: boolean,
): { giu: T[]; keThuaNhayCam: boolean } {
  const giu = boLuotNhayCam ? luot.filter((l) => !laLuotNhayCam(l.toolsUsed)) : luot
  return { giu, keThuaNhayCam: giu.some((l) => laLuotNhayCam(l.toolsUsed)) }
}

/** Lọc danh sách tool gửi cho mô hình (lớp 1). Tool có tham số (xep_hang_nhan_su) vẫn gửi — lớp 2 chặn theo tiêu chí. */
export function locToolChoMoHinh<T>(tools: T[], tenCua: (t: T) => string, q: QuyenNguoiHoi): T[] {
  return tools.filter((t) => {
    const ten = tenCua(t)
    if (TOOL_GHI_TAM_TAT.has(ten)) return false
    if (q.laTaiKhoanXa && SO_ONLY_TOOLS.has(ten)) return false
    if (!q.xemNhanSuNhayCam && TOOL_CHI_QUYEN_NHAY_CAM.has(ten)) return false
    return true
  })
}
