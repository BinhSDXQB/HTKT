-- ROLLBACK Migration 043 — gỡ tình trạng hiệu lực khỏi kho tài liệu.
-- CẢNH BÁO: sau khi gỡ, chatbot sẽ trích dẫn cả văn bản ĐÃ HẾT HIỆU LỰC như quy
-- định hiện hành (phải gỡ đồng thời phần đọc 2 cột này trong lib/rag/search.ts
-- và app/api/chatbot/route.ts, cùng trường trong model TaiLieu).

DROP INDEX CONCURRENTLY IF EXISTS public."tai_lieu_tinhTrangHieuLuc_idx";
ALTER TABLE public.tai_lieu DROP CONSTRAINT IF EXISTS tai_lieu_hieuluc_check;
ALTER TABLE public.tai_lieu
  DROP COLUMN IF EXISTS "tinhTrangHieuLuc",
  DROP COLUMN IF EXISTS "thayTheBoi",
  DROP COLUMN IF EXISTS "ghiChuHieuLuc";
