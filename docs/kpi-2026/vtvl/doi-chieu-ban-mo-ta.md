# Đối chiếu bản mô tả công việc với Danh mục VTVL của Quyết định phê duyệt

> Sinh tự động bởi `app/scripts/vtvl-trich-ban-mo-ta.py` từ: 94 tệp .docx và 0 QD phe duyet ban mo ta cong viec.pdf. Không sửa tệp nguồn. Chạy lại khi Văn phòng Sở cập nhật bản mô tả.

## Tóm tắt

- Danh mục trong Quyết định: **65 mã** = 6 lãnh đạo, quản lý + 59 chuyên môn, nghiệp vụ; **67 dòng** vì mã có hai ngạch (Phó Giám đốc, Phó Trưởng phòng) chiếm hai dòng.
- Số tệp bản mô tả: **94**; số dòng nhiệm vụ: **726** nhưng chỉ **34** tên nhiệm vụ khác nhau (rất lặp: nên chuẩn hóa khi nạp CSDL); **17** năng lực khác nhau.

## 1. Mã vị trí việc làm

- Mã có trong Quyết định nhưng **không có tệp** theo tên tệp: không.
- Mã theo tên tệp **không có** trong Quyết định: không.

**Mã ghi trong nội dung tệp khác với mã theo tên tệp** (khả năng sai ở nguồn; mã đúng được suy ra từ tên tệp và tên VTVL, cần Văn phòng Sở xác nhận):

| Tệp | Mã ghi trong nội dung |
|---|---|
| CMNV.02 CVC ve to chuc bien che.docx | `CNMV.02` |
| CMNV.04 CVC ve CBCCVC va cong vu.docx | `CNMV.04` |
| CMNV.48 CVC về quản lý phuong tien va nguoi lai.docx | `Ngày QĐ` |
| CMNV.57 CV ve quan ly dau tu theo phuong thuc doi tac cong tu.docx | `CMNV.58` |

**Hai tệp cùng khai một mã trong nội dung:**

- `CMNV.58` ← CMNV.57, CMNV.58

## 2. Tên VTVL khác danh mục

Tên trong bản mô tả nên **theo đúng Quyết định** để đối chiếu máy. Cột "Mức": **KHÁC NỘI DUNG** (độ giống < 0,7: tên chỉ một vị trí khác, cần người kiểm tra tệp) hoặc "diễn đạt" (cùng vị trí, khác cách viết); "lặp từ" là lỗi gõ lặp "quản lý quản lý".

| Mã | Tên trong bản mô tả | Tên trong Quyết định | Giống nhau | Mức |
|---|---|---|---|---|
| CMNV.07 | Chuyên viên về tổ chức cán bộ | Chuyên viên về thi đua, khen thưởng | 0.63 | KHÁC NỘI DUNG |
| CMNV.18 | Chuyên viên quản lý đầu tư | Chuyên viên về quản lý đầu tư | 0.95 | diễn đạt |
| CMNV.19 | Chuyên viên quản lý đấu thầu | Chuyên viên về quản lý đấu thầu | 0.95 | diễn đạt |
| CMNV.24 | Kế toán trưởng hoặc Phụ trách kế toán | Kế toán trưởng /Phụ trách Kế toán (khi bổ nhiệm) | 0.78 | diễn đạt |
| CMNV.28 | Chuyên viên chính về quản lý quy hoạch đô thị và nông thôn | Chuyên viên chính Quản lý quy hoạch đô thị và nông thôn | 0.97 | diễn đạt |
| CMNV.29 | Chuyên viên về quản lý quy hoạch đô thị và nông thôn | Chuyên viên Quản lý quy hoạch đô thị và nông thôn | 0.97 | diễn đạt |
| CMNV.30 | Chuyên viên chính về quản lý kiến trúc | Chuyên viên chính Quản lý kiến trúc | 0.96 | diễn đạt |
| CMNV.31 | Chuyên viên về quản lý kiến trúc | Chuyên viên Quản lý kiến trúc | 0.95 | diễn đạt |
| CMNV.32 | Chuyên viên chính về Quản lý hoạt động đầu tư xây dựng (Phòng QLHĐXD) | Chuyên viên chính Quản lý hoạt động đầu tư xây dựng | 0.86 | diễn đạt |
| CMNV.33 | Chuyên viên về quản lý quản lý hoạt động đầu tư xây dựng | Chuyên viên Quản lý hoạt động đầu tư xây dựng | 0.89 | diễn đạt, lặp từ |
| CMNV.36 | Chuyên viên chính về Quản lý vật liệu xây dựng | Chuyên viên chính Quản lý vật liệu xây dựng | 0.97 | diễn đạt |
| CMNV.37 | Chuyên viên về quản lý quản lý vật liệu xây dựng | Chuyên viên Quản lý vật liệu xây dựng | 0.87 | diễn đạt, lặp từ |
| CMNV.38 | Chuyên viên chính về Quản lý hạ tầng kỹ thuật | Chuyên viên chính Quản lý hạ tầng kỹ thuật | 0.97 | diễn đạt |
| CMNV.39 | Chuyên viên về Quản lý hạ tầng kỹ thuật | Chuyên viên Quản lý hạ tầng kỹ thuật | 0.96 | diễn đạt |
| CMNV.40 | Chuyên viên chính về Quản lý phát triển đô thị | Chuyên viên chính Quản lý phát triển đô thị | 0.97 | diễn đạt |
| CMNV.41 | Chuyên viên về Quản lý phát triển đô thị | Chuyên viên Quản lý phát triển đô thị | 0.96 | diễn đạt |
| CMNV.42 | Chuyên viên chính về Quản lý nhà ở | Chuyên viên chính Quản lý về nhà ở | 0.91 | diễn đạt |
| CMNV.43 | Chuyên viên về quản lý nhà ở | Chuyên viên Quản lý về nhà ở | 0.89 | diễn đạt |
| CMNV.44 | Chuyên viên chính về Quản lý thị trường bất động sản | Chuyên viên chính Quản lý thị trường bất động sản | 0.97 | diễn đạt |
| CMNV.45 | Chuyên viên về quản lý thị trường bất động sản | Chuyên viên Quản lý thị trường bất động sản | 0.97 | diễn đạt |

## 3. Ngạch công chức khác danh mục

| Mã | Ngạch trong bản mô tả | Ngạch trong Quyết định |
|---|---|---|
| CMNV.11 | Chuyên viên | Văn thư viên |

## 4. Địa điểm làm việc và ngày bắt đầu (không nhất quán giữa các tệp)

Có **2 địa chỉ khác nhau** (Số 02 Trần Hưng Đạo; Số 59 Lý Thường Kiệt) và **40/94 tệp ghi tỉnh "Quảng Bình"** thay vì Quảng Trị (nhiều khả năng là địa danh trước hợp nhất tỉnh — chưa kiểm chứng; Quyết định này thuộc UBND tỉnh Quảng Trị).

| Địa điểm làm việc | Số tệp |
|---|---|
| Số 02 Trần Hưng Đạo – Đồng Hới – Quảng Trị | 36 |
| Số 02 Trần Hưng Đạo – Đồng Hới – Quảng Bình | 22 |
| Số 59 Lý Thường Kiệt – Đồng Hới – Quảng Trị | 18 |
| Số 59 Lý Thường Kiệt – Đồng Hới – Quảng Bình | 18 |

| Ngày bắt đầu thực hiện | Số tệp |
|---|---|
| Ngày QĐ | 91 |
| 28/8/2026 | 3 |

## 5. Khung năng lực: định dạng cấp độ

Cấp độ dạng khoảng, viết không thống nhất dấu cách (số dòng theo cách viết): {'3-5': 30, '2-4': 345, '2-3': 150, '1 - 2': 180, '2 - 3': 180, '2 - 4': 240}. Khi nạp CSDL cần tách thành hai số (`cap_tu`, `cap_den`).
Dòng cấp độ ghi bằng chữ thay vì số (dùng cho Tin học, Ngoại ngữ): 4 kiểu khác nhau.

