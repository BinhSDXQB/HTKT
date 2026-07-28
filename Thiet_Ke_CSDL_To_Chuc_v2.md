# Thiết kế lại CSDL mô hình tổ chức — phiên bản v2

**Sở Xây dựng tỉnh Quảng Trị · Hệ thống QL Hạ tầng kỹ thuật**
Ngày: 2026-06-19 · Backup an toàn: `C:\Backup_QLHTKT\pre-rebuild\ql_htkt_pre_rebuild_20260619_221909.dump`

---

## 1. Mục tiêu

Mô hình hoá khoa học cơ cấu tổ chức Sở (Sở → lãnh đạo → phòng/đơn vị → cán bộ → phân công),
theo nguyên tắc **mỗi sự thật chỉ có MỘT nguồn (single source of truth)**, kết nối chặt bằng
khoá ngoại, linh hoạt cho kiêm nhiệm và thay đổi nhân sự theo thời gian.

## 2. Hiện trạng & vấn đề (đã đo trên dữ liệu thật)

| # | Vấn đề | Bằng chứng | Hướng xử lý v2 |
|---|--------|------------|----------------|
| 1 | "Phòng của tài khoản" lưu nhiều nơi | `users.toChucId` + `users.departmentCode` + `can_bo.toChucId` + `phan_cong` | 1 nguồn: cây `to_chuc`, gắn qua FK |
| 2 | 2 hệ mã phòng KHÁC nhau | `departmentCode='VPS'/'HTKT'` ≠ `to_chuc.ma='VAN_PHONG_SO'/'PHONG_HTKT'` | **Bỏ `departmentCode`**, chỉ dùng `to_chuc.ma` |
| 3 | "Là lãnh đạo" lưu 2 nơi, lệch nghĩa | `users.isDepartmentLeader` (2 người) vs `chuc_danh.isLanhDao` (41 người) | Định nghĩa lãnh đạo qua **chức danh/phân công** |
| 4 | Field text cũ còn sót | `can_bo.chucVu`, `can_bo.phongBan` (đã deprecated) | **Bỏ**, dùng FK `toChucId`/`chucDanhId` |
| 5 | `phan_cong` chưa đủ | chỉ 103/145 cán bộ có phân công đang giữ | **Backfill** từ `can_bo.toChucId+chucDanhId` |
| 6 | `LANH_DAO_SO` vừa là đơn vị vừa là loại chức danh | trùng khái niệm | Giữ là **đơn vị** (nhóm lãnh đạo); "lãnh đạo" suy từ chức danh |

Dữ liệu lõi: **25 đơn vị · 16 chức danh · 103 phân công · 145 cán bộ · 198 tài khoản · 4 vai trò**.
92 tài khoản là phường/xã (có `wardId`, không thuộc phòng Sở) → `to_chuc_id` để trống là hợp lệ.

## 3. Mô hình v2 (ERD rút gọn)

```
                ┌─────────────┐
                │   to_chuc   │  cây đơn vị (tự tham chiếu parent_id)
                │  (đơn vị)   │  ma DUY NHẤT · loai · cap · thu_tu
                └──────┬──────┘
        ┌──────────────┼───────────────┬──────────────────┐
        │ parent_id    │ to_chuc_id    │ to_chuc_id       │ to_chuc_id
        │ (con)        ▼               ▼                  ▼
   (đệ quy)      ┌──────────┐    ┌───────────┐      ┌──────────┐
                 │ phan_cong│───▶│  can_bo   │◀────▶│  users   │
                 │(phân công)│ FK │ (cán bộ)  │ 1:1  │(tài khoản)│
                 └────┬─────┘    └───────────┘      └────┬─────┘
                      │ chuc_danh_id                     │ role_id
                      ▼                                  ▼
                 ┌───────────┐                     ┌──────────┐
                 │ chuc_danh │ is_lanh_dao         │  roles   │
                 │(chức danh)│ cap_quan_ly         └──────────┘
                 └───────────┘
```

### Quy tắc khoá (mỗi sự thật một nguồn)

- **Đơn vị của cán bộ** = `can_bo.to_chuc_id` (đơn vị chính hiện tại — đã khớp 100% với phân công chính).
- **Chức danh của cán bộ** = `can_bo.chuc_danh_id`.
- **Lịch sử & kiêm nhiệm** = `phan_cong` (nhiều dòng/cán bộ; `la_chinh`, `tu_ngay`/`den_ngay`).
- **Là lãnh đạo đơn vị** = phân công đang giữ có `chuc_danh.is_lanh_dao = true` (KHÔNG lưu cờ trên `users`).
- **Đơn vị của tài khoản** = suy từ `can_bo` (nếu là cán bộ) qua `users.can_bo_id`; tài khoản phường/xã dùng `ward_id`.
- **Mã phòng để phân quyền** = `to_chuc.ma` (DUY NHẤT) — bỏ hẳn `departmentCode`.

### Thay đổi cột so với hiện tại

| Bảng | Bỏ | Thêm/Giữ |
|------|-----|----------|
| `users` | `departmentCode`, `isDepartmentLeader` | giữ `to_chuc_id` (cho TK không phải cán bộ); liên kết cán bộ qua `can_bo.user_id` |
| `can_bo` | `chucVu` (text), `phongBan` (text) | giữ `to_chuc_id`, `chuc_danh_id` (FK chuẩn) |
| `phan_cong` | — | thêm `la_lanh_dao` (suy từ chức danh); backfill đủ 145 cán bộ |
| `to_chuc` | — | giữ nguyên (đã tốt) |
| `chuc_danh` | — | giữ nguyên (đã tốt) |

## 4. Cách triển khai AN TOÀN

1. ✅ Backup tươi trước khi làm.
2. Dựng schema **`org_v2`** TÁCH BIỆT trong cùng DB (không đụng bảng `public` đang chạy).
3. ETL di trú + **backfill** dữ liệu sang `org_v2`.
4. **Đối chiếu**: số lượng bản ghi; đơn vị/lãnh đạo suy ra có khớp dữ liệu cũ.
5. Báo cáo → **chờ duyệt** → mới sửa code (auth/sidebar/office) + cutover.

> Không drop/đổi bảng `public` cho tới khi bạn duyệt kết quả staging.
