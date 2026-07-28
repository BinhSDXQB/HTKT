-- Seed: quyền nghỉ phép (office:leave_*) + cấp cho role admin. Idempotent.
BEGIN;

INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid()::text, 'office', 'leave_view',    'Xem đơn nghỉ phép toàn Sở'),
  (gen_random_uuid()::text, 'office', 'leave_manage',  'Tạo / sửa / huỷ đơn nghỉ phép'),
  (gen_random_uuid()::text, 'office', 'leave_approve', 'Văn phòng Sở xem xét / vào sổ đơn nghỉ phép'),
  (gen_random_uuid()::text, 'office', 'leave_sign',    'Lãnh đạo Sở ký duyệt đơn nghỉ phép'),
  (gen_random_uuid()::text, 'office', 'leave_finance', 'Phòng KH-TC cho ứng lương đơn nghỉ phép')
ON CONFLICT (module, action) DO NOTHING;

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.module = 'office'
  AND p.action IN ('leave_view','leave_manage','leave_approve','leave_sign','leave_finance')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;
