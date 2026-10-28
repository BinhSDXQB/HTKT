---
name: ra-soat-ma-nguon
description: Dùng khi cần kiểm tra hiện trạng dự án/kho mã ở chế độ CHỈ ĐỌC trước khi sửa (audit repo, đánh giá tác động, "xem hệ thống đang thế nào", lập báo cáo hiện trạng). Không sửa tệp, không ghi CSDL, không triển khai.
---

# Rà soát hiện trạng (audit-only)

Chế độ chỉ đọc: **không sửa tệp, không chạy migration, không restart dịch vụ, không `pm2 delete`**. Mọi kết luận gắn nhãn VERIFIED / INFERRED / UNKNOWN và kèm bằng chứng (`tệp:dòng` hoặc lệnh + kết quả). Không suy đoán khi thiếu tệp — ghi UNKNOWN.

## Danh mục kiểm tra (dùng công cụ chuyên dụng Glob/Grep/Read trước, shell khi cần)
1. **Git:** `git status --short` (đừng đè thay đổi chưa commit), nhánh hiện tại, `git rev-list --left-right --count main...origin/main`, `git log --oneline -10`.
2. **Quy tắc & tài liệu:** `CLAUDE.md`, `AGENTS.md`, `app/AGENTS.md`, `docs/ai/*`, `MEMORY.md` (đường dẫn trong `docs/ai/PROJECT_CONTEXT.md`).
3. **Phụ thuộc & kịch bản:** `app/package.json`, `app/package-lock.json`.
4. **Kiểm thử/CI:** chạy `npm test` trong `app/` (an toàn, nhanh); đọc `.github/workflows/build-vps.yml`. KHÔNG chạy `tsc --noEmit` / `npm run build` toàn dự án (VPS 6GB, dễ OOM); nếu cần kiểm kiểu, chạy tsc giới hạn vào vài tệp.
5. **CSDL/migration:** liệt kê `app/prisma/migrations_manual/*.sql`; so với sổ đã áp `C:\Troly\deploy\applied_migrations.txt` để thấy migration chờ. Chỉ ĐỌC; không áp.
6. **Vận hành:** `pm2 list`, `Get-ScheduledTask` các tác vụ `QLHTKT_*`, nhật ký `C:\Troly\deploy\logs`, `deployed_sha.txt`. Không in nội dung `.env`, `deploy.env`.
7. **Bảo mật:** Grep tìm secret/CCCD lộ trong mã (chỉ báo `tệp:dòng`, không in giá trị); API trả dữ liệu nhạy cảm có kiểm quyền không; hook `guard.mjs` còn hoạt động.
8. **Bộ nhớ:** `node tools/memory-lint.mjs`.

## Đầu ra
- Hiện trạng đã xác nhận (VERIFIED) · suy luận (INFERRED) · chưa biết/thiếu quyền truy cập (UNKNOWN).
- Rủi ro xếp BLOCKER / HIGH / MEDIUM / LOW, mỗi mục có bằng chứng.
- Khoảng trống và đề xuất (PROPOSED), chưa thực hiện.
- Việc cần người dùng duyệt tiếp theo.

## Tiêu chí hoàn thành
Không tệp nào bị đổi (`git status` y nguyên trước/sau); mỗi nhận định có bằng chứng; phần chưa kiểm tra được liệt kê riêng.
