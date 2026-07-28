-- Bổ sung 2 trường phân loại cho administrative_units:
--   "huyenThiCu"  = huyện/thành phố/thị xã chủ quản TRƯỚC sáp nhập (Quảng Bình + Quảng Trị cũ)
--   "vungLoi"     = phân loại đô thị: Lõi đô thị | Thuộc đô thị (phần xã) | Bán đô thị (thị trấn) | Nông thôn | Đặc khu
-- Map theo mã GSO (contiguous theo huyện cũ) + thành phần cột truocSapNhap. Additive, idempotent.

ALTER TABLE administrative_units ADD COLUMN IF NOT EXISTS "huyenThiCu" text;
ALTER TABLE administrative_units ADD COLUMN IF NOT EXISTS "vungLoi"    text;

-- ===== huyenThiCu (đơn vị cấp huyện cũ) — theo mã =====
-- Quảng Bình cũ
UPDATE administrative_units SET "huyenThiCu"='Thành phố Đồng Hới' WHERE code IN ('18859','18871','18880');
UPDATE administrative_units SET "huyenThiCu"='Huyện Minh Hóa'      WHERE code IN ('18901','18904','18919','18922','18943');
UPDATE administrative_units SET "huyenThiCu"='Huyện Tuyên Hóa'     WHERE code IN ('18949','18952','18958','18985','18991','18997');
UPDATE administrative_units SET "huyenThiCu"='Thị xã Ba Đồn'       WHERE code IN ('19009','19066','19075','19093');
UPDATE administrative_units SET "huyenThiCu"='Huyện Quảng Trạch'   WHERE code IN ('19021','19030','19033','19051','19057');
UPDATE administrative_units SET "huyenThiCu"='Huyện Bố Trạch'      WHERE code IN ('19111','19126','19138','19141','19147','19159','19198');
UPDATE administrative_units SET "huyenThiCu"='Huyện Quảng Ninh'    WHERE code IN ('19204','19207','19225','19237');
UPDATE administrative_units SET "huyenThiCu"='Huyện Lệ Thủy'       WHERE code IN ('19246','19249','19255','19288','19291','19309','19318');
-- Quảng Trị cũ
UPDATE administrative_units SET "huyenThiCu"='Thành phố Đông Hà'   WHERE code IN ('19333','19351');
UPDATE administrative_units SET "huyenThiCu"='Thị xã Quảng Trị'    WHERE code IN ('19360');
UPDATE administrative_units SET "huyenThiCu"='Huyện Vĩnh Linh'     WHERE code IN ('19363','19366','19372','19405','19414');
UPDATE administrative_units SET "huyenThiCu"='Huyện Hướng Hóa'     WHERE code IN ('19429','19432','19435','19441','19462','19483','19489');
UPDATE administrative_units SET "huyenThiCu"='Huyện Gio Linh'      WHERE code IN ('19495','19496','19501','19537');
UPDATE administrative_units SET "huyenThiCu"='Huyện Đakrông'       WHERE code IN ('19555','19564','19567','19588','19594');
UPDATE administrative_units SET "huyenThiCu"='Huyện Cam Lộ'        WHERE code IN ('19597','19603');
UPDATE administrative_units SET "huyenThiCu"='Huyện Triệu Phong'   WHERE code IN ('19624','19639','19645','19654','19669');
UPDATE administrative_units SET "huyenThiCu"='Huyện Hải Lăng'      WHERE code IN ('19681','19699','19702','19735','19741');
UPDATE administrative_units SET "huyenThiCu"='Huyện Cồn Cỏ'        WHERE code IN ('19742');

-- ===== vungLoi (phân loại đô thị) =====
-- 1) Lõi đô thị: chứa phường nội thị của TP/thị xã cũ
UPDATE administrative_units SET "vungLoi"='Lõi đô thị'
  WHERE code IN ('18859','18871','18880','19009','19066','19333','19351','19360');
-- 2) Thuộc đô thị (phần xã): thuộc thị xã Ba Đồn cũ nhưng là xã ngoại thị (Nam Ba Đồn, Nam Gianh)
UPDATE administrative_units SET "vungLoi"='Thuộc đô thị (phần xã)'
  WHERE code IN ('19075','19093');
-- 3) Bán đô thị: xã hình thành từ thị trấn huyện lỵ / thị trấn nông trường
UPDATE administrative_units SET "vungLoi"='Bán đô thị (thị trấn)'
  WHERE code IN ('18901','18949','19111','19138','19198','19207','19246','19249','19363',
                 '19366','19414','19429','19432','19495','19496','19555','19597','19624','19681');
-- 4) Đặc khu đảo
UPDATE administrative_units SET "vungLoi"='Đặc khu' WHERE code IN ('19742');
-- 5) Còn lại: nông thôn
UPDATE administrative_units SET "vungLoi"='Nông thôn'
  WHERE type::text='PHUONG_XA' AND "vungLoi" IS NULL;
