-- Commit 6: Văn phòng Sở — Lưu vết văn bản đã sinh
-- Áp dụng thủ công (DB drift khỏi prisma migrate). Idempotent, chỉ tạo mới.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoaiVanBanVPS') THEN
    CREATE TYPE "LoaiVanBanVPS" AS ENUM (
      'QD_NANG_LUONG','QD_KHEN_THUONG','QD_KY_LUAT','THONG_BAO','KHAC'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS office_generated_documents (
  id              text PRIMARY KEY,
  "loaiVanBan"    "LoaiVanBanVPS" NOT NULL DEFAULT 'QD_NANG_LUONG',
  "canBoId"       text REFERENCES can_bo(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "reviewCaseId"  text REFERENCES office_salary_review_cases(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "soVanBan"      text,
  "tieuDe"        text NOT NULL,
  "fileName"      text NOT NULL,
  "noiDung"       bytea NOT NULL,
  "createdById"   text REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "office_generated_documents_loaiVanBan_idx" ON office_generated_documents("loaiVanBan");
CREATE INDEX IF NOT EXISTS "office_generated_documents_canBoId_idx"    ON office_generated_documents("canBoId");
CREATE INDEX IF NOT EXISTS "office_generated_documents_createdAt_idx"  ON office_generated_documents("createdAt");
-- Một văn bản ban hành chính thức / 1 hồ sơ rà soát / 1 loại (cho phép upsert, NULL reviewCaseId không bị ràng buộc)
CREATE UNIQUE INDEX IF NOT EXISTS "office_generated_documents_reviewCase_loai_key"
  ON office_generated_documents("reviewCaseId", "loaiVanBan") WHERE "reviewCaseId" IS NOT NULL;

COMMIT;
