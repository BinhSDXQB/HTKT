# DỰ ÁN: TỔNG HỢP PHỤ LỤC 1 — HẠ TẦNG KỸ THUẬT ĐÔ THỊ

> **Nhật ký thiết kế, chuẩn hóa và cập nhật dữ liệu**
> Cập nhật lần cuối: **28/07/2026**

---

## 1. Mục tiêu

Gộp **24 file Excel** do các phường/xã gửi về (thư mục `D:\Troly\Tonghop`) thành **một file tổng hợp duy nhất**, bảo đảm:

| Yêu cầu | Cách đáp ứng |
|---|---|
| Đúng cấu trúc | Ánh xạ cột theo **tên tiêu đề**, không theo vị trí cột |
| Thống nhất đơn vị tính | Quy đổi tự động km↔m, kW↔W |
| Không cộng trùng | Loại dòng tiêu đề nhóm (I, II, III…) và dòng TỔNG/CỘNG |
| Nhanh, lặp lại được | Một lệnh chạy lại toàn bộ trong vài giây |
| Truy vết ngược | Mọi thao tác ghi vào sheet `NHẬT KÝ` và `CẢNH BÁO` |

---

## 2. Danh mục file

### 2.1. Đầu vào — `D:\Troly\Tonghop\` (24 đơn vị)

**Phường (8):** Ba Đồn · Bắc Gianh · Nam Đông Hà · Quảng Trị · Đông Hà · Đồng Hới · Đồng Sơn
**Xã (16):** Cam Lộ · Cửa Tùng · Cửa Việt · Diên Sanh · Hướng Hiệp · Khe Sanh · Lao Bảo · Lệ Ninh · Lệ Thủy · Minh Hóa · Nam Gianh · Nam Trạch · Phong Nha · Quảng Ninh · Triệu Phong · Vĩnh Linh · Đồng Lê

### 2.2. Đầu ra — `D:\HTKT\Tong hop HTKT\`

| File | Vai trò |
|---|---|
| `PHU_LUC_1_TONGHOP_CHUAN.xlsx` | **File tổng hợp chính thức** (kết quả) |
| `tools\tonghop_engine.py` | Chương trình tổng hợp, chạy lại bất cứ lúc nào |
| `DUAN_TONGHOP_HTKT.md` | Tài liệu này |
| `PHU_LUC_1_Tonghop_DA_SUA.xlsm` | **File cũ — giữ làm bản lưu đối chiếu, không dùng nữa** |

---

## 3. Cấu trúc file tổng hợp

10 sheet, đặt tên có tiền tố số để luôn giữ đúng thứ tự:

| Sheet | Nội dung | Số dòng |
|---|---|---:|
| `00_TỔNG QUAN` | Bảng tổng hợp chỉ tiêu theo từng phường/xã + tổng toàn tỉnh | 24 |
| `01_Đường giao thông` | Biểu mẫu 01 | 1.737 |
| `02_Điện chiếu sáng` | Biểu mẫu 02 | 1.398 |
| `03_Thoát nước` | Biểu mẫu 03 | 1.150 |
| `04_Cây xanh đường phố` | Biểu mẫu 04 | 709 |
| `05_Công viên - Quảng trường` | Biểu mẫu 05 | 120 |
| `06_Cấp nước` | Biểu mẫu 06 | 57 |
| `07_Bãi đỗ xe` | Biểu mẫu 07 | 11 |
| `CẢNH BÁO` | Các điểm cần kiểm tra / đã tự sửa | 850 |
| `NHẬT KÝ` | Vết đọc từng file, từng sheet | 699 |

### 3.1. Quy ước cột chung

Mỗi biểu mẫu đều bắt đầu bằng **3 cột định danh**, sau đó mới đến các cột của biểu mẫu gốc:

| Cột | Tên | Ý nghĩa |
|---|---|---|
| A | STT | Đánh lại số thứ tự **theo từng phường/xã** |
| B | **Phường/Xã** | Cột thêm mới khi tổng hợp — dùng để lọc, sắp xếp, cộng theo đơn vị |
| C | **Nhóm tuyến/Phân loại** | Kế thừa từ dòng tiêu đề nhóm của file gốc (Quốc lộ qua đô thị / Đường tỉnh / Đường đô thị…) |
| D trở đi | … | Giữ nguyên đúng thứ tự cột của biểu mẫu gốc |

> **Lý do đưa Phường/Xã lên cột B** (file cũ để ở cột cuối): cột B nằm trong vùng đóng băng nên luôn nhìn thấy khi cuộn ngang; lọc và cộng theo đơn vị nhanh hơn nhiều. Cột `Nhóm tuyến` là **thông tin mới được cứu lại** — file cũ làm mất hoàn toàn phân loại này.

Tất cả các sheet đều có: **đóng băng dòng tiêu đề + 3 cột đầu**, **AutoFilter**, **dòng TỔNG dùng `SUBTOTAL(9,…)`** (tự cộng lại đúng theo kết quả lọc).

### 3.2. Đơn vị tính chuẩn

| Chỉ tiêu | Đơn vị chuẩn | Ghi chú xử lý |
|---|---|---|
| Chiều dài tuyến đường | **km** | |
| Chiều rộng nền/mặt/hè/dải phân cách | **m** | |
| Chiều dài chiếu sáng | **km** | |
| Công suất đèn | **W** | Nguồn ghi kW → **× 1.000** |
| Chiều dài tuyến thoát nước | **m** | Nguồn ghi km → **× 1.000** |
| Diện tích công viên, thảm cỏ, bãi đỗ xe | **m²** | |
| Số lượng cây, cột đèn, hộ, vị trí đỗ | **số nguyên** | |

---

## 4. Quy tắc chuẩn hóa

### 4.1. Nhận diện cấu trúc

1. **Tên sheet** được chuẩn hóa rồi tra bảng — chấp nhận mọi biến thể đã gặp:
   `DUONG GT (T)` / `Đường GT (T)`, `ĐIện chiếu sáng` / `Điện chiếu sáng`, `cây xanh` / `Cây xanh`, `Thoat nươc mưa và thải`…
2. **Dòng tiêu đề** được dò tự động trong 14 dòng đầu bằng cách chấm điểm số tiêu đề khớp — không giả định tiêu đề luôn ở dòng 2 hay dòng 3 (thực tế thay đổi từ dòng 2 đến dòng 5 tùy file).
3. **Cột** được ánh xạ theo **tên tiêu đề + danh mục bí danh**, kể cả tiêu đề gộp ô nhiều cấp (`Chiều rộng hiện trạng (m)` → `Nền đường` / `Mặt đường` / `Hè trái` / `Hè phải` / `Dải phân cách`).
4. Nếu không khớp được cột tên/tuyến → tự lấy **cột chữ đầu tiên sau cột STT** và ghi cảnh báo.

### 4.2. Dòng bị loại (kèm lý do ghi vào nhật ký)

| Loại dòng | Vì sao loại |
|---|---|
| Dòng tiêu đề nhóm `I`, `II`, `III.1`, `A`, `B`… | **Thường là dòng TỔNG của nhóm** → giữ lại sẽ cộng trùng gấp đôi |
| Dòng `Cộng`, `Tổng`, `Tổng cộng`, `CỘNG I + II` | Dòng tổng nằm giữa bảng |
| Dòng chú thích số cột `(1) (2) (3)…` | Không phải dữ liệu |
| Dòng ví dụ mẫu `VD:…`, ghi chú "Ví dụ" | Dữ liệu mẫu của biểu mẫu |
| Dòng **chỉ có số, không có chữ nào** | Ô tổng rời rạc cuối bảng |
| Bản ghi trùng khớp hoàn toàn | Giữ lại 1 bản |

### 4.3. Tên đơn vị hành chính

Lấy từ **tên file**, không lấy từ nội dung ô — bảo đảm chuẩn tuyệt đối.
File cũ có tới **25 biến thể cho 24 đơn vị**: `PHƯỜNG ĐỒNG HỚI` / `Phường Đồng Hới` / `phường Đồng Hới`, `Xa Minh Hoá` (thiếu dấu), `Xã Triệu phong`, và cả một nhóm 7 dòng chỉ ghi `xã`. Nay còn **đúng 24 tên chuẩn**.

---

## 5. Các lỗi đã phát hiện ở file cũ và cách khắc phục

| # | Lỗi ở `PHU_LUC_1_Tonghop_DA_SUA.xlsm` | Hậu quả | Đã khắc phục |
|---|---|---|---|
| 1 | **350 ô lệch cột** ở biểu Đường GT: `Bê tông nhựa`, `Cầu Lai Phước`… nằm trong cột số `Mặt đường`, `Chiều dài` | Cột số hỏng, không cộng được | Ánh xạ theo tên tiêu đề → **còn 0 ô lệch** |
| 2 | Phường Đồng Hới khai báo chiều rộng đường **gộp 1 cột**, file cũ chép theo vị trí nên đẩy `Kết cấu mặt đường` vào ô số | Sai 317 dòng | Nhận diện bố cục gộp, đưa đúng vào `Nền đường (m)` + ghi cảnh báo |
| 3 | Thoát nước Phường Đồng Hới ghi bằng **km**, Xã Đồng Lê ghi **(Km) nhưng số là mét**, các đơn vị khác ghi **m** — tất cả cộng chung | Tổng vô nghĩa | Quy đổi theo tiêu đề **và** kiểm tra độ lớn giá trị |
| 4 | Công suất đèn lẫn lộn **W và kW** (111 giá trị kiểu kW, 380 kiểu W) | Tổng công suất sai | Quy về **W**; chỉ tự quy đổi khi giá trị < 1 (chắc chắn là kW) |
| 5 | Dòng tiêu đề nhóm được đưa vào như dữ liệu | **Cộng trùng ~2 lần** (Đường GT: 3.652 km ảo so với 1.918 km thực) | Loại và ghi riêng vào `CẢNH BÁO` |
| 6 | 61 ô số lưu dạng **chữ**, dấu phẩy thập phân (`6,0` · `513,53`) | `SUM` bỏ qua | Tự chuyển thành số, ghi nhật ký từng ô |
| 7 | Biểu Đường GT **không có dòng tổng**, `freeze_panes` đặt nhầm ở `E1630` | Không dùng được | Chuẩn hóa lại toàn bộ định dạng |
| 8 | Phường Đồng Sơn bị **bỏ sót** (sheet tên `Đường GT (T)` có dấu tiếng Việt nên không khớp) | Mất 88 tuyến đường | Bổ sung biến thể tên sheet |
| 9 | Mất hoàn toàn thông tin **phân loại tuyến** (Quốc lộ / Đường tỉnh / Đường đô thị) | Không phân tích được | Thêm cột `Nhóm tuyến/Phân loại` |

---

## 6. Kết quả tổng hợp

**5.182 dòng dữ liệu** từ 5.263 dòng đọc được (81 dòng trùng đã loại).

| Chỉ tiêu | Giá trị |
|---|---:|
| Tổng chiều dài đường giao thông | **1.918,5 km** |
| Tổng chiều dài chiếu sáng | **1.329,4 km** |
| Tổng số cột đèn | **28.175 cột** |
| Tổng số bóng đèn | **7.137 bóng** |
| Tổng chiều dài thoát nước | **558.133 m** (≈ 558,1 km) |
| Tổng số cây xanh đường phố | **81.424 cây** |
| Tổng diện tích công viên, quảng trường | **1.284.148 m²** |
| Diện tích thảm cỏ | **873.343 m²** |
| Số hộ đề xuất cấp nước sạch | **34.465 hộ** |
| Diện tích bãi đỗ xe | **100.979 m²** — **13.281 vị trí** |

---

## 7. Việc cần làm tiếp

### 7.1. Đơn vị chưa có số liệu — cần đề nghị bổ sung

| Biểu mẫu | Số đơn vị thiếu | Đơn vị |
|---|---:|---|
| 07_Bãi đỗ xe | 16 | Minh Hóa, Bắc Gianh, Quảng Trị, Đông Hà, Đồng Hới, Đồng Sơn, Cửa Việt, Hướng Hiệp, Khe Sanh, Lệ Ninh, Lệ Thủy, Nam Gianh, Nam Trạch, Quảng Ninh, Triệu Phong, Đồng Lê |
| 05_Công viên | 10 | Quảng Trị, Cửa Tùng, Cửa Việt, Diên Sanh, Hướng Hiệp, Khe Sanh, Lệ Ninh, Nam Trạch, Phong Nha, Triệu Phong |
| 06_Cấp nước | 8 | Minh Hóa, Quảng Trị, Đông Hà, Đồng Hới, Đồng Sơn, Cửa Việt, Lệ Thủy, Nam Gianh |
| 04_Cây xanh | 2 | Nam Gianh, Nam Trạch |
| 03_Thoát nước | 1 | Đồng Sơn |

> Xem chi tiết ở sheet `CẢNH BÁO`, lọc cột **Mức độ** = `THIEU DU LIEU`.

### 7.2. Lỗi phông chữ bảng mã cũ — **21 ô**

File `PHỤ LỤC 1_Phường Đồng Sơn.xlsx` có một số ô gõ bằng **bảng mã TCVN3 (ABC)**, hiển thị sai:
`§­êng Hµ Huy TËp` (đúng là *Đường Hà Huy Tập*), `R¹ng §«ng` (*Rạng Đông*)…

**Chương trình cố ý GIỮ NGUYÊN văn bản gốc, không tự chuyển đổi** để tránh nguy cơ sai lệch nội dung. Cách xử lý đúng:

1. Mở file nguồn `PHỤ LỤC 1_Phường Đồng Sơn.xlsx`
2. Dùng **Unikey → Công cụ (Ctrl+Shift+F6) → Nguồn: TCVN3 (ABC) → Đích: Unicode**
3. Chạy lại chương trình tổng hợp

### 7.3. Giá trị cần đơn vị xác minh

- **Xã Nam Trạch:** dòng *"Đường trục các thôn"* = **260 km**, *"Đường liên thôn"* = **50 km** — nghi là dòng gộp nhiều tuyến, làm tổng của xã lên tới 373,6 km (cao bất thường so với các đơn vị khác).
- **Phường Đồng Sơn:** cột `Công suất (W)` có giá trị 6–9 W, trùng khớp với cột `Số cột đèn` → nghi nhập nhầm.
- Toàn bộ các trường hợp này đã được liệt kê trong `CẢNH BÁO`, mức độ `CAN KIEM TRA`.

---

## 8. Hướng dẫn chạy lại

Khi có file mới hoặc file được sửa, chỉ cần chép vào `D:\Troly\Tonghop\` rồi chạy:

```powershell
python "D:\HTKT\Tong hop HTKT\tools\tonghop_engine.py"
```

Chương trình **đọc lại toàn bộ từ đầu** và ghi đè `PHU_LUC_1_TONGHOP_CHUAN.xlsx` (khoảng 20 giây). Không có trạng thái tích lũy nên **không bao giờ bị cộng trùng khi chạy nhiều lần**.

**Khi bổ sung đơn vị mới:** thêm một dòng vào bảng `TEN_DON_VI` trong `tools\tonghop_engine.py` để tên phường/xã được chuẩn hóa đúng.

**Khi biểu mẫu có tiêu đề cột lạ:** thêm bí danh vào danh sách của trường tương ứng trong `BIEU[...]['fields']` — không cần sửa logic.

---

## 9. Nhật ký cập nhật

| Ngày | Nội dung |
|---|---|
| 27/07/2026 | Bản tổng hợp đầu tiên (`PHỤ LỤC 1_Tonghop.xlsm`) — ghép theo vị trí cột |
| 28/07/2026 | `PHU_LUC_1_Tonghop_DA_SUA.xlsm` — bổ sung dữ liệu một số đơn vị |
| **28/07/2026** | **Rà soát toàn diện, phát hiện 9 nhóm lỗi (xem mục 5)** |
| **28/07/2026** | **Xây dựng lại bằng `tonghop_engine.py`: ánh xạ theo tên cột, chuẩn hóa đơn vị tính, loại dòng tổng, thêm `00_TỔNG QUAN` / `CẢNH BÁO` / `NHẬT KÝ` → phát hành `PHU_LUC_1_TONGHOP_CHUAN.xlsx`** |
