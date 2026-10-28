# TASKS

Cập nhật: 2026-10-28. Mỗi việc: ID · mục tiêu · trạng thái · tiêu chí nghiệm thu. Nguyên tắc: hai tác nhân không ghi cùng một tệp.

## Lộ trình nâng cấp lớp AI
| ID | Mục tiêu | Trạng thái | Nghiệm thu |
|---|---|---|---|
| AI-01 | Quy tắc gốc + docs/ai (CLAUDE, AGENTS, CONTEXT, DECISIONS, TASKS, LESSONS, CHANGELOG) | Đã tạo, chờ người dùng xem | Không quy tắc trùng; CLAUDE.md ≤100 dòng |
| AI-02 | Hooks bảo vệ + thu hẹp permissions cấp dự án | Hook xong (28/10/2026): `.claude/hooks/guard.mjs`, 15 ca + warn-mode + JSON hỏng đều đạt. Còn: thu hẹp `Read(//c//**)` ở settings cấp USER (cần người dùng làm), chưa có test tự động trong repo | Ca nguy hiểm bị chặn, có bằng chứng chạy |
| AI-03 | Test runner + test hồi quy cho `lib/` | Chưa bắt đầu | `npm test` chạy, kết quả đính kèm |
| AI-04 | Skills: phản-biện-codex, rà-soát-vbpl, nhập-excel | Chưa bắt đầu | Mỗi skill có ca kiểm thử |
| AI-05 | Chuẩn hoá frontmatter memory (source/updated/confidence) | Chưa bắt đầu | Có sao lưu trước, 89 tệp hợp lệ |
| AI-06 | `npm test` trong Actions + runbook deploy/rollback | Chưa bắt đầu | Deploy vẫn thành công |
| AI-07 | Dọn gốc repo, thống nhất nhánh mặc định | Chờ người dùng quyết | Có duyệt từng mục xoá |

## Việc nghiệp vụ còn treo (trích từ bộ nhớ, chưa kiểm lại)
- 2 người thiếu CCCD chưa tạo hồ sơ nâng lương 9/2026; 4 tài khoản kẹt số CCCD.
- 2 Lê Anh Tuấn chờ xác nhận; bảng lương tháng chưa được Codex rà.
- Audit bậc↔hệ số: 2 MISMATCH chờ xác nhận.
- Mig 049 (`htkt_doi_tuong`) chưa áp CSDL.
