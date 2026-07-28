-- Commit 11: Khoá tài khoản sau 5 lần nhập sai mật khẩu (liên hệ quản trị để cấp lại). Idempotent.

ALTER TABLE users ADD COLUMN IF NOT EXISTS "failedLoginCount" integer NOT NULL DEFAULT 0;
