# 03 — Ma trận so sánh chức năng và khoảng trống

> Phân loại theo master prompt mục III.3: **✅ Có triển khai** · **🔧 Có, cần nâng cấp** · **🚧 Chưa hoàn thiện** · **⚠ Lỗi/rủi ro** · **♻ Trùng với Javis** · **➕ Chưa có**.
> **✅ = "có triển khai trong mã, chưa xác nhận vận hành/độ đúng"** (đính chính vòng 3 theo Codex 2B) — QL-HTKT chỉ có 1 tệp test (01 S7);
> mọi ✅ phải qua kiểm thử ở 12 mới được coi là "hoàn thiện".

## 1. Ma trận theo 10 module dự kiến của HTKT Brain AI

| Module dự kiến | QL-HTKT hiện có | Phân loại | Javis OS có | Nguồn nên dùng | Bằng chứng QL-HTKT |
|---|---|---|---|---|---|
| 1. AI Orchestrator | Vòng tool-calling trong chatbot (1 route, 21 tool) | 🔧 | Engine router + hub + workflow | **Tách vòng tool-calling hiện có thành dịch vụ dùng chung** trong TS; mượn mẫu checkpoint của Javis | `app/api/chatbot/route.ts` |
| 2. Second Brain | RAG `tai_lieu` + `tai_lieu_chunk` (văn bản pháp lý/nội bộ); **chưa có** ghi chú cá nhân, wiki, phiên bản tri thức, duyệt tri thức | 🚧 / ♻ | Markdown brain + learn.py + git | Bảng tri thức trong PostgreSQL (3 lớp: gốc / đã duyệt / đề xuất) + xuất markdown; mượn quy trình duyệt của Javis | `lib/rag/*`, `schema.prisma:3000-3029` |
| 3. Legal Research Agent | Tool `tra_cuu_phap_ly_chuyen_nganh`, `tra_cuu_hieu_luc_van_ban`, `tra_cuu_tai_lieu` (RAG có cờ hiệu lực) | 🔧 | Không có nghiệp vụ pháp lý | **Giữ, nâng cấp**: thêm quan hệ sửa đổi/thay thế/chuyển tiếp có cấu trúc, trích dẫn điều-khoản-điểm, mốc thời gian hồ sơ | `route.ts:555-583`; `lib/data/phap-ly-chuyen-nganh.ts`; S8 |
| 4. Construction Appraisal Agent | Quét hồ sơ, kiểm tra dự toán Excel, hỏi đáp hồ sơ có nguồn; liên thông DuToanAI chỉ-đọc | ✅ / 🔧 | Không | **Giữ nguyên lõi**, bọc thành công cụ cho orchestrator | `lib/tham-dinh/*` |
| 5. Document Agent | Đọc PDF/DOCX/XLSX; sinh tờ trình; xuất DOCX/PDF/Excel | 🔧 | `pypdf`, doc tools | Giữ; thêm so sánh văn bản (diff điều khoản) cho Workflow 2 | `lib/openai.ts`, `lib/htkt/van-ban-docx.ts` |
| 6. Critical Review Agent | Quy trình Claude↔Codex **thủ công** trong phát triển; chưa có trong sản phẩm | ➕ | Không có agent phản biện riêng | Bước "phản biện" = lượt gọi riêng với prompt đối kháng + kiểm tra trích dẫn tự động; chỉ tách agent khi đo được lợi ích | `scripts/codex-*.md` |
| 7. Task Management Agent | `CongViec*`: hạn, ưu tiên, trạng thái, thành viên, nhật ký, checklist, lịch, Gantt | ✅ / ♻ | Kanban + reminders | **Giữ của QL-HTKT** (đa người dùng, theo phòng); thêm nhắc hạn + "nhật ký ngày" kiểu Bullet Journal | `components/cong-viec/*`, `schema.prisma:~3100-3136` |
| 8. Automation Agent | Task Scheduler + script (healthcheck, sinh nhật); không có engine | 🚧 / ♻ | Scheduler 30 s, cron, loops, workflow | Hàng đợi việc nền **trong PostgreSQL** + một tiến trình worker có giới hạn tài nguyên; mẫu "node ghi dừng chờ duyệt" | `app/scripts/` |
| 9. Integration Hub | Telegram, email, webhook SCADA, Công dân số, Zalo OA (tài liệu) | 🔧 / ⚠ | MCP Hub 3 mức quyền, OAuth MCP, nhiều kênh | Mượn **mô hình quyền** MCP Hub; **không** dùng Zalo cá nhân | `lib/telegram.ts`, `lib/mailer.ts`, `app/api/webhook/*`; S1 |
| 10. Security & Audit | JWT + RBAC (`Role/Permission`), `AuditLog`, che dữ liệu trong nhật ký chatbot | 🔧 / ⚠ | Một chủ, Fernet, CSRF, TOTP | Giữ của QL-HTKT; bổ sung: nhật ký trước/sau cho ghi qua AI, xác nhận 2 bước, quy chế gửi dữ liệu ra LLM | `schema.prisma:115-130`; S2–S5 |

## 2. Ma trận chức năng chi tiết

| Chức năng | QL-HTKT | Javis | Trùng? | Khuyến nghị |
|---|---|---|---|---|
| Đăng nhập nhiều người, theo phòng | ✅ | ❌ (1 chủ) | — | Giữ QL-HTKT |
| Chatbot hỏi đáp nghiệp vụ | ✅ | ✅ (chung chung) | ♻ một phần | Giữ QL-HTKT |
| Chế độ không-AI khi LLM lỗi | ✅ | ❌ (không thấy) | — | Giữ — điểm mạnh |
| Đổi nhà cung cấp LLM | ✅ (OpenAI-compatible qua .env) | ✅ (12 provider) | ♻ | Giữ QL-HTKT; bổ sung định tuyến theo loại việc/độ nhạy dữ liệu |
| RAG văn bản pháp lý + cờ hiệu lực | ✅ | ❌ | — | Giữ, đánh giá truy hồi |
| Tìm toàn văn (FTS) | ➕ (chỉ vector + TF-IDF trong RAM) | ✅ SQLite FTS5 | — | Thêm `tsvector` PostgreSQL cho tìm số hiệu/điều khoản chính xác (hybrid search) |
| Quan hệ văn bản (sửa đổi/thay thế/hướng dẫn) | 🚧 (`thayTheBoi` dạng chuỗi) | ❌ | — | Bảng quan hệ có kiểu |
| Ghi chú / nhật ký cá nhân | ➕ | ✅ | ♻ | Xây mới tối giản trên PostgreSQL, tách dữ liệu cá nhân |
| Wiki tri thức có duyệt | ➕ | ✅ (tự học, git) | ♻ | Xây theo quy trình Javis, lưu PostgreSQL + xuất markdown |
| Đồ thị liên kết tri thức | ➕ | ✅ (wikilink) | ♻ | Hoãn — chưa chứng minh giá trị |
| Quản lý công việc nhóm | ✅ | ✅ (Kanban cá nhân) | ♻ | Giữ QL-HTKT |
| Nhắc việc theo hạn | 🚧 | ✅ | ♻ | Thêm worker nhắc hạn (Telegram/email nội bộ đã có) |
| Workflow nhiều bước có điểm duyệt | ➕ | ✅ | — | Xây mới trong TS, mượn mẫu |
| Agent phản biện | ➕ | ❌ | — | Bước trong workflow |
| Thẩm định hồ sơ / dự toán | ✅ | ❌ | — | Giữ |
| Soạn văn bản hành chính | ✅ | ❌ | — | Giữ; **không tự phát hành** |
| Xuất DOCX/XLSX/PDF theo mẫu | ✅ | Một phần | — | Giữ |
| MCP server cho dữ liệu nội bộ | ➕ | ✅ (client + hub) | — | Xây MCP server **chỉ-đọc** cho QL-HTKT (P2) |
| Kênh Telegram | ✅ (cảnh báo) | ✅ (hội thoại) | ♻ | Giữ cảnh báo; hội thoại qua Telegram cần phê duyệt riêng |
| Kênh Zalo | Zalo OA (chính thức, tài liệu) | Zalo Bot + **Zalo cá nhân không chính thức** | — | Chỉ Zalo OA |
| Voice | ➕ | ✅ | — | Không ưu tiên |
| Tự cập nhật phần mềm | ➕ (build-zero-downtime thủ công) | ✅ updater (polling tự động mặc định tắt) | — | **Không** tự cập nhật production |
| Tái dùng câu trả lời tốt | 🔧 "học từ LIKE" vào system prompt (01 S15) | ✅ learn.py có quét bí mật/injection + fork chỉ-đọc; ghi tự động khi `mode=auto` (không có người duyệt) | ♻ | Chuyển thành lớp "đề xuất" chờ duyệt (09 WF3) |
| Sao lưu | ✅ `pg_dump` hằng ngày (theo healthcheck) | git brain (thủ công) | — | Thêm bản sao ngoài máy + thử khôi phục định kỳ |
| Kiểm thử tự động | ⚠ (1 tệp) | ✅ (117k dòng) | — | **Ưu tiên P0** trước khi thêm agent |

## 3. Khoảng trống quan trọng nhất (theo thứ tự xử lý đề xuất — khớp lộ trình 11)

0. **Vá khẩn (B0, trước mọi việc khác):** S1 webhook (bỏ token mặc định, GET không trả cấu hình, xoay khoá production); **tắt 3 tool ghi của chatbot** cho tới khi có Action Service; S11 khoá trường nhạy cảm.
1. **Lưới kiểm thử hồi quy** cho chatbot/tham-dinh/phân quyền — chưa có (S7).
2. **Kiểm soát hành động ghi của AI**: đề xuất → xem trước → xác nhận gắn payload + phiên bản đối tượng → thực thi idempotent + audit **cùng transaction** (S2, S3, S17); khoá dữ liệu nhạy cảm theo quyền (S11).
3. **Quy chế dữ liệu ra LLM bên ngoài** + định tuyến theo độ nhạy (S4).
4. **Dữ liệu quan hệ văn bản pháp lý** có cấu trúc (S8).
5. **Workflow engine nhẹ có điểm duyệt** (chưa có).
6. **Second Brain 3 lớp có duyệt** (chưa có).
7. Bí mật mặc định trong mã (S1) — đã đưa lên mục 0.
