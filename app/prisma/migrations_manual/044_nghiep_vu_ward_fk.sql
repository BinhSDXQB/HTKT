-- ============================================================================
-- Migration 044 — LIÊN THÔNG ĐỊA BÀN: nghiep_vu_ban_ghi."wardId" (FK)
--
-- Vấn đề: nghiep_vu_ban_ghi lưu địa bàn dưới dạng CHUỖI TÊN ("Phường Đồng Hới")
-- thay vì khoá ngoại tới administrative_units. Hậu quả:
--   - Đổi tên/sáp nhập đơn vị hành chính là ĐỨT liên kết dữ liệu nghiệp vụ.
--   - Không JOIN được để tổng hợp theo phường/xã, không dùng chung được với các
--     bảng khác (report_*, assets, streets... đều đã dùng wardId).
--   - Sai chính tả/khác cách viết tạo ra nhiều "địa bàn" ảo.
--
-- Đối chiếu trước khi chạy (19/8/2026): 156/156 bản ghi có diaBan đều KHỚP CHÍNH
-- XÁC administrative_units.name → backfill đạt 100%, không mất dữ liệu.
--
-- Cột diaBan được GIỮ LẠI làm nhãn hiển thị/dữ liệu gốc; wardId là nguồn liên kết.
--
-- Chạy: psql -U postgres -d ql_htkt -f prisma/migrations_manual/044_nghiep_vu_ward_fk.sql
-- ============================================================================

ALTER TABLE public.nghiep_vu_ban_ghi
  ADD COLUMN IF NOT EXISTS "wardId" TEXT;

-- Backfill: khớp theo tên đơn vị hành chính
UPDATE public.nghiep_vu_ban_ghi n
   SET "wardId" = a.id
  FROM public.administrative_units a
 WHERE n."wardId" IS NULL
   AND n."diaBan" IS NOT NULL
   AND a.name = n."diaBan";

ALTER TABLE public.nghiep_vu_ban_ghi DROP CONSTRAINT IF EXISTS nghiep_vu_ban_ghi_wardId_fkey;
ALTER TABLE public.nghiep_vu_ban_ghi
  ADD CONSTRAINT "nghiep_vu_ban_ghi_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES public.administrative_units(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "nghiep_vu_ban_ghi_wardId_idx"
  ON public.nghiep_vu_ban_ghi ("wardId");

COMMENT ON COLUMN public.nghiep_vu_ban_ghi."wardId" IS
  'FK tới administrative_units — nguồn liên kết địa bàn. Cột diaBan chỉ là nhãn hiển thị.';

-- Kiểm tra: số bản ghi có địa bàn nhưng CHƯA khớp được đơn vị hành chính
SELECT count(*) FILTER (WHERE "diaBan" IS NOT NULL)                        AS co_dia_ban,
       count(*) FILTER (WHERE "wardId"  IS NOT NULL)                       AS da_gan_fk,
       count(*) FILTER (WHERE "diaBan" IS NOT NULL AND "wardId" IS NULL)   AS chua_khop
FROM public.nghiep_vu_ban_ghi;
