-- Seed Commit 1: quyền Văn phòng Sở (office:*) + gán department_code cho user theo to_chuc
-- An toàn: chỉ INSERT/UPDATE, không xóa. Chạy: psql -f (client_encoding UTF8)

BEGIN;

-- 1) Tạo các permission office:* (idempotent)
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid()::text, 'office', 'menu_access',               'Truy cập menu Văn phòng Sở'),
  (gen_random_uuid()::text, 'office', 'dashboard_view',            'Xem bàn làm việc Văn phòng Sở'),
  (gen_random_uuid()::text, 'office', 'personnel_view',            'Xem hồ sơ cán bộ'),
  (gen_random_uuid()::text, 'office', 'personnel_create',          'Thêm hồ sơ cán bộ'),
  (gen_random_uuid()::text, 'office', 'personnel_edit',            'Sửa hồ sơ cán bộ'),
  (gen_random_uuid()::text, 'office', 'personnel_sensitive_view',  'Xem dữ liệu cá nhân nhạy cảm (CCCD)'),
  (gen_random_uuid()::text, 'office', 'salary_view',               'Xem dữ liệu lương'),
  (gen_random_uuid()::text, 'office', 'salary_manage',             'Quản lý lương'),
  (gen_random_uuid()::text, 'office', 'salary_review',             'Rà soát nâng lương'),
  (gen_random_uuid()::text, 'office', 'salary_approve_department', 'Duyệt nâng lương cấp phòng'),
  (gen_random_uuid()::text, 'office', 'reward_view',               'Xem thi đua khen thưởng'),
  (gen_random_uuid()::text, 'office', 'reward_manage',             'Quản lý thi đua khen thưởng'),
  (gen_random_uuid()::text, 'office', 'reward_review',             'Rà soát thi đua khen thưởng'),
  (gen_random_uuid()::text, 'office', 'annual_evaluation_manage',  'Quản lý đánh giá xếp loại năm'),
  (gen_random_uuid()::text, 'office', 'discipline_manage',         'Quản lý kỷ luật'),
  (gen_random_uuid()::text, 'office', 'legal_manage',              'Quản lý căn cứ pháp lý'),
  (gen_random_uuid()::text, 'office', 'template_manage',           'Quản lý biểu mẫu'),
  (gen_random_uuid()::text, 'office', 'generate_document',         'Sinh văn bản'),
  (gen_random_uuid()::text, 'office', 'report_view',               'Xem báo cáo thống kê Văn phòng'),
  (gen_random_uuid()::text, 'office', 'admin',                     'Quản trị module Văn phòng Sở')
ON CONFLICT (module, action) DO NOTHING;

-- 2) Cấp toàn bộ quyền office:* cho role admin (idempotent)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.module = 'office'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 3) Gán department_code + toChucId cho user thuộc Văn phòng Sở (qua can_bo.toChucId)
UPDATE users u
SET "departmentCode" = 'VPS',
    "toChucId"       = tc.id
FROM can_bo cb
JOIN to_chuc tc ON tc.id = cb."toChucId"
WHERE cb."userId" = u.id AND tc.ma = 'VAN_PHONG_SO';

-- 4) Gán department_code + toChucId cho user thuộc Phòng Hạ tầng kỹ thuật (nền cho giai đoạn sau)
UPDATE users u
SET "departmentCode" = 'HTKT',
    "toChucId"       = tc.id
FROM can_bo cb
JOIN to_chuc tc ON tc.id = cb."toChucId"
WHERE cb."userId" = u.id AND tc.ma = 'PHONG_HTKT';

-- 5) Đánh dấu lãnh đạo Văn phòng Sở (Chánh/Phó Chánh Văn phòng) → được xem dữ liệu nhạy cảm
--    Khớp theo CCCD của cán bộ giữ chức danh lãnh đạo VP.
UPDATE users u
SET "isDepartmentLeader" = true
FROM can_bo cb
WHERE cb."userId" = u.id
  AND u."departmentCode" = 'VPS'
  AND cb.cccd IN (
    '044175011484', -- Trần Thị Thu Liễu — Chánh Văn phòng
    '044183001228'  -- Lê Thị Xuân Quý — Phó Chánh Văn phòng
    -- 045083001400 (Trương Văn Hoài) đã chuyển công tác — xóa khỏi dữ liệu 2026-06-09
  );

COMMIT;
