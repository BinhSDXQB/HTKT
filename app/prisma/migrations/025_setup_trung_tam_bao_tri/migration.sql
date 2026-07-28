-- Cập nhật mã số thuế cho Trung tâm Bảo trì
UPDATE to_chuc
SET ma_so_thue = '3200593560'
WHERE code = 'TC_BAN_BAO_TRI_GT';

-- Tạo user admin cho Trung tâm Bảo trì (nếu chưa tồn tại)
-- NOTE: Cần chạy migration này và sau đó tạo user qua UI

-- Tham khảo: Để set quyền quản lý CCCD/thành viên, chạy:
-- INSERT INTO user_group (user_id, group_id)
-- SELECT u.id, g.id FROM "user" u, user_group g
-- WHERE u.email = 'admin-ttbt@htkt.vn' AND g.name = 'CAN_BO_MANAGER_CCCD'
