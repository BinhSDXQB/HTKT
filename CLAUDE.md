# QL Hạ Tầng Kỹ Thuật (HTKT) — Sở Xây dựng Quảng Trị

Quy tắc cốt lõi cho mọi phiên AI. Chi tiết nằm ở `docs/ai/` và bộ nhớ (`MEMORY.md`); đừng chép lại ở đây.

## Bản đồ tài liệu
- Bối cảnh, kiến trúc, môi trường: `docs/ai/PROJECT_CONTEXT.md`
- Quyết định đã chốt: `docs/ai/DECISIONS.md`
- Việc đang làm / chờ: `docs/ai/TASKS.md`
- Bẫy đã gặp: `docs/ai/LESSONS_LEARNED.md`
- Lịch sử thay đổi: `CHANGELOG.md`
- Next.js của dự án khác bản quen thuộc: đọc `app/AGENTS.md` và `app/node_modules/next/dist/docs/` trước khi viết code Next.

## Nguyên tắc làm việc
1. Không đoán khi thiếu dữ liệu. Gắn nhãn VERIFIED / INFERRED / UNKNOWN / PROPOSED; không biến suy luận thành sự thật.
2. Không khẳng định "đã kiểm thử" khi chưa chạy. Báo rõ đã chạy hay dự kiến.
3. Ưu tiên tái sử dụng cái có sẵn; không thêm chức năng không được yêu cầu.
4. Mọi thay đổi quan trọng phải hoàn tác được (Git, sao lưu trước khi đụng CSDL).
5. Thay đổi lớn về pháp lý, phân quyền, CSDL, triển khai: phản biện chéo bằng Codex, rồi TỰ kiểm chứng lại (Codex từng sai).
6. Số liệu pháp lý trong `lib/htkt` có thể sai dù ghi căn cứ: đối chiếu văn bản gốc trước khi tin.
7. Soạn thảo pháp lý phải chi tiết theo quy mô cụ thể, căn cứ văn bản hiệu lực 01/07/2026.

## Ràng buộc môi trường (VPS Windows, RAM 6GB)
- KHÔNG chạy `tsc --noEmit` / `npm run build` toàn dự án trên VPS. Build do GitHub Actions làm; VPS tự kéo bản build (tác vụ `QLHTKT_AutoDeploy`).
- Chạy web: PM2 cluster 2 instance, cổng 3001. Sau sự cố 500 chập chờn: kiểm tra worker zombie giữ cổng.
- Ghi tệp TS có dấu escape: dùng công cụ Write, không dùng heredoc Bash.
- Đọc tài liệu: `python tools/doc_reader.py` để tiết kiệm token.

## Phân quyền & bảo mật
- Tuyệt đối không in, commit hay gửi: `.env`, mật khẩu, token, CCCD, lương.
- CCCD và lương chỉ hiển thị cho nhóm được phép (xem memory `quyen-quan-ly-can-bo`).
- Cần người dùng duyệt TRƯỚC khi: push `main` (kích hoạt deploy), migration/sửa CSDL sản xuất, xoá dữ liệu, gửi Telegram/email, đổi quyền truy cập, đổi quy tắc nền.
- Đăng nhập bằng CCCD; khoá mềm tài khoản, không xoá cứng mặc định.

## Quy ước
- Ngôn ngữ giao tiếp và giao diện: tiếng Việt.
- Trạng thái và tên đơn vị suy ra động từ khoá ngoại, không lưu cờ tay.
- Menu thật là `sidebar-new.tsx`, không phải `sidebar.tsx`.
- Commit chỉ khi người dùng yêu cầu; thông điệp commit nêu lý do.
- PowerShell chạy trực tiếp, không cần hỏi xác nhận cho lệnh chỉ-đọc.

## Cuối mỗi nhiệm vụ
Ghi bài học mới vào `LESSONS_LEARNED.md`, quyết định mới vào `DECISIONS.md`, cập nhật `TASKS.md`; fact bền vững ghi vào memory kèm nguồn và ngày.
