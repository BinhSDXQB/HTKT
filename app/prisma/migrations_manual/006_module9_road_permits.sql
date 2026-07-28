-- Commit 9: Module 9 — Cấp phép, chấp thuận kết cấu hạ tầng đường bộ
-- (prompt mục 9: xe quá khổ/quá tải, đấu nối/nút giao/thi công, căn cứ pháp lý)
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.
-- LƯU Ý: phiên Commit 9 đã dùng `prisma db push` để sync DEV (chỉ thêm 9 bảng mới,
-- không reset, không mất data). File này là bản thủ công để deploy PRODUCTION.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicantType') THEN
    CREATE TYPE "ApplicantType" AS ENUM ('TO_CHUC','CA_NHAN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoadPermitStatus') THEN
    CREATE TYPE "RoadPermitStatus" AS ENUM (
      'TAO_MOI','DA_TIEP_NHAN','CHO_BO_SUNG','KIEM_TRA_HO_SO','KIEM_TRA_GIS','DANG_THAM_DINH',
      'DE_NGHI_CAP','DA_CAP_PHEP','TU_CHOI','DANG_THI_CONG','HOAN_THANH','HET_HAN','THU_HOI'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OversizedPermitType') THEN
    CREATE TYPE "OversizedPermitType" AS ENUM ('QUA_KHO','QUA_TAI','BANH_XICH','SIEU_TRUONG','SIEU_TRONG');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConnectionType') THEN
    CREATE TYPE "ConnectionType" AS ENUM ('CHINH_THUC','TAM_THOI');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConnectionStage') THEN
    CREATE TYPE "ConnectionStage" AS ENUM ('CHAP_THUAN_VI_TRI','CHAP_THUAN_THIET_KE','CAP_PHEP_THI_CONG');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoadClass') THEN
    CREATE TYPE "RoadClass" AS ENUM ('QUOC_LO','DUONG_TINH','DUONG_HUYEN','DUONG_DO_THI','DUONG_XA','DUONG_CHUYEN_DUNG');
  END IF;
END $$;

-- 9.1 Phương tiện (đăng ký dùng lại)
CREATE TABLE IF NOT EXISTS permit_vehicles (
  id                  text PRIMARY KEY,
  "plateNumber"       text NOT NULL UNIQUE,
  "ownerName"         text NOT NULL,
  brand               text,
  "vehicleType"       text,
  "axleCount"         integer,
  "designLoadTon"     double precision,
  "registeredLoadTon" double precision,
  "lengthM"           double precision,
  "widthM"            double precision,
  "heightM"           double precision,
  "techSpecs"         text,
  "inspectionDocs"    text[] NOT NULL DEFAULT ARRAY[]::text[],
  images              text[] NOT NULL DEFAULT ARRAY[]::text[],
  note                text,
  "createdById"       text,
  "createdAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "permit_vehicles_ownerName_idx" ON permit_vehicles("ownerName");

-- 9.1 Hồ sơ xe quá khổ / quá tải
CREATE TABLE IF NOT EXISTS oversized_vehicle_permits (
  id                 text PRIMARY KEY,
  "fileCode"         text NOT NULL UNIQUE,
  "permitType"       "OversizedPermitType" NOT NULL DEFAULT 'QUA_TAI',
  status             "RoadPermitStatus" NOT NULL DEFAULT 'TAO_MOI',
  "applicantType"    "ApplicantType" NOT NULL DEFAULT 'TO_CHUC',
  "applicantName"    text NOT NULL,
  "applicantOrgId"   text,
  "applicantPhone"   text,
  "applicantAddress" text,
  "vehicleId"        text REFERENCES permit_vehicles(id) ON DELETE SET NULL,
  "cargoType"        text,
  "totalWeightTon"   double precision,
  "axleLoadTon"      double precision,
  "overallLengthM"   double precision,
  "overallWidthM"    double precision,
  "overallHeightM"   double precision,
  "travelFrom"       text,
  "travelTo"         text,
  "validFrom"        timestamp(3),
  "validTo"          timestamp(3),
  "needEscort"       boolean NOT NULL DEFAULT false,
  "appraisalNote"    text,
  "supplementNote"   text,
  "permitNumber"     text,
  "issuedAt"         timestamp(3),
  "permitValidTo"    timestamp(3),
  conditions         text,
  "pdfPath"          text,
  "qrData"           text,
  attachments        text[] NOT NULL DEFAULT ARRAY[]::text[],
  "wardId"           text,
  "createdById"      text,
  "appraisedById"    text,
  "createdAt"        timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "oversized_vehicle_permits_status_idx"     ON oversized_vehicle_permits(status);
CREATE INDEX IF NOT EXISTS "oversized_vehicle_permits_permitType_idx" ON oversized_vehicle_permits("permitType");
CREATE INDEX IF NOT EXISTS "oversized_vehicle_permits_createdAt_idx"  ON oversized_vehicle_permits("createdAt");

-- 9.1 Đoạn tuyến lưu hành GIS
CREATE TABLE IF NOT EXISTS permit_routes (
  id                 text PRIMARY KEY,
  "permitId"         text NOT NULL REFERENCES oversized_vehicle_permits(id) ON DELETE CASCADE,
  sequence           integer NOT NULL DEFAULT 1,
  "roadName"         text NOT NULL,
  "roadClass"        "RoadClass",
  "fromKm"           double precision,
  "toKm"             double precision,
  geojson            jsonb,
  "bridgeTunnelNote" text,
  "weakSegmentNote"  text,
  "turningRadiusM"   double precision,
  "roadWidthM"       double precision,
  "clearanceHeightM" double precision,
  warning            text,
  "createdAt"        timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "permit_routes_permitId_idx" ON permit_routes("permitId");

-- 9.2 Hồ sơ đấu nối / nút giao / cấp phép thi công
CREATE TABLE IF NOT EXISTS road_connection_applications (
  id                text PRIMARY KEY,
  "fileCode"        text NOT NULL UNIQUE,
  "connectionType"  "ConnectionType" NOT NULL DEFAULT 'CHINH_THUC',
  stage             "ConnectionStage" NOT NULL DEFAULT 'CHAP_THUAN_VI_TRI',
  status            "RoadPermitStatus" NOT NULL DEFAULT 'TAO_MOI',
  "applicantType"   "ApplicantType" NOT NULL DEFAULT 'TO_CHUC',
  "applicantName"   text NOT NULL,
  "applicantOrgId"  text,
  "applicantPhone"  text,
  "projectName"     text,
  "roadName"        text,
  "roadClass"       "RoadClass",
  km                double precision,
  latitude          double precision,
  longitude         double precision,
  "wardId"          text,
  purpose           text,
  "designNote"      text,
  "trafficPlan"     text,
  "safetyDocs"      text,
  "restorationNote" text,
  "appraisalNote"   text,
  "supplementNote"  text,
  attachments       text[] NOT NULL DEFAULT ARRAY[]::text[],
  "createdById"     text,
  "appraisedById"   text,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "road_connection_applications_status_idx"         ON road_connection_applications(status);
CREATE INDEX IF NOT EXISTS "road_connection_applications_connectionType_idx" ON road_connection_applications("connectionType");
CREATE INDEX IF NOT EXISTS "road_connection_applications_stage_idx"          ON road_connection_applications(stage);
CREATE INDEX IF NOT EXISTS "road_connection_applications_createdAt_idx"      ON road_connection_applications("createdAt");

-- 9.2 Vị trí GIS đấu nối
CREATE TABLE IF NOT EXISTS road_connection_locations (
  id                text PRIMARY KEY,
  "applicationId"   text NOT NULL REFERENCES road_connection_applications(id) ON DELETE CASCADE,
  label             text,
  km                double precision,
  latitude          double precision,
  longitude         double precision,
  geojson           jsonb,
  "overlapWarnings" text[] NOT NULL DEFAULT ARRAY[]::text[],
  note              text,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "road_connection_locations_applicationId_idx" ON road_connection_locations("applicationId");

-- 9.2 Phiếu thẩm định / kiểm tra hồ sơ đấu nối
CREATE TABLE IF NOT EXISTS road_connection_inspections (
  id                text PRIMARY KEY,
  "applicationId"   text NOT NULL REFERENCES road_connection_applications(id) ON DELETE CASCADE,
  "inspectionType"  text NOT NULL,
  result            text,
  "inspectedById"   text,
  "inspectedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attachments       text[] NOT NULL DEFAULT ARRAY[]::text[]
);
CREATE INDEX IF NOT EXISTS "road_connection_inspections_applicationId_idx" ON road_connection_inspections("applicationId");

-- 9.2 Văn bản chấp thuận / giấy phép thi công
CREATE TABLE IF NOT EXISTS road_connection_permits (
  id              text PRIMARY KEY,
  "applicationId" text NOT NULL REFERENCES road_connection_applications(id) ON DELETE CASCADE,
  stage           "ConnectionStage" NOT NULL DEFAULT 'CHAP_THUAN_VI_TRI',
  "permitNumber"  text,
  "issuedAt"      timestamp(3),
  "validTo"       timestamp(3),
  conditions      text,
  "pdfPath"       text,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "road_connection_permits_applicationId_idx" ON road_connection_permits("applicationId");

-- 9.3 Căn cứ pháp lý
CREATE TABLE IF NOT EXISTS road_legal_references (
  id              text PRIMARY KEY,
  code            text NOT NULL,
  title           text NOT NULL,
  "documentType"  text,
  "issuedDate"    timestamp(3),
  "effectiveDate" timestamp(3),
  "expiryDate"    timestamp(3),
  "isActive"      boolean NOT NULL DEFAULT true,
  scope           text,
  url             text,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "road_legal_references_isActive_idx" ON road_legal_references("isActive");

-- Lưu vết chuyển trạng thái (dùng chung 2 loại hồ sơ)
CREATE TABLE IF NOT EXISTS road_permit_status_logs (
  id                        text PRIMARY KEY,
  "fromStatus"              "RoadPermitStatus",
  "toStatus"                "RoadPermitStatus" NOT NULL,
  note                      text,
  "changedById"             text,
  "changedAt"               timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "oversizedPermitId"       text REFERENCES oversized_vehicle_permits(id) ON DELETE CASCADE,
  "connectionApplicationId" text REFERENCES road_connection_applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "road_permit_status_logs_oversizedPermitId_idx"       ON road_permit_status_logs("oversizedPermitId");
CREATE INDEX IF NOT EXISTS "road_permit_status_logs_connectionApplicationId_idx" ON road_permit_status_logs("connectionApplicationId");

COMMIT;
