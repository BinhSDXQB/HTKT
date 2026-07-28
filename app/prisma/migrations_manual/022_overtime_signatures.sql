-- Commit: Quy trình KÝ SỐ bảng chấm công làm thêm giờ.
--   Người chấm công CHÈN ẢNH chữ ký (không ký số) → Trưởng phòng ký số → Lãnh đạo Sở
--   ký số → Văn thư đóng dấu (ký số) → Kế hoạch–Tài chính ký số → HOÀN TẤT.
--   Ký số (VGCA/USB Token) chồng dần trên 1 PDF gồm Văn bản thỏa thuận + Bảng chấm công.
-- Idempotent.

ALTER TABLE overtime_timesheets ADD COLUMN IF NOT EXISTS "trangThai"         text NOT NULL DEFAULT 'NHAP';
ALTER TABLE overtime_timesheets ADD COLUMN IF NOT EXISTS "chuKyChamCong"     bytea;   -- ảnh chữ ký người chấm công
ALTER TABLE overtime_timesheets ADD COLUMN IF NOT EXISTS "chuKyChamCongMime" text;
ALTER TABLE overtime_timesheets ADD COLUMN IF NOT EXISTS "tuChoiCap"         text;
ALTER TABLE overtime_timesheets ADD COLUMN IF NOT EXISTS "ghiChuTuChoi"      text;

CREATE TABLE IF NOT EXISTS overtime_signatures (
  id              text PRIMARY KEY,
  "timesheetId"   text NOT NULL REFERENCES overtime_timesheets(id) ON DELETE CASCADE,
  "capCode"       text NOT NULL,           -- TRUONG_PHONG / LANH_DAO_SO / VAN_THU / TAI_CHINH
  "nguoiKyId"     text,
  "fileName"      text NOT NULL,
  "fileData"      bytea NOT NULL,          -- PDF đã ký (tích luỹ chữ ký các cấp trước)
  "soChuKy"       integer NOT NULL DEFAULT 0,
  "signerCN"      text,
  "signerSerial"  text,
  "signingTime"   timestamp(3),
  "hopLe"         boolean NOT NULL DEFAULT false,
  "ghiChuKiemTra" text,
  "ghiChu"        text,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "overtime_signatures_timesheetId_idx" ON overtime_signatures ("timesheetId");
