-- Module Tra cứu tài liệu (RAG) — Đợt R1: Kho tài liệu + tìm kiếm ngữ nghĩa.
-- Mục tiêu: nạp tài liệu (PDF/Word/dán text) → cắt đoạn → nhúng vector (OpenAI
-- text-embedding-3-small, 1536 chiều) → chatbot tra cứu có TRÍCH DẪN nguồn,
-- dữ liệu nằm hoàn toàn trên máy chủ Sở (không gửi ra NotebookLM/đám mây ngoài).
-- Phụ thuộc: extension pgvector 0.8.0 (đã build bằng MSVC cho PostgreSQL 16).
-- Additive migration — idempotent, không đụng bảng cũ.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. TÀI LIỆU (1 file/nguồn = 1 bản ghi) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS tai_lieu (
  id            text PRIMARY KEY,
  "tieuDe"      text NOT NULL,
  loai          text NOT NULL DEFAULT 'KHAC',
    -- VB_PHAP_LUAT | QUY_TRINH | HUONG_DAN | BAO_CAO | BIEU_MAU | KHAC
  nguon         text,                              -- tên file gốc hoặc URL
  "moTa"        text,
  "phamVi"      text NOT NULL DEFAULT 'NOI_BO_SO', -- CONG_KHAI | NOI_BO_SO
    -- CONG_KHAI: mọi tài khoản (kể cả phường/xã) tra được
    -- NOI_BO_SO: chỉ tài khoản thuộc Sở
  "soChunk"     integer NOT NULL DEFAULT 0,        -- số đoạn đã nhúng
  "soKyTu"      integer NOT NULL DEFAULT 0,        -- tổng ký tự văn bản đã trích
  "trangThai"   text NOT NULL DEFAULT 'dang_xu_ly',-- dang_xu_ly | san_sang | loi
  "ghiChuLoi"   text,                              -- thông báo lỗi khi nạp thất bại
  metadata      jsonb,
  "createdById" text,                              -- FK mềm → users.id
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   timestamp(3)
);
CREATE INDEX IF NOT EXISTS "tai_lieu_phamVi_idx" ON tai_lieu ("phamVi");
CREATE INDEX IF NOT EXISTS "tai_lieu_loai_idx" ON tai_lieu (loai);

-- ── 2. ĐOẠN TÀI LIỆU + VECTOR NHÚNG ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tai_lieu_chunk (
  id           text PRIMARY KEY,
  "taiLieuId"  text NOT NULL REFERENCES tai_lieu(id) ON DELETE CASCADE,
  "chunkIndex" integer NOT NULL,                   -- thứ tự đoạn trong tài liệu
  "noiDung"    text NOT NULL,                      -- văn bản đoạn (dùng để ghép prompt)
  embedding    vector(1536),                       -- nhúng OpenAI text-embedding-3-small
  "soToken"    integer,                            -- ước lượng token của đoạn
  "viTri"      text,                               -- gợi ý vị trí: "Trang 3" / tiêu đề mục
  "createdAt"  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "tai_lieu_chunk_taiLieuId_idx" ON tai_lieu_chunk ("taiLieuId");

-- Chỉ mục HNSW theo khoảng cách cosine — tìm top-K nhanh khi corpus lớn dần.
-- HNSW không cần "train" như ivfflat, hợp với dữ liệu nạp tăng dần.
CREATE INDEX IF NOT EXISTS "tai_lieu_chunk_embedding_hnsw"
  ON tai_lieu_chunk USING hnsw (embedding vector_cosine_ops);
