// Tạo hồ sơ KPI quý theo từng cán bộ (Excel, công thức sống) từ Phụ lục KPI Kế hoạch 2026.
//   node --experimental-strip-types scripts/kpi-xuat-excel.mjs [--quy 3] [--ra <thư mục>] [--phong HTKT]
// Mặc định: quý 3, thư mục ra = ../docs/kpi-2026/q3 . Mỗi phòng một tệp; trong tệp: HuongDan, TongHop, mỗi cán bộ một sheet.
// Công thức trong sheet PHẢI khớp lib/kpi/tinh-kpi.ts (kiểm tra bằng scripts/kpi-doi-chieu.mjs).
import { readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { TRUC } from '../lib/kpi/tinh-kpi.ts'
import { phanTichThoiHan, macDinhTheoQuy } from '../lib/kpi/thoi-han.ts'
import { deXuatTruc } from '../lib/kpi/phan-truc.ts'

const goc = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = (k, mac) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : mac }
const QUY = Number(arg('quy', '3'))
const RA = arg('ra', join(goc, '..', 'docs', 'kpi-2026', `q${QUY}`))
const CHI_PHONG = arg('phong', null)

const TEN_PHONG = {
  QLHDXD: 'Phòng Quản lý hoạt động xây dựng', QHKT: 'Phòng Quy hoạch Kiến trúc', KTVLXD: 'Phòng Kinh tế và Vật liệu xây dựng',
  HTKT: 'Phòng Hạ tầng kỹ thuật', PTDT: 'Phòng Phát triển đô thị', QLKCHTGT: 'Phòng Quản lý kết cấu hạ tầng giao thông',
  QLCLCTGT: 'Phòng Quản lý chất lượng công trình giao thông', QLNTTBDS: 'Phòng Quản lý nhà và thị trường bất động sản',
  QLVT: 'Phòng Quản lý vận tải', KHTC: 'Phòng Kế hoạch - Tài chính', VP: 'Văn phòng',
}
const VAI_TRO = { CHU_TRI: 'Chủ trì', PHOI_HOP: 'Phối hợp', THUC_HIEN: 'Thực hiện' }
const LA_MA = ['', 'I', 'II', 'III', 'IV']
const MUC_CHON = { CO: 'Có', KHONG: 'Không', TUY_CHON: 'Có' }

const du_lieu = JSON.parse(readFileSync(join(goc, 'lib', 'kpi', 'ke-hoach-2026.json'), 'utf8'))

// ---------- Màu & kiểu ----------
const MAU = { nhap: 'FFFFF2CC', tieuDe: 'FF1F4E78', phu: 'FFD9E1F2', tinh: 'FFF2F2F2', canhBao: 'FFFCE4D6' }
const vien = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
const tieuDe = (c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU.tieuDe } }; c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }; c.border = vien }
const nhap = (c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU.nhap } }; c.border = vien }
const tinh = (c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU.tinh } }; c.border = vien }
const duLieu = (c) => { c.border = vien; c.alignment = { wrapText: true, vertical: 'top' } }
const tenSheet = (ten, i) => `${String(i + 1).padStart(2, '0')} ${ten}`.replace(/[\\/*?:[\]]/g, '').slice(0, 31)

// ---------- Mỗi phòng ----------
function ganChucVu(nvPhong) {
  const bac = { TP: 3, PTP: 2, CV: 1 }
  const m = new Map()
  for (const n of nvPhong) for (const p of n.nguoi) if (p.chucVu && (bac[p.chucVu] ?? 0) > (bac[m.get(p.ten)] ?? 0)) m.set(p.ten, p.chucVu)
  return m
}

function dongNhiemVu(nv, ten) {
  const ng = nv.nguoi.find((x) => x.ten === ten)
  const th = phanTichThoiHan(nv.thoiHan)
  let chon = MUC_CHON[macDinhTheoQuy(th, QUY)]
  let ghiChu = ''
  if (ng?.quy && !ng.quy.includes(QUY)) { chon = 'Không'; ghiChu = `Được giao ${ng.ghiChu}` }
  else if (ng?.ghiChu) ghiChu = `(${ng.ghiChu})`
  if (macDinhTheoQuy(th, QUY) === 'TUY_CHON' && !ghiChu) ghiChu = th.khongRo ? 'Ô thời hạn trống – tự xác định' : 'Thường xuyên/cả năm – bỏ chọn nếu quý này không phát sinh'
  const dx = deXuatTruc(nv.ten, nv.sanPham)
  return { nv, vaiTro: VAI_TRO[ng?.vaiTro ?? 'THUC_HIEN'], truc: dx.truc, tuKhoa: dx.tuKhoa, chon, ghiChu }
}

const COT = { stt: 1, ma: 2, ten: 3, sp: 4, han: 5, vt: 6, truc: 7, heSo: 8, chon: 9, ht: 10, dh: 11, cl: 12, vuot: 13, gc: 14,
  w: 16, hth: 17, dat: 18, dhw: 19, sl: 20, vm: 21, chua: 22 }
const L = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }

const HANG_KPI = 9      // dòng tiêu đề bảng KPI
const HANG_NV0 = 32     // dòng tiêu đề bảng nhiệm vụ

function sheetCanBo(wb, idx, phongMa, ten, chucVu, dong) {
  const ws = wb.addWorksheet(tenSheet(ten, idx), { views: [{ state: 'frozen', ySplit: 0 }] })
  const tong = dong.length
  const r0 = HANG_NV0 + 1, r1 = HANG_NV0 + Math.max(tong, 1)
  const rg = (c) => `$${L(c)}$${r0}:$${L(c)}$${r1}`
  ws.columns = [6, 11, 46, 40, 16, 11, 7, 7, 11, 11, 11, 11, 11, 32, 2, 7, 7, 7, 7, 6, 6, 6].map((width) => ({ width }))

  ws.mergeCells('A1:N1'); ws.getCell('A1').value = `HỒ SƠ ĐÁNH GIÁ, XẾP LOẠI QUÝ ${LA_MA[QUY]}/2026 — BẢNG TÍNH ĐIỂM KPI`
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.mergeCells('A2:N2'); ws.getCell('A2').value = 'Căn cứ: Công văn 9409/SXD-VP (23/10/2026), Công văn 5653/SNV-CBCCVC, Hướng dẫn 02-HD/TU; Kế hoạch nhiệm vụ năm 2026 (QĐ 954/QĐ-SXD). Ô màu vàng = cán bộ nhập; ô xám = tự tính.'
  ws.getCell('A2').font = { italic: true, size: 9 }
  const kv = [['Họ và tên', ten], ['Đơn vị', TEN_PHONG[phongMa]], ['Giữ chức vụ lãnh đạo, quản lý?', chucVu === 'TP' || chucVu === 'PTP' ? 'Có' : 'Không'],
    ['Điểm tiêu chí chung (0–30)', null], ['Chỉ số D – năng lực lãnh đạo, chỉ đạo, điều hành (0–100%; chỉ lãnh đạo)', null]]
  kv.forEach(([k, v], i) => {
    const r = 3 + i
    ws.mergeCells(`A${r}:C${r}`); ws.getCell(`A${r}`).value = k; ws.getCell(`A${r}`).font = { bold: true }
    ws.mergeCells(`D${r}:E${r}`)
    const c = ws.getCell(`D${r}`); c.value = v
    if (i >= 2) nhap(c)
    c.border = vien
  })
  ws.getCell('F5').value = chucVu === 'TP' || chucVu === 'PTP' ? `(Kế hoạch ghi: ${chucVu === 'TP' ? 'Trưởng phòng' : 'Phó Trưởng phòng'})` : '(chọn "Có" nếu là lãnh đạo phòng/đơn vị)'
  ws.getCell('F5').font = { italic: true, size: 9 }
  ws.getCell('D5').dataValidation = { type: 'list', allowBlank: false, formulae: ['"Có,Không"'] }
  ws.getCell('D6').dataValidation = { type: 'decimal', operator: 'between', formulae: [0, 30], allowBlank: true, showErrorMessage: true, error: 'Nhập 0–30' }
  ws.getCell('D7').dataValidation = { type: 'decimal', operator: 'between', formulae: [0, 1], allowBlank: true, showErrorMessage: true, error: 'Nhập 0–1 (ví dụ 0,9 = 90%)' }
  ws.getCell('D7').numFmt = '0%'

  // ---- Bảng KPI theo trục ----
  const h = HANG_KPI
  ws.mergeCells(`A${h - 1}:N${h - 1}`); ws.getCell(`A${h - 1}`).value = 'BẢNG TÍNH ĐIỂM KẾT QUẢ THỰC HIỆN NHIỆM VỤ (70 điểm) — Điểm KPI = (A+B+C+D)/4; người không giữ chức vụ lãnh đạo: (A+B+C)/3'
  ws.getCell(`A${h - 1}`).font = { bold: true }
  const heads = ['Trục', 'Số NV', 'Nội dung trục', '', 'Điểm tối đa', 'A Số lượng', 'B Chất lượng', 'C Tiến độ', 'D Lãnh đạo', 'Điểm KPI', 'Điểm tối đa sau chuyển', 'Điểm']
  const cotKpi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  ws.mergeCells(`C${h}:D${h}`)
  heads.forEach((t, i) => { if (t !== '' ) { const c = ws.getCell(h, cotKpi[i]); c.value = t; tieuDe(c) } })
  ws.getCell(h, 4).border = vien
  ws.getRow(h).height = 32
  const SL = rg(COT.sl), W = rg(COT.w), HTH = rg(COT.hth), DAT = rg(COT.dat), DHW = rg(COT.dhw), TR = rg(COT.truc)
  const dong1 = h + 1
  TRUC.forEach((t, i) => {
    const r = dong1 + i
    ws.getCell(r, 1).value = t.ma
    ws.getCell(r, 3).value = t.ten; ws.mergeCells(`C${r}:D${r}`)
    ws.getCell(r, 5).value = t.diemToiDa
    ws.getCell(r, 2).value = { formula: `SUMIFS(${SL},${TR},A${r})` }
    const e = `SUMIFS(${W},${TR},A${r})`, ht = `SUMIFS(${HTH},${TR},A${r})`
    ws.getCell(r, 6).value = { formula: `IF(B${r}=0,"",IF(${e}=0,0,${ht}/${e}))` }
    ws.getCell(r, 7).value = { formula: `IF(B${r}=0,"",IF(${ht}=0,0,SUMIFS(${DAT},${TR},A${r})/${ht}))` }
    ws.getCell(r, 8).value = { formula: `IF(B${r}=0,"",IF(${e}=0,0,SUMIFS(${DHW},${TR},A${r})/${e}))` }
    ws.getCell(r, 9).value = { formula: `IF($D$5="Có",MIN(1,MAX(0,IF(ISNUMBER($D$7),$D$7,0))),"")` }
    ws.getCell(r, 10).value = { formula: `IF(B${r}=0,"Không có nhiệm vụ",MIN(1,IF($D$5="Có",(F${r}+G${r}+H${r}+I${r})/4,(F${r}+G${r}+H${r})/3)))` }
    ws.getCell(r, 11).value = { formula: `IF(B${r}=0,0,E${r}+IF(A${r}=$B$${dong1 + 7},$B$${dong1 + 8},0))` }
    ws.getCell(r, 12).value = { formula: `IF(B${r}=0,0,J${r}*K${r})` }
    for (let c = 1; c <= 12; c++) { if (c !== 4) { const cell = ws.getCell(r, c); tinh(cell); cell.alignment = { wrapText: true, vertical: 'middle' } } }
    for (const c of [6, 7, 8, 9, 10]) ws.getCell(r, c).numFmt = '0.0%'
    ws.getCell(r, 12).numFmt = '0.00'
    ws.getRow(r).height = 30
  })
  // trục nhận điểm chuyển + điểm trống
  const rn = dong1 + 7
  ws.getCell(rn, 1).value = 'Trục nhận điểm chuyển'
  ws.getCell(rn, 2).value = { formula: `IF(SUM(B${dong1}:B${dong1 + 5})=0,0,IF(B${dong1}>0,1,IF(B${dong1 + 1}>0,2,IF(B${dong1 + 3}>0,4,IF(B${dong1 + 2}>0,3,IF(B${dong1 + 4}>0,5,6))))))` }
  ws.getCell(rn + 1, 1).value = 'Điểm các trục trống'
  ws.getCell(rn + 1, 2).value = { formula: `IF(B${rn}=0,0,SUMIF(B${dong1}:B${dong1 + 5},0,E${dong1}:E${dong1 + 5}))` }
  for (const r of [rn, rn + 1]) { ws.getCell(r, 1).font = { size: 9, italic: true }; tinh(ws.getCell(r, 2)) }
  ws.getCell(rn, 1).alignment = { wrapText: true }; ws.getCell(rn + 1, 1).alignment = { wrapText: true }
  ws.getRow(rn).height = 26; ws.getRow(rn + 1).height = 26

  // ---- Tổng hợp & xếp loại ----
  const t0 = rn + 3
  const dongTH = [
    ['Điểm kết quả thực hiện nhiệm vụ (/70)', `SUM(L${dong1}:L${dong1 + 5})`, '0.00'],
    ['Điểm tiêu chí chung (/30)', `MIN(30,MAX(0,IF(ISNUMBER(D6),D6,0)))`, '0.00'],
    ['TỔNG ĐIỂM (/100)', `ROUND(B${t0}+B${t0 + 1},2)`, '0.00'],
    ['Mức xếp loại theo tổng điểm', `IF(B${t0 + 2}>=90,"Hoàn thành xuất sắc nhiệm vụ",IF(B${t0 + 2}>=70,"Hoàn thành tốt nhiệm vụ",IF(B${t0 + 2}>=50,"Hoàn thành nhiệm vụ","Không hoàn thành nhiệm vụ")))`, null],
    ['Chỉ số A tổng hợp (số lượng)', `IF(SUM(${W})=0,"",SUM(${HTH})/SUM(${W}))`, '0.0%'],
    ['Chỉ số B tổng hợp (chất lượng)', `IF(SUM(${HTH})=0,0,SUM(${DAT})/SUM(${HTH}))`, '0.0%'],
    ['Chỉ số C tổng hợp (tiến độ)', `IF(SUM(${W})=0,"",SUM(${DHW})/SUM(${W}))`, '0.0%'],
    ['Tỷ lệ nhiệm vụ hoàn thành vượt mức', `IF(SUM(${SL})=0,0,SUM(${rg(COT.vm)})/SUM(${SL}))`, '0.0%'],
  ]
  dongTH.forEach(([k, f, fmt], i) => {
    const r = t0 + i
    ws.mergeCells(`C${r}:D${r}`)
    ws.getCell(r, 3).value = k
    ws.getCell(r, 5).value = { formula: f }
    if (fmt) ws.getCell(r, 5).numFmt = fmt
    ws.getCell(r, 3).font = { bold: i === 2 }; tinh(ws.getCell(r, 5)); ws.getCell(r, 5).font = { bold: i === 2 }
  })
  // Sửa lại: tham chiếu của các công thức trên dùng cột B làm giá trị; chuyển giá trị sang cột E nên cập nhật tham chiếu.
  const E = (i) => `E${t0 + i}`
  const fix = [
    `SUM(L${dong1}:L${dong1 + 5})`, `MIN(30,MAX(0,IF(ISNUMBER(D6),D6,0)))`, `ROUND(${E(0)}+${E(1)},2)`,
    `IF(${E(2)}>=90,"Hoàn thành xuất sắc nhiệm vụ",IF(${E(2)}>=70,"Hoàn thành tốt nhiệm vụ",IF(${E(2)}>=50,"Hoàn thành nhiệm vụ","Không hoàn thành nhiệm vụ")))`,
  ]
  fix.forEach((f, i) => { ws.getCell(t0 + i, 5).value = { formula: f } })

  const x = t0 + dongTH.length
  const dDat = `IF($D$5="Có",ROUND(IF(ISNUMBER($D$7),$D$7,0),9)=1,1=1)`
  const a = `ROUND(IF(ISNUMBER(${E(4)}),${E(4)},0),9)`, b = `ROUND(IF(ISNUMBER(${E(5)}),${E(5)},0),9)`, c = `ROUND(IF(ISNUMBER(${E(6)}),${E(6)},0),9)`
  const rankDiem = `IF(${E(2)}>=90,3,IF(${E(2)}>=70,2,IF(${E(2)}>=50,1,0)))`
  const mucKpi = `IF(AND(${a}=1,${b}=1,${c}=1,${dDat}),IF(${E(7)}>=0.3-0.000000001,3,2),IF(AND(${a}=1,${b}=1,${dDat},${c}>=0.8-0.000000001),1,-1))`
  ws.mergeCells(`C${x}:D${x}`); ws.getCell(x, 3).value = 'Mức tối đa theo điều kiện KPI (Công văn 5653)'
  ws.getCell(x, 5).value = { formula: `IF(SUM(${SL})=0,"",CHOOSE(${mucKpi}+2,"Cần xem xét (không đủ điều kiện)","Hoàn thành nhiệm vụ","Hoàn thành tốt nhiệm vụ","Hoàn thành xuất sắc nhiệm vụ"))` }
  ws.mergeCells(`C${x + 1}:D${x + 1}`); ws.getCell(x + 1, 3).value = 'ĐỀ XUẤT XẾP LOẠI (đã áp điều kiện KPI)'
  ws.getCell(x + 1, 3).font = { bold: true }
  ws.getCell(x + 1, 5).value = { formula: `IF(SUM(${SL})=0,"Chưa có nhiệm vụ trong quý",IF(${rankDiem}=0,"Không hoàn thành nhiệm vụ",IF(${mucKpi}<0,"Cần xem xét (ngoài các mức văn bản quy định)",CHOOSE(MIN(${rankDiem},${mucKpi})+1,"Không hoàn thành nhiệm vụ","Hoàn thành nhiệm vụ","Hoàn thành tốt nhiệm vụ","Hoàn thành xuất sắc nhiệm vụ"))))` }
  ws.getCell(x + 1, 5).font = { bold: true, color: { argb: 'FFC00000' } }
  ws.mergeCells(`C${x + 2}:D${x + 2}`); ws.getCell(x + 2, 3).value = 'Cảnh báo nhập liệu'
  ws.getCell(x + 2, 5).value = { formula: `IF(SUM(${rg(COT.chua)})>0,"Còn "&SUM(${rg(COT.chua)})&" nhiệm vụ chưa nhập kết quả. ","")&IF(AND($D$5="Có",$D$7=""),"Chưa nhập chỉ số D. ","")&IF($D$6="","Chưa nhập điểm tiêu chí chung. ","")&IF(SUM(${SL})=0,"Chưa chọn nhiệm vụ nào của quý. ","")` }
  for (let i = 0; i < 3; i++) { ws.getCell(x + i, 3).alignment = { wrapText: true }; tinh(ws.getCell(x + i, 5)) }
  ws.mergeCells(`E${x}:J${x}`); ws.mergeCells(`E${x + 1}:J${x + 1}`); ws.mergeCells(`E${x + 2}:J${x + 2}`)
  for (let r = t0; r < t0 + dongTH.length; r++) ws.mergeCells(`E${r}:F${r}`)
  ws.getRow(x + 2).height = 30

  // ---- Tự đánh giá (mẫu tạm) ----
  const tdg = x + 4
  ws.mergeCells(`A${tdg}:N${tdg}`); ws.getCell(`A${tdg}`).value = 'TỰ NHẬN XÉT, ĐÁNH GIÁ (nội dung cho Phụ lục 3a công chức / 3b viên chức – mẫu chính thức chưa được cung cấp, thay bằng mẫu của Sở Nội vụ khi có)'
  ws.getCell(`A${tdg}`).font = { bold: true }
  ;['Ưu điểm, kết quả nổi bật (kèm giải trình thành tích xuất sắc, nhiệm vụ vượt mức, đột xuất, đổi mới sáng tạo nếu đề xuất xuất sắc)', 'Hạn chế, khuyết điểm, nhiệm vụ chậm tiến độ / chưa đạt (nêu nguyên nhân)', 'Mức xếp loại cá nhân tự đề xuất'].forEach((k, i) => {
    const r = tdg + 1 + i
    ws.mergeCells(`A${r}:C${r}`); ws.getCell(r, 1).value = k; ws.getCell(r, 1).alignment = { wrapText: true, vertical: 'top' }
    ws.mergeCells(`D${r}:N${r}`); nhap(ws.getCell(r, 4))
    ws.getRow(r).height = i < 2 ? 54 : 22
  })
  ws.getCell(tdg + 3, 4).value = { formula: `E${x + 1}` }

  // ---- Danh mục sản phẩm / công việc ----
  const hn = HANG_NV0
  ws.mergeCells(`A${hn - 1}:N${hn - 1}`)
  ws.getCell(`A${hn - 1}`).value = `DANH MỤC SẢN PHẨM/CÔNG VIỆC QUÝ ${LA_MA[QUY]}/2026 (Phụ lục 1) — lấy từ Kế hoạch nhiệm vụ năm 2026. Cột "Trục" là ĐỀ XUẤT theo từ khoá, chờ cán bộ/lãnh đạo xác nhận.`
  ws.getCell(`A${hn - 1}`).font = { bold: true }
  const hd = ['STT', 'Mã', 'Mục tiêu, nhiệm vụ', 'Sản phẩm', 'Thời hạn', 'Vai trò', 'Trục', 'Hệ số', `Thuộc quý ${LA_MA[QUY]}?`, 'Hoàn thành?', 'Đúng hạn?', 'Đạt chất lượng?', 'Vượt mức?', 'Ghi chú']
  hd.forEach((t, i) => { const c = ws.getCell(hn, i + 1); c.value = t; tieuDe(c) })
  ;[['w', 'W'], ['hth', 'HT'], ['dat', 'ĐẠT'], ['dhw', 'ĐH'], ['sl', 'SL'], ['vm', 'VM'], ['chua', 'CH']].forEach(([k, t]) => { const c = ws.getCell(hn, COT[k]); c.value = t; c.font = { size: 8, color: { argb: 'FF7F7F7F' } } })
  ws.getRow(hn).height = 32
  dong.forEach((d, i) => {
    const r = r0 + i, cell = (c) => ws.getCell(r, c)
    cell(COT.stt).value = i + 1
    cell(COT.ma).value = d.nv.id
    cell(COT.ten).value = (d.nv.nhom ? `[${d.nv.nhom}] ` : '') + d.nv.ten
    cell(COT.sp).value = d.nv.sanPham
    cell(COT.han).value = d.nv.thoiHan || '(trống)'
    cell(COT.vt).value = d.vaiTro
    cell(COT.truc).value = d.truc
    cell(COT.heSo).value = 1
    cell(COT.chon).value = d.chon
    cell(COT.gc).value = [d.ghiChu, d.tuKhoa ? `Trục gợi ý theo từ khoá "${d.tuKhoa}"` : (d.truc === 1 ? 'Trục 1 mặc định' : '')].filter(Boolean).join('; ')
    for (let c = 1; c <= COT.gc; c++) duLieu(cell(c))
    for (const c of [COT.truc, COT.heSo, COT.chon, COT.ht, COT.dh, COT.cl, COT.vuot]) nhap(cell(c))
    cell(COT.truc).dataValidation = { type: 'list', allowBlank: false, formulae: ['"1,2,3,4,5,6"'] }
    cell(COT.heSo).dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', formulae: [0], showErrorMessage: true, error: 'Hệ số ≥ 0' }
    for (const c of [COT.chon, COT.ht, COT.dh, COT.cl, COT.vuot]) cell(c).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Có,Không"'] }
    const I = `$${L(COT.chon)}${r}`, J = `$${L(COT.ht)}${r}`, K = `$${L(COT.dh)}${r}`, Lc = `$${L(COT.cl)}${r}`, M = `$${L(COT.vuot)}${r}`, H = `$${L(COT.heSo)}${r}`
    cell(COT.w).value = { formula: `IF(${I}="Có",IF(ISNUMBER(${H}),${H},0),0)` }
    cell(COT.hth).value = { formula: `IF(AND(${I}="Có",${J}="Có"),IF(ISNUMBER(${H}),${H},0),0)` }
    cell(COT.dat).value = { formula: `IF(AND(${I}="Có",${J}="Có",${Lc}="Có"),IF(ISNUMBER(${H}),${H},0),0)` }
    cell(COT.dhw).value = { formula: `IF(AND(${I}="Có",${J}="Có",${K}="Có"),IF(ISNUMBER(${H}),${H},0),0)` }
    cell(COT.sl).value = { formula: `IF(AND(${I}="Có",IF(ISNUMBER(${H}),${H},0)>0),1,0)` }
    cell(COT.vm).value = { formula: `IF(AND(${I}="Có",IF(ISNUMBER(${H}),${H},0)>0,${J}="Có",${M}="Có"),1,0)` }
    cell(COT.chua).value = { formula: `IF(AND(${I}="Có",IF(ISNUMBER(${H}),${H},0)>0,OR(${J}="",AND(${J}="Có",OR(${K}="",${Lc}="")))),1,0)` }
    for (let c = COT.w; c <= COT.chua; c++) cell(c).font = { size: 8, color: { argb: 'FF7F7F7F' } }
  })
  ws.getRow(h - 1).height = 18
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }
  ws.properties.defaultRowHeight = 15
  return { ws, sheet: ws.name, dong: { diem: `E${t0 + 2}`, muc: `E${x + 1}`, soNv: `SUMIFS(${SL},${TR},">0")`, canhBao: `E${x + 2}` } }
}

function sheetHuongDan(wb, ma) {
  const ws = wb.addWorksheet('00 Hướng dẫn')
  ws.columns = [{ width: 130 }]
  const dong = [
    [`HỒ SƠ ĐÁNH GIÁ, XẾP LOẠI QUÝ ${LA_MA[QUY]}/2026 — ${TEN_PHONG[ma].toUpperCase()}`, true],
    ['Công cụ hỗ trợ lập hồ sơ: (1) Danh mục sản phẩm/công việc (Phụ lục 1); (2) Bảng tính điểm KPI (Phụ lục 2); (3) Nội dung tự đánh giá, đề xuất xếp loại. KHÔNG thay thế mẫu chính thức; kết quả là ĐỀ XUẤT để cán bộ, lãnh đạo phòng xem xét.', false],
    ['', false],
    ['CÁCH DÙNG', true],
    ['1. Mở sheet của mình. Điền: Giữ chức vụ lãnh đạo? (Có/Không), Điểm tiêu chí chung (0–30), và chỉ số D nếu là lãnh đạo.', false],
    [`2. Bảng nhiệm vụ lấy từ Kế hoạch nhiệm vụ năm 2026 của Sở. Cột "Thuộc quý ${LA_MA[QUY]}?": nhiệm vụ có hạn đúng quý đặt sẵn "Có", hạn ở quý khác đặt "Không", nhiệm vụ thường xuyên/cả năm đặt sẵn "Có" — BỎ CHỌN (đổi "Không") những nhiệm vụ không phát sinh trong quý.`, false],
    ['3. Với mỗi nhiệm vụ "Có": chọn Hoàn thành? / Đúng hạn? / Đạt chất lượng? / Vượt mức? Chưa chọn → coi là chưa đạt và hiện cảnh báo. "Đạt chất lượng" chỉ tính trên nhiệm vụ đã hoàn thành.', false],
    ['4. Cột "Trục" (1–6) là gợi ý theo từ khoá, vì Kế hoạch không ghi trục cho từng nhiệm vụ. Xác nhận/sửa theo Hướng dẫn 02-HD/TU. Trục không có nhiệm vụ → ghi "Không có nhiệm vụ", điểm chuyển về Trục 1.', false],
    ['5. Cột "Hệ số": mặc định 1 (hệ số quy đổi theo Hướng dẫn 05/HD-BTCTU chưa được cung cấp). Sửa nếu Sở có quy định hệ số.', false],
    ['6. Sheet TongHop gom kết quả cả phòng; kiểm tra mỗi tập thể lãnh đạo chỉ có tối đa 01 người xuất sắc.', false],
    ['', false],
    ['CÔNG THỨC (theo Công văn 9409/SXD-VP)', true],
    ['• Tổng điểm = điểm tiêu chí chung (≤30) + điểm kết quả (≤70). Điểm kết quả = Σ (Điểm KPI từng trục × điểm tối đa của trục). Điểm tối đa 6 trục: 35 / 10 / 7 / 8 / 5 / 5.', false],
    ['• Điểm KPI trục = (A+B+C+D)/4. A số lượng, B chất lượng, C tiến độ, D năng lực lãnh đạo, chỉ đạo, điều hành.', false],
    ['• Xếp loại theo tổng điểm: ≥90 xuất sắc; 70 đến <90 tốt; 50 đến <70 hoàn thành; <50 không hoàn thành. Có thêm điều kiện KPI (Công văn 5653): xuất sắc = hoàn thành 100% NV và ≥30% NV vượt mức; tốt = KPI 100%; hoàn thành = A, B, D đạt 100% và C từ 80% đến <100%.', false],
    ['', false],
    ['GIẢ ĐỊNH CỦA CÔNG CỤ — văn bản chưa quy định, cần Văn phòng Sở/Sở Nội vụ xác nhận', true],
    ['G1. KPI mỗi trục bị chặn tối đa 100%; vượt mức chỉ ghi nhận bằng tỷ lệ NV vượt mức.', false],
    ['G2. A = trọng số NV hoàn thành / trọng số NV giao; B = trọng số NV đạt chất lượng / trọng số NV hoàn thành; C = trọng số NV hoàn thành đúng hạn / trọng số NV giao.', false],
    ['G3. Người không giữ chức vụ lãnh đạo, quản lý: không có chỉ số D → KPI = (A+B+C)/3.', false],
    ['G4. Điều kiện KPI áp trên chỉ số tổng hợp mọi nhiệm vụ (không áp riêng từng trục).', false],
    ['G5. Tổng điểm làm tròn 2 chữ số trước khi so ngưỡng.', false],
    ['G6. Không đạt điều kiện nào trong ba mức nhưng chưa đủ căn cứ "không hoàn thành" → hiển thị "Cần xem xét" (văn bản có khoảng trống).', false],
    ['G7. Trục 1 không có nhiệm vụ → điểm các trục trống chuyển về trục có điểm tối đa lớn nhất trong các trục có nhiệm vụ.', false],
    ['', false],
    [`Hạn nộp hồ sơ quý ${LA_MA[QUY]}: trước ngày 29/10/2026, gửi Văn phòng Sở. Dữ liệu nhiệm vụ được trích tự động từ Phụ lục KPI (PDF) — đối chiếu bản gốc; tên người bị lỗi chính tả trong bản gốc đã được chuẩn hoá.`, false],
  ]
  dong.forEach(([t, b], i) => { const c = ws.getCell(i + 1, 1); c.value = t; c.alignment = { wrapText: true, vertical: 'top' }; if (b) c.font = { bold: true, size: i === 0 ? 14 : 11 } })
}

async function lapPhong(ma) {
  const nvPhong = du_lieu.nhiemVu.filter((n) => n.phong === ma)
  const ten_nguoi = [...new Set(nvPhong.flatMap((n) => n.nguoi.map((p) => p.ten)))]
  const chucVu = ganChucVu(nvPhong)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Công cụ KPI quý – Sở Xây dựng Quảng Trị'
  sheetHuongDan(wb, ma)
  const wsTH = wb.addWorksheet('01 TongHop')
  const kq = []
  ten_nguoi.forEach((ten, i) => {
    const dong = nvPhong.filter((n) => n.nguoi.some((p) => p.ten === ten)).map((n) => dongNhiemVu(n, ten))
    kq.push({ ten, chucVu: chucVu.get(ten) ?? null, ...sheetCanBo(wb, i + 2, ma, ten, chucVu.get(ten) ?? null, dong), soNvKeHoach: dong.length })
  })
  // Tổng hợp
  wsTH.columns = [{ width: 5 }, { width: 28 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 38 }, { width: 50 }]
  wsTH.mergeCells('A1:G1'); wsTH.getCell('A1').value = `TỔNG HỢP ĐỀ XUẤT XẾP LOẠI QUÝ ${LA_MA[QUY]}/2026 — ${TEN_PHONG[ma].toUpperCase()}`
  wsTH.getCell('A1').font = { bold: true, size: 14 }
  ;['STT', 'Họ và tên', 'Lãnh đạo?', 'NV kế hoạch', 'Tổng điểm', 'Đề xuất xếp loại', 'Cảnh báo'].forEach((t, i) => tieuDe(Object.assign(wsTH.getCell(3, i + 1), { value: t })))
  kq.forEach((k, i) => {
    const r = 4 + i
    wsTH.getCell(r, 1).value = i + 1
    wsTH.getCell(r, 2).value = { text: k.ten, hyperlink: `#'${k.sheet}'!A1` }
    wsTH.getCell(r, 3).value = { formula: `'${k.sheet}'!D5` }
    wsTH.getCell(r, 4).value = k.soNvKeHoach
    wsTH.getCell(r, 5).value = { formula: `'${k.sheet}'!${k.dong.diem}` }
    wsTH.getCell(r, 6).value = { formula: `IF('${k.sheet}'!${k.dong.canhBao}="",'${k.sheet}'!${k.dong.muc},"(Tạm tính, chưa nhập đủ) "&'${k.sheet}'!${k.dong.muc})` }
    wsTH.getCell(r, 7).value = { formula: `'${k.sheet}'!${k.dong.canhBao}` }
    wsTH.getCell(r, 5).numFmt = '0.00'
    for (let c = 1; c <= 7; c++) { duLieu(wsTH.getCell(r, c)) }
  })
  const rc = 4 + kq.length + 1
  wsTH.mergeCells(`A${rc}:G${rc}`)
  wsTH.getCell(rc, 1).value = { formula: `IF(COUNTIFS(C4:C${3 + kq.length},"Có",F4:F${3 + kq.length},"Hoàn thành xuất sắc nhiệm vụ")>1,"CẢNH BÁO: tập thể lãnh đạo có "&COUNTIFS(C4:C${3 + kq.length},"Có",F4:F${3 + kq.length},"Hoàn thành xuất sắc nhiệm vụ")&" người đề xuất xuất sắc — tối đa 01 người/tập thể (Công văn 9409). Lãnh đạo phòng chọn 01 người, các người còn lại hạ mức tốt.","Số người lãnh đạo đề xuất xuất sắc: "&COUNTIFS(C4:C${3 + kq.length},"Có",F4:F${3 + kq.length},"Hoàn thành xuất sắc nhiệm vụ")&" (tối đa 01).")` }
  wsTH.getCell(rc, 1).font = { bold: true }
  wsTH.getCell(rc + 1, 1).value = 'Ghi chú: cột "Lãnh đạo?" lấy theo lựa chọn của từng cán bộ; Công văn 9409 áp dụng giới hạn 01 xuất sắc cho tập thể lãnh đạo phòng/đơn vị.'
  wsTH.getCell(rc + 1, 1).font = { italic: true, size: 9 }
  const buffer = await wb.xlsx.writeBuffer()
  const { writeFileSync } = await import('node:fs')
  const file = join(RA, `KPI-Q${QUY}-2026-${ma}.xlsx`)
  writeFileSync(file, Buffer.from(buffer))
  return { ma, file, soCanBo: kq.length, soDong: kq.reduce((s, k) => s + k.soNvKeHoach, 0) }
}

mkdirSync(RA, { recursive: true })
const dsPhong = Object.keys(TEN_PHONG).filter((m) => !CHI_PHONG || m === CHI_PHONG)
for (const ma of dsPhong) {
  const r = await lapPhong(ma)
  console.log(`${ma.padEnd(9)} ${String(r.soCanBo).padStart(2)} cán bộ, ${String(r.soDong).padStart(3)} dòng nhiệm vụ → ${r.file}`)
}
