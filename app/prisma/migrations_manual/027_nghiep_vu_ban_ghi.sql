-- Module HỒ SƠ NGHIỆP VỤ ĐỘNG — dùng chung cho TẤT CẢ các phòng (QĐ 331).
-- Mỗi bản ghi thuộc một "lĩnh vực" (linhVuc = key đường dẫn sau /dashboard/, vd
-- 'phong-htkt/cap-nuoc', 'phong-qlhd-xd/cap-phep-xay-dung'). Trường riêng từng lĩnh
-- vực lưu trong customFields (jsonb) theo schema cấu hình ở lib/nghiep-vu/schema.ts
-- ⇒ thêm/bớt trường KHÔNG cần migration. Dữ liệu CÔ LẬP theo toChucId (phòng sở hữu).
-- trangThai lưu TEXT (KHÔNG enum native) — tránh lỗi cast enum khi ghi. Additive, idempotent.

CREATE TABLE IF NOT EXISTS nghiep_vu_ban_ghi (
  id             text PRIMARY KEY,
  "linhVuc"      text NOT NULL,                       -- key lĩnh vực (path sau /dashboard/)
  "toChucId"     text REFERENCES to_chuc(id),         -- phòng sở hữu (cô lập dữ liệu)
  "maBanGhi"     text NOT NULL,                        -- mã hiển thị NV-YYYY-NNNNNN
  "tieuDe"       text NOT NULL,
  "trangThai"    text NOT NULL DEFAULT 'MOI',          -- MOI|DANG_XU_LY|HOAN_THANH|HUY
  "diaBan"       text,                                 -- xã/phường liên quan
  "ngayGhiNhan"  timestamp(3),
  "ghiChu"       text,
  "customFields" jsonb NOT NULL DEFAULT '{}'::jsonb,   -- dữ liệu động theo schema lĩnh vực
  "createdById"  text REFERENCES users(id),
  "createdAt"    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"    timestamp(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_maBanGhi_key" ON nghiep_vu_ban_ghi ("maBanGhi");
CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_linhVuc_idx"          ON nghiep_vu_ban_ghi ("linhVuc");
CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_toChucId_idx"         ON nghiep_vu_ban_ghi ("toChucId");
CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_linhVuc_toChucId_idx" ON nghiep_vu_ban_ghi ("linhVuc", "toChucId");
CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_customFields_gin"     ON nghiep_vu_ban_ghi USING GIN ("customFields");
