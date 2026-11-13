# SCHEMA_EVOLUTION_PLAN — Kế hoạch tiến hoá schema

Trạng thái: PROPOSED. Chưa migration nào được viết hay chạy. Mỗi bước dưới đây cần người dùng duyệt riêng; duyệt bước này không áp cho bước khác.

## Nguyên tắc

1. Chỉ thêm, không phá: thêm cột cho phép NULL hoặc có mặc định, thêm bảng, thêm view. Không đổi tên, không xoá cột hay bảng trong giai đoạn này.
2. Mỗi thay đổi là một tệp `app/prisma/migrations_manual/NNN_*.sql` kèm `NNN_*_rollback.sql`, và `_verify.sql` nếu có chuyển dữ liệu.
3. Số tiếp theo: 051 (050 `ai_content` đang chờ áp, thuộc việc khác).
4. Trình tự bắt buộc: sao lưu → chạy trên bản sao → đối chiếu số đếm trước/sau → phản biện Codex (cấp M: 1 vòng, cấp L: tối đa 2) → người dùng duyệt → áp → smoke.
5. Cập nhật `schema.prisma` cùng migration. Những gì Prisma không biểu diễn được (như unique `NULLS NOT DISTINCT` ở mig 034) phải có chú thích.
6. Module mới đặt tên snake_case, khoá chính `text`, có `created_at`, `updated_at`, `deleted_at`, `created_by_id`.

## Các bước

| Bước | Nội dung | Cấp | Phụ thuộc | Hoàn tác |
|---|---|---|---|---|
| E0 | Báo cáo đối soát chỉ-đọc theo từng bản ghi cho M1–M5 (`DATA_MAPPING_RULES.md`) | LOW | — | không cần |
| E1 | Index cho 4 khoá ngoại thiếu | M | — | `DROP INDEX` |
| E2 | Bảng hàng đợi đối soát `doi_soat_hang_doi` | M | — | `DROP TABLE` (bảng mới, chưa ai phụ thuộc) |
| E3 | Cột `version integer NOT NULL DEFAULT 1` trên các bảng sẽ đồng bộ tablet; đợt đầu: `htkt_doi_tuong`, `nghiep_vu_ban_ghi`, `cong_viec` | L | E2 | `DROP COLUMN` |
| E4 | Đồng bộ `phan_cong` với `can_bo` theo M1. **ĐÃ ÁP 13/11/2026** (mig 051: sửa 14, tạo 43; còn 18 cán bộ thiếu chức danh chờ Văn phòng Sở) | L (ghi dữ liệu nhân sự) | E0, duyệt M1 | `051_dong_bo_phan_cong_tu_can_bo_rollback.sql` (theo bảng nhật ký `phan_cong_mig051_log`) |
| E5 | Chọn nguồn chủ nhà thầu / tổ chức ngoài; nối `executing_units`, `qd72_utility_owners`, `httt_nang_luc_to_chuc` | M | quyết định của người dùng | theo phương án |
| E6 | Nạp `htkt_doi_tuong` từ `report_*` theo M3, gán `doiTuongId` | L | E0, đọc trigger và hàm, duyệt M2–M3 | xoá mềm theo lô nạp; đặt lại `doiTuongId` về NULL |
| E7 | Nối dự án theo M4 | M | duyệt M4 | đặt lại khoá ngoại về NULL |
| E8 | Registry trường động: bảng định nghĩa trường có phiên bản và trạng thái ngừng dùng | M | — | `DROP TABLE` |
| E9 | Bảng nền đồng bộ tablet (`DATA_SYNC_DESIGN.md`) | L | E2, E3 | `DROP TABLE` |
| E10 | Dọn `org_v2`, cột chữ `can_bo.chucVu`/`phongBan`, 15 bảng mạng lưới rỗng | L | chứng minh không còn mã phụ thuộc | không làm trong giai đoạn này |

Thứ tự đề xuất: E0 → E1 → E2 → E4 → E6 → E3 → E7 → E8 → E9. E5 và E10 chờ quyết định.

## Phác thảo cấu trúc mới

Chỉ là phác thảo để thảo luận, chưa phải migration.

**E2 — `doi_soat_hang_doi`**: `id`, `loai` (trùng lặp / xung đột phiên bản / khớp nghi ngờ), `bang_nguon`, `id_nguon`, `bang_dich`, `id_dich`, `du_lieu_de_xuat` jsonb, `du_lieu_hien_tai` jsonb, `quy_tac`, `trang_thai` (cho_xu_ly / chap_nhan / tu_choi), `nguoi_xu_ly_id`, `ghi_chu`, `created_at`, `xu_ly_luc`. CHECK trên `loai` và `trang_thai`.

**E3 — `version`**: tăng 1 mỗi lần cập nhật, do mã ứng dụng tăng trong cùng câu `UPDATE ... WHERE id = $1 AND version = $2`. Không dùng trigger để tránh chồng lên `trg_htkt_truoc_ghi` khi chưa đọc nội dung trigger đó.

**E8 — registry trường động**: `truong_dinh_nghia` (`id`, `pham_vi` = bảng hoặc lĩnh vực, `ma_truong`, `nhan`, `kieu`, `bat_buoc`, `quy_tac_kiem_tra` jsonb, `danh_muc_id`, `phien_ban`, `trang_thai` = dang_dung / ngung_dung, `hieu_luc_tu`, `hieu_luc_den`). Giá trị vẫn lưu ở các cột JSONB sẵn có. Ngừng dùng một trường chỉ đổi `trang_thai`, không xoá khoá trong JSONB.

Registry chỉ quản lý trường trong JSONB. Thêm cột vật lý vẫn đi qua migration.

## Phân tích tác động phải làm trước mỗi bước

- Grep tên bảng và tên model trong `app/`, `lib/`, `actions/`, `scripts/`.
- Kiểm tra view và trigger phụ thuộc (`pg_depend`).
- Với cột mới trên bảng có `SELECT *` hoặc xuất Excel theo thứ tự cột: kiểm tra mã xuất.
- Với bảng có trigger (`htkt_doi_tuong`, `report_*`): đọc hàm trigger trước.

## Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Trigger `trg_report_*_lien_ket` có hành vi chưa biết khi gán `doiTuongId` hàng loạt | HIGH | đọc hàm, thử trên bản sao (E6) |
| Ghi nhầm dữ liệu nhân sự ở E4 | HIGH | sao lưu bảng, chạy theo danh sách đã duyệt, không chạy theo điều kiện chung |
| Dev và production chung máy, RAM 6 GB | MEDIUM | không build, không `tsc` toàn dự án; bản sao CSDL bỏ `tai_lieu_chunk` |
| Mã cũ không tăng `version` làm lệch kiểm tra xung đột | MEDIUM | đợt đầu chỉ áp cho 3 bảng, sửa hết đường ghi của 3 bảng đó cùng lúc |
