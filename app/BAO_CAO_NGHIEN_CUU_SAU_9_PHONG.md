# Nghiên cứu chuyên sâu 9 phòng chuyên môn — hiện trạng & đề xuất nâng cấp

_Claude + Codex · 12/8/2026 · phối hợp: Codex rà chéo pháp lý, Claude làm chính_

## 0. Phát hiện lớn: bản audit 28/7 đã LỖI THỜI

`BAO_CAO_AUDIT_MENU.md` (28/7) xếp gần hết trang 9 phòng là hạng C/D "mỏng/placeholder".
**Thực tế 12/8, dữ liệu đã được xây gần đủ** qua kiến trúc theo `phongKey`:

| Thành phần | File / cơ chế | Độ phủ 9 phòng |
|---|---|---|
| Cơ sở pháp lý | `lib/phong/phap-ly-phong.ts` (1060 dòng) | ✅ đủ 9/9 · đã rà Codex 11/8 |
| Quy trình thẩm định | `lib/phong/tham-dinh-phong.ts` (817) | ✅ 9/9 · 2–5 quy trình/phòng |
| Công tác tham mưu | `lib/phong/tham-muu-phong.ts` (624) | ✅ 9/9 · nội dung + sản phẩm/lĩnh vực |
| Mẫu biểu & văn bản | `lib/phong/mau-bieu.ts` | ✅ chung + thẩm định + riêng theo phòng |
| Nhập liệu nghiệp vụ | `lib/nghiep-vu/schema.ts` (61 lĩnh vực) | ✅ 44 lĩnh vực ngoài HTKT · TB 5 trường · 0 mục mỏng |

→ Các trang `phap-ly / tham-dinh / tham-muu / mau-bieu` của mỗi phòng chỉ là vỏ 7–14 dòng
**delegating** sang component dùng chung (`PhapLyView`, `ThamDinhView`, `ThamMuuView`, `MauBieuView`)
đọc registry theo `phongKey`. Vỏ mỏng nhưng **nội dung đầy** — audit đếm dòng nên hiểu nhầm.

**Kết luận: không cần "viết lại nội dung 9 phòng". Việc thật còn lại là 3 nhóm dưới.**

---

## 1. Độ chính xác pháp lý (Codex đang rà — nhánh giá trị nhất)

`tham-dinh-phong.ts` / `tham-muu-phong.ts` **chưa từng được rà chéo** (chỉ pháp-lý rà 11/8).
Nhiều trích dẫn `canCu` có số hiệu **nghi vấn bịa năm tương lai**, cần kiểm chứng hiệu lực 01/7/2026:
- NĐ 206/2026, NĐ 214/2025 (đấu thầu), NĐ 217/2026 (thẩm định), NĐ 207/2026 (nghiệm thu), NĐ 210/2026, NĐ 123/2026 (phương tiện thủy)…
- Đợt rà pháp-lý 11/8 từng bắt **10 lỗi** loại này → khả năng cao thẩm-định/tham-mưu cũng có.

→ **Kết quả Codex sẽ ghi ở `BAO_CAO_CODEX_THAM_DINH_THAM_MUU.md`** (bảng theo phòng, mức Cao/TB/Thấp).
Claude sẽ vá theo báo cáo (giống quy trình 11/8).

## 2. Độ sâu lệch giữa các phòng (thẩm định)

Số quy trình thẩm định/phòng: QLHĐ-XD 5 · QH-KT/QL-Nhà 4 · KH-TC/KT-VL/QL-VT/QLKCHT/CLCT 3 · **PTĐT chỉ 2** (mỏng nhất).
→ Đề xuất bổ sung quy trình cốt lõi còn thiếu cho PTĐT (thẩm định chương trình PTĐT, phân loại đô thị)
và cân bằng các phòng 3 quy trình. **Chờ Codex chỉ ra quy trình bắt buộc còn thiếu.**

## 3. Thao tác nhanh + liên kết chặt — nâng `NghiepVuModule` (dùng chung, sửa 1 lần 9 phòng hưởng)

`components/nghiep-vu/nghiep-vu-module.tsx` là CRUD động cho toàn bộ 61 lĩnh vực. Điểm nghẽn thao tác:

| Thiếu | Ảnh hưởng | Đề xuất |
|---|---|---|
| Không có ô tìm kiếm | nhiều bản ghi → tìm chậm | thêm search theo tiêu đề/mã/địa bàn (client) |
| Không lọc theo trạng thái | không lọc nhanh "việc chưa xử lý" | thanh tab trạng thái (MOI/ĐANG/XONG) |
| Không sắp xếp cột | — | click header để sort |
| Không phân trang | chậm khi >100 bản ghi | phân trang/ảo hoá |
| Không liên kết khâu | rời rạc | từ bản ghi → tạo **Công việc** / sinh **mẫu biểu .docx** / gắn **văn bản** |

→ Nhóm (3) là "thực hiện nhanh trong quá trình thao tác" đúng nghĩa. Ưu tiên: **search + lọc trạng thái**
(rẻ, tác động ngay 9 phòng), rồi liên kết bản-ghi ↔ công-việc ↔ mẫu-biểu.

---

## Lộ trình đề xuất (chờ user chốt)

1. **(Codex đang chạy)** Rà pháp lý thẩm-định/tham-mưu → Claude vá lỗi Cao. _[nền]_
2. Nâng `NghiepVuModule`: search + lọc trạng thái + sort. _[1 lần, 9 phòng]_
3. Bổ sung quy trình thẩm định còn thiếu (PTĐT trước).
4. Liên kết khâu: bản ghi nghiệp vụ → nút "Tạo công việc" / "Sinh mẫu biểu".

_Ghi chú kỹ thuật: Codex CLI mất token ChatGPT (revoked) → đã chuyển sang OPENAI_API_KEY qua CODEX_HOME tạm._
