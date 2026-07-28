-- Đổi tên đơn vị trực thuộc "Ban Quản lý, Bảo trì giao thông" → đúng tên pháp lý
-- "Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật".
-- Giữ NGUYÊN id (tc_ban_bao_tri_gt) và ma (BAN_BAO_TRI_GT) để không phá vỡ tham chiếu
-- can_bo.toChucId, requireDeptAccess('BAN_BAO_TRI_GT') và gate sidebar deptMa. Additive, idempotent.

UPDATE to_chuc
SET ten = 'Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật',
    "tenVietTat" = 'TT QLBT GT-HTKT',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 'tc_ban_bao_tri_gt'
  AND ten <> 'Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật';
