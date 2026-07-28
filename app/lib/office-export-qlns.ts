import 'server-only'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'

// Xuất "DANH SÁCH QUẢN LÝ NHÂN SỰ" theo đúng biểu mẫu QLNS - SXD QUANG TRI:
// 53 cột A..BA, dòng tiêu mục La Mã theo đơn vị, công thức SUBTOTAL/DATE/DATEDIF như file gốc.

const HEADERS: [string, string][] = [
  // [cột, tiêu đề]
  ['A', 'TT \ntổng cộng'], ['B', 'TT'], ['C', 'Họ và tên'], ['D', 'Phòng'], ['E', 'Chức vụ'],
  ['F', 'Số điện thoại'], ['G', 'Quê quán\n(Trước hợp nhất)'], ['H', 'Quê quán\n(Sau hợp nhất)'],
  ['I', 'Nơi ở\n(Trước hợp nhất)'], ['J', 'Nơi ở\n(Hiện nay)'], ['K', 'QT (cũ) ra'],
  ['L', 'Ngày sinh\n(Nam)'], ['M', 'Ngày sinh\n(Nữ)'], ['N', 'Loại hình\nBC, HĐ'], ['O', 'Ngày vào BC, HĐ'],
  ['P', 'Ngày bổ nhiệm lần đầu vào chức vụ hiện tại hoặc cao hơn '], ['Q', 'Ngày\nBổ nhiệm\ngần nhất'],
  ['R', 'Ngày\nBổ nhiệm\ntiếp theo'], ['S', 'Ngày\nVề hưu'], ['T', 'Mã ngạch'], ['U', 'Bậc lương'],
  ['V', 'Hệ số lương'], ['W', 'Phụ cấp chức vụ'], ['X', 'Vượt khung'], ['Y', 'Ngày\nhưởng lương'],
  ['Z', 'Tính nâng lương lần sau'], ['AA', 'Ngày lên lương'], ['AB', 'Ngạch hiện hưởng'],
  ['AC', 'Ngày bổ nhiệm vào ngạch hiện tại và TĐ'], ['AD', 'Thời gian giữ ngạch'],
  ['AE', 'Trình độ chuyên môn'], ['AF', 'Ngành/ Chuyên ngành'], ['AG', 'Năm học chuyên môn'],
  ['AH', 'Hệ đào tạo chuyên môn'], ['AI', 'Trình độ QLNN'], ['AJ', 'Năm đào tạo QLNN'],
  ['AK', 'Trình độ LLCT'], ['AL', 'Năm đào tạo LLCT'], ['AM', 'Trình độ ngoại ngữ'], ['AN', 'Năm đào tạo NN '],
  ['AO', 'Trình độ tin học'], ['AP', 'Năm đào tạo tin học'], ['AQ', 'Năm đào tạo Cấp phòng'],
  ['AR', 'Năm đào tạo Cấp\nSở'], ['AS', 'QP-AN '], ['AT', 'Năm đào tạo QP-AN'], ['AU', 'Số thẻ Đảng viên'],
  ['AV', 'Ngày\nkết nạp Đảng'], ['AW', 'Ngày\nchính thức vào Đảng'], ['AX', 'Tuổi đời'], ['AY', 'Tuổi Đảng'],
  ['AZ', 'Chi bộ'], ['BA', 'Số căn cước công dân'],
]

const DATE_COLS = ['L', 'M', 'O', 'Q', 'R', 'S', 'Y', 'Z', 'AA', 'AC', 'AV', 'AW']
const TEXT_COLS = ['F', 'T', 'AU', 'BA', 'AJ', 'AL', 'AN', 'AP', 'AQ', 'AR', 'AT']
const WIDTHS: Record<string, number> = {
  A: 6, B: 5, C: 22, D: 18, E: 16, F: 13, G: 28, H: 26, I: 26, J: 28, K: 7,
  L: 11, M: 11, N: 9, O: 12, P: 18, Q: 11, R: 11, S: 11, T: 9, U: 7, V: 8, W: 8, X: 8,
  Y: 11, Z: 11, AA: 11, AB: 9, AC: 12, AD: 15, AE: 30, AF: 26, AG: 10, AH: 12,
  AI: 9, AJ: 9, AK: 9, AL: 9, AM: 16, AN: 9, AO: 9, AP: 9, AQ: 9, AR: 9, AS: 8, AT: 9,
  AU: 12, AV: 11, AW: 11, AX: 7, AY: 20, AZ: 22, BA: 16,
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV',
  'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV']

const THIN = { style: 'thin' as const, color: { argb: 'FF808080' } }
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN }

function setBorders(row: ExcelJS.Row) {
  for (let c = 1; c <= HEADERS.length; c++) row.getCell(c).border = BORDER
}

export async function buildQlnsWorkbook(donViId?: string): Promise<ExcelJS.Workbook> {
  const toChucs = await db.toChuc.findMany({
    where: { thuTu: { gte: 1 }, isActive: true, ...(donViId ? { id: donViId } : {}) },
    orderBy: { thuTu: 'asc' },
    select: { id: true, ten: true, thuTu: true },
  })
  const canBos = await db.canBo.findMany({
    where: { toChucId: { in: toChucs.map((t) => t.id) }, trangThai: { not: 'NGHI_VIEC' } },
    include: { chucDanh: { select: { capQuanLy: true } } },
    orderBy: { hoTen: 'asc' },
  })
  const byToChuc = new Map<string, typeof canBos>()
  for (const cb of canBos) {
    const arr = byToChuc.get(cb.toChucId as string) ?? []
    arr.push(cb)
    byToChuc.set(cb.toChucId as string, arr)
  }
  for (const arr of byToChuc.values()) {
    arr.sort((a, b) =>
      (a.chucDanh?.capQuanLy ?? 99) - (b.chucDanh?.capQuanLy ?? 99) ||
      (b.heSoLuong ?? 0) - (a.heSoLuong ?? 0) ||
      a.hoTen.localeCompare(b.hoTen, 'vi'))
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'QL Hạ tầng kỹ thuật — Sở Xây dựng Quảng Trị'
  const ws = wb.addWorksheet('DS SXD', { views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }] })
  ws.columns = HEADERS.map(([col]) => ({ width: WIDTHS[col] ?? 12 }))

  // ── Dòng 1: tiêu đề cột ──
  const h1 = ws.getRow(1)
  HEADERS.forEach(([, title], i) => { h1.getCell(i + 1).value = title })
  h1.font = { bold: true, size: 9 }
  h1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  h1.height = 52
  setBorders(h1)
  h1.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } } })

  // ── Dòng 2: số thứ tự cột (K không đánh số — như file mẫu) ──
  const h2 = ws.getRow(2)
  let num = 0
  HEADERS.forEach(([col], i) => {
    if (col === 'K') return
    num++
    h2.getCell(i + 1).value = num
  })
  h2.font = { bold: true, size: 8 }
  h2.alignment = { vertical: 'middle', horizontal: 'center' }
  setBorders(h2)

  // Định dạng số/ngày/text theo cột
  for (const col of DATE_COLS) ws.getColumn(col).numFmt = 'd/mm/yyyy'
  for (const col of TEXT_COLS) ws.getColumn(col).numFmt = '@'
  ws.getColumn('U').numFmt = '0'
  ws.getColumn('V').numFmt = '0.00'
  ws.getColumn('W').numFmt = '0.00'
  ws.getColumn('X').numFmt = '0.00'
  // Hai dòng tiêu đề không thừa hưởng định dạng ngày/số của cột
  for (let c = 1; c <= HEADERS.length; c++) {
    h1.getCell(c).numFmt = 'General'
    h2.getCell(c).numFmt = 'General'
  }

  // ── Dữ liệu theo đơn vị ──
  let r = 2
  let sectionIdx = 0
  for (const tc of toChucs) {
    const people = byToChuc.get(tc.id) ?? []
    if (people.length === 0 && donViId === undefined) {
      // vẫn in tiêu mục để giữ đúng cấu trúc biểu
    }
    r++
    sectionIdx++
    const sRow = ws.getRow(r)
    sRow.getCell('B').value = ROMAN[sectionIdx - 1] ?? String(sectionIdx)
    sRow.getCell('C').value = tc.ten
    sRow.font = { bold: true, size: 10 }
    sRow.alignment = { vertical: 'middle', wrapText: true }
    setBorders(sRow)

    for (const cb of people) {
      r++
      const row = ws.getRow(r)
      const d = (v: Date | null) => v ?? undefined
      // Công thức như file mẫu
      row.getCell('A').value = { formula: `SUBTOTAL(3,$D$4:D${r})` }
      row.getCell('B').value = { formula: `SUBTOTAL(3,E$4:$E${r})` }
      row.getCell('C').value = cb.hoTen
      row.getCell('D').value = tc.ten
      row.getCell('E').value = cb.chucVu ?? ''
      row.getCell('F').value = cb.soDienThoai ?? ''
      row.getCell('G').value = cb.queQuanTruoc ?? ''
      row.getCell('H').value = cb.queQuanSau ?? ''
      row.getCell('I').value = cb.noiOTruoc ?? ''
      row.getCell('J').value = cb.noiOHienNay ?? ''
      row.getCell('K').value = cb.quangTriCuRa ?? ''
      if (cb.gioiTinh === 'NU') row.getCell('M').value = d(cb.ngaySinh)
      else row.getCell('L').value = d(cb.ngaySinh)
      row.getCell('N').value = cb.loaiHinh ?? ''
      row.getCell('O').value = d(cb.ngayVaoBienChe)
      row.getCell('P').value = cb.boNhiemLanDau ?? ''
      row.getCell('Q').value = d(cb.ngayBoNhiemGanNhat)
      if (cb.ngayBoNhiemGanNhat) {
        row.getCell('R').value = { formula: `DATE(YEAR(Q${r}) + 5, MONTH(Q${r}), DAY(Q${r}))` }
      }
      // Cột S: công thức nghỉ hưu theo lộ trình NĐ 135/2020 — nam (L) trần 62, nữ (M) trần 60;
      // ngày về hưu = ngày 01 tháng liền kề sau tháng đủ tuổi. Kèm giá trị tính sẵn để xem ngay.
      if (cb.ngaySinh) {
        row.getCell('S').value = {
          formula:
            `IF(L${r}<>"",EDATE(DATE(YEAR(L${r}),MONTH(L${r}),1),` +
            `IF((YEAR(L${r})-1961)*12+MONTH(L${r})-1<0,721,724+3*MIN(INT(((YEAR(L${r})-1961)*12+MONTH(L${r})-1)/9),7))),` +
            `IF(M${r}<>"",EDATE(DATE(YEAR(M${r}),MONTH(M${r}),1),` +
            `IF((YEAR(M${r})-1966)*12+MONTH(M${r})-1<0,661,665+4*MIN(INT(((YEAR(M${r})-1966)*12+MONTH(M${r})-1)/8),14))),""))`,
          result: cb.ngayVeHuu ?? undefined,
        }
      }
      row.getCell('T').value = cb.maNgach ?? ''
      row.getCell('U').value = cb.bacLuong ?? undefined
      row.getCell('V').value = cb.heSoLuong ?? undefined
      row.getCell('W').value = cb.phuCap ?? undefined
      row.getCell('X').value = cb.vuotKhung ?? undefined
      row.getCell('Y').value = d(cb.ngayNangLuong)
      if (cb.ngayNangLuong) {
        row.getCell('Z').value = { formula: `Y${r}` }
        row.getCell('AA').value = { formula: `DATE(YEAR(Z${r}) + 3, MONTH(Z${r}), DAY(Z${r}))` }
      }
      row.getCell('AB').value = cb.ngachHienHuong ?? ''
      row.getCell('AC').value = d(cb.ngayBoNhiemNgach)
      if (cb.ngayBoNhiemNgach) {
        row.getCell('AD').value = { formula: `DATEDIF(AC${r},TODAY(),"y")&" năm "&DATEDIF(AC${r},TODAY(),"ym")&" tháng"` }
      }
      row.getCell('AE').value = cb.trinhDoChuyenMon ?? ''
      row.getCell('AF').value = cb.chuyenNganh ?? ''
      row.getCell('AG').value = cb.namTotNghiep ?? ''
      row.getCell('AH').value = cb.heDaoTao ?? ''
      row.getCell('AI').value = cb.trinhDoQLNN ?? ''
      row.getCell('AJ').value = cb.namDaoTaoQLNN ?? ''
      row.getCell('AK').value = cb.trinhDoLLCT ?? ''
      row.getCell('AL').value = cb.namDaoTaoLLCT ?? ''
      row.getCell('AM').value = cb.trinhDoNgoaiNgu ?? ''
      row.getCell('AN').value = cb.namDaoTaoNgoaiNgu ?? ''
      row.getCell('AO').value = cb.trinhDoTinHoc ?? ''
      row.getCell('AP').value = cb.namDaoTaoTinHoc ?? ''
      row.getCell('AQ').value = cb.namDaoTaoCapPhong ?? ''
      row.getCell('AR').value = cb.namDaoTaoCapSo ?? ''
      row.getCell('AS').value = cb.qpAn ?? ''
      row.getCell('AT').value = cb.namDaoTaoQPAN ?? ''
      row.getCell('AU').value = cb.soTheDang ?? ''
      row.getCell('AV').value = d(cb.ngayKetNapDang)
      row.getCell('AW').value = d(cb.ngayVaoDangChinhThuc)
      const sinhCol = cb.gioiTinh === 'NU' ? 'M' : 'L'
      if (cb.ngaySinh) row.getCell('AX').value = { formula: `YEAR(NOW())-YEAR(${sinhCol}${r})` }
      if (cb.ngayKetNapDang) {
        row.getCell('AY').value = { formula: `DATEDIF(AV${r},TODAY(),"y")&" năm "&DATEDIF(AV${r},TODAY(),"ym")&" tháng "&DATEDIF(AV${r},TODAY(),"md")&" ngày"` }
      }
      row.getCell('AZ').value = cb.chiBo ?? ''
      row.getCell('BA').value = cb.cccd.startsWith('TAM-') ? '' : cb.cccd
      row.font = { size: 9 }
      row.alignment = { vertical: 'middle', wrapText: true }
      setBorders(row)
    }
  }

  // ── Dòng kết ──
  r++
  const endRow = ws.getRow(r)
  endRow.getCell('C').value = 'Hết'
  endRow.font = { bold: true, italic: true, size: 10 }
  setBorders(endRow)

  return wb
}
