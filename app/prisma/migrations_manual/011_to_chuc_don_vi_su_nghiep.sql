-- 011: Bổ sung 12 đơn vị sự nghiệp trực thuộc Sở + sắp thứ tự theo biểu QLNS 14.5.2026
-- Thứ tự (thuTu) khớp số mục La Mã I..XXIV của file mẫu. Idempotent.

-- 1) Sắp lại thứ tự các đơn vị hiện có theo file mẫu
UPDATE to_chuc SET "thuTu" = v.tt, "updatedAt" = now()
FROM (VALUES
  ('LANH_DAO_SO',   1),
  ('VAN_PHONG_SO',  2),
  ('PHONG_KH_TC',   3),
  ('PHONG_QH_KT',   4),
  ('PHONG_QLHD_XD', 5),
  ('PHONG_KT_VL',   6),
  ('PHONG_HTKT',    7),
  ('PHONG_PTDT',    8),
  ('PHONG_QL_NHA',  9),
  ('PHONG_QL_VT',  10),
  ('PHONG_QLKCHT', 11),
  ('PHONG_CLCT',   12)
) AS v(ma, tt)
WHERE to_chuc.ma = v.ma AND to_chuc."thuTu" IS DISTINCT FROM v.tt;

-- 2) Thêm 12 đơn vị sự nghiệp trực thuộc (mục XIII..XXIV)
INSERT INTO to_chuc (id, ma, ten, "tenVietTat", loai, cap, "thuTu", "isActive", "parentId", "createdAt", "updatedAt")
SELECT 'tc_' || lower(v.ma), v.ma, v.ten, v.tenviettat, 'DON_VI_TRUC_THUOC'::"LoaiToChuc", 2, v.tt, true,
       (SELECT id FROM to_chuc WHERE ma = 'SO_XD_QT'), now(), now()
FROM (VALUES
  ('BAN_QLDA_GT',        'Ban QLDA Đầu tư xây dựng công trình giao thông',               'Ban QLDA GT',        13),
  ('TT_BEN_XE_BAC',      'Trung tâm Dịch vụ và Quản lý Bến xe khách phía Bắc',           'TT Bến xe Bắc',      14),
  ('TT_DANG_KIEM_BAC',   'Trung tâm Đăng kiểm xe cơ giới phía Bắc',                      'TT Đăng kiểm Bắc',   15),
  ('VIEN_QHXD',          'Viện Quy hoạch xây dựng Quảng Trị',                            'Viện QHXD',          16),
  ('TT_KIEM_DINH_BAC',   'Trung tâm Kiểm định chất lượng công trình xây dựng phía Bắc',  'TT Kiểm định Bắc',   17),
  ('TT_DANG_KIEM_NAM',   'Trung tâm Đăng kiểm xe cơ giới phía Nam',                      'TT Đăng kiểm Nam',   18),
  ('DOAN_DUONG_THUY',    'Đoạn Quản lý đường thuỷ nội địa Quảng Trị',                    'Đoạn Đường thuỷ',    19),
  ('TT_BEN_XE_NAM',      'Trung tâm Dịch vụ và Quản lý bến xe khách phía Nam',           'TT Bến xe Nam',      20),
  ('TT_QH_KD_NAM',       'Trung tâm Quy hoạch và Kiểm định xây dựng phía Nam',           'TT QH-KĐ Nam',       21),
  ('BAN_BAO_TRI_GT',     'Ban Quản lý, Bảo trì giao thông',                              'Ban Bảo trì GT',     22),
  ('TT_DAO_TAO_LAI_XE',  'Trung tâm Đào tạo và Sát hạch lái xe Quảng Trị',               'TT ĐT-SH lái xe',    23),
  ('TRUONG_TC_NGHE_GTVT','Trường Trung cấp nghề Giao thông vận tải Quảng Trị',           'Trường TC nghề GTVT',24)
) AS v(ma, ten, tenviettat, tt)
ON CONFLICT (ma) DO UPDATE SET ten = EXCLUDED.ten, "thuTu" = EXCLUDED."thuTu", "updatedAt" = now();
