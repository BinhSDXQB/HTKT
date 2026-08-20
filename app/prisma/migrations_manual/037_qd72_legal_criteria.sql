-- 037: Quyết định 72/2026/QĐ-UBND — Nền tảng CẤU HÌNH pháp lý & tiêu chí kỹ thuật.
-- Phân hệ: Khảo sát, chỉnh trang khu vực đô thị không bảo đảm HT giao thông / chiều cao
-- thông thủy / đường dây-cáp / nguồn nước PCCC. Namespace: qd72_*.
-- Additive, idempotent, KHÔNG phá hủy dữ liệu. Rollback: 037_qd72_legal_criteria_rollback.sql
-- Nguyên tắc: KHÔNG hard-code tiêu chí trong UI; căn cứ dùng VĂN BẢN GỐC + SỬA ĐỔI (không dùng bản hợp nhất).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Danh mục VĂN BẢN PHÁP LÝ (cập nhật được; phân biệt văn bản gốc / sửa đổi bổ sung)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_legal_documents (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma_van_ban        TEXT NOT NULL UNIQUE,              -- mã nội bộ ổn định (vd 'QD-72-2026')
  loai              TEXT NOT NULL,                     -- Quyết định | QCVN | Thông tư | Nghị định | Luật
  so_hieu           TEXT NOT NULL,                     -- '72/2026/QĐ-UBND'
  ten               TEXT NOT NULL,
  co_quan_ban_hanh  TEXT,
  ngay_ban_hanh     DATE,
  ngay_hieu_luc     DATE,
  ngay_het_hieu_luc DATE,                              -- NULL = còn hiệu lực
  la_van_ban_goc    BOOLEAN NOT NULL DEFAULT true,     -- true=gốc; false=sửa đổi/bổ sung (Nguyên tắc #10)
  sua_doi_cho_id    TEXT REFERENCES qd72_legal_documents(id) ON DELETE SET NULL, -- văn bản này sửa đổi VB nào
  trang_thai        TEXT NOT NULL DEFAULT 'HIEU_LUC',  -- HIEU_LUC | HET_HIEU_LUC | SAP_HIEU_LUC
  ghi_chu_ra_soat   TEXT,                              -- đính chính/rà soát (vd QĐ72 ghi nhầm số hiệu Luật)
  nguon_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_legal_trang_thai ON qd72_legal_documents(trang_thai);
CREATE INDEX IF NOT EXISTS idx_qd72_legal_loai ON qd72_legal_documents(loai);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TIÊU CHÍ KỸ THUẬT cấu hình (Nguyên tắc #5). Engine chỉ tính "đánh giá sơ bộ".
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_technical_rules (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma_tieu_chi        TEXT NOT NULL UNIQUE,             -- 'ROAD_MIN_WIDTH'
  nhom               TEXT NOT NULL,                    -- GIAO_THONG | CHIEU_CAO | NGUON_NUOC | DUONG_DAY | CHUNG
  ten                TEXT NOT NULL,
  gia_tri            NUMERIC,                          -- ngưỡng số (NULL nếu dùng gia_tri_text)
  gia_tri_text       TEXT,                             -- ngưỡng phi số (vd tỉ lệ dốc '1:8,3')
  toan_tu            TEXT NOT NULL DEFAULT '>=',       -- >= | <= | > | < | = | range | info
  don_vi             TEXT,                             -- m | 'm cột nước' | L/s | DN | giờ | 'tỉ lệ'
  legal_document_id  TEXT REFERENCES qd72_legal_documents(id) ON DELETE RESTRICT, -- căn cứ pháp lý
  dieu_khoan         TEXT,                             -- điều/khoản/mục/bảng áp dụng
  ngay_hieu_luc      DATE,
  ngay_het_hieu_luc  DATE,
  phien_ban          TEXT NOT NULL DEFAULT '1.0',
  trang_thai         TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | INACTIVE
  ghi_chu            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_rules_nhom ON qd72_technical_rules(nhom);
CREATE INDEX IF NOT EXISTS idx_qd72_rules_trang_thai ON qd72_technical_rules(trang_thai);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SEED — Danh mục văn bản (id = ma_van_ban để FK ổn định + idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO qd72_legal_documents (id, ma_van_ban, loai, so_hieu, ten, co_quan_ban_hanh, ngay_ban_hanh, ngay_hieu_luc, la_van_ban_goc, trang_thai, ghi_chu_ra_soat) VALUES
 ('QD-72-2026','QD-72-2026','Quyết định','72/2026/QĐ-UBND','Quy định về khảo sát, chỉnh trang khu vực đô thị không bảo đảm hạ tầng giao thông, chiều cao thông thủy, hệ thống đường dây - cáp và nguồn nước phục vụ PCCC','UBND tỉnh Quảng Trị','2026-08-17','2026-08-17', true,'HIEU_LUC','CẦN RÀ SOÁT: QĐ có dấu hiệu ghi nhầm Luật Tổ chức chính quyền địa phương là số 75/2025/QH15 — chưa hard-code căn cứ có dấu hiệu sai, chờ đính chính.'),
 ('QCVN-06-2022','QCVN-06-2022','QCVN','QCVN 06:2022/BXD','Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình','Bộ Xây dựng','2022-01-01','2022-01-16', true,'HIEU_LUC',NULL),
 ('QCVN-06-2022-SD1-2023','QCVN-06-2022-SD1-2023','QCVN','Sửa đổi 1:2023 QCVN 06:2022/BXD','Sửa đổi 1:2023 QCVN 06:2022/BXD (An toàn cháy cho nhà và công trình)','Bộ Xây dựng','2023-01-01','2023-04-01', false,'HIEU_LUC','Văn bản SỬA ĐỔI QCVN 06:2022/BXD — khu vực quay xe phải phù hợp phương tiện chữa cháy tại địa phương.'),
 ('QCVN-10-2025','QCVN-10-2025','QCVN','QCVN 10:2025/BCA','Quy chuẩn kỹ thuật quốc gia về PCCC (Bộ Công an)','Bộ Công an','2025-01-01','2025-01-01', true,'HIEU_LUC',NULL),
 ('TT-103-2025-BCA','TT-103-2025-BCA','Thông tư','103/2025/TT-BCA','Thông tư của Bộ Công an quy định về PCCC','Bộ Công an','2025-01-01','2025-01-01', true,'HIEU_LUC',NULL),
 ('ND-105-2025','ND-105-2025','Nghị định','105/2025/NĐ-CP','Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật PCCC và CNCH','Chính phủ','2025-01-01','2025-01-01', true,'HIEU_LUC','Biểu mẫu PC01-PC04 theo NĐ này KHÔNG thay thế phiếu khảo sát riêng của QĐ 72.'),
 ('LUAT-PCCC-55-2024','LUAT-PCCC-55-2024','Luật','55/2024/QH15','Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ','Quốc hội','2024-01-01','2025-07-01', true,'HIEU_LUC',NULL),
 ('TT-15-2023-BXD','TT-15-2023-BXD','Thông tư','15/2023/TT-BXD','Thông tư ban hành QCVN 07:2023/BXD (Hệ thống công trình hạ tầng kỹ thuật)','Bộ Xây dựng','2023-12-30','2024-07-01', true,'HIEU_LUC',NULL),
 ('QCVN-07-3-2023','QCVN-07-3-2023','QCVN','QCVN 07-3:2023/BXD','QCVN về công trình hào và tuy nen kỹ thuật','Bộ Xây dựng','2023-12-30','2024-07-01', true,'HIEU_LUC',NULL),
 ('QCVN-07-5-2023','QCVN-07-5-2023','QCVN','QCVN 07-5:2023/BXD','QCVN về công trình cấp điện','Bộ Xây dựng','2023-12-30','2024-07-01', true,'HIEU_LUC',NULL),
 ('QCVN-07-7-2023','QCVN-07-7-2023','QCVN','QCVN 07-7:2023/BXD','QCVN về công trình chiếu sáng','Bộ Xây dựng','2023-12-30','2024-07-01', true,'HIEU_LUC',NULL),
 ('QCVN-07-8-2023','QCVN-07-8-2023','QCVN','QCVN 07-8:2023/BXD','QCVN về công trình viễn thông','Bộ Xây dựng','2023-12-30','2024-07-01', true,'HIEU_LUC',NULL),
 ('ND-72-2012','ND-72-2012','Nghị định','72/2012/NĐ-CP','Nghị định về quản lý và sử dụng chung công trình hạ tầng kỹ thuật','Chính phủ','2012-09-07','2012-10-25', true,'HIEU_LUC','Áp dụng cùng các văn bản sửa đổi, bổ sung còn hiệu lực.'),
 ('LUAT-DIEN-LUC','LUAT-DIEN-LUC','Luật','Luật Điện lực','Luật Điện lực và các văn bản hướng dẫn hiện hành','Quốc hội',NULL,NULL, true,'HIEU_LUC','Cập nhật số hiệu/năm ban hành theo bản đang áp dụng của tỉnh.'),
 ('LUAT-VIEN-THONG','LUAT-VIEN-THONG','Luật','Luật Viễn thông','Luật Viễn thông và các văn bản hướng dẫn hiện hành','Quốc hội',NULL,NULL, true,'HIEU_LUC','Cập nhật số hiệu/năm ban hành theo bản đang áp dụng.')
ON CONFLICT (ma_van_ban) DO NOTHING;

-- Liên kết văn bản sửa đổi → văn bản gốc
UPDATE qd72_legal_documents SET sua_doi_cho_id = 'QCVN-06-2022'
 WHERE id = 'QCVN-06-2022-SD1-2023' AND sua_doi_cho_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED — Tiêu chí kỹ thuật sơ bộ (có thể chỉnh trong màn hình Cấu hình tiêu chí)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO qd72_technical_rules (id, ma_tieu_chi, nhom, ten, gia_tri, gia_tri_text, toan_tu, don_vi, legal_document_id, dieu_khoan, ngay_hieu_luc, phien_ban, trang_thai, ghi_chu) VALUES
 -- Giao thông phục vụ chữa cháy (Phiếu 02)
 ('ROAD_MIN_WIDTH','ROAD_MIN_WIDTH','GIAO_THONG','Chiều rộng thông thủy đường xe chữa cháy tối thiểu', 3.5, NULL,'>=','m','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE','Đường 1 làn; điều kiện cụ thể theo loại/chiều cao công trình.'),
 ('CLEARANCE_MIN_HEIGHT','CLEARANCE_MIN_HEIGHT','CHIEU_CAO','Chiều cao thông thủy tối thiểu cho xe chữa cháy', 4.5, NULL,'>=','m','QCVN-06-2022','Mục 6.2.1.3','2022-01-16','1.0','ACTIVE','KHÔNG dùng thay khoảng cách an toàn điện chuyên ngành.'),
 ('APPROACH_MAX_SLOPE','APPROACH_MAX_SLOPE','GIAO_THONG','Độ dốc đường tiếp cận tối đa', NULL,'1:8,3','<=','tỉ lệ','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE',NULL),
 ('PARKING_MAX_SLOPE','PARKING_MAX_SLOPE','GIAO_THONG','Độ dốc bãi đỗ xe chữa cháy tối đa', NULL,'1:15','<=','tỉ lệ','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE',NULL),
 ('DEADEND_TURN_LENGTH','DEADEND_TURN_LENGTH','GIAO_THONG','Đường cụt vượt chiều dài phải có khu quay xe', 46, NULL,'>','m','QCVN-06-2022-SD1-2023','Mục 6.2.1','2023-04-01','1.0','ACTIVE','Hình thức khu quay xe phù hợp phương tiện tại địa phương (không hard-code tam giác/vuông/tròn).'),
 ('PASSINGBAY_MAX_SPACING','PASSINGBAY_MAX_SPACING','GIAO_THONG','Khoảng cách tối đa giữa các điểm tránh xe', 100, NULL,'<=','m','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE',NULL),
 ('PASSINGBAY_MIN_LENGTH','PASSINGBAY_MIN_LENGTH','GIAO_THONG','Chiều dài điểm tránh xe tối thiểu', 8, NULL,'>=','m','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE',NULL),
 ('PASSINGBAY_MIN_WIDTH','PASSINGBAY_MIN_WIDTH','GIAO_THONG','Chiều rộng mở rộng tại điểm tránh tối thiểu', 7, NULL,'>=','m','QCVN-06-2022','Mục 6.2.1','2022-01-16','1.0','ACTIVE',NULL),
 -- Nguồn nước chữa cháy (Phiếu 04)
 ('WATER_MIN_PRESSURE','WATER_MIN_PRESSURE','NGUON_NUOC','Áp lực tự do tối thiểu tại điểm bất lợi', 10, NULL,'>=','m cột nước','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE','Do đơn vị cấp nước/cơ quan chuyên môn xác minh.'),
 ('HYDRANT_MAX_SPACING','HYDRANT_MAX_SPACING','NGUON_NUOC','Khoảng cách tối đa giữa các trụ nước chữa cháy', 150, NULL,'<=','m','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE',NULL),
 ('WATER_SERVICE_RADIUS','WATER_SERVICE_RADIUS','NGUON_NUOC','Bán kính phục vụ tối đa của nguồn nước', 400, NULL,'<=','m','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE',NULL),
 ('WATER_FLOW_TWO_SOURCES','WATER_FLOW_TWO_SOURCES','NGUON_NUOC','Lưu lượng yêu cầu cần ≥2 điểm lấy nước trong 400 m', 25, NULL,'>=','L/s','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE','Khi lưu lượng ≥ ngưỡng → kiểm tra có ≥2 trụ/điểm lấy nước trong bán kính 400 m.'),
 ('HYDRANT_MAX_DIST_ROAD','HYDRANT_MAX_DIST_ROAD','NGUON_NUOC','Trụ nước cách mép đường tối đa', 2.5, NULL,'<=','m','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE',NULL),
 ('HYDRANT_MIN_DIST_WALL','HYDRANT_MIN_DIST_WALL','NGUON_NUOC','Trụ nước cách tường nhà tối thiểu', 1, NULL,'>=','m','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE',NULL),
 ('PIPE_MIN_DIAMETER','PIPE_MIN_DIAMETER','NGUON_NUOC','Đường kính ống cấp nước đô thị thông thường tối thiểu', 100, NULL,'>=','DN','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE','DN100; trường hợp cụ thể theo quy chuẩn cho phép khác.'),
 ('DEADEND_PIPE_MAX_LENGTH','DEADEND_PIPE_MAX_LENGTH','NGUON_NUOC','Chiều dài mạng cụt thông thường tối đa', 200, NULL,'<=','m','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE',NULL),
 ('FIRE_DURATION_DEFAULT','FIRE_DURATION_DEFAULT','NGUON_NUOC','Thời gian tính toán chữa cháy mặc định', 3, NULL,'=','giờ','QCVN-06-2022','Phần cấp nước chữa cháy','2022-01-16','1.0','ACTIVE','Trừ trường hợp quy chuẩn cho phép khác.')
ON CONFLICT (ma_tieu_chi) DO NOTHING;
