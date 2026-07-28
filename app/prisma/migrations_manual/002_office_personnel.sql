-- Commit 2: Văn phòng Sở — Hồ sơ nhân sự & lương
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoaiNangLuong') THEN
    CREATE TYPE "LoaiNangLuong" AS ENUM ('THUONG_XUYEN','TRUOC_HAN','DOT_XUAT','VUOT_KHUNG','KHAC');
  END IF;
END $$;

-- Lịch sử lương
CREATE TABLE IF NOT EXISTS office_salary_history (
  id              text PRIMARY KEY,
  "canBoId"       text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  loai            "LoaiNangLuong" NOT NULL DEFAULT 'THUONG_XUYEN',
  "bacLuong"      integer,
  "heSoLuong"     double precision NOT NULL,
  "phuCapChucVu"  double precision,
  "vuotKhung"     double precision,
  "ngayHuong"     date NOT NULL,
  "ngayNangTiep"  date,
  "soQuyetDinh"   text,
  "ngayQuyetDinh" date,
  "ghiChu"        text,
  "createdById"   text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_salary_history_canBoId_idx"   ON office_salary_history("canBoId");
CREATE INDEX IF NOT EXISTS "office_salary_history_ngayHuong_idx" ON office_salary_history("ngayHuong");
CREATE INDEX IF NOT EXISTS "office_salary_history_loai_idx"      ON office_salary_history(loai);

-- Quá trình công tác
CREATE TABLE IF NOT EXISTS office_work_history (
  id            text PRIMARY KEY,
  "canBoId"     text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "tuNgay"      date NOT NULL,
  "denNgay"     date,
  "donVi"       text NOT NULL,
  "chucVu"      text,
  "noiDung"     text,
  "soQuyetDinh" text,
  "ghiChu"      text,
  "createdById" text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_work_history_canBoId_idx" ON office_work_history("canBoId");
CREATE INDEX IF NOT EXISTS "office_work_history_tuNgay_idx"  ON office_work_history("tuNgay");

-- Cấu hình quy tắc nâng lương (không hard-code điều kiện pháp lý)
CREATE TABLE IF NOT EXISTS office_salary_rules (
  id                        text PRIMARY KEY,
  ma                        text NOT NULL UNIQUE,
  ten                       text NOT NULL,
  "loaiCanBo"               text,
  "nhomNgach"               text,
  "soNamGiuBac"             integer,
  "soThangGiuBac"           integer,
  "bacToiDa"                integer,
  "heSoVuotKhungBatDau"     double precision,
  "phanTramVuotKhungMoiNam" double precision,
  "vanBanCanCu"             text,
  "hieuLucTuNgay"           date,
  "hieuLucDenNgay"          date,
  "isActive"                boolean NOT NULL DEFAULT true,
  "moTa"                    text,
  "createdAt"               timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_salary_rules_isActive_idx" ON office_salary_rules("isActive");

COMMIT;
