-- =============================================================================
-- BẢNG LÃNH ĐẠO & TRƯỞNG PHÒNG KINH TẾ CÁC XÃ, PHƯỜNG TỈNH QUẢNG TRỊ
-- -----------------------------------------------------------------------------
-- Lưu họ tên, chức vụ, số điện thoại của từng lãnh đạo theo đơn vị hành chính.
-- Liên kết wardId → administrative_units(id). Cho phép tra cứu linh hoạt:
--   • theo xã/phường   (qua ward.name / wardId)
--   • theo phòng ban   (cột "phongBan": Thường trực HĐND / Lãnh đạo UBND /
--                       Thường trực Đảng ủy / Phòng Kinh tế - Hạ tầng - Đô thị)
--   • theo số điện thoại (cột "soDienThoai" + index)
-- Idempotent: chạy lại an toàn (CREATE TABLE IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS lanh_dao_xa (
  id            TEXT         PRIMARY KEY,
  "wardId"      TEXT         NOT NULL REFERENCES administrative_units(id) ON DELETE CASCADE,
  "hoTen"       TEXT         NOT NULL,
  "chucVu"      TEXT         NOT NULL,
  "soDienThoai" TEXT,
  "phongBan"    TEXT,
  "thuTu"       INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lanh_dao_xa_wardId_idx      ON lanh_dao_xa("wardId");
CREATE INDEX IF NOT EXISTS lanh_dao_xa_soDienThoai_idx ON lanh_dao_xa("soDienThoai");
CREATE INDEX IF NOT EXISTS lanh_dao_xa_phongBan_idx    ON lanh_dao_xa("phongBan");
