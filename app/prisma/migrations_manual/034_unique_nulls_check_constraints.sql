-- 034: Siết ràng buộc toàn vẹn (rà soát CSDL 03/07/2026).
-- (1) phan_cong: unique cũ cho phép trùng khi tuNgay NULL (NULL <> NULL trong PG).
--     Tạo lại với NULLS NOT DISTINCT (PG15+) — giữ nguyên tên index Prisma.
--     Đã kiểm tra trước: KHÔNG có dữ liệu trùng với tuNgay NULL.
-- (2) CHECK constraint cho các cột trạng thái kiểu String (không enum) —
--     CSDL tự chặn giá trị lạ; giá trị hợp lệ = tài liệu trong schema ∪ code thực tế.
-- Idempotent: DROP/ADD có điều kiện, chạy lại an toàn.

-- ── (1) phan_cong unique NULLS NOT DISTINCT ─────────────────────────────────
DROP INDEX IF EXISTS "phan_cong_canBoId_toChucId_chucDanhId_tuNgay_key";
CREATE UNIQUE INDEX "phan_cong_canBoId_toChucId_chucDanhId_tuNgay_key"
  ON phan_cong ("canBoId", "toChucId", "chucDanhId", "tuNgay") NULLS NOT DISTINCT;

-- ── (2) CHECK trạng thái ────────────────────────────────────────────────────
-- can_bo.trangThai (dữ liệu hiện có: DANG_CONG_TAC, HOP_DONG)
ALTER TABLE can_bo DROP CONSTRAINT IF EXISTS can_bo_trangthai_check;
ALTER TABLE can_bo ADD CONSTRAINT can_bo_trangthai_check
  CHECK ("trangThai" IN ('DANG_CONG_TAC','HOP_DONG','NGHI_HUU','CHUYEN_CONG_TAC','NGHI_VIEC'));

-- nghiep_vu_ban_ghi.trangThai
ALTER TABLE nghiep_vu_ban_ghi DROP CONSTRAINT IF EXISTS nghiep_vu_ban_ghi_trangthai_check;
ALTER TABLE nghiep_vu_ban_ghi ADD CONSTRAINT nghiep_vu_ban_ghi_trangthai_check
  CHECK ("trangThai" IN ('MOI','DANG_XU_LY','HOAN_THANH','HUY'));

-- overtime_timesheets.trangThai — code thực tế dùng NHAP/DA_KY (ký tay);
-- giữ thêm bộ CHO_* của quy trình ký số trong comment schema để không chặn tương lai.
ALTER TABLE overtime_timesheets DROP CONSTRAINT IF EXISTS overtime_timesheets_trangthai_check;
ALTER TABLE overtime_timesheets ADD CONSTRAINT overtime_timesheets_trangthai_check
  CHECK ("trangThai" IN ('NHAP','DA_KY','CHO_TP','CHO_LD','CHO_VT','CHO_KHTC','HOAN_TAT','TU_CHOI'));

-- tai_lieu.trangThai + phamVi (phamVi quyết định phạm vi lộ tài liệu → quan trọng bảo mật)
ALTER TABLE tai_lieu DROP CONSTRAINT IF EXISTS tai_lieu_trangthai_check;
ALTER TABLE tai_lieu ADD CONSTRAINT tai_lieu_trangthai_check
  CHECK ("trangThai" IN ('dang_xu_ly','san_sang','loi'));
ALTER TABLE tai_lieu DROP CONSTRAINT IF EXISTS tai_lieu_phamvi_check;
ALTER TABLE tai_lieu ADD CONSTRAINT tai_lieu_phamvi_check
  CHECK ("phamVi" IN ('CONG_KHAI','NOI_BO_SO'));

-- lich_ca_nhan.loai
ALTER TABLE lich_ca_nhan DROP CONSTRAINT IF EXISTS lich_ca_nhan_loai_check;
ALTER TABLE lich_ca_nhan ADD CONSTRAINT lich_ca_nhan_loai_check
  CHECK (loai IN ('HOP','CONG_TAC','TRUC','NGHI','KHAC'));
