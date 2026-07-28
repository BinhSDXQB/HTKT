-- Commit 9: Vị trí việc làm (VTVL) — NĐ 62/2020 (công chức), NĐ 106/2020 (viên chức), Luật CBCC 2025.
-- Người quản lý cập nhật VTVL cho từng công chức/viên chức. Idempotent.

ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "viTriViecLam" text;
