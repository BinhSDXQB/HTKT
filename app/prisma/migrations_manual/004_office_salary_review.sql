-- Commit 4: Văn phòng Sở — Quy trình rà soát nâng lương
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrangThaiRaSoatLuong') THEN
    CREATE TYPE "TrangThaiRaSoatLuong" AS ENUM (
      'DU_KIEN','DANG_RA_SOAT','CHO_DUYET','DA_DUYET','DA_BAN_HANH','TU_CHOI'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KetLuanRaSoat') THEN
    CREATE TYPE "KetLuanRaSoat" AS ENUM ('DU_DIEU_KIEN','CHUA_DU_DIEU_KIEN','CAN_KIEM_TRA');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS office_salary_review_cases (
  id              text PRIMARY KEY,
  "canBoId"       text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  loai            "LoaiNangLuong" NOT NULL DEFAULT 'THUONG_XUYEN',
  "namRaSoat"     integer NOT NULL,
  "dotRaSoat"     text,
  "ngayDenHan"    date,
  "heSoHienTai"   double precision,
  "bacHienTai"    integer,
  "heSoDeXuat"    double precision,
  "bacDeXuat"     integer,
  "ngayHuongMoi"  date,
  "trangThai"     "TrangThaiRaSoatLuong" NOT NULL DEFAULT 'DU_KIEN',
  "ketLuanRaSoat" "KetLuanRaSoat",
  "noiDungRaSoat" text,
  "canCuPhapLy"   text,
  "nguoiRaSoatId" text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "ngayRaSoat"    timestamp(3),
  "nguoiDuyetId"  text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "ngayDuyet"     timestamp(3),
  "soQuyetDinh"   text,
  "ngayQuyetDinh" date,
  "ghiChu"        text,
  "createdById"   text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT office_salary_review_cases_canBo_nam_loai_key UNIQUE ("canBoId", "namRaSoat", loai)
);
CREATE INDEX IF NOT EXISTS "office_salary_review_cases_trangThai_idx" ON office_salary_review_cases("trangThai");
CREATE INDEX IF NOT EXISTS "office_salary_review_cases_namRaSoat_idx" ON office_salary_review_cases("namRaSoat");
CREATE INDEX IF NOT EXISTS "office_salary_review_cases_canBoId_idx"   ON office_salary_review_cases("canBoId");

COMMIT;
