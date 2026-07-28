-- Commit 9: Văn phòng Sở — Khen thưởng TẬP THỂ (đơn vị)
-- Bảng office_reward_records chỉ theo cá nhân; bảng này lưu khen thưởng cho tập thể/đơn vị.
-- toChucId NULL nếu đơn vị đã giải thể (vd Thanh tra Sở); luôn lưu tenTapThe + cờ conTonTai.
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS office_collective_reward_records (
  id                text PRIMARY KEY,
  "toChucId"        text REFERENCES to_chuc(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "tenTapThe"       text NOT NULL,
  "conTonTai"       boolean NOT NULL DEFAULT true,
  "rewardTitleId"   text REFERENCES office_reward_titles(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "movementId"      text REFERENCES office_emulation_movements(id) ON DELETE SET NULL ON UPDATE CASCADE,
  nam               integer NOT NULL,
  "danhHieu"        text,
  "capKhen"         text,
  "soQuyetDinh"     text,
  "ngayQuyetDinh"   date,
  "coQuanQuyetDinh" text,
  "thanhTich"       text,
  "ghiChu"          text,
  "createdById"     text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_collective_reward_records_nam_idx"      ON office_collective_reward_records(nam);
CREATE INDEX IF NOT EXISTS "office_collective_reward_records_toChucId_idx" ON office_collective_reward_records("toChucId");

COMMIT;
