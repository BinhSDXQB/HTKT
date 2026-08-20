Bạn là chuyên gia pháp lý xây dựng/giao thông Việt Nam. Rà soát CHÉO độ chính xác pháp lý của 2 file dữ liệu, mốc hiệu lực **01/7/2026** (Sở Xây dựng Quảng Trị, sau sáp nhập GTVT):

- `lib/phong/tham-dinh-phong.ts` — quy trình thẩm định 9 phòng
- `lib/phong/tham-muu-phong.ts` — công tác tham mưu 9 phòng

9 phòng: phong-kh-tc, phong-qlhd-xd, phong-kt-vl, phong-ptdt, phong-qh-kt, phong-ql-nha, phong-ql-vt, phong-qlkcht, phong-clct.

YÊU CẦU — với TỪNG mục (theo `key`):
1. **Trích dẫn sai/không tồn tại**: mỗi số hiệu văn bản trong `canCu` (Luật/NĐ/TT + số/năm) — có thật không? đúng lĩnh vực không? Nghi vấn bịa số (vd "NĐ 206/2026", "NĐ 214/2025", "NĐ 217/2026") → đánh dấu ⚠️ CẦN KIỂM CHỨNG, nêu văn bản ĐÚNG nếu biết.
2. **Hiệu lực 01/7/2026**: văn bản đã bị thay thế/hết hiệu lực? nêu văn bản thay thế.
3. **Thẩm quyền**: quy trình có đúng thẩm quyền cấp Sở (không lấn UBND tỉnh/Bộ)? thời hạn (`thoiGian`) có khớp luật chuyên ngành?
4. **Thiếu sót**: phòng nào quy trình quá mỏng/thiếu bước bắt buộc (tiếp nhận→thẩm định→trình ký), thiếu quy trình cốt lõi của chức năng phòng đó.

ĐỊNH DẠNG OUTPUT: ghi ra file `BAO_CAO_CODEX_THAM_DINH_THAM_MUU.md`, bảng theo từng phòng:
| key | Lỗi/Nghi vấn | Mức (Cao/TB/Thấp) | Đề xuất sửa |

KHÔNG sửa code. Chỉ đọc + phân tích + ghi báo cáo. Ngắn gọn, đúng trọng tâm, ưu tiên lỗi Cao.
