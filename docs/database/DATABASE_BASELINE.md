# DATABASE_BASELINE — Hiện trạng CSDL làm mốc

Mốc: 13/11/2026. Nguồn: truy vấn catalog trong giao dịch `READ ONLY` trên CSDL thật. Mọi số liệu VERIFIED trừ khi ghi khác. Không có thay đổi nào với mã nguồn, CSDL hay production trong đợt khảo sát.

Bộ tài liệu cùng thư mục: `EXISTING_DATA_INVENTORY.md`, `ENTITY_RELATIONSHIP_MAP.md`, `DATA_REUSE_MATRIX.md`, `DATA_MAPPING_RULES.md`, `SCHEMA_EVOLUTION_PLAN.md`, `DATA_SYNC_DESIGN.md`, `DATA_INTEGRITY_REPORT.md`, `MIGRATION_TEST_REPORT.md`.

## Thông số

| Hạng mục | Giá trị |
|---|---|
| CSDL | `ql_htkt`, PostgreSQL 16.14 (Windows, 64-bit) |
| Dung lượng | 469 MB; riêng `tai_lieu_chunk` khoảng 440 MB (véc-tơ RAG) |
| Schema | `public` (142 bảng + 13 view), `org_v2` (5 bảng + 1 view, tất cả bảng 0 dòng) |
| Extension | `vector` 0.8.0, `pg_trgm` 1.6, `pgcrypto` 1.3, `pg_stat_statements` 1.10. Chưa có PostGIS |
| Prisma | 141 model, khớp 1-1 với 141 bảng nghiệp vụ (bảng thứ 142 là `_prisma_migrations`) |
| Bảng rỗng | 73/142 |
| Khoá chính | 142/142 bảng có khoá chính |
| Khoá ngoại | 248 cứng; 57 cột id mềm (không ràng buộc) |
| Khoá ngoại thiếu index | 4 (`cchn_ho_so` ×2, `cchn_lich_su`, `thanh_tich_con`) |
| View nghiệp vụ | 12: `v_htkt_*_xa` (7), `v_htkt_tong_hop_xa`, `v_htkt_doi_tuong`, `v_htkt_doi_tuong_tong_hop`, `v_dai_so_hieu_xa`, `org_v2.v_user_to_chuc` |
| Trigger | 8: `trg_htkt_truoc_ghi` trên hub, `trg_report_*_lien_ket` trên 7 bảng báo cáo |
| Hàm | 6: `fn_bao_cao_kiem_lien_ket`, `fn_htkt_dien_tich_m2`, `fn_htkt_dinh`, `fn_htkt_do_dai_m`, `fn_htkt_goi_y_so_hieu`, `fn_htkt_truoc_ghi` |

## Thay đổi sau mốc

- 13/11/2026, mig 051: `phan_cong` 103 → 146 dòng; thêm bảng `phan_cong_mig051_log` (57 dòng, nhật ký trước/sau để hoàn tác). Bảng nhật ký này không có model Prisma, chủ ý. Chi tiết: `MIGRATION_TEST_REPORT.md`.

- 13/11/2026, mig 052: thêm 4 index cho khoá ngoại của `cchn_ho_so`, `cchn_lich_su`, `thanh_tich_con`; không còn khoá ngoại nào trong `public` thiếu index.

## Migration

- Thư mục: `app/prisma/migrations_manual/NNN_*.sql`, từ 037 trở đi có kèm `_rollback.sql`.
- Sổ đã áp `C:\Troly\deploy\applied_migrations.txt`: đến `049_htkt_doi_tuong_hub.sql`.
- `050_ai_content.sql` có trong repo nhưng chưa áp; CSDL không có bảng `ai_content*`.
- `_prisma_migrations` có 5 dòng: Prisma Migrate không còn là kênh chính, mọi thay đổi đi qua `migrations_manual`.

## Mã nguồn chạm CSDL

- 72 tệp `route.ts` trong `app/api` (33 nhóm), cộng server action trong `app/actions`.
- `$transaction` xuất hiện ở 10 tệp.
- Ghi audit qua `lib/audit.ts` vào `audit_logs` (953 dòng).
- Kiểm tra sẵn có: `app/scripts/check-fk-mo-coi.mjs`, `check-org-v2-blockers.mjs`, `check-deptcode-mapping.mjs`, các `smoke-*.mjs`.

## Đặc điểm kiến trúc cần giữ

1. Trạng thái và tên đơn vị suy ra động từ khoá ngoại (`toChucId → to_chuc`), không lưu cờ tay.
2. Hai kiểu đặt tên cùng tồn tại: bảng cũ dùng camelCase (`"toChucId"`), bảng mới từ mig 037 dùng snake_case (`to_chuc_id`). Module mới theo snake_case.
3. Khoá chính kiểu `text` trên toàn hệ thống.
4. Trường động lưu JSONB (`customFields`, `thong_so`, `chi_tiet`, `truong_bo_sung`).
5. Xoá mềm bằng `deletedAt` / `deleted_at` ở các bảng nghiệp vụ mới; bảng cũ không có.

## Chưa xác minh (UNKNOWN)

- Nội dung 8 trigger và 6 hàm.
- Định nghĩa từng view so với báo cáo đang hiển thị.
- Thống kê `pg_stat` có vẻ vừa được đặt lại, nên số lần quét bảng không dùng để kết luận bảng nào "không ai dùng".
