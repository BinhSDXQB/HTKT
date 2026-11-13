# Rà soát dữ liệu `report_thoat_nuoc` (biểu thoát nước cấp xã)

Ngày: 2026-11-12 · Truy vấn **chỉ đọc** trên CSDL thật (phiên `default_transaction_read_only=on`). Chưa sửa dòng nào.
Nhãn: **V** = đã đếm/đọc trong lần này · **I** = suy luận · **U** = chưa biết · **P** = đề xuất.

## 1. Tổng quan (V)

- 780 dòng, 23 tệp nguồn `PHỤ LỤC 1_<tên xã>.xlsx` = 23 xã, phường; tất cả năm 2025, trạng thái `DA_DUYET`, nhập ngày 28/7/2026.
- `report_cap_nuoc`: 0 dòng. 0 dòng có toạ độ. 0 dòng liên kết `doiTuongId`.
- Chỉ **323/780** dòng có loại nước đọc được.

## 2. Nguyên nhân gốc (V)

Mã nhập đọc **theo vị trí cột cố định**, không kiểm tiêu đề cột: `app/app/api/ward-reports/import/route.ts:228` (thoát nước: cột 0–9 = stt, tuyến, điểm đầu, điểm cuối, loại nước, chiều dài, phía, kích thước, năm, ghi chú) và dòng 237 (cấp nước). Tệp của xã thêm/bớt một cột, hoặc sheet cấp nước được đọc như sheet thoát nước, thì dữ liệu rơi sai trường mà không báo lỗi.
**I**: 780 dòng có thể được nhập bằng script hàng loạt ngày 28/7/2026 dùng cùng cách đọc; chưa truy script đó.

## 3. Sáu loại lỗi

| # | Lỗi | Phạm vi (V) | Bằng chứng | Hướng sửa (P) |
|---|---|---|---|---|
| L1 | **Sai đơn vị chiều dài**: nhập km vào cột mét | Phường Đồng Hới: 181/181 dòng, mọi giá trị < 20; tổng đang lưu 83,78 "m" | Dòng mẫu: `PHAN.C.TRINH … 0.271`, `BÙI THỊ XUÂN … 0.298` | Nhân 1000 cho đúng 181 dòng của tệp này → 83,78 km. Cùng dạng với quy tắc đơn vị đường đã ghi ở memory `quy-tac-don-vi-duong-phuong-xa` |
| L2 | **Lệch cột**: cột "loại nước" chứa chiều dài tuyến đường (km) | Phường Nam Đông Hà: 145/145 dòng | 144/145 giá trị khớp `report_duong.chieuDaiKm` của đúng tên đường (sai lệch < 0,01) | Loại nước **không có trong dữ liệu đã nhập** → phải đọc lại tệp gốc; nếu tệp gốc không có thì để trống, không suy đoán |
| L3 | **Lệch cột**: `loaiNuoc = 'x'`, `namSuDung` chứa kích thước cống, năm nằm ở `ghiChu` | Xã Lao Bảo: 31 dòng; 26 dòng `namSuDung` từ 500 đến 1000 | Dòng mẫu: `Quốc Lộ 9 … x … Cống hộp … 1000 … 2004` | Chuyển `namSuDung` → kích thước (ghép với "Cống hộp/Cống tròn"), `ghiChu` → năm; `x` là dấu tích ở cột loại nước, cần tệp gốc để biết cột nào được tích |
| L4 | **Sai biểu**: dòng của biểu cấp nước ghi vào bảng thoát nước | 49 dòng ở 14 xã, phường; không có chiều dài; `diemCuoi` là số hộ; `loaiNuoc` là "Giếng khoan", "Nước máy", "Máy bơm nước"… (Khe Sanh lệch thêm một cột: 17 dòng có "Nhà máy nước Khe Sanh") | Dòng mẫu: `Xã Cửa Tùng: Toàn xã … 7797 … Giếng khoan` | Chuyển sang `report_cap_nuoc` (tuyến → `tuyenDuong`, điểm đầu → `diaChi`, điểm cuối → `soHoGiaDinh`, loại → `hienTrang`), xoá mềm ở bảng thoát nước. Xã Đồng Lê: cả 4/4 dòng thuộc loại này |
| L5 | **Dữ liệu sai địa bàn**: tệp Xã Triệu Phong trùng hoàn toàn tệp Xã Phong Nha | 11/11 dòng giống nhau từng trường; nội dung là địa danh Phong Nha (TDP Trằm Mé, TDP Na, Tỉnh lộ 562) | Truy vấn `INTERSECT ALL` trả 11 | 11 dòng gắn Xã Triệu Phong (mã 19624) là **sai** → gỡ (xoá mềm) và xin lại tệp đúng của Triệu Phong |
| L6 | **Dòng rác và dòng thiếu** | 5 dòng rác (`….`, hàng đánh số cột `1 2 3 4 5 6`); 118 dòng năm sử dụng nằm ở `ghiChu` trong khi `namSuDung` trống; 106 dòng trống loại nước (Đồng Hới 61, Ba Đồn 18, Đông Hà 12, Quảng Ninh 12 — phần lớn là dòng con của một tuyến); Đồng Hới 120 dòng ghi tắt `NM`/`NT` | — | Xoá mềm dòng rác; chuyển năm 4 chữ số từ `ghiChu` sang `namSuDung`; `NM` → "Nước mưa", `NT` → "Nước thải"; dòng con kế thừa loại nước của dòng cha **chỉ khi** tệp gốc cho thấy đúng như vậy |

## 4. Bảng theo tệp nguồn (V)

| Xã, phường | Dòng | Đọc được loại | Trống | NM/NT | Số | x | Cấp nước | Khác | km đang lưu | Lỗi chính |
|---|---|---|---|---|---|---|---|---|---|---|
| Phường Đồng Hới | 181 | 0 | 61 | 120 | 0 | 0 | 0 | 0 | 0,1 | L1, L6 |
| Phường Đông Hà | 149 | 137 | 12 | 0 | 0 | 0 | 0 | 0 | 56,1 | L6 nhẹ |
| Phường Nam Đông Hà | 145 | 0 | 0 | 0 | 145 | 0 | 0 | 0 | 68,3 | L2 |
| Xã Quảng Ninh | 53 | 40 | 12 | 0 | 0 | 0 | 1 | 0 | 44,3 | L4, L6; không dòng nào có kích thước |
| Phường Quảng Trị | 44 | 44 | 0 | 0 | 0 | 0 | 0 | 0 | 32,6 | sạch |
| Xã Lao Bảo | 33 | 0 | 0 | 0 | 0 | 31 | 2 | 0 | 23,6 | L3, L4 |
| Xã Khe Sanh | 24 | 6 | 0 | 0 | 1 | 0 | 17 | 0 | 6,3 | L4, L6 |
| Phường Ba Đồn | 20 | 0 | 18 | 0 | 0 | 0 | 2 | 0 | 11,9 | L4, thiếu loại |
| Xã Cam Lộ | 19 | 18 | 0 | 0 | 0 | 0 | 1 | 0 | 9,8 | L4 |
| Xã Vĩnh Linh | 18 | 17 | 0 | 0 | 0 | 0 | 1 | 0 | 17,2 | L4 |
| Xã Lệ Thuỷ | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 6,2 | sạch |
| Xã Phong Nha | 11 | 5 | 0 | 0 | 0 | 0 | 6 | 0 | 6,5 | L4 |
| Xã Triệu Phong | 11 | 5 | 0 | 0 | 0 | 0 | 6 | 0 | 6,5 | **L5** |
| Xã Cửa Việt | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 8,6 | sạch |
| Xã Cửa Tùng | 8 | 6 | 1 | 0 | 0 | 0 | 1 | 0 | 3,1 | L4, L6 |
| Xã Nam Gianh | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 6,0 | sạch |
| Phường Bắc Gianh | 6 | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 13,2 | L6 |
| Xã Nam Trạch | 5 | 1 | 0 | 0 | 0 | 0 | 2 | 2 | 1,6 | L4, L6 |
| Xã Diên Sanh | 5 | 3 | 0 | 0 | 0 | 0 | 2 | 0 | 7,6 | L4 |
| Xã Đồng Lê | 4 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0,0 | L4 (toàn bộ) |
| Xã Minh Hoá | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 4,2 | sạch |
| Xã Lệ Ninh | 4 | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 1,6 | L4, L6 |
| Xã Hướng Hiệp | 4 | 2 | 0 | 0 | 0 | 0 | 2 | 0 | 5,8 | L4 |

## 5. Ảnh hưởng đến số liệu

- Tổng chiều dài đang hiển thị: 341,1 km. Sau khi sửa L1 (+83,7 km) và gỡ L5 (−6,5 km): **khoảng 418 km** (I — chưa trừ dòng cộng trùng cha/con nếu có).
- Mọi báo cáo tổng hợp dùng bảng này (`app/app/dashboard/bao-cao/tong-hop/page.tsx`) đang lấy số sai cho Đồng Hới và sai địa bàn cho Triệu Phong.
- Biểu cấp nước đang hiển thị trống dù 14 xã đã nộp số liệu.
- 55 xã, phường còn lại chưa có dữ liệu thoát nước (U: chưa nộp hay không có hệ thống).

## 6. Đề xuất sửa (P — ghi CSDL thật, cần duyệt riêng)

Cấp **L** (ghi CSDL thật, số liệu báo cáo) → theo skill `nhap-excel` và `phan-bien-codex`.

1. Tìm 23 tệp Excel gốc (U: đang ở đâu) — cần cho L2, L3, L6 và để xác nhận L4, L5.
2. Sao lưu `report_thoat_nuoc` và `report_cap_nuoc` ra tệp trước khi sửa.
3. Script sửa chạy lại không nhân đôi, có chế độ xem trước (in số dòng mỗi loại, không ghi), mỗi loại lỗi một bước:
   - L1: nhân 1000 cho 181 dòng tệp Đồng Hới (điều kiện kép: đúng tệp **và** giá trị < 20).
   - L4: chuyển 49 dòng sang `report_cap_nuoc`, xoá mềm bản cũ.
   - L5: xoá mềm 11 dòng của Triệu Phong.
   - L6: xoá mềm 5 dòng rác; chuyển năm; đổi `NM`/`NT`.
   - L2, L3: nhập lại từ tệp gốc.
4. Sửa mã nhập: đọc theo **tiêu đề cột**, từ chối tệp thiếu cột bắt buộc, kiểm đơn vị (chiều dài tuyến < 20 m ở đô thị → cảnh báo), kiểm sheet đúng biểu. Có test.
5. Việc không tự làm được: xin lại tệp đúng của Xã Triệu Phong; hỏi các xã về dòng trống loại nước.

Hoàn tác: khôi phục hai bảng từ tệp sao lưu ở bước 2 (đã diễn tập khôi phục toàn CSDL ngày 12/11/2026, `docs/ai/TESTING.md`).

## 7. Chưa kiểm được
- Chưa mở tệp Excel gốc; mọi suy luận về "cột nào lệch" dựa trên dữ liệu đã nhập.
- Chưa rà các bảng báo cáo khác nhập cùng đợt (`report_duong` 1.342, `report_dien_cs` 901, `report_cay_xanh` 680, `report_bai_do_xe` 12) — cùng cách đọc theo vị trí cột nên **có thể cùng lỗi** (I).
- Chưa kiểm cộng trùng giữa dòng cha và dòng con của một tuyến.
