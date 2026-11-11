# CHANGE_IMPACT — kế hoạch theo Phase (PROPOSED, chưa thực hiện)

Mỗi thay đổi: lý do · phạm vi · tệp · rủi ro · kiểm thử · khôi phục. Cấp M/L ⇒ bắt buộc `phan-bien-codex`.

| Phase | Phạm vi | Tệp/CSDL chạm | Rủi ro | Khôi phục | Cổng Go/No-Go |
|---|---|---|---|---|---|
| 0 | Khảo sát + 6 tài liệu | chỉ `docs/` | Không | xoá tệp | Bạn duyệt báo cáo + trả lời câu hỏi mở |
| 0b | Vá webhook secret mặc định cứng (nếu duyệt) | `app/api/webhook/infrastructure/route.ts` | Làm hỏng client đang gọi bằng secret mặc định (UNKNOWN có ai dùng) | git revert | Xác nhận `WEBHOOK_SECRET` đã đặt ở `.env` |
| 1 | Nền móng: cờ `AI_CONTENT_ENABLED`, module `ai_content` trong `permissions.ts`, migration 050 chỉ `CREATE TABLE ai_*` + rollback, **trên CSDL thử** | `lib/permissions.ts`, `prisma/migrations_manual/050_*`, `schema.prisma` (thêm model, không sửa cũ) | M/L: migration trên CSDL chung | `050_*_rollback.sql` + pg_dump trước | Diễn tập khôi phục dump thành công; Codex rà migration |
| 2 | Second Brain: bảng phụ phân loại/hiệu lực/ACL cho `tai_lieu`; không đổi `search.ts` hiện hữu | `lib/ai-content/knowledge/*` | Vector cross-ACL | cờ tắt | Test âm tính ACL (AT-13) |
| 3 | Content Studio: bài gốc, phiên bản, biến thể 3 kênh, adapter ảnh (stub) | UI mới + `/api/ai/v1` | Thấp (cô lập) | cờ tắt | AT-02..05 |
| 4 | State machine duyệt + lịch 08:30 Asia/Ho_Chi_Minh (lưu UTC) | `ai_approval_*`, `ai_publication_*` | Đăng nhầm | cờ tắt | AT-06, 07, 12 |
| 5 | n8n + OAuth + adapter đăng thử (chỉ tài khoản thử) | workflow JSON, adapter | Token lộ, đăng trùng | thu hồi token, tắt workflow | AT-08..11; cần tài khoản thử + n8n xác minh |
| 6 | Javis adapter hoặc Orchestrator độc lập | `lib/ai-content/orchestrator/*` | Agent vượt quyền | cờ tắt | Security review |
| 7–8 | Analytics, chi phí, hardening, canary | | | | AT-01..18 |

## Việc chặn Phase 1 (BLOCKED)
- Chưa diễn tập khôi phục dump (điều kiện dừng của prompt).
- Chưa có CSDL/schema thử (AI-10 trong TASKS.md vẫn "chưa bắt đầu").
- Chưa có quyết định về nơi lưu media, n8n, nhà cung cấp ảnh/AI, tài khoản MXH thử.

## Ghi chú về vertical slice
Phần có thể làm không cần hạ tầng ngoài: bài gốc → biến thể → duyệt → lịch → "đăng thử" bằng **adapter giả (dry-run)** ghi kết quả vào CSDL; chỉ báo DONE cho phần đã chạy test, không tuyên bố đã đăng thật.
