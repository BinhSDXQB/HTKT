# Quy trình phát triển trên máy khác — tự động triển khai lên VPS qua GitHub

VPS chỉ có 6GB RAM nên **không build trên VPS nữa**. GitHub là trung tâm:

```
Máy phát triển ──push──▶ GitHub (nhánh main) ──▶ GitHub Actions build (Windows, Node 24.16.0, C:\Troly\HTKT)
                                                         │ artifact "next-build" (thư mục .next)
VPS: tác vụ QLHTKT_AutoDeploy (5 phút/lần) ◀────────────┘
     tải bản build → kéo code → áp migration (sao lưu trước) → npm install nếu đổi thư viện
     → hoán đổi .next → pm2 reload → kiểm tra /login → lỗi thì quay về bản cũ → báo Telegram
```

## 1. Chuẩn bị máy phát triển (một lần)

```bash
git clone https://github.com/BinhSDXQB/HTKT.git C:/Troly/HTKT
cd C:/Troly/HTKT/app
npm ci
```

- Dùng **Node 24.16.0** (cùng phiên bản VPS và GitHub Actions).
- Tạo `app/.env` (không có trên git). Nếu cần CSDL thật để thử, dùng bản sao CSDL — **không** trỏ thẳng vào CSDL của VPS khi đang thử nghiệm.
- Nên đặt mã nguồn đúng ở `C:\Troly\HTKT` cho giống VPS (một số script dùng đường dẫn tuyệt đối).

## 2. Làm việc hằng ngày

1. Tạo nhánh từ `main`: `git checkout -b ten-viec main`.
2. Sửa code, chạy thử (`npm run dev`, `npx next build --webpack` trên máy khoẻ thoải mái).
3. Nếu sửa `prisma/schema.prisma`: chạy `npx prisma generate` và **commit cả** `app/lib/generated/prisma`.
4. Nếu thay đổi CSDL: viết migration `app/prisma/migrations_manual/NNN_ten.sql` (bọc `BEGIN; … COMMIT;`, dùng `IF NOT EXISTS`) **kèm** `NNN_ten_rollback.sql`. VPS tự áp tệp `NNN_*.sql` mới (bỏ qua `_rollback`, `_verify`) sau khi `pg_dump` sao lưu. ⚠️ Migration chạy **trước** khi web đổi sang bản mới và **không tự hoàn nguyên** nếu bước sau lỗi → migration phải **tương thích ngược**: chỉ thêm bảng/cột/chỉ mục; đổi tên, xoá cột thì tách làm 2 đợt (đợt 1 thêm mới + code dùng cả hai, đợt 2 mới xoá).
5. Nếu thêm thư viện: `npm install <gói>` rồi **commit `app/package-lock.json`**.
6. Đẩy nhánh, tạo PR vào `main`; gộp vào `main` khi xong → GitHub Actions build → VPS tự cập nhật trong khoảng 5–15 phút.

> Chỉ những gì nằm trên `main` mới được triển khai. Không sửa code trực tiếp trên VPS: tác vụ sẽ DỪNG và báo Telegram nếu VPS có sửa đổi chưa commit.

## 3. Trên VPS

| Thành phần | Vị trí |
|---|---|
| Script triển khai | `app/scripts/deploy/vps-auto-deploy.ps1` (chạy tay thử: thêm `-DryRun` để chỉ tải bản build, không đụng web) |
| Cài đặt một lần | `app/scripts/deploy/setup-auto-deploy.ps1` |
| Cấu hình, token | `C:\Troly\deploy\deploy.env` (ngoài repo, chỉ Administrators/SYSTEM đọc được) |
| Trạng thái | `C:\Troly\deploy\deployed_sha.txt`, `applied_migrations.txt` |
| Nhật ký | `C:\Troly\deploy\logs\deploy-YYYYMMDD.log` |
| Sao lưu trước migration | `C:\Backup_QLHTKT\predeploy-*.dump` |
| Tác vụ | Task Scheduler `QLHTKT_AutoDeploy` (SYSTEM, 5 phút) — tắt: `schtasks /change /tn QLHTKT_AutoDeploy /disable` |

**Token GitHub** (người quản trị tự tạo và tự dán vào `deploy.env`): fine-grained personal access token, chỉ cấp cho repo `BinhSDXQB/HTKT`, quyền *Contents: Read*, *Actions: Read*, *Metadata: Read* là đủ cho tác vụ tự động. Chỉ cần *Contents: Read and write* nếu muốn đẩy code từ VPS (ví dụ lần đẩy `main` đầu tiên) — xong có thể hạ quyền.

Token không xuất hiện trên dòng lệnh: script truyền cho git qua biến môi trường `GIT_CONFIG_*`. Trong lúc triển khai, watchdog bỏ qua `ql-htkt` (khi `C:\Troly\deploy\deploy.lock` còn mới) để không khởi động lại chen ngang.

**Quay về bản trước:** đẩy commit revert lên `main` (cách chuẩn), hoặc trên VPS: đổi `deployed_sha.txt` rồi chạy script với `-Force` sau khi `git checkout` commit cũ. Migration đã áp thì hoàn nguyên bằng tệp `_rollback.sql` tương ứng hoặc khôi phục từ bản `predeploy-*.dump`.

## 4. Giới hạn

- GitHub Actions trên repo riêng tư có hạn mức phút miễn phí (máy Windows tính hệ số 2); mỗi lần build khoảng 5–10 phút.
- Artifact giữ 7 ngày; VPS tắt quá 7 ngày thì cần chạy lại workflow (Actions → "Build cho VPS" → Run workflow).
- `npm install` trên VPS khi đổi thư viện vẫn tốn RAM vừa phải; build thì không còn chạy trên VPS.
