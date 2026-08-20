# QĐ 72/2026 — Kế hoạch kiểm thử (Mục 13)

Trạng thái: ✅ đã có · 🟡 chờ Prisma models (`prisma generate`) · ⚪ chờ UI. Dữ liệu DEMO ở `039_qd72_sample_data.sql`.

## A. Unit test — logic thuần (KHÔNG cần DB/generate) — ✅ ĐÃ CHẠY 17/17 PASS
File: [`lib/qd72/danh-gia.test.ts`](../../lib/qd72/danh-gia.test.ts) — chạy `node --experimental-strip-types lib/qd72/danh-gia.test.ts`.

| # (Mục 13) | Nội dung | Trạng thái |
|---|---|---|
| 1 | Tiêu chí giao thông (rộng ≥3,5 m: 3.0→không đạt, 4.0→đạt) | ✅ |
| 2 | Chiều cao thông thủy 4,5 m + cảnh báo đúng câu chữ 6.2.1.3 | ✅ |
| 3 | Thiếu dữ liệu → `CHUA_DU_DU_LIEU` (không tự "không đạt") | ✅ |
| 4 | Bán kính nguồn nước 400 m (≤) | ✅ |
| 5 | Khoảng cách trụ 150 m (≤) | ✅ |
| + | Ngưỡng phi số (dốc)→cần xác minh; INACTIVE→không áp dụng; luôn "sơ bộ" | ✅ |

## B. Integration test — API + phân quyền — 🟡 (viết sau `prisma generate`)
Dùng helper `suyVaiTro`/`coQuyen`/`coTheSua`/`duocXacMinhNhom` ([`lib/qd72/phan-quyen.ts`](../../lib/qd72/phan-quyen.ts)).

| # (Mục 13) | Kịch bản | Kỳ vọng |
|---|---|---|
| 6 | API CRUD theo vai trò | Xã tạo/sửa/gửi; Sở xem/trả lại/phê duyệt |
| 7 | Xã A KHÔNG sửa dữ liệu xã B | 403 (scope `wardId`) |
| 7b | Xã KHÔNG sửa hồ sơ đã xác minh | `coTheSua`=false khi trạng thái ≠ DRAFT/RETURNED |
| 8 | Đơn vị điện lực CHỈ xác minh trường điện | `duocXacMinhNhom(DON_VI_DIEN_LUC,'DIEN')`=true, `'VIEN_THONG'`=false |
| 9 | Doanh nghiệp viễn thông CHỈ xác minh cáp được phân công | route theo `LOAI_DOI_TUONG_TO_XAC_MINH` + `qd72_administrative_unit_assignments` |
| — | Fallback tài khoản lạ | `suyVaiTro`→`SO_KHAC` (chỉ XEM) |
| 10 | Lịch sử thay đổi | Mỗi chuyển trạng thái ghi `qd72_workflow_history` (cũ/mới/người/thời điểm/ý kiến) |
| 11 | Geometry hợp lệ (GeoJSON EPSG:4326) | reject geometry sai; validate frontend+backend |
| 12 | Upload ảnh | kiểm loại/kích thước; lưu `qd72_attachments` (storagePath+sha256); GPS từ ExifReader |

## C. E2E — quy trình đầy đủ — ⚪ (sau UI)
| # (Mục 13) | Luồng |
|---|---|
| 13 | Khảo sát → gửi → trả lại → bổ sung → xác minh liên ngành → phê duyệt (DRAFT→SUBMITTED→RETURNED→…→VERIFIED→APPROVED) |

## D. Migration & hồi quy — 🟡
| # (Mục 13) | Nội dung | Trạng thái |
|---|---|---|
| 14 | Migration & rollback | ✅ 037/038/039 có file rollback; đã verify áp dụng; rollback xoá đúng phạm vi (qd72_* / DEMO-%) |
| 15 | lint / typecheck / build / hồi quy | 🟡 ESLint sạch các file qd72; typecheck+build gộp vào cửa sổ `build:lowram` (RAM 6GB) |

## E. Dữ liệu DEMO để test thủ công (039)
Hồ sơ `DEMO-CASE-1` chứa: đường 3,0 m & cao 4,2 m (`DEMO-ROAD-1`); dây điện thấp 3,8 m (`DEMO-LINE-DIEN-1`); cáp VT võng (`DEMO-LINE-VT-1`); cáp vô chủ (`DEMO-LINE-UNKNOWN`); cáp ngừng dùng (`DEMO-LINE-UNUSED`); cần đèn cản trở (`DEMO-LAMP-1`); cột nghiêng (`DEMO-POLE-1`); phương án bó gọn + hạ ngầm; cống cáp dùng chung (`DEMO-SHARED-1`); nguồn nước thiếu (`DEMO-WATER-1`); kế hoạch đang thực hiện (`DEMO-PLAN-1`). `DEMO-CASE-2` = hồ sơ chưa đủ dữ liệu.
Gỡ sạch: chạy `039_qd72_sample_data_rollback.sql`.

## Kỳ vọng kiểm thử theo nguyên tắc QĐ72
- Thiếu dữ liệu/minh chứng → luôn **"Chưa đủ dữ liệu"**, KHÔNG "không đạt".
- Không tự kết luận vi phạm an toàn điện từ ảnh/chiều cao → yêu cầu **xác minh chuyên ngành**.
- Không mặc định hạ ngầm; phân biệt 6 nhóm phương án; cáp vô chủ → "Chưa xác định chủ sở hữu - cần phối hợp rà soát".
