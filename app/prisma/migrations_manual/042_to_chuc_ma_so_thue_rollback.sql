-- ROLLBACK Migration 042 — gỡ cột to_chuc."maSoThue".
-- CẢNH BÁO: gỡ cột này sẽ làm chatbot (tool so_do_to_chuc) và /api/check-data
-- lỗi ColumnNotFound trở lại, vì prisma/schema.prisma vẫn khai báo trường này.
-- Chỉ chạy khi đồng thời gỡ trường maSoThue khỏi model ToChuc trong schema.

ALTER TABLE public.to_chuc DROP COLUMN IF EXISTS "maSoThue";
