# Bảng trung tâm đối tượng HTKT + số hiệu đường xã, đường thôn (QĐ 56/2025/QĐ-UBND)

Migration `049_htkt_doi_tuong_hub.sql` · tháng 10/2026 · Sở Xây dựng Quảng Trị

## 1. Căn cứ (đã đọc nguyên văn)

| Văn bản | Nội dung dùng |
|---|---|
| QĐ 56/2025/QĐ-UBND (hiệu lực 31/12/2025) — Quy định kèm theo | Đ3 k2: UBND cấp xã quản lý đường đô thị, đường xã, đường thôn, đường gom · Đ4 + Mẫu 01–04 · **Đ5**: số hiệu `ĐX.` / `Đth.` + số tự nhiên + chữ cái; bảng dải số 70 xã/đặc khu; UBND tỉnh đặt số hiệu đường xã, UBND cấp xã đặt số hiệu đường thôn |
| Luật Đường bộ 35/2024/QH15 Đ11 | k3: không bắt buộc đặt tên, số hiệu đường xã, đường thôn · k2: đoạn trùng tuyến dùng số hiệu cấp cao hơn |
| NĐ 165/2024/NĐ-CP Đ8 | cấu trúc số hiệu; k7 đường nhánh theo tên tuyến chính + số thứ tự |

### Phân tích bảng dải số Điều 5

- 70 đơn vị = 69 xã + đặc khu Cồn Cỏ. **8 phường không có dải** (đường trong phường là đường đô thị).
- Mỗi xã: **14 số ĐX** và **50 số Đth**, liên tiếp, không chồng nhau: ĐX 1–980, Đth 1–3500 (đã kiểm bằng máy: không hở, không chồng).
- Vì dải rời nhau nên `ĐX.15` là **duy nhất toàn tỉnh** — chỉ cần UNIQUE(cấp, số, chữ cái).
- Chữ cái: B, C, D, E, F, G, H, I, K, L, M, N (12 chữ — không có A, J). Sức chứa mỗi xã: 14 × 13 = 182 số hiệu ĐX; 50 × 13 = 650 số hiệu Đth.
- Chữ cái chỉ dùng khi số đó **đã đặt cho đường khác** (Đ5 k1 điểm c) → CSDL chặn `ĐX.2B` khi chưa có `ĐX.2`.
- Ghép theo **mã ĐVHC**, không theo tên: QĐ ghi "Tuyên Hoá" (CSDL "Tuyên Hóa"); QĐ ghi "Trung Thuần" — đúng tên chính thức (sapnhap.bando.com.vn, mã 19030), **CSDL đang ghi sai "Trung Thuận"**.
- Lệch giữa văn bản: NĐ 165 Đ8 k9c giao "UBND cấp huyện" đặt số hiệu đường xã (cấp huyện đã bỏ) → QĐ 56 giao UBND tỉnh. NĐ 165 Đ8 k3 chỉ nêu B, C, D; QĐ 56 mở rộng tới N.

## 2. Mô hình hub – nan hoa ("ít bảng, siêu liên kết qua mã xã")

```
administrative_units (code = mã ĐVHC)  ── +5 cột dải số Đ5 (EXCLUDE chống chồng dải)
        │ code
        ▼
htkt_doi_tuong  ◄── tuyen_duong_id (tự tham chiếu: đèn/cây/cống nằm trên tuyến; đường nhánh)
  (1 bảng cho 9 lĩnh vực)   ── street_id → streets (tuyến đô thị của mạng lưới cũ)
        ▲ doiTuongId
        │
report_duong · report_dien_cs · report_thoat_nuoc · report_cay_xanh
report_cong_vien · report_cap_nuoc · report_bai_do_xe     (Biểu mẫu hằng năm = ảnh chụp theo năm)
```

- **Một bảng mới duy nhất**. Hồ sơ gốc của đối tượng ở hub; Biểu mẫu hằng năm trỏ về hub → năm sau báo cáo lại vẫn là cùng một đối tượng.
- **Mã định danh** `<mã xã>-<LV>-<NNNN>` (vd `18904-CS-0007`) do trigger cấp, không đổi suốt vòng đời. LV: DG đường · CS chiếu sáng · CX cây xanh · CV công viên · TM thoát nước mưa · TT thoát nước thải · TC thoát nước chung · CN cấp nước · BX bãi đỗ xe.
- Tên xã/phường, số hiệu tuyến, nhãn bản đồ đều **JOIN động** (view `v_htkt_doi_tuong`) — sửa một chỗ, mọi nơi đổi theo.
- Cột chung có kiểu (mét, m², số lượng, năm, tình trạng) + `thong_so` JSONB cho thông số riêng từng lĩnh vực (lấy đúng cột của 7 Biểu mẫu hiện có).

## 3. CSDL tự bảo vệ (trigger `fn_htkt_truoc_ghi` + ràng buộc)

| Quy tắc | Cơ chế |
|---|---|
| Số hiệu trong dải của chính xã | trigger, báo "Số 15 ngoài dải ĐX. của Xã Dân Hóa: chỉ được dùng 1–14" |
| Không trùng toàn tỉnh | UNIQUE (cap_duong, sh_so, chữ cái) với dòng chưa xoá |
| Chữ cái chỉ cho đường thứ hai trở lên | trigger kiểm số gốc tồn tại |
| Chỉ đường xã/thôn có số Đ5; phường không có dải | CHECK + trigger |
| "Đã quyết định" phải có số + ngày QĐ | CHECK |
| Hai xã không chồng dải | EXCLUDE gist int4range |
| Toạ độ là [kinh độ, vĩ độ] WGS84 trong khung tỉnh; kiểu hình học hợp lĩnh vực | trigger (chặn đảo lat/lng, VN-2000) |
| Chiều dài / diện tích / tâm GIS | trigger tự tính (haversine, shoelace) |
| Lịch sử số hiệu (đổi, thu hồi, xoá) | trigger tự ghi `lich_su` |
| Dòng Biểu mẫu chỉ liên kết đối tượng cùng xã, đúng lĩnh vực | trigger chung trên 7 bảng report_* |

Hàm `fn_htkt_goi_y_so_hieu(mã xã, cấp, số gốc?)`: số tròn trống nhỏ nhất; hết số tròn mới dùng chữ cái; có số gốc → chữ cái tiếp theo.

## 4. Thẩm quyền trong ứng dụng

- Tài khoản xã/phường: chỉ đơn vị mình. Đường thôn: được chốt "Đã quyết định" (UBND cấp xã quyết định). Đường xã: **chỉ đề xuất** (giữ số); Phòng HTKT/admin chốt khi có QĐ UBND tỉnh; xã không sửa/xoá được số ĐX đã chốt.
- Cán bộ Sở khác: chỉ xem.

## 5. Màn hình & tệp

- `/dashboard/bao-cao/ha-tang-xa` — 78 xã/phường; tài khoản xã tự vào đơn vị mình.
- `/dashboard/bao-cao/ha-tang-xa/[mã xã]` — tab 9 lĩnh vực, dải số + gợi ý, bản đồ (ranh xã + đối tượng, nhãn số hiệu), form nhập (vẽ trên bản đồ / dán toạ độ Google Maps), **Nạp từ Biểu mẫu**, **Tải Excel lưu trữ**, cảnh báo dữ liệu.
- Excel: Tổng hợp · Mẫu 04 · Mẫu 03 · Mẫu 02 · Đường khác · 1 sheet/lĩnh vực · Dải số hiệu · Cảnh báo; mã đối tượng ở mọi sheet.
- Mã nguồn: `lib/htkt-doi-tuong/*`, `app/actions/htkt-doi-tuong.ts`, `app/api/htkt-doi-tuong/geojson`, `app/api/export/htkt-doi-tuong`, `components/htkt-doi-tuong/*`.

## 6. Nạp từ 7 Biểu mẫu (chạy thử trên dữ liệu thật, chỉ đọc)

- Thoát nước: tự phân loại 448/780 dòng (mưa 221, thải 62, chung 165); **332 dòng không rõ** (trống, "x", số 0,2…, "Giếng khoan", "Nhà máy nước Khe Sanh" — dữ liệu cấp nước nhập nhầm vào biểu thoát nước) → không tự nạp, liệt kê để xã nhập tay.
- Đường: nhận diện QL/ĐT (16 dòng: QL.9, QL.9B, ĐT.587…) thành "tham chiếu"; xã → "Chưa phân cấp" (xã phải tự xác định đường xã/thôn trước khi đặt số); phường → đường đô thị, tự gắn `streets` nếu trùng tên duy nhất.
- Tự gắn tuyến theo tên (khớp duy nhất): chiếu sáng 384/901, cây xanh 325/680, thoát nước 359/780.
- Chiều dài Biểu mẫu (km) → mét; toạ độ đầu/cuối lưu `thong_so.toaDoDau/toaDoCuoi` (bản đồ vẽ nét chấm "sơ bộ", không coi là hình học thật).

## 7. Việc tiếp theo

1. Sửa tên "Xã Trung Thuận" → "Xã Trung Thuần" trong `administrative_units` (mã 19030) — chờ xác nhận.
2. Bật PostGIS → đổi `geometry` sang `geometry(Geometry,4326)` + ST_Within ranh xã trong CSDL.
3. Nhập Excel ngược (theo mã đối tượng) để xã cập nhật hàng loạt.
4. Gắn lớp hub vào bản đồ GIS tổng (`components/gis/map-client.tsx`).
