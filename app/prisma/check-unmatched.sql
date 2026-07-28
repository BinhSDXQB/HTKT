-- Kiểm tra chi tiết những người không khớp
-- 1. Nguyễn Thanh Hải (QH) - Trưởng phòng Quy hoạch
SELECT '=== TÌM NGUYỄN THANH HẢI ===' AS "Kết quả";
SELECT id, "hoTen", "ngaySinh", "phongBan", "chucVu"
FROM "can_bo"
WHERE LOWER("hoTen") LIKE '%nguyễn thanh hải%'
   OR (LOWER("hoTen") LIKE '%thanh hải%' AND LOWER("phongBan") LIKE '%quy%')
ORDER BY "hoTen";

-- 2. Lê Anh Tuấn sinh 1973
SELECT '=== TÌM LÊ ANH TUẤN (SINH 1973) ===' AS "Kết quả";
SELECT id, "hoTen", "ngaySinh", "phongBan", "chucVu"
FROM "can_bo"
WHERE LOWER("hoTen") LIKE '%lê anh tuấn%'
ORDER BY "ngaySinh";

-- 3. Kiểm tra những người khác
SELECT '=== TÌM NHỮNG NGƯỜI KHÔNG KHỚP KHÁC ===' AS "Kết quả";
SELECT id, "hoTen", "ngaySinh", "phongBan"
FROM "can_bo"
WHERE LOWER("hoTen") LIKE '%trương văn hoài%'
   OR LOWER("hoTen") LIKE '%đăng ngọc chung%'
   OR (LOWER("hoTen") LIKE '%thuỳ linh%' AND LOWER("hoTen") LIKE '%no%')
ORDER BY "hoTen";

-- 4. Tất cả Nguyễn Thanh Hải (để xem số lần xuất hiện)
SELECT '=== TẤT CẢ NGUYỄN THANH HẢI ===' AS "Kết quả";
SELECT id, "hoTen", "phongBan", "chucVu", COUNT(*) OVER (PARTITION BY "hoTen") AS "Số lần"
FROM "can_bo"
WHERE LOWER("hoTen") = 'nguyễn thanh hải'
ORDER BY "phongBan";

-- 5. Tất cả Lê Anh Tuấn
SELECT '=== TẤT CẢ LÊ ANH TUẤN ===' AS "Kết quả";
SELECT id, "hoTen", "ngaySinh", "phongBan", "chucVu"
FROM "can_bo"
WHERE LOWER("hoTen") = 'lê anh tuấn'
ORDER BY "ngaySinh";
