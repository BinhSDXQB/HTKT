// Kiểm tra bộ nhớ dự án (memory/*.md): frontmatter hợp lệ, có updated/source/confidence, chỉ mục MEMORY.md đủ.
// Dùng: node tools/memory-lint.mjs [thuMucMemory]
// Mặc định: %USERPROFILE%\.claude\projects\C--Troly-HTKT\memory. Thoát mã 1 nếu có lỗi.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const dir = process.argv[2] ?? join(homedir(), '.claude', 'projects', 'C--Troly-HTKT', 'memory')
const TYPES = ['user', 'feedback', 'project', 'reference']
const CONF = ['verified', 'inferred', 'unreviewed']   // verified = đã đối chiếu nguồn gốc; inferred = suy luận có căn cứ
const files = readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md')
const errs = []
const warns = []

for (const f of files) {
  const raw = readFileSync(join(dir, f), 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) { errs.push(`${f}: không có frontmatter`); continue }
  const fm = m[1]
  const get = k => fm.match(new RegExp(`^\\s*${k}:\\s*(.+)$`, 'm'))?.[1].trim()
  const name = get('name')
  if (!name) errs.push(`${f}: thiếu name`)
  else if (name !== f.replace(/\.md$/, '')) warns.push(`${f}: name '${name}' khác tên tệp`)
  if (!get('description')) errs.push(`${f}: thiếu description`)
  const type = get('type')
  if (!TYPES.includes(type)) errs.push(`${f}: type '${type}' không hợp lệ`)
  const updated = get('updated')
  if (!updated || !/^\d{4}-\d{2}-\d{2}$/.test(updated)) errs.push(`${f}: updated thiếu/sai định dạng`)
  if (!get('source')) errs.push(`${f}: thiếu source`)
  const conf = get('confidence')
  if (!CONF.includes(conf)) errs.push(`${f}: confidence '${conf}' không hợp lệ (${CONF.join('|')})`)
}

const idx = readFileSync(join(dir, 'MEMORY.md'), 'utf8')
const linked = new Set([...idx.matchAll(/\]\(([^)]+\.md)\)/g)].map(x => x[1]))
for (const f of files) if (!linked.has(f)) errs.push(`${f}: chưa có trong MEMORY.md`)
for (const l of linked) if (!files.includes(l)) errs.push(`MEMORY.md trỏ tới tệp không tồn tại: ${l}`)

const dem = {}
for (const f of files) { const c = readFileSync(join(dir, f), 'utf8').match(/^\s*confidence:\s*(\S+)/m)?.[1] ?? '?'; dem[c] = (dem[c] || 0) + 1 }
console.log(`${files.length} tệp memory · confidence:`, dem)
warns.forEach(w => console.log('CẢNH BÁO', w))
errs.forEach(e => console.log('LỖI', e))
console.log(errs.length ? `THẤT BẠI: ${errs.length} lỗi` : 'ĐẠT')
process.exit(errs.length ? 1 : 0)
