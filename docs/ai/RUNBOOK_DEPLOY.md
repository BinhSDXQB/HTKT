# RUNBOOK — Triển khai và hoàn tác

Cập nhật: 2026-10-28 · Nguồn: đọc `.github/workflows/build-vps.yml` và `app/scripts/deploy/vps-auto-deploy.ps1` (VERIFIED theo mã; chưa diễn tập thực tế bản rollback trong phiên này).

## 1. Luồng triển khai
```
Local (npm test) → push nhánh main → GitHub Actions "Build cho VPS":
   npm ci → prisma generate → npm test → next build → artifact "next-build" (có DEPLOY_SHA)
→ VPS: tác vụ QLHTKT_AutoDeploy (5 phút/lần, SYSTEM) lấy lần build THÀNH CÔNG mới nhất trên main
→ giải nén vào .next-staging → git merge --ff-only → (migration mới: pg_dump rồi áp) → (package-lock đổi: npm install)
→ đổi .next ↔ .next-staging → pm2 reload ql-htkt → kiểm tra /api/health + 2 tiến trình khởi động lại sau lúc đổi
→ đạt: ghi deployed_sha.txt + báo Telegram · không đạt: tự quay về bản cũ
```
**Push `main` = triển khai production** (trong ~5–15 phút). Không có bước Staging riêng: bản build chạy thử đầu tiên chính là production.

## 2. Cổng chặn có sẵn
| Cổng | Chặn gì |
|---|---|
| `npm test` trong workflow (MỚI, 28/10/2026) | Test đỏ → workflow thất bại → không có artifact thành công mới → VPS không triển khai commit đó |
| Artifact phải có `BUILD_ID` + `DEPLOY_SHA` khớp commit | Chặn bản build lẫn commit |
| VPS có sửa đổi chưa commit | Dừng, chờ xử lý tay |
| `merge --ff-only` | Không tự gộp/ghi đè lịch sử |
| `pg_dump` trước migration + dừng nếu lỗi | Không áp migration khi chưa có sao lưu |
| Health check sau đổi bản | Tự quay về bản cũ nếu web không lên |

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
- Telegram báo "Da trien khai …" hoặc "DUNG trien khai …" (báo lỗi 1 lần mỗi commit).

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
- `vps-auto-deploy.ps1 -Force`: triển khai lại dù cùng commit.
- Cấu hình/trạng thái ngoài repo: `C:\Troly\deploy\` (`deploy.env` chứa token, KHÔNG đưa lên git, KHÔNG in ra).

## 7. Chưa kiểm chứng
- Chưa diễn tập rollback tự động trên VPS; chưa chạy workflow đã thêm `npm test` trên GitHub (chỉ kiểm cú pháp YAML và chạy `npm test` cục bộ).
- Hành vi khi nhiều commit dồn liên tiếp (concurrency `cancel-in-progress`) chỉ suy ra từ cấu hình workflow.
