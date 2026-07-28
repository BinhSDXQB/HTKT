-- Commit: Hồ sơ cán bộ — bổ sung Mã số BHXH, ngày tham gia BHXH, Mã số thuế (quản lý toàn diện).
-- Phục vụ đối chiếu thâm niên (định mức phép năm) + import dữ liệu BHXH theo CCCD.
-- Lưu ý: theo TT 86/2024/TT-BTC (hiệu lực 6/2/2025) MST cá nhân dùng số định danh cá nhân (CCCD).
-- Áp dụng thủ công, idempotent.

BEGIN;

ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "maSoBHXH"        text;  -- Mã số BHXH (10 số)
ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "ngayThamGiaBHXH" date;  -- Ngày bắt đầu tham gia BHXH
ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "maSoThue"        text;  -- Mã số thuế cá nhân

COMMIT;
