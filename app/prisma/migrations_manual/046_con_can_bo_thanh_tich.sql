-- ============================================================================
-- Migration 046 — CON CỦA CÁN BỘ + THÀNH TÍCH HỌC TẬP THEO NĂM HỌC
--
-- Nguồn: "Danh sách các cháu và thành tích năm học 2025 - 2026" (Công đoàn/Văn phòng Sở,
-- tệp Danh sách các cháu 01_6.xlsx) — 94 phụ huynh, 163 cháu.
--
-- Yêu cầu nghiệp vụ (người dùng 25/9/2026):
--   1. Nhập MỘT lần; các năm sau KHÔNG rà soát lại danh sách — tuổi/lớp tự tăng theo năm học,
--      chỉ cập nhật THÀNH TÍCH (giấy khen, thi đạt giải cấp gì, môn gì) cho năm học mới.
--   2. Con là NGƯỜI PHỤ THUỘC để tính giảm trừ gia cảnh thuế TNCN (6,2 triệu/người/tháng —
--      NQ 110/2025/UBTVQH15, Luật Thuế TNCN 109/2025/QH15, kỳ tính thuế 2026).
--
-- Thiết kế:
--   - con_can_bo lưu NĂM SINH (danh sách gốc chỉ ghi tuổi → năm sinh ước tính = 2026 − tuổi,
--     đánh dấu namSinhUocTinh) + LỚP TẠI NĂM HỌC GỐC. Lớp hiện tại = lopGoc + (năm học hiện tại −
--     namHocGoc) — tính động, không lưu cờ tay (nguyên tắc trạng thái động).
--   - Giảm trừ chỉ tính khi dangKyNPT = true VÀ phuHuynhDaXacNhan = true (ghép tên phụ huynh
--     trùng tên chưa chắc chắn → chờ xác nhận, không tính thuế sai người).
--   - thanh_tich_con: mỗi năm học thêm dòng mới, không sửa dòng năm cũ.
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/046_con_can_bo_thanh_tich.sql
-- Hoàn nguyên: 046_con_can_bo_thanh_tich_rollback.sql
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS con_can_bo (
  "id"                  TEXT PRIMARY KEY,
  "canBoId"             TEXT NOT NULL REFERENCES can_bo("id") ON DELETE CASCADE,
  "hoTen"               TEXT NOT NULL,
  "gioiTinh"            TEXT,                               -- NAM | NU | null (danh sách gốc không ghi)
  "ngaySinh"            DATE,                               -- điền khi có giấy khai sinh
  "namSinh"             INTEGER NOT NULL,
  "namSinhUocTinh"      BOOLEAN NOT NULL DEFAULT TRUE,      -- true: suy từ tuổi trong danh sách
  "lopGoc"              INTEGER,                            -- lớp tại năm học gốc (1..12); null = chưa đi học/mầm non
  "mamNonGoc"           BOOLEAN NOT NULL DEFAULT FALSE,     -- năm học gốc đang học mầm non
  "namHocGoc"           INTEGER NOT NULL DEFAULT 2025,      -- 2025 = năm học 2025-2026
  "dangKyNPT"           BOOLEAN NOT NULL DEFAULT TRUE,      -- đăng ký người phụ thuộc (giảm trừ gia cảnh) cho cán bộ này
  "phuHuynhDaXacNhan"   BOOLEAN NOT NULL DEFAULT TRUE,      -- false: ghép phụ huynh trùng tên chưa chắc → chưa tính giảm trừ
  "ghiChu"              TEXT,
  "nguon"               TEXT,
  "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT con_can_bo_nam_sinh_chk CHECK ("namSinh" BETWEEN 1950 AND 2100),
  CONSTRAINT con_can_bo_lop_chk CHECK ("lopGoc" IS NULL OR "lopGoc" BETWEEN 1 AND 12),
  CONSTRAINT con_can_bo_gioi_tinh_chk CHECK ("gioiTinh" IS NULL OR "gioiTinh" IN ('NAM','NU'))
);
CREATE INDEX IF NOT EXISTS con_can_bo_can_bo_idx ON con_can_bo("canBoId");

CREATE TABLE IF NOT EXISTS thanh_tich_con (
  "id"          TEXT PRIMARY KEY,
  "conId"       TEXT NOT NULL REFERENCES con_can_bo("id") ON DELETE CASCADE,
  "namHoc"      INTEGER NOT NULL,                 -- 2025 = năm học 2025-2026
  "loai"        TEXT NOT NULL,                    -- DANH_HIEU (HS giỏi/xuất sắc…) | GIAI (thi đạt giải) | KHAC
  "capDo"       TEXT,                             -- TRUONG | XA | TINH | KHU_VUC | QUOC_GIA | QUOC_TE
  "mon"         TEXT,                             -- môn/lĩnh vực: Toán, Tiếng Anh (IOE)…
  "xepGiai"     TEXT,                             -- Nhất/Nhì/Ba/KK/HC Vàng…; danh hiệu ghi ở noiDung
  "noiDung"     TEXT NOT NULL,                    -- nguyên văn như trong danh sách/giấy khen
  "coGiayKhen"  BOOLEAN,
  "createdById" TEXT REFERENCES users("id") ON DELETE SET NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT thanh_tich_con_loai_chk CHECK ("loai" IN ('DANH_HIEU','GIAI','KHAC')),
  CONSTRAINT thanh_tich_con_cap_chk CHECK ("capDo" IS NULL OR "capDo" IN ('TRUONG','XA','TINH','KHU_VUC','QUOC_GIA','QUOC_TE'))
);
CREATE INDEX IF NOT EXISTS thanh_tich_con_con_idx ON thanh_tich_con("conId", "namHoc");

COMMIT;
