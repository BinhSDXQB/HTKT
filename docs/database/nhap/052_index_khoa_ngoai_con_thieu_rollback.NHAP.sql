-- BẢN NHÁP v2. Hoàn nguyên migration 052: gỡ 4 index đã thêm. Không đổi dữ liệu.
-- An toàn vì migration 052 từ chối chạy nếu 4 tên này đã tồn tại từ trước, nên
-- index mang các tên này chỉ có thể do 052 tạo.
-- DROP INDEX giữ khoá ACCESS EXCLUSIVE trên bảng trong tích tắc (bảng nhỏ).
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DROP INDEX IF EXISTS public.idx_cchn_ho_so_to_chuc_id;
DROP INDEX IF EXISTS public.idx_cchn_ho_so_created_by_id;
DROP INDEX IF EXISTS public.idx_cchn_lich_su_nguoi_id;
DROP INDEX IF EXISTS public."idx_thanh_tich_con_createdById";
COMMIT;
