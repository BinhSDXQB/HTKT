-- ============================================================================
-- Xếp chức danh cho 49 cán bộ còn thiếu (chucDanhId NULL)
-- Căn cứ: NĐ 120/2020 (lãnh đạo ĐVSN), Luật Viên chức 2010 sđ 2019 + NĐ 115/2020
--         sđ NĐ 85/2023 (CDNN viên chức, biệt phái), NĐ 111/2022 (HĐLĐ hỗ trợ/phục vụ).
-- Lãnh đạo đơn vị sự nghiệp KHÔNG phải lãnh đạo Sở → loại riêng LANH_DAO_DVSN.
-- Idempotent: chạy lại an toàn (ON CONFLICT + chỉ update khi chucDanhId IS NULL).
-- ============================================================================

-- 1) Thêm loại chức danh mới (ngoài transaction; dùng được ngay ở các lệnh sau)
ALTER TYPE "LoaiChucDanh" ADD VALUE IF NOT EXISTS 'LANH_DAO_DVSN';
