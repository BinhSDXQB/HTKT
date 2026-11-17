# EXISTING_DATA_INVENTORY — Kiểm kê dữ liệu hiện hữu

Nguồn: truy vấn catalog PostgreSQL trong giao dịch READ ONLY, ngày 13/11/2026 (VERIFIED). Tệp này sinh tự động từ số liệu kiểm kê; không chứa giá trị dữ liệu, chỉ metadata và số đếm.

Tổng: 142 bảng `public`, 73 bảng rỗng, 248 khoá ngoại, 12 view nghiệp vụ, 8 trigger, 6 hàm.

Cột: **Dòng** = count(*) · **Cột** = số cột · **Idx** = số index · **FK ra / FK vào** = số khoá ngoại đi / trỏ tới · **CHECK** · **kB** = dung lượng kể cả index.

## 1. Tổ chức, nhân sự, phân quyền

12 bảng, 12 bảng có dữ liệu, 2.521 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `audit_logs` | 953 | 10 | 4 | 1 | 0 | 0 | 392 |
| `can_bo` | 164 | 67 | 12 | 3 | 10 | 4 | 496 |
| `chuc_danh` | 25 | 7 | 4 | 0 | 2 | 0 | 80 |
| `con_can_bo` | 163 | 16 | 2 | 1 | 1 | 3 | 104 |
| `lanh_dao_xa` | 455 | 9 | 4 | 1 | 0 | 0 | 256 |
| `permissions` | 79 | 4 | 2 | 0 | 1 | 0 | 80 |
| `phan_cong` | 103 | 11 | 6 | 3 | 0 | 0 | 168 |
| `role_permissions` | 156 | 2 | 2 | 2 | 0 | 0 | 120 |
| `roles` | 4 | 6 | 2 | 0 | 2 | 0 | 48 |
| `thanh_tich_con` | 174 | 12 | 2 | 2 | 0 | 2 | 96 |
| `to_chuc` | 25 | 14 | 6 | 2 | 15 | 0 | 144 |
| `users` | 220 | 17 | 5 | 3 | 56 | 0 | 256 |

## 2. Văn phòng Sở (lương, thi đua, nghỉ phép, làm thêm)

17 bảng, 11 bảng có dữ liệu, 821 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `lich_ca_nhan` | 5 | 14 | 4 | 2 | 0 | 1 | 80 |
| `office_annual_evaluations` | 119 | 11 | 4 | 2 | 0 | 0 | 120 |
| `office_collective_reward_records` | 5 | 16 | 3 | 0 | 0 | 0 | 64 |
| `office_discipline_records` | 0 | 13 | 3 | 2 | 0 | 0 | 32 |
| `office_emulation_movements` | 0 | 10 | 3 | 0 | 1 | 0 | 32 |
| `office_generated_documents` | 2 | 10 | 6 | 3 | 0 | 0 | 160 |
| `office_leave_requests` | 2 | 35 | 4 | 1 | 1 | 0 | 80 |
| `office_leave_signatures` | 0 | 13 | 2 | 1 | 0 | 0 | 24 |
| `office_reward_records` | 145 | 15 | 6 | 4 | 0 | 0 | 208 |
| `office_reward_titles` | 12 | 10 | 4 | 0 | 1 | 0 | 80 |
| `office_salary_history` | 15 | 15 | 5 | 2 | 0 | 0 | 96 |
| `office_salary_review_cases` | 134 | 25 | 8 | 4 | 1 | 0 | 184 |
| `office_salary_rules` | 0 | 17 | 3 | 0 | 0 | 0 | 32 |
| `office_work_history` | 0 | 12 | 4 | 2 | 0 | 0 | 40 |
| `overtime_entries` | 345 | 14 | 3 | 1 | 0 | 0 | 264 |
| `overtime_signatures` | 0 | 14 | 2 | 1 | 0 | 0 | 104 |
| `overtime_timesheets` | 37 | 23 | 4 | 0 | 2 | 1 | 112 |

## 3. Địa bàn và danh mục

7 bảng, 6 bảng có dữ liệu, 1.051 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `administrative_units` | 79 | 20 | 6 | 1 | 40 | 1 | 192 |
| `asset_types` | 26 | 6 | 2 | 0 | 4 | 0 | 48 |
| `executing_units` | 0 | 7 | 2 | 0 | 2 | 0 | 24 |
| `facility_config` | 1 | 10 | 1 | 0 | 0 | 0 | 32 |
| `integration_configs` | 9 | 4 | 2 | 0 | 0 | 0 | 48 |
| `material_categories` | 7 | 5 | 3 | 1 | 2 | 0 | 64 |
| `streets` | 929 | 6 | 3 | 1 | 13 | 0 | 440 |

## 4. Báo cáo HTKT xã/phường

10 bảng, 7 bảng có dữ liệu, 3.851 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `report_bai_do_xe` | 12 | 16 | 4 | 3 | 0 | 0 | 80 |
| `report_cap_nuoc` | 0 | 16 | 4 | 3 | 0 | 0 | 40 |
| `report_cay_xanh` | 680 | 21 | 4 | 3 | 0 | 0 | 344 |
| `report_cong_vien` | 0 | 19 | 4 | 3 | 0 | 0 | 40 |
| `report_dien_cs` | 901 | 21 | 5 | 3 | 0 | 0 | 432 |
| `report_duong` | 1342 | 25 | 4 | 3 | 0 | 0 | 672 |
| `report_thoat_nuoc` | 780 | 23 | 4 | 3 | 0 | 0 | 400 |
| `ward_gis_length` | 77 | 10 | 2 | 1 | 0 | 0 | 80 |
| `ward_khai_bao` | 59 | 9 | 3 | 1 | 0 | 0 | 96 |
| `ward_reports` | 0 | 14 | 5 | 2 | 0 | 0 | 48 |

## 5. Hub đối tượng HTKT và mạng lưới chi tiết

14 bảng, 0 bảng có dữ liệu, 0 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `cap_vien_thong` | 0 | 23 | 5 | 2 | 0 | 0 | 48 |
| `cay_xanh_duong` | 0 | 25 | 4 | 2 | 0 | 0 | 40 |
| `cong_thoat_nuoc` | 0 | 27 | 6 | 4 | 0 | 0 | 56 |
| `den_chieu_sang` | 0 | 29 | 6 | 2 | 0 | 0 | 56 |
| `doan_tuyen_cong` | 0 | 13 | 3 | 2 | 0 | 0 | 32 |
| `doan_tuyen_ong` | 0 | 11 | 3 | 2 | 0 | 0 | 32 |
| `ho_ga` | 0 | 22 | 4 | 2 | 2 | 0 | 40 |
| `htkt_doi_tuong` | 0 | 46 | 10 | 5 | 8 | 23 | 104 |
| `nha_may_xu_ly_nuoc_thai` | 0 | 21 | 3 | 1 | 2 | 0 | 32 |
| `ong_cap_nuoc` | 0 | 22 | 4 | 2 | 1 | 0 | 40 |
| `tram_bom` | 0 | 27 | 6 | 3 | 1 | 0 | 56 |
| `tuyen_mang_luoi` | 0 | 21 | 6 | 3 | 2 | 0 | 56 |
| `van_cap_nuoc` | 0 | 21 | 5 | 3 | 0 | 0 | 48 |
| `via_he` | 0 | 20 | 4 | 2 | 0 | 0 | 40 |

## 6. Tài sản, bảo trì, sự cố, vật tư (khung cũ)

13 bảng, 3 bảng có dữ liệu, 994 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `asset_import_batches` | 0 | 11 | 4 | 2 | 0 | 0 | 40 |
| `assets` | 929 | 29 | 9 | 3 | 4 | 0 | 984 |
| `incidents` | 0 | 25 | 11 | 5 | 1 | 0 | 96 |
| `inspection_results` | 0 | 9 | 3 | 2 | 0 | 0 | 32 |
| `inspection_template_items` | 57 | 7 | 2 | 1 | 1 | 0 | 48 |
| `inspection_templates` | 8 | 7 | 2 | 1 | 2 | 0 | 48 |
| `inspections` | 0 | 16 | 6 | 3 | 2 | 0 | 56 |
| `maintenance_schedules` | 0 | 10 | 3 | 2 | 1 | 0 | 32 |
| `materials` | 0 | 12 | 3 | 1 | 2 | 0 | 32 |
| `stock_transactions` | 0 | 10 | 3 | 1 | 0 | 0 | 32 |
| `system_alerts` | 0 | 11 | 3 | 0 | 0 | 0 | 32 |
| `work_order_materials` | 0 | 9 | 3 | 2 | 0 | 0 | 32 |
| `work_orders` | 0 | 26 | 11 | 6 | 1 | 0 | 96 |

## 7. Dự án

6 bảng, 4 bảng có dữ liệu, 340 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ds_du_an_gpmb` | 36 | 20 | 4 | 2 | 3 | 0 | 112 |
| `ds_du_an_thanh_phan` | 114 | 15 | 3 | 1 | 0 | 0 | 128 |
| `ds_ke_hoach_von` | 144 | 14 | 3 | 1 | 0 | 0 | 112 |
| `ds_lien_he` | 46 | 8 | 3 | 1 | 0 | 0 | 64 |
| `project_milestones` | 0 | 8 | 2 | 1 | 0 | 0 | 24 |
| `projects` | 0 | 37 | 7 | 2 | 1 | 0 | 64 |

## 8. Công việc và nghiệp vụ động

8 bảng, 6 bảng có dữ liệu, 717 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `cong_viec` | 91 | 26 | 11 | 6 | 4 | 0 | 392 |
| `cong_viec_check_list` | 0 | 6 | 2 | 1 | 0 | 0 | 24 |
| `cong_viec_loai` | 5 | 10 | 2 | 1 | 1 | 0 | 48 |
| `cong_viec_nhat_ky` | 78 | 8 | 3 | 2 | 0 | 0 | 104 |
| `cong_viec_thanh_vien` | 0 | 5 | 3 | 2 | 0 | 0 | 64 |
| `nghiep_vu_ban_ghi` | 532 | 15 | 7 | 3 | 0 | 1 | 536 |
| `phan_cong_dinh_ky` | 3 | 14 | 2 | 0 | 0 | 0 | 48 |
| `phan_cong_linh_vuc` | 8 | 11 | 4 | 0 | 0 | 0 | 80 |

## 9. Cấp phép giao thông

9 bảng, 3 bảng có dữ liệu, 3 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `oversized_vehicle_permits` | 1 | 35 | 6 | 1 | 2 | 0 | 112 |
| `permit_routes` | 0 | 15 | 2 | 1 | 0 | 0 | 24 |
| `permit_vehicles` | 1 | 18 | 3 | 0 | 1 | 0 | 64 |
| `road_connection_applications` | 1 | 28 | 6 | 0 | 4 | 0 | 112 |
| `road_connection_inspections` | 0 | 7 | 2 | 1 | 0 | 0 | 24 |
| `road_connection_locations` | 0 | 10 | 2 | 1 | 0 | 0 | 24 |
| `road_connection_permits` | 0 | 9 | 2 | 1 | 0 | 0 | 24 |
| `road_legal_references` | 0 | 12 | 2 | 0 | 0 | 0 | 24 |
| `road_permit_status_logs` | 0 | 8 | 3 | 2 | 0 | 0 | 32 |

## 10. QĐ 72 (chỉnh trang đô thị, PCCC)

28 bảng, 13 bảng có dữ liệu, 50 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `qd72_administrative_unit_assignments` | 0 | 7 | 4 | 3 | 0 | 0 | 40 |
| `qd72_attachments` | 0 | 17 | 4 | 2 | 0 | 0 | 40 |
| `qd72_clearance_measurements` | 0 | 17 | 3 | 2 | 0 | 0 | 32 |
| `qd72_comments` | 0 | 7 | 3 | 2 | 0 | 0 | 32 |
| `qd72_fire_hydrants` | 0 | 12 | 3 | 2 | 0 | 0 | 32 |
| `qd72_fire_parking_areas` | 0 | 11 | 2 | 1 | 0 | 0 | 24 |
| `qd72_legal_documents` | 15 | 16 | 5 | 1 | 2 | 0 | 96 |
| `qd72_overhead_utility_lines` | 5 | 22 | 5 | 4 | 2 | 0 | 96 |
| `qd72_passing_bays` | 0 | 11 | 3 | 2 | 0 | 0 | 32 |
| `qd72_public_lighting_assets` | 0 | 11 | 3 | 2 | 0 | 0 | 32 |
| `qd72_renovation_plans` | 1 | 23 | 4 | 3 | 1 | 0 | 80 |
| `qd72_renovation_tasks` | 0 | 12 | 2 | 1 | 0 | 0 | 24 |
| `qd72_road_obstacles` | 0 | 12 | 3 | 2 | 0 | 0 | 32 |
| `qd72_road_segments` | 1 | 25 | 4 | 3 | 3 | 0 | 80 |
| `qd72_shared_technical_infrastructure` | 1 | 12 | 3 | 2 | 0 | 0 | 64 |
| `qd72_survey_cases` | 2 | 19 | 8 | 5 | 19 | 2 | 144 |
| `qd72_technical_rules` | 17 | 17 | 5 | 1 | 1 | 0 | 96 |
| `qd72_undergrounding_proposals` | 2 | 18 | 4 | 3 | 0 | 0 | 80 |
| `qd72_urban_areas` | 1 | 22 | 4 | 3 | 0 | 0 | 80 |
| `qd72_utility_crossings` | 0 | 11 | 4 | 3 | 0 | 0 | 40 |
| `qd72_utility_owners` | 2 | 10 | 3 | 1 | 4 | 0 | 64 |
| `qd72_utility_poles` | 1 | 13 | 3 | 2 | 0 | 0 | 64 |
| `qd72_verification_items` | 0 | 12 | 3 | 2 | 0 | 1 | 32 |
| `qd72_verification_records` | 0 | 11 | 3 | 2 | 1 | 0 | 32 |
| `qd72_water_intake_points` | 0 | 10 | 2 | 1 | 0 | 0 | 24 |
| `qd72_water_sources` | 1 | 21 | 4 | 3 | 3 | 0 | 80 |
| `qd72_water_test_results` | 0 | 12 | 3 | 2 | 0 | 0 | 32 |
| `qd72_workflow_history` | 1 | 8 | 3 | 2 | 0 | 0 | 64 |

## 11. Liên thông HĐXD và CCHN

7 bảng, 0 bảng có dữ liệu, 0 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `cchn_ho_so` | 0 | 50 | 6 | 3 | 2 | 12 | 112 |
| `cchn_kinh_nghiem` | 0 | 21 | 2 | 1 | 0 | 5 | 48 |
| `cchn_lich_su` | 0 | 9 | 2 | 2 | 0 | 1 | 24 |
| `httt_dinh_danh` | 0 | 14 | 4 | 0 | 3 | 6 | 80 |
| `httt_dong_bo_log` | 0 | 8 | 3 | 2 | 0 | 2 | 32 |
| `httt_nang_luc_ca_nhan` | 0 | 25 | 6 | 3 | 1 | 4 | 96 |
| `httt_nang_luc_to_chuc` | 0 | 19 | 5 | 3 | 0 | 2 | 48 |

## 12. BIM

6 bảng, 0 bảng có dữ liệu, 0 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `bim_consistency_reviews` | 0 | 10 | 2 | 1 | 0 | 0 | 24 |
| `bim_files` | 0 | 14 | 2 | 1 | 1 | 0 | 24 |
| `bim_model_versions` | 0 | 20 | 3 | 1 | 2 | 0 | 32 |
| `bim_models` | 0 | 24 | 5 | 0 | 2 | 0 | 48 |
| `bim_validation_checks` | 0 | 6 | 2 | 1 | 0 | 0 | 24 |
| `bim_view_permissions` | 0 | 8 | 2 | 1 | 0 | 1 | 24 |

## 13. Pháp lý RAG, chatbot, tích hợp

4 bảng, 3 bảng có dữ liệu, 26.908 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `chatbot_logs` | 1080 | 9 | 5 | 1 | 0 | 0 | 1160 |
| `integration_logs` | 0 | 7 | 2 | 0 | 0 | 0 | 24 |
| `tai_lieu` | 201 | 18 | 4 | 0 | 1 | 3 | 320 |
| `tai_lieu_chunk` | 25627 | 8 | 3 | 1 | 0 | 0 | 450104 |

## 14. Hệ thống

1 bảng, 1 bảng có dữ liệu, 5 dòng.

| Bảng | Dòng | Cột | Idx | FK ra | FK vào | CHECK | kB |
|---|---:|---:|---:|---:|---:|---:|---:|
| `_prisma_migrations` | 5 | 8 | 1 | 0 | 0 | 0 | 32 |

## View

- `org_v2.v_user_to_chuc`
- `public.v_dai_so_hieu_xa`
- `public.v_htkt_bai_do_xe_xa`
- `public.v_htkt_cap_nuoc_xa`
- `public.v_htkt_cay_xanh_xa`
- `public.v_htkt_cong_vien_xa`
- `public.v_htkt_dien_cs_xa`
- `public.v_htkt_doi_tuong`
- `public.v_htkt_doi_tuong_tong_hop`
- `public.v_htkt_duong_xa`
- `public.v_htkt_thoat_nuoc_xa`
- `public.v_htkt_tong_hop_xa`

## Trigger

| Bảng | Trigger | Sự kiện |
|---|---|---|
| `htkt_doi_tuong` | `trg_htkt_truoc_ghi` | INSERT/UPDATE |
| `report_bai_do_xe` | `trg_report_bai_do_xe_lien_ket` | UPDATE/INSERT |
| `report_cap_nuoc` | `trg_report_cap_nuoc_lien_ket` | UPDATE/INSERT |
| `report_cay_xanh` | `trg_report_cay_xanh_lien_ket` | INSERT/UPDATE |
| `report_cong_vien` | `trg_report_cong_vien_lien_ket` | INSERT/UPDATE |
| `report_dien_cs` | `trg_report_dien_cs_lien_ket` | INSERT/UPDATE |
| `report_duong` | `trg_report_duong_lien_ket` | INSERT/UPDATE |
| `report_thoat_nuoc` | `trg_report_thoat_nuoc_lien_ket` | UPDATE/INSERT |

## Hàm

- `fn_bao_cao_kiem_lien_ket`
- `fn_htkt_dien_tich_m2`
- `fn_htkt_dinh`
- `fn_htkt_do_dai_m`
- `fn_htkt_goi_y_so_hieu`
- `fn_htkt_truoc_ghi`

Nội dung trigger và hàm chưa được đọc trong đợt này (UNKNOWN).

## Cột JSONB (trường mở rộng)

66 cột. Các cột đang đóng vai trò trường động: `cong_viec.customFields`, `cong_viec_loai.fieldSchema`, `nghiep_vu_ban_ghi.customFields`, `htkt_doi_tuong.thong_so`, `httt_*.truong_bo_sung`, `qd72_*.chi_tiet`.

## Khoá ngoại mềm (cột id không có ràng buộc)

57 cột. Script `app/scripts/check-fk-mo-coi.mjs` kiểm 32 cột, kết quả ngày 13/11/2026: không có mồ côi.

`audit_logs.targetId`, `bim_consistency_reviews.nguoiDanhGiaId`, `bim_files.uploadedById`, `bim_model_versions.createdById`, `bim_model_versions.publishedById`, `bim_models.assetId`, `bim_models.createdById`, `bim_models.projectId`, `bim_models.updatedById`, `bim_models.wardId`, `bim_view_permissions.grantedById`, `bim_view_permissions.roleId`, `bim_view_permissions.toChucId`, `bim_view_permissions.userId`, `cong_viec.duAnId`, `cong_viec.incidentId`, `cong_viec.workOrderId`, `den_chieu_sang.tuDienId`, `ds_du_an_gpmb.congViecId`, `ds_du_an_gpmb.projectId`, `office_collective_reward_records.createdById`, `office_collective_reward_records.movementId`, `office_collective_reward_records.rewardTitleId`, `office_collective_reward_records.toChucId`, `office_leave_requests.createdById`, `office_leave_requests.khtcId`, `office_leave_requests.ldsKyId`, `office_leave_requests.nguoiDuyetId`, `office_leave_requests.tpDuyetId`, `office_leave_requests.vpsId`, `office_leave_signatures.nguoiKyId`, `oversized_vehicle_permits.applicantOrgId`, `oversized_vehicle_permits.appraisedById`, `oversized_vehicle_permits.createdById`, `oversized_vehicle_permits.wardId`, `overtime_entries.canBoId`, `overtime_signatures.nguoiKyId`, `overtime_timesheets.createdById`, `overtime_timesheets.toChucId`, `permit_vehicles.createdById`, `phan_cong_dinh_ky.loaiId`, `phan_cong_dinh_ky.nguoiPhuTrachId`, `phan_cong_dinh_ky.toChucId`, `phan_cong_linh_vuc.nguoiPhuTrachId`, `phan_cong_linh_vuc.toChucId`, `qd72_attachments.doi_tuong_id`, `qd72_clearance_measurements.doi_tuong_id`, `qd72_comments.doi_tuong_id`, `qd72_verification_items.doi_tuong_id`, `road_connection_applications.applicantOrgId`, `road_connection_applications.appraisedById`, `road_connection_applications.createdById`, `road_connection_applications.wardId`, `road_connection_inspections.inspectedById`, `road_permit_status_logs.changedById`, `system_alerts.targetId`, `tai_lieu.createdById`

## Khoá ngoại thiếu index

- `cchn_ho_so` · `cchn_ho_so_to_chuc_id_fkey`
- `cchn_ho_so` · `cchn_ho_so_created_by_id_fkey`
- `cchn_lich_su` · `cchn_lich_su_nguoi_id_fkey`
- `thanh_tich_con` · `thanh_tich_con_createdById_fkey`
