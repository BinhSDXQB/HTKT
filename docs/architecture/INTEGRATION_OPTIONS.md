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
