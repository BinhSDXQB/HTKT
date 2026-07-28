-- Import Thi đua – Khen thưởng & Đánh giá xếp loại từ các QĐ/TB của Sở GTVT (2021–2024)
-- Nguồn: thư mục C:\Troly\HTKT\Mau (8 file PDF).
-- Idempotent: ON CONFLICT theo (canBoId, nam) cho xếp loại; reward bỏ trùng theo (canBoId, nam, danhHieu).
-- Chỉ khớp tên trùng DUY NHẤT trong can_bo (tên trùng 2+ -> bỏ qua, báo cáo).
-- Khớp tên có chuẩn hoá Unicode (NFC) + gộp lowercase để tránh lệch dấu "ùy/uỳ".

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Dữ liệu xếp loại theo năm (mucXepLoai: đánh giá CỦA CƠ QUAN)
--    XS=HOAN_THANH_XUAT_SAC_NHIEM_VU, T=HOAN_THANH_TOT_NHIEM_VU,
--    HT=HOAN_THANH_NHIEM_VU, KHT=KHONG_HOAN_THANH_NHIEM_VU
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _imp_eval (
  hoten text, nam int, muc "MucXepLoai", cstd boolean, soqd text, ngayqd date
) ON COMMIT DROP;

-- chuẩn hoá khoá so khớp
CREATE OR REPLACE FUNCTION pg_temp.nrm(t text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT lower(regexp_replace(normalize(trim(t), NFC), '\s+', ' ', 'g')) $$;

-- ===== NĂM 2021 — TB 3544/TB-SGTVT ngày 14/12/2021 (Cơ quan Văn phòng Sở) =====
INSERT INTO _imp_eval(hoten,nam,muc,cstd,soqd,ngayqd) VALUES
('Phạm Văn Năm',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Anh Tuấn',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Vũ Anh Minh',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Đăng Cương',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Thị Thu Liễu',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Vĩnh Thái Cường',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Đình Hoàn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trương Thị Bảo',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Đức Thọ',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Võ Văn Bảy',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Thị Nhung Anh',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Thị Phương Lan',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Thi Thu Hồng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Thị Tố Tình',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Trung Kiên',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Duy Hùng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Minh Hiền',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trương Thanh Hùng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Văn Hiển',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Mạnh Hùng',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Xuân Bằng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Mai Nam',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Đăng Hùng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Địch Trung',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Đặng Hữu Thuyết',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Hữu Chung',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Thanh Hiếu',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Anh Tuấn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Minh Tuấn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Ngọc Dũng',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Văn Bình',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Quang Hợp',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Đặng Văn Xuân',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Đinh Quang Phúc',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Châu Tuấn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trương Thanh Tiến',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phạm Xuân Tân',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Hồng Phong',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Công Bằng',2021,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Hồng Duẩn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Hoàng Xuân Hiển',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Lê Văn Huệ',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Trần Thanh Hải',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Thái Sơn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Thanh Hóa',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Thanh Bình',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Đoàn Thị Nhã Phương',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Phan Văn Học',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Nam Tuấn',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Đăng Hùng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Đoàn Tiến Long',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Văn Khoa',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Hải Nam',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Từ Minh Hùng',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Duy Pháp',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Nguyễn Trung Thanh',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14'),
('Dương Ngọc Lan Anh',2021,'HOAN_THANH_TOT_NHIEM_VU',false,'3544/TB-SGTVT','2021-12-14');

-- ===== NĂM 2022 — TB 3621/TB-SGTVT ngày 08/12/2022 (Cơ quan Văn phòng Sở + LĐ đơn vị) =====
INSERT INTO _imp_eval(hoten,nam,muc,cstd,soqd,ngayqd) VALUES
('Phạm Văn Năm',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Anh Tuấn',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Vũ Anh Minh',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Đăng Cương',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Thị Thu Liễu',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Công Bằng',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Vĩnh Thái Cường',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Cẩm Nhung',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Đình Hoàn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trương Thị Bảo',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Đức Thọ',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Võ Văn Bảy',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thị Thùy Linh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phạm Thị Nhung Anh',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Thị Phương Lan',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Thi Thu Hồng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thị Tố Tình',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đỗ Trung Đức',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Thị Thúy Hằng',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Trung Kiên',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Ngọc Nhân',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Mạnh Hùng',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phạm Xuân Bằng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Mai Nam',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Địch Trung',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Hải Nguyên',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Đình Nam',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đặng Hữu Thuyết',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phạm Hữu Chung',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Thanh Hiếu',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Anh Tuấn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Minh Tuấn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Ngọc Dũng',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Văn Bình',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Quang Hợp',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đặng Văn Xuân',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đinh Quang Phúc',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phạm Châu Tuấn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Văn Linh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trương Thanh Tiến',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phạm Xuân Tân',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Hồng Phong',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Hồng Duẩn',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Xuân Hiển',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trương Thanh Hùng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thanh Bình',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trần Thanh Hải',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thanh Hóa',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thái Sơn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đoàn Thị Nhã Phương',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phan Văn Học',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Hoàng Ngọc Linh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thị Hồng Hạnh',2022,'KHONG_HOAN_THANH_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Nam Tuấn',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Đoàn Tiến Long',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Trung Thanh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Duy Pháp',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Văn Khoa',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Đăng Hùng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Từ Minh Hùng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Hải Nam',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Lê Văn Thủy',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Dương Ngọc Lan Anh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Trương Tiến Hùng',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
-- LĐ đơn vị trực thuộc 2022 (cơ quan/đơn vị đánh giá)
('Vũ Quang Chiến',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phan Thanh Vĩnh',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Ngô Đức Thịnh',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Thanh Long',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Dương Văn Hóa',2022,'HOAN_THANH_TOT_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Văn Lợi',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Phan Thị Lệ Nhung',2022,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08'),
('Nguyễn Trường Sinh',2022,'KHONG_HOAN_THANH_NHIEM_VU',false,'3621/TB-SGTVT','2022-12-08');

-- ===== NĂM 2023 — QĐ 996/QĐ-SGTVT ngày 06/12/2023 =====
INSERT INTO _imp_eval(hoten,nam,muc,cstd,soqd,ngayqd) VALUES
('Trần Thị Thu Liễu',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Công Bằng',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Thị Nhung Anh',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Trung Kiên',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Mạnh Hùng',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đặng Hữu Thuyết',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Ngọc Dũng',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đinh Quang Phúc',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trương Thanh Tiến',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Xuân Tân',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Hồng Phong',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Xuân Hiển',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Văn Thủy',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Ngô Đức Thịnh',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Văn Lợi',2023,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Cẩm Nhung',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Đình Hoàn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trương Thị Bảo',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Đức Thọ',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Võ Văn Bảy',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đỗ Trung Hiếu',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đoàn Thị Thanh Hà',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Bảo Ngọc',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Thị Phương Lan',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Thi Thu Hồng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thị Tố Tình',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đỗ Trung Đức',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Thị Thúy Hằng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Duy Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Văn Hiển',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Đăng Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Ngọc Nhân',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Xuân Bằng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Mai Nam',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Địch Trung',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Hải Nguyên',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Đình Nam',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Hữu Chung',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Thanh Hiếu',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Anh Tuấn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Minh Tuấn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Văn Bình',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Quang Hợp',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đặng Văn Xuân',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phạm Châu Tuấn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Văn Linh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Lê Hồng Duẩn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trương Thanh Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thanh Bình',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trần Thanh Hải',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thanh Hóa',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thái Sơn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đoàn Thị Nhã Phương',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phan Văn Học',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Hoàng Ngọc Linh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thị Hồng Hạnh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Nam Tuấn',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Đoàn Tiến Long',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Trung Thanh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Duy Pháp',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Văn Khoa',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Đăng Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Từ Minh Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Hải Nam',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Dương Ngọc Lan Anh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Trương Tiến Hùng',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Vũ Quang Chiến',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phan Thanh Vĩnh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Dương Văn Hóa',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Phan Thị Lệ Nhung',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Trường Sinh',2023,'HOAN_THANH_TOT_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thanh Long',2023,'HOAN_THANH_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06'),
('Nguyễn Thị Thuỳ Linh',2023,'KHONG_HOAN_THANH_NHIEM_VU',false,'996/QĐ-SGTVT','2023-12-06');

-- ===== NĂM 2024 — QĐ 1058/QĐ-SGTVT ngày 13/12/2024 =====
INSERT INTO _imp_eval(hoten,nam,muc,cstd,soqd,ngayqd) VALUES
('Trần Thị Thu Liễu',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Thị Nhung Anh',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Sỹ Đông',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Mạnh Hùng',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đặng Hữu Thuyết',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trương Thanh Tiến',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Xuân Tân',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Hồng Phong',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Văn Thủy',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Hoàng Thị Phương Lan',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trương Thanh Hùng',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đinh Quang Phúc',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Cẩm Nhung',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Ngô Đức Thịnh',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Trường Sinh',2024,'HOAN_THANH_XUAT_SAC_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Hoàng Ngọc Dũng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Công Bằng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Duy Hùng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Xuân Bằng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Hữu Chung',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Văn Bình',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Đình Hoàn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trương Thị Bảo',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Đức Thọ',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Võ Văn Bảy',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đỗ Trung Hiếu',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thị Thùy Linh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Bảo Ngọc',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Thi Thu Hồng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thị Tố Tình',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đỗ Trung Đức',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Văn Hiển',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phạm Châu Tuấn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thanh Hòa',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Ngọc Nhân',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Võ Huyền Sâm',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Hoàng Mai Nam',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Địch Trung',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Hải Nguyên',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Đình Nam',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Thanh Hiếu',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Anh Tuấn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Minh Tuấn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Quang Hợp',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đặng Văn Xuân',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Văn Linh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Lê Hồng Duẩn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Hoàng Xuân Hiển',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thanh Bình',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trần Thanh Hải',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thái Sơn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đoàn Thị Nhã Phương',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phan Văn Học',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Hoàng Ngọc Linh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Thị Hồng Hạnh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Nam Tuấn',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Đoàn Tiến Long',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Trung Thanh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Duy Pháp',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Văn Khoa',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Đăng Hùng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Từ Minh Hùng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Hải Nam',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Dương Ngọc Lan Anh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Trương Tiến Hùng',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Vũ Quang Chiến',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phan Thanh Vĩnh',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Phan Thị Lệ Nhung',2024,'HOAN_THANH_TOT_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Nguyễn Văn Lợi',2024,'HOAN_THANH_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13'),
('Dương Văn Hóa',2024,'KHONG_HOAN_THANH_NHIEM_VU',false,'1058/QĐ-SGTVT','2024-12-13');

-- Đánh dấu laChienSiThiDua=true cho người đạt CSTĐ cấp tỉnh năm 2022 (QĐ 1321)
UPDATE _imp_eval SET cstd = true
WHERE nam = 2022 AND pg_temp.nrm(hoten) IN (
  pg_temp.nrm('Trần Thị Thu Liễu'), pg_temp.nrm('Trần Văn Bình'), pg_temp.nrm('Phan Thanh Vĩnh')
);

-- ---------------------------------------------------------------------------
-- 2) Khen thưởng cá nhân (office_reward_records)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _imp_reward (
  hoten text, nam int, ma_title text, soqd text, ngayqd date, coquan text, thanhtich text
) ON COMMIT DROP;
INSERT INTO _imp_reward(hoten,nam,ma_title,soqd,ngayqd,coquan,thanhtich) VALUES
-- QĐ 4227/QĐ-UBND ngày 22/12/2021 — Bằng khen Chủ tịch UBND tỉnh (thành tích công tác 2021)
('Trần Văn Bình',2021,'BK_TINH','4227/QĐ-UBND','2021-12-22','Chủ tịch UBND tỉnh Quảng Bình','Thành tích xuất sắc trong công tác năm 2021'),
('Nguyễn Hoàng Linh',2021,'BK_TINH','4227/QĐ-UBND','2021-12-22','Chủ tịch UBND tỉnh Quảng Bình','Thành tích xuất sắc trong công tác năm 2021'),
('Phan Thanh Vĩnh',2021,'BK_TINH','4227/QĐ-UBND','2021-12-22','Chủ tịch UBND tỉnh Quảng Bình','Thành tích xuất sắc trong công tác năm 2021'),
-- QĐ 1321/QĐ-UBND ngày 29/5/2023 — Chiến sỹ thi đua cấp tỉnh năm 2022
('Trần Thị Thu Liễu',2022,'CSTD_TINH','1321/QĐ-UBND','2023-05-29','Chủ tịch UBND tỉnh Quảng Bình','Chiến sỹ thi đua cấp tỉnh (thành tích 2020–2022)'),
('Trần Văn Bình',2022,'CSTD_TINH','1321/QĐ-UBND','2023-05-29','Chủ tịch UBND tỉnh Quảng Bình','Chiến sỹ thi đua cấp tỉnh (thành tích 2020–2022)'),
('Phan Thanh Vĩnh',2022,'CSTD_TINH','1321/QĐ-UBND','2023-05-29','Chủ tịch UBND tỉnh Quảng Bình','Chiến sỹ thi đua cấp tỉnh (thành tích 2020–2022)');

-- ---------------------------------------------------------------------------
-- 3) Thực hiện INSERT — chỉ khớp tên DUY NHẤT trong can_bo
-- ---------------------------------------------------------------------------
-- Bảng tra cứu can_bo theo khoá chuẩn hoá, loại tên trùng
CREATE TEMP VIEW _cb AS
SELECT pg_temp.nrm("hoTen") AS k, max(id) AS id, count(*) AS n
FROM can_bo GROUP BY pg_temp.nrm("hoTen");

-- 3a) Xếp loại
INSERT INTO office_annual_evaluations
  (id, "canBoId", nam, "mucXepLoai", "laChienSiThiDua", "soQuyetDinh", "ngayQuyetDinh", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, e.nam, e.muc, bool_or(e.cstd), max(e.soqd), max(e.ngayqd), NOW(), NOW()
FROM _imp_eval e
JOIN _cb c ON c.k = pg_temp.nrm(e.hoten) AND c.n = 1
GROUP BY c.id, e.nam, e.muc
ON CONFLICT ("canBoId", nam) DO UPDATE SET
  "mucXepLoai"      = EXCLUDED."mucXepLoai",
  "laChienSiThiDua" = EXCLUDED."laChienSiThiDua",
  "soQuyetDinh"     = EXCLUDED."soQuyetDinh",
  "ngayQuyetDinh"   = EXCLUDED."ngayQuyetDinh",
  "updatedAt"       = NOW();

-- 3b) Khen thưởng (tránh trùng theo canBoId+nam+rewardTitle)
INSERT INTO office_reward_records
  (id, "canBoId", "rewardTitleId", nam, "danhHieu", "capKhen", "soQuyetDinh", "ngayQuyetDinh", "coQuanQuyetDinh", "thanhTich", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, t.id, r.nam, t.ten, t."capKhen", r.soqd, r.ngayqd, r.coquan, r.thanhtich, NOW(), NOW()
FROM _imp_reward r
JOIN _cb c ON c.k = pg_temp.nrm(r.hoten) AND c.n = 1
JOIN office_reward_titles t ON t.ma = r.ma_title
WHERE NOT EXISTS (
  SELECT 1 FROM office_reward_records x
  WHERE x."canBoId" = c.id AND x.nam = r.nam AND x."rewardTitleId" = t.id
);

-- ---------------------------------------------------------------------------
-- 4) BÁO CÁO
-- ---------------------------------------------------------------------------
\echo '== Xep loai da nhap theo nam x muc =='
SELECT nam, "mucXepLoai", count(*) FROM office_annual_evaluations GROUP BY nam, "mucXepLoai" ORDER BY nam, "mucXepLoai";
\echo '== Khen thuong da nhap =='
SELECT r.nam, r."danhHieu", cb."hoTen" FROM office_reward_records r JOIN can_bo cb ON cb.id=r."canBoId" ORDER BY r.nam, r."danhHieu", cb."hoTen";
\echo '== Ten KHONG khop can_bo (bo qua) =='
SELECT DISTINCT e.hoten FROM _imp_eval e LEFT JOIN _cb c ON c.k=pg_temp.nrm(e.hoten) WHERE c.id IS NULL ORDER BY e.hoten;
\echo '== Ten TRUNG trong can_bo (bo qua, can chon thu cong) =='
SELECT DISTINCT e.hoten FROM _imp_eval e JOIN _cb c ON c.k=pg_temp.nrm(e.hoten) WHERE c.n>1 ORDER BY e.hoten;
\echo '== Khen thuong: ten khong khop (bo qua) =='
SELECT DISTINCT r.hoten FROM _imp_reward r LEFT JOIN _cb c ON c.k=pg_temp.nrm(r.hoten) WHERE c.id IS NULL OR c.n>1 ORDER BY r.hoten;

COMMIT;
