-- 010: Mở rộng hồ sơ cán bộ theo file QLNS - SXD QUANG TRI (14.5.2026)
-- Quản lý đủ 53 cột của biểu mẫu DS SXD. Idempotent (IF NOT EXISTS).

DO $$ BEGIN
  CREATE TYPE "GioiTinh" AS ENUM ('NAM', 'NU');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE can_bo
  -- Nhân thân & cư trú (cột G..M)
  ADD COLUMN IF NOT EXISTS "gioiTinh"             "GioiTinh",
  ADD COLUMN IF NOT EXISTS "queQuanTruoc"         TEXT,          -- G: Quê quán (trước hợp nhất)
  ADD COLUMN IF NOT EXISTS "queQuanSau"           TEXT,          -- H: Quê quán (sau hợp nhất) — tự động chuyển đổi
  ADD COLUMN IF NOT EXISTS "noiOTruoc"            TEXT,          -- I: Nơi ở (trước hợp nhất)
  ADD COLUMN IF NOT EXISTS "noiOHienNay"          TEXT,          -- J: Nơi ở (hiện nay)
  ADD COLUMN IF NOT EXISTS "quangTriCuRa"         TEXT,          -- K: QT (cũ) ra

  -- Biên chế & bổ nhiệm (cột N..S)
  ADD COLUMN IF NOT EXISTS "loaiHinh"             TEXT,          -- N: BCHC / BCSN / HĐ...
  ADD COLUMN IF NOT EXISTS "ngayVaoBienChe"       DATE,          -- O: Ngày vào BC, HĐ
  ADD COLUMN IF NOT EXISTS "boNhiemLanDau"        TEXT,          -- P: Bổ nhiệm lần đầu (text kèm ghi chú)
  ADD COLUMN IF NOT EXISTS "ngayBoNhiemGanNhat"   DATE,          -- Q
  ADD COLUMN IF NOT EXISTS "ngayBoNhiemTiepTheo"  DATE,          -- R = Q + 5 năm
  ADD COLUMN IF NOT EXISTS "ngayVeHuu"            DATE,          -- S

  -- Ngạch, bậc lương (cột T,U,AB,AC — V,W,X,Y,AA đã có sẵn)
  ADD COLUMN IF NOT EXISTS "maNgach"              TEXT,          -- T: VD 01.001
  ADD COLUMN IF NOT EXISTS "bacLuong"             INTEGER,       -- U
  ADD COLUMN IF NOT EXISTS "ngachHienHuong"       TEXT,          -- AB: CVCC/CVC/CV...
  ADD COLUMN IF NOT EXISTS "ngayBoNhiemNgach"     DATE,          -- AC

  -- Trình độ đào tạo (cột AE..AT)
  ADD COLUMN IF NOT EXISTS "trinhDoChuyenMon"     TEXT,          -- AE
  ADD COLUMN IF NOT EXISTS "chuyenNganh"          TEXT,          -- AF
  ADD COLUMN IF NOT EXISTS "namTotNghiep"         TEXT,          -- AG
  ADD COLUMN IF NOT EXISTS "heDaoTao"             TEXT,          -- AH
  ADD COLUMN IF NOT EXISTS "trinhDoQLNN"          TEXT,          -- AI
  ADD COLUMN IF NOT EXISTS "namDaoTaoQLNN"        TEXT,          -- AJ
  ADD COLUMN IF NOT EXISTS "trinhDoLLCT"          TEXT,          -- AK
  ADD COLUMN IF NOT EXISTS "namDaoTaoLLCT"        TEXT,          -- AL
  ADD COLUMN IF NOT EXISTS "trinhDoNgoaiNgu"      TEXT,          -- AM
  ADD COLUMN IF NOT EXISTS "namDaoTaoNgoaiNgu"    TEXT,          -- AN
  ADD COLUMN IF NOT EXISTS "trinhDoTinHoc"        TEXT,          -- AO
  ADD COLUMN IF NOT EXISTS "namDaoTaoTinHoc"      TEXT,          -- AP
  ADD COLUMN IF NOT EXISTS "namDaoTaoCapPhong"    TEXT,          -- AQ
  ADD COLUMN IF NOT EXISTS "namDaoTaoCapSo"       TEXT,          -- AR
  ADD COLUMN IF NOT EXISTS "qpAn"                 TEXT,          -- AS: ĐT1/ĐT2/ĐT3...
  ADD COLUMN IF NOT EXISTS "namDaoTaoQPAN"        TEXT,          -- AT

  -- Đảng (cột AU..AW, AZ)
  ADD COLUMN IF NOT EXISTS "soTheDang"            TEXT,          -- AU
  ADD COLUMN IF NOT EXISTS "ngayKetNapDang"       DATE,          -- AV
  ADD COLUMN IF NOT EXISTS "ngayVaoDangChinhThuc" DATE,          -- AW
  ADD COLUMN IF NOT EXISTS "chiBo"                TEXT,          -- AZ

  -- Quản trị
  ADD COLUMN IF NOT EXISTS "trangThai"            TEXT NOT NULL DEFAULT 'DANG_CONG_TAC', -- DANG_CONG_TAC/NGHI_HUU/CHUYEN_CONG_TAC/NGHI_VIEC
  ADD COLUMN IF NOT EXISTS "ghiChu"               TEXT;

CREATE INDEX IF NOT EXISTS "can_bo_trangThai_idx" ON can_bo ("trangThai");
CREATE INDEX IF NOT EXISTS "can_bo_chiBo_idx" ON can_bo ("chiBo");
