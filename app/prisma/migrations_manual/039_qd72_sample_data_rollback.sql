-- ROLLBACK 039 — xoá TOÀN BỘ dữ liệu DEMO QĐ72 (id/ma bắt đầu 'DEMO-').
-- Xoá survey_cases DEMO sẽ CASCADE hầu hết bản ghi con; xoá thêm các bảng danh mục/không cascade.
DELETE FROM qd72_survey_cases WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_utility_owners WHERE id LIKE 'DEMO-%';
-- Phòng hờ (nếu bản ghi con không cascade vì survey_case_id NULL):
DELETE FROM qd72_overhead_utility_lines WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_utility_poles WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_undergrounding_proposals WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_shared_technical_infrastructure WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_water_sources WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_renovation_plans WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_road_segments WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_urban_areas WHERE id LIKE 'DEMO-%';
DELETE FROM qd72_workflow_history WHERE id LIKE 'DEMO-%';
