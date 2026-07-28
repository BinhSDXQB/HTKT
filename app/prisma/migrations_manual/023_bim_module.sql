-- Module BIM/AIM — Đợt B1: Tiếp nhận & lưu trữ mô hình thông tin công trình.
-- Căn cứ: QĐ 258/QĐ-TTg (lộ trình bắt buộc BIM), NĐ 175/2024/NĐ-CP (tệp BIM
-- trong hồ sơ thẩm định/cấp phép: định dạng gốc + IFC 4.0, ≤500MB/file),
-- QĐ 348 & 347/QĐ-BXD (hướng dẫn áp dụng BIM), ISO 19650 (CDE).
-- Thiết kế chi tiết: C:\Troly\HTKT\Thiet_Ke_Module_BIM_AIM_Theo_Phap_Ly_VN.md
-- Additive migration — idempotent, không đụng bảng cũ.

-- ── 1. MÔ HÌNH BIM (1 công trình có thể nhiều mô hình theo bộ môn) ──────────
CREATE TABLE IF NOT EXISTS bim_models (
  id                  text PRIMARY KEY,
  "maMoHinh"          text NOT NULL UNIQUE,        -- BIM-2026-0001
  ten                 text NOT NULL,
  "moTa"              text,
  discipline          text NOT NULL DEFAULT 'TONG_HOP',
    -- KIEN_TRUC | KET_CAU | CO_DIEN | HA_TANG_GIAO_THONG | CAP_THOAT_NUOC | CHIEU_SANG | TONG_HOP
  "projectId"         text,                        -- FK mềm → projects.id
  "assetId"           text,                        -- FK mềm → assets.id (mô hình tài sản vận hành)
  "soGiayPhep"        text,                        -- số GPXD nếu gắn cấp phép
  "soQuyetDinhThamDinh" text,                      -- số QĐ thẩm định nếu có
  "capCongTrinh"      text,                        -- CAP_DAC_BIET | CAP_I | CAP_II | CAP_III | CAP_IV
  "nguonVon"          text,                        -- DAU_TU_CONG | VON_NN | PPP | VON_KHAC
  "batBuocBim"        boolean NOT NULL DEFAULT false, -- thuộc diện QĐ 258/QĐ-TTg
  "wardId"            text,                        -- FK mềm → administrative_units.id
  "diaChi"            text,
  latitude            double precision,
  longitude           double precision,
  "dataStatus"        text NOT NULL DEFAULT 'verified', -- legacy|imported|verified|needs_review
  "sourceSystem"      text NOT NULL DEFAULT 'QLHTKT',
  metadata            jsonb,
  "createdById"       text,
  "updatedById"       text,
  "createdAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"         timestamp(3)
);
CREATE INDEX IF NOT EXISTS "bim_models_projectId_idx" ON bim_models ("projectId");
CREATE INDEX IF NOT EXISTS "bim_models_wardId_idx" ON bim_models ("wardId");
CREATE INDEX IF NOT EXISTS "bim_models_capCongTrinh_idx" ON bim_models ("capCongTrinh");

-- ── 2. PHIÊN BẢN MÔ HÌNH (vòng đời CDE: SHARED → PUBLISHED → ARCHIVED) ──────
CREATE TABLE IF NOT EXISTS bim_model_versions (
  id                text PRIMARY KEY,
  "modelId"         text NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  "versionNo"       integer NOT NULL,
  "maContainer"     text NOT NULL,                 -- ISO 19650: QT-SXD-BIM-2026-0001-V03
  stage             text NOT NULL,                 -- NCTKT | NCKT_TKCS | TK_KY_THUAT | TK_BAN_VE_THI_CONG | HOAN_CONG
  "lodChinh"        text NOT NULL,                 -- LOD_100..LOD_500
  "cdeStatus"       text NOT NULL DEFAULT 'SHARED',-- SHARED | PUBLISHED | ARCHIVED
  "ghiChuNop"       text,
  "nguoiNopTen"     text,
  "nguoiNopDonVi"   text,                          -- đơn vị tư vấn lập mô hình
  "ngayTiepNhan"    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById"   text,
  "publishedAt"     timestamp(3),
  "archivedAt"      timestamp(3),
  "archiveReason"   text,
  metadata          jsonb,
  "createdById"     text,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"       timestamp(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "bim_model_versions_modelId_versionNo_key"
  ON bim_model_versions ("modelId", "versionNo");
CREATE INDEX IF NOT EXISTS "bim_model_versions_cdeStatus_idx" ON bim_model_versions ("cdeStatus");

-- ── 3. TỆP TIN (gốc + IFC song song theo NĐ 175/2024) ───────────────────────
CREATE TABLE IF NOT EXISTS bim_files (
  id              text PRIMARY KEY,
  "versionId"     text NOT NULL REFERENCES bim_model_versions(id) ON DELETE CASCADE,
  kind            text NOT NULL,                   -- GOC | IFC | PHU_TRO
  "tenFile"       text NOT NULL,
  "dinhDang"      text NOT NULL,                   -- ifc | rvt | dgn | pln | bcf | pdf...
  "schemaVersion" text,                            -- IFC4 | IFC4X3 | IFC2X3 (cảnh báo)
  "dungLuongByte" bigint NOT NULL,
  sha256          text NOT NULL,                   -- toàn vẹn pháp lý
  "storagePath"   text NOT NULL,                   -- đường dẫn private, stream qua API có kiểm quyền
  "uploadedById"  text,
  metadata        jsonb,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"     timestamp(3)
);
CREATE INDEX IF NOT EXISTS "bim_files_versionId_idx" ON bim_files ("versionId");

-- ── 4. KIỂM TRA HỢP LỆ TỰ ĐỘNG (NĐ 175/2024) ────────────────────────────────
CREATE TABLE IF NOT EXISTS bim_validation_checks (
  id            text PRIMARY KEY,
  "fileId"      text NOT NULL REFERENCES bim_files(id) ON DELETE CASCADE,
  "checkCode"   text NOT NULL,
    -- FILE_SIZE_500MB | IFC_SCHEMA_VALID | HAS_GEOLOCATION | HAS_GEOMETRY_3D
    -- | HAS_MAIN_DIMENSIONS | HAS_PROJECT_INFO
  "ketQua"      text NOT NULL,                     -- PASS | FAIL | WARNING
  "chiTiet"     jsonb,
  "checkedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "bim_validation_checks_fileId_idx" ON bim_validation_checks ("fileId");

-- ── 5. ĐÁNH GIÁ TÍNH NHẤT QUÁN (bắt buộc cấp I/đặc biệt — NĐ 175/2024) ──────
CREATE TABLE IF NOT EXISTS bim_consistency_reviews (
  id              text PRIMARY KEY,
  "versionId"     text NOT NULL REFERENCES bim_model_versions(id) ON DELETE CASCADE,
  "nguoiDanhGiaId" text NOT NULL,
  "noiDung"       text NOT NULL,
  "ketLuan"       text NOT NULL,                   -- NHAT_QUAN | KHONG_NHAT_QUAN | NHAT_QUAN_CO_DIEU_KIEN
  "yeuCauBoSung"  text,
  "vanBanSo"      text,
  metadata        jsonb,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "bim_consistency_reviews_versionId_idx" ON bim_consistency_reviews ("versionId");

-- ── 6. PHÂN QUYỀN XEM MÔ HÌNH (tận dụng RBAC + to_chuc hiện có) ─────────────
CREATE TABLE IF NOT EXISTS bim_view_permissions (
  id            text PRIMARY KEY,
  "modelId"     text NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
  "roleId"      text,
  "toChucId"    text,
  "userId"      text,
  quyen         text NOT NULL DEFAULT 'VIEW',      -- VIEW | DOWNLOAD | MANAGE
  "grantedById" text,
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bim_view_permissions_target_check
    CHECK ("roleId" IS NOT NULL OR "toChucId" IS NOT NULL OR "userId" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "bim_view_permissions_modelId_idx" ON bim_view_permissions ("modelId");
