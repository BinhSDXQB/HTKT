# 05 — Phản biện độc lập của Codex (Vòng 2)

> **Nguyên văn đầu ra Codex** — Claude KHÔNG chỉnh sửa nội dung bên dưới; giải trình ở `06-review-resolution.md`.
> Công cụ: `codex-cli 0.162.0-alpha.17.2` (extension VS Code `openai.chatgpt`), `codex exec --sandbox read-only`, model báo cáo trong log: `gpt-6.1-sol`.
> Prompt đầy đủ của từng lượt lưu kèm phụ lục cuối tệp.

## 0. Bảo đảm tính độc lập

| Lượt | Thời điểm | Codex được đọc | Không được đọc | Kiểm chứng |
|---|---|---|---|---|
| **2A** — độc lập về QL-HTKT | khởi chạy 15/10/2026, **trước khi** Claude viết báo cáo 01–04 | mã `app/`, đề bài | `docs/htkt-brain-review/` | Log ghi lệnh `rg ... -g '!docs/htkt-brain-review/**'`; khi khởi chạy thư mục báo cáo chưa tồn tại. Hạn chế: **không đọc được bản clone Javis** (Access is denied trong sandbox) |
| **2A-bis** — độc lập về Javis | 21/10/2026 | bản sao Javis `D:\Troly\QLHTKT\_research\javis-os` | `docs/htkt-brain-review/` | chạy với thư mục làm việc = bản sao Javis |
| **2B** — phản biện báo cáo Claude | 21/10/2026 | 01–04 + mã cả hai bên | `.env`, secrets, CSDL | Codex ghi: không thấy nội dung 2A trong ngữ cảnh (mỗi lượt `codex exec` là phiên mới) |

---

## 1. Lượt 2A — Đánh giá độc lập QL-HTKT (nguyên văn)

**Khuyến nghị sơ bộ: chọn B — giữ QL-HTKT làm hệ thống nghiệp vụ, bổ sung AI Orchestrator độc lập.** C có thể là bước tiếp theo sau khi kiểm chứng từng thành phần Javis.

Giới hạn quan trọng: công cụ đọc thư mục Javis trả **“Access is denied”**. Vì vậy, phần Javis dưới đây là **chưa kiểm chứng**, không phải kết luận rằng Javis thiếu tính năng. Tôi không truy cập mạng, CSDL, tệp nhạy cảm hoặc `docs/htkt-brain-review/`; không sửa tệp và không chạy kiểm thử.

Các đường dẫn dưới đây tính từ `D:\Troly\QLHTKT\HTKT`. “Đã thấy” là bằng chứng tĩnh; “suy luận” chưa được kiểm thử thực nghiệm.

**1. Kiến trúc QL-HTKT và phần nên giữ**

| Khối | Đã thấy trong mã | Đề xuất |
|---|---|---|
| Nền nghiệp vụ | Next.js, Prisma/PostgreSQL; Prisma dùng adapter PostgreSQL. `app/package.json:23`, `app/package.json:43`, `app/lib/db.ts:17` | Giữ nền dữ liệu và nghiệp vụ; tránh chuyển sang nền mới chỉ để thêm AI. |
| Chatbot | Vòng lặp gọi công cụ tối đa 5 lần; kiểm lại tên công cụ phía máy chủ; có trả lời không AI khi nhà cung cấp lỗi. `app/app/api/chatbot/route.ts:2195`, `app/app/api/chatbot/route.ts:2266`, `app/app/api/chatbot/route.ts:2215` | Giữ khả năng tra cứu và cơ chế dự phòng; sửa phân quyền và thao tác ghi trước khi tái sử dụng. |
| RAG | pgvector; lọc phạm vi, tài liệu sẵn sàng và chưa xóa; trả vị trí trích dẫn. `app/lib/rag/search.ts:58`, `app/lib/rag/search.ts:71` | Giữ kho, metadata và nguồn trích dẫn; mở rộng ACL khi cần. |
| Cấu hình AI | Tách client/model chat và embedding; vector 1536 chiều. `app/lib/ai/cau-hinh.ts:27`, `app/lib/ai/cau-hinh.ts:61`, `app/lib/ai/cau-hinh.ts:68` | Giữ đầu mối cấu hình; bổ sung kiểm soát dữ liệu được phép gửi. |
| Hỏi đáp hồ sơ | Trích xuất, tìm theo từ khóa, cache RAM; giới hạn 10 đoạn/14.000 ký tự; không phải RAG embedding. `app/lib/tham-dinh/hoi-dap.ts:11`, `app/lib/tham-dinh/hoi-dap.ts:18`, `app/lib/tham-dinh/hoi-dap.ts:160` | Giữ cách xử lý nhẹ và nguồn theo tệp/trang; không mặc định chuyển toàn bộ hồ sơ sang bộ nhớ dài hạn. |
| Công việc | Phạm vi theo phòng/người tạo/phụ trách/thành viên; kiểm quyền sửa; cập nhật trạng thái kèm nhật ký trong transaction. `app/app/actions/cong-viec.ts:31`, `app/app/actions/cong-viec.ts:130`, `app/app/actions/cong-viec.ts:180` | Giữ làm nguồn dữ liệu chính; AI gọi nghiệp vụ hiện hữu qua adapter. |
| Telegram/mail/webhook | Có Telegram Bot API, SMTP và webhook ghi dữ liệu hạ tầng. `app/lib/telegram.ts:40`, `app/lib/mailer.ts:31`, `app/app/api/webhook/infrastructure/route.ts:75` | Giữ chức năng cần thiết; webhook phải sửa bảo mật. |

“Giữ” ở đây là giữ chức năng và quy tắc nghiệp vụ đã có, **không phải xác nhận mọi triển khai hiện tại đều an toàn**.

**2. Rủi ro bảo mật, phân quyền và dữ liệu cá nhân**

- **Cao — webhook có bí mật dự phòng cố định.** Khi thiếu biến cấu hình, POST vẫn chấp nhận token mặc định; GET không xác thực còn công khai giá trị mẫu. Webhook có nhánh cập nhật dữ liệu thật. **Đã thấy:** `app/app/api/webhook/infrastructure/route.ts:24`, `:30`, `:75`, `:130`, `:136`. **Suy luận:** nếu production thiếu cấu hình, người biết giá trị mặc định có thể gửi cập nhật trái phép; chưa xác nhận cấu hình production.

- **Cao — chatbot đọc dữ liệu nhạy cảm không thống nhất với quyền chung.** Có hàm `canViewOfficeSensitive`, nhưng nhánh `ho_so_can_bo` trả ngày sinh, hệ số lương/phụ cấp; chỉ CCCD được che theo email quản trị. Công cụ được cấp dựa chủ yếu vào việc có phải tài khoản xã/phường hay không. **Đã thấy:** `app/lib/auth.ts:184`; `app/app/api/chatbot/route.ts:747`, `:757`, `:760`, `:2159`. **Suy luận:** người dùng ngoài xã/phường nhưng không có quyền xem nhạy cảm có thể đọc qua chatbot nhiều hơn qua giao diện nghiệp vụ.

- **Cao — công cụ ghi thực hiện trực tiếp sau quyết định của LLM.** Có kiểm quyền, nhưng nhánh cập nhật lương đi thẳng tới `db.canBo.update`; tạo cán bộ cũng ghi trực tiếp. Chưa thấy bước xác nhận gắn với một bản thay đổi cụ thể trong các nhánh này. **Đã thấy:** `app/app/api/chatbot/route.ts:1088`, `:1163`, `:1188`, `:1265`, `:2274`. **Suy luận:** hiểu nhầm hoặc prompt injection trong phiên có quyền có thể gây ghi sai.

- **Phân quyền đang trộn vai trò với định danh cá nhân.** Có danh sách CCCD trong mã để cấp quyền và email cố định để nhận diện quản trị chatbot. **Đã thấy:** `app/lib/auth.ts:95`, `:102`, `:109`; `app/app/api/chatbot/route.ts:748`, `:1007`. **Suy luận:** khó bàn giao, thu hồi và kiểm toán quyền; bản thân mã nguồn cũng chứa định danh cá nhân. Không cần chép lại các định danh đó trong báo cáo.

- **Middleware không bảo vệ toàn bộ API.** Chỉ chặn nhóm office/htkt; các nhóm khác phải tự bảo vệ. Tuy nhiên `requireAuth` có đọc lại người dùng hoạt động và quyền từ CSDL. **Đã thấy:** `app/middleware.ts:53`, `:93`; `app/lib/auth.ts:34`, `:78`. Không đủ cơ sở kết luận “toàn bộ API đang hở”.

- **Cookie phụ thuộc cấu hình; lỗi API có thể thành redirect.** `secure` chỉ bật khi biến tương ứng bằng `"true"`; `requireAuth` dùng `redirect('/login')`. **Đã thấy:** `app/lib/session.ts:50`; `app/lib/auth.ts:80`. **Suy luận:** cần kiểm tra HTTPS/cookie production và chuẩn hóa 401/403 cho adapter AI.

- **Dữ liệu ra LLM chưa được che ở điểm gửi đã đọc.** Kết quả công cụ được thêm vào hội thoại; hỏi đáp gửi trích đoạn hồ sơ và lịch sử; embedding gửi nội dung tài liệu. **Đã thấy:** `app/app/api/chatbot/route.ts:2274`, `:2282`, `:2199`; `app/app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts:100`; `app/lib/rag/embeddings.ts:18`. **Suy luận:** che log không ngăn dữ liệu đã gửi ra nhà cung cấp; mức phơi lộ phụ thuộc nhà cung cấp thực tế.

- **Nhật ký bảo vệ chưa đầy đủ.** Có che số điện thoại/CCCD trước khi lưu chatbot log, nhưng chưa che tên, email, ngày sinh, lương; audit ghi một phần câu hỏi thô và nuốt lỗi ghi log. **Đã thấy:** `app/app/api/chatbot/route.ts:1934`, `:1968`, `:2245`; `app/lib/audit.ts:15`. **Suy luận:** có thể còn dữ liệu cá nhân trong log và khoảng trống dấu vết kiểm toán.

- **Prompt injection đã có phòng vệ bằng prompt, chưa phải ranh giới cứng.** Hỏi đáp đánh dấu `<HO_SO>` và cấm làm theo tài liệu, nhưng dữ liệu vẫn đặt ở role `system`; lịch sử `assistant` do client cung cấp được chấp nhận. **Đã thấy:** `app/app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts:33`, `:86`, `:95`, `:105`. Route này không cấp công cụ ghi tại lời gọi đã đọc, nên chưa có bằng chứng injection ở đây trực tiếp sửa CSDL.

**3. Nguy cơ mất dữ liệu hoặc thoái lui**

| Nguy cơ — suy luận | Cơ sở đã thấy |
|---|---|
| AI ghi thẳng CSDL sẽ bỏ qua phạm vi phòng, nhật ký và đồng bộ trạng thái–tiến độ. | `app/app/actions/cong-viec.ts:31`, `:163`, `:169`, `:180` |
| Đổi embedding cùng số chiều vẫn có thể làm tìm kiếm sai nghĩa; kiểm số chiều chưa kiểm được cùng không gian vector. | `app/lib/rag/embeddings.ts:7`, `:25` |
| Nạp tài liệu lỗi giữa chừng có thể để lại chunk dở dang; không nên coi thao tác ingest hiện tại là nguyên tử. | `app/lib/rag/ingest.ts:31`, `:50`, `:70` |
| Agent chạy lâu có thể mất nguồn nếu dùng phiên tải lên làm kho lâu dài: phiên hết hạn và phiên cũ bị xóa. | `app/lib/tham-dinh/phien-tai-len.ts:38`, `:98`, `:104` |
| Thêm worker/cache có thể tăng áp lực RAM và restart tiến trình. | Cache tối đa 3 chỉ mục: `app/lib/tham-dinh/hoi-dap.ts:22`; PM2 2 instance, heap 448MB/instance: `app/ecosystem.config.js:10`, `:15` |
| Sao lưu cùng ổ không bảo vệ khi hỏng ổ/mã độc. Đây là tình trạng được tài liệu mô tả, chưa kiểm chứng hiện tại. | `app/KE_HOACH_HOAN_THIEN_DU_AN_2026-08.md:160` |

**4. Javis OS: phần thực sự kiểm chứng được**

**Chưa kiểm chứng được mục nào từ mã Javis** do lỗi quyền đọc thư mục. Điều này áp dụng cho Agent, Skill, Workflow, Scheduler, Second Brain/Wiki, Knowledge Graph, MCP Hub/phân quyền, đa người dùng, sao lưu, kiểm thử và commit/version được nêu.

Tôi cũng **không xác nhận** Javis là mô hình một chủ, có shell toàn quyền, plugin không cô lập, tự cập nhật hay tích hợp Zalo cá nhân không chính thức. Những điều đó cần bằng chứng `đường_dẫn:dòng` trước khi kết luận.

**Suy luận thiết kế:** chưa đủ bằng chứng để chấp thuận Javis làm nền phục vụ nhiều người dùng của cơ quan. Chuẩn đối chiếu tối thiểu là giữ được kiểm tra người dùng hoạt động, quyền và phạm vi nghiệp vụ hiện có: `app/lib/auth.ts:34`, `app/app/actions/cong-viec.ts:31`.

**5. Chấm sơ bộ A/B/C**

Thang 1–5, càng cao càng tốt. Đây là **điểm dự báo kiến trúc**, không phải điểm chất lượng Javis. A giả định tích hợp sâu làm tăng bề mặt thay đổi; B/C giả định được triển khai với ranh giới quyền rõ ràng.

| Tiêu chí | Trọng số | A* | B | C* |
|---|---:|---:|---:|---:|
| Bảo mật | 25% | 2 | 4 | 4 |
| Tương thích | 20% | 2 | 5 | 4 |
| Hiệu quả/ổn định | 15% | 2 | 4 | 3 |
| Mở rộng | 15% | 3 | 4 | 5 |
| Chi phí | 10% | 3 | 4 | 3 |
| Bảo trì | 10% | 2 | 4 | 3 |
| UX | 5% | 3 | 4 | 4 |
| **Tổng /5** | **100%** | **2,30*** | **4,20** | **3,80*** |

- **B cao nhất:** tái sử dụng phân quyền và nghiệp vụ hiện hữu, dễ tắt AI khi lỗi; cơ sở: `app/lib/auth.ts:78`, `app/app/actions/cong-viec.ts:130`, `app/app/api/chatbot/route.ts:2215`.
- **C có tiềm năng mở rộng**, nhưng phải tự bảo trì phần chọn lọc và kiểm chứng tương thích; hệ thống đã có đầu mối AI/RAG riêng để nối adapter: `app/lib/ai/cau-hinh.ts:54`, `app/lib/rag/search.ts:25`.
- **A có độ bất định lớn nhất:** điểm có dấu `*` cần chấm lại sau khi đọc Javis, không dùng để phê duyệt mua sắm/triển khai.
- **6GB RAM là thông tin tài liệu, không phải đo thực tế:** `app/KE_HOACH_HOAN_THIEN_DU_AN_2026-08.md:4`; các giới hạn RAM cũng xuất hiện trong `app/lib/tham-dinh/hoi-dap.ts:22`. Không đủ cơ sở khẳng định chạy thêm Javis sẽ vừa RAM.

**6. Phần không nên tích hợp và kiến trúc thay thế**

**Đề xuất, suy ra từ các rủi ro trên:**

- Không cấp AI quyền ghi trực tiếp PostgreSQL, shell quản trị hoặc toàn bộ kho hồ sơ; giữ kiểm quyền ở nghiệp vụ. Cơ sở: `app/app/actions/cong-viec.ts:130`, `app/lib/tham-dinh/duong-dan.ts:77`.
- Không biến phiên hồ sơ tạm hay câu trả lời được LIKE thành tri thức chính thức dùng chung. Cơ sở: `app/lib/tham-dinh/phien-tai-len.ts:98`, `app/app/api/chatbot/route.ts:1865`.
- Không đưa plugin thực thi tùy ý, tự cập nhật hay Zalo cá nhân vào production **nếu sau kiểm chứng chúng tồn tại và không có cơ chế quản trị phù hợp**. Đây là điều kiện thiết kế, chưa phải phát hiện về Javis.

Luồng đề xuất:

`Giao diện QL-HTKT → cổng AI có danh tính người dùng → Orchestrator → adapter nghiệp vụ có kiểm quyền`

Orchestrator giữ job/bộ nhớ riêng; mỗi mục nhớ mang chủ sở hữu, phạm vi, nguồn và thời hạn. Công cụ đọc triển khai trước. Công cụ ghi tạo bản đề xuất thay đổi để người có quyền duyệt, rồi nghiệp vụ hiện hữu thực thi. Giữ đầu mối nhà cung cấp hiện tại nhưng bổ sung lọc dữ liệu gửi ra. Cơ sở tái sử dụng: `app/lib/auth.ts:84`, `app/lib/ai/cau-hinh.ts:54`, `app/app/actions/cong-viec.ts:72`.

**7. Kiểm thử để chứng minh hoặc bác bỏ**

Các kiểm thử sau chỉ đề xuất chạy trên môi trường thử với dữ liệu giả:

| Kiểm thử cụ thể | Tiêu chí đạt và điểm xuất phát |
|---|---|
| Ma trận quyền: vô danh, xã, chuyên viên, người có quyền nhạy cảm, admin, tài khoản bị khóa; thử mọi API/công cụ AI. | Không đọc/ghi vượt quyền; đối chiếu `app/lib/auth.ts:184`, `app/app/api/chatbot/route.ts:2159`. |
| Webhook thiếu/sai secret, gửi lặp cùng sự kiện, timestamp cũ, dữ liệu số sai. | Thiếu cấu hình phải từ chối; không ghi lặp/sai. `app/app/api/webhook/infrastructure/route.ts:24`, `:52`. |
| Giả lập LLM gọi công cụ ngoài danh sách, tham số sai, ghi hai lần sau timeout. | Bị chặn; thao tác ghi có xác nhận và chống lặp. `app/app/api/chatbot/route.ts:2266`, `:2274`. |
| Hồ sơ chứa “bỏ qua quy tắc”, `</HO_SO>`, chỉ dẫn giấu trong tên tệp; lịch sử assistant giả. | Không đổi quy tắc/kết luận, không lộ dữ liệu ngoài nguồn. `app/app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts:69`, `:86`, `:105`. |
| Chặn/mock đường ra LLM, embedding, Telegram, SMTP rồi kiểm payload. | Chỉ dữ liệu được phép rời hệ thống. `app/lib/rag/embeddings.ts:18`, `app/lib/telegram.ts:43`, `app/lib/mailer.ts:34`. |
| Đổi model embedding cùng/khác số chiều; ngắt ingest giữa chừng. | Không trộn vector; tài liệu lỗi không xuất hiện trong tìm kiếm. `app/lib/rag/embeddings.ts:25`, `app/lib/rag/search.ts:72`. |
| Thử truy cập phiên người khác, phiên hết hạn, traversal/UNC/ADS/junction. | Từ chối, không đọc ngoài whitelist. `app/lib/tham-dinh/phien-tai-len.ts:136`, `app/lib/tham-dinh/duong-dan.ts:101`. |
| Khôi phục DB **và tệp** sang môi trường cô lập; đối chiếu số lượng, liên kết, mẫu hồ sơ. | Khôi phục dùng được; có bản ngoài ổ chính. `app/KE_HOACH_HOAN_THIEN_DU_AN_2026-08.md:160`. |
| Tải đồng thời hỏi đáp, ingest, xuất tài liệu và job AI trên cấu hình 6GB. | Đo RAM/RSS, độ trễ, restart, hàng đợi; không chỉ kiểm tra HTTP 200. `app/ecosystem.config.js:15`, `:17`. |
| Javis: kiểm quyền chéo người dùng, shell/plugin, MCP, scheduler sau restart, backup–restore, cập nhật có rollback. | Chưa đủ bằng chứng để thiết kế kiểm thử theo điểm gọi mã cụ thể. |

Đã thấy smoke test cho chatbot, công việc và hỏi đáp hồ sơ; một số tạo phiên admin, có gọi mạng và tải/xóa phiên. Vì vậy **không chạy nguyên trạng trong vòng chỉ đọc này**, và chúng chưa thay thế ma trận phân quyền: `app/scripts/smoke-chatbot.mjs:216`, `app/scripts/smoke-cong-viec.mjs:28`, `app/scripts/smoke-tham-dinh-hoi-dap.mjs:52`, `:106`.

**Các giả định tôi chưa kiểm chứng được**

- Production có đúng mã/cấu hình PM2 và RAM như tài liệu; HTTPS, cookie, secret, quyền tài khoản dịch vụ Windows được cấu hình ra sao.
- CSDL thực tế, quyền PostgreSQL, ACL hồ sơ, nhà cung cấp LLM và tình trạng sao lưu ngoài máy.
- Commit/version, toàn bộ chức năng và mô hình bảo mật Javis vì thư mục bị từ chối truy cập.
- Các đường khai thác, hiệu năng và điểm A/B/C qua kiểm thử thực tế; báo cáo này là rà soát mã tĩnh, chưa phải xác nhận vận hành.

---

## 2. Lượt 2A-bis — Kiểm chứng độc lập mã nguồn Javis OS (nguyên văn)

**Khuyến nghị: chọn B làm kiến trúc chính, áp dụng C có chọn lọc; chưa nên tích hợp trực tiếp toàn bộ Javis vào máy chủ nghiệp vụ.** Căn cứ quyết định là mô hình một chủ, engine có nhánh bỏ qua sandbox/phê duyệt, plugin Python chạy trong tiến trình và nhiều runtime mới vẫn được kiểm soát bằng canary. Đây là **suy luận kiến trúc**, dựa trên `server/config.py:35`, `server/claude_sdk_engine.py:850`, `server/plugins_host.py:579`, `server/config.py:463`.

Đã kiểm tra chỉ đọc trong bản sao được chỉ định; không chạy mã dự án, test, pip hay mạng; không đọc thư mục đánh giá bị cấm. Tệp `VERSION:1` ghi `0.166.2`; `.git/HEAD:1` trỏ nhánh `main`, và `.git/refs/heads/main:1` ghi `24c0c6dc0fc8d53df942968474b3e5ce401b34e5`. **Chưa kiểm chứng cây làm việc hoàn toàn trùng commit**, vì chưa đối chiếu nội dung với Git object.

**1. Bảng 17 hạng mục**

“Đã triển khai trong mã” nghĩa là thấy phần thực thi, **không đồng nghĩa đã chạy thành công hoặc đạt yêu cầu sản xuất**. Một hạng mục có thể có cả phần triển khai và phần đang phát triển.

| # | Hạng mục | Phân loại và điều **đã thấy** | **Suy luận / giới hạn** |
|---|---|---|---|
| 1 | Giấy phép | **Đã triển khai:** MIT, cho phép sử dụng, sửa đổi, phân phối; yêu cầu giữ thông báo bản quyền và giấy phép. `LICENSE:1`, `LICENSE:5`, `LICENSE:12` | Có thể kế thừa mã thuộc phạm vi giấy phép này; MIT không bảo đảm chất lượng hay phù hợp nghiệp vụ. `LICENSE:15` |
| 2 | Ngôn ngữ/deps | **Đã triển khai:** backend Python/FastAPI/Uvicorn; SDK Claude, HTTPX, MCP-related dependencies; dashboard phục vụ tệp tĩnh. Docker dùng Python 3.12 và Node 22. `requirements.txt:36`, `requirements.txt:39`, `server/main.py:337`, `Dockerfile:12`, `Dockerfile:15` | Không phải thành phần Next.js có thể ghép trực tiếp như thư viện cùng runtime. Một số dependency chỉ đặt cận phiên bản, làm bản cài có thể biến đổi. `requirements.txt:45`, `requirements.txt:50`, `requirements.txt:61` |
| 3 | Quản lý Agent | **Đã triển khai:** API liệt kê, tạo, xóa agent, quản lý tài sản; có `AgentPolicy`, `CapabilityGrant`, `AgentRunner`. `server/main.py:6799`, `server/main.py:6826`, `server/main.py:6899`, `server/agent_runtime.py:64`, `server/agent_runtime.py:107`, `server/agent_runtime.py:161` | Có quản lý agent thực; chưa đủ căn cứ xem mọi nhánh agent mới đã ổn định. Main mô tả runtime này là Phase 11. `server/main.py:122` |
| 4 | Skill Registry | **Đã triển khai:** quét metadata/frontmatter, liệt kê manifest, xếp ưu tiên, cắt theo ngân sách; có API CRUD/toggle. `server/skill_router.py:208`, `server/skill_router.py:293`, `server/skill_router.py:336`, `server/skill_router.py:365`, `server/main.py:7101`, `server/main.py:7176` | Là registry dựa trên tệp và metadata; chưa kiểm chứng quy trình duyệt skill phù hợp cơ quan. Các điểm thực thi được xác định tại `server/skill_router.py:256`, `server/main.py:7176`. |
| 5 | Workflow Engine | **Đã triển khai; phần mới đang phát triển/canary:** có lưu workflow, chạy, xem lịch sử, resume; runtime graph có policy/admission/result. `server/main.py:8596`, `server/main.py:10332`, `server/main.py:10348`, `server/main.py:10365`, `server/workflow_runtime.py:71`, `server/workflow_runtime.py:119` | Không chỉ là prompt mẫu. Tuy nhiên chưa kiểm chứng khả năng thay thế workflow hành chính có giao dịch, SLA và kiểm soát người duyệt; graph runtime được đánh dấu Phase 10. `server/main.py:131` |
| 6 | Scheduler | **Đã triển khai:** startup scheduler, tick mỗi 30 giây, gọi loop và learning; task dispatcher khởi động riêng. `server/main.py:12015`, `server/main.py:12047`, `server/main.py:12067`, `server/main.py:12070`, `server/main.py:12074`, `server/main.py:12079` | Là scheduler trong ứng dụng; chưa kiểm chứng HA hoặc điều phối nhiều instance. Vòng tick nằm trong tiến trình app. `server/main.py:12067` |
| 7 | Second Brain | **Đã triển khai:** tạo cấu trúc brain gồm sources/agents/workflows/memory/wiki; memory index dùng SQLite/FTS. `server/main.py:6255`, `server/memory_index.py:102`, `server/memory_index.py:115`, `server/memory_index.py:150` | Phù hợp mô hình kho tri thức cá nhân/agent; phân chia brain chưa chứng minh cách ly dữ liệu theo quyền cán bộ. Đối chiếu mô hình auth tại `server/config.py:35`. |
| 8 | LLM Wiki/tự học | **Đã triển khai; một phần kiểm soát triển khai:** learning nhận hội thoại/job, có tick, ghi tệp, xác minh skill; có nút học thủ công memory/wiki. Curator mặc định tắt. `server/learn.py:450`, `server/learn.py:533`, `server/learn.py:585`, `server/learn.py:640`, `server/learn.py:767`, `server/main.py:5804` | “Tự học” ở đây là tạo/chỉnh tài sản tri thức, không có bằng chứng là huấn luyện lại trọng số model. Các thao tác thấy được là ghi nội dung và xác minh đầu ra. `server/learn.py:767`, `server/learn.py:1139` |
| 9 | Knowledge Graph | **Đã triển khai:** quét Markdown, lấy `[[wikilink]]`, dựng nodes/edges; mặc định giới hạn 2.000 tệp mỗi lần gọi. `server/graph_builder.py:32`, `server/graph_builder.py:58`, `server/graph_builder.py:95`, `server/graph_builder.py:114` | Đây là đồ thị liên kết tài liệu; chưa có căn cứ coi là ontology nghiệp vụ, entity resolution hay cơ sở dữ liệu graph suy luận. Cạnh được tạo trực tiếp từ wikilink. `server/graph_builder.py:116` |
| 10 | Chatbot/UI | **Đã triển khai:** dashboard tĩnh, lịch sử hội thoại, chọn model theo phiên; backend có luồng trả lời cho chatbot/kênh ngoài. `server/main.py:341`, `server/main.py:17225`, `server/main.py:19235`, `server/main.py:19249` | Có thể học mẫu UX chat; chưa kiểm chứng tiếp cận, tải 219 người dùng hay khả năng ghép phiên đăng nhập QL-HTKT. Cổng auth hiện nằm ở Javis. `server/main.py:289` |
| 11 | MCP & tích hợp | **Đã triển khai:** hub gọi `mcp_catalog.allowed(...)` trước thực thi; plugin có gate `min_mode`; MCP stdio chạy subprocess. `server/mcp_hub.py:212`, `server/mcp_hub.py:220`, `server/plugins_host.py:837`, `server/mcp_client.py:321` | Quyền được thực thi trong hub/wrapper; không tự bao phủ mọi công cụ native hoặc shell của engine. Có đường hướng dẫn gọi MCP native trực tiếp. `server/mcp_hub.py:509` |
| 12 | Quản lý model | **Đã triển khai; router mới cần thận trọng:** chọn provider/model theo phiên; có candidate, routing request, policy/router; có tích hợp Ollama. `server/main.py:17225`, `server/model_router.py:46`, `server/model_router.py:94`, `server/model_router.py:165`, `server/ollama_local.py:199` | Có quản lý nhiều backend; chưa kiểm chứng định tuyến tối ưu chi phí/chất lượng. Main đánh dấu router là Phase 12. `server/main.py:130` |
| 13 | Bộ nhớ hội thoại | **Đã triển khai:** SQLite sessions/messages, FTS5, WAL; có compact hội thoại. `server/sessions.py:78`, `server/sessions.py:106`, `server/sessions.py:222`, `server/sessions.py:400`, `server/main.py:21944` | Có cơ chế bền vững hơn lưu RAM đơn thuần; vẫn cần đánh giá retention và cách ly người dùng trước dùng chung. Schema phiên và auth chủ hiện tại: `server/sessions.py:78`, `server/config.py:35`. |
| 14 | Phân quyền | **Đã triển khai mô hình một chủ:** một cấu hình username/password; có API token và scope. Team members mang `agent_key`, vai trò member/leader. `server/config.py:35`, `server/main.py:1662`, `server/team_store.py:224`, `server/team_store.py:231` | **Không được đồng nhất “team agent” với nhiều cán bộ/vai trò.** Chưa kiểm chứng RBAC/SSO/ACL tài liệu cho 219 người. Migration còn ghi rõ mô hình một tài khoản chủ. `server/team_store.py:152` |
| 15 | Quản lý dữ liệu | **Đã triển khai:** state/settings theo thư mục cấu hình; hội thoại SQLite; brain theo thư mục; có mã hóa các trường secret được khai báo. `server/config.py:17`, `server/config.py:23`, `server/sessions.py:78`, `server/main.py:6255`, `server/config.py:945` | Không có căn cứ coi toàn bộ dữ liệu đã mã hóa hoặc được quản trị như hồ sơ công vụ; mã hóa thấy được áp dụng theo danh sách trường. `server/config.py:520`, `server/config.py:551` |
| 16 | Sao lưu/phục hồi | **Đã triển khai một phần:** đồng bộ brain hai chiều qua Git mirror, phục hồi brain thiếu, có revert lần học; updater có rollback mã nguồn. `server/main.py:5372`, `server/main.py:5373`, `server/git_brain.py:901`, `server/git_brain.py:475`, `server/updater.py:564` | **Chưa kiểm chứng phục hồi toàn hệ thống.** Backup brain không tự chứng minh backup settings, SQLite hội thoại và khóa mã hóa. Các vị trí riêng: `server/config.py:23`, `server/sessions.py:78`, `server/secrets_store.py:13`. |
| 17 | Kiểm thử/ổn định | **Đã triển khai kiểm thử; kết quả chưa kiểm chứng:** CI có compile, import app, test JS và Python; có kiểm thử auth/secret/MCP/CSRF/plugin. ` .github/workflows/ci.yml:69`, `.github/workflows/ci.yml:81`, `.github/workflows/ci.yml:96`, `.github/workflows/ci.yml:110` | Không suy từ “có test” thành “đã đạt ổn định”. CI có ghi nhận nguy cơ test pytest bị bỏ qua nếu thiếu dependency; runtime còn nhiều canary. `.github/workflows/ci.yml:62`, `server/config.py:463`, `server/config.py:496` |

Không có lý do gán toàn bộ các hạng mục trên là **“Chỉ mô tả”**: đã thấy mã tương ứng. Ngược lại, những yêu cầu như đa người dùng cơ quan, HA, phục hồi toàn hệ thống và tải thực tế thuộc **“Chưa kiểm chứng”**, không nên mặc nhiên tuyên bố đã có.

**2. Mô hình an ninh**

| Vấn đề | **Đã thấy** | **Suy luận cho môi trường Sở** |
|---|---|---|
| Quyền engine/shell | Claude SDK dùng `bypassPermissions` khi không có whitelist; nhánh có whitelist dùng permission gate. Codex mặc định `sandbox=None`, dẫn tới cờ bỏ qua approvals và sandbox. `server/claude_sdk_engine.py:843`, `server/claude_sdk_engine.py:850`, `server/claude_cli.py:1550`, `server/claude_cli.py:1577` | Quyền hiệu lực có thể rộng bằng tài khoản chạy dịch vụ. Nếu tài khoản đó đọc được dữ liệu QL-HTKT, engine có khả năng tác động vượt phạm vi MCP hub. Đây là suy luận từ các nhánh bypass vừa dẫn. |
| Tool chạy lệnh riêng | Có `suggest/auto/full`, kiểm tra cwd, lọc env; allowlist `auto` chứa Python, Node, npm run/exec. `server/run_command.py:77`, `server/run_command.py:97`, `server/run_command.py:123`, `server/run_command.py:162`, `server/run_command.py:205` | Allowlist tên chương trình và cwd **không phải sandbox hệ điều hành**: interpreter/script vẫn có thể thực hiện I/O theo quyền tài khoản. Vì vậy không xem `auto` là bảo đảm chỉ đọc. `server/run_command.py:79`, `server/run_command.py:97` |
| Plugin người dùng | Cho phép user plugin theo mặc định ở cấp máy; vẫn yêu cầu manifest enabled. Loader gọi `exec_module`, rồi `register(ctx)` ngay trong tiến trình. Gate tool chạy sau đó trong wrapper. `server/plugins_host.py:115`, `server/plugins_host.py:124`, `server/plugins_host.py:579`, `server/plugins_host.py:693`, `server/plugins_host.py:697`, `server/plugins_host.py:837` | Mã cấp module/register đã chạy trước gate từng tool. Plugin độc hại hoặc lỗi có thể đọc secret, sửa state hoặc làm hỏng dịch vụ theo quyền tiến trình. Không có cách ly tiến trình tại đường nạp đã thấy. |
| MCP subprocess | Tiến trình MCP nhận bản sao `os.environ` rồi bổ sung env riêng. `server/mcp_client.py:319`, `server/mcp_client.py:320`, `server/mcp_client.py:321` | Connector cần được coi là mã có đặc quyền; có nguy cơ nhận cả bí mật môi trường ngoài nhu cầu của connector. |
| Updater/chuỗi cung ứng | Updater fetch repo upstream nhánh `main`, merge `FETCH_HEAD`, pip requirements, restart/health và có rollback. `server/updater.py:254`, `server/updater.py:283`, `server/updater.py:286`, `server/updater.py:371`, `server/updater.py:564` | Chưa thấy bước xác minh chữ ký release trong đường cập nhật đã đọc. Nhánh động và dependency cận phiên bản làm tăng phạm vi thay đổi; rollback mã không chứng minh hoàn tác tác động dữ liệu. `requirements.txt:50`, `requirements.txt:61`, `server/updater.py:564` |
| Updater Docker | Compose dùng image `latest`; Watchtower gắn Docker socket, token có giá trị mặc định; polling tự động mặc định tắt. `docker-compose.yml:24`, `docker-compose.yml:105`, `docker-compose.yml:108`, `docker-compose.yml:113` | Docker socket là điểm đặc quyền lớn. Nếu dùng cách triển khai này, phải đưa updater vào quy trình phát hành có kiểm soát, thay token và ghim artifact. Không nên kết luận Javis mặc định tự cập nhật liên tục: polling đang mặc định tắt. |
| Zalo cá nhân | Dùng `javis-zalo` từ tarball tag riêng, bên dưới là `zca-js`, đăng nhập QR và kết nối Web cá nhân. Có nhánh `zalo_bot` riêng. `server/zalo_cli.py:5`, `server/zalo_cli.py:8`, `server/zalo_cli.py:21`, `server/zalo_cli.py:43`, `server/config.py:212` | **Không có căn cứ gọi Zalo cá nhân là API chính thức được Zalo bảo đảm.** npm “chính thức” trong comment chỉ nói nguồn phát hành thư viện. Nên coi connector cá nhân là phụ thuộc bên thứ ba; chưa kiểm chứng điều khoản/chấp thuận của Zalo. |
| Dashboard/auth/CSRF | Có auth middleware, session cookie HttpOnly/SameSite=Lax, 2FA, rate-limit/audit; CSRF kiểm tra Origin/Host, thêm Sec-Fetch-Site cho GET có tác dụng phụ và guard WebSocket. `server/main.py:289`, `server/main.py:1346`, `server/main.py:1530`, `server/config.py:1409`, `server/web_security.py:47`, `server/web_security.py:204`, `server/web_security.py:227`, `server/main.py:282` | Có phòng vệ thực, không thể nói “dashboard không bảo mật”. Tuy nhiên đây vẫn là cổng một chủ; chưa kiểm thử xuyên qua reverse proxy hoặc chứng minh không còn đường bypass. `server/config.py:35`, `server/main.py:296` |
| Lưu bí mật | Fernet, khóa tại `STATE_DIR/.secret_key`, thử chmod 0600. Hàm `encrypt()` có fallback `plain:` nếu không khởi tạo được mã hóa; có hàm `encrypt_required()` riêng. `server/secrets_store.py:13`, `server/secrets_store.py:35`, `server/secrets_store.py:46`, `server/secrets_store.py:52`, `server/secrets_store.py:80` | Mã hóa at-rest có ích khi chỉ lộ tệp dữ liệu; không bảo vệ trước plugin cùng tiến trình hoặc tài khoản đọc được cả khóa. Chưa kiểm chứng Windows ACL; không xem chmod 0600 là bằng chứng ACL đã chặt. |

**3. Tài nguyên và máy 6GB**

**Đã thấy từ mã:** một dịch vụ Uvicorn; task worker mặc định 2, tối đa cấu hình 8; pool MCP giữ session/subprocess và được làm nóng khi startup; scheduler và learning chạy nền. Đây không phải mặc định “một Python process rồi không có gì thêm”. `server/main.py:22727`, `server/tasks.py:154`, `server/mcp_client.py:487`, `server/main.py:22264`, `server/main.py:12067`.

**Suy luận về tiến trình:**

- Bản tối giản dùng API từ xa: một Python server cùng các tác vụ asyncio/thread; không phải mỗi tác vụ nền là một process. `server/main.py:22727`, `server/tasks.py:155`.
- Mỗi connector stdio có thể thêm một process hoặc cây process; CLI agent đang chạy cũng làm tăng số tiến trình. Pool không nhất thiết chỉ tồn tại trong lúc người dùng gọi tool. `server/mcp_client.py:321`, `server/mcp_client.py:487`, `server/main.py:22265`.
- Docker còn có thể thêm cloudflared, Watchtower và chi phí Linux/container trên Windows. `docker-compose.yml:72`, `docker-compose.yml:100`, `Dockerfile:15`.

**Không thể suy ra RSS đáng tin cậy chỉ từ mã nguồn.** Có thể dùng khoảng dự phòng dưới đây để lập kế hoạch, nhưng đây là **ước lượng kỹ thuật chưa đo**, không phải benchmark của Javis:

| Cấu hình giả định | RAM tăng thêm dự phòng | Căn cứ cấu trúc |
|---|---:|---|
| API từ xa, ít connector, không model local | Khoảng **0,3–0,8GB** | Python web server, SQLite/cache và tác vụ nền. `server/main.py:22727`, `server/sessions.py:371` |
| Có CLI agent và vài MCP stdio, tác vụ đồng thời | Khoảng **1–3GB hoặc hơn** | Worker đồng thời và cây subprocess; không có mức RAM cố định được bảo đảm. `server/tasks.py:154`, `server/mcp_client.py:321` |
| Có model local | Không đưa vào phương án dùng chung hiện tại | Ollama quản lý model nạp trong RAM/VRAM; nhu cầu phụ thuộc model. `server/ollama_local.py:199`, `server/ollama_local.py:303` |

**Kết luận suy luận:** máy 6GB có thể đủ cho một thử nghiệm tối giản, nhưng **chưa đủ căn cứ chấp thuận dùng chung sản xuất với QL-HTKT**. Con số 219 tài khoản không cho biết số phiên đồng thời, còn worker và connector có thể tạo tải nền độc lập. Căn cứ tải nền: `server/tasks.py:154`, `server/main.py:12074`, `server/main.py:12079`, `server/main.py:22265`.

**4. Thành phần đáng kế thừa và không nên kế thừa nguyên trạng**

Các lựa chọn sau là **suy luận thiết kế từ mã đã thấy**:

| Đáng kế thừa | Cách áp dụng |
|---|---|
| Skill metadata, chỉ nạp nội dung khi cần, ngân sách context | Dùng registry có phiên bản và phê duyệt nội bộ; học cơ chế lọc/xếp ưu tiên/cắt ngân sách. `server/skill_router.py:293`, `server/skill_router.py:336`, `server/skill_router.py:365` |
| Gateway công cụ kiểm quyền trước gọi | Giữ kiểm tra tập trung như `mcp_catalog.allowed`, bổ sung danh tính cán bộ, quyền tài nguyên và audit của QL-HTKT. `server/mcp_hub.py:220` |
| Ghi có xác nhận, idempotency, reconcile trạng thái không rõ | Đáng học cho thao tác nghiệp vụ; hiện phần này có canary và cấu hình mặc định đóng, cần đọc sâu trước chép mã. `server/config.py:483`, `server/config.py:494`, `server/main.py:3234`, `server/main.py:3241`, `server/main.py:22254` |
| Memory có nguồn, truy hồi FTS, hội thoại bền vững | Áp dụng cùng ACL/retention theo người dùng; không tự động dùng chung memory. `server/memory_index.py:150`, `server/config.py:468`, `server/sessions.py:222`, `server/sessions.py:400` |
| Wiki Markdown, wikilink, lịch sử thay đổi và revert | Phù hợp kho tri thức có người duyệt; bảo toàn nguồn và khả năng hoàn tác. `server/graph_builder.py:114`, `server/git_brain.py:419`, `server/git_brain.py:475` |
| Canary, quota và bật dần năng lực | Dùng để triển khai từng capability, theo dõi trước khi mở rộng. `server/config.py:496`, `server/config.py:503`, `server/config.py:504` |

**Không nên kế thừa nguyên trạng:** bypass quyền engine; plugin Python tùy ý trong server nghiệp vụ; auth một chủ cho nhiều cán bộ; connector Zalo cá nhân làm kênh nghiệp vụ chính; cập nhật trực tiếp từ nhánh động; fallback lưu secret dạng plain. Căn cứ lần lượt: `server/claude_sdk_engine.py:850`, `server/plugins_host.py:579`, `server/config.py:35`, `server/zalo_cli.py:8`, `server/updater.py:254`, `server/secrets_store.py:52`.

Về MIT: được phép lấy và sửa mã nhưng phải giữ thông báo liên quan; cần rà giấy phép dependency và các phần mã kế thừa riêng. Ví dụ `server/sessions.py:11` ghi nguồn mẫu thiết kế từ Hermes; MIT cấp dự án không thay thế việc rà nguồn gốc từng phần. `LICENSE:12`.

**5. Chấm A/B/C**

Đây là **điểm đánh giá kiến trúc có điều kiện**, không phải kết quả benchmark. Điểm cao là tốt; “chi phí” cao nghĩa là ít chi phí hơn.

B được hiểu là orchestrator nhỏ, dùng API từ xa, thực thi qua API nghiệp vụ của QL-HTKT. C được hiểu là kế thừa chọn lọc rồi tích hợp vào kiến trúc hiện hữu, không bê nguyên engine/plugin host.

| Tiêu chí | Trọng số | A: tích hợp trực tiếp | B: QL-HTKT + orchestrator riêng | C: kế thừa chọn lọc |
|---|---:|---:|---:|---:|
| Bảo mật | 25% | 1 | 4 | 4 |
| Tương thích | 20% | 2 | 5 | 4 |
| Hiệu quả | 15% | 3 | 4 | 4 |
| Mở rộng | 15% | 2 | 4 | 4 |
| Chi phí | 10% | 3 | 3 | 4 |
| Bảo trì | 10% | 2 | 4 | 3 |
| UX | 5% | 4 | 4 | 4 |
| **Tổng có trọng số** | **100%** | **2,05/5** | **4,10/5** | **3,90/5** |

Căn cứ cho điểm:

- **A:** có nhiều chức năng sẵn nên UX/hiệu quả ban đầu khá; bị trừ mạnh bởi một chủ, quyền engine rộng và thêm runtime Python/Node cùng cây connector. `server/config.py:35`, `server/claude_sdk_engine.py:850`, `Dockerfile:12`, `Dockerfile:15`, `server/mcp_client.py:321`.
- **B:** điểm cao là **suy luận có điều kiện** khi orchestrator dùng quyền hiện có của QL-HTKT, giới hạn công cụ và tách tài khoản thực thi. Nhu cầu tách ranh giới này xuất phát từ bypass engine và plugin cùng tiến trình của Javis. `server/claude_cli.py:1577`, `server/plugins_host.py:579`.
- **C:** tiết kiệm phát triển nhờ registry, FTS và mẫu gateway có sẵn; bảo trì thấp hơn B vì đơn vị phải sở hữu phần mã tách ra, nhất là runtime còn canary. `server/skill_router.py:365`, `server/sessions.py:222`, `server/mcp_hub.py:220`, `server/config.py:496`.

**Quyết định đề xuất:** B là nền tảng, C là nguồn tham khảo/kế thừa từng phần. Chưa triển khai A trên máy chủ QL-HTKT hiện tại. Đây là kết luận suy luận từ ranh giới quyền, mô hình chủ và cấu trúc tiến trình đã dẫn; không phải kết luận Javis không có giá trị kỹ thuật.

**Giả định chưa kiểm chứng**

- Cây làm việc sạch và khớp hoàn toàn commit; mới xác nhận phiên bản và ref. `VERSION:1`, `.git/refs/heads/main:1`.
- RSS, tải đồng thời, độ trễ và bộ nhớ còn trống của QL-HTKT; các khoảng RAM trên chỉ là dự phòng từ cấu trúc worker/subprocess. `server/tasks.py:154`, `server/mcp_client.py:321`.
- Kết quả CI, độ bao phủ, tải dài hạn và hành vi thực trên Windows; chỉ đọc workflow kiểm thử. `.github/workflows/ci.yml:69`, `.github/workflows/ci.yml:110`.
- ACL Windows, cấu hình reverse proxy, mức quyền tài khoản dịch vụ và phạm vi secret thực tế. `server/secrets_store.py:35`, `server/main.py:289`, `server/mcp_client.py:319`.
- Phục hồi đầy đủ brain, SQLite, settings, media và khóa mã hóa trong một lần diễn tập. `server/main.py:5373`, `server/config.py:23`, `server/secrets_store.py:13`.
- Tính đúng đắn nội dung tự học và mức giảm hallucination; có pipeline không chứng minh chất lượng tri thức. `server/learn.py:533`, `server/learn.py:767`, `server/learn.py:1139`.
- Tư cách API chính thức/điều khoản của Zalo cá nhân và giấy phép toàn bộ dependency; chưa truy cập mạng theo ràng buộc. `server/zalo_cli.py:8`, `requirements.txt:36`.

---

## 3. Lượt 2B — Phản biện báo cáo vòng 1 của Claude (nguyên văn)

**Kết luận: CHƯA ĐẠT để dùng trực tiếp làm cơ sở thiết kế.** Vòng 1 có định hướng hợp lý và nhiều phát hiện đúng, nhưng còn sai bằng chứng về cơ chế tự học Javis, đánh giá thiếu phân quyền/nguy cơ nhiễm độc tri thức hiện có, và chưa làm rõ tính nhất quán khi worker thực hiện hành động ghi.

Đã đọc bốn báo cáo và đối chiếu mã nguồn; không sửa tệp, đọc tệp bị cấm, mở CSDL, chạy mạng hay test. HTKT đang ở commit `8c11314`; Javis ở `24c0c6d`.

Không có nội dung đánh giá 2A trong ngữ cảnh hiện tại hoặc bốn tệp báo cáo, nên tôi không thể khẳng định điểm nào là “giữ/đổi ý so với 2A”. Dưới đây là phán quyết 2B dựa trên bằng chứng đọc được.

Quy ước đường dẫn:

- `H/` = `D:\Troly\QLHTKT\HTKT\app/`
- `J/` = `D:\Troly\QLHTKT\_research\javis-os/`
- `CB` = `H/app/api/chatbot/route.ts`

**Phán quyết C-01 … C-17**

| ID | Phán quyết | Đối chiếu và bằng chứng |
|---|---|---|
| C-01 | ĐÚNG MỘT PHẦN | Chấp nhận “chưa khảo sát production”; chưa đủ căn cứ nói “không khảo sát được”. Cấu hình repo chỉ cho biết triển khai dự kiến, không chứng minh trạng thái đang chạy: `ecosystem.config.js:6`, `:14`. |
| C-02 | ĐÚNG MỘT PHẦN | 6 GB là ràng buộc đáng kể; chưa đo nên không thể xếp chắc chắn là “lớn nhất”. HTKT đã giữ nhiều chỉ mục RAM và chạy hai instance: `H/lib/tham-dinh/hoi-dap.ts:18`, `ecosystem.config.js:14`. |
| C-03 | ĐÚNG MỘT PHẦN | Nên giữ các năng lực hiện có, nhưng RAG **lọc phạm vi, trả kèm hiệu lực**, không lọc hiệu lực trong SQL. SHA-512 không xác thực nguồn phát hành: `H/lib/rag/search.ts:66`, `:71`; `H/lib/tham-dinh/du-lieu-dutoanai.ts:18`. |
| C-04 | ĐÚNG | Model gọi tool được phép là thực thi ghi; không có giao thức xác nhận phía máy chủ: `CB:1163`, `:1265`, `:2274`. |
| C-05 | ĐÚNG | Không thấy nhật ký trước/sau trong các nhánh ghi; audit cuối lượt chỉ là `VIEW_SENSITIVE`: `CB:1044`, `:1163`, `:2240`. |
| C-06 | ĐÚNG | Có token dự phòng tại **dòng 24**, không phải 23. Chưa biết production có dùng fallback: `H/app/api/webhook/infrastructure/route.ts:24`. |
| C-07 | ĐÚNG MỘT PHẦN | Có đường gửi dữ liệu tới endpoint LLM; endpoint thực tế có thể là nội bộ, không nhất thiết luôn bên ngoài. Tool trả CCCD/lương rồi đưa kết quả vào messages: `CB:748`, `:760`, `:2275`; `H/lib/ai/cau-hinh.ts:28`, `:44`. |
| C-08 | ĐÚNG MỘT PHẦN | Thiếu kiểm thử hồi quy là đúng; gọi đó là rủi ro “lớn nhất” chưa có so sánh với ghi sai và lộ dữ liệu. Không có script test: `H/package.json:5`; có `H/lib/qd72/danh-gia.test.ts:1`. |
| C-09 | ĐÚNG MỘT PHẦN | Kết luận không tích hợp nguyên khối hợp lý. Một tài khoản admin và khả năng shell có bằng chứng; shell-capable không đồng nghĩa luôn chạy quyền Administrator: `J/server/main.py:1327`; `J/SECURITY.md:26`. |
| C-10 | ĐÚNG MỘT PHẦN | Checkpoint và dừng node ghi có thật. Nhưng khẳng định tự học **bắt buộc Git là sai**; quyền MCP còn có mặc định mở rộng cần sửa trước khi kế thừa: `J/server/workflow_runtime.py:331`; `J/server/learn.py:1790`; `J/server/mcp_catalog.py:508`. |
| C-11 | ĐÚNG MỘT PHẦN | Đồng ý loại khỏi phạm vi tích hợp cơ quan. Tuy nhiên, loại engine thuê bao cá nhân là quyết định quản trị; chưa có bằng chứng hợp đồng/điều khoản trong phạm vi này để kết luận vi phạm. Khả năng thực thi trên host được xác nhận: `J/SECURITY.md:26`. |
| C-12 | ĐÚNG MỘT PHẦN | Hoãn KG tổng quát hợp lý; “chỉ cần” đồ thị văn bản chưa được chứng minh bằng yêu cầu và bộ câu hỏi. Javis graph chủ yếu là wikilink; HTKT hiện có chuỗi `thayTheBoi`: `J/server/graph_builder.py:2`; `H/prisma/schema.prisma:3005`. |
| C-13 | ĐÚNG | Là lựa chọn khởi đầu hợp lý. HTKT đã có vòng điều phối tool; mười vai trò không đòi mười tiến trình: `CB:2195`, `:2274`. Đây là quyết định thiết kế, chưa phải kết quả benchmark. |
| C-14 | ĐÚNG MỘT PHẦN | Cùng stack TS và PostgreSQL hợp lý; chưa đủ thiết kế để chốt worker/schema riêng. Client DB hiện không thể hiện tài khoản và quyền riêng cho worker: `H/lib/db.ts:17`. Tham chiếu “07” không nằm trong bốn báo cáo được cung cấp. |
| C-15 | ĐÚNG MỘT PHẦN | MCP chỉ đọc có thể là adapter tốt cho client ngoài; không tự bảo đảm phân quyền hoặc chống xuất dữ liệu. Quyền phải được thực thi tại từng lời gọi: đối chiếu `J/server/mcp_hub.py:218`; HTKT có quyền dựa DB tại `H/lib/auth.ts:30`. |
| C-16 | ĐÚNG MỘT PHẦN | Email cứng có thật nhưng không bao trùm toàn bộ quyền chatbot. Tool sửa/thêm cán bộ dùng `canManageCanBo`, hàm này lại chứa danh sách định danh cứng: `CB:1007`, `:1088`; `H/lib/auth.ts:102`, `:109`. |
| C-17 | ĐÚNG | Cần kiểm chứng trước khi dùng làm căn cứ. Bằng chứng mạnh hơn con số “0”: chính tệp dữ liệu ghi đây là **đánh giá nháp do trợ lý đề xuất**: `H/prisma/hieu-luc-vbpl.json:2`. |

**Phán quyết S1 … S10**

| ID | Phán quyết | Đối chiếu và bằng chứng |
|---|---|---|
| S1 | ĐÚNG | Có fallback; báo cáo nói thiếu việc GET không xác thực còn công bố token mặc định trong hướng dẫn/ví dụ: `H/app/api/webhook/infrastructure/route.ts:24`, `:130`, `:136`. |
| S2 | ĐÚNG | Các nhánh ghi thực thi trực tiếp sau kiểm tra quyền, không có xác nhận gắn với payload: `CB:1044`, `:1163`, `:1265`. |
| S3 | ĐÚNG MỘT PHẦN | Đúng là thiếu trước/sau. Nhưng “chỉ ghi VIEW_SENSITIVE” khiến người đọc tưởng luôn có audit: nhánh audit nằm sau khi model kết thúc bình thường, còn hết vòng lặp đi nhánh khác: `CB:2222`, `:2240`, `:2285`. |
| S4 | ĐÚNG MỘT PHẦN | Có khả năng gửi dữ liệu cá nhân và hồ sơ tới LLM. 14.000 ký tự chỉ giới hạn phần nội dung đoạn trích, **không phải tổng request**; còn danh mục và lịch sử: `H/lib/tham-dinh/hoi-dap.ts:187`; `H/app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts:69`, `:105`. |
| S5 | ĐÚNG MỘT PHẦN | Đúng với một số nhánh admin; cần bao gồm cả các allowlist định danh ngoài chatbot: `CB:748`, `:1007`; `H/lib/auth.ts:95`, `:102`, `:118`. |
| S6 | ĐÚNG MỘT PHẦN | Số 64 tệp route đúng; kết quả quét từ khóa có thể tái lập. Nhưng không suy ra “hiện ổn”: cùng tệp webhook có POST kiểm token và GET công khai. Middleware cũng không bảo vệ toàn bộ API: `H/middleware.ts:48`, `:94`; webhook `route.ts:130`. |
| S7 | ĐÚNG | Chỉ thấy một tệp `.test/.spec` trong mã ứng dụng khi loại dependency/build; không có script test. Cần phân biệt với smoke/healthcheck: `H/package.json:5`; `H/lib/qd72/danh-gia.test.ts:1`. |
| S8 | ĐÚNG MỘT PHẦN | Đếm JSON đúng: 123 còn hiệu lực, 3 cần kiểm chứng, 0 hết hiệu lực. Đây là **danh mục trong repo**, chưa phải dữ liệu DB đang phục vụ. Tệp tự ghi nhãn nháp: `H/prisma/hieu-luc-vbpl.json:2`. |
| S9 | ĐÚNG MỘT PHẦN | Mặc định HTKT 10% có bằng chứng: `H/lib/tham-dinh/kiem-tra-du-toan.ts:52`. Phía DuToanAI 8% và căn cứ áp dụng mới dẫn báo cáo thứ cấp; chưa đủ để kết luận cần thống nhất thành một mức cố định. |
| S10 | CHƯA ĐỦ BẰNG CHỨNG | Hàm HTKT thực sự tra theo bậc: `H/lib/tham-dinh/du-lieu-dutoanai.ts:111`. Nhưng bản DuToanAI được dẫn không thuộc hai cây mã đối chiếu này; nhất quán với một hàm khác cũng chưa chứng minh đúng nghiệp vụ cho mọi bảng. |

**Những chỗ nói quá, nói thiếu và sai số liệu**

1. **Sai cơ chế tự học Javis — cần sửa ngay.**  
   `J/server/learn.py:10` còn mô tả bắt buộc Git, nhưng `:1790–1797` nói rõ Git không còn bắt buộc và tính `allow_write` không kiểm tra Git. Đây là trường hợp báo cáo dựa vào đầu tệp thay vì nhánh thực thi. Không được dùng Git như bảo đảm luôn có hoàn tác.

2. **MCP ba mức quyền chưa đủ an toàn để sao chép.**  
   Quyền không hợp lệ mặc định thành `full`; mode không hợp lệ cũng có trần `full`. Tool không trúng quy tắc/heuristic có thể rơi về `read`: `J/server/mcp_catalog.py:501–509`. Có kiểm quyền thật tại hub, nhưng cần đánh giá chất lượng phân loại và mặc định, không chỉ xác nhận tồn tại hàm `allowed()`.

3. **“Chưa có học/tri thức có duyệt” bỏ sót một cơ chế quan trọng.**  
   HTKT đang lấy câu trả lời LIKE, lọc bằng heuristic, rồi chèn vào **system prompt**: `CB:1861–1903`, `:2181–2186`. Đây chưa phải wiki được duyệt, nhưng đã là cơ chế tái sử dụng tri thức cần quản lý nguồn gốc, thu hồi và quyền truy cập.

4. **“Che dữ liệu nhạy cảm” đang được diễn đạt rộng hơn mã.**  
   Hàm che hiện xử lý số điện thoại và CCCD; không che tổng quát họ tên, email, ngày sinh, lương hoặc nội dung hồ sơ: `CB:1934–1947`. Audit còn ghi câu hỏi thô rút gọn: `CB:2245`.

5. **Không nên gọi module “hoàn thiện” chỉ vì đọc thấy mã.**  
   Trạng thái phù hợp là “đã có triển khai, chưa xác nhận vận hành/độ đúng”. Điều này đặc biệt quan trọng với thẩm định và căn cứ pháp lý.

Kết quả đếm tĩnh tại bản hiện có:

| Hạng mục | Báo cáo | Đối chiếu |
|---|---:|---|
| HTKT route/model/SQL thủ công | 64 / 140 / 60 | Khớp |
| Chatbot tool/dòng | 21 / 2.325 | Khớp |
| Dependency trực tiếp Javis | 19 | Khớp số dòng khai báo requirement |
| Tệp Python server Javis | 184 tệp | Không tái lập: 178 tệp `.py` trực tiếp; 197 nếu đệ quy |
| Dòng Python server | ~125.000 | 124.927 nếu đệ quy |
| Dòng JS dashboard | ~44.700 | 44.677 trực tiếp; 45.087 nếu đệ quy |
| Test Javis | 519 tệp, ~117.000 dòng | 519 `test_*.py` có 114.871 dòng; toàn bộ 529 `.py` trong tests có 116.992 dòng |
| Commit Javis | 1.275; 394 từ 15/9 | Khớp lịch sử Git cục bộ |
| Token webhook | dòng 23 | Thực tế dòng 24 |

Các tổng đếm thư mục không có một vị trí `tệp:dòng` đại diện; cần ghi rõ glob, phạm vi đệ quy và cách đếm. Báo cáo đang trộn các phạm vi.

394 commit trong khoảng một tháng cho thấy thay đổi dày, **không trực tiếp chứng minh API nội bộ kém ổn định**. Cần dẫn thay đổi hợp đồng cụ thể.

**Xung đột kiến trúc và rủi ro cần bổ sung**

- **Ghi thành công nhưng người dùng nhận lỗi/chưa hoàn tất.** DB được cập nhật trước khi lượt LLM kết thúc. Sau đó model/provider có thể lỗi hoặc hết năm vòng; người dùng thử lại có nguy cơ thực hiện lại hành động. Bằng chứng: `CB:1163`, `:2215`, `:2285`. Thiếu xác nhận là một phần; còn thiếu idempotency và biên giao dịch.

- **Ghi đè cập nhật đồng thời.** Nhánh lương đọc rồi update theo ID, không thấy điều kiện phiên bản của dữ liệu đã đọc: `CB:1097`, `:1163`. Khi thêm preview/xác nhận, khoảng cách thời gian càng lớn. Hoàn tác bằng cách chép bản cũ cũng có thể ghi đè thay đổi hợp lệ của người khác.

- **Audit không bảo đảm đi cùng mutation.** Audit ghi sau phản hồi model và tự nuốt lỗi; helper cũng nuốt lỗi: `CB:2240`; `H/lib/audit.ts:15`. Cần mutation và audit nghiệp vụ nằm cùng transaction, với định danh đối tượng cụ thể.

- **Quyền chatbot chưa đồng nhất với quyền nghiệp vụ.** Danh sách tool chủ yếu chia theo `wardId`, còn quyền thực thi phân tán giữa email, role, allowlist và permission: `CB:2159`; `H/lib/auth.ts:109`, `:123`. Không thể dùng nhãn “đã có RBAC” để bỏ qua ma trận quyền từng tool.

- **Phạm vi RAG đang gắn với quyền Văn phòng Sở.** `canAccessOffice` quyết định được đọc `NOI_BO_SO`: `CB:1652`. Không đồng nghĩa toàn bộ cán bộ Sở được đọc, cũng chưa thể hiện quyền theo từng tài liệu/phòng. Cần xác nhận chính sách trước khi gọi đây là phân quyền phù hợp.

- **LIKE có thể vượt ranh giới người dùng/phòng.** Truy vấn chỉ lọc LIKE, `isWardUser`, và không dùng tool; không lọc chủ sở hữu/phòng: `CB:1865–1869`. Có heuristic loại dữ kiện động, nhưng đó không phải kiểm soát quyền hoặc phê duyệt tri thức.

- **Đưa nội dung không tin cậy vào system message.** Hỏi đáp hồ sơ đã có cảnh báo injection và loại thẻ trong đoạn trích — đây là biện pháp tốt bị báo cáo nói thiếu. Tuy vậy, dữ liệu hồ sơ vẫn được gửi bằng `role: 'system'`: `H/app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts:86`, `:95`, `:105`. Cần kiểm thử đối kháng; cảnh báo trong prompt không chứng minh đã ngăn injection.

- **Schema riêng không tự tạo ranh giới bảo mật.** Cần DB role/grant riêng, quyền gọi nghiệp vụ và quyền dữ liệu theo người yêu cầu. Worker có credential rộng vẫn có thể vượt schema dự kiến.

- **Backup metadata không chứng minh phục hồi được.** Healthcheck chỉ kiểm tuổi/kích thước bản dump: `H/scripts/healthcheck.mjs:118–136`. Chưa chứng minh tính toàn vẹn, bản ngoài máy hoặc khôi phục đồng bộ DB–tệp hồ sơ.

Với máy 6 GB, báo cáo cần sửa cách lập ngân sách:

- `max_memory_restart: '500M'` là ngưỡng restart, **không phải trần cấp phát**: `ecosystem.config.js:13`.
- `NODE_OPTIONS` ở cấp ngoài `apps[]` chưa chứng minh đã được áp vào tiến trình: `ecosystem.config.js:50`.
- Hai instance có cache và tác vụ dựng chỉ mục riêng. Giới hạn ba cache chỉ áp sau khi dựng xong; nhiều thư mục có thể đang dựng đồng thời: `H/lib/tham-dinh/hoi-dap.ts:35`, `:147–155`.
- Kích thước tệp nén/đọc và số ký tự không giới hạn được toàn bộ RAM parser. Cần đo RSS, heap, buffer, PostgreSQL và áp lực paging cùng lúc.

**Phần nên giữ, phần chưa nên tích hợp và phương án thay B+**

Đồng ý giữ chatbot nghiệp vụ, gateway AI, RAG, lõi thẩm định, `CongViec`, xuất tài liệu và các kênh thông báo hiện có. Những phần trùng với Javis nên mở rộng tại chỗ; không xây thêm hệ quản lý công việc, lịch sử hội thoại, model gateway hoặc kho tài liệu song song.

Chưa nên đưa vào thiết kế ban đầu: runtime Javis nguyên khối, shell/plugin Python do người dùng cung cấp, tự cập nhật production, Zalo cá nhân, voice, KG tổng quát và tự sinh skill có thể thực thi.

Tôi đề xuất **B triển khai theo từng bước**, thay vì chốt ngay B+:

1. Tách logic tool khỏi route thành dịch vụ nghiệp vụ TS dùng chung, nhận danh tính người thực hiện và kiểm quyền tại mỗi lời gọi.
2. Hành động ghi đi qua `đề xuất → xem trước → xác nhận → thực thi`; xác nhận gắn với người dùng, payload, phiên bản đối tượng và thời hạn. Mutation, audit và khóa chống thực hiện lặp nằm cùng transaction.
3. Dùng PostgreSQL lưu job/checkpoint. Chỉ thêm worker khi có tác vụ nền cụ thể; ban đầu giới hạn đồng thời thấp và đo tài nguyên.
4. Tri thức dùng PostgreSQL làm nguồn chính; bản gốc, đề xuất, bản duyệt và nguồn gốc được quản lý rõ. Markdown/Git là bản xuất có kiểm quyền.
5. MCP là adapter cho client ngoài ở giai đoạn sau; nội bộ gọi dịch vụ nghiệp vụ trực tiếp.

Khác biệt quan trọng với B+ là **chốt quyền và tính nhất quán trước khi thêm tiến trình**, đồng thời không coi schema riêng hay giao thức MCP là biện pháp bảo mật tự thân.

**Các kiểm thử cần thực hiện sau — chưa chạy trong vòng này**

| Kiểm thử | Cách chứng minh và tiêu chí |
|---|---|
| Xác nhận hành động ghi | Model giả gọi ba tool ghi khi chưa xác nhận: không thay đổi DB. Payload bị đổi, xác nhận hết hạn hoặc khác người dùng đều bị từ chối. |
| Thực hiện lặp và cập nhật đồng thời | Gửi lại cùng action ID, làm worker chết ngay sau commit, sửa hồ sơ giữa preview và confirm: chỉ ghi một lần; phiên bản cũ phải báo xung đột. |
| Audit nguyên tử | Cố tình làm ghi audit thất bại: mutation không được commit; hành động thành công phải có actor, target, trước/sau và action ID. |
| Ma trận phân quyền | Kiểm từng tool với admin, người có permission, người trong allowlist, cán bộ phòng khác, tài khoản xã và tài khoản bị khóa. Kiểm cả quyền bị thu hồi sau khi tạo job. |
| Webhook | Thiếu/rỗng secret phải từ chối phục vụ POST; GET không công bố credential mặc định. Kiểm payload sai kiểu, timestamp cũ và phát lại sự kiện. |
| LIKE và nhiễm độc tri thức | Tạo câu trả lời LIKE chứa dữ liệu riêng/chỉ thị độc, dùng tài khoản phòng khác hỏi tương tự: không được tái sử dụng trái quyền hoặc nâng thành chỉ thị. |
| RAG và hiệu lực | Kho mẫu có văn bản hiện hành, hết hiệu lực, thay thế một phần và mốc hồ sơ khác nhau; kiểm quyền truy hồi và căn cứ được chọn theo thời điểm. |
| Injection hồ sơ | Chèn chỉ thị vào tên tệp, đoạn trích và lịch sử giả; kiểm không đổi quy tắc, không sinh hành động ghi, trích dẫn phải truy về đúng đoạn. |
| Dữ liệu gửi LLM | Dùng transport giả thu toàn bộ request chat/embedding: xác định chính xác dữ liệu, lịch sử và danh mục rời hệ thống; kiểm chính sách che/chặn. |
| Javis được tham khảo | Quyền/mode sai và tool chưa phân loại phải bị từ chối; học không Git phải có hành vi được mô tả đúng; resume không thực hiện lại side effect. |
| RAM và phục hồi | Trên môi trường mô phỏng 6 GB: hai web instance, DB, nhiều thư mục lớn và worker; đo RSS/paging/restart/độ trễ. Khôi phục backup vào môi trường cô lập rồi kiểm tính nhất quán DB–tệp. |
| Thuế và bảng tỷ lệ | Bộ mẫu có ngày áp dụng, loại công trình, giá trị sát ngưỡng bậc và nguồn quy định đã xác minh; đối chiếu kết quả mong đợi, không chỉ so hai phần mềm với nhau. |

**Claude phải sửa trước khi dùng vòng 1 làm cơ sở thiết kế:**

1. Sửa khẳng định Git bắt buộc trong tự học Javis; dẫn nhánh thực thi thay vì docstring.
2. Bổ sung mặc định `full` và phân loại heuristic của MCP; yêu cầu từ chối mặc định khi triển khai HTKT.
3. Sửa mô tả RAG: phân biệt lọc phạm vi, nhãn hiệu lực và hiệu lực theo thời điểm.
4. Bổ sung cơ chế LIKE hiện có, phạm vi chia sẻ và nguy cơ nhiễm độc tri thức.
5. Mở rộng S2–S3 thành xác nhận gắn payload, idempotency, kiểm soát đồng thời và audit nguyên tử.
6. Thay kết luận phân quyền dựa quét từ khóa bằng ma trận từng method/tool; bổ sung GET webhook công khai.
7. Sửa số liệu Javis, dòng dẫn chứng và phạm vi đếm; tách dữ liệu repo khỏi production.
8. Đánh dấu rõ dữ liệu hiệu lực là nháp; chưa chốt mức thuế hay tính đúng bảng tra khi chưa có căn cứ trực tiếp.
9. Hoàn thiện B+ bằng mô hình quyền worker, giao dịch, phục hồi và ngân sách RAM có số đo.
10. Thay nhãn “hoàn thiện” và các xếp hạng “lớn nhất” bằng mức bằng chứng cùng tiêu chí kiểm chứng.

**Phán quyết cuối: CHƯA ĐẠT làm cơ sở thiết kế; có thể giữ định hướng và các phát hiện đã được xác nhận để sửa vòng 1.**

---

## Phụ lục — Prompt đã gửi Codex

### 2A

````markdown
# Codex — Vòng 2A: Đánh giá ĐỘC LẬP (trước khi xem kết luận của Claude)

Bạn là Independent Technical Reviewer. Chế độ: CHỈ ĐỌC. Viết bằng tiếng Việt.

## Phạm vi
1. Hệ thống hiện có "QL-HTKT" (Sở Xây dựng Quảng Trị): thư mục làm việc hiện tại `D:\Troly\QLHTKT\HTKT`, mã chính ở `app/` (Next.js + Prisma + PostgreSQL). Đây là BẢN PHÁT TRIỂN trên máy Windows; production chạy trên một máy chủ Windows khác (không truy cập được).
2. Javis OS (mã nguồn đã clone, chỉ đọc): `C:\Users\sgtbi\AppData\Local\Temp\claude\d--Troly-QLHTKT-HTKT\68a7c00d-363f-452c-908a-bbc391ebf9d0\scratchpad\research\javis\repo` (Python FastAPI, commit 24c0c6d, v0.166.2).

Chủ hệ thống muốn xây "HTKT Brain AI": trợ lý AI đa Agent, bộ nhớ dài hạn (Second Brain), nghiên cứu pháp lý, hỗ trợ thẩm tra/thẩm định, quản lý công việc, tự động hoá — kế thừa tối đa chức năng đang chạy tốt. Ba phương án: A) tích hợp trực tiếp Javis OS; B) giữ nguyên hệ thống + lớp AI Orchestrator độc lập; C) kế thừa chọn lọc thành phần Javis + kiến trúc riêng.

## RÀNG BUỘC
- KHÔNG đọc `.env*`, `secrets/`, tệp `.dump`, `auth.json`, khoá/token. KHÔNG mở CSDL. KHÔNG chạy mạng, KHÔNG cài gì, KHÔNG sửa tệp.
- KHÔNG đọc thư mục `docs/htkt-brain-review/` (nếu có) — đây là vòng độc lập.
- Mọi nhận định phải có `đường_dẫn:dòng`. Phân biệt "đã thấy trong mã" và "suy luận".

## Câu hỏi (trả lời từng mục, ngắn gọn, có bằng chứng)
1. Kiến trúc thực tế của QL-HTKT: các khối AI đang có (chatbot `app/api/chatbot/route.ts`, RAG `lib/rag/`, cấu hình AI `lib/ai/cau-hinh.ts`, thẩm định `lib/tham-dinh/`, công việc, tích hợp Telegram/mail/webhook). Khối nào nên GIỮ NGUYÊN?
2. Rủi ro bảo mật/phân quyền/dữ liệu cá nhân cụ thể trong mã (xác thực API, middleware, tool ghi dữ liệu của chatbot, nhật ký, bí mật mặc định, dữ liệu gửi ra nhà cung cấp LLM, prompt injection từ tài liệu hồ sơ).
3. Nguy cơ mất dữ liệu / thoái lui khi thêm lớp AI mới.
4. Javis OS: cái gì THỰC SỰ có trong mã (không chỉ README) về Agent, Skill, Workflow, Scheduler, Second Brain/Wiki, Knowledge Graph, MCP Hub + phân quyền, đa người dùng, sao lưu, kiểm thử. Mô hình bảo mật (một chủ? quyền shell? plugin? tự cập nhật? Zalo cá nhân không chính thức?) có phù hợp cơ quan nhà nước nhiều người dùng không?
5. Chấm sơ bộ A/B/C theo trọng số: Bảo mật 25%, Tương thích 20%, Hiệu quả/ổn định 15%, Mở rộng 15%, Chi phí 10%, Bảo trì 10%, UX 5% — kèm lý do có bằng chứng. Máy chủ production theo tài liệu repo có 6GB RAM (`KE_HOACH_HOAN_THIEN_DU_AN_2026-08.md`, `lib/tham-dinh/hoi-dap.ts`).
6. Phần nào KHÔNG nên tích hợp. Kiến trúc thay thế nếu có.
7. Danh sách kiểm thử cụ thể để chứng minh/bác bỏ các nhận định trên.

Kết thúc bằng: "Các giả định tôi chưa kiểm chứng được".

````

### 2A-bis

````markdown
# Codex — Vòng 2A-bis: Kiểm chứng ĐỘC LẬP mã nguồn Javis OS

Chế độ CHỈ ĐỌC, tiếng Việt. Lượt trước bạn bị "Access is denied" với bản clone Javis; nay bản sao nằm tại:
`D:\Troly\QLHTKT\_research\javis-os` (commit 24c0c6d, v0.166.2). Thư mục làm việc của bạn là chính thư mục đó.

RÀNG BUỘC: KHÔNG đọc `D:\Troly\QLHTKT\HTKT\docs\htkt-brain-review\` (vòng độc lập). KHÔNG chạy mã/test/pip/mạng. KHÔNG sửa tệp.
Mọi nhận định có `đường_dẫn:dòng`; tách "đã thấy" và "suy luận".

Bối cảnh: cơ quan nhà nước (Sở Xây dựng), ~219 người dùng, máy chủ Windows ~6GB RAM đang chạy ứng dụng nghiệp vụ Next.js (QL-HTKT).
Câu hỏi: có nên A) tích hợp trực tiếp Javis; B) giữ QL-HTKT + Orchestrator riêng; C) kế thừa chọn lọc thành phần Javis?

Trả lời:
1. Bảng 17 hạng mục: giấy phép; ngôn ngữ/deps; quản lý Agent; Skill Registry; Workflow Engine; Scheduler; Second Brain; LLM Wiki/tự học; Knowledge Graph; chatbot/UI; MCP & tích hợp (cơ chế quyền thực thi ở đâu); quản lý model; bộ nhớ hội thoại; phân quyền (MỘT chủ hay nhiều người dùng/vai trò?); quản lý dữ liệu; sao lưu/phục hồi; kiểm thử/ổn định. Mỗi mục: Đã triển khai trong mã / Chỉ mô tả / Đang phát triển / Chưa kiểm chứng.
2. Mô hình an ninh: quyền shell của engine; plugin người dùng chạy trong tiến trình; tự cập nhật (updater) và rủi ro chuỗi cung ứng; Zalo cá nhân (API chính thức hay không); xác thực dashboard/CSRF; lưu bí mật.
3. Ước lượng tài nguyên (RAM/tiến trình nền) từ mã — có vừa chung máy 6GB không? (chỉ suy luận có căn cứ)
4. Thành phần/mẫu thiết kế ĐÁNG kế thừa (ý tưởng hoặc mã — lưu ý MIT) và thành phần KHÔNG nên.
5. Chấm lại A/B/C (thang 1–5, trọng số: Bảo mật 25, Tương thích 20, Hiệu quả 15, Mở rộng 15, Chi phí 10, Bảo trì 10, UX 5) khi đã đọc được Javis.
Kết thúc: "Giả định chưa kiểm chứng".

````

### 2B

````markdown
# Codex — Vòng 2B: Phản biện báo cáo vòng 1 của Claude

Chế độ CHỈ ĐỌC, tiếng Việt. Thư mục làm việc: `D:\Troly\QLHTKT\HTKT`.
Đọc 4 báo cáo Claude: `docs/htkt-brain-review/01-system-audit.md`, `02-javis-analysis.md`, `03-feature-gap-matrix.md`, `04-claude-review.md`.
Đối chiếu với mã nguồn `app/` và bản Javis tại `D:\Troly\QLHTKT\_research\javis-os`.
Đây là phản biện, KHÔNG phải viết lại. Bạn đã có đánh giá độc lập vòng 2A trước đó (Claude chưa trả lời) — có thể giữ hoặc đổi ý, nêu rõ.

RÀNG BUỘC: KHÔNG đọc `.env*`, `secrets/`, `*.dump`, `auth.json`; KHÔNG mở CSDL, KHÔNG chạy mạng/test, KHÔNG sửa tệp.

Yêu cầu:
1. Bảng phán quyết từng luận điểm C-01 … C-17 (04 §2) và S1 … S10 (01 §3): ĐÚNG / ĐÚNG MỘT PHẦN / SAI / CHƯA ĐỦ BẰNG CHỨNG — kèm `tệp:dòng`.
2. Giả định chưa có bằng chứng; chỗ báo cáo nói quá/nói thiếu; số liệu sai (đếm dòng, số tool, số route…).
3. Xung đột kiến trúc; nguy cơ mất dữ liệu; bảo mật/phân quyền; hiệu suất máy 6GB.
4. Chức năng trùng lặp; phần nào không nên tích hợp; kiến trúc thay thế nếu bạn thấy tốt hơn "B+" của Claude.
5. Kiểm thử cụ thể để chứng minh các nhận định.
Kết thúc: Kết luận "ĐẠT / ĐẠT CÓ ĐIỀU KIỆN / CHƯA ĐẠT" cho vòng 1 làm cơ sở thiết kế, và danh sách việc Claude phải sửa.

````


---

## 4. Vòng 4 — Codex kiểm tra lần cuối sau chỉnh sửa (nguyên văn, 21/10/2026)

> Đọc 01–13 sau khi Claude sửa theo 2B. Giải trình của Claude: 06 §5.

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN để trình chủ hệ thống quyết định định hướng.** Hồ sơ đã cải thiện đáng kể và đủ cơ sở ưu tiên **B từng bước**. Tuy nhiên, cần trình kèm các điểm chưa đóng dưới đây; chưa thể dùng hồ sơ để phê duyệt triển khai trọn gói.

Tôi chỉ đọc tài liệu và mã nguồn, không đọc các tệp bị cấm, mở CSDL, chạy mạng/test hay sửa tệp. Riêng S10, tôi đọc thêm đúng tệp DuToanAI mà giải trình 06 viện dẫn để kiểm chứng lập luận. Các thử nghiệm dưới đây là đề xuất, **chưa thực hiện**.

**1. Đối chiếu 10 yêu cầu ở vòng 2B**

“Đã sửa” trong bảng này nghĩa là **đã sửa hồ sơ**, không có nghĩa mã nguồn đã được vá. Yêu cầu gốc nằm tại [05:406–417](D:/Troly/QLHTKT/HTKT/docs/htkt-brain-review/05-codex-independent-review.md:406).

| # | Yêu cầu 2B | Kết quả | Vị trí và nhận xét |
|---|---|---|---|
| 1 | Sửa khẳng định tự học Javis bắt buộc Git | **ĐÃ SỬA** | [02:30](D:/Troly/QLHTKT/HTKT/docs/htkt-brain-review/02-javis-analysis.md:30) phân biệt docstring với nhánh thực thi `learn.py:1790–1797`. |
| 2 | Bổ sung MCP mặc định `full`, heuristic và từ chối mặc định | **ĐÃ SỬA** | 02:33; [08:51](D:/Troly/QLHTKT/HTKT/docs/htkt-brain-review/08-proposed-architecture.md:51), ADR-3. Khớp mã Javis. |
| 3 | Phân biệt lọc phạm vi, nhãn hiệu lực và hiệu lực theo thời điểm | **ĐÃ SỬA** | 01:88,138; 08:58. Không còn coi nhãn hiệu lực là bộ lọc thời điểm. Một số dòng dẫn chứng vẫn lệch. |
| 4 | Bổ sung LIKE, phạm vi chia sẻ và nhiễm độc tri thức | **SỬA MỘT PHẦN** | 01:128; 03:48; 08:57 đã nhận diện. Chưa làm rõ việc không lọc chủ sở hữu/phòng và còn lập luận sai rằng gợi ý LIKE không thể kích hoạt tool ghi. |
| 5 | Xác nhận gắn payload, idempotency, đồng thời, audit nguyên tử | **SỬA MỘT PHẦN** | [08:52](D:/Troly/QLHTKT/HTKT/docs/htkt-brain-review/08-proposed-architecture.md:52),67–68 mô tả đúng hướng. Nhưng B0 chỉ yêu cầu “câu xác nhận ở lượt sau”; bộ test chưa chứng minh đủ các bất biến. |
| 6 | Bỏ kết luận quyền từ quét từ khóa; bổ sung GET webhook | **ĐÃ SỬA** | 01:114,119; 12:13. Đã thừa nhận phải kiểm từng method/tool. Ma trận thực tế là đầu việc tương lai, phù hợp giai đoạn hồ sơ. |
| 7 | Sửa số liệu, dòng dẫn chứng, phạm vi đếm và repo/production | **SỬA MỘT PHẦN** | Số liệu chính Javis đúng khi đếm lại; 01 đã tách production chưa kiểm chứng. Vẫn còn đường dẫn/dòng sai và diễn đạt heap/RAM quá chắc chắn. |
| 8 | Hiệu lực là nháp; chưa chốt thuế và tính đúng bảng tra | **SỬA MỘT PHẦN** | 01:121–123 làm rõ nháp và thuế theo ngày/nguồn. S10 còn nhãn “không phát hiện lỗi”; kiểm thử thuế/bảng tra được hứa ở 06 nhưng chưa có trong 12. |
| 9 | Quyền worker, giao dịch, phục hồi, ngân sách RAM có số đo | **SỬA MỘT PHẦN** | 08:59,74–81 có DB role và kế hoạch đo; 11 có diễn tập phục hồi. Chưa có số đo — chấp nhận là điều kiện còn mở — nhưng giao thức nhận job, lease, phục hồi và gọi nghiệp vụ dưới danh tính người yêu cầu chưa rõ. |
| 10 | Thay “hoàn thiện”, “lớn nhất” bằng mức bằng chứng | **SỬA MỘT PHẦN** | 03:4–5 định nghĩa lại ✅ hợp lý. Nhưng 01:36–37 vẫn kết luận RAM là ràng buộc “quyết định nhất” khi chưa đo; 03 vẫn mô tả Javis tự học “có duyệt” quá rộng. |

**Tổng: 4 ĐÃ SỬA, 6 SỬA MỘT PHẦN, 0 CHƯA SỬA.** Không đồng nghĩa sáu mục còn lại đều chặn việc trình quyết định.

**2. Phán quyết về giải trình 06**

**S18 — Tôi đồng ý với Claude về việc hạ mức và rút nhận định tài liệu dở lọt vào tìm kiếm.**

Mã tạo tài liệu ở trạng thái `dang_xu_ly`, chèn chunk rồi mới đổi `san_sang`; khi bắt được lỗi thì đổi `loi`: [ingest.ts:31](D:/Troly/QLHTKT/HTKT/app/lib/rag/ingest.ts:31),65–75. Truy vấn JOIN với tài liệu và bắt buộc `trangThai = 'san_sang'`: [search.ts:70](D:/Troly/QLHTKT/HTKT/app/lib/rag/search.ts:70).

Hai điểm cần chỉnh trong giải trình:

- Chunk còn lại **vẫn có bản ghi cha**, nên gọi chính xác là “chunk của lần nạp lỗi/dở”, thay vì “mồ côi” theo nghĩa mất liên kết.
- Nếu tiến trình chết cưỡng bức, `catch` không chạy: tài liệu có thể kẹt `dang_xu_ly`. Không bị truy hồi qua hàm đã kiểm, nhưng cần chính sách phát hiện tác vụ treo, dọn hoặc thử lại.

Vì vậy, mức **Thấp** hợp lý cho rủi ro đã chứng minh trong đường tìm kiếm này. Điều đó không chứng minh ingest nguyên tử hay phục hồi đầy đủ.

**S10 — Tôi chấp nhận bằng chứng về cơ chế tra bậc; giữ ý kiến chưa đủ bằng chứng xác nhận đúng nghiệp vụ.**

HTKT lấy dòng đầu có `quyMo >= x`, vượt bảng thì lấy dòng cuối: [du-lieu-dutoanai.ts:111](D:/Troly/QLHTKT/HTKT/app/lib/tham-dinh/du-lieu-dutoanai.ts:111). Tệp DuToanAI được dẫn xác nhận các bảng 3.3, 3.4, 3.7 dùng `traBac`. Claude đã bổ sung bằng chứng trực tiếp hơn vòng trước.

Nhưng cần kiểm cả **đầu vào tra bảng**: HTKT dùng `quyMoTyDong`, hoặc mặc định từ `G / 1e9`, cho các phép đối chiếu tại [kiem-tra-du-toan.ts:788](D:/Troly/QLHTKT/HTKT/app/lib/tham-dinh/kiem-tra-du-toan.ts:788). Trong khi tệp DuToanAI phân biệt quy mô xây dựng trước thuế và quy mô nhân công. Sự giống nhau của thuật toán không xác nhận đúng cơ sở quy mô, đơn vị, ngoại lệ và thời điểm áp dụng.

Nhãn phù hợp hơn:

> **Chưa chứng minh lỗi thuật toán tra bậc; chưa xác nhận tính đúng nghiệp vụ của toàn bộ phép đối chiếu.**

Đây là đánh giá bằng chứng mã nguồn, không phải kết luận về nội dung pháp luật.

**3. Kiểm tra chéo 07–13**

| Báo cáo | Phát hiện và hệ quả |
|---|---|
| **07 — Chấm điểm** | Tổng trọng số 100%; các tổng **1,95 / 4,15 / 3,10 đều đúng**. Hai phép tính độ nhạy ở dòng 45–46 cũng đúng. Tuy nhiên, A/B/C đã được định nghĩa lại nên không thể dùng bảng điểm Codex làm xác nhận định lượng cho cùng ba phương án. Câu “chênh lệch chỉ do định nghĩa” tại dòng 40 chưa được chứng minh bằng chấm lại cùng rubric. |
| **07 — C chọn lọc** | C bị trừ điểm vì MCP/plugin nhưng lại được cộng UX nhờ voice/graph. Với C chỉ lấy một số module, cả chi phí rủi ro lẫn lợi ích này đều phụ thuộc **module thực sự chọn**. Cần chốt danh mục trước khi chấm. |
| **07 — Độ nhạy** | Dòng 47: “B chỉ mất vị trí số 1 nếu…” vượt quá hai kịch bản đã khảo sát. B còn có thể đổi hạng do công phát triển, chất lượng workflow hoặc chi phí vận hành thực tế. Dòng 41 dẫn “11 — bảng bất đồng”, nhưng 11 không có bảng đó. |
| **08 — ADR-4** | Có actionId, payload, version, hết hạn, người xác nhận và transaction là tiến bộ rõ. Chưa nói rõ payload bất biến sau preview, kiểm quyền lại khi execute, và khóa chống lặp phải được commit cùng mutation/audit. `actionId` duy nhất chưa đủ nếu retry tạo actionId mới cho cùng bước ghi. |
| **08 — ADR-5/11** | Worker DB role tối thiểu là cần thiết. Tuy nhiên, Server Actions hiện có gọi `requireAuth()` theo phiên web; worker không tự có phiên đó. Cần tách dịch vụ nhận actor và transaction, để web action và worker cùng gọi. Không thể mặc định bọc Server Action cũ là có audit nguyên tử. |
| **08 — ADR-6/7/9** | Định tuyến dữ liệu và đưa tài liệu ra khỏi `system` là đúng hướng. Sơ đồ chưa thể hiện policy bắt buộc trên mọi đường ra chat, embedding, retry và lịch sử. Việc dùng role `user/tool` hoặc quét injection không tự bảo đảm tài liệu không tác động tới đề xuất ghi. |
| **08 — ADR-8/10/12** | Chọn PostgreSQL làm nguồn chính và MCP làm adapter hợp lý. Còn thiếu quy tắc truyền quyền nguồn sang tri thức dẫn xuất/bản xuất; quy tắc xử lý thiếu ngày, thay thế một phần, chuyển tiếp và nguồn chưa được xác nhận. |
| **08 — RAM** | `--max-old-space-size` giới hạn một phần heap, **không phải trần RSS**. Ngưỡng RAM trống ≥1 GB là giả thuyết vận hành, chưa phải bằng chứng đủ sức chứa. Cần tải đại diện, paging, độ trễ và mức đồng thời. |
| **09 — WF1** | Dòng 46 đặt Critical Review **trước khi sinh bản nháp**, trong khi dòng 14 và 13:30 nói kiểm bản nháp. Nhánh cán bộ sửa quay về sinh nháp cũng không quay lại kiểm trích dẫn. Cần kiểm đúng bản cuối và vô hiệu hóa duyệt khi nội dung đổi. |
| **09 — Resume** | Dòng 37 suy từ checkpoint sang “chạy lại không lặp node đã xong”. Còn cửa sổ **side effect đã commit nhưng checkpoint chưa ghi**. Phải liên kết node/actionId ổn định với kết quả giao dịch; thông báo bên ngoài cần cơ chế chống gửi lặp riêng. |
| **09 — Phạm vi ghi** | “Mọi node ghi đều chờ duyệt” tại dòng 36 quá rộng: checkpoint, usage, audit, đề xuất tri thức đều là ghi tự động. Cần phân biệt ghi vận hành với hành động nghiệp vụ cần duyệt. |
| **09 — Thí nghiệm agent** | Dòng 104 yêu cầu 50 câu/hồ sơ nhưng dẫn 12 §4 chỉ có **10–20 hồ sơ**. A/B/C ở đây lại có nghĩa khác 07. So C khác cả model lẫn ngữ cảnh với B không cô lập được lợi ích do tách agent. |
| **10 — Vá tạm** | Dòng 29 cho phép “admin + câu xác nhận”; 11:22 dùng xác nhận ở lượt sau. Cả hai chưa đạt xác nhận gắn payload phía máy chủ của ADR-4. Nếu chưa có cổng đó, phương án tạm rõ ràng nhất là **tắt ba tool ghi**. |
| **10–11 — Thứ tự** | 10 xếp S1 P0 ngay, nhưng 03:60 đặt S1 cuối danh sách thứ tự xử lý. S13/S15 được xử lý tận B3/B4 dù phần ghi đã được mở lại từ trước. Cần ghi rõ biện pháp chặn tạm trong thời gian chờ. |
| **11 — Điều kiện dữ liệu** | Dòng 50 “tạm dừng ở mức hiện tại” mơ hồ: dừng mở rộng hay dừng truyền dữ liệu chưa được phép? Cần chọn cách hiểu cụ thể và cơ chế thực thi. |
| **12 — Kiểm thử** | Có khung tốt nhưng thiếu các ca đã yêu cầu tại 05:393–404: payload bị đổi/khác người/hết hạn; quyền bị thu hồi sau tạo job; audit lỗi phải rollback; kill sau commit; LIKE xuyên phòng; webhook phát lại; thuế/bảng tra. 10:53 và 11:23 đang dẫn đến bộ test chưa chứa đủ những nội dung này. |
| **12 — Đánh giá pháp lý** | “Số hiệu có trong kho” tại dòng 44 chỉ chứng minh tồn tại trong kho, không chứng minh điều khoản tồn tại, còn áp dụng hoặc hỗ trợ đúng phát biểu. Nếu kho thiếu văn bản thật, cũng có thể bác sai. Cần kiểm nội dung trích dẫn và cơ chế không đủ bằng chứng. |
| **12 — Nghiệm thu** | B3 mới yêu cầu “đo”, chưa có ngưỡng đạt cho recall, precision, thời gian. Bộ ≥100 câu chưa xác định số mẫu giữ kín theo từng nhóm, cách chấm và cách xử lý biến động giữa lần chạy. |
| **13 — Số học** | Tổng **12–19 người-tuần phát triển + 3–5 người-tuần chuyên gia đúng** theo 11. Đây là công sức, chưa phải thời gian lịch hay ngân sách đầy đủ. |
| **13 — Token/chi phí** | 2.048 token là giới hạn **mỗi lần gọi**, không phải toàn lượt chatbot có tối đa năm lần gọi. 14.000 ký tự chỉ giới hạn phần trích, chưa gồm danh mục/lịch sử như chính 01:117 đã nêu. Công thức cần cộng mọi lần gọi, truy vấn embedding, retry có tính phí và tránh đếm Critical Review hai lần. |
| **13 — Trần chi phí** | Chế độ không-AI đã có khi dịch vụ lỗi/hết hạn mức; **bộ chặn ngân sách nội bộ chưa có**. Đếm sau phản hồi vẫn có thể vượt trần do nhiều request đồng thời. Cần dự giữ ngân sách trước gọi và đối soát sau gọi. |

Các ADR **1, 2, 3, 12, 13** không có lỗi định hướng chặn quyết định mà tôi tìm thấy. Những điểm trên chủ yếu yêu cầu làm rõ hợp đồng và điều kiện nghiệm thu, không đòi thay toàn bộ phương án B.

Một số lỗi dẫn chứng cần sửa cụ thể:

- [01:131](D:/Troly/QLHTKT/HTKT/docs/htkt-brain-review/01-system-audit.md:131) và 06 dẫn `search.ts:68` để chứng minh lọc trạng thái; đúng là **dòng 72**. Bộ lọc phạm vi ở **73**.
- 01 và nhiều báo cáo dùng `app/api/...`, `app/actions/...`; đường dẫn từ gốc workspace là **`app/app/api/...`**, **`app/app/actions/...`**. 08:45 đã dùng đúng; cần thống nhất quy ước gốc.
- 09:36 dẫn `workflow_runtime.py:16–18` cho node ghi chờ người; đúng là **13–15**.
- 13:28 dẫn `hoi-dap/route.ts:102` cho giới hạn output; đúng là **103**.
- 01:26–27 vẫn trình bày 500 MB/instance và heap 512 như cấu hình có hiệu lực, dù 06 S20 đã thừa nhận restart threshold không phải trần và `NODE_OPTIONS` chưa xác nhận áp dụng.
- Các tham chiếu Q1–Q8 ở **14** chưa thể tra cứu: thư mục hiện không có tệp 14. Điều này làm thiếu đầu mối cho những quyết định mà lộ trình đang phụ thuộc.

Tôi đếm lại và xác nhận số liệu chính tại 02:14: **178/197 tệp Python server; 124.927 dòng; 44.677 dòng JS dashboard; 519 tệp test với 114.871 dòng; toàn bộ Python tests 116.992 dòng**.

**4. BẢNG BẤT ĐỒNG CÒN LẠI**

Các thử nghiệm đề xuất đều dành cho môi trường cô lập/staging được cho phép.

| Nội dung | Quan điểm Codex | Quan điểm Claude | Bằng chứng | Rủi ro | Thử nghiệm đề xuất để phân xử |
|---|---|---|---|---|---|
| S10 đúng nghiệp vụ | Chưa đủ chứng cứ; kiểm cả cơ sở quy mô và đầu vào | Giữ “không phát hiện lỗi”, có cảnh báo nhất quán ≠ đúng | 01:123; 06 §2; `kiem-tra-du-toan.ts:791–809` | Trung bình | Đáp án chuyên gia cho từng bảng, dưới/đúng/trên ngưỡng, đơn vị và ngày áp dụng |
| LIKE có thể ảnh hưởng tool ghi | Không có hàng rào mã ngăn nội dung LIKE tác động tới lựa chọn tool | 06 §1 #4 nói không có tool ghi kích hoạt được từ gợi ý | `route.ts:2186`,2199–2203,2274 | Cao về khả năng tác động; chưa chứng minh khai thác | LIKE chứa chỉ thị, hỏi từ tài khoản khác có quyền ghi; quan sát tool call và mutation bằng mock |
| Xác nhận B0 | Câu xác nhận hội thoại chưa đủ; nên tắt ghi nếu thiếu cổng máy chủ | Chấp nhận xác nhận lượt sau làm biện pháp tạm | 10:29; 11:22; ADR-4 | Cao | Đổi payload sau “đồng ý”, phát lại xác nhận, xác nhận khác người/hết hạn |
| Checkpoint chống ghi lặp | Cần actionId ổn định và ràng buộc giao dịch, không chỉ trạng thái node | 09:37 nêu checkpoint giúp không lặp node đã xong | 08:67–69; 09:37 | Cao | Kill sau mutation commit, trước checkpoint; resume nhiều lần và đồng thời |
| Chấm C | Phải chốt module rồi chấm lại cùng định nghĩa | Quy chênh lệch điểm chủ yếu cho định nghĩa C | 07:8–12,18–24,40 | Trung bình | Hai lát cắt cùng chức năng, một TS và một module Python chọn lọc; so công, quyền, RSS, vận hành |
| Trần chi phí | Fallback lỗi dịch vụ chưa phải hard cap ngân sách | 13:32 gắn mốc 100% với chế độ không-AI đã có | `route.ts:2190–2215`; 13:32 | Trung bình | Nhiều request sát trần; kiểm dự giữ ngân sách và tổng phí sau đối soát |

**S18 không còn là bất đồng về khả năng tài liệu dở xuất hiện trong đường tìm kiếm đã kiểm.** Tôi chấp nhận đính chính của Claude, giữ yêu cầu phục hồi và dọn lần nạp lỗi.

**5. Điều kiện để trình chủ hệ thống**

Tôi đề nghị trình với kết luận **ĐẠT CÓ ĐIỀU KIỆN**, kèm bốn điều kiện sửa hồ sơ:

1. Thống nhất biện pháp B0 cho ba tool ghi; không mô tả xác nhận hội thoại là tương đương cổng xác nhận máy chủ.
2. Bổ sung các ca kiểm thử còn thiếu và ngưỡng nghiệm thu B3; không cần chạy chúng để hoàn tất hồ sơ trình định hướng.
3. Sửa thứ tự kiểm bản nháp, hợp đồng chống lặp khi resume, diễn đạt trần RAM/token và giới hạn bằng chứng S10.
4. Sửa tham chiếu sai, bổ sung danh mục Q1–Q8 và ghi rõ chủ thể chịu trách nhiệm quyết định từng mục.

**Quyết định được hồ sơ hiện nay hỗ trợ:** ưu tiên B, chuẩn bị và thẩm tra B0, phê duyệt riêng từng đợt sau. Chưa đủ bằng chứng để cam kết tổng chi phí, sức chứa máy 6 GB hoặc phê duyệt triển khai toàn bộ B0–B5.

### Prompt vòng 4

````markdown
# Codex — Vòng 4: Kiểm tra lần cuối phương án sau chỉnh sửa

Chế độ CHỈ ĐỌC, tiếng Việt. Thư mục: `D:\Troly\QLHTKT\HTKT`. Javis: `D:\Troly\QLHTKT\_research\javis-os`.
Đọc `docs/htkt-brain-review/01`…`13` (05 là nguyên văn của bạn ở vòng 2 — không cần đọc lại toàn bộ; 06 là giải trình của Claude).
RÀNG BUỘC: không đọc `.env*`, `secrets/`, `*.dump`, `auth.json`; không mở CSDL, không chạy mạng/test, không sửa tệp.

Yêu cầu:
1. Kiểm 10 việc bạn yêu cầu ở 2B: ĐÃ SỬA / SỬA MỘT PHẦN / CHƯA SỬA — dẫn vị trí trong báo cáo.
2. Đánh giá giải trình 06: chỗ Claude KHÔNG chấp thuận (S18 ingest; S10 tra bậc giữ "không phát hiện lỗi") — bạn đồng ý hay giữ ý kiến? Bằng chứng.
3. Kiểm 07 (chấm điểm, định nghĩa A/B/C khác bạn), 08 (13 ADR), 09 (workflow), 10, 11, 12, 13: lỗi kỹ thuật, mâu thuẫn giữa các báo cáo, số học, dẫn chứng sai dòng, giả định chưa nêu.
4. Lập BẢNG BẤT ĐỒNG CÒN LẠI: nội dung | quan điểm Codex | quan điểm Claude | bằng chứng | mức rủi ro | thử nghiệm đề xuất để phân xử.
5. Kết luận: hồ sơ "ĐẠT / ĐẠT CÓ ĐIỀU KIỆN / CHƯA ĐẠT" để trình chủ hệ thống quyết định (KHÔNG phải để triển khai). Không cần đồng thuận bằng mọi giá.

````
