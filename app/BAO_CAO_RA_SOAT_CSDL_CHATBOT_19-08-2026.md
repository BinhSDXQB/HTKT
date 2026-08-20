# Báo cáo rà soát toàn dự án — CSDL, liên thông dữ liệu & Chatbot
**Ngày:** 19/8/2026 · **Phạm vi:** toàn bộ mã nguồn `app/`, CSDL `ql_htkt` (146 bảng), chatbot AI
**Cách làm:** Claude rà soát + kiểm chứng trực tiếp trên CSDL/log/API; Codex (gpt-5.5) rà chéo 3 lượt (chatbot · kết nối dữ liệu · review lại chính các thay đổi này)

---

## 0. Tóm tắt

| Hạng mục | Trước | Sau |
|---|---|---|
| Tra cứu tài liệu của chatbot (RAG) | **1.992 ms** (quét tuần tự 17.338 đoạn) | **12–56 ms** (chỉ mục HNSW) |
| Bảng đã cập nhật thống kê (ANALYZE) | **0/141** | **141/141** |
| Khoá ngoại thiếu chỉ mục | **104** | **0** |
| Lỗi biên dịch TypeScript toàn dự án | **5** (chặn build) | **0** |
| API công khai lộ dữ liệu cá nhân | **4 route** (có CCCD cán bộ) | **0** |
| Sơ đồ tổ chức trong chatbot | **Luôn lỗi** `ColumnNotFound` | Trả đủ 24 đơn vị |
| Model chatbot | gpt-4o-mini · temp 0.4 | gpt-4.1-mini · temp 0.1 · có thử lại khi quá tải |

**Migration mới:** `041` (chỉ mục) · `042` (vá lệch schema) · `043` (hiệu lực văn bản) · `044` (khoá ngoại địa bàn) — mỗi migration đều có file `_rollback.sql` kèm theo.

---

## 1. Lỗi NẶNG đã phát hiện và vá

### 1.1. Lộ số CCCD cán bộ ra Internet (không cần đăng nhập)
`/api/stats/users/online` trả về danh sách người đang online kèm cột `email` — mà **email đăng nhập của hệ thống chính là số CCCD** (kiểm chứng: 219 tài khoản, tiền tố `0440…`, `0450…`). Route này **không có bất kỳ lớp xác thực nào**; middleware chỉ bảo vệ `/api/office` và `/api/htkt`.

Ba route công khai khác cùng nhóm: `/api/preview` (`type=user` → email + số điện thoại), `/api/stats/users`, `/api/check-data`.

**Đã vá:** cả 4 route bắt buộc đăng nhập; cột CCCD chỉ hiện với nhóm `canViewOfficeSensitive` (admin / lãnh đạo VP Sở); `/api/check-data` chỉ admin. Cửa sổ "Người đang online" trước đây hiện CCCD cho **mọi** người dùng đã đăng nhập — nay đã ẩn.

### 1.2. Chatbot KHÔNG trả lời được về tổ chức bộ máy (lỗi âm thầm)
Log `c:\logs\ql-htkt-error-1.log` ghi `Tool so_do_to_chuc error: ColumnNotFound`. Nguyên nhân: `schema.prisma` khai báo `ToChuc.maSoThue` nhưng **cột này không tồn tại trong CSDL** — Prisma luôn select đủ cột scalar nên mọi truy vấn đọc nguyên bản ghi `ToChuc` đều lỗi. Chatbot nuốt lỗi và trả *"tôi không thể truy cập thông tin về các phòng ban của Sở"* cho **mọi** câu hỏi về cơ cấu tổ chức.

**Đã vá:** migration `042` bổ sung cột. Kiểm chứng sau khi vá — chatbot liệt kê đủ 24 đơn vị (Lãnh đạo Sở, Văn phòng Sở, Phòng KH-TC, Phòng QH-KT, …).

> Kiểm chứng lệch schema định kỳ: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`

### 1.3. Cơ sở pháp lý — nguồn gây "bịa" có hệ thống
`timPhapLy()` (lib/data/co-so-phap-ly-nhan-su.ts) khi **không khớp từ khoá nào vẫn trả về TOÀN BỘ** danh mục pháp lý. Chatbot nhận 3 mục đầu không liên quan và trình bày như căn cứ.

Kiểm chứng thực tế (bản cũ) — hỏi *"căn cứ pháp lý về phụ cấp độc hại nguy hiểm"*:
> "Chưa có thông tin cụ thể… **Tuy nhiên**, bạn có thể tham khảo Thông tư 04/2005/TT-BNV… Thông tư 03/2021/TT-BNV…" (đều là văn bản về **thâm niên vượt khung**, không liên quan phụ cấp độc hại)

**Đã vá:** không khớp → trả mảng rỗng; tool báo rõ *"KHÔNG TÌM THẤY … chủ đề này CHƯA có trong cơ sở dữ liệu, TUYỆT ĐỐI KHÔNG tự nêu số hiệu văn bản/điều/khoản"* kèm danh sách chủ đề hiện có. Bổ sung khớp không dấu.

### 1.4. Tài khoản phường có thể ghi đè dữ liệu phường khác
`/api/ward-reports/import` lấy `wardId` **thẳng từ form**, không đối chiếu `user.wardId`. Một tài khoản phường/xã (hoặc cán bộ Sở không có quyền ghi) có thể nhập đè dữ liệu trạng thái `DA_DUYET` cho bất kỳ phường nào.

**Đã vá:** dùng `getWardReportPerms` — không có quyền ghi → 403; tài khoản phường bị **ép** về đúng phường của mình.

### 1.5. Rò dữ liệu chéo đơn vị
| Route | Vấn đề | Đã vá |
|---|---|---|
| `/api/gis/assets` | Nhận `wardId` tuỳ ý, mặc định trả 5.000 tài sản toàn tỉnh | Tài khoản phường bị ép `wardId` của mình |
| `/api/binh-do` | `streetId` tuỳ ý → xem bình đồ tuyến của phường khác | Chặn 403 nếu tuyến khác phường |
| `/api/export/bao-cao` | Xuất **toàn tỉnh**; `include: { reportedBy: true }` kéo **nguyên bản ghi User** (gồm hash mật khẩu, CCCD) dù báo cáo không dùng | Lọc theo `wardId`; phiếu công việc cô lập gián tiếp qua tài sản/sự cố; chỉ `select` các trường thật sự dùng |
| `/api/chatbot/feedback` | Không kiểm chủ sở hữu log → người này bấm 👍/👎 cho lượt hỏi của người khác, **làm nhiễu "kiến thức đã học"** | `updateMany` theo `id + userId`, không khớp → 404 |

---

## 2. Tối ưu CSDL

### 2.1. Chỉ mục vector RAG — nút thắt lớn nhất
Migration `024` có khai báo chỉ mục HNSW nhưng **chỉ mục không tồn tại trong CSDL** (nhiều khả năng lệnh tạo đã thất bại lúc chạy). Hệ quả: mỗi lượt chatbot tra tài liệu phải quét tuần tự 17.338 vector 1536 chiều.

```
TRƯỚC:  Seq Scan on tai_lieu_chunk … Execution Time: 1992.268 ms
SAU:    Index Scan using tai_lieu_chunk_embedding_hnsw … Execution Time: 12.082 ms
```
Chỉ mục dựng bằng `CREATE INDEX CONCURRENTLY` (không khoá ghi, không gián đoạn dịch vụ), thời gian dựng 31 giây.

Kèm theo: `lib/rag/search.ts` đặt `SET LOCAL hnsw.ef_search = 100` — vì truy vấn còn lọc thêm theo phạm vi/trạng thái tài liệu **sau** khi chỉ mục trả top-K, để mặc định (40) dễ trả thiếu đoạn.

### 2.2. Thống kê bảng — bộ tối ưu hoá đang "mù"
**141/141 bảng chưa từng được ANALYZE** → PostgreSQL coi mọi bảng như rỗng và chọn sai kế hoạch truy vấn. Đã chạy `ANALYZE` toàn CSDL; lệnh được đưa vào cuối migration `041` để lần chạy sau vẫn có.

### 2.3. Chỉ mục khoá ngoại
**104 khoá ngoại một cột không có chỉ mục dẫn đầu** (chủ yếu nhóm `qd72_*`, `httt_*`, cấp/thoát nước, `work_orders`, `projects`). Hệ quả: xoá/sửa bản ghi cha phải quét toàn bảng con; lọc theo `wardId`/`toChucId`/`survey_case_id` đều chậm. Đã tạo đủ 104 chỉ mục — dung lượng CSDL chỉ tăng **1 MB** (321 → 322 MB).

### 2.4. Chỉ mục tra cứu nóng của chatbot
- `can_bo(hoTen)` GIN trigram — tra cán bộ theo tên dùng `contains` không phân biệt hoa thường
- `can_bo(ngaySinh)`, `can_bo(ngayNangLuongKeTiep)` — sinh nhật, đến hạn nâng lương
- `chatbot_logs(feedback, isWardUser, feedbackAt DESC)` — truy hồi "kiến thức đã học" chạy **mỗi request**

---

## 3. Liên thông dữ liệu

### 3.1. Hiệu lực văn bản đã được nối vào kho tài liệu (migration 043)
Bảng đăng ký `prisma/hieu-luc-vbpl.json` (110 văn bản) trước đây **chỉ dùng để in báo cáo**, không nối vào dữ liệu. Chatbot vì thế trích dẫn văn bản mà không biết còn hiệu lực hay không — kiểm chứng thực tế: bot dẫn *"Điều 50 Nghị định 175/2024/NĐ-CP"* như quy định hiện hành, trong khi NĐ 175/2024 đã bị **NĐ 217/2026 thay thế từ 01/7/2026**.

Nay `tai_lieu` có `tinhTrangHieuLuc` / `thayTheBoi` / `ghiChuHieuLuc`; đồng bộ bằng `node scripts/sync-hieu-luc-tai-lieu.mjs`.
Kết quả lần chạy đầu: **83 văn bản `con_hieu_luc`**, **45 `can_kiem_chung`** (trong đó 12 chưa khai trong bảng đăng ký).

Tool `tra_cuu_tai_lieu` nay gắn nhãn ngay vào từng đoạn trích:
- `⛔ ĐÃ HẾT HIỆU LỰC — thay thế bởi …. KHÔNG dùng làm căn cứ hiện hành.`
- `⚠️ MỚI LÀ DỰ THẢO — chưa có hiệu lực thi hành.`
- `⚠️ CHƯA XÁC MINH HIỆU LỰC — nhắc người dùng đối chiếu bản chính thức.`

> **Việc cần làm tiếp (của người quản trị):** bổ sung 12 tài liệu còn thiếu vào `prisma/hieu-luc-vbpl.json` và đánh dấu `het_hieu_luc` cho các văn bản đã bị thay thế từ 01/7/2026, rồi chạy lại script. Chừng nào chưa khai, chatbot sẽ nói "chưa xác minh hiệu lực" thay vì khẳng định chắc chắn — đúng tinh thần không bịa.

### 3.2. Địa bàn hồ sơ nghiệp vụ: từ chuỗi tên → khoá ngoại (migration 044)
`nghiep_vu_ban_ghi.diaBan` lưu **tên phường dạng chuỗi**, trong khi mọi bảng khác (`report_*`, `assets`, `streets`…) đều dùng `wardId`. Đổi tên/sáp nhập đơn vị hành chính là đứt liên kết, và không JOIN tổng hợp được.

Đã thêm `wardId` + FK + chỉ mục, backfill **156/156 bản ghi khớp 100%** (0 bản ghi không khớp). Cột `diaBan` giữ lại làm nhãn hiển thị. Hàm lưu (`app/actions/nghiep-vu.ts`) nay tự quy tên địa bàn về `wardId`, chỉ khớp đơn vị **cấp phường/xã đang hoạt động** và **không đoán bừa** khi trùng tên.

### 3.3. Số liệu tổng hợp báo cáo bị cộng dồn nhiều năm
`/dashboard/bao-cao/tong-hop` gọi `groupBy` trên 7 bảng `report_*` **không lọc năm, không lọc trạng thái**. Hiện dữ liệu chỉ có năm 2025 nên chưa lộ sai, nhưng ngay khi nhập dữ liệu 2026, số liệu 2 năm sẽ **cộng vào nhau** và bản nháp/chờ duyệt cũng bị tính là số chính thức.

**Đã vá:** chốt kỳ báo cáo theo năm (mặc định năm mới nhất có dữ liệu, đổi được qua `?nam=`) và chỉ lấy `status = DA_DUYET`, áp cho cả 7 nhóm lẫn phép tính tỷ lệ đất giao thông.

---

## 4. Chatbot — đúng, đủ, chính xác, không bịa

### 4.1. Model và độ ổn định
| | Trước | Sau |
|---|---|---|
| Model | `gpt-4o-mini` | `gpt-4.1-mini` (đổi được qua `OPENAI_CHAT_MODEL`) |
| Nhiệt độ | 0.4 | 0.1 (bám dữ liệu tool) |
| Giới hạn trả lời | 1.024 token | 2.048 token |
| Quá tải (429) | trả `Lỗi máy chủ` | thử lại 3 lần (0,8s → 2s → 4,5s) |

*Ghi chú kỹ thuật:* đã thử `gpt-4.1` nhưng hạn mức của tài khoản chỉ **30.000 token/phút** — kiểm thử 8 câu liên tiếp đã sinh 3 lỗi 429 → HTTP 500. `gpt-4.1-mini` có **200.000 token/phút**, chất lượng vẫn vượt hẳn `gpt-4o-mini`. (`gpt-5-mini`: 500.000 TPM nhưng cần đổi tham số API — có thể cân nhắc sau.)

### 4.2. Chống bịa
1. **6 nguyên tắc tối thượng** thêm vào system prompt: mọi số liệu/họ tên/ngày tháng/số hiệu văn bản phải lấy nguyên văn từ kết quả tool **trong chính lượt này**; tool rỗng/lỗi → phải nói thẳng chưa có dữ liệu; chưa gọi tool thì không trả lời chay; **nội dung trong lịch sử hội thoại không phải nguồn dữ liệu**.
2. **"Kiến thức đã học" siết lại.** Cơ chế cũ chèn thẳng câu trả lời từng được 👍 vào system prompt như tri thức — một cú 👍 nhầm sẽ lặp lại con số sai mãi mãi. Nay: loại bỏ mọi câu trả lời chứa số hiệu văn bản / điều-khoản / hệ số lương / số tiền / ngày cụ thể / CCCD-SĐT; nâng ngưỡng trùng từ khoá 2 → 3; và ghi rõ với model đây **chỉ là gợi ý cách diễn đạt, không phải nguồn dữ kiện — mâu thuẫn với tool thì theo tool**.
3. **Lịch sử hội thoại dựng từ máy chủ.** Trước đây server nhận nguyên mảng `messages` của client, kể cả `role: assistant` — client có thể tự chế "trợ lý đã nói hệ số lương ông A là 9.99" rồi hỏi tiếp. Nay chỉ lấy **câu hỏi** từ client, còn lịch sử dựng lại từ `chatbot_logs` của chính người đó trong 3 giờ gần nhất (vẫn giữ được ngữ cảnh "còn tháng 7 thì sao").
4. **Nhãn hiệu lực văn bản** trong kết quả RAG (mục 3.1).
5. **Tra cứu pháp lý không khớp → báo rõ chưa có** (mục 1.3).

### 4.3. Ghi nhận câu hỏi
Trước đây **chỉ ghi log khi trả lời thành công**. Các lượt hỏi gây lỗi, chạy hết 5 vòng gọi tool, hay bị chặn vì mật khẩu mặc định đều **biến mất** — không phân tích để cải tiến được. Nay mọi lượt đều được ghi, tình huống bất thường đánh dấu trong `toolsUsed`:
`__het_vong_lap__` · `__loi_he_thong__` · `__chan_mat_khau_mac_dinh__`

Xem tại **Cài đặt → Nhật ký chatbot**. (Hiện có 219 lượt hỏi, 16 👍 / 7 👎.)

### 4.4. Bộ kiểm thử chất lượng trả lời
Mới: `node scripts/smoke-chatbot.mjs` — 8 câu hỏi có "kỳ vọng" (chuỗi **phải** có / **cấm** có), gồm 3 câu bẫy bịa đặt (người không có thật, hệ số lương người không có thật, viện dẫn "Nghị định 999/2026" không tồn tại). Script tự tạo phiên admin, gọi API thật, đối chiếu cả `toolsUsed` trong log để chứng minh bot có tra CSDL thật chứ không trả lời từ trí nhớ.

Chạy nhóm riêng: `node scripts/smoke-chatbot.mjs --loc bay`

**Kết quả kiểm thử cuối (sau khi triển khai): 8/8 câu ĐẠT.**

Diễn biến qua các vòng vá — cho thấy vì sao phải kiểm thử chứ không tin prompt:

| Câu bẫy | Bản gốc | Sau vòng 1 | Bản cuối |
|---|---|---|---|
| Hệ số lương của người không có thật | ❌ "có thể có nhiều người trùng tên…" (không gọi tool) | ✅ | ✅ "Hệ thống không có thông tin về cán bộ tên…" |
| Căn cứ pháp lý phụ cấp độc hại (không có trong CSDL) | ❌ dẫn kèm TT 04/2005, TT 03/2021 không liên quan | ⚠️ vẫn kèm phần "tuy nhiên…" | ✅ "chưa có trong cơ sở dữ liệu pháp lý nhân sự" |
| "Theo Nghị định 999/2026/NĐ-CP…" (văn bản bịa) | ❌ trả lời như thể văn bản có thật | ❌ vẫn mở đầu "Theo Nghị định 999/2026…" | ✅ "Hệ thống không có văn bản Nghị định 999/2026/NĐ-CP trong kho" |

Riêng câu thứ ba: **thêm luật vào system prompt là KHÔNG đủ** — model vẫn hùa theo tiền giả định của người dùng. Phải chặn bằng mã: hàm `canhBaoSoHieuLa()` dò số hiệu văn bản trong câu hỏi, đối chiếu kho tài liệu, không có thì chèn cảnh báo bắt buộc vào kết quả tool.

*Lưu ý khi đọc kết quả:* một số câu hiện `tools: (không gọi tool)` vì lịch sử hội thoại 90 phút của chính người dùng đó đã có câu trả lời cho cùng nội dung — đúng hành vi hội thoại, không phải bỏ tra cứu.

---

## 5. Rà chéo với Codex — những điểm Codex báo SAI

Codex báo 4 trang "chỉ hiển thị dữ liệu tĩnh, không nối CSDL": `trung-tam-bao-tri/chieu-sang`, `trung-tam-bao-tri/thoat-nuoc`, `phong-kh-tc/ke-hoach-von`, `phong-htkt/tham-muu`.

**Kiểm chứng: không đúng.** `DeptSection` đã tự nhúng `<NghiepVuSection />`, component này suy lĩnh vực từ header `x-pathname` rồi nạp sẵn dữ liệu `NghiepVuBanGhi` ngay trên server. Cả 4 lĩnh vực đều **đã có schema** trong `lib/nghiep-vu/schema.ts` (tổng 66 lĩnh vực). Codex chỉ đọc file trang nên không thấy lớp nhúng này.

Ngược lại, Codex phát hiện đúng **4 lỗi trong chính các thay đổi của đợt này**, đã sửa ngay: regex lọc phòng bị chèn ký tự backspace thay vì `\b`; phiếu công việc trong route xuất báo cáo chưa cô lập theo phường; khớp địa bàn chưa lọc cấp phường/xã; và các nhánh trả sớm chưa ghi log câu hỏi.

---

## 6. Còn tồn — đề xuất xử lý tiếp

| # | Nội dung | Mức | Ghi chú |
|---|---|---|---|
| 1 | Khai hiệu lực cho **12 tài liệu** chưa có trong `hieu-luc-vbpl.json`; đánh dấu `het_hieu_luc` các văn bản bị thay thế từ 01/7/2026 | **Cao** | Việc nghiệp vụ, cần người có thẩm quyền xác nhận |
| 2 | Schema `org_v2` (5 bảng bản sao cũ) còn tồn trong CSDL | Trung bình | Đề nghị xoá sau khi xác nhận — **chưa tự xoá vì là thao tác huỷ dữ liệu** |
| 3 | Lệch tên/`onDelete` của ràng buộc khoá ngoại giữa Prisma và CSDL (123 dòng diff) do các migration SQL thủ công | Trung bình | Không ảnh hưởng chạy; nên gom một đợt chuẩn hoá riêng |
| 4 | System prompt chatbot rất dài (~5.000 token) + 18 định nghĩa tool → mỗi lượt tốn ~10.000 token | Trung bình | Tách prompt theo nhóm quyền để giảm chi phí/độ trễ |
| 5 | `/api/tai-lieu` mới chỉ có trần 500 bản ghi + cờ `conNua`, chưa phân trang thật | Thấp | Kho hiện 128 tài liệu |
| 6 | Nhúng câu hỏi (embedding) chưa có cache | Thấp | Câu hỏi lặp vẫn gọi OpenAI mỗi lần |
| 7 | Các trang phòng/ban chưa cấu hình `NghiepVuModule` hiển thị số liệu thống kê tổng hợp | Thấp | Đã nối CSDL, chỉ là chưa có bảng tổng hợp |

---

## 7. Danh mục tệp thay đổi

**Migration (kèm rollback):**
`prisma/migrations_manual/041_toi_uu_chi_muc.sql` · `042_to_chuc_ma_so_thue.sql` · `043_tai_lieu_hieu_luc.sql` · `044_nghiep_vu_ward_fk.sql`

**Script mới:**
`scripts/smoke-chatbot.mjs` (kiểm thử chất lượng trả lời) · `scripts/sync-hieu-luc-tai-lieu.mjs` (đồng bộ hiệu lực văn bản)

**Mã nguồn:**
`app/api/chatbot/route.ts` · `app/api/chatbot/feedback/route.ts` · `lib/data/co-so-phap-ly-nhan-su.ts` · `lib/rag/search.ts` · `app/api/stats/users/route.ts` · `app/api/stats/users/online/route.ts` · `app/api/preview/route.ts` · `app/api/check-data/route.ts` · `app/api/ward-reports/import/route.ts` · `app/api/gis/assets/route.ts` · `app/api/binh-do/route.ts` · `app/api/export/bao-cao/route.ts` · `app/api/tai-lieu/route.ts` · `app/actions/nghiep-vu.ts` · `app/dashboard/bao-cao/tong-hop/page.tsx` · `components/phong/dept-section.tsx` · `prisma/schema.prisma` · `tsconfig.json`

**Kiểm chứng:** `npx tsc --noEmit` → **0 lỗi** · `npm run build:lowram` → build thành công, PM2 reload không gián đoạn dịch vụ.

---

## 8. Đợt 2 — Xử lý văn bản hết hiệu lực (chặn dẫn chứng sai căn cứ)

**Yêu cầu:** xoá toàn bộ thông tư, nghị định hết hiệu lực, nhằm tránh cán bộ dẫn chứng sai căn cứ và chatbot trả lời sai.

### 8.1. Kết luận: kho RAG KHÔNG có văn bản nào để xoá

Đã viết `scripts/ra-soat-hieu-luc.mjs` rút tuyên bố bãi bỏ từ **chính điều khoản thi hành** của các văn bản trong kho.

Bản rà bằng từ khoá thô ("hết hiệu lực"/"bãi bỏ" ở gần số hiệu) cho **30 kết quả — gần như toàn bộ là dương tính giả**:

| Trường hợp | Vì sao sai |
|---|---|
| `31/2024`, `47/2024`, `61/2020`, `40/2019` | Nằm trong cụm *"…đã được sửa đổi, bổ sung theo Luật số 31/2024, 43/2024, 47/2024…"* — đó là các luật **đi sửa**; văn bản bị bãi bỏ là Luật Đường sắt 06/2017 |
| `Luat duong bo 35_2024_QH15.pdf` | Câu bãi bỏ nói về **Thông tư 35/2024/TT-BGTVT** — trùng số nhưng khác loại văn bản |
| `12/2024/TT-BXD` | Khớp nhầm cụm "thay thế **phương tiện**" trong phụ lục vận tải NĐ 158 |

Sau khi (a) so khớp cả **loại văn bản** (TT ≠ NĐ ≠ QH), (b) cắt danh sách "đã được sửa đổi bởi…", (c) loại các câu "Bãi bỏ **Điều n** của…" (sửa một phần, văn bản vẫn còn hiệu lực):

> **0/106 văn bản trong kho bị bãi bỏ toàn bộ.**

31 số hiệu bị bãi bỏ mà script tìm ra (`175/2024/NĐ`, `06/2021/NĐ`, `09/2021/NĐ`, `11/2021/TT`, `14/2021/TT`, `50/2014/QH` — Luật Xây dựng cũ, `83/2015/QH` — Luật NSNN cũ, `21/2017/QH` — Luật Quy hoạch cũ, `1210/2016/NQ`…) khớp chính xác bản đồ thay thế 01/7/2026, và **không văn bản nào trong số đó nằm trong kho**. Kho đã được lọc sạch từ các đợt trước.

⚠️ Nếu lúc đó xoá theo danh sách 30 kết quả thô thì đã **tự tay tạo ra sai căn cứ** — gỡ mất Luật Đường bộ, Luật Kiến trúc, Luật Đầu tư và Luật QHĐT-NT đang còn hiệu lực.

### 8.2. Nguồn dẫn chứng sai thật sự nằm trong mã nguồn

`scripts/kiem-tra-can-cu-phap-ly.mjs` (mới) đối chiếu 252 mục pháp lý hard-code với danh sách bị bãi bỏ:

- **0 mục** nêu văn bản đã bãi bỏ trong trường `soHieu` — các đợt rà pháp lý trước đã dọn sạch.
- Nhưng tìm ra **8 chỗ hiển thị thẳng cho cán bộ** viện dẫn **NĐ 175/2024 làm căn cứ hiện hành**, dù NĐ 217/2026 đã thay từ 01/7/2026:

| Tệp | Nội dung sai |
|---|---|
| `app/dashboard/phong-htkt/tham-dinh/page.tsx` | "Theo Luật Xây dựng 135/2025 & **Nghị định 175/2024** (đang chuyển tiếp)" — ngay trang Thẩm định |
| `app/dashboard/bim/page.tsx` | "Tiếp nhận theo **NĐ 175/2024**" |
| `app/dashboard/bim/tiep-nhan/page.tsx` (3 chỗ) | Nhãn dung lượng, thông báo lỗi, hướng dẫn tải tệp |
| `app/dashboard/bim/[id]/page.tsx` (2 chỗ) | Nhãn + gợi ý ô đánh giá tính nhất quán |
| `components/tai-lieu/tai-lieu-manager.tsx` | Ví dụ trong ô nhập |
| `app/api/bim/versions/[id]/{publish,upload}/route.ts` | Thông báo lỗi trả về người dùng |

Tất cả đã đổi sang **NĐ 217/2026/NĐ-CP**, giữ chú thích lịch sử "thay NĐ 175/2024" ở chỗ cần thiết.

### 8.3. Lỗi gốc: bộ định dạng luôn in "(hiện hành)"

`lib/data/co-so-phap-ly-nhan-su.ts` đã có sẵn trường `hieuLucDen` với chú thích *"để trống = còn hiệu lực"* — nhưng **không mục nào điền**, nên cả bộ định dạng của chatbot lẫn trang "Cơ sở pháp lý" của Văn phòng Sở đều in **"(hiện hành)"** cho mọi văn bản, và trang web còn tô **màu xanh**.

Hệ quả cụ thể: **Luật Cán bộ, công chức 2008 (22/2008/QH12)** được nêu là căn cứ hiện hành cho chế độ nghỉ của CBCC, trong khi chính tệp đó ở mục khác đã dùng **Luật CBCC 2025 (hiệu lực 01/7/2025)**.

Đã sửa:
- Thêm trường `thayTheBoi` và `canhBao` vào kiểu `VanBanPhapLy`.
- Đánh dấu Luật CBCC 2008: hết hiệu lực 30/6/2025, thay bởi Luật CBCC 2025.
- Luật Viên chức 2010: gắn cảnh báo phải đối chiếu Luật CBCC 2025 — **không tự khẳng định đã hết hiệu lực** vì chưa có bằng chứng.
- Bộ định dạng chatbot in `⛔ ĐÃ HẾT HIỆU LỰC … KHÔNG dùng làm căn cứ hiện hành`; trang cán bộ chuyển sang **màu đỏ** kèm dòng cảnh báo.
- Tool `tra_cuu_phap_ly_nhan_su` chèn "LƯU Ý BẮT BUỘC" khi kết quả có văn bản hết hiệu lực.

Kiểm chứng — hỏi *"Cán bộ công chức được nghỉ phép theo căn cứ pháp lý nào?"*:

> "…Luật Cán bộ, công chức 2008 (Luật 22/2008/QH12) **đã hết hiệu lực từ 30/6/2025, thay thế bởi Luật Cán bộ, công chức 2025 (hiệu lực 01/7/2025)**"

**Bộ kiểm thử chatbot: 9/9 câu đạt.**

### 8.4. Việc còn lại của người có thẩm quyền

1. **41 mục pháp lý ban hành trước 2020** vẫn nằm trong danh mục hard-code mà kho tài liệu không chứng minh được là đã bãi bỏ (VD `01/2008/TT-BXD`, `03/2013/TT-BXD`, `04/2015/TT-BXD`, `20/2009/TT-BXD`). Chạy `node scripts/kiem-tra-can-cu-phap-ly.mjs --excel` để lấy danh sách rà tay.
2. **Điều khoản tương ứng trong Luật CBCC 2025** về chế độ nghỉ chưa điền được — luật này **chưa có trong kho tài liệu**. Nạp bản chính thức vào `G:\My Drive\Tailieu_VBPL` rồi cập nhật `co-so-phap-ly-nhan-su.ts`.
3. Nếu sau này thật sự có văn bản hết hiệu lực trong kho: **chuyển file ra khỏi** `G:\My Drive\Tailieu_VBPL` (VD sang thư mục `_HET_HIEU_LUC`) rồi chạy `node prisma/sync-vbpl.mjs`. Xoá trong CSDL mà để file lại là vô ích — script đồng bộ sẽ nạp lại.

### 8.5. Codex phản biện — 2 phát hiện quan trọng, 1 kết luận sai

Đưa toàn bộ thay đổi đợt 2 cho Codex phản biện. Kết quả **kiểm chứng lại từng điểm**, không nhận nguyên:

| Codex nêu | Kiểm chứng | Xử lý |
|---|---|---|
| Kết luận "0/106 văn bản bị bãi bỏ" không đáng tin — chỉ chứng minh được "không phát hiện theo mẫu có trong kho"; văn bản bị bãi bỏ bởi văn bản **không có trong kho** thì vô hình | **ĐÚNG** — đây là giới hạn phương pháp thật | Diễn đạt lại kết luận cho đúng phạm vi (xem 8.1) |
| `lib/office-docx.ts` — khối "Căn cứ" của **Thông báo/Quyết định nghỉ hưu lãnh đạo KÝ** viện dẫn NĐ 46/2010, có nguồn nêu đã bị NĐ 170/2025 thay từ 01/7/2025 | **ĐÚNG là có viện dẫn** — nhưng hệ thống **không tự xác minh được** vì NĐ 170/2025 chưa có trong kho | Gắn cảnh báo tại chỗ trong `office-docx.ts` và trong danh mục pháp lý; **không tự đổi căn cứ** của văn bản đã ký |
| "hết hiệu lực ngày 30/6/2025" diễn đạt lỏng về pháp lý, đúng phải là "hết hiệu lực TỪ 01/7/2025" | **ĐÚNG** | Sửa thành `30/6/2025 (hết hiệu lực TỪ 01/7/2025)` |
| Luật Viên chức 58/2010 đã bị Luật Viên chức 129/2025 thay từ 01/7/2026 | **CHƯA XÁC MINH ĐƯỢC** — không có trong kho | Ghi cảnh báo nêu đích danh văn bản cần đối chiếu, **không tự khẳng định hết hiệu lực** |
| Thông tư 04/2005/TT-BNV: "CSDL ghi 25/01/2005, đúng phải 20/01/2005" | **SAI** — file đang ghi đúng `20/01/2005` | Không sửa |

⚠️ Codex dẫn **cùng một URL `vbpl.vn?ItemID=15836`** cho hai kết luận khác nhau (Luật Viên chức và TT 04/2005) — dấu hiệu trích nguồn không đáng tin. Đây là lý do mọi kết luận pháp lý từ nguồn ngoài đều được ghi dạng "cần đối chiếu", không ghi thẳng thành "đã hết hiệu lực".

**Codex cũng chỉ đúng một lỗi kỹ thuật của chính bộ kiểm tra:** script chỉ soi trường `soHieu:` nên bỏ sót căn cứ nằm trong chuỗi thường — đúng chỗ `office-docx.ts` lọt lưới. Đã mở rộng quét sang `app/` và `components/`, bắt mọi chuỗi dạng "&lt;Loại&gt; số A/YYYY/KH", đồng thời bỏ qua trường `ghiChu` (ghi chú lịch sử "Thay NĐ 06/2021" là đúng, không phải sai căn cứ).

Kết quả sau khi mở rộng: quét **585 mục** (trước là 252) — vẫn **0 mục nêu văn bản đã bãi bỏ làm căn cứ**, 58 mục trước 2020 cần rà tay.

> **Bài học lặp lại lần thứ ba trong phiên:** bản vá đầu của bộ lọc `ghiChu` bị dính lỗi escape (`` thành ký tự backspace), khiến script báo **10 dương tính giả** mà `tsc` vẫn sạch. Nếu tin ngay kết quả đó thì đã sửa nhầm 10 chú thích lịch sử đang đúng.

### 8.6. Phiếu khai hiệu lực cho 13 văn bản chưa phân loại (20/8/2026)

3 văn bản cần nạp (Luật CBCC 2025, Luật Viên chức 129/2025, NĐ 170/2025) **không có trên máy** — không có trong `G:\My Drive\Tailieu_VBPL` (119 file) lẫn toàn ổ G. Phải do Sở cung cấp bản chính thức; hệ thống không tự tải từ nguồn ngoài.

Trong lúc chờ, đã xử lý phần làm được: **13 văn bản trong kho chưa khai hiệu lực** mang tên máy sinh (`108_2026_TT-BCA_704772.docx`, `Quyet dinh 1425.pdf`…) nên người duyệt không biết đó là văn bản gì nếu không mở từng file.

`scripts/lap-phieu-khai-hieu-luc.mjs` (mới) đọc phần đầu nội dung đã trích xuất trong CSDL để lấy số hiệu, ngày ban hành, trích yếu → sinh phiếu Excel `PHIEU_KHAI_HIEU_LUC_VBPL.xlsx` + khối JSON dán vào bảng đăng ký. Kết quả: **13/13 đọc được, 0 phải mở file đối chiếu.**

Script **không tự quyết định hiệu lực** — cột tình trạng để người có thẩm quyền điền; khối JSON đặt sẵn `can_kiem_chung` kèm tiền tố `MÁY ĐỌC, CHƯA XÁC NHẬN` để không ai hiểu nhầm là hệ thống đã xác nhận.

**Các lỗi đã phải vá trong chính script này** — đều thuộc loại "tự tạo ra căn cứ sai":

| Lỗi | Biểu hiện thật | Đã vá |
|---|---|---|
| Lấy số hiệu từ phần Căn cứ | `Quyet dinh 1425.pdf` → đọc thành `142/2026/NĐ-CP`, ngày `18/02/2025` (ngày Luật Tổ chức Chính phủ) | Đối chiếu số với tên file; hỗ trợ mẫu `1425/QĐ-TTg`; ngày chỉ nhận nếu nằm TRƯỚC phần "Căn cứ" |
| OCR tách/dính chữ | `năm 202 6`, `ngày29`, `SỐ:1425` | Chuẩn hoá trước khi bóc tách |
| `` của JS chỉ tính ký tự ASCII | Mốc dừng `Căn cứ` không bao giờ khớp → trích yếu tràn cả trang căn cứ | Bỏ `` sau các mốc dừng tiếng Việt |
| Chuẩn hoá quá tay | "MỘT **SỐ** ĐIỀU" bị đổi thành "MỘT **Số:** ĐIỀU" | Chỉ chuẩn hoá khi `SỐ` dính dấu hai chấm hoặc dính liền chữ số |

Codex phản biện bắt đúng 4 nhóm lỗi trên (ordinal prefix trong tên file, mẫu `QĐ-TTg`, OCR, và khối JSON có dòng `//` khiến dán vào `.json` là hỏng cú pháp). Riêng nhận định "chưa thấy vấn đề về SQL/encoding" thì đúng.

