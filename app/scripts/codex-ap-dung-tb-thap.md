Bạn là chuyên gia pháp lý xây dựng/giao thông Việt Nam. Mốc hiệu lực **01/7/2026**, Sở Xây dựng Quảng Trị (sau sáp nhập GTVT).

BỐI CẢNH: Báo cáo rà chéo trước đây ở `BAO_CAO_CODEX_THAM_DINH_THAM_MUU.md`. Các lỗi **Cao** ĐÃ được vá vào 3 file. Nay xử lý nốt các mục **TB** và **Thấp** + **xác minh các số hiệu văn bản còn nghi ngờ**.

3 FILE DỮ LIỆU (đọc kỹ cấu trúc TypeScript, KHÔNG sửa code trong lần này):
- `lib/phong/phap-ly-phong.ts`
- `lib/phong/tham-dinh-phong.ts`
- `lib/phong/tham-muu-phong.ts`

NHIỆM VỤ:

## Phần 1 — XÁC MINH số hiệu văn bản còn nghi ngờ (ưu tiên cao nhất)
Với mỗi số hiệu dưới đây: có THẬT không? đúng lĩnh vực/hiệu lực 01/7/2026 không? Nếu KHÔNG chắc chắn 100%, ghi **UNVERIFIED** và nêu văn bản ĐÚNG đã biết (nếu có):
- `do-thi-thong-minh`: NĐ 269/2025, TT 03/2026
- `ktvl-cong-bo-chi-so-gia`: TT 36/2026, TT 37/2026
- `qlnha-tham-dinh-gia-noxh`: NĐ 261/2025, NĐ 54/2026, NĐ 136/2026 (sửa NĐ 100/2024)
- `qlvt-dang-ky-phuong-tien-thuy`: NĐ 123/2026 (nghi sai lĩnh vực) → TT 75/2014/TT-BGTVT?
- `cap-phep-xay-dung`: Điều 66 NĐ 217/2026 (công khai GPXD)
- `ktvl-cong-bo-gia-vlxd`: NĐ 209/2026
- `dang-kiem-duong-thuy`: NĐ 128/2018 (nghi sai)

## Phần 2 — PHIẾU ÁP DỤNG cho các mục TB/Thấp
Với TỪNG mục TB/Thấp trong báo cáo (bỏ qua mục Cao đã vá), xuất một dòng phiếu áp dụng:

| file | key | trường (canCu/thoiGian/apDung/sanPham...) | Chuỗi hiện tại (trích ngắn, đủ để định vị) | Chuỗi thay thế đề xuất | Trạng thái số hiệu (VERIFIED/UNVERIFIED) |

QUY TẮC BẮT BUỘC:
1. **TUYỆT ĐỐI KHÔNG bịa số hiệu văn bản.** Chỉ ghi số hiệu bạn chắc chắn tồn tại. Số nào không chắc → để nguyên chuỗi cũ + đánh dấu UNVERIFIED, không đề xuất thay.
2. Với lỗi thẩm quyền (Sở lấn UBND tỉnh/Bộ): đề xuất đổi động từ về "tham mưu/đề xuất/trình/phối hợp", thêm cụm "theo phân cấp/ủy quyền của UBND tỉnh".
3. Chuỗi thay thế phải giữ nguyên cú pháp TypeScript (dấu nháy, dấu phẩy), chỉ đổi nội dung chuỗi — để Claude áp bằng find/replace chính xác.
4. Ngắn gọn, đúng trọng tâm.

ĐỊNH DẠNG OUTPUT: IN TOÀN BỘ kết quả ra STDOUT (không ghi/sửa bất kỳ file nào — bạn đang chạy chế độ chỉ-đọc). Bắt đầu bằng dòng `===PHIEU_AP_DUNG_BEGIN===` và kết thúc bằng `===PHIEU_AP_DUNG_END===`.
