-- ============================================================================
-- Migration 048 — LỊCH SỬ XỬ LÝ HỒ SƠ CẤP CHỨNG CHỈ HÀNH NGHỀ (bổ sung cho 047)
--
-- Mỗi lần tạo hồ sơ, đổi trạng thái hoặc cấp chứng chỉ ghi MỘT dòng (không sửa, không xoá dòng cũ) để
-- truy vết ai chuyển hồ sơ sang trạng thái nào, khi nào — phục vụ kiểm tra thời hạn Đ30 NĐ 212/2026.
-- Lưu cả tên người thao tác tại thời điểm ghi (tên tài khoản có thể đổi sau này).
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/048_cchn_lich_su.sql
-- Hoàn nguyên: 048_cchn_lich_su_rollback.sql
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS cchn_lich_su (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ho_so_id        TEXT NOT NULL REFERENCES cchn_ho_so(id) ON DELETE CASCADE,
  hanh_dong       TEXT NOT NULL CHECK (hanh_dong IN ('TAO_MOI','DOI_TRANG_THAI','CAP_CHUNG_CHI','XOA')),
  tu_trang_thai   TEXT,
  den_trang_thai  TEXT,
  ghi_chu         TEXT,
  nguoi_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  nguoi_ten       TEXT,
  thoi_diem       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cchn_ls_ho_so ON cchn_lich_su (ho_so_id, thoi_diem DESC);

COMMIT;
