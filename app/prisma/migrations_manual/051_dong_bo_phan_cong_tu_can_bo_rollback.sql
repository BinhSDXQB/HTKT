-- Hoàn nguyên migration 051 dựa trên public.phan_cong_mig051_log.
--
-- Nguyên tắc: chỉ hoàn tác khi MỌI dòng 051 đã chạm còn đúng trạng thái "sau" đã ghi.
-- Nếu có dòng đã bị sửa hoặc xoá sau migration thì dừng, không hoàn tác gì, để người
-- xem xét (tránh xoá hoặc ghi đè thay đổi phát sinh sau).
-- Nếu việc trả giá trị cũ vi phạm unique hoặc khoá ngoại (ví dụ đơn vị cũ đã bị xoá),
-- PostgreSQL báo lỗi và toàn bộ giao dịch bị huỷ; không có trạng thái hoàn tác nửa chừng.
-- Chạy: node scripts/deploy/apply-migration.mjs <tệp này> (nguyên tệp trong một lệnh).
-- Nếu chạy tay bằng psql thì phải thêm: -v ON_ERROR_STOP=1 và không bật ON_ERROR_ROLLBACK.

BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.can_bo IN EXCLUSIVE MODE;
LOCK TABLE public.phan_cong IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE v INT;
BEGIN
  IF to_regclass('public.phan_cong_mig051_log') IS NULL THEN
    RAISE EXCEPTION 'Không có public.phan_cong_mig051_log: migration 051 chưa áp hoặc đã hoàn tác.';
  END IF;
  SELECT count(*) INTO v
    FROM public.phan_cong_mig051_log l LEFT JOIN phan_cong p ON p.id = l.id
   WHERE p.id IS NULL OR to_jsonb(p) IS DISTINCT FROM l.sau;
  IF v <> 0 THEN
    RAISE EXCEPTION 'Dừng hoàn tác: % dòng đã bị sửa hoặc xoá sau migration 051. Đối chiếu public.phan_cong_mig051_log trước.', v;
  END IF;
END $$;

-- A: xoá các dòng 051 đã tạo.
DELETE FROM phan_cong p USING public.phan_cong_mig051_log l WHERE l.id = p.id AND l.thao_tac = 'TAO';

-- B: trả lại nguyên trạng thái trước, kể cả "updatedAt".
UPDATE phan_cong p
   SET "toChucId"   = t."toChucId",
       "chucDanhId" = t."chucDanhId",
       "updatedAt"  = t."updatedAt"
  FROM public.phan_cong_mig051_log l, jsonb_populate_record(NULL::public.phan_cong, l.truoc) t
 WHERE l.id = p.id AND l.thao_tac = 'SUA';

-- Kiểm sau hoàn tác: dòng SUA phải trùng trạng thái trước; dòng TAO phải hết.
DO $$
DECLARE v INT;
BEGIN
  SELECT count(*) INTO v FROM public.phan_cong_mig051_log l LEFT JOIN phan_cong p ON p.id = l.id
   WHERE (l.thao_tac = 'SUA' AND (p.id IS NULL OR to_jsonb(p) IS DISTINCT FROM l.truoc))
      OR (l.thao_tac = 'TAO' AND p.id IS NOT NULL);
  IF v <> 0 THEN RAISE EXCEPTION 'Hoàn tác 051 không trả đúng trạng thái trước ở % dòng', v; END IF;
END $$;

-- Giữ nhật ký làm bằng chứng nhưng đổi tên, để migration 051 có thể áp lại.
DO $$
BEGIN
  EXECUTE format('ALTER TABLE public.phan_cong_mig051_log RENAME TO %I',
                 'phan_cong_mig051_log_hoantac_' || to_char(now(), 'YYYYMMDD_HH24MISS'));
END $$;

COMMIT;
