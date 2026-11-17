# DEPENDENCY_MAP — module mới và phần hiện hữu

Nhãn: V = đọc trong mã; P = đề xuất (PROPOSED).

```
Trình duyệt ──(cookie session JWT)──> IIS ──> Next.js (PM2 x2, :3001)
                                              ├─ middleware.ts (V: chỉ chặn /api/office, /api/htkt, /dashboard/van-phong-so|phong-htkt)
                                              ├─ lib/permissions.ts, lib/auth.ts (V)
                                              ├─ lib/rag/*  ── pgvector (tai_lieu, tai_lieu_chunk)  (V)
                                              ├─ lib/ai/cau-hinh.ts ── nhà cung cấp AI OpenAI-tương thích (V)
                                              ├─ lib/audit.ts ── AuditLog (V)
                                              ├─ lib/telegram.ts, lib/mailer.ts (V)
                                              └─ app/api/webhook/infrastructure (V, bearer secret mặc định cứng — xem SYSTEM_INVENTORY §5)
PostgreSQL 16 (cùng máy) <── Prisma/pg;  migration tay NNN_*.sql
Task Scheduler/PM2: backup, sync VBPL, watchdog, telegram bot (V)

[P] Module mới:
  app/(dashboard)/ai-workspace/*      UI (cờ AI_CONTENT_ENABLED)
  app/api/ai/*                        API versioned /api/ai/v1
  lib/ai-content/*                    domain: state machine, adapter, policy
  bảng ai_* (additive)                tham chiếu users.id, tai_lieu.id; KHÔNG sửa bảng cũ
  n8n (ngoài) ──HMAC webhook──> /api/ai/v1/hooks/*   (n8n chỉ điều phối, không giữ token mạng xã hội)
```

## Điểm tái sử dụng (V)
- Kho tri thức = `tai_lieu`/`tai_lieu_chunk` (đã có phạm vi công khai/nội bộ, hiệu lực, soft delete) → mở rộng bằng bảng phụ, không tạo kho thứ hai.
- `ai/cau-hinh.ts` làm cổng gọi LLM; nhúng véc-tơ cố định `text-embedding-3-small` (đổi = phải nhúng lại toàn kho).
- `AuditLog` cho nhật ký (cần bổ sung `content_hash`, `correlation_id` ở bảng audit riêng của module).
- Quyền: dùng `Role/Permission`; thêm module `ai_content` vào `MODULES` và các action (`draft`, `approve`, `publish`, `manage_accounts`).

## Rủi ro phụ thuộc (V)
- Middleware không bảo vệ prefix mới → mỗi route `/api/ai/*` phải tự gọi hàm kiểm quyền (hoặc thêm nhánh middleware có cờ).
- `createAuditLog` nuốt lỗi → không đủ cho audit bắt buộc của việc xuất bản; module mới cần audit "fail-closed".
- Cùng CSDL, cùng pool Prisma với nghiệp vụ → truy vấn nặng của module AI có thể ảnh hưởng nghiệp vụ; dùng truy vấn có giới hạn + chỉ số.
