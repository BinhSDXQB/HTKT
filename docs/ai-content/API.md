# API module Nội dung AI — `/api/ai/v1` (mốc M1)

Mọi route: cờ `AI_CONTENT_ENABLED` khác `1` → **404**; chưa đăng nhập → **401**; không thuộc nhóm được soạn → **403**; yêu cầu ghi có `Origin` khác `Host` → **403**. Người thực hiện luôn lấy từ phiên đăng nhập phía máy chủ, không nhận từ body. Lỗi nghiệp vụ trả `{ error, chiTiet?: string[] }` với mã 400/403/404/409. Mọi thời điểm trả về là chuỗi ISO-8601 UTC.

| Phương thức | Đường dẫn | Việc |
|---|---|---|
| GET | `/noi-dung?trangThai=&tu=` | Danh sách bài (tối đa 200) |
| POST | `/noi-dung` | Tạo bài: `{ tieuDe, noiDung, phanLoai?, doAiTao?, coTheGayNhamLan?, nguonIds? }` → `{ id }` |
| GET | `/noi-dung/{id}` | Chi tiết: bài, phiên bản hiện hành, biến thể, nguồn, lịch sử duyệt, lịch, `bamHienTai`, `quyen` |
| PUT | `/noi-dung/{id}` | Sửa bài (body như tạo). Nội dung đổi → phiên bản mới; luôn về `DRAFT`, huỷ lịch chưa đăng |
| POST | `/noi-dung/{id}` | Hành động, body `{ loai, ... }` — xem bảng dưới |
| GET | `/lich?tu=ISO&den=ISO` | Lịch trong khoảng (≤ 62 ngày, ≤ 500 dòng) |
| POST | `/lich/{id}` | `{ loai: 'huy' }` · `{ loai: 'xac_nhan', url }` · `{ loai: 'doi_soat', ketQua: 'PUBLISHED'\|'FAILED', url? }` |
| GET | `/tong-quan?nhatKy=N` | Số liệu tổng quan, nhật ký gần nhất, cấu hình kênh |
| GET | `/nguon?q=` | Tài liệu kho có thể gắn làm nguồn (chỉ tiêu đề, phạm vi, hiệu lực) |

Hành động trên bài (`POST /noi-dung/{id}`):

| `loai` | Tham số | Điều kiện |
|---|---|---|
| `bien_the` | `kenh`, `noiDung` | Hợp lệ theo cấu hình kênh; sửa khi không ở `DRAFT` → về `DRAFT` |
| `bien_the_tu_dong` | `kenh: string[]` | Sinh theo quy tắc từ bài gốc (không gọi AI) |
| `gui_duyet` | — | `DRAFT`/`REJECTED`, có ≥ 1 biến thể |
| `duyet` / `tu_choi` | `ghiChu?` | `PENDING_REVIEW`; quản trị/lãnh đạo; khác mọi tác giả |
| `thu_hoi` | `ghiChu?` | `APPROVED`; quản trị/lãnh đạo |
| `dat_lich` | `kenh`, `ngay` (YYYY-MM-DD), `gio` (HH:mm), `adapter?` (`manual`\|`dry_run`) | Qua cổng xuất bản; thời điểm ở tương lai; chưa có lịch sống cho phiên bản + kênh |

## Trạng thái
- Bài: `DRAFT → PENDING_REVIEW → APPROVED | REJECTED`, `CANCELLED`.
- Lịch (mỗi kênh độc lập): `SCHEDULED → PUBLISHING → PUBLISHED | FAILED | RETRY_PENDING | UNKNOWN_OUTCOME`, `CANCELLED`, `EXPIRED`.
- Trạng thái tổng hợp nhiều kênh suy ra động (`lib/ai-content/trang-thai.ts`), không lưu.

## Cổng xuất bản (kiểm khi đặt lịch, khi worker nhận việc, khi xác nhận đăng tay)
1. Bài ở `APPROVED`; quyết định mới nhất là `APPROVED`, đúng phiên bản, **băm khớp** (băm bao: nội dung phiên bản, phân loại, cờ AI, mọi biến thể kênh, danh sách nguồn).
2. Phân loại `PUBLIC`.
3. Mọi tài liệu nguồn: còn trong kho, phạm vi `CONG_KHAI`, `con_hieu_luc`.
4. Bài "AI tạo, có thể gây nhầm lẫn": phần đầu của bản sẽ đăng chứa thông báo chuẩn.
5. Có biến thể cho kênh và biến thể hợp lệ theo cấu hình kênh.
