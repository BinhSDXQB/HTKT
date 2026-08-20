# Thiết kế liên thông CSDL quốc gia về hoạt động xây dựng

**Căn cứ:** Nghị định 212/2026/NĐ-CP (17/6/2026) + Thông tư 39/2026/TT-BXD.
**Nguồn cấu hình:** [`lib/xd-lien-thong/dinh-danh.ts`](../../lib/xd-lien-thong/dinh-danh.ts) · **DB:** migration `040_httt_lien_thong_hdxd.sql` (namespace `httt_*`).

## 1. Nội dung 2 văn bản (đọc từ bản gốc trong kho VBPL)
- **NĐ 212/2026** lập **Hệ thống thông tin & 4 CSDL quốc gia về hoạt động xây dựng**: (1) quy hoạch đô thị–nông thôn; (2) dự án/công trình; (3) định mức–giá–chỉ số giá; (4) năng lực HĐXD. Mỗi đối tượng gắn **1 mã định danh duy nhất** (Đ8), dùng suốt vòng đời để quản lý–liên kết–kế thừa–cập nhật.
- **TT 39/2026** hướng dẫn: **trường dữ liệu, biểu mẫu, quy trình cập nhật** (Đ4-6, Phụ lục I + Bảng 1/2 Phụ lục II); mã định danh dùng để **liên kết, kế thừa, cập nhật** dữ liệu qua các thủ tục.

## 2. Nguyên tắc liên thông (đưa vào thiết kế)
| Nguyên tắc | Căn cứ | Hiện thực trong DB |
|---|---|---|
| Mỗi đối tượng = 1 mã định danh duy nhất, suốt vòng đời | NĐ212 Đ8 | `httt_dinh_danh` (UNIQUE loại+mã) |
| Mã định danh **năng lực**: cá nhân VN = **CCCD**; khác = **hộ chiếu**; tổ chức = **mã số DN** | NĐ212 Đ19 | `loai_ma` + helper `loaiMaNangLuc()` |
| **Dữ liệu chủ** = dữ liệu chung + mã định danh | NĐ212 Đ11/15/20 | cột định kiểu (dữ liệu chung) + `TRUONG_DU_LIEU_CHU` |
| **Dữ liệu mở** công bố cổng quốc gia | NĐ212 Đ20 | cờ `la_du_lieu_mo` |
| Kết quả TTHC **điện tử gắn mã định danh**, giá trị pháp lý như bản giấy | NĐ212 Đ21.6 | `ket_qua_dien_tu_path` |
| Trường chi tiết theo Phụ lục I/II TT39 | TT39 Đ6 | `truong_bo_sung` JSONB (nạp chính xác khi đấu nối) |
| Kết nối, chia sẻ, cập nhật với HTTT quốc gia | NĐ212 Đ22-25 | `httt_dong_bo_log` (KHOI_TAO/CAP_NHAT/TRA_CUU/CHIA_SE) |

## 3. Bảng dữ liệu (migration 040)
| Bảng | Vai trò |
|---|---|
| `httt_dinh_danh` | Sổ đăng ký mã định danh **universal** cho 6 loại đối tượng (4 CSDL). Liên kết mềm `bang_local`+`id_local` tới bản ghi nội bộ; `trang_thai_dong_bo`; `phan_hoi_httt` |
| `httt_nang_luc_ca_nhan` | Chứng chỉ hành nghề cá nhân — dữ liệu chung (lĩnh vực/hạng/thời hạn) + chi tiết (cơ sở đào tạo, trình độ, số CC, QĐ cấp, cơ quan cấp) + `ket_qua_dien_tu_path` (Đ18.2, Đ27-28) |
| `httt_nang_luc_to_chuc` | Năng lực tổ chức — mã số DN, tên nhà thầu, lĩnh vực/hạng/số CC năng lực + `thong_tin_nang_luc` (Đ18.3, Đ41) |
| `httt_dong_bo_log` | Nhật ký đồng bộ/kết nối HTTT quốc gia |

## 4. Liên thông với dữ liệu hiện có
- Lĩnh vực nghiệp vụ **`phong-qlhd-xd/chung-chi-nha-thau`** và **`phong-qh-kt/chung-chi-kien-truc`** (NghiepVuBanGhi) là nơi cán bộ đang nhập chứng chỉ → **chuẩn hoá/đối chiếu** về `httt_nang_luc_*` và gắn qua `httt_dinh_danh` (bang_local/id_local) để đồng bộ.
- Quy hoạch (phong-qh-kt), dự án/công trình (thẩm định, GPXD, nghiệm thu), định mức–giá (phong-kt-vl) → khi có thủ tục sẽ **khởi tạo mã định danh** vào `httt_dinh_danh` và trỏ về bản ghi local.

## 5. Giả định & việc cần khi đấu nối thực tế
1. **Trường Phụ lục I + Bảng 1/2 Phụ lục II (TT39):** cần bóc tách đầy đủ từ bản gốc → nạp vào `truong_bo_sung` theo đúng khoá field của HTTT quốc gia (giữ JSONB để không phá schema khi Bộ XD cập nhật).
2. **API/giao thức kết nối HTTT quốc gia** (khởi tạo mã định danh, đồng bộ) chưa công bố public endpoint → `httt_dong_bo_log` sẵn sàng ghi nhận khi có cổng kết nối; trước mắt nhập/quản lý nội bộ, đánh dấu `CHUA_KHOI_TAO`.
3. **Kết nối CSDL quốc gia về dân cư** (lấy/đối chiếu CCCD làm mã định danh cá nhân — Đ19.3.a) và **đăng ký doanh nghiệp** (mã số DN) cần thoả thuận chia sẻ dữ liệu.
4. Đây là **văn bản 2026 (sau mốc dữ liệu mô hình)** — nội dung đã đọc trực tiếp từ file gốc `212_2026_ND-CP` + `39_2026_TT-BXD` trong kho VBPL; khi ban hành sửa đổi/bổ sung phải cập nhật lại.
