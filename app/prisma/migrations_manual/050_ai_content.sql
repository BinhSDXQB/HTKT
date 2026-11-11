-- ============================================================================
-- Migration 050 — MODULE NỘI DUNG AI (AI Content) — mốc M1 "Soạn – duyệt – đặt lịch"
--
-- CHỈ THÊM bảng mới tiền tố ai_ ; KHÔNG sửa, không xoá bảng/cột nào đang có.
-- Tham chiếu ra ngoài module: users(id), tai_lieu(id) — chỉ đọc.
-- Thiết kế: docs/architecture/UPGRADE_V4_PROPOSAL.md ; kế hoạch: docs/implementation/CHANGE_IMPACT.md
--
-- Ràng buộc an toàn đặt ngay ở CSDL (không chỉ ở mã):
--   * ai_approvals là sổ CHỈ GHI THÊM (trigger chặn UPDATE/DELETE) — quyết định duyệt không sửa được.
--   * ai_content_versions không sửa được nội dung/băm sau khi tạo (trigger).
--   * idempotency_key UNIQUE — chạy lại không sinh lịch/bài trùng.
--   * Lịch PUBLISHED bắt buộc có published_at; mỗi (phiên bản, kênh) chỉ một biến thể.
--
-- Chạy:        psql -U postgres -d <csdl> -v ON_ERROR_STOP=1 -f prisma/migrations_manual/050_ai_content.sql
-- Hoàn nguyên: 050_ai_content_rollback.sql (xoá toàn bộ bảng ai_* của module — mất dữ liệu module, không đụng bảng khác)
-- ============================================================================

BEGIN;

-- Không treo nghiệp vụ đang chạy: khoá bảng users (do FK) chờ tối đa 5 giây rồi bỏ, không xếp hàng vô hạn.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TABLE IF NOT EXISTS ai_content_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','CANCELLED')),
  classification      TEXT NOT NULL DEFAULT 'INTERNAL'
                        CHECK (classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  ai_generated        BOOLEAN NOT NULL DEFAULT FALSE,   -- có dùng AI tạo/chỉnh sửa nội dung
  may_mislead         BOOLEAN NOT NULL DEFAULT FALSE,   -- có thể gây nhầm lẫn về tính xác thực (Luật 134/2025 Đ11 k3)
  current_version_id  UUID,
  -- những người đã đổi phân loại / cờ AI / nguồn kể từ phiên bản hiện hành (tính vào nguyên tắc bốn mắt)
  meta_editors        TEXT[] NOT NULL DEFAULT '{}',
  created_by          TEXT NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_ai_content_items_status ON ai_content_items (status, updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS ai_content_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID NOT NULL REFERENCES ai_content_items(id) ON DELETE CASCADE,
  version_no    INTEGER NOT NULL CHECK (version_no > 0),
  title         TEXT NOT NULL,
  body_md       TEXT NOT NULL,
  content_hash  TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, version_no),
  UNIQUE (id, content_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ai_content_items_current_version') THEN
    ALTER TABLE ai_content_items
      ADD CONSTRAINT fk_ai_content_items_current_version
      FOREIGN KEY (current_version_id) REFERENCES ai_content_versions(id);
  END IF;
END $$;

-- CỐ Ý KHÔNG đặt FK tới tai_lieu: API kho tài liệu hiện hữu xoá cứng (app/api/tai-lieu/[id]) — FK sẽ làm
-- hỏng chức năng đó. Thay vào đó lưu ảnh chụp tiêu đề; tài liệu bị gỡ thì cổng xuất bản CHẶN bài viện dẫn nó.
CREATE TABLE IF NOT EXISTS ai_content_sources (
  content_id   UUID NOT NULL REFERENCES ai_content_items(id) ON DELETE CASCADE,
  tai_lieu_id  TEXT NOT NULL,
  tieu_de_luc_gan TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, tai_lieu_id)
);

CREATE TABLE IF NOT EXISTS ai_channel_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID NOT NULL REFERENCES ai_content_items(id) ON DELETE CASCADE,
  version_id    UUID NOT NULL REFERENCES ai_content_versions(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL CHECK (channel IN ('facebook','linkedin','threads','website')),
  body          TEXT NOT NULL,
  created_by    TEXT NOT NULL REFERENCES users(id),   -- người lưu cuối
  editors       TEXT[] NOT NULL DEFAULT '{}',          -- MỌI người từng sửa biến thể này (bốn mắt)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (version_id, channel),
  UNIQUE (id, version_id)
);

-- Sổ quyết định duyệt — CHỈ GHI THÊM. approved_hash = băm của phiên bản + toàn bộ biến thể kênh lúc duyệt.
CREATE TABLE IF NOT EXISTS ai_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq           BIGSERIAL NOT NULL UNIQUE,        -- thứ tự quyết định xác định (không dựa vào đồng hồ)
  content_id    UUID NOT NULL REFERENCES ai_content_items(id),
  version_id    UUID NOT NULL,
  FOREIGN KEY (version_id, content_id) REFERENCES ai_content_versions(id, content_id),
  UNIQUE (id, version_id),
  decision      TEXT NOT NULL CHECK (decision IN ('APPROVED','REJECTED','REVOKED')),
  approved_hash TEXT NOT NULL CHECK (approved_hash ~ '^[0-9a-f]{64}$'),
  approved_payload JSONB NOT NULL,   -- toàn bộ gói đã duyệt (nội dung từng biến thể, phân loại, nguồn) để phục dựng
  actor_id      TEXT NOT NULL REFERENCES users(id),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ai_approvals_content ON ai_approvals (content_id, seq DESC);

CREATE TABLE IF NOT EXISTS ai_publication_schedules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id        UUID NOT NULL REFERENCES ai_content_items(id),
  version_id        UUID NOT NULL,
  variant_id        UUID NOT NULL,
  -- Khoá ghép: lịch, biến thể và phê duyệt BẮT BUỘC cùng một phiên bản, phiên bản thuộc đúng bài.
  FOREIGN KEY (version_id, content_id) REFERENCES ai_content_versions(id, content_id),
  FOREIGN KEY (variant_id, version_id) REFERENCES ai_channel_variants(id, version_id),
  channel           TEXT NOT NULL CHECK (channel IN ('facebook','linkedin','threads','website')),
  adapter           TEXT NOT NULL DEFAULT 'manual' CHECK (adapter IN ('manual','dry_run')),
  scheduled_at_utc  TIMESTAMPTZ NOT NULL,
  timezone          TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  approval_id       UUID NOT NULL,
  FOREIGN KEY (approval_id, version_id) REFERENCES ai_approvals(id, version_id),
  status            TEXT NOT NULL DEFAULT 'SCHEDULED'
                      CHECK (status IN ('SCHEDULED','PUBLISHING','PUBLISHED','FAILED','RETRY_PENDING','UNKNOWN_OUTCOME','CANCELLED','EXPIRED')),
  retry_count       INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  next_attempt_at   TIMESTAMPTZ,
  external_post_id  TEXT,
  external_url      TEXT,
  error_code        TEXT,
  error_detail      TEXT,
  published_at      TIMESTAMPTZ,
  idempotency_key   TEXT NOT NULL UNIQUE,
  body_snapshot     TEXT NOT NULL,     -- đúng văn bản đã duyệt cho kênh này lúc đặt lịch; không đổi dù biến thể bị sửa sau
  locked_at         TIMESTAMPTZ,
  locked_by         TEXT,
  created_by        TEXT NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_ai_pub_published CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)
);
-- Quét lịch đến hạn: chỉ các trạng thái còn phải làm.
CREATE INDEX IF NOT EXISTS ix_ai_pub_due ON ai_publication_schedules (scheduled_at_utc)
  WHERE status IN ('SCHEDULED','RETRY_PENDING');
CREATE INDEX IF NOT EXISTS ix_ai_pub_content ON ai_publication_schedules (content_id);
-- Mỗi (phiên bản, kênh) chỉ MỘT lịch còn sống — chống đặt trùng/đăng trùng.
-- Chạy thử (dry_run) và đăng thật tính riêng: thử quy trình xong vẫn đặt được lịch đăng thật cho cùng bản.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_pub_song ON ai_publication_schedules (version_id, channel, (adapter = 'dry_run'))
  WHERE status IN ('SCHEDULED','PUBLISHING','RETRY_PENDING','UNKNOWN_OUTCOME','PUBLISHED');

CREATE TABLE IF NOT EXISTS ai_audit_events (
  id              BIGSERIAL PRIMARY KEY,
  correlation_id  UUID NOT NULL,
  actor_id        TEXT,                 -- NULL = hệ thống/worker
  action          TEXT NOT NULL,
  target_type     TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  detail          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ai_audit_target ON ai_audit_events (target_type, target_id, created_at DESC);

-- ── Trigger bất biến ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ai_chan_sua_xoa() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Bảng % là sổ chỉ ghi thêm: không được % ', TG_TABLE_NAME, TG_OP;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_ai_approvals_bat_bien ON ai_approvals;
CREATE TRIGGER tg_ai_approvals_bat_bien BEFORE UPDATE OR DELETE ON ai_approvals
  FOR EACH ROW EXECUTE FUNCTION ai_chan_sua_xoa();

DROP TRIGGER IF EXISTS tg_ai_audit_bat_bien ON ai_audit_events;
CREATE TRIGGER tg_ai_audit_bat_bien BEFORE UPDATE OR DELETE ON ai_audit_events
  FOR EACH ROW EXECUTE FUNCTION ai_chan_sua_xoa();

DROP TRIGGER IF EXISTS tg_ai_versions_bat_bien ON ai_content_versions;
CREATE TRIGGER tg_ai_versions_bat_bien BEFORE UPDATE ON ai_content_versions
  FOR EACH ROW EXECUTE FUNCTION ai_chan_sua_xoa();

COMMIT;
