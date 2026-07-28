-- Phần 2: thêm chức danh & xếp 49 cán bộ (chạy SAU khi enum LANH_DAO_DVSN đã có)
BEGIN;

-- 1) Danh mục chức danh mới (idempotent theo ma)
INSERT INTO chuc_danh (id, ma, ten, loai, "capQuanLy", "isLanhDao", "createdAt") VALUES
  ('cd_dvsn_gd',     'GIAM_DOC_DVSN',     'Giám đốc (đơn vị sự nghiệp)',     'LANH_DAO_DVSN', 3, true,  now()),
  ('cd_dvsn_pgd',    'PHO_GIAM_DOC_DVSN', 'Phó Giám đốc (đơn vị sự nghiệp)', 'LANH_DAO_DVSN', 4, true,  now()),
  ('cd_vientruong',  'VIEN_TRUONG',       'Viện trưởng',                     'LANH_DAO_DVSN', 3, true,  now()),
  ('cd_pvientruong', 'PHO_VIEN_TRUONG',   'Phó Viện trưởng',                 'LANH_DAO_DVSN', 4, true,  now()),
  ('cd_hieutruong',  'HIEU_TRUONG',       'Hiệu trưởng',                     'LANH_DAO_DVSN', 3, true,  now()),
  ('cd_phieutruong', 'PHO_HIEU_TRUONG',   'Phó Hiệu trưởng',                 'LANH_DAO_DVSN', 4, true,  now()),
  ('cd_vienchuc',    'VIEN_CHUC',         'Viên chức',                       'CHUYEN_MON',    5, false, now()),
  ('cd_baove',       'BAO_VE',            'Bảo vệ',                          'HANH_CHINH',    5, false, now()),
  ('cd_tapvu',       'TAP_VU',            'Tạp vụ',                          'HANH_CHINH',    5, false, now())
ON CONFLICT (ma) DO NOTHING;

-- 2) Xếp chức danh cho cán bộ còn thiếu (chỉ động vào chucDanhId IS NULL)
-- 2a) Lãnh đạo đơn vị sự nghiệp trực thuộc (theo loại đơn vị, tránh nhầm lãnh đạo Sở)
UPDATE can_bo cb SET "chucDanhId" = (SELECT id FROM chuc_danh WHERE ma='GIAM_DOC_DVSN')
  FROM to_chuc t WHERE t.id=cb."toChucId" AND cb."chucDanhId" IS NULL
  AND t.loai='DON_VI_TRUC_THUOC' AND TRIM(cb."chucVu")='Giám đốc';
UPDATE can_bo cb SET "chucDanhId" = (SELECT id FROM chuc_danh WHERE ma='PHO_GIAM_DOC_DVSN')
  FROM to_chuc t WHERE t.id=cb."toChucId" AND cb."chucDanhId" IS NULL
  AND t.loai='DON_VI_TRUC_THUOC' AND TRIM(cb."chucVu")='Phó Giám đốc';

-- 2b) Viện / Trường nghề
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='VIEN_TRUONG')     WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Viện trưởng';
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='PHO_VIEN_TRUONG') WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Phó Viện trưởng';
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='HIEU_TRUONG')     WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Hiệu trưởng';
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='PHO_HIEU_TRUONG') WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Phó Hiệu trưởng';

-- 2c) Viên chức biệt phái → chức danh nghề nghiệp viên chức (biệt phái là hình thức điều động)
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='VIEN_CHUC')       WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Viên chức biệt phái';

-- 2d) HĐLĐ hỗ trợ/phục vụ (NĐ 111/2022)
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='BAO_VE')          WHERE "chucDanhId" IS NULL AND TRIM("chucVu")='Bảo vệ';
UPDATE can_bo SET "chucDanhId"=(SELECT id FROM chuc_danh WHERE ma='TAP_VU')          WHERE "chucDanhId" IS NULL AND TRIM("chucVu") IN ('Tạp vụ','Lau dọn vệ sinh');

COMMIT;
