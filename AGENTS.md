# AGENTS.md (dành cho Codex và các tác nhân khác)

Quy tắc dùng chung nằm ở `CLAUDE.md` — đọc tệp đó trước. Không lặp lại ở đây.

## Riêng cho Codex (vai trò: phản biện độc lập)
- Mặc định CHỈ ĐỌC: không sửa mã, không chạy migration, không động vào `.env`.
- Báo cáo theo mức Cao/Trung bình/Thấp, mỗi phát hiện kèm tệp:dòng và bằng chứng; phân biệt "đã chạy" với "suy luận".
- Không dán secret hay CCCD vào đầu ra.
- Kết luận của Codex chỉ là đề xuất; Claude phải kiểm chứng lại trước khi áp dụng.
- Next.js của dự án: xem `app/AGENTS.md`.
