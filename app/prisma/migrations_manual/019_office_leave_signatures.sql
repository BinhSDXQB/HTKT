-- Commit: Ký số đơn nghỉ phép — lưu bản PDF đã ký số của TỪNG CẤP (chữ ký chồng dần).
-- Người ký dùng USB Token + VGCA Sign Service ký ngay trên web; PDF đã ký lưu dạng bytea trong DB
-- (cùng pattern office_generated_documents). Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS office_leave_signatures (
  id               text PRIMARY KEY,
  "leaveRequestId" text NOT NULL REFERENCES office_leave_requests(id) ON DELETE CASCADE,
  "capCode"        text NOT NULL,                 -- TRUONG_PHONG / VAN_PHONG / LANH_DAO_SO / TAI_CHINH
  "nguoiKyId"      text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "fileName"       text NOT NULL,
  "fileData"       bytea NOT NULL,                -- PDF đã ký (tích luỹ chữ ký các cấp trước)
  "soChuKy"        integer NOT NULL DEFAULT 0,    -- số chữ ký số phát hiện trong file
  "signerCN"       text,                          -- CN người ký (cấp này)
  "signerSerial"   text,
  "signingTime"    timestamp(3),
  "hopLe"          boolean NOT NULL DEFAULT false,-- chữ ký toàn vẹn (digest khớp)
  "ghiChuKiemTra"  text,                          -- tóm tắt kết quả kiểm tra
  "createdAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_leave_signatures_leaveRequestId_idx" ON office_leave_signatures("leaveRequestId");

COMMIT;
