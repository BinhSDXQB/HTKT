# Báo cáo nghiệm thu — module Nội dung AI, mốc M1 (12/11/2026)

Nhánh `ai-content-m1`. Nhãn: **DONE** đã làm và có bằng chứng chạy · **PARTIAL** · **BLOCKED** · **NOT STARTED** · **UNVERIFIED**.

## Bằng chứng chạy
| Lệnh | Kết quả |
|---|---|
| `npm test` (toàn bộ) | 150/150 đạt (trong đó 18 test của module) — chạy lại sau khi sửa theo Codex vòng 2 |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-tich-hop.mjs` | 40/40 ca đạt trên `ql_htkt_ai_test` (trình điều khiển pg) |
| `node --import ../tools/test-support/register.mjs scripts/ai-content/kiem-thu-prisma.mjs` | 7/7 ca đạt qua Prisma + adapter pg (đường production dùng) |
| Đột biến thử trên 4 điểm sửa theo Codex vòng 2 | 4/4 bị test bắt |
| 19 kiểm tra API qua máy chủ dev thử (Next + Prisma thật, cổng 3098) | đạt ngày 11/11, TRƯỚC các sửa đổi theo Codex vòng 2. Sau đó máy chủ dev bị dừng nên **chưa chạy lại ở tầng HTTP** (đã thay bằng 7 ca Prisma ở trên) |
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
| AT-05 | Bản nháp và xem trước | PARTIAL | đã có mã; mới xem trang tổng quan trên trình duyệt, CHƯA xem màn hình soạn bài/lịch |
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
| 2.7 | MEDIUM | Giao diện giấu lịch đang đăng khi thu hồi | Đúng | Cảnh báo riêng, không báo "thành công" trơn. Chưa xem trên trình duyệt |
| 2.8 | MEDIUM | Worker không đọc lại cờ | Đúng | Đọc lại `.env` trước mỗi việc. Chưa có test tự động |
| 2.9–2.11 | MEDIUM | RETRY_PENDING quá hạn treo; một việc chặn dừng cả vòng; chạy thử chặn đăng thật | Đúng | Đã sửa; mỗi mục một test |
| 2.12, 2.13 | MEDIUM | Biến thể chưa lưu không khoá thao tác; lưu một phần mất phần khác | Đúng | Khoá nút khi còn nháp, lưu từng phần. **Chỉ kiểm bằng ESLint + kiểm kiểu, chưa xem trên trình duyệt** |
| 2.14 | MEDIUM | Danh sách trộn lịch phiên bản cũ | Đúng | Chỉ tính phiên bản hiện hành; có test |
| 2.15 | MEDIUM | Phản hồi cũ ghi đè tháng đang xem | Đúng | Chỉ nhận phản hồi mới nhất. Chưa xem trên trình duyệt |
| 2.16 | LOW | `Origin: null` gây 500 | Đúng | Đã sửa trước khi có kết quả Codex (kèm lỗi nặng hơn tự tìm: so Origin với Host sẽ chặn mọi thao tác ghi sau IIS) |
| 2.17 | MEDIUM | Test chạy đua đạt cả khi thu hồi lỗi | Đúng | Bắt buộc thu hồi và nhận việc đều thành công |

## Việc cần người quản trị quyết định / duyệt
1. Cho chạy lại máy chủ dev thử để xem giao diện (đã dừng giữa chừng) — hoặc tự xem theo `TRIEN_KHAI.md` mục "Môi trường thử".
2. Codex rà lại các sửa đổi vòng 2 (thêm một lượt, tốn hạn mức Codex).
3. Merge `main` (= deploy), áp migration 050, bật cờ — từng bước riêng.
4. Kênh đăng thật, nhà cung cấp ảnh/AI, nơi lưu media, vai trò duyệt, xác nhận của Pháp chế về thông báo AI.
