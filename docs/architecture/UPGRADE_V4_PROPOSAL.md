# UPGRADE_V4_PROPOSAL — nâng Master Prompt V3.0 lên V4.0 (PROPOSED)

Ngày: 2026-11-11. Nguồn nghiên cứu: tìm kiếm web (nhiều nguồn là blog/bên thứ ba, **chưa phải văn bản gốc**) + kết quả Phase 0 chỉ-đọc. Nhãn: V = đã kiểm chứng ở nguồn công khai · I = suy luận · U = chưa biết/cần đối chiếu gốc.

## 1. Vấn đề của V3.0 (phản biện)
| # | Vấn đề | Hệ quả | Sửa trong V4.0 |
|---|---|---|---|
| 1 | 12 Agent, 10 workflow, 12 module cùng lúc | Quá rộng cho máy 6GB/2 lõi và 1 đội nhỏ; khó nghiệm thu | Chia 3 mốc giá trị (§5); Agent gộp còn 5 vai trò thực chất |
| 2 | n8n là trụ điều phối | n8n chưa xác minh tồn tại; token/logic ngoài app | Hàng đợi trong Postgres + worker PM2 (đã nghiên cứu ở `INTEGRATION_OPTIONS.md`) |
| 3 | Không nhắc nghĩa vụ gắn nhãn AI | Rủi ro pháp lý cho cơ quan nhà nước | Thêm lớp tuân thủ Luật AI (§3) |
| 4 | "AI scoring" 9 tiêu chí | Giả chính xác | Chỉ giữ cổng cứng (nguồn, hiệu lực, mức công khai, người duyệt); điểm chỉ để tham khảo |
| 5 | Giới hạn nền tảng viết cứng/đoán | Sai khi API đổi | Bảng năng lực nền tảng (capability matrix) **đọc từ cấu hình + gọi API kiểm tra**, không hardcode |
| 6 | Không có ngân sách tài nguyên | Làm sập production chung máy | Ngân sách: ≤150 MB RAM thêm, media ngoài đĩa C:, truy vấn có giới hạn |

## 2. Năng lực nền tảng mạng xã hội (kết quả tra cứu)
| Nền tảng | Điều đã thấy | Nhãn | Ý nghĩa thiết kế |
|---|---|---|---|
| Threads | Giới hạn 250 bài đăng qua API/24 giờ (cuộn); có endpoint kiểm hạn mức `threads_publishing_limit`; quyền `threads_content_publish` | V (tài liệu Meta qua tìm kiếm) | Adapter đọc hạn mức trước khi đăng; mặc định đăng rất ít nên không chạm trần |
| Threads | Giới hạn 500 ký tự | U (chỉ thấy ở tài liệu bên thứ ba) | Đọc từ cấu hình; xác minh ở tài liệu Meta trước khi dùng |
| Facebook Page | Đăng qua `POST /{page-id}/feed`, quyền `pages_manage_posts` (+ `pages_read_engagement`, `pages_show_list`); không đăng được lên trang cá nhân/Group; Page token dài hạn sinh từ user token dài hạn, hết hiệu lực khi đổi mật khẩu/thu hồi/đổi vai trò | V/I (blog + tài liệu Meta; nguồn không thống nhất) | Dùng Page do chính Sở quản trị → thường không cần App Review nâng cao; phải có quy trình tái cấp token + cảnh báo hết hạn |
| LinkedIn | Đăng ở Trang tổ chức cần `w_organization_social` thuộc Community Management API, cần duyệt; đăng cá nhân chỉ cần `w_member_social`; nguồn báo quy trình duyệt đang đổi | U (blog; trang Microsoft Learn có thông báo thay thế quy trình) | Coi LinkedIn là **tuỳ chọn mốc sau**; có đường "xuất bản thủ công" |
| Zalo OA / website Sở | Chưa tra cứu | U | Với cơ quan Việt Nam, Zalo OA và cổng thông tin có thể quan trọng hơn LinkedIn; cần hỏi người dùng và tra tài liệu Zalo |

Kết luận: **không tuyên bố tự đăng được kênh nào cho đến khi có tài khoản thử và đã gọi thật.** AT-08 chỉ đạt khi có bằng chứng ID bài đăng thật.

## 3. Tuân thủ pháp lý Việt Nam — ĐÃ ĐỐI CHIẾU NGUYÊN VĂN (11/11/2026)
Nguồn: 3 tệp trong kho `G:\My Drive\Tailieu_VBPL` (134_2025_QH15, 142_2026_ND-CP, 91_2025_QH15), đọc bằng `tools/doc_reader.py`. Các số liệu từ báo/blog ở bản trước **được thay bằng bảng này**.

| Điều khoản (VERIFIED) | Nội dung | Thiết kế bắt buộc |
|---|---|---|
| Luật 134/2025/QH15 Đ34 | Hiệu lực 01/3/2026 | Đã có hiệu lực |
| Luật 134 Đ11 k3 | Bên triển khai phải **thông báo rõ ràng** khi đưa ra công cộng văn bản/âm thanh/hình ảnh/video do AI tạo/chỉnh sửa **nếu có khả năng gây nhầm lẫn** về tính xác thực sự kiện, nhân vật | Trường `ai_generated` + cờ "có thể gây nhầm lẫn" do người duyệt xác nhận |
| Luật 134 Đ11 k4 | Âm thanh/hình ảnh/video AI **mô phỏng ngoại hình, giọng nói người thật hoặc tái hiện sự kiện thực tế** phải gắn nhãn dễ nhận biết | Chặn mặc định ảnh mô phỏng người thật/sự kiện thật; nếu cho phép phải có nhãn hiển thị |
| Luật 134 Đ7 k2 b, d | Cấm dùng AI giả mạo/mô phỏng người, sự kiện thật để lừa dối; cấm nội dung giả mạo gây nguy hại an ninh/trật tự | Security Agent từ chối yêu cầu thuộc nhóm này |
| Luật 134 Đ27 k2 | AI **không thay thế thẩm quyền, trách nhiệm quyết định** của người ra quyết định; người quyết định chịu trách nhiệm về việc dùng kết quả AI | Khẳng định thiết kế "người duyệt bắt buộc"; ghi người duyệt chịu trách nhiệm |
| Luật 134 Đ27 k1, k3 | Dùng AI trong quản lý nhà nước/dịch vụ công phải công khai, minh bạch, theo Khung đạo đức AI quốc gia; hệ thống rủi ro cao/tác động đáng kể phải lập báo cáo đánh giá tác động | UNKNOWN: module này có thuộc "rủi ro cao" không — cần đánh giá; khả năng thấp nhưng phải ghi quyết định |
| NĐ 142/2026 Đ45 | Hiệu lực 01/5/2026 (ký 30/4/2026) | Đã có hiệu lực |
| NĐ 142 Đ17 k1 | Nhà cung cấp đánh dấu kỹ thuật dạng máy đọc cho **âm thanh/hình ảnh/video**; **văn bản không bắt buộc** | Ảnh AI: lưu dấu hiệu trong siêu dữ liệu/chữ ký; chỉ là nghĩa vụ của nhà cung cấp, nhưng Đ17 k5 nói với hệ thống mã nguồn mở/miễn phí thì **bên triển khai phải tự áp dụng** đánh dấu khi đưa ra công cộng |
| NĐ 142 Đ18 k2, k3 | Gắn nhãn dễ nhận biết (ảnh/video mô phỏng người thật, tái hiện sự kiện thật): rõ ràng, **trước hoặc tại thời điểm tiếp cận**, không che giấu | Nhãn nằm trong ảnh hoặc ngay tiêu đề/chú thích bài (Đ18 k5 cho phép) |
| NĐ 142 Đ18 k4 | **Miễn** gắn nhãn: chỉnh sửa kỹ thuật không đổi bản chất; **văn bản chỉ sửa chính tả/ngữ pháp/tóm tắt/diễn giải/dịch** không sai lệch; nội dung **dùng nội bộ**; thử nghiệm không ra công cộng | Bản nháp nội bộ không cần nhãn; bài đăng công khai do AI soạn mới ảnh hưởng — theo Đ11 k3 vẫn phải thông báo nếu có thể gây nhầm lẫn |
| NĐ 142 Đ18 k7 | Bộ KH&CN sẽ công bố hướng dẫn kỹ thuật tham chiếu về nhãn | Theo dõi; cấu hình nhãn nên đổi được không cần sửa mã |
| Luật 91/2025/QH15 Đ38 | Hiệu lực 01/01/2026 | Đã có hiệu lực |
| Luật 91 Đ30 k1, k3, k4 | Xử lý dữ liệu cá nhân bằng AI: đúng mục đích, trong phạm vi cần thiết, có biện pháp bảo mật, **phân loại theo mức rủi ro** | Khớp phân loại 4 mức ở `DATA_CLASSIFICATION.md`; RESTRICTED không vào prompt |
| Luật 91 Đ9 | Sự đồng ý của chủ thể dữ liệu | Ảnh/tên cá nhân trong bài cần đồng ý hoặc căn cứ khác tại Đ19 (chưa đọc kỹ từng căn cứ — UNKNOWN) |

**Kết luận thực hành:** nghĩa vụ không nặng như báo chí nêu cho *văn bản* AI soạn rồi người duyệt (có miễn trừ khi chỉ hỗ trợ chỉnh sửa, và người duyệt chịu trách nhiệm), nhưng **ảnh AI đưa ra công cộng** cần: đánh dấu kỹ thuật máy đọc, nhãn "ảnh minh hoạ do AI tạo" hiển thị khi có thể gây nhầm lẫn, và cấm mô phỏng người/sự kiện thật. Cách đọc "văn bản AI soạn đăng công khai có thể gây nhầm lẫn" là phần **diễn giải**, cần Pháp chế Sở xác nhận.

**Chưa đọc/chưa có:** NĐ 147/2024 (nguồn blog, chưa có bản gốc trong kho); nghị định xử phạt vi phạm về AI (nguồn nói chưa có); thủ tục khai báo trên Cổng một cửa AI (NĐ 142 Đ46 chuyển tiếp) — cần xác định module có phải khai báo không.

## 4. Bảo mật ứng dụng LLM (OWASP LLM Top 10 — bản 2025)
V: danh sách 2025 có LLM01 prompt injection, LLM02 lộ thông tin nhạy cảm, LLM03 chuỗi cung ứng, thêm mới "system prompt leakage" và "vector & embedding weaknesses"; "excessive agency" nhấn mạnh với agent. (Nguồn nhắc có bản 2026: cần xem trang OWASP GenAI.)
Ánh xạ vào thiết kế:
- Prompt injection gián tiếp (PDF, web, Drive): nội dung truy xuất đóng khung dữ liệu, agent soạn bài **không có công cụ ghi/đăng**; chỉ có công cụ đọc.
- Vector/embedding: lọc quyền trước truy vấn (đã có mẫu `phamViCho`); không trộn kho công khai và nội bộ trong một truy vấn.
- Excessive agency: đăng bài là hành động **do worker thực hiện từ bản ghi đã duyệt**, không phải do mô hình quyết định; mọi hành động ra ngoài qua dịch vụ cấp quyền độc lập + xác minh lại phê duyệt ngay trước khi đăng (AT-06/12).
- System prompt leakage: không đặt bí mật/ACL trong prompt; token không bao giờ vào prompt.
- Supply chain: thêm package (pg-boss, v.v.) cần duyệt, khoá phiên bản theo lockfile (CI đã dùng `npm ci`).

## 5. Lộ trình V4.0 — 3 mốc giá trị (thay cho 8 phase dàn trải)
| Mốc | Phạm vi | Cổng nghiệm thu | Điều kiện trước |
|---|---|---|---|
| M1 "Soạn–duyệt–lịch" (không gọi mạng xã hội) | Bài gốc từ nội dung người dùng + kho VBPL (chỉ `con_hieu_luc`), biến thể 3 kênh, ảnh qua adapter giả, state machine duyệt, lịch 08:30 Asia/Ho_Chi_Minh, xuất bản "thủ công có đánh dấu", audit | AT-01,02,03,05,06,07,12,13,14,15,16 | CSDL thử + diễn tập khôi phục; cờ `AI_CONTENT_ENABLED` |
| M2 "Đăng thật có kiểm soát" | Worker PM2 + hàng đợi Postgres, adapter Facebook Page (rồi Threads), đối soát trước retry, ghi kết quả từng kênh | AT-08..11 | Tài khoản/Page thử, token mã hoá, quyết định lưu media |
| M3 "Phân tích & tối ưu" | Số liệu, chi phí, đề xuất lịch; LinkedIn/Zalo nếu được cấp quyền; sinh ảnh thật | AT-17,18 + security review | Chọn nhà cung cấp ảnh, chính sách dữ liệu |

Agent rút gọn (vai trò thực chất, không phải 12 tiến trình): Soạn thảo, Kiểm chứng (nguồn + hiệu lực + mức công khai), Chuyển thể kênh, Ảnh (adapter), Cổng duyệt (con người). Publisher là worker xác định, **không phải LLM**.

## 6. Giao diện (thực dụng, đồng nhất hệ thống hiện hữu)
- V: dự án đã có `components/ui` (shadcn), `next-themes` (sáng/tối), `sonner` (toast), `react-day-picker`, `recharts`, `lucide-react`, `react-hook-form`+`zod` → **không cần thư viện mới** cho lịch, biểu đồ, form, toast.
- Menu: thêm nhóm "AI Workspace" vào `sidebar-new.tsx` (menu thật theo memory), ẩn khi cờ tắt và khi thiếu quyền.
- Màn hình ưu tiên M1: Tổng quan · Soạn bài (bên cạnh: nguồn trích + cảnh báo hiệu lực) · Xem trước từng kênh · Trung tâm duyệt (so sánh phiên bản, băm nội dung) · Lịch (tuần/tháng/danh sách; Kanban sau) · Nhật ký.
- Nguyên tắc: trạng thái luôn kèm lý do và hành động tiếp theo; mọi nút đăng bị vô hiệu kèm giải thích khi thiếu duyệt; trạng thái rỗng/lỗi/đang tải đủ; bàn phím và độ tương phản đạt; tiếng Việt chuẩn, thuật ngữ nhất quán với phần còn lại.
- Kiểm thử giao diện: dùng Browser pane trên máy dev, 3 cỡ màn hình, sáng/tối — **NOT_RUN** (chưa có mã).

## 7. Hiệu quả & tài nguyên
- Ngân sách: +1 tiến trình worker (~80–150 MB, I), không chạy n8n/Docker trên VPS; media ngoài đĩa C: (9 GB trống); ảnh và LLM qua API ngoài.
- Chi phí AI: ghi `provider_usage` theo tác vụ; hạn mức ngày/tháng; cache kết quả truy xuất; dùng mô hình nhỏ cho chuyển thể kênh, mô hình lớn chỉ cho soạn thảo/kiểm chứng; không đổi nhà cung cấp nhúng véc-tơ (đã ghi trong `cau-hinh.ts`).
- Truy vấn: chỉ mục theo `(trang_thai, scheduled_at_utc)`; quét lịch mỗi phút bằng một câu SQL có giới hạn.

## 8. Còn thiếu để chốt (việc của người dùng)
1. ~~Văn bản gốc Luật AI/NĐ 142/Luật 91~~ — đã có và đã đối chiếu (§3). Còn thiếu: NĐ 147/2024 bản gốc; xác nhận của Pháp chế về cách đọc §3 "kết luận thực hành".
2. Kênh thật sự cần: Facebook Page của Sở? Zalo OA? Cổng thông tin? LinkedIn có cần không?
3. Có đồng ý thêm package hàng đợi không; nơi lưu media; nhà cung cấp ảnh/LLM và chính sách dữ liệu.
4. Người có thẩm quyền duyệt bài công khai (vai trò/CCCD nhóm nào).
