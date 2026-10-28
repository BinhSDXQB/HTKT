// Test cho guard.mjs: chạy bằng `npm test` trong app/ (node --test).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const GUARD = fileURLToPath(new URL('./guard.mjs', import.meta.url))
const chay = (input, env = {}) =>
  spawnSync(process.execPath, [GUARD], { input, encoding: 'utf8', env: { ...process.env, HTKT_GUARD_MODE: '', ...env } })
const goi = (tool, ti, env) => chay(JSON.stringify({ tool_name: tool, tool_input: ti }), env)

// [tool, tool_input, mô tả]
const CHAN = [
  ['Bash', { command: 'git push origin main' }, 'push main'],
  ['Bash', { command: 'git push --force origin feature' }, 'push --force'],
  ['Bash', { command: 'git reset --hard HEAD~1' }, 'reset --hard'],
  ['PowerShell', { command: 'Remove-Item -Recurse -Force C:\\Backup_QLHTKT' }, 'xoá đệ quy sao lưu'],
  ['Bash', { command: 'psql -c "DROP TABLE users"' }, 'DROP TABLE'],
  ['Bash', { command: 'psql -c "DELETE FROM can_bo;"' }, 'DELETE không WHERE'],
  ['Bash', { command: 'cat app/.env' }, 'in .env'],
  ['Write', { file_path: 'C:\\Troly\\HTKT\\app\\.env', content: 'x' }, 'ghi .env'],
  ['Read', { file_path: 'C:\\Troly\\HTKT\\app\\.env' }, 'đọc .env'],
]
const CHO = [
  ['Bash', { command: 'git push origin feature-x' }, 'push nhánh khác'],
  ['Bash', { command: 'git status' }, 'git status'],
  ['Bash', { command: 'psql -c "DELETE FROM can_bo WHERE id=1"' }, 'DELETE có WHERE'],
  ['Write', { file_path: 'C:\\Troly\\HTKT\\app\\.env.example', content: 'x' }, 'ghi .env.example'],
  ['Read', { file_path: 'C:\\Troly\\HTKT\\CLAUDE.md' }, 'đọc CLAUDE.md'],
  ['PowerShell', { command: 'Get-ChildItem C:\\Troly\\HTKT' }, 'liệt kê thư mục'],
]

for (const [t, ti, mo] of CHAN) test(`chặn: ${mo}`, () => assert.equal(goi(t, ti).status, 2))
for (const [t, ti, mo] of CHO) test(`cho qua: ${mo}`, () => assert.equal(goi(t, ti).status, 0))

test('chế độ warn: không chặn nhưng có cảnh báo', () => {
  const r = goi('Bash', { command: 'git reset --hard' }, { HTKT_GUARD_MODE: 'warn' })
  assert.equal(r.status, 0)
  assert.match(r.stderr, /warn/)
})

test('JSON hỏng: không chặn nhầm', () => assert.equal(chay('not json').status, 0))
