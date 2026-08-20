-- ============================================================================
-- KIỂM CHỨNG Migration 045 — chạy sau khi áp dụng migration.
-- Mọi phép thử chạy trong transaction rồi ROLLBACK: KHÔNG đụng dữ liệu thật.
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/045_lui_thoi_diem_nghi_huu_verify.sql
-- ============================================================================

\set ON_ERROR_STOP off
-- VERBOSITY terse: khi CHECK chặn, psql mặc định in DETAIL kèm TOÀN BỘ dòng dữ liệu
-- (có CCCD, số điện thoại, email của cán bộ) ra màn hình/log. Chỉ cần biết ràng buộc
-- nào chặn, không cần dữ liệu cá nhân → tắt DETAIL.
\set VERBOSITY terse

-- 1. Ba cột đã tồn tại, đúng kiểu.
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'can_bo'
   AND column_name IN ('ngayNghiHuuLui', 'truongHopLui', 'vanBanLuiNghiHuu')
 ORDER BY column_name;

-- 2. Ba ràng buộc CHECK đã tồn tại.
SELECT conname FROM pg_constraint
 WHERE conrelid = 'public.can_bo'::regclass
   AND conname IN ('can_bo_truong_hop_lui_check', 'can_bo_ngay_lui_check',
                   'can_bo_lui_du_can_cu_check')
 ORDER BY conname;

-- 3. Dữ liệu cũ KHÔNG bị ảnh hưởng: chưa ai có ngày lùi.
SELECT count(*) AS "so ban ghi da lui (phai = 0)"
  FROM public.can_bo WHERE "ngayNghiHuuLui" IS NOT NULL;

-- ─────────────────── PHÉP THỬ RÀNG BUỘC (đều phải BÁO LỖI) ───────────────────

BEGIN;
-- 4. Trường hợp lùi sai mã → phải lỗi can_bo_truong_hop_lui_check
UPDATE public.can_bo SET "truongHopLui" = 'X'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 5. Lùi 2 tháng nhưng khai trường hợp A (trần 1 tháng) → phải lỗi can_bo_ngay_lui_check
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '2 months',
       "truongHopLui" = 'A', "vanBanLuiNghiHuu" = 'Thu 01/QD-SXD'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 6. Lùi 7 tháng, trường hợp C (trần 6 tháng) → phải lỗi can_bo_ngay_lui_check
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '7 months',
       "truongHopLui" = 'C', "vanBanLuiNghiHuu" = 'Thu 02/QD-SXD'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 7. Lùi VỀ TRƯỚC ngày dự kiến → phải lỗi can_bo_ngay_lui_check
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" - INTERVAL '1 day',
       "truongHopLui" = 'A', "vanBanLuiNghiHuu" = 'Thu 03/QD-SXD'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 8. Có ngày lùi nhưng THIẾU văn bản quyết định → phải lỗi can_bo_lui_du_can_cu_check
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '1 month', "truongHopLui" = 'A'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 8b. Khai trường hợp lùi nhưng KHÔNG có ngày lùi (dữ liệu rác) → phải lỗi
UPDATE public.can_bo SET "truongHopLui" = 'B', "vanBanLuiNghiHuu" = 'Thu 06/QD-SXD'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 8c. Văn bản quyết định là chuỗi TOÀN KHOẢNG TRẮNG → phải lỗi
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '1 month',
       "truongHopLui" = 'A', "vanBanLuiNghiHuu" = '   '
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 8d. Có ngày lùi nhưng hồ sơ KHÔNG có ngày nghỉ hưu dự kiến (không đối chiếu được
--     trần lùi) → phải lỗi can_bo_ngay_lui_check
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = DATE '2030-01-01',
       "truongHopLui" = 'A', "vanBanLuiNghiHuu" = 'Thu 07/QD-SXD'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NULL LIMIT 1);
ROLLBACK;

-- ─────────────────── PHÉP THỬ HỢP LỆ (phải CHẠY ĐƯỢC) ───────────────────

BEGIN;
-- 9. Lùi đúng 1 tháng, trường hợp A, có văn bản → phải UPDATE 1 dòng
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '1 month',
       "truongHopLui" = 'A', "vanBanLuiNghiHuu" = 'Thu 04/QD-SXD ngay 21/8/2026'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

BEGIN;
-- 10. Lùi đúng 6 tháng, trường hợp C, có văn bản → phải UPDATE 1 dòng
UPDATE public.can_bo
   SET "ngayNghiHuuLui" = "ngayVeHuu" + INTERVAL '6 months',
       "truongHopLui" = 'C', "vanBanLuiNghiHuu" = 'Thu 05/QD-SXD ngay 21/8/2026'
 WHERE id = (SELECT id FROM public.can_bo WHERE "ngayVeHuu" IS NOT NULL LIMIT 1);
ROLLBACK;

-- 11. Chỉ mục bộ phận đã tạo.
SELECT indexname FROM pg_indexes
 WHERE tablename = 'can_bo' AND indexname = 'can_bo_ngay_nghi_huu_lui_idx';
