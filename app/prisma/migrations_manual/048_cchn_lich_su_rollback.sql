-- Hoàn nguyên migration 048 (xoá lịch sử xử lý hồ sơ CCHN). Không ảnh hưởng cchn_ho_so.
BEGIN;
DROP TABLE IF EXISTS cchn_lich_su;
COMMIT;
