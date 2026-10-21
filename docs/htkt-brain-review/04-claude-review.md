# 04 — Đánh giá của Claude Code (Vòng 1)

> Báo cáo này được viết **sau** khi Codex đã nhận đề bài vòng 2A (đánh giá độc lập, không xem tài liệu này — xem 05 §0).
> Mọi luận điểm đánh mã **C-xx** để Codex phán quyết từng mục ở vòng 2B.
> **Giữ nguyên văn vòng 1 để truy vết.** Phán quyết của Codex ở 05 §3; giải trình và các đính chính ở **06**. Định hướng sau vòng 3:
> C-14 "B+" được thay bằng **"B từng bước"** (07, 08); C-10 sửa: tự học Javis không bắt buộc Git, MCP Hub mặc định `full` khi cấu hình sai.

## 1. Kiến trúc hiện trạng (tóm tắt 01)

Một ứng dụng Next.js 16 nguyên khối (PM2 ×2) trên máy chủ Windows 6 GB RAM, PostgreSQL + pgvector, 140 model, 219 tài khoản.
AI đã có ở 3 nơi: chatbot (21 tool), thẩm định hồ sơ (kiểm tra dự toán + hỏi đáp hồ sơ), soạn văn bản — tất cả đi qua một
cổng cấu hình AI (`lib/ai/cau-hinh.ts`).

## 2. Luận điểm

| ID | Luận điểm | Bằng chứng | Độ tin cậy |
|---|---|---|---|
| C-01 | Production **không khảo sát được** từ máy này; mọi số hạ tầng là từ tài liệu | 01 §0 | Cao |
| C-02 | RAM 6 GB là ràng buộc lớn nhất; không thêm runtime thường trực nặng (Python Javis, vector DB riêng, LLM cục bộ) lên cùng máy | 01 §1 | Trung bình (chưa đo) |
| C-03 | Giữ nguyên: cổng AI, chế độ không-AI, RAG lọc quyền + hiệu lực, lõi thẩm định, liên thông DuToanAI | 01 §4 | Cao |
| C-04 | Tool ghi của chatbot thiếu bước xác nhận phía máy chủ (S2) | `route.ts:1007-1265` | Cao |
| C-05 | Nhật ký ghi qua AI thiếu trước/sau (S3) | `route.ts:2234-2246` | Cao |
| C-06 | Token webhook dự phòng viết cứng (S1) | `webhook/infrastructure/route.ts:23` | Cao (mã) / ? (production) |
| C-07 | Dữ liệu cá nhân và trích đoạn hồ sơ đi ra LLM ngoài; cần quy chế + định tuyến theo độ nhạy | S4 | Cao |
| C-08 | Thiếu kiểm thử tự động là rủi ro hồi quy lớn nhất khi thêm agent | S7 | Cao |
| C-09 | Javis là trợ lý **một chủ, quyền shell**, tự cập nhật, đổi ~13 commit/ngày → **không** tích hợp trực tiếp | 02 §1, §3 | Cao |
| C-10 | Kế thừa **mẫu thiết kế** Javis: MCP Hub 3 mức quyền + audit; workflow checkpoint + node ghi chờ người; fork học chỉ-đọc + quét injection + tầng nguồn gốc | 02 §2 (#5, #8, #11) | Cao (ý tưởng) / ? (chất lượng mã) |
| C-11 | Zalo cá nhân không chính thức, engine `cli` thuê bao cá nhân, tự cập nhật: **loại trừ** | 02 §2 | Cao |
| C-12 | Knowledge Graph tổng quát chưa chứng minh giá trị; chỉ cần đồ thị quan hệ văn bản trong PostgreSQL | 03 §2 | Trung bình |
| C-13 | Bắt đầu với **1 orchestrator + công cụ chuyên dụng**; 10 "agent" ở mục VI là **vai trò/công cụ**, không phải 10 tiến trình | 03 §1 | Trung bình |
| C-14 | Phương án đề xuất: **B có kế thừa chọn lọc ý tưởng của C** ("B+"): orchestrator TypeScript trong cùng stack, tiến trình worker riêng có giới hạn tài nguyên, PostgreSQL dùng chung nhưng schema tách | 07 | Trung bình — chờ Codex |
| C-15 | MCP server **chỉ-đọc** cho QL-HTKT/DuToanAI là cửa tích hợp chuẩn cho Javis/Claude/Codex sau này | 02 §5 | Trung bình |
| C-16 | Phân quyền admin chatbot bằng email cứng nên chuyển sang `Role/Permission` | S5 | Cao |
| C-17 | Dữ liệu hiệu lực 0 văn bản "hết hiệu lực" cần kiểm chứng trước khi Legal Agent dùng làm căn cứ | S8 | Trung bình |

## 3. Thành phần

| Giữ nguyên | Cải tiến | Kế thừa từ Javis (ý tưởng) | Không tích hợp |
|---|---|---|---|
| Cổng AI, chế độ không-AI, RAG, lõi thẩm định, công việc, xuất văn bản, RBAC, healthcheck | Tool ghi (xác nhận + nhật ký), quy chế dữ liệu, quan hệ văn bản, hybrid search, nhắc việc, kiểm thử | MCP Hub quyền 3 mức; workflow checkpoint; quy trình học có duyệt; Second Brain markdown + git (xuất ra) | Javis nguyên khối trên production; Zalo cá nhân; engine shell; tự cập nhật; voice |

## 4. Rủi ro và điều kiện triển khai

| Rủi ro | Mức | Điều kiện giảm thiểu |
|---|---|---|
| Hết RAM làm sập phần mềm thẩm định | Cao | Đo thực tế (Phụ lục A, 01); worker có trần RAM; cân nhắc máy riêng cho AI |
| AI ghi sai dữ liệu nhân sự/lương | Cao | Xác nhận 2 bước + nhật ký trước/sau + hoàn tác |
| Viện dẫn văn bản hết hiệu lực | Cao | Quan hệ văn bản + mốc ngày hồ sơ + bộ kiểm thử pháp lý (12) |
| Lộ dữ liệu ra LLM ngoài | Cao | Quy chế (Q3 ở 14), định tuyến, che dữ liệu trước khi gửi |
| Prompt injection từ tệp hồ sơ | Trung bình | Tách nội dung tài liệu khỏi chỉ thị; công cụ ghi không bao giờ được kích hoạt từ nội dung tài liệu |
| Hồi quy do thiếu test | Cao | P0: dựng bộ test trước |
