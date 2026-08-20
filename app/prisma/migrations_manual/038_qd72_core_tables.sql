-- 038: Quyết định 72/2026 — CSDL LÕI phân hệ khảo sát/chỉnh trang đô thị PCCC.
-- Additive, idempotent, có rollback (038_qd72_core_tables_rollback.sql). Namespace qd72_*.
-- Hybrid "2 lớp": cột định kiểu cho trường phục vụ TIÊU CHÍ/truy vấn + chi_tiet JSONB cho phần còn lại.
-- Geometry = GeoJSON (EPSG:4326) trong cột JSONB + tam_lat/tam_lng cho điểm đại diện (không PostGIS).
-- Số liệu XÃ KHAI vs XÁC MINH lưu riêng (cột *_khai / bảng đo có cột nguon).
-- FK: administrative_units(id) [wardId], to_chuc(id), users(id) — đều TEXT/cuid.

-- ─── Danh mục CHỦ SỞ HỮU dây/cáp/hạ tầng (điện lực, viễn thông, chiếu sáng…) ───
CREATE TABLE IF NOT EXISTS qd72_utility_owners (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma            TEXT UNIQUE,
  ten           TEXT NOT NULL,
  loai          TEXT,                    -- DIEN_LUC | VIEN_THONG | TRUYEN_HINH | CHIEU_SANG | KHAC
  to_chuc_id    TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  dien_thoai    TEXT,
  email         TEXT,
  ghi_chu       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── HỒ SƠ KHẢO SÁT (root) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_survey_cases (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma                   TEXT UNIQUE,                         -- mã hồ sơ (QD72-YYYY-NNNN)
  ten                  TEXT NOT NULL,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT, -- xã/phường
  to_chuc_id           TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  trang_thai           TEXT NOT NULL DEFAULT 'DRAFT'
     CHECK (trang_thai IN ('DRAFT','SUBMITTED','RETURNED','TECHNICAL_VERIFICATION','VERIFIED','APPROVED','ARCHIVED')),
  nhom_danh_gia        TEXT
     CHECK (nhom_danh_gia IS NULL OR nhom_danh_gia IN ('DAT','KHONG_DAT_CO_THE_CAI_TAO','KHONG_DAT_CHUA_THE_CAI_TAO_DAY_DU','CHUA_DU_DU_LIEU')),
  ngay_khao_sat        DATE,
  thanh_phan_khao_sat  TEXT,
  mo_ta                TEXT,
  chi_tiet             JSONB NOT NULL DEFAULT '{}'::jsonb,
  phien_ban            INTEGER NOT NULL DEFAULT 1,
  created_by_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  verified_by_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at          TIMESTAMPTZ,
  ly_do_dieu_chinh     TEXT
);
CREATE INDEX IF NOT EXISTS idx_qd72_cases_dvhc ON qd72_survey_cases(don_vi_hanh_chinh_id);
CREATE INDEX IF NOT EXISTS idx_qd72_cases_trang_thai ON qd72_survey_cases(trang_thai);

-- ─── PHIẾU 01: Khu vực đô thị (ranh giới) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_urban_areas (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id       TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma                   TEXT,
  ten                  TEXT NOT NULL,
  thon_to_dan_pho      TEXT,
  can_cu_xac_dinh      TEXT,                                -- căn cứ là khu vực đô thị
  so_van_ban_cong_nhan TEXT,
  ngay_van_ban         DATE,
  dien_tich_ha         NUMERIC,
  dan_so               INTEGER,
  so_ho                INTEGER,
  so_cong_trinh        INTEGER,
  so_ct_tu_3_tang      INTEGER,
  so_cs_nguy_hiem_chay INTEGER,
  geometry             JSONB,                               -- Polygon/MultiPolygon GeoJSON
  tam_lat              NUMERIC,
  tam_lng              NUMERIC,
  chi_tiet             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_urban_case ON qd72_urban_areas(survey_case_id);

-- ─── PHIẾU 02: Đoạn đường phục vụ chữa cháy ──────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_road_segments (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id        TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id  TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma                    TEXT,
  ten                   TEXT NOT NULL,                      -- tên đường/ngõ/hẻm
  diem_dau              TEXT,
  diem_cuoi             TEXT,
  chieu_dai_m           NUMERIC,
  rong_thong_thuy_min_m NUMERIC,                            -- so với ROAD_MIN_WIDTH (3,5m)
  cao_thong_thuy_min_m  NUMERIC,                            -- so với CLEARANCE_MIN_HEIGHT (4,5m)
  do_doc_max            TEXT,                               -- tỉ lệ (vd 1:8,3)
  loai_mat_duong        TEXT,
  tinh_trang_mat_duong  TEXT,
  chiu_tai              TEXT,
  la_duong_cut          BOOLEAN,
  chieu_dai_cut_m       NUMERIC,
  co_diem_quay_xe       BOOLEAN,
  geometry              JSONB,                              -- LineString
  tam_lat               NUMERIC,
  tam_lng               NUMERIC,
  chi_tiet              JSONB NOT NULL DEFAULT '{}'::jsonb,
  de_xuat_chinh_trang   TEXT,
  created_by_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_road_case ON qd72_road_segments(survey_case_id);

-- ─── Vật cản trên/cạnh đường ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_road_obstacles (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  road_segment_id  TEXT REFERENCES qd72_road_segments(id) ON DELETE SET NULL,
  ma               TEXT,
  loai             TEXT,                                    -- CO_DINH | DI_DONG
  mo_ta            TEXT,
  cao_m            NUMERIC,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Bãi đỗ xe chữa cháy ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_fire_parking_areas (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  ma               TEXT,
  ten              TEXT,
  dien_tich_m2     NUMERIC,
  do_doc           TEXT,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Điểm tránh xe ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_passing_bays (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  road_segment_id  TEXT REFERENCES qd72_road_segments(id) ON DELETE SET NULL,
  ma               TEXT,
  chieu_dai_m      NUMERIC,
  chieu_rong_m     NUMERIC,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHIẾU 03: Đường dây/cáp/điện chiếu sáng/vật cản trên cao ─────────────────
CREATE TABLE IF NOT EXISTS qd72_overhead_utility_lines (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id        TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id  TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma                    TEXT,
  loai_doi_tuong        TEXT NOT NULL,                      -- DIEN_TRUNG_THE|DIEN_HA_THE|SAU_CONG_TO|CAP_VIEN_THONG|CAP_INTERNET|CAP_TRUYEN_HINH|CAP_KHAC|DAY_CHIEU_SANG|CAN_DEN|CONG_CHAO|BIEN_QC|CANH_CAY|KET_CAU_KHAC
  ten_tuyen             TEXT,
  owner_id              TEXT REFERENCES qd72_utility_owners(id) ON DELETE SET NULL,
  chu_so_huu_text       TEXT,                               -- khi chưa gắn danh mục
  trang_thai_chu_so_huu TEXT DEFAULT 'CHUA_XAC_DINH',       -- XAC_DINH | CHUA_XAC_DINH
  don_vi_van_hanh       TEXT,
  cao_diem_thap_nhat_m  NUMERIC,                            -- so với CLEARANCE_MIN_HEIGHT (4,5m) — SƠ BỘ
  chay_doc_hay_cat_ngang TEXT,                              -- DOC | CAT_NGANG
  do_vong_quan_sat      TEXT,
  co_can_tro_xe_cc      BOOLEAN,
  tinh_trang_su_dung    TEXT,                               -- DANG_SU_DUNG | NGUNG | CHUA_XAC_DINH
  geometry              JSONB,                              -- LineString
  tam_lat               NUMERIC,
  tam_lng               NUMERIC,
  chi_tiet              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_lines_case ON qd72_overhead_utility_lines(survey_case_id);
CREATE INDEX IF NOT EXISTS idx_qd72_lines_owner ON qd72_overhead_utility_lines(owner_id);

-- ─── Cột (điện/viễn thông/chiếu sáng/dùng chung) ─────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_utility_poles (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  ma               TEXT,
  so_hieu          TEXT,
  loai_cot         TEXT,
  dung_chung       BOOLEAN,
  owner_id         TEXT REFERENCES qd72_utility_owners(id) ON DELETE SET NULL,
  tinh_trang       TEXT,
  geometry         JSONB,                                   -- Point
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Điểm giao cắt dây/cáp qua đường ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_utility_crossings (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  line_id          TEXT REFERENCES qd72_overhead_utility_lines(id) ON DELETE SET NULL,
  road_segment_id  TEXT REFERENCES qd72_road_segments(id) ON DELETE SET NULL,
  ma               TEXT,
  cao_thong_thuy_m NUMERIC,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Đo chiều cao thông thủy (tách XÃ KHAI / ĐO LẠI / XÁC MINH) ───────────────
CREATE TABLE IF NOT EXISTS qd72_clearance_measurements (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  doi_tuong_loai   TEXT,                                    -- ROAD | LINE | CROSSING | OBSTACLE
  doi_tuong_id     TEXT,                                    -- id đối tượng liên quan (không FK cứng để linh hoạt)
  nguon            TEXT NOT NULL DEFAULT 'XA_KHAI',         -- XA_KHAI | DO_LAI | XAC_MINH
  gia_tri_m        NUMERIC,
  vi_tri_do        TEXT,                                    -- TIM_DUONG | MEP_DUONG | DIEM_THAP_NHAT
  thiet_bi_do      TEXT,
  nguoi_do         TEXT,
  ngay_gio_do      TIMESTAMPTZ,
  dieu_kien        TEXT,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_clearance_case ON qd72_clearance_measurements(survey_case_id);

-- ─── Chiếu sáng công cộng (dây/cột/cần đèn/tủ điều khiển) ─────────────────────
CREATE TABLE IF NOT EXISTS qd72_public_lighting_assets (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  ma               TEXT,
  loai             TEXT,                                    -- DAY | COT | CAN_DEN | DEN_TRANG_TRI | TU_DIEU_KHIEN
  owner_id         TEXT REFERENCES qd72_utility_owners(id) ON DELETE SET NULL,
  tinh_trang       TEXT,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Hạ tầng kỹ thuật dùng chung hiện có (cống cáp/hào/tuy nen) ───────────────
CREATE TABLE IF NOT EXISTS qd72_shared_technical_infrastructure (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma               TEXT,
  loai             TEXT,                                    -- CONG_CAP | HAO_KY_THUAT | TUY_NEN
  chieu_dai_m      NUMERIC,
  con_du_phong     BOOLEAN,
  geometry         JSONB,                                   -- LineString/Polygon
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHIẾU 03D: Phương án xử lý dây/cáp (không mặc định hạ ngầm) ──────────────
CREATE TABLE IF NOT EXISTS qd72_undergrounding_proposals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id    TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  line_id           TEXT REFERENCES qd72_overhead_utility_lines(id) ON DELETE SET NULL,
  ma                TEXT,
  cac_phuong_an     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- mảng mã phương án (1..15) — chọn nhiều
  don_vi_chu_tri    TEXT,
  don_vi_phoi_hop   TEXT,
  khoi_luong        TEXT,
  chieu_dai_xu_ly_m NUMERIC,
  so_cot_diem       INTEGER,
  kinh_phi          NUMERIC,
  nguon_von         TEXT,
  muc_uu_tien       TEXT,                                   -- CAO | TRUNG_BINH | THAP
  y_kien_chuyen_nganh TEXT,
  chi_tiet          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHIẾU 04: Nguồn nước chữa cháy ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_water_sources (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id       TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma                   TEXT,
  loai_nguon           TEXT,                                -- TRU_NUOC | BE | HO_AO | SONG_KENH | KHAC
  ten                  TEXT,
  dia_chi              TEXT,
  don_vi_quan_ly       TEXT,
  tinh_trang           TEXT,
  duong_kinh_ong_dn    NUMERIC,                             -- so PIPE_MIN_DIAMETER (DN100)
  mang_vong_hay_cut    TEXT,                                -- VONG | CUT
  chieu_dai_cut_m      NUMERIC,                             -- so DEADEND_PIPE_MAX_LENGTH (200m)
  dung_tich_m3         NUMERIC,
  geometry             JSONB,                               -- Point/Polygon
  tam_lat              NUMERIC,
  tam_lng              NUMERIC,
  chi_tiet             JSONB NOT NULL DEFAULT '{}'::jsonb,
  de_xuat_sua_chua     TEXT,
  created_by_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_water_case ON qd72_water_sources(survey_case_id);

-- ─── Trụ nước chữa cháy ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_fire_hydrants (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id       TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  water_source_id      TEXT REFERENCES qd72_water_sources(id) ON DELETE SET NULL,
  ma                   TEXT,
  tinh_trang           TEXT,
  cach_mep_duong_m     NUMERIC,                             -- so HYDRANT_MAX_DIST_ROAD (2,5m)
  cach_tuong_m         NUMERIC,                             -- so HYDRANT_MIN_DIST_WALL (1m)
  geometry             JSONB,                               -- Point
  tam_lat              NUMERIC,
  tam_lng              NUMERIC,
  chi_tiet             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Kết quả đo lưu lượng/áp lực (tách XÃ KHAI / XÁC MINH) ────────────────────
CREATE TABLE IF NOT EXISTS qd72_water_test_results (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  water_source_id  TEXT REFERENCES qd72_water_sources(id) ON DELETE CASCADE,
  nguon            TEXT NOT NULL DEFAULT 'XA_KHAI',         -- XA_KHAI | DO_LAI | XAC_MINH (đơn vị cấp nước)
  luu_luong_ls     NUMERIC,                                 -- L/s — so WATER_FLOW_TWO_SOURCES (25)
  ap_luc_du_m      NUMERIC,                                 -- m cột nước — so WATER_MIN_PRESSURE (10)
  thoi_diem_do     TIMESTAMPTZ,
  thiet_bi_do      TEXT,
  nguoi_don_vi_do  TEXT,
  bien_ban         TEXT,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Bến/hố thu nước ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_water_intake_points (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  water_source_id  TEXT REFERENCES qd72_water_sources(id) ON DELETE CASCADE,
  ma               TEXT,
  loai             TEXT,                                    -- BEN_LAY_NUOC | HO_THU_NUOC
  so_xe_dong_thoi  INTEGER,
  geometry         JSONB,
  tam_lat          NUMERIC,
  tam_lng          NUMERIC,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHIẾU 05: Biên bản xác minh liên ngành ──────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_verification_records (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  ma               TEXT,
  ngay_xac_minh    DATE,
  thanh_phan       JSONB NOT NULL DEFAULT '[]'::jsonb,      -- các đơn vị tham gia
  noi_dung         TEXT,
  trang_thai       TEXT DEFAULT 'DRAFT',
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Kết quả từng tiêu chí trong biên bản xác minh ───────────────────────────
CREATE TABLE IF NOT EXISTS qd72_verification_items (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  verification_id     TEXT REFERENCES qd72_verification_records(id) ON DELETE CASCADE,
  technical_rule_id   TEXT REFERENCES qd72_technical_rules(id) ON DELETE SET NULL,
  doi_tuong_loai      TEXT,
  doi_tuong_id        TEXT,
  gia_tri_xa_khai     NUMERIC,
  gia_tri_do_lai      NUMERIC,
  ket_qua             TEXT NOT NULL DEFAULT 'CHUA_DU_DU_LIEU'
     CHECK (ket_qua IN ('DAT','KHONG_DAT','CHUA_DU_DU_LIEU','KHONG_AP_DUNG','CHO_XAC_MINH')),
  don_vi_xac_minh     TEXT,
  y_kien              TEXT,
  chi_tiet            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_verif_items_rec ON qd72_verification_items(verification_id);

-- ─── PHIẾU 06: Kế hoạch cải tạo, chỉnh trang ─────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_renovation_plans (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id       TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE RESTRICT,
  ma                   TEXT,
  van_de_ton_tai       TEXT,
  can_cu_xac_dinh      TEXT,
  giai_phap            TEXT,
  nhom_giai_phap       TEXT,
  muc_uu_tien          TEXT,                                -- CAO | TRUNG_BINH | THAP
  co_quan_chu_tri      TEXT,
  don_vi_phoi_hop      TEXT,
  chu_so_huu_ct        TEXT,
  nguon_von            TEXT,
  kinh_phi             NUMERIC,
  nam_thuc_hien        INTEGER,
  tien_do              TEXT,
  geometry             JSONB,
  tam_lat              NUMERIC,
  tam_lng              NUMERIC,
  chi_tiet             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_plan_case ON qd72_renovation_plans(survey_case_id);

CREATE TABLE IF NOT EXISTS qd72_renovation_tasks (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_id          TEXT REFERENCES qd72_renovation_plans(id) ON DELETE CASCADE,
  ma               TEXT,
  ten              TEXT,
  loai_cong_viec   TEXT,
  khoi_luong       TEXT,
  ngay_bat_dau     DATE,
  ngay_hoan_thanh_dk DATE,
  tien_do_pct      NUMERIC,
  trang_thai       TEXT,
  chi_tiet         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tệp/ảnh minh chứng (mẫu BimFile: storagePath riêng + sha256, stream có quyền) ──
CREATE TABLE IF NOT EXISTS qd72_attachments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  doi_tuong_loai   TEXT,                                    -- ROAD | LINE | WATER | PLAN | VERIFICATION | URBAN | CASE
  doi_tuong_id     TEXT,
  ten_file         TEXT NOT NULL,
  dinh_dang        TEXT,
  dung_luong_byte  BIGINT,
  sha256           TEXT,
  storage_path     TEXT NOT NULL,
  loai             TEXT,                                    -- ANH | VIDEO | TAI_LIEU
  gps_lat          NUMERIC,
  gps_lng          NUMERIC,
  chup_luc         TIMESTAMPTZ,
  ghi_chu          TEXT,
  uploaded_by_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_qd72_attach_case ON qd72_attachments(survey_case_id);
CREATE INDEX IF NOT EXISTS idx_qd72_attach_doi_tuong ON qd72_attachments(doi_tuong_loai, doi_tuong_id);

-- ─── Lịch sử workflow (mỗi lần chuyển trạng thái) ────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_workflow_history (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  trang_thai_cu    TEXT,
  trang_thai_moi   TEXT NOT NULL,
  y_kien           TEXT,
  tai_lieu         JSONB NOT NULL DEFAULT '[]'::jsonb,      -- id các attachment kèm theo
  nguoi_thuc_hien_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  thoi_diem        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qd72_wf_case ON qd72_workflow_history(survey_case_id);

-- ─── Ý kiến/bình luận ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qd72_comments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  survey_case_id   TEXT REFERENCES qd72_survey_cases(id) ON DELETE CASCADE,
  doi_tuong_loai   TEXT,
  doi_tuong_id     TEXT,
  noi_dung         TEXT NOT NULL,
  nguoi_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Phân công địa bàn theo đơn vị/vai trò (điện lực/viễn thông xác minh vùng nào) ──
CREATE TABLE IF NOT EXISTS qd72_administrative_unit_assignments (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  don_vi_hanh_chinh_id TEXT REFERENCES administrative_units(id) ON DELETE CASCADE,
  to_chuc_id           TEXT REFERENCES to_chuc(id) ON DELETE CASCADE,
  vai_tro              TEXT,                                -- KHAO_SAT | XAC_MINH_PCCC | XAC_MINH_DIEN | XAC_MINH_VIEN_THONG | XAC_MINH_CHIEU_SANG | XAC_MINH_CAP_NUOC | TONG_HOP
  owner_id             TEXT REFERENCES qd72_utility_owners(id) ON DELETE SET NULL,
  ghi_chu              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (don_vi_hanh_chinh_id, to_chuc_id, vai_tro)
);
