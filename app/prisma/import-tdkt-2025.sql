-- Import Thi đua – Khen thưởng năm 2025 (Sở Xây dựng Quảng Trị)
-- Nguồn: C:\Troly\HTKT\Mau\924.pdf (Lao động tiên tiến) và 940.pdf (Giấy khen).
--   QĐ 924/QĐ-SXD ngày 30/12/2025 — Tặng danh hiệu "Lao động tiên tiến" cho 585 cá nhân.
--   QĐ 940/QĐ-SXD ngày 31/12/2025 — Tặng Giấy khen cho 144 cá nhân.
-- Ghi vào office_reward_records (rewardTitle: LDTT / GIAY_KHEN). Idempotent theo (canBoId, nam, rewardTitleId).
-- Chỉ khớp tên DUY NHẤT trong can_bo (tên trùng 2+ -> bỏ qua, báo cáo). Khớp chuẩn hoá Unicode (NFC) + lowercase.
-- can_bo hiện chỉ gồm Văn phòng Sở -> thực tế chỉ Mục I mỗi QĐ khớp; đơn vị trực thuộc -> không khớp (báo cáo).

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.nrm(t text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT lower(regexp_replace(normalize(trim(t), NFC), '\s+', ' ', 'g')) $$;

-- dv = đơn vị (mục La Mã trong QĐ) để báo cáo & soi false-positive
CREATE TEMP TABLE _imp (hoten text, nam int, ma_title text, dv text, soqd text, ngayqd date) ON COMMIT DROP;

-- ===========================================================================
-- QĐ 924 — Lao động tiên tiến (LDTT) — 2025
-- ===========================================================================
-- I. CƠ QUAN VĂN PHÒNG SỞ
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Trương Chí Trung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Đăng Cương',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Hải',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Quốc Anh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Vũ Anh Minh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân Hoàng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Cường',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phan Văn Thắng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Văn Đức Lợi',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Ngọc Sơn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thu Liễu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Anh Tuấn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Võ Văn Tuần',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Hải Thành',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Hữu Sửu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Như Quỳnh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Ngọc Dũng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Bùi Đức Thành',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Mạnh Hùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Thị Xuân Quý',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trương Văn Hoài',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Sỹ Đông',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Duy Hùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đặng Hoài Dương',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Dương Bá Thịnh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Quang Phi',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thành Lai',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Tạ Công Danh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Trung Thành',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Ngô Thị Ái Linh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Văn Bình',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Việt',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Võ Việt Dũng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Trung Thông',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tấn Phương',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Văn Thủy',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Hữu Chung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Thị Hồng Ngọc',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Xuân Bằng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Quang Minh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Cẩm Nhung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Mỹ Nhung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đỗ Trung Hiếu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đỗ Trung Đức',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thuận',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Nguyên Liêm',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Võ Hoàng Hà Nhi',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thúy Hằng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Ngọc Nhân',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hồng Hạnh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Võ Huyền Sâm',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đặng Hoàng Anh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thế Thái Tùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Mậu Hai',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Đức Anh Vũ',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Bùi Việt Châu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Ngọc Bình',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Nguyễn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phan Thanh Tâm',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phan Học Phi',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Thanh Hải',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Việt Hưng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Minh Phú',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Tuấn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Dương Thị Thanh Nga',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Sơn Tùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Minh Thành',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Quang Nhật Minh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tuấn Long',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Ngọc Nam',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Lê Cương',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đặng Ngọc Chung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Nhật Khánh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thành Nhân',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Minh Châu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Thị Ngân Hương',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Châu Tuấn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Quang Hợp',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đặng Văn Xuân',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đinh Quang Phúc',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Văn Công',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Linh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Minh Tuấn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Thượng Nguyên',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phan Thanh Hòa',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Thanh Hiếu',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trương Tiến Hùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Quang Đạo',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Mai Nam',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Địch Trung',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Hiển',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trương Văn Hưng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Minh Long',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Hải Nguyên',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Đình Nam',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trương Thị Bảo',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Đặng Thị Phương Thảo',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Kiều Trang',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Dương Ngọc Lan Anh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Phạm Trường An',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Nguyễn Giang Trường',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Đức Thọ',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Hoàng Ngọc Linh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Trần Văn Hùng',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
-- Tên trùng trong QĐ (đã có đủ ở trên dưới dạng khớp tên): Nguyễn Thanh Hải(2), Nguyễn Thị Thùy Linh(2), Lê Anh Tuấn (A)&(B)
('Nguyễn Thị Thùy Linh',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30'),
('Lê Anh Tuấn',2025,'LDTT','I. Văn phòng Sở','924/QĐ-SXD','2025-12-30');

-- II. TT KIỂM ĐỊNH CLCT XD PHÍA BẮC
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Đoàn Quốc Cường',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Viết Hải',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trương Quang Thành',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trịnh Khánh Minh',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trương Vũ Thế',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Đặng Ngọc Nam',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Hà Thị Kim Ngọc',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Cường',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Phương Thảo',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Quang Huy',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trương Vũ Hùng',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Sỹ',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Thị Hoài Thu',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trương Thanh Long',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Đình Tuấn',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thái Lâm',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Lê Huyền Trang',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Phan Thị Huế',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Huệ',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Duy Linh',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Văn Cảnh',2025,'LDTT','II. TT KĐ CLCT XD Bắc','924/QĐ-SXD','2025-12-30');

-- III. VIỆN QUY HOẠCH XÂY DỰNG QUẢNG TRỊ
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Phạm Xuân Thảo',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đinh Ngọc Hà',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Đình Tú',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Phạm Anh Tuấn',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hải Mận',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thu Hạnh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Hải Minh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đ.Phương Huy',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Thanh Tuấn',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Hoàng Minh Thắng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đăng Mạnh Hoàng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân Thuỷ',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Bảo Trung',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trương Văn Diễn',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đặng Tuấn Thái',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Cái Thanh Sơn',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Khánh Huy',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thanh Huyền',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Quốc Vương',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Thúy',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Việt Hoàng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lý Quang Hinh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Phạm Văn Quả',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Thiện',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hà Khánh Linh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Hùng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Lệ Hằng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thu Hương',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân Thảo',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Trung Tấn',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đinh Thị Hà',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Ngọc Tâm Đức',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Diệu Linh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đoàn Thị Bích Ngọc',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Hồ Thị Thanh Hiền',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đỗ Thị Loan',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Đình Dũng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Phạm Thế Nam',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Tuấn Dũng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Phong',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Đoàn Hữu Thành',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Phan Đình Hợp',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Võ Chí Vũ',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Hoàng Hữu Nghị',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Nhật Tân',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Thành',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Anh Đức',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Hải Đăng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Phan Trung Tân',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Thị Hà Giang',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Nhật Linh',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thu Hiền',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trần Hải Dương',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Trịnh Bình Nguyên',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Hà Thị Xuân Hồng',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Ngô Thành Công',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Nguyễn Viết Cường',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lê Trung Hiếu',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Lưu Thị Thuỷ',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30'),
('Dương Hoàng Khoa',2025,'LDTT','III. Viện QHXD','924/QĐ-SXD','2025-12-30');

-- IV. TT DV&QL BẾN XE KHÁCH PHÍA NAM
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Trần Thanh Tâm',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Xuân Thắng',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Anh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Hồ Thị Huệ',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Phan Đình Quỳnh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trần Thị Hương Giang',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Đoàn Xuân Tịnh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Doãn Đức',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thái Trung',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Hoài Linh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Danh Thảo',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lưu Tuấn Anh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Thị Mai Phương',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trương Thị Tố Quyên',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Uông Thị Vinh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trần Công Hưng',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hằng',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Hoàng Kim Sanh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Hồ Ngọc Hà Sơn',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trần Hương Giang',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Vương Thị Vân',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Tú Oanh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hồng Liên',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Thị Hồng Hạnh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Dương Thị Kim Huệ',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Dạ Huyền',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Thông',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Vũ Đình Thiện',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trương Minh Đô',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trần Thị Xuân',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Trương Thị Nguyệt Anh',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tấn Hoàng',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Văn Hải',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Thái Trần Trà Giang',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Vương Công Kiên',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Hồ Minh Toàn',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Hữu Lân',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Gia',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Phùng Thị Tú An',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thu Trang',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Võ Ngọc Tuấn',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thanh Tuyền',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Phan Văn Thưởng',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Phương Chi',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Cẩm Nhung',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30'),
('Lê Đức Anh Tuấn',2025,'LDTT','IV. TT BX Nam','924/QĐ-SXD','2025-12-30');

-- V. TT ĐĂNG KIỂM XE CƠ GIỚI PHÍA BẮC
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Dương Văn Hóa',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thu Nhàn',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Minh Dương',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Ngọc Minh Hải',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Đặng Thanh Chung',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Trịnh Khôi',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Thị Huyền Trang',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Minh Tâm',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30'),
('Bùi Mạnh Hùng',2025,'LDTT','V. Đăng kiểm Bắc','924/QĐ-SXD','2025-12-30');

-- VI. BAN QLDA ĐTXD CT GIAO THÔNG
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Ngọc Quý',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Vũ Quang Chiến',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Phan Thanh Vĩnh',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Ngô Đức Thịnh',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thanh Bình',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Thuận',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Quỳnh Trang',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Kiều Nga',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Võ Thị Tố Nga',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Minh Trang',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Đoàn Thị Thanh Hà',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Bạch Yến',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lê Đình Hậu',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Sơn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Tùng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn T. Hồng Quyên',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lê Quý Ngoan',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hải Dương',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đình Thảo',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Trần Ngọc Thắng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Sơn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Ngô Bách Sơn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Phạm Quang Thắng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Đoàn Thế Hùng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Anh Tú',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Võ Ngọc Khanh',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Đoàn Cường Quốc',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Hồ Chí Lâm',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Võ Trần Thành',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Lý',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Đặng Huy Hùng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Hoàn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Trần Đại Nam',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Trần Vĩnh Ninh',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Đoàn Ngọc Thanh',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Dương Đình Thành',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Trần Ngọc Minh Phương',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Từ Minh Hùng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lương Sơn Bảo',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Bình',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Phạm Văn Phong',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Trần Xuân Biên',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Hồ Ngọc Sơn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Dương Đức Sơn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Kim Thành',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Quốc Toàn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Công Tri',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Võ Quốc Tuấn',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Công Hoàng',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thanh Hoa',2025,'LDTT','VI. Ban QLDA GT','924/QĐ-SXD','2025-12-30');

-- VII. BAN QUẢN LÝ, BẢO TRÌ GIAO THÔNG
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Hoàng Anh Quang',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Tuấn Anh',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hằng Nga',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Trần Trung Hiếu',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Quang Tiến',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Đặng Thanh Phương',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Phước Long',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Phương',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Thị Minh Trâm',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn T. Phương Thu',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Lê Na',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Thu Hiền',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Lê Gia Tuấn',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Thị Hải Phú',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tùng Việt',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Dương Hoài Thu',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Bùi Trọng Cương',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Minh Nhật',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Văn Hiền',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Lê Hồng Phong',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Thị Liên',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Lê Đức Thiện',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Văn Thẩn',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Lê Đắc Trí Tín',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Quốc Thạnh',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Ngô Văn Bản',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hồ Văn Huy',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Minh Công',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trương Song Nam',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Trọng Đại',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Nguyên Phú',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Đặng Thị Hương Giang',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Duy Hải',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Dương Phước Sang',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Đỗ Ngọc Nghĩa',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Võ Nguyên Thịnh',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Phạm Nam Tiến',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Hoàng Văn Diện',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Cao Cường',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Tưởng Viết Thành',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30'),
('Trần Thị Lê',2025,'LDTT','VII. Ban QL BT GT','924/QĐ-SXD','2025-12-30');

-- VIII. TT DV&QL BẾN XE KHÁCH PHÍA BẮC
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Trường Sinh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Lợi',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Phan Thị Lệ Nhung',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Hữu Truyện',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Thị Huyền Trang',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đỗ Trung Hiếu',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Linh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Dương Tiến Đạt',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Quang Nhật',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hoàng Linh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thu Thủy',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Ngọc Thúy',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thu Hương',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Phương Linh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Đăng Nguyên',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Lương Minh Nhàn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Thị Thơm',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Hải Anh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Anh Tuấn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Thuyết',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Anh Tuấn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Thanh Long',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Thanh Thành Lộc',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Ngô Hồng Tân',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Đông',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đinh Thị Mai Thủy',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hồng',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hồng Hạnh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Mai Chính Hoàng',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Phan Văn Thiện',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thủy',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Việt Dũng',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Dương Thị Hồng Nhị',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Thị Kiều',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Cao Ngọc Linh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Thị Phương Loan',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Thị Hương',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân Sơn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Quỳnh Trang',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn T.Hương Trà',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Trần Đức Thắng',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thế Anh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Trang',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Lê Thùy Trang',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tuấn Anh',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thái Hoà',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Nguyễn Anh Tuấn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đinh Thị Thanh Hương',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đinh Chí Thoan',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đinh Chí Cường',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Đặng Xuân Toán',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Võ Anh Tuấn',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Phạm Thị Dương',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Dương Thị Thuý Hiền',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Ý Nhi',2025,'LDTT','VIII. TT BX Bắc','924/QĐ-SXD','2025-12-30');

-- IX. TT QUY HOẠCH VÀ KIỂM ĐỊNH XD PHÍA NAM
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Phi Hùng',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Lê Khánh Thắng',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Võ Thị Ái Linh',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thanh Giang',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trần Thị Phương Thảo',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thủy',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đăng Hoàng',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Tuấn',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thúy Hoài',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Lê Đình Tiến',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trương Thị Tư',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Tiến',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Hồ Hoàng Duy',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Mạnh Linh',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hải Hoài',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Lê Anh Tuấn',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trần Viết Hải Đăng',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Trần Việt Tuấn',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Xuân',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Hồng Tín',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Hoàng Lê Nhã Tuấn',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30'),
('Lê Đức Doãn',2025,'LDTT','IX. TT QH&KĐ Nam','924/QĐ-SXD','2025-12-30');

-- X. TRƯỜNG TRUNG CẤP NGHỀ GTVT
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Trần Minh Trung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Viết Thái',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Phượng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Văn Đỗ',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hoàng Anh Trung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Như Hoà',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phạm Thanh Bình',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hoàng Văn Diện',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Quốc Hưng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Tùng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Lương Huy',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Lương Tuấn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân Đức',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phan Văn Tú',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hồ Quang Hùng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thanh Long',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Trung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Võ Văn Cường',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Như Tuấn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Mạnh Long',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Đỗ Trọng Hòa',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Dương Duy Phước',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trương Quang Lộc',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phan Thị Mỹ Tú',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Quốc Tuyển',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Xuân Thọ',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phạm Ngọc Tuấn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Sơn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Võ Duy Toàn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Thanh Long',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hoàng Minh Khánh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Đình Tiến',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Khánh Lâm',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Đỗ Hải Nam',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Nhật Tân',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đình Vinh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Chí Quang',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tiến Giang',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Võ Thanh Tùng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Anh Tuấn',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Quang Minh Tâm',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Trần Chung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Đình Trường',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Võ Thanh Quang',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lương Xuân Phương',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Bích Ngọc',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Bùi Ngọc Kỷ',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thuỳ Anh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hoàng Lâm Duy',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trương Hoàng Việt',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thuỳ Nhung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trương Thị Bích Lập',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thu Hường',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Sen',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phan Thị Minh Thuỷ',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hiệp',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thủy',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Ánh Tuyết',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Đỗ Tấn Vinh Hiếu',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phan Thành Trung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trần Lương Dũng',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Hải Lộc',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Tố Nga',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Phan Thị Kim Oanh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Lê Thị Thảo Trinh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Trương Thị Hạnh',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thành Trung',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Hà',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30'),
('Tô Thị Huyên',2025,'LDTT','X. Trường TC nghề GTVT','924/QĐ-SXD','2025-12-30');

-- XI. TT ĐĂNG KIỂM XE CƠ GIỚI PHÍA NAM
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Đoàn Việt Bắc',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trần Anh Tuấn',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Phạm Anh Tuấn',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Chí Thông',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Hồ Duy Mạnh',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trần Văn Nam',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Phan Thị Lan',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Hưng',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Ngọc Quảng',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Ân',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Tình',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Cao Xuân Hiếu',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Thái Tăng Nhân',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trần Xuân Quảng',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Nguyễn Xuân An',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trần Hữu An',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Triệu Thị Nhật Anh',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trịnh Đình Hải Trường',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Trần Đức Minh',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Phạm Văn Thoại',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Thái Đức Dũng',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30'),
('Tạ Quang Chiến',2025,'LDTT','XI. Đăng kiểm Nam','924/QĐ-SXD','2025-12-30');

-- XII. TT ĐÀO TẠO SÁT HẠCH LÁI XE
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Văn Ngọ',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Lê Bá Hải',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Dương Trần Tuấn',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thanh Sơn',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Thái Văn Thanh',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Hồ Thị Huế',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Dương Đức Đạt',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trương Thị Liên',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Mạnh Quân',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Lê Văn Hợp',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trịnh Việt Đức',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Ngọc Hoàng',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Lương Hoàng',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Phước',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Phạm Quang Toàn',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Võ Tiến Thành',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Quang Sáng',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Dũng',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Cao Văn Nghị',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Hữu Vỹ',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Chiến',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Quốc Khánh',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Xuân Nhân',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Lê Đức Anh',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Đào Ngọc Anh',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Phương Ly',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Hồ Tuấn Hải',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Lê Bá Nam',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Trần Văn Đức',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Phương',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Đặng Hoài An',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Văn Trường',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Phạm Trung Cường',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Tuấn Anh',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Lê Chí Vy',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Thành',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Phước Đức',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Võ Văn Thân',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Tiến Đạt',2025,'LDTT','XII. TT Sát hạch lái xe','924/QĐ-SXD','2025-12-30');

-- XIII. ĐOẠN ĐƯỜNG THỦY NỘI ĐỊA QUẢNG TRỊ
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Phạm Uy Vũ',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Lê Việt Hùng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hà Văn Vinh',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phạm Anh Quang',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Bích Thủy',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phan Đức Dũng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Minh Hằng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Thị Thu Sương',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phạm Anh Hùng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hà Xuân Quang',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hoàng Thị Thanh Thúy',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Thị Duyên',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Bùi Xuân Tuệ',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phan Hải Thành',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phan Đức Đẳng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trương Huy Thông Điệp',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hoàng Kim Trí',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Phước Tân',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Lê Thị Ngọc Huyên',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Vũ Tuấn Anh',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Võ Nam Phương',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hà Văn Thanh',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trương Công Thiện',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Thị Thái Thảo',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Thị Hải Thủy',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Hữu Dương',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Việt Lam',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Hữu Cửu',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Hoàng Giang Nam',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Trần Đình Minh',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Tiến',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đức Phúc Thành',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Lê Thiên Phong Nhã',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đăng Lượng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Phan Thị Hằng',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Đồng Thanh Hiếu',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Lê Văn Long',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Nguyễn Đình Luật',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30'),
('Lê Văn Nhân',2025,'LDTT','XIII. Đoạn ĐTNĐ','924/QĐ-SXD','2025-12-30');

-- ===========================================================================
-- QĐ 940 — Giấy khen (GIAY_KHEN) — 2025
-- ===========================================================================
-- I. CƠ QUAN VĂN PHÒNG SỞ (44)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Sỹ Đông',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đặng Hoài Dương',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đỗ Trung Đức',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Nguyên Liêm',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Thị Thúy Hằng',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Ngọc Nhân',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Hồng Hạnh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thanh Hải',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Võ Văn Tuần',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Tạ Công Danh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Nguyễn',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Phan Học Phi',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Hoàng Thanh Hải',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Hoàng Hải Thành',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Việt Hưng',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Đức Tuấn',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Thùy Linh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Nhật Khánh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Minh Châu',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Văn Bình',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Hữu Sửu',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Bùi Đức Thành',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Thượng Nguyên',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Thanh Hiếu',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Phan Thanh Hòa',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Quang Đạo',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Mạnh Hùng',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Hoàng Quang Minh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Địch Trung',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Hải Nguyên',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Anh Tuấn',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đặng Ngọc Chung',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Quang Hợp',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đặng Văn Xuân',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đinh Quang Phúc',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Văn Công',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Văn Linh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Đặng Thị Phương Thảo',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Kiều Trang',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Dương Ngọc Lan Anh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Trần Văn Hùng',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Hoàng Ngọc Linh',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Lê Đức Thọ',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31'),
('Phạm Trường An',2025,'GIAY_KHEN','I. Văn phòng Sở','940/QĐ-SXD','2025-12-31');

-- II. TT KĐ CLCT XD PHÍA BẮC (07)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Trịnh Khánh Minh',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Trương Vũ Thế',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Lê Phương Thảo',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Phạm Thị Hoài Thu',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Phạm Lê Huyền Trang',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Phan Thị Huế',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31'),
('Trần Duy Linh',2025,'GIAY_KHEN','II. TT KĐ CLCT XD Bắc','940/QĐ-SXD','2025-12-31');

-- III. VIỆN QHXD QUẢNG TRỊ (06)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Trương Văn Diễn',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31'),
('Đinh Thị Hà',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31'),
('Trần Đình Dũng',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31'),
('Trần Hải Đăng',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31'),
('Trần Thị Thu Hiền',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31'),
('Nguyễn Viết Cường',2025,'GIAY_KHEN','III. Viện QHXD','940/QĐ-SXD','2025-12-31');

-- IV. TT DV&QL BẾN XE KHÁCH PHÍA NAM (11)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Văn Anh',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Hồ Thị Huệ',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Phan Đình Quỳnh',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Đoàn Xuân Tịnh',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thái Trung',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Danh Thảo',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Lưu Tuấn Anh',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Hằng',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Văn Thông',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Thái Trần Trà Giang',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31'),
('Võ Ngọc Tuấn',2025,'GIAY_KHEN','IV. TT BX Nam','940/QĐ-SXD','2025-12-31');

-- V. TT ĐĂNG KIỂM XE CƠ GIỚI PHÍA BẮC (05)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Thị Thu Nhàn',2025,'GIAY_KHEN','V. Đăng kiểm Bắc','940/QĐ-SXD','2025-12-31'),
('Lê Minh Dương',2025,'GIAY_KHEN','V. Đăng kiểm Bắc','940/QĐ-SXD','2025-12-31'),
('Hoàng Ngọc Minh Hải',2025,'GIAY_KHEN','V. Đăng kiểm Bắc','940/QĐ-SXD','2025-12-31'),
('Đặng Thanh Chung',2025,'GIAY_KHEN','V. Đăng kiểm Bắc','940/QĐ-SXD','2025-12-31'),
('Hoàng Trịnh Khôi',2025,'GIAY_KHEN','V. Đăng kiểm Bắc','940/QĐ-SXD','2025-12-31');

-- VI. BAN QLDA ĐTXD CT GIAO THÔNG (14)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Thị Kiều Nga',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Võ Thị Tố Nga',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Bạch Yến',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Văn Tùng',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Đình Thảo',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Trần Ngọc Thắng',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Phạm Quang Thắng',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Đoàn Thế Hùng',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Đức Hoàn',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Trần Vĩnh Ninh',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Đoàn Ngọc Thanh',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Kim Thành',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Công Tri',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31'),
('Võ Quốc Tuấn',2025,'GIAY_KHEN','VI. Ban QLDA GT','940/QĐ-SXD','2025-12-31');

-- VII. BAN QUẢN LÝ, BẢO TRÌ GIAO THÔNG (06)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn T. Phương Thu',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31'),
('Ngô Văn Bản',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31'),
('Hồ Văn Huy',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31'),
('Hoàng Trọng Đại',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31'),
('Đặng Thị Hương Giang',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31'),
('Dương Phước Sang',2025,'GIAY_KHEN','VII. Ban QL BT GT','940/QĐ-SXD','2025-12-31');

-- VIII. TT DV&QL BẾN XE KHÁCH PHÍA BẮC (16)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Thị Ngọc Thúy',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Phạm Thị Thơm',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Phạm Thanh Long',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Ngô Hồng Tân',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn Hữu Đông',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Thủy',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn Việt Dũng',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Trần Thị Hương',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn Xuân Sơn',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn T.Hương Trà',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Hoàng Thị Trang',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Lê Thùy Trang',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thái Hoà',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Đinh Thị Thanh Hương',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Đặng Xuân Toán',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31'),
('Võ Anh Tuấn',2025,'GIAY_KHEN','VIII. TT BX Bắc','940/QĐ-SXD','2025-12-31');

-- IX. TT QH VÀ KĐ XD PHÍA NAM (06)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Nguyễn Phi Hùng',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31'),
('Võ Thị Ái Linh',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31'),
('Hồ Hoàng Duy',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Mạnh Linh',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31'),
('Trần Viết Hải Đăng',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31'),
('Hoàng Lê Nhã Tuấn',2025,'GIAY_KHEN','IX. TT QH&KĐ Nam','940/QĐ-SXD','2025-12-31');

-- X. TRƯỜNG TRUNG CẤP NGHỀ GTVT (16)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Hoàng Anh Trung',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Lê Thanh Long',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Võ Văn Cường',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Như Tuấn',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Trương Quang Lộc',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Phan Thị Mỹ Tú',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thanh Sơn',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Võ Duy Toàn',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Trần Thanh Long',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Trần Đình Tiến',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Tiến Giang',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Võ Thanh Tùng',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Trương Hoàng Việt',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Trương Thị Bích Lập',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Lê Thị Sen',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thành Trung',2025,'GIAY_KHEN','X. Trường TC nghề GTVT','940/QĐ-SXD','2025-12-31');

-- XI. TT ĐĂNG KIỂM XE CƠ GIỚI PHÍA NAM (05)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Đoàn Việt Bắc',2025,'GIAY_KHEN','XI. Đăng kiểm Nam','940/QĐ-SXD','2025-12-31'),
('Trần Anh Tuấn',2025,'GIAY_KHEN','XI. Đăng kiểm Nam','940/QĐ-SXD','2025-12-31'),
('Phạm Anh Tuấn',2025,'GIAY_KHEN','XI. Đăng kiểm Nam','940/QĐ-SXD','2025-12-31'),
('Nguyễn Chí Thông',2025,'GIAY_KHEN','XI. Đăng kiểm Nam','940/QĐ-SXD','2025-12-31'),
('Hồ Duy Mạnh',2025,'GIAY_KHEN','XI. Đăng kiểm Nam','940/QĐ-SXD','2025-12-31');

-- XII. ĐOẠN ĐƯỜNG THỦY NỘI ĐỊA QUẢNG TRỊ (08)
INSERT INTO _imp(hoten,nam,ma_title,dv,soqd,ngayqd) VALUES
('Phạm Anh Quang',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Nguyễn Thị Minh Hằng',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Trần Thị Duyên',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Phan Đức Đẳng',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Hà Văn Thanh',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Nguyễn Đức Tiến',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Đồng Thanh Hiếu',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31'),
('Lê Văn Long',2025,'GIAY_KHEN','XII. Đoạn ĐTNĐ','940/QĐ-SXD','2025-12-31');

-- ===========================================================================
-- THỰC HIỆN: chỉ khớp tên DUY NHẤT trong can_bo
-- ===========================================================================
CREATE TEMP VIEW _cb AS
SELECT pg_temp.nrm("hoTen") AS k, max(id) AS id, count(*) AS n
FROM can_bo GROUP BY pg_temp.nrm("hoTen");

-- Dọn dữ liệu 2025 của 2 QĐ này (idempotent + xoá false-positive lần chạy trước)
DELETE FROM office_reward_records WHERE nam=2025 AND "soQuyetDinh" IN ('924/QĐ-SXD','940/QĐ-SXD');

-- CHỈ khớp Mục I (Văn phòng Sở). can_bo toàn VP Sở -> tránh gán nhầm award của đơn vị trực thuộc
-- cho cán bộ VP Sở trùng tên (vd Trần Anh Tuấn, Võ Thị Ái Linh...).
INSERT INTO office_reward_records
  (id, "canBoId", "rewardTitleId", nam, "danhHieu", "capKhen", "soQuyetDinh", "ngayQuyetDinh", "coQuanQuyetDinh", "thanhTich", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, t.id, i.nam, t.ten, t."capKhen", max(i.soqd), max(i.ngayqd),
       'Giám đốc Sở Xây dựng tỉnh Quảng Trị', 'Thành tích trong công tác năm 2025', NOW(), NOW()
FROM _imp i
JOIN _cb c ON c.k = pg_temp.nrm(i.hoten) AND c.n = 1
JOIN office_reward_titles t ON t.ma = i.ma_title
WHERE i.dv = 'I. Văn phòng Sở'
  AND NOT EXISTS (
  SELECT 1 FROM office_reward_records x
  WHERE x."canBoId" = c.id AND x.nam = i.nam AND x."rewardTitleId" = t.id
)
GROUP BY c.id, t.id, i.nam, t.ten, t."capKhen";

-- ===========================================================================
-- GIẢI QUYẾT TRÙNG TÊN — gán đích danh theo canBoId (do có 2+ người cùng tên)
-- ===========================================================================
CREATE TEMP TABLE _fix (canbo_id text, ma_title text, soqd text, ngayqd date) ON COMMIT DROP;
INSERT INTO _fix(canbo_id, ma_title, soqd, ngayqd) VALUES
-- Lê Anh Tuấn — PTĐT: cả 2 ông (1973 & 1979) đều đạt LĐTT (QĐ 924 có (A)+(B))
('cmprqtota001qcgume1tr6up5','LDTT','924/QĐ-SXD','2025-12-30'),  -- Lê Anh Tuấn 1973-01-04
('cmprqtoya0027cgum9puxvk82','LDTT','924/QĐ-SXD','2025-12-30'),  -- Lê Anh Tuấn 1979-01-16
-- Giấy khen (QĐ 940 chỉ 1 người "(A)") -> ông 1979 (theo xác nhận của người dùng)
('cmprqtoya0027cgum9puxvk82','GIAY_KHEN','940/QĐ-SXD','2025-12-31'); -- Lê Anh Tuấn 1979-01-16

INSERT INTO office_reward_records
  (id, "canBoId", "rewardTitleId", nam, "danhHieu", "capKhen", "soQuyetDinh", "ngayQuyetDinh", "coQuanQuyetDinh", "thanhTich", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, f.canbo_id, t.id, 2025, t.ten, t."capKhen", f.soqd, f.ngayqd,
       'Giám đốc Sở Xây dựng tỉnh Quảng Trị', 'Thành tích trong công tác năm 2025', NOW(), NOW()
FROM _fix f JOIN office_reward_titles t ON t.ma = f.ma_title
WHERE NOT EXISTS (
  SELECT 1 FROM office_reward_records x
  WHERE x."canBoId" = f.canbo_id AND x.nam = 2025 AND x."rewardTitleId" = t.id
);

-- ===========================================================================
-- BÁO CÁO
-- ===========================================================================
\echo '== Tong so dong import theo QD x danh hieu =='
SELECT soqd, ma_title, count(*) FROM _imp GROUP BY soqd, ma_title ORDER BY soqd;

\echo '== Da GHI vao office_reward_records nam 2025 (theo danh hieu) =='
SELECT t.ma, count(*) FROM office_reward_records r JOIN office_reward_titles t ON t.id=r."rewardTitleId"
WHERE r.nam=2025 GROUP BY t.ma ORDER BY t.ma;

\echo '== Danh sach NGUOI da KHOP (can_bo) + danh hieu =='
SELECT cb."hoTen", t.ma FROM office_reward_records r
JOIN can_bo cb ON cb.id=r."canBoId" JOIN office_reward_titles t ON t.id=r."rewardTitleId"
WHERE r.nam=2025 ORDER BY t.ma, cb."hoTen";

\echo '== Muc I: ten TRUNG trong can_bo (bo qua, can chon thu cong) =='
SELECT DISTINCT i.hoten, i.ma_title FROM _imp i JOIN _cb c ON c.k=pg_temp.nrm(i.hoten)
WHERE i.dv='I. Văn phòng Sở' AND c.n>1 ORDER BY i.hoten;

\echo '== Muc I: ten KHONG khop can_bo (bo qua) =='
SELECT DISTINCT i.hoten, i.ma_title FROM _imp i LEFT JOIN _cb c ON c.k=pg_temp.nrm(i.hoten) AND c.n=1
WHERE i.dv='I. Văn phòng Sở' AND c.id IS NULL ORDER BY i.ma_title, i.hoten;

\echo '== Don vi truc thuoc: KHONG nhap (ngoai Muc I) — so dong theo don vi =='
SELECT i.dv, count(*) FROM _imp i WHERE i.dv <> 'I. Văn phòng Sở' GROUP BY i.dv ORDER BY i.dv;

COMMIT;
