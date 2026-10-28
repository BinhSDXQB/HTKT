# DECISIONS

Mỗi quyết định: ngày · quyết định · lý do · nguồn. Chỉ ghi điều đã chốt; thêm mới ở cuối, không sửa lịch sử.
Các mục dưới đây trích từ bộ nhớ dự án (độ tin cậy: theo bộ nhớ, chưa kiểm lại từng mục).

| Ngày | Quyết định | Lý do | Nguồn |
|---|---|---|---|
| 2026 (tháng 9–10) | Không build trên VPS; GitHub Actions build, VPS tự kéo artifact | VPS 6GB RAM hay OOM | memory `github-actions-vps-auto-deploy` |
| 2026-09 | Khoá mềm tài khoản là hành động chính, không xoá cứng mặc định | An toàn dữ liệu, hoàn tác được | memory `quan-ly-tai-khoan-nguoi-dung-2026-09` |
| 2026-09 | Ban QLDA GT chuyển đơn vị: khoá đăng nhập, ẩn khỏi danh sách, KHÔNG xoá dữ liệu | Mẫu chuẩn cho đơn vị chuyển đi/giải thể | memory `khoa-dang-nhap-ban-qlda-gt` |
| 2026 | Trạng thái/tên đơn vị suy ra động từ FK `toChucId→to_chuc`, không lưu cờ tay | Tránh lệch dữ liệu | memory `nguyen-tac-trang-thai-dong` |
| 2026 | Luôn đưa Codex phản biện chéo trước khi chốt, nhưng phải kiểm chứng lại | Codex từng sai | memory `luon-dung-codex-phan-bien` |
| 2026-10 | Đổi nhà cung cấp AI qua `.env` (`lib/ai/cau-hinh.ts`); chatbot có chế độ không-AI | OpenAI từng hết credit | memory `ai-nha-cung-cap-va-che-do-khong-ai` |
| 2026-10-28 | Tích hợp master_prompt_v2 có chọn lọc: lấy máy trạng thái, hợp đồng bàn giao (schema + validator thật), ma trận phê duyệt 4 mức, cổng phát hành, 3 skill mới. KHÔNG lấy n8n/Qdrant/FastAPI/DB Task/staging riêng | Quá cỡ cho một dự án; đã có pgvector; VPS 6GB; chi tiết ở `ARCHITECTURE.md` | `C:\Troly\master_prompt_v2` |
| 2026-10-28 | Validator handoff tự viết (không thêm ajv vào dependencies) | ajv 8 chỉ có gián tiếp; thêm dependency đổi `package-lock` và kéo `npm install` trên VPS; đã đối chiếu 16 ca với ajv 8 — khớp | báo cáo phiên 28/10/2026 |
| 2026-10-28 | Xây lớp quy tắc AI tối thiểu (CLAUDE.md gốc, docs/ai), KHÔNG dựng framework đa-agent riêng | Dùng năng lực có thật của môi trường; giảm rủi ro | báo cáo đánh giá 28/10/2026 |
