# B0 — VPS staging và diễn tập khôi phục

> Quyết định Q2 (staging máy/VPS riêng), Q7 (thuê VPS ngay). Nhà cung cấp do chủ hệ thống chọn (21/10/2026).
> **Chưa thuê, chưa cấu hình gì.** Claude không có quyền truy cập VPS hay production.

## 1. Nhà cung cấp — thông tin đã tra (nguồn công khai, bên thứ ba)

| Mục | Thông tin | Nguồn |
|---|---|---|
| Pháp nhân | Công ty TNHH Giải Pháp Hạ Tầng Mạng Bầu Trời Xanh (Blue Sky Network Infrastructure Solutions Co., Ltd), MST **0317757991**, đang hoạt động, Thuế cơ sở 2 TP.HCM | masothue.com, yp.vn, hsctvn.com |
| Thành lập | 03/2023 (các nguồn lệch 27–29/03/2023) | như trên; bnix.vn |
| Thương hiệu dịch vụ | **BNIX** (bnix.vn) | bnix.vn/ve-chung-toi |
| Dịch vụ | Cloud VPS NVMe, Pro SSD VPS, VDS tài nguyên riêng, máy chủ riêng, colocation, quản trị máy chủ | bnix.vn |
| Vị trí trung tâm dữ liệu | Việt Nam (máy chủ đặt tại DC của CMC, Viettel, FPT, VNPT; colocation "chuẩn Tier 3"); ngoài ra Singapore, Mỹ | bnix.vn |
| Cam kết | "uptime 99%", hoàn tiền 30 ngày | bnix.vn |
| **Không thấy trên trang** | ISO/IEC 27001; VPS Windows Server; snapshot/sao lưu; SLA/hợp đồng chính thức; thoả thuận xử lý dữ liệu | — |

> Địa chỉ trụ sở giữa các nguồn chưa thống nhất (Thủ Đức / Nhà Bè) — đối chiếu tại dangkykinhdoanh.gov.vn trước khi ký hợp đồng.

## 2. Cần hỏi/yêu cầu nhà cung cấp trước khi thuê

1. **Vị trí VPS: bắt buộc chọn DC tại Việt Nam** (không chọn Singapore/Mỹ) — ghi rõ DC nào (CMC/Viettel/FPT/VNPT).
2. Có **VPS Windows Server** (2019/2022) có bản quyền không — staging nên **giống production** (Windows + IIS + PM2 + PostgreSQL) để kết quả đo RAM và diễn tập có ý nghĩa.
3. **Snapshot/sao lưu** của nhà cung cấp: tần suất, nơi lưu, thời gian giữ.
4. **Hợp đồng + SLA** bằng văn bản (99 % uptime trên trang ≈ 7,3 giờ gián đoạn/tháng), quy trình sự cố, hoá đơn cho cơ quan.
5. Cam kết bảo mật/xử lý dữ liệu (bên nhận xử lý dữ liệu cá nhân theo NĐ 13/2023 — **chưa đối chiếu văn bản**), quyền truy cập của nhân viên nhà cung cấp vào VPS.
6. Firewall/anti-DDoS, IP tĩnh, có cho mở hạn chế cổng theo IP nguồn không.

## 3. Cấu hình đề xuất cho staging

| Thành phần | Đề xuất | Lý do |
|---|---|---|
| HĐH | Windows Server 2022 (nếu có) | giống production |
| vCPU / RAM | 4 vCPU / **6 GB** (bằng production theo tài liệu) — tuỳ chọn thêm gói 8 GB để so sánh | B0 mục 6: đo RAM có ý nghĩa khi cấu hình giống |
| Ổ đĩa | ≥ 100 GB NVMe | CSDL + tệp hồ sơ mẫu + bản sao lưu |
| Mạng | IP tĩnh; chỉ mở RDP/HTTPS cho IP cơ quan | không công khai staging |
| Phần mềm | đúng phiên bản production: Node, PostgreSQL + pgvector, PM2, IIS — **lấy phiên bản từ Phụ lục A** (bổ sung `node -v`, `psql --version`, phiên bản pgvector) | tránh lệch như Prisma 7.8 → 7.10 (S21) |

Giá: **chưa có báo giá** — chủ hệ thống lấy báo giá theo cấu hình trên.

## 4. Dữ liệu: KHÔNG đưa bản sao lưu thật lên VPS

Bản sao lưu production chứa CCCD, lương, ngày sinh, hồ sơ thẩm định. Đưa lên VPS của bên thứ ba = chuyển dữ liệu cá nhân ra ngoài cơ quan,
trái quyết định Q2 ("dữ liệu giả/ẩn danh") và tinh thần Q3. Vì vậy tách hai việc:

| Việc | Nơi làm | Dữ liệu |
|---|---|---|
| **Diễn tập khôi phục** (B0 mục 7): khôi phục `.dump` mới nhất + thư mục tệp đính kèm, đối chiếu số bản ghi các bảng chính, đăng nhập thử, mở vài hồ sơ | **máy nội bộ** cơ quan (máy riêng, không phải production; có thể dùng máy phát triển nếu đủ dung lượng) | bản thật — xoá sau khi diễn tập |
| **Staging trên VPS**: đo RAM, kiểm thử khói B0, sau này B1+ | VPS BNIX | **đã ẩn danh hoá** trên máy nội bộ trước khi tải lên (họ tên, CCCD, ngày sinh, SĐT, email, lương, nội dung hồ sơ) |

Script ẩn danh hoá **chưa viết** — đề xuất làm khi chủ hệ thống duyệt (thuộc B0 mục 7, chạy trên bản khôi phục nội bộ, không bao giờ trên production).

## 5. Thứ tự đề xuất

1. Chủ hệ thống hỏi nhà cung cấp các mục §2, lấy báo giá theo §3, chạy Phụ lục A (01) trên production (Q12).
2. Diễn tập khôi phục trên máy nội bộ (§4) → biên bản: thời gian khôi phục (RTO thực tế), dữ liệu mất tối đa (RPO theo lịch sao lưu), lỗi gặp.
3. Viết + chạy script ẩn danh hoá trên bản khôi phục nội bộ → dump ẩn danh.
4. Thuê VPS, dựng staging đúng phiên bản, nạp dump ẩn danh, triển khai nhánh `b0-va-khan-htkt-brain` theo `B0-trien-khai.md` §2, kiểm thử khói + đo RAM.
5. Trình kết quả → chủ hệ thống quyết triển khai B0 lên production.
