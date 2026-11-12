# Đối chiếu công văn 17425 và hai từ điển dữ liệu của Bộ Xây dựng với hệ thống HTKT

Ngày: 2026-11-12 · Chế độ chỉ đọc (không sửa mã, không ghi CSDL).
Nhãn: **V** = đã đọc văn bản/mã trong lần này · **I** = suy luận · **U** = chưa biết · **P** = đề xuất.

## 1. Nguồn đã đọc

| Văn bản | Số, ngày (đọc từ trang 1 có lớp ký số) | Tệp trong kho `Tailieu_VBPL/Cơ sở dữ liệu Bộ XD` | Cách đọc |
|---|---|---|---|
| Công văn đôn đốc cập nhật dữ liệu CSDL quốc gia về hoạt động xây dựng | 17425/BXD-TTCNTT, 30/10/2026 | `07_HuongDan_CapNhat_DongBo/BXD- Cap_nhat_du_lieu_phuc_vu_dong_bo_c12_30_10_2026_f.pdf` | Toàn văn (2 trang) |
| Từ điển dữ liệu CSDL cấp nước sạch và thoát nước đô thị, phiên bản 1.0 | 1852/QĐ-BXD, 27/10/2026 | `06_TuDienDuLieu_DungChung/QD Tu dien du lieu CNSTNDT t.pdf` | Phần quyết định + quy ước chung toàn văn; bảng từ vựng trích tự động bằng `pdfplumber` (171 mã) |
| Từ điển dữ liệu CSDL về phát triển đô thị, phiên bản 1.0 | 1887/QĐ-BXD, 01/11/2026 | `06_TuDienDuLieu_DungChung/2026.10.30.Quyet dinh tu dien du lieu PTDT_sua_18h00.pdf` | Phần quyết định + mục I toàn văn; đề mục mục III; bảng từ vựng trích tự động (mã lớn nhất BXD-XDDT-PTDT-295) |

Giới hạn: bảng từ vựng trích tự động, **chưa đọc từng dòng định nghĩa**; tên trường kỹ thuật của QĐ 1887 trích chưa đủ. Đối chiếu dưới đây ở mức nhóm đối tượng, chưa phải từng trường.

## 2. Công văn 17425 — việc có hạn 15/11/2026

**V** Nội dung: Bộ Xây dựng đề nghị địa phương bổ sung các trường còn thiếu **trên Hệ thống thông tin, CSDL quốc gia về hoạt động xây dựng** trước ngày **15/11/2026** để đồng bộ lên Trung tâm dữ liệu quốc gia (Kế hoạch 05-KH/BCĐTW, mục tiêu làm sạch tối thiểu 80% dữ liệu). Nơi gửi có Sở Xây dựng các tỉnh và UBND cấp xã.

| Nhóm hồ sơ | Trường Bộ yêu cầu bổ sung (V) | Hệ thống HTKT có giữ dữ liệu này không |
|---|---|---|
| Quy hoạch đô thị và nông thôn | Mã số thuế của tổ chức lập quy hoạch, lập nhiệm vụ, thẩm định, phê duyệt | Không có bảng hồ sơ quy hoạch (danh sách model trong `schema.prisma` không có; `lib/htkt/quy-hoach.ts` là nội dung tĩnh) — V |
| Dự án đầu tư xây dựng | Mã định danh, họ tên, chức vụ người quyết định đầu tư; chủ đầu tư/cơ quan chuẩn bị dự án; các quyết định phê duyệt sau khi cấp mã định danh dự án | Bảng `Project` có `nationalCode`, `investor` (chữ), `approvalAuthority`, `decisionNumber`, `approvalDecisionNo`; **không có** mã định danh/họ tên/chức vụ người quyết định đầu tư, không có mã số thuế chủ đầu tư — V |
| Công trình nhà ở riêng lẻ | Mã số thuế chủ đầu tư hoặc số định danh cá nhân chủ hộ; giấy phép xây dựng sau khi cấp mã công trình | **U** — chưa rà module cấp phép (`app/dashboard/cap-phep`); `Project.constructionPermitNo` chỉ là một cột chữ |

Kết luận: đây là việc **nhập liệu trên hệ thống của Bộ**, do cán bộ Sở và cấp xã thực hiện; hệ thống HTKT không thay thế được và hiện không giữ sẵn các trường đó để xuất ra. Số định danh cá nhân của chủ hộ là dữ liệu cá nhân — nếu sau này lưu ở HTKT thì áp quy tắc che như CCCD.

## 3. QĐ 1852 — Từ điển dữ liệu cấp nước sạch, thoát nước đô thị

**V** Cấu trúc: 171 mã trích được, gồm **124 từ vựng mới BXD-CTN-001…124**, 30 từ vựng kế thừa miền BXD-XDDT, 17–18 từ vựng cơ bản BXD-CDE; 20 danh mục DM01–DM20 theo Phụ lục III Thông tư 69/2026/TT-BXD.
**V** Đối tượng áp dụng (Điều 2 khoản 3): Sở Xây dựng, đơn vị cấp nước, đơn vị thoát nước, chủ sở hữu công trình thoát nước — khi tạo lập, cập nhật, kết nối, chia sẻ dữ liệu theo TT 69/2026. Hiệu lực từ ngày ký.
**V** TT 69/2026/TT-BXD đã có trong kho và bảng hiệu lực (`app/prisma/hieu-luc-vbpl.json:874`, hiệu lực 01/11/2026).

| Nhóm từ vựng (mã CTN) | Nội dung chính | Hệ thống HTKT hiện có (V) | Khoảng cách |
|---|---|---|---|
| 1. Mã định danh, thành phần dùng chung (001–029) | Mã định danh chuyên ngành, **mã định danh địa điểm** (NĐ 326/2026), mã tham chiếu hệ thống nguồn, mã thiết bị, phân loại khu vực, loại công trình, sự cố, phản ánh, ranh giới không gian, mã định danh tổ chức | Mã nội bộ `maCS`/`maTS`/`maTuyen`; mã tự sinh của `htkt_doi_tuong` | Không có cột mã định danh địa điểm, mã tham chiếu nguồn; bốn loại mã phải lưu ở trường riêng (quy ước chung mục 5) |
| 2–3. Đơn vị cấp nước, khách hàng, giá (030–035) | Số đấu nối, biểu giá nước sinh hoạt, quy hoạch cấp nước, đơn vị vận hành | `ReportCapNuoc`: tuyến đường, số hộ, hiện trạng (mức xã) | Thiếu toàn bộ số liệu đơn vị cấp nước |
| 4. Nguồn nước, nhà máy, mạng lưới, chất lượng dịch vụ (036–059) | Công nghệ xử lý, nguồn khai thác, giấy phép khai thác, sản lượng, **lượng nước thương phẩm**, chiều dài ống truyền tải/phân phối (mới, cải tạo), trạm bơm, bể chứa, áp lực, thời gian cấp liên tục, số sự cố, phản ánh | `OngCapNuoc` (đoạn ống: vật liệu, đường kính, chiều dài, áp suất, cấp mạng), `VanCapNuoc` | **Không có bảng nhà máy nước**; không có sản lượng, thất thoát, chỉ số dịch vụ |
| 5. Giám sát trực tuyến nước sạch (060–064) | Điểm giám sát; chuỗi pH, độ đục, clo dư | `qd72_water_test_results` (phục vụ PCCC, khác mục đích) | Không có |
| 6–8. Thoát nước thải, xử lý nước thải (065–094) | Chủ sở hữu, hợp đồng quản lý vận hành, số hộ được thu gom, công nghệ, cống cấp 1/cấp 2, trạm bơm, lượng nước thải phát sinh/thu gom/xử lý, tỷ lệ, giấy phép môi trường, điểm xả, thông số đầu vào và sau xử lý | `NhaMayXuLyNuocThai` (công suất thiết kế/hiện tại, công nghệ, tiêu chuẩn xả, nơi xả), `TramBom`, `CongThoatNuoc`, `HoGa`, `TuyenMangLuoi`, `ReportThoatNuoc` | Có khung công trình; thiếu số liệu vận hành theo kỳ, giấy phép, hợp đồng, phân cấp cống, thông số quan trắc |
| 9. Thoát nước mưa, ngập (095–104) | Kênh mương, cống thoát nước mưa, công trình điều hoà, nạo vét, điểm ngập, số lần ngập, phương thức giám sát | `CongThoatNuoc.loaiNuoc`; `htkt_doi_tuong` lĩnh vực `THOAT_NUOC_MUA` | Không có điểm ngập, nạo vét, công trình điều hoà |
| 10. Bùn thải (105–113) | Khối lượng bùn, phương pháp và cơ sở xử lý, tái sử dụng | Không có | Toàn bộ |
| 11. Siêu dữ liệu bản ghi (114–124) | Cơ quan quản lý nguồn, thông tin tạo lập, trạng thái chất lượng dữ liệu, rà soát, nguồn căn cứ, phạm vi không gian–thời gian, **hệ quy chiếu**, phiên bản dữ liệu, truyền nhận, chế độ khai thác | `createdAt`, `updatedAt`, `status`/`trangThai` | Thiếu gần hết; trùng với khoảng cách "phiên bản, nguồn, mức tiếp cận" đã nêu ở `docs/architecture/UPGRADE_V6_GAP.md` mục 2.2 |

Danh sách 124 tên trường kỹ thuật BXD-CTN (trích tự động, dùng làm mục lục khi thiết kế):
MaDinhDanhChuyenNganh, MaDinhDanhDiaDiem, MaLoaiDoiTuongDiaDiem, MaThamChieuNguon, MaThietBi, ThuDienTu, ChucVu, PhanLoaiKhuVuc, LoaiKhachHang, LoaiNguonNuoc, TenNguonNuoc, LoaiCongTrinhCapNuoc, LoaiCongTrinhThoatNuoc, LoaiHeThongThoatNuoc, SuCo, PhanAnhKienNghi, LoaiSuCoPhanAnh, DonViDo, ThoiDiemDo, TrangThaiChatLuongThietBi, RanhGioiKhongGian, SoDoViTriTuyen, DungTichThietKe, DungTichHuuIch, MucDichTaiSuDung, HeSoQuyDoiBun, MaDinhDanhToChuc, DiaChiLienHe, DauMoiDuLieu, SoDauNoiSinhHoatMoi, TongSoDauNoi, BieuGiaNuocSinhHoat, QuyHoachCapNuoc, DonViQuanLyVanHanh, NamBatDauVanHanh, CongNgheXuLyNuoc, NguonNuocKhaiThac, TuyenTruyenDanNuocTho, CongTrinhThuNuoc, CongSuatKhaiThacTheoGiayPhep, GiayPhepKhaiThacNuoc, LuuLuongNuocTho, NguonNuocDuPhong, SanLuongNuocSachSanXuat, LuongNuocThuongPham, ChieuDaiOngTruyenTai, ChieuDaiMangPhanPhoi, ChieuDaiOngTruyenTaiMoi, ChieuDaiMangPhanPhoiMoi, ChieuDaiOngTruyenTaiCaiTao, ChieuDaiMangPhanPhoiCaiTao, TramBomCapNuoc, BeChuaDaiNuoc, ApLucNuoc, ThoiGianCapNuocLienTuc, SoSuCoCapNuoc, ThoiGianKhacPhucSuCo, SoPhanAnhKienNghiCapNuoc, TyLePhanAnhXuLyDungHan, DiemGiamSatNuocSach, GiaTriPH, DoDuc, CloDu, TaiLieuCapNuoc, LoaiChuSoHuuThoatNuoc, HopDongQuanLyVanHanh, PhamViDichVuThoatNuoc, SoNguoiBinhQuanHo, SoHoDuocThuGom, SoCoSoNgoaiSinhHoatDuocThuGom, QuyHoachThoatNuoc, ChuSoHuuCongTrinh, CongNgheXuLyNuocThai, CongTrinhXLNTPhiTapTrung, ChieuDaiCongCap1, ChieuDaiCongCap2, TramBomNuocThai, CongSuatTinhTrangTramBom, LuongNuocThaiPhatSinh, LuongNuocThaiThuGom, LuuLuongNuocThaiDauVao, LuuLuongNuocThaiSauXuLy, TyLeNuocThaiThuGom, TyLeNuocThaiXuLy, GiayPhepMoiTruong, DiemXaSauXuLy, LuongNuocThaiTaiSuDung, MucDichTaiSuDungNuocThai, SoSuCoThoatNuoc, SoPhanAnhKienNghiThoatNuoc, DiemGiamSatNuocThaiDauVao, ThongSoNuocThaiDauVao, BanGhiNguonNuocThaiSauXuLy, ThongSoNuocThaiSauXuLy, ChieuDaiKenhMuongThoatNuoc, ChieuDaiCongThoatNuocMua, TramBomThoatNuocMua, CongTrinhDieuHoaNuocMua, KhoiLuongNaoVet, SoDiemNgap, DiemNgap, SoLanNgap, SoDiemNgapDaXuLy, PhuongThucGiamSatNgap, KhoiLuongBunXLNT, KhoiLuongBunMangLuoi, KhoiLuongBunDuocXuLy, PhuongPhapXuLyBun, CoSoXuLyBun, CongSuatXuLyBun, KhoiLuongBunTaiSuDung, TyLeBunXuLyTaiSuDung, TaiLieuThoatNuoc, TenMoTaDuLieu, CoQuanQuanLyNguon, ThongTinTaoLap, TrangThaiChatLuongDuLieu, ThongTinRaSoat, NguonCanCu, PhamViKhongGianThoiGian, HeQuyChieu, PhienBanDuLieu, ThongTinTruyenNhan, CheDoKhaiThac.

## 4. QĐ 1887 — Từ điển dữ liệu phát triển đô thị

**V** Cấu trúc: từ vựng chuyên ngành BXD-XDDT-PTDT-001…295, chia 16 nhóm; kế thừa từ điển dùng chung và từ điển cấp thoát nước ở mục II.
**V** Đối tượng áp dụng (Điều 2 khoản 3): **Sở Xây dựng và UBND cấp xã** khi tạo lập, cập nhật dữ liệu vào CSDL về phát triển đô thị. Mã từ vựng không đổi, không tái sử dụng.
**V** Phân vai (mục I, STT 4): Sở Xây dựng tạo lập đô thị, chương trình phát triển đô thị, hồ sơ đánh giá, quy chế quản lý kiến trúc; **UBND cấp xã** tạo lập khu vực có tính chất đô thị, ô phố, kế hoạch phát triển đô thị, cơ sở vật chất đô thị. Dữ liệu giao thông, hạ tầng kỹ thuật, quy hoạch **nhận liên thông từ CSDL nguồn**, cấp xã chỉ bổ sung khi nguồn chưa có.

| Nhóm (mục III) | Hệ thống HTKT hiện có (V) | Khoảng cách |
|---|---|---|
| 1–2. Đô thị; khu vực có tính chất đô thị | `qd72_urban_areas` (phục vụ QĐ 72, khác mục đích) | Không có bảng đô thị, khu vực theo nghĩa phân loại đô thị |
| 3. Ô phố | Không có | Toàn bộ |
| 4–5. ĐVHC cấp tỉnh, cấp xã và trình độ phát triển đô thị | `AdministrativeUnit` (78 đơn vị, diện tích, dân số) | Thiếu chỉ tiêu trình độ phát triển đô thị (Bảng 2B NQ 111/2025/UBTVQH15) |
| 6. Chương trình, kế hoạch phát triển đô thị | Không có bảng; nội dung tĩnh phòng PTĐT | Toàn bộ |
| 7. Đánh giá phân loại đô thị, tăng trưởng xanh | Không có | Toàn bộ |
| 8. Đô thị thông minh, chống chịu biến đổi khí hậu | `lib/htkt/ha-tang-thong-minh.ts` (chưa đọc nội dung — U) | Chưa rõ |
| 9. Cơ sở vật chất đô thị | Một phần ở `Asset`, `ReportCongVien` | Chưa đối chiếu thuộc tính |
| 10–11. Giao thông, bãi đỗ xe | `Street`, `ReportDuong`, `ReportBaiDoXe`, `htkt_doi_tuong` (DUONG, BAI_DO_XE) | Có dữ liệu nền; chưa đối chiếu thuộc tính, thiếu đường sắt/đường thuỷ/sân bay |
| 12. Hạ tầng kỹ thuật và môi trường | Thoát nước như mục 3; chiếu sáng, cây xanh có | Thiếu chất thải rắn sinh hoạt, nghĩa trang, nhà tang lễ |
| 13–15. Hồ sơ quy hoạch, thiết kế đô thị, quy chế quản lý kiến trúc | Không có bảng | Toàn bộ |
| 16. Phiên bản, nguồn, thời điểm số liệu, mức độ tiếp cận | Chỉ có `createdAt`/`updatedAt` | Như nhóm 11 của QĐ 1852 |

Yêu cầu kỹ thuật chung của QĐ 1887 (mục I) so với hệ thống:

| Yêu cầu (V) | Hệ thống HTKT | Nhận xét |
|---|---|---|
| Chia sẻ qua API RESTful, JSON UTF-8, qua Nền tảng chia sẻ dữ liệu của Bộ (NĐ 278/2025) | Có `httt_dong_bo_log`, `IntegrationConfig`, `IntegrationLog`; chưa có đấu nối thật | Tài liệu kỹ thuật kết nối nằm trong `05_KetNoi_ChiaSe_API/Tai-Lieu-ChiaSeKetNoi.zip`, chưa đọc |
| Không gian: trao đổi GeoJSON hệ WGS84 (EPSG:4326); **lưu trữ hệ VN-2000** theo kinh tuyến trục địa phương | Lưu và hiển thị WGS84 (toạ độ lat/lng, GeoJSON trong JSONB); CSDL chưa cài PostGIS | Trao đổi thì khớp; lưu trữ VN-2000 chưa đáp ứng — cần PostGIS hoặc thư viện chuyển hệ |
| Nhật ký chỉ ghi thêm: tài khoản, vai trò, cơ quan, hành động, giá trị trước/sau, căn cứ; bản ghi đã duyệt lưu mã băm | `AuditLog` phủ thấp; mã băm nội dung mới có ở module Nội dung AI | Trùng khoảng cách kiểm toán ở `UPGRADE_V6_GAP.md` mục 2.10 |
| Xoá mềm, quản lý theo phiên bản, quan hệ kế thừa khi chia/nhập | Xoá mềm có ở nhiều bảng; không có phiên bản | Thiếu |
| Tệp đính kèm tham chiếu `doc://<kho>/<khóa>#sha256:<mã băm>`; không nhập dữ liệu cá nhân vào từ vựng | Tệp lưu đĩa cục bộ, không băm (trừ BIM — U) | Thiếu |

## 5. Nhận định chung

1. **Hai từ điển áp cho dữ liệu nhập vào CSDL của Bộ**, không bắt buộc hệ thống nội bộ của Sở phải có cùng cấu trúc. Giá trị với HTKT: nếu Sở muốn nhập một lần ở HTKT rồi đẩy lên Bộ qua API thì tên trường, kiểu dữ liệu, danh mục phải theo từ điển ngay từ đầu (**I**).
2. Lớp liên thông hiện có (`httt_*`, migration 040) mới phủ **mã định danh và năng lực hoạt động xây dựng** theo NĐ 212/2026, TT 39/2026; chưa có gì cho cấp thoát nước (TT 69/2026) và phát triển đô thị.
3. Phần hệ thống đã có nhiều nhất là **công trình thoát nước** (nhà máy xử lý, trạm bơm, cống, hố ga, tuyến). Đây là điểm bắt đầu hợp lý nếu làm.
4. Việc gấp duy nhất là công văn 17425 (hạn 15/11/2026), và là việc nhập liệu trên hệ thống của Bộ.

## 6. Đề xuất (P — chưa thực hiện)

| # | Việc | Cấp | Điều kiện |
|---|---|---|---|
| 1 | Báo các phòng liên quan (QH-KT, QLHĐ-XD, cấp xã) hạn 15/11/2026 của công văn 17425 | — | Việc của lãnh đạo Sở |
| 2 | Nạp TT 69/2026, QĐ 1852, QĐ 1887, công văn 17425 vào kho tra cứu (hiện thư mục con không được đồng bộ) | M | Tốn phí nhúng véc-tơ; cần duyệt |
| 3 | Bảng ánh xạ từng trường `NhaMayXuLyNuocThai`, `TramBom`, `CongThoatNuoc`, `OngCapNuoc` ↔ mã BXD-CTN/BXD-XDDT, đọc từng dòng định nghĩa | M | Chỉ đọc |
| 4 | Thêm cột mã định danh địa điểm, mã tham chiếu nguồn và nhóm siêu dữ liệu vào `htkt_doi_tuong` | L (migration) | Sau bước 3; migration 049 phải áp trước |
| 5 | Đọc bộ tài liệu kết nối trong tệp zip, xác định API nào Sở được dùng | M | Chỉ đọc |
| 6 | Quyết định có lưu VN-2000 hay chỉ chuyển hệ khi xuất | — | Gắn với việc cài PostGIS |

## 7. Chưa kiểm được
- Chưa đọc từng dòng định nghĩa, ràng buộc, tần suất cập nhật của từng từ vựng; chưa đọc mục IV (danh mục) của cả hai quyết định.
- Chưa đọc Từ điển dữ liệu dùng chung ngành xây dựng (QĐ 945/QĐ-BXD ngày 17/6/2026) — không có trong kho.
- Chưa đọc hướng dẫn cập nhật hồ sơ thẩm định, cấp mã và công văn kết nối, chia sẻ (bản chưa cấp số).
- Chưa truy vấn CSDL thật để biết các bảng thoát nước, cấp nước đang có bao nhiêu bản ghi.
