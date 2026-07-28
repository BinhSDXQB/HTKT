-- 036: Trung tâm Bảo trì Giao thông - CSCC & Thoát nước. Additive, idempotent.

-- 1. Tuyến chiếu sáng công cộng
CREATE TABLE IF NOT EXISTS bao_tri_cscc_tuyen (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  phuong TEXT,
  stt INTEGER,
  ten_tuyen TEXT NOT NULL,
  doan TEXT,
  chieu_dai_m NUMERIC(10, 1),
  so_bong INTEGER,
  so_tu_dieu_khien INTEGER,
  nhan_hieu TEXT,
  loai_den TEXT,
  cong_suat_tong_w NUMERIC(10, 1),
  nam_hoat_dong TEXT,
  la_duong_lien_phuong BOOLEAN DEFAULT false,
  mat_cat_lon BOOLEAN DEFAULT false,
  nguoi_quan_ly TEXT,
  vi_tri_tu TEXT,
  dim_tiet_giam TEXT,
  col_thep_de_gang INTEGER,
  col_thep_khong_de INTEGER,
  col_be_tong INTEGER,
  cap_ngam_m NUMERIC(10, 1),
  cap_treo_m NUMERIC(10, 1),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_cscc_tuyen_to_chuc_id" ON bao_tri_cscc_tuyen(to_chuc_id);
CREATE INDEX IF NOT EXISTS "bao_tri_cscc_tuyen_phuong" ON bao_tri_cscc_tuyen(phuong);

-- 2. Đèn tín hiệu giao thông
CREATE TABLE IF NOT EXISTS bao_tri_den_tin_hieu (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten_nut_giao TEXT NOT NULL,
  tuyen TEXT,
  chu_dau_tu TEXT,
  loai_den TEXT,
  tinh_trang TEXT,
  de_xuat TEXT,
  dia_ban TEXT,
  nam_van_hanh INTEGER,
  don_vi_qlvh TEXT,
  don_vi_ql_tai_san TEXT,
  don_vi_tiep_nhan TEXT,
  cong_suat_w NUMERIC(8, 1),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_den_tin_hieu_to_chuc_id" ON bao_tri_den_tin_hieu(to_chuc_id);
CREATE INDEX IF NOT EXISTS "bao_tri_den_tin_hieu_dia_ban" ON bao_tri_den_tin_hieu(dia_ban);

-- 3. Giếng tách
CREATE TABLE IF NOT EXISTS bao_tri_gieng_tach (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten TEXT NOT NULL,
  vi_tri TEXT,
  rong_m NUMERIC(8, 3),
  dai_m NUMERIC(8, 3),
  sau_m NUMERIC(8, 3),
  ngap_bun_m NUMERIC(8, 3),
  kl_bun_m3 NUMERIC(10, 3),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_gieng_tach_to_chuc_id" ON bao_tri_gieng_tach(to_chuc_id);

-- 4. Trạm bơm (bàn giao)
CREATE TABLE IF NOT EXISTS bao_tri_tram_bom (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten TEXT NOT NULL,
  vi_tri TEXT,
  kt_ho_bom_a_mm NUMERIC(8, 1),
  kt_ho_bom_b_mm NUMERIC(8, 1),
  sau_ngap_bun_mm NUMERIC(8, 1),
  kl_ngap_vat_m3 NUMERIC(10, 3),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_tram_bom_to_chuc_id" ON bao_tri_tram_bom(to_chuc_id);

-- 5. Tuyến thoát nước thải R1/R2/R3
CREATE TABLE IF NOT EXISTS bao_tri_tuyen_thoat_nuoc_thai (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten_tuyen TEXT NOT NULL,
  tu TEXT,
  den TEXT,
  tinh_chat_ket_cau TEXT,
  loai_cong TEXT,
  chieu_dai_m NUMERIC(10, 2),
  sl_ho_ga INTEGER,
  loai_tuyen TEXT,
  be_ngang_mat_duong TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_tuyen_thoat_nuoc_thai_to_chuc_id" ON bao_tri_tuyen_thoat_nuoc_thai(to_chuc_id);
CREATE INDEX IF NOT EXISTS "bao_tri_tuyen_thoat_nuoc_thai_loai" ON bao_tri_tuyen_thoat_nuoc_thai(loai_tuyen);

-- 6. Tuyến thoát nước chung
CREATE TABLE IF NOT EXISTS bao_tri_tuyen_thoat_nuoc_chung (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten_tuyen TEXT NOT NULL,
  tu TEXT,
  den TEXT,
  tinh_chat_ket_cau TEXT,
  loai_cong TEXT,
  chieu_dai_m NUMERIC(10, 2),
  sl_ho_ga INTEGER,
  duong_bn_lon BOOLEAN DEFAULT false,
  thuoc_phuong TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_tuyen_thoat_nuoc_chung_to_chuc_id" ON bao_tri_tuyen_thoat_nuoc_chung(to_chuc_id);

-- 7. Tuyến thoát nước mưa
CREATE TABLE IF NOT EXISTS bao_tri_tuyen_thoat_nuoc_mua (
  id TEXT PRIMARY KEY,
  to_chuc_id TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  stt INTEGER,
  ten_tuyen TEXT NOT NULL,
  tu TEXT,
  den TEXT,
  tinh_chat_ket_cau TEXT,
  chieu_dai_m NUMERIC(10, 2),
  sl_ho_ga INTEGER,
  duong_bn_lon BOOLEAN DEFAULT false,
  thuoc_phuong_dong_hoi BOOLEAN DEFAULT false,
  thuoc_phuong_dong_thuan BOOLEAN DEFAULT false,
  thuoc_phuong_dong_son BOOLEAN DEFAULT false,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bao_tri_tuyen_thoat_nuoc_mua_to_chuc_id" ON bao_tri_tuyen_thoat_nuoc_mua(to_chuc_id);
