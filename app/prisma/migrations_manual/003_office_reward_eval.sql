-- Commit 3: Văn phòng Sở — Thi đua, khen thưởng, đánh giá xếp loại, kỷ luật
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoaiKhenThuong') THEN
    CREATE TYPE "LoaiKhenThuong" AS ENUM ('DANH_HIEU','HINH_THUC');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MucXepLoai') THEN
    CREATE TYPE "MucXepLoai" AS ENUM (
      'HOAN_THANH_XUAT_SAC_NHIEM_VU','HOAN_THANH_TOT_NHIEM_VU','HOAN_THANH_NHIEM_VU','KHONG_HOAN_THANH_NHIEM_VU'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HinhThucKyLuat') THEN
    CREATE TYPE "HinhThucKyLuat" AS ENUM (
      'KHIEN_TRACH','CANH_CAO','HA_BAC_LUONG','GIANG_CHUC','CACH_CHUC','BUOC_THOI_VIEC','KHAC'
    );
  END IF;
END $$;

-- Danh mục danh hiệu / hình thức khen thưởng (config)
CREATE TABLE IF NOT EXISTS office_reward_titles (
  id          text PRIMARY KEY,
  ma          text NOT NULL UNIQUE,
  ten         text NOT NULL,
  loai        "LoaiKhenThuong" NOT NULL DEFAULT 'DANH_HIEU',
  "capKhen"   text,
  "thuTu"     integer NOT NULL DEFAULT 0,
  "isActive"  boolean NOT NULL DEFAULT true,
  "moTa"      text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_reward_titles_isActive_idx" ON office_reward_titles("isActive");
CREATE INDEX IF NOT EXISTS "office_reward_titles_loai_idx"     ON office_reward_titles(loai);

-- Đợt / phong trào thi đua
CREATE TABLE IF NOT EXISTS office_emulation_movements (
  id            text PRIMARY KEY,
  ten           text NOT NULL,
  nam           integer NOT NULL,
  "capPhatDong" text,
  "tuNgay"      date,
  "denNgay"     date,
  "moTa"        text,
  "isActive"    boolean NOT NULL DEFAULT true,
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_emulation_movements_nam_idx"      ON office_emulation_movements(nam);
CREATE INDEX IF NOT EXISTS "office_emulation_movements_isActive_idx" ON office_emulation_movements("isActive");

-- Khen thưởng / danh hiệu cán bộ đã đạt
CREATE TABLE IF NOT EXISTS office_reward_records (
  id                text PRIMARY KEY,
  "canBoId"         text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
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
CREATE INDEX IF NOT EXISTS "office_reward_records_canBoId_idx"       ON office_reward_records("canBoId");
CREATE INDEX IF NOT EXISTS "office_reward_records_nam_idx"           ON office_reward_records(nam);
CREATE INDEX IF NOT EXISTS "office_reward_records_rewardTitleId_idx" ON office_reward_records("rewardTitleId");
CREATE INDEX IF NOT EXISTS "office_reward_records_movementId_idx"    ON office_reward_records("movementId");

-- Đánh giá, xếp loại chất lượng hằng năm
CREATE TABLE IF NOT EXISTS office_annual_evaluations (
  id                text PRIMARY KEY,
  "canBoId"         text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  nam               integer NOT NULL,
  "mucXepLoai"      "MucXepLoai" NOT NULL,
  "laChienSiThiDua" boolean NOT NULL DEFAULT false,
  "soQuyetDinh"     text,
  "ngayQuyetDinh"   date,
  "ghiChu"          text,
  "createdById"     text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT office_annual_evaluations_canBo_nam_key UNIQUE ("canBoId", nam)
);
CREATE INDEX IF NOT EXISTS "office_annual_evaluations_nam_idx" ON office_annual_evaluations(nam);

-- Kỷ luật & kéo dài thời gian nâng lương
CREATE TABLE IF NOT EXISTS office_discipline_records (
  id                       text PRIMARY KEY,
  "canBoId"                text NOT NULL REFERENCES can_bo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "hinhThuc"               "HinhThucKyLuat" NOT NULL,
  "lyDo"                   text,
  "tuNgay"                 date NOT NULL,
  "denNgay"                date,
  "soThangKeoDaiNangLuong" integer,
  "soQuyetDinh"            text,
  "ngayQuyetDinh"          date,
  "ghiChu"                 text,
  "createdById"            text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"              timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_discipline_records_canBoId_idx" ON office_discipline_records("canBoId");

COMMIT;
