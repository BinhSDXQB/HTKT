# DATA_INTEGRITY_REPORT — Báo cáo toàn vẹn dữ liệu

Mốc: 13/11/2026. Nguồn: truy vấn đếm trong giao dịch `READ ONLY`. Chỉ ghi số đếm; không ghi CCCD, họ tên, lương. Mọi số VERIFIED; nguyên nhân ghi INFERRED hoặc UNKNOWN.

## Kết quả sạch

| Kiểm tra | Kết quả |
|---|---|
| Bảng thiếu khoá chính | 0 |
| `can_bo` trùng CCCD | 0 |
| `can_bo` trùng họ tên + ngày sinh | 0 |
| `can_bo.userId` trùng | 0 |
| Tài khoản nội bộ (có `toChucId`) không có hồ sơ cán bộ | 0 |
| `streets` thiếu `wardId` | 0 |
| `streets` trùng (tên, xã) | 0 |
| Khoá ngoại mềm mồ côi (32 cột, `check-fk-mo-coi.mjs`) | 0 |
| Prisma lệch CSDL | 0 bảng |

## Vấn đề phải đối soát

### 1. Tổ chức, nhân sự — mức HIGH

| Kiểm tra | Số |
|---|---:|
| Cán bộ không có `phan_cong` chính | 61 / 164 |
| Phân công chính lệch `can_bo.toChucId` | 3 |
| Phân công chính lệch `can_bo.chucDanhId` | 14 |
| `can_bo.toChucId` lệch `users.toChucId` | 3 |
| `can_bo` thiếu `chucDanhId` | 18 |
| `can_bo` còn dữ liệu ở cột chữ cũ `chucVu` / `phongBan` | 163 / 163 |
| `can_bo` không có tài khoản | 23 |
| CCCD không đúng 12 chữ số | 20 |
| Tài khoản không thuộc đơn vị lẫn xã | 1 |

Nhận định (INFERRED): `can_bo` đang là nguồn thật về đơn vị và chức danh; `phan_cong` chưa được duy trì sau khi thêm cán bộ mới. Memory tháng 7/2026 ghi đã backfill 103→145, nhưng con số đó thuộc schema `org_v2`, nay cả 5 bảng `org_v2` đều 0 dòng, còn `public.phan_cong` vẫn 103.

Về 20 CCCD sai định dạng: memory ghi 4 người chờ cấp số thật; 16 trường hợp còn lại UNKNOWN.

Rủi ro: module mới nào đọc đơn vị hoặc chức danh qua `phan_cong` sẽ thiếu 61 người.

### 2. Tuyến đường có ba nguồn — mức HIGH

| Kiểm tra | Số |
|---|---:|
| `streets` | 929 dòng, 20 xã |
| `assets` (toàn bộ `GIAO_THONG`: 633 điểm, 296 tuyến) | 929 dòng |
| `assets.name` trùng `streets.name` | 929 |
| `assets.assetCode` trùng `streets.code` | 0 |
| `report_duong` (2025, `DA_DUYET`) | 1.342 dòng, 21 xã |
| `report_duong` khớp tên `streets` cùng xã | 780 |
| `report_duong` trùng theo (xã, năm, tên, điểm đầu, điểm cuối) | 11 nhóm, 29 dòng |

Nhận định (INFERRED): `assets` và `streets` cùng sinh từ một lần nhập GIS. Chưa xác định 562 dòng `report_duong` không khớp tên là đường mới hay khác cách viết.

### 3. Hub `htkt_doi_tuong` chưa nạp — mức MEDIUM

- `htkt_doi_tuong`: 0 dòng, dù có 23 khoá ngoại trỏ vào và trigger liên kết trên 7 bảng `report_*`.
- `doiTuongId` trống ở toàn bộ 3.715 dòng `report_*`.
- Không dòng `report_duong` nào có toạ độ đầu tuyến.

### 4. Dự án chưa liên kết — mức MEDIUM

- `projects`: 0 dòng. `ds_du_an_gpmb`: 36 dòng, đủ `maDuAn`.
- `ds_du_an_gpmb`: `projectId`, `congViecId`, `wardId`, `toChucId` trống cả 36 dòng.
- `cong_viec.duAnId`, `workOrderId`, `incidentId` trống cả 91 dòng.

### 5. Nghiệp vụ động thiếu địa bàn — mức MEDIUM

| Lĩnh vực | Dòng | Có `wardId` |
|---|---:|---:|
| `trung-tam-bao-tri/thoat-nuoc` | 376 | 0 |
| `trung-tam-bao-tri/chieu-sang` | 115 | 115 |
| `trung-tam-bao-tri/tuyen-duong-mat-cat-lon` | 39 | 39 |

### 6. Việc nhỏ — mức LOW

- 4 khoá ngoại thiếu index: `cchn_ho_so_to_chuc_id_fkey`, `cchn_ho_so_created_by_id_fkey`, `cchn_lich_su_nguoi_id_fkey`, `thanh_tich_con_createdById_fkey`.
- `to_chuc.donViHCId` và `to_chuc.maSoThue` trống cả 25 dòng (cột `maSoThue` thêm ở mig 042).
- `qd72_utility_owners.to_chuc_id` trống cả 2 dòng.
- 12 văn bản trong `tai_lieu` ở trạng thái `can_kiem_chung`, 1 `du_thao`, 1 `het_hieu_luc`.
- Schema `org_v2` còn 5 bảng rỗng và 1 view.
- Audit theo module: `admin` 462, `office` 224, `chatbot` 189, `bao_cao` 56, `htkt` 18, `cap_phep` 3, `tai_san` 1. Các thao tác ghi của HTKT, công việc, nghiệp vụ động gần như không có vết.

## Cập nhật sau bước E0

Chi tiết theo từng bản ghi: `DOI_SOAT_E0_2026-11-13.md`. Ba điểm làm rõ thêm so với các mục trên:

- 20 số định danh sai định dạng gồm 19 mã tạm và 1 số 9 chữ số; không còn trường hợp UNKNOWN.
- Nhóm trùng `report_duong` là 10 khi so cả chữ hoa/thường của điểm đầu, điểm cuối (11 khi không phân biệt); chỉ 2 nhóm giống hệt nhau về thông số.
- `report_thoat_nuoc.loaiNuoc` có 97 giá trị khác nhau, trong đó 146 dòng là số và một số dòng là tên nguồn nước: dấu hiệu lệch cột khi nhập. Phải làm sạch trước khi phân loại mưa / thải / chung để nạp hub.

## Chưa kiểm (NOT_RUN)

- So khớp số tổng hợp trên dashboard và Excel với view `v_htkt_*_xa`.
- Tính đúng của giá trị nghiệp vụ (hệ số lương, ngày nghỉ hưu, chiều dài đường). Quy tắc "đường ≥ 20 km chỉ hợp lệ ở phường đô thị" chưa chạy lại.
- 25 cột khoá ngoại mềm nằm ngoài danh sách của `check-fk-mo-coi.mjs` (57 cột mềm, script kiểm 32).
- Kiểm tra vượt quyền truy cập ở tầng API.
