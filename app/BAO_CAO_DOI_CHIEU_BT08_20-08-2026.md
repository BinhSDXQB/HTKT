# Đối chiếu Bài toán BT08 với hiện trạng dữ liệu hệ thống HTKT

**Ngày:** 20/8/2026
**Nguồn:** `C:\Bai toan 8.pdf` — Công văn Sở KH&CN Quảng Trị gửi Trung tâm Dữ liệu quốc gia (Bộ Công an), thực hiện CV 4171/BCA-C12 ngày 10/8/2026, phục vụ Đề án **Vườn ươm dữ liệu quốc gia**. Phiếu BT08 tại trang 67–77.
**Đối chiếu với:** CSDL `ql_htkt` (146 bảng) — đếm số bản ghi thực tế ngày 20/8/2026.

---

## 1. BT08 yêu cầu gì

| Mục | Nội dung |
|---|---|
| Tên | Phân tích rủi ro, phát hiện bất thường và hỗ trợ quản lý, giám sát hoạt động xây dựng |
| Đơn vị chủ trì | **Sở Xây dựng tỉnh Quảng Trị** |
| Ưu tiên | Cao · Sandbox: Có · Nhu cầu AI: Có, theo lộ trình · Dữ liệu liên ngành: Có |
| Thời gian sandbox | 06–12 tháng |
| Phạm vi thử nghiệm | **Một địa bàn, một nhóm loại công trình, một số năm dữ liệu** — không cần toàn tỉnh ngay |

**Chuỗi liên thông cốt lõi BT08 đặt ra:**

> quy hoạch → dự án → cấp phép → công trình → chủ thể (năng lực/chứng chỉ) → kiểm tra → vi phạm

**Sản phẩm đầu ra mong muốn:** Data Mart xây dựng · Dashboard theo dõi · Dashboard liên thông quy hoạch–dự án–cấp phép–công trình · Dashboard cấp phép–kiểm tra–vi phạm · Bản đồ điểm nóng · Bộ chỉ số rủi ro · Danh sách hồ sơ/công trình bất thường · API chia sẻ · Mô hình AI/Risk Analytics *khi dữ liệu đáp ứng*.

> Phiếu ghi rõ: **"AI không phải điều kiện để bắt đầu Sandbox; Sandbox có thể bắt đầu bằng tích hợp dữ liệu, GIS, dashboard và phân tích rủi ro, sau đó mới bổ sung AI."**

---

## 2. Hiện trạng dữ liệu — đếm thật

### 2.1. Đã có dữ liệu thật, dùng được ngay

| Nhóm | Số bản ghi | Chi tiết |
|---|---:|---|
| Báo cáo hạ tầng phường/xã | **3.715** | đường 1.342 · điện chiếu sáng 901 · thoát nước 780 · cây xanh 680 · bãi đỗ xe 12 |
| Công trình / tài sản HTKT | **1.884** | assets 929 · streets 929 · 26 loại tài sản |
| Hồ sơ nghiệp vụ động | **532** | 52 lĩnh vực / 11 phòng |
| Không gian, địa chỉ | **156** | 79 ĐVHC (có diện tích, dân số) · 77 bản ghi chiều dài GIS |
| Dự án GPMB | **36** | |

### 2.2. Đã có CẤU TRÚC nhưng CHƯA CÓ DỮ LIỆU

| Nhóm | Tình trạng |
|---|---|
| **Kiểm tra xây dựng** | `inspections` = **0** (mới có 8 mẫu biểu + 57 mục kiểm tra) |
| **Vi phạm, xử lý vi phạm** | `incidents` = **0**, `work_orders` = **0** |
| **Năng lực HĐXD + chứng chỉ hành nghề** | `httt_nang_luc_ca_nhan`, `httt_nang_luc_to_chuc`, `httt_dinh_danh` = **0** (migration 040 đã dựng bảng theo NĐ 212/2026 + TT 39/2026, chưa nạp) |
| **Định mức, giá xây dựng** | `materials` = **0** (mới có 7 nhóm vật liệu) |
| **Khảo sát QĐ72 (PCCC, chỉnh trang)** | 1–2 bản ghi mẫu; đã có 17 tiêu chí kỹ thuật + 15 văn bản pháp lý |

### 2.3. Chưa có trong hệ thống

- **Cấp phép xây dựng và hồ sơ cấp phép** — hệ thống chỉ có `oversized_vehicle_permits` (giấy phép xe quá khổ), khác lĩnh vực.
- **Trật tự xây dựng**
- **Nhà ở và thị trường bất động sản**
- **Quy hoạch xây dựng** (chỉ 1 bản ghi mẫu `qd72_urban_areas`)

---

## 3. Kết luận thẳng

**Chuỗi liên thông của BT08 đứt ở hai mắt xích quyết định nhất: CẤP PHÉP và VI PHẠM — cả hai đều bằng 0.**

Đây không phải vấn đề kỹ thuật mà là vấn đề **nguồn dữ liệu nghiệp vụ**. Phân tích rủi ro và phát hiện bất thường về bản chất là học từ **lịch sử cấp phép – kiểm tra – vi phạm**; không có ba nguồn này thì:

- Không có nhãn để mô hình học "thế nào là bất thường".
- Không chấm được điểm rủi ro cho chủ thể hay địa bàn.
- Dashboard "cấp phép – kiểm tra – vi phạm" mà BT08 yêu cầu sẽ rỗng.

**Không nên bắt đầu bằng AI.** Đúng như phiếu BT08 đã nêu. Bắt đầu bằng AI trên dữ liệu rỗng chỉ tạo ra cảnh báo vô nghĩa — đúng loại rủi ro "cảm giác chắc chắn giả" mà đợt rà soát 19/8 đã phải xử lý ở chatbot.

---

## 4. Việc làm được NGAY với dữ liệu đang có

Ba nhóm dưới đây dùng dữ liệu thật đã có, không chờ nguồn mới, và đều nằm trong sản phẩm đầu ra BT08.

### 4.1. Phát hiện bất thường trong báo cáo hạ tầng phường/xã — *khả thi cao nhất*
Nguồn: 3.715 bản ghi, 78 xã/phường, 7 lĩnh vực, có dữ liệu lịch sử theo năm.

Chỉ báo cụ thể:
- **Sai đơn vị đo**: đường `chieuDaiKm ≥ 20` ở xã không phải đô thị gần như chắc chắn là **mét ghi nhầm thành km** — lỗi này đã gặp thật (Khe Sanh, Nam Trạch).
- **Đột biến so với kỳ trước**: cùng xã, cùng lĩnh vực, chênh lệch bất thường giữa hai năm.
- **Lệch so với xã tương đồng**: chuẩn hoá theo diện tích/dân số (đã có trong `administrative_units`) rồi tìm điểm ngoại lai.
- **Đối chiếu chéo với GIS**: `ward_gis_length` so với chiều dài khai báo — công cụ `gis_do_chieu_dai.py` đã có sẵn.
- **Xã chưa nộp / nộp thiếu lĩnh vực**.

### 4.2. Bản đồ hoạt động và điểm nóng
929 tài sản có toạ độ + 79 ĐVHC + MapLibre đã chạy → dựng được **bản đồ mật độ, phân bố theo lĩnh vực, khu vực trống dữ liệu**. Đây chính là "Bản đồ hoạt động xây dựng và các điểm nóng" trong đầu ra BT08, ở mức làm được ngay.

### 4.3. Giám sát tiến độ thẩm định
Mỗi quy trình thẩm định đã khai sẵn mốc thời hạn (nhóm A 40 ngày, B 30, C 20). Kết hợp `nghiep_vu_ban_ghi` → cảnh báo hồ sơ sắp/đã quá hạn. Không cần nguồn dữ liệu mới.

---

## 5. Đề xuất phạm vi Sandbox

BT08 cho phép chọn **một địa bàn, một nhóm công trình, một số năm** — nên tận dụng.

**Đề xuất:** địa bàn **Phường Đồng Hới** (dữ liệu đầy đủ nhất: 114/156 bản ghi nghiệp vụ có địa bàn, tuyến đường mặt cắt ≥20m đã bàn giao), nhóm **hạ tầng kỹ thuật đô thị** (đường, chiếu sáng, thoát nước, cây xanh), năm **2025–2026**.

Lộ trình:

| Giai đoạn | Nội dung | Điều kiện |
|---|---|---|
| **1. Ngay** | Bộ chỉ báo bất thường báo cáo phường/xã + bản đồ + cảnh báo quá hạn thẩm định | Dữ liệu đã có |
| **2. Khi có dữ liệu** | Nạp năng lực HĐXD + chứng chỉ hành nghề vào `httt_*` (bảng đã dựng sẵn) | Cần nguồn từ Trung ương/Bộ Xây dựng |
| **3. Then chốt** | Số hoá **cấp phép xây dựng** và **vi phạm trật tự xây dựng** | Cần quyết định nghiệp vụ của Sở — đây là nút thắt lớn nhất |
| **4. Sau cùng** | Chấm điểm rủi ro, phát hiện bất thường bằng AI | Chỉ khi giai đoạn 3 có đủ lịch sử |

---

## 6. Điểm mạnh nên nêu khi làm việc với Vườn ươm dữ liệu quốc gia

Hệ thống HTKT hiện có là tài sản thật, nên đưa vào hồ sơ như năng lực sẵn có:

- CSDL 146 bảng đang vận hành thật, 219 tài khoản, phân quyền theo phòng/đơn vị.
- **3.715 bản ghi báo cáo hạ tầng** của 78 xã/phường — dữ liệu gốc, không phải mẫu.
- Nền GIS MapLibre + 929 tài sản có toạ độ.
- Kho tài liệu pháp lý 106 văn bản đã véc-tơ hoá (pgvector/HNSW), có **lớp quản lý hiệu lực văn bản**.
- Lớp liên thông NĐ 212/2026 + TT 39/2026 đã dựng bảng (`httt_*`), sẵn sàng nhận dữ liệu.
- Trợ lý AI đã vận hành, có bộ kiểm thử chống bịa đặt 9/9.

**Nhu cầu hỗ trợ nên nhấn mạnh:** không phải GPU hay mô hình AI, mà là **cơ chế kết nối dữ liệu cấp phép xây dựng và vi phạm trật tự xây dựng** — đó mới là thứ đang chặn BT08.

---

*Tài liệu này là phân tích kỹ thuật để tham mưu; số liệu đếm trực tiếp từ CSDL ngày 20/8/2026. Nội dung BT08 trích từ `C:\Bai toan 8.pdf` trang 67–77.*
