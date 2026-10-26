# B0 — Bản vá khẩn: nội dung và danh sách việc trước khi triển khai

> Nhánh: `b0-va-khan-htkt-brain` (chưa commit, **chưa đưa lên production**). Phê duyệt làm: Q1 (14 §9).
> Phản biện Codex 4 vòng (nguyên văn: `B0-codex-phan-bien.md`) — kết luận vòng 4: **ĐẠT CÓ ĐIỀU KIỆN** để trình duyệt bản vá.
> Đây **không** phải nghiệm thu toàn bộ B0: đo RAM (Q12) và diễn tập khôi phục (VPS, Q2/Q7) còn chờ.

## 1. Thay đổi

| Mục B0 | Phát hiện | Tệp (tính từ `app/`) | Kiểm thử |
|---|---|---|---|
| 1 | S1 webhook: bỏ token mặc định; thiếu/ngắn (< 24 ký tự) secret → 503; so sánh hằng thời gian; GET không lộ token | `lib/webhook-auth.ts`, `app/api/webhook/infrastructure/route.ts` | `lib/webhook-auth.test.ts` |
| 2 | S11/Q4: chặn 2 lớp (danh sách tool gửi model + `executeTool`, áp cả đường không-AI). Người thiếu quyền nhạy cảm: `ho_so_can_bo` chỉ trả tên/chức danh/đơn vị/SĐT/email, không lọc theo năm sinh; chặn `xem_luong_can_bo`, `len_luong_thang_nay`, `thong_ke_nang_luong`, `luong_cua_toi`, tiêu chí xếp hạng nhạy cảm (sinh nhật và dự thảo QĐ: theo quyết định §3) | `lib/chatbot/quyen-tool.ts`, `lib/chatbot/ho-so-cong-vu.ts`, `app/api/chatbot/route.ts` | ma trận 21 tool × 3 vai trò; nội dung đầu ra hồ sơ |
| 2b | Dữ liệu nhạy cảm **kế thừa qua lịch sử**: lượt có ngữ cảnh nhạy cảm mang dấu `__ke_thua_nhay_cam__`; thiếu quyền → bỏ cả lượt trực tiếp lẫn kế thừa; chỉ nạp lịch sử/LIKE từ lượt ghi sau bản vá (`soLanGoi != null`) | như trên | test `chonLichSu` |
| 2c | `luong_cua_toi`: nhận diện bằng `userId` rồi CCCD, **xung đột → từ chối** (trước đây có thể trả lương người khác) | `lib/chatbot/nhan-dien-ban-than.ts` | `nhan-dien-ban-than.test.ts` |
| 3 | S2/S15/S17: **tắt 3 tool ghi** (`luu_lanh_dao_xa`, `cap_nhat_luong_can_bo`, `them_can_bo`); prompt hướng dẫn dùng giao diện nghiệp vụ | như trên | ma trận |
| 4 | S16 cookie `secure` mặc định ở production; S19 `VIEW_SENSITIVE` ở mọi nhánh kết thúc (kể cả kế thừa); ghi token thật mọi nhánh | `lib/cookie-an-toan.ts`, `lib/session.ts`, `route.ts`, `prisma/schema.prisma`, `prisma/migrations_manual/049_*` | `lib/cookie-an-toan.test.ts` |
| 5 | S7: `npm test` (node:test, không thêm thư viện) | `package.json` | **23/23 đạt**; `tsc --noEmit` sạch; eslint 0 lỗi |
| 6 | Đo RAM | — | **chờ** Phụ lục A (Q12) |
| 7 | Diễn tập khôi phục | — | **chờ** VPS staging (Q2, Q7) |

## 2. Điều kiện / danh sách việc TRƯỚC khi triển khai (theo thứ tự)

1. **Webhook:** kiểm hệ SCADA/nhà máy có gửi tới `/api/webhook/infrastructure` không. Có → tạo `WEBHOOK_SECRET` ngẫu nhiên ≥ 24 ký tự, cấp cho bên tích hợp **trước**; không → để trống (endpoint trả 503).
2. **Cookie:** xác nhận chỉ truy cập qua **HTTPS**. Còn `http://IP:3001` nội bộ → đặt tạm `COOKIE_SECURE=false`, nếu không sẽ **không đăng nhập được** qua HTTP.
3. **CSDL:** sao lưu → chạy `049_chatbot_log_token.sql` **trước** mã mới. **Không** backfill/đặt default cho `soLanGoi` (cột này là mốc phân biệt log trước/sau bản vá).
4. **Phát hành trọn gói một lần** trên mọi instance PM2; không dùng bản trung gian ghi `soLanGoi` mà thiếu dấu kế thừa, kể cả khi rollback.
5. **Build:** Prisma **7.8.0** (client trong repo sinh bằng 7.8.0); lockfile đã được commit trên `main` (commit `834e557`, S21 đã xử lý; lockfile ghi Prisma 7.8.0, khớp VPS đã kiểm 26/10/2026) — nhánh này chưa có, gộp `main` vào để dùng; cài bằng `npm ci`.
6. **Kiểm thử khói:** đăng nhập; TK chuyên viên hỏi hồ sơ đồng nghiệp → chỉ SĐT/email; TK có quyền nhạy cảm → đủ; TK xã; "cập nhật lương …" → báo tạm tắt; hỏi dữ liệu nhạy cảm → "nhắc lại" → thu hồi quyền → hỏi tiếp: không còn dữ liệu cũ; kiểm `audit_logs` có `VIEW_SENSITIVE`.
7. **Hoàn nguyên:** mã về bản trước → (nếu cần) `049_chatbot_log_token_rollback.sql`.

## 3. Thay đổi hành vi người dùng sẽ thấy

- Người **không** có quyền xem dữ liệu nhân sự nhạy cảm: không còn xem ngày sinh, lương, ngày nâng lương, nghỉ hưu của đồng nghiệp qua chatbot, **kể cả lương của chính mình** (xem trên giao diện).
- **Quyết định chủ hệ thống 21/10/2026:** (a) `luong_cua_toi` — chặn khi thiếu quyền nhạy cảm; (b) dự thảo QĐ nâng lương qua chatbot — **chỉ cần quyền nghiệp vụ lương**; (c) danh sách sinh nhật (ngày/tháng, không năm) — **mọi cán bộ Sở** xem được (TK xã vẫn bị chặn).
- Không ai cập nhật được dữ liệu qua chatbot (dùng giao diện nghiệp vụ).
- Chatbot **quên ngữ cảnh** các lượt trước bản vá và lượt thuần không-AI; câu trả lời được LIKE trước bản vá không còn dùng làm gợi ý.

## 4. Xử lý phản biện Codex (tóm tắt)

| Vòng | Kết luận Codex | Claude xử lý |
|---|---|---|
| 1 | CHƯA ĐẠT — 5 lỗi (sinh nhật, `luong_cua_toi`, dự thảo, token mất ở nhánh lỗi, audit thiếu sinh nhật) | Chấp thuận 3; **không chấp thuận** `luong_cua_toi` (tự xem) và dự thảo (quyền nghiệp vụ) — trình chủ hệ thống |
| 2 | CHƯA ĐẠT — phát hiện **kế thừa nhạy cảm qua lịch sử → lan qua LIKE**; nhận diện `luong_cua_toi` có thể nhầm người; giữ ý kiến về dự thảo | Chấp thuận toàn bộ: dấu kế thừa; nhận diện chặt; dự thảo tạm đòi thêm quyền nhạy cảm trong chatbot |
| 3 | CHƯA ĐẠT — log cũ không dấu vẫn chuyền dữ liệu | Chấp thuận: chỉ nạp lịch sử/LIKE từ lượt sau bản vá; audit cả lượt kế thừa |
| 4 | **ĐẠT CÓ ĐIỀU KIỆN** | điều kiện ở §2 |

## 5. Phát hiện mới khi làm B0 (chưa xử lý)

| Mã | Phát hiện | Đề xuất |
|---|---|---|
| S21 | Repo không lưu lockfile (`package-lock.json` trong `.gitignore`) → mỗi lần cài có thể khác phiên bản production (đã gặp: Prisma 7.8.0 → 7.10.1) | ĐÃ XỬ LÝ trên `main` (`834e557`: commit lockfile, Prisma 7.8.0; VPS đã kiểm Prisma/client = 7.8.0, Node 24.16.0). Nhánh này lấy bằng cách gộp `main`; build bằng `npm ci` |
| S22 | RAG cho TK có quyền Văn phòng tra phạm vi `NOI_BO_SO` không theo quyền nhạy cảm — nếu kho chứa QĐ lương/hồ sơ có ngày sinh, CCCD thì người thiếu quyền vẫn đọc được | Kiểm nội dung kho `NOI_BO_SO`; phân quyền theo tài liệu ở B1/B2 |

## 6. Sau phản biện

Ba điểm Codex và Claude bất đồng (lương của chính mình, quyền dự thảo QĐ, sinh nhật) đã được **chủ hệ thống quyết** (§3) — áp vào mã sau vòng 4; ma trận quyền cập nhật tương ứng, 23/23 test đạt. Chủ hệ thống chấp thuận hệ quả mất ngữ cảnh cũ/LIKE cũ và hoãn S22 sang B1/B2.
