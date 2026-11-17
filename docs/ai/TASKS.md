# TASKS

Cập nhật: 2026-11-17. Mỗi việc: ID · mục tiêu · trạng thái · tiêu chí nghiệm thu. Nguyên tắc: hai tác nhân không ghi cùng một tệp.

## Lộ trình nâng cấp lớp AI
| ID | Mục tiêu | Trạng thái | Nghiệm thu |
|---|---|---|---|
| AI-01 | Quy tắc gốc + docs/ai (CLAUDE, AGENTS, CONTEXT, DECISIONS, TASKS, LESSONS, CHANGELOG) | Đã tạo, chờ người dùng xem | Không quy tắc trùng; CLAUDE.md ≤100 dòng |
| AI-02 | Hooks bảo vệ + thu hẹp permissions cấp dự án | Hook xong (28/10/2026): `.claude/hooks/guard.mjs`, 15 ca + warn-mode + JSON hỏng đều đạt. Còn: thu hẹp `Read(//c//**)` ở settings cấp USER (cần người dùng làm), chưa có test tự động trong repo | Ca nguy hiểm bị chặn, có bằng chứng chạy |
| AI-03 | Test runner + test hồi quy cho `lib/` | Giai đoạn đầu xong (28/10/2026): `npm test` = `node:test` có sẵn Node 24, không cài thêm thư viện. 24 test đạt (luong 13, nghi-huu 10, qd72 1 tệp/17 kiểm tra); 8/8 đột biến thử đều bị bắt. Còn: chatbot, tham-dinh, kiem-tra-du-toan, API không lộ CCCD | `npm test` chạy, kết quả đính kèm |
| AI-04 | Skills: phản-biện-codex, rà-soát-vbpl, nhập-excel | Đã tạo 3 skill (28/10/2026) trong `.claude/skills/`; kiểm tĩnh đạt (frontmatter, đường dẫn, không secret). CHƯA chạy thử thực tế từng skill; lệnh Codex dựa trên memory 14/10/2026, chưa chạy lại (tốn hạn mức). Cần thử lần dùng thật đầu tiên rồi chỉnh | Mỗi skill có ca kiểm thử |
| AI-05 | Chuẩn hoá frontmatter memory (source/updated/confidence) | Xong phần khung (28/10/2026): 88 tệp có updated/source/confidence, `node tools/memory-lint.mjs` ĐẠT; thân bài không đổi (so với bản sao lưu `memory.bak-2026-10-28`); bù 2 tệp thiếu trong chỉ mục. Cả 88 tệp đang `unreviewed`. Còn: nâng dần lên `verified`/`inferred` khi rà từng tệp (việc thủ công, ưu tiên mục pháp lý/lương) | Có sao lưu trước, 88 tệp hợp lệ |
| AI-06 | `npm test` trong Actions + runbook deploy/rollback | Đã sửa workflow (bước `npm test` trước build) và viết `docs/ai/RUNBOOK_DEPLOY.md` (28/10/2026), đã commit, CHƯA push. Kiểm: YAML hợp lệ, thứ tự bước đúng, `npm test` cục bộ 24/24. CHƯA xác nhận workflow chạy xanh trên GitHub và deploy vẫn thành công — chỉ biết sau lần push `main` đầu tiên (cần người dùng duyệt) | Deploy vẫn thành công |
| AI-08 | Tích hợp master_prompt_v2: WORKFLOW/SECURITY/TESTING/ARCHITECTURE, handoff schema + validator, test hook trong repo, 3 skill mới | Đã tạo + commit (28/10/2026); `npm test` 49/49; kiểm tĩnh tài liệu/skill đạt. CHƯA chạy thực tế từng skill; test đã thêm vào `npm test` nên cần push mới chạy trong CI | Tài liệu không lặp quy tắc; test đạt; chưa tuyên bố chạy skill |
| AI-09 | Mở rộng test: phân quyền âm tính (API không lộ CCCD/lương), RAG (phạm vi, hết hiệu lực), kiểm tra dự toán, bẫy DATE pg | Xong một phần (28/10/2026): +36 test (85 tổng) cho hàm kiểm quyền, CCCD/tên đăng nhập, `tinhBieuThuc`; bộ nạp `tools/test-support/register.mjs`; 13 đột biến trên mã thật bị bắt. CHƯA làm: test cấp route/API (cần web+CSDL), RAG `searchTaiLieu` (gọi CSDL thật), phần còn lại của kiểm tra dự toán, bẫy DATE pg (không có hàm test được) | Có test đỏ khi cố tình làm hỏng |
| AI-10 | Test tích hợp CSDL: cần CSDL thử riêng (schema tách biệt hoặc bản sao đã ẩn danh) để test route phân quyền và RAG | Chưa bắt đầu — cần người dùng quyết cách có CSDL thử | Route nhạy cảm trả 401/403 khi thiếu quyền; RAG không trả tài liệu ngoài phạm vi |
| AI-07 | Dọn gốc repo, thống nhất nhánh mặc định | Chờ người dùng quyết | Có duyệt từng mục xoá |

## PATCH V7.1.1 — Đánh giá, nhận xét cuối năm 2026 (nhánh `ai-content-m1`, 17/11/2026)
| ID | Mục tiêu | Trạng thái | Nghiệm thu |
|---|---|---|---|
| DG-01 | Logic: quy trình 8 bước, bộ tiêu chí 30 điểm + KPI Mẫu 04, 10 kiểm tra tự động, tổng hợp đào tạo/phòng, nhận xét tự soạn có nguồn, quyền xem/vai trò, tách quyền hồ sơ Đảng | Xong. `app/lib/danh-gia-nam/`, 23 test; `npm test` 175/175; ESLint + kiểm kiểu giới hạn sạch | Test đạt |
| DG-02 | Migration 058 (3 bảng `office_year_*`) | NHÁP `docs/database/nhap/058_*.NHAP.sql` + hoàn tác. Đã thử áp/áp lại/hoàn tác/ràng buộc trên bản sao `ql_htkt_thu051` (17/11). CHƯA áp CSDL thật, chưa ghi sổ `applied_migrations.txt`, cần duyệt riêng (HIGH) | Áp thật sau duyệt |
| DG-03 | Giao diện + action: trang `ho-so/[id]/danh-gia-nam`, dashboard `van-phong-so/danh-gia/tong-hop`, quyền `party_review_view/manage`, `annual_evaluation_approve` | Mã xong, kiểm bằng `scripts/smoke-danh-gia-nam.ts` trên bản sao (57 kiểm tra đạt). CHƯA xem trên trình duyệt; chưa có mục menu `sidebar-new.tsx`; 3 quyền mới CHƯA có dòng trong bảng Permission (cần seed khi triển khai) | Xem thật trên bản sao |
| DG-04 | Xuất biểu mẫu (bộ Sở Nội vụ, CV 6862) | XONG 6/9 mẫu (17/11/2026): Word Mẫu 01, 2A, 2B, 2C, 03 + Excel Mẫu 04 (có công thức theo cột bản gốc) qua `GET /api/office/danh-gia-nam/xuat` (`lib/danh-gia-nam/xuat-mau.ts`, 2 test + nghiệm thu thật). Chép nguyên văn hướng dẫn bản gốc; chỗ không có dữ liệu để trống; ô tự nhận xếp loại KHÔNG đánh dấu thay cá nhân. CHƯA xuất: Mẫu 05, 06 (bản gốc `.doc`, bố cục cột chưa đọc được), 07. CHƯA so sát thể thức bằng mắt với Word gốc (chưa mở thử bằng Word); Mẫu 04 chỉ liệt kê nhiệm vụ từ công việc, chưa có sản phẩm/điểm danh mục/tiến độ để tự điền; không ghi chức vụ Đảng vào Mẫu 2A/2B | Mở bằng Word, đối chiếu thể thức bản gốc |
| DG-05 | Mẫu UNKNOWN: 07 (chưa đọc tiêu đề), 4B, 6C, 6F1–6F4, biên bản họp | Không dựng. Chờ CV 2772-CV/BTCTW / văn bản chứa mẫu. Hướng dẫn 43 và bộ Sở Nội vụ TRÙNG SỐ mẫu nhưng KHÁC nội dung: chỉ bộ Sở Nội vụ áp cho Sở | Có văn bản gốc |
| DG-06 | Nhận xét bằng AI ngoài | Chưa làm (bản hiện tại tự soạn từ dữ liệu, không gửi ra ngoài); gửi dữ liệu nhân sự sang AI ngoài cần người dùng duyệt riêng | Duyệt trước khi làm |
| DG-07 | Tồn đọng từ Codex vòng 1 (24 phát hiện; 2 BLOCKER, 5 HIGH, 17 MEDIUM/LOW đã vá) | Chưa vòng 2. Còn mở: đào tạo gắn theo họ tên (cần trường chọn cán bộ), nhận xét sửa tay mất khẳng định tự động nên không còn bị kiểm tra "ghi đã xong", chatbot còn trả tuổi Đảng (`api/chatbot/route.ts`), người chuyển vị trí chưa có ca thật | Rà vòng 2 |

## Việc nghiệp vụ còn treo (trích từ bộ nhớ, chưa kiểm lại)
- 2 người thiếu CCCD chưa tạo hồ sơ nâng lương 9/2026; 4 tài khoản kẹt số CCCD.
- 2 Lê Anh Tuấn chờ xác nhận; bảng lương tháng chưa được Codex rà.
- Audit bậc↔hệ số: 2 MISMATCH chờ xác nhận.
- Mig 049 (`htkt_doi_tuong`) chưa áp CSDL.
- Cảnh báo cấp phó phòng (`lib/cap-pho-phong.ts`, trang Cảnh báo Văn phòng Sở): đã commit, chưa push/triển khai, chưa xem trên giao diện; đối chiếu KL 213, HD 07-HD/BTCTU khi có bản gốc rồi sửa định mức nếu khác.
