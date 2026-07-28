-- 033: Bổ sung index cho các cột khoá ngoại đang thiếu (rà soát CSDL 03/07/2026).
-- Chỉ thêm trên bảng ĐANG CÓ DỮ LIỆU hoặc chắc chắn tăng trưởng; các bảng legacy
-- trống (assets/incidents/work_orders...) chưa thêm — xử lý khi quyết định số phận.
-- Tên index theo quy ước Prisma (<bảng>_<cột>_idx) để khớp @@index trong schema.prisma.
-- Idempotent: IF NOT EXISTS, chạy lại an toàn.

-- Đăng nhập / phân quyền (mọi request đều join)
CREATE INDEX IF NOT EXISTS "users_roleId_idx" ON users ("roleId");
CREATE INDEX IF NOT EXISTS "users_wardId_idx" ON users ("wardId");
CREATE INDEX IF NOT EXISTS "role_permissions_permissionId_idx" ON role_permissions ("permissionId");

-- Cây đơn vị hành chính + tuyến đường
CREATE INDEX IF NOT EXISTS "administrative_units_parentId_idx" ON administrative_units ("parentId");
CREATE INDEX IF NOT EXISTS "streets_wardId_idx" ON streets ("wardId");

-- 7 biểu mẫu báo cáo phường/xã (~4.900 dòng, tăng theo năm)
CREATE INDEX IF NOT EXISTS "report_duong_createdById_idx"      ON report_duong ("createdById");
CREATE INDEX IF NOT EXISTS "report_dien_cs_createdById_idx"    ON report_dien_cs ("createdById");
CREATE INDEX IF NOT EXISTS "report_thoat_nuoc_createdById_idx" ON report_thoat_nuoc ("createdById");
CREATE INDEX IF NOT EXISTS "report_cay_xanh_createdById_idx"   ON report_cay_xanh ("createdById");
CREATE INDEX IF NOT EXISTS "report_cong_vien_createdById_idx"  ON report_cong_vien ("createdById");
CREATE INDEX IF NOT EXISTS "report_cap_nuoc_createdById_idx"   ON report_cap_nuoc ("createdById");
CREATE INDEX IF NOT EXISTS "report_bai_do_xe_createdById_idx"  ON report_bai_do_xe ("createdById");
CREATE INDEX IF NOT EXISTS "ward_reports_createdById_idx"      ON ward_reports ("createdById");

-- Quản lý công việc phòng/ban
CREATE INDEX IF NOT EXISTS "cong_viec_nguoiGiaoId_idx" ON cong_viec ("nguoiGiaoId");
CREATE INDEX IF NOT EXISTS "cong_viec_createdById_idx" ON cong_viec ("createdById");
CREATE INDEX IF NOT EXISTS "cong_viec_nhat_ky_userId_idx" ON cong_viec_nhat_ky ("userId");
CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_createdById_idx" ON nghiep_vu_ban_ghi ("createdById");
