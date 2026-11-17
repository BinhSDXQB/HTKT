# DATA_REUSE_MATRIX — Ma trận tái sử dụng dữ liệu

Mốc số liệu: 13/11/2026 (VERIFIED số đếm). Phân loại: **ĐÃ CÓ** · **TÁI SỬ DỤNG** · **CẦN MỞ RỘNG** · **CẦN TẠO MỚI** · **CẦN ĐỐI SOÁT**.

Quy tắc dùng: trước khi thêm bảng cho module mới, tra thực thể ở đây. Nếu đã có nguồn chủ thì nối bằng khoá ngoại, view hoặc API; không tạo bảng song song.

## 1. Dữ liệu chủ

| Thực thể | Nguồn chủ | Dòng | Phân loại | Cách tái sử dụng | Việc phải làm trước |
|---|---|---:|---|---|---|
| Đơn vị, phòng, ban | `to_chuc` | 25 | TÁI SỬ DỤNG | FK `to_chuc_id` | `donViHCId` và `maSoThue` trống cả 25 dòng: bổ sung khi module cần |
| Chức danh | `chuc_danh` | 25 | TÁI SỬ DỤNG | FK `chuc_danh_id` | — |
| Địa bàn xã/phường | `administrative_units` | 79 | TÁI SỬ DỤNG | FK `ward_id` hoặc `ma_xa` (theo `code`) | — |
| Tài khoản | `users` | 220 | TÁI SỬ DỤNG | FK `*_by_id` | — |
| Nhân sự | `can_bo` | 164 | TÁI SỬ DỤNG + CẦN ĐỐI SOÁT | FK `can_bo_id`; nhớ che CCCD, lương | Mục 1 của `DATA_INTEGRITY_REPORT.md` |
| Phân công (kiêm nhiệm, lịch sử) | `phan_cong` | 103 | CẦN ĐỐI SOÁT | — | 61 cán bộ thiếu phân công chính |
| Vai trò, quyền | `roles`, `permissions`, `role_permissions` | 4 / 79 / 156 | TÁI SỬ DỤNG | thêm dòng `permissions`, không thêm bảng | — |
| Lãnh đạo xã | `lanh_dao_xa` | 455 | TÁI SỬ DỤNG | tra theo `wardId` | — |
| Tuyến đường (danh mục) | `streets` | 929 | CẦN ĐỐI SOÁT | FK `street_id` | Mới phủ 20/78 xã; trùng vai với `assets` và `report_duong` |
| Đối tượng HTKT (9 lĩnh vực) | `htkt_doi_tuong` | 0 | ĐÃ CÓ khung | FK `doi_tuong_id` | Chưa nạp dữ liệu |
| Văn bản pháp lý | `tai_lieu`, `tai_lieu_chunk` | 201 / 25.627 | TÁI SỬ DỤNG | tra qua RAG, không chép căn cứ vào mã | 12 văn bản `can_kiem_chung` |
| Dự án | `projects` (0) · `ds_du_an_gpmb` (36) | — | CẦN ĐỐI SOÁT | — | Chọn nguồn chủ; hiện hai bảng chưa nối |
| Nhà thầu, chủ sở hữu công trình | `executing_units` (0) · `qd72_utility_owners` (2) · `httt_nang_luc_to_chuc` (0) | — | CẦN ĐỐI SOÁT | — | Ba bảng cùng vai trò; chọn một nguồn chủ trước khi có dữ liệu thật |

## 2. Dữ liệu nghiệp vụ

| Nhóm | Bảng | Dòng | Phân loại | Ghi chú |
|---|---|---:|---|---|
| Báo cáo HTKT xã | `report_duong`, `report_dien_cs`, `report_thoat_nuoc`, `report_cay_xanh`, `report_bai_do_xe` | 3.715 | TÁI SỬ DỤNG | 21–23/78 xã, năm 2025, toàn bộ `DA_DUYET` |
| Báo cáo HTKT xã (chưa có số liệu) | `report_cap_nuoc`, `report_cong_vien`, `ward_reports` | 0 | ĐÃ CÓ khung | có mã đọc/ghi |
| Tổng hợp theo xã | view `v_htkt_*_xa`, `v_htkt_tong_hop_xa` | — | TÁI SỬ DỤNG | nguồn chung cho dashboard, chatbot, Excel |
| Khai báo, độ dài GIS theo xã | `ward_khai_bao`, `ward_gis_length` | 59 / 77 | TÁI SỬ DỤNG | — |
| Công việc phòng/ban | `cong_viec` + `_loai`, `_nhat_ky`, `_thanh_vien`, `_check_list` | 91 | TÁI SỬ DỤNG | lõi chung 11 phòng; mới 5 phòng có việc |
| Nghiệp vụ động | `nghiep_vu_ban_ghi` | 532 | TÁI SỬ DỤNG + CẦN MỞ RỘNG | thực tế 3 lĩnh vực của Trung tâm Bảo trì |
| Lương, thi đua, kỷ luật, đánh giá | `office_*` trừ nghỉ phép (11 bảng) | 432 | TÁI SỬ DỤNG | dữ liệu nhạy cảm, chỉ nhóm được phép |
| Nghỉ phép, làm thêm giờ | `office_leave_*`, `overtime_*` | 384 | TÁI SỬ DỤNG | — |
| Con cán bộ | `con_can_bo`, `thanh_tich_con` | 163 / 174 | TÁI SỬ DỤNG | — |
| QĐ 72 | `qd72_*` (28 bảng) | 50 | ĐÃ CÓ | phần lớn dữ liệu mẫu (mig 039) |
| Liên thông HĐXD, CCHN | `httt_*`, `cchn_*` | 0 | ĐÃ CÓ khung | có mã, chưa có dữ liệu |
| Cấp phép giao thông | `oversized_*`, `permit_*`, `road_*` | 3 | ĐÃ CÓ | gần như chưa dùng |
| BIM | `bim_*` (6 bảng) | 0 | ĐÃ CÓ khung | — |
| Tài sản, sự cố, lệnh việc, vật tư, kiểm tra | `assets` (929), `incidents`, `work_orders`, `materials`, `inspections`… | 0 trừ `assets` | ĐÃ CÓ khung | module bảo trì mới phải dùng lại, không tạo bảng mới |
| Mạng lưới chi tiết | `den_chieu_sang`, `ho_ga`, `cong_thoat_nuoc`, `ong_cap_nuoc`, `van_cap_nuoc`, `cap_vien_thong`, `via_he`, `cay_xanh_duong`, `tuyen_mang_luoi`, `doan_tuyen_*`, `tram_bom`, `nha_may_xu_ly_nuoc_thai` | 0 | CẦN ĐỐI SOÁT | trùng phạm vi với hub `htkt_doi_tuong`; quyết định giữ hay ngừng dùng |

## 3. Năng lực nền

| Năng lực | Hiện có | Phân loại |
|---|---|---|
| Audit | `lib/audit.ts` → `audit_logs`; phủ không đều theo module | CẦN MỞ RỘNG |
| Transaction | `$transaction` ở 10 tệp | CẦN MỞ RỘNG |
| Idempotency | 2 tệp (`lib/ai-content/kho.ts`, `lib/tham-dinh/phien-tai-len.ts`) | CẦN MỞ RỘNG |
| Kiểm tra phiên bản bản ghi | không có cột `version`, không có mã so phiên bản | CẦN TẠO MỚI |
| Hàng đợi đối soát xung đột | không có | CẦN TẠO MỚI |
| Trường động, cấu hình biểu mẫu | `cong_viec_loai.fieldSchema`, các cột JSONB | CẦN MỞ RỘNG |
| Quản lý phiên bản trường, ngừng dùng trường | không có | CẦN TẠO MỚI |
| Xoá mềm | có ở bảng mới; bảng cũ không có | CẦN MỞ RỘNG |
| Tablet, ngoại tuyến | không có service worker, IndexedDB, manifest | CẦN TẠO MỚI |
| Hình học GIS | lat/lng float, `geojson` JSONB, `geometry` JSONB cùng tồn tại; chưa PostGIS | CẦN ĐỐI SOÁT |
| Nhập Excel an toàn | skill `nhap-excel`, script import idempotent | TÁI SỬ DỤNG |
| Tìm kiếm ngữ nghĩa | pgvector HNSW trên `tai_lieu_chunk` | TÁI SỬ DỤNG |

## 4. Giới hạn

Cột "có mã đọc/ghi" dựa trên quét regex 703 tệp, bỏ sót truy vấn lồng qua `include`. Coi là INFERRED; trước khi kết luận một bảng không còn dùng phải grep lại theo tên model.
