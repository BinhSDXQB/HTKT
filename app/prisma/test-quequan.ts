import * as xlsx from 'xlsx'
import { convertQueQuan } from '../lib/que-quan'

const wb = xlsx.readFile('C:/QLNS - SXD QUANG TRI (mới gửi 14.5.26)s.xlsx')
const ws = wb.Sheets['DS SXD']
const range = xlsx.utils.decode_range(ws['!ref'] as string)

let ok = 0, mismatch = 0, newlyFilled = 0, noResult = 0
for (let r = 3; r < range.e.r; r++) {
  const get = (col: string) => {
    const c = ws[`${col}${r + 1}`]
    return c && c.v != null ? String(c.w ?? c.v).replace(/[\r\n]+/g, ' ').trim() : ''
  }
  const g = get('G'), h = get('H')
  if (!g || g === '7') continue
  const out = convertQueQuan(g)
  if (out && h) {
    const a = out.toLowerCase().replace(/\s+/g, ' ')
    const b = h.toLowerCase().replace(/\s+/g, ' ')
    if (b.includes(a.split(',')[0].replace(/^(xã|phường|đặc khu)\s+/, '')) || a === b) ok++
    else { mismatch++; console.log(`KHAC  r${r + 1}: G="${g}" | máy="${out}" | file="${h}"`) }
  } else if (out && !h) { newlyFilled++; console.log(`MOI   r${r + 1}: G="${g}" → "${out}"`) }
  else if (!out && h) { console.log(`THIEU r${r + 1}: G="${g}" | file="${h}" (máy không chuyển được)`) ; noResult++ }
  else { noResult++; console.log(`TRONG r${r + 1}: G="${g}" (không chuyển được, file cũng trống)`) }
}
console.log(`\nKhớp file: ${ok} | Khác file: ${mismatch} | Điền mới (file trống): ${newlyFilled} | Không chuyển được: ${noResult}`)
