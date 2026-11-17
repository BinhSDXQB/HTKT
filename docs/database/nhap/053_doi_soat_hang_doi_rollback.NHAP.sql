-- BẢN NHÁP v2. Hoàn nguyên migration 053.
-- Từ chối nếu bảng đã có dữ liệu: các quyết định đối soát là bằng chứng, không xoá ngầm.
-- Muốn gỡ khi đã có dữ liệu thì phải xuất dữ liệu ra trước rồi xử lý tay có chủ ý.
-- Khoá ACCESS EXCLUSIVE được lấy TRƯỚC khi kiểm tra rỗng và giữ đến COMMIT, để không
-- phiên nào chèn được dòng vào giữa lúc kiểm tra và lúc xoá bảng.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE co BOOLEAN;
BEGIN
  IF to_regclass('public.doi_soat_hang_doi') IS NOT NULL THEN
    LOCK TABLE public.doi_soat_hang_doi IN ACCESS EXCLUSIVE MODE;
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.doi_soat_hang_doi)' INTO co;
    IF co THEN RAISE EXCEPTION 'Dừng hoàn tác 053: doi_soat_hang_doi đang có dữ liệu'; END IF;
  END IF;
END $$;

DROP TABLE IF EXISTS public.doi_soat_hang_doi;
DROP FUNCTION IF EXISTS public.fn_doi_soat_truoc_ghi();
DROP FUNCTION IF EXISTS public.fn_doi_soat_chan_truncate();
COMMIT;
