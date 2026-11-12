# Ánh xạ từng trường: bảng cấp nước, thoát nước của HTKT ↔ Từ điển dữ liệu QĐ 1852/QĐ-BXD

Ngày: 2026-11-12 · Chỉ đọc. Tiếp theo `DOI_CHIEU_TU_DIEN_DU_LIEU_BXD_2026-11.md`.
Nguồn: QĐ 1852/QĐ-BXD ngày 27/10/2026 (bảng từ vựng trích bằng `pdfplumber`, đã đọc định nghĩa rút gọn của cả 171 mã và đọc đủ dòng 23 mã dùng cho ánh xạ) · `app/prisma/schema.prisma` (dòng ghi ở từng bảng) · `app/prisma/migrations_manual/049_htkt_doi_tuong_hub.sql`.
Mã viết gọn: CTN-nnn = BXD-CTN-nnn; XDDT-nnn = BXD-XDDT-nnn; CDE-nnn = BXD-CDE-nnn. Mã trường của TT 69/2026 (CN-…, TN-…) ghi theo cột "Pháp lý" của từ điển.

Mức khớp: **Khớp** = cùng ý nghĩa, chỉ đổi tên · **Quy đổi** = cùng đại lượng, phải đổi đơn vị/kiểu/danh mục · **Tổng hợp** = HTKT lưu chi tiết, từ điển cần số tổng · **Một phần** = HTKT chỉ có một phần nội dung · **Không có từ vựng** = từ điển không yêu cầu mức chi tiết này.

## 1. Điểm mấu chốt trước khi đọc bảng

1. **Từ điển không yêu cầu số hoá chi tiết mạng lưới.** Ghi chú của CTN-022 (sơ đồ, vị trí tuyến): bản đồ mạng lưới hiện có quản lý dưới dạng tài liệu đính kèm, "không phát sinh yêu cầu số hóa chi tiết toàn bộ mạng lưới". Các trường chiều dài (CTN-046, 047, 075, 076, 095, 096) đều là **tổng chiều dài, đơn vị km**. HTKT lưu từng đoạn ống, đoạn cống, hố ga, van (đơn vị m) → chi tiết hơn từ điển; dùng được bằng cách cộng tổng.
2. **Mã định danh địa điểm không được tự tạo.** CTN-002, CTN-086: chỉ ghi khi CSDL định danh địa điểm (NĐ 326/2026) xác lập. HTKT chỉ cần cột để nhận mã.
3. **Bốn loại mã lưu ở trường riêng** (quy ước chung mục 5): mã định danh chuyên ngành, mã định danh địa điểm, mã đơn vị hành chính, mã tham chiếu hệ thống nguồn. Mã `maCS`/`maTS`/`maTuyen` của HTKT đúng vai trò **mã tham chiếu nguồn (CTN-004)**; mã định danh chuyên ngành (CTN-001) do hệ thống của Bộ tạo hoặc kế thừa.
4. **Toạ độ:** từ điển lưu chính thức theo hệ quy chiếu quốc gia (CTN-121), toạ độ công trình là CDE-031/032 kiểu chuỗi. HTKT lưu `latitude`/`longitude` WGS84 → phải chuyển hệ khi xuất.
5. **Số liệu theo kỳ** (sản lượng, lượng nước thải, tỷ lệ, sự cố, bùn) gắn với Kỳ báo cáo (XDDT-009). HTKT không có bảng số liệu theo kỳ cho cấp thoát nước.

## 2. `NhaMayXuLyNuocThai` (schema.prisma:706)

| Trường HTKT | Kiểu | Từ vựng | Tên kỹ thuật | Mức khớp | Ghi chú |
|---|---|---|---|---|---|
| `maCS` | String | CTN-004 (và XDDT-012 nếu Bộ kế thừa) | MaThamChieuNguon / MaNhaMay | Khớp | Độ dài tối đa 50 |
| — | — | CTN-001 | MaDinhDanhChuyenNganh | Thiếu | Cần cột nhận mã do Bộ cấp |
| — | — | CTN-002, CTN-003 | MaDinhDanhDiaDiem, MaLoaiDoiTuongDiaDiem | Thiếu | Chỉ nhận, không tự tạo |
| `ten` | String | XDDT-029 | TenNhaMay | Khớp | |
| `wardId` | FK | CDE-037 (+ CDE-028) | XaPhuong, TinhThanh | Quy đổi | Xuất mã đơn vị hành chính, không xuất id nội bộ |
| `diaChi` | String | CDE-002 | DiaChi (Object) | Quy đổi | Từ điển là đối tượng có cấu trúc |
| `latitude`, `longitude` | Float | CDE-031, CDE-032 | ToaDoX, ToaDoY | Quy đổi | Chuyển WGS84 → hệ toạ độ quốc gia; kèm CTN-121 |
| `dienTichHa` | Float | — | — | Không có từ vựng | |
| `congSuatThietKeM3Ngay` | Float | XDDT-031 (TN-B-22) | TongCongSuatThietKe | Khớp | Cùng đơn vị m³/ngày đêm |
| `congSuatHienTaiM3Ngay` | Float | XDDT-001 (TN-B-23) | CongSuatVanHanh | Khớp | |
| `congNghe` | String tự do | CTN-073 (TN-B-25) | CongNgheXuLyNuocThai | Quy đổi | Từ điển dùng danh mục DM08; HTKT ghi chữ (A2O, MBR…) |
| `tieuchuanXaThai` | String | CTN-085 (một thành phần) | GiayPhepMoiTruong | Một phần | Từ điển cần số, ngày, cơ quan cấp, thời hạn, lưu lượng, điểm xả của giấy phép |
| `nguonTiepNhan` | String | CTN-067 / XDDT-020 | PhamViDichVuThoatNuoc / PhamViThuGomXuLy | Một phần | HTKT ghi chữ; từ điển cần danh sách đơn vị hành chính, khu vực |
| `noiXaThai` | String | CTN-086 (TN-B-39) | DiemXaSauXuLy | Một phần | Từ điển cần bản ghi điểm xả: mã, toạ độ, tên nguồn tiếp nhận, trạng thái, giấy phép liên kết |
| `namDuaVaoSuDung` | Int | — | — | Không có từ vựng | CTN-035 chỉ áp cho nhà máy nước |
| `donViQuanLy` | String | CTN-066, CTN-072 | HopDongQuanLyVanHanh, ChuSoHuuCongTrinh | Một phần | Từ điển cần tên + mã định danh tổ chức (CTN-027), tách chủ sở hữu và đơn vị vận hành |
| `trangThai` | Enum | CDE-029 | TinhTrangHoatDong | Quy đổi | Danh mục DM03 |
| `tinhTrang` | Enum | — | — | Không có từ vựng | Chất lượng kỹ thuật công trình |

Từ vựng về nhà máy xử lý nước thải mà HTKT **chưa có nguồn**: CTN-074 (công trình xử lý phi tập trung), CTN-079…084 (lượng nước thải phát sinh, thu gom, đầu vào, sau xử lý, hai tỷ lệ), CTN-085 (giấy phép môi trường đầy đủ), CTN-087…088 (tái sử dụng), CTN-091…094 (quan trắc đầu vào, sau xử lý).

## 3. `TramBom` (schema.prisma:738)

Trường `loai` quyết định từ vựng đích: `NUOC_THAI` → CTN-077 + CTN-078; `THOAT_NUOC` → CTN-097 + CTN-078; `CAP_NUOC` → CTN-052; `PHONG_CHAY` → ngoài phạm vi từ điển.

| Trường HTKT | Từ vựng | Mức khớp | Ghi chú |
|---|---|---|---|
| `maCS` | CTN-004 | Khớp | CTN-001 thiếu, như mục 2 |
| `ten` | thành phần "Tên" của CTN-077/097/052 | Khớp | |
| `loai` | DM09 (trạm bơm cấp nước) / phân nhánh như trên | Quy đổi | |
| `diaChi`, `wardId` | CDE-002, CDE-037 | Quy đổi | |
| `latitude`, `longitude` | CDE-031, CDE-032 | Quy đổi | Chuyển hệ toạ độ |
| `nhaMayXuLyId` | "Hệ thống và công trình liên kết" của CTN-077 | Khớp | Xuất mã nhà máy |
| `luuLuongThietKeM3h` | "Công suất thiết kế" của CTN-078 (TN-B-31, TN-D-53) | Khớp | Từ điển nhận m³/giờ (nước mưa nhận cả m³/giây) |
| — | "Công suất vận hành" của CTN-078 | Thiếu | Đối soát hằng tháng |
| `trangThai` | "Tình trạng hoạt động" của CTN-078 (DM03) | Quy đổi | |
| `soBom`, `congSuatMoiBomKW`, `caoTrinh`, `nguonDienKV`, `coMayPhatDuPhong`, `coHoThuNuoc`, `dungTichHoM3`, `dienTichM2`, `namXayDung`, `lyTrinhM`, `streetId` | — | Không có từ vựng | Chi tiết kỹ thuật riêng của HTKT |
| `donViQuanLy` | CTN-066 | Một phần | |

## 4. `CongThoatNuoc` (schema.prisma:449), `DoanTuyenCong` (662), `HoGa` (412)

| Trường HTKT | Từ vựng | Mức khớp | Ghi chú |
|---|---|---|---|
| `chieuDaiM` cộng theo `loaiNuoc = MUA` | CTN-096 (TN-D-51) | Tổng hợp | m → km; "tuyến cống thoát nước mưa **chính**" — HTKT không đánh dấu cống chính |
| `chieuDaiM` cộng theo `loaiNuoc = THAI/CHUNG` | CTN-075 (TN-B-28), CTN-076 (TN-B-29) | Tổng hợp, thiếu khoá phân tổ | Từ điển tách **cống cấp 1** (dẫn đến nhà máy) và **cấp 2** (thu gom khu vực): HTKT không có cột cấp cống |
| `loaiNuoc` (MUA/THAI/CHUNG) | CTN-014 | Quy đổi | Danh mục DM19: hệ thống chung, riêng, nửa riêng, khác — phân loại theo **hệ thống**, không theo từng đoạn |
| hình học tuyến (lý trình trên `Street`) | CTN-022 | Một phần | HTKT định vị bằng lý trình; từ điển là hình học dạng đường, không bắt buộc số hoá toàn bộ |
| `hinhDang`, `dkTrongMm`, `rong_Mm`, `cao_Mm`, `vatLieu`, `doSauDinhCongM`, `caoDoDayCongM`, `doDocPct`, `huongThoat`, `luuLuongM3h`, `namXayDung`, `hoGaDauId`, `hoGaCuoiId` | — | Không có từ vựng | Từ điển chỉ cho phép "phân tổ theo đường kính, vật liệu, tình trạng khi cần" ở mạng cấp nước |
| Toàn bộ `HoGa` | — | Không có từ vựng | |

Chưa có nguồn: CTN-095 (kênh mương thoát nước), CTN-098 (công trình điều hoà nước mưa), CTN-099 (nạo vét), CTN-100…104 (điểm ngập).

## 5. `OngCapNuoc` (schema.prisma:491), `DoanTuyenOng` (686), `VanCapNuoc` (526)

| Trường HTKT | Từ vựng | Mức khớp | Ghi chú |
|---|---|---|---|
| `chieuDaiM` cộng theo `capMang = TRUYEN_DAN` | CTN-046 (CN-C-40) | Tổng hợp | m → km |
| `chieuDaiM` cộng theo `capMang = PHAN_PHOI` | CTN-047 (CN-C-41) | Tổng hợp | `capMang = DICH_VU` chưa rõ xếp vào đâu (U) |
| `namLapDat` trong kỳ | CTN-048, CTN-049 (ống mới trong kỳ) | Tổng hợp, suy diễn | Chỉ đúng nếu `namLapDat` được nhập đủ |
| — | CTN-050, CTN-051 (cải tạo trong kỳ) | Thiếu | HTKT không ghi sự kiện cải tạo |
| `vatLieu`, `dkTrongMm`, `tinhTrang` | khoá phân tổ tuỳ chọn của CTN-046/047 | Khớp | |
| `apSuatVanHanhBar` | CTN-054 | Một phần | Từ điển cần áp lực bình quân, tối thiểu tại đồng hồ tổng và điểm bất lợi, theo kỳ |
| `dkNgoaiMm`, `apSuatThietKeBar`, `doSauChomM`, `kieuNoi`, toàn bộ `VanCapNuoc` | — | Không có từ vựng | |

## 6. `TuyenMangLuoi` (schema.prisma:624)

| Trường HTKT | Từ vựng | Mức khớp |
|---|---|---|
| `maTuyen` | CTN-004 | Khớp |
| `chieuDaiTongM` theo `loai` | CTN-046/047/075/076/096 | Tổng hợp (m → km) |
| `diemBatDauLat/Lon`, `diemKetThucLat/Lon` | CTN-022 | Một phần (chỉ hai đầu mút) |
| `nhaMayXuLyId`, `tramBomId` | công trình liên kết của CTN-075, CTN-077 | Khớp |

## 7. Biểu mẫu cấp xã: `ReportThoatNuoc` (1736), `ReportCapNuoc` (1832)

| Trường HTKT | Từ vựng | Mức khớp | Ghi chú |
|---|---|---|---|
| `ReportThoatNuoc.chieuDaiM` theo `loaiNuoc`, `wardId`, `year` | CTN-096, CTN-075/076 | Tổng hợp | Trùng nguồn với `CongThoatNuoc` — phải chọn **một** nguồn để tránh cộng đôi |
| `ReportThoatNuoc.toaDo*` | CTN-022 | Một phần | |
| `ReportCapNuoc.soHoGiaDinh` | XDDT-025 SoDauNoiHo | Không tương đương | HTKT đếm hộ theo tuyến; từ điển đếm đấu nối của đơn vị cấp nước |
| `ReportCapNuoc.hienTrang`, `duKienNguon` | — | Không có từ vựng | |

## 8. Bảng trung tâm `htkt_doi_tuong` (migration 049)

Lĩnh vực `CAP_NUOC`, `THOAT_NUOC_MUA`, `THOAT_NUOC_THAI`, `THOAT_NUOC_CHUNG` khớp cách phân nhánh của từ điển. Cột `ma_doi_tuong` = CTN-004; `ma_xa` = mã đơn vị hành chính; `geometry` (JSONB, WGS84) = CTN-021/022 sau chuyển hệ; `chieu_dai_m` = nguồn cộng tổng; `don_vi_quan_ly` = một phần CTN-066; `lich_su` (JSONB) = một phần CTN-122.
Thiếu so với nhóm siêu dữ liệu CTN-114…124: cơ quan quản lý nguồn, trạng thái chất lượng dữ liệu, thông tin rà soát, nguồn căn cứ, hệ quy chiếu, phiên bản, chế độ khai thác.

## 9. Tổng hợp

| Nhóm từ vựng mới (CTN) | Số mã | HTKT có nguồn (kể cả tổng hợp, một phần) |
|---|---|---|
| Mã định danh, thành phần dùng chung (001–029) | 29 | 004, 013, 014, 021, 022 — 5 mã |
| Cấp nước: đơn vị, nhà máy, mạng lưới, dịch vụ, giám sát (030–064) | 35 | 046, 047, 048, 049, 052, 054 — 6 mã |
| Thoát nước thải, xử lý nước thải (065–094) | 30 | 066, 067, 072, 073, 075, 076, 077, 078, 085, 086 — 10 mã, phần lớn "một phần" |
| Thoát nước mưa, ngập (095–104) | 10 | 096, 097 — 2 mã |
| Bùn thải, tài liệu (105–113) | 9 | 0 |
| Siêu dữ liệu bản ghi (114–124) | 11 | 122 (một phần) — 1 mã |
| **Cộng** | **124** | **24 mã, trong đó khớp trực tiếp hoặc cộng tổng được ngay: 046, 047, 073, 077, 078, 096, 097 và các mã kế thừa XDDT-001, 029, 031** |

Chiều ngược lại: phần lớn trường kỹ thuật chi tiết của HTKT (hố ga, van, đường kính, độ dốc, cao độ, số máy bơm…) **không có từ vựng tương ứng** — đó là dữ liệu quản lý tài sản của Sở, không phải dữ liệu Bộ yêu cầu.

## 10. Việc cần làm nếu muốn xuất dữ liệu theo từ điển (P — chưa thực hiện)

| # | Việc | Bảng | Cấp |
|---|---|---|---|
| 1 | Thêm cột nhận mã: mã định danh chuyên ngành, mã định danh địa điểm, mã loại đối tượng địa điểm | nhà máy, trạm bơm, `htkt_doi_tuong` | L (migration) |
| 2 | Thêm cột cấp cống (cấp 1/cấp 2) và cờ "tuyến chính" | `CongThoatNuoc` hoặc `TuyenMangLuoi` | L |
| 3 | Chuyển `congNghe`, `trangThai`, loại trạm bơm sang danh mục DM08, DM03, DM09 | nhà máy, trạm bơm | M — phải đọc mục IV của QĐ 1852 trước |
| 4 | Tách chủ sở hữu và đơn vị vận hành, kèm mã số thuế tổ chức | nhà máy, trạm bơm | L |
| 5 | Bảng điểm xả sau xử lý và giấy phép môi trường | mới | L |
| 6 | Bảng số liệu theo kỳ (công suất vận hành, lượng nước thải, sự cố, bùn, điểm ngập) | mới | L |
| 7 | Hàm cộng tổng chiều dài theo loại, cấp, địa bàn; đổi m → km | chỉ đọc | M |
| 8 | Chuyển toạ độ WGS84 → hệ toạ độ quốc gia khi xuất | — | M, gắn với PostGIS |

Thứ tự hợp lý: 7 trước (không đổi CSDL, cho ngay số liệu báo cáo), rồi 3, rồi 1–2; các bảng mới 5–6 chỉ làm khi Sở xác định sẽ nhập các số liệu đó ở HTKT thay vì nhập thẳng trên hệ thống của Bộ.

## 11. Chưa kiểm được
- Chưa đọc mục IV (nội dung danh mục DM01–DM20) nên chưa đối chiếu được giá trị danh mục với các giá trị liệt kê trong HTKT.
- Chưa đọc Phụ lục I–III của TT 69/2026 để xác nhận mã trường CN-…, TN-… (mới lấy theo cột "Pháp lý" của từ điển).
- Chưa truy vấn CSDL thật: không biết các bảng này có bao nhiêu bản ghi, tỷ lệ trường bỏ trống.
- Từ vựng kế thừa XDDT và CDE mới có tên trường và kiểu, chưa có định nghĩa đầy đủ (nằm ở QĐ 945/QĐ-BXD, không có trong kho).
