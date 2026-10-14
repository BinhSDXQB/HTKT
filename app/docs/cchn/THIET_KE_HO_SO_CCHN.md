# Thiết kế dữ liệu và form — Hồ sơ đề nghị cấp chứng chỉ hành nghề (Phòng QLHĐ-XD)

**Căn cứ:** NĐ 212/2026/NĐ-CP (Đ3, Đ27–40, Đ55), Luật Xây dựng 135/2025/QH15 (Đ88–90); đọc nguyên văn bản trong kho ngày 14/10/2026.
**Báo cáo kiểm chứng pháp lý:** `C:\Troly\HTKT\Kiem_chung_CCHN_Giam_sat_thi_cong_ND212_2026.md`
**Đường dẫn:** `/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so` (menu Phòng QLHĐ-XD → "Hồ sơ cấp chứng chỉ hành nghề")

## 1. Cấu trúc dữ liệu

```
cchn_ho_so (1) ──< cchn_kinh_nghiem (n)          migration 047
     │
     └── nang_luc_ca_nhan_id ──> httt_nang_luc_ca_nhan ──> httt_dinh_danh     migration 040
                                  (sổ chứng chỉ ĐÃ CẤP)      (mã định danh = CCCD/hộ chiếu, Đ19)
```

| Bảng | Vai trò | Nhóm trường chính |
|---|---|---|
| `cchn_ho_so` | Một hồ sơ đề nghị và tiến trình xử lý | Thủ tục (loại Đ29 k1, trường hợp, hình thức nộp Đ30 k1, ngày nộp); người đề nghị (họ tên, mã định danh, quốc tịch); trình độ (Đ33 k2, k4); nội dung đề nghị (lĩnh vực Đ28, nội dung, hạng, hành nghề độc lập, mốc bắt đầu kinh nghiệm Đ33 k5); thành phần hồ sơ `thanh_phan` (JSONB, Đ39); xử lý (trạng thái, ngày yêu cầu bổ sung, nhận đủ, Hội đồng, thông báo, cấp — Đ30) |
| `cchn_kinh_nghiem` | Từng công trình, dự án, quy hoạch kê khai | Tên, chủ đầu tư, **cấp công trình** (TT 34/2026), **nhóm dự án** (khảo sát địa hình), **cấp phê duyệt + loại quy hoạch** (lập quy hoạch), **vai trò**, phần việc, từ/đến ngày, **tài liệu chứng minh** (Đ39 k1 điểm đ), đánh giá "phần việc thuộc nội dung đề nghị" |
| `httt_nang_luc_ca_nhan` | Chứng chỉ đã cấp (có sẵn) | Ghi tự động khi bấm "Cấp chứng chỉ"; hiệu lực 10 năm (Đ27 k5) |

**Ràng buộc trong CSDL:** trạng thái "Đã cấp" phải có số và ngày cấp; công dân Việt Nam ⇔ mã là số định danh cá nhân; từ ngày ≤ đến ngày. **Không** ràng buộc điều kiện năng lực bằng CHECK vì hồ sơ sai điều kiện vẫn phải tiếp nhận để trả lời "không đủ điều kiện".

## 2. Form nhập (7 khối)

1. **Thủ tục và tiếp nhận** — cấp mới / cấp lại / chuyển đổi; trường hợp theo Đ29; hình thức nộp; ngày nộp (mốc 10 năm).
2. **Người đề nghị** — nhãn mã định danh đổi theo quốc tịch (CCCD 12 số / hộ chiếu).
3. **Trình độ chuyên môn** — trình độ, chuyên ngành, văn bằng; đánh dấu "đã có trên CSDL Giáo dục" thì bỏ yêu cầu nộp văn bằng.
4. **Nội dung đề nghị** — lĩnh vực → nội dung (Đ28 k1), hạng, số chứng chỉ đang có, mốc bắt đầu kinh nghiệm và căn cứ.
5. **Kinh nghiệm** — thêm/xoá/sắp xếp công trình; vai trò lọc theo lĩnh vực; trường cấp công trình / nhóm dự án / cấp phê duyệt quy hoạch đổi theo lĩnh vực. (Ẩn khi cấp lại.)
6. **Thành phần hồ sơ** — checklist tự lọc theo thủ tục, quốc tịch, CSDL, hành nghề độc lập (Đ39).
7. **Xử lý** — trạng thái; nội dung bổ sung (gợi ý từ thành phần còn thiếu); kết quả Hội đồng; thông báo.

**Cột phải (cập nhật ngay khi nhập):**
- *Đánh giá sơ bộ* — thành phần hồ sơ; chuyên ngành (cần kiểm tra — Phụ lục I chưa có); trình độ, số năm, công trình theo hạng đề nghị; hạng cao nhất đạt sơ bộ; cảnh báo kinh nghiệm quá 10 năm (không áp dụng cho hạng III). Không thay kết luận Hội đồng (Đ40).
- *Thời hạn* — thông báo bổ sung (05 ngày làm việc, Đ30 k5); thông báo kết quả trước cuối tháng/ngày 15 tháng sau và 02 ngày làm việc sau Hội đồng (Đ30 k4); cấp 06/11 ngày làm việc (Đ30 k2); cấp lại 05 ngày làm việc. Chưa trừ ngày lễ, Tết.

**Nút "Cấp chứng chỉ":** chỉ hiện khi trạng thái "Đủ điều kiện" (hoặc cấp lại). Ghi sổ `httt_nang_luc_ca_nhan` và mã định danh, rồi khoá hồ sơ (chỉ xem).

## 3. Giới hạn hiện tại

- Phụ lục I (chuyên ngành phù hợp), II (phạm vi hoạt động theo hạng), III (nội dung Mẫu số 01, 02, 03) chưa có trong kho → chưa mã hoá; bộ đánh giá ghi "cần kiểm tra".
- Bộ đánh giá chỉ kết luận "đạt" khi vai trò đúng nguyên văn và phần việc đã được cán bộ xác nhận "thuộc nội dung đề nghị". Vai trò cao hơn khi xét hạng III (văn bản không quy định bao hàm) hoặc công trình chưa đánh giá → "cần kiểm tra". Kinh nghiệm quá 10 năm đáp ứng hạng cao hơn → đạt hạng thấp hơn 01 hạng (Đ33 k3). Ngưỡng quy hoạch theo nguyên văn Đ35. Thao tác cấp chứng chỉ chạy trong một transaction, chặn ở server khi thiếu kết quả Hội đồng, thông báo hoặc thành phần hồ sơ. (Đã qua phản biện Codex 14/10/2026.)
- Chưa có tải lên tệp đính kèm, chưa in phiếu tiếp nhận / thông báo bổ sung, chưa đồng bộ HTTT quốc gia.
- Mục nghiệp vụ động cũ `phong-qlhd-xd/chung-chi-nha-thau` (lib/nghiep-vu/schema.ts) vẫn giữ để không mất dữ liệu đã nhập.
