-- Script import dữ liệu "Ngày vào công chức, cơ quan NN" từ Excel
-- File: SXD_BANG TONG HOP NGHI PHEP NAM 2026.xlsx
-- Cột B: Họ tên (B9:B119)
-- Cột C: Ngày vào công chức, cơ quan NN (C9:C119)
--
-- Hướng dẫn:
-- 1. Chuẩn bị file Excel với họ tên và ngày vào công chức
-- 2. Import dữ liệu vào bảng tạm thời
-- 3. Match với bảng can_bo theo họ tên
-- 4. Update cột ngayVaoCongChucCoQuanNN
--
-- LƯU Ý: KHÔNG TỰ ĐẶT GIÁ TRỊ - HỎI NGƯỜI DÙNG NẾU CÓ KHÔNG KHỚP

-- Bước 1: Tạo bảng tạm thời để import dữ liệu Excel
DROP TABLE IF EXISTS temp_ngay_vao_cong_chuc CASCADE;
CREATE TEMP TABLE temp_ngay_vao_cong_chuc (
  stt INT,
  hoTen TEXT,
  ngayVao TEXT  -- Text trước, sẽ chuyển đổi thành DATE
);

-- Bước 2: Insert dữ liệu (chuẩn bị danh sách từ Excel)
-- Dữ liệu sẽ được thêm vào đây sau khi kiểm tra từ người dùng
-- Ví dụ:
-- INSERT INTO temp_ngay_vao_cong_chuc VALUES
-- (1, 'Trương Chí Trung', '08/1995'),
-- (2, 'Phạm Quốc Anh', '08/1992'),
-- ... (các dòng tiếp theo)

-- Bước 3: Hiển thị dữ liệu chuẩn bị import
SELECT
  t.stt,
  t.hoTen,
  t.ngayVao,
  c.id,
  c."hoTen" AS "hoTenDB",
  CASE
    WHEN TRIM(LOWER(t.hoTen)) = TRIM(LOWER(c."hoTen")) THEN '✓ Khớp'
    ELSE '✗ KHÔNG KHỚP'
  END AS "KiểmTra"
FROM temp_ngay_vao_cong_chuc t
LEFT JOIN "can_bo" c ON TRIM(LOWER(t.hoTen)) = TRIM(LOWER(c."hoTen"))
ORDER BY t.stt;

-- Bước 4: Cảnh báo - kiểm tra số lượng khớp
SELECT
  COUNT(*) AS "TổngDòng",
  SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END) AS "SốKhớp",
  SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END) AS "SốKhôngKhớp"
FROM temp_ngay_vao_cong_chuc t
LEFT JOIN "can_bo" c ON TRIM(LOWER(t.hoTen)) = TRIM(LOWER(c."hoTen"));

-- Bước 5: Nếu tất cả khớp, thực hiện update
-- UPDATE "can_bo" c
-- SET "ngayVaoCongChucCoQuanNN" = TO_DATE(t.ngayVao, 'MM/YYYY')
-- FROM temp_ngay_vao_cong_chuc t
-- WHERE TRIM(LOWER(c."hoTen")) = TRIM(LOWER(t.hoTen"))
-- AND c."ngayVaoCongChucCoQuanNN" IS NULL;  -- Không update lại dữ liệu cũ
