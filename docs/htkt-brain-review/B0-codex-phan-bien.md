# B0 — Phản biện bản vá của Codex (nguyên văn 4 vòng)

> `codex exec --sandbox read-only`, codex-cli 0.162.0-alpha.17.2, 21/10/2026. Claude KHÔNG chỉnh sửa nội dung. Giải trình: `B0-trien-khai.md` §4.


---

## Vòng 1

**Kết luận: CHƯA ĐẠT để duyệt triển khai bản vá.** S1 và S16 có hướng xử lý đúng, nhưng Q4 vẫn còn đường trả ngày sinh/lương cho người thiếu `canViewOfficeSensitive`; ghi token và S19 cũng chưa kín các nhánh.

Đã kiểm tra diff và tệp mới trên đúng nhánh, bỏ qua `app/lib/generated/**`. Không sửa tệp, đọc tệp bí mật, mở CSDL hay chạy mạng.

**Các sửa bắt buộc**

1. **[Cao] Hai tool sinh nhật vẫn lộ ngày/tháng sinh.**  
   [quyen-tool.ts:25](/D:/Troly/QLHTKT/HTKT/app/lib/chatbot/quyen-tool.ts:25) không đưa `sinh_nhat_hom_nay` và `sinh_nhat_thang_nay` vào nhóm cần quyền nhạy cảm. Đầu ra tại [route.ts:1344](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:1344) và [route.ts:1376](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:1376) gắn tên người với ngày sinh, dù không trả năm sinh.  
   Đường không-AI cũng gọi được các tool này qua `executeTool`, nên hỏi “Sinh nhật tháng 7” khi AI ngừng vẫn lộ. Cần chặn ở cả hai lớp theo Q4.

2. **[Cao] `luong_cua_toi` tự tạo ngoại lệ chưa được Q4 cho phép.**  
   Tool được phép cho chuyên viên thiếu quyền nhạy cảm, rồi trả hệ số, vượt khung và ngày nâng lương tại [route.ts:1620](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:1620). Đường không-AI cũng dùng được.  
   Test tại [quyen-tool.test.ts:50](/D:/Troly/QLHTKT/HTKT/app/lib/chatbot/quyen-tool.test.ts:50) còn khẳng định ngoại lệ này là đúng. Theo quyết định đã cung cấp, cần áp `canViewOfficeSensitive` cả với lương bản thân; ngoại lệ tự xem chỉ hợp lệ khi chủ hệ thống duyệt bổ sung.

3. **[Cao] Quyền quản lý lương đang thay thế quyền xem nhạy cảm ở tool dự thảo.**  
   `du_thao_qd_nang_luong` không bị lọc theo Q4; [route.ts:1432](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:1432) chỉ kiểm tra `canManageSalary`, sau đó trả tên, hệ số và ngày nâng lương. Hai quyền này **không tương đương**: tài khoản chỉ có `office:salary_manage` có thể không có `canViewOfficeSensitive`.  
   Link tải cũng chỉ kiểm tra quyền quản lý lương tại [du-thao/route.ts:25](/D:/Troly/QLHTKT/HTKT/app/app/api/office/nang-luong/du-thao/route.ts:25), rồi đưa lương vào DOCX. Cần thống nhất quyền xem nhạy cảm cho tool và đường tải phục vụ luồng này, đồng thời giữ kiểm tra quyền nghiệp vụ sinh văn bản.

4. **[Trung bình] Mất usage đã phát sinh khi chuyển sang không-AI hoặc gặp lỗi.**  
   Ví dụ: API vòng 1 thành công, tool chạy, API vòng 2 lỗi. Tại [route.ts:2263](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:2263), fallback không nhận `suDung`; log cuối mất toàn bộ token vòng 1. Nhánh lỗi ngoài tại [route.ts:2356](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:2356) cũng không ghi usage đã cộng.  
   Cần giữ bộ đếm xuyên các nhánh kết thúc và truyền vào hàm ghi log.

5. **[Trung bình] S19 bỏ sót truy cập sinh nhật.**  
   [route.ts:1941](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:1941) không chứa hai tool sinh nhật. Ngay cả người được phép xem cũng không có audit cho những truy cập này. Cần bổ sung và kiểm tra nhánh thành công, hết vòng tool, fallback và lỗi.

**Chức năng hợp lệ và hồi quy**

- `tim_can_bo` và `so_do_to_chuc`: các nhánh đã kiểm tra chỉ trả liên hệ công vụ, chức danh, đơn vị và số lượng; chưa thấy trả ngày sinh/lương/nghỉ hưu.
- `ho_so_can_bo`: nhánh thiếu quyền đã ẩn các trường yêu cầu và bỏ lọc năm sinh, kể cả danh sách trùng tên. Tuy nhiên, prompt tại `route.ts:241` vẫn yêu cầu hỏi và dùng năm sinh để phân biệt; cần sửa theo quyền để tránh hỏi dữ liệu rồi âm thầm bỏ qua, gây vòng hỏi lại.
- Xếp hạng lương, tuổi và nghỉ hưu đã bị chặn theo tiêu chí. `don_vi_dong_nhat` vẫn hoạt động.
- Tắt ba tool ghi là đúng phạm vi B0. Tool dự thảo hiện chỉ trả link; **bấm link có ghi kho văn bản**, vì vậy không nên mô tả toàn bộ luồng này là chỉ đọc.
- Lịch sử tại `route.ts:2054` không xét quyền hiện tại: nếu vừa thu hồi quyền nhạy cảm, câu trả lời cũ trong 90 phút vẫn được đưa lại vào ngữ cảnh AI. Nên loại lịch sử nhạy cảm khi người dùng thiếu quyền, tránh model nhắc lại dữ liệu đã xem trước đó.

**Test và kiểm tra thực tế**

- `npm.cmd test`: **15 mục chạy, 15 đạt**, gồm tệp QĐ72 tự báo 17 kiểm tra nội bộ.
- TypeScript: **đạt**, chạy compiler cục bộ với `--noEmit --incremental false` để không ghi cache.
- `git diff --check` ngoài generated: đạt.

Các test mới chứng minh được **hàm quyết định quyền**, xác thực webhook và lựa chọn cờ cookie. Chúng **chưa chứng minh** việc ẩn dữ liệu trong kết quả thật: test “ẩn trường nhạy cảm ở hồ sơ” chỉ kiểm tra boolean, không gọi nhánh dựng hồ sơ. Một số test còn hợp thức hóa sai sót nêu trên.

Cần bổ sung test dùng dữ liệu giả/mock, không cần CSDL hay mạng:

- Ma trận quyền độc lập cho đủ 21 tool, đặc biệt sinh nhật, lương bản thân và dự thảo.
- Kiểm tra nội dung đầu ra hồ sơ đơn/trùng tên; thiếu quyền không lọc năm sinh.
- Fallback không-AI và route tải với tài khoản chỉ có `salary_manage`.
- Usage khi thành công rồi lỗi; audit ở các nhánh kết thúc.
- Webhook GET không lộ secret, xác thực thất bại không chạm DB.
- Lịch sử sau khi thu hồi quyền.

**Điều kiện triển khai**

- Chạy migration 049 **trước mã/client Prisma mới**. Thiếu cột có thể làm mất ghi log; rollback mã/client trước khi bỏ cột. Chú thích migration đã nêu đúng thứ tự.
- Production mặc định `Secure` sẽ làm đăng nhập qua HTTP nội bộ không giữ phiên. Cần xác nhận HTTPS hoặc cấu hình rõ `COOKIE_SECURE=false` cho môi trường HTTP đang được chấp thuận.
- SCADA dùng token cũ/ngắn hơn 24 ký tự sẽ nhận **503**, kể cả token khớp cấu hình. Phải phối hợp đổi secret phía máy chủ và thiết bị trước khi chuyển bản.
- Chưa có bằng chứng RAM, diễn tập khôi phục và kiểm tra triển khai thực tế; không thể coi kết quả unit test là nghiệm thu toàn bộ B0.
- Q3 thực thi ở B1 theo phạm vi đã chốt; tôi không dùng phần chưa triển khai đó làm lý do đánh trượt bản vá này.

---

## Vòng 2

**Kết luận: CHƯA ĐẠT để trình duyệt bản vá ở trạng thái hoàn tất.** Các sửa chính đã tiến bộ, nhưng đường tái sử dụng lịch sử vẫn có thể giữ dữ liệu nhạy cảm sau thu hồi quyền và lan sang người khác qua câu trả lời được LIKE.

Đã kiểm đúng nhánh `b0-va-khan-htkt-brain`, gồm thay đổi chưa commit và tệp mới; bỏ qua `app/lib/generated/**`. Không sửa tệp, không mở CSDL, không mạng, không đọc các đường dẫn bị cấm.

### 1. Đối chiếu từng sửa

Các dòng `route.ts` dưới đây thuộc `app/app/api/chatbot/route.ts`.

| Mục | Đánh giá | Bằng chứng |
|---|---|---|
| #1 Sinh nhật | **ĐÃ SỬA** | Hai tool nằm trong tập nhạy cảm tại `app/lib/chatbot/quyen-tool.ts:32`; chặn thực thi dòng 67 và lọc khỏi danh sách mô hình dòng 82. Route áp dụng hai lớp tại `route.ts:662`, `2204`. |
| #2 `luong_cua_toi` | **CHƯA** thay đổi hành vi; đã ghi ngoại lệ | Comment tại `quyen-tool.ts:29`; handler vẫn trả lương tại `route.ts:1593`. Cần chủ hệ thống quyết định; xem phần dưới. |
| #3 Dự thảo nâng lương | **CHƯA** | Vẫn chỉ kiểm `canManageSalary` tại `route.ts:1424`, rồi trả tên, hệ số, ngày nâng lương tại dòng 1439. |
| #4 Usage khi chuyển không-AI/lỗi | **ĐÃ SỬA** | Khai báo ngoài `try` tại `route.ts:2151`; truyền sang fallback dòng 2262, ghi tại dòng 2128; catch ghi dòng 2361. |
| #5 S19 thiếu sinh nhật | **ĐÃ SỬA** | Bổ sung tại `route.ts:1937`; danh sách được dùng ở nhánh thành công, fallback, hết vòng và lỗi. |
| Prompt hỏi năm sinh | **ĐÃ SỬA** | Ngoại lệ rõ tại `route.ts:243`; phía máy chủ cũng bỏ lọc năm sinh khi thiếu quyền tại dòng 713. |
| Lịch sử sau thu hồi quyền | **SỬA MỘT PHẦN** | `route.ts:2057` chỉ bỏ lượt có tool nhạy cảm trực tiếp, chưa xử lý lượt kế thừa dữ liệu từ lịch sử. |
| Test đầu ra và ma trận | **ĐÃ SỬA trong phạm vi đã nêu** | `app/lib/chatbot/ho-so-cong-vu.test.ts:28`, `:34` kiểm đầu ra một người/trùng tên; `quyen-tool.test.ts` có ma trận viết tay. Chưa chứng minh an toàn toàn tuyến lịch sử, RAG và nhận diện “chính mình”. |

### 2. Hai điểm bất đồng với Claude

**#2 — Chấp nhận một phần lập luận, chưa chấp nhận coi ngoại lệ đã được phê duyệt.**

S11 được mô tả trong ngữ cảnh dữ liệu **đồng nghiệp** tại `docs/htkt-brain-review/14-executive-summary.md:28`. Vì vậy, cho người dùng xem lương của chính mình là một lựa chọn nghiệp vụ hợp lý. Tuy nhiên, quyết định Q4 tại dòng 101 không ghi rõ ngoại lệ này; lập luận “quyền chủ thể dữ liệu” chưa tự chứng minh quyền đưa dữ liệu qua chatbot/LLM.

Ngoài ra, mã nhận diện chưa thực hiện đúng comment “ưu tiên userId, sau đó CCCD”:

- `route.ts:1595` dùng `findFirst` với `OR` tại dòng 1596.
- Nếu `userId` khớp hồ sơ A nhưng CCCD/email khớp hồ sơ B, truy vấn có thể chọn một trong hai; không có ưu tiên hay từ chối xung đột.
- Hai cột có `@unique` riêng không ngăn được xung đột chéo này.

**Câu hỏi trình chủ hệ thống:** có cho phép tự xem lương qua chatbot khi thiếu quyền nhạy cảm không? Rủi ro chính sách **trung bình**; rủi ro trả nhầm lương **cao nếu liên kết định danh xung đột**. Trước khi giữ ngoại lệ, cần giải quyết định danh theo thứ tự rõ ràng và từ chối xung đột.

**#3 — Giữ bất đồng về việc mặc nhiên cho phép qua chatbot; chấp nhận không sửa route nghiệp vụ trong vòng này.**

`app/lib/auth.ts:123` và `:184` cho thấy `canManageSalary` và `canViewOfficeSensitive` là hai tập quyền khác nhau. Quyền làm lương là bằng chứng về nhu cầu nghiệp vụ, nhưng chưa chứng minh chủ hệ thống đã cho phép cùng dữ liệu đi qua chatbot.

Đặc biệt, handler chatbot hiện trả ngay dữ liệu lương của đồng nghiệp tại `route.ts:1439`, trước khi người dùng tải DOCX. Vì vậy, đây vẫn là vấn đề thuộc phạm vi chatbot B0.

**Câu hỏi trình chủ hệ thống:** `salary_manage` có bao hàm quyền xem dữ liệu lương qua chatbot không? Rủi ro **cao** do truy xuất danh sách nhiều người theo tháng. Có thể giữ nguyên giao diện nghiệp vụ và chỉ chặn tool chatbot trong lúc chờ quyết định; không nhất thiết sửa `/api/office/nang-luong/du-thao`.

### 3. Các đường lộ còn lại theo Q4

**Cao — Lịch sử nhạy cảm không được đánh dấu xuyên lượt.**

Chuỗi khả thi từ mã:

1. Khi còn quyền, lượt A dùng tool nhạy cảm.
2. Lượt B yêu cầu nhắc lại/tóm tắt; mô hình đọc A từ lịch sử và trả lời không gọi tool.
3. B được ghi với `toolsUsed: []` tại `route.ts:2282`.
4. Sau thu hồi quyền, dòng 2057 bỏ A nhưng giữ B; dòng 2059 đưa câu trả lời B vào ngữ cảnh.

Đây là thiếu sót của sửa vòng 2, chưa có kiểm thử tái hiện. Cần đánh dấu nguồn nhạy cảm xuyên lượt hoặc vô hiệu hóa lịch sử thích hợp khi quyền thay đổi.

**Cao — Câu trả lời kế thừa có thể lan sang người khác qua LIKE.**

`route.ts:1879` lấy câu LIKE có `toolsUsed` rỗng theo nhóm `isWardUser`, không giới hạn người dùng hoặc quyền nhạy cảm. Lượt B nói trên đủ điều kiện tham gia. Bộ regex dòng 1857 không bao phủ mọi cách viết ngày sinh/lương; cả câu hỏi và đáp án được đưa lại vào prompt tại dòng 1916.

Đây là đường tồn tại được phát hiện thêm, không khẳng định mới phát sinh ở vòng 2. Nó cùng nguyên nhân thiếu dấu nhạy cảm xuyên lượt.

**Cao, phụ thuộc nội dung kho — RAG chỉ phân biệt phạm vi tài liệu.**

`route.ts:1667` cho tài khoản có quyền Văn phòng tra `NOI_BO_SO`; dòng 1687 chuyển nguyên đoạn nội dung vào kết quả. Không có kiểm tra Q4 theo quyền nhạy cảm ở đường này. Nếu kho chứa quyết định lương hoặc hồ sơ có ngày sinh/CCCD, người thiếu quyền vẫn có đường tiếp cận.

Không mở CSDL nên tôi **không xác nhận kho hiện chứa các dữ liệu đó**. Cần chứng minh kho được giới hạn nội dung phù hợp hoặc bổ sung phân quyền tương ứng.

### 4. Kiểm chứng và điều kiện xét lại

- `npm.cmd test`: **18/18 mục kiểm thử đạt**; bộ `qd72` báo thêm **17 PASS, 0 FAIL**.
- `npx.cmd --no-install tsc --noEmit --incremental false`: **đạt**, mã thoát 0.
- Chưa thấy hồi quy trực tiếp ở các phần sinh nhật, usage và dựng hồ sơ công vụ đã kiểm.

Để xét lại kết luận: xử lý lịch sử/LIKE kế thừa dữ liệu nhạy cảm, làm chắc nhận diện “chính mình”, giải quyết phạm vi RAG và nhận quyết định rõ cho hai ngoại lệ #2–#3. Test hiện đạt chưa phủ các đường này.

Đây chỉ là kết luận phản biện **bản vá**, không phải nghiệm thu toàn bộ B0; RAM và diễn tập khôi phục vẫn chờ VPS/kết quả Phụ lục A.

---

## Vòng 3

**Kết luận: CHƯA ĐẠT để duyệt bản vá hiện tại.** Cơ chế mới xử lý đúng các lượt được đánh dấu, nhưng chưa chặn lịch sử cũ thiếu dấu. Có thể chuyển thành **ĐẠT CÓ ĐIỀU KIỆN** khi có biện pháp cách ly lịch sử trước phiên bản đánh dấu và xác lập mốc an toàn cho LIKE.

Đã kiểm tra đúng nhánh `b0-va-khan-htkt-brain`. Không sửa tệp, không mở CSDL, không mạng, không đọc đường dẫn cấm; bỏ qua mã generated.

### 1. Đối chiếu từng sửa

Các đường dẫn dưới đây tính từ `app/`.

| Sửa | Đánh giá | Bằng chứng |
|---|---|---|
| Lịch sử nhạy cảm trực tiếp và kế thừa | **MỘT PHẦN** | `lib/chatbot/quyen-tool.ts:94–109` nhận diện và loại cả hai loại; route gắn dấu tại `app/api/chatbot/route.ts:2205–2208`. Nhưng truy vấn lịch sử tại `route.ts:2056–2062` vẫn nhận lượt cũ chưa có dấu. |
| Chặn LIKE lan sang người khác | **MỘT PHẦN** | `route.ts:1892` yêu cầu `toolsUsed` rỗng và `soLanGoi != null`. Lượt có dấu bị loại đúng, nhưng lượt mới kế thừa từ lịch sử cũ không dấu có thể vượt cả hai điều kiện. |
| Nhận diện `luong_cua_toi` | **ĐÃ SỬA** | Hai `findUnique` riêng tại `route.ts:1605–1609`; từ chối hai hồ sơ khác nhau hoặc CCCD đã gắn tài khoản khác tại `lib/chatbot/nhan-dien-ban-than.ts:18–23`. |
| Dự thảo quyết định nâng lương | **ĐÃ SỬA** | Thêm vào tập bắt buộc quyền nhạy cảm tại `quyen-tool.ts:35–38`; kiểm quyền chung tại `route.ts:665–666`; handler vẫn kiểm `canManageSalary` tại `route.ts:1427–1428`. Route nghiệp vụ không có trong danh sách thay đổi. |
| Ngoại lệ tự xem lương | **CHƯA được phê duyệt** | Ngoại lệ vẫn giữ tại `quyen-tool.ts:33–38`, được kiểm thử tại `quyen-tool.test.ts:52–53`. Đúng trạng thái đang trình chủ hệ thống quyết. |
| RAG `NOI_BO_SO` / S22 | **CHƯA sửa — đã hoãn phạm vi** | Không coi việc ghi nhận S22 là đã khắc phục. Cần chủ hệ thống chấp thuận hoãn sang B1/B2. |

### 2. Phát hiện còn lại và các nhánh đặc biệt

**[Cao] Lịch sử cũ có thể làm mất dấu xuyên sang lượt mới.**

Kịch bản:

1. Trước cơ chế mới, lượt A gọi tool lương; lượt B nhắc lại dữ liệu nhưng `toolsUsed = []`.
2. Sau triển khai, người dùng bị thu hồi quyền. Truy vấn lịch sử vẫn lấy B; `chonLichSu` chỉ nhìn `toolsUsed`, nên giữ B.
3. AI nhận dữ liệu trong B và có thể nhắc lại ở lượt C mà không gọi tool.
4. C có `toolsUsed = []`, `soLanGoi > 0`; nếu được LIKE, C có thể trở thành ứng viên học dùng cho người khác.

Điểm liên quan: `route.ts:2056–2066`, `quyen-tool.ts:97–109`, `route.ts:1892`.

Cửa sổ 90 phút **không tự bảo đảm rủi ro hết sau 90 phút**: mỗi lượt mới không dấu có thể tiếp tục mang dữ liệu sang cửa sổ kế tiếp. Cần loại/cách ly lịch sử trước mốc phiên bản an toàn, hoặc có biện pháp vận hành tương đương được xác định rõ trước khi mở lại chatbot.

| Nhánh | Kết quả kiểm tra |
|---|---|
| AI trả lời thành công | Giữ dấu trong log: `route.ts:2288–2294`. |
| AI lỗi rồi chuyển không-AI | Truyền dấu qua `daChayTruoc`: `route.ts:2273`; log hợp nhất tại `route.ts:2134`. |
| AI đang tạm ngưng | **Không đúng tuyên bố “mọi nhánh đều dùng dấu”**: `route.ts:2250` truyền `[]`. Tuy nhiên nhánh này không dùng lịch sử để sinh câu trả lời và luôn ghi `__khong_ai__`, nên chưa thấy đường rò dữ liệu do riêng việc thiếu dấu. |
| Chặn mật khẩu mặc định | Chạy trước khi nạp lịch sử; trả thông báo cố định và ghi marker riêng: `route.ts:2174–2192`. Không cần dấu kế thừa cho câu trả lời này. |
| Hết vòng lặp / lỗi hệ thống | Giữ dấu đã có: `route.ts:2357`, `route.ts:2371`. |
| Người có quyền LIKE lượt mang dấu | LIKE không xóa dấu; truy vấn `toolsUsed: { isEmpty: true }` vẫn loại lượt đó. |
| Audit truy cập kế thừa | **Chưa ghi `VIEW_SENSITIVE` nếu chỉ có dấu kế thừa**: bộ lọc audit chỉ nhận tên trong `TOOL_NHAY_CAM`, tại `route.ts:1952` và `route.ts:2301`. Đây là khoảng trống truy vết, không phải đường vượt quyền đọc. |

Cơ chế cũng đánh dấu khá rộng: lịch sử chứa `tim_can_bo` hoặc hồ sơ đã che trường vẫn bị coi nhạy cảm. Điều này bảo thủ về bảo mật nhưng làm mất ngữ cảnh của người không có quyền (`quyen-tool.ts:81–85`, `108`).

**`soLanGoi != null` có chứng minh “sau bản vá” không?**

Chỉ có điều kiện:

- Migration 049 thêm cột nullable, không default, không backfill.
- Mã hiện tại chỉ ghi `soLanGoi` khi có lần gọi AI thành công (`route.ts:2013`, `2276`).
- `HEAD` chưa có trường này.

Vì vậy, nó loại được dữ liệu tồn tại trước khi cơ chế ghi token được triển khai, **nếu không có backfill hoặc phiên bản trung gian đã ghi token**. Nó không chứng minh lượt được tạo sau **bản sửa dấu kế thừa vòng 3**. Không kiểm CSDL nên tôi không xác nhận được điều kiện triển khai thực tế.

### 3. Kiểm chứng và điều kiện trình duyệt

- `npm.cmd test`: **23/23 pass**; bộ QĐ72 báo thêm **17 PASS, 0 FAIL**.
- `npx.cmd --no-install tsc --noEmit --incremental false`: **pass**.
- Test hiện tại kiểm helper lịch sử, chưa kiểm tích hợp các nhánh route và chuyển tiếp lịch sử cũ.
- Không xác nhận hồi quy tiếng Việt: kiểm mã ký tự cho thấy đó là lỗi hiển thị terminal.

Các câu hỏi cần chủ hệ thống quyết:

1. Chấp thuận biện pháp nào để cách ly lịch sử trước phiên bản đánh dấu? Đã từng triển khai phiên bản ghi `soLanGoi` nhưng chưa có dấu kế thừa chưa?
2. Có phê duyệt ngoại lệ `luong_cua_toi`, gồm đường dự phòng CCCD khớp hồ sơ chưa gắn tài khoản?
3. Có chấp thuận chatbot dự thảo quyết định phải đồng thời có quyền quản lý lương và quyền xem nhạy cảm?
4. Có yêu cầu audit cả lượt chỉ đọc dữ liệu qua lịch sử kế thừa?
5. Có chấp thuận hoãn S22 sang B1/B2 với trách nhiệm và mốc xử lý cụ thể?

**Điểm chặn kỹ thuật là chuyển tiếp lịch sử cũ; không phải yêu cầu nghiệm thu toàn bộ B0.**

---

## Vòng 4

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN** để trình chủ hệ thống duyệt. Không thấy điểm chặn mã nguồn còn lại trong phạm vi vòng 4.

- **Hai sửa đúng:** lịch sử thêm `soLanGoi != null` tại [route.ts:2060](/D:/Troly/QLHTKT/HTKT/app/app/api/chatbot/route.ts:2060); cả ba bộ lọc audit nhận `DAU_KE_THUA_NHAY_CAM`, bao phủ thành công, chuyển không-AI, hết vòng và lỗi.
- **Chuỗi từ log cũ đã bị cắt ở cả lịch sử và LIKE**, với giả định phát hành bạn nêu. LIKE đòi thêm `toolsUsed` rỗng; lượt B0 kế thừa nhạy cảm mang dấu nên bị loại. Sau thu hồi quyền, lịch sử loại cả lượt trực tiếp lẫn kế thừa.
- **Hệ quả hành vi:** log cũ và lượt thuần không-AI không còn được nạp làm ngữ cảnh; LIKE cũ không còn được dùng để học. Không thấy hồi quy bảo mật do hai sửa.
- **Kiểm chứng:** `npm test` đạt 23/23; TypeScript đạt. Chưa kiểm thử tích hợp CSDL theo ràng buộc.

Điều kiện triển khai:

1. Migration 049 chạy trước mã mới; log cũ giữ `soLanGoi = null`, không backfill/default.
2. Phát hành trọn B0 trên mọi instance; không dùng phiên bản ghi `soLanGoi` nhưng thiếu dấu kế thừa, kể cả khi rollback.
3. Trước mở sử dụng, kiểm thử khói: nhắc lại dữ liệu nhạy cảm → thu hồi quyền → hỏi tiếp; xác nhận lịch sử, LIKE và audit đúng.
4. Chốt HTTPS/cookie và cấu hình webhook theo kế hoạch triển khai.

Câu hỏi cần chủ hệ thống chốt:

- Chấp thuận mất ngữ cảnh cũ, LIKE cũ và ngữ cảnh lượt không-AI?
- Chấp thuận ngoại lệ `luong_cua_toi` cho người thiếu quyền nhạy cảm?
- Xác nhận dự thảo nâng lương qua chatbot hiện cần **cả quyền nghiệp vụ lương và quyền nhạy cảm**? Tài liệu triển khai đang mô tả điểm này chưa khớp mã.
