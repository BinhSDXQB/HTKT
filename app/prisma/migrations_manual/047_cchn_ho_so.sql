-- ============================================================================
-- Migration 047 — HỒ SƠ ĐỀ NGHỊ CẤP CHỨNG CHỈ HÀNH NGHỀ HOẠT ĐỘNG XÂY DỰNG (Phòng QLHĐ-XD)
--
-- Căn cứ (đọc nguyên văn, 14/10/2026): NĐ 212/2026/NĐ-CP Đ27–40, Đ55; Luật Xây dựng 135/2025 Đ88–90.
-- Báo cáo kiểm chứng: C:\Troly\HTKT\Kiem_chung_CCHN_Giam_sat_thi_cong_ND212_2026.md
--
-- Thiết kế:
--   - cchn_ho_so: MỘT hồ sơ đề nghị (cấp mới / cấp lại / chuyển đổi — Đ29 k1) + tiến trình xử lý (Đ30).
--     Thành phần hồ sơ (Đ39) lưu JSONB thanh_phan {key: true/false} — danh mục key ở lib/cchn/danh-muc.ts.
--   - cchn_kinh_nghiem: các công trình/dự án/quy hoạch kê khai kinh nghiệm (Đ34–37, Đ39 k1 điểm đ).
--   - Chứng chỉ ĐÃ CẤP vẫn ghi ở httt_nang_luc_ca_nhan (migration 040) — hồ sơ trỏ tới qua nang_luc_ca_nhan_id.
--   - KHÔNG ràng buộc điều kiện năng lực bằng CHECK: hồ sơ nộp sai điều kiện vẫn phải tiếp nhận để trả lời
--     "không đủ điều kiện"; việc đánh giá do lib/cchn/danh-gia.ts (sơ bộ) và Hội đồng (Đ40).
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/047_cchn_ho_so.sql
-- Hoàn nguyên: 047_cchn_ho_so_rollback.sql
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS cchn_ho_so (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ma_ho_so              TEXT NOT NULL UNIQUE,                         -- CCHN-2026-0001
  loai_thu_tuc          TEXT NOT NULL CHECK (loai_thu_tuc IN ('CAP_MOI','CAP_LAI','CHUYEN_DOI')),  -- Đ29 k1
  truong_hop            TEXT,                                         -- LAN_DAU / DIEU_CHINH_HANG / MAT_HU_HONG …
  hinh_thuc_nop         TEXT NOT NULL DEFAULT 'TRUC_TUYEN' CHECK (hinh_thuc_nop IN ('TRUC_TIEP','BUU_CHINH','TRUC_TUYEN')),  -- Đ30 k1
  ngay_nop              DATE NOT NULL,                                -- = thời điểm đề nghị cấp (mốc 10 năm Đ33 k3)

  -- Người đề nghị
  ho_ten                TEXT NOT NULL,
  ngay_sinh             DATE,
  gioi_tinh             TEXT CHECK (gioi_tinh IS NULL OR gioi_tinh IN ('NAM','NU')),
  la_cong_dan_vn        BOOLEAN NOT NULL DEFAULT TRUE,
  quoc_tich             TEXT,
  loai_ma               TEXT NOT NULL DEFAULT 'SO_DINH_DANH_CN' CHECK (loai_ma IN ('SO_DINH_DANH_CN','HO_CHIEU')),  -- Đ19
  ma_dinh_danh          TEXT,                                         -- số định danh cá nhân / hộ chiếu
  dien_thoai            TEXT,
  email                 TEXT,
  dia_chi               TEXT,
  don_vi_cong_tac       TEXT,

  -- Trình độ chuyên môn (Đ33 k2, k4; Đ39 k1 điểm c)
  trinh_do              TEXT CHECK (trinh_do IS NULL OR trinh_do IN ('TIEN_SI','THAC_SI','DAI_HOC','CAO_DANG','TRUNG_CAP','KHAC')),
  chuyen_nganh          TEXT,
  co_so_dao_tao         TEXT,
  nam_tot_nghiep        INTEGER CHECK (nam_tot_nghiep IS NULL OR nam_tot_nghiep BETWEEN 1950 AND 2100),
  so_hieu_van_bang      TEXT,
  van_bang_nuoc_ngoai   BOOLEAN NOT NULL DEFAULT FALSE,
  van_bang_tren_csdl    BOOLEAN NOT NULL DEFAULT FALSE,               -- có trên CSDL ngành Giáo dục → không phải nộp

  -- Nội dung đề nghị (Đ28, Đ33)
  linh_vuc              TEXT CHECK (linh_vuc IS NULL OR linh_vuc IN ('KHAO_SAT','QUY_HOACH','THIET_KE','GIAM_SAT')),
  noi_dung              TEXT,                                         -- vd "Giám sát công tác xây dựng công trình"
  loai_cong_trinh       TEXT,                                         -- theo đơn; phạm vi theo Phụ lục II (chưa có trong kho)
  hang_de_nghi          TEXT CHECK (hang_de_nghi IS NULL OR hang_de_nghi IN ('I','II','III')),
  hanh_nghe_doc_lap     BOOLEAN NOT NULL DEFAULT FALSE,
  so_cchn_cu            TEXT,                                         -- chứng chỉ đã được cấp (nếu có) — Đ39 k1 điểm d, k2 điểm c
  ngay_bat_dau_kn       DATE,                                         -- thời điểm tham gia hoạt động xây dựng (Đ33 k5)
  nguon_bat_dau_kn      TEXT,                                         -- DON / HOP_DONG_LAO_DONG / BHXH …

  thanh_phan            JSONB NOT NULL DEFAULT '{}'::jsonb,           -- checklist Đ39

  -- Xử lý (Đ30)
  trang_thai            TEXT NOT NULL DEFAULT 'MOI_TIEP_NHAN' CHECK (trang_thai IN (
                          'MOI_TIEP_NHAN','YEU_CAU_BO_SUNG','DANG_XEM_XET','TRINH_HOI_DONG',
                          'DU_DIEU_KIEN','KHONG_DU_DIEU_KIEN','DA_CAP','DUNG_GIA_MAO')),
  ngay_yeu_cau_bo_sung  DATE,
  noi_dung_bo_sung      TEXT,
  ngay_nhan_du          DATE,                                         -- ngày nhận đủ hồ sơ hợp lệ
  ngay_hoi_dong         DATE,                                         -- ngày có kết quả đánh giá của Hội đồng
  hang_hoi_dong         TEXT CHECK (hang_hoi_dong IS NULL OR hang_hoi_dong IN ('I','II','III')),
  ket_luan_hoi_dong     TEXT,
  ngay_thong_bao        DATE,                                         -- ngày thông báo kết quả đánh giá
  ngay_cap              DATE,
  so_chung_chi          TEXT,
  nang_luc_ca_nhan_id   TEXT REFERENCES httt_nang_luc_ca_nhan(id) ON DELETE SET NULL,
  ghi_chu               TEXT,

  to_chuc_id            TEXT REFERENCES to_chuc(id) ON DELETE SET NULL,
  created_by_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT chk_cchn_da_cap CHECK (trang_thai <> 'DA_CAP' OR (ngay_cap IS NOT NULL AND so_chung_chi IS NOT NULL)),
  CONSTRAINT chk_cchn_ma_vn CHECK (la_cong_dan_vn = (loai_ma = 'SO_DINH_DANH_CN'))
);

CREATE INDEX IF NOT EXISTS idx_cchn_ho_so_trang_thai ON cchn_ho_so (trang_thai) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cchn_ho_so_ma_dd ON cchn_ho_so (ma_dinh_danh);
CREATE INDEX IF NOT EXISTS idx_cchn_ho_so_ngay_nop ON cchn_ho_so (ngay_nop DESC);
CREATE INDEX IF NOT EXISTS idx_cchn_ho_so_nlcn ON cchn_ho_so (nang_luc_ca_nhan_id);

CREATE TABLE IF NOT EXISTS cchn_kinh_nghiem (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ho_so_id          TEXT NOT NULL REFERENCES cchn_ho_so(id) ON DELETE CASCADE,
  stt               INTEGER NOT NULL DEFAULT 0,
  ten_cong_trinh    TEXT NOT NULL,                 -- công trình / dự án / đồ án quy hoạch
  dia_diem          TEXT,
  chu_dau_tu        TEXT,                          -- hoặc cơ quan tổ chức lập quy hoạch
  loai_cong_trinh   TEXT,
  cap_cong_trinh    TEXT CHECK (cap_cong_trinh IS NULL OR cap_cong_trinh IN ('DAC_BIET','I','II','III','IV')),  -- theo TT 34/2026 (Đ27 k9)
  nhom_du_an        TEXT CHECK (nhom_du_an IS NULL OR nhom_du_an IN ('QUAN_TRONG_QG','A','B','C')),             -- khảo sát địa hình Đ34
  cap_phe_duyet_qh  TEXT CHECK (cap_phe_duyet_qh IS NULL OR cap_phe_duyet_qh IN ('TTG','UBND_TINH','UBND_XA')),  -- quy hoạch Đ35
  loai_quy_hoach    TEXT,
  vai_tro           TEXT NOT NULL,                 -- GIAM_SAT_TRUONG / CHU_TRI_TK / THAM_GIA_GIAM_SAT …
  phan_viec         TEXT,                          -- phần việc thực hiện (đối chiếu "phần việc thuộc nội dung đề nghị")
  tu_ngay           DATE,
  den_ngay          DATE,                          -- thời điểm hoàn thành — dùng tính 10 năm (Đ33 k3)
  tai_lieu          TEXT CHECK (tai_lieu IS NULL OR tai_lieu IN ('QUYET_DINH_PHAN_CONG','XAC_NHAN_CDT','VAN_BAN_CQCM','HOP_DONG_NGHIEM_THU')),  -- Đ39 k1 điểm đ
  so_hieu_tai_lieu  TEXT,
  phu_hop_noi_dung  BOOLEAN,                       -- cán bộ đánh giá; NULL = chưa đánh giá, FALSE = loại khỏi tính
  ghi_chu           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_cchn_kn_ngay CHECK (tu_ngay IS NULL OR den_ngay IS NULL OR tu_ngay <= den_ngay)
);

CREATE INDEX IF NOT EXISTS idx_cchn_kn_ho_so ON cchn_kinh_nghiem (ho_so_id, stt);

COMMIT;
