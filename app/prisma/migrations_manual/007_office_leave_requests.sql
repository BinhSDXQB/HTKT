-- Văn phòng Sở: Quản lý nghỉ phép TOÀN SỞ (đơn nghỉ phép + duyệt)
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoaiNghiPhep') THEN
    CREATE TYPE "LoaiNghiPhep" AS ENUM ('PHEP_NAM','OM','THAI_SAN','KHONG_LUONG','VIEC_RIENG','BU','KHAC');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrangThaiNghiPhep') THEN
    CREATE TYPE "TrangThaiNghiPhep" AS ENUM ('CHO_DUYET','DA_DUYET','TU_CHOI','DA_HUY');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS office_leave_requests (
  id             text PRIMARY KEY,
  "canBoId"      text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE,
  "loaiNghi"     "LoaiNghiPhep" NOT NULL DEFAULT 'PHEP_NAM',
  "tuNgay"       date NOT NULL,
  "denNgay"      date NOT NULL,
  "soNgay"       double precision NOT NULL,
  "lyDo"         text,
  "trangThai"    "TrangThaiNghiPhep" NOT NULL DEFAULT 'CHO_DUYET',
  "nguoiDuyetId" text,
  "ngayDuyet"    timestamp(3),
  "ghiChuDuyet"  text,
  "createdById"  text,
  "createdAt"    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_leave_requests_canBoId_idx"    ON office_leave_requests("canBoId");
CREATE INDEX IF NOT EXISTS "office_leave_requests_trangThai_idx"  ON office_leave_requests("trangThai");
CREATE INDEX IF NOT EXISTS "office_leave_requests_tuNgay_idx"     ON office_leave_requests("tuNgay");

COMMIT;
