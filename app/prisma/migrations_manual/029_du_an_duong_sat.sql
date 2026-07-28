-- ============================================================================
-- Module DỰ ÁN ĐƯỜNG SẮT TỐC ĐỘ CAO BẮC-NAM
-- Kế hoạch vốn trung hạn 2026-2030 · GPMB & Tái định cư tỉnh Quảng Trị
-- 4 bảng: ds_du_an_gpmb → ds_du_an_thanh_phan, ds_ke_hoach_von, ds_lien_he
-- Liên kết: administrative_units (xã/phường), to_chuc (phòng phụ trách),
--           cong_viec (FK mềm), projects (FK mềm)
-- ĐVT tài chính: triệu đồng (nhất quán với Excel nguồn)
-- Additive, idempotent.
-- ============================================================================

-- ── ENUM loại dự án thành phần ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='DuAnThanhPhanLoai') THEN
    CREATE TYPE "DuAnThanhPhanLoai" AS ENUM (
      'TAI_DINH_CU',         -- Khu tái định cư
      'NGHIA_TRANG',         -- Khu nghĩa trang
      'BOI_THUONG_HO_TRO',   -- Bồi thường, hỗ trợ
      'DI_DOI_HTKT',         -- Di dời hạ tầng kỹ thuật
      'KHAC'                 -- Khác
    );
  END IF;
END $$;

-- ── 1. DỰ ÁN GPMB CHÍNH (1 bản ghi / xã-phường, ~33+) ────────────────────
CREATE TABLE IF NOT EXISTS ds_du_an_gpmb (
  id              text PRIMARY KEY,
  stt             integer NOT NULL,
  "chuDauTu"      text NOT NULL,                                    -- UBND xã/phường
  "tenDuAn"       text NOT NULL,                                    -- Tên đầy đủ
  "maDuAn"        text,                                             -- Mã dự án KBNN (8166xxx)
  "noiMoTK"       text,                                             -- Nơi mở TK: KBNN khu vực…
  "maHieuKBNN"    text,                                             -- 1519, 1515, 1511…
  "soTaiKhoan"    text,                                             -- 9552.1.xxx

  -- Liên kết đơn vị hành chính (xã/phường trên địa bàn)
  "wardId"        text REFERENCES administrative_units(id),
  -- Phòng/ban phụ trách (FK to_chuc — phòng HTKT, VP Sở, KHTC…)
  "toChucId"      text REFERENCES to_chuc(id),

  -- Tổng hợp kế hoạch 2026-2028 (triệu đồng) — cache tính nhanh
  "keHoach2628"        double precision DEFAULT 0,                  -- Tổng KH 3 năm
  -- Tổng nhu cầu (sơ bộ TMĐT bước lập BCNCTKT)
  "tongNhuCau"         double precision DEFAULT 0,
  "tongNhuCauTDC"      double precision DEFAULT 0,                  -- Phần TĐC, NT
  "tongNhuCauBT"       double precision DEFAULT 0,                  -- Phần bồi thường, HT, di dời HTKT

  "vanBanLienQuan" text,                                            -- Số văn bản UBND
  "ghiChu"         text,

  -- FK mềm liên thông với module khác
  "congViecId"     text,                                            -- → cong_viec.id (công việc phòng)
  "projectId"      text,                                            -- → projects.id (dự án HTKT)

  "createdAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ds_du_an_gpmb_maDuAn_key"
  ON ds_du_an_gpmb ("maDuAn") WHERE "maDuAn" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ds_du_an_gpmb_wardId_idx"     ON ds_du_an_gpmb ("wardId");
CREATE INDEX IF NOT EXISTS "ds_du_an_gpmb_toChucId_idx"   ON ds_du_an_gpmb ("toChucId");

-- ── 2. DỰ ÁN THÀNH PHẦN (~113 bản ghi: TĐC, nghĩa trang, bồi thường…) ────
CREATE TABLE IF NOT EXISTS ds_du_an_thanh_phan (
  id              text PRIMARY KEY,
  "duAnGpmbId"    text NOT NULL REFERENCES ds_du_an_gpmb(id) ON DELETE CASCADE,
  stt             integer NOT NULL,
  "tenDuAn"       text NOT NULL,
  "loaiDuAn"      "DuAnThanhPhanLoai" NOT NULL DEFAULT 'KHAC',
  "soBoTMDT"      double precision,                                 -- Sơ bộ TMĐT (tỷ đồng)
  "chuDauTu"      text,                                             -- Kế thừa parent nếu null
  "nguoiQDDauTu"  text,                                             -- UBND tỉnh Quảng Trị

  -- Phương án TĐC (từ sheet Phương án 2)
  "soLuongKhuTDC"   integer,                                        -- Số khu TĐC
  "tmDtKhuTDC"      double precision,                               -- TMĐT khu TĐC (tỷ đồng)
  "soLuongNghiaTrang" integer,                                      -- Số khu nghĩa trang
  "tmDtNghiaTrang"  double precision,                               -- TMĐT nghĩa trang (tỷ đồng)

  "ghiChu"        text,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ds_du_an_thanh_phan_duAnGpmbId_idx"
  ON ds_du_an_thanh_phan ("duAnGpmbId");
CREATE INDEX IF NOT EXISTS "ds_du_an_thanh_phan_loaiDuAn_idx"
  ON ds_du_an_thanh_phan ("loaiDuAn");

-- ── 3. KẾ HOẠCH VỐN THEO NĂM (33 dự án × 4 năm ≈ 132 bản ghi) ────────────
-- ĐVT: triệu đồng (nhất quán với bảng Excel nguồn)
CREATE TABLE IF NOT EXISTS ds_ke_hoach_von (
  id                    text PRIMARY KEY,
  "duAnGpmbId"          text NOT NULL REFERENCES ds_du_an_gpmb(id) ON DELETE CASCADE,
  nam                   integer NOT NULL,                           -- 2025, 2026, 2027, 2028

  -- Năm 2025 đặc thù
  "daBoTri"             double precision DEFAULT 0,                 -- Đã bố trí
  "giaiNgan"            double precision DEFAULT 0,                 -- Giải ngân đến 31/01/2026
  "daHuyDuToan"         double precision DEFAULT 0,                 -- Đã huỷ dự toán

  -- Kế hoạch năm (2026, 2027, 2028)
  "tongKH"              double precision DEFAULT 0,                 -- Tổng kế hoạch năm
  "khuTDC_NT"           double precision DEFAULT 0,                 -- Khu TĐC, Nghĩa trang
  "boiThuongHT"         double precision DEFAULT 0,                 -- Bồi thường, hỗ trợ, di dời HTKT
  "deNghiDieuChinhGiam" double precision DEFAULT 0,                 -- Đề nghị điều chỉnh giảm
  "giaiNganKHV"         double precision DEFAULT 0,                 -- Giải ngân KHV đến thời điểm

  "ghiChu"              text,
  "createdAt"           timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE ("duAnGpmbId", nam)
);

CREATE INDEX IF NOT EXISTS "ds_ke_hoach_von_nam_idx" ON ds_ke_hoach_von (nam);

-- ── 4. LIÊN HỆ CÁC ĐƠN VỊ LIÊN QUAN ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ds_lien_he (
  id              text PRIMARY KEY,
  "duAnGpmbId"    text REFERENCES ds_du_an_gpmb(id) ON DELETE SET NULL,
  "donVi"         text NOT NULL,                                    -- VP UBND tỉnh, KBNN, Sở XD…
  "hoTen"         text,
  "chucVu"        text,
  "dienThoai"     text,
  "ghiChu"        text,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ds_lien_he_duAnGpmbId_idx" ON ds_lien_he ("duAnGpmbId");
CREATE INDEX IF NOT EXISTS "ds_lien_he_donVi_idx"       ON ds_lien_he ("donVi");
