# Rà soát CSDL, hiệu năng truy vấn và căn cứ pháp lý trong mã — 28/10/2026

> Phạm vi: phần **chưa** được bộ rà soát `docs/htkt-brain-review/` (15–21/10) đi sâu: cấu trúc CSDL, mẫu truy vấn, văn bản pháp luật viện dẫn cứng trong mã.
> Phương pháp: **phân tích tĩnh**. Dựng CSDL trong bộ nhớ (PGlite) từ `schema.prisma` + chỉ mục/khoá ngoại của `migrations_manual` + chạy nguyên văn migration 049, rồi truy vấn catalog PostgreSQL; quét mã bằng script. **Không** chạm CSDL thật, **không** có số dòng/thống kê truy vấn production → mọi nhận định "nhanh hơn" là ước lượng cho tới khi đo `EXPLAIN ANALYZE` trên bản sao.
> Nhãn: CONFIRMED (thấy trực tiếp trong mã/migration hoặc đã chạy) · INFERRED (suy luận) · ĐỀ XUẤT (chưa làm, cần duyệt).
> Nhánh: `ra-soat-csdl-phap-ly-2026-10` tách từ `origin/main` (`1c0a47b`). Bản dựng CSDL lấy schema và migration của nhánh `kpi-xep-loai-quy-2026` (= `main` + `049_chatbot_log_token`), vì đó là trạng thái sẽ lên production khi nhánh KPI được gộp.

## 1. Tóm tắt

| # | Mức | Phát hiện | Trạng thái |
|---|---|---|---|
| 1 | **Cao** | Nút "Xoá hồ sơ cán bộ" xoá vĩnh viễn lịch sử lương, khen thưởng, kỷ luật, đánh giá, nghỉ phép, con cán bộ — vì FK tới `can_bo` là `ON DELETE CASCADE` (migration 002, 003, 004, 007, 046; riêng `office_generated_documents` là `SET NULL`), trong khi mã tưởng việc xoá sẽ bị chặn | **Đã sửa ở mã**: trong một giao dịch, khoá dòng `can_bo` (`FOR UPDATE`) rồi mới đếm dữ liệu liên quan và xoá — không còn khe hở giữa lúc đếm và lúc xoá (Codex chỉ ra ở bản sửa đầu). Đổi FK sang `RESTRICT` vẫn là ĐỀ XUẤT để chặn cả đường xoá không qua hàm này |
| 2 | TB | Trang cảnh báo nghỉ hưu hiển thị căn cứ **NĐ 46/2010** (hết hiệu lực 01/7/2025 theo NĐ 170/2025 Đ71 k2 b — dữ liệu pháp lý của chính repo) | **Đã sửa** |
| 3 | TB | Nhãn "Vị trí việc làm (**NĐ 62/2020**)" ở form hồ sơ, kiểm tra hồ sơ, trang cảnh báo; dữ liệu pháp lý repo ghi ưu tiên **NĐ 361/2025** | **Đã sửa** (không khẳng định NĐ 62/2020 hết hiệu lực toàn bộ — repo ghi "chưa xác định dứt điểm") |
| 4 | TB | Rà soát nâng lương: 2 truy vấn/cán bộ (N+1); hai người bấm cùng lúc thì một người **gặp lỗi UNIQUE** (không tạo được dòng trùng vì đã có ràng buộc) | **Đã sửa** (`createMany` + `skipDuplicates`). Khác hành vi cũ: lỗi không phải trùng làm **cả lô** thất bại thay vì lưu một phần |
| 5 | Thấp | **4 chỉ mục thừa đã xác nhận** trong migration (là tiền tố của chỉ mục/ràng buộc khác) + 2 ứng viên chưa xác nhận trên CSDL thật | ĐỀ XUẤT (§3.2), cần đo trước khi bỏ |
| 6 | TB | Tiền tệ lưu `double precision` (≥ 14 cột, gồm `ds_ke_hoach_von`, `projects`, `work_orders`) | ĐỀ XUẤT — xem §3.3, rủi ro phụ thuộc đơn vị |
| 7 | TB | Bảng đăng ký hiệu lực văn bản (`prisma/hieu-luc-vbpl.json`) là **nháp 4/7/2026**: 126 văn bản, 0 "hết hiệu lực"; mã viện dẫn 191 văn bản khác nhau | ĐỀ XUẤT — §5 |
| 8 | Thấp | 7 bảng `bao_tri_*` (migration 036) không có trong `schema.prisma`, dùng bằng SQL thô ở 3 tệp | ghi nhận |

**Không phát hiện:** khoá ngoại thiếu chỉ mục (0/212 sau migration 041 và 049, theo bản dựng); đường chèn SQL ở 6 chỗ `$queryRawUnsafe/$executeRawUnsafe` (giá trị người dùng đều bind `$n`; `SET LOCAL hnsw.ef_search` là hằng; `LIMIT` ở `lib/rag/search.ts` nội suy `topK` đã ép về số nguyên 1–20).

## 2. Tự sửa sai trong quá trình rà (để người đọc biết độ tin cậy của công cụ)

- Lần chạy đầu báo **9 FK thiếu chỉ mục** — sai: migration 049 tạo chỉ mục `doiTuongId` bằng SQL động (`EXECUTE format`), bộ trích của tôi không thấy. Sau khi chạy nguyên văn migration: **0**.
- Lần đầu báo **0 chỉ mục tiền tố thừa** — sai: so sánh mảng `int2vector` (chỉ số gốc 0) với mảng cắt lát (gốc 1) luôn khác. Sửa phép so sánh: **6**.
- Cột "văn bản có trong kho RAG" ở bản kiểm kê pháp lý **không đáng tin** (bộ khớp tên tệp chỉ nhận được 14/126 tệp) → không dùng để kết luận.
- Bản dựng báo **2 cặp chỉ mục trùng hệt** (`con_can_bo`, `thanh_tich_con`) — sai, do bản dựng gộp chỉ mục khai ở Prisma với chỉ mục khác tên ở migration 046; CSDL thật chỉ có một (Codex chỉ ra). Tương tự, chỉ mục chỉ khai trong `schema.prisma` chưa chắc có trên CSDL thật, vì dự án tạo bảng bằng SQL thủ công.

## 3. Cơ sở dữ liệu

Quy mô dựng được: 141 bảng, 212 khoá ngoại, 557 chỉ mục (gồm HNSW cho `tai_lieu_chunk` từ migration 041). 12 câu tạo chỉ mục của migration không áp được trên bản dựng: 10 thuộc bảng `bao_tri_*` (không có trong Prisma), 2 là ràng buộc đã tồn tại.

### 3.1 Xoá dây chuyền (`ON DELETE CASCADE`) — 59 FK
Đáng chú ý nhất là 9 bảng nhân sự trỏ `can_bo` (mục 1). Các nhóm khác (`qd72_survey_cases` → 19 bảng con, `road_connection_applications` → 4, `tai_lieu` → `tai_lieu_chunk`) là quan hệ cha–con của cùng một hồ sơ, hợp lý. **ĐỀ XUẤT:** với hồ sơ nhân sự có nghĩa vụ lưu trữ, đổi FK sang `ON DELETE RESTRICT` (migration 050, cần duyệt) để CSDL tự chặn — lớp chặn ở mã chỉ bảo vệ đường đi qua `deleteCanBoAction`.

### 3.2 Chỉ mục thừa — ứng viên

| Bảng | Chỉ mục thừa | Đã được bao bởi | Có câu tạo trong migration? |
|---|---|---|---|
| nghiep_vu_ban_ghi | linhVuc_idx | (linhVuc, toChucId) | có |
| office_salary_review_cases | canBoId_idx | UNIQUE (canBoId, namRaSoat, loai) | có (004) |
| overtime_timesheets | toChucId_idx | UNIQUE (toChucId, thang, nam) | có |
| phan_cong_linh_vuc | toChucId_idx | UNIQUE (toChucId, linhVucKey) | có |
| chatbot_logs | feedback_idx | idx_chatbot_logs_hoc_hoi (041) | **chưa thấy** — có thể chỉ khai ở Prisma |
| phan_cong | canBoId_idx | UNIQUE (canBoId, toChucId, chucDanhId, tuNgay) | **chưa thấy** |

Chỉ mục tiền tố thừa về mặt **khả năng phục vụ** truy vấn, nhưng chỉ mục đơn nhỏ hơn đôi khi vẫn được bộ lập kế hoạch ưu tiên, nên lợi ích bỏ đi (ghi nhanh hơn, ít chỗ hơn) **phải đo** (`pg_stat_user_indexes.idx_scan`, kích thước). **Trước khi bỏ, chạy truy vấn chỉ-đọc này trên bản sao** để lấy đúng tên và xác nhận chỉ mục có thật, rồi mới `DROP INDEX CONCURRENTLY` từng cái (và bỏ `@@index` tương ứng trong `schema.prisma`):

```sql
with ix as (
  select i.indexrelid::regclass::text idx, i.indrelid tbl, i.indisunique uq, i.indisprimary pk, i.indkey::int2[] k,
         i.indpred is null and i.indexprs is null plain, am.amname am
  from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam)
select a.tbl::regclass::text bang, a.idx thua, b.idx bao_boi
from ix a join ix b on a.tbl=b.tbl and a.idx<>b.idx
where a.am='btree' and b.am='btree' and a.plain and b.plain and not a.uq and not a.pk
  and array_length(a.k,1) <= array_length(b.k,1)
  and array_to_string(b.k[0:array_length(a.k,1)-1], ',') = array_to_string(a.k, ',')
  and (array_length(a.k,1) < array_length(b.k,1) or b.uq or a.idx > b.idx)
order by 1, 2;
```

### 3.3 Tiền tệ kiểu số thực
`double precision` biểu diễn **chính xác** mọi số nguyên có trị tuyệt đối ≤ 2⁵³ (≈ 9·10¹⁵), nên tiền tính bằng **đồng, số nguyên** (như `projects.*Budget`, ghi chú "(đồng)") không sai số khi cộng **với điều kiện** mọi toán hạng và mọi tổng trung gian còn trong miền đó (vượt 2⁵³ thì `2⁵³ + 1` đã bằng `2⁵³`). Với ngân sách một Sở, miền này rất rộng (INFERRED về dữ liệu). Rủi ro thực tế lớn hơn nằm ở cột lưu **phần thập phân** (ví dụ triệu đồng có lẻ) — `ds_ke_hoach_von` có `tongKH`, `giaiNgan`, `daHuyDuToan`… không ghi đơn vị. **ĐỀ XUẤT:** xác nhận đơn vị; nếu có lẻ, chuyển sang `numeric(18,2)` theo hai đợt (thêm cột mới + ghi song song, rồi bỏ cột cũ) — đổi kiểu tại chỗ sẽ khoá bảng.

### 3.4 Cột `…Id` không có khoá ngoại (97)
Phần lớn là người tạo/duyệt (`createdById`, `nguoiKyId`…) và liên kết đa hình (`audit_logs.targetId`, `qd72_*.doi_tuong_id`) — có thể cố ý. Rủi ro: bản ghi mồ côi khi xoá người dùng. **ĐỀ XUẤT** (thấp): chạy kiểm tra mồ côi định kỳ trên bản sao trước khi quyết định thêm FK.

### 3.5 Chỉ mục ghép cho báo cáo công việc (ĐỀ XUẤT, cần đo)
`lib/htkt/bao-cao.ts` lọc `cong_viec` theo `toChucId` + khoảng `ngayHetHan` + `deletedAt IS NULL`; hiện chỉ có chỉ mục từng cột. Ứng viên: `CREATE INDEX CONCURRENTLY … ON cong_viec ("toChucId", "ngayHetHan") WHERE "deletedAt" IS NULL`. Chỉ thêm nếu `EXPLAIN ANALYZE` trên bản sao cho thấy quét chậm.

## 4. Mẫu truy vấn trong mã (608 tệp)

| Mẫu | Số ứng viên | Kết luận sau khi đọc tay |
|---|---|---|
| `await` truy vấn trong vòng lặp | 29 | N+1 thật đã sửa: rà soát nâng lương. Còn lại: phần lớn ở **import** (`ward-reports/import` 8, `import/assets` 3, `import/luong` 3) — thao tác quản trị theo lô, chấp nhận được; nên bọc giao dịch để không nhập dở. `nghiep-vu`, `cong-viec`: vòng **thử lại sinh mã**, không phải N+1. Chatbot `canhBaoSoHieuLa`: 1 truy vấn/số hiệu (thường 1–3) — gộp được, lợi nhỏ |
| `findMany` không `take` | 137 (25 không `where`) | Đa số đọc **danh mục nhỏ** (vai trò, chức danh, loại tài sản). Theo dõi các bảng tăng dần: `ward_reports`, `report_dien_cs`, `office_generated_documents` — nên phân trang khi dữ liệu lớn |
| SQL thô | 6 | Giá trị đều bind tham số; `SET` là hằng; `LIMIT` nội suy số đã giới hạn 1–20 — chưa thấy đường chèn |

**RAG:** tìm kiếm HNSW lọc theo phạm vi quyền **sau** khi lấy ứng viên (`ef_search = 100`), nên phạm vi hẹp có thể trả thiếu đoạn. Nếu pgvector trên máy chủ **≥ 0.8**, thêm `SET LOCAL hnsw.iterative_scan = relaxed_order` để quét tiếp tới khi đủ (ĐỀ XUẤT, cần biết phiên bản pgvector — chưa có). Nạp tài liệu chèn từng đoạn một lượt: lợi ích gộp nhỏ so với thời gian gọi API embedding.

## 5. Căn cứ pháp lý trong mã

- Mã viện dẫn **191 văn bản** khác nhau (nhiều nhất: NĐ 217/2026 — 93 lần/28 tệp; NĐ 170/2025; NĐ 347/2026; NĐ 258/2025). Phần lớn viện dẫn văn bản cũ đều **kèm ghi chú đã thay thế** (ví dụ NĐ 175/2024 → NĐ 217/2026), đúng.
- Lỗi đã sửa: NĐ 46/2010 trên trang cảnh báo nghỉ hưu; nhãn NĐ 62/2020 cho vị trí việc làm công chức (6 chỗ, gồm ghi chú).
- **Không tự xác minh** hiệu lực văn bản (không có nguồn chính thức trong phiên). Cơ chế đúng đã có: `scripts/ra-soat-hieu-luc.mjs` đọc chính điều khoản thi hành trong kho, phân biệt bãi bỏ toàn bộ/sửa một phần — **chạy trên CSDL thật**, rồi cập nhật `hieu-luc-vbpl.json` (đang là nháp 4/7/2026).
- Cần người có thẩm quyền xác nhận: hiệu lực NĐ 106/2020 (VTVL viên chức), NĐ 90/2020 (đánh giá, xếp loại), NĐ 11/2013 (đầu tư phát triển đô thị) — mã còn viện dẫn, repo không có kết luận.
- Ghi chú `schema.prisma` của `CanBo.viTriViecLam` đã sửa sang NĐ 361/2025 (CC) · NĐ 106/2020 (VC). Ghi chú `//` không đổi cấu trúc dữ liệu, nhưng `inlineSchema` của client sinh chứa nguyên văn schema nên đã chạy `prisma generate` và commit kèm 1 dòng đổi ở `lib/generated/prisma/internal/class.ts`.

## 6. Thay đổi mã trong lần rà này

| Tệp | Thay đổi |
|---|---|
| `app/actions/can-bo.ts` | Trong một giao dịch: khoá dòng `can_bo` `FOR UPDATE` → đếm 10 quan hệ → chỉ xoá khi đều bằng 0; thông báo cụ thể |
| `prisma/schema.prisma` (ghi chú) + `lib/generated/prisma/internal/class.ts` | Ghi chú căn cứ VTVL; client sinh lại |
| `app/actions/office.ts` | `createMany` + `skipDuplicates` thay vòng lặp 2 truy vấn/cán bộ |
| `app/dashboard/van-phong-so/canh-bao/page.tsx` | Căn cứ nghỉ hưu NĐ 170/2025 Đ62–63; VTVL NĐ 361/2025 (CC)/NĐ 106/2020 (VC) |
| `lib/ho-so-completeness.ts`, `components/van-phong-so/can-bo-profile-form.tsx`, `lib/ho-so-alert.ts`, `lib/office-docx.ts` | Nhãn/ghi chú căn cứ |

Kiểm: trên nhánh KPI `npm test` 64/64; trên nhánh này (`main` **chưa có** script `test` và chỉ có 1 tệp test — lưới 64 test cùng các bản vá bảo mật B0 hiện **chỉ nằm ở nhánh KPI**) chạy được `qd72/danh-gia.test.ts` 1/1; `tsc --noEmit` đạt và `eslint` các tệp sửa đạt trên **cả hai** nhánh. **Chưa** chạy giao diện; **chưa** có test tự động cho hai hàm sửa (cần CSDL thử); tính đúng của khoá `FOR UPDATE` dựa trên quy tắc khoá dòng của PostgreSQL (kiểm tra FK lấy `FOR KEY SHARE` trên dòng cha, xung đột với `FOR UPDATE`), **chưa** thử tranh chấp thật.

## 7. Phản biện Codex (vòng 1, `codex exec --sandbox read-only`)
CHANGES_REQUESTED, không blocker; 2 major + 5 minor — **đã xử lý cả 7**: khe hở đếm-rồi-xoá (thêm giao dịch + khoá dòng); "2 cặp trùng hệt" là sản phẩm bản dựng (đã bỏ); mô tả tranh chấp UNIQUE; điều kiện 2⁵³; mô tả SQL thô; nhãn VTVL tách CC/VC; ghi chú schema. Codex xác nhận: `_count` đủ 10 quan hệ, CASCADE đúng, `createMany` giữ hành vi (trừ lưu một phần khi lỗi), 4+2 ứng viên chỉ mục, sửa căn cứ đúng theo dữ liệu pháp lý của repo (không phải xác minh hiệu lực độc lập).

**Vòng 2:** APPROVE — giao dịch + `FOR UPDATE` đóng được khe hở ở READ COMMITTED (kể cả quan hệ gián tiếp `thanh_tich_con` → `con_can_bo`), `$queryRaw` bind an toàn, kiểu đúng. 2 minor đã sửa: ghi lỗi phía máy chủ (`console.error`) thay vì nuốt lỗi; trường hợp hồ sơ vừa bị người khác xoá trả "không tìm thấy" và **không** ghi nhật ký xoá.
