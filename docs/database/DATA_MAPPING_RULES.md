# DATA_MAPPING_RULES — Quy tắc ánh xạ và đối soát

Trạng thái: PROPOSED toàn bộ. Chưa quy tắc nào được duyệt hay chạy. Mỗi quy tắc chỉ áp dụng sau khi có báo cáo chỉ-đọc theo từng bản ghi và người có thẩm quyền duyệt.

Số liệu nền: `DATA_INTEGRITY_REPORT.md`.

## Nguyên tắc chung

1. Khớp bằng khoá định danh trước, tên sau. Thứ tự ưu tiên: id nội bộ → mã nghiệp vụ (`ma`, `code`, `maDuAn`, `ma_doi_tuong`) → tên đã chuẩn hoá + địa bàn.
2. Chuẩn hoá tên để so khớp: bỏ khoảng trắng thừa, không phân biệt hoa thường, thống nhất tiền tố "Đường", "Đ.", "QL", "ĐT". Chỉ dùng để so, không ghi đè tên gốc.
3. Ba kết cục cho mỗi bản ghi: **KHỚP CHẮC** (tự nối được), **KHỚP NGHI NGỜ** (đưa vào hàng đợi đối soát cho người duyệt), **KHÔNG KHỚP** (giữ nguyên, không tự tạo).
4. Không suy đoán dữ liệu thiếu. Thiếu thì để trống và ghi lý do.
5. Mỗi lần nối ghi lại: nguồn, quy tắc, người duyệt, thời điểm.
6. Chạy lại không sinh bản ghi trùng.

## M1. Nhân sự: `can_bo` ↔ `phan_cong` ↔ `users`

| Tình huống | Số | Đề xuất |
|---|---:|---|
| Cán bộ không có phân công chính, có đủ `toChucId` và `chucDanhId` | ≤ 61 | Tạo `phan_cong` chính từ `can_bo` |
| Cán bộ không có phân công chính, thiếu `chucDanhId` | ≤ 18 | Hàng đợi đối soát; không tự gán chức danh |
| Phân công chính lệch đơn vị với `can_bo` | 3 | Hàng đợi đối soát; cần Văn phòng Sở xác nhận bên nào đúng |
| Phân công chính lệch chức danh với `can_bo` | 14 | như trên |
| `can_bo.toChucId` lệch `users.toChucId` | 3 | Lấy theo `can_bo` sau khi xác nhận; ảnh hưởng phân quyền nên là cấp M |
| Cột chữ `can_bo.chucVu`, `phongBan` | 163 | Giữ nguyên; chỉ xoá sau khi chứng minh không còn mã đọc |

Câu hỏi cần người dùng quyết: nguồn chủ về đơn vị và chức danh hiện tại là `can_bo` hay `phan_cong`. Đề xuất: `phan_cong` giữ lịch sử và kiêm nhiệm, `can_bo.toChucId` / `chucDanhId` là giá trị hiện hành, hai bên phải khớp ở dòng `laChinh`.

## M2. Tuyến đường: `streets` ↔ `assets` ↔ `report_duong` ↔ `htkt_doi_tuong`

Vai trò đề xuất:

| Bảng | Vai trò |
|---|---|
| `streets` | danh mục tên tuyến theo xã |
| `htkt_doi_tuong` (lĩnh vực đường) | nguồn chủ về thông số và hình học tuyến |
| `report_duong` | số liệu khai báo theo năm của xã, trỏ về hub qua `doiTuongId` |
| `assets` | lớp hiển thị GIS cũ, chỉ đọc; không nhập thêm |

Quy tắc khớp `report_duong` → `streets`:

| Điều kiện | Kết cục |
|---|---|
| Cùng xã, tên chuẩn hoá trùng, duy nhất | KHỚP CHẮC (hiện 780 dòng khớp tên thô) |
| Cùng xã, tên gần giống (`pg_trgm`, ngưỡng do người dùng chọn) | KHỚP NGHI NGỜ |
| Còn lại | KHÔNG KHỚP; giữ là đối tượng chỉ có trong báo cáo |

11 nhóm trùng trong `report_duong` (29 dòng): đưa hết vào hàng đợi đối soát, vì trùng tên + điểm đầu + điểm cuối có thể là hai đoạn khác mặt cắt. Không tự gộp.

Áp dụng quy tắc đơn vị đã có: chiều dài ≥ 20 km chỉ hợp lệ ở phường đô thị; ở xã khác giá trị ≥ 20 phải kiểm tra có phải mét hay không.

## M3. Nạp hub `htkt_doi_tuong` từ `report_*`

- Khoá định danh: `ma_doi_tuong`, do trigger `trg_htkt_truoc_ghi` tự cấp dạng `<mã xã>-<LV>-<NNNN>` khi thêm mới và cấm sửa về sau (đã đọc hàm 13/11/2026, VERIFIED). Script nạp không tự sinh mã.
- Lĩnh vực hợp lệ: `DUONG`, `CHIEU_SANG`, `CAY_XANH`, `CONG_VIEN`, `THOAT_NUOC_MUA`, `THOAT_NUOC_THAI`, `THOAT_NUOC_CHUNG`, `CAP_NUOC`, `BAI_DO_XE`.
- `report_thoat_nuoc` phải được phân loại vào một trong ba lĩnh vực thoát nước trước khi nạp. Cột `loaiNuoc` hiện có 97 giá trị, lẫn dữ liệu sai cột; chỉ các giá trị rõ nghĩa (`Nước mưa`, `NM`, `Nước thải`, `NT`, `Nước mưa và nước thải`…) phân loại tự động được, phần còn lại vào hàng đợi đối soát.
- `ma_xa` lấy từ `administrative_units.code` của `wardId`.
- Chỉ nạp dòng `DA_DUYET`.
- Sau khi nạp, gán `report_*.doiTuongId`. Trigger `trg_report_*_lien_ket` sẽ chạy; phải thử trên bản sao trước.

## M4. Dự án: `ds_du_an_gpmb` ↔ `projects` ↔ `cong_viec`

- Khoá khớp: `ds_du_an_gpmb.maDuAn` ↔ `projects.projectCode`.
- `projects` đang rỗng, nên việc đầu tiên là quyết định nguồn chủ. Đề xuất: `projects` là nguồn chủ; 36 dự án GPMB được tạo vào `projects` rồi gán `projectId`.
- `wardId`, `toChucId` của `ds_du_an_gpmb`: không suy từ tên dự án; cần người nhập.
- `cong_viec.duAnId`: chỉ gán khi người phụ trách chọn dự án, không khớp theo tiêu đề.

## M5. Nghiệp vụ thoát nước của Trung tâm Bảo trì

376 dòng thiếu `wardId`. Hai lĩnh vực còn lại có `diaBan` và `wardId` đầy đủ, lĩnh vực này cả hai đều trống.

Đã kiểm ở bước E0 (VERIFIED): `customFields` có khoá `toaDoLat`, `toaDoLng`, `viTri` nhưng toạ độ trống ở cả 376 bản ghi, nên không gán xã theo toạ độ được. `viTri` có nội dung ở 155 bản ghi; 57 bản ghi có `viTri` trùng đúng tên một tuyến trong `streets` và tuyến đó chỉ thuộc một xã.

Quy tắc: 57 bản ghi đó là KHỚP NGHI NGỜ (tên tuyến trùng chưa chắc cùng tuyến), đưa vào hàng đợi đối soát. 319 bản ghi còn lại không có căn cứ, để trống và chờ Trung tâm Bảo trì bổ sung.

## M6. Nhà thầu, chủ sở hữu công trình

`executing_units`, `qd72_utility_owners`, `httt_nang_luc_to_chuc`: khoá khớp đề xuất là mã số thuế. Đơn vị thuộc Sở thì trỏ `to_chuc_id`; đơn vị ngoài Sở cần một danh mục tổ chức ngoài. Việc này quyết định ở `SCHEMA_EVOLUTION_PLAN.md`, bước E5.

## M7. Hình học

Ba cách lưu cùng tồn tại: `latitude`/`longitude` float, `geojson` JSONB, `geometry` JSONB. Module mới dùng `geometry` JSONB dạng GeoJSON (WGS84) như hub và `qd72_*`. Không chuyển đổi dữ liệu cũ cho đến khi có quyết định về PostGIS.
