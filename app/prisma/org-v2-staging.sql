-- ============================================================================
-- DỰNG STAGING MÔ HÌNH TỔ CHỨC v2 — schema org_v2 (TÁCH BIỆT, không đụng public)
-- An toàn: chỉ tạo/đổi trong namespace org_v2. Chạy lại được (idempotent).
-- ============================================================================
DROP SCHEMA IF EXISTS org_v2 CASCADE;
CREATE SCHEMA org_v2;

-- 1) to_chuc — giữ nguyên cấu trúc (cây đơn vị đã tốt)
CREATE TABLE org_v2.to_chuc AS SELECT * FROM public.to_chuc;
ALTER TABLE org_v2.to_chuc ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX uq_v2_tochuc_ma ON org_v2.to_chuc(ma);

-- 2) chuc_danh — giữ nguyên
CREATE TABLE org_v2.chuc_danh AS SELECT * FROM public.chuc_danh;
ALTER TABLE org_v2.chuc_danh ADD PRIMARY KEY (id);

-- 3) can_bo — BỎ field text deprecated chucVu, phongBan
CREATE TABLE org_v2.can_bo AS SELECT * FROM public.can_bo;
ALTER TABLE org_v2.can_bo DROP COLUMN "chucVu";
ALTER TABLE org_v2.can_bo DROP COLUMN "phongBan";
ALTER TABLE org_v2.can_bo ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX uq_v2_canbo_cccd ON org_v2.can_bo(cccd);

-- 4) users — BỎ departmentCode (thừa, mã lệch).
--    GIỮ isDepartmentLeader theo quyết định 19/6/2026: cờ thủ công gán quyền
--    trưởng/phó phòng (duyệt lương/nghỉ phép/CCCD), KHÔNG suy từ chức danh.
CREATE TABLE org_v2.users AS SELECT * FROM public.users;
ALTER TABLE org_v2.users DROP COLUMN "departmentCode";
ALTER TABLE org_v2.users ADD PRIMARY KEY (id);

-- 5) phan_cong — THÊM laLanhDao (suy từ chức danh) + BACKFILL cho cán bộ thiếu phân công
CREATE TABLE org_v2.phan_cong AS SELECT * FROM public.phan_cong;
ALTER TABLE org_v2.phan_cong ADD PRIMARY KEY (id);
ALTER TABLE org_v2.phan_cong ADD COLUMN "laLanhDao" boolean NOT NULL DEFAULT false;
UPDATE org_v2.phan_cong pc
  SET "laLanhDao" = COALESCE(cd."isLanhDao", false)
  FROM org_v2.chuc_danh cd WHERE cd.id = pc."chucDanhId";

-- Backfill: cán bộ có đơn vị+chức danh nhưng chưa có phân công chính đang giữ
INSERT INTO org_v2.phan_cong
  (id, "canBoId", "toChucId", "chucDanhId", "laChinh", "laLanhDao",
   "tuNgay", "denNgay", "quyetDinhSo", "ghiChu", "createdAt", "updatedAt")
SELECT 'bk2_' || cb.id, cb.id, cb."toChucId", cb."chucDanhId", true,
       COALESCE(cd."isLanhDao", false),
       NULL, NULL, NULL, 'Backfill từ can_bo (org_v2)', now(), now()
FROM org_v2.can_bo cb
LEFT JOIN org_v2.chuc_danh cd ON cd.id = cb."chucDanhId"
WHERE cb."toChucId" IS NOT NULL AND cb."chucDanhId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM org_v2.phan_cong pc
    WHERE pc."canBoId" = cb.id AND pc."laChinh" = true AND pc."denNgay" IS NULL
  );

-- 6) Khoá ngoại trong lõi tổ chức — chứng minh toàn vẹn tham chiếu
ALTER TABLE org_v2.to_chuc   ADD CONSTRAINT fk_v2_tc_parent  FOREIGN KEY ("parentId")   REFERENCES org_v2.to_chuc(id);
ALTER TABLE org_v2.can_bo    ADD CONSTRAINT fk_v2_cb_tochuc  FOREIGN KEY ("toChucId")   REFERENCES org_v2.to_chuc(id);
ALTER TABLE org_v2.can_bo    ADD CONSTRAINT fk_v2_cb_chuc    FOREIGN KEY ("chucDanhId") REFERENCES org_v2.chuc_danh(id);
ALTER TABLE org_v2.can_bo    ADD CONSTRAINT fk_v2_cb_user    FOREIGN KEY ("userId")     REFERENCES org_v2.users(id);
ALTER TABLE org_v2.phan_cong ADD CONSTRAINT fk_v2_pc_canbo   FOREIGN KEY ("canBoId")    REFERENCES org_v2.can_bo(id) ON DELETE CASCADE;
ALTER TABLE org_v2.phan_cong ADD CONSTRAINT fk_v2_pc_tochuc  FOREIGN KEY ("toChucId")   REFERENCES org_v2.to_chuc(id);
ALTER TABLE org_v2.phan_cong ADD CONSTRAINT fk_v2_pc_chuc    FOREIGN KEY ("chucDanhId")  REFERENCES org_v2.chuc_danh(id);
ALTER TABLE org_v2.users     ADD CONSTRAINT fk_v2_u_tochuc   FOREIGN KEY ("toChucId")   REFERENCES org_v2.to_chuc(id);

-- 7) VIEW tiện dụng — "đơn vị + chức danh + có phải lãnh đạo" của mỗi tài khoản
--    (suy DUY NHẤT qua users → can_bo → can_bo.toChucId/chucDanhId)
CREATE VIEW org_v2.v_user_to_chuc AS
SELECT u.id AS user_id, u.email, u.name,
       cb.id AS can_bo_id, cb."hoTen",
       tc.ma  AS phong_ma, tc.ten AS phong_ten,
       cd.ten AS chuc_danh, cd."isLanhDao" AS la_lanh_dao,
       cd."capQuanLy" AS cap_quan_ly
FROM org_v2.users u
LEFT JOIN org_v2.can_bo cb   ON cb."userId" = u.id
LEFT JOIN org_v2.to_chuc tc  ON tc.id = cb."toChucId"
LEFT JOIN org_v2.chuc_danh cd ON cd.id = cb."chucDanhId";
