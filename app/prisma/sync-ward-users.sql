-- =============================================================================
-- ĐỒNG BỘ TÀI KHOẢN PHƯỜNG/XÃ THEO administrative_units (QĐ 19/2025/QĐ-TTg)
-- -----------------------------------------------------------------------------
-- Nguồn chuẩn DUY NHẤT: bảng administrative_units (code, name).
-- Không phụ thuộc file tĩnh "Ma DVHC.txt".
-- Quy ước: tài khoản đăng nhập phường/xã có  email = code  và  wardId = unit.id.
--
-- Script idempotent — chạy lại bao nhiêu lần cũng an toàn. Chạy sau MỖI lần
-- nhập/đổi tên xã, phường để ô đăng nhập và chatbot luôn trùng khớp.
--
-- Cách chạy:
--   psql -h localhost -U postgres -d ql_htkt -f prisma/sync-ward-users.sql
-- =============================================================================

BEGIN;

-- 1) ĐỒNG BỘ tên + liên kết ward cho các tài khoản đã tồn tại -----------------
--    Sửa users.name (và wardId nếu lệch) về đúng tên đơn vị hiện hành.
UPDATE users u
SET    name        = a.name,
       "wardId"    = a.id,
       "updatedAt" = now()
FROM   administrative_units a
WHERE  u.email = a.code
  AND  a.type  = 'PHUONG_XA'
  AND  (u.name <> a.name OR u."wardId" IS DISTINCT FROM a.id);

-- 2) TẠO tài khoản cho phường/xã MỚI chưa có tài khoản ------------------------
--    Mật khẩu (hash bcrypt) và role lấy động từ một tài khoản phường/xã có sẵn,
--    nên mật khẩu mặc định giống các tài khoản phường/xã hiện tại (Abc@12345).
INSERT INTO users (id, email, name, password, "roleId", "wardId",
                   "isActive", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       a.code,
       a.name,
       seed.password,
       seed."roleId",
       a.id,
       true,
       true,                       -- buộc đổi mật khẩu lần đăng nhập đầu
       now(),
       now()
FROM   administrative_units a
CROSS  JOIN LATERAL (
         SELECT u.password, u."roleId"
         FROM   users u
         JOIN   administrative_units x ON u.email = x.code
         WHERE  x.type = 'PHUONG_XA'
         ORDER  BY u."createdAt"
         LIMIT  1
       ) seed
WHERE  a.type = 'PHUONG_XA'
  AND  a."isActive" = true
  AND  NOT EXISTS (SELECT 1 FROM users u WHERE u.email = a.code);

-- 3) BÁO CÁO kết quả ---------------------------------------------------------
--    (sau khi đồng bộ, các con số lệch phải bằng 0)
SELECT 'Tổng tài khoản phường/xã' AS chi_tieu,
       count(*)::text AS gia_tri
FROM   users u JOIN administrative_units a ON u.email = a.code
WHERE  a.type = 'PHUONG_XA'
UNION ALL
SELECT 'Còn lệch tên (phải = 0)',
       count(*)::text
FROM   users u JOIN administrative_units a ON u.email = a.code
WHERE  a.type = 'PHUONG_XA' AND u.name <> a.name
UNION ALL
SELECT 'Phường/xã thiếu tài khoản (phải = 0)',
       count(*)::text
FROM   administrative_units a
WHERE  a.type = 'PHUONG_XA' AND a."isActive" = true
  AND  NOT EXISTS (SELECT 1 FROM users u WHERE u.email = a.code);

COMMIT;
