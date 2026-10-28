---
name: trien-khai-hoan-tac
description: Dùng khi chuẩn bị, theo dõi hoặc hoàn tác một lần triển khai production của dự án HTKT (push main, migration, deploy lỗi, rollback). Luôn cần người dùng duyệt; không tự thực hiện hành động production.
---

# Triển khai và hoàn tác

Nguồn sự thật quy trình: `docs/ai/RUNBOOK_DEPLOY.md` (đọc trước). Skill này chỉ là danh sách việc và cổng chặn; **không tự push `main`, không tự chạy migration, không tắt tác vụ, không động tới `deploy.env`/`.env`**. Hook `guard.mjs` cũng chặn push `main`: người dùng tự chạy lệnh trong terminal của họ.

## Trước khi triển khai (chuẩn bị — được phép làm)
1. `git status --short` sạch; `git rev-list --left-right --count main...origin/main` để biết sẽ đẩy bao nhiêu commit; `git log --oneline origin/main..main` liệt kê chính xác.
2. `npm test` (trong `app/`) PASS. Ghi kết quả thật, không PASS nếu chưa chạy.
3. Có migration mới (`app/prisma/migrations_manual/NNN_*.sql`)? Phải tương thích ngược, có `NNN_*_rollback.sql`; báo người dùng đây là bước HIGH. AutoDeploy tự `pg_dump` trước khi áp, nhưng chỉ áp khi `AUTO_MIGRATE` bật.
4. Thay đổi pháp lý/phân quyền/CSDL/lương đã qua `phan-bien-codex`.
5. Soạn bản tóm tắt cho người dùng: commit nào, rủi ro, cách hoàn tác (RUNBOOK mục 5), việc kiểm tra sau triển khai.
6. **Dừng và xin duyệt cụ thể** cho hành động push `main`. Duyệt cho việc khác không áp dụng cho việc này.

## Sau khi người dùng đã push (theo dõi — chỉ đọc)
- Workflow "Build cho VPS" trên GitHub (bước `npm test` và build).
- Nhật ký `C:\Troly\deploy\logs\deploy-YYYYMMDD.log`: tìm `HOAN TAT trien khai <sha7>` hoặc `DUNG:`; `deployed_sha.txt` khớp commit.
- `http://localhost:3001/api/health` = `ok`; `pm2 list` thấy 2 tiến trình `ql-htkt` online.
- Smoke liên quan (`app/scripts/smoke-*.mjs`) khi đụng chatbot/trang chủ.

## Khi hỏng
- Tự động quay về bản cũ đã có sẵn trong script; đọc nhật ký để biết đã xác nhận hay "ROLLBACK KHONG XAC NHAN" (khẩn: báo người dùng ngay).
- Hoàn tác thủ công: ưu tiên `git revert` + push (người dùng duyệt). Hoàn tác CSDL chỉ khi bắt buộc, bằng `*_rollback.sql` hoặc `pg_restore` từ `C:\Backup_QLHTKT` — mất dữ liệu phát sinh sau thời điểm sao lưu, phải có người dùng duyệt rõ.
- Web 500 chập chờn: nghi worker zombie giữ cổng 3001 (`LESSONS_LEARNED.md` #2).

## Đầu ra
Phạm vi; các bước đã làm với bằng chứng; **NOT_RUN** cho mọi thứ chưa chạy; rủi ro; việc cần duyệt; bước tiếp theo.

## Dừng ngay (no-go)
Test đỏ · migration phá huỷ chưa rà · chưa có đường hoàn tác · chưa có sao lưu khi có migration · người dùng chưa duyệt.
