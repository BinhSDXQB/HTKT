-- Commit 8: Phân loại đối tượng nhân sự (Công chức / Viên chức / NLĐ) + hợp đồng lao động.
-- Nhóm ưu tiên cao: phân tách 3 đối tượng để áp đúng chế độ; cảnh báo hết hạn HĐ (NĐ 111/2022, BLLĐ 2019).
-- Áp dụng thủ công, idempotent.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoiTuongNhanSu') THEN
    CREATE TYPE "DoiTuongNhanSu" AS ENUM ('CONG_CHUC','VIEN_CHUC','NGUOI_LAO_DONG');
  END IF;
END $$;

ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "doiTuong"           "DoiTuongNhanSu";
ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "loaiHopDong"        text;
ALTER TABLE can_bo ADD COLUMN IF NOT EXISTS "ngayKetThucHopDong" date;

CREATE INDEX IF NOT EXISTS "can_bo_doiTuong_idx" ON can_bo("doiTuong");

-- Backfill đối tượng từ loại hình (chỉ điền khi còn trống):
--   BCHC* → Công chức · BCSN* → Viên chức · HĐ*/LX* → Người lao động.
UPDATE can_bo SET "doiTuong" = 'CONG_CHUC'
  WHERE "doiTuong" IS NULL AND "loaiHinh" LIKE 'BCHC%';
UPDATE can_bo SET "doiTuong" = 'VIEN_CHUC'
  WHERE "doiTuong" IS NULL AND "loaiHinh" LIKE 'BCSN%';
UPDATE can_bo SET "doiTuong" = 'NGUOI_LAO_DONG'
  WHERE "doiTuong" IS NULL AND ("loaiHinh" LIKE 'HĐ%' OR "loaiHinh" LIKE 'LX%');

COMMIT;
