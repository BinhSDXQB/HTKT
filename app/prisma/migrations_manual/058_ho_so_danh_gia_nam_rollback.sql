-- Hoàn nguyên migration 058: gỡ 3 bảng hồ sơ đánh giá cuối năm.
-- MẤT DỮ LIỆU CÓ CHỦ Ý: toàn bộ tự đánh giá, nhận xét, điểm KPI, nhật ký của các hồ sơ đã nhập.
-- Mức xếp loại chính thức đã ghi vào office_annual_evaluations KHÔNG bị ảnh hưởng (bảng đó không thuộc 058).
-- Từ chối nếu còn hồ sơ đã phê duyệt/lưu, để không vô tình xoá kết quả chính thức chưa sao lưu.
-- Chạy lại được: bảng không tồn tại thì không làm gì.

BEGIN;

-- Khoá chặn ghi các bảng 058 trước khi đếm, để không có hồ sơ vừa được duyệt chen vào giữa lúc kiểm tra và lúc xoá.
DO $$ BEGIN
  IF to_regclass('public.office_year_reviews') IS NOT NULL THEN LOCK TABLE public.office_year_reviews IN ACCESS EXCLUSIVE MODE; END IF;
  IF to_regclass('public.office_year_dept_reviews') IS NOT NULL THEN LOCK TABLE public.office_year_dept_reviews IN ACCESS EXCLUSIVE MODE; END IF;
  IF to_regclass('public.office_year_review_logs') IS NOT NULL THEN LOCK TABLE public.office_year_review_logs IN ACCESS EXCLUSIVE MODE; END IF;
END $$;

DO $$
DECLARE n integer;
BEGIN
  IF to_regclass('public.office_year_reviews') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.office_year_reviews WHERE "trangThai" IN (''DA_PHE_DUYET'', ''LUU_HO_SO'')' INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Còn % hồ sơ đã phê duyệt/lưu trong office_year_reviews: sao lưu rồi xử lý trước khi hoàn nguyên', n;
    END IF;
  END IF;
  IF to_regclass('public.office_year_dept_reviews') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.office_year_dept_reviews WHERE "trangThai" IN (''DA_PHE_DUYET'', ''LUU_HO_SO'')' INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Còn % hồ sơ tập thể đã phê duyệt/lưu: sao lưu rồi xử lý trước khi hoàn nguyên', n;
    END IF;
  END IF;
END $$;

DROP TABLE IF EXISTS public.office_year_review_logs;
DROP TABLE IF EXISTS public.office_year_reviews;
DROP TABLE IF EXISTS public.office_year_dept_reviews;

-- Gỡ 3 quyền do 058 thêm (role_permissions xoá theo FK của permissions nếu có CASCADE; xoá tường minh cho chắc)
DELETE FROM role_permissions WHERE "permissionId" IN (SELECT id FROM permissions WHERE module = 'office' AND action IN ('annual_evaluation_approve', 'party_review_view', 'party_review_manage'));
DELETE FROM permissions WHERE module = 'office' AND action IN ('annual_evaluation_approve', 'party_review_view', 'party_review_manage');

COMMIT;
