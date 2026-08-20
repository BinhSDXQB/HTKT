-- ROLLBACK cho 038_qd72_core_tables.sql — chỉ gỡ bảng lõi phân hệ QĐ 72 (qd72_*).
-- Additive nên an toàn; DROP theo thứ tự tôn trọng khóa ngoại (con trước, cha sau).
DROP TABLE IF EXISTS qd72_administrative_unit_assignments;
DROP TABLE IF EXISTS qd72_comments;
DROP TABLE IF EXISTS qd72_workflow_history;
DROP TABLE IF EXISTS qd72_attachments;
DROP TABLE IF EXISTS qd72_renovation_tasks;
DROP TABLE IF EXISTS qd72_renovation_plans;
DROP TABLE IF EXISTS qd72_verification_items;
DROP TABLE IF EXISTS qd72_verification_records;
DROP TABLE IF EXISTS qd72_water_intake_points;
DROP TABLE IF EXISTS qd72_water_test_results;
DROP TABLE IF EXISTS qd72_fire_hydrants;
DROP TABLE IF EXISTS qd72_water_sources;
DROP TABLE IF EXISTS qd72_undergrounding_proposals;
DROP TABLE IF EXISTS qd72_shared_technical_infrastructure;
DROP TABLE IF EXISTS qd72_public_lighting_assets;
DROP TABLE IF EXISTS qd72_clearance_measurements;
DROP TABLE IF EXISTS qd72_utility_crossings;
DROP TABLE IF EXISTS qd72_utility_poles;
DROP TABLE IF EXISTS qd72_overhead_utility_lines;
DROP TABLE IF EXISTS qd72_passing_bays;
DROP TABLE IF EXISTS qd72_fire_parking_areas;
DROP TABLE IF EXISTS qd72_road_obstacles;
DROP TABLE IF EXISTS qd72_road_segments;
DROP TABLE IF EXISTS qd72_urban_areas;
DROP TABLE IF EXISTS qd72_survey_cases;
DROP TABLE IF EXISTS qd72_utility_owners;
