-- Commit 10: Quên/đặt lại mật khẩu qua email (SMTP). Token một lần, hết hạn sau 1 giờ.
-- Lưu HASH (SHA-256) của token, không lưu token gốc. Idempotent.

ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenHash"      text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" timestamp(3);
