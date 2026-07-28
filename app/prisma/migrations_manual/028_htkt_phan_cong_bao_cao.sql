-- Module PHÂN CÔNG ĐỘNG & BÁO CÁO ĐỊNH KỲ — Phòng Hạ tầng kỹ thuật (TB 01/TB-HTKT
-- ngày 10/10/2025). Thiết kế động theo toChucId để nhân rộng cho các phòng khác.
--   1. phan_cong_linh_vuc : ai phụ trách lĩnh vực nào (sửa được, thay người làm thay).
--   2. phan_cong_dinh_ky  : mẫu công việc lặp lại (báo cáo tháng/quý/năm) để TỰ SINH.
--   3. cong_viec.dinhKyKey: khoá chống trùng khi tự sinh việc định kỳ (idempotent).
-- Việc tự sinh dùng lại bảng cong_viec (mig 025) → thống kê/giao việc/làm thay sẵn có.
-- Additive, idempotent. Enum lưu dạng text (đồng nhất các migration trước).

-- ── 1. PHÂN CÔNG LĨNH VỰC (động) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phan_cong_linh_vuc (
  id                text PRIMARY KEY,
  "toChucId"        text NOT NULL REFERENCES to_chuc(id),
  "linhVucKey"      text NOT NULL,                        -- cap-nuoc, thoat-nuoc...
  "linhVucTen"      text NOT NULL,
  "nguoiPhuTrachId" text REFERENCES users(id),            -- phụ trách chính
  "nguoiPhoiHopIds" text[] NOT NULL DEFAULT '{}',         -- cùng làm / làm thay
  "ghiChu"          text,
  "thuTu"           integer NOT NULL DEFAULT 0,
  "isActive"        boolean NOT NULL DEFAULT true,
  "createdAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("toChucId", "linhVucKey")
);
CREATE INDEX IF NOT EXISTS "phan_cong_linh_vuc_toChucId_idx"        ON phan_cong_linh_vuc ("toChucId");
CREATE INDEX IF NOT EXISTS "phan_cong_linh_vuc_nguoiPhuTrachId_idx" ON phan_cong_linh_vuc ("nguoiPhuTrachId");

-- ── 2. ĐỊNH MỨC CÔNG VIỆC ĐỊNH KỲ (mẫu để tự sinh) ──────────────────────────
CREATE TABLE IF NOT EXISTS phan_cong_dinh_ky (
  id              text PRIMARY KEY,
  "toChucId"      text NOT NULL REFERENCES to_chuc(id),
  ten             text NOT NULL,                          -- mẫu tiêu đề, hỗ trợ {linhVuc} {ky}
  "moTa"          text,
  "tanSuat"       text NOT NULL DEFAULT 'THANG',          -- THANG|QUY|SAU_THANG|NAM
  "phamVi"        text NOT NULL DEFAULT 'MOI_LINH_VUC',   -- MOI_LINH_VUC (mỗi lĩnh vực 1 việc, gắn người phụ trách) | CA_NHAN
  "nguoiPhuTrachId" text REFERENCES users(id),            -- dùng khi phamVi=CA_NHAN
  "loaiId"        text REFERENCES cong_viec_loai(id),
  "uuTien"        text NOT NULL DEFAULT 'TRUNG_BINH',
  "soNgayHetHan"  integer NOT NULL DEFAULT 5,             -- hạn = đầu kỳ kế tiếp + n ngày
  "thuTu"         integer NOT NULL DEFAULT 0,
  "isActive"      boolean NOT NULL DEFAULT true,
  "createdAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "phan_cong_dinh_ky_toChucId_idx" ON phan_cong_dinh_ky ("toChucId");

-- ── 3. KHOÁ CHỐNG TRÙNG cho việc tự sinh trên cong_viec ─────────────────────
ALTER TABLE cong_viec ADD COLUMN IF NOT EXISTS "dinhKyKey" text;
-- NULL được phép trùng (việc thường); chỉ duy nhất với việc tự sinh.
CREATE UNIQUE INDEX IF NOT EXISTS "cong_viec_dinhKyKey_uniq"
  ON cong_viec ("dinhKyKey") WHERE "dinhKyKey" IS NOT NULL;

-- ── 4. SEED phân công lĩnh vực Phòng HTKT (TB 01/TB-HTKT 10/10/2025) ─────────
-- toChucId Phòng HTKT = cmpz3u7uf000bf0umpijd8stn. User id = CCCD đăng nhập.
INSERT INTO phan_cong_linh_vuc (id, "toChucId", "linhVucKey", "linhVucTen", "nguoiPhuTrachId", "thuTu") VALUES
  ('pclv_htkt_capnuoc',  'cmpz3u7uf000bf0umpijd8stn', 'cap-nuoc',          'Cấp nước sạch đô thị',        'cmprpsays0012vsumqp5vbisl', 1),
  ('pclv_htkt_thoatnuoc','cmpz3u7uf000bf0umpijd8stn', 'thoat-nuoc',        'Thoát nước & xử lý nước thải','cmprpsb4g0031vsumwt4f08n8', 2),
  ('pclv_htkt_cayxanh',  'cmpz3u7uf000bf0umpijd8stn', 'cay-xanh',          'Công viên, cây xanh đô thị',  'cmprpsb34002hvsumnkgi8i6x', 3),
  ('pclv_htkt_chieusang','cmpz3u7uf000bf0umpijd8stn', 'chieu-sang',        'Chiếu sáng đô thị',           'cmprpsat90006vsumdrojhivy', 4),
  ('pclv_htkt_nghiatrang','cmpz3u7uf000bf0umpijd8stn','nghia-trang',       'Nghĩa trang & cơ sở hỏa táng','cmprpsb34002hvsumnkgi8i6x', 5),
  ('pclv_htkt_giaothong','cmpz3u7uf000bf0umpijd8stn', 'giao-thong-do-thi', 'Hạ tầng giao thông đô thị',   'cmprpsb4w0038vsumskfuipei', 6),
  ('pclv_htkt_ngam',     'cmpz3u7uf000bf0umpijd8stn', 'khong-gian-ngam',   'Không gian xây dựng ngầm',    'cmprpsb4g0031vsumwt4f08n8', 7),
  ('pclv_htkt_dungchung','cmpz3u7uf000bf0umpijd8stn', 'su-dung-chung',     'Sử dụng chung công trình HTKT','cmprpsat90006vsumdrojhivy', 8)
ON CONFLICT (id) DO NOTHING;

-- ── 5. SEED định mức việc định kỳ Phòng HTKT (mỗi lĩnh vực → người phụ trách) ─
INSERT INTO phan_cong_dinh_ky (id, "toChucId", ten, "moTa", "tanSuat", "phamVi", "loaiId", "soNgayHetHan", "thuTu") VALUES
  ('pcdk_htkt_thang', 'cmpz3u7uf000bf0umpijd8stn',
     'Báo cáo công tác tháng {ky} — {linhVuc}',
     'Tổng hợp kết quả thực hiện, số liệu, vướng mắc lĩnh vực phụ trách phục vụ giao ban tháng.',
     'THANG', 'MOI_LINH_VUC', 'cvl_chung_baocao', 5, 1),
  ('pcdk_htkt_quy', 'cmpz3u7uf000bf0umpijd8stn',
     'Báo cáo quý {ky} — {linhVuc}',
     'Báo cáo số lượng, khối lượng, kết quả công việc quý của lĩnh vực phụ trách.',
     'QUY', 'MOI_LINH_VUC', 'cvl_chung_baocao', 7, 2),
  ('pcdk_htkt_nam', 'cmpz3u7uf000bf0umpijd8stn',
     'Báo cáo tổng kết năm {ky} — {linhVuc}',
     'Tổng kết kết quả thực hiện nhiệm vụ năm, đánh giá, phương hướng năm sau của lĩnh vực phụ trách.',
     'NAM', 'MOI_LINH_VUC', 'cvl_chung_baocao', 10, 3)
ON CONFLICT (id) DO NOTHING;
