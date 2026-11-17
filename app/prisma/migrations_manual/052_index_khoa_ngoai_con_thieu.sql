-- ============================================================================
-- Migration 052 — Index cho 4 khoá ngoại còn thiếu (bước E1)
--
-- Vì sao: 4 khoá ngoại dưới đây có ON DELETE SET NULL nhưng cột nguồn không có
-- index. Mỗi lần xoá một dòng users / to_chuc, PostgreSQL phải quét toàn bảng
-- nguồn để đặt NULL. Hiện bảng còn nhỏ (0, 0, 174 dòng) nên chưa chậm; thêm index
-- bây giờ để không thành vấn đề khi hồ sơ CCHN tăng.
--
--   cchn_ho_so.to_chuc_id        → to_chuc(id)
--   cchn_ho_so.created_by_id     → users(id)
--   cchn_lich_su.nguoi_id        → users(id)
--   thanh_tich_con."createdById" → users(id)
--
-- Không dùng CONCURRENTLY: tệp được áp nguyên khối trong một giao dịch
-- (apply-migration.mjs), mà CREATE INDEX CONCURRENTLY không chạy được trong giao
-- dịch. Bảng nhỏ nên khoá ghi chỉ kéo dài vài mili giây.
--
-- Migration MỘT LẦN: nếu một trong 4 tên index đã tồn tại thì từ chối, để tệp
-- hoàn tác không bao giờ gỡ nhầm index do việc khác tạo. Chỉ thêm, không đổi dữ liệu.
-- Hoàn tác: 052_index_khoa_ngoai_con_thieu_rollback.sql
-- Đã thử trên bản sao ngày 13/11/2026: docs/database/MIGRATION_TEST_REPORT.md
-- ============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE v TEXT;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO v
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN ('idx_cchn_ho_so_to_chuc_id', 'idx_cchn_ho_so_created_by_id',
                       'idx_cchn_lich_su_nguoi_id', 'idx_thanh_tich_con_createdById');
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'mig052: đã tồn tại đối tượng trùng tên (%). Migration đã áp, hoặc tên bị việc khác dùng; kiểm tra tay.', v;
  END IF;
END $$;

CREATE INDEX idx_cchn_ho_so_to_chuc_id        ON public.cchn_ho_so (to_chuc_id);
CREATE INDEX idx_cchn_ho_so_created_by_id     ON public.cchn_ho_so (created_by_id);
CREATE INDEX idx_cchn_lich_su_nguoi_id        ON public.cchn_lich_su (nguoi_id);
CREATE INDEX "idx_thanh_tich_con_createdById" ON public.thanh_tich_con ("createdById");

-- Tự kiểm: đúng 4 index, hợp lệ, btree, một cột khoá, không phải index một phần hay biểu thức.
DO $$
DECLARE v INT;
BEGIN
  SELECT count(*) INTO v
    FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = ic.relnamespace JOIN pg_am am ON am.oid = ic.relam
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
   WHERE n.nspname = 'public' AND i.indisvalid AND i.indisready AND am.amname = 'btree'
     AND i.indnkeyatts = 1 AND i.indpred IS NULL AND i.indexprs IS NULL
     AND (ic.relname, t.relname, a.attname) IN (
           ('idx_cchn_ho_so_to_chuc_id', 'cchn_ho_so', 'to_chuc_id'),
           ('idx_cchn_ho_so_created_by_id', 'cchn_ho_so', 'created_by_id'),
           ('idx_cchn_lich_su_nguoi_id', 'cchn_lich_su', 'nguoi_id'),
           ('idx_thanh_tich_con_createdById', 'thanh_tich_con', 'createdById'));
  IF v <> 4 THEN RAISE EXCEPTION 'mig052 tự kiểm: chỉ % / 4 index đúng định nghĩa', v; END IF;
END $$;

COMMIT;
