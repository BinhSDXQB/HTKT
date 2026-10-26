-- ============================================================================
-- Migration 049 — BẢNG TRUNG TÂM ĐỐI TƯỢNG HẠ TẦNG KỸ THUẬT (hub) + SỐ HIỆU ĐƯỜNG XÃ/THÔN (QĐ 56/2025/QĐ-UBND)
--
-- Căn cứ (đọc nguyên văn 14/10/2026):
--   - QĐ 56/2025/QĐ-UBND tỉnh Quảng Trị (hiệu lực 31/12/2025): Đ3 (phân cấp: UBND cấp xã quản lý đường đô thị,
--     đường xã, đường thôn, đường gom), Đ4 + Mẫu 01–04, Đ5 (số hiệu "ĐX."/"Đth." + số tự nhiên + chữ cái
--     B,C,D,E,F,G,H,I,K,L,M,N; bảng dải số 70 xã/đặc khu; UBND tỉnh đặt số hiệu đường xã, UBND cấp xã đặt số hiệu
--     đường thôn).
--   - Luật Đường bộ 35/2024/QH15 Đ11 (k3: không bắt buộc đặt tên, số hiệu đường xã, thôn); NĐ 165/2024/NĐ-CP Đ8.
-- Tài liệu thiết kế: app/docs/htkt-doi-tuong/THIET_KE_HUB_HTKT_QD56.md
--
-- MÔ HÌNH HUB – NAN HOA (ít bảng, siêu liên kết qua MÃ XÃ):
--   * administrative_units  : +5 cột dải số Đ5 (không tạo bảng riêng). EXCLUDE bảo đảm hai xã không chồng dải.
--   * htkt_doi_tuong (MỚI)  : MỘT bảng cho MỌI đối tượng HTKT — đường, chiếu sáng, cây xanh, công viên,
--                             thoát nước mưa / thải / chung, cấp nước, bãi đỗ xe. Mỗi đối tượng có mã định danh
--                             <mã xã>-<lĩnh vực>-<số thứ tự> (vd 18904-DG-0001) cấp tự động, không đổi suốt vòng đời.
--                             ma_xa → administrative_units(code): tên xã/phường JOIN động, cùng khoá với ranh giới GIS.
--                             tuyen_duong_id → chính bảng này: đèn/cây/cống "nằm trên" tuyến đường nào; với đường
--                             là tuyến chính của đường nhánh. street_id → streets (tuyến đô thị cũ của mạng lưới).
--                             Cột chung có kiểu + thong_so JSONB cho thông số riêng từng lĩnh vực.
--   * 7 bảng Biểu mẫu báo cáo hằng năm (report_*) : +"doiTuongId" → hub. Báo cáo là ẢNH CHỤP theo năm,
--                             hub là HỒ SƠ GỐC của đối tượng.
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/049_htkt_doi_tuong_hub.sql
-- Hoàn nguyên: 049_htkt_doi_tuong_hub_rollback.sql
-- ============================================================================

BEGIN;

-- ── 1. Dải số hiệu theo xã (Đ5 k1 điểm d) — cột trên administrative_units ──────────────────────────────
ALTER TABLE administrative_units
  ADD COLUMN IF NOT EXISTS "soHieuDxTu"   INTEGER,   -- đường xã: số tự nhiên từ
  ADD COLUMN IF NOT EXISTS "soHieuDxDen"  INTEGER,   -- đường xã: số tự nhiên đến
  ADD COLUMN IF NOT EXISTS "soHieuDthTu"  INTEGER,   -- đường thôn: từ
  ADD COLUMN IF NOT EXISTS "soHieuDthDen" INTEGER,   -- đường thôn: đến
  ADD COLUMN IF NOT EXISTS "soHieuCanCu"  TEXT;      -- văn bản giao dải số

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_au_dai_so_hieu') THEN
    ALTER TABLE administrative_units ADD CONSTRAINT ck_au_dai_so_hieu CHECK (
      ("soHieuDxTu" IS NULL) = ("soHieuDxDen" IS NULL)
      AND ("soHieuDthTu" IS NULL) = ("soHieuDthDen" IS NULL)
      AND ("soHieuDxTu"  IS NULL OR ("soHieuDxTu"  >= 1 AND "soHieuDxDen"  >= "soHieuDxTu"))
      AND ("soHieuDthTu" IS NULL OR ("soHieuDthTu" >= 1 AND "soHieuDthDen" >= "soHieuDthTu"))
    );
  END IF;
  -- Hai xã không được có dải số chồng nhau (gist trên int4range, không cần btree_gist).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ex_au_dai_dx') THEN
    ALTER TABLE administrative_units ADD CONSTRAINT ex_au_dai_dx
      EXCLUDE USING gist (int4range("soHieuDxTu", "soHieuDxDen", '[]') WITH &&) WHERE ("soHieuDxTu" IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ex_au_dai_dth') THEN
    ALTER TABLE administrative_units ADD CONSTRAINT ex_au_dai_dth
      EXCLUDE USING gist (int4range("soHieuDthTu", "soHieuDthDen", '[]') WITH &&) WHERE ("soHieuDthTu" IS NOT NULL);
  END IF;
END $$;

-- Bảng Đ5 k1 điểm d (70 xã/đặc khu; 8 phường không có dải). Ghép theo MÃ ĐVHC, không theo tên:
-- QĐ ghi "Tuyên Hoá" (CSDL "Tuyên Hóa"); "Trung Thuần" là tên chính thức (sapnhap.bando.com.vn, mã 19030).
UPDATE administrative_units au
   SET "soHieuDxTu" = v.dx_tu, "soHieuDxDen" = v.dx_den,
       "soHieuDthTu" = v.dth_tu, "soHieuDthDen" = v.dth_den,
       "soHieuCanCu" = 'Điều 5 Quy định ban hành kèm QĐ 56/2025/QĐ-UBND ngày 31/12/2025 của UBND tỉnh Quảng Trị'
  FROM (VALUES
  ('18904', 'Xã Dân Hóa', 1, 14, 1, 50),
  ('18958', 'Xã Tuyên Lâm', 15, 28, 51, 100),
  ('18952', 'Xã Tuyên Sơn', 29, 42, 101, 150),
  ('18901', 'Xã Minh Hóa', 43, 56, 151, 200),
  ('18919', 'Xã Tân Thành', 57, 70, 201, 250),
  ('18943', 'Xã Kim Phú', 71, 84, 251, 300),
  ('18922', 'Xã Kim Điền', 85, 98, 301, 350),
  ('18949', 'Xã Đồng Lê', 99, 112, 351, 400),
  ('18985', 'Xã Tuyên Phú', 113, 126, 401, 450),
  ('18991', 'Xã Tuyên Bình', 127, 140, 451, 500),
  ('18997', 'Xã Tuyên Hoá', 141, 154, 501, 550),
  ('19021', 'Xã Phú Trạch', 155, 168, 551, 600),
  ('19033', 'Xã Hòa Trạch', 169, 182, 601, 650),
  ('19057', 'Xã Quảng Trạch', 183, 196, 651, 700),
  ('19030', 'Xã Trung Thuần', 197, 210, 701, 750),
  ('19051', 'Xã Tân Gianh', 211, 224, 751, 800),
  ('19075', 'Xã Nam Ba Đồn', 225, 238, 801, 850),
  ('19093', 'Xã Nam Gianh', 239, 252, 851, 900),
  ('19138', 'Xã Phong Nha', 253, 266, 901, 950),
  ('19147', 'Xã Thượng Trạch', 267, 280, 951, 1000),
  ('19141', 'Xã Bố Trạch', 281, 294, 1001, 1050),
  ('19126', 'Xã Bắc Trạch', 295, 308, 1051, 1100),
  ('19159', 'Xã Đông Trạch', 309, 322, 1101, 1150),
  ('19111', 'Xã Hoàn Lão', 323, 336, 1151, 1200),
  ('19198', 'Xã Nam Trạch', 337, 350, 1201, 1250),
  ('19207', 'Xã Quảng Ninh', 351, 364, 1251, 1300),
  ('19225', 'Xã Ninh Châu', 365, 378, 1301, 1350),
  ('19237', 'Xã Trường Ninh', 379, 392, 1351, 1400),
  ('19204', 'Xã Trường Sơn', 393, 406, 1401, 1450),
  ('19246', 'Xã Lệ Ninh', 407, 420, 1451, 1500),
  ('19249', 'Xã Lệ Thủy', 421, 434, 1501, 1550),
  ('19255', 'Xã Cam Hồng', 435, 448, 1551, 1600),
  ('19309', 'Xã Trường Phú', 449, 462, 1601, 1650),
  ('19291', 'Xã Tân Mỹ', 463, 476, 1651, 1700),
  ('19288', 'Xã Sen Ngư', 477, 490, 1701, 1750),
  ('19318', 'Xã Kim Ngân', 491, 504, 1751, 1800),
  ('19435', 'Xã Hướng Lập', 505, 518, 1801, 1850),
  ('19441', 'Xã Hướng Phùng', 519, 532, 1851, 1900),
  ('19555', 'Xã Hướng Hiệp', 533, 546, 1901, 1950),
  ('19366', 'Xã Bến Quan', 547, 560, 1951, 2000),
  ('19537', 'Xã Cồn Tiên', 561, 574, 2001, 2050),
  ('19363', 'Xã Vĩnh Linh', 575, 588, 2051, 2100),
  ('19372', 'Xã Vĩnh Hoàng', 589, 602, 2101, 2150),
  ('19405', 'Xã Vĩnh Thủy', 603, 616, 2151, 2200),
  ('19501', 'Xã Bến Hải', 617, 630, 2201, 2250),
  ('19495', 'Xã Gio Linh', 631, 644, 2251, 2300),
  ('19603', 'Xã Hiếu Giang', 645, 658, 2301, 2350),
  ('19496', 'Xã Cửa Việt', 659, 672, 2351, 2400),
  ('19639', 'Xã Nam Cửa Việt', 673, 686, 2401, 2450),
  ('19414', 'Xã Cửa Tùng', 687, 700, 2451, 2500),
  ('19597', 'Xã Cam Lộ', 701, 714, 2501, 2550),
  ('19669', 'Xã Ái Tử', 715, 728, 2551, 2600),
  ('19624', 'Xã Triệu Phong', 729, 742, 2601, 2650),
  ('19654', 'Xã Triệu Cơ', 743, 756, 2651, 2700),
  ('19645', 'Xã Triệu Bình', 757, 770, 2701, 2750),
  ('19699', 'Xã Vĩnh Định', 771, 784, 2751, 2800),
  ('19741', 'Xã Mỹ Thủy', 785, 798, 2801, 2850),
  ('19681', 'Xã Diên Sanh', 799, 812, 2851, 2900),
  ('19702', 'Xã Hải Lăng', 813, 826, 2901, 2950),
  ('19735', 'Xã Nam Hải Lăng', 827, 840, 2951, 3000),
  ('19567', 'Xã Ba Lòng', 841, 854, 3001, 3050),
  ('19429', 'Xã Khe Sanh', 855, 868, 3051, 3100),
  ('19564', 'Xã Đakrông', 869, 882, 3101, 3150),
  ('19432', 'Xã Lao Bảo', 883, 896, 3151, 3200),
  ('19462', 'Xã Tân Lập', 897, 910, 3201, 3250),
  ('19489', 'Xã Lìa', 911, 924, 3251, 3300),
  ('19483', 'Xã A Dơi', 925, 938, 3301, 3350),
  ('19588', 'Xã Tà Rụt', 939, 952, 3351, 3400),
  ('19594', 'Xã La Lay', 953, 966, 3401, 3450),
  ('19742', 'Đặc khu Cồn Cỏ', 967, 980, 3451, 3500)
  ) AS v(ma, ten_qd, dx_tu, dx_den, dth_tu, dth_den)
 WHERE au.code = v.ma;

DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM administrative_units WHERE "soHieuDxTu" IS NOT NULL AND "soHieuDthTu" IS NOT NULL;
  IF n <> 70 THEN RAISE EXCEPTION 'QĐ 56 Đ5: phải có đúng 70 ĐVHC được giao dải số, hiện có %', n; END IF;
  SELECT count(*) INTO n FROM administrative_units WHERE "soHieuDxTu" IS NOT NULL AND name ILIKE 'Phường%';
  IF n <> 0 THEN RAISE EXCEPTION 'QĐ 56 Đ5: phường không được giao dải số, hiện có %', n; END IF;
END $$;

-- ── 2. Hàm hình học trên GeoJSON jsonb (chưa có PostGIS) ─────────────────────────────────────────────
-- Mọi đỉnh [kinh độ, vĩ độ] của Point/MultiPoint/LineString/MultiLineString/Polygon/MultiPolygon.
CREATE OR REPLACE FUNCTION fn_htkt_dinh(g JSONB) RETURNS TABLE (lng FLOAT8, lat FLOAT8)
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN jsonb_typeof(p->0) = 'number' THEN (p->>0)::float8 END,
         CASE WHEN jsonb_typeof(p->1) = 'number' THEN (p->>1)::float8 END
    FROM (
      SELECT g->'coordinates' FROM (SELECT 1) x WHERE g->>'type' = 'Point'
      UNION ALL
      SELECT e FROM jsonb_array_elements(CASE WHEN g->>'type' IN ('LineString','MultiPoint') THEN g->'coordinates' ELSE '[]'::jsonb END) e
      UNION ALL
      SELECT e2 FROM jsonb_array_elements(CASE WHEN g->>'type' IN ('MultiLineString','Polygon') THEN g->'coordinates' ELSE '[]'::jsonb END) e1,
                     jsonb_array_elements(e1) e2
      UNION ALL
      SELECT e3 FROM jsonb_array_elements(CASE WHEN g->>'type' = 'MultiPolygon' THEN g->'coordinates' ELSE '[]'::jsonb END) e1,
                     jsonb_array_elements(e1) e2, jsonb_array_elements(e2) e3
    ) s(p)
$$;

-- Chiều dài (m, haversine) của LineString/MultiLineString; hình khác trả NULL.
CREATE OR REPLACE FUNCTION fn_htkt_do_dai_m(g JSONB) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE AS $$
  WITH ds AS (
    SELECT row_number() OVER () AS ln, l.coords
      FROM jsonb_array_elements(CASE g->>'type'
             WHEN 'LineString'      THEN jsonb_build_array(g->'coordinates')
             WHEN 'MultiLineString' THEN g->'coordinates'
             ELSE '[]'::jsonb END) AS l(coords)
  ), pts AS (
    SELECT ds.ln, t.ord, (t.p->>0)::float8 AS lng, (t.p->>1)::float8 AS lat
      FROM ds, jsonb_array_elements(ds.coords) WITH ORDINALITY AS t(p, ord)
  ), seg AS (
    SELECT lat, lng, lag(lat) OVER w AS plat, lag(lng) OVER w AS plng
      FROM pts WINDOW w AS (PARTITION BY ln ORDER BY ord)
  )
  SELECT CASE WHEN g->>'type' IN ('LineString','MultiLineString') THEN
           round(COALESCE(sum(2 * 6371008.8 * asin(sqrt(
             power(sin(radians(lat - plat) / 2), 2)
             + cos(radians(plat)) * cos(radians(lat)) * power(sin(radians(lng - plng) / 2), 2)))), 0)::numeric, 1) END
    FROM seg WHERE plat IS NOT NULL
$$;

-- Diện tích (m², chiếu phẳng cục bộ – sai số < 0,5% ở quy mô xã) của Polygon/MultiPolygon; vòng 1 trừ các lỗ.
CREATE OR REPLACE FUNCTION fn_htkt_dien_tich_m2(g JSONB) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE AS $$
  WITH polys AS (
    SELECT p.poly FROM jsonb_array_elements(CASE g->>'type'
             WHEN 'Polygon'      THEN jsonb_build_array(g->'coordinates')
             WHEN 'MultiPolygon' THEN g->'coordinates'
             ELSE '[]'::jsonb END) AS p(poly)
  ), rings AS (
    SELECT row_number() OVER () AS rid, r.ord AS ring_no, r.ring
      FROM polys, jsonb_array_elements(polys.poly) WITH ORDINALITY AS r(ring, ord)
  ), pts AS (
    SELECT rid, ring_no, t.ord, (t.p->>0)::float8 AS lng, (t.p->>1)::float8 AS lat
      FROM rings, jsonb_array_elements(rings.ring) WITH ORDINALITY AS t(p, ord)
  ), lat0 AS (SELECT avg(lat) AS a FROM pts),
  xy AS (
    SELECT rid, ring_no, ord,
           6371008.8 * radians(lng) * cos(radians((SELECT a FROM lat0))) AS x,
           6371008.8 * radians(lat) AS y
      FROM pts
  ), shoelace AS (
    SELECT rid, min(ring_no) AS ring_no,
           abs(sum(x * lead_y - lead_x * y)) / 2 AS dt
      FROM (SELECT rid, ring_no, x, y,
                   lead(x) OVER w AS lead_x, lead(y) OVER w AS lead_y
              FROM xy WINDOW w AS (PARTITION BY rid ORDER BY ord)) s
     WHERE lead_x IS NOT NULL
     GROUP BY rid
  )
  SELECT CASE WHEN g->>'type' IN ('Polygon','MultiPolygon') THEN
           round(COALESCE(sum(CASE WHEN ring_no = 1 THEN dt ELSE -dt END), 0)::numeric, 1) END
    FROM shoelace
$$;

-- ── 3. Bảng trung tâm đối tượng HTKT ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS htkt_doi_tuong (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma_doi_tuong        TEXT NOT NULL UNIQUE,                 -- <mã xã>-<LV>-<NNNN>, trigger tự cấp
  ma_xa               TEXT NOT NULL REFERENCES administrative_units(code) ON UPDATE CASCADE,
  linh_vuc            TEXT NOT NULL CHECK (linh_vuc IN ('DUONG','CHIEU_SANG','CAY_XANH','CONG_VIEN',
                        'THOAT_NUOC_MUA','THOAT_NUOC_THAI','THOAT_NUOC_CHUNG','CAP_NUOC','BAI_DO_XE')),
  ten                 TEXT,                                  -- tên đối tượng (đường: không bắt buộc – Luật ĐB Đ11 k3)
  tuyen_duong_id      TEXT REFERENCES htkt_doi_tuong(id) ON DELETE SET NULL,  -- nằm trên tuyến / nhánh của tuyến
  street_id           TEXT REFERENCES streets(id) ON DELETE SET NULL,         -- tuyến đô thị của mạng lưới cũ

  -- Riêng ĐƯỜNG (QĐ 56 Đ3, Đ5; Mẫu 01–04)
  cap_duong           TEXT CHECK (cap_duong IS NULL OR cap_duong IN
                        ('DUONG_XA','DUONG_THON','DUONG_GOM','DUONG_DO_THI','DUONG_TINH','QUOC_LO','CHUA_PHAN_CAP')),
  phan_loai_do_thi    TEXT CHECK (phan_loai_do_thi IS NULL OR phan_loai_do_thi IN
                        ('TRUC_CHINH','CHINH_DO_THI','LIEN_KHU_VUC','CHINH_KHU_VUC','KHU_VUC','NOI_BO')),
  thon                TEXT,                                  -- thôn/bản/tổ dân phố
  sh_so               INTEGER CHECK (sh_so IS NULL OR sh_so > 0),
  sh_chu_cai          TEXT CHECK (sh_chu_cai IS NULL OR sh_chu_cai IN ('B','C','D','E','F','G','H','I','K','L','M','N')),
  so_hieu             TEXT GENERATED ALWAYS AS (
                        CASE WHEN sh_so IS NULL THEN NULL
                             WHEN cap_duong = 'DUONG_XA'   THEN 'ĐX.'  || sh_so::text || COALESCE(sh_chu_cai, '')
                             WHEN cap_duong = 'DUONG_THON' THEN 'Đth.' || sh_so::text || COALESCE(sh_chu_cai, '')
                        END) STORED,
  sh_trang_thai       TEXT CHECK (sh_trang_thai IS NULL OR sh_trang_thai IN ('DE_XUAT','HIEU_LUC')),
  sh_so_qd            TEXT,
  sh_ngay_qd          DATE,
  so_hieu_khac        TEXT,                                  -- QL./ĐT./ĐĐT.… (ngoài Đ5, không kiểm dải)
  so_hieu_cu          TEXT,                                  -- số hiệu đường huyện trước 01/7/2025 (Mẫu 02)
  ten_cu              TEXT,

  -- Thông số chung (đơn vị SI: mét, m²)
  diem_dau            TEXT,
  diem_cuoi           TEXT,
  vi_tri              TEXT,                                  -- địa chỉ / vị trí mô tả
  chieu_dai_m         NUMERIC(12,1) CHECK (chieu_dai_m IS NULL OR chieu_dai_m >= 0),
  be_rong_nen_m       NUMERIC(6,2)  CHECK (be_rong_nen_m IS NULL OR be_rong_nen_m >= 0),
  be_rong_mat_m       NUMERIC(6,2)  CHECK (be_rong_mat_m IS NULL OR be_rong_mat_m >= 0),
  ket_cau_mat         TEXT,
  dien_tich_m2        NUMERIC(14,1) CHECK (dien_tich_m2 IS NULL OR dien_tich_m2 >= 0),
  so_luong            INTEGER CHECK (so_luong IS NULL OR so_luong >= 0),   -- cột đèn / cây / chỗ đỗ / hộ dân
  nam_su_dung         INTEGER CHECK (nam_su_dung IS NULL OR nam_su_dung BETWEEN 1900 AND 2100),
  tinh_trang          TEXT CHECK (tinh_trang IS NULL OR tinh_trang IN ('TOT','TRUNG_BINH','KEM','HU_HONG')),
  don_vi_quan_ly      TEXT,
  de_xuat_dieu_chinh  TEXT,
  thong_so            JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(thong_so) = 'object'),

  -- GIS (GeoJSON WGS84). Chiều dài/diện tích/tâm do trigger tự tính; % đỉnh ngoài ranh xã do ứng dụng tính.
  geometry            JSONB CHECK (geometry IS NULL OR geometry->>'type' IN
                        ('Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon')),
  chieu_dai_gis_m     NUMERIC(12,1),
  dien_tich_gis_m2    NUMERIC(14,1),
  tam_lat             NUMERIC(9,6),
  tam_lng             NUMERIC(9,6),
  ngoai_ranh_pct      NUMERIC(5,1),

  lich_su             JSONB NOT NULL DEFAULT '[]'::jsonb,    -- lịch sử số hiệu (trigger tự ghi)
  ghi_chu             TEXT,
  created_by_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT ck_htkt_cap_duong     CHECK ((linh_vuc = 'DUONG') = (cap_duong IS NOT NULL)),
  CONSTRAINT ck_htkt_sh_day_du     CHECK ((sh_so IS NULL) = (sh_trang_thai IS NULL)),
  CONSTRAINT ck_htkt_sh_chu_cai    CHECK (sh_chu_cai IS NULL OR sh_so IS NOT NULL),
  CONSTRAINT ck_htkt_sh_cap        CHECK (sh_so IS NULL OR cap_duong IN ('DUONG_XA','DUONG_THON')),
  CONSTRAINT ck_htkt_sh_hieu_luc   CHECK (sh_trang_thai IS DISTINCT FROM 'HIEU_LUC' OR (sh_so_qd IS NOT NULL AND sh_ngay_qd IS NOT NULL)),
  CONSTRAINT ck_htkt_do_thi        CHECK (phan_loai_do_thi IS NULL OR cap_duong = 'DUONG_DO_THI'),
  CONSTRAINT ck_htkt_khong_tu_tro  CHECK (tuyen_duong_id IS DISTINCT FROM id),
  CONSTRAINT ck_htkt_co_nhan       CHECK (NULLIF(trim(ten), '') IS NOT NULL OR sh_so IS NOT NULL OR NULLIF(trim(so_hieu_khac), '') IS NOT NULL)
);

-- Không trùng số hiệu toàn tỉnh (dải các xã rời nhau → (cấp, số, chữ cái) duy nhất).
CREATE UNIQUE INDEX IF NOT EXISTS uq_htkt_so_hieu
  ON htkt_doi_tuong (cap_duong, sh_so, COALESCE(sh_chu_cai, ''))
  WHERE sh_so IS NOT NULL AND deleted_at IS NULL;
-- Một tuyến đô thị (streets) chỉ gắn với một hồ sơ đường.
CREATE UNIQUE INDEX IF NOT EXISTS uq_htkt_street ON htkt_doi_tuong (street_id) WHERE street_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_htkt_xa_lv    ON htkt_doi_tuong (ma_xa, linh_vuc) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_htkt_tuyen    ON htkt_doi_tuong (tuyen_duong_id);
CREATE INDEX IF NOT EXISTS idx_htkt_created  ON htkt_doi_tuong (created_by_id);
CREATE INDEX IF NOT EXISTS idx_htkt_updated  ON htkt_doi_tuong (updated_by_id);
CREATE INDEX IF NOT EXISTS idx_htkt_ten_trgm ON htkt_doi_tuong USING gin (ten gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_htkt_thong_so ON htkt_doi_tuong USING gin (thong_so jsonb_path_ops);

-- ── 4. Trigger kiểm tra + tự động hoá ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_htkt_truoc_ghi() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_tu INT; v_den INT; v_ten TEXT; v_ky TEXT; v_lv TEXT; v_n INT; v_hh TEXT;
  v_doi_so BOOLEAN;
BEGIN
  NEW.updated_at := now();
  NEW.sh_chu_cai := NULLIF(upper(trim(NEW.sh_chu_cai)), '');
  NEW.ten := NULLIF(trim(NEW.ten), '');

  -- Mã định danh: <mã xã>-<LV>-<NNNN>, cấp một lần, không đổi khi sửa.
  IF TG_OP = 'INSERT' AND NEW.ma_doi_tuong IS NULL THEN
    v_lv := CASE NEW.linh_vuc WHEN 'DUONG' THEN 'DG' WHEN 'CHIEU_SANG' THEN 'CS' WHEN 'CAY_XANH' THEN 'CX'
              WHEN 'CONG_VIEN' THEN 'CV' WHEN 'THOAT_NUOC_MUA' THEN 'TM' WHEN 'THOAT_NUOC_THAI' THEN 'TT'
              WHEN 'THOAT_NUOC_CHUNG' THEN 'TC' WHEN 'CAP_NUOC' THEN 'CN' WHEN 'BAI_DO_XE' THEN 'BX' END;
    PERFORM pg_advisory_xact_lock(hashtext('htkt_doi_tuong:' || NEW.ma_xa || ':' || v_lv));
    SELECT COALESCE(max(substring(ma_doi_tuong FROM '-(\d+)$')::int), 0) + 1 INTO v_n
      FROM htkt_doi_tuong WHERE ma_doi_tuong LIKE NEW.ma_xa || '-' || v_lv || '-%';
    NEW.ma_doi_tuong := NEW.ma_xa || '-' || v_lv || '-' || lpad(v_n::text, 4, '0');
  ELSIF TG_OP = 'UPDATE' AND NEW.ma_doi_tuong IS DISTINCT FROM OLD.ma_doi_tuong THEN
    RAISE EXCEPTION 'Mã định danh đối tượng HTKT không được sửa (%)', OLD.ma_doi_tuong USING ERRCODE = '23514';
  END IF;

  -- Tuyến đường tham chiếu phải là đối tượng ĐƯỜNG cùng xã.
  IF NEW.tuyen_duong_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.tuyen_duong_id IS DISTINCT FROM OLD.tuyen_duong_id
                                          OR NEW.ma_xa IS DISTINCT FROM OLD.ma_xa) THEN
    IF NOT EXISTS (SELECT 1 FROM htkt_doi_tuong t WHERE t.id = NEW.tuyen_duong_id AND t.linh_vuc = 'DUONG'
                     AND t.ma_xa = NEW.ma_xa AND t.deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Tuyến đường liên kết phải là hồ sơ ĐƯỜNG còn hiệu lực của cùng xã/phường' USING ERRCODE = '23503';
    END IF;
  END IF;

  -- Hình học: kiểu phù hợp lĩnh vực; mọi đỉnh [kinh độ, vĩ độ] WGS84 trong khung tỉnh Quảng Trị.
  IF NEW.geometry IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.geometry IS DISTINCT FROM OLD.geometry
                                    OR NEW.linh_vuc IS DISTINCT FROM OLD.linh_vuc) THEN
    v_hh := NEW.geometry->>'type';
    IF (NEW.linh_vuc IN ('DUONG','THOAT_NUOC_MUA','THOAT_NUOC_THAI','THOAT_NUOC_CHUNG') AND v_hh NOT IN ('LineString','MultiLineString'))
       OR (NEW.linh_vuc IN ('CHIEU_SANG','CAY_XANH','CAP_NUOC') AND v_hh IN ('Polygon','MultiPolygon'))
       OR (NEW.linh_vuc IN ('CONG_VIEN','BAI_DO_XE') AND v_hh NOT IN ('Polygon','MultiPolygon','Point')) THEN
      RAISE EXCEPTION 'Kiểu hình học % không phù hợp lĩnh vực %', v_hh, NEW.linh_vuc USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM fn_htkt_dinh(NEW.geometry)) OR EXISTS (
      SELECT 1 FROM fn_htkt_dinh(NEW.geometry) d
       WHERE d.lng IS NULL OR d.lat IS NULL OR d.lng NOT BETWEEN 105.4 AND 107.8 OR d.lat NOT BETWEEN 15.9 AND 18.3
    ) THEN
      RAISE EXCEPTION 'Toạ độ phải là [kinh độ, vĩ độ] WGS84 trong phạm vi tỉnh Quảng Trị' USING ERRCODE = '22023';
    END IF;
    NEW.chieu_dai_gis_m := fn_htkt_do_dai_m(NEW.geometry);
    NEW.dien_tich_gis_m2 := fn_htkt_dien_tich_m2(NEW.geometry);
    SELECT round(avg(d.lat)::numeric, 6), round(avg(d.lng)::numeric, 6) INTO NEW.tam_lat, NEW.tam_lng
      FROM fn_htkt_dinh(NEW.geometry) d;
  ELSIF NEW.geometry IS NULL THEN
    NEW.chieu_dai_gis_m := NULL; NEW.dien_tich_gis_m2 := NULL; NEW.tam_lat := NULL; NEW.tam_lng := NULL; NEW.ngoai_ranh_pct := NULL;
  END IF;

  v_doi_so := TG_OP = 'INSERT'
           OR NEW.sh_so IS DISTINCT FROM OLD.sh_so OR NEW.sh_chu_cai IS DISTINCT FROM OLD.sh_chu_cai
           OR NEW.cap_duong IS DISTINCT FROM OLD.cap_duong OR NEW.ma_xa IS DISTINCT FROM OLD.ma_xa
           OR (NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL);

  -- Số hiệu Đ5: chỉ đường xã / đường thôn, nằm trong dải số của chính xã đó.
  IF NEW.sh_so IS NOT NULL AND NEW.deleted_at IS NULL AND v_doi_so THEN
    IF NEW.cap_duong IS DISTINCT FROM 'DUONG_XA' AND NEW.cap_duong IS DISTINCT FROM 'DUONG_THON' THEN
      RAISE EXCEPTION 'Chỉ đường xã (ĐX.) và đường thôn (Đth.) được đặt số hiệu theo Điều 5 QĐ 56/2025/QĐ-UBND'
        USING ERRCODE = '23514';
    END IF;
    SELECT name,
           CASE NEW.cap_duong WHEN 'DUONG_XA' THEN "soHieuDxTu"  ELSE "soHieuDthTu"  END,
           CASE NEW.cap_duong WHEN 'DUONG_XA' THEN "soHieuDxDen" ELSE "soHieuDthDen" END
      INTO v_ten, v_tu, v_den
      FROM administrative_units WHERE code = NEW.ma_xa;
    v_ky := CASE NEW.cap_duong WHEN 'DUONG_XA' THEN 'ĐX.' ELSE 'Đth.' END;
    IF v_tu IS NULL THEN
      RAISE EXCEPTION '% không được giao dải số hiệu % theo Điều 5 QĐ 56/2025/QĐ-UBND', v_ten, v_ky USING ERRCODE = '23514';
    END IF;
    IF NEW.sh_so NOT BETWEEN v_tu AND v_den THEN
      RAISE EXCEPTION 'Số % ngoài dải % của %: chỉ được dùng %–%', NEW.sh_so, v_ky, v_ten, v_tu, v_den USING ERRCODE = '23514';
    END IF;
    -- Chữ cái chỉ dùng khi số đó đã đặt cho đường khác (Đ5 k1 điểm c).
    IF NEW.sh_chu_cai IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM htkt_doi_tuong d
       WHERE d.cap_duong = NEW.cap_duong AND d.sh_so = NEW.sh_so AND d.sh_chu_cai IS NULL
         AND d.deleted_at IS NULL AND d.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Chưa có tuyến mang số hiệu %: chỉ thêm chữ cái % cho đường thứ hai trở lên', v_ky || NEW.sh_so, NEW.sh_chu_cai
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Lịch sử: mọi lần đổi / thu hồi / cập nhật quyết định / xoá đều lưu số hiệu cũ.
  IF TG_OP = 'UPDATE' AND OLD.sh_so IS NOT NULL AND (
       v_doi_so OR NEW.sh_trang_thai IS DISTINCT FROM OLD.sh_trang_thai
       OR NEW.sh_so_qd IS DISTINCT FROM OLD.sh_so_qd OR NEW.sh_ngay_qd IS DISTINCT FROM OLD.sh_ngay_qd
       OR (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)) THEN
    NEW.lich_su := COALESCE(NEW.lich_su, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'so_hieu', OLD.so_hieu, 'trang_thai', OLD.sh_trang_thai, 'so_qd', OLD.sh_so_qd, 'ngay_qd', OLD.sh_ngay_qd,
      'ma_xa', OLD.ma_xa, 'den_luc', now(), 'boi', NEW.updated_by_id,
      'ly_do', CASE WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'XOA_DOI_TUONG'
                    WHEN NEW.sh_so IS NULL THEN 'THU_HOI'
                    WHEN v_doi_so THEN 'DOI_SO_HIEU' ELSE 'CAP_NHAT_QUYET_DINH' END));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_htkt_truoc_ghi ON htkt_doi_tuong;
CREATE TRIGGER trg_htkt_truoc_ghi BEFORE INSERT OR UPDATE ON htkt_doi_tuong
  FOR EACH ROW EXECUTE FUNCTION fn_htkt_truoc_ghi();

-- ── 5. Gợi ý số hiệu còn trống (số tròn trước, hết số tròn mới dùng chữ cái) ─────────────────────────
CREATE OR REPLACE FUNCTION fn_htkt_goi_y_so_hieu(p_ma_xa TEXT, p_cap TEXT, p_so_goc INT DEFAULT NULL)
RETURNS TABLE (so INT, chu_cai TEXT, ky_hieu TEXT)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_tu INT; v_den INT; v_ky TEXT; n INT; c TEXT;
  v_chu TEXT[] := ARRAY['B','C','D','E','F','G','H','I','K','L','M','N'];
BEGIN
  IF p_cap = 'DUONG_XA' THEN
    SELECT "soHieuDxTu", "soHieuDxDen" INTO v_tu, v_den FROM administrative_units WHERE code = p_ma_xa; v_ky := 'ĐX.';
  ELSIF p_cap = 'DUONG_THON' THEN
    SELECT "soHieuDthTu", "soHieuDthDen" INTO v_tu, v_den FROM administrative_units WHERE code = p_ma_xa; v_ky := 'Đth.';
  ELSE RETURN; END IF;
  IF v_tu IS NULL THEN RETURN; END IF;

  IF p_so_goc IS NOT NULL THEN                         -- đường thứ hai trở lên dùng chung số (đường nhánh)
    IF p_so_goc NOT BETWEEN v_tu AND v_den THEN RETURN; END IF;
    IF NOT EXISTS (SELECT 1 FROM htkt_doi_tuong d WHERE d.cap_duong = p_cap AND d.sh_so = p_so_goc
                     AND d.sh_chu_cai IS NULL AND d.deleted_at IS NULL) THEN
      so := p_so_goc; chu_cai := NULL; ky_hieu := v_ky || p_so_goc; RETURN NEXT; RETURN;
    END IF;
    FOREACH c IN ARRAY v_chu LOOP
      IF NOT EXISTS (SELECT 1 FROM htkt_doi_tuong d WHERE d.cap_duong = p_cap AND d.sh_so = p_so_goc
                       AND d.sh_chu_cai = c AND d.deleted_at IS NULL) THEN
        so := p_so_goc; chu_cai := c; ky_hieu := v_ky || p_so_goc || c; RETURN NEXT; RETURN;
      END IF;
    END LOOP;
    RETURN;
  END IF;

  FOR n IN v_tu..v_den LOOP
    IF NOT EXISTS (SELECT 1 FROM htkt_doi_tuong d WHERE d.cap_duong = p_cap AND d.sh_so = n
                     AND d.sh_chu_cai IS NULL AND d.deleted_at IS NULL) THEN
      so := n; chu_cai := NULL; ky_hieu := v_ky || n; RETURN NEXT; RETURN;
    END IF;
  END LOOP;
  FOREACH c IN ARRAY v_chu LOOP
    FOR n IN v_tu..v_den LOOP
      IF EXISTS (SELECT 1 FROM htkt_doi_tuong d WHERE d.cap_duong = p_cap AND d.sh_so = n
                   AND d.sh_chu_cai IS NULL AND d.deleted_at IS NULL)
         AND NOT EXISTS (SELECT 1 FROM htkt_doi_tuong d WHERE d.cap_duong = p_cap AND d.sh_so = n
                   AND d.sh_chu_cai = c AND d.deleted_at IS NULL) THEN
        so := n; chu_cai := c; ky_hieu := v_ky || n || c; RETURN NEXT; RETURN;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ── 6. Nan hoa: 7 Biểu mẫu báo cáo hằng năm trỏ về hub ──────────────────────────────────────────────
-- Trigger dùng chung: dòng báo cáo chỉ được liên kết tới đối tượng CÙNG xã/phường và ĐÚNG lĩnh vực.
CREATE OR REPLACE FUNCTION fn_bao_cao_kiem_lien_ket() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_lv TEXT[];
BEGIN
  IF NEW."doiTuongId" IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW."doiTuongId" IS NOT DISTINCT FROM OLD."doiTuongId" AND NEW."wardId" IS NOT DISTINCT FROM OLD."wardId" THEN
    RETURN NEW;
  END IF;
  v_lv := CASE TG_TABLE_NAME
            WHEN 'report_duong'      THEN ARRAY['DUONG']
            WHEN 'report_dien_cs'    THEN ARRAY['CHIEU_SANG']
            WHEN 'report_thoat_nuoc' THEN ARRAY['THOAT_NUOC_MUA','THOAT_NUOC_THAI','THOAT_NUOC_CHUNG']
            WHEN 'report_cay_xanh'   THEN ARRAY['CAY_XANH']
            WHEN 'report_cong_vien'  THEN ARRAY['CONG_VIEN']
            WHEN 'report_cap_nuoc'   THEN ARRAY['CAP_NUOC']
            WHEN 'report_bai_do_xe'  THEN ARRAY['BAI_DO_XE'] END;
  IF NOT EXISTS (
    SELECT 1 FROM htkt_doi_tuong d JOIN administrative_units au ON au.code = d.ma_xa
     WHERE d.id = NEW."doiTuongId" AND au.id = NEW."wardId" AND d.linh_vuc = ANY (v_lv)
  ) THEN
    RAISE EXCEPTION 'Dòng % chỉ được liên kết tới đối tượng HTKT cùng xã/phường, lĩnh vực %', TG_TABLE_NAME, array_to_string(v_lv, '/')
      USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['report_duong','report_dien_cs','report_thoat_nuoc','report_cay_xanh',
                           'report_cong_vien','report_cap_nuoc','report_bai_do_xe'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "doiTuongId" TEXT', t);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_' || t || '_doi_tuong') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("doiTuongId") REFERENCES htkt_doi_tuong(id) ON DELETE SET NULL',
                     t, 'fk_' || t || '_doi_tuong');
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("doiTuongId")', 'idx_' || t || '_doi_tuong', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || t || '_lien_ket', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_bao_cao_kiem_lien_ket()',
                   'trg_' || t || '_lien_ket', t);
  END LOOP;
END $$;

-- ── 7. View liên kết động ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_htkt_doi_tuong AS
SELECT d.id, d.ma_doi_tuong, d.ma_xa, au.id AS ward_id, au.name AS ten_xa,
       CASE WHEN au.name ILIKE 'Phường%' THEN 'PHUONG' WHEN au.name ILIKE 'Đặc khu%' THEN 'DAC_KHU' ELSE 'XA' END AS loai_dvhc,
       d.linh_vuc, d.ten, d.cap_duong, d.phan_loai_do_thi, d.thon,
       d.so_hieu, d.sh_so, d.sh_chu_cai, d.sh_trang_thai, d.sh_so_qd, d.sh_ngay_qd,
       CASE d.cap_duong WHEN 'DUONG_XA' THEN 'UBND tỉnh' WHEN 'DUONG_THON' THEN 'UBND cấp xã' END AS co_quan_dat_so_hieu,
       COALESCE(d.so_hieu, d.so_hieu_khac) AS so_hieu_hien_thi,
       COALESCE(d.ten, d.so_hieu, d.so_hieu_khac) AS nhan,
       d.so_hieu_cu, d.ten_cu,
       d.tuyen_duong_id, td.ma_doi_tuong AS tuyen_ma, COALESCE(td.so_hieu, td.so_hieu_khac) AS tuyen_so_hieu, td.ten AS tuyen_ten,
       d.street_id, st.code AS street_code,
       d.diem_dau, d.diem_cuoi, d.vi_tri, d.chieu_dai_m, d.chieu_dai_gis_m,
       CASE WHEN d.chieu_dai_m > 0 AND d.chieu_dai_gis_m > 0
            THEN round(100 * (d.chieu_dai_gis_m - d.chieu_dai_m) / d.chieu_dai_m, 1) END AS lech_chieu_dai_pct,
       d.dien_tich_m2, d.dien_tich_gis_m2, d.so_luong, d.be_rong_nen_m, d.be_rong_mat_m, d.ket_cau_mat,
       d.nam_su_dung, d.tinh_trang, d.don_vi_quan_ly, d.de_xuat_dieu_chinh, d.thong_so,
       d.geometry IS NOT NULL AS co_gis, d.tam_lat, d.tam_lng, d.ngoai_ranh_pct,
       (SELECT count(*) FROM htkt_doi_tuong c WHERE c.tuyen_duong_id = d.id AND c.deleted_at IS NULL) AS so_doi_tuong_tren_tuyen,
       ( (SELECT count(*) FROM report_duong r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_dien_cs r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_thoat_nuoc r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_cay_xanh r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_cong_vien r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_cap_nuoc r WHERE r."doiTuongId" = d.id)
       + (SELECT count(*) FROM report_bai_do_xe r WHERE r."doiTuongId" = d.id) ) AS so_dong_bao_cao,
       d.ghi_chu, d.created_at, d.updated_at
  FROM htkt_doi_tuong d
  JOIN administrative_units au ON au.code = d.ma_xa
  LEFT JOIN htkt_doi_tuong td ON td.id = d.tuyen_duong_id AND td.deleted_at IS NULL
  LEFT JOIN streets st ON st.id = d.street_id
 WHERE d.deleted_at IS NULL;

-- Sử dụng dải số theo xã (sức chứa = số lượng số × 13: số tròn + 12 chữ cái B…N).
CREATE OR REPLACE VIEW v_dai_so_hieu_xa AS
SELECT au.code AS ma_xa, au.id AS ward_id, au.name AS ten_xa,
       au."soHieuDxTu" AS dx_tu, au."soHieuDxDen" AS dx_den,
       (SELECT count(*) FROM htkt_doi_tuong d WHERE d.ma_xa = au.code AND d.cap_duong = 'DUONG_XA'
           AND d.sh_so IS NOT NULL AND d.deleted_at IS NULL) AS dx_da_dung,
       (au."soHieuDxDen" - au."soHieuDxTu" + 1) * 13 AS dx_suc_chua,
       au."soHieuDthTu" AS dth_tu, au."soHieuDthDen" AS dth_den,
       (SELECT count(*) FROM htkt_doi_tuong d WHERE d.ma_xa = au.code AND d.cap_duong = 'DUONG_THON'
           AND d.sh_so IS NOT NULL AND d.deleted_at IS NULL) AS dth_da_dung,
       (au."soHieuDthDen" - au."soHieuDthTu" + 1) * 13 AS dth_suc_chua,
       au."soHieuCanCu" AS can_cu
  FROM administrative_units au
 WHERE au."soHieuDxTu" IS NOT NULL;

-- Tổng hợp theo xã × lĩnh vực (bảng điều khiển, đối soát với Biểu mẫu).
CREATE OR REPLACE VIEW v_htkt_doi_tuong_tong_hop AS
SELECT d.ma_xa, au.name AS ten_xa, d.linh_vuc,
       count(*) AS so_doi_tuong,
       round(sum(d.chieu_dai_m) / 1000, 3) AS tong_chieu_dai_km,
       round(sum(d.chieu_dai_gis_m) / 1000, 3) AS tong_chieu_dai_gis_km,
       sum(d.dien_tich_m2) AS tong_dien_tich_m2,
       sum(d.so_luong) AS tong_so_luong,
       count(*) FILTER (WHERE d.geometry IS NOT NULL) AS so_co_gis,
       count(*) FILTER (WHERE d.sh_so IS NOT NULL) AS so_co_so_hieu
  FROM htkt_doi_tuong d JOIN administrative_units au ON au.code = d.ma_xa
 WHERE d.deleted_at IS NULL
 GROUP BY d.ma_xa, au.name, d.linh_vuc;

COMMIT;
