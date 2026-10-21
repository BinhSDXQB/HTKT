# 06 — Giải trình và xử lý phản biện (Vòng 3)

> Claude đã **tự đọc lại mã** cho từng ý kiến trước khi trả lời — không chấp thuận vì "Codex nói vậy".
> Phân loại: **CT** chấp thuận · **CĐK** chấp thuận có điều kiện · **KCT** không chấp thuận · **KCT-MP** không chấp thuận một phần · **KCT+** cần kiểm chứng thêm.
> Nguyên văn Codex ở 05. Đồng thuận Claude–Codex **không** thay cho kiểm thử (12).

## 1. Mười việc Codex 2B yêu cầu sửa

| # | Ý kiến Codex | Claude kiểm lại | Phân loại | Đã sửa ở |
|---|---|---|---|---|
| 1 | Javis tự học **không bắt buộc Git** — báo cáo dựa docstring | `learn.py:1790-1797`: "GIT KHÔNG còn bắt buộc… `allow_write = force_write or (mode=='auto' and rate...)`" — **Claude sai** | CT | 02 §2 #8, #16 |
| 2 | MCP Hub: quyền không hợp lệ → `full`; tool không phân loại được → `read` | `mcp_catalog.py:498-510` xác nhận | CT | 02 §3; 08 nguyên tắc "từ chối mặc định" |
| 3 | RAG lọc phạm vi + **trả nhãn** hiệu lực, không lọc hiệu lực theo thời điểm | `search.ts:66-72`: WHERE chỉ có `deletedAt`, `trangThai`, `phamVi` — đúng | CT | 01 §2.2, §4 |
| 4 | Bỏ sót cơ chế **"học từ LIKE"** chèn vào system prompt | `route.ts:1861-1903, 2181-2186` xác nhận. Đã có rào: chỉ lượt **không dùng tool**, lọc dữ kiện động, tách TK xã, nhãn "không phải nguồn dữ kiện". Rủi ro còn: người dùng có thể LIKE một câu trả lời chứa chỉ thị → đi vào system prompt của người khác; **không lọc theo chủ sở hữu/phòng** (`:1865-1869`) | CT — ~~"không có tool ghi kích hoạt được từ gợi ý"~~ **lập luận này SAI** (đính chính vòng 4, xem §5): gợi ý nằm trong system prompt của lượt có tool ghi | 01 S15; 03; 09 WF3; 10 §2 |
| 5 | S2–S3 phải gồm: xác nhận gắn payload, **idempotency**, kiểm soát đồng thời, **audit nguyên tử** | `route.ts:1163` update trước khi lượt LLM kết thúc; `:2285` nhánh hết vòng; `lib/audit.ts` nuốt lỗi — đúng | CT | 01 S2, S3, S17; 08 §3 |
| 6 | Kết luận quyền từ quét từ khoá không đủ; **GET webhook công khai** | `webhook/infrastructure/route.ts:129-140`: GET không xác thực, trả `env_var: 'WEBHOOK_SECRET (mặc định: <token-mặc-định-đã-che>)'` và ví dụ header Bearer — **nặng hơn Claude đánh giá** | CT | 01 S1 (nâng mức), S6 |
| 7 | Sửa số liệu Javis, dòng dẫn chứng (webhook dòng 24, không 23) | đúng; tệp `.py` trực tiếp trong `server/` = 178, đệ quy 197 (Claude ghi "184 tệp" = mọi tệp, gồm JSON) | CT | 01, 02 |
| 8 | Dữ liệu hiệu lực là **nháp**; chưa chốt thuế/bảng tra | `hieu-luc-vbpl.json:2`: "Đây là đánh giá NHÁP do trợ lý đề xuất (rà soát 4/7/2026)" — xác nhận | CT | 01 S8, S9, S10 |
| 9 | B+ phải có mô hình quyền worker, giao dịch, phục hồi, ngân sách RAM có số đo | đồng ý — "schema riêng" không phải ranh giới bảo mật | CT | 07, 08 |
| 10 | Bỏ nhãn "hoàn thiện"/"lớn nhất" → mức bằng chứng | đồng ý | CT | 03 (đổi ✅ → "có triển khai, chưa xác nhận vận hành") |

## 2. Phán quyết C/S mà Claude giữ ý kiến hoặc giải thích thêm

| Mục | Codex | Claude | Kết quả |
|---|---|---|---|
| C-01 "không khảo sát được" | nên là "chưa khảo sát" | Đồng ý diễn đạt: không có kênh truy cập *trong phiên này*; chủ hệ thống chạy Phụ lục A là khảo sát được | CT |
| C-02 / C-08 "lớn nhất" | chưa so sánh | Đồng ý bỏ xếp hạng tuyệt đối; giữ là "ràng buộc phải đo trước" | CT |
| C-07 LLM "bên ngoài" | endpoint có thể nội bộ | Đúng về khả năng; mặc định mã là OpenAI (`cau-hinh.ts:28,31`); chưa biết production | CĐK — ghi "mặc định ra ngoài; production chưa kiểm" |
| C-09 shell ≠ Administrator | đúng | Quyền shell = quyền tài khoản chạy dịch vụ; vẫn trái nguyên tắc 4 nếu tài khoản đó đọc được dữ liệu QL-HTKT | CĐK |
| C-11 thuê bao cá nhân | quyết định quản trị | Đồng ý — chuyển sang câu hỏi cho chủ hệ thống (14 Q-list), không kết luận vi phạm | CT |
| C-12 "chỉ cần" đồ thị văn bản | chưa chứng minh | Đồng ý: đổi thành "bắt đầu với quan hệ văn bản, đo bằng bộ câu hỏi pháp lý (12 §3) trước khi cân nhắc KG" | CT |
| S9 thuế GTGT | không đủ căn cứ thống nhất một mức | Đồng ý: đề xuất là **tham số theo ngày áp dụng + nguồn văn bản**, không phải hằng số | CT |
| **S10** tra theo bậc | CHƯA ĐỦ BẰNG CHỨNG (DuToanAI ngoài phạm vi) | Claude đã đọc trực tiếp `D:\Troly\Dutoan_AI\packages\core\src\he-so-chi-phi-xay-dung.ts:9,121-140` (`traBac` cho Bảng 3.3, 3.4, 3.7). Đồng ý rằng **nhất quán ≠ đúng nghiệp vụ** | CĐK — giữ "không phát hiện lỗi", thêm kiểm thử giá trị sát ngưỡng bậc với đáp án pháp chế (12) |

## 3. Phát hiện mới từ Codex 2A (độc lập) — Claude kiểm lại

| Mã mới | Phát hiện | Claude kiểm lại | Phân loại | Mức |
|---|---|---|---|---|
| **S11** | Tool `ho_so_can_bo` trả ngày sinh, SĐT, email, hệ số lương, phụ cấp cho **mọi tài khoản cấp Sở**, không gọi `canViewOfficeSensitive` | `route.ts:697-712, 747-760`; chỉ chặn TK xã (`SO_ONLY_TOOLS`, `:1819`) | CT | **Cao** (chính sách: chủ hệ thống quyết dữ liệu nào là "nhạy cảm") |
| **S12** | Quyền gắn **CCCD cá nhân viết cứng** (`SALARY_SENSITIVE_CCCD`, `CAN_BO_MANAGER_CCCD`) | `lib/auth.ts:95-111` (đã xác nhận; không chép số vào báo cáo) | CT | Trung bình |
| **S13** | Hỏi đáp hồ sơ: nội dung hồ sơ đặt ở `role: 'system'`; lịch sử hội thoại lấy **từ client** | `hoi-dap/route.ts:33, 105`. Có rào tốt: thẻ `<HO_SO>` bị loại khỏi trích đoạn, chỉ thị "không làm theo" | CT | Trung bình (không có tool ghi) |
| **S14** | Che dữ liệu nhật ký chỉ xử lý SĐT, CCCD; audit ghi câu hỏi thô 160 ký tự | `route.ts:1934-1949, 2245` | CT | Trung bình |
| **S15** | Học từ LIKE (mục 1 #4) | như trên | CT | **Cao** khi tool ghi còn bật (vòng 4) |
| **S16** | Cookie phiên `secure` chỉ bật khi `COOKIE_SECURE=true` | `lib/session.ts:50` | CT — production **chưa kiểm** | Trung bình |
| **S17** | Ghi trước khi lượt LLM kết thúc → người dùng thấy lỗi rồi thử lại → **ghi lặp**; không kiểm phiên bản khi update; audit sau phản hồi và nuốt lỗi | `route.ts:1097, 1163, 2215, 2285`; `lib/audit.ts:15` | CT | Cao |
| **S18** | Ingest RAG không nguyên tử → tài liệu dở xuất hiện trong tìm kiếm | `ingest.ts`: trạng thái `dang_xu_ly` → `san_sang` chỉ khi xong; lỗi → `loi`; `search.ts:72` chỉ lấy `san_sang` ⇒ **tài liệu dở KHÔNG xuất hiện**. Chỉ còn chunk mồ côi khi lỗi | **KCT-MP** | Thấp |
| **S19** | Nhánh "hết 5 vòng tool" không ghi `VIEW_SENSITIVE` dù tool nhạy cảm đã chạy | `route.ts:2282-2292` chỉ `ghiNhanCauHoi`; `logAction` chỉ ở `:2091, :2240` | CT | Trung bình |
| S20 | Ngân sách RAM: `max_memory_restart` không phải trần; `NODE_OPTIONS` ở cấp ngoài `apps[]` chưa chắc được áp; 2 instance mỗi cái cache riêng | `ecosystem.config.js:13,50`; `hoi-dap.ts:35,147-155` | CT | — (đo ở B0) |

## 4. Tổng hợp sau vòng 3

- **Thống nhất:** chọn **B làm nền** (cả ba lượt Codex độc lập đều xếp B cao nhất: 4,20 / 4,10; Claude cũng đề xuất B), **C chỉ là nguồn mẫu thiết kế**, **không A**.
- **Thay đổi định hướng của Claude theo Codex:** đổi "B+" thành **"B từng bước"**: chốt quyền + tính nhất quán (xác nhận gắn payload, idempotency, audit nguyên tử) **trước** khi thêm tiến trình/worker (chi tiết 07, 08).
- **Claude giữ ý kiến:** S18 (ingest) không nghiêm trọng như mô tả.
- **Còn cần kiểm chứng** (không thể giải quyết bằng tranh luận): RAM thực tế; cấu hình production (`WEBHOOK_SECRET`, `COOKIE_SECURE`, nhà cung cấp LLM); chất lượng phân loại read/write của MCP Javis; độ đúng tra bảng tỷ lệ với đáp án pháp chế.

## 5. Xử lý ý kiến Vòng 4 (Codex: "ĐẠT CÓ ĐIỀU KIỆN" — 4 điều kiện)

| Ý kiến vòng 4 | Claude kiểm lại | Phân loại | Đã sửa ở |
|---|---|---|---|
| **ĐK1** — B0 không được coi câu "đồng ý" trong hội thoại là xác nhận; nên tắt 3 tool ghi | Đúng: xác nhận hội thoại không gắn payload/hash, có thể bị injection tạo ra | CT | 03 §3 mục 0; 10 §2; 11 B0 |
| LIKE có thể tác động tool ghi (bác lập luận của Claude ở §1 #4) | Đúng: `CB:2186` gợi ý vào system prompt, `:2199-2203` cùng lượt có danh sách tool ghi | CT | 06 §1 #4; 10 §2 (S15 nâng **Cao**) |
| **ĐK2** — thiếu ca kiểm thử (payload đổi/khác người/hết hạn, thu hồi quyền, audit lỗi→rollback, kill sau commit, LIKE xuyên phòng, webhook phát lại, thuế/bảng tra) + ngưỡng B3 | Đúng | CT | 12 §2.1, §2.2, §3, §4 |
| Kiểm "số hiệu có trong kho" chưa đủ chứng minh căn cứ đúng | Đúng | CT | 12 §3 (3 tầng kiểm) |
| **ĐK3** — Critical Review đặt trước bản nháp; sửa nháp không kiểm lại | Đúng (lỗi sơ đồ) | CT | 09 WF1 |
| Checkpoint không chống ghi lặp khi chết giữa commit và checkpoint | Đúng | CT | 08 ADR-4d, ADR-11; 09 §3 |
| "Mọi node ghi chờ duyệt" quá rộng | Đúng | CT | 09 §3 (ghi vận hành vs hành động nghiệp vụ) |
| Server Action dựa phiên web, worker không có phiên | Đúng (`requireAuth()` trong action) | CT | 08 ADR-5 |
| `--max-old-space-size` không phải trần RSS; "≥ 1 GB" là giả thuyết | Đúng | CT | 01 §1; 08 §4 |
| Token: 2.048 là mỗi lần gọi; 14.000 ký tự chỉ phần trích; trần chi phí chưa có | Đúng | CT | 13 §2 |
| S10 nhãn "không phát hiện lỗi" quá mạnh; cần kiểm cả cơ sở quy mô | Đồng ý | CT | 01 S10; 12 §2.2 |
| S18 ingest — Codex **đồng ý** hạ mức; bổ sung trường hợp kẹt `dang_xu_ly` | Đồng ý | CT | 01 S18; 12 §2 |
| 07: "chênh lệch C chỉ do định nghĩa" chưa chứng minh; câu "B chỉ mất vị trí số 1 nếu…" vượt phạm vi | Đồng ý | CT | 07 §3, §4 |
| 09: thí nghiệm agent dùng tên A/B/C trùng 07; K3 đổi cả model lẫn ngữ cảnh | Đồng ý | CT | 09 §4 (K1–K3, cùng model) |
| **ĐK4** — tham chiếu sai dòng/đường dẫn; thiếu Q-list ở 14 | Đúng: `search.ts:72`, `workflow_runtime.py:13-15`, `hoi-dap/route.ts:103`; quy ước gốc đường dẫn | CT | 01 §0 (quy ước), các tệp; 14 §5 |
| 11: "tạm dừng ở mức hiện tại" mơ hồ | Đúng | CT | 11 §3 |

**Kết quả:** Claude chấp thuận toàn bộ ý kiến vòng 4 sau khi tự kiểm lại mã. Bảng bất đồng còn lại (sau vòng 4) ở **14 §4** — chỉ còn các mục
mà hai bên **đồng ý rằng phải phân xử bằng thử nghiệm**, không thể bằng lập luận.
