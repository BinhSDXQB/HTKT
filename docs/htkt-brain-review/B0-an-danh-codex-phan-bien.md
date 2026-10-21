# B0 — Phản biện công cụ tạo dữ liệu staging (nguyên văn Codex 3 vòng)

> `codex exec --sandbox read-only`, codex-cli 0.162.0-alpha.17.2. Claude KHÔNG chỉnh sửa nội dung. Giải trình: `B0-staging-vps.md` §6.

---

## Vòng 1 — bản danh sách đen

**Kết luận: CHƯA ĐẠT để tạo dữ liệu staging đưa lên BNIX.** Có dữ liệu định danh nằm trực tiếp trong dump mà SQL hiện không xoá; bộ quét có thể báo “sạch” dù các dữ liệu đó còn nguyên.

Đã kiểm tra đúng nhánh `b0-va-khan-htkt-brain`, đọc mã/schema/SQL và chạy `npm.cmd test`: **29/29 pass**, gồm 6 test ẩn danh. Không sửa tệp, không đọc `.env*`/`secrets/`/dump, không mạng, không mở CSDL. Các nhận xét SQL dưới đây là kiểm tra tĩnh, chưa phải xác nhận thực thi PostgreSQL.

### Các sửa bắt buộc

**1. [P0] DOCX/PDF và ảnh chữ ký thật vẫn được mang ra ngoài trong dump.**

Quy tắc chỉ thay tiêu đề, tên tệp, CN/serial người ký, nhưng giữ:

- `OfficeGeneratedDocument.noiDung Bytes`: toàn bộ DOCX — schema dòng **2313**.
- `OfficeLeaveSignature.fileData Bytes`: PDF đã ký — dòng **2420**.
- `OvertimeSignature.fileData Bytes`: PDF đã ký — dòng **2804**.
- `OvertimeTimesheet.chuKyChamCong Bytes?`: ảnh chữ ký — dòng **2777**.

Bộ quét không xét `bytea`, nên không phát hiện các nội dung này. Việc không chuyển thư mục đính kèm không giải quyết được dữ liệu nhị phân đã nằm trong CSDL.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:120`, `:128`, `:140`, `:145`, `:403`. Xoá bản ghi hoặc thay bằng tài liệu giả hợp lệ; xoá ảnh chữ ký. Khi xoá, xử lý các quan hệ theo thứ tự phù hợp.

**2. [P0] JSON, văn bản tự do và mảng chưa được kiểm kê đầy đủ.**

Những cột hiện còn nguyên, có thể chứa tên, địa chỉ, hồ sơ hoặc đường dẫn định danh:

| Nhóm | Ví dụ thực tế trong schema |
|---|---|
| Báo cáo nhập Excel | `WardReport.columns`, `rows`, `sheetName`, `sourceFile`, `notes` — **1891–1895** |
| Công việc/nghiệp vụ | `CongViec.tieuDe`, `customFields`, `dinhKem` — **3104**, **3132–3133**; `NghiepVuBanGhi.tieuDe`, `customFields` — **3236**, **3246** |
| Hồ sơ chứng chỉ | `cchn_ho_so.thanh_phan`, `noi_dung`, `ket_luan_hoi_dong` — **4183**, **4176**, **4190** |
| BIM | `metadata` ở model/version/file/review, `BimValidationCheck.chiTiet`; tên tệp và `storagePath` — **2870**, **2904**, **2924–2931**, **2949**, **2966** |
| Liên thông tổ chức | `httt_nang_luc_to_chuc.thong_tin_nang_luc`, `truong_bo_sung`, `ket_qua_dien_tu_path` — **3502–3504** |
| QĐ72 | Nhiều `chi_tiet Json`; `qd72_attachments.ten_file`, `storage_path`, `ghi_chu` — **3534–3543** |
| Ghi chú ở bảng GIU | `DenChieuSang.ghiChu` **356**, `PhanCongLinhVuc.ghiChu` **3273**, cùng nhiều bảng hạ tầng khác |

`docSchema()` bỏ **mọi mảng** tại dòng **38**, gồm mảng scalar, không chỉ quan hệ. Vì vậy `images`, `documents`, `attachments`, `dinhKem`, `nguoiPhoiHopIds` nằm ngoài kiểm tra quy tắc. Mảng ID không tự động là tên người, nhưng vẫn giữ liên kết tới người thật và phải được xét khi thay ID/quan hệ.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:38`, `:108`, `:160`, `:165`, `:178`, `:181`, `:209`, `:298`. Cần chính sách theo **từng cột scalar**, mặc định xoá/làm giả các vùng nội dung mở; chỉ giữ JSON đã có danh sách trường an toàn. Regex tên cột không chứng minh được tính đầy đủ.

**3. [P0] Đổi tên chưa cắt được khả năng tái định danh nhân sự.**

`CanBo` vẫn giữ chức vụ, phòng, đơn vị/chức danh FK, giới tính, năm sinh, lịch sử bổ nhiệm, ngày vào biên chế, ngày nghỉ hưu, trình độ và thông tin Đảng. `PhanCong` giữ chức danh, đơn vị, ngày và số quyết định. Một chức vụ duy nhất trong một phòng có thể xác định ngay người thật.

Đặc biệt, `OfficeSalaryHistory` vẫn giữ **hệ số/phụ cấp thật gắn với `canBoId`** — schema **1979–1990**. Hoán vị ba cột trên `CanBo` không che được lịch sử này. Hoán vị còn cho phép một người nhận lại chính bộ giá trị cũ; với một bản ghi thì chắc chắn không thay đổi.

`User ↔ CanBo` qua `userId` vẫn giữ nguyên, đồng thời nối tới công việc, nghỉ phép, kỷ luật, đánh giá và con cái. ID gốc cũng còn nguyên. Đây là giả danh hoá một phần, chưa đủ cho mục tiêu đã nêu.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:90`, `:101`, `:112`, `:389`. Cần tạo hồ sơ nhân sự và các quan hệ/lịch sử giả nhất quán, hoặc loại các dữ liệu nhân sự này khỏi dump. Không thể chỉ thêm vài cột tên vào quy tắc.

**4. [P1] Bộ quét có nhiều điểm mù; “sạch” đang được diễn giải quá mức.**

Tại `app/lib/an-danh/an-danh.ts:340–348`, từ điển chỉ lấy giá trị từ cột có quy tắc `cccd/sdt/email/ma`, dài ít nhất 8 ký tự. Nó không thu tên, địa chỉ, nội dung nhị phân hay định danh chỉ tồn tại trong JSON/bảng GIU. Biển số/mã ngắn bị bỏ qua.

Tại dòng **405**, `LIKE`:

- Không phát hiện biến thể viết hoa/thường, số điện thoại đổi dấu cách/dấu chấm, hoặc nội dung được mã hoá.
- Hiểu `%` và `_` trong dữ liệu gốc như wildcard, có thể báo nhầm.
- Chỉ quét bảng `public`, không chứng minh các schema/đối tượng khác có trong dump đều sạch.
- Có thể báo sạch khi từ điển rỗng.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:348`, `:403`, `:405`, `:411`. Dùng tìm chuỗi literal, chuẩn hoá phù hợp, kiểm tra phạm vi thực tế của dump và báo rõ giới hạn. Đây chỉ nên là một kiểm tra bổ sung sau chính sách xoá/làm giả đầy đủ.

**5. [P1] Rào chặn không xác định được máy nội bộ và production.**

Tại `app/lib/an-danh/an-danh.ts:328–334`, CSDL tên `ql_htkt_khoi_phuc` trên **máy production**, truy cập qua loopback, vẫn chạy được. Unix socket trả `inet_server_addr() = NULL` cũng được cho qua. SSH tunnel tới PostgreSQL loopback trên production cũng không bị rào này phân biệt.

`kiemTraDich()` ở dòng **420** chỉ được test; script sinh SQL không gọi nó. Kể cả gọi, kiểm tra tên host vẫn không xác minh được máy đích.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:328`, `:332`, `:420`; `app/scripts/an-danh-hoa.mjs:6`. Phải bỏ khẳng định “không qua được trên production”, bổ sung xác minh môi trường phục hồi độc lập và kiểm soát quyền/kết nối để công cụ không có đường truy cập production. Chỉ chặn NULL không giải quyết được trường hợp loopback.

**6. [P1] Sinh giá trị chưa bảo đảm UNIQUE và ánh xạ nhất quán.**

- Email dùng 10 ký tự MD5; `ma` dùng 8 ký tự MD5: có khả năng va chạm, lần lượt ảnh hưởng `User.email`, `PermitVehicle.plateNumber`, và `@@unique([loai_doi_tuong, ma_dinh_danh])`.
- CCCD mới tuần tự là duy nhất trong tập mới, nhưng cập nhật trực tiếp có thể đụng **giá trị cũ của dòng khác** trước khi dòng đó được đổi. `User.email` có nguy cơ tương tự. UNIQUE thông thường không đợi hết cả phép cập nhật để bỏ qua xung đột này.
- Cùng `ma_dinh_danh` gốc trong `httt_dinh_danh`, bảng năng lực và hồ sơ chứng chỉ bị sinh khác nhau theo ID từng dòng, làm mất tính nhất quán nghiệp vụ.

**Sửa tại:** `app/lib/an-danh/an-danh.ts:249`, `:252`, `:353`, `:375`, `:385`. Dùng bảng ánh xạ chung và giá trị bảo đảm duy nhất; cập nhật qua miền tạm không xung đột nếu cần.

**7. [P1] Hướng dẫn vẫn cho phép dump sau khi ẩn danh thất bại.**

Các lệnh psql và pg_dump được in thành bước thủ công độc lập. Nếu psql thất bại và rollback, CSDL `ql_htkt_an_danh` vẫn chứa dữ liệu thật từ bản clone; người vận hành vẫn có thể chạy bước dump tiếp theo.

**Sửa tại:** `app/scripts/an-danh-hoa.mjs:34–36`. Cần quy trình xuất dump chỉ tiếp tục khi psql trả thành công, COMMIT thành công và các kiểm tra hậu điều kiện đạt. Một NOTICE “quét sạch” không đủ thay thế các điều kiện này.

### Những điểm SQL đúng và điểm cần bổ sung

- **`make_date` → `::timestamp` → cột `@db.Date`:** không phải lỗi kiểu dữ liệu; phép gán có thể chuyển về `date`. Ngày 1–28 tránh ngày không hợp lệ. Tuy nhiên giữ năm sinh vẫn có rủi ro tái định danh.
- **NULL:** các biểu thức `CASE` nhìn chung giữ NULL; JSON bắt buộc được thay `{}`, JSON tuỳ chọn thành SQL NULL. `TaiLieu.phamVi` không nullable trong schema nên điều kiện `<> 'CONG_KHAI'` không có lỗ hổng NULL theo schema hiện tại.
- **`hashtext`:** là hàm PostgreSQL có sẵn, không cần pgcrypto. Nhưng `abs(hashtext(...))` có thể tràn với `-2147483648`; cần ép sang bigint **trước** `abs` tại dòng **250**, **372**.
- **pgcrypto:** `CREATE EXTENSION IF NOT EXISTS` đúng hướng, nhưng phụ thuộc extension được cài trên máy và quyền thực thi. Chưa thể xác nhận từ test Node.
- **psql:** `:'mat_khau'` ở câu UPDATE ngoài DO block là cách quote literal phù hợp. `\if` cần **psql tối thiểu 10**. `\prompt` hiển thị đầu vào, không phải nhập mật khẩu ẩn; biến đã tồn tại nhưng rỗng vẫn bỏ qua prompt. Cần kiểm tra mật khẩu rỗng và ghi rõ yêu cầu phiên bản.
- **DELETE/FK:** chunk được xoá trước tài liệu; schema còn khai báo Cascade tại **3031**. Các bảng XOA hiện không thấy quan hệ cha/con bắt buộc làm thứ tự DELETE này sai; `IntegrationLog` không FK tới `IntegrationConfig`. Chưa có bằng chứng thực thi trên DDL phục hồi thực tế.
- **Rollback:** `RAISE EXCEPTION` không bị bắt ở DO block cuối **làm transaction chuyển sang trạng thái aborted**. Với `ON_ERROR_STOP` và chạy `psql -f`, psql dừng trước COMMIT, thoát phiên và transaction được rollback. **Không có lỗi “RAISE nằm trong DO nên thay đổi vẫn commit”.** Nhưng rollback đồng nghĩa dữ liệu thật vẫn còn trong bản clone, liên quan trực tiếp đến phát hiện số 7.

### Test hiện chứng minh được gì?

`app/lib/an-danh/an-danh.test.ts:23` chỉ chứng minh quy tắc vượt qua chính bộ nhận diện hiện có; không chứng minh mọi dữ liệu cá nhân được xử lý. Test SQL tại dòng **47** kiểm tra chuỗi/thứ tự, không parse hay chạy SQL. Test đích chạy tại dòng **65** không kiểm chứng máy production, socket hoặc tunnel.

Trước khi sử dụng cần thêm:

- Kiểm kê scalar đầy đủ, gồm `String[]`, JSON và Bytes; test từ chối cột mới chưa phân loại.
- Dữ liệu giả gài tên/định danh chỉ trong JSON, ghi chú, mảng, DOCX/PDF/chữ ký; kiểm tra đầu ra thực sự.
- Ca UNIQUE va chạm với giá trị cũ, ánh xạ liên bảng, NULL, mật khẩu rỗng và biên `hashtext`.
- Kiểm thử tích hợp trên PostgreSQL nội bộ: FK, extension, psql; cố tình tạo dữ liệu sót rồi xác nhận rollback và quy trình **không xuất dump**.
- Kiểm tra SQL đã sinh khớp generator và kiểm tra tái định danh qua chức danh/đơn vị/lịch sử.

**Chưa nên đưa dump hiện tại lên BNIX, kể cả khi 6 test ẩn danh pass và SQL in “Quét sót: sạch”.**

---

## Vòng 2 — bản thiết kế lại (danh sách trắng + dữ liệu giả)

**Kết luận: CHƯA ĐẠT.** Thiết kế mới giải quyết tốt việc giữ nguyên hồ sơ nhân sự và tệp nhị phân, nhưng còn các P1 về danh sách trắng, phạm vi hậu kiểm và quy trình PowerShell. Chạy thử PostgreSQL là cần thiết, nhưng chưa đủ nếu chưa sửa các điểm dưới đây.

Đã chạy `npm.cmd test`: **30/30 qua**, gồm 7 test ẩn danh. SQL trên đĩa **khớp hoàn toàn** kết quả `sinhSql()` trong bộ nhớ. Không sửa tệp, không đọc bí mật/dump, không dùng mạng hay CSDL. Các kết luận SQL dưới đây là kiểm tra tĩnh.

Quy ước đường dẫn: `TS` = `app/lib/an-danh/an-danh.ts`, `PS` = `app/scripts/an-danh-hoa.ps1`, `Schema` = `app/prisma/schema.prisma`.

**1. Các vấn đề vòng 1**

| Vấn đề | Trạng thái | Nhận xét và vị trí |
|---|---|---|
| Bytes DOCX/PDF/chữ ký | **ĐÃ**, trong phạm vi bảng/cột hiện tại | Các bảng chứa hồ sơ bị DELETE; cấm whitelist Bytes; hậu kiểm bytea. `TS:159`, `TS:298`, `TS:319`. Chưa bao phủ PostgreSQL large object. |
| Json/ghi chú tự do | **MỘT PHẦN** | Xoá mặc định tốt, nhưng vẫn giữ nguyên `Asset.techSpecs`, `geojson`, nhiều `description`, `moTa`, nội dung RAG. `TS:110`, `TS:111`, `TS:132`, `TS:139`. |
| Tái định danh nhân sự | **ĐÃ**, với hồ sơ nhân sự | Xoá hồ sơ thật rồi sinh mới; không giữ lịch sử lương gắn người thật. `TS:298`, `TS:340`. Nội dung cá nhân nằm trong bảng giữ vẫn là đường rò riêng. |
| Quét yếu | **MỘT PHẦN** | `position` literal và chuẩn hoá số là cải thiện đúng; từ điển chưa đầy đủ, bỏ qua kiểu `Unsupported` và đối tượng ngoài bảng thường. `TS:255`, `TS:329`. |
| Rào chặn | **ĐÃ** về mục đích giảm nhầm lẫn | Kiểm tên CSDL và marker trước transaction; mật khẩu kiểm ngoài DO. `TS:227`, `TS:242`. Wrapper tự tạo marker tại `PS:54`, không phải bước người vận hành tạo riêng như mô tả. |
| UNIQUE do hoán vị/đổi tên | **ĐÃ**, cho schema hiện tại | Không còn hoán vị dữ liệu thật. ID/email giả phân biệt theo vai trò, CCCD theo `g`. `TS:273`, `TS:340`, `TS:349`. |
| Dump sau thất bại | **MỘT PHẦN** | Cổng xuất dump đúng hướng, nhưng lỗi restore chỉ cảnh báo; thiếu kiểm mã thoát nhiều lệnh và cleanup bảo đảm. `PS:41`, `PS:50`, `PS:63`, `PS:75`. |

**2. Các P1 còn lại và sửa bắt buộc**

**P1 — Danh sách trắng vẫn cho dữ liệu tự do đi qua nguyên trạng.**

`Asset.techSpecs` là Json mở; `geojson` cũng không bị giới hạn về cấu trúc hay `properties`. Một giá trị như `{"nguoiLienHe":"…","diaChiNoiBo":"…"}` có thể qua nếu người đó không nằm trong từ điển. Không thể coi đây là dữ liệu công khai chỉ vì thuộc bảng tài sản.

Vị trí: `TS:110`; `Schema:812`, `Schema:823`.

**Bắt buộc:** bỏ hai cột này khỏi dữ liệu xuất, hoặc tái tạo cấu trúc theo whitelist **từng thuộc tính**. Với GeoJSON, chỉ giữ loại hình học và toạ độ đã được phê duyệt; không mang nguyên `properties`.

Các cột nguy cơ còn lại sau khi đối chiếu toàn bộ 49 mục:

| Nhóm | Cột cần xử lý hoặc chứng minh nguồn công khai |
|---|---|
| RBAC, danh mục | `Role.description`, `Permission.description`, `AssetType.description`; cả `name`/`displayName` nếu cho phép người dùng tuỳ biến. `TS:87`, `TS:88`, `TS:95`. |
| Hành chính, tổ chức | `AdministrativeUnit.trungTamHc/truocSapNhap/huyenThiCu/vungLoi`; `ToChuc.ma/ten/tenVietTat` và cây tổ chức. Có thể giữ nếu khớp danh mục công khai; schema không chứng minh điều đó. `TS:91`, `TS:92`. `ToChuc.moTa/maSoThue` đã được xoá đúng. |
| Hạ tầng | Các mã tài sản, tên tuyến, `tuDienId`, `diemBatDau/diemKetThuc`, địa chỉ, đơn vị quản lý, nguồn/nơi xả thải có thể lộ mã nội bộ hoặc mô tả kiểu “trước nhà ông…”. Các chuỗi vật liệu/loại/trạng thái cũng chưa được ép về tập giá trị chuẩn. `TS:97` đến `TS:109`. |
| Bảo trì, kiểm tra | `MaintenanceSchedule.name/description`; `InspectionTemplate.name/description`; `InspectionTemplateItem.name/description`: có thể chứa người phụ trách, số điện thoại, hướng dẫn vận hành nội bộ. `TS:111` đến `TS:113`. |
| Dự án | `name/location/investor/pmUnit/designUnit/supervisionUnit/fundingSource`, số quyết định/giấy phép; `ProjectMilestone.name`; `ExecutingUnit.name/code`. Chủ đầu tư có thể là cá nhân; dự án không được lọc theo điều kiện công khai. `TS:117` đến `TS:119`; `Schema:1168`. |
| Báo cáo phường/xã | Tên tuyến, điểm đầu/cuối, vị trí, `hienTrang/duKienNguon`, địa điểm bãi đỗ; `WardGisLength.nguon` có thể chứa đường dẫn hoặc nguồn nội bộ. `TS:121` đến `TS:128`. |
| Cấu hình đơn vị | `FacilityConfig.diaChi/website` có thể là địa chỉ nội bộ, URL intranet hoặc URL có thông tin truy cập. Điện thoại/email/logo đã bị xoá đúng. `TS:130`; `Schema:1948`. |
| Danh mục văn phòng | `OfficeSalaryRule.moTa/vanBanCanCu`, `OfficeRewardTitle.moTa`, `OfficeEmulationMovement.ten/moTa/capPhatDong` có thể chứa nội dung riêng của cơ quan. `TS:132` đến `TS:134`. |
| Pháp lý, công việc | `RoadLegalReference.url/scope/title`; `CongViecLoai.ten` có thể lộ nguồn nội bộ hoặc tên nghiệp vụ nhạy cảm; `mauSac` nên kiểm định dạng. `TS:135`, `TS:136`. |
| QĐ72 giữ lại | `nguon_url`, tên/số văn bản/cơ quan ban hành; `gia_tri_text/dieu_khoan/ten` của quy tắc vẫn là chuỗi mở. Chỉ giữ bản ghi đối chiếu được với nguồn pháp lý công khai. `TS:141`, `TS:142`. |

Các FK/ID danh mục, mã đơn vị, đơn vị đo, thuộc tính kỹ thuật chuẩn **không tự thân là dữ liệu cá nhân**. Tuy nhiên, tất cả `id` đều được miễn làm trắng tại `TS:291`: cần xác nhận ID là khoá kỹ thuật, không chứa định danh nghiệp vụ/người thật.

**P1 — `CONG_KHAI` chưa đủ chứng minh tài liệu được phép đưa lên staging.**

`phamVi` là nhãn truy cập trong ứng dụng, không phải chứng nhận tài liệu pháp luật đã được thẩm định. Migration còn ghi rõ `CONG_KHAI` nghĩa là mọi tài khoản, kể cả phường/xã, tra được.

Vẫn giữ:

- `TaiLieu.nguon`: tên tệp gốc hoặc URL, có thể lộ tên người, đường dẫn nội bộ.
- `TaiLieuChunk.noiDung/viTri`: nội dung tự do, có thể chứa dữ liệu cá nhân chưa xuất hiện trong nguồn từ điển.
- `embedding`: được giữ vì là `Unsupported`, không được xoá hay quét.

Vị trí: `TS:138`, `TS:139`, `TS:291`; `Schema:2997`, `Schema:3033`, `Schema:3034`; `app/prisma/migrations_manual/024_rag_tai_lieu.sql:18`.

**Bắt buộc:** chỉ nhập lại corpus công khai đã duyệt theo ID/nguồn cụ thể, làm sạch URL/tên tệp; xoá embedding rồi sinh lại từ nội dung đã duyệt. Không chỉ lọc nhãn `CONG_KHAI`.

**P1 — Hậu điều kiện có điểm chặn vận hành và khoảng trống bao phủ.**

1. `_prisma_migrations` không nằm trong danh sách giữ và không được DELETE. Nếu dump có bảng này với lịch sử migration, `TS:312` sẽ từ chối. Đây là **thất bại an toàn**, nhưng công cụ chưa chạy thành công được trên bản khôi phục thông thường có lịch sử Prisma. Không nên whitelist nguyên bảng vì trường log có thể chứa thông tin nội bộ.
2. Cột mới trong bảng giữ nhưng chưa có trong Prisma sẽ không được làm trắng. Quét từ điển không thay thế whitelist: một Json mới chứa người chưa có trong từ điển vẫn có thể lọt.
3. Hậu kiểm bảng thường không bao phủ dữ liệu materialized view và large object; `pg_dump` toàn CSDL tại `PS:74` có phạm vi rộng hơn hậu kiểm.
4. Từ điển bỏ sót các nguồn có sẵn như `cchn_ho_so.email`, định danh trong `httt_*`, email liên hệ khác. Còn loại trừ cứng `admin@htkt.com.vn` tại `TS:268`.

**Bắt buộc:** xử lý riêng metadata migration; kiểm tra schema thực so với manifest cột/kiểu; từ chối hoặc làm sạch đối tượng ngoài phạm vi; mở rộng nguồn từ điển và bỏ ngoại lệ email không cần thiết. Mọi truy vấn động nên chỉ rõ `public.%I`, thay vì dựa vào `search_path`.

**P1 — PowerShell chưa bảo đảm dừng và dọn dẹp ở mọi nhánh lỗi.**

- `dropdb`, `createdb`, truy vấn đếm, tạo bản sao và tạo marker không được kiểm mã thoát ngay: `PS:41`–`PS:54`.
- Restore thất bại vẫn tiếp tục tạo staging: `PS:50`. Bản khôi phục thiếu constraint hoặc dữ liệu vẫn có thể được xử lý tiếp.
- Không có `try/finally`: lỗi gọi chương trình, nhập mật khẩu, ghi log hoặc xử lý stderr có thể bỏ qua đoạn xoá CSDL.
- Trên Windows PowerShell 5.1, stderr của native command qua `2>&1` kết hợp `$ErrorActionPreference='Stop'` có thể làm pipeline dừng trước khi đến `$maPsql`/cleanup. PostgreSQL `NOTICE` cũng đi qua stderr: `PS:59`.
- Dump dùng tên cố định; lần thất bại trước khi dump không vô hiệu hoá tệp cũ. `pg_dump` lỗi có thể để tệp dở dang: `PS:73`–`PS:75`.

**Bắt buộc:** kiểm từng mã thoát; restore lỗi phải dừng; dùng `try/finally` cho cleanup và kiểm kết quả cleanup; dump vào tên tạm theo lần chạy, chỉ công bố đường dẫn cuối sau khi thành công, loại bỏ tệp tạm khi lỗi.

**3. Đúng đắn SQL và PowerShell**

| Hạng mục | Kết quả kiểm tra tĩnh |
|---|---|
| Thứ tự DELETE theo Prisma | Hợp lý với các FK được parser đọc. Test chỉ kiểm chính đồ thị này, chưa kiểm constraint thực trong PostgreSQL. |
| FK SQL tay | Phát hiện `cchn_ho_so → httt_nang_luc_ca_nhan` không khai quan hệ Prisma; SQL xoá cha trước con tại `an-danh-hoa.sql:196`, `:227`. Migration `047_cchn_ho_so.sql:76` dùng **ON DELETE SET NULL**, nên trường hợp này không làm DELETE lỗi. Không nên báo nhầm đây là FK Restrict. |
| FK Restrict/No Action ngoài manifest | Có thể làm DELETE lỗi. Với `ON_ERROR_STOP` và transaction, lỗi trước COMMIT khiến kết nối đóng và transaction rollback. Đây là bảo vệ đúng; wrapper vẫn cần bảo đảm xoá bản sao chứa dữ liệu thật sau rollback. |
| TaiLieu → Chunk | Xoá tài liệu trước chunk được vì FK `ON DELETE CASCADE`, theo migration hiện tại. |
| INSERT User/CanBo | Không thấy thiếu cột bắt buộc không có default theo schema và DDL đã đọc. `updatedAt` được cung cấp. Role rỗng khiến tài khoản giữ chỗ lỗi NOT NULL và rollback. |
| 40 cán bộ gắn tài khoản | Chỉ cán bộ có `g ≤ số tài khoản` được gắn `userId`; các cán bộ còn lại NULL. `TS:344`, `TS:355`. Không đúng nếu yêu cầu là cả 40 đều có tài khoản. |
| `make_date` | Khoảng tháng 1–12, ngày 1–28 hợp lệ. |
| `round(...::numeric, 2)` → Float | Không thấy lỗi kiểu; PostgreSQL có thể gán numeric sang double precision. |
| `'\x'::bytea` | Là bytea rỗng với `standard_conforming_strings=on`; nên đặt rõ cấu hình này để không phụ thuộc phiên kết nối. |
| `position`/regexp | Dùng literal đúng; `\D` ở nguồn và `[\s.\-]` ở đích đáp ứng số có dấu cách/chấm/gạch. Không bảo đảm bắt biến thể tên, JSON escape, số có định dạng khác hoặc định danh không có trong từ điển. |
| `\gset`/`\if` | Đặt ngoài DO đúng; boolean trả về dùng được cho `\if`; thiếu/mật khẩu ngắn thoát trước transaction. |
| `-match` | `Out-String` tạo scalar nên các phép `-match` trả boolean đúng; regex COMMIT chấp nhận CRLF. Cổng này vẫn phụ thuộc thông báo không bị cấu hình psql/client làm mất. Nên chạy `psql -X`. |
| SecureString | Nhập ẩn đúng, nhưng chuyển thành plaintext qua `-v` làm mật khẩu xuất hiện trong command line tiến trình. BSTR không được `ZeroFreeBSTR`. `PS:58`–`PS:59`. Cần giải phóng trong `finally` và tránh truyền bí mật bằng argv. |
| PS 5.1 + BOM | Tệp có UTF-8 BOM `EF BB BF`, phù hợp đọc Unicode trên PS 5.1. Chưa xác nhận toàn bộ luồng thực thi; môi trường hiện tại chặn API parser PowerShell bởi ConstrainedLanguage. |

Cột số/ngày **vẫn có thể lộ dữ liệu nội bộ**, dù không còn lịch sử lương cá nhân: `Project.totalBudget/gpmbBudget/spentAmount/completionPct`, lịch dự án/mốc thực tế (`Schema:1176`, `Schema:1210`); giá và tồn kho `Material` (`Schema:1240`); lịch bảo trì (`Schema:862`); công suất vận hành, toạ độ và cấu trúc mạng; trạng thái/năm của báo cáo chưa công bố. Các thời điểm `createdAt/updatedAt` cũng giữ dấu vết hoạt động. **Bắt buộc chuyển từ “mọi số/ngày đều giữ” sang manifest được duyệt**, hoặc sinh giả/làm thô những trường chưa có bằng chứng công khai (`TS:291`).

Để chuyển sang **ĐẠT CÓ ĐIỀU KIỆN**, cần sửa các P1 trên rồi chạy PostgreSQL nội bộ với dữ liệu kiểm thử có chủ đích: lịch sử Prisma, FK SQL tay, cột lạ, nội dung whitelist chứa định danh ngoài từ điển, stderr NOTICE, restore lỗi và dump lỗi. Bộ test hiện tại qua nhưng chủ yếu xác nhận chuỗi SQL và quy tắc sinh; chưa kiểm chứng các tình huống quyết định này.

---

## Vòng 3

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN để chạy thử trên PostgreSQL nội bộ**, trong môi trường dùng một lần, sau khi đáp ứng các điều kiện bên dưới. Chưa đủ cơ sở cho phép mang dump lên VPS.

Đã kiểm đúng nhánh `b0-va-khan-htkt-brain`, không sửa tệp, không đọc `.env*`, `secrets/`, `*.dump`, không mạng, không kết nối CSDL. `npm.cmd test`: **32/32 đạt**, gồm 9 test ẩn danh. SQL đã sinh **khớp hoàn toàn** với kết quả sinh trong bộ nhớ từ mã hiện tại.

**1. Đối chiếu sửa đổi**

Các đường dẫn trong bảng tính từ thư mục `app/`.

| Hạng mục | Đánh giá | Bằng chứng |
|---|---|---|
| Xoá `description` của Role, Permission, AssetType, MaintenanceSchedule, InspectionTemplate/Item | **ĐÃ** | `lib/an-danh/an-danh.ts:107–134`: bỏ khỏi danh sách giữ; bộ sinh xoá tại dòng 324–330. |
| Xoá `moTa` của ba danh mục Office | **ĐÃ** | `lib/an-danh/an-danh.ts:153–155`, cùng cơ chế xoá mặc định. |
| Bỏ `Asset.techSpecs` | **ĐÃ** | `lib/an-danh/an-danh.ts:131`. |
| GeoJSON chỉ còn hình học, properties rỗng | **MỘT PHẦN** | `lib/an-danh/an-danh.ts:84–98`: dựng lại đối tượng, nhưng sao chép nguyên `coordinates`, chưa kiểm kiểu số/cấu trúc. |
| `TaiLieu.nguon` chỉ tên tệp | **ĐÃ** | `lib/an-danh/an-danh.ts:163`: bỏ tiền tố đến dấu `/` hoặc `\` cuối. Tên tệp vẫn có thể chứa tên người. |
| `_prisma_migrations`: xoá logs, miễn kiểm rỗng | **ĐÃ** | `lib/an-danh/an-danh.ts:335,352`. |
| Chặn large object, materialized view | **ĐÃ** | `lib/an-danh/an-danh.ts:358–361`. |
| Manifest cột nội dung ngoài Prisma | **ĐÃ**, trong phạm vi kiểu dữ liệu liệt kê | `lib/an-danh/an-danh.ts:345–346,370–375`. |
| Từ điển rỗng bị từ chối; mở rộng nguồn; bỏ ngoại lệ admin | **ĐÃ** | `lib/an-danh/an-danh.ts:282–303,394`. |
| `public.%I`; `standard_conforming_strings` | **ĐÃ** | `lib/an-danh/an-danh.ts:254,365,379,388`. Các lệnh sửa dữ liệu vẫn có nhiều tên bảng không kèm schema. |
| PowerShell kiểm mã thoát; restore lỗi thì dừng | **MỘT PHẦN** | `scripts/an-danh-hoa.ps1:37–40,65`: đúng khi tiến trình thực sự chạy; chưa chắc chắn khi không khởi chạy được lệnh. |
| `try/catch/finally`, dump tạm rồi đổi tên | **MỘT PHẦN** | `scripts/an-danh-hoa.ps1:49–106`: có đầy đủ nhánh, nhưng lỗi cmdlet với `Continue` chưa luôn làm dừng. |
| Mật khẩu qua tệp tạm; `ZeroFreeBSTR`; `psql -X` | **MỘT PHẦN** | `scripts/an-danh-hoa.ps1:75–83,100`: đã tránh argv; escape cho `\set` chưa đúng đầy đủ. |
| Marker mô tả là wrapper tạo trên bản sao | **ĐÃ** | `lib/an-danh/an-danh.ts:267–275`; `scripts/an-danh-hoa.ps1:70–72`. |
| 40 cán bộ, chỉ N người đầu có tài khoản | **ĐÃ** | `lib/an-danh/an-danh.ts:403–415`. Chấp nhận chủ ý này; chú thích dòng 398 vẫn dễ gây hiểu nhầm. |

**2. Các điểm kỹ thuật cần chú ý**

- **SQL GeoJSON:** chưa thấy lỗi ngoặc hoặc kết hợp toán tử trong SQL sinh ra tại `an-danh-output/an-danh-hoa.sql:102–109`. Nhánh FeatureCollection lấy `geometry` của từng feature đúng. Tuy nhiên, dữ liệu như `{"type":"Point","coordinates":["Tên người","Thông tin riêng"]}` vẫn được giữ nguyên phần chữ nếu không khớp từ điển. `features` sai kiểu có thể làm `jsonb_array_elements` lỗi và rollback; GeometryCollection hiện trở thành NULL. Cần phân biệt “loại bỏ properties” với “đã xác thực chỉ còn hình học”.
- **Manifest `?` trong PL/pgSQL:** không phải placeholder tham số. Biểu thức `NOT (manifest -> table_name) ? column_name` tại `lib/an-danh/an-danh.ts:373` được hiểu là phủ định kết quả toán tử `?`; **không coi đây là lỗi cú pháp**. Viết `NOT ((manifest -> table_name) ? column_name)` sẽ rõ hơn. Chưa thực thi PostgreSQL nên đây là kết luận đọc mã.
- **`Set-StrictMode -Version 2`:** không phát hiện xung đột tự thân. **`$H + @(...)` hoạt động đúng**; đã kiểm cách bind tham số bằng hàm giả, không gọi PostgreSQL.
- **`\i` trên Windows:** `.Replace('\','/')` là đúng trong PowerShell; đường dẫn có khoảng trắng đã được bao nháy. Đường dẫn chứa dấu `'` chưa được escape tại `scripts/an-danh-hoa.ps1:79`.
- **Mật khẩu `\set`:** dòng 78 dùng quy tắc SQL `''`, trong khi đối số lệnh meta của psql có quy tắc escape riêng. Dấu `'` có thể bị mất; dấu `\` có thể bị diễn giải. Kết quả có thể là mật khẩu được lưu khác mật khẩu nhập. Cần sửa hoặc giới hạn bộ ký tự trong lần thử đầu.
- **`Add-Content -Encoding UTF8`:** phù hợp cho biên bản. Vấn đề là lỗi ghi biên bản không bắt buộc dừng vì `$ErrorActionPreference='Continue'` (`scripts/an-danh-hoa.ps1:20,34`). Tương tự với `Set-Content`, `Move-Item`, `Remove-Item`: cần xử lý lỗi rõ ràng ở các thao tác quyết định thành công.
- **`$LASTEXITCODE` trong hàm:** đọc ngay sau pipeline là hợp lý khi chương trình native đã chạy. Nếu lệnh không tồn tại/không khởi chạy được, với `Continue`, biến có thể chưa tồn tại hoặc giữ mã cũ; `StrictMode` không biến cách này thành kiểm tra đáng tin cậy. Áp dụng cho `Chay` và `XoaCsdl` (`scripts/an-danh-hoa.ps1:38–44`).
- **Dọn dẹp CSDL:** tên `ql_htkt_khoi_phuc`, `ql_htkt_an_danh` cố định, bị xoá ngay đầu và trong `finally` (`scripts/an-danh-hoa.ps1:31,62,103–104`). Chỉ chạy thử trên instance dùng riêng, nơi hai tên này được dành cho công cụ.
- **Tệp mật khẩu tạm:** không có ACL riêng trong mã, tên chỉ chính xác đến giây; BSTR được xoá ở `finally` nhưng các chuỗi .NET không được bảo đảm xoá khỏi bộ nhớ. Đây là hạn chế còn lại, dù đã cải thiện đáng kể so với argv.

Các test mới tại `lib/an-danh/an-danh.test.ts:75–101` chủ yếu kiểm sự hiện diện của chuỗi; chưa kiểm hành vi SQL hoặc wrapper PowerShell. Không dùng kết quả test xanh để suy ra các đường chạy trên đã được xác minh.

**3. Hai điểm không chấp thuận**

**Tôi chấp nhận chuyển phân loại dữ liệu vận hành cho chủ hệ thống quyết định.** Rút yêu cầu bắt buộc làm thô mọi số/ngày khỏi tiêu chí lỗi công cụ theo phạm vi Q3 bạn nêu. Rủi ro còn lại là dữ liệu hạ tầng, ngân sách và vị trí có thể cần hạn chế công bố; đồng thời các trường được giữ như `Project.investor` có thể thực tế chứa cá nhân (`lib/an-danh/an-danh.ts:138`). Trường hợp sau vẫn liên quan trực tiếp đến dữ liệu định danh, không chỉ phân loại vận hành.

**Tôi chấp nhận không bắt buộc xoá rồi sinh lại embedding**, nếu xác nhận embedding được tính từ đúng `noiDung` hiện giữ và không chứa phiên bản nội dung cũ. Mã hiện tại giữ vector, không kiểm chứng quan hệ đó (`prisma/schema.prisma:3028–3036`). Việc phê duyệt corpus thuộc chủ hệ thống; `CONG_KHAI` là điều kiện lọc, chưa phải bằng chứng từng tài liệu đã được duyệt. Quét từ điển cũng có thể bỏ sót tên ngắn, biến thể hoặc người không có trong nguồn từ điển.

**4. Điều kiện chạy thử và câu hỏi quản trị**

Điều kiện cho lần chạy thử nội bộ:

1. Dùng instance PostgreSQL dùng riêng; hai tên CSDL cố định không chứa dữ liệu cần giữ.
2. Sửa escape mật khẩu/đường dẫn và xử lý lỗi cmdlet; nếu chưa sửa, lần thử đầu dùng mật khẩu dài chỉ gồm chữ–số, đường dẫn không có dấu `'`, kiểm thủ công việc tạo tệp, đổi tên và dọn dẹp.
3. Thử các ca GeoJSON hợp lệ, sai kiểu và `coordinates` chứa chữ; bổ sung xác thực trước khi coi kết quả là “chỉ hình học”.
4. Giữ toàn bộ kết quả trong nội bộ; kiểm đăng nhập bằng mật khẩu đã nhập, 40 cán bộ, liên kết tài khoản, rollback khi lỗi và dọn CSDL. Chưa phê duyệt dump để xuất VPS.

Chủ hệ thống cần quyết:

- Những nhóm dữ liệu vận hành nào được phép lên VPS?
- `Project.investor` và các trường tên/địa chỉ được giữ có chứa cá nhân không?
- Corpus `CONG_KHAI` nào đã được duyệt, và có bảo đảm embedding đồng bộ với văn bản hiện tại không?

Nếu “chạy thử” yêu cầu wrapper tự động chạy an toàn mà không có các giới hạn và kiểm tra thủ công trên, đánh giá hiện tại là **CHƯA ĐẠT**.
