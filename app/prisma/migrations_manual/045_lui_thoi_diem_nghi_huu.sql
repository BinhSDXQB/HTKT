-- ============================================================================
-- Migration 045 — LÙI THỜI ĐIỂM NGHỈ HƯU (Nghị định 170/2025/NĐ-CP, Điều 61)
--
-- Vấn đề: can_bo."ngayVeHuu" là giá trị MÁY TÍNH theo Nghị định 135/2020/NĐ-CP
-- (nguyên gốc là cột S công thức trong file Excel QLNS, nay tính bằng
-- lib/nghi-huu.ts). Hệ thống KHÔNG có chỗ nào ghi thời điểm nghỉ hưu THỰC TẾ khi
-- người có thẩm quyền quyết định lùi. Hậu quả: Thông báo (Mẫu số 2) và Quyết định
-- nghỉ hưu (Mẫu số 3) đang lấy thẳng ngày máy tính, có thể ghi sai thời điểm.
--
-- Căn cứ nguyên văn Điều 61 Nghị định 170/2025/NĐ-CP (bản gốc trong kho tài liệu
-- của Sở, tệp 170_2025_ND-CP_663212.docx):
--   Khoản 3. Thời điểm nghỉ hưu được lùi theo một trong các trường hợp sau:
--     a) KHÔNG QUÁ 01 THÁNG: trùng ngày nghỉ Tết Nguyên đán; vợ/chồng, bố, mẹ
--        (vợ/chồng), con từ trần hoặc bị Toà án tuyên bố mất tích; bản thân và
--        gia đình bị thiệt hại do thiên tai, địch hoạ, hoả hoạn;
--     b) KHÔNG QUÁ 03 THÁNG: bị bệnh nặng hoặc bị tai nạn có giấy xác nhận của
--        bệnh viện;
--     c) KHÔNG QUÁ 06 THÁNG: đang điều trị bệnh thuộc danh mục bệnh cần chữa trị
--        dài ngày do Bộ Y tế ban hành, có giấy xác nhận của bệnh viện.
--   Khoản 4. Thuộc nhiều trường hợp thì CHỈ áp dụng MỘT trường hợp có thời gian
--        lùi nhiều nhất → trần tuyệt đối là 06 tháng.
--   Khoản 5. Người có thẩm quyền cho nghỉ hưu QUYẾT ĐỊNH việc lùi, trừ trường hợp
--        công chức không có nguyện vọng lùi.
--
-- Thiết kế: KHÔNG đổi ý nghĩa cột "ngayVeHuu" (giữ = ngày DỰ KIẾN, dữ liệu cũ
-- nguyên vẹn). Thêm cột ghi quyết định lùi; nơi hiển thị và nơi sinh văn bản lấy
-- ngày lùi nếu có, ngược lại lấy ngày dự kiến và ghi rõ "dự kiến".
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/045_lui_thoi_diem_nghi_huu.sql
-- ============================================================================

ALTER TABLE public.can_bo
  ADD COLUMN IF NOT EXISTS "ngayNghiHuuLui"   DATE,
  ADD COLUMN IF NOT EXISTS "truongHopLui"     TEXT,
  ADD COLUMN IF NOT EXISTS "vanBanLuiNghiHuu" TEXT;

COMMENT ON COLUMN public.can_bo."ngayVeHuu" IS
  'Ngày nghỉ hưu DỰ KIẾN — máy tính theo NĐ 135/2020 (lib/nghi-huu.ts). Không phải quyết định.';
COMMENT ON COLUMN public.can_bo."ngayNghiHuuLui" IS
  'Thời điểm nghỉ hưu sau khi LÙI — do người có thẩm quyền quyết định (NĐ 170/2025 Điều 61 khoản 5).';
COMMENT ON COLUMN public.can_bo."truongHopLui" IS
  'Trường hợp lùi theo NĐ 170/2025 Điều 61 khoản 3: A (≤1 tháng), B (≤3 tháng), C (≤6 tháng).';
COMMENT ON COLUMN public.can_bo."vanBanLuiNghiHuu" IS
  'Số, ngày văn bản của người có thẩm quyền quyết định lùi thời điểm nghỉ hưu.';

-- Trường hợp lùi chỉ nhận đúng 3 giá trị của khoản 3.
ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_truong_hop_lui_check;
ALTER TABLE public.can_bo
  ADD CONSTRAINT can_bo_truong_hop_lui_check
  CHECK ("truongHopLui" IS NULL OR "truongHopLui" IN ('A', 'B', 'C'));

-- Lùi phải SAU ngày dự kiến và KHÔNG QUÁ trần của từng trường hợp (khoản 3, 4).
-- Trần tính theo mốc tháng: lùi tối đa n tháng kể từ ngày nghỉ hưu dự kiến.
--
-- KHÔNG được viết 'OR "ngayVeHuu" IS NULL': như vậy hồ sơ thiếu ngày dự kiến sẽ lọt
-- MỌI kiểm tra, ghi được ngày lùi tuỳ ý. Không có mốc dự kiến thì không đối chiếu
-- được trần lùi → cấm luôn việc ghi ngày lùi.
ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_ngay_lui_check;
ALTER TABLE public.can_bo
  ADD CONSTRAINT can_bo_ngay_lui_check
  CHECK (
    "ngayNghiHuuLui" IS NULL
    OR (
      "ngayVeHuu" IS NOT NULL
      AND "ngayNghiHuuLui" > "ngayVeHuu"
      AND "ngayNghiHuuLui" <= ("ngayVeHuu" + (CASE "truongHopLui"
                                                WHEN 'A' THEN INTERVAL '1 month'
                                                WHEN 'B' THEN INTERVAL '3 months'
                                                WHEN 'C' THEN INTERVAL '6 months'
                                                ELSE INTERVAL '0 month' END))
    )
  );

-- Ba trường đi liền một khối: HOẶC cả ba đều trống, HOẶC cả ba đều có (khoản 5 —
-- việc lùi phải do người có thẩm quyền quyết định, nên bắt buộc có văn bản).
-- Ràng buộc hai chiều: cấm cả "có ngày lùi mà thiếu văn bản" lẫn "có trường hợp
-- lùi / văn bản mà không có ngày lùi" (dữ liệu rác).
-- btrim(...) <> '': chặn chuỗi rỗng và chuỗi toàn khoảng trắng, vì NOT NULL không chặn.
ALTER TABLE public.can_bo DROP CONSTRAINT IF EXISTS can_bo_lui_du_can_cu_check;
ALTER TABLE public.can_bo
  ADD CONSTRAINT can_bo_lui_du_can_cu_check
  CHECK (
    (
      "ngayNghiHuuLui" IS NULL
      AND "truongHopLui" IS NULL
      AND "vanBanLuiNghiHuu" IS NULL
    )
    OR (
      "ngayNghiHuuLui" IS NOT NULL
      AND "truongHopLui" IS NOT NULL
      AND "vanBanLuiNghiHuu" IS NOT NULL
      AND btrim("vanBanLuiNghiHuu") <> ''
    )
  );

-- Lọc nhanh danh sách đã lùi (số bản ghi rất ít nên dùng chỉ mục bộ phận).
CREATE INDEX IF NOT EXISTS can_bo_ngay_nghi_huu_lui_idx
  ON public.can_bo ("ngayNghiHuuLui")
  WHERE "ngayNghiHuuLui" IS NOT NULL;

ANALYZE public.can_bo;
