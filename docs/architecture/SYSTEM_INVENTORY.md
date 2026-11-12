# SYSTEM_INVENTORY — Phase 0 (chỉ đọc)

Ngày khảo sát: 2026-11-11 · Nhánh `main`, `git status` sạch trước khi viết tài liệu này.
Nhãn: **V** = đã kiểm chứng · **U** = chưa kiểm chứng · **X** = không tồn tại · **N** = cần quản trị viên cung cấp.

## 1. Nền tảng
| Hạng mục | Kết quả | Nhãn | Bằng chứng |
|---|---|---|---|
| Framework | Next 16.2.6 (webpack), React 19, TypeScript | V | `app/package.json` |
| ORM / CSDL | Prisma 7 + `pg`, PostgreSQL 16 + pgvector; 141 model | V | `app/prisma/schema.prisma` (4338 dòng); dịch vụ `postgresql-x64-16` Running |
| Xác thực | next-auth 5 beta + cookie JWT `session` (jose, HS256) | V | `app/middleware.ts:1-30` |
| Phân quyền | Role/Permission (bảng `roles`, `permissions`), mã đơn vị suy động từ `to_chuc`, middleware chặn `/api/office`, `/api/htkt` | V | `lib/permissions.ts`, `middleware.ts:55-80` |
| Audit | Bảng `AuditLog`, `createAuditLog()` nuốt lỗi (không chặn nghiệp vụ) | V | `lib/audit.ts` |
| Chạy | PM2 cluster 2 instance `ql-htkt` cổng 3001, IIS reverse proxy HTTPS | V | `pm2 list`; PROJECT_CONTEXT |
| CI/CD | Push `main` → GitHub Actions build → `QLHTKT_AutoDeploy` tự kéo | V | `.github/workflows/build-vps.yml` |
| Migration | SQL tay `prisma/migrations_manual/NNN_*.sql` + `_rollback.sql` (62 tệp, mới nhất 049); sổ đã áp `C:\Troly\deploy\applied_migrations.txt` | V | thư mục |
| Test | `npm test` = node:test, 85 test, không cần CSDL; chưa có test cấp route | V | `docs/ai/TASKS.md` AI-03/09 |

## 2. Năng lực AI hiện có (tái sử dụng được)
| Thành phần | Trạng thái | Bằng chứng |
|---|---|---|
| Cấu hình nhà cung cấp AI (OpenAI-tương thích, đổi qua `.env`) | V có | `lib/ai/cau-hinh.ts` |
| RAG: `tai_lieu` + `tai_lieu_chunk` (vector 1536, HNSW), `phamVi` CONG_KHAI/NOI_BO_SO, hiệu lực pháp lý, soft delete | V có | `schema.prisma:3012-3060`, `lib/rag/search.ts` |
| Ingest: extract → chunk → embed | V có | `lib/rag/{extract,chunk,ingest,embeddings}.ts` |
| Chatbot + log | V có | `app/api/chatbot`, model `ChatbotLog` |
| Đồng bộ thư mục VBPL ⇄ RAG (15 phút) | V có | tác vụ `Sync_VBPL_KhoTaiLieu` (theo PROJECT_CONTEXT; U: chưa liệt kê lại lần này) |
| Telegram, SMTP | V có | `lib/telegram.ts`, `lib/mailer.ts` |

## 3. Điều KHÔNG tồn tại trong mã
- **X** n8n: grep `n8n|javis|jarvis|facebook|linkedin|threads|composio|second brain` trên mã nguồn (trừ node_modules/.next) chỉ khớp một tệp sinh tự động `lib/generated/prisma/internal/class.ts` (không liên quan nghiệp vụ).
- **X** Javis OS: không có adapter, tham chiếu, cấu hình.
- **X** Tích hợp mạng xã hội (OAuth, token, adapter đăng bài).
- **X** Cơ chế feature flag (grep không thấy hạ tầng cờ tính năng).
- **X** Object storage chuẩn; chỉ có thư mục đĩa cục bộ (`BIM_STORAGE_DIR`, `lib/bim-storage.ts`).
- **X** Hàng đợi job / scheduler trong app (job nền chạy bằng Task Scheduler Windows + PM2).
- **X** Quét mã độc khi upload; sinh ảnh AI; lịch nội dung; state machine duyệt nội dung.

## 4. Chưa kiểm chứng / cần cung cấp
- **U/N** `https://n8n.sxdqt.com.vn`: chưa gọi (hành động ra Internet bị chặn trong phiên này; cần bạn xác nhận cho phép). Không biết n8n có chạy, ở máy nào, phiên bản, có API key không.
- **U** `https://qlhtkt.htkt.com.vn` là URL production (PROJECT_CONTEXT nêu IIS+HTTPS; tên miền chưa kiểm).
- **U/N** Tài khoản/Page Facebook, LinkedIn, Threads thử nghiệm và quyền API (app review, scope).
- **U/N** Nhà cung cấp sinh ảnh, hạn mức, chính sách dữ liệu; chính sách cho phép gửi dữ liệu sang AI ngoài.
- **U** Độ phủ thật của smoke script; quyền ghi các tác vụ lịch.
- **U** Khả năng khôi phục: có tác vụ `Backup_QLHTKT_Daily` (pg_dump 2:00, `C:\Backup_QLHTKT`) nhưng chưa diễn tập khôi phục lần này.

## 5. Phát hiện bảo mật cần xử lý (ngoài phạm vi module mới)
- **HIGH (V)** `app/api/webhook/infrastructure/route.ts:24` dùng mặc định cứng `htkt-webhook-2025` khi thiếu `WEBHOOK_SECRET`, và dòng 136 in giá trị mặc định ra trong phản hồi mô tả. Chưa biết `.env` thật có đặt `WEBHOOK_SECRET` không (không đọc `.env`). Đề xuất: bỏ mặc định, thiếu secret thì từ chối. Chưa sửa — chờ duyệt.
