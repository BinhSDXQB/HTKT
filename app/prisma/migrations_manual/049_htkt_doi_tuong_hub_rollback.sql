-- Hoàn nguyên migration 049 (bảng trung tâm đối tượng HTKT + dải số hiệu QĐ 56). Chỉ chạy khi chắc chắn:
-- XOÁ toàn bộ hồ sơ trong htkt_doi_tuong và liên kết "doiTuongId" của 7 Biểu mẫu (dữ liệu Biểu mẫu giữ nguyên).
BEGIN;
DROP VIEW IF EXISTS v_htkt_doi_tuong_tong_hop;
DROP VIEW IF EXISTS v_dai_so_hieu_xa;
DROP VIEW IF EXISTS v_htkt_doi_tuong;
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['report_duong','report_dien_cs','report_thoat_nuoc','report_cay_xanh',
                           'report_cong_vien','report_cap_nuoc','report_bai_do_xe'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || t || '_lien_ket', t);
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', t, 'fk_' || t || '_doi_tuong');
    EXECUTE format('DROP INDEX IF EXISTS %I', 'idx_' || t || '_doi_tuong');
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "doiTuongId"', t);
  END LOOP;
END $$;
DROP FUNCTION IF EXISTS fn_bao_cao_kiem_lien_ket();
DROP TABLE IF EXISTS htkt_doi_tuong;
DROP FUNCTION IF EXISTS fn_htkt_goi_y_so_hieu(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS fn_htkt_truoc_ghi();
DROP FUNCTION IF EXISTS fn_htkt_dien_tich_m2(JSONB);
DROP FUNCTION IF EXISTS fn_htkt_do_dai_m(JSONB);
DROP FUNCTION IF EXISTS fn_htkt_dinh(JSONB);
ALTER TABLE administrative_units DROP CONSTRAINT IF EXISTS ex_au_dai_dth;
ALTER TABLE administrative_units DROP CONSTRAINT IF EXISTS ex_au_dai_dx;
ALTER TABLE administrative_units DROP CONSTRAINT IF EXISTS ck_au_dai_so_hieu;
ALTER TABLE administrative_units
  DROP COLUMN IF EXISTS "soHieuCanCu",
  DROP COLUMN IF EXISTS "soHieuDthDen",
  DROP COLUMN IF EXISTS "soHieuDthTu",
  DROP COLUMN IF EXISTS "soHieuDxDen",
  DROP COLUMN IF EXISTS "soHieuDxTu";
COMMIT;
