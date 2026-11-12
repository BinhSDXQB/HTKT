# Triển khai, hoàn tác và vận hành — module Nội dung AI (mốc M1)

**Trạng thái 12/11/2026:** mã nằm trên nhánh `ai-content-m1`, CHƯA merge `main`, CHƯA áp migration vào CSDL thật, cờ tắt, worker chưa đăng ký. Mọi bước dưới đây là việc mức HIGH/CRITICAL — cần người quản trị duyệt **từng bước**.

## Điều kiện trước khi triển khai
- [ ] Codex rà diff xong, không còn BLOCKER/HIGH mở (`docs/ai-content/NGHIEM_THU.md`).
- [ ] Đã xem giao diện trên máy chủ dev thử (`node scripts/ai-content/dev-thu.mjs`, cổng 3098, CSDL thử).
- [ ] Có bản sao lưu CSDL trong ngày (`Backup_QLHTKT_Daily` hoặc chạy tay) **và đã thử khôi phục** — hiện mới diễn tập khôi phục CẤU TRÚC (142/142 bảng), chưa diễn tập dữ liệu.
- [ ] Pháp chế xác nhận cách đọc nghĩa vụ thông báo AI (`UPGRADE_V4_PROPOSAL.md` §3).

## Thứ tự triển khai (mỗi bước dừng được)
1. **Merge mã, cờ vẫn tắt.** Push `main` = deploy. Khi cờ tắt: menu ẩn, `/api/ai/v1/*` trả 404, trang `/dashboard/ai-workspace/*` trả 404, không câu SQL nào chạm bảng `ai_*`. Hệ thống cũ chạy như trước dù chưa có bảng.
2. **Áp migration 050** (chỉ thêm 7 bảng `ai_*`; `lock_timeout` 5 giây nên nếu vướng khoá sẽ thất bại sạch, chạy lại sau):
   `psql -U postgres -d ql_htkt -v ON_ERROR_STOP=1 -f prisma/migrations_manual/050_ai_content.sql`, rồi ghi vào `C:\Troly\deploy\applied_migrations.txt`.
3. **Bật cờ:** thêm `AI_CONTENT_ENABLED=1` vào `app/.env`, `pm2 reload ql-htkt`. Kiểm: đăng nhập tài khoản Văn phòng Sở thấy menu AI Workspace.
4. **(Tuỳ chọn) Worker** — chỉ cần khi dùng cách đăng "Chạy thử"; kênh "Đăng tay" không cần worker. Đăng ký PM2 một tiến trình:
   `pm2 start scripts/ai-content/worker.mjs --name ai-worker --node-args="--import ../tools/test-support/register.mjs" --max-memory-restart 200M`.

## Hoàn tác (theo mức, ưu tiên mức nhẹ nhất)
| Mức | Cách | Hệ quả |
|---|---|---|
| 1 | Bỏ `AI_CONTENT_ENABLED` khỏi `.env`, `pm2 reload ql-htkt`. Worker đọc lại tệp `.env` trước mỗi việc nên tự ngừng nhận việc, không cần khởi động lại | Module biến mất với người dùng; dữ liệu giữ nguyên |
| 2 | `pm2 delete ai-worker` | Dừng hẳn worker |
| 3 | `git revert` các commit của nhánh rồi deploy | Gỡ mã; bảng `ai_*` còn nhưng không ai dùng |
| 4 | `050_ai_content_rollback.sql` | **Xoá toàn bộ dữ liệu module** kể cả nhật ký và lịch "cần đối soát". Trước đó: xuất `pg_dump -t 'ai_*'`, và đối soát xong mọi lịch `UNKNOWN_OUTCOME`. Bài đã đăng ngoài mạng xã hội KHÔNG tự gỡ |

Không bảng nào của hệ thống cũ bị sửa nên hoàn tác không ảnh hưởng dữ liệu nghiệp vụ (đã kiểm trên CSDL thử: số bảng trở về đúng như trước).

## Vận hành
- **Nhật ký:** bảng `ai_audit_events` (chỉ ghi thêm); xem ở trang tổng quan.
- **Lịch "Cần đối soát" / "Lỗi":** hiện ở ô cảnh báo trang tổng quan; cán bộ mở bài xử lý.
- **Worker:** log `[ai-worker]` mỗi vòng 60 giây; pool 2 kết nối; ≤ 20 việc/vòng. Lịch tự động quá 24 giờ chưa chạy → `EXPIRED` (không đăng bù). Worker chết giữa chừng → sau 15 phút lịch chuyển "Cần đối soát".
- **Tắt khẩn cấp:** mức 1 ở bảng trên.
- **Dọn dữ liệu:** chưa có chính sách lưu giữ — cần quyết định (đề xuất giữ nhật ký ≥ 5 năm theo quy định lưu trữ hồ sơ; UNKNOWN căn cứ cụ thể).

## Môi trường thử
- `node scripts/ai-content/tao-csdl-thu.mjs [--lam-lai]` — tạo `ql_htkt_ai_test` (bản sao cấu trúc, 0 dòng dữ liệu thật).
- `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-tich-hop.mjs` — 40 ca (trình điều khiển pg); script từ chối chạy nếu CSDL không có đuôi `_ai_test`.
- `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-prisma.mjs` — 7 ca qua Prisma + adapter pg, đúng đường mà route production dùng.
- `node scripts/ai-content/dev-thu.mjs` — máy chủ dev riêng: cổng 3098, build `.next-ai-dev`, CSDL thử, `SESSION_SECRET` ngẫu nhiên (phiên thử không dùng được trên production).
- Xoá môi trường thử khi không cần: `dropdb ql_htkt_ai_test`, xoá thư mục `app/.next-ai-dev`.
