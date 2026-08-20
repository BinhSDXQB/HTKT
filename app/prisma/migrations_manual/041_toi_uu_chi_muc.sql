-- ============================================================================
-- Migration 041 — TỐI ƯU CSDL: chỉ mục vector RAG + chỉ mục khoá ngoại + tra cứu
--
-- Bối cảnh (rà soát 19/8/2026):
--   1. Bảng tai_lieu_chunk (17.338 đoạn, vector 1536 chiều) KHÔNG có chỉ mục
--      HNSW dù migration 024 đã khai báo → mỗi lần chatbot tra cứu tài liệu phải
--      quét tuần tự toàn bảng: ~2.000 ms/lượt. Sau khi tạo chỉ mục: ~12 ms.
--   2. 112 khoá ngoại KHÔNG có chỉ mục dẫn đầu → xoá/sửa bản ghi cha phải quét
--      toàn bảng con; các truy vấn lọc theo wardId/toChucId/survey_case_id chậm.
--   3. Các cột tra cứu nóng của can_bo và chatbot_logs chưa có chỉ mục.
--
-- CONCURRENTLY: không khoá ghi bảng → chạy được trên CSDL đang phục vụ.
-- LƯU Ý: file này KHÔNG chạy trong transaction (CONCURRENTLY không cho phép).
--   psql -U postgres -d ql_htkt -f prisma/migrations_manual/041_toi_uu_chi_muc.sql
-- ============================================================================

-- ── 1. Chỉ mục vector cho RAG (pgvector HNSW, khoảng cách cosine) ───────────
SET maintenance_work_mem = '256MB';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tai_lieu_chunk_embedding_hnsw"
  ON public.tai_lieu_chunk USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── 2. Chỉ mục khoá ngoại còn thiếu (112 FK) ────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_asset_import_batches_importedById" ON public.asset_import_batches ("importedById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_assets_assetTypeId" ON public.assets ("assetTypeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_assets_streetId" ON public.assets ("streetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cap_vien_thong_wardId" ON public.cap_vien_thong ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cong_thoat_nuoc_wardId" ON public.cong_thoat_nuoc ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_doan_tuyen_ong_streetId" ON public.doan_tuyen_ong ("streetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_assetId" ON public.incidents ("assetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_inspectionId" ON public.incidents ("inspectionId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_reportedById" ON public.incidents ("reportedById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_resolvedById" ON public.incidents ("resolvedById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_wardId" ON public.incidents ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inspection_results_itemId" ON public.inspection_results ("itemId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inspection_template_items_templateId" ON public.inspection_template_items ("templateId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inspection_templates_assetTypeId" ON public.inspection_templates ("assetTypeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inspections_inspectorId" ON public.inspections ("inspectorId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inspections_templateId" ON public.inspections ("templateId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_maintenance_schedules_assetId" ON public.maintenance_schedules ("assetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_maintenance_schedules_assetTypeId" ON public.maintenance_schedules ("assetTypeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_material_categories_parentId" ON public.material_categories ("parentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_materials_categoryId" ON public.materials ("categoryId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_nha_may_xu_ly_nuoc_thai_wardId" ON public.nha_may_xu_ly_nuoc_thai ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_annual_evaluations_createdById" ON public.office_annual_evaluations ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_discipline_records_createdById" ON public.office_discipline_records ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_generated_documents_createdById" ON public.office_generated_documents ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_reward_records_createdById" ON public.office_reward_records ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_salary_history_createdById" ON public.office_salary_history ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_salary_review_cases_createdById" ON public.office_salary_review_cases ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_salary_review_cases_nguoiDuyetId" ON public.office_salary_review_cases ("nguoiDuyetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_salary_review_cases_nguoiRaSoatId" ON public.office_salary_review_cases ("nguoiRaSoatId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_office_work_history_createdById" ON public.office_work_history ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ong_cap_nuoc_wardId" ON public.ong_cap_nuoc ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_oversized_vehicle_permits_vehicleId" ON public.oversized_vehicle_permits ("vehicleId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_project_milestones_projectId" ON public.project_milestones ("projectId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_projects_executingUnitId" ON public.projects ("executingUnitId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_projects_wardId" ON public.projects ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tram_bom_nhaMayXuLyId" ON public.tram_bom ("nhaMayXuLyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tram_bom_streetId" ON public.tram_bom ("streetId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tuyen_mang_luoi_nhaMayXuLyId" ON public.tuyen_mang_luoi ("nhaMayXuLyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tuyen_mang_luoi_tramBomId" ON public.tuyen_mang_luoi ("tramBomId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tuyen_mang_luoi_wardId" ON public.tuyen_mang_luoi ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_van_cap_nuoc_wardId" ON public.van_cap_nuoc ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_via_he_wardId" ON public.via_he ("wardId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_order_materials_materialId" ON public.work_order_materials ("materialId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_order_materials_workOrderId" ON public.work_order_materials ("workOrderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_orders_assignedToId" ON public.work_orders ("assignedToId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_orders_createdById" ON public.work_orders ("createdById");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_orders_executingUnitId" ON public.work_orders ("executingUnitId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_orders_incidentId" ON public.work_orders ("incidentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_work_orders_scheduleId" ON public.work_orders ("scheduleId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_httt_dong_bo_log_nguoi_id ON public.httt_dong_bo_log (nguoi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_httt_nang_luc_ca_nhan_created_by_id ON public.httt_nang_luc_ca_nhan (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_httt_nang_luc_ca_nhan_dinh_danh_id ON public.httt_nang_luc_ca_nhan (dinh_danh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_httt_nang_luc_to_chuc_created_by_id ON public.httt_nang_luc_to_chuc (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_httt_nang_luc_to_chuc_dinh_danh_id ON public.httt_nang_luc_to_chuc (dinh_danh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_administrative_unit_assignments_owner_id ON public.qd72_administrative_unit_assignments (owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_administrative_unit_assignments_to_chuc_id ON public.qd72_administrative_unit_assignments (to_chuc_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_attachments_uploaded_by_id ON public.qd72_attachments (uploaded_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_clearance_measurements_created_by_id ON public.qd72_clearance_measurements (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_comments_nguoi_id ON public.qd72_comments (nguoi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_comments_survey_case_id ON public.qd72_comments (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_fire_hydrants_survey_case_id ON public.qd72_fire_hydrants (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_fire_hydrants_water_source_id ON public.qd72_fire_hydrants (water_source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_fire_parking_areas_survey_case_id ON public.qd72_fire_parking_areas (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_legal_documents_sua_doi_cho_id ON public.qd72_legal_documents (sua_doi_cho_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_overhead_utility_lines_created_by_id ON public.qd72_overhead_utility_lines (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_overhead_utility_lines_don_vi_hanh_chinh_id ON public.qd72_overhead_utility_lines (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_passing_bays_road_segment_id ON public.qd72_passing_bays (road_segment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_passing_bays_survey_case_id ON public.qd72_passing_bays (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_public_lighting_assets_owner_id ON public.qd72_public_lighting_assets (owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_public_lighting_assets_survey_case_id ON public.qd72_public_lighting_assets (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_renovation_plans_created_by_id ON public.qd72_renovation_plans (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_renovation_plans_don_vi_hanh_chinh_id ON public.qd72_renovation_plans (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_renovation_tasks_plan_id ON public.qd72_renovation_tasks (plan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_road_obstacles_road_segment_id ON public.qd72_road_obstacles (road_segment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_road_obstacles_survey_case_id ON public.qd72_road_obstacles (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_road_segments_created_by_id ON public.qd72_road_segments (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_road_segments_don_vi_hanh_chinh_id ON public.qd72_road_segments (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_shared_technical_infrastructure_don_vi_hanh_chinh_id ON public.qd72_shared_technical_infrastructure (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_shared_technical_infrastructure_survey_case_id ON public.qd72_shared_technical_infrastructure (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_survey_cases_created_by_id ON public.qd72_survey_cases (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_survey_cases_to_chuc_id ON public.qd72_survey_cases (to_chuc_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_survey_cases_updated_by_id ON public.qd72_survey_cases (updated_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_survey_cases_verified_by_id ON public.qd72_survey_cases (verified_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_technical_rules_legal_document_id ON public.qd72_technical_rules (legal_document_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_undergrounding_proposals_created_by_id ON public.qd72_undergrounding_proposals (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_undergrounding_proposals_line_id ON public.qd72_undergrounding_proposals (line_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_undergrounding_proposals_survey_case_id ON public.qd72_undergrounding_proposals (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_urban_areas_created_by_id ON public.qd72_urban_areas (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_urban_areas_don_vi_hanh_chinh_id ON public.qd72_urban_areas (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_crossings_line_id ON public.qd72_utility_crossings (line_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_crossings_road_segment_id ON public.qd72_utility_crossings (road_segment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_crossings_survey_case_id ON public.qd72_utility_crossings (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_owners_to_chuc_id ON public.qd72_utility_owners (to_chuc_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_poles_owner_id ON public.qd72_utility_poles (owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_utility_poles_survey_case_id ON public.qd72_utility_poles (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_verification_items_technical_rule_id ON public.qd72_verification_items (technical_rule_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_verification_records_created_by_id ON public.qd72_verification_records (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_verification_records_survey_case_id ON public.qd72_verification_records (survey_case_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_water_intake_points_water_source_id ON public.qd72_water_intake_points (water_source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_water_sources_created_by_id ON public.qd72_water_sources (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_water_sources_don_vi_hanh_chinh_id ON public.qd72_water_sources (don_vi_hanh_chinh_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_water_test_results_created_by_id ON public.qd72_water_test_results (created_by_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_water_test_results_water_source_id ON public.qd72_water_test_results (water_source_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qd72_workflow_history_nguoi_thuc_hien_id ON public.qd72_workflow_history (nguoi_thuc_hien_id);

-- ── 3. Chỉ mục tra cứu nóng ────────────────────────────────────────────────
-- Chatbot tra cán bộ theo tên (contains, không phân biệt hoa thường) → pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_can_bo_hoTen_trgm"
  ON public.can_bo USING gin ("hoTen" gin_trgm_ops);
-- Sinh nhật hôm nay/tháng này + lên lương theo tháng
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_can_bo_ngaySinh"
  ON public.can_bo ("ngaySinh");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_can_bo_ngayNangLuongKeTiep"
  ON public.can_bo ("ngayNangLuongKeTiep");

-- Truy hồi "kiến thức đã học" của chatbot: lọc feedback + isWardUser, sắp theo feedbackAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chatbot_logs_hoc_hoi"
  ON public.chatbot_logs (feedback, "isWardUser", "feedbackAt" DESC);

-- ── 4. Cập nhật thống kê cho bộ tối ưu hoá truy vấn ────────────────────────
-- Trước lần rà soát này, 141/141 bảng CHƯA từng được ANALYZE → planner chọn sai
-- kế hoạch (mọi bảng đều bị coi như rỗng).
ANALYZE;
