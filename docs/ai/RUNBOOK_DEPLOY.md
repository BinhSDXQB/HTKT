# RUNBOOK — Triển khai và hoàn tác

Cập nhật: 2026-11-19 (bước 3–4 viết lại sau sự cố kẹt nhánh 19/11) · Trước đó 2026-10-28 · Nguồn: đọc `.github/workflows/build-vps.yml` và `app/scripts/deploy/vps-auto-deploy.ps1` (VERIFIED theo mã; chưa diễn tập thực tế bản rollback trong phiên này).

## 1. Luồng triển khai
```
Local (npm test) → push nhánh main → GitHub Actions "Build cho VPS":
   npm ci → prisma generate → npm test → next build → artifact "next-build" (có DEPLOY_SHA)
→ VPS: tác vụ QLHTKT_AutoDeploy (5 phút/lần, SYSTEM) lấy lần build THÀNH CÔNG mới nhất trên main
→ giải nén vào .next-staging → đối chiếu mã (KHÔNG đổi nhánh thư mục làm việc) → (migration mới lấy từ chính commit build: pg_dump rồi áp) → (package-lock đổi: npm install)
→ đổi .next ↔ .next-staging → pm2 reload ql-htkt → kiểm tra /api/health + 2 tiến trình khởi động lại sau lúc đổi
→ đạt: ghi deployed_sha.txt + báo Telegram · không đạt: tự quay về bản cũ
```
**Push `main` = triển khai production** (trong ~5–15 phút). Không có bước Staging riêng: bản build chạy thử đầu tiên chính là production.

## 2. Cổng chặn có sẵn
| Cổng | Chặn gì |
|---|---|
| `npm test` trong workflow (MỚI, 28/10/2026) | Test đỏ → workflow thất bại → không có artifact thành công mới → VPS không triển khai commit đó |
| Artifact phải có `BUILD_ID` + `DEPLOY_SHA` khớp commit | Chặn bản build lẫn commit |
| Commit build phải nằm trên `origin/main`; bản đang chạy (`deployed_sha.txt`) phải là tổ tiên của bản mới | Không triển khai lùi / rẽ nhánh (lùi bản: làm tay, `-Force`) |
| Không đổi nhánh `C:\Troly\HTKT` (cũng là thư mục làm việc). Chỉ `merge --ff-only` khi thư mục đang ở `main`, sạch và đi sau bản build; bản build sửa chính script → dừng sau merge, lần chạy sau dùng script mới | Không làm kẹt/đổi nhánh của phiên đang làm như 19/11/2026 |
| Tệp web đọc lúc chạy (`app/public`, `next.config.ts`, `package-lock.json`) và mã triển khai (`app/scripts/deploy`) phải trùng commit build, kể cả sửa chưa commit và tệp mới chưa theo dõi | Không chạy bản build mới với tệp của nhánh khác; **sửa script triển khai trên nhánh làm việc sẽ chặn triển khai tới khi script đó lên `main`** |
| Migration lấy bằng `git archive` từ chính commit build | Không áp migration của nhánh đang làm (vd 050 AI Content) |
| Cần cài thư viện mà `package.json` khác commit build | Dừng trước migration |
| `pg_dump` trước migration + dừng nếu lỗi | Không áp migration khi chưa có sao lưu |
| Health check sau đổi bản (cần ≥ `MIN_WORKERS`, mặc định 2 tiến trình mới) | Tự quay về bản cũ nếu web không lên |

Lưu ý: AutoDeploy chọn lần build thành công **mới nhất**; một lần build đỏ không thu hồi bản đã triển khai trước đó.

## 3. Trước khi push `main` (cần người dùng duyệt)
1. `npm test` trong `app/` đạt (hiện 24 test). Không chạy `tsc`/`npm run build` toàn dự án trên VPS 6GB.
2. Có migration? Phải **tương thích ngược** (chỉ thêm bảng/cột), vì migration chạy TRƯỚC khi web đổi bản; tệp `NNN_*.sql` kèm `NNN_*_rollback.sql` (quy ước hiện có).
3. Đã ghi rủi ro + cách hoàn tác (mục 5) vào mô tả commit/PR nếu thay đổi lớn.
4. Thay đổi quan trọng (pháp lý, phân quyền, CSDL, lương): đã qua skill `phan-bien-codex`.
5. Người dùng đồng ý push. Nhánh mặc định remote hiện là `ra-soat-csdl-chatbot-phap-ly` còn deploy theo `main` — chắc chắn push đúng nhánh.

## 4. Sau khi triển khai (kiểm tra)
- Nhật ký: `C:\Troly\deploy\logs\deploy-YYYYMMDD.log` (tìm "HOAN TAT trien khai <sha7>" hoặc "DUNG:").
- Commit đang chạy: `C:\Troly\deploy\deployed_sha.txt`.
- Sức khoẻ: `http://localhost:3001/api/health` phải `status: ok`; `pm2 list` thấy 2 tiến trình `ql-htkt` online.
- Smoke tay/script liên quan: `node app/scripts/smoke-chatbot.mjs`, `smoke-trang-chu.mjs` (chạy khi đụng chatbot/trang chủ).
- Telegram báo "Da trien khai …" hoặc "DUNG trien khai …"/"LOI …": mỗi cặp (commit, nội dung lỗi) báo 1 lần, chỉ đánh dấu khi gửi được (`C:\Troly\deploy\sent_alerts.txt`).

## 5. Hoàn tác
**A. Tự động (đã có trong script):** health/pm2 thất bại sau khi đổi bản → `.next` hỏng đổi tên `.next-failed`, `.next-old` trả về `.next`, `pm2 reload`, kiểm tra health lại. Báo "da quay ve ban build cu" nếu xác nhận được; báo **"ROLLBACK KHONG XAC NHAN … CAN XU LY TAY NGAY"** nếu không. Lưu ý: mã nguồn trên VPS đã nằm ở commit mới (không tự lùi), và migration đã áp **không** tự hoàn tác. Script thử lại mỗi 5 phút vì `deployed_sha.txt` chưa cập nhật; để dừng, sửa commit hoặc tắt tác vụ (B3).

**B. Thủ công sau khi triển khai đã "HOAN TAT" nhưng phát hiện lỗi:**
1. Ưu tiên: `git revert <commit lỗi>` rồi push `main` (cần duyệt) → build mới → tự triển khai. Không dùng `reset --hard`/force-push (hook `guard.mjs` cũng chặn).
2. Nếu cần dừng ngay không để triển khai tiếp: người dùng/quản trị tắt tạm tác vụ — `schtasks /change /tn QLHTKT_AutoDeploy /disable` (bật lại bằng `/enable`). Tôi không tự chạy lệnh này.
3. Web treo/500 chập chờn: kiểm tra worker zombie giữ cổng 3001 (xem `LESSONS_LEARNED.md` #2), `pm2 delete` + kill PID rồi `pm2 resurrect`/khởi động lại.

**C. Hoàn tác CSDL (chỉ khi bắt buộc, cần người dùng duyệt rõ ràng):**
- Ưu tiên chạy tệp `NNN_*_rollback.sql` của đúng migration (đọc kỹ trước khi chạy).
- Bản sao lưu: `C:\Backup_QLHTKT\predeploy-<sha7>-<thời gian>.dump` (trước migration) và `ql_htkt_<ngày>_020002.dump` (backup 2:00 hằng đêm). Khôi phục bằng `pg_restore` làm mất dữ liệu phát sinh sau thời điểm sao lưu — phải cân nhắc.
- Xoá/ghi đè bảng sản xuất là hành động cấm tự động (xem `CLAUDE.md`).

## 6. Công cụ vận hành (không tự chạy khi chưa được phép)
- `vps-auto-deploy.ps1 -DryRun`: chỉ tải + kiểm artifact, dừng trước khi động tới git/CSDL/web.
- `vps-auto-deploy.ps1 -Force -DryRunSync`: chạy tới hết đối chiếu mã + liệt kê migration sẽ áp rồi dừng (không merge, không ghi CSDL, không đổi web, không gửi Telegram; vẫn tải artifact vào `.next-staging`).
- `vps-auto-deploy.ps1 -Force`: triển khai lại dù cùng commit.
- Cấu hình/trạng thái ngoài repo: `C:\Troly\deploy\` (`deploy.env` chứa token, KHÔNG đưa lên git, KHÔNG in ra).

## 7. Việc còn lại (PROPOSED, chưa làm)
- Thư mục release riêng theo SHA (artifact + `public` + cấu hình + thư viện) cho pm2, tách hẳn khỏi thư mục làm việc; cần diễn tập đổi `cwd`, `.env`, quyền SYSTEM/PM2.
- Tác vụ `QLHTKT_AutoDeploy` hiện chạy chính script trong thư mục làm việc (quyền SYSTEM): nên chạy bản cố định ngoài repo. Đổi tác vụ = đổi cấu hình hệ thống, cần duyệt.
- Sổ migration lưu trong CSDL kèm checksum, ghi cùng giao dịch với SQL (hiện là tệp `applied_migrations.txt` theo tên).

## 8. Chưa kiểm chứng
- Nhánh tiến thẳng (thư mục ở `main`) của bản script 19/11 chưa chạy thật; mới chạy thử `-DryRunSync` ở nhánh giữ nguyên thư mục.
- Chưa diễn tập rollback tự động trên VPS; chưa chạy workflow đã thêm `npm test` trên GitHub (chỉ kiểm cú pháp YAML và chạy `npm test` cục bộ).
- Hành vi khi nhiều commit dồn liên tiếp (concurrency `cancel-in-progress`) chỉ suy ra từ cấu hình workflow.
