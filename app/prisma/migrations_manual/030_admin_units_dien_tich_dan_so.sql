-- ============================================================================
-- Bổ sung DIỆN TÍCH – DÂN SỐ cho 78 đơn vị hành chính cấp xã tỉnh Quảng Trị
-- Nguồn: sapnhap.bando.com.vn (Bộ Nông nghiệp & Môi trường), căn cứ
--        Nghị quyết 1680/NQ-UBTVQH15; mã ĐVHC theo QĐ 19/2025/QĐ-TTg.
-- Tổng: 78 ĐVHC (8 phường, 69 xã, 1 đặc khu) · 12.700 km² · 1.870.844 người.
-- Join theo administrative_units.code = mã ĐVHC. Additive, idempotent.
-- ============================================================================

ALTER TABLE administrative_units
  ADD COLUMN IF NOT EXISTS "dienTichKm2"  numeric(9,2),
  ADD COLUMN IF NOT EXISTS "danSo"        integer,
  ADD COLUMN IF NOT EXISTS "trungTamHc"   text,
  ADD COLUMN IF NOT EXISTS "truocSapNhap" text;

COMMENT ON COLUMN administrative_units."dienTichKm2"  IS 'Diện tích tự nhiên (km2) - NQ 1680';
COMMENT ON COLUMN administrative_units."danSo"        IS 'Quy mô dân số (người) - NQ 1680';
COMMENT ON COLUMN administrative_units."trungTamHc"   IS 'Nơi đặt trung tâm hành chính đơn vị mới';
COMMENT ON COLUMN administrative_units."truocSapNhap" IS 'Các ĐVHC cũ hợp thành (hoặc "giữ nguyên")';

UPDATE administrative_units SET "dienTichKm2"=2.3, "danSo"=139, "trungTamHc"='UBND huyện đảo Cồn Cỏ (cũ)', "truocSapNhap"='Huyện Cồn Cỏ' WHERE code='19742';
UPDATE administrative_units SET "dienTichKm2"=20.45, "danSo"=28805, "trungTamHc"='UBND thị xã Ba Đồn (cũ)', "truocSapNhap"='Phường Quảng Phong, Phường Quảng Long, Phường Ba Đồn, Xã Quảng Hải' WHERE code='19009';
UPDATE administrative_units SET "dienTichKm2"=31.14, "danSo"=32800, "trungTamHc"='UBND phường Quảng Thọ (cũ)', "truocSapNhap"='Phường Quảng Phúc, Phường Quảng Thọ, Phường Quảng Thuận' WHERE code='19066';
UPDATE administrative_units SET "dienTichKm2"=38.05, "danSo"=50915, "trungTamHc"='UBND phường 3 và phường Đông Thanh (cũ)', "truocSapNhap"='Phường 1 (thành phố Đông Hà), Phường 3 (thành phố Đông Hà), Phường 4, Phường Đông Giang, Phường Đông Thanh' WHERE code='19333';
UPDATE administrative_units SET "dienTichKm2"=41.35, "danSo"=84196, "trungTamHc"='UBND TP Đồng Hới (cũ)', "truocSapNhap"='Phường Đức Ninh Đông, Phường Đồng Hải, Phường Đồng Phú, Phường Phú Hải, Phường Hải Thành, Phường Nam Lý, Xã Bảo Ninh, Xã Đức Ninh' WHERE code='18880';
UPDATE administrative_units SET "dienTichKm2"=88.03, "danSo"=32396, "trungTamHc"='UBND phường Đồng Sơn (cũ)', "truocSapNhap"='Phường Bắc Nghĩa, Phường Đồng Sơn, Xã Nghĩa Ninh, Xã Thuận Đức' WHERE code='18871';
UPDATE administrative_units SET "dienTichKm2"=26.49, "danSo"=38521, "trungTamHc"='UBND phường Bắc Lý (cũ)', "truocSapNhap"='Phường Bắc Lý, Xã Lộc Ninh, Xã Quang Phú' WHERE code='18859';
UPDATE administrative_units SET "dienTichKm2"=35.04, "danSo"=61204, "trungTamHc"='Trụ sở phân hiệu Đại học Huế (đường Lý Thường Kiệt) và Trung tâm văn hóa phường 5 (cũ)', "truocSapNhap"='Phường 2 (thành phố Đông Hà), Phường 5, Phường Đông Lễ, Phường Đông Lương' WHERE code='19351';
UPDATE administrative_units SET "dienTichKm2"=72.82, "danSo"=29705, "trungTamHc"='UBND thị xã Quảng Trị (cũ)', "truocSapNhap"='Phường 1, Phường 2, Phường 3 (thị xã Quảng Trị), Phường An Đôn, Xã Hải Lệ' WHERE code='19360';
UPDATE administrative_units SET "dienTichKm2"=112.41, "danSo"=11058, "trungTamHc"='UBND xã A Dơi (cũ)', "truocSapNhap"='Xã Ba Tầng, Xã Xy, Xã A Dơi' WHERE code='19483';
UPDATE administrative_units SET "dienTichKm2"=116.74, "danSo"=19061, "trungTamHc"='UBND xã Triệu Giang (cũ)', "truocSapNhap"='Xã Triệu Ái, Xã Triệu Giang, Xã Triệu Long' WHERE code='19669';
UPDATE administrative_units SET "dienTichKm2"=210.58, "danSo"=5151, "trungTamHc"='UBND xã Triệu Nguyên (cũ)', "truocSapNhap"='Xã Triệu Nguyên, Xã Ba Lòng' WHERE code='19567';
UPDATE administrative_units SET "dienTichKm2"=97.61, "danSo"=36861, "trungTamHc"='UBND xã Bắc Trạch (cũ)', "truocSapNhap"='Xã Thanh Trạch, Xã Hạ Mỹ, Xã Liên Trạch, Xã Bắc Trạch' WHERE code='19126';
UPDATE administrative_units SET "dienTichKm2"=54.77, "danSo"=16052, "trungTamHc"='UBND xã Trung Hải (cũ)', "truocSapNhap"='Xã Trung Hải, Xã Trung Giang, Xã Trung Sơn' WHERE code='19501';
UPDATE administrative_units SET "dienTichKm2"=278.99, "danSo"=9447, "trungTamHc"='UBND thị trấn Bến Quan (cũ)', "truocSapNhap"='Thị trấn Bến Quan, Xã Vĩnh Ô, Xã Vĩnh Hà, Xã Vĩnh Khê' WHERE code='19366';
UPDATE administrative_units SET "dienTichKm2"=299.42, "danSo"=33230, "trungTamHc"='UBND xã Cự Nẫm (cũ)', "truocSapNhap"='Xã Hưng Trạch, Xã Cự Nẫm, Xã Vạn Trạch, Xã Phú Định' WHERE code='19141';
UPDATE administrative_units SET "dienTichKm2"=87.89, "danSo"=26663, "trungTamHc"='UBND xã Ngư Thủy Bắc (cũ)', "truocSapNhap"='Xã Cam Thủy (huyện Lệ Thủy), Xã Thanh Thủy, Xã Hồng Thủy, Xã Ngư Thủy Bắc' WHERE code='19255';
UPDATE administrative_units SET "dienTichKm2"=166.85, "danSo"=30111, "trungTamHc"='UBND huyện Cam Lộ (cũ)', "truocSapNhap"='Thị trấn Cam Lộ, Xã Cam Thành, Xã Cam Chính, Xã Cam Nghĩa' WHERE code='19597';
UPDATE administrative_units SET "dienTichKm2"=268.58, "danSo"=20907, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Hải Thái, Xã Linh Trường, Xã Gio An, Xã Gio Sơn' WHERE code='19537';
UPDATE administrative_units SET "dienTichKm2"=59.83, "danSo"=29398, "trungTamHc"='UBND thị trấn Cửa Tùng (cũ)', "truocSapNhap"='Thị trấn Cửa Tùng, Xã Vĩnh Giang, Xã Hiền Thành, Xã Kim Thạch' WHERE code='19414';
UPDATE administrative_units SET "dienTichKm2"=50.83, "danSo"=27143, "trungTamHc"='UBND thị trấn Cửa Việt (cũ)', "truocSapNhap"='Thị trấn Cửa Việt, Xã Gio Mai, Xã Gio Hải' WHERE code='19496';
UPDATE administrative_units SET "dienTichKm2"=365, "danSo"=9532, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Trọng Hóa, Xã Dân Hóa' WHERE code='18904';
UPDATE administrative_units SET "dienTichKm2"=87.97, "danSo"=25133, "trungTamHc"='UBND thị trấn Hải Lăng (cũ)', "truocSapNhap"='Thị trấn Diên Sanh, Xã Hải Trường, Xã Hải Định' WHERE code='19681';
UPDATE administrative_units SET "dienTichKm2"=359.29, "danSo"=14627, "trungTamHc"='UBND xã Đakrông (cũ) và Chi cục QLTT huyện Đakrông (cũ)', "truocSapNhap"='Xã Ba Nang, Xã Tà Long, Xã Đakrông' WHERE code='19564';
UPDATE administrative_units SET "dienTichKm2"=291.93, "danSo"=24533, "trungTamHc"='UBND thị trấn Đồng Lê (cũ)', "truocSapNhap"='Thị trấn Đồng Lê, Xã Kim Hóa, Xã Lê Hóa, Xã Thuận Hóa, Xã Sơn Hóa' WHERE code='18949';
UPDATE administrative_units SET "dienTichKm2"=35.72, "danSo"=34174, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Hải Phú (huyện Bố Trạch), Xã Sơn Lộc, Xã Đức Trạch, Xã Đồng Trạch' WHERE code='19159';
UPDATE administrative_units SET "dienTichKm2"=96.7, "danSo"=31738, "trungTamHc"='UBND huyện Gio Linh (cũ)', "truocSapNhap"='Thị trấn Gio Linh, Xã Gio Quang, Xã Gio Mỹ, Xã Phong Bình' WHERE code='19495';
UPDATE administrative_units SET "dienTichKm2"=116.89, "danSo"=16589, "trungTamHc"='UBND xã Hải Phú (cũ)', "truocSapNhap"='Xã Hải Phú (huyện Hải Lăng), Xã Hải Lâm, Xã Hải Thượng' WHERE code='19702';
UPDATE administrative_units SET "dienTichKm2"=177.36, "danSo"=29661, "trungTamHc"='UBND Cam Thủy (cũ)', "truocSapNhap"='Xã Cam Thủy (huyện Cam Lộ), Xã Cam Hiếu, Xã Cam Tuyền, Xã Thanh An' WHERE code='19603';
UPDATE administrative_units SET "dienTichKm2"=52.67, "danSo"=29901, "trungTamHc"='UBND xã Quảng Tùng (cũ)', "truocSapNhap"='Xã Quảng Châu, Xã Quảng Tùng, Xã Cảnh Dương' WHERE code='19033';
UPDATE administrative_units SET "dienTichKm2"=99.03, "danSo"=43554, "trungTamHc"='UBND huyện Bố Trạch (cũ)', "truocSapNhap"='Thị trấn Hoàn Lão, Xã Trung Trạch, Xã Đại Trạch, Xã Tây Trạch, Xã Hòa Trạch' WHERE code='19111';
UPDATE administrative_units SET "dienTichKm2"=185.61, "danSo"=13454, "trungTamHc"='UBND thị trấn Krông Klang (cũ)', "truocSapNhap"='Thị trấn Krông Klang, Xã Mò Ó, Xã Hướng Hiệp' WHERE code='19555';
UPDATE administrative_units SET "dienTichKm2"=219.64, "danSo"=3539, "trungTamHc"='UBND xã Hướng Lập (cũ)', "truocSapNhap"='Xã Hướng Việt, Xã Hướng Lập' WHERE code='19435';
UPDATE administrative_units SET "dienTichKm2"=447.59, "danSo"=12029, "trungTamHc"='UBND Hướng Phùng (cũ)', "truocSapNhap"='Xã Hướng Sơn, Xã Hướng Linh, Xã Hướng Phùng' WHERE code='19441';
UPDATE administrative_units SET "dienTichKm2"=134.81, "danSo"=27615, "trungTamHc"='UBND huyện Hướng Hóa (cũ)', "truocSapNhap"='Thị trấn Khe Sanh, Xã Tân Hợp, Xã Húc, Xã Hướng Tân' WHERE code='19429';
UPDATE administrative_units SET "dienTichKm2"=229.42, "danSo"=6165, "trungTamHc"='UBND xã Hóa Hợp (cũ)', "truocSapNhap"='Xã Hóa Sơn, Xã Hóa Hợp' WHERE code='18922';
UPDATE administrative_units SET "dienTichKm2"=881.06, "danSo"=9776, "trungTamHc"='UBND xã Kim Thủy (cũ)', "truocSapNhap"='Xã Kim Thủy, Xã Ngân Thủy, Xã Lâm Thủy' WHERE code='19318';
UPDATE administrative_units SET "dienTichKm2"=552.57, "danSo"=19054, "trungTamHc"='UBND xã Trung Hóa (cũ)', "truocSapNhap"='Xã Thượng Hóa, Xã Trung Hóa, Xã Minh Hóa, Xã Tân Hóa' WHERE code='18943';
UPDATE administrative_units SET "dienTichKm2"=156.21, "danSo"=8121, "trungTamHc"='UBND xã A Ngo (cũ)', "truocSapNhap"='Xã A Bung, Xã A Ngo' WHERE code='19594';
UPDATE administrative_units SET "dienTichKm2"=83.04, "danSo"=23459, "trungTamHc"='UBND thị trấn Lao Bảo (cũ)', "truocSapNhap"='Xã Tân Thành (huyện Hướng Hóa), Xã Tân Long, Thị trấn Lao Bảo' WHERE code='19432';
UPDATE administrative_units SET "dienTichKm2"=56.32, "danSo"=23449, "trungTamHc"='Thị trấn Nông trường Lệ Ninh (cũ)', "truocSapNhap"='Thị trấn Nông trường Lệ Ninh, Xã Sơn Thủy, Xã Hoa Thủy' WHERE code='19246';
UPDATE administrative_units SET "dienTichKm2"=55.93, "danSo"=49460, "trungTamHc"='đang cập nhật', "truocSapNhap"='Thị trấn Kiến Giang, Xã Liên Thủy, Xã Xuân Thủy, Xã An Thủy, Xã Phong Thủy, Xã Lộc Thủy' WHERE code='19249';
UPDATE administrative_units SET "dienTichKm2"=71.69, "danSo"=14375, "trungTamHc"='UBND xã Thanh (cũ)', "truocSapNhap"='Xã Thanh, Xã Thuận, Xã Lìa' WHERE code='19489';
UPDATE administrative_units SET "dienTichKm2"=156.97, "danSo"=21481, "trungTamHc"='đang cập nhật', "truocSapNhap"='Thị trấn Quy Đạt, Xã Xuân Hóa, Xã Yên Hóa, Xã Hồng Hóa' WHERE code='18901';
UPDATE administrative_units SET "dienTichKm2"=43.82, "danSo"=17171, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Hải Dương, Xã Hải An, Xã Hải Khê' WHERE code='19741';
UPDATE administrative_units SET "dienTichKm2"=76.3, "danSo"=27643, "trungTamHc"='UBND xã Quảng Trung (cũ)', "truocSapNhap"='Xã Quảng Tân, Xã Quảng Trung, Xã Quảng Tiên, Xã Quảng Sơn, Xã Quảng Thủy' WHERE code='19075';
UPDATE administrative_units SET "dienTichKm2"=74.12, "danSo"=26619, "trungTamHc"='UBND xã Triệu Trạch (cũ)', "truocSapNhap"='Xã Triệu Trạch, Xã Triệu Phước, Xã Triệu Tân' WHERE code='19639';
UPDATE administrative_units SET "dienTichKm2"=34.43, "danSo"=36527, "trungTamHc"='UBND xã Quảng Minh (cũ)', "truocSapNhap"='Xã Quảng Hòa, Xã Quảng Lộc, Xã Quảng Văn, Xã Quảng Minh' WHERE code='19093';
UPDATE administrative_units SET "dienTichKm2"=114.84, "danSo"=25536, "trungTamHc"='UBND xã Hải Sơn (cũ)', "truocSapNhap"='Xã Hải Sơn, Xã Hải Phong, Xã Hải Chánh' WHERE code='19735';
UPDATE administrative_units SET "dienTichKm2"=129.83, "danSo"=32594, "trungTamHc"='UBND xã Lý Nam (cũ)', "truocSapNhap"='Thị trấn Nông trường Việt Trung, Xã Nhân Trạch, Xã Lý Nam' WHERE code='19198';
UPDATE administrative_units SET "dienTichKm2"=86.03, "danSo"=30098, "trungTamHc"='UBND xã Gia Ninh (cũ)', "truocSapNhap"='Xã Tân Ninh, Xã Gia Ninh, Xã Duy Ninh, Xã Hải Ninh' WHERE code='19225';
UPDATE administrative_units SET "dienTichKm2"=358.1, "danSo"=39254, "trungTamHc"='UBND xã Phúc Trạch (cũ)', "truocSapNhap"='Thị trấn Phong Nha, Xã Lâm Trạch, Xã Xuân Trạch, Xã Phúc Trạch' WHERE code='19138';
UPDATE administrative_units SET "dienTichKm2"=197.41, "danSo"=30850, "trungTamHc"='UBND xã Quảng Phú (cũ)', "truocSapNhap"='Xã Quảng Đông, Xã Quảng Phú, Xã Quảng Kim, Xã Quảng Hợp' WHERE code='19021';
UPDATE administrative_units SET "dienTichKm2"=100.27, "danSo"=36210, "trungTamHc"='UBND huyện Quảng Ninh (cũ)', "truocSapNhap"='Thị trấn Quán Hàu, Xã Vĩnh Ninh, Xã Võ Ninh, Xã Hàm Ninh' WHERE code='19207';
UPDATE administrative_units SET "dienTichKm2"=56.64, "danSo"=31422, "trungTamHc"='UBND huyện Quảng Trạch (cũ)', "truocSapNhap"='Xã Quảng Phương, Xã Quảng Xuân, Xã Quảng Hưng' WHERE code='19057';
UPDATE administrative_units SET "dienTichKm2"=120.84, "danSo"=21158, "trungTamHc"='UBND xã Hưng Thủy (cũ)', "truocSapNhap"='Xã Hưng Thủy, Xã Sen Thủy, Xã Ngư Thủy' WHERE code='19288';
UPDATE administrative_units SET "dienTichKm2"=273.15, "danSo"=10639, "trungTamHc"='UBND xã Tà Rụt (cũ)', "truocSapNhap"='Xã A Vao, Xã Húc Nghì, Xã Tà Rụt' WHERE code='19588';
UPDATE administrative_units SET "dienTichKm2"=41.05, "danSo"=22395, "trungTamHc"='UBND xã Cảnh Hóa (cũ)', "truocSapNhap"='Xã Phù Cảnh, Xã Liên Trường, Xã Quảng Thanh' WHERE code='19051';
UPDATE administrative_units SET "dienTichKm2"=83.18, "danSo"=14418, "trungTamHc"='UBND xã Tân Lập (cũ)', "truocSapNhap"='Xã Tân Liên, Xã Hướng Lộc, Xã Tân Lập' WHERE code='19462';
UPDATE administrative_units SET "dienTichKm2"=102.57, "danSo"=24644, "trungTamHc"='UBND xã Dương Thủy (cũ)', "truocSapNhap"='Xã Tân Thủy, Xã Dương Thủy, Xã Mỹ Thủy, Xã Thái Thủy' WHERE code='19291';
UPDATE administrative_units SET "dienTichKm2"=89.77, "danSo"=5513, "trungTamHc"='UBND xã Tân Thành (cũ)', "truocSapNhap"='giữ nguyên' WHERE code='18919';
UPDATE administrative_units SET "dienTichKm2"=1095.78, "danSo"=3615, "trungTamHc"='UBND xã Thượng Trạch (cũ)', "truocSapNhap"='Xã Tân Trạch, Xã Thượng Trạch' WHERE code='19147';
UPDATE administrative_units SET "dienTichKm2"=37.2, "danSo"=27169, "trungTamHc"='UBND xã Triệu Đại (cũ)', "truocSapNhap"='Xã Triệu Độ, Xã Triệu Thuận, Xã Triệu Hòa, Xã Triệu Đại' WHERE code='19645';
UPDATE administrative_units SET "dienTichKm2"=44.54, "danSo"=21976, "trungTamHc"='UBND xã Triệu Cơ (cũ)', "truocSapNhap"='Xã Triệu Trung, Xã Triệu Tài, Xã Triệu Cơ' WHERE code='19654';
UPDATE administrative_units SET "dienTichKm2"=80.79, "danSo"=23534, "trungTamHc"='UBND huyện Triệu Phong (cũ)', "truocSapNhap"='Thị trấn Ái Tử, Xã Triệu Thành, Xã Triệu Thượng' WHERE code='19624';
UPDATE administrative_units SET "dienTichKm2"=98.83, "danSo"=16331, "trungTamHc"='UBND xã Quảng Lưu (cũ)', "truocSapNhap"='Xã Quảng Lưu, Xã Quảng Thạch, Xã Quảng Tiến' WHERE code='19030';
UPDATE administrative_units SET "dienTichKm2"=71.92, "danSo"=35614, "trungTamHc"='UBND xã Xuân Ninh (cũ)', "truocSapNhap"='Xã Vạn Ninh, Xã An Ninh, Xã Xuân Ninh, Xã Hiền Ninh' WHERE code='19237';
UPDATE administrative_units SET "dienTichKm2"=97.18, "danSo"=21206, "trungTamHc"='UBND xã Mai Thủy (cũ)', "truocSapNhap"='Xã Trường Thủy, Xã Mai Thủy, Xã Phú Thủy' WHERE code='19309';
UPDATE administrative_units SET "dienTichKm2"=935.96, "danSo"=8484, "trungTamHc"='UBND xã Trường Sơn (cũ)', "truocSapNhap"='Xã Trường Xuân, Xã Trường Sơn' WHERE code='19204';
UPDATE administrative_units SET "dienTichKm2"=119.19, "danSo"=15619, "trungTamHc"='UBND xã Phong Hóa (cũ)', "truocSapNhap"='Xã Phong Hóa, Xã Ngư Hóa, Xã Mai Hóa' WHERE code='18991';
UPDATE administrative_units SET "dienTichKm2"=194.92, "danSo"=21452, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Tiến Hóa, Xã Châu Hóa, Xã Cao Quảng, Xã Văn Hóa' WHERE code='18997';
UPDATE administrative_units SET "dienTichKm2"=235.2, "danSo"=8401, "trungTamHc"='UBND xã Thanh Hóa (cũ)', "truocSapNhap"='Xã Lâm Hóa, Xã Thanh Hóa' WHERE code='18958';
UPDATE administrative_units SET "dienTichKm2"=155.38, "danSo"=18800, "trungTamHc"='UBND xã Thạch Hóa (cũ)', "truocSapNhap"='Xã Đồng Hóa, Xã Thạch Hóa, Xã Đức Hóa' WHERE code='18985';
UPDATE administrative_units SET "dienTichKm2"=132.14, "danSo"=6738, "trungTamHc"='UBND xã Hương Hóa (cũ)', "truocSapNhap"='Xã Thanh Thạch, Xã Hương Hóa' WHERE code='18952';
UPDATE administrative_units SET "dienTichKm2"=63.85, "danSo"=26737, "trungTamHc"='UBND xã Hải Vĩnh (cũ)', "truocSapNhap"='Xã Hải Quy, Xã Hải Hưng, Xã Hải Bình' WHERE code='19699';
UPDATE administrative_units SET "dienTichKm2"=87.06, "danSo"=19021, "trungTamHc"='UBND xã Trung Nam (cũ)', "truocSapNhap"='Xã Vĩnh Thái, Xã Trung Nam, Xã Vĩnh Hòa, Xã Vĩnh Tú' WHERE code='19372';
UPDATE administrative_units SET "dienTichKm2"=90.37, "danSo"=27527, "trungTamHc"='UBND huyện Vĩnh Linh (cũ)', "truocSapNhap"='Thị trấn Hồ Xá, Xã Vĩnh Long, Xã Vĩnh Chấp' WHERE code='19363';
UPDATE administrative_units SET "dienTichKm2"=103.74, "danSo"=20747, "trungTamHc"='đang cập nhật', "truocSapNhap"='Xã Vĩnh Lâm, Xã Vĩnh Sơn, Xã Vĩnh Thủy' WHERE code='19405';

