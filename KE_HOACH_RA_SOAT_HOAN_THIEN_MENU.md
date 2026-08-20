# KẾ HOẠCH RÀ SOÁT & HOÀN THIỆN TỪNG MỤC MENU / NỘI DUNG — QL HTKT

_Lập ngày 28/07/2026 · phối hợp Claude (Opus 4.8) + Codex CLI (gpt-5.5) · dựa trên số liệu audit tự động._

---

## A. Phương pháp & công cụ (đã thiết lập)

| Công cụ | Vai trò | Lệnh |
|---|---|---|
| `scripts/audit-menu-noi-dung.mjs` | Đối chiếu menu ↔ route ↔ nội dung, phát hiện link chết/mồ côi, xếp hạng độ hoàn thiện | `node scripts/audit-menu-noi-dung.mjs` |
| `scripts/preview-tat-ca-trang.mjs` | Quét runtime toàn bộ route (500/404/ChunkLoadError) | `node scripts/preview-tat-ca-trang.mjs` |
| `scripts/preview-chi-tiet-dong.mjs` | Quét trang chi tiết `[id]` với dữ liệu thật | `node scripts/preview-chi-tiet-dong.mjs` |
| **Codex CLI** | Review chéo tính chính xác pháp lý + logic từng phòng | `codex exec "<đề bài review>"` |

Đầu ra audit: `app/BAO_CAO_AUDIT_MENU.md` + `app/bao-cao-audit-menu.json` (tái tạo được).

---

## B. Hiện trạng khách quan (audit 28/07/2026)

- **Menu:** 167 mục / 206 route dashboard · **0 link chết** ✓ · 33 route "mồ côi" (đa số là trang `/moi`, `/import`, sub-page admin — hợp lệ).
- **Runtime:** 178/190 route OK · **7 trang HTTP 500 thật** (lặp lại ổn định) + vài 307 redirect lành tính.
- **Nội dung:** Phòng **HTKT = chuẩn vàng** (component chuyên dụng + 12 file `lib/htkt/*`, VBPL cập nhật 01/7/2026). 9 phòng khác + Trung tâm Bảo trì dùng **view dùng chung tham số hóa** (`components/phong/*-view`), độ sâu chưa đồng đều.

### Bản đồ độ hoàn thiện theo loại trang
| Loại | Nguồn nội dung | Trạng thái |
|---|---|---|
| `phap-ly` (10 phòng) | `lib/phong/phap-ly-phong.ts` (1015 dòng, có VBPL theo từng phòng/lĩnh vực) | ✅ Có dữ liệu — **cần rà tính hiệu lực 01/7/2026** |
| `tham-dinh` (10 phòng) | `lib/phong/tham-dinh-phong.ts` (17 quy trình / 9 phòng) | ⚠️ **Mỏng** (~1.9 quy trình/phòng) |
| `tham-muu` (10 phòng) | `lib/phong/tham-muu-phong.ts` (626 dòng) | 🟡 Khá — cần rà đối chiếu QĐ 331 |
| `mau-bieu` (10 phòng) | `components/phong/mau-bieu-view.tsx` → render thẳng `lib/htkt/mau-bieu` | 🔴 **BUG: mọi phòng đều hiện mẫu biểu của HTKT** (không lọc theo phòng) |
| Lĩnh vực nghiệp vụ | `DeptSection` + `NghiepVuSection` (nhập liệu động) | ✅ Chạy được — trừ nơi thiếu schema (gây 500) |

---

## C. Phát hiện trọng yếu (có bằng chứng)

### C1. 7 trang lỗi HTTP 500 — ✅ ĐÃ XỬ LÝ (không phải bug code)
1. `/dashboard/van-phong-so/canh-bao`
2. `/dashboard/cham-cong-lam-them`
3. `/dashboard/phong-htkt/khong-gian-ngam`
4. `/dashboard/phong-kh-tc/tai-chinh-ke-toan`
5. `/dashboard/phong-ql-vt/htx-gtvt`
6. `/dashboard/phong-qlhd-xd/trat-tu-xay-dung`
7. `/dashboard/cap-phep/dau-noi/moi`

> **NGUYÊN NHÂN GỐC (đã truy tới cùng qua log + pm2):** KHÔNG phải bug code. Lỗi thật trong `c:\logs\ql-htkt-error-1.log`:
> `TypeError: Cannot read properties of undefined (reading 'call') at Object.k [as require] (.next\server\webpack-runtime.js)` — webpack-runtime không resolve được module.
> - Build `.next` trên đĩa: **14:26** (source == build, 0 file mới hơn ⇒ build đúng, đủ).
> - Worker pm2 khởi động: **07:39–07:40** (7 tiếng TRƯỚC build) ⇒ worker giữ **module map cũ trong RAM**, khi request tới trang có chunk đã bị build 14:26 ghi đè → require nhận `undefined` → 500.
> - **Bản vá đã áp dụng:** `pm2 reload ql-htkt` (graceful, không cần rebuild vì build đã đúng). Sau reload: **cả 7 trang → 200 OK** ✅.
>
> **Lỗ hổng phát hiện thêm:** HA-watchdog restart worker 13 lần/ngày nhưng KHÔNG khỏi, vì health-check chỉ hit `/api/health` (chunk không đổi → luôn báo "khỏe") trong khi trang nội dung 500. ⇒ Đề xuất: sau mỗi `npm run build` phải `pm2 reload`; và cho watchdog kiểm thêm vài route nội dung, hoặc so BUILD_ID với thời điểm worker khởi động.

### C2. Bug nội dung `mau-bieu` — mọi phòng hiện mẫu của HTKT
`MauBieuView` render toàn bộ `MAU_BIEU` (bộ mẫu HTKT: cấp nước, thoát nước, cây xanh…) cho **mọi** phòng, không lọc theo `phongKey`. → Phòng KH-TC, QH-KT, Vận tải… đều thấy mẫu biểu sai chuyên môn.

### C3. `tham-dinh` mỏng — chỉ 1–2 quy trình/phòng, chưa phủ hết lĩnh vực QĐ 331.

### C4. `phap-ly` cần rà tính hiệu lực — có dữ liệu nhưng phải đối chiếu bộ VBPL 01/7/2026 (đã làm cho HTKT, cần lặp cho 9 phòng).

### C5. Route mồ côi cần xử lý (5 điểm đáng lưu ý trong 33):
- `/dashboard/profile` — nghi trùng `ho-so-ca-nhan` (legacy?)
- `/dashboard/van-phong-so/phap-ly` — có trang nhưng không có mục menu
- `/dashboard/phong-htkt/{bao-cao, phan-cong}` — có trang, chưa lên menu
- `/dashboard/cap-phep/{dau-noi, phuong-tien, xe-qua-kho, can-cu}` — sub-loại cấp phép, kiểm tra có được liên kết bằng tab trong trang cha không.

---

## D. Lộ trình theo giai đoạn

### GĐ0 — Baseline (ĐÃ XONG hôm nay)
- ✅ Công cụ audit + báo cáo ma trận + kết quả preview runtime.

### GĐ1 — Sửa lỗi CHẶN (correctness) — làm trước, ít tranh cãi
1. Điều tra & vá 7 trang HTTP 500 (lấy stack, sửa gốc).
2. Vá bug `mau-bieu`: lọc mẫu biểu theo phòng (mỗi phòng có bộ mẫu riêng; fallback rõ ràng nếu chưa có).
3. Dọn route mồ côi: bỏ/di hướng `profile`; thêm hoặc ẩn có chủ đích `van-phong-so/phap-ly`, `phong-htkt/{bao-cao,phan-cong}`; xác nhận liên kết `cap-phep/*`.
4. Verify lại bằng `preview-tat-ca-trang.mjs` → mục tiêu **hết 7 lỗi 500**. (Các mã 307 là `redirect()` có chủ đích — `nghi-phep` gộp về khu dùng chung, các trang `/moi` gộp vào trang cha; nên tinh chỉnh script coi 307 là OK để báo cáo sạch.)

### GĐ2 — Hoàn thiện NỘI DUNG từng phòng (đưa lên chuẩn HTKT)
Làm **tuần tự từng phòng**, mỗi phòng theo checklist mục G:
`phap-ly` (rà hiệu lực) → `tham-dinh` (bổ sung quy trình) → `tham-muu` (đối chiếu QĐ 331) → `mau-bieu` (mẫu đúng phòng) → schema nhập liệu lĩnh vực.

### GĐ3 — Codex review chéo pháp lý
Sau mỗi phòng ở GĐ2: `codex exec` review căn cứ pháp lý (còn hiệu lực? đúng thẩm quyền? đủ quy trình?) → Claude vá theo góp ý.

### GĐ4 — Nghiệm thu & lưu vết
- `preview-tat-ca-trang.mjs` + `preview-chi-tiet-dong.mjs` + smoke phòng liên quan.
- Cập nhật memory + `BAO_CAO_AUDIT_MENU.md`.

---

## E. Thứ tự ưu tiên phòng (đề xuất — chờ chốt)
1. **Phòng HTKT** — rà lần cuối (đã gần hoàn thiện, làm mẫu tham chiếu).
2. **Văn phòng Sở** — dùng nhiều nhất, có trang 500 (`canh-bao`).
3. Phòng **KH-TC**, **QLHĐ-XD** — nghiệp vụ lõi + đang có trang 500.
4. **QH-KT**, **PTĐT**, **KT-VLXD**.
5. **QL-Nhà & BĐS**, **QL Vận tải**, **QLKCHT-GT**, **QLCL-CTGT**.
6. **Trung tâm Bảo trì GT & HTKT**.

---

## F. Quy trình phối hợp Codex (mỗi phòng/mỗi mục)
1. Claude soạn/hoàn thiện nội dung + code.
2. `codex exec "review lib/phong/<file> cho phòng X: căn cứ pháp lý còn hiệu lực 01/7/2026? đúng thẩm quyền Sở XD QT theo QĐ 331? quy trình đủ bước? chỉ ra sai/thiếu."`
3. Claude đối chiếu góp ý ↔ nguồn VBPL, vá phần đúng, ghi chú phần bảo lưu.
4. Verify runtime → sang mục kế.

---

## G. Tiêu chí "HOÀN THIỆN" (Definition of Done) cho 1 mục menu
- [ ] Trang trả **200**, không 500/ChunkLoadError.
- [ ] Link menu trỏ đúng route; gate quyền đúng đối tượng.
- [ ] `phap-ly`: VBPL **còn hiệu lực 01/7/2026**, đúng lĩnh vực & thẩm quyền.
- [ ] `tham-dinh`: đủ các quy trình chính của phòng (hồ sơ, thời hạn, bước, căn cứ).
- [ ] `tham-muu`: nội dung tham mưu đúng chức năng QĐ 331.
- [ ] `mau-bieu`: mẫu đúng phòng, tải `.docx` OK, thể thức NĐ 30/2020.
- [ ] Schema nhập liệu khớp lĩnh vực (không crash, trường hợp lý).
- [ ] **Codex ký duyệt** phần pháp lý.

---

_Ghi chú: tài liệu này là bản kế hoạch — phần thực thi GĐ1→GĐ4 triển khai sau khi chốt thứ tự ưu tiên phòng._

---

## H. Biên bản Codex review chéo (28/07/2026, gpt-5.5)
**Bug `mau-bieu` — đồng thuận cách sửa:** view dùng chung KHÔNG import thẳng `lib/htkt/mau-bieu`; dùng helper `getMauBieuByPhong(phongKey)`; dữ liệu mẫu chung đặt ở `lib/phong/mau-bieu.ts`; phòng chưa có mẫu chuyên môn → fallback **bộ hành chính chung NĐ 30/2020** (tờ trình, công văn, báo cáo, kế hoạch, giấy mời, chỉ đạo, góp ý). **Chỉ HTKT thấy `lib/htkt/mau-bieu`; phòng khác TUYỆT ĐỐI không fallback sang mẫu HTKT.**

**5 điểm bổ sung vào kế hoạch (Codex nêu, tiếp thu):**
1. **Cách ly dữ liệu** theo `toChucId/phongKey` ở mọi view dùng chung — tránh lộ chéo dữ liệu giữa 11 phòng + VP Sở.
2. **Test hồi quy** `mau-bieu` cho ít nhất HTKT, KH-TC, Vận tải, VP Sở + test chống import nhầm dữ liệu HTKT.
3. **RBAC theo phòng** (chuyên viên/lãnh đạo/văn phòng/quản trị) — kế hoạch chưa nêu rõ.
4. **Trạng thái hiệu lực VBPL** trong `phap-ly`: ngày áp dụng, văn bản thay thế, nguồn kiểm chứng.
5. **Versioning/rollback nội dung** khi GĐ2 nhập song song với sửa lỗi.

**Thứ tự phòng:** giữ VP Sở → KH-TC → QLHĐ-XD; **tách VP Sở làm "chuẩn hành chính dùng chung"** để làm fallback cho phòng chưa hoàn thiện. Sau QLHĐ-XD ưu tiên phòng **rủi ro pháp lý cao / nhiều route dùng chung** thay vì đi tuần tự. **Chốt "contract" dữ liệu `phongKey/toChucId` TRƯỚC** khi làm song song GĐ1+GĐ2.
