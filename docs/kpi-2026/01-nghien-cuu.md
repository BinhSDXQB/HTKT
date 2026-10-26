# KPI xếp loại quý — nghiên cứu công văn, cách tính, hồ sơ từng cán bộ

> Lập 26/10/2026. Hạn nộp hồ sơ quý III về Văn phòng Sở: **trước ngày 29/10/2026**.
> Nguồn: Công văn 9409/SXD-VP (23/10/2026), QĐ 954/QĐ-SXD (25/8/2026), Phụ lục KPI Kế hoạch 2026 (48 trang).
> Công cụ chỉ **đề xuất** — kết quả do cán bộ tự đánh giá và lãnh đạo phòng, Sở quyết định.

## 1. Công văn 9409 yêu cầu gì (quý III/2026)

| Nội dung | Quy định |
|---|---|
| Hồ sơ mỗi cá nhân | (1) Danh mục sản phẩm/công việc chuẩn – Phụ lục 1; (2) Bảng tính điểm KPI – Phụ lục 2; (3) Bản tự đánh giá, xếp loại – Phụ lục 3a (công chức) / 3b (viên chức) |
| Tổng điểm | 30 (tiêu chí chung) + 70 (kết quả nhiệm vụ) |
| 6 trục kết quả | 35 / 10 / 7 / 8 / 5 / 5 điểm (Trục 1 chính, 2–6 phụ) |
| Điểm KPI | (A+B+C+D)/4: A số lượng, B chất lượng, C tiến độ, D năng lực lãnh đạo, chỉ đạo, điều hành |
| Điểm kết quả | Σ (điểm KPI từng trục × điểm tối đa trục) |
| Trục phụ không có nhiệm vụ | Ghi "Không có nhiệm vụ", chuyển toàn bộ điểm về Trục 1 |
| Mức theo điểm | ≥90 xuất sắc · 70–<90 tốt · 50–<70 hoàn thành · <50 không hoàn thành |
| Điều kiện KPI (CV 5653) | Xuất sắc: 100% NV và ≥30% NV vượt mức · Tốt: KPI đạt 100% · Hoàn thành: A, B, D = 100% và C từ 80% đến <100% |
| Giới hạn | Mỗi tập thể lãnh đạo phòng/đơn vị tối đa **01** người xuất sắc, phải giải trình thành tích |

Hệ quả cần biết: **một nhiệm vụ trễ hạn trong 5 nhiệm vụ làm C = 80%**, nên dù tổng điểm ≥ 90 mức tối đa vẫn chỉ là "hoàn thành" (đã có test).

## 2. Công cụ đã làm

| Thành phần | Tệp |
|---|---|
| Trích Phụ lục PDF → JSON (350 nhiệm vụ, 83 cán bộ, 11 phòng) | `app/scripts/kpi-trich-phu-luc.py` → `app/lib/kpi/ke-hoach-2026.json` |
| Quy thời hạn về quý | `app/lib/kpi/thoi-han.ts` |
| Gợi ý trục 1–6 theo từ khoá | `app/lib/kpi/phan-truc.ts` |
| Bộ tính điểm KPI + xếp loại + giới hạn 01 xuất sắc | `app/lib/kpi/tinh-kpi.ts` |
| Xuất Excel từng phòng (mỗi cán bộ 1 sheet, công thức sống) | `app/scripts/kpi-xuat-excel.mjs` → `docs/kpi-2026/q3/KPI-Q3-2026-<MÃ PHÒNG>.xlsx` |

Chạy lại: `node --experimental-strip-types scripts/kpi-xuat-excel.mjs --quy 3` (quý 4: `--quy 4`).

**Kiểm chứng:** 64 test (`npm test`) gồm toàn vẹn dữ liệu (số nhiệm vụ từng phòng khớp PDF); công thức Excel được đối chiếu với bộ tính điểm bằng HyperFormula trên 600 kịch bản ngẫu nhiên (có/không lãnh đạo, ô trống, hệ số, trục) — **0 lệch**. Chưa mở bằng Microsoft Excel/WPS thật.

## 3. Cần xác nhận (văn bản chưa quy định hoặc chưa được cung cấp)

**Chưa có trong tay:** mẫu chính thức Phụ lục 1, 2, 3a, 3b; Hướng dẫn 02-HD/TU và Hướng dẫn 05/HD-BTCTU (hệ số quy đổi); Công văn 5653/SNV-CBCCVC bản đầy đủ. Sheet mỗi cán bộ có khung tương đương và phần tự đánh giá tạm, **cần chuyển sang mẫu chính thức khi có**.

**Giả định của công cụ (G1–G7):** KPI mỗi trục tối đa 100%; A/B/C tính từ trạng thái từng nhiệm vụ (có hệ số); người không lãnh đạo không có D nên KPI = (A+B+C)/3; điều kiện KPI áp trên chỉ số tổng hợp; làm tròn 2 chữ số; vùng giữa "hoàn thành" và "không hoàn thành" hiển thị "Cần xem xét"; Trục 1 trống thì điểm chuyển về trục lớn nhất có nhiệm vụ.

**Các điểm cần Văn phòng Sở trả lời:**
1. Phụ lục KPI **không gán trục** cho từng nhiệm vụ → công cụ gợi ý theo từ khoá (258 nhiệm vụ rơi vào Trục 1 mặc định). Cần xác nhận cách gán.
2. Công văn 9409 viết cho "cán bộ diện Sở quản lý" (lãnh đạo phòng). Công chức, viên chức không giữ chức vụ có làm cùng hồ sơ này không?
3. Chỉ số D của người không lãnh đạo; hệ số quy đổi; quy định "giới hạn 01 xuất sắc" áp cho lãnh đạo hay toàn phòng.
4. Cách xử lý nhiệm vụ "cả năm/thường xuyên" khi chấm theo quý (công cụ mặc định chọn "Có", cán bộ bỏ chọn nếu không phát sinh).

## 4. Chất lượng dữ liệu trích từ PDF

- PDF có lớp chữ nên trích tự động, không gõ tay; chuẩn hoá tên viết sai của bản gốc: Phạm Hũu Chung, Đăng Văn Xuân, Trần Hửu Sữu, Lê Văn Thuỷ.
- **Hai ô cần người đối chiếu:** `B-HTKT-004` (ô "Long Lê Quang Nhật" bị ngắt dòng trong bản gốc → gán Nguyễn Tuấn Long và Lê Quang Nhật Minh); `B-QLKCHTGT-025` ("Khi có yêu cầu", không nêu người nên không gán ai).
- Phòng Phát triển đô thị có hai người **Lê Anh Tuấn A** và **Lê Anh Tuấn B** (giữ nguyên như bản gốc).
- Phòng Quản lý hoạt động xây dựng: nhiệm vụ B-QLHDXD-010 chia theo thời gian (Nguyễn Thành Lai tháng 1–6, Tạ Công Danh tháng 7–12) nên quý III chỉ tính cho Tạ Công Danh; các nhiệm vụ "phía Bắc/phía Nam" giữ ghi chú.
- Chức vụ lãnh đạo chỉ nhận được từ bản gốc ở Phòng Quy hoạch Kiến trúc và Hạ tầng kỹ thuật (có ghi TP/PTP); các phòng còn lại mặc định "Không" — lãnh đạo phòng tự chọn "Có" trong sheet của mình.
- Tên cán bộ chưa đối chiếu với bảng `CanBo` của hệ thống; Phụ lục có người trùng tên khác chức (Nguyễn Thanh Hải: Trưởng phòng QHKT khác PGĐ Sở).
