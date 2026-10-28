# TESTING — Kiểm thử và nghiệm thu

Nguồn: `master_prompt_v2/TESTING.md`, thu hẹp theo thực tế. Cập nhật: 2026-10-28.

## Lệnh và phạm vi hiện có
| Lệnh (chạy trong `app/` trừ khi ghi khác) | Phủ | Ghi chú |
|---|---|---|
| `npm test` | `lib/luong.ts`, `lib/nghi-huu.ts`, `lib/qd72/danh-gia`, hook `guard.mjs`, validator handoff — 49 test (ngày 28/10/2026) | `node:test` có sẵn Node 24; chạy trong GitHub Actions trước bước build |
| `node tools/memory-lint.mjs` (gốc repo) | Frontmatter + chỉ mục bộ nhớ | Bộ nhớ nằm ngoài repo → không chạy trong CI |
| `node scripts/smoke-*.mjs` | Chatbot, trang chủ, hồ sơ nghiệp vụ, tham định… | Cần web đang chạy; chạy sau triển khai, chưa tự động |
| `scripts/healthcheck.mjs` / `QLHTKT_Healthcheck_Daily` | Sức khoẻ hằng ngày | Đã có |
| `node tools/validate-handoff.mjs <file>` | Hợp đồng bàn giao | — |

Cấm: `tsc --noEmit` / `npm run build` toàn dự án trên VPS 6GB (build do GitHub Actions làm).

## Ma trận cần có (✔ có, ◐ một phần, ✘ chưa)
| Hạng mục | Trạng thái |
|---|---|
| Đơn vị cho logic thuần (lương, nghỉ hưu, QĐ72) | ◐ — chưa phủ kiểm tra dự toán, tổng hợp Phụ lục 1, chatbot |
| Hồi quy cho lỗi đã vá | ◐ — vuotKhung, thuế TNCN, ngày hưu trí đã có; ngày DATE pg, ký tự "Đạt" chưa |
| Hook bảo vệ | ✔ |
| Phân quyền âm tính (API không lộ CCCD/lương khi không đủ quyền) | ✘ |
| Tích hợp với CSDL | ✘ (không có CSDL thử riêng) |
| E2E / Staging | ✘ (không có môi trường staging) |
| RAG: cô lập phạm vi, tài liệu hết hiệu lực, prompt injection | ✘ |
| Sao lưu / khôi phục | ◐ — có sao lưu; chưa diễn tập khôi phục |

## Quy tắc báo cáo kết quả
Mỗi kết quả ghi: lệnh, commit SHA, môi trường, kết quả **PASS / FAIL / NOT_RUN**, thời điểm. Không ghi PASS nếu chưa chạy. Test mới phải qua kiểm tra đột biến (sửa thử mã trên bản sao → test phải đỏ), xem `LESSONS_LEARNED.md` #16.

## Cổng phát hành
Không phát hành khi: `npm test` đỏ; còn lỗi nghiêm trọng/cao chưa xử lý (trừ khi người dùng chấp nhận ngoại lệ bằng văn bản); migration phá huỷ chưa được rà; không có đường hoàn tác; chưa có người dùng duyệt.

## Chỉ số theo dõi (chưa có số liệu nền — không điền số khi chưa đo)
Tỷ lệ commit qua `npm test` ngay lần đầu; số lỗi lọt sau triển khai; số lần rollback; thời gian từ push đến "HOAN TAT trien khai" (đọc từ nhật ký `C:\Troly\deploy\logs`); tỷ lệ phát hiện Codex đúng sau kiểm chứng; chi phí token mỗi lượt Codex.
