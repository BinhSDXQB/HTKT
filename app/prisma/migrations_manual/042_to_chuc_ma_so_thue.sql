-- ============================================================================
-- Migration 042 — Bổ sung cột to_chuc."maSoThue" (vá LỆCH SCHEMA)
--
-- Vấn đề phát hiện 19/8/2026:
--   prisma/schema.prisma (model ToChuc) KHAI BÁO trường maSoThue nhưng bảng
--   to_chuc trong CSDL KHÔNG có cột này. Prisma Client luôn select đủ các cột
--   scalar → mọi truy vấn đọc nguyên bản ghi ToChuc đều lỗi:
--       PrismaClientKnownRequestError · DriverAdapterError · ColumnNotFound
--
--   Hậu quả thực tế đã ghi nhận trong log (c:\logs\ql-htkt-error-1.log):
--     "Tool so_do_to_chuc error: ... ColumnNotFound"
--   → chatbot trả lời "không thể truy cập thông tin về các phòng ban của Sở"
--   cho MỌI câu hỏi về sơ đồ tổ chức. Route /api/check-data cũng lỗi tương tự.
--
-- Kiểm chứng lệch schema:
--   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/042_to_chuc_ma_so_thue.sql
-- ============================================================================

ALTER TABLE public.to_chuc ADD COLUMN IF NOT EXISTS "maSoThue" TEXT;

COMMENT ON COLUMN public.to_chuc."maSoThue" IS 'Mã số thuế của đơn vị (10 hoặc 13 ký tự) — dùng cho hồ sơ tài chính, kê khai';

-- Kiểm tra sau khi chạy
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'to_chuc' AND column_name = 'maSoThue';
