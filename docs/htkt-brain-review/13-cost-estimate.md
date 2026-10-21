# 13 — Ước tính chi phí

> **Không bịa đơn giá.** Giá API LLM, giá VPS và đơn giá nhân công thay đổi theo thời điểm/nhà cung cấp; báo cáo này đưa
> **công thức + đại lượng cần đo + khoảng tham khảo có nguồn**. Con số chốt phải lấy từ báo giá thật (Q7, 14).

## 1. Hiện trạng đo đếm

| Đại lượng | Có dữ liệu? | Bằng chứng |
|---|---|---|
| Số lượt hỏi chatbot/ngày | Có thể đếm từ `chatbot_logs` (không mở CSDL trong vòng này) | `schema.prisma:1380-1396` |
| **Token thực tế mỗi lượt** | **Không** — route chatbot không ghi `usage` | không có `usage`/`prompt_tokens` trong `app/api/chatbot/route.ts` |
| Ước tính chi phí | Hàm ước lượng theo ký tự/4 với giá mặc định cũ của gpt-3.5 | `lib/openai.ts:57-82` |
| Model đang dùng | Mặc định `gpt-4.1-mini` (đổi qua `.env`) | `lib/ai/cau-hinh.ts:31` — production **chưa kiểm chứng** |

**Việc đầu tiên (B0):** ghi `usage.prompt_tokens/completion_tokens`, model, nhà cung cấp vào `chatbot_logs`/nhật ký workflow — không có
số đo này thì mọi ước tính chi phí AI chỉ là đoán.

## 2. Công thức chi phí AI vận hành (tháng)

Đơn vị tính là **mỗi LẦN GỌI API**, không phải mỗi lượt người dùng (một lượt chatbot có thể gồm tới 5 lần gọi, mỗi lần gửi lại toàn bộ lịch sử + kết quả tool):

```
C_AI = Σ_lần_gọi ( T_vào × P_vào + T_ra × P_ra ) / 1.000.000      ← gồm cả lần retry có tính phí
     + Σ_truy_vấn_RAG  T_câu_hỏi × P_embed / 1.000.000               ← mỗi câu hỏi dùng RAG nhúng 1 lần
     + C_embedding_kho (nạp mới + nạp lại toàn bộ khi đổi model)
```

| Loại việc | Số lần gọi/lượt | T_vào mỗi lần gọi | T_ra tối đa **mỗi lần gọi** | Ghi chú |
|---|---|---|---|---|
| Chatbot hỏi đáp | 1–5 | system prompt + lịch sử + kết quả tool tích luỹ | 2.048 | `CB:2205-2206`; vòng tool `CB:2195` |
| Hỏi đáp hồ sơ | 1 | trích đoạn ≤ 14.000 ký tự **+ danh mục tệp + lịch sử** | 1.800 | `hoi-dap.ts:22`; `hoi-dap/route.ts:103` |
| Workflow thẩm định (mới) | theo số node LLM | — | — | đo ở lát cắt thử |
| Critical Review (mới) | 1 lần gọi/bản nháp **cuối** (đã nằm trong số node của workflow — không cộng hai lần) | ~ bản nháp | — | |

**Trần chi phí (thiết kế, chưa có):** chế độ không-AI hiện chỉ kích hoạt khi **nhà cung cấp** báo lỗi/hết hạn mức (`CB:2190-2215`) — đó **không** phải trần ngân sách nội bộ.
Cần: (1) **dự giữ** ngân sách ước tính trước mỗi lần gọi (chặn khi phần còn lại không đủ, an toàn với nhiều request đồng thời); (2) đối soát bằng `usage` thật sau gọi;
(3) 80 % → cảnh báo admin, 100 % → chuyển chế độ không-AI do hệ thống chủ động bật.

## 3. Chi phí hạ tầng

| Phương án | Nội dung | Chi phí | Nguồn |
|---|---|---|---|
| Giữ máy chủ hiện tại | Thêm 1 worker Node có trần RAM | 0 tiền máy; **rủi ro RAM** | 01 §1 |
| Nâng RAM máy hiện tại | 6 → 16 GB | phụ thuộc phần cứng/nhà cung cấp — **cần báo giá** | — |
| Máy riêng cho AI/worker | VPS Linux 4–8 GB | khoảng tham khảo 40–80 USD/tháng (giả định, theo bộ nghiên cứu DuToanAI 13 §3, **chưa có báo giá**) | `D:\Troly\Dutoan_AI\docs\du-toan-ai-research\13-vps-migration-plan.md` |
| LLM cục bộ (Ollama) | cần GPU/RAM lớn | **không khuyến nghị** giai đoạn đầu | C-02 |

## 4. Nguồn lực phát triển

**Bảng duy nhất ở 11 §2** (tổng ước lượng thô: 12–19 người-tuần phát triển + 3–5 người-tuần chuyên gia, chưa gồm người duyệt tri thức thường xuyên).
Ước lượng sẽ được hiệu chỉnh sau B0 (đo thật). Không dùng làm căn cứ dự toán kinh phí chính thức.
