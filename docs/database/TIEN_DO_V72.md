# TIEN_DO_V72 — Tiến độ và quy tắc tự chạy kế hoạch CSDL V7.2

Tệp này là điểm vào cho mọi phiên làm tiếp (kể cả phiên tự bật theo lịch, không có trí nhớ của phiên trước). Đọc hết tệp này trước khi làm gì. Cập nhật tệp sau mỗi bước.

Kế hoạch gốc: `SCHEMA_EVOLUTION_PLAN.md` (các bước E0–E10). Quy tắc ánh xạ: `DATA_MAPPING_RULES.md`. Số liệu: `DATA_INTEGRITY_REPORT.md`, `DOI_SOAT_E0_2026-11-13.md`. Kết quả thử: `MIGRATION_TEST_REPORT.md`.

## Quy tắc tự chạy

Người dùng yêu cầu ngày 13/11/2026: tự làm theo kế hoạch, hết hạn mức thì dừng, đến giờ tự bật lại làm tiếp. Yêu cầu này KHÔNG thay ma trận phê duyệt trong `~/.claude/CLAUDE.md` (mức HIGH/CRITICAL hỏi riêng từng hành động).

ĐƯỢC tự làm, không hỏi:

- Đọc mã, đọc CSDL thật trong giao dịch `READ ONLY`.
- Soạn tài liệu và bản nháp migration trong `docs/database/nhap/` (tên `NNN_*.NHAP.sql`).
- Chạy thử trên bản sao `ql_htkt_thu051` (đã được duyệt tạo để thử; đã khử thông tin nhạy cảm). Mọi lệnh ghi phải đi qua hàm kiểm `current_database() = 'ql_htkt_thu051'`.
- Phản biện Codex cho việc cấp M/L (tối đa 2 vòng), tự kiểm chứng từng phát hiện. Codex hết hạn mức thì ghi lại và làm việc khác; không dùng `OPENAI_API_KEY` của dự án.
- `npm test` trong `app/`, ESLint tệp lẻ, smoke script.
- Commit CỤC BỘ trên nhánh `ai-content-m1` các tệp trong `docs/database/` và `docs/ai/`, thông điệp nêu lý do.

KHÔNG được tự làm; ghi vào mục "Chờ người dùng duyệt" rồi chuyển sang việc khác:

- Ghi bất kỳ thứ gì vào CSDL thật `ql_htkt` (migration, UPDATE, INSERT, DELETE).
- Đặt tệp vào `app/prisma/migrations_manual/` (thư mục này được tác vụ triển khai tự áp).
- `git push` dưới mọi hình thức, mở PR, đụng nhánh `main`.
- Xoá CSDL, xoá bảng, xoá tệp sao lưu, xoá bản sao thử.
- Sửa mã ứng dụng trong `app/` (ngoài bản nháp), sửa `schema.prisma`, chạy `prisma generate`, `tsc --noEmit`, `npm run build`.
- Restart PM2, IIS, PostgreSQL; sửa tác vụ lịch; đụng `.env`.
- Tạo CSDL mới ngoài bản sao đã có.

Dừng ngay và ghi lại nếu: bản sao `ql_htkt_thu051` không còn; `git status` có thay đổi lạ không do việc này tạo ra; health `http://localhost:3001/api/health` khác 200; RAM trống dưới 1 GB.

Không ghi CCCD, lương, họ tên cán bộ vào bất kỳ tệp nào trong repo. Nhận diện cán bộ bằng 8 ký tự cuối của `can_bo.id`.

## Đã xong

| Bước | Nội dung | Ngày | Bằng chứng |
|---|---|---|---|
| Khảo sát | 9 tài liệu trong `docs/database/` | 13/11/2026 | commit trên `ai-content-m1` |
| E0 | Báo cáo đối soát theo từng bản ghi | 13/11/2026 | `DOI_SOAT_E0_2026-11-13.md` |
| E4 | Mig 051 đồng bộ `phan_cong` theo `can_bo`: đã thử trên bản sao và ĐÃ ÁP vào CSDL thật (người dùng duyệt) | 13/11/2026 | `MIGRATION_TEST_REPORT.md` |

## Việc tiếp theo (làm theo thứ tự; mỗi phiên làm được bao nhiêu thì làm)

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Sửa 3 tài liệu còn lệch sau E0: `SCHEMA_EVOLUTION_PLAN.md` (rủi ro trigger đã gỡ), `DATA_MAPPING_RULES.md` M5 (toạ độ trống), `DATA_SYNC_DESIGN.md` (trigger đã đọc) | xong 13/11/2026 |
| 2 | E1: nháp migration index cho 4 khoá ngoại thiếu index + rollback; thử trên bản sao | xong 13/11/2026: `nhap/052_*.NHAP.sql`, thử đạt (áp, áp lại, hoàn tác) |
| 3 | E2: nháp migration bảng `doi_soat_hang_doi` + rollback; thử trên bản sao | xong 13/11/2026: `nhap/053_*.NHAP.sql`, thử đạt 24 tình huống |
| 4 | Codex rà E1 + E2 (gộp một lượt), sửa theo phát hiện đã kiểm chứng, thử lại | xong 13/11/2026: 12 phát hiện, viết lại v2, thử đạt 37/37; chi tiết ở `MIGRATION_TEST_REPORT.md`. Áp vào CSDL thật: chờ duyệt |
| 5 | E6 chuẩn bị | xong 13/11/2026: mã đã có sẵn `napTuBieuMau` nên KHÔNG viết script nạp mới; việc còn lại là làm sạch dữ liệu và bấm nạp theo xã, xem mục E6 trong `SCHEMA_EVOLUTION_PLAN.md`. Chờ người dùng |
| 6 | E3: nháp cột `version` cho `htkt_doi_tuong`, `nghiep_vu_ban_ghi`, `cong_viec` + danh sách mọi đường ghi trong mã phải sửa (chỉ liệt kê, không sửa mã) | chưa |
| 7 | E7 chuẩn bị: nháp đưa 36 dự án GPMB vào `projects` theo M4; thử trên bản sao | chưa |
| 8 | E8: nháp bảng registry trường động + rollback; thử trên bản sao | chưa |
| 9 | E9: nháp bảng `thiet_bi`, `dong_bo_thao_tac` + rollback; thử trên bản sao | chưa |
| 10 | Cập nhật `MIGRATION_TEST_REPORT.md`, `docs/ai/TASKS.md`, `docs/ai/DECISIONS.md`; commit cục bộ | làm sau mỗi bước |

Khi cả bảng trên đã "xong" hoặc "chờ duyệt": ghi một dòng "HẾT VIỆC TỰ LÀM ĐƯỢC" ở đầu mục này và không làm gì thêm.

## Chờ người dùng duyệt

| Việc | Mức | Ghi chú |
|---|---|---|
| Áp migration 052 (4 index) vào CSDL thật | HIGH | nháp v2 đã thử trên bản sao; khi duyệt: sao lưu, chuyển tệp vào `migrations_manual` bỏ đuôi `.NHAP`, áp bằng `apply-migration.mjs`, ghi sổ |
| Áp migration 053 (bảng `doi_soat_hang_doi`) vào CSDL thật | HIGH | như trên; chưa có mã nào dùng nên có thể chờ đến khi làm E7/E9 |
| E6: làm sạch dữ liệu báo cáo rồi bấm "Nạp từ biểu mẫu" theo xã | — | việc của cán bộ phụ trách xã; xem mục E6 trong `SCHEMA_EVOLUTION_PLAN.md` |
| Thử `napTuBieuMau` trên bản sao | HIGH | cần chạy ứng dụng trỏ vào bản sao |
| `git push --force-with-lease origin ai-content-m1` | CRITICAL | Remote đang ở commit cũ `8b4d391` còn họ tên cán bộ trong báo cáo E0; bản cục bộ đã gỡ |
| Mở PR `ai-content-m1` → `ra-soat-csdl-chatbot-phap-ly` | — | cần `gh auth login`; PR gồm 41+ commit |
| Xoá bản sao `ql_htkt_thu051` | CRITICAL | đang dùng để thử; xoá khi xong toàn bộ kế hoạch |
| 18 cán bộ thiếu chức danh; 3 trường hợp lệch đơn vị hồ sơ / tài khoản | — | chờ Văn phòng Sở; danh sách ở `DOI_SOAT_E0_2026-11-13.md` M1.1, M1.3 |
| Quyết định: nguồn chủ dự án (đề xuất `projects`); số phận 15 bảng mạng lưới rỗng; nguồn chủ nhà thầu; tablet PWA hay ứng dụng riêng | — | xem `DATA_MAPPING_RULES.md`, `DATA_SYNC_DESIGN.md` |

## Nhật ký phiên

| Thời điểm | Phiên | Đã làm | Dừng vì |
|---|---|---|---|
| 13/11/2026 | phiên gốc | khảo sát, E0, E4, lập tệp này | — |
| 13/11/2026 tối | phiên gốc | việc 1–5: sửa 3 tài liệu; nháp + thử 052, 053 (Codex 1 vòng, v2 đạt 37/37); E6 chuyển sang tái sử dụng `napTuBieuMau` | hết phần việc của lượt; việc 6–9 để phiên sau |

Trạng thái bản sao `ql_htkt_thu051` sau phiên này: đã áp 052 v2 và 053 v2 (bảng `doi_soat_hang_doi` rỗng); CHƯA áp 051 (`phan_cong` 103 dòng). Phiên sau cần biết điều này khi so số liệu.

## Công cụ thử trên bản sao

Chuỗi kết nối lấy từ `app/.env` (`DIRECT_DATABASE_URL` hoặc `DATABASE_URL`), đổi tên CSDL thành `ql_htkt_thu051`. Không in chuỗi kết nối. Áp một tệp SQL theo đúng cách của dự án: `client.query(nguyên tệp)` qua thư viện `pg` (xem `app/scripts/deploy/apply-migration.mjs`); tệp migration không được chứa lệnh riêng của psql. Script thử đặt trong thư mục scratchpad của phiên, không đặt trong repo.
