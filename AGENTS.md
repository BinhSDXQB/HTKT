# AGENTS.md (dành cho Codex và các tác nhân khác)

Quy tắc chung của Codex (chỉ đọc, phân mức, không lộ secret, kết luận chỉ là đề xuất): `~/.codex/AGENTS.md`.
Quy tắc dự án: `CLAUDE.md` — đọc trước. Không lặp lại ở đây.

## Riêng dự án HTKT
- Dữ liệu nhạy cảm đặc thù: CCCD và lương cán bộ — không dán vào đầu ra, kể cả khi thấy trong mã/test.
- Test chỉ-đọc an toàn: `npm test` trong `app/`. Không build/`tsc` toàn dự án (VPS 6GB RAM).
- Next.js của dự án: xem `app/AGENTS.md`.
