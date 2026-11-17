# UPGRADE_V6_GAP — khoảng cách giữa hiện trạng và yêu cầu V6.0

Ngày rà: 2026-11-12 · Nhánh `ai-content-m1` @ `3edf204`, `git status` sạch trước khi viết · Chế độ chỉ đọc (không chạy test, không nối CSDL, không gọi mạng).
Nhãn: **V** = đã kiểm chứng trong mã/tài liệu ở lần rà này · **I** = suy luận · **U** = chưa biết · **P** = đề xuất.
Nguồn yêu cầu: bảng 10 thành phần V6.0 do người dùng cung cấp ngày 12/11/2026 (chỉ có một dòng yêu cầu cho mỗi thành phần; chưa có đặc tả chi tiết hay tiêu chí nghiệm thu).

## 1. Tổng quan

| # | Thành phần | Mức sẵn có | Kết luận ngắn |
|---|---|---|---|
| 1 | Javis OS | Không có | Chưa có mã, cấu hình hay adapter; quyết định 28/10/2026 là chưa xây bộ điều phối riêng |
| 2 | Second Brain | Một phần | Có kho RAG với phạm vi 2 mức và hiệu lực; thiếu phiên bản, phân quyền chi tiết, thời hạn tự động |
| 3 | Claude Code + Codex | Gần đủ | Quy trình, hook, skill, hợp đồng bàn giao đã chạy; thiếu số đo chi phí |
| 4 | AI pháp lý | Một phần | Có tra cứu hiệu lực và cảnh báo; chưa kiểm thẩm quyền và tính thống nhất hồ sơ tự động |
| 5 | AI chuyên ngành | Một phần | Tri thức 11 phòng đã có dạng dữ liệu tĩnh + 22 công cụ chatbot; chưa tách thành tác nhân theo lĩnh vực |
| 6 | GIS / Digital Twin | Một phần | Bản đồ MapLibre + bảng trung tâm đối tượng; hình học lưu JSONB, chưa PostGIS, chưa có mô hình 3D |
| 7 | UAV / AI Camera | Không có | Không có dòng mã nào |
| 8 | n8n | Không có (đã thay) | Hàng đợi PostgreSQL + worker riêng cho module Nội dung AI; n8n chưa xác minh tồn tại |
| 9 | Nhân sự / KPI | Một phần | Hồ sơ, lương, công việc có đủ; chưa có chỉ số KPI nào |
| 10 | An toàn thông tin | Một phần | Phân quyền, che dữ liệu, sao lưu có; nhật ký kiểm toán phủ rất thấp, chưa diễn tập khôi phục, chưa có quy tắc bí mật nhà nước |

## 2. Chi tiết từng thành phần

### 2.1 Javis OS — điều phối tác nhân theo nhiệm vụ, năng lực, chi phí, quyền hạn
- **V** Không có adapter, tham chiếu hay cấu hình: `docs/architecture/SYSTEM_INVENTORY.md:31`; `app/lib` không có thư mục điều phối (`app/lib/ai` chỉ có `cau-hinh.ts`).
- **V** Đã quyết định không xây bộ điều phối riêng, lý do VPS 6GB và một nhóm nhỏ: `docs/ai/ARCHITECTURE.md:33`, `docs/ai/DECISIONS.md:14`.
- **V** Điều phối hiện tại là phiên Claude Code + `TASKS.md`, định tuyến mô hình mới ở mức đề xuất, chưa đo chi phí: `docs/ai/ARCHITECTURE.md:19`.
- **U** "Javis OS" là sản phẩm có sẵn hay tên một hệ tự xây; chạy ở đâu.
- Khoảng cách: toàn bộ. Điều kiện trước: đặc tả Javis OS, máy chạy ngoài VPS production, cơ chế ghi chi phí theo tác vụ.

### 2.2 Second Brain — tri thức có nguồn, phiên bản, phân quyền, thời hạn hiệu lực
- **V** Nguồn: `tai_lieu.nguon`, `metadata` — `app/prisma/schema.prisma:3016,3032`.
- **V** Phân quyền: chỉ 2 mức `CONG_KHAI`/`NOI_BO_SO` — `schema.prisma:3018`; lọc trước khi truy vấn véc-tơ bằng `phamViCho` — `app/lib/rag/search.ts:27-36`.
- **V** Hiệu lực: `tinhTrangHieuLuc` 4 trạng thái + `thayTheBoi` — `schema.prisma:3028-3029`; đồng bộ từ `prisma/hieu-luc-vbpl.json`, **không tự đổi theo ngày, phải rà tay đúng mốc** (`docs/ai/TASKS.md`, mục "MỐC HIỆU LỰC").
- **V** Phiên bản: model `TaiLieu` không có cột phiên bản hay liên kết bản trước (`schema.prisma:3012-3043`); chỉ có `deletedAt`.
- **V** Phân loại 4 mức PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED mới tồn tại trong module Nội dung AI (`app/lib/ai-content/nghiep-vu.ts:48`, migration 050 chưa áp CSDL thật), chưa áp cho kho tài liệu.
- Khoảng cách: (a) phiên bản tài liệu; (b) phân quyền theo phòng/vai trò thay cho 2 mức; (c) ngày bắt đầu/hết hiệu lực dạng dữ liệu để tự chuyển trạng thái; (d) bộ nhớ dự án (`memory/`) nằm ngoài kho RAG, chỉ phục vụ Claude Code.

### 2.3 Claude Code + Codex — phân công, phản biện độc lập, kiểm thử, bàn giao
- **V** Vai trò, máy trạng thái, hợp đồng bàn giao: `docs/ai/WORKFLOW.md` (mục 5, 17, 22, 25); validator `tools/validate-handoff.mjs` + test.
- **V** Phản biện: skill `phan-bien-codex` (cấp user); hook chặn thao tác nguy hiểm `.claude/hooks/guard.mjs` + test; 3 skill dự án trong `.claude/skills/`.
- **V** Kiểm thử: `npm test` chạy trong CI trước build (`docs/ai/TASKS.md` AI-06); kết quả gần nhất của nhánh này 152/152 (theo `docs/ai-content/NGHIEM_THU.md`, không chạy lại hôm nay — NOT_RUN).
- Khoảng cách: chưa ghi chi phí/hạn mức theo việc; AI-10 (CSDL thử cho test tích hợp toàn hệ) mới có cho module Nội dung AI; AI-07 (dọn gốc repo, nhánh mặc định) còn chờ quyết.

### 2.4 AI pháp lý — hiệu lực, điều khoản, thẩm quyền, tính thống nhất hồ sơ
- **V** Hiệu lực: công cụ chatbot `tra_cuu_hieu_luc_van_ban`, `tra_cuu_phap_ly_chuyen_nganh`, `tra_cuu_phap_ly_nhan_su`, `tra_cuu_tai_lieu` (`app/app/api/chatbot/route.ts`); RAG trả kèm `tinhTrangHieuLuc` để cảnh báo (`app/lib/rag/search.ts:54-66`).
- **V** Thẩm quyền: có dữ liệu tĩnh `app/lib/htkt/tham-quyen-tham-dinh.ts`, `cap-cong-trinh-tt34.ts`, `phan-cap-cong-trinh.ts`; chưa có bước tự đối chiếu một hồ sơ cụ thể với bảng thẩm quyền.
- **V** Thống nhất hồ sơ: mới có cho dự toán (`app/lib/tham-dinh/kiem-tra-du-toan.ts`, `doc-to-trinh.ts`) và kiểm kê hồ sơ (`quet-ho-so.ts`).
- **V** Rủi ro đã ghi: số liệu pháp lý trong `lib/htkt` từng sai dù có ghi căn cứ (`CLAUDE.md` dự án; memory `du-lieu-phap-ly-bia-trong-lib-htkt`).
- Khoảng cách: kiểm điều khoản viện dẫn trong một văn bản dự thảo (số hiệu → còn hiệu lực → điều khoản tồn tại); kiểm thẩm quyền ký/thẩm định theo quy mô công trình; kiểm chéo số liệu giữa tờ trình, dự toán, báo cáo. Mọi kết quả chỉ là cảnh báo cho người duyệt (Luật 134/2025 Đ27 k2 — đã đối chiếu ở `UPGRADE_V4_PROPOSAL.md` §3).

### 2.5 AI chuyên ngành — tách nghiệp vụ theo lĩnh vực quản lý của Sở
- **V** Tri thức theo phòng: `app/lib/phong/{phap-ly-phong,tham-dinh-phong,tham-muu-phong,mau-bieu,cong-viec-phong}.ts`; riêng HTKT 23 tệp trong `app/lib/htkt/`; hồ sơ động theo lĩnh vực `app/lib/nghiep-vu/schema.ts`; chứng chỉ hành nghề `app/lib/cchn/`.
- **V** Chatbot là một tác nhân chung với 22 công cụ, phần lớn về nhân sự; chuyên ngành mới có `tra_cuu_nghiep_vu_htkt` và `tra_cuu_phap_ly_chuyen_nganh`.
- **V** Tự điền form soạn thảo: `app/lib/htkt/ai-auto-fill.ts`.
- Khoảng cách: chưa có công cụ/tác nhân riêng cho 10 phòng còn lại; chưa có bộ câu hỏi kiểm thử theo lĩnh vực; nội dung tĩnh các phòng chưa được đối chiếu văn bản gốc đồng đều (I, theo các đợt rà đã ghi trong memory).

### 2.6 GIS / Digital Twin — dữ liệu không gian thống nhất, liên kết tài sản–công trình–hồ sơ
- **V** Bản đồ: `maplibre-gl ^5.24.0` (`app/package.json:43`); `app/components/gis/map-client.tsx`, `components/htkt-doi-tuong/ban-do-ha-tang.tsx`, `components/qd72/qd72-map.tsx`.
- **V** Bảng trung tâm `htkt_doi_tuong`: hình học lưu **JSONB** có ràng buộc kiểu, không dùng kiểu `geometry` của PostGIS — `app/prisma/migrations_manual/049_htkt_doi_tuong_hub.sql:272,345-353`; tính toán hình học bằng TypeScript (`app/lib/htkt-doi-tuong/hinh-hoc.ts`).
- **V** BIM: 6 model `Bim*` (`schema.prisma:2870-2994`), lưu tệp trên đĩa cục bộ (`app/lib/bim-storage.ts`); `package.json` không có thư viện xem 3D (three, web-ifc, xeokit, cesium đều không có).
- **V** (bổ sung 12/11/2026 tối) CSDL thật **chưa cài PostGIS**: danh sách tiện ích đọc được khi diễn tập khôi phục là plpgsql, pg_stat_statements, pg_trgm, pgcrypto, vector 0.8.0. Migration 049 theo `TASKS.md` chưa áp CSDL thật — cần kiểm lại.
- Khoảng cách: truy vấn không gian trong CSDL (PostGIS); khoá liên kết thống nhất giữa đối tượng hạ tầng ↔ tài sản ↔ dự án ↔ hồ sơ ↔ công việc (hiện `CongViec` chỉ có `duAnId`, `workOrderId`, `incidentId` — `schema.prisma:3147-3149`); mô hình 3D/trình xem; dữ liệu thời gian thực. "Digital Twin" đúng nghĩa cần cả ba, hiện mới là bản đồ 2D có thuộc tính.

### 2.7 UAV / AI Camera — thu thập hiện trạng, phát hiện bất thường có kiểm chứng
- **V** Không có mã: tìm `uav|drone|flycam|camera` (từ nguyên) trong `app/app`, `app/lib`, `app/components` không có kết quả.
- **V** Ràng buộc: VPS 6GB không chạy được suy luận ảnh/video (`docs/architecture/BASELINE_REPORT.md:20`); ổ C: còn ít dung lượng cho media (`UPGRADE_V4_PROPOSAL.md` §7).
- **U** Sở có thiết bị bay, camera, đường truyền, đơn vị vận hành hay chưa; phép bay; nơi lưu ảnh.
- Khoảng cách: toàn bộ. Phần có thể làm trước trên hệ hiện tại: bảng "phát hiện hiện trường" (ảnh + toạ độ + đối tượng liên kết + trạng thái kiểm chứng của cán bộ) để khi có nguồn ảnh thì nạp vào; việc nhận dạng chạy ở máy khác.

### 2.8 n8n — tự động hoá có kiểm soát, nhật ký, xử lý lỗi, phê duyệt
- **V** Không có n8n trong mã; `https://n8n.sxdqt.com.vn` chưa được xác minh (`SYSTEM_INVENTORY.md:30,39`).
- **V** Thay thế đã chọn cho module Nội dung AI: hàng đợi PostgreSQL + worker (`app/scripts/ai-content/worker.mjs`), cổng phê duyệt hai người, cờ `AI_CONTENT_ENABLED` mặc định tắt (`UPGRADE_V4_PROPOSAL.md:9`, `docs/ai-content/NGHIEM_THU.md:70`). Nhánh chưa merge, migration 050 chưa áp CSDL thật.
- **V** Tự động hoá khác chạy bằng Task Scheduler Windows (sao lưu, đồng bộ VBPL, watchdog, chúc sinh nhật) — không có nhật ký tập trung hay màn hình theo dõi chung.
- Khoảng cách: nhật ký và xử lý lỗi thống nhất cho các tác vụ lịch; cổng phê duyệt cho tự động hoá ngoài module Nội dung AI. Cần quyết định: mở rộng hàng đợi nội bộ (ít rủi ro, đã có mẫu) hay đưa n8n vào (phải chạy ngoài VPS, không giữ token).

### 2.9 Nhân sự / KPI — vị trí việc làm, khối lượng, tiến độ, kết quả
- **V** Vị trí việc làm: một cột chữ `viTriViecLam` trong hồ sơ cán bộ (`schema.prisma:1568`), ghi chú còn dẫn NĐ 62/2020, 106/2020 (memory ghi đã cập nhật theo NĐ 361/2025 ở nơi khác — cần đối chiếu); chưa có danh mục vị trí, biên chế theo vị trí.
- **V** Công việc: `CongViec` có `tienDo` 0–100, hạn, ngày hoàn thành, người phụ trách, thành viên, nhật ký, checklist (`schema.prisma:3120-3208`).
- **V** KPI: không có model, API hay trang nào; chữ "kpi" chỉ xuất hiện trong vài trang báo cáo hạ tầng (tên biến giao diện).
- Khoảng cách: danh mục vị trí việc làm gắn với cán bộ; định mức khối lượng theo loại việc; chỉ số tính được từ dữ liệu sẵn có (số việc, tỷ lệ đúng hạn, tồn quá hạn theo người/phòng); liên hệ với đánh giá xếp loại. Lưu ý: chỉ số gắn với cá nhân là dữ liệu nhân sự, áp quy tắc che như lương.

### 2.10 An toàn thông tin — phân quyền dữ liệu, bí mật nhà nước, kiểm toán, khôi phục
- **V** Phân quyền: bảng vai trò/quyền, middleware, che CCCD/lương theo nhóm (`SYSTEM_INVENTORY.md:12`, `docs/ai/SECURITY.md`).
- **V** Webhook hạ tầng đã bỏ secret mặc định, thiếu thì từ chối (`app/app/api/webhook/infrastructure/route.ts:25-37`) — phát hiện HIGH ở `SYSTEM_INVENTORY.md` §5 đã được vá.
- **V** Kiểm toán: có bảng `AuditLog` (`schema.prisma:115`) nhưng mẫu `createAuditLog|auditLog.create` chỉ khớp 3 tệp trong `app/app` + `app/lib`, trong đó 1 tệp API. **I** Phần lớn thao tác ghi dữ liệu không để lại nhật ký kiểm toán (một số module có nhật ký riêng như `CongViecNhatKy`, nhật ký module Nội dung AI).
- **V** Khôi phục: có sao lưu hằng đêm và trước migration; **chưa diễn tập khôi phục dữ liệu** (`docs/ai/TESTING.md:27`, `docs/ai-content/NGHIEM_THU.md:74`).
- **V** Bí mật nhà nước: form Văn thư – Lưu trữ có trường "Độ mật" với lựa chọn Mật/Tối mật/Tuyệt mật (`app/lib/nghiep-vu/schema.ts:807`) và cho đính kèm tệp như các lĩnh vực khác (**I**, chưa đọc luồng tải tệp của lĩnh vực này). Không có quy tắc nào chặn đưa nội dung mật vào hệ thống, vào RAG hay vào prompt gửi nhà cung cấp AI ngoài.
- **V** Chưa có: quét secret trong CI, thử tấn công prompt injection cho chatbot/RAG (`docs/ai/SECURITY.md:25`), chính sách bằng văn bản về gửi dữ liệu nội bộ sang AI ngoài (`docs/security/DATA_CLASSIFICATION.md:22`).
- Khoảng cách pháp lý: căn cứ về bảo vệ bí mật nhà nước và việc soạn/lưu/truyền tài liệu mật trên hệ thống nối Internet **chưa được đối chiếu văn bản gốc trong lần rà này (U)** — phải rà bằng skill `ra-soat-vbpl` trước khi thiết kế.

## 3. Rủi ro

| Mức | Rủi ro | Bằng chứng |
|---|---|---|
| HIGH | Hệ thống nối Internet, có gọi AI ngoài, nhưng không có quy tắc chặn nội dung thuộc bí mật nhà nước; form văn thư còn mời nhập hồ sơ "Tối mật/Tuyệt mật" | `schema.ts:807`; `DATA_CLASSIFICATION.md:22` |
| ~~HIGH~~ ĐÃ XỬ LÝ 12/11/2026 | Diễn tập khôi phục dữ liệu đạt (113 giây, 0 lỗi, 142 bảng). Còn lại mức MEDIUM: chưa rõ có bản sao lưu ngoài máy; cần lặp lại trước migration lớn | `docs/ai/TESTING.md` |
| MEDIUM | Nhật ký kiểm toán phủ thấp → không truy được ai sửa gì ở phần lớn module | mục 2.10 |
| MEDIUM | V6.0 gồm 10 mảng lớn cho một VPS 6GB và một nhóm nhỏ; V3.0 từng bị đánh giá quá rộng vì cùng lý do | `UPGRADE_V4_PROPOSAL.md:8` |
| MEDIUM | Hiệu lực văn bản không tự chuyển theo ngày → AI pháp lý có thể viện dẫn sai sau mỗi mốc | `TASKS.md` mục "MỐC HIỆU LỰC" |
| LOW | Ba thành phần (Javis OS, n8n, UAV/Camera) chưa có đặc tả và chưa xác minh hạ tầng → không ước lượng được | mục 2.1, 2.7, 2.8 |

## 4. Thứ tự đề xuất (P — chưa thực hiện, mỗi bước cần duyệt riêng)

| Bước | Việc | Vì sao trước | Hạ tầng mới |
|---|---|---|---|
| 0 | Chính sách dữ liệu: quy tắc bí mật nhà nước (sửa trường "Độ mật", chặn tải nội dung mật), văn bản cho phép/cấm gửi dữ liệu sang AI ngoài; diễn tập khôi phục | Điều kiện an toàn cho mọi bước sau | Không |
| 1 | Chốt module Nội dung AI M1 (merge, migration 050, bật cờ) | Đang dở, đã qua 6 vòng phản biện | Không |
| 2 | Second Brain: 4 mức phân loại cho `tai_lieu`, phiên bản, ngày hiệu lực tự chuyển trạng thái | Nền cho AI pháp lý và chuyên ngành | Không |
| 3 | AI pháp lý: kiểm viện dẫn trong dự thảo, đối chiếu thẩm quyền theo quy mô | Dùng ngay dữ liệu bước 2 | Không |
| 4 | KPI từ dữ liệu `CongViec` + danh mục vị trí việc làm; mở rộng nhật ký kiểm toán | Dữ liệu đã có, chỉ cần tổng hợp | Không |
| 5 | PostGIS + khoá liên kết đối tượng–tài sản–hồ sơ | Cần migration lớn, làm sau khi đã diễn tập khôi phục | Tiện ích PostGIS |
| 6 | AI chuyên ngành theo từng phòng (bắt đầu phòng có dữ liệu đã đối chiếu) | Phụ thuộc bước 2–3 | Không |
| 7 | Javis OS, n8n, UAV/Camera, mô hình 3D | Cần máy khác, thiết bị, đặc tả | Có — ngoài VPS |

## 5. Cần người dùng cung cấp hoặc quyết định
1. Đặc tả V6.0 đầy đủ (tiêu chí nghiệm thu từng thành phần); bảng hiện chỉ có một câu mỗi mục.
2. Javis OS là gì, chạy ở đâu; n8n có đang chạy không và ai quản trị.
3. Có máy chủ thứ hai hay không (quyết định số phận bước 7).
4. Hệ thống có được phép lưu thông tin về văn bản mật (kể cả chỉ số/ký hiệu) hay không; ý kiến Văn phòng/Pháp chế.
5. Chính sách gửi dữ liệu nội bộ sang nhà cung cấp AI ngoài.
6. UAV/Camera: thiết bị, đơn vị vận hành, nơi lưu ảnh.

## 6. Chưa kiểm được trong lần rà này
- Trạng thái CSDL thật (PostGIS, migration 049/050 đã áp chưa, số bản ghi).
- `pm2 list`, tác vụ lịch, `memory-lint` — không chạy.
- Luồng tải tệp của lĩnh vực Văn thư – Lưu trữ; nội dung `app/lib/htkt/ha-tang-thong-minh.ts`.
- Độ phủ nhật ký kiểm toán chỉ đo bằng một mẫu grep; các tên hàm ghi nhật ký khác có thể bị sót.
- Căn cứ pháp lý về bí mật nhà nước và vị trí việc làm chưa đối chiếu văn bản gốc.
