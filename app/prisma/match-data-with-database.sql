-- ============================================================================
-- SCRIPT MATCH DỮ LIỆU EXCEL VỚI DATABASE
-- ============================================================================
-- Mục đích: Tìm người từ Excel khớp với bảng can_bo
-- Cảnh báo: Nếu có người không khớp, KHÔNG TỰ ĐẶT GIÁ TRỊ - HỎI NGƯỜI DÙNG
--
-- Bước 1: Tạo bảng tạm thời
DROP TABLE IF EXISTS temp_ngay_vao CASCADE;
CREATE TEMP TABLE temp_ngay_vao (
  stt INT,
  "hoTen" TEXT,
  "ngayVao" TEXT
);

-- Bước 2: INSERT dữ liệu từ Excel (dữ liệu sạch, 109 người)
INSERT INTO temp_ngay_vao VALUES
  (1, 'Trương Chí Trung', '08/1995'),
  (2, 'Phạm Quốc Anh', '08/1992'),
  (3, 'Hoàng Đăng Cương', '11/1998'),
  (4, 'Vũ Anh Minh', '07/1994'),
  (5, 'Nguyễn Xuân Hoàng', '04/2003'),
  (6, 'Nguyễn Đức Cường', '10/2000'),
  (7, 'Văn Đức Lợi', '03/1999'),
  (8, 'Nguyễn Thanh Hải', '01/2000'),
  (9, 'Phan Văn Thắng', '08/1998'),
  (10, 'Trần Ngọc Sơn', '07/2008'),
  (11, 'Võ Văn Tuần', '09/2002'),
  (12, 'Nguyễn Như Quỳnh', '07/2002'),
  (13, 'Trần Hữu Sửu', '07/1997'),
  (14, 'Nguyễn Anh Tuấn', '9/1999'),
  (15, 'Bùi Đức Thành', '08/2000'),
  (16, 'Nguyễn T. Thuỳ Linh (NO)', '08/2001'),
  (17, 'Nguyễn Mạnh Hùng', '1999'),
  (18, 'Trần Thị Thu Liễu', '2005'),
  (19, 'Nguyễn Thanh Hải (QH)', '02/2008'),
  (20, 'Hoàng Ngọc Dũng', '09/2000'),
  (21, 'Nguyễn Sỹ Đông', '11/1999'),
  (22, 'Lê Văn Thủy', '09/1999'),
  (23, 'Hoàng Việt', '11/1999'),
  (24, 'Võ Việt Dũng', '10/2003'),
  (25, 'Lê Thị Xuân Quý', '11/2006'),
  (26, 'Nguyễn Thành Lai', '02/2008'),
  (27, 'Tạ Công Danh', '08/2002'),
  (28, 'Lê Minh Châu', '07/2001'),
  (29, 'Phạm Xuân Bằng', '04/1994'),
  (30, 'Phạm Hữu Chung', '07/1997'),
  (31, 'Trần Văn Bình', '03/1990'),
  (32, 'Lê Anh Tuấn (A)', '06/1998'),
  (33, 'Phạm Minh Thành', '11/1999'),
  (34, 'Dương Bá Thịnh', '01/2005'),
  (35, 'Hoàng Quang Minh', '10/2003'),
  (36, 'Ngô Thị Ái Linh', '01/2008'),
  (37, 'Hoàng Thanh Hải', '01/2002'),
  (38, 'Nguyễn Tấn Phương', '03/1997'),
  (39, 'Nguyễn Thị Thuận', '03/2003'),
  (40, 'Hoàng Mai Nam', '07/2002'),
  (41, 'Nguyễn Quang Hợp', '01/2004'),
  (42, 'Hoàng Minh Phú', '06/2003'),
  (43, 'Trương Văn Hưng', '07/1999'),
  (44, 'Trần Trung Thông', '03/2007'),
  (45, 'Đặng Hoài Dương', '10/2004'),
  (46, 'Trần Nguyên Liêm', '07/2002'),
  (47, 'Phạm Duy Hùng', '01/2005'),
  (48, 'Lê Quang Phi', '08/2015'),
  (49, 'Trần Văn Công', '01/2006'),
  (50, 'Nguyễn Tuấn Long', '08/2004'),
  (51, 'Nguyễn Thế Thái Tùng', '01/2014'),
  (52, 'Đặng Văn Xuân', '01/2002'),
  (53, 'Trần Nguyễn', '11/2004'),
  (54, 'Bùi Việt Châu', '12/2013'),
  (55, 'Hoàng Hải Thành', '11/2011'),
  (56, 'Nguyễn Trung Thành', '04/2010'),
  (57, 'Đặng Hoàng Anh', '06/2011'),
  (58, 'Phan Thanh Tâm', '01/2015'),
  (59, 'Nguyễn Văn Hiển', '04/2013'),
  (60, 'Phạm Thị Ngân Hương', '01/2009'),
  (61, 'Trần Ngọc Bình', '01/2013'),
  (62, 'Lê Địch Trung', '2013'),
  (63, 'Trần Việt Hưng', '01/2012'),
  (64, 'Phan Học Phi', '02/2016'),
  (65, 'Hoàng Đức Anh Vũ', '06/2010'),
  (66, 'Trương Văn Hoài', '2006'),
  (67, 'Nguyễn Thành Nhân', '09/2011'),
  (68, 'Nguyễn Sơn Tùng', '12/2011'),
  (69, 'Đinh Quang Phúc', '01/2012'),
  (70, 'Trần Thanh Hiếu', '02/2013'),
  (71, 'Đỗ Trung Đức', '10/2009'),
  (72, 'Đăng Ngọc Chung', '05/2012'),
  (73, 'Nguyễn Mậu Hai', '05/2012'),
  (74, 'Dương Thị Thanh Nga', '04/2013'),
  (75, 'Nguyễn Ngọc Nam', '04/2013'),
  (76, 'Lê Anh Tuấn (B)', '04/2023'),
  (77, 'Lê Thị Hồng Ngọc', '08/2012'),
  (78, 'Lê Minh Tuấn', '01/2015'),
  (79, 'Phạm Châu Tuấn', '01/2013'),
  (80, 'Lê Cẩm Nhung', '08/2013'),
  (81, 'Nguyễn Lê Cương', '08/2015'),
  (82, 'Nguyễn Đức Tuấn', '04/2013'),
  (83, 'Võ Hoàng Hà Nhi', '03/2015'),
  (84, 'Lê Minh Long', '07/2016'),
  (85, 'Nguyễn Thị Mỹ Nhung', '04/2016'),
  (86, 'Phan Thanh Hòa', '11/2023'),
  (87, 'Lê Quang Nhật Minh', '01/2017'),
  (88, 'Trần Thượng Nguyên', '08/2021'),
  (89, 'Trần Nhật Khánh', '01/2023'),
  (90, 'Trương Thị Bảo', '2008'),
  (91, 'Nguyễn Giang Trường', '06/2003'),
  (92, 'Nguyễn Thị Kiều Trang', '01/2014'),
  (93, 'Lê Đức Thọ', '12/1999'),
  (94, 'Phạm Trường An', '12/2015'),
  (95, 'Dương Ngọc Lan Anh', '01/2017'),
  (96, 'Trần Văn Hùng', '01/2003'),
  (97, 'Đặng Thị Phương Thảo', '06/2015'),
  (98, 'Hoàng Ngọc Linh', '02/2022'),
  (99, 'Lê Thị Thúy Hằng', '01/2000'),
  (100, 'Nguyễn Thị Hồng Hạnh', '11/2006'),
  (101, 'Võ Huyền Sâm', '10/2013'),
  (102, 'Nguyễn Ngọc Nhân', '09/2008'),
  (103, 'Nguyễn Thị Thùy Linh', '03/2014'),
  (104, 'Trần Hải Nguyên', '12/2016'),
  (105, 'Đỗ Trung Hiếu', '11/2020'),
  (106, 'Trần Đình Nam', '04/2019'),
  (107, 'Nguyễn Văn Linh', '11/2013'),
  (108, 'Trương Tiến Hùng', '02/2011'),
  (109, 'Lê Quang Đạo', '04/2017');

-- Bước 3: MATCH dữ liệu - Hiển thị người KHỚP
SELECT '=== KHỚP VỚI DATABASE ===' AS "Kết quả";
SELECT
  t.stt,
  t."hoTen" AS "Họ tên (Excel)",
  c."hoTen" AS "Họ tên (DB)",
  c.id AS "ID CanBo",
  t."ngayVao" AS "Ngày vào (Excel)",
  '✓' AS "Status"
FROM temp_ngay_vao t
INNER JOIN "can_bo" c ON TRIM(LOWER(t."hoTen")) = TRIM(LOWER(c."hoTen"))
ORDER BY t.stt;

-- Bước 4: Cảnh báo - Hiển thị người KHÔNG KHỚP
SELECT '=== KHÔNG KHỚP HOẶC THIẾU ===' AS "Kết quả";
SELECT
  t.stt,
  t."hoTen" AS "Họ tên (Excel)",
  COALESCE(c."hoTen", 'N/A') AS "Họ tên (DB)",
  COALESCE(c.id::text, 'KHÔNG TÌM THẤY') AS "ID CanBo",
  t."ngayVao" AS "Ngày vào",
  '✗ KHÔNG KHỚP' AS "Status"
FROM temp_ngay_vao t
LEFT JOIN "can_bo" c ON TRIM(LOWER(t."hoTen")) = TRIM(LOWER(c."hoTen"))
WHERE c.id IS NULL
ORDER BY t.stt;

-- Bước 5: Thống kê
SELECT
  COUNT(*) AS "Tổng số người (Excel)",
  SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END) AS "Số khớp",
  SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END) AS "Số không khớp",
  ROUND(100.0 * SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS "Tỷ lệ khớp (%)"
FROM temp_ngay_vao t
LEFT JOIN "can_bo" c ON TRIM(LOWER(t."hoTen")) = TRIM(LOWER(c."hoTen"));

-- Bước 6: Hiển thị kết quả cuối cùng
SELECT '✓ MATCH HOÀN TẤT' AS "Kết quả";
