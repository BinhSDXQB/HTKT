# INTEGRATION_OPTIONS — 3 phương án (PROPOSED)

| Tiêu chí | A. Module trong monolith + n8n ngoài (khuyến nghị) | B. Dịch vụ AI tách riêng (service Node + hàng đợi) | C. Chỉ n8n + CSDL riêng, app chỉ nhúng iframe/link |
|---|---|---|---|
| Mô tả | Bảng `ai_*` additive, route `/api/ai/v1`, UI trong app cũ; n8n gọi webhook ký HMAC | App mới độc lập (CSDL/schema riêng, SSO), app cũ chỉ liên kết | Toàn bộ logic nằm trong workflow n8n |
| Chi phí dựng | Trung bình | Cao (thêm runtime, deploy riêng) | Thấp ban đầu |
| RAM 6GB (VPS hiện tại) | Thêm ~0 tiến trình mới | Thêm 150–300 MB + worker | n8n nặng nếu cùng máy |
| Bảo mật | Dùng chung RBAC/session sẵn có; token MXH mã hoá trong CSDL | Cách ly tốt nhất, nhưng phải dựng SSO/RBAC lại | Yếu: logic duyệt/state nằm trong workflow, khó audit, token nằm trong n8n |
| Rủi ro làm hỏng hệ thống cũ | Thấp nếu additive + cờ + prefix riêng; cùng CSDL nên cần kỷ luật migration | Rất thấp | Thấp, nhưng khó bảo đảm "không đăng khi chưa duyệt" |
| Bảo trì | 1 codebase, 1 pipeline CI hiện có | 2 codebase | Workflow khó test/versioning |
| State machine duyệt/idempotency | Ở CSDL, giao dịch, kiểm thử được | Như A | Khó, dễ đăng trùng |

## Khuyến nghị: Phương án A, có điều kiện
Lý do: tái sử dụng RBAC, RAG, audit, CI (có `npm test` chặn deploy); state machine và phê duyệt nằm ở nơi kiểm thử được; n8n chỉ làm lịch/điều phối và **không giữ bí mật mạng xã hội** (publisher gọi lại API app để lấy lệnh đã duyệt và ghi kết quả).

Điều kiện: (1) cờ `AI_CONTENT_ENABLED` mặc định tắt; (2) migration chỉ thêm bảng `ai_*`, có rollback; (3) n8n chạy **ngoài** VPS production (hoặc ngoài giờ cao điểm — UNKNOWN: n8n.sxdqt.com.vn chạy ở đâu); (4) media lưu object storage/ổ khác, không đĩa C: 9 GB.

Chuyển sang B nếu: n8n/worker buộc chạy cùng máy, hoặc yêu cầu cô lập pháp lý cao hơn.

## Câu hỏi cần quyết (xem BASELINE_REPORT)
1. n8n hiện ở đâu, ai quản trị, có API? 2. Nhà cung cấp sinh ảnh và chính sách dữ liệu? 3. Nơi lưu media? 4. Tài khoản MXH thử nghiệm? 5. Ai là người phê duyệt có thẩm quyền (vai trò nào)?

## Phụ lục — Lựa chọn thay n8n để điều phối (INFERRED từ kiến thức chung, CHƯA đối chiếu tài liệu/giấy phép hiện hành)

Ràng buộc đã VERIFIED: Windows Server 2022, 2 lõi, RAM trống ~1,8 GB, đã có PostgreSQL 16, PM2, Task Scheduler; không có Redis/Docker trong inventory.

| Phương án | RAM thêm | Hạ tầng mới | Phù hợp ràng buộc | Nhược điểm |
|---|---|---|---|---|
| **W1. Hàng đợi trong Postgres (pg-boss) + worker PM2** (khuyến nghị) | ~80–150 MB (1 tiến trình) | Không (dùng PG sẵn có) | Cao | Tự viết workflow bằng mã; không có UI kéo thả |
| W2. BullMQ | ~100 MB + Redis | Redis (không chính thức trên Windows) | Thấp | Thêm Redis phải vận hành |
| W3. Task Scheduler + script `.mjs` (mẫu đã có: sync VBPL, Telegram) | ~0 | Không | Cao cho lịch đơn giản | Không có retry/idempotency/lock sẵn; tự dựng |
| W4. Temporal / Windmill / Trigger.dev tự host | 1–4 GB+ | Docker, nhiều dịch vụ | Thấp (RAM 6GB) | Quá nặng cho máy production chung |
| W5. Node-RED | ~150–250 MB | Node-RED | Trung bình | Logic nằm trong luồng, khó test/audit như n8n |
| W6. n8n (giữ lại, chạy ngoài VPS) | 0 trên VPS | Máy khác | Phụ thuộc UNKNOWN | Token/logic ngoài app, khó kiểm thử |

### Khuyến nghị: W1
- Job `ai_publication_jobs` đã nằm trong CSDL (khoá hàng `FOR UPDATE SKIP LOCKED`, idempotency key unique, retry backoff+jitter, dead-letter) — pg-boss cung cấp sẵn các cơ chế này; nếu không muốn thêm thư viện thì tự viết bằng đúng các câu SQL đó.
- Worker chạy thành tiến trình PM2 riêng (`ai-worker`), tắt được bằng cờ; không chạm 2 instance `ql-htkt`.
- Lịch 08:30 Asia/Ho_Chi_Minh: bản ghi `scheduled_at_utc`, worker quét mỗi phút, không cần cron ngoài.
- Token mạng xã hội chỉ nằm trong app (mã hoá), không rời CSDL.
- Giữ n8n làm tuỳ chọn sau này cho tích hợp thông báo; adapter vẫn thay được.

### Chưa kiểm chứng
Phiên bản, giấy phép, trạng thái bảo trì, yêu cầu RAM thực tế của pg-boss/Node-RED/Windmill; việc pg-boss chạy ổn trên Prisma 7 + pg hiện tại. Cần thử trên CSDL thử trước khi chốt (thêm package = HIGH, phải được duyệt).

### Kiểm chứng pg-boss (11/11/2026, nguồn: README GitHub + metadata npm qua tìm kiếm web)
- VERIFIED (nguồn công khai): giấy phép MIT; cần Node >= 22.12 và PostgreSQL >= 13 (máy này Node 24.16, PG 16 — đạt); có cron/RRULE, retry backoff luỹ thừa, dead-letter + redrive; dựa trên `SKIP LOCKED`.
- UNKNOWN: số phiên bản mới nhất chính xác (nguồn lẫn lộn 10.x/12.x — phải xem npm registry khi cài); hỗ trợ múi giờ cho lịch cron (README không nêu → lưu `scheduled_at_utc` trong bảng riêng, không phụ thuộc); khoá idempotency (xem pgboss.io); chạy ổn với Prisma 7 + `pg` hiện tại và RAM thực tế (NOT_RUN).
- Rủi ro: một người bảo trì → giữ lớp bao `JobQueue` để thay được, hoặc tự viết bằng SQL `SKIP LOCKED` (đơn giản, không phụ thuộc).
- Lưu ý: pg-boss tự tạo schema `pgboss` trong CSDL → tính là migration, cần CSDL thử và kế hoạch gỡ schema đó trước khi chạy thật.
