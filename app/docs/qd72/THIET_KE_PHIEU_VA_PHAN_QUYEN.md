# QĐ 72/2026 — Thiết kế 6 phiếu, wizard 8 bước & ma trận phân quyền

Tài liệu thiết kế phục vụ ráp nhanh khi có Prisma models. **Nguồn cấu hình (source of truth):**
- Trường 6 phiếu + wizard: [`lib/qd72/phieu-schema.ts`](../../lib/qd72/phieu-schema.ts)
- Ma trận phân quyền: [`lib/qd72/phan-quyen.ts`](../../lib/qd72/phan-quyen.ts)
- Engine đánh giá sơ bộ: [`lib/qd72/danh-gia.ts`](../../lib/qd72/danh-gia.ts) (17/17 test PASS)
- CSDL: migrations `037` (cấu hình pháp lý/tiêu chí) + `038` (26 bảng lõi)

## 1. Nguyên tắc thiết kế
- Mỗi field ánh xạ **1 cột định kiểu** (`col`, migration 038) hoặc lưu **`chi_tiet` JSONB** (khi bỏ `col`) — mô hình “kết hợp 2 lớp” như phần còn lại của hệ thống.
- Field có thể ghi vào **bảng khác bảng chính** của phiếu qua `table` (vd cột cấp hồ sơ → `qd72_survey_cases`; số đo → bảng con/bảng đo). Field bảng đo có `nguon` (mặc định `XA_KHAI`) — đơn vị chuyên ngành xác minh tạo **bản ghi riêng** `nguon='XAC_MINH'`, KHÔNG ghi đè số liệu xã khai.
- Field có `rule` (mã tiêu chí) → hiển thị **đánh giá sơ bộ** ngay khi nhập (gọi `danhGiaTieuChi`), thiếu dữ liệu → “Chưa đủ dữ liệu”.
- Số liệu **xã khai ↔ xác minh** tách vật lý: bảng đo (`qd72_clearance_measurements`, `qd72_water_test_results`) có cột `nguon` = `XA_KHAI | DO_LAI | XAC_MINH`.
- Geometry: GeoJSON trong `jsonb` (EPSG:4326) + `tam_lat/tam_lng`; vẽ bằng MapLibre; ảnh tự gắn GPS (ExifReader).

## 2. Sáu phiếu & bảng dữ liệu

| Phiếu | Tên | Bảng chính | Geometry | Bảng con |
|---|---|---|---|---|
| 01 | Thông tin khu vực đô thị | `qd72_urban_areas` | Polygon | — |
| 02 | Khảo sát giao thông phục vụ chữa cháy | `qd72_road_segments` | LineString | passing_bays, fire_parking_areas, road_obstacles |
| 03 | Dây, cáp, điện chiếu sáng & vật cản trên cao | `qd72_overhead_utility_lines` | LineString | utility_poles, utility_crossings, clearance_measurements, public_lighting_assets, undergrounding_proposals |
| 04 | Nguồn nước chữa cháy | `qd72_water_sources` | Point | fire_hydrants, water_test_results, water_intake_points |
| 05 | Biên bản xác minh liên ngành | `qd72_verification_records` | — | verification_items |
| 06 | Kế hoạch cải tạo, chỉnh trang | `qd72_renovation_plans` | Point/Line/Polygon | renovation_tasks |

**Trường gắn tiêu chí sơ bộ (`rule`):** rộng≥3.5m (`ROAD_MIN_WIDTH`), cao≥4.5m (`CLEARANCE_MIN_HEIGHT`), dốc≤1:8,3 (`APPROACH_MAX_SLOPE`), cụt>46m (`DEADEND_TURN_LENGTH`), điểm tránh≤100m (`PASSINGBAY_MAX_SPACING`); nguồn nước: DN (`PIPE_MIN_DIAMETER`), cụt≤200m (`DEADEND_PIPE_MAX_LENGTH`), trụ≤150m (`HYDRANT_MAX_SPACING`), bán kính≤400m (`WATER_SERVICE_RADIUS`), ≥25 L/s (`WATER_FLOW_TWO_SOURCES`), áp≥10m (`WATER_MIN_PRESSURE`), 3h (`FIRE_DURATION_DEFAULT`).

## 3. Wizard 8 bước (UBND xã/phường khảo sát)

1. **Thông tin chung** (Phiếu 01) — 2. **Ranh giới khu vực** (Polygon; không mặc định toàn xã) — 3. **Giao thông** (Phiếu 02) — 4. **Dây/cáp/chiếu sáng & vật cản trên cao** (Phiếu 03) — 5. **Nguồn nước** (Phiếu 04) — 6. **Ảnh & minh chứng** (chụp GPS, nén ảnh) — 7. **Đề xuất giải pháp SƠ BỘ** (xã đề xuất theo từng đối tượng) — 8. **Kiểm tra & gửi** (cảnh báo trường thiếu + đánh giá sơ bộ; DRAFT→SUBMITTED).

> **Lưu ý (Codex review):** Bước 7 chỉ là ĐỀ XUẤT SƠ BỘ của xã (đã nhập tại Phiếu 02/03/04). **Kế hoạch chính thức (Phiếu 06 → `qd72_renovation_plans`)** do Sở Xây dựng lập/tổng hợp **sau** xác minh liên ngành — KHÔNG nằm trong wizard xã.

Tự động lưu nháp mọi bước; thanh tiến độ; xem trước hồ sơ. **Phiếu 05** (xác minh liên ngành) và thẩm định **Phiếu 06** nằm ở luồng riêng **sau khi gửi** (không trong wizard xã).

## 4. Ma trận phân quyền (Mục 7)

| Vai trò | Phạm vi | Hành động chính | Xác minh nhóm | Ràng buộc |
|---|---|---|---|---|
| UBND xã/phường | Địa bàn | Tạo/Sửa gốc/Gửi/Bổ sung | — | Không sửa hồ sơ đã xác minh; không tự xác nhận tải trọng/lưu lượng/an toàn điện |
| Sở Xây dựng | Toàn tỉnh | Xem/Trả lại/Phê duyệt/Tổng hợp/Cấu hình tiêu chí | — | Quản trị cấu hình tiêu chí |
| Công an tỉnh | Toàn tỉnh | Xem/Xác minh | PCCC (giao thông, chiều cao, nguồn nước) | Không sửa số liệu gốc |
| Sở Công Thương | Toàn tỉnh | Xem/Xác minh | Điện | Xác định chủ sở hữu điện |
| Đơn vị điện lực | Phân công | Xem/Xác minh | Điện | Theo địa bàn/tài sản được giao |
| Sở KH&CN | Toàn tỉnh | Xem/Xác minh | Viễn thông | — |
| Doanh nghiệp viễn thông | Phân công | Xem/Xác minh | Viễn thông | Chỉ cáp được phân công |
| Đơn vị chiếu sáng | Phân công | Xem/Xác minh | Chiếu sáng | — |
| Đơn vị cấp nước | Phân công | Xem/Xác minh | Cấp nước | Xác minh lưu lượng/áp lực/ống/trụ |
| Quản trị viên | Toàn tỉnh | Tất cả | Tất cả | Quản lý tài khoản/địa bàn/vai trò/tiêu chí/nhật ký |

- **Suy vai trò** (`suyVaiTro`): admin→Quản trị; có `wardId`→Xã/phường; mã `to_chuc`→tra `ORG_MA_TO_VAITRO`; LANH_DAO_SO/Phòng HTKT→Sở Xây dựng.
- **Xác minh dòng dây/cáp** lọc theo `LOAI_DOI_TUONG_TO_XAC_MINH` (điện→điện lực/Công Thương; cáp→viễn thông/KH&CN; dây chiếu sáng→đơn vị chiếu sáng).
- Enforcement thực thi ở **API (CP3)** trên backend (Nguyên tắc #12 an toàn/bảo mật).

## 5. Giả định & việc cần xác nhận
1. **Tài khoản đơn vị ngoài Sở** (Công an, điện lực, cấp nước, viễn thông, chiếu sáng): cần tạo `to_chuc` + gán `ma` → điền `ORG_MA_TO_VAITRO` (hiện để trống, chờ mã thực tế).
2. **Phân công địa bàn/tài sản** cho đơn vị điện lực/viễn thông/cấp nước qua bảng `qd72_administrative_unit_assignments` (vai_tro + owner_id).
3. `col` chưa có trong 038 (vd chi tiết cột đèn, độ võng đo, nhiều ảnh…) tạm lưu `chi_tiet` JSONB — có thể “thăng” thành cột khi cần thống kê nặng (migration bổ sung sau).
4. Trường ảnh (`type: 'photo'`) lưu qua `qd72_attachments` (storagePath riêng + sha256), không nhúng vào bản ghi.

## 6. Bước ráp khi có Prisma models (CP3+)
1. `prisma generate` (models 28 bảng qd72_*).
2. API CRUD theo từng phiếu + upload ảnh (tái dùng mẫu BimFile) + engine đánh giá sơ bộ.
3. Enforcement phân quyền (`suyVaiTro`/`coQuyen`/`duocXacMinhNhom`) + scope `wardId`.
4. UI wizard 8 bước (mobile-first) + bản đồ GIS.
