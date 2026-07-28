-- Commit: Chuyển chấm công làm thêm sang CHI TIẾT THEO TỪNG NGÀY trong tháng
-- (lưới ngày 01..31, tự nhận Thứ Bảy/Chủ nhật theo lịch) đúng mẫu BẢNG CHẤM CÔNG
-- LÀM THÊM GIỜ. Lưu giờ từng ngày dạng JSON: { "1": 4, "2": 0, ... }. Idempotent.
-- Giữ lại các cột gioThuong/gioT7/gioCN/gioDem cũ (không dùng nữa) để không mất dữ liệu.

ALTER TABLE overtime_entries ADD COLUMN IF NOT EXISTS "gioNgay" jsonb NOT NULL DEFAULT '{}'::jsonb;
