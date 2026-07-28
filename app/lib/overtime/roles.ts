// Trạng thái bảng chấm công làm thêm giờ — KHÔNG ký số.
// Quy trình: nhập giờ → in/ký tay, đóng dấu → SCAN và TẢI LÊN bản đã ký → lưu.

export type OtStatus = 'NHAP' | 'DA_KY'

export const OT_STATUS_LABEL: Record<string, string> = {
  NHAP: 'Đang nhập (chưa ký)',
  DA_KY: 'Đã ký tay & lưu bản scan',
}

// capCode dùng cho bản tải lên (tái dùng bảng overtime_signatures)
export const KY_TAY = 'KY_TAY'
