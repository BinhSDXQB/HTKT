# Kế hoạch hoàn thiện hệ thống QL Hạ tầng Kỹ thuật

**Lập ngày:** 20/8/2026 · **Phương pháp:** Claude soạn → Codex (gpt-5.5) phản biện → sửa theo phản biện
**Bối cảnh:** hệ thống đang vận hành thật — 146 bảng, 219 tài khoản, tên miền công khai, máy chủ 6GB RAM.

---

## 0. Nguyên tắc số một

> **Vận hành trước, tính năng sau.**

Bản kế hoạch đầu tiên xếp tính năng lên trước. Codex phản biện đúng: với một hệ thống hành chính đang chạy thật, **khôi phục thảm hoạ, nhật ký truy cập, phân quyền, kiểm tra định kỳ và các phụ thuộc bên ngoài** phải đứng trước mọi tính năng mới. Một tính năng hay trên hệ thống không khôi phục được là rủi ro, không phải giá trị.

---

## 1. ĐIỀU KIỆN KẾT THÚC — "hoàn thiện" nghĩa là gì

Không thể định nghĩa "hoàn thiện" bằng một danh sách việc, vì luôn có văn bản pháp lý mới, dữ liệu mới, yêu cầu mới. Định nghĩa bằng **5 mức nghiệm thu**, mỗi mức có tiêu chí kiểm chứng được:

### N1 — Vận hành ổn định
- [x] Bản sao lưu **khôi phục được thật** (không chỉ tạo được file)
- [ ] Có tài liệu khôi phục máy mới: PostgreSQL + app + tệp đính kèm + biến môi trường + IIS + PM2 + tên miền
- [ ] Ghi rõ mục tiêu **RPO/RTO** (mất tối đa bao nhiêu giờ dữ liệu, khôi phục trong bao lâu)
- [ ] Sao lưu có **bản thứ hai ngoài ổ C:**
- [ ] Lệnh `healthcheck` chạy định kỳ, lưu kết quả theo ngày, **xanh liên tục 7 ngày**

### N2 — An toàn dữ liệu cá nhân
- [x] Không còn API công khai lộ CCCD
- [ ] Nhật ký truy cập dữ liệu cá nhân: ai **xem / sửa / xuất** CCCD, lương, hồ sơ cán bộ
- [ ] Quy định thời hạn lưu nhật ký và ai được xem
- [ ] Kiểm thử phân quyền theo 3 vai trò (admin · cán bộ phòng · tài khoản phường/xã)

### N3 — Pháp lý đủ dùng
- [x] 0 mục trong danh mục nêu văn bản đã bãi bỏ làm căn cứ (585 mục đã quét)
- [ ] 13 tài liệu chưa khai hiệu lực → có kết luận hoặc quyết định chờ
- [ ] 58 mục ban hành trước 2020 → rà xong
- [ ] Mục chưa chắc chắn **hiển thị "cần đối chiếu"**, không khẳng định

### N4 — Công cụ thẩm định dùng được thật
- [ ] Kết quả kiểm kê lưu CSDL, có lịch sử lần quét
- [ ] Cán bộ **xác nhận mapping** tệp ↔ thành phần hồ sơ
- [ ] Phiếu .docx sinh từ **dữ liệu đã xác nhận**, không từ số máy đọc
- [ ] Có kiểm thử đường dẫn nguy hiểm chạy tự động

### N5 — BT08 giai đoạn 1
- [ ] Dashboard **không hiển thị chỉ báo lấy từ bảng rỗng**
- [ ] Mỗi cảnh báo có người chịu trách nhiệm xác minh
- [ ] Phạm vi sandbox chốt: một địa bàn, một nhóm công trình, 2025–2026

**Bàn giao:** tài liệu khôi phục · tài khoản quản trị dự phòng · lịch kiểm tra · danh sách phụ thuộc ngoài · người chịu trách nhiệm từng mảng.

---

## 2. Giao thức phối hợp với Codex

### 2.1. Khi nào dùng
| Loại thay đổi | Phản biện thiết kế (trước khi viết) | Review diff (sau khi viết) |
|---|:---:|:---:|
| Pháp lý · bảo mật · migration · phân quyền | **Bắt buộc** | **Bắt buộc** |
| Đổi mô hình dữ liệu / quy trình nghiệp vụ | **Bắt buộc** (kèm thiết kế 1 trang) | Bắt buộc |
| Tính năng thường | Không | Bắt buộc |

Thiết kế 1 trang phải nêu: bảng ảnh hưởng · quyền · trạng thái · xử lý lỗi · cách quay lui.

### 2.2. Nguồn chân lý khi Codex và tôi bất đồng

Codex **đã sai thật nhiều lần** trong dự án này: sai ngày hiệu lực TT 04/2005; dẫn **cùng một URL vbpl.vn cho hai kết luận khác nhau**; báo nhầm 4 trang "không nối CSDL". Nên mọi kết luận phải quy về nguồn kiểm chứng được:

| Loại | Nguồn chân lý |
|---|---|
| Pháp lý | Văn bản chính thức trong kho, hoặc **Sở xác nhận**. Không có → ghi "cần đối chiếu" |
| Lược đồ CSDL | Introspect trực tiếp CSDL production |
| Bảo mật | Test **tái hiện được** (như bộ thử vượt thư mục đã làm) |
| Dữ liệu | Truy vấn SQL, lưu kèm kết quả |

### 2.3. Checklist bắt buộc trước thao tác nguy hiểm
Áp dụng cho: migration · xoá dữ liệu · reset tài khoản · sửa phân quyền.

1. Bản sao lưu gần nhất **đã khôi phục thử thành công**
2. SQL preview **số dòng bị ảnh hưởng** trước khi chạy
3. Có câu lệnh kiểm tra sau khi chạy
4. Có rollback hoặc forward-fix
5. Chạy ngoài giờ làm việc
6. Ghi nhật ký ai duyệt

---

## 3. Các đợt công việc

Thứ tự đã đảo theo phản biện Codex. Ước lượng đã nới — bản đầu quá lạc quan.

### Đợt 1 — Nền vận hành (3–4 ngày) · *bắt buộc trước mọi thay đổi khác*

| # | Việc | Ghi chú |
|---|---|---|
| 1.1 | ~~Kiểm chứng khôi phục sao lưu~~ | ✅ **Xong 20/8** — xem mục 4 |
| 1.2 | Sao lưu ra **ổ/vị trí thứ hai** | Hiện 14 bản đều nằm trên C: cùng ổ với CSDL — hỏng ổ là mất cả hai |
| 1.3 | Tài liệu khôi phục máy mới + RPO/RTO | Gồm cả tệp đính kèm, .env, IIS, PM2, chứng chỉ, Task Scheduler |
| 1.4 | Lệnh `healthcheck` gộp các script kiểm tra, lưu kết quả theo ngày | smoke-chatbot + kiểm tra căn cứ pháp lý + rà hiệu lực + kiểm thử đường dẫn |
| 1.5 | Kiểm thử phân quyền 3 vai trò + API nhạy cảm | Chặn thoái lui sau các đợt vá |

### Đợt 2 — Nhật ký truy cập dữ liệu cá nhân (2–3 ngày)
Vừa vá 4 API lộ CCCD nhưng **chưa ghi nhận ai đã xem gì**. Với dữ liệu CCCD/lương/hồ sơ cán bộ, đây là yêu cầu pháp lý chứ không phải tính năng.

- 2.1 Ghi nhật ký xem/sửa/xuất dữ liệu cá nhân
- 2.2 Trang tra cứu nhật ký cho người có thẩm quyền
- 2.3 Quy định thời hạn lưu, ai được xem

### Đợt 3 — Kiểm soát phụ thuộc bên ngoài (2 ngày)

| # | Phụ thuộc | Rủi ro hiện tại | Việc |
|---|---|---|---|
| 3.1 | **OpenAI** | Đã gặp 429 → 3 lượt hỏi lỗi. Đổi model chỉ chữa triệu chứng | Theo dõi hạn mức · circuit breaker · fallback "tra tài liệu, không sinh câu trả lời" · ngân sách tháng |
| 3.2 | **Ổ G: / Google Drive** | Máy chủ **không thấy ổ G:** · sync 15 phút phụ thuộc tài khoản Google | Kiểm kê mọi đường dẫn tuyệt đối · kiểm tra tồn tại/quyền đọc · chuyển tệp quan trọng vào lưu trữ hệ thống quản lý |
| 3.3 | **RAM 6GB** | Job nền + HNSW + chatbot + xuất docx tranh RAM với PostgreSQL | Đo RAM thật trước khi thêm job nền · giới hạn đồng thời · cảnh báo khi RAM/đĩa cao |

### Đợt 4 — Pháp lý (2–3 ngày)
- 4.1 Rà 58 mục ban hành trước 2020, đánh dấu `hieuLucDen`
- 4.2 Nạp 3 văn bản còn thiếu khi Sở cung cấp *(chờ B2)*
- 4.3 Cập nhật hiệu lực 13 tài liệu *(chờ B3)*
- 4.4 Tạo hồ sơ `can_bo` cho tài khoản chưa có → dùng được "quên mật khẩu"

### Đợt 5 — Hoàn thiện công cụ thẩm định (5–8 ngày)
Ước lượng cũ 2–3 ngày là **quá thấp** — đây là một luồng nghiệp vụ hoàn chỉnh có trạng thái và phân quyền.
- 5.1 Lưu kết quả kiểm kê + lịch sử + so sánh giữa các lần nộp
- 5.2 Màn xác nhận mapping tệp ↔ thành phần hồ sơ
- 5.3 Xuất phiếu .docx từ dữ liệu đã xác nhận
- 5.4 Chuyển quét sang job nền *(sau khi đo RAM ở 3.3)*
- 5.5 Xử lý PDF scan không đọc được (hiện ghi rõ "chưa đọc được")

### Đợt 6 — BT08 giai đoạn 1 (chia đôi)
- **6a. Bảng theo dõi từ dữ liệu sẵn có (3–4 ngày):** bản đồ 929 tài sản có toạ độ · thống kê 3.715 báo cáo phường/xã · cảnh báo quá hạn thẩm định
- **6b. Bộ cảnh báo chính thức (sau khi Sở nghiệm thu quy tắc):** chỉ báo bất thường chỉ phát hành khi quy tắc được chuyên viên xác nhận — báo sai sẽ mất niềm tin, khó lấy lại

> Codex cảnh báo đúng: cấp phép/vi phạm/kiểm tra/năng lực đều **bằng 0**, nên dashboard dễ thành "màn hình đẹp nhưng rỗng". Dashboard **không được hiển thị chỉ báo lấy từ bảng rỗng**.

### Đợt 7 — Nợ kỹ thuật (2–3 ngày)
- 7.1 Tách system prompt chatbot theo nhóm quyền *(hiện ~5.000 token/lượt × 219 tài khoản)*
- 7.2 Cache embedding câu hỏi
- 7.3 Phân trang `/api/tai-lieu`
- 7.4 ~~Chuẩn hoá lệch tên ràng buộc FK~~ → **không làm trên production** nếu không có lợi ích vận hành rõ. Chỉ dry-run và ghi nhận.

---

## 4. Đã kiểm chứng hôm nay: sao lưu khôi phục được

Trước nay chỉ biết `pg_dump` **tạo được file**, chưa ai thử khôi phục. Đã phục hồi bản 20/8/2026 vào CSDL tạm (không đụng bản chạy thật):

| Kiểm tra | Kết quả |
|---|---|
| Bảng | 146 |
| Tài khoản | 219 |
| Hồ sơ cán bộ | 145 |
| Đoạn tài liệu có véc-tơ | 17.364 |
| Chỉ mục HNSW | Khôi phục kèm ✓ |
| Báo cáo đường | 1.342 |

**Kết luận: bản sao lưu dùng được.** Đã xoá CSDL tạm sau khi kiểm.

⚠️ **Nhưng chưa đủ:** cả 14 bản sao lưu đều nằm trên **ổ C: cùng với CSDL**. Hỏng ổ hoặc mã độc là mất cả hai → việc 1.2 là ưu tiên cao nhất còn lại.

---

## 5. Chờ quyết định của Sở — không tự làm

| # | Nội dung | Vì sao chờ |
|---|---|---|
| B1 | **NĐ 46/2010** trong khối "Căn cứ" của Thông báo/Quyết định nghỉ hưu lãnh đạo ký — còn hay hết hiệu lực? | Nghi bị NĐ 170/2025 thay. Hệ thống không tự xác minh được. Đây là văn bản đã ký |
| B2 | Cung cấp Luật CBCC 2025, Luật Viên chức 129/2025, NĐ 170/2025 | Chưa có trong kho nên không kết luận được |
| B3 | Khai hiệu lực 13 tài liệu | Đã có phiếu Excel, 13/13 máy đọc được |
| B4 | Xoá schema `org_v2` (5 bảng bản sao cũ) | Thao tác huỷ dữ liệu. **Trước khi hỏi sẽ làm gói bằng chứng**: bảng nào, bao nhiêu dòng, còn code/SQL nào tham chiếu, đã sao lưu riêng chưa |
| B5 | **Số hoá cấp phép xây dựng + vi phạm trật tự xây dựng** | Nút thắt lớn nhất của BT08. Không có thì không phân tích rủi ro được |

---

## 6. Thứ tự đề nghị bắt đầu

1. **1.2** sao lưu ra vị trí thứ hai — rủi ro cao nhất, làm nhanh nhất
2. **1.4** lệnh healthcheck — để mọi đợt sau có rào chắn thoái lui
3. **Đợt 2** nhật ký truy cập dữ liệu cá nhân — nghĩa vụ pháp lý
4. Sau đó mới tới tính năng (Đợt 5, 6)

---

*Kế hoạch này do Claude soạn, Codex phản biện. Codex chỉ ra bản đầu nghiêng về tính năng, thiếu điều kiện kết thúc, ước lượng thời gian quá lạc quan, và bỏ sót khôi phục thảm hoạ / nhật ký truy cập / phụ thuộc ngoài. Đã sửa theo. Mọi kết luận pháp lý trong tài liệu đều quy về nguồn kiểm chứng được hoặc ghi rõ "chờ Sở xác nhận".*
