# Cập nhật thiết kế VTVL sau khi có Quyết định phê duyệt và bản mô tả (28/10/2026)

> Cập nhật cho `02-thiet-ke-csdl-vtvl-kpi.md` (26/10). **Vẫn chỉ thiết kế và đối chiếu dữ liệu: chưa sửa `schema.prisma`, chưa tạo migration, chưa nạp CSDL.**
> Nguồn: thư mục `Tailieu_VBPL/Vitri_Vieclam` trên Google Drive (QĐ 1239/QĐ-SXD, 94 bản mô tả .docx, CV xếp ngạch của Sở Nội vụ, CV tham gia dự thảo QĐ của UBND tỉnh, hai tệp Excel phụ lục).
> Công cụ: `app/scripts/vtvl-trich-ban-mo-ta.py`; kết quả: `docs/kpi-2026/vtvl/danh-muc-vtvl.csv`, `docs/kpi-2026/vtvl/doi-chieu-ban-mo-ta.md`.

## 1. Điều đã được xác nhận từ văn bản nguồn

| Nội dung | Căn cứ trong nguồn | Mức |
|---|---|---|
| Danh mục VTVL của Sở đã **được duyệt**: 6 mã lãnh đạo, quản lý (`LĐ.01–06`) + 59 mã chuyên môn, nghiệp vụ (`CMNV.01–59`) = **65 mã, 67 dòng** (Phó Giám đốc và Phó Trưởng phòng mỗi mã có 2 ngạch) | QĐ 1239/QĐ-SXD, Danh mục (5 trang), đọc bằng máy và đối chiếu tay | CONFIRMED |
| QĐ 1239 căn cứ NĐ 361/2025/NĐ-CP và **QĐ 3623/QĐ-UBND ngày 28/8/2026** (UBND tỉnh duyệt VTVL và tỷ lệ công chức bố trí theo VTVL) | phần căn cứ của QĐ 1239 | CONFIRMED |
| Hạn: bố trí và **xếp ngạch theo VTVL xong chậm nhất 01/7/2027**; hồ sơ đề nghị thống nhất khi xếp vào ngạch **cao hơn** ngạch hiện giữ gửi Sở Nội vụ **trước ngày 15 tháng đầu mỗi quý**, gửi sau thì sang quý kế | CV của Sở Nội vụ về xếp ngạch theo VTVL (tháng 9/2026) | CONFIRMED |
| Suy ra từ hạn trên: mốc nộp còn lại là **15/01/2027** và **15/04/2027** (nộp 15/7 đã quá hạn 01/7) | tính từ câu trên | INFERRED |
| Xếp ngạch theo VTVL lãnh đạo, quản lý là người đứng đầu **không áp dụng cho người được giao quyền** | CV xếp ngạch, mục 2 | CONFIRMED |
| Không có quy định cách chọn người xếp ngạch chuyên viên chính/cao cấp; cơ quan tự chịu trách nhiệm, tham khảo 4 tiêu chí (yêu cầu VTVL, bản mô tả và khung năng lực, năng lực và kết quả của công chức, nhu cầu bố trí) | CV xếp ngạch, mục 4b (dẫn CV 6911/BNV-VP) | CONFIRMED |
| Hồ sơ xếp ngạch cao hơn gồm 5 phần (văn bản đề nghị; báo cáo thực trạng theo mẫu; biên bản họp lựa chọn kèm tiêu chí; bản kết quả theo dõi, đánh giá công chức; hồ sơ cá nhân gồm 5 loại giấy tờ) | CV xếp ngạch, mục 4e | CONFIRMED |
| Mỗi VTVL có bản mô tả theo một mẫu cố định gồm 7 phần (mục tiêu; nhiệm vụ kèm kết quả đầu ra và tiêu chí đánh giá; quan hệ; quyền hạn; điều kiện làm việc; trình độ; khung năng lực) | 94 tệp .docx | CONFIRMED |

**Chưa có trong thư mục (không tự suy ra):** văn bản QĐ 3623/QĐ-UBND và phụ lục **tỷ lệ bố trí** chính thức; ngày ký QĐ 1239 (bản trong thư mục có số 1239 nhưng ô ngày để trống); toàn văn NĐ 361/2025; Hướng dẫn 07-HD/BTCTW và bộ biểu A1–D2 (đã hỏi ở bản 26/10, vẫn thiếu).

## 2. Bẫy cần tránh: hai bộ mã VTVL khác nhau

Tệp Excel "PL Sở Xây dựng kèm QĐ" là **phụ lục dự thảo**, không phải bản chính thức (tiêu đề ghi "Kèm theo Quyết định số: ……./QĐ-UBND ngày …" bỏ trống; tên tệp ghi "16.6", khớp công văn của Sở Nội vụ ngày 16/6/2026 xin ý kiến dự thảo, nhưng ngày tệp được lập là **suy ra**): có ô `#REF!`, 60 vị trí, đánh mã `CMNV.01–49` và thêm 4 vị trí hỗ trợ phục vụ `PV.01–04`. Số mã **không trùng** với danh mục chính thức (ví dụ `CMNV.03` là "Pháp chế viên" trong dự thảo nhưng `CMNV.01` trong QĐ). **Chỉ nạp theo QĐ 1239**; dự thảo chỉ để tham khảo cột "trình độ chuyên môn". QĐ 1239 không có `PV.01–04` (nhóm hỗ trợ phục vụ), cần hỏi Văn phòng Sở danh mục này nằm ở văn bản nào.

## 3. Sai sót trong tệp nguồn (chi tiết ở `vtvl/doi-chieu-ban-mo-ta.md`)

| Loại | Phát hiện | Việc cần làm |
|---|---|---|
| Mã sai trong nội dung | `CMNV.02` và `CMNV.04` ghi `CNMV` (đảo chữ); `CMNV.48` ghi "Ngày QĐ" vào ô mã; `CMNV.57` ghi `CMNV.58` (trùng với bản kiểm tra chuyên ngành) | Văn phòng Sở sửa nguồn |
| Tên khác nội dung | `CMNV.07`: tên và tên tệp nói "thi đua khen thưởng" nhưng ô tên ghi "tổ chức cán bộ" (lỗi sao chép); yêu cầu trình độ của tệp này liệt kê nhóm ngành kỹ thuật xây dựng, có vẻ không phù hợp thi đua khen thưởng (**INFERRED**, cần người đọc) | sửa nguồn |
| Lỗi gõ | `CMNV.33`, `CMNV.37` lặp "quản lý quản lý"; `CMNV.32` có hậu tố "(Phòng QLHĐXD)" trong khi QĐ giao 3 phòng | sửa nguồn |
| Ngạch | `CMNV.11` Văn thư viên ghi ngạch "Chuyên viên" (QĐ: Văn thư viên) | sửa nguồn |
| Địa chỉ làm việc | 2 địa chỉ khác nhau; **40/94 tệp ghi tỉnh "Quảng Bình"** | thống nhất |
| Ngày bắt đầu | 91 tệp ghi "Ngày QĐ", 3 tệp ghi "28/8/2026" (trùng ngày của QĐ 3623 của tỉnh, không phải QĐ 1239) | thống nhất sau khi có ngày ký |
| Định dạng cấp độ năng lực | "2-4" và "2 - 4" lẫn lộn | chuẩn hóa khi nạp |

Quy tắc nạp: **không tự sửa** nguồn trong CSDL. Mã lấy từ tên tệp chỉ dùng để đối chiếu, bản ghi nào có mã nội dung ≠ mã tên tệp nạp ở trạng thái `CAN_KIEM_CHUNG`.

## 4. Thay đổi so với thiết kế 26/10

### 4.1 `vi_tri_viec_lam` là danh mục chính thức, nạp từ CSV
- Nạp 65 mã từ `vtvl/danh-muc-vtvl.csv`; `ma` UNIQUE. Thêm `quyet_dinh_so` (`1239/QĐ-SXD`), `ngay_hieu_luc` **cho phép NULL** (chưa có ngày ký), `nhom` (`LANH_DAO` / `CMNV`).
- Bảng con `vt_vi_tri_ngach` (mã, ngạch) vì `LĐ.02` và `LĐ.06` có 2 ngạch; `CMNV.24` (Kế toán trưởng) QĐ **không ghi ngạch**: để NULL, đừng điền.
- `Đơn vị thực hiện` trong QĐ là chữ tự do ("Phòng A; Phòng B", "Các phòng chuyên môn, nghiệp vụ"). Bảng `vt_vi_tri_don_vi` (mã → `ToChuc`) nạp qua **bảng ánh xạ do người duyệt**, không đoán tên phòng. "Phòng chuyên môn, nghiệp vụ" = tập các phòng loại `PHONG`.
- Nhóm "dùng chung / chuyên ngành" (NĐ 361) QĐ 1239 không nêu: không có cột này cho đến khi có văn bản.

### 4.2 Bản mô tả thành dữ liệu có cấu trúc (mới)
726 dòng nhiệm vụ nhưng chỉ **34 tên nhiệm vụ khác nhau** và 17 năng lực khác nhau, nên chuẩn hóa:

| Bảng | Nội dung |
|---|---|
| `vt_ban_mo_ta` | viTriId, phiên bản, ngày hiệu lực, tệp nguồn, trạng thái kiểm chứng (`DA/CAN/CHUA`) |
| `vt_nhiem_vu_mau` | 34 tên nhiệm vụ dùng chung (danh mục) |
| `vt_nhiem_vu_vi_tri` | banMoTaId, nhiemVuMauId, stt, công việc cụ thể (**NULL được**: 153/726 dòng nguồn gộp ô nên không có), kết quả đầu ra, tiêu chí đánh giá |
| `vt_nang_luc_yeu_cau` | banMoTaId, nhóm (chung / chuyên môn / quản lý), tên, `cap_tu`, `cap_den` (từ "2-4"); Tin học, Ngoại ngữ là mô tả chữ |
| `vt_yeu_cau` | trình độ đào tạo, bồi dưỡng, kinh nghiệm, phẩm chất (văn bản tự do) |
| `vt_quyen_han`, `vt_quan_he` | giữ nguyên văn |

### 4.3 Nối với KPI
CV 9409 yêu cầu **Phụ lục 1 "Danh mục sản phẩm/công việc chuẩn"**. `vt_nhiem_vu_vi_tri` (kết quả đầu ra và tiêu chí đánh giá của từng VTVL) là ứng viên nguồn cho phụ lục này. Thêm cột tuỳ chọn `kpi_ke_hoach_nhiem_vu.vt_nhiem_vu_vi_tri_id`. **Chưa khẳng định** nó thay được mẫu Phụ lục 1 chính thức vì Sở chưa có mẫu đó.

### 4.4 Mẫu "Báo cáo thực trạng bố trí công chức" đã gần đủ dữ liệu
Đối chiếu từng cột của mẫu (sheet `BC`) với `CanBo` (đã kiểm schema): họ tên, ngày sinh, giới tính, trình độ, ngạch (`ngachHienHuong`, `maNgach`), bậc (`bacLuong`), hệ số (`heSoLuong`), ngày xét nâng bậc lần sau (`ngayNangLuongKeTiep`) **đều đã có**. Thiếu hai thứ: **VTVL đang đảm nhiệm dạng khoá ngoại** (hiện `CanBo.viTriViecLam` là chuỗi cũ theo NĐ 62/2020 và 106/2020) và cột **ghi chú đề xuất xếp ngạch**. Do đó `vt_bo_tri` (đã đề xuất ở bản 26/10) thêm `de_xuat_xep_ngach` (ngạch đề xuất, lý do, trạng thái). Có thể xuất mẫu BC trực tiếp từ dữ liệu khi `vt_bo_tri` được nhập.

### 4.5 Theo dõi hồ sơ xếp ngạch cao hơn
Bảng `vt_ho_so_xep_ngach`: canBoId, VTVL đích, ngạch hiện giữ → ngạch đề xuất, 5 mục hồ sơ (mỗi mục có trạng thái và tệp), kết quả đánh giá 4 tiêu chí của Bộ Nội vụ, quý nộp, trạng thái. Ràng buộc: không cho đánh dấu "người đứng đầu" nếu `PhanCong` là giao quyền; cảnh báo khi quá mốc 15 của tháng đầu quý. Dữ liệu này (lương, kỷ luật, đánh giá) là **nhạy cảm**: chatbot chặn theo cùng quy tắc `kpi_*` và `vt_bo_tri` (xem §7 của bản 26/10).

## 5. Phụ thuộc và thứ tự

1. Văn phòng Sở sửa các sai sót ở §3, rồi chạy lại script (kết quả tái lập được, không sửa tay file sinh).
2. Có phụ lục tỷ lệ của QĐ 3623/QĐ-UBND: mới nạp được số lượng và tỷ lệ bố trí theo VTVL (hiện **không** có số liệu chính thức; dự thảo Excel là 88 biên chế nhưng bản dự thảo chứa `#REF!`).
3. Migration thủ công số **050** (số 049 đã dùng ở hai nơi: `049_chatbot_log_token` trên nhánh này, `049_htkt_doi_tuong_hub` trên `main`) cùng rollback, thử trên staging nội bộ trước.
4. Nạp theo thứ tự: `vi_tri_viec_lam` → bản mô tả → ánh xạ đơn vị → `vt_bo_tri`.

## 6. Câu hỏi cập nhật cho Văn phòng Sở

1. Ngày ký và hiệu lực của QĐ 1239/QĐ-SXD? Bản trong thư mục có ô ngày để trống.
2. Cho xin QĐ 3623/QĐ-UBND và phụ lục tỷ lệ bố trí chính thức.
3. 4 vị trí hỗ trợ phục vụ (`PV.01–04` trong dự thảo) nay nằm ở văn bản nào? QĐ 1239 không có.
4. Ai sửa 4 mã sai, CMNV.07 và địa chỉ làm việc trong tệp nguồn (§3)? Tệp nào là bản cuối?
5. Còn nguyên câu hỏi 1, 2, 3, 5 của bản 26/10 (Hướng dẫn 07 và bộ biểu A1–D2; `CanBo` đủ người chưa; mẫu Phụ lục KPI; phân quyền xem điểm KPI).
