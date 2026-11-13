# MIGRATION_TEST_REPORT — Báo cáo kiểm thử migration

Trạng thái: migration 051 (bước E4) đã thử trên bản sao và **đã áp vào CSDL thật ngày 13/11/2026** theo duyệt của người dùng. Các bước khác của `SCHEMA_EVOLUTION_PLAN.md` vẫn NOT_RUN.

## Mốc đối chiếu trước thay đổi (13/11/2026, VERIFIED)

| Chỉ số | Giá trị |
|---|---:|
| Bảng `public` | 142 |
| Khoá ngoại | 248 |
| View nghiệp vụ | 12 |
| Trigger | 8 |
| `users` | 220 |
| `can_bo` | 164 |
| `phan_cong` | 103 |
| `to_chuc` | 25 |
| `administrative_units` | 79 |
| `streets` | 929 |
| `assets` | 929 |
| `report_duong` | 1.342 |
| `report_dien_cs` | 901 |
| `report_thoat_nuoc` | 780 |
| `report_cay_xanh` | 680 |
| `report_bai_do_xe` | 12 |
| `nghiep_vu_ban_ghi` | 532 |
| `cong_viec` | 91 |
| `tai_lieu` / `tai_lieu_chunk` | 201 / 25.627 |
| `audit_logs` | 953 |
| Khoá ngoại mềm mồ côi (32 cột) | 0 |

Số đếm đầy đủ 142 bảng: `EXISTING_DATA_INVENTORY.md`.

## Môi trường thử

- Bản sao CSDL trên cùng máy, tên khác, khôi phục từ bản sao lưu đêm (`C:\Backup_QLHTKT`).
- Khử thông tin nhạy cảm trước khi thử: CCCD, lương, hệ số, số điện thoại, email, mật khẩu băm, mã BHXH, mã số thuế cá nhân.
- Bỏ `tai_lieu_chunk` khỏi bản sao để tiết kiệm RAM và ổ đĩa, trừ khi migration chạm RAG.
- Tạo bản sao là hành động cấp HIGH: cần người dùng duyệt và kiểm dung lượng trống trước.

## Kịch bản cho mỗi migration

| # | Kiểm tra | Cách làm | Đạt khi |
|---|---|---|---|
| 1 | Áp được | chạy `NNN_*.sql` trên bản sao | không lỗi |
| 2 | Chạy lại an toàn | chạy lần hai | không lỗi, không đổi dữ liệu |
| 3 | Dữ liệu cũ còn đủ | so số đếm 142 bảng với mốc | chỉ khác ở bảng migration chủ đích thay đổi |
| 4 | Quan hệ còn nguyên | so số khoá ngoại; chạy `check-fk-mo-coi.mjs` | không mất khoá ngoại, 0 mồ côi |
| 5 | Không sinh trùng | truy vấn trùng theo khoá nghiệp vụ của bảng bị chạm | 0 nhóm trùng mới |
| 6 | Báo cáo không lệch | so kết quả `v_htkt_tong_hop_xa` và các view `v_htkt_*_xa` trước/sau | giống hệt |
| 7 | Chức năng cũ chạy | `npm test` trong `app/`; `smoke-trang-chu`, `smoke-cong-viec`, `smoke-htkt-nghiep-vu`, `smoke-chatbot` | đạt hết |
| 8 | Quyền không nới | gọi API bị chạm bằng tài khoản xã, tài khoản phòng khác | bị từ chối như trước |
| 9 | Hiệu năng | `EXPLAIN` các truy vấn chính trên bảng bị chạm | không chuyển sang quét toàn bảng ở bảng lớn |
| 10 | Hoàn tác được | chạy `_rollback.sql`, lặp lại kiểm tra 3 và 4 | trở về mốc |

Không chạy `tsc --noEmit` hay `npm run build` toàn dự án trong kiểm thử (máy 6 GB).

## Kết quả thử 051 (đồng bộ `phan_cong` theo `can_bo`) — 13/11/2026

Tệp: `app/prisma/migrations_manual/051_dong_bo_phan_cong_tu_can_bo{,_rollback,_verify}.sql` (lúc thử còn là bản nháp v2 trong `docs/database/nhap/`, sau hai vòng Codex).

Môi trường: CSDL `ql_htkt_thu051` trên cùng máy chủ PostgreSQL 16.14, nạp bằng `pg_dump | psql` từ `ql_htkt`, bỏ dữ liệu `tai_lieu_chunk`, `chatbot_logs`, `audit_logs`; 25 MB. Đã khử CCCD, lương, họ tên, liên hệ, mật khẩu băm trong bản sao trước khi thử. Mọi lệnh ghi đi qua hàm kiểm tra tên CSDL đích.

| # | Tình huống | Mong đợi | Kết quả |
|---|---|---|---|
| 0 | Kiểm trước khi áp | 103 dòng; 57 chưa khớp; 18/0; 0 | đúng |
| 1 | Áp migration | thoát 0; 57 dòng nhật ký | đúng |
| 2 | Kiểm sau áp | 146; 0 chưa khớp; SUA 14, TAO 43; 0 khác nhật ký; 0 sửa ngoài dự kiến; 89 không bị chạm | đúng |
| 2b | Số dòng 139 bảng khác | không đổi | đúng (mã băm số đếm trùng) |
| 3 | Áp lần hai | từ chối, dữ liệu không đổi | đúng |
| 4–5 | Hoàn tác | `phan_cong` trùng từng byte trạng thái trước (md5 toàn bảng, gồm `updatedAt`); nhật ký được đổi tên | đúng |
| 6 | Hoàn tác lần hai | từ chối | đúng |
| 7 | Áp lại sau hoàn tác | thoát 0; 57 dòng nhật ký | đúng |
| 8 | Sửa một dòng sau migration rồi hoàn tác | từ chối, mã thoát 3, không đổi gì | đúng |
| 9 | Hoàn tác sau khi trả dòng đó về như cũ | trùng trạng thái trước | đúng |
| 10 | Có sẵn dòng không-chính trùng (cán bộ, đơn vị, chức danh, `tuNgay` NULL) | vi phạm unique, huỷ toàn bộ, không còn bảng nhật ký | đúng |
| 11 | Có phân công chính đã có `denNgay` | từ chối ở điều kiện tiên quyết | đúng |
| 13 | CSDL thật `ql_htkt` sau toàn bộ đợt thử | 103 dòng, không có dòng `pc051_*`, không có bảng nhật ký | đúng |

Đối chiếu với 10 kịch bản chuẩn ở trên:

| Kịch bản | Trạng thái |
|---|---|
| 1 Áp được · 2 Chạy lại an toàn · 3 Dữ liệu cũ còn đủ · 5 Không sinh trùng · 10 Hoàn tác được | ĐẠT trên bản sao |
| 4 Quan hệ còn nguyên | ĐẠT một phần: migration không đổi cấu trúc ngoài việc thêm bảng nhật ký; `check-fk-mo-coi.mjs` NOT_RUN trên bản sao |
| 6 Báo cáo không lệch | không áp dụng: không view nào phụ thuộc `phan_cong` (đã kiểm `pg_depend`) |
| 7 Chức năng cũ chạy | NOT_RUN: không mã ứng dụng nào đọc/ghi `phan_cong` (grep), nên chưa chạy smoke |
| 8 Quyền không nới | không áp dụng: không đổi quyền, không đổi API |
| 9 Hiệu năng | NOT_RUN: bảng 146 dòng, không thêm index |

Chưa thử: hành vi khoá khi ứng dụng đang ghi `can_bo` đồng thời (bản sao không có tải); chạy trên dữ liệu thật chưa khử (giá trị nhạy cảm không tham gia logic migration).

## Kết quả thử 052 (index khoá ngoại) và 053 (hàng đợi đối soát) — 13/11/2026

Tệp: `docs/database/nhap/052_index_khoa_ngoai_con_thieu{,_rollback}.NHAP.sql`, `053_doi_soat_hang_doi{,_rollback}.NHAP.sql` (bản v2). Chạy trên bản sao `ql_htkt_thu051` theo đúng cách của dự án (`client.query(nguyên tệp)`). **Chưa áp vào CSDL thật.**

Phản biện Codex 1 vòng (cấp M), 12 phát hiện, tự kiểm chứng bằng cách đọc lại SQL:

| # | Phát hiện | Mức | Kiểm chứng | Xử lý trong v2 |
|---|---|---|---|---|
| 1 | Rollback 053 kiểm rỗng rồi mới xoá bảng, phiên khác chèn kịp sẽ mất dòng | HIGH | đúng | khoá ACCESS EXCLUSIVE trước khi kiểm |
| 2 | Xoá cứng user/đơn vị được dòng đã xử lý tham chiếu sẽ lỗi vì trigger chặn UPDATE do SET NULL sinh ra | HIGH | đúng | trigger cho riêng 4 khoá ngoại về NULL; đã thử |
| 3 | Không buộc có người xử lý; chèn thẳng trạng thái đã xử lý được | HIGH | đúng | dòng mới buộc `CHO_XU_LY`; chuyển trạng thái buộc có `nguoi_xu_ly_id` |
| 4 | Không chặn DELETE/TRUNCATE | HIGH | đúng | trigger chặn xoá dòng đã xử lý và chặn TRUNCATE |
| 5 | `to_regclass` nhận cả tên index; không kiểm bản ghi nguồn tồn tại | MEDIUM | đúng | chỉ nhận bảng thường trong `public`; kiểm bản ghi tồn tại để tầng ứng dụng làm (bảng đa hình) |
| 6 | Chuỗi rỗng, JSONB không phải object lọt qua | MEDIUM | đúng | thêm CHECK; xung đột phiên bản buộc đủ hai phía dữ liệu |
| 7 | Thao tác tablet gửi lặp sau khi dòng đã đóng tạo được dòng mới | HIGH (suy luận) | đúng | cột `khoa_chong_lap` duy nhất trên mọi trạng thái |
| 8 | Người duyệt có thể duyệt nhầm bản đã bị script đổi; dữ liệu chính đổi sau khi chụp | HIGH (suy luận) | đúng, nhưng chỉ sửa được một phần ở CSDL | thêm `phien_ban` (tự tăng) và `phien_ban_nguon`; việc so phiên bản và ghi cùng giao dịch là yêu cầu cho tầng ứng dụng |
| 9 | `IF NOT EXISTS` khi chạy lại bỏ qua đối tượng sai định nghĩa | HIGH | đúng | migration một lần: bảng đã có thì từ chối |
| 10 | Tự kiểm 052 chấp nhận index một phần, đếm nhầm cột INCLUDE | MEDIUM | đúng | kiểm đích danh 4 index: btree, hợp lệ, một cột khoá, không một phần, không biểu thức |
| 11 | Rollback 052 có thể gỡ index không do 052 tạo | MEDIUM | đúng | 052 từ chối nếu tên đã tồn tại; đã thử |
| 12 | `lock_timeout` tính từng lần chờ | MEDIUM | đúng nhưng ảnh hưởng nhỏ (bảng 0–174 dòng) | thêm `statement_timeout` 30 giây |

Kết quả thử v2: 37/37 tình huống đạt. Gồm: áp, áp lần hai bị từ chối, hoàn tác trả đúng số bảng / index / ràng buộc / trigger / hàm ban đầu (145 / 555 / 491 / 8 / 6), 052 từ chối khi tên index đã bị dùng, và 25 tình huống hành vi của hàng đợi (trùng dòng chờ, trạng thái, người xử lý, bất biến của dòng đã xử lý, chống gửi lặp, DELETE, TRUNCATE, rollback khi còn dữ liệu). Số dòng `can_bo`, `users`, `phan_cong`, `report_duong` trên bản sao không đổi.

Chưa thử: hành vi khoá dưới tải thật; xoá cứng một `users` thật để kích hoạt ON DELETE SET NULL (đã thử bằng UPDATE tương đương); bản v2 chưa qua Codex vòng 2.

## Nhật ký kết quả

| Migration | Ngày | Nơi chạy | Kết quả | Ghi chú |
|---|---|---|---|---|
| 051 (nháp v2, chạy bằng psql) | 13/11/2026 | bản sao `ql_htkt_thu051` | ĐẠT 13/13 tình huống | — |
| 051 (bản cuối, bỏ lệnh `\set` của psql) | 13/11/2026 | bản sao, qua `client.query(nguyên tệp)` như `apply-migration.mjs` | ĐẠT: áp, áp lần hai bị từ chối, hoàn tác trùng mã băm ban đầu, hoàn tác lần hai bị từ chối | lý do sửa: công cụ của dự án không chạy qua psql |
| 052, 053 (nháp v2) | 13/11/2026 | bản sao `ql_htkt_thu051` | ĐẠT 37/37 tình huống | chưa áp vào CSDL thật, chờ duyệt |
| 051 (bản cuối) | 13/11/2026 17:0x | **CSDL thật `ql_htkt`** | ĐÃ ÁP, thoát 0 | người dùng duyệt "Áp vào CSDL thật"; sao lưu trước: `C:\Backup_QLHTKT\premig051-20261113-165910.dump` (183 MB, 147 bảng) |

### Kiểm tra sau khi áp vào CSDL thật (13/11/2026)

| Phép kiểm | Trước | Sau |
|---|---|---|
| Tổng dòng `phan_cong` | 103 | 146 |
| Cán bộ trong phạm vi chưa khớp | 57 | 0 |
| Ngoài phạm vi / trong đó có phân công chính | 18 / 0 | 18 / 0 |
| Cán bộ có hơn một phân công chính | 0 | 0 |
| Số dòng `can_bo` / `users` / `to_chuc` / `chuc_danh` | 164 / 220 / 25 / 25 | không đổi |
| Nhật ký | — | SUA 14, TAO 43 |
| Dòng khác trạng thái "sau" trong nhật ký | — | 0 |
| Dòng SUA bị đổi cột ngoài dự kiến | — | 0 |
| Dòng không bị chạm | — | 89 (cả 89 giữ nguyên `updatedAt` cũ) |
| Phiên treo giao dịch / khoá còn giữ | — | 0 / 0 |
| `http://localhost:3001/api/health` | — | 200 |
| `check-fk-mo-coi.mjs` | sạch | sạch |

Sổ `C:\Troly\deploy\applied_migrations.txt` đã thêm `051_dong_bo_phan_cong_tu_can_bo.sql`. Lưu ý: 050 (`ai_content`) vẫn chưa áp và chưa có trong sổ.

Hoàn tác khi cần: `node scripts/deploy/apply-migration.mjs prisma/migrations_manual/051_dong_bo_phan_cong_tu_can_bo_rollback.sql` (trong `app/`), rồi xoá dòng 051 khỏi sổ. Tệp hoàn tác tự từ chối nếu có dòng đã bị sửa sau migration.

## Giới hạn đã biết của bộ kiểm thử hiện có

- Chỉ có một tệp test đơn vị (`lib/qd72/danh-gia.test.ts`) và các smoke script; CI chưa chạy test.
- Chưa có kiểm thử cho đồng bộ tablet, vì chưa có chức năng.
- Kiểm tra số 8 hiện phải làm tay; chưa có script.
