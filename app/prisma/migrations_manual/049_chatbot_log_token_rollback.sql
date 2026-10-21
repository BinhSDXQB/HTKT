-- Hoàn nguyên migration 049 (bỏ 4 cột đo token của chatbot_logs). Phải đưa mã về bản trước 049 TRƯỚC khi chạy.
BEGIN;
ALTER TABLE chatbot_logs DROP COLUMN IF EXISTS "soLanGoi";
ALTER TABLE chatbot_logs DROP COLUMN IF EXISTS "completionTokens";
ALTER TABLE chatbot_logs DROP COLUMN IF EXISTS "promptTokens";
ALTER TABLE chatbot_logs DROP COLUMN IF EXISTS "model";
COMMIT;
