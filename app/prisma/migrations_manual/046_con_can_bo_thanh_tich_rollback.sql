-- Hoàn nguyên migration 046 (xoá dữ liệu con cán bộ + thành tích). Chỉ chạy khi chắc chắn.
BEGIN;
DROP TABLE IF EXISTS thanh_tich_con;
DROP TABLE IF EXISTS con_can_bo;
COMMIT;
