-- ============================================================================
-- ROLLBACK Migration 045 — LÙI THỜI ĐIỂM NGHỈ HƯU
--
-- ⚠️ XOÁ DỮ LIỆU: ba cột dưới đây chứa quyết định lùi thời điểm nghỉ hưu của
-- người có thẩm quyền, KHÔNG tính lại được. Sao lưu trước khi chạy:
--   \copy (SELECT id, "hoTen", "ngayVeHuu", "ngayNghiHuuLui", "truongHopLui",
--          "vanBanLuiNghiHuu" FROM public.can_bo WHERE "ngayNghiHuuLui" IS NOT NULL)
--     TO 'lui_nghi_huu_backup.csv' CSV HEADER
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/045_lui_thoi_diem_nghi_huu_rollback.sql
-- ============================================================================

DROP INDEX IF EXISTS public.can_bo_ngay_nghi_huu_lui_idx;

ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_lui_du_can_cu_check;
ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_ngay_lui_check;
ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_truong_hop_lui_check;

COMMENT ON COLUMN public.can_bo."ngayVeHuu" IS NULL;

ALTER TABLE public.can_bo
  DROP COLUMN IF EXISTS "vanBanLuiNghiHuu",
  DROP COLUMN IF EXISTS "truongHopLui",
  DROP COLUMN IF EXISTS "ngayNghiHuuLui";

ANALYZE public.can_bo;
