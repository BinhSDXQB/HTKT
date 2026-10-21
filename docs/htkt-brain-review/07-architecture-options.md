# 07 — So sánh các phương án kiến trúc

## 1. Định nghĩa thống nhất (để chấm điểm không lệch nghĩa)

| PA | Định nghĩa dùng trong báo cáo này |
|---|---|
| **A** | Cài Javis OS (Python FastAPI) làm "bộ não" trên máy chủ, kết nối dữ liệu QL-HTKT; người dùng dùng giao diện/kênh của Javis |
| **B** | Giữ QL-HTKT làm hệ thống nghiệp vụ; thêm **lớp AI Orchestrator viết trong cùng stack TypeScript/PostgreSQL**, gọi dịch vụ nghiệp vụ có kiểm quyền. Ý tưởng/mẫu thiết kế học từ Javis được **viết lại** trong stack này |
| **C** | Kế thừa **mã** chọn lọc của Javis (Python: skill router, workflow runtime, learn, MCP hub…) chạy thành **dịch vụ riêng** cạnh QL-HTKT, nối qua API/MCP |

> Ghi chú: Codex 2A-bis định nghĩa C rộng hơn ("kế thừa chọn lọc rồi tích hợp vào kiến trúc hiện hữu") nên chấm C gần B.
> Theo định nghĩa trên, phần "kế thừa ý tưởng" thuộc B, còn C mang thêm một stack Python — đây là nguồn chênh lệch điểm C giữa Claude và Codex (§3).

## 2. Chấm điểm của Claude (thang 1–5, cao = tốt; "Chi phí" cao = rẻ)

| Tiêu chí | Trọng số | A | B | C | Lý do & bằng chứng |
|---|---:|---:|---:|---:|---|
| Bảo mật & an toàn dữ liệu | 25 % | 1 | 4 | 3 | A: một chủ (`javis config.py:35`), engine `bypassPermissions` (`claude_sdk_engine.py:850`), plugin chạy trong tiến trình trước cổng quyền (`plugins_host.py:579`). B: dùng lại RBAC + `requireAuth` đọc quyền từ DB (`lib/auth.ts:30-84`), nhưng phải sửa S1–S19 trước. C: cô lập được bằng dịch vụ riêng, vẫn phải vá mặc định `full` của MCP (`mcp_catalog.py:507`) và cơ chế plugin |
| Tương thích hệ thống hiện có | 20 % | 2 | 5 | 3 | B tái dùng trực tiếp tool chatbot, `lib/tham-dinh`, `app/actions/cong-viec.ts`. A/C phải viết adapter danh tính 219 TK sang mô hình khác; C thêm hợp đồng API giữa 2 stack |
| Hiệu quả & ổn định | 15 % | 2 | 4 | 3 | RAM 6 GB (tài liệu, chưa đo): A/C thêm runtime Python (+0,3–0,8 GB tối giản, 1–3 GB+ khi có CLI/MCP stdio — Codex ước, **chưa đo**). B thêm tối đa 1 worker Node có giới hạn đồng thời. Javis còn nhiều runtime **canary** (`config.py:463-504`) |
| Khả năng mở rộng | 15 % | 3 | 4 | 4 | A/C có sẵn skill, workflow, MCP hub; B phải viết, nhưng mở rộng trong cùng mô hình quyền. A bị trừ vì mô hình một chủ |
| Chi phí đầu tư, vận hành | 10 % | 2 | 4 | 3 | A "rẻ ban đầu" nhưng tốn công vá bảo mật + vận hành stack mới. B: công phát triển (13 §4) nhưng không thêm máy/stack. C: hai stack |
| Khả năng bảo trì | 10 % | 2 | 4 | 2 | Javis ~13 commit/ngày, ~125k dòng Python; fork C phải tự theo dõi upstream. B: một stack TS đội đang thạo (lịch sử repo) |
| Trải nghiệm người dùng | 5 % | 3 | 3 | 4 | A/C có UI chat giàu (voice, graph); B giữ UI quen thuộc nhưng phải tự làm phần mới |
| **Tổng có trọng số** | **100 %** | **1,95** | **4,15** | **3,10** | |

Cách tính Σ(điểm × trọng số):
A = 0,25 + 0,40 + 0,30 + 0,45 + 0,20 + 0,20 + 0,15 = **1,95** ·
B = 1,00 + 1,00 + 0,60 + 0,60 + 0,40 + 0,40 + 0,15 = **4,15** ·
C = 0,75 + 0,60 + 0,45 + 0,60 + 0,30 + 0,20 + 0,20 = **3,10**.

## 3. So sánh với chấm điểm độc lập của Codex

| Nguồn | A | B | C | Ghi chú |
|---|---:|---:|---:|---|
| Codex 2A (chưa đọc được Javis) | 2,30* | 4,20 | 3,80* | `*` = chưa kiểm chứng Javis |
| Codex 2A-bis (đã đọc Javis) | 2,05 | 4,10 | 3,90 | C định nghĩa rộng |
| Claude (vòng 3) | 1,95 | 4,15 | 3,10 | C = thêm stack Python |

**Thứ hạng giống nhau ở cả ba lượt: B > C > A.** Chênh lệch C (3,10 vs 3,90) **có thể** chủ yếu do khác định nghĩa — *chưa chứng minh*:
hai bên chưa chấm lại cùng một rubric với cùng **danh mục module** C được chọn (Codex vòng 4). Vì vậy **chỉ dùng thứ hạng, không dùng chênh lệch điểm**
làm căn cứ định lượng; phân xử bằng thử nghiệm ở 14 §4. Điểm số là **đánh giá kiến trúc có điều kiện**, không phải benchmark.

## 4. Độ nhạy

- Nếu nâng RAM/tách máy cho AI (Q7): A/C +1 ở "Hiệu quả" → A 2,10; C 3,25 — **thứ hạng không đổi**.
- Nếu hạ bảo mật xuống 10 % và dồn 15 % sang "Mở rộng" (kịch bản ưu tiên tính năng, không phù hợp cơ quan nhà nước): A 2,25; B 4,15; C 3,25 — **thứ hạng không đổi**.
- Hai kịch bản trên không làm đổi thứ hạng. Thứ hạng **có thể** đổi do các yếu tố chưa khảo sát: công phát triển thực tế của B, chất lượng workflow tự viết,
  chi phí vận hành đo được. Nếu lát cắt thử B1/B3 cho thấy viết workflow/skill trong TS tốn công bất hợp lý, xét C cho **riêng** phần đó.

## 5. Kết luận

**Chọn B ("B từng bước")**; dùng Javis làm **nguồn mẫu thiết kế** (không chạy mã Javis trên production). Javis có thể được dùng
**tuỳ chọn, tách biệt** làm trợ lý cá nhân của chủ hệ thống trên máy riêng, đọc QL-HTKT qua MCP chỉ-đọc có xác thực (P3, cần Q6).
