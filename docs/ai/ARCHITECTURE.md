# ARCHITECTURE — Lớp AI vận hành dự án HTKT

Cập nhật: 2026-10-28. Tóm lược kiến trúc đã thống nhất (trước đây chỉ nằm trong báo cáo chat) và phần tích hợp từ `master_prompt_v2`. Kiến trúc ứng dụng: xem `PROJECT_CONTEXT.md`.

## Các lớp
| Lớp | Thành phần thật | Tệp |
|---|---|---|
| Giao diện | Claude Code (app/CLI); chatbot nội bộ của hệ thống | — |
| Điều phối | Phiên Claude chính, `update_plan`, `TASKS.md` | `CLAUDE.md`, `docs/ai/WORKFLOW.md` |
| Thực thi đa tác nhân | Subagent Claude Code; Codex CLI làm phản biện | `AGENTS.md`, skill `phan-bien-codex` |
| Skills / công cụ | `.claude/skills/*`; `tools/*`; `app/scripts/smoke-*.mjs` | `.claude/skills/` |
| Tri thức & bộ nhớ | Bộ nhớ phẳng (88 tệp, có `confidence`); RAG pgvector + kho VBPL | `memory/`, `app/lib/rag`, `tools/memory-lint.mjs` |
| Bảo mật & phân quyền | Hook guard; ma trận phê duyệt | `.claude/hooks/guard.mjs`, `docs/ai/SECURITY.md` |
| Kiểm thử | `npm test`, smoke, memory-lint, validator handoff | `docs/ai/TESTING.md` |
| Triển khai & giám sát | Actions → AutoDeploy → PM2; Watchdog, backup, Telegram | `docs/ai/RUNBOOK_DEPLOY.md` |

Nguyên tắc: LLM đề xuất; hook/CI/script thực thi kiểm soát; CSDL và Git ghi nhận; người dùng duyệt tác động nhạy cảm. Ưu tiên quy trình xác định hơn vòng lặp tự trị.

## Định tuyến mô hình (PROPOSED — chưa đo chi phí thực tế)
| Loại việc | Chọn |
|---|---|
| Có thể làm bằng mã/công cụ xác định (đếm, so khớp, lint, test) | Không dùng LLM |
| Trích xuất/phân loại không nhạy cảm, đọc tệp, liệt kê | Mô hình nhanh/rẻ |
| Kiến trúc, pháp lý, lương – nghỉ hưu, đổi nhiều tệp | Mô hình mạnh nhất, mức suy luận cao |
| Phản biện độc lập thay đổi quan trọng | Codex (tối đa 2 vòng; báo chi phí trước) |
| Tính năng AI trong sản phẩm | `lib/ai/cau-hinh.ts` đổi nhà cung cấp qua `.env`; chatbot có chế độ không-AI khi hết hạn mức |

Dự phòng khi nhà cung cấp lỗi phải giữ nguyên chính sách dữ liệu (không đẩy CCCD/lương sang nhà cung cấp khác chỉ vì fallback).

## Đã cân nhắc và KHÔNG áp dụng từ master_prompt_v2
| Hạng mục V2 | Lý do không làm (lúc này) |
|---|---|
| n8n, Qdrant, FastAPI orchestrator, DB trạng thái Task riêng | Quá cỡ cho một dự án một nhóm; đã có pgvector; Git + `TASKS.md` đủ. Xây khi khối lượng đo được chứng minh cần |
| Agent thứ năm cho Ops/Deploy | V2 cũng khuyến nghị là skill có cổng duyệt → đúng như `deploy-rollback` |
| Staging riêng | VPS 6GB không chạy thêm một bản; thay bằng `npm test` trong CI + `-DryRun` + health check có tự rollback (xem RUNBOOK) |
| SSO/MFA quản trị, secret manager | Ngoài phạm vi lớp AI; `.env` ngoài Git là mức hiện tại |
