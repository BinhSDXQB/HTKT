# QL Hạ Tầng Kỹ Thuật (HTKT) — Sở Xây dựng Quảng Trị

Quy tắc chung (trung thực, ma trận phê duyệt, RAM 6GB, Codex, bộ nhớ): `~/.claude/CLAUDE.md`, nguồn gốc `C:\Troly\_workspace`. Tệp này chỉ ghi phần riêng của HTKT; chi tiết ở `docs/ai/`.

## Bản đồ tài liệu
- Bối cảnh, môi trường, lệnh cho skill chung: `docs/ai/PROJECT_CONTEXT.md`
- Quyết định: `docs/ai/DECISIONS.md` · Việc đang làm: `docs/ai/TASKS.md` · Bẫy đã gặp: `docs/ai/LESSONS_LEARNED.md`
- Kiến trúc AI: `docs/ai/ARCHITECTURE.md` · Điều phối, bàn giao: `docs/ai/WORKFLOW.md`
- Ma trận phê duyệt chi tiết: `docs/ai/SECURITY.md` · Kiểm thử, cổng phát hành: `docs/ai/TESTING.md`
- Triển khai và hoàn tác: `docs/ai/RUNBOOK_DEPLOY.md` · Lịch sử: `CHANGELOG.md`
- Skills: chung (cấp user) phan-bien-codex, ra-soat-ma-nguon, trien-khai-hoan-tac, session-handoff · riêng dự án `.claude/skills/`: ra-soat-vbpl, nhap-excel, quan-tri-rag-bo-nho
- Next.js của dự án khác bản quen thuộc: đọc `app/AGENTS.md` và `app/node_modules/next/dist/docs/` trước khi viết code Next.

## Nghiệp vụ & pháp lý
- Cấp M/L của dự án: pháp lý, phân quyền, CSDL, lương/nghỉ hưu, triển khai → bắt buộc `phan-bien-codex`.
- Số liệu pháp lý trong `lib/htkt` có thể sai dù ghi căn cứ: đối chiếu văn bản gốc trước khi tin.
- Soạn thảo pháp lý chi tiết theo quy mô cụ thể, căn cứ văn bản hiệu lực 01/07/2026. Không tự đổi căn cứ trong văn bản lãnh đạo ký.

## Môi trường
- Build do GitHub Actions làm; VPS tự kéo bản build (tác vụ `QLHTKT_AutoDeploy`). Push `main` = triển khai production.
- PM2 cluster 2 instance, cổng 3001. Lỗi 500 chập chờn: kiểm tra worker zombie giữ cổng.
- Đọc tài liệu: `python tools/doc_reader.py` để tiết kiệm token.

## Dữ liệu nhạy cảm
- CCCD và lương chỉ hiển thị cho nhóm được phép (memory `quyen-quan-ly-can-bo`). Không ghi CCCD thật vào memory, test, log.
- Đăng nhập bằng CCCD; khoá mềm tài khoản, không xoá cứng mặc định.

## Quy ước mã
- Trạng thái và tên đơn vị suy ra động từ khoá ngoại, không lưu cờ tay.
- Menu thật là `sidebar-new.tsx`, không phải `sidebar.tsx`.
- Thông điệp commit nêu lý do.

## Cuối mỗi nhiệm vụ
Bài học → `LESSONS_LEARNED.md`, quyết định → `DECISIONS.md`, cập nhật `TASKS.md`; fact bền vững → memory kèm nguồn và ngày.
