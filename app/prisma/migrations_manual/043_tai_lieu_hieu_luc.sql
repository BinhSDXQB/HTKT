-- ============================================================================
-- Migration 043 — LIÊN THÔNG TÌNH TRẠNG HIỆU LỰC vào kho tài liệu RAG
--
-- Vấn đề phát hiện 19/8/2026 khi kiểm thử chatbot:
--   Hỏi "thời hạn cấp phép xây dựng" → chatbot trích Điều 50 NĐ 175/2024/NĐ-CP
--   như quy định HIỆN HÀNH, trong khi NĐ 175/2024 đã bị NĐ 217/2026 thay thế từ
--   01/7/2026. Nguyên nhân: kho tài liệu (tai_lieu) KHÔNG lưu tình trạng hiệu
--   lực; bảng đăng ký prisma/hieu-luc-vbpl.json chỉ dùng để IN BÁO CÁO, không
--   nối vào dữ liệu nên RAG không biết văn bản nào đã hết hiệu lực.
--
-- Sau migration này:
--   - tai_lieu lưu tình trạng hiệu lực + văn bản thay thế
--   - lib/rag/search.ts trả kèm 2 trường này
--   - tool tra_cuu_tai_lieu gắn cảnh báo "VĂN BẢN HẾT HIỆU LỰC" vào đoạn trích
--     → model không được viện dẫn làm căn cứ hiện hành
--
-- Nạp dữ liệu: node scripts/sync-hieu-luc-tai-lieu.mjs
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/043_tai_lieu_hieu_luc.sql
-- ============================================================================

ALTER TABLE public.tai_lieu
  ADD COLUMN IF NOT EXISTS "tinhTrangHieuLuc" TEXT NOT NULL DEFAULT 'can_kiem_chung',
  ADD COLUMN IF NOT EXISTS "thayTheBoi"       TEXT,
  ADD COLUMN IF NOT EXISTS "ghiChuHieuLuc"    TEXT;

-- Chỉ nhận 4 giá trị của bảng đăng ký hieu-luc-vbpl.json
ALTER TABLE public.tai_lieu DROP CONSTRAINT IF EXISTS tai_lieu_hieuluc_check;
ALTER TABLE public.tai_lieu ADD CONSTRAINT tai_lieu_hieuluc_check
  CHECK ("tinhTrangHieuLuc" IN ('con_hieu_luc', 'het_hieu_luc', 'du_thao', 'can_kiem_chung'));

CREATE INDEX IF NOT EXISTS "tai_lieu_tinhTrangHieuLuc_idx"
  ON public.tai_lieu ("tinhTrangHieuLuc");

COMMENT ON COLUMN public.tai_lieu."tinhTrangHieuLuc" IS
  'con_hieu_luc | het_hieu_luc | du_thao | can_kiem_chung — đồng bộ từ prisma/hieu-luc-vbpl.json';
COMMENT ON COLUMN public.tai_lieu."thayTheBoi" IS
  'Số hiệu văn bản thay thế (khi tinhTrangHieuLuc = het_hieu_luc)';

-- Kiểm tra
SELECT "tinhTrangHieuLuc", count(*)
FROM public.tai_lieu WHERE "deletedAt" IS NULL
GROUP BY 1 ORDER BY 2 DESC;
