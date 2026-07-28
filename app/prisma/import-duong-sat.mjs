// Nhập dữ liệu Kế hoạch vốn trung hạn 2026-2030 Dự án Đường sắt cao tốc Bắc-Nam
// từ file Excel vào 4 bảng: ds_du_an_gpmb, ds_du_an_thanh_phan, ds_ke_hoach_von, ds_lien_he
//
// Chạy: node prisma/import-duong-sat.mjs
//   hoặc: node prisma/import-duong-sat.mjs "C:\path\to\file.xlsx"
//
// Idempotent: TRUNCATE rồi INSERT lại (dữ liệu tham chiếu, không có user-generated content).

import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import XLSX from 'xlsx'

const XLSX_PATH = process.argv[2] || 'C:\\26.6.22 XD ke hoach trung han 26-30 du an Duong sat.xlsx'

// ── Nạp .env tối giản ────────────────────────────────────────────────────
const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}

const client = new pg.Client({ connectionString: env.DATABASE_URL })
const id = () => randomUUID().replace(/-/g, '').slice(0, 25) // cuid-compatible length

// ── Helpers ──────────────────────────────────────────────────────────────
function num(v) {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function str(v) {
  if (v === '' || v === null || v === undefined) return null
  return String(v).trim() || null
}

function classifySubProject(name) {
  const n = name.toLowerCase()
  if (n.includes('tái định cư') || n.includes('tái đinh cư')) return 'TAI_DINH_CU'
  if (n.includes('nghĩa trang') || n.includes('nghia trang')) return 'NGHIA_TRANG'
  if (n.includes('bồi thường') || n.includes('bồi thuờng')) return 'BOI_THUONG_HO_TRO'
  if (n.includes('di dời') || n.includes('di doi') || n.includes('hạ tầng kỹ thuật')) return 'DI_DOI_HTKT'
  return 'KHAC'
}

// ── Đọc Excel ────────────────────────────────────────────────────────────
console.log('Đọc file:', XLSX_PATH)
const wb = XLSX.readFile(XLSX_PATH)

function sheet(name) {
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
}

const sheetKH = sheet('TONG HOP KH 26-30')   // Sheet chính kế hoạch 26-30
const sheetTP = sheet('Du an TP doc lap')     // Dự án thành phần
const sheetPA2 = sheet('Phương án 2')         // Phương án TĐC
const sheetLH = sheet('TP du hop')            // Liên hệ

// ── Parse dự án GPMB chính (sheet TONG HOP KH 26-30, row 7 trở đi) ─────
// Columns: A=TT, B=Chủ ĐT, C=Tên DA, D=Mã DA, E=Nơi mở TK, F=Mã hiệu KBNN
//   G=2025 đã bố trí, H=2025 giải ngân, I=2025 huỷ dự toán, J=2025 (giải ngân duplicate)
//   K=2026 đã bố trí, L=2026 tổng, M=2026 TĐC,NT, N=2026 BT,HT,HTKT
//   O=Đề nghị điều chỉnh giảm, P=Giải ngân KHV 2026
//   Q=2027 tổng, R=2027 TĐC,NT, S=2027 BT,HT,HTKT
//   T=2028 tổng, U=2028 TĐC,NT, V=2028 BT,HT,HTKT
//   W=KH 2026-2028, X=Tổng nhu cầu tổng, Y=Tổng nhu cầu TĐC, Z=Tổng nhu cầu BT
//   AA=Văn bản liên quan

const gpmbRecords = []
for (let i = 7; i < sheetKH.length; i++) {
  const row = sheetKH[i]
  const stt = num(row[0])
  if (!stt || stt < 1) continue
  const chuDauTu = str(row[1])
  const tenDuAn = str(row[2])
  if (!chuDauTu || !tenDuAn) continue

  const rec = {
    id: id(),
    stt,
    chuDauTu,
    tenDuAn,
    maDuAn: str(row[3]),
    noiMoTK: str(row[4]),
    maHieuKBNN: str(row[5]),
    vanBanLienQuan: str(row[26]) || str(row[27]),
    // Tổng hợp
    keHoach2628: num(row[22]),
    tongNhuCau: num(row[23]),
    tongNhuCauTDC: num(row[24]),
    tongNhuCauBT: num(row[25]),
    // Kế hoạch vốn theo năm
    von2025: { daBoTri: num(row[6]), giaiNgan: num(row[7]), daHuyDuToan: num(row[8]) },
    von2026: {
      daBoTri: num(row[10]), tongKH: num(row[11]), khuTDC_NT: num(row[12]),
      boiThuongHT: num(row[13]), deNghiDieuChinhGiam: num(row[14]), giaiNganKHV: num(row[15])
    },
    von2027: { tongKH: num(row[16]), khuTDC_NT: num(row[17]), boiThuongHT: num(row[18]) },
    von2028: { tongKH: num(row[19]), khuTDC_NT: num(row[20]), boiThuongHT: num(row[21]) },
  }
  gpmbRecords.push(rec)
}

console.log(`Đã parse ${gpmbRecords.length} dự án GPMB chính`)

// ── Parse dự án thành phần (sheet Du an TP doc lap) ──────────────────────
// Columns: A=STT, B=Tên dự án TP, C=Sơ bộ TMĐT (tỷ đồng), D=Chủ ĐT, E=Người QĐ ĐT
// Nhóm theo chủ đầu tư: khi cột D có giá trị = bắt đầu nhóm mới

const tpRecords = []
let currentChuDauTu = null
let currentNguoiQD = null

for (let i = 1; i < sheetTP.length; i++) {
  const row = sheetTP[i]
  const stt = num(row[0])
  const tenDA = str(row[1])
  if (!tenDA) continue
  if (tenDA === 'TỔNG CỘNG') break

  if (str(row[3])) currentChuDauTu = str(row[3])
  if (str(row[4])) currentNguoiQD = str(row[4])

  tpRecords.push({
    id: id(),
    stt: stt || i,
    tenDuAn: tenDA,
    loaiDuAn: classifySubProject(tenDA),
    soBoTMDT: num(row[2]) || null,
    chuDauTu: currentChuDauTu,
    nguoiQDDauTu: currentNguoiQD,
  })
}

console.log(`Đã parse ${tpRecords.length} dự án thành phần`)

// ── Parse phương án TĐC (sheet Phương án 2) ─────────────────────────────
// Row 5+: A=TT, B=Chủ ĐT, C=Tên DA, D=Mã DA, E=Số TK, F=Nơi mở TK
//   G=Số lượng TĐC, H=TMĐT TĐC, I=Số lượng NT, J=TMĐT NT, K=KH2025

const pa2Map = new Map() // chuDauTu → { soLuongKhuTDC, tmDtKhuTDC, soLuongNT, tmDtNT }
for (let i = 5; i < sheetPA2.length; i++) {
  const row = sheetPA2[i]
  const chuDauTu = str(row[1])
  if (!chuDauTu) continue
  pa2Map.set(chuDauTu, {
    soLuongKhuTDC: num(row[6]) || null,
    tmDtKhuTDC: num(row[7]) || null,
    soLuongNghiaTrang: num(row[8]) || null,
    tmDtNghiaTrang: num(row[9]) || null,
  })
}

console.log(`Đã parse ${pa2Map.size} bản ghi phương án TĐC`)

// ── Parse liên hệ (sheet TP du hop) ─────────────────────────────────────
// Row 1+: A=TT, B=Đơn vị/Địa phương, C=Họ tên, D=Chức vụ, E=ĐT, F=Ghi chú

const lienHeRecords = []
let currentDonVi = null
for (let i = 1; i < sheetLH.length; i++) {
  const row = sheetLH[i]
  const donVi = str(row[1])
  const hoTen = str(row[2])
  if (donVi) currentDonVi = donVi
  if (!currentDonVi) continue
  // Chỉ ghi bản ghi có đơn vị (dù chưa có tên người)
  if (donVi && !hoTen) {
    lienHeRecords.push({
      id: id(), donVi: currentDonVi,
      hoTen: null, chucVu: null, dienThoai: null, ghiChu: str(row[5])
    })
  } else if (hoTen) {
    lienHeRecords.push({
      id: id(), donVi: currentDonVi,
      hoTen, chucVu: str(row[3]), dienThoai: str(row[4]), ghiChu: str(row[5])
    })
  }
}

console.log(`Đã parse ${lienHeRecords.length} bản ghi liên hệ`)

// ── Ghép thành phần → dự án GPMB (theo chủ đầu tư) ─────────────────────
function removeDiacritics(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalize(s) {
  return removeDiacritics(s.toLowerCase()).replace(/\s+/g, ' ').trim()
}

function matchGpmb(chuDauTu) {
  if (!chuDauTu) return null
  const norm = normalize(chuDauTu)
  return gpmbRecords.find(g => {
    const gn = normalize(g.chuDauTu)
    return gn === norm || gn.includes(norm) || norm.includes(gn)
  })
}

for (const tp of tpRecords) {
  const gpmb = matchGpmb(tp.chuDauTu)
  if (gpmb) {
    tp.duAnGpmbId = gpmb.id
    // Gắn phương án TĐC
    const pa2 = pa2Map.get(tp.chuDauTu)
    if (pa2) Object.assign(tp, pa2)
  }
}

// ── INSERT vào database ──────────────────────────────────────────────────
await client.connect()
console.log('Kết nối database OK')

try {
  await client.query('BEGIN')

  // Truncate (cascade) để idempotent
  await client.query('TRUNCATE ds_lien_he, ds_ke_hoach_von, ds_du_an_thanh_phan, ds_du_an_gpmb CASCADE')
  console.log('Đã TRUNCATE 4 bảng')

  // 1. INSERT ds_du_an_gpmb
  for (const g of gpmbRecords) {
    await client.query(`
      INSERT INTO ds_du_an_gpmb (
        id, stt, "chuDauTu", "tenDuAn", "maDuAn", "noiMoTK", "maHieuKBNN",
        "keHoach2628", "tongNhuCau", "tongNhuCauTDC", "tongNhuCauBT",
        "vanBanLienQuan", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
    `, [
      g.id, g.stt, g.chuDauTu, g.tenDuAn, g.maDuAn, g.noiMoTK, g.maHieuKBNN,
      g.keHoach2628, g.tongNhuCau, g.tongNhuCauTDC, g.tongNhuCauBT,
      g.vanBanLienQuan
    ])
  }
  console.log(`Đã INSERT ${gpmbRecords.length} dự án GPMB`)

  // 2. INSERT ds_ke_hoach_von (4 năm × mỗi dự án)
  let vonCount = 0
  for (const g of gpmbRecords) {
    const years = [
      { nam: 2025, ...g.von2025, tongKH: 0, khuTDC_NT: 0, boiThuongHT: 0, deNghiDieuChinhGiam: 0, giaiNganKHV: 0 },
      { nam: 2026, daBoTri: g.von2026.daBoTri, giaiNgan: 0, daHuyDuToan: 0, ...g.von2026 },
      { nam: 2027, daBoTri: 0, giaiNgan: 0, daHuyDuToan: 0, deNghiDieuChinhGiam: 0, giaiNganKHV: 0, ...g.von2027 },
      { nam: 2028, daBoTri: 0, giaiNgan: 0, daHuyDuToan: 0, deNghiDieuChinhGiam: 0, giaiNganKHV: 0, ...g.von2028 },
    ]
    for (const y of years) {
      await client.query(`
        INSERT INTO ds_ke_hoach_von (
          id, "duAnGpmbId", nam, "daBoTri", "giaiNgan", "daHuyDuToan",
          "tongKH", "khuTDC_NT", "boiThuongHT", "deNghiDieuChinhGiam", "giaiNganKHV",
          "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      `, [
        id(), g.id, y.nam, y.daBoTri, y.giaiNgan, y.daHuyDuToan,
        y.tongKH, y.khuTDC_NT, y.boiThuongHT, y.deNghiDieuChinhGiam, y.giaiNganKHV
      ])
      vonCount++
    }
  }
  console.log(`Đã INSERT ${vonCount} bản ghi kế hoạch vốn`)

  // 3. INSERT ds_du_an_thanh_phan
  let tpCount = 0
  for (const tp of tpRecords) {
    if (!tp.duAnGpmbId) {
      console.warn(`  ⚠ Thành phần "${tp.tenDuAn.substring(0, 60)}" không khớp GPMB, bỏ qua`)
      continue
    }
    await client.query(`
      INSERT INTO ds_du_an_thanh_phan (
        id, "duAnGpmbId", stt, "tenDuAn", "loaiDuAn", "soBoTMDT",
        "chuDauTu", "nguoiQDDauTu",
        "soLuongKhuTDC", "tmDtKhuTDC", "soLuongNghiaTrang", "tmDtNghiaTrang",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5::\"DuAnThanhPhanLoai\",$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
    `, [
      tp.id, tp.duAnGpmbId, tp.stt, tp.tenDuAn, tp.loaiDuAn, tp.soBoTMDT,
      tp.chuDauTu, tp.nguoiQDDauTu,
      tp.soLuongKhuTDC || null, tp.tmDtKhuTDC || null,
      tp.soLuongNghiaTrang || null, tp.tmDtNghiaTrang || null,
    ])
    tpCount++
  }
  console.log(`Đã INSERT ${tpCount} dự án thành phần`)

  // 4. INSERT ds_lien_he
  for (const lh of lienHeRecords) {
    // Thử match đơn vị với dự án GPMB
    const gpmb = matchGpmb(lh.donVi)
    await client.query(`
      INSERT INTO ds_lien_he (id, "duAnGpmbId", "donVi", "hoTen", "chucVu", "dienThoai", "ghiChu", "createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    `, [lh.id, gpmb?.id || null, lh.donVi, lh.hoTen, lh.chucVu, lh.dienThoai, lh.ghiChu])
  }
  console.log(`Đã INSERT ${lienHeRecords.length} bản ghi liên hệ`)

  await client.query('COMMIT')
  console.log('\n✅ HOÀN THÀNH nhập dữ liệu đường sắt cao tốc')
  console.log(`   ${gpmbRecords.length} dự án GPMB`)
  console.log(`   ${vonCount} bản ghi kế hoạch vốn (${gpmbRecords.length} DA × 4 năm)`)
  console.log(`   ${tpCount} dự án thành phần`)
  console.log(`   ${lienHeRecords.length} bản ghi liên hệ`)
} catch (err) {
  await client.query('ROLLBACK')
  console.error('❌ LỖI:', err)
  process.exit(1)
} finally {
  await client.end()
}
