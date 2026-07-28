-- Commit: Chấm công làm thêm giờ theo phòng ban / tháng.
-- Nhập TỔNG giờ/người theo 4 loại (ngày thường, thứ Bảy, Chủ nhật, làm đêm).
-- Xuất Excel "BẢNG CHẤM CÔNG LÀM THÊM GIỜ" chi tiết + Word "VĂN BẢN THỎA THUẬN
-- LÀM THÊM GIỜ" (Mẫu số 01/PLIV). Trần 200 giờ/người/năm (BLLĐ 2019, Đ.107).
-- Tham chiếu to_chuc/can_bo bằng id thuần (scalar) — không FK chéo, idempotent.

CREATE TABLE IF NOT EXISTS overtime_timesheets (
  id               text PRIMARY KEY,
  "toChucId"       text NOT NULL,
  "tenPhong"       text NOT NULL,
  thang            integer NOT NULL,
  nam              integer NOT NULL,
  "tuNgay"         date NOT NULL,
  "denNgay"        date NOT NULL,
  "ngayKy"         date,
  "diaDiem"        text,
  "lyDo"           text,
  "nguoiChamCong"  text,
  "truongPhong"    text,
  "lanhDaoSo"      text,
  "chucDanhLanhDao" text,
  "ghiChu"         text,
  "createdById"    text,
  "createdAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "overtime_timesheets_toChucId_thang_nam_key"
  ON overtime_timesheets ("toChucId", thang, nam);
CREATE INDEX IF NOT EXISTS "overtime_timesheets_nam_idx" ON overtime_timesheets (nam);
CREATE INDEX IF NOT EXISTS "overtime_timesheets_toChucId_idx" ON overtime_timesheets ("toChucId");

CREATE TABLE IF NOT EXISTS overtime_entries (
  id            text PRIMARY KEY,
  "timesheetId" text NOT NULL REFERENCES overtime_timesheets(id) ON DELETE CASCADE,
  "canBoId"     text,
  "hoTen"       text NOT NULL,
  "chucVu"      text,
  "thuTu"       integer NOT NULL DEFAULT 0,
  "gioThuong"   double precision NOT NULL DEFAULT 0,
  "gioT7"       double precision NOT NULL DEFAULT 0,
  "gioCN"       double precision NOT NULL DEFAULT 0,
  "gioDem"      double precision NOT NULL DEFAULT 0,
  "ghiChu"      text,
  "createdAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "overtime_entries_timesheetId_idx" ON overtime_entries ("timesheetId");
CREATE INDEX IF NOT EXISTS "overtime_entries_canBoId_idx" ON overtime_entries ("canBoId");
