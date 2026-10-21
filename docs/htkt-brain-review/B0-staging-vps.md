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
| **Staging trên VPS**: đo RAM, kiểm thử khói B0, sau này B1+ | VPS BNIX | **dữ liệu staging** tạo trên máy nội bộ (§6) — không phải bản thật đổi tên |

Máy diễn tập: **máy phát triển này** (HP, 16 GB; trống C: ~124 GB, D: ~122 GB) — chủ hệ thống chọn 21/10/2026.
**Chưa cài PostgreSQL** — cần cài đúng phiên bản production (lấy từ Phụ lục A, Q12); PostgreSQL ≥ 12 (công cụ dùng `jsonb_path_exists`).

## 5. Thứ tự đề xuất

1. Chủ hệ thống hỏi nhà cung cấp các mục §2, lấy báo giá theo §3, chạy Phụ lục A (01) trên production (Q12).
2. Diễn tập khôi phục trên máy nội bộ (§4) → biên bản: thời gian khôi phục (RTO thực tế), dữ liệu mất tối đa (RPO theo lịch sao lưu), lỗi gặp.
3. Chạy `app/scripts/an-danh-hoa.ps1` (§6) trên máy nội bộ → dump staging (chỉ sinh khi mọi kiểm tra đạt).
4. Thuê VPS, dựng staging đúng phiên bản, nạp dump ẩn danh, triển khai nhánh `b0-va-khan-htkt-brain` theo `B0-trien-khai.md` §2, kiểm thử khói + đo RAM.
5. Trình kết quả → chủ hệ thống quyết triển khai B0 lên production.

## 6. Công cụ tạo dữ liệu staging (`app/lib/an-danh/an-danh.ts`, `app/scripts/an-danh-hoa.{mjs,ps1}`)

**Thiết kế (sau 3 vòng phản biện Codex — nguyên văn: `B0-an-danh-codex-phan-bien.md`):**

| | Nội dung |
|---|---|
| Nguyên tắc | **Danh sách trắng + dữ liệu giả.** Bản đầu "ẩn danh từng cột nghi ngờ" bị Codex đánh CHƯA ĐẠT (lọt DOCX/PDF/ảnh chữ ký, Json tự do, tái định danh qua chức vụ/lịch sử lương) → thiết kế lại |
| Bảng xoá | **91/140** bảng (mặc định xoá — bảng mới tự động an toàn): toàn bộ nhân sự, văn phòng, chatbot, nhật ký, CCHN, giấy phép cá nhân, công việc, lịch, liên thông, báo cáo nhập Excel… |
| Bảng giữ | **49** bảng hạ tầng công, danh mục, phân quyền, tài liệu `CONG_KHAI`: chỉ giữ cột văn bản trong danh sách trắng; mọi cột văn bản/Json/nhị phân/mảng khác xoá trắng; `geojson` chỉ hình học thuần số; `TaiLieu.nguon` chỉ tên tệp |
| Dữ liệu giả | 1 tài khoản/vai trò `<vai trò>@staging.local` (mật khẩu chung nhập ẩn khi chạy) + 40 cán bộ giả (CCCD 099…, SĐT 0999…) |
| Hậu điều kiện (lỗi → ROLLBACK, không xuất dump) | chỉ schema public; không large object/materialized view; mọi bảng không giữ rỗng (kể cả bảng không có trong Prisma); cột lạ ngoài manifest → từ chối; không bytea có dữ liệu; quét từ điển CCCD/SĐT/họ tên/email gốc (so khớp literal) trong mọi cột văn bản; từ điển rỗng → từ chối |
| Quy trình (`an-danh-hoa.ps1`) | khôi phục (biên bản thời gian + số dòng) → bản sao + bảng đánh dấu → SQL → **chỉ** `pg_dump` khi mã thoát 0 + `HAU_DIEU_KIEN_DAT` + `COMMIT` → luôn xoá CSDL tạm (bản thật) trong `finally` |
| Kiểm thử | 9 test trên schema thật (32/32 toàn bộ); **chưa chạy trên PostgreSQL** (máy chưa cài) |
| Kết luận Codex vòng 3 | **ĐẠT CÓ ĐIỀU KIỆN để CHẠY THỬ trên PostgreSQL nội bộ** (instance dùng riêng). **Chưa** phê duyệt mang dump lên VPS |

**Rào chặn chỉ giảm nhầm lẫn, không phải kiểm soát truy cập** — chỉ chạy trên máy nội bộ không có đường tới production.

**Câu hỏi cho chủ hệ thống (Codex và Claude thống nhất là quyết định quản trị, không phải lỗi công cụ):**
1. Dữ liệu vận hành **không phải dữ liệu cá nhân** được giữ (danh mục tài sản, toạ độ, công suất, dự án: tên, chủ đầu tư, ngân sách, tiến độ; vật tư, giá, tồn kho; cây tổ chức) có được lên VPS không?
2. `Project.investor` (chủ đầu tư) có trường hợp là **cá nhân** không? Nếu có → xoá trắng cột này.
3. Tài liệu `CONG_KHAI` (văn bản pháp luật trong kho RAG) có được coi là kho công khai đã duyệt không? (kèm embedding tính từ chính nội dung đó)
