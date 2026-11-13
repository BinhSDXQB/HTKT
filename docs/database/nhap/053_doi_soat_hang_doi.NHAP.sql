-- ============================================================================
-- BẢN NHÁP v2 — CHƯA DUYỆT, CHƯA ÁP VÀO CSDL THẬT. Không đặt vào
-- app/prisma/migrations_manual cho đến khi được duyệt.
--
-- Migration 053 — Hàng đợi đối soát dữ liệu (bước E2)
--
-- Vì sao: kế hoạch V7.2 yêu cầu bản ghi trùng, khớp nghi ngờ hoặc xung đột phiên
-- bản KHÔNG được tự ghi đè mà phải chờ người có quyền quyết định. Hiện hệ thống
-- không có nơi nào chứa các trường hợp đó. Bảng này là nơi chứa chung cho:
--   - khớp nghi ngờ khi nối dữ liệu (tuyến đường, dự án, địa bàn) — bước E6, E7;
--   - xung đột phiên bản khi đồng bộ tablet — bước E9;
--   - nhóm bản ghi nghi trùng.
--
-- Quy tắc được CSDL bảo đảm:
--   - dòng mới luôn ở trạng thái CHO_XU_LY, chưa có người và thời điểm xử lý;
--   - chuyển sang CHAP_NHAN / TU_CHOI / HUY phải có người xử lý; thời điểm tự đặt;
--   - dòng đã xử lý là bằng chứng: không sửa, không xoá (chỉ cho khoá ngoại tự về
--     NULL khi bản ghi được tham chiếu bị xoá cứng);
--   - mỗi (nguồn, đích, quy tắc) chỉ có một dòng đang chờ;
--   - khoa_chong_lap (nếu có) duy nhất trên toàn bảng, kể cả dòng đã đóng: dùng cho
--     thao tác gửi lặp từ tablet.
--
-- KHÔNG được CSDL bảo đảm, tầng ứng dụng phải làm (ghi trong DATA_SYNC_DESIGN.md):
--   - bản ghi nguồn/đích có tồn tại không (bảng đa hình, không có khoá ngoại cứng);
--   - khi quyết định: so phien_ban của dòng hàng đợi với bản người dùng đã xem, so
--     phiên bản bản ghi chính, và ghi dữ liệu chính + đổi trạng thái trong CÙNG giao dịch;
--   - quyền của người xử lý theo to_chuc_id / ward_id.
--
-- Chỉ thêm đối tượng mới; không đụng bảng hiện có. Chưa có mã ứng dụng nào dùng.
-- Migration MỘT LẦN: nếu bảng đã tồn tại thì từ chối.
-- Hoàn tác: 053_doi_soat_hang_doi_rollback.NHAP.sql
-- ============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.doi_soat_hang_doi') IS NOT NULL THEN
    RAISE EXCEPTION 'mig053: bảng public.doi_soat_hang_doi đã tồn tại. Migration đã áp; không tự vá bảng có sẵn.';
  END IF;
END $$;

CREATE TABLE public.doi_soat_hang_doi (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  loai             TEXT NOT NULL CHECK (loai IN ('TRUNG_LAP', 'KHOP_NGHI_NGO', 'XUNG_DOT_PHIEN_BAN', 'THIEU_CAN_CU')),
  bang_nguon       TEXT NOT NULL CHECK (btrim(bang_nguon) <> ''),
  id_nguon         TEXT NOT NULL CHECK (btrim(id_nguon) <> ''),
  bang_dich        TEXT CHECK (bang_dich IS NULL OR btrim(bang_dich) <> ''),
  id_dich          TEXT CHECK (id_dich IS NULL OR btrim(id_dich) <> ''),
  quy_tac          TEXT NOT NULL CHECK (btrim(quy_tac) <> ''),     -- mã quy tắc, ví dụ 'M2.KHOP_TEN_TRGM'
  do_tin_cay       NUMERIC(4,3) CHECK (do_tin_cay IS NULL OR do_tin_cay BETWEEN 0 AND 1),
  du_lieu_de_xuat  JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(du_lieu_de_xuat) = 'object'),
  du_lieu_hien_tai JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(du_lieu_hien_tai) = 'object'),
  phien_ban_nguon  INTEGER,                              -- phiên bản bản ghi nguồn lúc tạo dòng (khi bảng nguồn có cột version)
  khoa_chong_lap   TEXT CHECK (khoa_chong_lap IS NULL OR btrim(khoa_chong_lap) <> ''),
  to_chuc_id       TEXT REFERENCES public.to_chuc(id) ON DELETE SET NULL,           -- đơn vị có quyền xử lý
  ward_id          TEXT REFERENCES public.administrative_units(id) ON DELETE SET NULL,
  trang_thai       TEXT NOT NULL DEFAULT 'CHO_XU_LY' CHECK (trang_thai IN ('CHO_XU_LY', 'CHAP_NHAN', 'TU_CHOI', 'HUY')),
  nguoi_xu_ly_id   TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  xu_ly_luc        TIMESTAMPTZ,
  ghi_chu          TEXT,
  lo_tao           TEXT,                                 -- mã lô sinh hàng loạt, để huỷ cả lô (chuyển HUY) khi cần
  phien_ban        INTEGER NOT NULL DEFAULT 1,           -- tăng mỗi lần sửa dòng; người duyệt phải gửi lại số đã xem
  created_by_id    TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Đang chờ: chưa có người và thời điểm. Đã xử lý: phải có thời điểm (người có thể về NULL nếu tài khoản bị xoá cứng).
  CONSTRAINT doi_soat_xu_ly_nhat_quan CHECK (
    (trang_thai = 'CHO_XU_LY' AND xu_ly_luc IS NULL AND nguoi_xu_ly_id IS NULL)
    OR (trang_thai <> 'CHO_XU_LY' AND xu_ly_luc IS NOT NULL)),
  CONSTRAINT doi_soat_dich_nhat_quan CHECK ((bang_dich IS NULL) = (id_dich IS NULL)),
  -- Xung đột phiên bản phải mang đủ hai phía để người duyệt so sánh.
  CONSTRAINT doi_soat_xung_dot_du_du_lieu CHECK (
    loai <> 'XUNG_DOT_PHIEN_BAN' OR (du_lieu_de_xuat <> '{}'::jsonb AND du_lieu_hien_tai <> '{}'::jsonb))
);

-- Mỗi (nguồn, đích, quy tắc) chỉ có MỘT dòng đang chờ: chạy lại quy tắc không sinh trùng.
CREATE UNIQUE INDEX doi_soat_cho_xu_ly_duy_nhat
  ON public.doi_soat_hang_doi (bang_nguon, id_nguon, bang_dich, id_dich, quy_tac) NULLS NOT DISTINCT
  WHERE trang_thai = 'CHO_XU_LY';
-- Chống gửi lặp xuyên mọi trạng thái (thao tác tablet gửi lại sau khi dòng đã đóng).
CREATE UNIQUE INDEX doi_soat_khoa_chong_lap_duy_nhat
  ON public.doi_soat_hang_doi (khoa_chong_lap) WHERE khoa_chong_lap IS NOT NULL;

CREATE INDEX idx_doi_soat_trang_thai_loai ON public.doi_soat_hang_doi (trang_thai, loai, created_at);
CREATE INDEX idx_doi_soat_nguon           ON public.doi_soat_hang_doi (bang_nguon, id_nguon);
CREATE INDEX idx_doi_soat_to_chuc_id      ON public.doi_soat_hang_doi (to_chuc_id);
CREATE INDEX idx_doi_soat_ward_id         ON public.doi_soat_hang_doi (ward_id);
CREATE INDEX idx_doi_soat_nguoi_xu_ly_id  ON public.doi_soat_hang_doi (nguoi_xu_ly_id);
CREATE INDEX idx_doi_soat_created_by_id   ON public.doi_soat_hang_doi (created_by_id);
CREATE INDEX idx_doi_soat_lo_tao          ON public.doi_soat_hang_doi (lo_tao) WHERE lo_tao IS NOT NULL;

CREATE FUNCTION public.fn_doi_soat_truoc_ghi() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $fn$
DECLARE
  la_bang BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.trang_thai <> 'CHO_XU_LY' THEN
      RAISE EXCEPTION 'doi_soat_hang_doi: dòng % đã xử lý (%), là bằng chứng nên không xoá được', OLD.id, OLD.trang_thai
        USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.trang_thai <> 'CHO_XU_LY' THEN
      RAISE EXCEPTION 'doi_soat_hang_doi: dòng mới phải ở trạng thái CHO_XU_LY' USING ERRCODE = '23514';
    END IF;
    NEW.phien_ban := 1;
    -- Bảng nguồn/đích phải là BẢNG thường trong schema public (không nhận index, view, sequence).
    SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = NEW.bang_nguon) INTO la_bang;
    IF NOT la_bang THEN
      RAISE EXCEPTION 'doi_soat_hang_doi: bảng nguồn % không tồn tại', NEW.bang_nguon USING ERRCODE = '23514';
    END IF;
    IF NEW.bang_dich IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = NEW.bang_dich) INTO la_bang;
      IF NOT la_bang THEN
        RAISE EXCEPTION 'doi_soat_hang_doi: bảng đích % không tồn tại', NEW.bang_dich USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.trang_thai <> 'CHO_XU_LY' THEN
    -- Dòng đã xử lý: chỉ cho các khoá ngoại tự về NULL (ON DELETE SET NULL khi bản ghi tham chiếu bị xoá cứng).
    IF (to_jsonb(NEW) - 'nguoi_xu_ly_id' - 'created_by_id' - 'to_chuc_id' - 'ward_id')
         IS DISTINCT FROM (to_jsonb(OLD) - 'nguoi_xu_ly_id' - 'created_by_id' - 'to_chuc_id' - 'ward_id')
       OR (NEW.nguoi_xu_ly_id IS NOT NULL AND NEW.nguoi_xu_ly_id IS DISTINCT FROM OLD.nguoi_xu_ly_id)
       OR (NEW.created_by_id  IS NOT NULL AND NEW.created_by_id  IS DISTINCT FROM OLD.created_by_id)
       OR (NEW.to_chuc_id     IS NOT NULL AND NEW.to_chuc_id     IS DISTINCT FROM OLD.to_chuc_id)
       OR (NEW.ward_id        IS NOT NULL AND NEW.ward_id        IS DISTINCT FROM OLD.ward_id) THEN
      RAISE EXCEPTION 'doi_soat_hang_doi: dòng % đã xử lý (%), không sửa được; tạo dòng mới nếu cần xét lại', OLD.id, OLD.trang_thai
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.bang_nguon IS DISTINCT FROM OLD.bang_nguon OR NEW.id_nguon IS DISTINCT FROM OLD.id_nguon
     OR NEW.bang_dich IS DISTINCT FROM OLD.bang_dich OR NEW.id_dich IS DISTINCT FROM OLD.id_dich
     OR NEW.quy_tac IS DISTINCT FROM OLD.quy_tac OR NEW.loai IS DISTINCT FROM OLD.loai
     OR NEW.khoa_chong_lap IS DISTINCT FROM OLD.khoa_chong_lap
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'doi_soat_hang_doi: không được đổi mã, nguồn, đích, quy tắc, loại hay khoá chống lặp của dòng %', OLD.id
      USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  NEW.phien_ban := OLD.phien_ban + 1;
  IF NEW.trang_thai <> 'CHO_XU_LY' THEN
    IF NEW.nguoi_xu_ly_id IS NULL THEN
      RAISE EXCEPTION 'doi_soat_hang_doi: xử lý dòng % phải ghi người xử lý (nguoi_xu_ly_id)', OLD.id USING ERRCODE = '23514';
    END IF;
    NEW.xu_ly_luc := now();
  END IF;
  RETURN NEW;
END $fn$;

CREATE TRIGGER trg_doi_soat_truoc_ghi BEFORE INSERT OR UPDATE OR DELETE ON public.doi_soat_hang_doi
  FOR EACH ROW EXECUTE FUNCTION public.fn_doi_soat_truoc_ghi();

CREATE FUNCTION public.fn_doi_soat_chan_truncate() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $fn$
BEGIN
  RAISE EXCEPTION 'doi_soat_hang_doi: không TRUNCATE bảng bằng chứng đối soát' USING ERRCODE = '23514';
END $fn$;

CREATE TRIGGER trg_doi_soat_chan_truncate BEFORE TRUNCATE ON public.doi_soat_hang_doi
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_doi_soat_chan_truncate();

COMMENT ON TABLE public.doi_soat_hang_doi IS
  'Hàng đợi đối soát: bản ghi trùng, khớp nghi ngờ, xung đột phiên bản chờ người có quyền quyết định. Dòng đã xử lý là bằng chứng, không sửa không xoá.';

COMMIT;
