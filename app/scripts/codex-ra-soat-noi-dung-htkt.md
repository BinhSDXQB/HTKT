# Phiếu giao việc phản biện cho Codex — lớp nội dung chuyên môn HTKT (24/8/2026)

> **Chạy khi nào:** ngay khi tài khoản OpenAI có hạn mức trở lại (hoặc sau khi `codex login`
> bằng tài khoản ChatGPT). Hiện Codex CLI báo *"You have no credits remaining"* nên chưa
> phản biện được — nội dung dưới đây do Claude tự đối chiếu bản gốc, **chưa qua phản biện chéo**.
>
> **Lệnh chạy:**
> ```
> codex exec --skip-git-repo-check -C C:\Troly\HTKT\app "$(cat scripts/codex-ra-soat-noi-dung-htkt.md)"
> ```

## Bối cảnh

Hệ thống quản lý hạ tầng kỹ thuật của Sở Xây dựng Quảng Trị đang chạy thật. Vừa bổ sung
một lớp **nội dung chuyên môn** cho Phòng Hạ tầng kỹ thuật, gồm 5 tệp:

| Tệp | Nội dung | Văn bản gốc đã đối chiếu |
|---|---|---|
| `lib/htkt/quy-trinh-linh-vuc.ts` | 9 quy trình (7 chuyên ngành + 2 khung) | NĐ 258/2025/NĐ-CP · TT 12/2024/TT-BXD · NĐ 269/2025/NĐ-CP · TT 03/2026/TT-BXD · **NĐ 178/2026/NĐ-CP** |
| `lib/htkt/phan-cap-cong-trinh.ts` | Bảng phân cấp công trình HTKT | TT 34/2026/TT-BXD Phụ lục I Bảng 1.3, Phụ lục II mục 2.2.2 |
| `lib/htkt/quy-hoach.ts` | HTKT trong quy hoạch đô thị, nông thôn | Luật 47/2024/QH15 · Luật 144/2025/QH15 · TT 16/2025/TT-BXD |
| `lib/htkt/ha-tang-thong-minh.ts` | HTKT & chiếu sáng đô thị thông minh | NĐ 269/2025/NĐ-CP Đ23–25 · TT 03/2026/TT-BXD Đ2 + Phụ lục I |
| `lib/htkt/tra-cuu-nghiep-vu.ts` | Cổng tra cứu cho chatbot (tool `tra_cuu_nghiep_vu_htkt`) | — |

Bản gốc các văn bản nằm ở `G:\My Drive\Tailieu_VBPL` (định dạng .docx/.pdf, đọc được bằng
`mammoth` / `pdfjs-dist`). Một phần đã nạp vào kho RAG (bảng `tai_lieu`, `tai_lieu_chunk`);
riêng **NĐ 258/2025 và NĐ 269/2025 CHƯA nạp được** (hết hạn mức OpenAI) nên phải đọc thẳng
từ tệp .docx.

## Việc cần làm — đóng vai phản biện (devil's advocate)

Nhiệm vụ là **tìm chỗ SAI**, không phải khen. Với mỗi lỗi tìm được, nêu: tệp, dòng, nội dung
sai, nội dung đúng, và **trích nguyên văn đoạn văn bản gốc** làm bằng chứng.

### 1. Kiểm tính đúng của trích dẫn điều – khoản (ưu tiên cao nhất)
Mọi mục trong 4 tệp nội dung đều có trường `canCu` / `khoan` / `bamVao` ghi điều – khoản.
Mở bản gốc, kiểm **từng trích dẫn**:
- Điều/khoản đó có tồn tại không?
- Nội dung mô tả có đúng điều/khoản đó không, hay bị gán nhầm sang điều khác?
- Có mốc thời gian, số ngày, tên mẫu biểu nào bị chép sai không?

Đặc biệt soi kỹ:
- `quy-trinh-linh-vuc.ts`: quy trình cấp giấy phép chặt hạ cây xanh — thời hạn **20 ngày làm
  việc / 10 ngày làm việc**, hiệu lực giấy phép **30 ngày**, báo cáo sau **10 ngày**,
  **Mẫu số 01 / Mẫu số 02 Phụ lục I** NĐ 258/2025.
- Mốc báo cáo **trước 01/12** (cấp xã) và **trước 15/12** (cơ quan chuyên môn cấp tỉnh)
  theo Điều 43 khoản 2 NĐ 258/2025.
- Hai quy trình KHUNG lấy từ **NĐ 178/2026/NĐ-CP**: bảo trì tài sản KCHT (Điều 14, 7 khoản)
  và báo cáo kê khai (Điều 33 — thời hạn **30 ngày**, chốt số liệu năm tại thời điểm kết thúc
  năm tài chính). Kiểm xem NĐ 178/2026 có thật sự áp dụng cho công trình HTKT đô thị do Sở/tỉnh
  giao quản lý không (Điều 1 khoản 1 có cụm "tài sản kết cấu hạ tầng đô thị"), và hai quy trình
  này có bị gán nhầm cho lĩnh vực nào không.
- `quy-hoach.ts`: các trích dẫn Điều 2, Điều 3, Điều 6, Điều 7, Điều 16 Luật 47/2024 và
  khoản 11, 15 Điều 2 do Luật 144/2025 sửa đổi.

### 2. Kiểm bảng phân cấp công trình (rủi ro cao nhất về hậu quả)
`lib/htkt/phan-cap-cong-trinh.ts` mã hoá Bảng 1.3 Phụ lục I TT 34/2026/TT-BXD dưới dạng
mảng 5 ô `[Đặc biệt, I, II, III, IV]`. Số liệu được bóc từ bảng HTML của tệp .docx nên **có
rủi ro lệch cột do ô gộp (merged cell)**.

Mở lại Phụ lục I Thông tư 34/2026/TT-BXD và **đối chiếu từng dòng**, đặc biệt:
- `1.3.1.1` nhà máy nước: có đúng ≥150 nghìn m³/ngày đêm là cấp **Đặc biệt** không?
- `1.3.2.1` hồ điều hoà: có đúng cột Đặc biệt để trống, ≥20 ha là cấp **I** không?
- `1.3.3.1.a` trạm trung chuyển vs `1.3.3.1.b` cơ sở xử lý CTR — hai dòng này lệch nhau
  một cột trong dữ liệu đã mã hoá. Đúng hay sai?
- `1.3.8.2` nhà để xe ô tô nổi — dòng này thiếu ô "tiêu chí" do gộp dọc; cột có bị trượt không?
- `1.3.10` công trình lấn biển.
- Phụ lục II mục `2.2.2` (cột đèn chiếu sáng): ≥300 / 150÷<300 / 75÷<150 / >45÷<75 / ≤45 m.

Nếu bảng gốc phân cấp hệ thống chiếu sáng đô thị ở chỗ nào khác mà nội dung hiện tại
bỏ sót, chỉ ra.

### 3. Kiểm phần đô thị thông minh
`lib/htkt/ha-tang-thong-minh.ts` chép 5 lĩnh vực HTKT thông minh (NĐ 269/2025 Điều 24) và
các chỉ số Phụ lục I TT 03/2026 (II.QH.03.01–03, III.GT.05.01–09, III.NL.06.01–02,
III.CN.07.01, III.TNT.08.01, III.TNM.09.01, III.CTR.10.01, III.MT.11.01–02).
- Có chỉ số nào chép thiếu / sai cấp độ (nền tảng ↔ liên kết ↔ đổi mới quản trị) không?
- Ký hiệu B1/B2 gán có đúng không?
- Con số "19 chỉ số cơ bản cấp tỉnh" và "09 + 10 chỉ số với đô thị thuộc tỉnh" có đúng
  Điều 2 khoản 2 điểm c, d không?
- Khẳng định "Phụ lục I KHÔNG có chỉ số riêng cho công viên, cây xanh" đúng hay sai?

### 4. Kiểm phần diễn giải nghiệp vụ
Các mảng `VIEC_CUA_PHONG`, `CHECKLIST_GOP_Y`, `LUU_Y_AP_DUNG` là **diễn giải**, không phải
trích nguyên văn. Kiểm: có chỗ nào diễn giải vượt quá điều luật, hoặc áp đặt nghĩa vụ mà
văn bản không quy định không?

### 5. Kiểm phần khai báo khoảng trống
Các mảng `KHOANG_TRONG`, `CHUA_DU_CAN_CU`, `CAN_DOI_CHIEU` tuyên bố hệ thống **chưa có căn
cứ** cho: cấp nước, thoát nước, nghĩa trang, không gian ngầm, sử dụng chung; thông số kỹ
thuật đèn; chỉ tiêu quy hoạch HTKT.
- Có văn bản nào trong `G:\My Drive\Tailieu_VBPL` thật ra **đã có** nội dung đó mà bị bỏ sót không?
- Có tuyên bố "chưa có" nào thật ra sai không?

### 6. Kiểm phần chatbot
`app/api/chatbot/route.ts`: tool `tra_cuu_nghiep_vu_htkt` và phần system prompt vừa thêm.
- Mô tả tool có đủ rõ để model chọn đúng tool giữa `tra_cuu_nghiep_vu_htkt`,
  `tra_cuu_phap_ly_chuyen_nganh`, `tra_cuu_tai_lieu` không?
- Có câu hỏi nào của cán bộ sẽ bị định tuyến nhầm không?
- Danh sách 9 văn bản "chưa nạp được vào kho" trong prompt có khớp thực tế CSDL không?
  (kiểm bằng SQL: `SELECT "tieuDe","soChunk" FROM tai_lieu WHERE "deletedAt" IS NULL`)

## Cách trả lời

Xuất một bảng: `# | Mức độ (Cao/Vừa/Thấp) | Tệp:dòng | Nội dung sai | Nội dung đúng | Trích nguyên văn bản gốc`.
Không đề xuất tính năng mới. Không sửa file — chỉ báo cáo.

**Ràng buộc bắt buộc:** mọi kết luận pháp lý phải dựa trên **văn bản gốc trong
`G:\My Drive\Tailieu_VBPL`** hoặc dữ liệu trong CSDL, KHÔNG dựa vào trí nhớ. Nếu không mở
được bản gốc thì ghi "chưa kiểm chứng được", không đoán. Trong dự án này Codex đã từng sai
ngày hiệu lực và từng dẫn cùng một URL cho hai kết luận khác nhau — nên bằng chứng trích
nguyên văn là bắt buộc.
