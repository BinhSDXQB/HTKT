-- ============================================================================
-- Migration 051 — Đồng bộ phan_cong chính theo hồ sơ can_bo (bước E4)
--
-- Quyết định của người dùng ngày 13/11/2026: đơn vị và chức danh HIỆN HÀNH của
-- cán bộ lấy theo can_bo."toChucId" / can_bo."chucDanhId".
--
-- Hiện trạng (truy vấn chỉ-đọc 13/11/2026):
--   phan_cong: 103 dòng, tất cả laChinh = true, không dòng nào có tuNgay, denNgay,
--   quyetDinhSo hay ghiChu. Không có mã ứng dụng nào đọc hoặc ghi bảng này.
--   61/164 cán bộ không có phân công chính; 14 phân công chính lệch hồ sơ.
--
-- Việc làm:
--   B. Sửa tại chỗ phân công chính đang lệch cho khớp hồ sơ (dự kiến 14 dòng).
--   A. Tạo phân công chính cho cán bộ chưa có, khi hồ sơ đủ đơn vị và chức danh
--      (dự kiến 43 dòng).
--   Mỗi dòng bị chạm được ghi trạng thái trước và sau vào public.phan_cong_mig051_log.
--   Không ghi gì vào cột ghiChu.
--
-- Không làm: 18 cán bộ thiếu chucDanhId (chờ Văn phòng Sở); 3 trường hợp đơn vị
-- trên hồ sơ lệch đơn vị của tài khoản (bảng users, liên quan phân quyền, xử lý riêng).
--
-- Đây là migration MỘT LẦN: nếu bảng nhật ký đã tồn tại thì từ chối chạy.
-- Muốn áp lại phải hoàn tác trước (tệp rollback đổi tên bảng nhật ký).
-- Chạy bằng scripts/deploy/apply-migration.mjs (gửi nguyên tệp trong một lệnh qua pg:
-- lỗi ở bất kỳ câu nào thì cả giao dịch bị huỷ). Tệp KHÔNG chứa lệnh riêng của psql.
-- Nếu chạy tay bằng psql thì phải thêm: -v ON_ERROR_STOP=1 và không bật ON_ERROR_ROLLBACK.
-- Hoàn tác: 051_dong_bo_phan_cong_tu_can_bo_rollback.sql
-- Kiểm tra (psql): 051_dong_bo_phan_cong_tu_can_bo_verify.sql
-- Đã thử trên bản sao ngày 13/11/2026: docs/database/MIGRATION_TEST_REPORT.md
-- ============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';
-- Chặn ghi đồng thời trong lúc đồng bộ (vẫn cho SELECT thường). can_bo khoá EXCLUSIVE để
-- phiên nào đang giữ khoá dòng trên can_bo phải xong trước, tránh vòng chờ khi kiểm khoá ngoại.
LOCK TABLE public.can_bo IN EXCLUSIVE MODE;
LOCK TABLE public.phan_cong IN SHARE ROW EXCLUSIVE MODE;

-- ── Điều kiện tiên quyết ───────────────────────────────────────────────────
DO $$
DECLARE v INT;
BEGIN
  IF to_regclass('public.phan_cong_mig051_log') IS NOT NULL THEN
    RAISE EXCEPTION 'mig051 đã được áp (bảng public.phan_cong_mig051_log tồn tại). Hoàn tác trước khi áp lại.';
  END IF;
  SELECT count(*) INTO v FROM (SELECT "canBoId" FROM phan_cong WHERE "laChinh" AND "denNgay" IS NULL GROUP BY 1 HAVING count(*) > 1) x;
  IF v <> 0 THEN RAISE EXCEPTION 'mig051: % cán bộ có hơn một phân công chính đang hiệu lực; xử lý tay trước', v; END IF;
  SELECT count(*) INTO v FROM phan_cong WHERE "laChinh" AND "denNgay" IS NOT NULL;
  IF v <> 0 THEN RAISE EXCEPTION 'mig051: % phân công chính đã có ngày kết thúc; migration này không xử lý trường hợp đó', v; END IF;
END $$;

CREATE TABLE public.phan_cong_mig051_log (
  id        text PRIMARY KEY,                               -- phan_cong.id
  thao_tac  text NOT NULL CHECK (thao_tac IN ('TAO', 'SUA')),
  truoc     jsonb,                                          -- NULL khi TAO
  sau       jsonb,
  ap_luc    timestamptz NOT NULL DEFAULT now()
);

-- Phạm vi đồng bộ, dùng chung cho B, A và tự kiểm:
--   cán bộ có đủ "toChucId" và "chucDanhId" trên hồ sơ.

-- ── B. Sửa phân công chính đang lệch hồ sơ ─────────────────────────────────
INSERT INTO public.phan_cong_mig051_log (id, thao_tac, truoc)
SELECT p.id, 'SUA', to_jsonb(p)
  FROM phan_cong p JOIN can_bo c ON c.id = p."canBoId"
 WHERE p."laChinh" AND p."denNgay" IS NULL
   AND c."toChucId" IS NOT NULL AND c."chucDanhId" IS NOT NULL
   AND (p."toChucId" <> c."toChucId" OR p."chucDanhId" <> c."chucDanhId");

UPDATE phan_cong p
   SET "toChucId" = c."toChucId", "chucDanhId" = c."chucDanhId", "updatedAt" = now()
  FROM can_bo c, public.phan_cong_mig051_log l
 WHERE l.id = p.id AND l.thao_tac = 'SUA' AND c.id = p."canBoId";

-- ── A. Tạo phân công chính còn thiếu ───────────────────────────────────────
WITH moi AS (
  INSERT INTO phan_cong
    (id, "canBoId", "toChucId", "chucDanhId", "laChinh", "tuNgay", "denNgay", "quyetDinhSo", "ghiChu", "createdAt", "updatedAt")
  SELECT 'pc051_' || md5(c.id), c.id, c."toChucId", c."chucDanhId", true, NULL, NULL, NULL, NULL, now(), now()
    FROM can_bo c
   WHERE c."toChucId" IS NOT NULL AND c."chucDanhId" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM phan_cong p WHERE p."canBoId" = c.id AND p."laChinh" AND p."denNgay" IS NULL)
  RETURNING id
)
INSERT INTO public.phan_cong_mig051_log (id, thao_tac) SELECT id, 'TAO' FROM moi;
-- Nếu đã có dòng không-chính trùng (cán bộ, đơn vị, chức danh, tuNgay NULL) thì câu trên
-- vi phạm unique và toàn bộ giao dịch bị huỷ: đúng ý, để người xử lý tay.

UPDATE public.phan_cong_mig051_log l SET sau = to_jsonb(p) FROM phan_cong p WHERE p.id = l.id;

-- ── Tự kiểm trước khi COMMIT: sai thì huỷ toàn bộ ──────────────────────────
DO $$
DECLARE v_sai INT; v_log INT;
BEGIN
  -- Mỗi cán bộ trong phạm vi phải có đúng một phân công chính đang hiệu lực và khớp hồ sơ.
  SELECT count(*) INTO v_sai FROM can_bo c
   WHERE c."toChucId" IS NOT NULL AND c."chucDanhId" IS NOT NULL
     AND (SELECT count(*) FROM phan_cong p
           WHERE p."canBoId" = c.id AND p."laChinh" AND p."denNgay" IS NULL
             AND p."toChucId" = c."toChucId" AND p."chucDanhId" = c."chucDanhId") <> 1;
  IF v_sai <> 0 THEN RAISE EXCEPTION 'mig051 tự kiểm: % cán bộ trong phạm vi không có đúng một phân công chính khớp hồ sơ', v_sai; END IF;
  SELECT count(*) INTO v_sai FROM (SELECT "canBoId" FROM phan_cong WHERE "laChinh" AND "denNgay" IS NULL GROUP BY 1 HAVING count(*) > 1) x;
  IF v_sai <> 0 THEN RAISE EXCEPTION 'mig051 tự kiểm: % cán bộ có hơn một phân công chính', v_sai; END IF;
  SELECT count(*) INTO v_log FROM public.phan_cong_mig051_log WHERE sau IS NULL;
  IF v_log <> 0 THEN RAISE EXCEPTION 'mig051 tự kiểm: % dòng nhật ký thiếu trạng thái sau', v_log; END IF;
  SELECT count(*) INTO v_log FROM public.phan_cong_mig051_log;
  RAISE NOTICE 'mig051: đã ghi % dòng nhật ký (dự kiến 57 = 14 SUA + 43 TAO theo số liệu 13/11/2026)', v_log;
END $$;

COMMIT;
