-- 039: Dữ liệu MẪU/thử nghiệm QĐ 72 (Mục 14). Idempotent (ON CONFLICT), có rollback
-- (039_qd72_sample_data_rollback.sql — xoá theo id/ma LIKE 'DEMO-%'). Chỉ ghi vào bảng qd72_*.
-- Tham chiếu 1 xã/phường + 1 user THẬT (subquery); toạ độ quanh Đồng Hới (~17.47, 106.62).
DO $$
DECLARE v_ward text; v_user text;
BEGIN
  SELECT id INTO v_ward FROM administrative_units WHERE type = 'PHUONG_XA' ORDER BY name LIMIT 1;
  SELECT id INTO v_user FROM users ORDER BY id LIMIT 1;
  IF v_ward IS NULL OR v_user IS NULL THEN
    RAISE NOTICE 'Bỏ qua seed DEMO: thiếu administrative_units(PHUONG_XA) hoặc users.';
    RETURN;
  END IF;

  -- Danh mục chủ sở hữu (DEMO)
  INSERT INTO qd72_utility_owners(id, ma, ten, loai) VALUES
    ('DEMO-OWNER-DIEN','DEMO-DIEN','[DEMO] Điện lực Đồng Hới','DIEN_LUC'),
    ('DEMO-OWNER-VT','DEMO-VT','[DEMO] Viễn thông tỉnh','VIEN_THONG')
  ON CONFLICT (id) DO NOTHING;

  -- Hồ sơ 1: đầy đủ, sơ bộ "không đạt - có thể cải tạo"
  INSERT INTO qd72_survey_cases(id, ma, ten, don_vi_hanh_chinh_id, trang_thai, nhom_danh_gia, ngay_khao_sat, thanh_phan_khao_sat, created_by_id)
  VALUES ('DEMO-CASE-1','DEMO-QD72-001','[DEMO] Khu vực đô thị mẫu',v_ward,'SUBMITTED','KHONG_DAT_CO_THE_CAI_TAO',CURRENT_DATE,'UBND phường + Công an khu vực',v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Hồ sơ 2: CHƯA ĐỦ DỮ LIỆU
  INSERT INTO qd72_survey_cases(id, ma, ten, don_vi_hanh_chinh_id, trang_thai, nhom_danh_gia, created_by_id)
  VALUES ('DEMO-CASE-2','DEMO-QD72-002','[DEMO] Hồ sơ chưa đủ dữ liệu',v_ward,'DRAFT','CHUA_DU_DU_LIEU',v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Khu vực đô thị (ranh giới)
  INSERT INTO qd72_urban_areas(id, survey_case_id, don_vi_hanh_chinh_id, ma, ten, can_cu_xac_dinh, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-URBAN-1','DEMO-CASE-1',v_ward,'DEMO-KV-1','[DEMO] Tổ dân phố 1','Theo quy hoạch đô thị được duyệt',
    '{"type":"Polygon","coordinates":[[[106.620,17.468],[106.624,17.468],[106.624,17.471],[106.620,17.471],[106.620,17.468]]]}'::jsonb,17.4695,106.622,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Đoạn đường RỘNG < 3,5 m và cao thông thủy < 4,5 m
  INSERT INTO qd72_road_segments(id, survey_case_id, don_vi_hanh_chinh_id, ma, ten, chieu_dai_m, rong_thong_thuy_min_m, cao_thong_thuy_min_m, la_duong_cut, chieu_dai_cut_m, co_diem_quay_xe, de_xuat_chinh_trang, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-ROAD-1','DEMO-CASE-1',v_ward,'DEMO-D-1','[DEMO] Hẻm 12', 60, 3.0, 4.2, true, 60, false, 'Mở rộng + di dời vật cản',
    '{"type":"LineString","coordinates":[[106.621,17.469],[106.6215,17.4695]]}'::jsonb,17.4692,106.6212,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Dây điện thấp < 4,5 m
  INSERT INTO qd72_overhead_utility_lines(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_doi_tuong, ten_tuyen, owner_id, trang_thai_chu_so_huu, cao_diem_thap_nhat_m, co_can_tro_xe_cc, tinh_trang_su_dung, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-LINE-DIEN-1','DEMO-CASE-1',v_ward,'DEMO-DD-1','Đường dây điện hạ thế','[DEMO] Tuyến hạ thế A','DEMO-OWNER-DIEN','XAC_DINH', 3.8, true, 'Đang sử dụng',
    '{"type":"LineString","coordinates":[[106.621,17.469],[106.622,17.4695]]}'::jsonb,17.4692,106.6215,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Cáp viễn thông CHÙNG VÕNG
  INSERT INTO qd72_overhead_utility_lines(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_doi_tuong, ten_tuyen, owner_id, trang_thai_chu_so_huu, cao_diem_thap_nhat_m, do_vong_quan_sat, tinh_trang_su_dung, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-LINE-VT-1','DEMO-CASE-1',v_ward,'DEMO-VT-1','Cáp viễn thông','[DEMO] Cáp VT tuyến B','DEMO-OWNER-VT','XAC_DINH', 4.0, 'Võng nặng, bó rối', 'Đang sử dụng',
    '{"type":"LineString","coordinates":[[106.6215,17.4692],[106.6225,17.4697]]}'::jsonb,17.4694,106.622,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Cáp KHÔNG XÁC ĐỊNH CHỦ SỞ HỮU
  INSERT INTO qd72_overhead_utility_lines(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_doi_tuong, ten_tuyen, chu_so_huu_text, trang_thai_chu_so_huu, cao_diem_thap_nhat_m, tinh_trang_su_dung, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-LINE-UNKNOWN','DEMO-CASE-1',v_ward,'DEMO-VT-2','Cáp thông tin khác','[DEMO] Cáp không rõ chủ', NULL,'CHUA_XAC_DINH', 4.1, 'Chưa xác định',
    '{"type":"LineString","coordinates":[[106.6218,17.4691],[106.6228,17.4696]]}'::jsonb,17.4693,106.6223,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Cáp KHÔNG CÒN SỬ DỤNG
  INSERT INTO qd72_overhead_utility_lines(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_doi_tuong, ten_tuyen, owner_id, trang_thai_chu_so_huu, tinh_trang_su_dung, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-LINE-UNUSED','DEMO-CASE-1',v_ward,'DEMO-VT-3','Cáp truyền hình','[DEMO] Cáp cũ ngừng dùng','DEMO-OWNER-VT','XAC_DINH','Ngừng sử dụng',
    '{"type":"LineString","coordinates":[[106.6219,17.4690],[106.6229,17.4695]]}'::jsonb,17.4692,106.6224,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Cần đèn GÂY CẢN TRỞ
  INSERT INTO qd72_overhead_utility_lines(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_doi_tuong, ten_tuyen, trang_thai_chu_so_huu, cao_diem_thap_nhat_m, co_can_tro_xe_cc, tinh_trang_su_dung, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-LAMP-1','DEMO-CASE-1',v_ward,'DEMO-CS-1','Cần đèn / đèn trang trí','[DEMO] Cần đèn ngã ba','XAC_DINH', 4.3, true, 'Đang sử dụng',
    '{"type":"Point","coordinates":[106.6216,17.4693]}'::jsonb,17.4693,106.6216,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Cột điện NGHIÊNG
  INSERT INTO qd72_utility_poles(id, survey_case_id, ma, so_hieu, loai_cot, dung_chung, owner_id, tinh_trang, geometry, tam_lat, tam_lng)
  VALUES ('DEMO-POLE-1','DEMO-CASE-1','DEMO-COT-1','DH-A12','Bê tông ly tâm', true,'DEMO-OWNER-DIEN','Nghiêng ~10°, móng yếu',
    '{"type":"Point","coordinates":[106.6214,17.4692]}'::jsonb,17.4692,106.6214)
  ON CONFLICT (id) DO NOTHING;

  -- Phương án BÓ GỌN + HẠ NGẦM
  INSERT INTO qd72_undergrounding_proposals(id, survey_case_id, line_id, ma, cac_phuong_an, muc_uu_tien, don_vi_chu_tri)
  VALUES ('DEMO-PROP-BOGON','DEMO-CASE-1','DEMO-LINE-VT-1','DEMO-PA-1','["3. Bó gọn, sắp xếp lại cáp"]'::jsonb,'TRUNG_BINH','Doanh nghiệp viễn thông')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO qd72_undergrounding_proposals(id, survey_case_id, line_id, ma, cac_phuong_an, muc_uu_tien, don_vi_chu_tri)
  VALUES ('DEMO-PROP-HANGAM','DEMO-CASE-1','DEMO-LINE-DIEN-1','DEMO-PA-2','["13. Hạ ngầm đồng bộ điện + viễn thông + chiếu sáng","12. Xây dựng mới cống cáp/hào kỹ thuật dùng chung"]'::jsonb,'CAO','Sở Xây dựng')
  ON CONFLICT (id) DO NOTHING;

  -- Tuyến ĐÃ CÓ cống cáp dùng chung
  INSERT INTO qd72_shared_technical_infrastructure(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai, chieu_dai_m, con_du_phong, geometry, tam_lat, tam_lng)
  VALUES ('DEMO-SHARED-1','DEMO-CASE-1',v_ward,'DEMO-HTDC-1','CONG_CAP', 120, true,
    '{"type":"LineString","coordinates":[[106.620,17.4688],[106.623,17.4688]]}'::jsonb,17.4688,106.6215)
  ON CONFLICT (id) DO NOTHING;

  -- Khu vực THIẾU NGUỒN NƯỚC (nguồn xa khu bảo vệ > 400 m — chi_tiet)
  INSERT INTO qd72_water_sources(id, survey_case_id, don_vi_hanh_chinh_id, ma, loai_nguon, ten, tinh_trang, mang_vong_hay_cut, chieu_dai_cut_m, chi_tiet, de_xuat_sua_chua, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-WATER-1','DEMO-CASE-1',v_ward,'DEMO-NN-1','Ao/hồ','[DEMO] Hồ điều hoà','Hoạt động','Mạng cụt', 260, '{"khoang_cach_khu_bao_ve_m":520}'::jsonb,'Bổ sung trụ nước / bến lấy nước',
    '{"type":"Point","coordinates":[106.6255,17.4705]}'::jsonb,17.4705,106.6255,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Kế hoạch chỉnh trang ĐANG THỰC HIỆN
  INSERT INTO qd72_renovation_plans(id, survey_case_id, don_vi_hanh_chinh_id, ma, van_de_ton_tai, giai_phap, nhom_giai_phap, muc_uu_tien, co_quan_chu_tri, nguon_von, kinh_phi, nam_thuc_hien, tien_do, geometry, tam_lat, tam_lng, created_by_id)
  VALUES ('DEMO-PLAN-1','DEMO-CASE-1',v_ward,'DEMO-KH-1','Hẻm 12 rộng 3,0 m và dây võng thấp','Mở rộng hẻm + hạ ngầm đồng bộ','Hạ ngầm đường dây điện','Cao','UBND phường','Ngân sách tỉnh + XHH', 850000000, EXTRACT(YEAR FROM CURRENT_DATE)::int,'Đang thực hiện',
    '{"type":"Point","coordinates":[106.6212,17.4692]}'::jsonb,17.4692,106.6212,v_user)
  ON CONFLICT (id) DO NOTHING;

  -- Lịch sử workflow mẫu
  INSERT INTO qd72_workflow_history(id, survey_case_id, trang_thai_cu, trang_thai_moi, y_kien, nguoi_thuc_hien_id)
  VALUES ('DEMO-WF-1','DEMO-CASE-1','DRAFT','SUBMITTED','[DEMO] Xã gửi hồ sơ',v_user)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Đã seed dữ liệu DEMO QĐ72 cho ward=% user=%', v_ward, v_user;
END $$;
