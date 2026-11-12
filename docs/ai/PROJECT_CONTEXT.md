# PROJECT_CONTEXT

Cập nhật: 2026-10-28 · Nguồn: kiểm tra chỉ-đọc ngày 28/10/2026 (VERIFIED trừ khi ghi khác).

## Hệ thống
- Ứng dụng quản lý cho Sở Xây dựng Quảng Trị: hạ tầng kỹ thuật (HTKT), nhân sự văn phòng Sở, hồ sơ nghiệp vụ 11 phòng, GIS, chatbot, RAG tra cứu pháp lý.
- Stack: Next 16 (webpack), React 19, Prisma 7 + pg, PostgreSQL (+ pgvector), next-auth 5 beta, MapLibre, ExcelJS/docx.
- Mã nguồn: `app/` (route ~344 tệp, `lib` 277, `components` 131, `scripts` 75).

## Vận hành
- VPS Windows, RAM 6GB. PM2 cluster 2 instance, cổng 3001 (`app/ecosystem.config.js`). HTTPS qua IIS reverse proxy.
- CI/CD: push `main` → GitHub Actions (`.github/workflows/build-vps.yml`) build → tác vụ `QLHTKT_AutoDeploy` kéo artifact, swap, reload PM2.
- Tác vụ lịch đang có: Backup_QLHTKT_Daily, CleanCache_QLHTKT_Weekly, QLHTKT_AutoDeploy, QLHTKT_Healthcheck_Daily, QLHTKT_PM2_Resurrect, QLHTKT_SinhNhat_Daily, QLHTKT_TelegramBot, QLHTKT_TrimRAM, QLHTKT_Watchdog, Sync_VBPL_KhoTaiLieu.
- Repo: `github.com/BinhSDXQB/HTKT`. Nhánh `main` = triển khai. Nhánh mặc định remote hiện là `ra-soat-csdl-chatbot-phap-ly` (UNKNOWN: có chủ ý hay không).

## Công cụ AI
- Claude Code (phiên chính), Codex CLI (phản biện), subagent của Claude Code.
- Quy tắc, skill chung và hook `guard.mjs` cấp user: nguồn gốc `C:\Troly\_workspace` (cài 07/11/2026). Dự án giữ skill riêng: `nhap-excel`, `ra-soat-vbpl`, `quan-tri-rag-bo-nho`. Bản `.claude/hooks/guard.mjs` trong repo chỉ còn để chạy test CI, không đăng ký hook (tránh chạy 2 lần).
- Kiểm thử: 1 tệp `lib/qd72/danh-gia.test.ts` + các `app/scripts/smoke-*.mjs`; chưa có test runner và CI chưa chạy test.

## Bộ nhớ
- Chỉ mục: `C:\Users\Administrator\.claude\projects\C--Troly-HTKT\memory\MEMORY.md` (88 tệp memory + chỉ mục). Mỗi tệp có `metadata.updated`, `source`, `confidence` (verified | inferred | unreviewed; mặc định `unreviewed` = chưa rà lại). Kiểm tra: `node tools/memory-lint.mjs`.
- Tri thức pháp lý: kho VBPL `G:\My Drive\Tailieu_VBPL` đồng bộ hai chiều với RAG.

## Ghi chú cho skill chung
- Test nhanh: `npm test` trong `app/` (an toàn). Không build/`tsc` toàn dự án; build an toàn: `npm run build:lowram` sau khi kiểm free RAM.
- Migration: `app/prisma/migrations_manual/NNN_*.sql` (+ `_rollback.sql`); sổ đã áp `C:\Troly\deploy\applied_migrations.txt`. Áp tự động chỉ khi `AUTO_MIGRATE` bật.
- Vận hành: `pm2 list` (2 tiến trình `ql-htkt`), tác vụ `QLHTKT_*`, health `http://localhost:3001/api/health`; nhật ký và hoàn tác: `RUNBOOK_DEPLOY.md`.
- Phản biện Codex: Codex không đọc được kho VBPL `G:\My Drive\Tailieu_VBPL` → dán trích nguyên văn. `OPENAI_API_KEY` trong `app/.env` dùng chung số dư với chatbot/RAG: chỉ dùng cho Codex khi người dùng đồng ý từng lần.
- Bộ nhớ: `node tools/memory-lint.mjs` (chuẩn HTKT, chặt hơn) hoặc `node C:\Troly\_workspace\tools\memory-lint.mjs <thư mục>`.

## Điều CHƯA xác minh
- Độ phủ thực tế của các smoke script.
- Quyền ghi của các tác vụ lịch; lý do nhánh mặc định remote.
