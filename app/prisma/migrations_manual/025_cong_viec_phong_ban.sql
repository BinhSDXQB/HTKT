-- Module QUẢN LÝ CÔNG VIỆC PHÒNG/BAN — dùng chung cho 11 phòng (QĐ 331/QĐ-SXD).
-- Lõi 1 bảng cong_viec (scope theo toChucId = phòng sở hữu việc) + loại việc cấu
-- hình theo phòng kèm trường động (fieldSchema/customFields jsonb) → mỗi phòng tự
-- mở rộng KHÔNG cần migration. Liên thông mềm với projects/work_orders/incidents.
-- Enum lưu dạng text (đồng nhất cách làm các migration trước). Additive, idempotent.

-- ── 1. LOẠI CÔNG VIỆC (cấu hình theo phòng; toChucId NULL = dùng chung) ──────
CREATE TABLE IF NOT EXISTS cong_viec_loai (
  id            text PRIMARY KEY,
  "toChucId"    text REFERENCES to_chuc(id),
  ten           text NOT NULL,
  "moTa"        text,
  "mauSac"      text,
  "fieldSchema" jsonb,                                  -- [{name,label,type,required,options}]
  "thuTu"       integer NOT NULL DEFAULT 0,
  "isActive"    boolean NOT NULL DEFAULT true,
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "cong_viec_loai_toChucId_idx" ON cong_viec_loai ("toChucId");

-- ── 2. CÔNG VIỆC (lõi) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cong_viec (
  id                text PRIMARY KEY,
  "maCongViec"      text NOT NULL UNIQUE,               -- CV-2026-000001
  "tieuDe"          text NOT NULL,
  "moTa"            text,
  "toChucId"        text NOT NULL REFERENCES to_chuc(id),
  "loaiId"          text REFERENCES cong_viec_loai(id),
  "trangThai"       text NOT NULL DEFAULT 'MOI',         -- MOI|DANG_LAM|TAM_DUNG|CHO_DUYET|HOAN_THANH|HUY
  "uuTien"          text NOT NULL DEFAULT 'TRUNG_BINH',  -- THAP|TRUNG_BINH|CAO|KHAN_CAP
  "tienDo"          integer NOT NULL DEFAULT 0,          -- 0..100
  "nguoiGiaoId"     text REFERENCES users(id),
  "nguoiPhuTrachId" text REFERENCES users(id),
  "ngayBatDau"      date,
  "ngayHetHan"      date,
  "ngayHoanThanh"   timestamp(3),
  "congViecChaId"   text REFERENCES cong_viec(id),
  "duAnId"          text,                                -- FK mềm → projects.id
  "workOrderId"     text,                                -- FK mềm → work_orders.id
  "incidentId"      text,                                -- FK mềm → incidents.id
  "customFields"    jsonb,
  "dinhKem"         text[] NOT NULL DEFAULT '{}',
  "ghiChu"          text,
  "createdById"     text NOT NULL REFERENCES users(id),
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"       timestamp(3)
);
CREATE INDEX IF NOT EXISTS "cong_viec_toChucId_idx"        ON cong_viec ("toChucId");
CREATE INDEX IF NOT EXISTS "cong_viec_trangThai_idx"       ON cong_viec ("trangThai");
CREATE INDEX IF NOT EXISTS "cong_viec_ngayHetHan_idx"      ON cong_viec ("ngayHetHan");
CREATE INDEX IF NOT EXISTS "cong_viec_nguoiPhuTrachId_idx" ON cong_viec ("nguoiPhuTrachId");
CREATE INDEX IF NOT EXISTS "cong_viec_congViecChaId_idx"   ON cong_viec ("congViecChaId");
CREATE INDEX IF NOT EXISTS "cong_viec_loaiId_idx"          ON cong_viec ("loaiId");
-- Truy vấn trường động: GIN index trên jsonb
CREATE INDEX IF NOT EXISTS "cong_viec_customFields_gin"    ON cong_viec USING gin ("customFields");

-- ── 3. THÀNH VIÊN THAM GIA (chủ trì / phối hợp / theo dõi) ───────────────────
CREATE TABLE IF NOT EXISTS cong_viec_thanh_vien (
  id           text PRIMARY KEY,
  "congViecId" text NOT NULL REFERENCES cong_viec(id) ON DELETE CASCADE,
  "userId"     text NOT NULL REFERENCES users(id),
  "vaiTro"     text NOT NULL DEFAULT 'PHOI_HOP',         -- CHU_TRI|PHOI_HOP|THEO_DOI
  "createdAt"  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("congViecId", "userId")
);
CREATE INDEX IF NOT EXISTS "cong_viec_thanh_vien_userId_idx" ON cong_viec_thanh_vien ("userId");

-- ── 4. NHẬT KÝ (đổi trạng thái, tiến độ, bình luận, giao việc...) ────────────
CREATE TABLE IF NOT EXISTS cong_viec_nhat_ky (
  id           text PRIMARY KEY,
  "congViecId" text NOT NULL REFERENCES cong_viec(id) ON DELETE CASCADE,
  "userId"     text REFERENCES users(id),
  "loai"       text NOT NULL DEFAULT 'BINH_LUAN',        -- TAO|DOI_TRANG_THAI|CAP_NHAT_TIEN_DO|BINH_LUAN|GIAO_VIEC|DINH_KEM|KHAC
  "noiDung"    text,
  "giaTriCu"   text,
  "giaTriMoi"  text,
  "createdAt"  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "cong_viec_nhat_ky_congViecId_idx" ON cong_viec_nhat_ky ("congViecId");

-- ── 5. CHECKLIST ĐẦU VIỆC CON ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cong_viec_check_list (
  id           text PRIMARY KEY,
  "congViecId" text NOT NULL REFERENCES cong_viec(id) ON DELETE CASCADE,
  "noiDung"    text NOT NULL,
  "hoanThanh"  boolean NOT NULL DEFAULT false,
  "thuTu"      integer NOT NULL DEFAULT 0,
  "createdAt"  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "cong_viec_check_list_congViecId_idx" ON cong_viec_check_list ("congViecId");

-- ── 6. SEED loại việc DÙNG CHUNG (toChucId NULL) — idempotent ────────────────
INSERT INTO cong_viec_loai (id, "toChucId", ten, "moTa", "thuTu") VALUES
  ('cvl_chung_thuongxuyen', NULL, 'Công việc thường xuyên', 'Nhiệm vụ chuyên môn thường xuyên của phòng', 1),
  ('cvl_chung_duocgiao',    NULL, 'Nhiệm vụ được giao',     'Nhiệm vụ Lãnh đạo Sở/UBND giao theo văn bản', 2),
  ('cvl_chung_thammuu',     NULL, 'Tham mưu văn bản',       'Soạn thảo, tham mưu văn bản, báo cáo, đề án', 3),
  ('cvl_chung_kiemtra',     NULL, 'Kiểm tra, giám sát',     'Kiểm tra, thẩm định, giám sát hiện trường', 4),
  ('cvl_chung_baocao',      NULL, 'Báo cáo định kỳ',        'Báo cáo tháng/quý/6 tháng/năm và đột xuất', 5)
ON CONFLICT (id) DO NOTHING;

-- ── 7. KIỂU ENUM NATIVE — Prisma cast giá trị sang các kiểu này khi GHI ──────
-- (Hệ thống dùng enum native cho field enum; vd office_leave_requests.trangThai
-- = type TrangThaiNghiPhep.) Tạo idempotent rồi chuyển cột text → enum.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='CongViecTrangThai') THEN
    CREATE TYPE "CongViecTrangThai" AS ENUM ('MOI','DANG_LAM','TAM_DUNG','CHO_DUYET','HOAN_THANH','HUY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='CongViecUuTien') THEN
    CREATE TYPE "CongViecUuTien" AS ENUM ('THAP','TRUNG_BINH','CAO','KHAN_CAP');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='CongViecVaiTro') THEN
    CREATE TYPE "CongViecVaiTro" AS ENUM ('CHU_TRI','PHOI_HOP','THEO_DOI');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='CongViecNhatKyLoai') THEN
    CREATE TYPE "CongViecNhatKyLoai" AS ENUM ('TAO','DOI_TRANG_THAI','CAP_NHAT_TIEN_DO','BINH_LUAN','GIAO_VIEC','DINH_KEM','KHAC');
  END IF;
END $$;

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns WHERE table_name='cong_viec' AND column_name='trangThai')='text' THEN
    ALTER TABLE cong_viec ALTER COLUMN "trangThai" DROP DEFAULT;
    ALTER TABLE cong_viec ALTER COLUMN "trangThai" TYPE "CongViecTrangThai" USING "trangThai"::"CongViecTrangThai";
    ALTER TABLE cong_viec ALTER COLUMN "trangThai" SET DEFAULT 'MOI';
  END IF;
  IF (SELECT data_type FROM information_schema.columns WHERE table_name='cong_viec' AND column_name='uuTien')='text' THEN
    ALTER TABLE cong_viec ALTER COLUMN "uuTien" DROP DEFAULT;
    ALTER TABLE cong_viec ALTER COLUMN "uuTien" TYPE "CongViecUuTien" USING "uuTien"::"CongViecUuTien";
    ALTER TABLE cong_viec ALTER COLUMN "uuTien" SET DEFAULT 'TRUNG_BINH';
  END IF;
  IF (SELECT data_type FROM information_schema.columns WHERE table_name='cong_viec_thanh_vien' AND column_name='vaiTro')='text' THEN
    ALTER TABLE cong_viec_thanh_vien ALTER COLUMN "vaiTro" DROP DEFAULT;
    ALTER TABLE cong_viec_thanh_vien ALTER COLUMN "vaiTro" TYPE "CongViecVaiTro" USING "vaiTro"::"CongViecVaiTro";
    ALTER TABLE cong_viec_thanh_vien ALTER COLUMN "vaiTro" SET DEFAULT 'PHOI_HOP';
  END IF;
  IF (SELECT data_type FROM information_schema.columns WHERE table_name='cong_viec_nhat_ky' AND column_name='loai')='text' THEN
    ALTER TABLE cong_viec_nhat_ky ALTER COLUMN "loai" DROP DEFAULT;
    ALTER TABLE cong_viec_nhat_ky ALTER COLUMN "loai" TYPE "CongViecNhatKyLoai" USING "loai"::"CongViecNhatKyLoai";
    ALTER TABLE cong_viec_nhat_ky ALTER COLUMN "loai" SET DEFAULT 'BINH_LUAN';
  END IF;
END $$;
