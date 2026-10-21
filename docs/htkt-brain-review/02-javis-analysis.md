# 02 — Phân tích Javis OS và các mô hình tham khảo

> Mã nguồn Javis OS clone **chỉ đọc** vào thư mục nghiên cứu tách biệt (scratchpad của phiên, ngoài repo và ngoài production):
> `github.com/blogminhquy/javis-os`, commit `24c0c6d` (15/10/2026), phiên bản `0.166.2`. **Không cài đặt, không chạy, không chạy test.**
> Nhãn mức chứng cứ: **M** = đã thấy trong mã · **D** = chỉ thấy trong tài liệu repo · **W** = nguồn web bên thứ ba · **?** = chưa kiểm chứng.

## 1. Nhận dạng

| Mục | Kết quả | Mức |
|---|---|---|
| Giấy phép | **MIT**, © 2026 Nguyễn Minh Quý (blogminhquy) — cho phép dùng, sửa, tích hợp; phải giữ thông báo bản quyền | M (`LICENSE`) |
| Định vị | "self-hosted **personal** AI assistant for business and life" — trợ lý **cá nhân** | D (`ARCHITECTURE.md:13`) |
| Ngôn ngữ | Python (FastAPI/uvicorn) + dashboard JavaScript thuần (Alpine, force-graph, xterm) | M |
| Quy mô | `server/`: 178 tệp `.py` trực tiếp (197 nếu đệ quy), 124.927 dòng Python (đệ quy); dashboard 44.677 dòng JS (trực tiếp); `tests/`: 519 tệp `test_*.py` = 114.871 dòng (toàn bộ `.py` trong tests: 116.992) — *số đã đối chiếu với Codex 2B* | M (`wc -l`) |
| Phụ thuộc trực tiếp | 19 gói: `fastapi`, `uvicorn`, `httpx`, `claude-agent-sdk`, `cryptography`, `pypdf`, `yt-dlp`, `gpsoauth`, `edge-tts`… | M (`requirements.txt`) |
| Tốc độ thay đổi | 1.275 commit; **394 commit từ 15/9/2026** (~13/ngày); CHANGELOG 6.939 dòng | M (`git log`) |
| Chính sách bảo mật | "Javis runs an AI brain **with full rights on the machine** it is installed on"; **chỉ bản mới nhất** được vá | M (`SECURITY.md:3,22`) |

## 2. Kiểm tra 17 hạng mục

| # | Hạng mục | Có trong mã? | Mô tả ngắn | Bằng chứng | Mức |
|---|---|---|---|---|---|
| 1 | Giấy phép | Có | MIT | `LICENSE` | M |
| 2 | Ngôn ngữ/framework | Có | Python FastAPI + JS thuần; SQLite (FTS5) cho state | `ARCHITECTURE.md:61-63`; `server/sessions.py` | M |
| 3 | Quản lý Agent | Có | Agent = tệp định nghĩa có model riêng; "team" chat nhóm chỉ-chữ, không MCP | `server/team_engine.py:1-20`, `agent_runtime.py` | M |
| 4 | Skill Registry | Có | Skill markdown trong brain; `skill_router.py` một nguồn sự thật; 6 skill hệ thống (`ingest-source`, `query-wiki`, `lint-wiki`, `notes`…) | `.claude/skills/`, `server/skill_router.py` | M |
| 5 | Workflow Engine | Có | Đồ thị capability có **checkpoint**; **node ghi không bao giờ tự chạy → dừng `WAITING_USER`**; workflow con ghim revision | `server/workflow_runtime.py:1-20` | M |
| 6 | Scheduler | Có | Vòng 30 giây; Kanban dispatcher; cron 5 trường tự viết; reminders | `ARCHITECTURE.md` mục Background; `cron_util.py`, `reminders.py` | M |
| 7 | Second Brain | Có | Thư mục markdown tương thích Obsidian (`memory/`, `wiki/`), `MEMORY.md` nạp vào prompt | `ARCHITECTURE.md:15-17`, `main.py build_system_prompt` | M |
| 8 | LLM Wiki | Có | `learn.py`: tự chưng cất Memory/Wiki/Skill sau lượt; **fork học chỉ đọc**, chỉ Python tin cậy ghi, quét bí mật + injection, **tầng nguồn gốc chống tự đầu độc**. **Git KHÔNG còn bắt buộc** — ghi được cả khi brain không phải git (mất undo); mặc định `mode=dry-run` *(đính chính vòng 3: docstring đầu tệp đã lỗi thời so với nhánh thực thi)* | `server/learn.py:1-20` (docstring) vs **`:1790-1797` (thực thi)** | M |
| 9 | Knowledge Graph | Một phần | Đồ thị **wikilink** giữa note (kiểu Obsidian graph view) — **không phải** KG thực thể–quan hệ có kiểu | `server/graph_builder.py:1-12` | M |
| 10 | Chatbot & giao diện | Có | Dashboard WebSocket, voice, chatbot "chuyên trách" trả lời khách | `dashboard/*.js`, `chatbot_*.py` | M |
| 11 | MCP & tích hợp | Có | **MCP Hub** một cổng; 3 mức quyền × chế độ chạy, lấy mức chặt hơn, thực thi tại hub (`mcp_hub.py:212-220`). **Nhưng:** quyền không hợp lệ → mặc định `full`; tool không khớp quy tắc/heuristic → coi là `read` (`mcp_catalog.py:498-510`). Tool native/shell của engine nằm ngoài hub | `mcp_hub.py`, `mcp_catalog.py` | M — **nếu kế thừa phải đổi sang từ chối mặc định** |
| 12 | Quản lý model | Có | 12 provider; kiểu `cli` (Claude Code, Grok, Antigravity — chạy **bằng gói thuê bao cá nhân**), `oauth` (ChatGPT qua Codex), `api` (OpenRouter, OpenAI, Gemini, Ollama…) | `ARCHITECTURE.md` mục Engines | M |
| 13 | Bộ nhớ hội thoại | Có | SQLite + FTS5; nén lịch sử (`compaction.py`) | `sessions.py`, `compaction.py` | M |
| 14 | Phân quyền | **Hạn chế** | **Một tài khoản quản trị** (`JAVIS_ADMIN_PASSWORD`/`JAVIS_ADMIN_USER`, TOTP tuỳ chọn); cookie phiên hoặc token cho CLI. **Không có mô hình nhiều người dùng/vai trò** | `server/config.py:1450-1473`; `main.py:289-311` | M |
| 15 | Quản lý dữ liệu | Có | Brain = thư mục markdown; state = `STATE_DIR` (SQLite, JSON); bí mật mã hoá Fernet | `secrets_store.py` | M |
| 16 | Sao lưu & phục hồi | Một phần | Git mirror cho brain (tuỳ chọn), revert lần học; updater rollback **mã** khi `/health` hỏng. Chưa thấy phục hồi toàn hệ thống (settings, SQLite hội thoại, khoá mã hoá) | `git_brain.py:475,901`; `updater.py:564` | M |
| 17 | Ổn định, kiểm thử, mở rộng | Kiểm thử dày; CI có compile/import/test JS+Python (`.github/workflows/ci.yml:69-110`); nhiều runtime mới còn **canary** (`config.py:463-504`) | ~115k dòng test (chưa chạy); ~13 commit/ngày — tốc độ thay đổi cao, *chưa chứng minh* hợp đồng nội bộ hay vỡ | `tests/`; `git log` | M (số lượng) / **?** (chất lượng) |

### Chức năng chỉ mô tả / cần lưu ý
- **Kênh Zalo cá nhân dùng API không chính thức** (`zca-js`), giữ đăng nhập 24/7, bot **tự trả lời** (quyết định của tác giả 29/09/2026) — mã tự ghi "qua API không chính thức" (`server/zalo_personal_channel.py:1-25`; `zalo_cli.py:9`). **Không phù hợp cơ quan nhà nước.**
- Kiểu engine `cli` chạy Claude Code/ChatGPT **bằng gói thuê bao cá nhân** trên máy chủ; README tự cảnh báo điều khoản (theo bộ nghiên cứu DuToanAI 07 §1). Cơ quan nên dùng API key có hợp đồng.
- Vector search/RAG trên kho văn bản: **không có** (embedding chỉ thấy ở `capability_index`, Ollama). Tri thức tra bằng FTS5 + wikilink.

## 3. Mô hình an ninh của Javis đối chiếu yêu cầu cơ quan

| Yêu cầu (master prompt mục VIII) | Javis | Đánh giá |
|---|---|---|
| Không cấp quyền root/administrator thường trực cho Agent | CLI brain **chạy được shell trên máy chủ** (thiết kế có chủ đích) | ❌ trái nguyên tắc 4 nếu dùng engine `cli` |
| Nhiều người dùng, phân quyền theo phòng | Một chủ | ❌ cần viết lại lớp danh tính |
| Tách dữ liệu cá nhân / công vụ | Brain theo thư mục — tách được bằng nhiều brain, nhưng cùng một chủ | ⚠ |
| Không tự gửi tin/đăng bài | Bot tự trả lời Zalo/Telegram (bật/tắt được) | ⚠ phải tắt |
| Kiểm soát kết nối bên thứ ba | MCP Hub 3 mức quyền + audit | ✅ **ý tưởng tốt** |
| Kiểm soát prompt injection | Quét injection trước khi ghi tri thức; fork học chỉ đọc | ✅ ý tưởng tốt |
| Rollback | Updater tự rollback; git brain | ✅ |
| Không tự thay đổi hệ thống production | Có **updater** fetch nhánh `main` upstream + `pip install` + rollback mã (`updater.py:254-286, 564`); chưa thấy xác minh chữ ký phát hành; bản Docker dùng image `latest` + Watchtower gắn Docker socket — **polling tự động mặc định TẮT** (`docker-compose.yml:24,105-113`) *(đính chính sau Codex 2A-bis)* | ⚠ phải khoá/ghim phiên bản — rủi ro chuỗi cung ứng |
| Cách ly mã mở rộng | Plugin người dùng được `exec_module` + `register(ctx)` **trong tiến trình, trước** cổng kiểm quyền từng tool (`plugins_host.py:579,693-697,837`); MCP stdio nhận bản sao toàn bộ `os.environ` (`mcp_client.py:319-321`) | ❌ |
| Quyền engine | Claude SDK dùng `bypassPermissions` khi không có whitelist (`claude_sdk_engine.py:843-850`); Codex mặc định không sandbox (`claude_cli.py:1550-1577`) | ❌ |
| Lưu bí mật | Fernet; nhưng `encrypt()` có nhánh dự phòng `plain:` khi không khởi tạo được khoá (`secrets_store.py:46-52`) | ⚠ |
| Giới hạn tài nguyên | Vòng 30 s, nhiều tiến trình nền, voice, MCP stdio | ⚠ chưa đo; khó với 6 GB RAM dùng chung |

## 4. Đối chiếu với hệ thống hiện có (tóm tắt — chi tiết ở 03)

| Tiêu chí | QL-HTKT hiện có | Javis OS |
|---|---|---|
| Hiệu quả cho nghiệp vụ Sở | Cao — dữ liệu nghiệp vụ, 11 phòng, tool chuyên ngành | Thấp — không có dữ liệu/nghiệp vụ xây dựng |
| Bảo mật nhiều người dùng | Có RBAC, JWT, nhật ký | Một chủ, shell-capable |
| Mở rộng Agent/Workflow | Chưa có engine | Có engine, checkpoint, skill |
| Chi phí | Đã chạy | Thêm runtime Python + RAM + công vận hành |
| Phụ thuộc | Tự chủ | Phụ thuộc một tác giả, đổi nhanh |
| Độ phức tạp bảo trì | Một stack TS | Thêm stack Python ~125k dòng |

## 5. Các nền tảng/phương pháp tham khảo khác

| Tên | Bản chất (đã kiểm) | Mức | Giá trị cho HTKT Brain |
|---|---|---|---|
| **Bullet Journal** | Phương pháp ghi chép nhanh: nhật ký ngày, ký hiệu việc/sự kiện/ghi chú, di chuyển (migration) việc chưa xong | kiến thức chung | **Mô hình UX** cho Task Agent: "nhật ký ngày + chuyển việc tồn" trên dữ liệu `CongViec` đã có — **không cần phần mềm mới** |
| **Obsidian + Markdown** | Trình soạn note markdown cục bộ, wikilink, graph view | kiến thức chung | Định dạng **lưu tri thức đã duyệt** dễ đọc, dễ diff, git được; Obsidian là **công cụ xem tuỳ chọn**, không phải thành phần máy chủ |
| **Second Brain / LLM Wiki** | Ghi chú gốc → chưng cất thành wiki có liên kết; LLM duy trì wiki | D (Javis `learn.py`) | Kế thừa **quy trình** (gốc bất biến → đề xuất → duyệt → wiki) |
| **OpenClaw** | Agent tự host mã nguồn mở (MIT, TypeScript), nhận lệnh qua WhatsApp/Telegram/Slack…; nhiều nguồn cảnh báo **prompt injection, lộ thông tin xác thực** | **W** ([neurohive](https://neurohive.io/en/guides/openclaw-the-lobster-that-took-over-the-world-how-one-developer-built-the-most-popular-open-source-ai-agent-in-history/), [elest.io](https://blog.elest.io/openclaw-explained-how-the-fastest-growing-open-source-project-became-a-self-hosted-ai-agent-for-everyone/), [operator.io](https://operator.io/blog/what-is-openclaw)) | Cùng lớp "trợ lý cá nhân quyền rộng" như Javis → **không dùng cho production cơ quan**; chỉ tham khảo |
| **Hermes Agent** (Nous Research) | Agent MIT, ra 02/2026; vòng học tự tạo quy trình tái dùng + bộ nhớ bền; 20+ cổng nhắn tin | **W** ([readthedocs](https://agentic-ai.readthedocs.io/en/latest/AgentPlatforms/hermes-agent/), [hermes-agent.org](https://hermes-agent.org/about/)) | Ý tưởng "tự tạo skill sau việc phức tạp" — **chỉ dưới dạng đề xuất chờ duyệt** |
| **OpenAI Codex / Claude Code** | Agent lập trình CLI; đã dùng trong repo làm công cụ phát triển + phản biện | M (`codex-cli 0.162`, các `BAO_CAO_CODEX_*`) | Công cụ **phát triển và phản biện**, **không** chạy làm "não" production có shell |
| **MCP** | Giao thức chuẩn để LLM gọi công cụ/dữ liệu | M (Javis `mcp_hub.py`) | **Nên dùng** làm lớp công cụ chuẩn: bọc API QL-HTKT/DuToanAI thành MCP server chỉ-đọc |
| **RAG** | Truy hồi đoạn liên quan rồi sinh trả lời | M (QL-HTKT `lib/rag/`) | **Đã có**, cần đánh giá truy hồi (12) chứ không xây lại |
| **Knowledge Graph** | Thực thể–quan hệ có kiểu | — | Chỉ cần **đồ thị quan hệ văn bản pháp lý** (sửa đổi/thay thế/hướng dẫn) trong PostgreSQL; KG tổng quát **chưa chứng minh giá trị** |
| **Multi-Agent Orchestration** | Nhiều agent chuyên trách + điều phối | D | Bắt đầu **1 orchestrator + công cụ chuyên dụng**; tách agent khi đo được lợi ích (09) |
| **Workflow Automation** | Quy trình nhiều bước có điểm duyệt | M (Javis) | Kế thừa **mẫu** checkpoint + "node ghi dừng chờ người" |

> Số sao GitHub, phiên bản OpenClaw/Hermes khác nhau giữa các nguồn bên thứ ba — **không dùng làm căn cứ**.

## 6. Kết luận sơ bộ của Claude (vòng 1, chờ phản biện)

1. **Không tích hợp trực tiếp Javis OS** vào production: mô hình một chủ (`config.py:35`), engine có nhánh bỏ qua quyền, plugin chạy trong tiến trình, updater theo nhánh động, đổi nhanh, Zalo không chính thức, thêm runtime Python (Codex ước lượng *chưa đo*: +0,3–0,8 GB tối giản, 1–3 GB+ khi có CLI agent/MCP stdio) trên máy 6 GB.
2. **Kế thừa ý tưởng, không kế thừa mã** (hoặc chỉ chép có chọn lọc tuân thủ MIT): MCP Hub 3 mức quyền + audit; workflow checkpoint với "node ghi dừng chờ người"; fork học chỉ-đọc + quét injection + tầng nguồn gốc; Second Brain dạng markdown + git.
3. Javis có thể dùng **tuỳ chọn** như một **trợ lý cá nhân** trên máy riêng của chủ hệ thống, kết nối QL-HTKT qua **MCP chỉ-đọc có xác thực** — tách hoàn toàn khỏi production.
