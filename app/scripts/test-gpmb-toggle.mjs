// Kiểm tra thực tế: bấm nút "GPMB ĐS cao tốc" trên /dashboard/ban-do có hiện lớp không.
//   node scripts/test-gpmb-toggle.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'
import { SignJWT } from 'jose'
import puppeteer from 'puppeteer-core'
import { PNG } from 'pngjs'

const countRedPng = (buf) => {
  const png = PNG.sync.read(buf)
  const d = png.data
  let red = 0
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    if (r > 150 && g < 120 && b < 120 && (r - g) > 55 && (r - b) > 55) red++
  }
  return red
}

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8').match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')

const BASE = process.env.SMOKE_BASE || 'http://localhost:3001'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

// đếm pixel đỏ (gpmb #dc2626) trong PNG buffer qua canvas trong trang
async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.name, u."roleId", r.name AS role
     FROM users u JOIN roles r ON r.id = u."roleId"
     WHERE r.name = 'admin' ORDER BY u."createdAt" LIMIT 1`)
  await client.end()
  const u = rows[0]
  const secret = new TextEncoder().encode(env('SESSION_SECRET'))
  const token = await new SignJWT({
    userId: u.id, email: u.email, name: u.name, roleId: u.roleId, roleName: u.role,
    allowedModules: ['office', 'htkt', 'cong-viec'],
  }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secret)

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  await page.setCookie({ name: 'session', value: token, domain: 'localhost', path: '/' })

  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERR: ' + e.message))

  console.log('→ mở', BASE + '/dashboard/ban-do')
  await page.goto(BASE + '/dashboard/ban-do', { waitUntil: 'networkidle2', timeout: 60000 })

  // chờ map render
  await page.waitForSelector('.maplibregl-canvas', { timeout: 30000 })
  await new Promise(r => setTimeout(r, 4000))

  // helper: đếm pixel đỏ trên canvas maplibre
  const countRed = () => page.evaluate(() => {
    const c = document.querySelector('.maplibregl-canvas')
    if (!c) return { err: 'no canvas' }
    const off = document.createElement('canvas')
    off.width = c.width; off.height = c.height
    const ctx = off.getContext('2d')
    ctx.drawImage(c, 0, 0)
    const d = ctx.getImageData(0, 0, off.width, off.height).data
    let red = 0, total = off.width * off.height
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2]
      // đỏ đậm kiểu dc2626 / ea580c: r cao, g/b thấp
      if (r > 150 && g < 110 && b < 110 && (r - g) > 60 && (r - b) > 60) red++
    }
    return { red, total, w: off.width, h: off.height }
  })

  const shotBefore = await page.screenshot({ path: join(root, 'scripts', 'gpmb-before.png') })
  const redBefore = countRedPng(shotBefore)
  console.log('pixel đỏ TRƯỚC khi bấm GPMB:', redBefore)

  // tìm & bấm nút GPMB
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    const b = btns.find(x => x.textContent.includes('GPMB ĐS cao tốc'))
    if (!b) return { found: false, allBtns: btns.map(x => x.textContent.trim()).filter(Boolean).slice(0, 40) }
    b.click()
    return { found: true }
  })
  console.log('bấm nút:', JSON.stringify(clicked).slice(0, 300))

  await new Promise(r => setTimeout(r, 3500))

  // đọc lại class nút SAU khi React re-render → state có flip không?
  const btnState = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('GPMB ĐS cao tốc'))
    return b ? { on: b.className.includes('bg-red-500'), cls: b.className } : null
  })
  console.log('trạng thái nút sau re-render:', JSON.stringify(btnState))

  const shotAfter = await page.screenshot({ path: join(root, 'scripts', 'gpmb-after.png') })
  const redAfter = countRedPng(shotAfter)
  console.log('pixel đỏ SAU khi bấm GPMB:', redAfter)
  if (errs.length) console.log('CONSOLE ERRORS:\n' + errs.slice(0, 15).join('\n'))

  const delta = redAfter - redBefore
  console.log(`\n==> Δ pixel đỏ = ${delta}. ${delta > 200 ? '✅ Lớp GPMB CÓ hiện' : '❌ Lớp GPMB KHÔNG hiện thêm gì'}`)
  await browser.close()
}
main().catch(e => { console.error(e); process.exit(1) })
