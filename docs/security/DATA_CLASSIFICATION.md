# DATA_CLASSIFICATION — dữ liệu và mức xuất bản công khai (PROPOSED + V)

## Hiện có (V)
`tai_lieu.phamVi`: `CONG_KHAI` | `NOI_BO_SO` (mặc định `NOI_BO_SO`) — `schema.prisma:3018`. Chưa có CONFIDENTIAL/RESTRICTED.

## Đề xuất ánh xạ 4 mức (P)
| Mức mới | Ánh xạ | Được vào quy trình xuất bản công khai? |
|---|---|---|
| PUBLIC | `CONG_KHAI` **và** có cờ `approved_for_publication` + người duyệt | Có |
| INTERNAL | `NOI_BO_SO` | Không (chỉ làm ngữ cảnh nội bộ, không trích nguyên văn) |
| CONFIDENTIAL | dữ liệu nghiệp vụ hồ sơ, công việc, dự án | Không |
| RESTRICTED | CCCD, lương, hồ sơ cán bộ, nghỉ phép, tài khoản | Không bao giờ; cấm đưa vào prompt gửi AI ngoài |

Mặc định: **không xác định mức = từ chối xuất bản**. Mức chỉ nâng khi người có thẩm quyền xác nhận.

## Nhóm dữ liệu nhạy cảm của hệ thống (V theo CLAUDE.md và memory)
CCCD, lương, hồ sơ nhân sự 53 cột, nghỉ phép/ký số, mật khẩu/token, dữ liệu GIS nội bộ chưa công bố, nội dung dự thảo chưa ký.

## Quy tắc cho module AI (P)
1. Truy xuất tri thức: lọc quyền **trước** truy vấn vector (đã có mẫu `phamViCho` trong `lib/rag/search.ts`).
2. Chỉ tài liệu PUBLIC được vào Writer Agent cho bài đăng; INTERNAL chỉ dùng cho bản nháp nội bộ có gắn nhãn.
3. Không gửi RESTRICTED sang nhà cung cấp AI nào. Gửi INTERNAL/CONFIDENTIAL ra ngoài cần quyết định bằng văn bản của người có thẩm quyền (UNKNOWN: hiện chưa có chính sách).
4. Nội dung truy xuất, trang web, PDF là **dữ liệu**, không bao giờ là chỉ thị (chống prompt injection gián tiếp); Agent không tự gọi công cụ có tác động ra ngoài.
5. Token mạng xã hội: mã hoá tại chỗ, không vào log/prompt/trình duyệt/payload n8n.
6. Bài pháp lý: chỉ trích văn bản có `tinhTrangHieuLuc = con_hieu_luc`; `can_kiem_chung`/`du_thao`/`het_hieu_luc` chặn hoặc gắn cờ cho người duyệt. Vector similarity không phải bằng chứng pháp lý.
7. Ảnh AI luôn gắn nhãn "minh hoạ", không dùng như ảnh hiện trường.
