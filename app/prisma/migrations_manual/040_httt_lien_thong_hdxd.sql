-- 040: LIÊN THÔNG Cơ sở dữ liệu quốc gia về hoạt động xây dựng
-- Căn cứ: Nghị định 212/2026/NĐ-CP (17/6/2026) + Thông tư 39/2026/TT-BXD.
-- Namespace httt_* (Hệ thống thông tin về hoạt động xây dựng). Additive, idempotent, có rollback.
-- Nguyên tắc (NĐ212): mỗi đối tượng gắn 1 MÃ ĐỊNH DANH duy nhất, dùng suốt vòng đời để
-- quản lý–liên kết–kế thừa–cập nhật; dữ liệu chủ = dữ liệu chung + mã định danh; kết quả TTHC
-- điện tử gắn mã định danh (Đ21). Trường chi tiết Phụ lục I/II TT39 → giữ ở truong_bo_sung JSONB.
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ─── 1. SỔ ĐĂNG KÝ MÃ ĐỊNH DANH (universal) — 4 nhóm CSDL quốc gia (Đ8/10/14/17/19) ───
CREATE TABLE IF NOT EXISTS httt_dinh_danh (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  loai_doi_tuong     TEXT NOT NULL
     CHECK (loai_doi_tuong IN ('QUY_HOACH','DU_AN','CONG_TRINH','NANG_LUC_CA_NHAN','NANG_LUC_TO_CHUC','DINH_MUC_GIA')),
  ma_dinh_danh       TEXT,                       -- mã do HTTT quốc gia khởi tạo (dãy/chuỗi ký tự)
  loai_ma            TEXT NOT NULL DEFAULT 'CHUOI_KY_TU'
     CHECK (loai_ma IN ('SO_DINH_DANH_CN','HO_CHIEU','MA_SO_DN','CHUOI_KY_TU')),  -- Đ19: CCCD|hộ chiếu|mã số DN
  bang_local         TEXT,                       -- bảng local đang liên kết (vd 'httt_nang_luc_ca_nhan')
  id_local           TEXT,                       -- id bản ghi local (liên kết mềm, không FK cứng)
  trang_thai_dong_bo TEXT NOT NULL DEFAULT 'CHUA_KHOI_TAO'
     CHECK (trang_thai_dong_bo IN ('CHUA_KHOI_TAO','DA_KHOI_TAO','DA_DONG_BO','LOI','CHO_DUYET')),
  la_du_lieu_mo      BOOLEAN NOT NULL DEFAULT false,  -- dữ liệu mở (Đ11/15/20) công bố cổng quốc gia
  thoi_diem_khoi_tao TIMESTAMPTZ,
  thoi_diem_dong_bo  TIMESTAMPTZ,
  phan_hoi_httt      JSONB,                      -- phản hồi từ HTTT quốc gia khi đồng bộ
  ghi_chu            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loai_doi_tuong, ma_dinh_danh),
  -- Đã khởi tạo/đồng bộ ⇒ bắt buộc có mã định danh:
  CHECK (trang_thai_dong_bo NOT IN ('DA_KHOI_TAO','DA_DONG_BO') OR ma_dinh_danh IS NOT NULL),
  -- Loại mã khớp loại đối tượng năng lực (Đ19): cá nhân=CCCD/hộ chiếu; tổ chức=mã số DN:
  CHECK (loai_doi_tuong <> 'NANG_LUC_CA_NHAN' OR loai_ma IN ('SO_DINH_DANH_CN','HO_CHIEU')),
  CHECK (loai_doi_tuong <> 'NANG_LUC_TO_CHUC' OR loai_ma = 'MA_SO_DN')
);
CREATE INDEX IF NOT EXISTS idx_httt_dd_local ON httt_dinh_danh(bang_local, id_local);
CREATE INDEX IF NOT EXISTS idx_httt_dd_trang_thai ON httt_dinh_danh(trang_thai_dong_bo);

-- ─── 2. NĂNG LỰC HĐXD — CÁ NHÂN (chứng chỉ hành nghề) — NĐ212 Đ18.2, Đ27-28 ─────────
CREATE TABLE IF NOT EXISTS httt_nang_luc_ca_nhan (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dinh_danh_id       TEXT REFERENCES httt_dinh_danh(id) ON DELETE SET NULL,
  ma_dinh_danh       TEXT,                       -- = số định danh cá nhân (CCCD) / số hộ chiếu (Đ19.3)
  loai_ma            TEXT NOT NULL DEFAULT 'SO_DINH_DANH_CN'
     CHECK (loai_ma IN ('SO_DINH_DANH_CN','HO_CHIEU')),
  ho_ten             TEXT NOT NULL,
  quoc_tich          TEXT,
  -- Dữ liệu CHUNG (dữ liệu chủ — Đ18.2.a):
  linh_vuc_hanh_nghe TEXT,                       -- khảo sát/QH/thiết kế/giám sát/QLDA/chỉ huy trưởng…
  hang_chung_chi     TEXT CHECK (hang_chung_chi IS NULL OR hang_chung_chi IN ('I','II','III')),
  thoi_han_chung_chi DATE,
  -- Dữ liệu CHI TIẾT (Đ18.2.b):
  co_so_dao_tao      TEXT,
  trinh_do_chuyen_mon TEXT,
  so_chung_chi       TEXT,
  loai_cap           TEXT CHECK (loai_cap IS NULL OR loai_cap IN ('CAP_MOI','CAP_LAI','CHUYEN_DOI')),  -- Đ29
  ly_do_cap          TEXT,                       -- tiểu tình huống (điều chỉnh/gia hạn…) — không đưa vào enum
  quyet_dinh_cap     TEXT,
  co_quan_cap        TEXT,
  ngay_cap           DATE,
  trang_thai         TEXT NOT NULL DEFAULT 'HIEU_LUC' CHECK (trang_thai IN ('HIEU_LUC','HET_HAN','THU_HOI')),
  ket_qua_dien_tu_path TEXT,                     -- kết quả TTHC điện tử gắn mã định danh (Đ21.6)
  truong_bo_sung     JSONB NOT NULL DEFAULT '{}'::jsonb,  -- trường Phụ lục I TT39
  to_chuc_id         TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  created_by_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_httt_nlcn_ma ON httt_nang_luc_ca_nhan(ma_dinh_danh);
CREATE INDEX IF NOT EXISTS idx_httt_nlcn_linhvuc ON httt_nang_luc_ca_nhan(linh_vuc_hanh_nghe);
CREATE INDEX IF NOT EXISTS idx_httt_nlcn_to_chuc ON httt_nang_luc_ca_nhan(to_chuc_id);

-- ─── 3. NĂNG LỰC HĐXD — TỔ CHỨC (chứng chỉ năng lực / công khai năng lực) — Đ18.3, Đ41 ──
CREATE TABLE IF NOT EXISTS httt_nang_luc_to_chuc (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dinh_danh_id       TEXT REFERENCES httt_dinh_danh(id) ON DELETE SET NULL,
  ma_so_dn           TEXT,                       -- mã định danh tổ chức = mã số doanh nghiệp (Đ19.4)
  ten_nha_thau       TEXT NOT NULL,              -- dữ liệu chung (Đ18.3.a)
  linh_vuc           TEXT,
  hang               TEXT CHECK (hang IS NULL OR hang IN ('I','II','III')),
  so_chung_chi_nang_luc TEXT,
  co_quan_cap        TEXT,
  ngay_cap           DATE,
  thoi_han           DATE,
  trang_thai         TEXT NOT NULL DEFAULT 'HIEU_LUC' CHECK (trang_thai IN ('HIEU_LUC','HET_HAN','THU_HOI')),
  ket_qua_dien_tu_path TEXT,                     -- kết quả TTHC điện tử gắn mã định danh (Đ21.6)
  thong_tin_nang_luc JSONB NOT NULL DEFAULT '{}'::jsonb,  -- dữ liệu chi tiết (Đ18.3.b)
  truong_bo_sung     JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Bảng 1/2 Phụ lục II TT39
  to_chuc_id         TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  created_by_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_httt_nltc_ma ON httt_nang_luc_to_chuc(ma_so_dn);
CREATE INDEX IF NOT EXISTS idx_httt_nltc_to_chuc ON httt_nang_luc_to_chuc(to_chuc_id);

-- ─── 4. NHẬT KÝ ĐỒNG BỘ / KẾT NỐI với HTTT quốc gia (kết nối, chia sẻ — Đ22-25) ──────
CREATE TABLE IF NOT EXISTS httt_dong_bo_log (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dinh_danh_id   TEXT REFERENCES httt_dinh_danh(id) ON DELETE CASCADE,
  hanh_dong      TEXT NOT NULL CHECK (hanh_dong IN ('KHOI_TAO','CAP_NHAT','TRA_CUU','CHIA_SE','DIEU_CHINH')),
  ket_qua        TEXT NOT NULL DEFAULT 'CHO' CHECK (ket_qua IN ('THANH_CONG','LOI','CHO')),
  thong_diep     TEXT,
  payload        JSONB,
  nguoi_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  thoi_diem      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_httt_log_dd ON httt_dong_bo_log(dinh_danh_id);
