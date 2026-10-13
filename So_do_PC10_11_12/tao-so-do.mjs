// Sinh 03 sơ đồ PC-10/11/12 (SVG trong HTML khổ A3 dọc) từ dữ liệu ở so-do-du-lieu.mjs.
// Chạy:  node So_do_PC10_11_12/tao-so-do.mjs   → ghi So_do_PC10_11_12/So_do_PC10_11_12.html
// Xuất PDF/PNG: node So_do_PC10_11_12/xuat-pdf.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SO_DO, NGAY_CHOT, NHAN_TRANG_THAI, NGUON } from './so-do-du-lieu.mjs'

const DIR = dirname(fileURLToPath(import.meta.url))

// ── Thông số bố cục (đơn vị px; trang A3 dọc ≈ 1100 × 1555) ──
const W = 1100
const MAIN_X = 210, MAIN_W = 560, CX = MAIN_X + MAIN_W / 2
const SIDE_X = 800, SIDE_W = 280
const FONT = 15, LH = 20, PAD = 12, GAP = 28
const CHAR_W = 7.7 // bề rộng trung bình 1 ký tự tiếng Việt ở cỡ 15px (Arial)

const MAU = {
  viec: { fill: '#E6F1FB', stroke: '#2F6FAE' },
  quyetDinh: { fill: '#EFE7FA', stroke: '#6B4BA8' },
  chuyenBuoc: { fill: '#EFE7FA', stroke: '#6B4BA8' },
  luuY: { fill: '#FFF6D6', stroke: '#B8901F' },
  canhBao: { fill: '#FDECEC', stroke: '#C0392B' },
  tuyChon: { fill: '#FFFFFF', stroke: '#2F6FAE' },
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function wrap(text, widthPx, size = FONT) {
  const max = Math.max(8, Math.floor((widthPx - 2 * PAD) / (CHAR_W * size / FONT)))
  const out = []
  for (const para of String(text).split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if ((line + ' ' + word).trim().length > max) { if (line) out.push(line); line = word } else line = (line + ' ' + word).trim()
    }
    out.push(line)
  }
  return out
}

// Khối chữ nhiều dòng: [{t, cls}] → trả về {svg, h}
function khoiChu(x, y, w, dong) {
  let cy = y + PAD + FONT
  let svg = ''
  for (const d of dong) {
    const size = d.size || FONT
    const lines = wrap(d.t, w, size)
    for (const ln of lines) {
      svg += `<text x="${x + PAD}" y="${cy}" class="${d.cls || ''}" font-size="${size}">${esc(ln)}</text>`
      cy += size + 5
    }
  }
  return { svg, h: cy - y - FONT + PAD - 2 }
}

function dongBuoc(n) {
  const d = []
  if (n.so || n.chuThe) d.push({ t: `${n.so ? n.so + ' · ' : ''}${n.chuThe || ''}`, cls: 'b' })
  if (n.viec) d.push({ t: n.viec })
  if (n.ketQua) d.push({ t: '→ ' + n.ketQua, cls: 'kq' })
  if (n.canCu) d.push({ t: 'Căn cứ: ' + n.canCu, cls: 'cc', size: 13 })
  return d
}

function veSoDo(sd) {
  let y = 0
  let body = ''
  const pos = {} // id → {x,y,w,h, kind}
  const loops = []
  let sideBottom = 0

  // Tiêu đề
  body += `<text x="${W / 2}" y="44" text-anchor="middle" class="title">${esc(sd.tieuDe)}</text>`
  body += `<text x="${W / 2}" y="72" text-anchor="middle" class="sub">${esc(sd.phuDe)}</text>`
  body += `<text x="${W / 2}" y="96" text-anchor="middle" class="date">Ngày chốt pháp lý: ${NGAY_CHOT} · ${esc(NHAN_TRANG_THAI)}</text>`
  y = 124

  // Chú giải
  const cg = [['viec', 'Công việc'], ['quyetDinh', 'Điều kiện / quyết định'], ['luuY', 'Lưu ý'], ['tuyChon', 'Bước tùy chọn (không bắt buộc)']]
  let cgx = 90
  for (const [k, ten] of cg) {
    const m = MAU[k]
    body += `<rect x="${cgx}" y="${y}" width="22" height="16" rx="3" fill="${m.fill}" stroke="${m.stroke}" ${k === 'tuyChon' ? 'stroke-dasharray="5 3"' : ''}/>`
    body += `<text x="${cgx + 30}" y="${y + 13}" font-size="13" class="cc">${ten}</text>`
    cgx += 30 + ten.length * 7 + 40
  }
  y += 40

  for (const n of sd.buoc) {
    if (n.loai === 'quyetDinh') {
      const lines = wrap(n.cauHoi, 330, 14)
      const h = Math.max(110, lines.length * 19 + 50)
      const w = 400
      const x = CX - w / 2
      body += `<polygon points="${CX},${y} ${x + w},${y + h / 2} ${CX},${y + h} ${x},${y + h / 2}" fill="${MAU.quyetDinh.fill}" stroke="${MAU.quyetDinh.stroke}" stroke-width="1.6"/>`
      let ty = y + h / 2 - (lines.length - 1) * 9.5 + 5
      for (const ln of lines) { body += `<text x="${CX}" y="${ty}" text-anchor="middle" font-size="14" class="b">${esc(ln)}</text>`; ty += 19 }
      pos[n.id] = { x, y, w, h, kind: 'qd' }
      if (n.canCu && !(n.co && n.co.ben)) body += `<text x="${x + w + 8}" y="${y + h / 2 + 24}" font-size="12.5" class="cc">${esc('Căn cứ: ' + n.canCu)}</text>`
      if (n.khong) loops.push({ from: n.id, to: n.khong.ve, nhan: n.khong.nhan || 'Không', ghiChu: n.khong.ghiChu })
      if (n.co && n.co.ve) loops.push({ from: n.id, to: n.co.ve, nhan: n.co.nhan || 'Có', ghiChu: n.co.ghiChu })
      let duoiBen = 0
      if (n.co && n.co.ben) {
        // nhánh sang khối bên phải — không chồng lên khối bên phải trước đó; căn cứ đưa vào trong khối
        const noiDung = [{ t: n.co.ben }]
        if (n.canCu) noiDung.push({ t: 'Căn cứ: ' + n.canCu, cls: 'cc', size: 12.5 })
        const bh = khoiChu(SIDE_X, 0, SIDE_W, noiDung).h
        const by = Math.max(y + h / 2 - bh / 2, sideBottom + 12)
        const mc = MAU[n.co.loai || 'viec']
        body += `<rect x="${SIDE_X}" y="${by}" width="${SIDE_W}" height="${bh}" rx="8" fill="${mc.fill}" stroke="${mc.stroke}"/>`
        body += khoiChu(SIDE_X, by, SIDE_W, noiDung).svg
        const ly = Math.min(Math.max(y + h / 2, by + 16), by + bh - 10)
        body += `<path d="M ${x + w} ${y + h / 2} H ${SIDE_X - 18} V ${ly} H ${SIDE_X}" fill="none" stroke="#334" stroke-width="1.6" marker-end="url(#m)"/>`
        body += `<text x="${x + w + 6}" y="${y + h / 2 - 6}" font-size="13" class="lbl">${esc(n.co.nhan || 'Có')}</text>`
        sideBottom = by + bh
        duoiBen = by + bh
      }
      const nhanDi = n.diTiep || (n.khong ? 'Có' : 'Không')
      if (duoiBen > y + h) { body += `<line x1="${CX}" y1="${y + h}" x2="${CX}" y2="${duoiBen}" stroke="#334" stroke-width="1.6"/>`; y = duoiBen } else y += h
      body += `<text x="${CX + 8}" y="${y + 20}" font-size="13" class="lbl">${esc(nhanDi)}</text>`
    } else {
      const m = MAU[n.loai === 'tuyChon' ? 'tuyChon' : n.loai === 'luuY' ? 'luuY' : n.loai === 'canhBao' ? 'canhBao' : 'viec']
      const dong = n.loai === 'luuY' || n.loai === 'canhBao' ? [{ t: n.noiDung }] : dongBuoc(n)
      const k = khoiChu(MAIN_X, y, MAIN_W, dong)
      body += `<rect x="${MAIN_X}" y="${y}" width="${MAIN_W}" height="${k.h}" rx="8" fill="${m.fill}" stroke="${m.stroke}" stroke-width="1.4" ${n.loai === 'tuyChon' ? 'stroke-dasharray="6 4"' : ''}/>`
      body += k.svg
      pos[n.id] = { x: MAIN_X, y, w: MAIN_W, h: k.h, kind: 'box' }
      // khối song song / tùy chọn bên phải
      if (n.ben) {
        const kb = khoiChu(SIDE_X, y, SIDE_W, dongBuoc(n.ben))
        const mb = MAU[n.ben.loai === 'tuyChon' ? 'tuyChon' : 'viec']
        body += `<rect x="${SIDE_X}" y="${y}" width="${SIDE_W}" height="${kb.h}" rx="8" fill="${mb.fill}" stroke="${mb.stroke}" stroke-dasharray="6 4"/>`
        body += kb.svg
        body += `<line x1="${MAIN_X + MAIN_W}" y1="${y + 26}" x2="${SIDE_X}" y2="${y + 26}" class="dash"/>`
      }
      const hBen = n.ben ? khoiChu(SIDE_X, y, SIDE_W, dongBuoc(n.ben)).h : 0
      if (n.ben) sideBottom = y + hBen
      if (hBen > k.h) body += `<line x1="${CX}" y1="${y + k.h}" x2="${CX}" y2="${y + hBen}" stroke="#334" stroke-width="1.6"/>`
      y += Math.max(k.h, hBen)
    }
    if (n !== sd.buoc[sd.buoc.length - 1]) {
      body += `<line x1="${CX}" y1="${y}" x2="${CX}" y2="${y + GAP - 4}" class="arrow"/>`
      y += GAP
    }
  }

  // Đường quay lại (bên trái)
  loops.forEach((lp, i) => {
    const a = pos[lp.from], b = pos[lp.to]
    if (!a || !b) return
    const lx = 40 + i * 30
    const ay = a.y + a.h / 2, by = b.y + Math.min(24, b.h / 2)
    const ax = a.kind === 'qd' ? a.x : a.x
    body += `<path d="M ${ax} ${ay} H ${lx} V ${by} H ${b.x - 2}" class="loop"/>`
    body += `<text x="${ax - 8}" y="${ay - 6}" text-anchor="end" font-size="13" class="lbl">${esc(lp.nhan)}</text>`
    if (lp.ghiChu) {
      const gw = MAIN_X - 14 - (lx + 6)
      const gl = wrap(lp.ghiChu, gw + 2 * PAD, 12)
      const gy0 = ay - 26 - (gl.length - 1) * 15
      gl.forEach((g, j) => { body += `<text x="${lx + 6}" y="${gy0 + j * 15}" font-size="12" class="cc">${esc(g)}</text>` })
    }
  })

  // Hồ sơ đầu ra + điều kiện chuyển bước + lưu ý cuối
  body += `<line x1="${CX}" y1="${y}" x2="${CX}" y2="${y + 32}" class="arrow"/>`
  y += 36
  for (const [k, tieu, nd] of [['viec', 'HỒ SƠ ĐẦU RA', sd.dauRa], ['chuyenBuoc', 'ĐIỀU KIỆN CHUYỂN BƯỚC', sd.chuyenBuoc], ['luuY', 'LƯU Ý PHÁP LÝ', sd.luuY.length ? ['Xem trang phụ lục: lưu ý pháp lý của ' + sd.ma + ' và danh mục nguồn chính thức.'] : []]]) {
    if (!nd || !nd.length) continue
    const dong = [{ t: tieu, cls: 'b' }, ...nd.map((t) => ({ t: '• ' + t, size: 14 }))]
    const kk = khoiChu(60, y, W - 120, dong)
    body += `<rect x="60" y="${y}" width="${W - 120}" height="${kk.h}" rx="8" fill="${MAU[k].fill}" stroke="${MAU[k].stroke}" stroke-width="1.4"/>`
    body += kk.svg
    y += kk.h + 14
  }
  const H = Math.max(y + 30, 600)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, 'Segoe UI', sans-serif">
<defs><marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#334"/></marker></defs>
<style>
 text{fill:#1d2733}
 .title{font-size:26px;font-weight:700}
 .sub{font-size:16px;fill:#3b4a5a}
 .date{font-size:13px;fill:#6B4BA8}
 .b{font-weight:700}
 .kq{fill:#1f4e79}
 .cc{fill:#5a6573}
 .lbl{fill:#6B4BA8;font-weight:700}
 .arrow{stroke:#334;stroke-width:1.6;marker-end:url(#m)}
 .dash{stroke:#2F6FAE;stroke-width:1.3;stroke-dasharray:5 4}
 .loop{fill:none;stroke:#6B4BA8;stroke-width:1.6;stroke-dasharray:7 4;marker-end:url(#m)}
</style>
<rect width="100%" height="100%" fill="#fff"/>
${body}
</svg>`
}

const svgs = SO_DO.map((sd) => ({ sd, svg: veSoDo(sd) }))
for (const { sd, svg } of svgs) writeFileSync(join(DIR, `${sd.ma}.svg`), svg, 'utf8')

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sơ đồ PC-10 · PC-11 · PC-12</title>
<style>
 @page { size: A3 portrait; margin: 8mm; }
 .phuluc { padding: 28px 40px; font-size: 15px; line-height: 1.5; }
 .phuluc h1 { font-size: 22px; margin: 0 0 4px; }
 .phuluc h2 { font-size: 17px; margin: 22px 0 6px; color: #2F6FAE; }
 .phuluc .note { background: #FFF6D6; border: 1px solid #B8901F; border-radius: 8px; padding: 10px 16px; }
 .phuluc a { color: #1f4e79; word-break: break-all; }
 body { margin: 0; background: #f4f6f9; font-family: Arial, 'Segoe UI', sans-serif; color: #1d2733; }
 .trang { background: #fff; max-width: 1100px; margin: 16px auto; box-shadow: 0 1px 4px rgba(0,0,0,.12); page-break-after: always; break-after: page; }
 .trang svg { width: 100%; height: auto; display: block; }
 @media print {
   body { background: #fff; }
   .trang { box-shadow: none; margin: 0 auto; max-width: none; height: 400mm; display: flex; justify-content: center; align-items: flex-start; overflow: hidden; }
   .trang svg { height: 100%; width: auto; max-width: 100%; }
   .trang.phuluc { display: block; height: auto; overflow: visible; }
 }
</style></head><body>
${svgs.map(({ svg }) => `<section class="trang">${svg}</section>`).join('\n')}
<section class="trang phuluc">
<h1>PHỤ LỤC — Lưu ý pháp lý và danh mục nguồn</h1>
<p>Ngày chốt pháp lý: ${NGAY_CHOT}. ${esc(NHAN_TRANG_THAI)}. Viết tắt: CĐT — chủ đầu tư; CQCBDA — cơ quan chuẩn bị dự án; QĐĐT — quyết định đầu tư.</p>
${SO_DO.map((sd) => `<h2>${esc(sd.tieuDe)}</h2><div class="note"><ul>${sd.luuY.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('\n')}
<h2>Danh mục nguồn chính thức (kiểm tra ngày ${NGAY_CHOT})</h2>
<ol>${NGUON.map(([ten, url]) => `<li>${esc(ten)} — ${url.startsWith('http') ? `<a href="${url}">${url}</a>` : esc(url)}</li>`).join('')}</ol>
</section>
</body></html>`
writeFileSync(join(DIR, 'So_do_PC10_11_12.html'), html, 'utf8')
console.log('Đã ghi', svgs.length, 'sơ đồ →', join(DIR, 'So_do_PC10_11_12.html'))
