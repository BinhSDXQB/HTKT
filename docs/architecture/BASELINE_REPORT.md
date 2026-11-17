# BASELINE_REPORT — 2026-11-11

| Chỉ số | Giá trị | Nhãn |
|---|---|---|
| Git | nhánh `main`, sạch; HEAD `ea31064` | V |
| Nhánh mặc định remote | `ra-soat-csdl-chatbot-phap-ly` (không phải `main`, lý do UNKNOWN) | V/U |
| Push `main` | = triển khai production | V |
| PM2 | `ql-htkt` ×2 online, `ha-watchdog`, `sxd-quangtri` online; 0 restart | V |
| Health | `localhost:3001/api/health` trả lời (nội dung ngắn, chưa đọc đủ) | V |
| Dịch vụ | postgresql-x64-16 Running; `postgresql-16` Stopped (bản trùng đã tắt có chủ đích); W3SVC Running | V |
| Tác vụ lịch | AutoDeploy, Healthcheck, PM2_Resurrect, SinhNhat, TelegramBot, TrimRAM, Watchdog = Ready/Running | V |
| RAM | tổng 6143 MB, trống 1848 MB lúc đo | V |
| CPU | 2 lõi logic | V |
| Đĩa C: | trống ~9 GB | V |
| Node | v24.16.0 (khớp CI) | V |
| Test | 85 test cục bộ theo `TASKS.md` (28/10/2026); **chưa chạy lại** trong phiên này | NOT_RUN |
| Build/tsc | **cố ý không chạy** (quy tắc RAM 6GB) | NOT_RUN |

## Hệ quả cho thiết kế
1. RAM trống <2 GB và 2 lõi: **không đặt n8n + worker nặng + sinh ảnh cục bộ chung máy production**. Mọi thứ nặng phải chạy ngoài (n8n riêng, nhà cung cấp ảnh qua API).
2. Đĩa trống 9 GB: thư viện ảnh/media không được lưu đĩa C: lâu dài → cần object storage hoặc ổ khác (cần quyết định).
3. Dev và prod chung máy: mọi thử nghiệm migration phải trên CSDL/schema thử, không trên CSDL thật.
4. Không có cờ tính năng và không có test route → phải dựng cờ `AI_CONTENT_ENABLED` (env + kiểm ở middleware/route) trước khi có UI.
5. Điều kiện dừng của prompt: đã có quyền đọc repo; **khả năng khôi phục dữ liệu chưa diễn tập** → chưa được phép migration/deploy.
