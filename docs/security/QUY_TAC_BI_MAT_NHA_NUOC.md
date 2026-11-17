# QUY_TAC_BI_MAT_NHA_NUOC — quy tắc văn bản mật và dữ liệu gửi AI ngoài (PROPOSED)

Ngày: 2026-11-12 · Bước 0 của `docs/architecture/UPGRADE_V6_GAP.md`. Đây là **bản đề xuất**, chưa sửa mã, chưa có hiệu lực cho đến khi lãnh đạo Sở/Văn phòng/Pháp chế xác nhận.
Nhãn: **V** = đã kiểm trong mã · **CĐC** = cần đối chiếu văn bản gốc · **U** = chưa biết · **P** = đề xuất.

## 1. Căn cứ pháp lý

| Văn bản | Nội dung dùng | Trạng thái kiểm |
|---|---|---|
| Luật Bảo vệ bí mật nhà nước số 117/2025/QH15 | Điều 27: hiệu lực 01/3/2026; Luật 29/2018/QH14 (đã sửa theo Luật 81/2025/QH15) hết hiệu lực cùng ngày | CĐC — đọc qua hethongphapluat.com ngày 12/11/2026; `vbpl.moj.gov.vn` không truy cập được từ máy này; **kho `G:\My Drive\Tailieu_VBPL` chưa có văn bản này** |
| Luật 117/2025 Điều 5 (hành vi bị nghiêm cấm) | Theo bản tóm tắt đọc được: cấm soạn thảo, lưu giữ tài liệu chứa bí mật nhà nước trên thiết bị kết nối Internet/mạng viễn thông (có ngoại lệ mạng LAN độc lập và pháp luật cơ yếu); cấm truyền đưa trái quy định qua mạng; cấm dùng thiết bị chưa bảo đảm an ninh; cấm dùng trí tuệ nhân tạo để xâm phạm bí mật nhà nước | CĐC — **chưa có nguyên văn**, công cụ đọc web chỉ trả tóm tắt; số khoản và câu chữ phải đọc lại ở Công báo trước khi viện dẫn |
| Luật 117/2025 Điều 8 | Ba độ mật: Tuyệt mật, Tối mật, Mật | CĐC (cùng nguồn) |
| Nghị định hướng dẫn Luật 117/2025; danh mục bí mật nhà nước ngành Xây dựng; quy chế bảo vệ bí mật nhà nước của Sở | — | U — chưa tìm, chưa có trong kho |
| Luật 134/2025 Đ27, Luật 91/2025 Đ30, NĐ 142/2026 | Trách nhiệm người quyết định khi dùng AI; xử lý dữ liệu cá nhân bằng AI | V — đã đối chiếu nguyên văn ngày 11/11/2026 (`UPGRADE_V4_PROPOSAL.md` §3) |

Việc phải làm trước khi viện dẫn trong văn bản của Sở: lấy bản .docx Luật 117/2025 từ Công báo, đưa vào kho VBPL, đọc nguyên văn Điều 5 và các điều về soạn thảo/lưu giữ/truyền đưa.

## 2. Hiện trạng trong hệ thống (V, rà mã ngày 12/11/2026)

1. Hệ thống chạy trên VPS nối Internet (IIS + HTTPS), không phải mạng LAN độc lập.
2. Form Văn thư – Lưu trữ có trường "Độ mật" với lựa chọn `Thường / Mật / Tối mật / Tuyệt mật` — `app/lib/nghiep-vu/schema.ts:807`. Bản ghi lưu vào `nghiep_vu_ban_ghi` gồm trích yếu (`tieuDe`), số ký hiệu, cơ quan ban hành, ghi chú (`schema.prisma:3249-3277`).
3. Module hồ sơ nghiệp vụ **không có chức năng đính kèm tệp** (không có `dinhKem`/upload trong `components/nghiep-vu/*.tsx`, `app/actions/nghiep-vu.ts`). Rủi ro nằm ở phần chữ: trích yếu và ghi chú.
4. Chatbot và RAG **không đọc** bảng `nghiep_vu_ban_ghi` (bảng này chỉ được dùng trong `app/actions/nghiep-vu.ts`, các tệp bảo trì tuyến và bộ đếm trang chủ).
5. Dữ liệu đi ra nhà cung cấp AI ngoài ở 4 nơi: `app/api/chatbot/route.ts`, `app/api/htkt/ai-generate/route.ts`, `app/api/htkt/tham-dinh-ho-so/hoi-dap/route.ts`, `lib/rag/embeddings.ts` (mọi tài liệu nạp vào kho đều được gửi đi để tạo véc-tơ). Không nơi nào kiểm dấu mật trước khi gửi.
6. **U**: hiện có bao nhiêu bản ghi văn thư đang chọn Mật/Tối mật/Tuyệt mật (chưa truy vấn CSDL thật).

## 3. Quy tắc đề xuất (P)

| # | Quy tắc | Cách thực hiện trong mã (chưa làm) | Cấp |
|---|---|---|---|
| R1 | Hệ thống **không tiếp nhận nội dung** thuộc bí mật nhà nước dưới bất kỳ hình thức nào: trích yếu, ghi chú, tệp, câu hỏi chatbot | Dòng cảnh báo cố định ở form Văn thư, trang nạp tài liệu, ô chatbot | S |
| R2 | Trường "Độ mật" của Văn thư – Lưu trữ chỉ còn `Thường`; văn bản mật quản lý ở sổ riêng theo quy chế của Sở, không nhập vào hệ thống | Sửa `schema.ts:807`; bản ghi cũ đã chọn mức mật: liệt kê cho Văn phòng xử lý, **không tự xoá** | M |
| R3 | Chặn nạp vào kho RAG và thẩm định hồ sơ khi phần đầu văn bản trích ra có dấu `MẬT`, `TỐI MẬT`, `TUYỆT MẬT` (dạng dấu chỉ độ mật, không phải chữ "mật" trong câu) | Hàm kiểm trong `lib/rag/ingest.ts` trước bước nhúng; có test; từ chối kèm lý do | M |
| R4 | Không gửi sang AI ngoài: CCCD, lương, hồ sơ cán bộ (RESTRICTED). Dữ liệu nội bộ/hạn chế chỉ gửi khi có văn bản cho phép của người có thẩm quyền | Đã có ở mức nguyên tắc (`DATA_CLASSIFICATION.md` mục 3); cần văn bản của Sở | — |
| R5 | Ghi nhật ký mỗi lần từ chối theo R3 (ai, lúc nào, tên tệp; không lưu nội dung) | `createAuditLog` | S |

Giới hạn cần nói rõ: R3 là kiểm theo dấu hiệu chữ, không phát hiện được văn bản mật bị xoá dấu hoặc ảnh quét không có lớp chữ. Biện pháp chính vẫn là quy chế và trách nhiệm người nhập.

## 4. Cần người có thẩm quyền quyết định

1. Chấp nhận R2 (bỏ hẳn lựa chọn mật) hay giữ trường để ghi nhận "có văn bản mật, xem sổ riêng" mà không ghi trích yếu.
2. Ai xử lý các bản ghi cũ đã chọn mức mật (nếu có).
3. Văn bản cho phép/cấm gửi dữ liệu nội bộ sang nhà cung cấp AI ngoài (R4).
4. Quy chế bảo vệ bí mật nhà nước hiện hành của Sở và danh mục bí mật ngành — cung cấp để đối chiếu.
