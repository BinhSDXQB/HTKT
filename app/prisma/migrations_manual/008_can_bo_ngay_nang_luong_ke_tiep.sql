-- Tách ngày lương: can_bo.ngayNangLuong = NGÀY LÊN LƯƠNG (ngày hưởng bậc hiện tại),
-- thêm ngayNangLuongKeTiep = NGÀY ĐẾN HẠN nâng lương lần sau (dùng cho cảnh báo).
-- Idempotent.

BEGIN;

ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "ngayNangLuongKeTiep" date;

COMMIT;
