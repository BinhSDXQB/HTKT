// PreToolUse hook: chặn thao tác nguy hiểm (xem CLAUDE.md, mục "Phân quyền & bảo mật").
// Đọc JSON từ stdin; exit 2 + thông điệp stderr = chặn. Mọi trường hợp khác = cho qua.
// HTKT_GUARD_MODE=warn  → chỉ cảnh báo, không chặn (để thử). Mặc định: chặn.
import { readFileSync } from 'node:fs'

const RULES_CMD = [
  [/\bgit\s+push\b[^\n]*(--force|--force-with-lease|\s-f\b)/i, 'git push --force'],
  [/\bgit\s+push\b[^\n]*\b(origin\s+)?(HEAD:)?(refs\/heads\/)?main\b/i, 'push lên main kích hoạt triển khai — cần người dùng duyệt'],
  [/\bgit\s+reset\s+--hard\b/i, 'git reset --hard'],
  [/\bgit\s+clean\b[^\n]*-[a-z]*f/i, 'git clean -f'],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/i, 'bỏ toàn bộ thay đổi chưa commit'],
  [/\b(rm\s+-[a-z]*r[a-z]*f?|rm\s+-[a-z]*f[a-z]*r|Remove-Item\b[^\n]*-Recurse)\b[^\n]*(Troly|Backup|backup|\.git\b|memory)/i, 'xoá đệ quy thư mục dự án/sao lưu/bộ nhớ'],
  [/\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE)\b/i, 'DROP/TRUNCATE trên CSDL'],
  [/\bDELETE\s+FROM\s+\S+\s*(;|"|'|$)/i, 'DELETE FROM không có WHERE'],
  [/\b(cat|type|Get-Content|gc|Select-String|sls|more|head|tail)\b[^\n]*\.env\b/i, 'đọc/in .env (chứa secret)'],
  [/\b(pg_hba|ALTER\s+(USER|ROLE))\b/i, 'đổi quyền/mật khẩu CSDL — cần người dùng làm'],
  [/\bpm2\s+(delete|kill)\s+(all|--)/i, 'pm2 delete/kill hàng loạt'],
]

const PATH_RULES = [
  [/(^|[\\/])\.env(\.(?!example$|sample$|template$)[^\\/]*)?$/i, 'tệp .env chứa secret'],
  [/(^|[\\/])\.git[\\/]/i, 'thư mục .git'],
  [/(^|[\\/])\.credentials\.json$/i, 'tệp thông tin xác thực'],
]

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0) // không đọc được → không chặn nhầm
}

const tool = input.tool_name
const ti = input.tool_input ?? {}
let reason = null

if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(ti.command ?? '')
  for (const [re, why] of RULES_CMD) if (re.test(cmd)) { reason = why; break }
} else if (['Write', 'Edit', 'NotebookEdit', 'Read'].includes(tool)) {
  const p = String(ti.file_path ?? ti.notebook_path ?? '')
  for (const [re, why] of PATH_RULES) if (re.test(p)) { reason = why; break }
}

if (!reason) process.exit(0)

const msg = `[guard] ${tool}: ${reason}. Hỏi người dùng nếu thật sự cần.`
if (process.env.HTKT_GUARD_MODE === 'warn') {
  console.error(msg + ' (chế độ warn — không chặn)')
  process.exit(0)
}
console.error(msg)
process.exit(2)
