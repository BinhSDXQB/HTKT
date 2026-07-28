-- Danh mục mặc định danh hiệu thi đua & hình thức khen thưởng (config — Văn phòng Sở có thể sửa/bổ sung).
-- Idempotent theo cột "ma". KHÔNG hard-code vào code; chỉ là dữ liệu khởi tạo.

INSERT INTO office_reward_titles (id, ma, ten, loai, "capKhen", "thuTu", "isActive", "updatedAt") VALUES
  (gen_random_uuid()::text, 'LDTT',        'Lao động tiên tiến',              'DANH_HIEU', 'Cơ sở',     10, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CSTD_CS',     'Chiến sĩ thi đua cơ sở',          'DANH_HIEU', 'Cơ sở',     20, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CSTD_TINH',   'Chiến sĩ thi đua cấp tỉnh',       'DANH_HIEU', 'Tỉnh',      30, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CSTD_TQ',     'Chiến sĩ thi đua toàn quốc',      'DANH_HIEU', 'Nhà nước',  40, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TT_LDTT',     'Tập thể Lao động tiên tiến',      'DANH_HIEU', 'Cơ sở',     50, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TT_LDXS',     'Tập thể Lao động xuất sắc',       'DANH_HIEU', 'Tỉnh',      60, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CO_TD_TINH',  'Cờ thi đua của UBND tỉnh',        'DANH_HIEU', 'Tỉnh',      70, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'GIAY_KHEN',   'Giấy khen',                       'HINH_THUC', 'Cơ sở',    110, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BK_TINH',     'Bằng khen của Chủ tịch UBND tỉnh','HINH_THUC', 'Tỉnh',     120, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BK_BO',       'Bằng khen của Bộ trưởng',         'HINH_THUC', 'Bộ',       130, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BK_TTG',      'Bằng khen của Thủ tướng Chính phủ','HINH_THUC','Nhà nước', 140, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'HC_LD',       'Huân chương Lao động',            'HINH_THUC', 'Nhà nước', 150, true, CURRENT_TIMESTAMP)
ON CONFLICT (ma) DO NOTHING;
