-- ============================================================================
-- Migration 049 — GHI SỐ TOKEN THẬT CỦA CHATBOT (đo chi phí AI)
--
-- Rà soát HTKT Brain AI (docs/htkt-brain-review/13 §1, đợt B0): route chatbot không ghi số token
-- nhà cung cấp trả về nên không ước tính được chi phí AI vận hành. Thêm 4 cột CHO PHÉP NULL —
-- không đổi dữ liệu cũ, không khoá bảng lâu (ADD COLUMN không giá trị mặc định).
--
-- THỨ TỰ TRIỂN KHAI: chạy migration này TRƯỚC khi đưa mã mới lên (mã mới ghi các cột này; thiếu cột
-- thì việc ghi chatbot log lỗi — chatbot vẫn trả lời nhưng mất log).
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/049_chatbot_log_token.sql
-- Hoàn nguyên: 049_chatbot_log_token_rollback.sql
-- ============================================================================

BEGIN;

ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS "model"            TEXT;
ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS "promptTokens"     INTEGER;
ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS "completionTokens" INTEGER;
ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS "soLanGoi"         INTEGER;

COMMIT;
