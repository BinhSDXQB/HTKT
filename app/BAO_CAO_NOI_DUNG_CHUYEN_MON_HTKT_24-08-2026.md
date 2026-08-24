# Báo cáo: hoàn thiện nội dung chuyên môn Hạ tầng kỹ thuật + chatbot

**Ngày:** 24/8/2026 · **Nhánh:** `ra-soat-csdl-chatbot-phap-ly`
**Yêu cầu:** hoàn thiện nội dung chi tiết của dự án — quy trình, tiêu chuẩn kỹ thuật, quy hoạch,
điện chiếu sáng thông minh…, trong đó có chatbot; phối hợp với Codex.

---

## 0. Việc quan trọng nhất phải báo trước

### 🔴 Tài khoản OpenAI của hệ thống ĐÃ HẾT HẠN MỨC

```
429 credit_balance_exhausted — "You have no credits remaining."
```

Đây không phải lỗi phần mềm. Hậu quả **đang xảy ra ngay lúc này**:

| Chức năng | Tình trạng |
|---|---|
| Chatbot trả lời câu hỏi | **NGỪNG HOÀN TOÀN** — mọi câu hỏi đều lỗi |
| Nạp văn bản mới vào kho tài liệu | **KHÔNG NẠP ĐƯỢC** (nhúng vector cũng gọi OpenAI) |
| Tra cứu tài liệu (RAG) | Không tạo được véc-tơ câu hỏi → không tìm được |
| Codex CLI (để phản biện chéo) | **KHÔNG CHẠY ĐƯỢC** — dùng chung API key |
| Các chức năng còn lại của phần mềm | Bình thường |

**Cần làm:** nạp hạn mức tại <https://platform.openai.com/settings/organization/billing/>.
Sau khi nạp, chạy `node prisma/sync-vbpl.mjs` — 9 văn bản đang chờ sẽ tự vào kho.

Vì Codex dùng chung API key này nên **chưa thực hiện được bước phản biện chéo**. Toàn bộ
nội dung dưới đây do Claude tự đối chiếu bản gốc; phiếu giao việc cho Codex đã soạn sẵn tại
`scripts/codex-ra-soat-noi-dung-htkt.md`, chạy được ngay khi có hạn mức.

---

## 1. Lỗi đã phát hiện và vá: "bản ghi ma" nuốt 9 văn bản

### Hiện tượng
9 văn bản nằm trong kho tài liệu nhưng **0 đoạn** — chatbot không đọc được chữ nào, mà mỗi
lần đồng bộ lại đều bị bỏ qua với lý do "đã có".

Trong đó có đúng hai văn bản là xương sống của yêu cầu hôm nay:
- **Nghị định 258/2025/NĐ-CP** — quản lý công viên, cây xanh, mặt nước
- **Nghị định 269/2025/NĐ-CP** — phát triển đô thị thông minh

Bảy văn bản còn lại: Luật CBCC 80/2025, NĐ 233/2026, NĐ 238/2026, NĐ 259/2026, NĐ 300/2026,
NĐ 335/2025, NĐ 365/2025.

### Nguyên nhân gốc
`prisma/sync-vbpl.mjs` tạo bản ghi `tai_lieu` **trước**, rồi mới gọi OpenAI nhúng véc-tơ.
Khi OpenAI trả 429 giữa chừng, bản ghi ở lại kho với `trangThai='dang_xu_ly'`, `soChunk=0`,
**nhưng metadata đã có `fileHash`**. Lần đồng bộ sau, bước chống trùng khớp `fileHash` →
đếm là "đã có" → **bỏ qua vĩnh viễn**.

Ghi chú: hệ thống chống trùng vốn được vá hồi 20/8 để chặn "hố đen PDF scan". Lỗi lần này
là một cửa khác của cùng cơ chế — trùng theo mã băm tệp, không kiểm tra bản ghi có nội dung thật.

### Đã vá (`prisma/sync-vbpl.mjs`)
1. Nhúng véc-tơ có **thử lại 5 lần** với giãn cách tăng dần khi gặp 429/5xx.
2. Lỗi giữa chừng → **xoá sạch bản ghi dở**, không để lại vết chặn đường.
3. Bước chống trùng coi bản ghi `soChunk = 0` hoặc chưa `san_sang` là **chưa nạp** → nạp lại.
4. Thêm bộ đếm "♻️ Nạp lại bản rỗng" vào báo cáo đồng bộ.

Đã chạy thật: 9 bản ghi rỗng được dọn sạch. Kho hiện **108 tài liệu, 0 bản ghi rỗng**
(kiểm bằng SQL). 9 tệp gốc vẫn nguyên trong `G:\My Drive\Tailieu_VBPL`, sẽ tự nạp khi có hạn mức.

### Chặn tái phát vòng hai — phát hiện thêm khi chạy thử
Bản vá đầu đặt **thử lại 5 lần** khi gặp 429. Nhưng hết hạn mức thì thử lại là vô ích: mỗi tệp
mất hơn một phút chờ suông, mà tác vụ đồng bộ chạy **15 phút một lần** → các lần chạy chồng lên
nhau, và nếu tiến trình bị kill giữa chừng thì hàm dọn không kịp chạy, lại sinh bản ghi ma mới.
Đã gặp đúng như vậy: sau lần vá đầu, tác vụ định kỳ vẫn tạo thêm 2 bản ghi rỗng (NĐ 238/2026,
NĐ 269/2025). Vá tiếp:
- Phân biệt **hết hạn mức** (`credit_balance_exhausted` / `insufficient_quota`) với **quá tải
  tạm thời** — hết hạn mức thì KHÔNG thử lại, **dừng ngay cả vòng đồng bộ** (nay dừng trong vài
  giây thay vì hàng chục phút).
- Khi dừng giữa chừng thì **bỏ qua bước xoá đồng bộ** — vòng quét chưa đi hết thư mục, xoá đồng
  bộ lúc đó dễ gỡ nhầm tài liệu vẫn còn tệp.
- Thêm `scripts/don-ban-ghi-tai-lieu-rong.mjs` để quét và dọn bản ghi 0 đoạn khi tiến trình bị
  kill (chạy không tham số = chỉ liệt kê; `--xoa` mới xoá). Đã dùng để dọn 1 bản ghi sót lại.

### Chặn tái phát (`scripts/healthcheck.mjs`)
- Thêm mục **"Kho tài liệu không có bản ghi 0 đoạn"** — mục kiểm cũ chỉ bắt tài liệu dưới
  500 ký tự nên không thấy loại lỗi này (bản ghi ma vẫn có `soKyTu` rất lớn).
- Thêm mục **"Hạn mức dịch vụ AI (OpenAI)"** — gọi thử một lần nhúng chuỗi ngắn, phát hiện
  hết hạn mức ngay trong ngày thay vì đợi người dùng báo chatbot hỏng.

### Chatbot báo lỗi đúng nguyên nhân (`app/api/chatbot/route.ts`)
Trước đây hết hạn mức bị xử lý như quá tải tạm thời: thử lại 3 lần (~7 giây) rồi trả
"Hệ thống chưa truy vấn được dữ liệu lúc này" — người dùng tưởng do câu hỏi của mình.
Nay nhận diện mã `credit_balance_exhausted` / `insufficient_quota`, **không thử lại**, trả
HTTP 503 kèm thông báo nói rõ là tài khoản dịch vụ AI hết hạn mức và các chức năng khác vẫn dùng được.

---

## 2. Lớp nội dung chuyên môn mới (5 tệp)

Nguyên tắc biên soạn: **mỗi mục phải chỉ ra được điều – khoản của văn bản gốc.** Chỗ nào
chưa tra được thì ghi vào mục "khoảng trống", không viết ra theo trí nhớ.

Bản gốc được đọc thẳng từ `G:\My Drive\Tailieu_VBPL` (kể cả 2 văn bản chưa nạp được vào kho).

| Tệp | Nội dung | Căn cứ đã đối chiếu |
|---|---|---|
| `lib/htkt/quy-trinh-linh-vuc.ts` | **9 quy trình** quản lý nhà nước (7 chuyên ngành + 2 khung) | NĐ 258/2025 · TT 12/2024/TT-BXD · NĐ 269/2025 · TT 03/2026/TT-BXD · NĐ 178/2026 |
| `lib/htkt/phan-cap-cong-trinh.ts` | **Bảng phân cấp công trình HTKT** (tiêu chuẩn kỹ thuật) | TT 34/2026/TT-BXD, Phụ lục I Bảng 1.3 + Phụ lục II mục 2.2.2 |
| `lib/htkt/quy-hoach.ts` | **HTKT trong quy hoạch** đô thị và nông thôn | Luật 47/2024 · Luật 144/2025 · TT 16/2025/TT-BXD |
| `lib/htkt/ha-tang-thong-minh.ts` | **HTKT & chiếu sáng đô thị thông minh** | NĐ 269/2025 Điều 23–25 · TT 03/2026 Điều 2 + Phụ lục I |
| `lib/htkt/tra-cuu-nghiep-vu.ts` | Cổng tra cứu chung cho chatbot và giao diện | — |

### 2.1. Quy trình (9 quy trình có bước, hồ sơ, thời hạn, thẩm quyền)

| Quy trình | Điểm cứng đáng chú ý |
|---|---|
| Cấp giấy phép chặt hạ, dịch chuyển cây xanh | 20 ngày làm việc (cây cần bảo tồn) / 10 ngày làm việc (khác); giấy phép có giá trị **30 ngày**; Mẫu số 01 & 02 Phụ lục I NĐ 258/2025; 4 trường hợp **miễn** giấy phép; báo cáo sau chặt hạ trong **10 ngày** |
| Lập & phê duyệt quy trình quản lý, duy trì cây xanh | 7 nội dung bắt buộc (Điều 30 khoản 2) |
| Lập & phê duyệt quy trình quản lý, vận hành công viên | 6 nội dung bắt buộc; **UBND cấp tỉnh** phê duyệt; hồ điều hoà lập quy trình riêng |
| Đề án phát triển công viên, cây xanh, mặt nước đô thị | Đăng tải dự thảo **ít nhất 30 ngày** tham vấn cộng đồng |
| CSDL & chế độ báo cáo công viên, cây xanh | **Trước 01/12** (cấp xã) và **trước 15/12** (cơ quan chuyên môn cấp tỉnh) hằng năm |
| Định mức KT-KT & dự toán chi phí dịch vụ chiếu sáng, cây xanh | 4 khoản mục chi phí; định mức tỷ lệ chi phí quản lý chung **do UBND cấp tỉnh quy định** |
| Phát triển chiếu sáng công cộng thông minh | 6 bước theo 3 cấp độ trưởng thành |

Thêm **2 quy trình KHUNG áp dụng cho cả 8 lĩnh vực**, lấy từ Nghị định 178/2026/NĐ-CP
(Điều 1 nêu đích danh "tài sản kết cấu hạ tầng đô thị"):

| Quy trình khung | Điểm cứng |
|---|---|
| Bảo trì công trình thuộc tài sản kết cấu hạ tầng | Nghĩa vụ bảo trì bắt buộc; xử lý vật tư thu hồi theo quy định thanh lý; nếu đã cho thuê/chuyển nhượng quyền khai thác thì bên nhận bảo trì **bằng kinh phí của mình** (Điều 14) |
| Báo cáo kê khai & cập nhật CSDL tài sản kết cấu hạ tầng | **30 ngày** kể từ ngày đưa vào sử dụng / tiếp nhận / xử lý / thay đổi thông tin; báo cáo năm chốt số liệu tại thời điểm kết thúc năm tài chính (Điều 33) |

Hai quy trình này được gắn nhãn rõ **"quy định KHUNG — không thay thế quy trình chuyên ngành"**
trên cả giao diện lẫn kết quả chatbot, để 5 lĩnh vực còn thiếu văn bản chuyên ngành không bị
hiểu nhầm là đã có đủ quy trình.

### 2.2. Tiêu chuẩn kỹ thuật — phân cấp công trình

Bảng 1.3 Thông tư 34/2026/TT-BXD được bóc **trực tiếp từ bảng trong bản .docx gốc** (giữ
nguyên cột, không gõ lại): cấp nước, thoát nước, chất thải rắn, công viên, nghĩa trang, nhà
tang lễ, cơ sở hoả táng, nhà để xe, cáp viễn thông, công trình lấn biển.

**Một phát hiện đáng lưu ý:** Bảng 1.3 **không có dòng riêng cho hệ thống chiếu sáng đô thị**.
Hạng mục chiếu sáng chỉ được phân cấp qua Phụ lục II mục 2.2.2 (kết cấu dạng cột) theo
chiều cao cột: ≥300 m → đặc biệt; 150÷<300 → I; 75÷<150 → II; >45÷<75 → III; **≤45 m → IV**.
Nghĩa là cột đèn chiếu sáng thông thường là **công trình cấp IV** theo tiêu chí kết cấu.

### 2.3. Quy hoạch

Điểm quan trọng cho địa bàn: **quy hoạch chuyên ngành hạ tầng kỹ thuật và quy hoạch không
gian ngầm chỉ lập cho thành phố trực thuộc trung ương** (Luật 47/2024 Điều 3 khoản 2 điểm d, đ).
Quảng Trị là tỉnh → không lập hai loại này; nội dung HTKT nằm trong quy hoạch chung, phân
khu, chi tiết.

Cùng với: định nghĩa **hạ tầng kỹ thuật khung** (Luật 144/2025 sửa khoản 15 Điều 2), trình tự
8 bước (Điều 16), **8 chuyên ngành HTKT** phải thể hiện trong đồ án, và **danh mục 6 điểm
kiểm khi Phòng góp ý đồ án**.

### 2.4. Điện chiếu sáng thông minh

**Định nghĩa pháp lý** (NĐ 269/2025 Điều 24 khoản 3) — 4 hợp phần bắt buộc:
thiết bị tiết kiệm năng lượng hiệu suất cao · cảm biến và kết nối mạng · tự động điều chỉnh
độ sáng theo điều kiện môi trường và lưu lượng giao thông · quản lý tập trung để giám sát và
cảnh báo sự cố.

**Ba cấp độ trưởng thành** (TT 03/2026 Phụ lục I, chỉ số III.NL.06.01):
① đèn tiết kiệm năng lượng hiệu suất cao → ② điều chỉnh tự động bằng cảm biến, quản lý tập
trung, chia sẻ với Trung tâm điều hành cấp tỉnh → ③ tích hợp AI.

**Điều kiện phải kiểm khi thẩm định** (Điều 23 khoản 3, Điều 25 khoản 1): tiêu chuẩn mở,
không phụ thuộc một nhà cung cấp duy nhất; kết nối LGSP và Trung tâm điều hành đô thị thông
minh; **API mở**.

Ngoài chiếu sáng, module còn có đủ **17 chỉ số** trụ cột Hạ tầng kỹ thuật và Quy hoạch:
giao thông (9), năng lượng (2), cấp nước, thoát nước thải, thoát nước mưa, chất thải rắn,
môi trường (2), quy hoạch (3).

---

## 3. Giao diện

- **8 trang lĩnh vực** (`/dashboard/phong-htkt/<lĩnh vực>`) trước đây chỉ có tiêu đề + danh
  sách nhiệm vụ. Nay mỗi trang có thêm khối nội dung chuyên môn: **Quy trình nghiệp vụ ·
  Tiêu chí kỹ thuật phân cấp công trình · Trong đồ án quy hoạch · Chỉ số đô thị thông minh**,
  mỗi mục kèm điều – khoản.
- **Trang mới** `/dashboard/phong-htkt/do-thi-thong-minh` — chuyên đề "Hạ tầng kỹ thuật &
  chiếu sáng đô thị thông minh"; đã thêm vào sidebar và trang tổng quan phòng.
- Lĩnh vực chưa đủ căn cứ hiển thị **khung cảnh báo màu hổ phách** nói rõ thiếu văn bản nào —
  không để trang trông như đã đầy đủ.

---

## 4. Chatbot

Thêm tool **`tra_cuu_nghiep_vu_htkt`** với 4 chủ đề: `quy_trinh` · `phan_cap` · `quy_hoach` ·
`thong_minh`. Kết quả trả về luôn kèm điều – khoản và **luôn kèm phần "⚠️ khoảng trống"**
để mô hình không lấp chỗ trống bằng kiến thức chung.

System prompt được bổ sung:
- Định tuyến các câu hỏi nghiệp vụ HTKT sang tool mới, phân biệt rõ với
  `tra_cuu_phap_ly_chuyen_nganh` (chỉ là danh mục số hiệu) và `tra_cuu_tai_lieu` (toàn văn).
- **Sửa một thông tin đã cũ**: prompt trước ghi "kho chưa có NĐ 238/2026 và NĐ 269/2025 vì là
  bản scan chưa OCR". Thực tế cả hai là tệp .docx đọc được bình thường; nguyên nhân là hết hạn
  mức nhúng véc-tơ, và số văn bản chưa nạp là **9** chứ không phải 2. Đã ghi lại đúng, kèm lưu
  ý riêng: nội dung HTKT của NĐ 258/2025 và NĐ 269/2025 đã được mã hoá trong tool mới nên
  vẫn trả lời được dù chưa có trong kho toàn văn.

---

## 4b. Kiểm thử và công cụ

### Sửa cảnh báo giả của bộ kiểm căn cứ pháp lý
Healthcheck báo **đi lùi**: "5 mục đang nêu văn bản đã bãi bỏ làm căn cứ". Soi ra 4 mục là nội
dung mới của đợt này và đều là **cảnh báo giả** — chúng viết "TT 34/2026 **thay** Thông tư
06/2021/TT-BXD", tức nói văn bản cũ ĐÃ BỊ THAY, đúng chứ không phải viện dẫn. Mục thứ 5 là mục
lịch sử đã tự khai `hieuLucDen` và `thayTheBoi`.

Đã siết `scripts/kiem-tra-can-cu-phap-ly.mjs` cho đúng ý nghĩa, phạm vi hẹp:
- Bỏ qua số hiệu đứng **ngay sau** động từ thay thế ("thay", "thay thế", "bãi bỏ", "hết hiệu
  lực") — chỉ soi 40 ký tự liền trước.
- Bỏ qua mục danh mục đã **tự khai** `hieuLucDen` / `thayTheBoi`, cửa sổ cắt tại mục kế tiếp để
  không mượn nhầm thông tin của mục sau.
- **Đã kiểm chứng bộ lọc không bị mù**: tạo file thử có một dòng viện dẫn thật "Nghị định
  06/2021/NĐ-CP" → vẫn bị bắt; dòng "thay Thông tư 06/2021/TT-BXD" cùng file → bỏ qua đúng.

Kết quả: **0 mục nêu văn bản đã bãi bỏ làm căn cứ**.

### Bộ kiểm thử nội dung — `scripts/smoke-noi-dung-htkt.mjs`
52 phép kiểm chạy trong ~2 giây, **không gọi OpenAI, không cần CSDL**: mọi bước quy trình có
dẫn điều – khoản; mốc 20/10 ngày làm việc, 30 ngày, 01/12, 15/12 khớp bản gốc; bảng phân cấp
đủ 8 nhóm / 19 dòng và mỗi dòng đúng 5 ô; lĩnh vực khai "chưa đủ căn cứ" thì không được đồng
thời có quy trình; mọi chủ đề tra cứu đều phải trả về cảnh báo khoảng trống.
Kết quả hiện tại: **52 đạt / 0 không đạt**. Đã nối vào `healthcheck`.

**Bộ kiểm thử này đã bắt được 3 lỗi thật ngay lần chạy đầu** — bộ tìm kiếm khớp nguyên cụm nên
câu hỏi tự nhiên của cán bộ bị trượt: "chặt hạ cây xanh" không ra quy trình (vì tiêu đề là
"chặt hạ, **dịch chuyển** cây xanh"), "chiếu sáng thông minh" không ra chỉ số III.NL.06.01
(tiêu đề là "chiếu sáng **đường phố** thông minh"), "nhà máy nước cấp mấy" không ra dòng
1.3.1.1. Đã thay bằng tìm kiếm **chấm điểm theo từ** (`lib/htkt/tim-kiem.ts`): tách câu hỏi
thành từ, bỏ từ đệm, cộng điểm theo số từ khớp, xếp hạng giảm dần.

### Hai công cụ đọc văn bản gốc (không phụ thuộc OpenAI)
- `scripts/doc-van-ban-goc.mjs` — đọc thẳng .docx/.pdf trong `G:\My Drive\Tailieu_VBPL`:
  `ds` (liệt kê) · `muc-luc` (in Chương/Mục/Điều) · `tim` (đoạn quanh từ khoá) ·
  `bang` (in bảng **giữ đúng cột** — chính là cách bóc bảng phân cấp công trình) · `xuat`.
- `scripts/tim-doan-trong-kho.mjs` — tìm đoạn trong kho tài liệu bằng SQL, không dùng véc-tơ
  nên không tốn hạn mức.

Hai công cụ này chính là thứ cho phép soạn được nội dung có dẫn nguồn dù kho RAG và chatbot
đang tê liệt vì hết hạn mức.

---

## 5. Chưa làm được / cần Sở quyết

| # | Nội dung | Vì sao |
|---|---|---|
| 1 | **Nạp hạn mức OpenAI** | Chatbot đang ngừng hoàn toàn. Ưu tiên số 1 |
| 2 | **Phản biện chéo bằng Codex** | Codex dùng chung API key đã hết hạn mức. Phiếu giao việc đã soạn sẵn: `scripts/codex-ra-soat-noi-dung-htkt.md` |
| 3 | Quy trình cho **cấp nước · thoát nước · nghĩa trang · không gian ngầm · sử dụng chung** | Kho chưa có nghị định chuyên ngành đang hiệu lực của 5 lĩnh vực này. Đề nghị Sở cung cấp bản gốc |
| 4 | **Thông số kỹ thuật đèn chiếu sáng** (độ rọi, độ chói, nhiệt độ màu) và **chỉ tiêu quy hoạch HTKT** (m³ nước/người, tỷ lệ đất giao thông, m² cây xanh/người) | Thuộc quy chuẩn/tiêu chuẩn kỹ thuật quốc gia — kho **chưa có bản gốc QCVN nào**. Hệ thống và chatbot đang trả lời "chưa có căn cứ" thay vì nêu số |
| 5 | **Đề án phát triển đô thị thông minh tỉnh Quảng Trị** | Nhiều chỉ số phải đối chiếu Đề án của tỉnh mới kết luận đạt/không đạt. Chưa có trong hệ thống |
| 6 | **Quyết định phân cấp của UBND tỉnh** về cấp giấy phép chặt hạ cây xanh | NĐ 258/2025 Điều 27 khoản 4 giao UBND cấp tỉnh phân cấp cho cơ quan chuyên môn và/hoặc UBND cấp xã. Chưa biết Quảng Trị phân cấp thế nào → chưa trả lời công dân được câu "nộp hồ sơ ở đâu" |

---

## 6. Điểm cần soi kỹ khi phản biện

Tự đánh giá chỗ rủi ro nhất trong đợt này:

1. **Bảng phân cấp công trình** — số liệu bóc từ bảng .docx có ô gộp; nếu lệch một cột thì
   sai cấp công trình, kéo theo sai thẩm quyền thẩm định. Hai dòng `1.3.3.1.a` và `1.3.3.1.b`
   trong bảng gốc bắt đầu ở hai cột khác nhau — đã ghi chú lại, cần đối chiếu bản in.
2. **Chỉ số II.QH.03.01** — bảng chính và bảng "giải thích nội dung chỉ số" của Phụ lục I có
   nội dung khác nhau; đã tách thành hai trường riêng để không gán nhầm cấp độ.
3. Các mục **diễn giải nghiệp vụ** (`VIEC_CUA_PHONG`, `CHECKLIST_GOP_Y`) không phải trích
   nguyên văn — cần soát xem có áp đặt nghĩa vụ nào văn bản không quy định không.
