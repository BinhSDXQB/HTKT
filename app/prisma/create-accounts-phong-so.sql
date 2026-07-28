-- Tạo tài khoản cho cán bộ phòng/VP Sở chưa có tài khoản (đăng nhập = CCCD).
-- Loại trừ CCCD tạm (TAM-). Vai trò: staff. MK mặc định + bắt buộc đổi.
-- Truyền hash qua -v PWHASH. Idempotent: chỉ tạo cho can_bo chưa có userId.
BEGIN;

INSERT INTO users (id, email, name, password, "roleId", "isActive", "mustChangePassword",
                   "departmentCode", "toChucId", "failedLoginCount", "createdAt", "updatedAt")
SELECT 'u_' || cb.id,
       cb.cccd,
       cb."hoTen",
       :'PWHASH',
       (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
       true,
       true,
       CASE WHEN t.ma = 'VAN_PHONG_SO' THEN 'VPS'
            WHEN t.ma = 'PHONG_HTKT'  THEN 'HTKT'
            ELSE t.ma END,
       cb."toChucId",
       0, now(), now()
FROM can_bo cb
JOIN to_chuc t ON t.id = cb."toChucId"
WHERE cb."userId" IS NULL
  AND t.loai IN ('PHONG', 'VAN_PHONG')
  AND cb.cccd NOT LIKE 'TAM-%';

-- Liên kết hồ sơ cán bộ ↔ tài khoản vừa tạo
UPDATE can_bo cb
SET "userId" = 'u_' || cb.id
WHERE cb."userId" IS NULL
  AND cb.cccd NOT LIKE 'TAM-%'
  AND EXISTS (SELECT 1 FROM to_chuc t WHERE t.id = cb."toChucId" AND t.loai IN ('PHONG', 'VAN_PHONG'));

COMMIT;
