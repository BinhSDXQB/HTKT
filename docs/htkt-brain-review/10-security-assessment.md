# 10 — Đánh giá bảo mật và an toàn vận hành

> Phạm vi: mã nguồn (đọc tĩnh). **Chưa** kiểm thử xâm nhập, **chưa** kiểm cấu hình production. Mã S-xx: 01 §3.
> Không có bí mật nào được chép vào báo cáo; số CCCD trong `lib/auth.ts` đã được che khi khảo sát.

## 1. Đối chiếu 12 nguyên tắc (master prompt mục VIII)

| # | Nguyên tắc | Hiện trạng QL-HTKT | Thiết kế đề xuất (08) | Còn mở |
|---|---|---|---|---|
| 1 | Không đổi production khi chưa duyệt | Triển khai thủ công (`build-zero-downtime.ps1`) | Giữ; mọi đợt B có duyệt riêng | — |
| 2 | Không xoá/ghi đè dữ liệu gốc | Chatbot ghi thẳng (S2, S17) | Action Service + audit trước/sau + hoàn tác có kiểm phiên bản | Hoàn tác có thể đè thay đổi hợp lệ → dùng optimistic lock |
| 3 | Không tự đổi cấu hình VPS | Không thấy mã tự đổi | Agent không có công cụ hệ thống | — |
| 4 | Không quyền root/admin thường trực cho Agent | Không có agent shell | Worker DB role tối thiểu; không công cụ shell | Tài khoản dịch vụ Windows chạy PM2 chưa kiểm (Phụ lục A) |
| 5 | Không đưa bí mật vào prompt/nhật ký | Không thấy khoá trong prompt; webhook công bố token mặc định (S1) | Bỏ fallback; GET không trả cấu hình | S1 production |
| 6 | Không chuyển dữ liệu nội bộ ra ngoài khi chưa phép | Gửi dữ liệu cá nhân + hồ sơ tới LLM (S4, S11) | Định tuyến theo độ nhạy + che trước khi gửi (ADR-6) | **Cần quy chế Q3** |
| 7 | Không tự phát hành văn bản | Chỉ sinh nháp | Giữ; WF1/WF2 có 🧑‍⚖️ | — |
| 8 | Không tự gửi tin/đăng bài | Telegram chỉ cảnh báo/sinh nhật | Chỉ tới danh sách nội bộ đã duyệt | — |
| 9 | Kiểm soát prompt injection | Rào bằng prompt (`<HO_SO>`), dữ liệu ở `system` (S13); gợi ý LIKE vào system (S15) | ADR-7, ADR-9; kiểm thử đối kháng (12) | Chưa có kiểm thử |
| 10 | Có rollback | Sao lưu `pg_dump` hằng ngày (healthcheck) | Thêm bản ngoài máy + diễn tập khôi phục DB **và tệp** | Kế hoạch 20/8: chưa có bản ngoài ổ C |
| 11 | Tách dữ liệu cá nhân / công vụ | Một kho chung | `tri_thuc.phamVi` + chủ sở hữu; ghi chú cá nhân không vào RAG chung | — |
| 12 | Kiểm tra kết nối bên thứ ba | Webhook token yếu (S1); Telegram, SMTP | Danh mục kết nối + chủ sở hữu + hạn xoay khoá | — |

## 2. Danh mục rủi ro (xếp theo mức)

| Mức | Mã | Rủi ro | Biện pháp | Ưu tiên |
|---|---|---|---|---|
| **Cao** | S1 | Giả mạo dữ liệu SCADA nếu production không đặt `WEBHOOK_SECRET`; token mặc định công khai qua GET | Bắt buộc biến (thiếu → từ chối); GET không trả cấu hình; xoay token; kiểm `.env` production | **P0 — ngay** |
| **Cao** | S11 | Mọi TK cấp Sở xem ngày sinh/lương đồng nghiệp qua chatbot | Gắn `canViewOfficeSensitive`; chủ hệ thống quyết danh sách trường nhạy cảm | **P0** |
| **Cao** | S2/S17 | AI ghi sai / ghi lặp dữ liệu lương, nhân sự | **Tạm thời (B0): tắt 3 tool ghi** (`luu_lanh_dao_xa`, `cap_nhat_luong_can_bo`, `them_can_bo`) — người dùng sửa qua giao diện nghiệp vụ như trước. Câu "đồng ý" trong hội thoại **không** được coi là xác nhận. Mở lại chỉ sau khi có Action Service (ADR-4) và qua test 12 §2 | **P0** |
| **Cao** | S15 | Gợi ý "học từ LIKE" nằm trong system prompt của lượt **có** tool ghi → có thể dẫn model gọi tool ghi | Biện pháp tạm: tắt tool ghi (dòng trên) loại bỏ đường tác động; B4 chuyển LIKE thành đề xuất chờ duyệt | P0 (qua tắt tool ghi) |
| **Cao** | S4 | Dữ liệu cá nhân, hồ sơ ra nhà cung cấp LLM | Quy chế Q3; che; định tuyến | P0 (quy chế) |
| **Cao** | S8 | Legal Agent viện dẫn theo dữ liệu hiệu lực "nháp" | Người có thẩm quyền duyệt; nhãn "chưa kiểm chứng" trong câu trả lời | P1 |
| **Cao** | S7 | Hồi quy khi thêm AI | Bộ test ma trận quyền | **P0** |
| Trung bình | S3, S19 | Thiếu dấu vết kiểm toán | audit cùng transaction; mọi nhánh kết thúc | P0 |
| Trung bình | S5, S12 | Quyền gắn email/CCCD cá nhân | Chuyển `Permission` | P1 |
| Trung bình | S13 | Prompt injection từ hồ sơ (route hỏi đáp không có tool ghi) | ADR-7; lớp chặn cứng là ADR-4 | P1 |
| Trung bình | S14 | Dữ liệu cá nhân trong log | Mở rộng che; thời hạn lưu log | P1 |
| Trung bình | S16 | Cookie không `secure` nếu thiếu biến | Kiểm production; mặc định `secure` khi `NODE_ENV=production` | P0 (kiểm) |
| Thấp | S18 | Chunk mồ côi | Dọn khi ingest lỗi | P2 |

## 3. Rủi ro riêng của Javis nếu dùng (A/C hoặc trợ lý cá nhân)

| Rủi ro | Bằng chứng | Biện pháp nếu chủ hệ thống vẫn dùng Javis cá nhân |
|---|---|---|
| Engine bỏ qua quyền / không sandbox | `claude_sdk_engine.py:843-850`; `claude_cli.py:1550-1577` | Chạy trên máy riêng, tài khoản không đặc quyền, không có quyền đọc dữ liệu QL-HTKT ngoài MCP |
| Plugin trong tiến trình | `plugins_host.py:579-697` | `JAVIS_ENABLE_USER_PLUGINS=false` |
| MCP stdio nhận toàn bộ env | `mcp_client.py:319-321` | Không đặt bí mật QL-HTKT trong env máy đó |
| MCP mặc định `full` khi cấu hình sai | `mcp_catalog.py:507-509` | Kết nối QL-HTKT luôn `readonly`, kiểm cấu hình |
| Updater nhánh động | `updater.py:254-286` | Ghim phiên bản, tắt cập nhật tự động |
| Zalo cá nhân không chính thức | `zalo_cli.py:5-43` | Không bật cho tài khoản công vụ |

## 4. Kiểm thử bảo mật bắt buộc trước mỗi đợt

Xem 12 §1–§2: ma trận quyền từng tool/method; webhook; injection; payload ra LLM; idempotency/đồng thời; audit nguyên tử; khôi phục.
