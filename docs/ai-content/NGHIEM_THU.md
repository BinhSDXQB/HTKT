# Báo cáo nghiệm thu — module Nội dung AI, mốc M1 (12/11/2026)

Nhánh `ai-content-m1`. Nhãn: **DONE** đã làm và có bằng chứng chạy · **PARTIAL** · **BLOCKED** · **NOT STARTED** · **UNVERIFIED**.

## Bằng chứng chạy
Số liệu mới nhất: xem mục "Kiểm tra lần cuối" ở cuối tài liệu (152/152, 51/51, 7/7). Bảng dưới là số liệu lúc lập báo cáo (sau Codex vòng 2).

| Lệnh | Kết quả |
|---|---|
| `npm test` (toàn bộ) | 150/150 đạt (trong đó 18 test của module) — chạy lại sau khi sửa theo Codex vòng 2 |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-tich-hop.mjs` | 40/40 ca đạt trên `ql_htkt_ai_test` (trình điều khiển pg) |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-prisma.mjs` | 7/7 ca đạt qua Prisma + adapter pg (đường production dùng) |
| Đột biến thử trên 4 điểm sửa theo Codex vòng 2 | 4/4 bị test bắt |
| 23 kiểm tra API qua máy chủ dev thử (Next + Prisma thật, cổng 3098) | 23/23 đạt ngày 12/11, SAU các sửa đổi theo Codex vòng 2 (gồm: thiếu băm → 400, băm cũ → 409, 401, 403, Origin lạ → 403) |
| Kiểm giao diện trên trình duyệt (12/11, tài khoản mẫu trong CSDL thử) | xem mục "Kiểm giao diện" bên dưới |
| ESLint các tệp của module | 0 lỗi |
| Kiểm kiểu cục bộ bằng TypeScript API (không chạy `tsc` toàn dự án) | 0 lỗi trên tệp của module |
| `node scripts/ai-content/tao-csdl-thu.mjs` | 142/142 bảng khớp, 0 dòng dữ liệu thật |
| `tsc --noEmit` / `npm run build` toàn dự án | **NOT_RUN** (quy tắc RAM 6GB) — CI sẽ build khi merge |

## Tiêu chí nghiệm thu
| Mã | Tiêu chí | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| AT-01 | Chức năng hiện có như baseline | PARTIAL | `npm test` 150/150; không sửa bảng cũ; cờ tắt thì không đường mã mới nào chạy. CHƯA chạy lại smoke toàn bộ 190 route |
| AT-02 | Tạo bài gốc từ nội dung người dùng | DONE | test tích hợp + API |
| AT-03 | Ba phiên bản Facebook/LinkedIn/Threads | DONE (theo quy tắc) | chuyển thể không gọi AI; viết lại bằng AI: NOT STARTED |
| AT-04 | Tạo ảnh, lưu metadata | NOT STARTED | chưa chọn nhà cung cấp ảnh, chưa có nơi lưu media |
| AT-05 | Bản nháp và xem trước | DONE | đã chạy trên trình duyệt: soạn bài, bản theo kênh, xem trước, lịch |
| AT-06 | Không đăng khi chưa duyệt | DONE | test thuần + tích hợp + API (409) |
| AT-07 | Lịch 08:30 giờ Việt Nam | DONE | lưu `01:30:00Z`, đọc lại qua Prisma đúng |
| AT-08 | Đăng thử lên tài khoản thử | BLOCKED | chưa có tài khoản/Page thử, chưa có adapter thật. "Chạy thử" KHÔNG phải đăng thật |
| AT-09 | Không đăng trùng khi chạy lại | DONE | 6 worker đồng thời chỉ 1 nhận; chỉ mục duy nhất phiên bản + kênh |
| AT-10 | Timeout → kiểm trạng thái trước khi thử lại | DONE | `UNKNOWN_OUTCOME`, không tự đăng lại, đối soát thủ công |
| AT-11 | Kết quả từng kênh độc lập | DONE | 3 kênh, 1 lỗi 2 đạt → "đăng một phần" |
| AT-12 | Thu hồi phê duyệt ngăn xuất bản | DONE (tự động) / giới hạn (đăng tay) | lịch chưa đăng bị huỷ; đăng tay ngoài hệ thống không ngăn được |
| AT-13 | Không truy xuất tài liệu vượt quyền | PARTIAL | M1 không truy xuất nội dung tài liệu, chỉ tiêu đề/phạm vi/hiệu lực cho người có quyền soạn. Truy xuất RAG cho bài công khai: NOT STARTED |
| AT-14 | Không đưa dữ liệu nội bộ vào bài công khai | DONE (trong phạm vi kiểm được) | chặn theo phân loại và phạm vi nguồn; KHÔNG phát hiện được nội dung nội bộ gõ tay vào bài gắn nhãn Công khai — phụ thuộc người duyệt |
| AT-15 | Tắt toàn bộ module bằng cờ | DONE | route 404, trang 404, menu ẩn, worker không nhận việc |
| AT-16 | Hoàn tác không mất dữ liệu nghiệp vụ | DONE trên CSDL thử | áp → hoàn nguyên → số bảng như cũ. Trên CSDL thật: NOT_RUN |
| AT-17 | Báo cáo rõ phần xong/chưa xong | DONE | tài liệu này |
| AT-18 | Không lỗi nghiêm trọng trong security review | PARTIAL | Hai vòng Codex: mọi BLOCKER/HIGH đã sửa và có test, trừ các mục ghi "giới hạn" bên dưới. Các sửa đổi vòng 2 CHƯA được Codex rà lại |

## Kiểm giao diện trên trình duyệt (12/11/2026)
Máy chủ dev thử cổng 3098, CSDL thử, hai tài khoản quản trị mẫu (người soạn, người duyệt). Không có lỗi trên console ngoài mã 409 chủ ý.

| Bước | Kết quả |
|---|---|
| Trang tổng quan: 8 ô số liệu, lọc, tìm, danh sách, nhật ký | Đạt |
| Soạn bài mới: nhập tiêu đề, nội dung, phân loại; ô tìm nguồn hiện 3 tài liệu mẫu kèm nhãn "dùng được / không dùng được cho bài công khai"; nguồn nội bộ tô đỏ | Đạt |
| Tạo bài → chuyển sang trang bài, hiện "Bản nháp · Phiên bản 1", khung lịch nêu rõ điều kiện còn thiếu | Đạt |
| "Tạo từ bài gốc" cho Facebook và Threads; tab kênh đánh dấu ✓ | Đạt |
| Gõ thêm vào bản Facebook chưa lưu: nút Gửi duyệt, Lưu bài, Tạo từ bài gốc bị khoá; hiện "Lưu bản Facebook trước khi gửi duyệt"; tab có dấu •; có nút Bỏ thay đổi | Đạt |
| Gửi duyệt; người soạn thấy "Người duyệt phải khác người soạn" và không có nút Duyệt | Đạt |
| Người duyệt mở trang, bài bị sửa ở nơi khác, bấm Duyệt → bị từ chối: "Bài đã thay đổi kể từ lúc bạn mở…" | Đạt |
| Người duyệt tải lại, bấm Duyệt → "Đã duyệt bởi … lúc 07:06 12/11/2026" (đúng giờ Việt Nam) | Đạt |
| Đặt lịch Facebook: mặc định ngày mai 08:30 → hiện "Đã đặt lịch 08:30 13/11/2026 · đăng tay" kèm ô khai đường dẫn | Đạt |
| Lịch xuất bản: lưới tháng (hôm nay được đánh dấu), kiểu danh sách | Đạt |
| Bề rộng điện thoại 375px: trang bài và trang tổng quan không tràn ngang | Đạt |
| Thu hồi phê duyệt (bài đã duyệt có 1 lịch Facebook chưa đăng) | Đạt (12/11, lượt 2): bài về "Bản nháp", lịch thành "Đã huỷ" kèm lý do, toast nhắc kiểm kênh đăng tay. Lưu ý: hộp `window.confirm` không hiện trong khung trình duyệt nhúng, phải ép `confirm` trả true để thử — trên trình duyệt thường là hộp hỏi bình thường |
| Huỷ lịch riêng lẻ (bài đã duyệt, lịch chờ đăng) | Đạt (12/11, lượt 2): lịch thành "Đã huỷ · Người dùng huỷ", không hỏi xác nhận |
| Đối soát lịch ở trạng thái "Chưa rõ kết quả" bằng nút "Đã đăng" + đường dẫn | Đạt: lịch thành PUBLISHED, toast "Đã ghi nhận bài đăng". (Hành vi của bản trước: đường dẫn khác miền Facebook được nhận. Từ vòng 3 mã TỪ CHỐI đường dẫn ngoài miền của kênh) |
| Xác nhận "Đã đăng" trên lịch chờ đăng tay; nút "Không có bài" | CHƯA bấm trên trình duyệt (đã kiểm ở tầng API và test tích hợp) |
| Chế độ tối | Không áp dụng: hệ thống không có chế độ tối (không có lớp `dark`, không có nút chuyển) |
| Vai trò "lãnh đạo" và "cán bộ Văn phòng" thật | CHƯA kiểm |

Ghi chú: một bài thử trong CSDL thử hiện chữ lỗi dấu — do tôi gửi dữ liệu thử bằng `curl` từ cửa sổ lệnh Windows (bảng mã cp1252), không phải lỗi ứng dụng: bài tạo từ trình duyệt và từ script Node đều lưu đúng tiếng Việt.

## Giới hạn còn tồn tại
1. Chưa đăng tự động lên mạng xã hội nào; chưa sinh ảnh; chưa soạn bằng AI; chưa có phân tích số liệu, chi phí.
2. Javis OS, n8n, Second Brain mở rộng (ingestion mới, quét mã độc): NOT STARTED. Hàng đợi dùng PostgreSQL thay n8n.
3. Đăng tay: hệ thống chỉ kiểm soát gói bàn giao và ghi nhận; đường dẫn do người dùng khai báo.
4. Giới hạn ký tự các kênh chưa đối chiếu tài liệu chính thức (hiện cảnh báo trên giao diện).
5. Vai trò "lãnh đạo" và "cán bộ Văn phòng" chưa được thử trên giao diện bằng tài khoản thật (CSDL thử chỉ có quản trị mẫu); đã thử ở tầng nghiệp vụ.
6. Chưa có chính sách lưu giữ dữ liệu; chưa diễn tập khôi phục DỮ LIỆU (mới cấu trúc).
7. Lệnh PM2 cho worker trong `TRIEN_KHAI.md` chưa chạy thử (NOT_RUN).

## Phản biện Codex — vòng 1 (kế hoạch, 24 phát hiện) và vòng 2 (diff mã, 17 phát hiện)
Codex chỉ đề xuất; mỗi mục dưới đây đã được đối chiếu với mã trước khi sửa. Vòng 2 Codex xác nhận: không thấy SQL injection qua `$queryRawUnsafe`/`iso()`, không thấy XSS, không thấy `server-only` lọt vào client, thứ tự khoá không tạo deadlock.

| Vòng.Mục | Mức | Phát hiện | Kiểm chứng | Xử lý |
|---|---|---|---|---|
| 1.1 | BLOCKER | Băm phê duyệt không bao nội dung thực đăng | Đúng | Băm bao biến thể, phân loại, cờ AI, nguồn; có test |
| 1.2, 1.3 | BLOCKER | Phiên bản mới / thu hồi không vô hiệu lịch cũ; chạy đua thu hồi–worker | Đúng | Mọi thao tác khoá hàng bài; sửa/thu hồi huỷ lịch; test chạy đua 8 lượt |
| 1.4 | BLOCKER | Đăng tay không bảo đảm thu hồi tuyệt đối | Đúng, không sửa được bằng mã | Ghi là giới hạn; giao diện nhắc báo cán bộ phụ trách kênh |
| 1.5–1.7 | HIGH | Nhận việc, worker chết, idempotency | Đúng | Một giao dịch `SKIP LOCKED`; mã lần nhận việc; treo → cần đối soát; chỉ mục duy nhất |
| 1.8 | HIGH | Ma trận quyền quá rộng (`office:menu_access`) | Đúng | Chỉ cán bộ THUỘC Văn phòng Sở, lãnh đạo, quản trị |
| 1.9 | HIGH | FK rời rạc lịch–phê duyệt | Đúng | Khoá ghép; có test |
| 1.10 | HIGH | PUBLIC chưa có nguồn thẩm quyền | Đúng | Phân loại nằm trong gói duyệt: lãnh đạo duyệt = xác nhận công khai, có người, giờ, băm |
| 1.11, 1.12 | HIGH | Dữ liệu ra AI ngoài trước cổng; RAG không lọc hiệu lực | Đúng với hệ thống hiện hữu | M1 không gọi AI, không truy xuất nội dung RAG. **Phải làm trước khi thêm soạn bài bằng AI** (NOT STARTED) |
| 1.13, 1.20 | HIGH | Mất dấu nguồn; FK làm hỏng API xoá tài liệu | Đúng | Không FK, ảnh chụp tiêu đề, nguồn mất → cổng chặn; có test |
| 1.14, 1.15 | HIGH/MEDIUM | Nhắc tới "AI" bị coi là thông báo; cờ nhận `true` | Đúng | Câu thông báo chuẩn ở phần đầu; cờ chỉ nhận `1` |
| 1.16 | HIGH | Cờ chưa phải công tắc dừng | Đúng | Kiểm ở route, trang, menu (tính ở máy chủ), worker |
| 1.17–1.19 | BLOCKER/HIGH | Script migration chạy nhầm CSDL thật; khoá bảng; rollback mất nhật ký | Đúng | Script thử từ chối CSDL không có đuôi `_ai_test`; `lock_timeout`; quy trình hoàn tác 4 mức |
| 1.21–1.24 | HIGH/MEDIUM | Audit bắt buộc; tài nguyên; EXPIRED; test cấp route | Đúng | Audit cùng giao dịch; pool 2; quá hạn 24 giờ; test tích hợp + Prisma |
| 2.1 | HIGH | Duyệt được bản người duyệt chưa xem | Đúng | Bắt buộc gửi băm đang xem, lệch → 409; test + đột biến |
| 2.2 | HIGH | Người đổi phân loại/nguồn tự duyệt thay đổi của mình | Đúng (tái hiện) | `meta_editors` tính vào bốn mắt; test + đột biến |
| 2.3 | HIGH | Lưu lại nguyên văn biến thể xoá dấu người viết | Đúng (tái hiện) | Lưu không đổi = không làm gì; `editors` cộng dồn; test + đột biến |
| 2.4 | HIGH | Sửa biến thể tại chỗ làm mất bản đã duyệt/đăng | Đúng | `approved_payload` + `body_snapshot`; có test |
| 2.5 | MEDIUM | Biến thể tự động lấy thân bài cũ gắn phiên bản mới | Đúng | Đọc–ghi trong một giao dịch khoá bài; test chạy đua |
| 2.6 | HIGH | Trạng thái nguồn không được khoá | Đúng | Khoá chia sẻ nguồn trong cổng; có test. Sau khi giao dịch kết thúc nguồn vẫn có thể đổi — bản chất, không sửa |
| 2.7 | MEDIUM | Giao diện giấu lịch đang đăng khi thu hồi | Đúng | Cảnh báo riêng, không báo "thành công" trơn. CHƯA bấm thử trên trình duyệt (nút mở hộp xác nhận của trình duyệt) |
| 2.8 | MEDIUM | Worker không đọc lại cờ | Đúng | Đọc lại `.env` trước mỗi việc. Chưa có test tự động |
| 2.9–2.11 | MEDIUM | RETRY_PENDING quá hạn treo; một việc chặn dừng cả vòng; chạy thử chặn đăng thật | Đúng | Đã sửa; mỗi mục một test |
| 2.12, 2.13 | MEDIUM | Biến thể chưa lưu không khoá thao tác; lưu một phần mất phần khác | Đúng | Khoá nút khi còn nháp, lưu từng phần. Đã xác nhận trên trình duyệt |
| 2.14 | MEDIUM | Danh sách trộn lịch phiên bản cũ | Đúng | Chỉ tính phiên bản hiện hành; có test |
| 2.15 | MEDIUM | Phản hồi cũ ghi đè tháng đang xem | Đúng | Chỉ nhận phản hồi mới nhất. Trang lịch đã mở được; chưa tái hiện riêng tình huống chuyển tháng nhanh |
| 2.16 | LOW | `Origin: null` gây 500 | Đúng | Đã sửa trước khi có kết quả Codex (kèm lỗi nặng hơn tự tìm: so Origin với Host sẽ chặn mọi thao tác ghi sau IIS) |
| 2.17 | MEDIUM | Test chạy đua đạt cả khi thu hồi lỗi | Đúng | Bắt buộc thu hồi và nhận việc đều thành công |

## Việc cần người quản trị quyết định / duyệt
1. Merge `main` (= deploy), áp migration 050, bật cờ — từng bước riêng.
2. Kênh đăng thật, nhà cung cấp ảnh/AI, nơi lưu media, vai trò duyệt, xác nhận của Pháp chế về thông báo AI.
3. Xác nhận quy tắc đăng lại bài đã đăng (cờ `dangLai` + lý do) — hiện là đề xuất.
4. Có cho Codex rà các sửa đổi vòng 5 hay không (đã vượt giới hạn 2 vòng của cấp L).

## Phản biện Codex vòng 3 (12/11/2026) — rà lại các sửa đổi vòng 2 + chặn URL theo miền kênh
Codex chỉ đọc, 16 phát hiện; tôi tự kiểm chứng từng mục bằng đọc mã, chạy test, kiểm đột biến. Test sau sửa: đơn vị 19/19, tích hợp 42/42 (thêm 2 ca; ca "lịch phiên bản cũ" đã kiểm đột biến: bỏ dòng sửa thì ca lỗi), Prisma 7/7, ESLint sạch 4 tệp.

| # | Mức Codex | Kết luận | Xử lý |
|---|---|---|---|
| 1 | HIGH | Đúng (đọc mã): cổng không so `version_id` của lịch với phiên bản hiện hành → retry của lịch V1 lấy nội dung V2 | Đã sửa ở `nhanMot` và `xacNhanDangTay`; test tích hợp mới |
| 2 | HIGH | Đúng: lưu bài/biến thể không so bản nền → ghi đè từ màn hình cũ | Đã sửa: `bamNen` (PUT) và `phienBanNen` (biến thể), 409 nếu lệch; API+UI+test. API bắt buộc gửi |
| 3 | HIGH | Một phần: `doiSoat` đúng là không qua cổng, nhưng đối soát GHI NHẬN sự thật đã xảy ra (bài đã lên); chặn sẽ để lịch kẹt `UNKNOWN_OUTCOME` và chặn đặt lịch mới | Không sửa; là quyết định thiết kế. Hạ xuống LOW. Có thể bổ sung ghi trạng thái cổng vào nhật ký (chưa làm) |
| 4 | MEDIUM | Đúng một phần: gói duyệt chỉ chứa ID nguồn; nhưng cổng kiểm lại phạm vi/hiệu lực HIỆN TẠI khi đăng nên không phải lỗ an toàn | Hoãn (cải thiện truy vết) |
| 5 | MEDIUM | CHƯA RÕ (suy luận, chưa chạy PostgreSQL): thứ tự khoá tài liệu giữa cổng và `sync-vbpl` | Hoãn; cần thử đồng thời trên PostgreSQL |
| 6 | MEDIUM | Đúng nhưng là thiết kế có chủ ý vòng 2: sửa cả bài gốc và biến thể thì phải lưu/bỏ một phần trước; có giải thích và nút "Bỏ thay đổi", không mất dữ liệu ngầm | Giữ nguyên (LOW, UX) |
| 7 | MEDIUM | Đúng: thao tác phụ (huỷ lịch, thu hồi, xác nhận, đối soát) thành công rồi tải lại làm mất chữ đang gõ | Đã sửa: các thao tác này chỉ làm mới dữ liệu máy chủ, giữ nháp. Chưa kiểm trên trình duyệt |
| 8 | MEDIUM | Đúng (suy luận): `beforeunload` không bắt điều hướng nội bộ | Hoãn (UX) |
| 9 | MEDIUM | Đúng nhưng theo hướng an toàn (fail-closed): biến thể sửa sau khi đã đăng không đặt lịch lại được trừ khi sửa nội dung bài để tạo phiên bản mới | Hoãn; cần quyết định nghiệp vụ |
| 10 | MEDIUM | Không áp dụng: migration 050 chưa áp vào CSDL thật; chỉ có CSDL thử (test xoá schema trước) | Không sửa |
| 11 | MEDIUM | Đúng một phần: web đọc `process.env`, worker đọc lại `.env`; lệch khi hai nguồn khác nhau | Hoãn; thêm lưu ý khi triển khai |
| 12 | MEDIUM | Đúng: bài một khối, nhãn AI đặt ở cuối vẫn qua cổng dù thông báo ghi "ở phần đầu". Cách đọc nghĩa vụ vị trí nhãn là câu hỏi MỞ với Pháp chế | Chưa sửa; chờ Pháp chế |
| 13 | MEDIUM | Đúng: URL có `?token=…` bị ghi nguyên vào nhật ký bất biến | Đã sửa: từ chối tham số giống thông tin xác thực; test |
| 14 | MEDIUM | Đúng: thống kê tính cả lịch `dry_run` | Đã sửa: `adapter <> 'dry_run'` cho 4 chỉ số |
| 15 | LOW | Đúng: URL chưa chuẩn hoá; nút giao diện phân biệt hoa/thường | Đã sửa: trả `URL.href`; nút kiểm không phân biệt hoa/thường |
| 16 | LOW | Đúng (suy luận): phản hồi cũ của ô tìm nguồn ghi đè | Hoãn |

Kiểm HTTP trên máy chủ dev thử (#2): PUT thiếu `bamNen` → 400, nền lệch → 409, đúng nền → 200; biến thể thiếu `phienBanNen` → 400, lệch → 409. Chưa chạy lại: kiểm giao diện bằng tay cho #7 và nút lưu dùng nền mới; Codex chưa rà lại các sửa đổi vòng 3 này.

## Phản biện Codex vòng 4 (12/11/2026) — rà lại các sửa vòng 3
Codex chỉ đọc, 9 phát hiện + nhận xét; tôi tự kiểm chứng bằng đọc mã, test, đột biến và thử giao diện. Kết quả: đơn vị 19/19, tích hợp 46/46 (thêm 4 ca; 2 kiểm tra mới đã đột biến: bỏ thì ca lỗi), Prisma 7/7, ESLint sạch.

| # | Mức | Kết luận | Xử lý |
|---|---|---|---|
| 1 | HIGH | Đúng, lỗi MỚI do `tai(true)` của tôi: giữ ô cũ nhưng thay mã nền → ghi đè không 409 | Đã sửa: state `nen` (ảnh chụp lúc nạp ô) dùng cho mọi thao tác ghi; thêm biểu ngữ khi bản máy chủ đã đổi |
| 2 | HIGH | Đúng, lỗi MỚI: Duyệt gửi băm mới dù ô/biến thể chưa nạp | Đã sửa: Duyệt/Từ chối gửi `nen.bam`; máy chủ 409 nếu khác |
| 3 | HIGH | Đúng: `phienBanNen` không chặn ghi đè biến thể cùng phiên bản | Đã sửa: thêm `bienTheNen` (nội dung bản kênh lúc mở); test |
| 4 | HIGH | Đúng: tạo biến thể tự động không kiểm nền | Đã sửa: `bamNen` bắt buộc ở route; test |
| 5 | MEDIUM | Đúng: lịch đang đăng + biến thể bị sửa cùng phiên bản → retry gửi văn bản mới | Đã sửa: so `body_snapshot` của lịch với biến thể hiện hành (nhận việc và xác nhận đăng tay); test |
| 6 | MEDIUM | Đúng: gửi duyệt/đặt lịch từ màn hình cũ tác động phiên bản khác | Đã sửa: cả hai kiểm `bamNen` dưới khoá bài; test gửi duyệt |
| 7 | MEDIUM | Đúng: regex chặn nhầm `postcode`, `design` | Đã sửa: khớp tên tham số đầy đủ; thông báo chỉ bảo xoá tham số bị cấm |
| 8 | MEDIUM | Đúng: bỏ sót `#access_token=` | Đã sửa: kiểm cả fragment; test |
| 9 | MEDIUM | Đúng: test thống kê không kiểm `dry_run` | Đã sửa: ca mới đếm trước/sau |
| F | — | Codex đồng ý hạ #3 (đối soát) và #10 (migration 050); phản bác đúng về #6: cả hai nút lưu bị khoá thì không có "lưu một phần" | Đã sửa lại thông báo giao diện cho đúng; giữ thiết kế |

Thử giao diện (12/11): sửa tiêu đề trên màn hình, "người khác" sửa qua API, bấm Lưu → toast 409 "Bài đã thay đổi kể từ lúc bạn mở…", chữ đang gõ còn nguyên, bản người kia không bị ghi đè.
Còn mở: #5 deadlock thứ tự khoá với `sync-vbpl` (cần thử PostgreSQL đồng thời), #8 điều hướng nội bộ không bảo vệ nháp, #9 biến thể đã đăng không đặt lịch lại, nhãn AI cuối bài (chờ Pháp chế). Quy trình giới hạn L tối đa 2 vòng: đã vượt (4 vòng) theo yêu cầu người dùng; Codex chưa rà các sửa vòng 4.

## Bốn mục còn mở sau vòng 4 — xử lý ngày 12/11/2026

Kết quả chạy lại: test đơn vị 19/19 · tích hợp 51/51 (thêm 5 ca) · Prisma 7/7 · ESLint sạch. Chưa chạy `tsc`/build (quy tắc RAM). Codex CHƯA rà phần này.

| Mục | Kết luận | Bằng chứng |
|---|---|---|
| Thứ tự khoá với `sync-vbpl` (PostgreSQL) | VERIFIED có deadlock thật nếu bài viện dẫn được bản tài liệu chưa công bố: `thayBanCu` khoá bản mới rồi bản cũ, cổng khoá chia sẻ theo thứ tự id → PostgreSQL huỷ giao dịch xác nhận (40P01). Đã sửa: `ganNguon` chỉ nhận tài liệu `trangThai = 'san_sang'`, nên `sync` chỉ còn tranh một khoá với module | Đối chứng một lần (ngoài repo, bỏ điều kiện lọc bằng cách cho cả hai bản `san_sang`): deadlock 4/4. Ca tích hợp mới chạy đúng chuỗi lệnh `thayBanCu` đua với xác nhận đăng tay + worker, 10 vòng, hai thứ tự id: 0 deadlock, `sync` luôn xong, lịch nhất quán (2 xác nhận trước khi thay, 8 bị cổng chặn sau khi thay) |
| Điều hướng nội bộ làm mất nháp | Đã sửa: bắt lần bấm liên kết ở pha capture của `document` khi có nháp chưa lưu, hỏi xác nhận; không chặn mở tab mới, liên kết ngoài, cùng trang | Trình duyệt: gõ thêm vào tiêu đề, bấm "Danh sách" và mục menu "Tổng quan" với lựa chọn Huỷ → ở lại, chữ còn nguyên; chọn OK → rời trang. CÒN MỞ: nút Quay lại/Tiến của trình duyệt (popstate) chưa chặn |
| Đăng lại biến thể đã đăng | Quyết định ĐỀ XUẤT (cần lãnh đạo Văn phòng xác nhận): cho đăng lại, nhưng đăng thật phải bật cờ `dangLai` + lý do 10–500 ký tự, ghi nhật ký (`dangLai`, `lanDangThu`, `lichTruoc`, `lyDo`); vẫn qua cổng; lịch đang chờ vẫn chặn trùng; chạy thử lại không cần lý do. Chỉ mục `ux_ai_pub_song` bỏ `PUBLISHED` (migration 050 chưa áp CSDL thật nên sửa tại chỗ) | 3 ca tích hợp mới. Trình duyệt: nút "Đăng lại Facebook" khoá đến khi lý do đủ 10 ký tự, đặt xong hiện "Đã đặt lịch", nút trở về "Đặt lịch" (khoá) |
| Thông báo AI: câu chữ và vị trí | Đối chiếu nguyên văn (kho `Tailieu_VBPL`, 12/11). Câu mặc định đổi sang đúng cụm từ của Luật: "Nội dung này được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo." Vị trí mặc định `dau`: trước thông báo chỉ được có tiêu đề (tối đa một đoạn, ≤ 300 ký tự). Cả hai đổi được bằng `.env` (`AI_CONTENT_NHAN_AI`, `AI_CONTENT_VI_TRI_NHAN=bat_ky`) không cần sửa mã. Giao diện và cổng dùng chung một hàm `loiNhanAi` (`lib/ai-content/nhan-ai.ts`) | Test đơn vị: cuối bài → chặn kèm "Điều 18 khoản 3 điểm b"; thiếu → "Điều 11 khoản 3"; câu ngắt dòng vẫn nhận; chế độ `bat_ky`. Dòng cảnh báo trên giao diện CHƯA kiểm bằng trình duyệt |

Căn cứ thông báo AI (VERIFIED nguyên văn):
- Luật Trí tuệ nhân tạo số 134/2025/QH15, Điều 11 khoản 3: "Bên triển khai có trách nhiệm thông báo rõ ràng khi cung cấp ra công cộng văn bản, âm thanh, hình ảnh, video được tạo ra hoặc chỉnh sửa bằng hệ thống trí tuệ nhân tạo nếu nội dung đó có khả năng gây nhầm lẫn về tính xác thực của sự kiện, nhân vật, trừ trường hợp pháp luật có quy định khác."
- Nghị định 142/2026/NĐ-CP, Điều 18 khoản 3 điểm b: "Được thực hiện trước hoặc tại thời điểm người tiếp nhận tiếp cận nội dung"; điểm c: "Không được thiết kế theo cách che giấu hoặc làm giảm khả năng nhận biết bản chất của nội dung".
- Điều 18 khoản 5 điểm b: được "hiển thị tại tiêu đề, phần mô tả hoặc chú thích kèm theo nội dung". Khoản 6 chỉ nêu "phần kết thúc" cho tác phẩm điện ảnh, chương trình nghệ thuật, nội dung sáng tạo. Khoản 7: Bộ Khoa học và Công nghệ công bố hướng dẫn kỹ thuật tham chiếu.
- INFERRED (cần Pháp chế xác nhận bằng văn bản): bài thông tin của Sở không thuộc khoản 6 nên thông báo cuối bài không chắc đạt khoản 3 điểm b; "chú thích kèm theo nội dung" (khoản 5 điểm b) có bao gồm chú thích cuối bài hay không là câu hỏi mở. Mặc định chọn cách đọc chặt.

Phát hiện ngoài phạm vi (CHƯA sửa, cần người dùng quyết): `prisma/sync-vbpl.mjs` ghi `trangThai = 'cho_thay'` (dòng 380 → 200) nhưng migration 034 đặt CHECK `tai_lieu_trangthai_check` chỉ cho `dang_xu_ly`, `san_sang`, `loi`; CSDL thử từ chối giá trị này (VERIFIED). Trên CSDL thật: UNKNOWN (lệnh đọc bị chặn). Nếu ràng buộc còn nguyên thì nhánh "thay bản cũ" của đồng bộ kho văn bản luôn lỗi.

## Codex vòng 5 (12/11/2026) — rà bốn mục trên

12 phát hiện, Claude tự kiểm bằng đọc mã và test. Chạy lại sau sửa: đơn vị 20/20 · tích hợp 51/51 · Prisma 7/7 · worker `--thu --once` chạy được · ESLint sạch. Các sửa vòng 5 CHƯA được Codex rà lại; phần giao diện đã kiểm bằng trình duyệt (bảng cuối mục này).

| # | Mức | Kiểm chứng | Xử lý |
|---|---|---|---|
| 1 | HIGH | Đúng: 5.000 dấu "(" trước câu vẫn qua; câu nằm trong `<!-- -->` vẫn qua | Đã sửa: chỉ bỏ tối đa 2 ký tự bao câu; mã lỗi mới `bi_che` (chú thích HTML chưa đóng, ký tự ẩn/đổi hướng chữ đứng trước), áp cả chế độ `bat_ky`; 5 ca test |
| 2 | MEDIUM | Đúng: tiêu đề 299–300 ký tự trên Website bị chặn vì "# " | Đã sửa: không tính dấu "#" của tiêu đề Markdown; test biên 298/299/300 cho Website và Facebook |
| 3 | MEDIUM | Đúng: câu dạng NFD hoặc có dấu cách không ngắt bị báo thiếu | Đã sửa: chuẩn NFC + quy dấu cách khi NHẬN DIỆN (không đụng hàm băm phê duyệt); zero-width chèn giữa câu vẫn không nhận |
| 4 | MEDIUM | Đúng: worker không nạp `.env` vào `process.env` nên dùng câu mặc định trong khi web dùng câu cấu hình | Đã sửa: worker nạp 2 khoá trước khi import nghiệp vụ; ghi rõ phải khởi động lại web + worker khi đổi |
| 5 | MEDIUM | Đúng: câu cấu hình chỉ gồm ký tự zero-width được nhận | Đã sửa: `nhanAiTuCauHinh` (20–200 ký tự, có chữ, không ký tự ẩn, không dấu ngăn chuỗi); sai → về mặc định + log lỗi |
| 6 | MEDIUM | Đúng: một kênh đã đăng + lịch đăng lại đang chờ hiện "Đăng một phần" | Đã sửa: `gopTheoKenh` — mỗi kênh một trạng thái đại diện; test đơn vị + tích hợp |
| 7 | MEDIUM | Đúng theo mã (danh sách lịch cắt 50 dòng); chưa dựng dữ liệu tái hiện | Đã sửa: máy chủ trả `kenhDaDang`, giao diện không suy từ danh sách bị cắt |
| 8 | MEDIUM | Đúng một phần: ca đồng thời không bắt việc gỡ bộ lọc `san_sang` (ca "nguồn chưa nạp xong" bắt); khẳng định worker lỏng, có nuốt lỗi | Đã sửa: kiểm đúng lịch worker nhận và trạng thái cuối, bỏ nuốt lỗi; ghi giới hạn của ca vào chú thích. Chưa làm: ép thứ tự giữ/chờ khoá bằng điểm đồng bộ |
| 9 | MEDIUM | Đúng: câu báo lỗi viết như thể NĐ 142 bắt "ngay sau tiêu đề"; chú thích về khoản 6 diễn đạt quá mức. Số điều, khoản, điểm không sai | Đã sửa: thông báo mở đầu "Theo quy định xuất bản của hệ thống… để bảo đảm Điều 18 khoản 3 điểm b"; chú thích mã tách căn cứ pháp lý với quy định hệ thống, trích đủ khoản 6 |
| 10 | LOW | Đúng: đặt lịch thất bại vẫn xoá lý do | Đã sửa: `lam` trả thành công/thất bại |
| 11 | LOW | Hợp lý theo mã, chưa bấm kiểm | Đã sửa: đã đồng ý ở hộp hỏi liên kết thì `beforeunload` không hỏi lần hai (hết hiệu lực sau 3 giây) |
| 12 | LOW | Đúng: API.md thiếu `bamNen`; dòng nghiệm thu URL đã cũ | Đã sửa tài liệu |

Codex cũng xác nhận (đã đọc mã): không thấy đường nào khác khoá ≥ 2 hàng `tai_lieu` ngược thứ tự với cổng; hai yêu cầu đặt lịch được tuần tự hoá bằng khoá bài; đối soát khi đã có lần đăng trước không còn vướng chỉ mục. Còn mở: `router.push`, nút không phải liên kết và `popstate` chưa được bảo vệ nháp; bài gắn nguồn chưa `san_sang` từ trước (không có trên thực tế vì module chưa triển khai).

Kiểm giao diện sau vòng 5 (12/11/2026, máy chủ thử cổng 3098, CSDL thử, tài khoản `thu-admin1`):

| Điểm kiểm | Kết quả |
|---|---|
| #7 Nút "Đăng lại" lấy từ `kenhDaDang` của máy chủ | Đạt: bài đã đăng Facebook, không còn lịch chờ → hiện ô lý do và nút "Đăng lại Facebook" |
| #10 Đặt lịch lỗi không xoá lý do | Đạt: giả lập mất mạng khi bấm → lý do còn nguyên; bấm lại thành công → "Đã đặt lịch", ô lý do ẩn, nút về "Đặt lịch Facebook" (khoá) |
| #6 Danh sách bài | Đạt: bài một kênh đã đăng + lịch đăng lại đang chờ hiện "Đã đăng đủ kênh"; không dòng nào "Đăng một phần" sai |
| Cảnh báo thông báo AI (#1, #3, #9) | Đạt: bản tự sinh không cảnh báo; thông báo cuối bài → câu "Theo quy định xuất bản của hệ thống… Điều 18 khoản 3 điểm b"; câu gần giống → "Thiếu thông báo AI (Luật 134/2025/QH15 Điều 11 khoản 3…)"; câu trong `<!-- -->` → "đang bị che… Điều 18 khoản 3 điểm c"; câu dạng NFD → không cảnh báo |
| #11 Không hỏi rời trang hai lần | Đạt (đo bằng sự kiện `beforeunload` giả lập, hộp thoại thật của trình duyệt không hiện trong khung xem): có nháp → chặn; ngay sau khi đồng ý ở hộp hỏi liên kết → không chặn; sau 3 giây hoặc khi chọn Huỷ → chặn lại |

Console chỉ có lỗi kết nối WebSocket `webpack-hmr` của máy chủ dev (không thuộc ứng dụng), không có lỗi của trang. Bài thử "Bài thử thông báo AI (kiểm giao diện)" và một lịch đăng lại còn nằm trong CSDL thử.

### Thử chặn nút Quay lại của trình duyệt (12/11/2026) — KHÔNG đạt, đã gỡ

Đã thử bắt `popstate` ở pha capture, hỏi xác nhận rồi đi ngược lại bằng `history.go`. Kết quả trên trình duyệt:
- Lần 1 (gõ thật vào ô tiêu đề): Quay lại lần đầu + Huỷ → ở lại, chữ còn nguyên; Quay lại lần hai → KHÔNG hỏi, rời trang.
- Sau khi đổi sang nhận diện bằng chỉ số Navigation API: vào bài bằng điều hướng cùng tài liệu, tạo nháp, Quay lại → KHÔNG hỏi lần nào, trang chuyển về danh sách.
- Hai lần thử khác bị nhiễu vì máy chủ dev tải lại cả trang sau khi sửa tệp (khi đó là điều hướng khác tài liệu, `popstate` không phát).

Nguyên nhân gốc CHƯA xác định (UNKNOWN). Mã thử đã gỡ khỏi `soan-bai.tsx`, thay bằng chú thích. Hiện trạng: liên kết trong ứng dụng có hỏi (đã kiểm); nút Quay lại/Tiến, `router.push` của mã khác và nút không phải liên kết thì chưa. ESLint sạch sau khi gỡ; các test không đổi (đơn vị 20/20, tích hợp 51/51, Prisma 7/7 chạy trước lần thử này, phần gỡ chỉ chạm giao diện).

### Ràng buộc `tai_lieu_trangthai_check` trên CSDL thật (12/11/2026, chỉ đọc, người dùng cho phép)

VERIFIED: CSDL `ql_htkt` có `CHECK ("trangThai" = ANY (ARRAY['dang_xu_ly','san_sang','loi']))`, không có `cho_thay`; 201 tài liệu đều `san_sang`. Log `app/prisma/sync-vbpl.log` chưa có lần "NẠP LẠI NỘI DUNG ĐÃ SỬA" nào và không có lỗi CHECK → nhánh thay bản cũ của `sync-vbpl.mjs` chưa từng chạy; khi có tệp trong kho bị sửa nội dung, nó sẽ lỗi ở `UPDATE … 'cho_thay'` sau khi đã nhúng xong, lặp lại mỗi 15 phút. Đây là lỗi của đồng bộ kho văn bản, ngoài module Nội dung AI. ĐÃ SỬA 12/11/2026 (người dùng duyệt): `sync-vbpl.mjs` dùng `'dang_xu_ly'` cho bản chờ thay; không mã nào phân biệt hai giá trị (`chuaNapXong`, `don-ban-ghi-tai-lieu-rong.mjs` và RAG đều chỉ so với `san_sang`). Bằng chứng: `node --check` đạt; `sync-vbpl-core.test.mjs` 22/22; trên CSDL thử, UPDATE sang `cho_thay` → lỗi 23514 `tai_lieu_trangthai_check`, sang `dang_xu_ly` → OK, rồi chuỗi lệnh `thayBanCu` chạy xong (bản mới thành `san_sang`, bản cũ bị xoá). CHƯA kiểm bằng một lượt đồng bộ thật với tệp đã sửa nội dung (cần nhúng véc-tơ trên CSDL thật). Hoàn tác: `git checkout app/prisma/sync-vbpl.mjs`.

## Kiểm tra lần cuối (12/11/2026, trên commit `26dafe9` + 1 sửa chưa commit)

| Lệnh (trong `app/`) | Kết quả |
|---|---|
| `npm test` | PASS 152/152 |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-tich-hop.mjs` | PASS 51/51 trên `ql_htkt_ai_test` |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-prisma.mjs` | PASS 7/7 |
| ESLint: `app/api/ai`, `app/dashboard/ai-workspace`, `components/ai-content`, `lib/ai-content`, `scripts/ai-content`, `sidebar-new.tsx` | 0 lỗi; 1 cảnh báo có từ trước (`<img>` ở `sidebar-new.tsx:473`) |
| Kiểm kiểu giới hạn (tsconfig tạm `extends` + `files`, 22 tệp của module) | Lần đầu FAIL: `lib/ai-content/nghiep-vu.test.ts(215)` TS2345 (`assert.throws(fn, undefined, x)`) — lỗi này sẽ làm vỡ bản build trên GitHub Actions (bài học 22). Đã sửa thành `Error`; chạy lại: 0 lỗi, test module 20/20 |
| `tsc --noEmit` / `npm run build` toàn dự án | NOT_RUN (quy tắc RAM 6GB) |

Chưa làm trong lần này (giữ nguyên trạng thái ở các mục trên): bấm "Đã đăng"/"Không có bài" trên lịch đăng tay bằng trình duyệt; vai trò lãnh đạo và cán bộ Văn phòng thật; smoke 190 route; diễn tập khôi phục dữ liệu; lệnh PM2 của worker; chặn nút Quay lại khi còn nháp; Codex rà các sửa vòng 5.
