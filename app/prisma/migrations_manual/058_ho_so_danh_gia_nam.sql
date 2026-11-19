-- ============================================================================
-- Migration 058 — Hồ sơ đánh giá cuối năm (PATCH V7.1.1). Duyệt triển khai: chờ người dùng (18/11/2026).
-- Đã thử áp / áp lại / hoàn tác trên bản sao ql_htkt_thu051 (17-18/11/2026); qua phản biện Codex cùng mã ứng dụng.
-- Chỉ THÊM 3 bảng + 3 quyền (cấp cho vai trò admin); không sửa bảng cũ, không đổi dữ liệu hiện có → tương thích ngược.
-- Hoàn tác: 058_ho_so_danh_gia_nam_rollback.sql.
--
-- Migration 058 — Hồ sơ đánh giá cuối năm (PATCH V7.1.1)
--
-- Vì sao cần bảng mới: office_annual_evaluations chỉ lưu MỨC xếp loại + số quyết định, không
-- có tự đánh giá, nhận xét, điểm, KPI các quý, trạng thái quy trình 8 bước. Bảng đó GIỮ NGUYÊN
-- và chỉ được ghi (bởi mã ứng dụng) khi hồ sơ ở bước "Đã phê duyệt" loại CBCCVC.
--
-- Chỉ thêm 3 bảng mới, không sửa bảng cũ, không đổi dữ liệu hiện có. Không có dữ liệu Đảng nào
-- được sao từ can_bo: hồ sơ loại DANG_VIEN chỉ chứa nội dung kiểm điểm do người dùng nhập và
-- được tách quyền xem ở tầng ứng dụng (office:party_review_view).
--
-- Quyết định thiết kế:
--   - loaiHoSo: 'CBCCVC' (đánh giá công chức, viên chức, người lao động) hoặc 'DANG_VIEN'
--     (kiểm điểm đảng viên). Mỗi người mỗi năm tối đa 1 hồ sơ mỗi loại.
--   - trangThai: 8 bước theo PATCH V7.1.1. CHECK ở CSDL để đường ghi nào cũng không tạo trạng thái lạ.
--   - Mức xếp loại do người có thẩm quyền phê duyệt (mucPheDuyet) tách khỏi mức tự đề xuất
--     (mucDeXuat). CHECK: đã phê duyệt thì phải có người phê duyệt, thời điểm, và mức.
--   - nhanXet jsonb: mảng đoạn {muc, noiDung, nguon[], nguoiSua, suaLuc}; sửa từng đoạn không
--     tạo lại cả hồ sơ.
--   - diemQuy jsonb: điểm KPI 4 quý theo Mẫu số 04 (người dùng nhập; hệ thống KHÔNG tự suy).
--   - toChucId: ghi nhận phòng TẠI THỜI ĐIỂM đánh giá (người chuyển vị trí trong năm), không phải
--     cờ tên đơn vị; tên đơn vị vẫn suy từ khoá ngoại.
--   - Người phê duyệt: khoá ngoại KHÔNG có ON DELETE SET NULL (CHECK buộc đã duyệt thì phải có người duyệt) nên xoá cứng
--     user đã từng phê duyệt sẽ bị từ chối; hệ thống dùng khoá mềm tài khoản.
--   - Xoá cứng can_bo thì hồ sơ đi theo (ON DELETE CASCADE) như các bảng office_* khác;
--     hệ thống mặc định khoá mềm nên không xảy ra trong vận hành thường.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.office_year_reviews (
  "id"              text PRIMARY KEY,
  "canBoId"         text        NOT NULL REFERENCES public.can_bo("id") ON DELETE CASCADE,
  "nam"             integer     NOT NULL,
  "loaiHoSo"        text        NOT NULL DEFAULT 'CBCCVC',
  "trangThai"       text        NOT NULL DEFAULT 'DU_THAO',
  "toChucId"        text        REFERENCES public.to_chuc("id"),
  "mauApDung"       text,
  "vaiTroDanhGia"   text,
  "tuDanhGia"       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "diemChung"       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "diemQuy"         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "diemKpiTong"     numeric(6,3),
  "tongDiem"        numeric(6,3),
  "nhanXet"         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  "nhanXetLanhDao"  text,
  -- Dữ liệu NHẬP theo biểu mẫu (Mẫu 2A/2B/2C phần A, tự nhận mức, dòng KPI Mẫu 04, bảng III, Mẫu 03):
  -- cấu trúc ở app/lib/danh-gia-nam/bieu-mau-du-lieu.ts, ứng dụng chỉ ghi các khoá có trong danh sách.
  "bieuMau"         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "mucDeXuat"       text,
  "mucPheDuyet"     text,
  "pheDuyetById"    text        REFERENCES public.users("id"),
  "pheDuyetAt"      timestamptz,
  "soQuyetDinh"     text,
  "ghiChu"          text,
  "createdById"     text        REFERENCES public.users("id") ON DELETE SET NULL,
  "createdAt"       timestamptz NOT NULL DEFAULT now(),
  "updatedAt"       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_year_reviews_nam_chk CHECK ("nam" BETWEEN 2000 AND 2100),
  CONSTRAINT office_year_reviews_loai_chk CHECK ("loaiHoSo" IN ('CBCCVC', 'DANG_VIEN')),
  CONSTRAINT office_year_reviews_trangthai_chk CHECK ("trangThai" IN
    ('DU_THAO', 'TU_DANH_GIA', 'GUI_NHAN_XET', 'TONG_HOP', 'HOP_DANH_GIA', 'TRINH_PHE_DUYET', 'DA_PHE_DUYET', 'LUU_HO_SO')),
  CONSTRAINT office_year_reviews_muc_de_xuat_chk CHECK ("mucDeXuat" IS NULL OR "mucDeXuat" IN
    ('HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU')),
  CONSTRAINT office_year_reviews_muc_duyet_chk CHECK ("mucPheDuyet" IS NULL OR "mucPheDuyet" IN
    ('HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU')),
  CONSTRAINT office_year_reviews_diem_chk CHECK (
    ("diemKpiTong" IS NULL OR "diemKpiTong" BETWEEN 0 AND 100) AND ("tongDiem" IS NULL OR "tongDiem" BETWEEN 0 AND 100)),
  -- Đã phê duyệt/lưu thì phải có đủ: mức, người duyệt, thời điểm. Chưa tới bước đó thì chưa có mức chính thức.
  CONSTRAINT office_year_reviews_pheduyet_chk CHECK (
    ("trangThai" IN ('DA_PHE_DUYET', 'LUU_HO_SO')
       AND "mucPheDuyet" IS NOT NULL AND "pheDuyetById" IS NOT NULL AND "pheDuyetAt" IS NOT NULL)
    OR ("trangThai" NOT IN ('DA_PHE_DUYET', 'LUU_HO_SO') AND "mucPheDuyet" IS NULL)
  )
);

-- Mỗi người mỗi năm mỗi loại hồ sơ tối đa một bản
CREATE UNIQUE INDEX IF NOT EXISTS office_year_reviews_canbo_nam_loai_uq
  ON public.office_year_reviews ("canBoId", "nam", "loaiHoSo");
CREATE INDEX IF NOT EXISTS office_year_reviews_nam_trangthai_idx ON public.office_year_reviews ("nam", "trangThai");
CREATE INDEX IF NOT EXISTS office_year_reviews_tochuc_idx ON public.office_year_reviews ("toChucId");
CREATE INDEX IF NOT EXISTS office_year_reviews_pheduyet_idx ON public.office_year_reviews ("pheDuyetById");
CREATE INDEX IF NOT EXISTS office_year_reviews_createdby_idx ON public.office_year_reviews ("createdById");

-- Nhật ký bước quy trình + sửa nội dung + xem hồ sơ Đảng (phục vụ kiểm tra "truy cập ngoài thẩm quyền")
CREATE TABLE IF NOT EXISTS public.office_year_review_logs (
  "id"         text PRIMARY KEY,
  "reviewId"   text        NOT NULL REFERENCES public.office_year_reviews("id") ON DELETE CASCADE,
  "loai"       text        NOT NULL,
  "tuTrangThai" text,
  "denTrangThai" text,
  "userId"     text        REFERENCES public.users("id") ON DELETE SET NULL,
  "lyDo"       text,
  "chiTiet"    jsonb,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_year_review_logs_loai_chk CHECK ("loai" IN ('CHUYEN_BUOC', 'TRA_VE', 'SUA_NOI_DUNG', 'XEM_HO_SO', 'TU_CHOI_TRUY_CAP'))
);
CREATE INDEX IF NOT EXISTS office_year_review_logs_review_idx ON public.office_year_review_logs ("reviewId", "createdAt");
CREATE INDEX IF NOT EXISTS office_year_review_logs_user_idx ON public.office_year_review_logs ("userId");

-- Đánh giá tập thể phòng (Mẫu số 01). Mức xếp loại tập thể do tập thể NHẬP; KHÔNG tính từ cá nhân.
CREATE TABLE IF NOT EXISTS public.office_year_dept_reviews (
  "id"           text PRIMARY KEY,
  "toChucId"     text        NOT NULL REFERENCES public.to_chuc("id"),
  "nam"          integer     NOT NULL,
  "trangThai"    text        NOT NULL DEFAULT 'DU_THAO',
  "duThaoNhanXet" jsonb      NOT NULL DEFAULT '[]'::jsonb,
  -- Dữ liệu NHẬP Mẫu 01 (phần A, 6 tiêu chí chung, KPI nhóm A/B, bảng III)
  "bieuMau"      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "diemChung"    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "diemKpiTong"  numeric(6,3),
  "mucTuDeXuat"  text,
  "mucPheDuyet"  text,
  "pheDuyetById" text        REFERENCES public.users("id"),
  "pheDuyetAt"   timestamptz,
  "ghiChu"       text,
  "createdById"  text        REFERENCES public.users("id") ON DELETE SET NULL,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_year_dept_reviews_nam_chk CHECK ("nam" BETWEEN 2000 AND 2100),
  CONSTRAINT office_year_dept_reviews_trangthai_chk CHECK ("trangThai" IN
    ('DU_THAO', 'TU_DANH_GIA', 'GUI_NHAN_XET', 'TONG_HOP', 'HOP_DANH_GIA', 'TRINH_PHE_DUYET', 'DA_PHE_DUYET', 'LUU_HO_SO')),
  CONSTRAINT office_year_dept_reviews_muc_chk CHECK (
    ("mucTuDeXuat" IS NULL OR "mucTuDeXuat" IN ('HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU'))
    AND ("mucPheDuyet" IS NULL OR "mucPheDuyet" IN ('HOAN_THANH_XUAT_SAC_NHIEM_VU', 'HOAN_THANH_TOT_NHIEM_VU', 'HOAN_THANH_NHIEM_VU', 'KHONG_HOAN_THANH_NHIEM_VU'))),
  CONSTRAINT office_year_dept_reviews_pheduyet_chk CHECK (
    ("trangThai" IN ('DA_PHE_DUYET', 'LUU_HO_SO')
       AND "mucPheDuyet" IS NOT NULL AND "pheDuyetById" IS NOT NULL AND "pheDuyetAt" IS NOT NULL)
    OR ("trangThai" NOT IN ('DA_PHE_DUYET', 'LUU_HO_SO') AND "mucPheDuyet" IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS office_year_dept_reviews_tochuc_nam_uq ON public.office_year_dept_reviews ("toChucId", "nam");
CREATE INDEX IF NOT EXISTS office_year_dept_reviews_pheduyet_idx ON public.office_year_dept_reviews ("pheDuyetById");
CREATE INDEX IF NOT EXISTS office_year_dept_reviews_createdby_idx ON public.office_year_dept_reviews ("createdById");

-- Quyền mới của module office (cấp cho admin; cấp cho người/nhóm khác qua giao diện Cài đặt > Vai trò)
INSERT INTO permissions (id, module, action, description) VALUES
  (gen_random_uuid()::text, 'office', 'annual_evaluation_approve', 'Phê duyệt hồ sơ đánh giá, xếp loại cuối năm'),
  (gen_random_uuid()::text, 'office', 'party_review_view',         'Xem hồ sơ kiểm điểm đảng viên, thông tin Đảng'),
  (gen_random_uuid()::text, 'office', 'party_review_manage',       'Lập, quản lý hồ sơ kiểm điểm đảng viên')
ON CONFLICT (module, action) DO NOTHING;

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.module = 'office' AND p.action IN ('annual_evaluation_approve', 'party_review_view', 'party_review_manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;

-- Bảng truy cập bằng SQL thô (không thêm model Prisma). Sổ đã áp: C:/Troly/deploy/applied_migrations.txt (AutoDeploy tự ghi).
