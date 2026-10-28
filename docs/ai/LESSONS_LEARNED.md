# LESSONS_LEARNED

Bẫy đã gặp và cách tránh. Thêm mới ở cuối: ngày · bẫy · cách tránh · nguồn. (Trích từ memory dự án.)

1. **RAM 6GB:** `tsc --noEmit`/`npm run build` toàn dự án gây OOM. Dùng TypeScript API scoped hoặc build trên Actions. (`ram-6gb-tranh-lenh-nang`)
2. **HTTP 500 chập chờn:** do worker zombie giữ cổng 3001; phải `pm2 delete` + kill PID giữ cổng, không chỉ restart. (`chunkloaderror-stale-build`)
3. **Build bị ngắt trước swap:** web âm thầm chạy build cũ; so BUILD_ID trước khi build lại. (`bay-build-staging-khong-swap`)
4. **Heredoc Bash nuốt escape** khi ghi TS: dùng Write tool. Không quét `.next-staging` lúc build. (`bay-escape-heredoc-va-build-swap`)
5. **Ngày DATE của pg (oid 1082) lệch 1 ngày:** dùng `setTypeParser`. (`telegram-chuc-sinh-nhat`)
6. **Dữ liệu pháp lý trong `lib/htkt` có thể bịa** dù ghi căn cứ: đối chiếu bản gốc. (`du-lieu-phap-ly-bia-trong-lib-htkt`)
7. **PDF scan / QĐ đã ký:** pdfminer trả rỗng, dễ tưởng là dự thảo; dùng DOCX Công báo hoặc `doc_reader.py`. (`doc-reader-tool-markitdown`)
8. **Khớp dữ liệu ≠ đúng luật** (mã ngạch/nhóm lương). (`ma-ngach-nhom-luong-2026-09`)
9. **Stripping ký tự** có thể biến "Đạt"/mã hiệu thành ký hiệu giả; bắt bằng rà chéo + tự chạy thật. (`kiem-tra-du-toan-dutoanai-2026-09`)
10. **`vuotKhung` từng có hai quy ước lưu trữ**; dùng `chuanHoaPhanTramVuotKhung` mọi nơi ghi. (`vuot-khung-quy-uoc-xung-dot-2026-09`)
11. **Menu thật là `sidebar-new.tsx`.** (`sidebar-thuc-te-2026`)
12. **Codex có thể sai hoặc hết token:** kiểm chứng lại; workaround `OPENAI_API_KEY` qua `CODEX_HOME`. (`ra-soat-phap-ly-phong-codex-2026-08`)
13. **Mật khẩu Postgres từng bị đổi ngoài ý muốn** (chưa rõ ai): theo dõi. (`su-co-mat-khau-postgres-2026-06`)
15. **Hook `guard.mjs` chặn nhầm** lệnh xoá đệ quy thư mục tạm có chữ "Troly" trong đường dẫn scratchpad (28/10/2026). Tránh xoá thư mục tạm; dùng thư mục mới. Cân nhắc nới luật nếu tái diễn.
16. **Test mới phải qua kiểm tra đột biến** (sửa thử mã trên bản sao, test phải đỏ) — tránh test luôn xanh.
17. **Sự đồng ý trong chat không tới được hook** `guard.mjs`; đặt biến môi trường trong lệnh cũng không tác dụng (hook chạy trước lệnh). Với push `main`, người dùng tự chạy trong terminal (28/10/2026).
18. **Kiểm đường dẫn trong tài liệu/skill bằng script** trước khi commit: đã bắt lỗi `app/api/...` phải là `app/app/api/...`.
19. **Hàm kiểm quyền thật nằm trong `lib/auth.ts`** (kéo `server-only`/`db`/`next/navigation`) nên khó test; dùng bộ nạp test thay vì tách hàm sang tệp mới (không đụng mã bảo mật). Test phân quyền KHÔNG ghi CCCD thật: lấy từ các tập hằng đã export hoặc dùng số giả.
20. **Đột biến tương đương không phải test yếu:** bỏ chặn chia 0 trong `tinhBieuThuc` vẫn ra `null` nhờ `Number.isFinite` ở cuối. Phân biệt trước khi vá test.
21. **Khoảng trắng bị gỡ trước khi tính** trong `tinhBieuThuc`: `"1 2"` = 12 (hành vi hiện tại, có thể cố ý). Chưa kết luận lỗi.
22. **Tệp `*.test.ts` trong `app/` bị Next build kiểm kiểu** (tsconfig `**/*.ts`): lỗi kiểu trong test làm vỡ bản build trên GitHub dù `npm test` xanh. Luôn kiểm kiểu giới hạn trước khi commit (tsconfig tạm `extends` + `files`), không chạy `tsc` toàn dự án. Lần này bắt được 1 lỗi thật ở `auth.test.ts`.
14. **`Read(//c//**)` trong permissions user quá rộng** (phát hiện 28/10/2026, cần thu hẹp ở AI-02).
