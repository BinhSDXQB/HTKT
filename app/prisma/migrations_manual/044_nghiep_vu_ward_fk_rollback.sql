-- ROLLBACK Migration 044 — gỡ khoá ngoại địa bàn của nghiep_vu_ban_ghi.
-- Dữ liệu tên địa bàn vẫn còn ở cột diaBan nên không mất thông tin.
-- Nhớ gỡ đồng thời trường wardId trong model NghiepVuBanGhi (schema.prisma)
-- và phần gán wardId trong app/actions/nghiep-vu.ts.

DROP INDEX CONCURRENTLY IF EXISTS public."nghiep_vu_ban_ghi_wardId_idx";
ALTER TABLE public.nghiep_vu_ban_ghi DROP CONSTRAINT IF EXISTS "nghiep_vu_ban_ghi_wardId_fkey";
ALTER TABLE public.nghiep_vu_ban_ghi DROP COLUMN IF EXISTS "wardId";
