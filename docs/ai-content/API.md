# API module Nội dung AI — `/api/ai/v1` (mốc M1)

Mọi route: cờ `AI_CONTENT_ENABLED` khác `1` → **404**; chưa đăng nhập → **401**; không thuộc nhóm được soạn → **403**; yêu cầu ghi có `Origin` không thuộc tên miền của hệ thống (Host của yêu cầu hoặc danh sách trong `lib/ai-content/may-chu.ts`) → **403**. Người thực hiện luôn lấy từ phiên đăng nhập phía máy chủ, không nhận từ body. Lỗi nghiệp vụ trả `{ error, chiTiet?: string[] }` với mã 400/403/404/409. Mọi thời điểm trả về là chuỗi ISO-8601 UTC.

| Phương thức | Đường dẫn | Việc |
|---|---|---|
| GET | `/noi-dung?trangThai=&tu=` | Danh sách bài (tối đa 200) |
| POST | `/noi-dung` | Tạo bài: `{ tieuDe, noiDung, phanLoai?, doAiTao?, coTheGayNhamLan?, nguonIds? }` → `{ id }` |
| GET | `/noi-dung/{id}` | Chi tiết: bài, phiên bản hiện hành, biến thể, nguồn, lịch sử duyệt, lịch, `bamHienTai`, `quyen` |
| PUT | `/noi-dung/{id}` | Sửa bài (body như tạo, **kèm `bamNen`** = `bamHienTai` của bản đang sửa; lệch → 409, tránh lưu đè từ màn hình cũ). Nội dung đổi → phiên bản mới; có thay đổi thì về `DRAFT` và huỷ lịch chưa đăng; không đổi gì → `{ khongDoi: true }`, giữ nguyên trạng thái |
| POST | `/noi-dung/{id}` | Hành động, body `{ loai, ... }` — xem bảng dưới |
| GET | `/lich?tu=ISO&den=ISO` | Lịch trong khoảng (≤ 62 ngày, ≤ 500 dòng) |
| POST | `/lich/{id}` | `{ loai: 'huy' }` · `{ loai: 'xac_nhan', url }` · `{ loai: 'doi_soat', ketQua: 'PUBLISHED'\|'FAILED', url? }` |
| GET | `/tong-quan?nhatKy=N` | Số liệu tổng quan, nhật ký gần nhất, cấu hình kênh |
| GET | `/nguon?q=` | Tài liệu kho có thể gắn làm nguồn (chỉ tiêu đề, phạm vi, hiệu lực) |

Hành động trên bài (`POST /noi-dung/{id}`):

| `loai` | Tham số | Điều kiện |
|---|---|---|
| `bien_the` | `kenh`, `noiDung`, **`phienBanNen`** (= `phienBan.id` lúc mở), **`bienTheNen`** (nội dung bản kênh lúc mở, rỗng nếu chưa có); lệch → 409 | Hợp lệ theo cấu hình kênh; sửa khi không ở `DRAFT` → về `DRAFT` |
| `bien_the_tu_dong` | `kenh: string[]`, **`bamNen`** (= `bamHienTai` lúc mở; thiếu → 400, lệch → 409) | Sinh theo quy tắc từ bài gốc (không gọi AI) |
| `gui_duyet` | **`bamNen`** | `DRAFT`/`REJECTED`, có ≥ 1 biến thể |
| `duyet` / `tu_choi` | `bamDangXem` (bắt buộc), `ghiChu?` | `PENDING_REVIEW`; quản trị/lãnh đạo; khác MỌI người có phần trong phạm vi duyệt (người soạn phiên bản, người đổi phân loại/cờ AI/nguồn, mọi người từng sửa biến thể). `bamDangXem` = `bamHienTai` của bản đang hiển thị; lệch với CSDL → 409 (không duyệt bản chưa xem) |
| `thu_hoi` | `ghiChu?` | `APPROVED`; quản trị/lãnh đạo |
| `dat_lich` | **`bamNen`**, `kenh`, `ngay` (YYYY-MM-DD), `gio` (HH:mm), `adapter?` (`manual`\|`dry_run`), `dangLai?` + `lyDoDangLai?` (10–500 ký tự; bắt buộc khi kênh đã đăng phiên bản hiện hành bằng đăng thật) | Qua cổng xuất bản; thời điểm ở tương lai; chưa có lịch sống cùng loại cho phiên bản + kênh (chạy thử và đăng thật tính riêng) |

## Trạng thái
- Bài: `DRAFT → PENDING_REVIEW → APPROVED | REJECTED`, `CANCELLED`.
- Lịch (mỗi kênh độc lập): `SCHEDULED → PUBLISHING → PUBLISHED | FAILED | RETRY_PENDING | UNKNOWN_OUTCOME`, `CANCELLED`, `EXPIRED`.
- Trạng thái tổng hợp nhiều kênh suy ra động (`lib/ai-content/trang-thai.ts`), không lưu.

## Cổng xuất bản (kiểm khi đặt lịch, khi worker nhận việc, khi xác nhận đăng tay)
1. Bài ở `APPROVED`; quyết định mới nhất là `APPROVED`, đúng phiên bản, **băm khớp** (băm bao: nội dung phiên bản, phân loại, cờ AI, mọi biến thể kênh, danh sách nguồn).
2. Phân loại `PUBLIC`.
3. Mọi tài liệu nguồn: còn trong kho, phạm vi `CONG_KHAI`, `con_hieu_luc`.
4. Bài "AI tạo, có thể gây nhầm lẫn": bài đầu của bản sẽ đăng chứa đúng câu thông báo (`AI_CONTENT_NHAN_AI`, mặc định "Nội dung này được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo.") và câu đó đứng ngay sau tiêu đề (`AI_CONTENT_VI_TRI_NHAN=dau`, mặc định; `bat_ky` chỉ bật khi Pháp chế xác nhận). Căn cứ: Luật 134/2025/QH15 Điều 11 khoản 3; NĐ 142/2026/NĐ-CP Điều 18 khoản 3 điểm b.
5. Có biến thể cho kênh và biến thể hợp lệ theo cấu hình kênh.

## Lưu vết
- `ai_approvals.approved_payload` (jsonb): toàn bộ gói đã duyệt — nội dung từng biến thể, phân loại, cờ AI, nguồn.
- `ai_publication_schedules.body_snapshot`: đúng văn bản đã duyệt cho kênh lúc đặt lịch; không đổi dù biến thể về sau bị sửa.
- `ai_audit_events`: mọi thao tác ghi, cùng giao dịch với thao tác (nhật ký lỗi thì thao tác không thành). Không chứa nội dung bài.

GET chi tiết bài trả thêm `kenhDaDang: [{channel, chay_thu}]` (kênh đã đăng phiên bản hiện hành, lấy thẳng từ CSDL) và `viTriNhanAi`. Danh sách bài trả `lich` là MỘT trạng thái đại diện cho mỗi kênh (cần đối soát > đang đăng > đã đăng > đang chờ > lỗi).

Cấu hình thông báo AI: `AI_CONTENT_NHAN_AI` (20–200 ký tự, có chữ, không ký tự ẩn; sai → dùng câu mặc định và ghi lỗi ra log) và `AI_CONTENT_VI_TRI_NHAN` (`dau` \| `bat_ky`). Đổi hai khoá này phải khởi động lại cả web lẫn worker. Bài đã duyệt/đã đặt lịch theo câu cũ sẽ bị cổng chặn: sửa thông báo trong bản theo kênh, duyệt lại, đặt lịch lại.
