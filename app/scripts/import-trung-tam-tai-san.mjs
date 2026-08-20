#!/usr/bin/env node
// Nhập tài sản Trung tâm Quản lý, bảo trì GT & HTKT từ 2 file Excel:
//   Phụ lục 2 (chiếu sáng công cộng + đèn tín hiệu) -> linhVuc 'trung-tam-bao-tri/chieu-sang'
//   Phụ lục 3 (giếng tách, trạm bơm, tuyến cống)   -> linhVuc 'trung-tam-bao-tri/thoat-nuoc'
// Mỗi bản ghi có sẵn cột toạ độ (toaDoLat/toaDoLng = null, điền sau trên bản đồ).
// Chạy:  node scripts/import-trung-tam-tai-san.mjs [--dry]
import XLSX from 'xlsx'
import { Client } from 'pg'
import { randomUUID } from 'crypto'
import fs from 'fs'

const DRY = process.argv.includes('--dry')
const DIR = 'C:\\Troly\\Dulieu TT bao try'
const F2 = `${DIR}\\Phụ lục 2. Tổng hợp ĐCSCC và ĐTH giao thông (Chốt).xlsx`
const F3 = `${DIR}\\Phụ lục 3. Tổng hợp hệ thống thoát nước giao Ban Bảo trì.xlsx`
const TOCHUC = 'tc_ban_bao_tri_gt'
const LV_CS = 'trung-tam-bao-tri/chieu-sang'
const LV_TN = 'trung-tam-bao-tri/thoat-nuoc'

const clean = (v) => v == null ? null : String(v).normalize('NFC').replace(/\s+/g, ' ').trim() || null
const num = (v) => {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const s = String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}
const isRoman = (v) => v != null && /^[IVX]+\.?$/i.test(String(v).trim())
const isSection = (name) => {
  const s = (clean(name) || '').toLowerCase()
  return !s || /^(i{1,3}v?|iv|v|vi)\b[\.\)]/.test(s) || /đcscc trên địa bàn|^tổng|^cộng|^tt\b/.test(s)
}
const grid = (ws) => XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

const records = []
const add = (linhVuc, tieuDe, diaBan, cf, ghiChu) => {
  if (!tieuDe || /^\d+([.,]\d+)?$/.test(clean(tieuDe))) return // bỏ dòng legend số cột
  records.push({
    linhVuc, tieuDe: clean(tieuDe), diaBan: clean(diaBan) || null,
    ghiChu: clean(ghiChu) || null,
    customFields: { toaDoLat: null, toaDoLng: null, ...cf },
  })
}
const mapTinhTrangDen = (s) => {
  const t = (clean(s) || '').toLowerCase()
  if (!t) return null
  if (t.includes('bình thường')) return 'Hoạt động bình thường'
  if (t.includes('sửa')) return 'Đang sửa chữa'
  if (t.includes('hoàn toàn') || t.includes('không hoạt')) return 'Hư hỏng hoàn toàn'
  if (t.includes('hỏng') || t.includes('hư')) return 'Hư hỏng một phần'
  return null
}

// ── Phụ lục 2: CHIẾU SÁNG CÔNG CỘNG theo địa bàn ──────────────────────────
function napCSCC(wb, sheet, diaBan) {
  const ws = wb.Sheets[sheet]; if (!ws) return
  const g = grid(ws)
  let cur = null // tên tuyến hiện tại (dòng con "- Đoạn..." kế thừa)
  for (const r of g) {
    const c3 = clean(r[3]); const cd = num(r[4]); const sb = num(r[5])
    if (!c3 && cd == null && sb == null) continue
    if (c3 && /^\d+$/.test(c3)) continue          // legend số cột
    if (c3 && isSection(c3)) continue              // dòng nhóm "I. ĐCSCC..."
    if (c3 && !c3.startsWith('-')) cur = c3         // dòng tên tuyến
    if (cd == null && sb == null) continue          // dòng tên không số liệu (đoạn kê ở dòng dưới)
    const ten = c3 && c3.startsWith('-') ? `${cur || ''} ${c3}`.trim() : (c3 || cur)
    add(LV_CS, ten, diaBan, {
      loai: 'Đèn chiếu sáng đường phố', tuyen: cur || ten,
      chieuDaiM: cd, soLuong: sb,
      tuDieuKhien: clean(r[6]), loaiDen: clean(r[7]) ? 'LED' : null,
    }, clean(r[7]) ? `Loại đèn: ${clean(r[7])}` : null)
  }
}

// ── Phụ lục 2: ĐÈN TÍN HIỆU GIAO THÔNG ────────────────────────────────────
function napDenTHGT(wb) {
  const ws = wb.Sheets['DEN THGT']; if (!ws) return
  const g = grid(ws)
  for (let i = 2; i < g.length; i++) {
    const r = g[i], ten = clean(r[1])
    if (!ten || isRoman(r[0]) || isSection(ten)) continue
    add(LV_CS, ten, r[8], {
      loai: 'Đèn tín hiệu giao thông', tuyen: clean(r[2]),
      congSuatW: num(r[13]), namVanHanh: num(r[9]),
      tinhTrang: mapTinhTrangDen(r[5]),
      chuDauTu: clean(r[3]),
      donViQuanLyVanHanh: clean(r[10]), donViQuanLyTaiSan: clean(r[11]),
    }, [clean(r[4]) && `Nguồn điện: ${clean(r[4])}`, clean(r[7])].filter(Boolean).join(' — ') || null)
  }
}

// ── Phụ lục 3: GIẾNG TÁCH ─────────────────────────────────────────────────
function napGiengTach(wb) {
  const ws = wb.Sheets['Giếng tách']; if (!ws) return
  const g = grid(ws)
  for (let i = 4; i < g.length; i++) {
    const r = g[i], ten = clean(r[1])
    if (!ten || isRoman(r[0]) || isSection(ten)) continue
    const kt = [num(r[3]), num(r[4]), num(r[5])].filter((x) => x != null)
    add(LV_TN, ten, null, {
      loaiHangMuc: 'Giếng tách nước', viTri: clean(r[2]),
      kichThuoc: kt.length === 3 ? `${kt[0]}×${kt[1]}×${kt[2]} m` : null,
      klBunM3: num(r[7]),
    }, [clean(r[8]), r[6] != null && `Ngập bùn ${num(r[6])} m`].filter(Boolean).join(' — ') || null)
  }
}

// ── Phụ lục 3: TRẠM BƠM ───────────────────────────────────────────────────
function napTramBom(wb) {
  const ws = wb.Sheets['Trạm bơm']; if (!ws) return
  const g = grid(ws)
  for (let i = 3; i < g.length; i++) {
    const r = g[i], ten = clean(r[1])
    if (!ten || isRoman(r[0]) || isSection(ten)) continue
    const a = num(r[3]), b = num(r[4])
    add(LV_TN, ten, null, {
      loaiHangMuc: 'Trạm bơm', viTri: clean(r[2]),
      kichThuoc: a && b ? `${a}×${b} mm` : null, klBunM3: num(r[6]),
    }, r[5] != null ? `Chiều sâu ngập bùn TB: ${num(r[5])} mm` : null)
  }
}

// ── Phụ lục 3: CÁC TUYẾN CỐNG (thải R1R2 / chung / mưa) ────────────────────
function napTuyenCong(wb, sheet, loaiHangMuc, layout) {
  const ws = wb.Sheets[sheet]; if (!ws) return
  const g = grid(ws)
  let prevTen = null
  for (let i = 2; i < g.length; i++) {
    const r = g[i]
    const ten = clean(r[1]) || (clean(r[layout.ketCau]) || num(r[layout.chieuDai]) != null ? prevTen : null)
    if (!ten || isRoman(r[0]) || isSection(ten)) continue
    if (clean(r[1])) prevTen = clean(r[1])
    add(LV_TN, ten, null, {
      loaiHangMuc,
      viTri: [clean(r[2]), clean(r[3])].filter(Boolean).join(' – ') || null,
      loaiCong: [clean(r[layout.ketCau]), layout.loaiCong != null && clean(r[layout.loaiCong])].filter(Boolean).join(' / ') || null,
      chieuDaiM: num(r[layout.chieuDai]), slHoGa: num(r[layout.slHoGa]),
    }, null)
  }
}

async function main() {
  const wb2 = XLSX.readFile(F2), wb3 = XLSX.readFile(F3)
  napCSCC(wb2, 'CSCC Dong Hoi', 'Phường Đồng Hới')
  napCSCC(wb2, 'CSCC Dong Son', 'Phường Đồng Sơn')
  napCSCC(wb2, 'CSCC Dong Thuan', 'Phường Đồng Thuận')
  napDenTHGT(wb2)
  napGiengTach(wb3)
  napTramBom(wb3)
  napTuyenCong(wb3, 'Thoát nước thải R1, R2', 'Tuyến thoát nước thải', { ketCau: 4, loaiCong: 5, chieuDai: 6, slHoGa: 7 })
  napTuyenCong(wb3, 'Thoát nước chung', 'Tuyến thoát nước chung', { ketCau: 4, loaiCong: 5, chieuDai: 6, slHoGa: 7 })
  napTuyenCong(wb3, 'Thoát nước mưa', 'Tuyến thoát nước mưa', { ketCau: 4, loaiCong: null, chieuDai: 5, slHoGa: 6 })

  const byLv = records.reduce((a, r) => ((a[r.linhVuc] = (a[r.linhVuc] || 0) + 1), a), {})
  const byLoai = records.reduce((a, r) => { const k = r.customFields.loai || r.customFields.loaiHangMuc; a[k] = (a[k] || 0) + 1; return a }, {})
  console.log('TỔNG bản ghi:', records.length, '\nTheo lĩnh vực:', byLv, '\nTheo loại:', byLoai)
  console.log('\nMẫu 6 bản ghi:')
  for (const r of records.slice(0, 6)) console.log(' •', r.linhVuc.split('/')[1], '|', r.tieuDe, '|', JSON.stringify(r.customFields))

  if (DRY) { console.log('\n[DRY] Không ghi DB.'); return }

  const url = (fs.readFileSync('.env', 'utf8').match(/DATABASE_URL="([^"]+)"/) || [])[1]
  const c = new Client({ connectionString: url }); await c.connect()
  await c.query('delete from nghiep_vu_ban_ghi where "toChucId"=$1 and "linhVuc" in ($2,$3)', [TOCHUC, LV_CS, LV_TN])
  let n = 0
  for (const r of records) {
    const pre = r.linhVuc === LV_CS ? 'TTBT-CS' : 'TTBT-TN'
    const ma = `${pre}-${String(++n).padStart(4, '0')}`
    await c.query(
      `insert into nghiep_vu_ban_ghi (id,"linhVuc","toChucId","maBanGhi","tieuDe","trangThai","diaBan","customFields","ghiChu","ngayGhiNhan","createdAt","updatedAt")
       values ($1,$2,$3,$4,$5,'HOAN_THANH',$6,$7,$8,now(),now(),now())`,
      [randomUUID(), r.linhVuc, TOCHUC, ma, r.tieuDe, r.diaBan, JSON.stringify(r.customFields), r.ghiChu]
    )
  }
  console.log(`\nĐÃ NHẬP ${n} bản ghi vào nghiep_vu_ban_ghi (Trung tâm bảo trì).`)
  await c.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
