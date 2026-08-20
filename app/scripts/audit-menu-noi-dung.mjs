// AUDIT menu ↔ route ↔ nội dung: đối chiếu từng mục menu trong sidebar-new.tsx với
// route thật trên đĩa, phân loại độ hoàn thiện nội dung mỗi trang, phát hiện link chết
// (menu trỏ tới route không tồn tại) và trang mồ côi (có route nhưng không có menu).
//   node scripts/audit-menu-noi-dung.mjs                 # in ma trận + ghi báo cáo .md/.json
//   node scripts/audit-menu-noi-dung.mjs --group htkt    # lọc theo tên nhóm/href
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const groupFilter = (() => { const i = args.indexOf('--group'); return i >= 0 ? args[i + 1] : null })()

// ── 1. Trích menu từ sidebar-new.tsx ────────────────────────────────────────
const sidebar = readFileSync(join(root, 'components/dashboard/sidebar-new.tsx'), 'utf8')
// Cắt từng khối group: label + (deptMa|superAdminOnly) + items[]
const groups = []
{
  // Tách theo dấu mốc "label: '...'," ở cấp group. Dùng cách quét đơn giản theo dòng.
  const lines = sidebar.split('\n')
  let cur = null
  for (const line of lines) {
    const gLabel = line.match(/^\s{4}label:\s*'([^']+)'/)          // group label (thụt 4 space)
    const iItem = line.match(/\{\s*label:\s*'([^']+)',\s*href:\s*'([^']+)'/) // item
    const dept = line.match(/deptMa:\s*'([^']+)'/)
    const superG = /superAdminOnly:\s*true/.test(line) && /icon:/.test(line)
    if (gLabel) { cur = { label: gLabel[1], deptMa: null, superAdminOnly: false, items: [] }; groups.push(cur) }
    if (cur && dept) cur.deptMa = dept[1]
    if (cur && superG) cur.superAdminOnly = true
    if (cur && iItem) {
      const gates = []
      for (const g of ['adminOnly', 'superAdminOnly', 'salaryOnly', 'officeOnly', 'htktOnly', 'congViecOnly'])
        if (new RegExp(g + ':\\s*true').test(line)) gates.push(g)
      cur.items.push({ label: iItem[1], href: iItem[2], gates })
    }
  }
}

// ── 2. Walk app/ tìm mọi route (page.tsx) ───────────────────────────────────
function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const seg = name.startsWith('(') && name.endsWith(')') ? '' : '/' + name
      out.push(...walk(full, base + seg))
    } else if (name === 'page.tsx') {
      out.push({ route: base || '/', file: full })
    }
  }
  return out
}
const allPages = walk(join(root, 'app'))
const routeMap = new Map(allPages.map((p) => [p.route, p.file]))
const dashboardRoutes = new Set(allPages.map((p) => p.route).filter((r) => r.startsWith('/dashboard')))

// ── 3. Phân loại nội dung 1 trang ───────────────────────────────────────────
const PLACEHOLDER = /Đang (phát triển|cập nhật|xây dựng|hoàn thiện)|đang được (phát triển|xây dựng)|Coming soon|Chức năng.*sắp|sẽ (bổ sung|cập nhật)|TODO|placeholder/i
function classify(file) {
  const src = readFileSync(file, 'utf8')
  const loc = src.split('\n').length
  let kind = 'custom'
  if (/DeptOverview/.test(src)) kind = 'DeptOverview'
  else if (/DeptSection/.test(src)) kind = 'DeptSection'
  else if (/HtktSection/.test(src)) kind = 'HtktSection'
  else if (/NghiepVu(Module|Section)/.test(src)) kind = 'NghiepVu'
  const placeholder = PLACEHOLDER.test(src.replace(/Chưa có (dữ liệu|bản ghi)/gi, '')) // bỏ empty-state hợp lệ
  // "nhiemVu" length: đếm số gạch đầu dòng nhiệm vụ (chỉ dấu hiệu nội dung QĐ 331)
  const nhiemVu = (src.match(/^\s*'[^']{15,}',?\s*$/gm) || []).length
  return { loc, kind, placeholder, nhiemVu, file: file.replace(root, '').replace(/\\/g, '/') }
}

// ── 4. Đối chiếu + xếp hạng ──────────────────────────────────────────────────
let menuItems = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label, deptMa: g.deptMa })))
if (groupFilter) menuItems = menuItems.filter((m) => m.group.toLowerCase().includes(groupFilter.toLowerCase()) || m.href.includes(groupFilter))

const menuHrefs = new Set(menuItems.map((m) => m.href))
const rows = []
const deadLinks = []
for (const m of menuItems) {
  const file = routeMap.get(m.href)
  if (!file) { deadLinks.push(m); rows.push({ ...m, status: 'DEAD', kind: '—', loc: 0, placeholder: false }); continue }
  const c = classify(file)
  // Xếp hạng độ hoàn thiện: A=trang tùy biến giàu, B=module nghiệp vụ động, C=khung QĐ331, D=mỏng/placeholder
  let grade
  if (c.placeholder) grade = 'D'
  else if (c.kind === 'custom' && c.loc >= 60) grade = 'A'
  else if (c.kind === 'DeptOverview') grade = 'B'
  else if (c.kind === 'DeptSection' || c.kind === 'HtktSection' || c.kind === 'NghiepVu') grade = 'C'
  else if (c.loc < 30) grade = 'D'
  else grade = 'B'
  rows.push({ ...m, status: 'OK', ...c, grade })
}

// Trang mồ côi: route /dashboard có nhưng không nằm trong menu (bỏ route động/layout con)
const orphans = [...dashboardRoutes].filter((r) => !menuHrefs.has(r) && !r.includes('[')).sort()

// ── 5. Xuất báo cáo ─────────────────────────────────────────────────────────
const gradeCount = rows.reduce((a, r) => { a[r.grade || r.status] = (a[r.grade || r.status] || 0) + 1; return a }, {})
let md = `# Ma trận rà soát menu ↔ nội dung — QL HTKT\n\n`
md += `_Sinh tự động bởi scripts/audit-menu-noi-dung.mjs · ${new Date().toISOString().slice(0, 10)}_\n\n`
md += `- Tổng mục menu: **${menuItems.length}** · Route /dashboard: **${dashboardRoutes.size}**\n`
md += `- Link CHẾT (menu→route không có): **${deadLinks.length}** · Trang MỒ CÔI (route không có menu): **${orphans.length}**\n`
md += `- Xếp hạng nội dung: ${Object.entries(gradeCount).map(([k, v]) => `${k}=${v}`).join(' · ')}\n`
md += `  - A = trang tùy biến giàu nội dung · B = tổng quan/điều hướng · C = khung QĐ331 + nhập liệu động · D = mỏng/placeholder\n\n`

let curGroup = ''
for (const r of rows) {
  if (r.group !== curGroup) { curGroup = r.group; md += `\n## ${curGroup}\n\n| Mục | Hạng | Loại | Dòng | Cờ | href |\n|---|---|---|---|---|---|\n` }
  const flag = r.status === 'DEAD' ? '🔴 LINK CHẾT' : (r.placeholder ? '⚠️ placeholder' : '')
  md += `| ${r.label} | ${r.grade || '—'} | ${r.kind} | ${r.loc || ''} | ${flag} | ${r.href} |\n`
}
if (deadLinks.length) { md += `\n## 🔴 Link chết\n\n` + deadLinks.map((d) => `- [${d.group}] ${d.label} → ${d.href}`).join('\n') + '\n' }
if (orphans.length) { md += `\n## 🟠 Trang mồ côi (có route, chưa lên menu)\n\n` + orphans.map((o) => `- ${o}`).join('\n') + '\n' }

writeFileSync(join(root, 'BAO_CAO_AUDIT_MENU.md'), md, 'utf8')
writeFileSync(join(root, 'bao-cao-audit-menu.json'), JSON.stringify({ menuItems: rows, deadLinks, orphans, gradeCount }, null, 2), 'utf8')

// Console tóm tắt
console.log(`\n📋 AUDIT MENU ↔ NỘI DUNG`)
console.log(`   Mục menu: ${menuItems.length} · Route dashboard: ${dashboardRoutes.size}`)
console.log(`   Link chết: ${deadLinks.length} · Mồ côi: ${orphans.length}`)
console.log(`   Xếp hạng: ${Object.entries(gradeCount).map(([k, v]) => `${k}=${v}`).join(' · ')}`)
if (deadLinks.length) { console.log(`\n🔴 LINK CHẾT:`); for (const d of deadLinks) console.log(`   [${d.group}] ${d.label} → ${d.href}`) }
console.log(`\n→ Đã ghi BAO_CAO_AUDIT_MENU.md + bao-cao-audit-menu.json`)
