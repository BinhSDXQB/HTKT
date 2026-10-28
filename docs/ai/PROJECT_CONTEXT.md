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
- Hook cấp user: chỉ `terminal-state.sh`. Chưa có skill/agent/hook cấp dự án (tính đến 28/10/2026).
- Kiểm thử: 1 tệp `lib/qd72/danh-gia.test.ts` + các `app/scripts/smoke-*.mjs`; chưa có test runner và CI chưa chạy test.

## Bộ nhớ
- Chỉ mục: `C:\Users\Administrator\.claude\projects\C--Troly-HTKT\memory\MEMORY.md` (89 tệp).
- Tri thức pháp lý: kho VBPL `G:\My Drive\Tailieu_VBPL` đồng bộ hai chiều với RAG.

## Điều CHƯA xác minh
- Độ phủ thực tế của các smoke script.
- Quyền ghi của các tác vụ lịch; lý do nhánh mặc định remote.
