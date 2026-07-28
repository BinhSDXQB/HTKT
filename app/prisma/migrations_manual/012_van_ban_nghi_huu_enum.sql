-- Commit 7: Văn phòng Sở — bổ sung loại văn bản nghỉ hưu cho Kho văn bản đã sinh.
-- Thêm giá trị enum LoaiVanBanVPS: TB_NGHI_HUU (Thông báo nghỉ hưu), QD_NGHI_HUU (Quyết định nghỉ hưu).
-- ALTER TYPE ... ADD VALUE không chạy trong transaction → KHÔNG bọc BEGIN/COMMIT. Idempotent.

ALTER TYPE "LoaiVanBanVPS" ADD VALUE IF NOT EXISTS 'TB_NGHI_HUU';
ALTER TYPE "LoaiVanBanVPS" ADD VALUE IF NOT EXISTS 'QD_NGHI_HUU';
