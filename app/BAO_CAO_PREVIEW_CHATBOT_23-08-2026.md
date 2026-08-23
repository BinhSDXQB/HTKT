# Preview chất lượng trả lời của chatbot — nội dung MỚI (nghỉ hưu theo NĐ 170/2025)

**Ngày kiểm:** 23/8/2026 · **Nhánh:** `ra-soat-csdl-chatbot-phap-ly`
**Cách kiểm:** hỏi thật qua `/api/chatbot` bằng phiên admin (có gọi OpenAI thật, có đối chiếu tool đã dùng trong `chatbot_logs`), đối chiếu nguyên văn Điều 61–63 trong bản gốc `170_2025_ND-CP_663212.docx` của kho tài liệu; Codex CLI phản biện chéo phần mã nguồn.

---

## 1. Kết quả TRƯỚC khi vá — 4 lỗi thật

| # | Câu hỏi thử | Chatbot trả lời | Đánh giá |
|---|---|---|---|
| 1 | "Công chức được lùi thời điểm nghỉ hưu tối đa bao lâu?" | *"Nghị định 170/2025 … không có quy định chi tiết về thời gian lùi tối đa hoặc trường hợp cụ thể"* | **SAI** — Điều 61 khoản 3 quy định rõ 01/03/06 tháng |
| 2 | "Vừa tai nạn vừa điều trị dài ngày thì được lùi tổng 9 tháng đúng không?" | *"Hệ thống chưa có thông tin…"* | **KHÔNG BÁC BỎ** tiền giả định sai — khoản 4: chỉ áp dụng MỘT trường hợp lùi nhiều nhất |
| 3 | "Ông Phạm Xuân Thảo nghỉ hưu ngày nào?" | *"chưa có dữ liệu ngày nghỉ hưu trong hồ sơ"* | **SAI kiểu nguy hiểm nhất** — CSDL có ngày 01/4/2038; tool `ho_so_can_bo` không hề `select` trường nghỉ hưu nên mô hình kết luận "không có" |
| 4 | "Ai sắp nghỉ hưu?" | *"nghỉ hưu ngày 01/06/2027"* | **THIẾU** — ngày máy tính theo NĐ 135/2020 bị trình bày như đã chốt; tool không đọc `ngayNghiHuuLui` nên hồ sơ đã có quyết định lùi sẽ bị trả sai thời điểm |

Gốc rễ: commit 78b1147 đã tách "ngày dự kiến" khỏi "thời điểm đã quyết định lùi" ở CSDL, `lib/nghi-huu.ts` và bộ sinh văn bản (Mẫu 2/3), **nhưng chatbot chưa được nối vào**; đồng thời `CO_SO_PHAP_LY` mới mã hoá Điều 61 ở mức tiêu đề, chưa có khoản 3–6.

Phần đã đúng sẵn: căn cứ thủ tục nghỉ hưu (NĐ 170/2025 Điều 62/63, Mẫu số 2/3) và cảnh báo NĐ 46/2010 hết hiệu lực 01/7/2025 — trả lời chính xác ngay từ trước khi vá.

## 2. Đã vá

1. **`lib/data/co-so-phap-ly-nhan-su.ts`** — mã hoá đầy đủ Điều 61 khoản 1–6 (trần lùi 1/3/6 tháng; khoản 4 không cộng dồn; khoản 5 thẩm quyền; khoản 6 kéo dài thời gian công tác là chế định khác), Điều 63 khoản 3–4; thêm từ khoá "lùi thời điểm nghỉ hưu", "mẫu số 2/3". Câu chữ lấy từ bản gốc trong kho, không diễn giải thêm.
2. **`app/api/chatbot/route.ts`**
   - hàm dùng chung `moTaNghiHuu()`: gọi `thoiDiemNghiHuu()`, ghi rõ **DỰ KIẾN** hay **ĐÃ QUYẾT ĐỊNH LÙI** (kèm trường hợp A/B/C, số văn bản, ngày dự kiến trước khi lùi); mốc đã qua thì nói rõ (hợp đồng lao động sau tuổi hưu ≠ hồ sơ biên chế sai).
   - `ho_so_can_bo`: `select` thêm `ngayVeHuu, ngayNghiHuuLui, truongHopLui, vanBanLuiNghiHuu, gioiTinh, trangThai` và in dòng "Thời điểm nghỉ hưu".
   - `xep_hang_nhan_su` (sắp nghỉ hưu): lọc và **sắp xếp theo thời điểm thật** (ngày đã lùi nếu có), gắn nhãn dự kiến/đã lùi.
   - SYSTEM_PROMPT: 3 quy tắc mới — luôn phân biệt dự kiến/đã lùi, trần lùi và quy tắc không cộng dồn, căn cứ hiện hành là NĐ 170/2025 (NĐ 46/2010 chỉ nhắc kèm "đã hết hiệu lực").
3. **`scripts/smoke-chatbot.mjs`** — thêm 7 ca, trong đó 1 ca **động** (tự lấy một cán bộ có ngày nghỉ hưu trong CSDL rồi hỏi đích danh, chống lỗi "phủ nhận dữ liệu đang có"), 1 bẫy cộng dồn 9 tháng và 1 bẫy dẫn văn bản hết hiệu lực.

### Lỗi thứ 5 phát hiện thêm khi kiểm thử — dẫn văn bản từ TRÍ NHỚ

Ở câu bẫy "Theo Nghị định 999/2026 thì thời hạn cấp phép xây dựng…", chatbot bác bỏ đúng số hiệu giả **nhưng tự bồi thêm**: *"Về thời hạn cấp phép hiện nay, theo Nghị định 175/2024/NĐ-CP (sửa đổi bởi NĐ 105/2025, 144/2025)…"*. Đối chiếu CSDL: kho tài liệu **không có** NĐ 175/2024 (đã bị NĐ 217/2026 thay từ 01/7/2026) — tức mô hình lấy từ kiến thức nền, đúng thứ mà nguyên tắc "KHÔNG BỊA" cấm.

Đã bổ sung **quy tắc 8** vào SYSTEM_PROMPT: mọi số hiệu văn bản viết ra phải xuất hiện trong kết quả tool của chính lượt đó; đã trả lời "không có văn bản đó" thì không được bồi thêm quy định "hiện hành" bằng kiến thức chung. Sau khi vá, câu này chỉ còn dẫn Quyết định 949/QĐ-BXD có thật trong kho, kèm số trang.

## 3. Kết quả SAU khi vá — 18/18 đạt

Trích một số câu (nguyên văn):

- *"Không, công chức không được lùi tổng cộng 9 tháng… Theo Nghị định 170/2025/NĐ-CP Điều 61 khoản 4, nếu thuộc nhiều trường hợp thì chỉ được áp dụng một trường hợp có thời gian lùi nhiều nhất, không cộng dồn, với trần tuyệt đối là 06 tháng."*
- *"Ông Nguyễn Xuân Nghĩa dự kiến nghỉ hưu ngày 01/07/2012 theo tính toán máy (Nghị định 135/2020), hiện chưa có quyết định lùi… mốc này đã qua và ông đang làm việc theo hợp đồng lao động sau tuổi nghỉ hưu."*
- Nhánh "đã lùi" được kiểm chứng bằng cách ghi TẠM một quyết định lùi vào 1 hồ sơ rồi hoàn nguyên ngay: chatbot trả *"01/04/2061, đã có quyết định lùi… trường hợp bị bệnh nặng hoặc tai nạn, tối đa 3 tháng… văn bản… ngày dự kiến trước khi lùi là 01/01/2061"*. Đã kiểm tra hồ sơ trở về nguyên trạng (cả 3 cột = NULL).

## 4. Còn tồn — kiến nghị xử lý tiếp

| Mức | Vấn đề | Đề xuất |
|---|---|---|
| **Trung** | `lib/nghi-huu-alert.ts` tính mốc "trước 6 tháng ra thông báo / trước 3 tháng ra quyết định" từ `ngayVeHuu` (dự kiến), chưa qua `thoiDiemNghiHuu()`. Điều 62/63 NĐ 170/2025 đếm từ thời điểm nghỉ hưu **theo Điều 61**, tức đã tính phần lùi. Hiện chưa có hồ sơ nào được lùi nên chưa sai thực tế, nhưng sẽ sai ngay khi có. | Cho `classifyRetireAlert` nhận thời điểm thật; sửa cùng trang `van-phong-so/canh-bao` |
| **Thấp** | Che dữ liệu trong `chatbot_logs` chưa xử lý mã số BHXH (10 số không bắt đầu bằng 0) và email. Codex đề xuất che mọi dãy 10–16 số — **không nên áp dụng**, sẽ che nhầm số tiền, số lượng, năm… làm hỏng mục đích phân tích log. | Nếu cần, che theo giá trị thật lấy từ `can_bo.maSoBHXH/maSoThue` thay vì regex mù |
| **Thấp** | 4 hồ sơ có ngày nghỉ hưu đã qua nhưng trạng thái vẫn hoạt động — đều là `HOP_DONG` (hợp lệ: ký HĐLĐ sau tuổi hưu). Chatbot nay đã nói rõ điều này. | Không cần sửa dữ liệu |
| **Thấp** | Vài câu hỏi pháp lý ngắn ("NĐ 46/2010 còn hiệu lực không?") được trả lời đúng nhưng **không gọi tool** — đúng nhờ prompt, không nhờ dữ liệu. | Đã siết bằng quy tắc mới; theo dõi qua `toolsUsed` trong smoke |

## 5. Rà toàn dự án: "văn bản pháp lý mới nhất đã cập vào chatbot hết chưa?"

Chatbot có **3 nguồn pháp lý**. Kết quả đối chiếu (script mới `scripts/kiem-tra-vbpl-chatbot.mjs`):

| Nguồn | Trước 23/8/2026 | Sau khi vá |
|---|---|---|
| Kho RAG toàn văn (`tra_cuu_tai_lieu`) | 106 văn bản; **23 chưa xác minh hiệu lực** → chatbot trả lời nước đôi | **103 còn hiệu lực · 3 chưa xác minh**, khai bằng bằng chứng trích từ chính văn bản |
| Danh mục chuyên ngành 11 phòng (`lib/phong/phap-ly-phong.ts` + `lib/htkt/phap-ly.ts`, ~225 mục) | **KHÔNG hề nối vào chatbot** — chỉ hiển thị trên dashboard | Đã nối qua tool mới `tra_cuu_phap_ly_chuyen_nganh` |
| Pháp lý nhân sự (`CO_SO_PHAP_LY`) | 22 văn bản, chỉ 1 có toàn văn trong kho | Giữ nguyên (bản tóm tắt mã hoá tay có điều/khoản) — nay có thể đối chiếu bằng script |

Thêm tool `tra_cuu_hieu_luc_van_ban`: hỏi "Nghị định X còn hiệu lực không / hệ thống có chưa" thì trả lời theo dữ liệu (còn hiệu lực / hết hiệu lực + văn bản thay thế / chưa nạp), thay vì suy đoán. Trước đó hỏi NĐ 175/2024 chatbot chỉ trả lời được "không có trong CSDL pháp lý nhân sự".

**Còn thiếu — cần người xử lý, máy không tự làm được:**

| Văn bản | Tình trạng | Việc cần làm |
|---|---|---|
| **NĐ 238/2026/NĐ-CP** (sửa NĐ 168/2024 xử phạt giao thông) | Chỉ có bản **PDF SCAN** (14 trang, 0 ký tự văn bản) → chưa nạp được vào kho | Tải bản .docx từ Công báo (hoặc OCR) rồi chạy `node prisma/sync-vbpl.mjs` |
| **NĐ 269/2025/NĐ-CP** (đô thị thông minh) | Chỉ có bản **PDF SCAN** (30 trang, 0 ký tự) | Như trên |
| 3 tài liệu `can_kiem_chung` (NĐ 104/2026, Quyết định 1425, "Suất vốn đầu tư…") | Không tìm được điều khoản thi hành trong phần đã nạp | Bổ sung tay vào `prisma/hieu-luc-vbpl.json` sau khi đối chiếu bản chính thức |

SYSTEM_PROMPT trước đây khẳng định "kho đã nạp các văn bản trên" — **sai** với 2 nghị định trên; đã sửa lại và ghi rõ hai văn bản này chỉ được nói là chưa nạp.

## 6. Codex phản biện chéo — tiếp thu gì, bác gì

| Góp ý của Codex | Xử lý |
|---|---|
| `kq.ngay < new Date()` lệch múi giờ, đánh dấu "đã qua" ngay trong ngày nghỉ hưu | **Tiếp thu** — so theo mốc đầu ngày (`Date.UTC` của hôm nay) |
| Regex "6 tháng/3 tháng" quá chặt, trượt oan khi mô hình viết bằng chữ | **Tiếp thu** — chấp nhận cả "sáu/ba/một tháng" |
| Bẫy 9 tháng dễ PASS giả | **Tiếp thu một phần** — buộc phủ định gắn với mức trần 6 tháng; nhưng bỏ đề xuất cấm cụm "tối đa … 9 tháng" vì chính câu trả lời ĐÚNG cũng chứa cụm đó (đã thử, trượt oan) |
| Cụm "trần tuyệt đối 06 tháng" là diễn giải thêm | **Tiếp thu** — sửa thành "mức lùi nhiều nhất có thể là 06 tháng theo điểm c khoản 3" |
| Che mọi dãy 10–16 chữ số trong nhật ký | **Bác** — sẽ che nhầm số tiền/số lượng/năm, hỏng mục đích phân tích log |
| Cấm từ "chính thức" trong ca "ai sắp nghỉ hưu" | **Bác** — chính câu trả lời đúng có câu "thời điểm chính thức lấy theo Quyết định nghỉ hưu Mẫu số 3" |
| Codex không đọc được `xep_hang_nhan_su`, `office-docx.ts` (file dài) nên bỏ ngỏ mục 2 và 6 | Đã tự kiểm: `xep_hang_nhan_su` nay dùng `thoiDiemNghiHuu()`; bộ sinh văn bản đã dùng từ commit trước; chỗ còn sót là `lib/nghi-huu-alert.ts` (bảng mục 4) |
| **Danh mục pháp lý 11 phòng chưa nối vào chatbot** | **Tiếp thu** — thêm tool `tra_cuu_phap_ly_chuyen_nganh` (mục 5) |
| SYSTEM_PROMPT khẳng định "kho đã nạp các văn bản trên" mà không kiểm chứng | **Tiếp thu** — sửa câu này + thêm `scripts/kiem-tra-vbpl-chatbot.mjs` chạy định kỳ |
| Chưa có tool trả lời "văn bản X còn hiệu lực không" | **Tiếp thu** — thêm tool `tra_cuu_hieu_luc_van_ban` |
| Script khai hiệu lực "kết luận quá tay" (chỉ dựa 1–2 câu, dẫn lại kết quả rà soát cũ) | **Tiếp thu** — script nay TỰ quét kho tìm tuyên bố bãi bỏ và kiểm năm ban hành với văn bản "hiệu lực kể từ ngày ký". Quét này lại lộ 2 **dương tính giả** phải chặn tiếp: NĐ 96/2026 chỉ "bãi bỏ **một số điều**" của NĐ 19/2026, NĐ 193/2026 chỉ "bãi bỏ **một số nội dung**" của NĐ 254/2025 — sửa đổi một phần thì văn bản **vẫn còn hiệu lực** |
| Cắt danh mục ở 30 văn bản có thể mất văn bản quan trọng | **Tiếp thu** — xếp văn bản `trongTam` lên trước khi cắt |
| `$queryRaw` ghép chuỗi có nguy cơ SQL injection | **Bác** — tham số chỉ nhận `\d{1,4}/20\d\d` bóc từ regex (chỉ chữ số) và Prisma tagged template vẫn tham số hoá |

## 7. Cách chạy lại

```bash
node scripts/smoke-chatbot.mjs               # toàn bộ 18 ca
node scripts/smoke-chatbot.mjs --loc nghi-huu # chỉ nhóm nghỉ hưu
```

```bash
node scripts/kiem-tra-vbpl-chatbot.mjs        # độ phủ văn bản pháp lý của chatbot
```
