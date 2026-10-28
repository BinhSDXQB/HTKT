# CHANGELOG

Lịch sử chi tiết lấy từ Git (`git log`); tệp này chỉ ghi mốc lớn, không viết lại từng commit.

## 2026-10-28
- Thêm lớp quy tắc AI: `CLAUDE.md`, `AGENTS.md` gốc và `docs/ai/` (PROJECT_CONTEXT, DECISIONS, TASKS, LESSONS_LEARNED). Không thay đổi mã ứng dụng.
- Chuyển `SKILL.md` (session-handoff) từ gốc repo vào `.claude/skills/session-handoff/`.

- Thêm hook `PreToolUse` cấp dự án (`.claude/settings.json`, `.claude/hooks/guard.mjs`) chặn: push `main`/force, reset --hard, xoá đệ quy thư mục dự án, DROP/TRUNCATE/DELETE không WHERE, đọc/ghi `.env`. Đặt `HTKT_GUARD_MODE=warn` để chỉ cảnh báo.
- Thêm `npm test` (node:test, không thêm thư viện) và test hồi quy `app/lib/luong.test.ts`, `app/lib/nghi-huu.test.ts`. Không đổi mã ứng dụng.
- Thêm 3 skill dự án: `phan-bien-codex`, `ra-soat-vbpl`, `nhap-excel` (`.claude/skills/`).
- Chuẩn hoá frontmatter bộ nhớ (thêm `updated`, `source`, `confidence`) và thêm `tools/memory-lint.mjs`.
- Workflow `Build cho VPS` chạy `npm test` trước khi build (test đỏ → không triển khai). Thêm `docs/ai/RUNBOOK_DEPLOY.md`.
- Tích hợp `master_prompt_v2`: thêm `docs/ai/{WORKFLOW,SECURITY,TESTING,ARCHITECTURE}.md`, `docs/ai/templates/handoff.schema.json`, `tools/validate-handoff.mjs`; đưa test hook `guard` vào repo; `npm test` chạy thêm hook và tools (49 test); thêm skill `ra-soat-ma-nguon`, `quan-tri-rag-bo-nho`, `trien-khai-hoan-tac`; bổ sung phân mức và phân cấp pháp lý vào 2 skill cũ.

## Trước đó
- Xem `git log` (69 commit tính đến 28/10/2026): triển khai tự động qua GitHub Actions, bảng trung tâm HTKT theo mã xã, rà soát pháp lý 01/07/2026, v.v.
