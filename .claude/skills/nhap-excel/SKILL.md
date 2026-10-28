---
name: nhap-excel
description: Dùng khi nhập dữ liệu từ tệp Excel/PDF/CSV vào CSDL HTKT (cán bộ, lương, nâng lương, thi đua khen thưởng, báo cáo phường/xã, đường). Đảm bảo nhập an toàn, chạy lại không nhân đôi, khớp người đúng, đơn vị đúng. Dùng cả khi viết script import mới.
---

# Nhập dữ liệu Excel vào CSDL (an toàn, chạy lại được)

Mọi lỗi dữ liệu dưới đây đã từng xảy ra thật; quy trình này chặn chúng.

## Quy trình
1. **Đọc nguồn trước, chưa ghi gì.** Excel: đọc cả tên cột lẫn định dạng ô. KHÔNG đọc các sheet ẩn nếu không được yêu cầu. PDF: `python tools/doc_reader.py` (PDF đã ký hay trả rỗng — kiểm tra đó có phải bản scan, đừng kết luận là dự thảo).
2. **Chạy thử (dry-run) và xuất báo cáo**: số dòng đọc được, số khớp, số không khớp, số trùng. Cho người dùng xem trước khi ghi thật.
3. **Khớp người**: ưu tiên CCCD; nếu khớp tên thì chỉ nhận khớp DUY NHẤT (có so khớp bỏ dấu). Tên trùng hoặc không khớp → liệt kê chờ xác nhận, KHÔNG đoán. Giới hạn theo đơn vị khi nguồn là nhiều đơn vị (tránh khớp nhầm sang đơn vị khác). Không in CCCD/lương ra báo cáo hay log; thiếu CCCD → không tạo hồ sơ, báo lại.
4. **Chuẩn hoá giá trị trước khi ghi**:
   - `% vượt khung`: dùng `chuanHoaPhanTramVuotKhung` (`app/lib/luong.ts`) ở MỌI nơi ghi — Excel lưu "9%" thành 0.09.
   - Ngày kiểu `DATE` của pg: `setTypeParser` để khỏi lệch 1 ngày; ngày Excel là số serial → chuyển đúng múi giờ UTC.
   - Lương khoán ghi `heSoLuong` = số tiền (đồng); hệ số thật luôn < 100 (`laLuongKhoan`). Kiểm đơn vị triệu/đồng.
   - Chiều dài đường: `chieuDaiKm ≥ 20` chỉ hợp lệ ở phường đô thị; ở xã thường là mét ghi nhầm km.
   - Số hiển thị kiểu Việt Nam: `fmtSo()`.
5. **Idempotent**: ghi bằng `INSERT … ON CONFLICT` theo khoá tự nhiên, hoặc xoá-theo-khoá-nguồn rồi chèn lại trong MỘT giao dịch (mẫu: `app/prisma/import-thi-dua-khen-thuong.sql`). Chạy lần hai phải cho cùng kết quả.
6. **Sao lưu trước khi ghi thật**: `pg_dump` (hoặc bảng đích) vào thư mục sao lưu. Ghi CSDL sản xuất, migration và xoá dữ liệu CẦN NGƯỜI DÙNG DUYỆT trước. Không chạy `DROP/TRUNCATE`.
7. **Ghi thật rồi kiểm lại**: đếm bản ghi trước/sau, chọn ngẫu nhiên vài dòng đối chiếu với nguồn, chạy lại script lần hai để xác nhận không nhân đôi. Nếu thay đổi hiển thị trang: build do GitHub Actions làm, KHÔNG build trên VPS.
8. **Báo cáo**: đã nhập X, bỏ qua Y (lý do), chờ xác nhận Z (không nêu CCCD). Ghi bẫy mới vào `docs/ai/LESSONS_LEARNED.md`.

## Tiêu chí hoàn thành
Có báo cáo dry-run được duyệt; có bản sao lưu; chạy lần hai không đổi số bản ghi; danh sách chưa khớp được trả cho người dùng; không lộ CCCD/lương trong đầu ra.
