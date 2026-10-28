---
name: phan-bien-codex
description: Dùng khi sắp chốt một thay đổi quan trọng (pháp lý, phân quyền, CSDL/migration, tính lương/nghỉ hưu, triển khai) và cần phản biện chéo độc lập bằng Codex CLI, rồi tự kiểm chứng kết quả. Dùng cả khi người dùng nói "cho Codex rà", "phản biện", "review chéo".
---

# Phản biện chéo bằng Codex

Codex chỉ ĐỀ XUẤT. Nó từng sai (ngày hiệu lực, trích nguồn trùng URL cho hai kết luận khác nhau, báo "không nối CSDL" trong khi có). Mọi phát hiện phải được Claude tự kiểm chứng trước khi áp dụng.

## Khi nào dùng / không dùng
- DÙNG: thay đổi pháp lý, phân quyền, schema/migration, công thức lương – nghỉ hưu, script triển khai, API xử lý CCCD/lương.
- KHÔNG dùng: sửa chính tả, đổi style, thay đổi một dòng không ảnh hưởng nghiệp vụ.

## Quy trình
1. **Báo chi phí/hạn mức trước.** Mỗi lượt có thể 35–100k token. Gộp nhiều mục vào ÍT lượt (tối đa 2 vòng). Nếu báo hết hạn mức ("try again at HH:MM") thì dừng, báo người dùng. KHÔNG tự chuyển sang `OPENAI_API_KEY` của dự án: nó dùng chung số dư với chatbot/RAG, từng làm sập chatbot khi hết credit. Chỉ dùng khoá dự án khi người dùng đồng ý rõ.
2. **Chuẩn bị đầu vào** trong thư mục tạm (không phải trong repo): xuất diff (`git diff`) hoặc tệp cần rà ra tệp văn bản. KHÔNG đưa `.env`, mật khẩu, token, CCCD, lương thật vào prompt.
3. **Viết prompt** với vai "NGƯỜI PHẢN BIỆN (devil's advocate), không khen", nêu từng mục cần soi (A/B/C…), yêu cầu mỗi lỗi kèm `tệp:dòng` + kịch bản hỏng + cách sửa, và phân biệt "đã chạy/đã đọc" với "suy luận". Với pháp lý: dán TRÍCH NGUYÊN VĂN văn bản gốc vào prompt (Codex không đọc được ổ G:, và sẽ bác sai những gì không được dán).
4. **Chạy** (chỉ đọc), ví dụ:
   ```
   codex exec -c model_reasoning_effort="high" --sandbox read-only --skip-git-repo-check -o ketqua.txt - < prompt.txt
   ```
   - Không truyền `-m`: tài khoản ChatGPT từng từ chối các model đặt tay; để mặc định. (Theo memory 14/10/2026 — nếu lỗi model, đọc thông báo lỗi rồi báo người dùng, đừng đoán.)
   - Lệnh nặng (>2 phút): chạy nền.
5. **Kiểm chứng từng phát hiện** — không nhận nguyên:
   - Lỗi mã: mở đúng `tệp:dòng`, tự tái hiện hoặc chạy thử (ví dụ `npm test` trong `app/`).
   - Lỗi pháp lý: đối chiếu văn bản gốc (Công báo / chinhphu.vn / kho VBPL). Không xác minh được → ghi "cần đối chiếu", KHÔNG ghi thẳng "hết hiệu lực". Không tự đổi căn cứ trong văn bản do lãnh đạo ký.
   - Nguồn Codex dẫn: kiểm tra URL có thật và nội dung khớp kết luận.
6. **Báo cáo cho người dùng** một bảng: phát hiện · mức · đã kiểm chứng (đúng/sai/chưa rõ, bằng cách nào) · đã sửa chưa. Ghi bài học mới vào `docs/ai/LESSONS_LEARNED.md`.

## Tiêu chí hoàn thành
Mỗi phát hiện của Codex có trạng thái kiểm chứng rõ ràng; phần đã sửa có bằng chứng chạy lại (test/smoke); không có secret trong prompt hay đầu ra.
