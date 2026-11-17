-- Hoàn nguyên migration 050 (module Nội dung AI). Chỉ chạy khi chắc chắn:
-- XOÁ toàn bộ dữ liệu của module (bài, phiên bản, phê duyệt, lịch, nhật ký ai_audit_events).
-- KHÔNG đụng bảng nào ngoài tiền tố ai_ (users, tai_lieu giữ nguyên).
-- Nên sao lưu trước: pg_dump -t 'ai_*' <csdl> > ai_content_truoc_rollback.sql
BEGIN;
DROP TABLE IF EXISTS ai_audit_events;
DROP TABLE IF EXISTS ai_publication_schedules;
DROP TABLE IF EXISTS ai_approvals;
DROP TABLE IF EXISTS ai_channel_variants;
DROP TABLE IF EXISTS ai_content_sources;
ALTER TABLE IF EXISTS ai_content_items DROP CONSTRAINT IF EXISTS fk_ai_content_items_current_version;
DROP TABLE IF EXISTS ai_content_versions;
DROP TABLE IF EXISTS ai_content_items;
DROP FUNCTION IF EXISTS ai_chan_sua_xoa();
COMMIT;
