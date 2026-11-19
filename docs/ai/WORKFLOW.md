# WORKFLOW — Điều phối nhiều tác nhân

Nguồn: `C:\Troly\master_prompt_v2` (WORKFLOW.md, MASTER_PROMPT_V2.md), điều chỉnh theo thực tế dự án. Cập nhật: 2026-10-28.

## Vai trò (4 vai logic, không phải 4 tiến trình)
| Mã | Vai | Thực thể thật | Quyền |
|---|---|---|---|
| A0 | Điều phối | Phiên Claude chính | Chia việc, xin duyệt; không vượt quyền |
| A1 | Nghiên cứu & ngữ cảnh | Subagent Explore / general-purpose, WebSearch, RAG | Chỉ đọc |
| A2 | Kỹ sư | Claude (phiên chính hoặc worktree riêng) | Sửa trong phạm vi Task; không tự duyệt |
| A3 | Phản biện độc lập | Codex CLI (skill `phan-bien-codex`) | Chỉ đọc; không merge |
| OPS | Triển khai | Script `vps-auto-deploy.ps1` + skill `deploy-rollback` | Chỉ sau người dùng duyệt |
| HUMAN | Người dùng | — | Duyệt cổng; quyết định cuối |

Quy tắc: một Task = một owner = phạm vi tệp xác định; hai tác nhân không ghi cùng tệp (dùng worktree/nhánh riêng khi song song); A3 không duyệt thay đổi do chính mình tạo. Thêm tiến trình agent chạy nền chỉ khi khối lượng đo được chứng minh cần thiết.

## Máy trạng thái
`NEW → TRIAGED → AUDITED → PLANNED → APPROVED_FOR_BUILD → IMPLEMENTING → IN_REVIEW → TESTING → READY_FOR_RELEASE → APPROVED_FOR_RELEASE → DEPLOYING → VERIFYING → DONE`
Nhánh phụ: `BLOCKED`, `NEEDS_HUMAN`, `FAILED`, `ROLLING_BACK`, `CANCELLED`.
Hai cổng người dùng duyệt: `APPROVED_FOR_BUILD` (khi thay đổi lớn/rủi ro cao) và `APPROVED_FOR_RELEASE` (luôn luôn: push `main` = production, xem `RUNBOOK_DEPLOY.md`). Không tự nhảy qua cổng.

## Luồng bàn giao
A0 → A1 (bằng chứng) → A0 (kế hoạch) → A2 (diff + test) → A3 (phản biện) → A2 (sửa) → A3 (kiểm lại) → HUMAN (duyệt) → OPS (triển khai) → theo dõi → ghi memory/LESSONS.

## Hợp đồng bàn giao
Khi giao việc giữa các vai trò hoặc cho phiên/subagent khác, dùng JSON theo [templates/handoff.schema.json](templates/handoff.schema.json) (trường bắt buộc: task_id, owner, status, goal, scope, acceptance_criteria, risk_level, approval_required, updated_at).
Kiểm tra bằng validator thật, không chỉ dựa vào prompt:
```
node tools/validate-handoff.mjs <tep.json>
```
(Validator tự viết, không thêm thư viện; đã đối chiếu 16 ca với ajv 8 — kết quả khớp. Test: `npm test`.)

Hiện chưa có CSDL trạng thái Task: trạng thái sống ở `TASKS.md` và `update_plan`. Chưa cần dựng DB riêng cho quy mô một dự án; xem `DECISIONS.md`.

## Nhãn bằng chứng
Dự án dùng **VERIFIED / INFERRED / UNKNOWN / PROPOSED**. Tương ứng với bộ master_prompt_v2: CONFIRMED ≈ VERIFIED, UNVERIFIED ≈ UNKNOWN. Không trộn hai bộ nhãn trong cùng một báo cáo.

## Độ tin cậy khi chạy lệnh
Idempotency cho hành động có tác dụng phụ (nhập dữ liệu: xem skill `nhap-excel`); thử lại có giới hạn, không vô hạn; ghi nguyên nhân và bằng chứng khi lỗi; kiểm tra trước/sau hành động quan trọng (sao lưu → hành động → đối chiếu).
