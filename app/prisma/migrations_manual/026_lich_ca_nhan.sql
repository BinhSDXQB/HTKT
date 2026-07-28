-- Module LỊCH CÔNG TÁC CÁ NHÂN — mỗi cán bộ tự tạo mục lịch của mình; có thể đánh
-- dấu "công khai cho phòng" để cả phòng (cùng toChucId) cùng xem. Hạn công việc
-- (cong_viec.ngayHetHan) được GỘP hiển thị ở tầng UI, không lưu trùng ở đây.
-- loai/mauSac lưu TEXT (KHÔNG enum native) để tránh lỗi cast enum khi ghi
-- (xem bài học enum ở module cong_viec). Additive, idempotent.

CREATE TABLE IF NOT EXISTS lich_ca_nhan (
  id          text PRIMARY KEY,
  "userId"    text NOT NULL REFERENCES users(id),
  "toChucId"  text REFERENCES to_chuc(id),
  "tieuDe"    text NOT NULL,
  "moTa"      text,
  "diaDiem"   text,
  "loai"      text NOT NULL DEFAULT 'KHAC',    -- HOP|CONG_TAC|TRUC|NGHI|KHAC
  "mauSac"    text,                             -- override màu (mặc định theo loai ở UI)
  "batDau"    timestamp(3) NOT NULL,
  "ketThuc"   timestamp(3),
  "congKhai"  boolean NOT NULL DEFAULT false,   -- true = chia sẻ cho cả phòng (toChucId)
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" timestamp(3)
);
CREATE INDEX IF NOT EXISTS "lich_ca_nhan_userId_idx"   ON lich_ca_nhan ("userId");
CREATE INDEX IF NOT EXISTS "lich_ca_nhan_toChucId_idx" ON lich_ca_nhan ("toChucId");
CREATE INDEX IF NOT EXISTS "lich_ca_nhan_batDau_idx"   ON lich_ca_nhan ("batDau");
