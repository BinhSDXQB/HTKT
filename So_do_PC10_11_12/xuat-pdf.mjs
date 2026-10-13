// Xuất So_do_PC10_11_12.html → PDF khổ A3 dọc + PNG từng sơ đồ (dùng puppeteer-core của app + Chrome có sẵn).
// Chạy: node So_do_PC10_11_12/xuat-pdf.mjs
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(DIR, '..', 'app', 'package.json'))
const puppeteer = require('puppeteer-core')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1180, height: 1600, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(join(DIR, 'So_do_PC10_11_12.html')).href, { waitUntil: 'load' })
  await page.pdf({ path: join(DIR, 'So_do_PC10_11_12.pdf'), format: 'A3', printBackground: true, margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' } })
  const sections = await page.$$('section.trang')
  const ma = ['PC-10', 'PC-11', 'PC-12', 'Phu-luc-nguon']
  for (let i = 0; i < sections.length; i++) {
    await sections[i].screenshot({ path: join(DIR, `${ma[i]}.png`) })
  }
  console.log('Đã xuất PDF và', sections.length, 'PNG')
} finally {
  await browser.close()
}
