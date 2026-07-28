-- Commit: Quản lý nghỉ phép ĐA CẤP — quy trình tự tạo đơn → Trưởng phòng → Lãnh đạo Sở ký
--   → Văn phòng Sở xem xét → (nếu đề nghị ứng lương) Phòng KH-TC cho ứng lương → Hoàn tất.
-- ALTER TYPE ... ADD VALUE KHÔNG chạy trong transaction → KHÔNG bọc BEGIN/COMMIT cho phần enum.
-- Mỗi câu lệnh psql auto-commit riêng nên giá trị enum mới dùng được ở các UPDATE phía sau. Idempotent.

-- 1. Bổ sung trạng thái mới (giữ legacy CHO_DUYET/DA_DUYET cho dòng cũ)
ALTER TYPE "TrangThaiNghiPhep" ADD VALUE IF NOT EXISTS 'CHO_TRUONG_PHONG';
ALTER TYPE "TrangThaiNghiPhep" ADD VALUE IF NOT EXISTS 'CHO_LANH_DAO_SO';
ALTER TYPE "TrangThaiNghiPhep" ADD VALUE IF NOT EXISTS 'CHO_VAN_PHONG';
ALTER TYPE "TrangThaiNghiPhep" ADD VALUE IF NOT EXISTS 'CHO_TAI_CHINH';
ALTER TYPE "TrangThaiNghiPhep" ADD VALUE IF NOT EXISTS 'HOAN_TAT';

-- 2. Thêm cột quy trình + mẫu đơn (idempotent)
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "deNghiUngLuong"  boolean NOT NULL DEFAULT false;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "soTienUng"       double precision;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "nguoiBanGiao"    text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "noiNghi"         text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "dienThoaiLienHe" text;

-- Cấp 1: Trưởng phòng
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "tpDuyetId" text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "tpNgay"    timestamp(3);
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "tpYKien"   text;
-- Cấp 2: Lãnh đạo Sở ký
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "ldsKyId" text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "ldsNgay"  timestamp(3);
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "ldsYKien" text;
-- Cấp 3: Văn phòng Sở xem xét / vào sổ
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "vpsId"   text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "vpsNgay" timestamp(3);
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "vpsYKien" text;
-- Cấp 4: Phòng KH-TC cho ứng lương
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "khtcId"   text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "khtcNgay" timestamp(3);
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "khtcYKien" text;

-- Từ chối: ghi rõ cấp + lý do
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "tuChoiCap"    text;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "ghiChuTuChoi" text;

-- Snapshot định mức phép năm lúc tạo (để in đơn & lưu vết)
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "dinhMucPhep"  double precision;
ALTER TABLE office_leave_requests ADD COLUMN IF NOT EXISTS "daNghiTruoc"  double precision;

-- 3. Chuyển dòng cũ sang trạng thái mới tương đương
UPDATE office_leave_requests SET "trangThai" = 'CHO_TRUONG_PHONG' WHERE "trangThai" = 'CHO_DUYET';
UPDATE office_leave_requests SET "trangThai" = 'HOAN_TAT'         WHERE "trangThai" = 'DA_DUYET';
