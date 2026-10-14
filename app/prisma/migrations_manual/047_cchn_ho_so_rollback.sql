-- Hoàn nguyên migration 047 (xoá hồ sơ đề nghị cấp CCHN + kinh nghiệm kê khai). Chỉ chạy khi chắc chắn.
-- Không đụng tới httt_nang_luc_ca_nhan (chứng chỉ đã cấp).
BEGIN;
DROP TABLE IF EXISTS cchn_kinh_nghiem;
DROP TABLE IF EXISTS cchn_ho_so;
COMMIT;
