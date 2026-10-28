---
name: ra-soat-vbpl
description: Dùng khi rà soát hoặc cập nhật căn cứ pháp lý (số văn bản, hiệu lực, văn bản thay thế) trong mã nguồn/biểu mẫu/chatbot của hệ thống HTKT theo mốc 01/07/2026, hoặc khi nạp văn bản mới vào kho VBPL/RAG. Dùng cả khi người dùng hỏi "văn bản này còn hiệu lực không", "cập nhật căn cứ".
---

# Rà soát văn bản pháp luật (mốc hiệu lực 01/07/2026)

Nguyên tắc: **kiểm chứng bằng văn bản gốc, không tin trí nhớ hay bảng số liệu có sẵn.** Số liệu trong `lib/htkt` từng bị bịa dù ghi "Căn cứ TT/NĐ…". Nguồn kiểm chứng Codex hay sai, xem skill `phan-bien-codex`.

## Nơi chứa pháp lý trong mã
- `app/lib/phong/phap-ly-phong.ts` (10 phòng), `app/lib/htkt/phap-ly.ts`, `app/lib/htkt/tham-dinh.ts`
- `app/lib/phong/tham-muu-phong.ts`, `app/lib/phong/tham-dinh-phong.ts`
- System prompt chatbot: `app/app/api/chatbot/route.ts`
- Bảng hiệu lực kho: `app/prisma/hieu-luc-vbpl.json` (key = tên tệp trong kho)
- Lương/nghỉ hưu: `app/lib/luong.ts`, `app/lib/nghi-huu.ts` (đã có test: `npm test` trong `app/`)

## Quy trình
1. **Xác định phạm vi**: văn bản nào, nằm ở tệp nào (dùng Grep số hiệu văn bản trong `app/lib`, `app/app`).
2. **Lấy văn bản gốc** (đã có tool tiết kiệm token): `python tools/doc_reader.py <tệp>`.
   - Nguồn: Công báo (congbao.chinhphu.vn, bản .docx), datafiles.chinhphu.vn, moc.gov.vn (lỗi chứng chỉ với WebFetch → `curl.exe -k`).
   - **Bẫy PDF scan:** `*-ndcp.signed.pdf` thường là bản scan, text layer chỉ có chữ ký số → đọc ra rỗng, dễ tưởng là "dự thảo" hoặc báo trùng giả. Dùng .docx từ Công báo; .docx Công báo có dấu `\` trong zip làm mammoth lỗi "Could not find main document part" → đóng gói lại zip đổi `\`→`/`.
   - Ổ `G:` không thấy được từ pm2/Codex: copy hoặc dán trích đoạn.
3. **Đối chiếu từng điểm** cần kiểm: số/ký hiệu, tên đúng loại văn bản (Luật/Nghị định/Thông tư/Quyết định/Nghị quyết — từng gán nhầm `08/2017/QH14` là Luật GTĐTNĐ, thực là Luật Thủy lợi), ngày ban hành, ngày hiệu lực, văn bản bị thay/bãi bỏ, điều khoản được trích. Phân biệt "bãi bỏ một điều" với "thay thế cả văn bản".
   Xác định thêm: cơ quan ban hành và thẩm quyền, thứ bậc văn bản (Luật > Nghị định > Thông tư > Quyết định), văn bản sửa đổi/bổ sung, tình trạng (đã ban hành có hiệu lực / chưa có hiệu lực / DỰ THẢO — dự thảo không có giá trị ràng buộc). Trích đúng điều/khoản bằng nguyên văn; không diễn giải thay nguyên văn khi đưa vào văn bản chính thức.
4. **Phân loại kết luận** (bắt buộc ghi nhãn): VERIFIED (đã đọc văn bản gốc) · CẦN ĐỐI CHIẾU (nguồn ngoài, chưa tự xác minh) · UNKNOWN. Chưa có văn bản thay thế thì ghi "theo dõi", không bịa số hiệu.
5. **Sửa mã** chỉ cho điểm VERIFIED. Giữ nguyên văn bản do lãnh đạo ký (không tự đổi căn cứ trong đó); chỉ đề xuất. Soạn thảo phải cụ thể theo quy mô/loại công trình, căn cứ NĐ/TT hiệu lực 01/07/2026, không dùng "…" chung chung.
6. **Nạp kho/RAG khi cần**: `app/prisma/sync-vbpl.mjs`; nạp + kiểm chatbot một lệnh: `app/scripts/nap-vbpl-va-kiem.ps1` (cần OpenAI còn credit — báo người dùng trước vì tốn chi phí và dùng chung số dư chatbot).
7. **Kiểm tra sau sửa**: `npm test` (trong `app/`), Grep lại số hiệu cũ không còn sót, `node app/scripts/smoke-chatbot.mjs` nếu đụng chatbot. KHÔNG chạy `tsc`/`npm run build` toàn dự án trên VPS 6GB; build do GitHub Actions làm.
8. **Ghi lại**: bảng "văn bản · trạng thái · nguồn · ngày kiểm" vào báo cáo; quyết định chốt vào `docs/ai/DECISIONS.md`; bẫy mới vào `docs/ai/LESSONS_LEARNED.md`.

## Tiêu chí hoàn thành
Mỗi thay đổi căn cứ có nhãn VERIFIED kèm nguồn đã đọc; không còn số hiệu cũ trong mã; test đạt; điểm chưa xác minh được liệt kê riêng, không trộn vào kết luận.
